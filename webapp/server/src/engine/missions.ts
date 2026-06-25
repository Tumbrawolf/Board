import type { MissionCard } from "./data.js";
import { LOCATIONS, UPGRADE_SLOT_CAP, type Location } from "./constants.js";
import type { GamePlayer, GameState } from "./types.js";

/** Keyword-match the Requirement text against tracked stats/state. Falls back to True (any held
 * mission is completable) for requirement text not recognized here -- this only ever ADDS
 * gating, never removes the chance to complete a mission. Ported 1:1 from sim.py's
 * mission_requirement_met. */
export function missionRequirementMet(
  game: GameState,
  m: MissionCard,
  p: GamePlayer,
  placementsThisRound: Record<number, Location[]>
): boolean {
  const req = (m.Requirement ?? "").toLowerCase();
  if (req.includes("donate")) return p.stats.donationsMade >= 5;
  if (req.includes("kill")) {
    const match = /kill (\d+)/.exec(req);
    return p.stats.kills >= (match ? Number(match[1]) : 1);
  }
  if (req.includes("heal")) return p.stats.healsGiven >= 1;
  if (req.includes("equip")) return p.stats.gearEquipped >= 1;
  if (req.includes("overrun")) return p.stats.overrunsSuffered >= 1;
  if (req.includes("command has over")) {
    const match = /over (\d+)/.exec(req);
    const threshold = match ? Number(match[1]) : 40;
    return game.commandPool.Organic + game.commandPool.Tech + game.commandPool.Alien >= threshold;
  }
  if (req.includes("own unit of rank")) {
    return Boolean(p.active) || p.reserve.length > 0; // any owned unit -- exact rank-text parsing not worth it, same as sim.py
  }
  if (req.includes("fully upgrade")) {
    for (const loc of LOCATIONS) {
      if (req.includes(loc.toLowerCase())) {
        return game.locationUpgradesBuilt[loc].length >= UPGRADE_SLOT_CAP[loc];
      }
    }
  }
  if (req.includes("deploy your worker to")) {
    for (const loc of LOCATIONS) {
      if (req.includes(loc.toLowerCase())) {
        return (placementsThisRound[p.seatIndex] ?? []).includes(loc);
      }
    }
  }
  return true;
}

/** Resource field ("Gain +N All resources" / "+N Organic" etc.) plus a small dispatch for the
 * most common, mechanically clear Instant effects. Ported 1:1 from sim.py's apply_mission_reward. */
export function applyMissionReward(game: GameState, m: MissionCard, p: GamePlayer) {
  const resText = m.Resource ?? "";
  const amtMatch = /\+(\d+)/.exec(resText);
  const amt = amtMatch ? Number(amtMatch[1]) : 1;
  const lowerRes = resText.toLowerCase();
  if (lowerRes.includes("all resources")) {
    p.res.Organic += amt;
    p.res.Tech += amt;
    p.res.Alien += amt;
  } else if (lowerRes.includes("organic")) {
    p.res.Organic += amt;
  } else if (lowerRes.includes("tech")) {
    p.res.Tech += amt;
  } else if (lowerRes.includes("alien")) {
    p.res.Alien += amt;
  }

  const instant = (m.Instant ?? "").toLowerCase();
  if (instant.includes("each player gains")) {
    const match = /gains (\d+) (\w+)/.exec(instant);
    if (match) {
      const n = Number(match[1]);
      const word = match[2];
      const res = word.startsWith("organ") ? "Organic" : word.startsWith("tech") ? "Tech" : "Alien";
      for (const q of game.players) q.res[res as "Organic" | "Tech" | "Alien"] += n;
    }
  } else if (instant.includes("add") && instant.includes("command")) {
    const match = /add (\d+)/.exec(instant);
    if (match) {
      const n = Number(match[1]);
      game.commandPool.Organic += n;
      game.commandPool.Tech += n;
      game.commandPool.Alien += n;
    }
  } else if (
    instant.includes("free unit") ||
    instant.includes("next unit is free") ||
    instant.includes("next equip") ||
    instant.includes("next item is free") ||
    instant.includes("next gear item is free")
  ) {
    p.res.Organic += 5;
    p.res.Tech += 5;
    p.res.Alien += 2; // flat approximation of a free purchase, same as sim.py
  }
}
