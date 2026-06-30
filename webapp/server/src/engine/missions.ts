import { toInt, type MissionCard } from "./data.js";
import { LOCATIONS, RANK_NUM, UPGRADE_SLOT_CAP, type Location } from "./constants.js";
import type { GamePlayer, GameState } from "./types.js";

/** Keyword-match the Requirement text against tracked stats/state. Falls back to True (any held
 * mission is completable) for requirement text not recognized here -- this only ever ADDS
 * gating, never removes the chance to complete a mission. Ported from sim.py's
 * mission_requirement_met and extended with additional hooks wired in the web engine. */
export function missionRequirementMet(
  game: GameState,
  m: MissionCard,
  p: GamePlayer,
  placementsThisRound: Record<number, Location[]>
): boolean {
  const req = (m.Requirement ?? "").toLowerCase();

  // Donate N of a specific resource / of each resource to Command
  if (req.includes("donate")) {
    if (req.includes("of each resource")) {
      const match = /donate (\d+) of each/.exec(req);
      const n = match ? Number(match[1]) : 5;
      return p.stats.donationsMade.Organic >= n && p.stats.donationsMade.Tech >= n && p.stats.donationsMade.Alien >= n;
    } else if (req.includes("organic")) {
      const match = /donate (\d+)/.exec(req);
      return p.stats.donationsMade.Organic >= (match ? Number(match[1]) : 5);
    } else if (req.includes("tech")) {
      const match = /donate (\d+)/.exec(req);
      return p.stats.donationsMade.Tech >= (match ? Number(match[1]) : 5);
    } else if (req.includes("alien")) {
      const match = /donate (\d+)/.exec(req);
      return p.stats.donationsMade.Alien >= (match ? Number(match[1]) : 5);
    }
    return p.stats.donationsMade.Organic + p.stats.donationsMade.Tech + p.stats.donationsMade.Alien >= 5;
  }

  // Kill N enemies (covers "Kill 1 enemy", "Kill 4 enemies without losing a friendly unit", etc.)
  if (req.startsWith("kill")) {
    const match = /kill (\d+)/.exec(req);
    return p.stats.kills >= (match ? Number(match[1]) : 1);
  }

  // Heal N damage during combat (approximated using healsGiven * 10 HP per heal action)
  if (req.includes("heal") && req.includes("damage during combat")) {
    const match = /heal (\d+)/.exec(req);
    const n = match ? Number(match[1]) : 10;
    return p.stats.healsGiven * 10 >= n;
  }

  // Equip a unit / Fully Equip
  if (req.startsWith("fully equip")) {
    const allUnits = [...(p.active ? [p.active] : []), ...p.reserve];
    if (req.includes("4 units")) return allUnits.filter((u) => u.equipped.length >= 3).length >= 4;
    if (req.includes("2 units")) return allUnits.filter((u) => u.equipped.length >= 3).length >= 2;
    return allUnits.some((u) => u.equipped.length >= 3);
  }
  if (req.includes("equip a unit") || req.startsWith("equip")) return p.stats.gearEquipped >= 1;

  // Overrun checks (per-player, or team-wide for multi-lane variants)
  if (req.includes("have all lanes overrun")) return game.players.every((q) => q.stats.overrunsSuffered >= 1);
  if (req.includes("have 2 lanes overrun")) return game.players.filter((q) => q.stats.overrunsSuffered >= 1).length >= 2;
  if (req.includes("have a lane overrun") || (req.includes("overrun") && !req.includes("lanes"))) {
    return p.stats.overrunsSuffered >= 1;
  }

  // Command pool size
  if (req.includes("command has over")) {
    const match = /over (\d+)/.exec(req);
    const threshold = match ? Number(match[1]) : 40;
    return game.commandPool.Organic + game.commandPool.Tech + game.commandPool.Alien >= threshold;
  }

  // Own unit of rank N (improves the prior "any unit" fallback to check the actual rank)
  if (req.includes("own unit of rank")) {
    const rankMatch = /rank (\d+)/.exec(req);
    const targetRank = rankMatch ? Number(rankMatch[1]) : 1;
    const allUnits = [...(p.active ? [p.active] : []), ...p.reserve];
    return allUnits.some((u) => RANK_NUM[u.card.Rank] >= targetRank);
  }

  // Fully upgrade a location
  if (req.includes("fully upgrade")) {
    for (const loc of LOCATIONS) {
      if (req.includes(loc.toLowerCase())) {
        return game.locationUpgradesBuilt[loc].length >= UPGRADE_SLOT_CAP[loc];
      }
    }
  }

  // Deploy your worker to a specific location this round
  if (req.includes("deploy your worker to")) {
    for (const loc of LOCATIONS) {
      if (req.includes(loc.toLowerCase())) {
        return (placementsThisRound[p.seatIndex] ?? []).includes(loc);
      }
    }
  }

  // Ability activations this round
  if (req.includes("activate 1 ability in each lane")) {
    return game.players.every((q) => (game.activationsThisRound.get(q.seatIndex) ?? 0) >= 1);
  }
  if (req.includes("activate") && req.includes("abilities in 1 lane")) {
    const match = /activate (\d+)/.exec(req);
    return (game.activationsThisRound.get(p.seatIndex) ?? 0) >= (match ? Number(match[1]) : 5);
  }
  if (req.includes("activate an ability")) {
    return (game.activationsThisRound.get(p.seatIndex) ?? 0) >= 1;
  }

  // Event pass/fail
  if (req.includes("complete event")) return p.stats.eventsPassed >= 1;
  if (req.includes("fail event")) return p.stats.eventsFailed >= 1;

  // Retire requirements
  if (req.includes("retire a unit")) {
    // Specific retire conditions (tracked via auto-retire and Honorable Discharge paths)
    return p.stats.unitsRetired >= 1;
  }

  // Ability prevention
  if (req.includes("prevent enemy ability")) return p.stats.abilitiesDenied >= 1;
  if (req.includes("prevent") && req.includes("abilities in 1 turn")) {
    const match = /(\d+) abilities/.exec(req);
    return p.stats.maxAbilitiesDeniedInRound >= (match ? Number(match[1]) : 4);
  }

  // Commander role
  if (req.includes("take commander role")) return p.stats.commanderRounds >= 1;
  if (req.includes("hold commander")) {
    const match = /(\d+) turns?/.exec(req);
    return p.stats.commanderRounds >= (match ? Number(match[1]) : 2);
  }

  // Progress thresholds
  if (req.includes("enemy progress over")) {
    const match = /over (\d+)/.exec(req);
    return game.enemyProgress >= (match ? Number(match[1]) : 5);
  }
  if (req.includes("be over") && req.includes("progress")) {
    const match = /over (\d+)/.exec(req);
    return game.playerProgress >= (match ? Number(match[1]) : 5);
  }

  // Enemies have activated N abilities total this game
  if (req.includes("enemies activate")) {
    const match = /activate (\d+)/.exec(req);
    return game.enemyAbilitiesActivated >= (match ? Number(match[1]) : 5);
  }

  // Fill lane with a single unit type
  if (req.includes("fill a lane with only")) {
    const type = req.includes("infantry") ? "Infantry" : req.includes("mech") ? "Mech" : "Vehicle";
    const allUnits = [...(p.active ? [p.active] : []), ...p.reserve];
    return allUnits.length >= 3 && allUnits.every((u) => (u.card.Type as string).includes(type));
  }

  // Fill Med Bay
  if (req.includes("fill medbay") || req.includes("fill med bay")) {
    return p.medBayUnits.length >= 2;
  }

  // Fill Containment Block
  if (req.includes("fill containment")) {
    return game.containmentSlotsCap > 0 && game.containedEnemyPool.length >= game.containmentSlotsCap;
  }

  // Own more of one unit type than the others combined
  if (req.includes("own more")) {
    const allUnits = [...(p.active ? [p.active] : []), ...p.reserve];
    const count = (t: string) => allUnits.filter((u) => (u.card.Type as string).includes(t)).length;
    if (req.includes("infantry than")) return count("Infantry") > count("Mech") + count("Vehicle");
    if (req.includes("mechs than")) return count("Mech") > count("Infantry") + count("Vehicle");
    if (req.includes("vehicles than")) return count("Vehicle") > count("Infantry") + count("Mech");
  }

  // All unit types represented across active lanes
  if (req.includes("have every unit type active")) {
    const types = new Set(game.players.flatMap((q) => (q.active ? [(q.active.card.Type as string)] : [])));
    return types.has("Infantry") && types.has("Mech") && types.has("Vehicle");
  }

  // Unit with more Shield than HP
  if (req.includes("unit with more shield than hp")) {
    const allUnits = [...(p.active ? [p.active] : []), ...p.reserve];
    return allUnits.some((u) => u.curShields > u.curHp);
  }

  // Win a round without losing units
  if (req.includes("win a round without losing units")) {
    return p.stats.roundsWithoutUnitLoss >= 1;
  }

  return true;
}

/** Resource field ("Gain +N All resources" / "+N Organic" etc.) plus dispatch for Instant effects.
 * Extended from sim.py's apply_mission_reward with additional stateless/low-complexity hooks. */
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

  // Each player gains N resource
  if (instant.startsWith("each player gains")) {
    const match = /gains (\d+) (\w+)/.exec(instant);
    if (match) {
      const n = Number(match[1]);
      const word = match[2];
      const res = word.startsWith("organ") ? "Organic" : word.startsWith("tech") ? "Tech" : "Alien";
      for (const q of game.players) q.res[res as "Organic" | "Tech" | "Alien"] += n;
    }
    return;
  }

  // All players promote (rank up)
  if (instant.includes("all players promote")) {
    for (const q of game.players) {
      q.rank = Math.min(8, q.rank + 1);
      q.stats.promotionsReceived += 1;
    }
    return;
  }

  // Add N resources to command pool — handles specific resource and "of each resource" variants
  if (instant.includes("add") && instant.includes("command")) {
    const eachMatch = /add (\d+) of each/.exec(instant);
    if (eachMatch) {
      const n = Number(eachMatch[1]);
      game.commandPool.Organic += n;
      game.commandPool.Tech += n;
      game.commandPool.Alien += n;
    } else {
      const match = /add (\d+) (\w+)/.exec(instant);
      if (match) {
        const n = Number(match[1]);
        const word = match[2];
        const res = word.startsWith("organ") ? "Organic" : word.startsWith("tech") ? "Tech" : "Alien";
        game.commandPool[res as "Organic" | "Tech" | "Alien"] += n;
      }
    }
    return;
  }

  // Block the next N enemy abilities (grants reveal-prevention charges)
  if (instant.startsWith("block the next")) {
    const match = /block the next (\d+)/.exec(instant);
    game.revealPreventionCharges += match ? Number(match[1]) : 1;
    return;
  }

  // Reduce Enemy Progress by N
  if (instant.startsWith("reduce enemy progress")) {
    const match = /by (\d+)/.exec(instant);
    game.enemyProgress = Math.max(0, game.enemyProgress - (match ? Number(match[1]) : 1));
    return;
  }

  // Gain a Rank (personal promotion)
  if (instant.includes("gain a rank")) {
    p.rank = Math.min(8, p.rank + 1);
    p.stats.promotionsReceived += 1;
    return;
  }

  // Gain 1 Progress (team player-progress bar)
  if (instant.includes("gain 1 progress")) {
    game.playerProgress = Math.min(10, game.playerProgress + 1);
    return;
  }

  // Heal all units across all lanes and Med Bay to full HP
  if (instant.startsWith("heal all units")) {
    for (const q of game.players) {
      if (q.active) q.active.curHp = q.active.maxHp;
      for (const u of q.reserve) u.curHp = u.maxHp;
      for (const u of q.medBayUnits) u.curHp = u.maxHp;
    }
    return;
  }

  // Target player gains N resource (approximated: completing player gains it since no mid-flow UI)
  if (instant.startsWith("target player gains")) {
    const match = /gains (\d+) (\w+)/.exec(instant);
    if (match) {
      const n = Number(match[1]);
      const word = match[2];
      const res = word.startsWith("organ") ? "Organic" : word.startsWith("tech") ? "Tech" : "Alien";
      p.res[res as "Organic" | "Tech" | "Alien"] += n;
    }
    return;
  }

  // Gain N resources, split any way you choose (approximated: distribute as evenly as possible)
  if (instant.includes("gain") && instant.includes("resources") && instant.includes("split")) {
    const match = /gain (\d+) resources/.exec(instant);
    const n = match ? Number(match[1]) : 5;
    const each = Math.floor(n / 3);
    const rem = n - 3 * each;
    p.res.Organic += each + rem;
    p.res.Tech += each;
    p.res.Alien += each;
    return;
  }

  // Refresh ability cooldowns this round (clears abilityUsesThisRound so all abilities can
  // be reused). "Refresh target/up to N" is approximated as a full clear since targeting UI
  // isn't available at mission-reward time.
  if (
    instant.startsWith("refresh") ||
    (instant.startsWith("reset") && instant.includes("cooldown"))
  ) {
    game.abilityUsesThisRound.clear();
    return;
  }

  // Draw N new command cards and add to hand (the "free to use" bonus is not tracked —
  // player gets the cards and pays normal activation cost).
  if (instant.startsWith("draw") && instant.includes("command card")) {
    const match = /draw (\d+)/.exec(instant);
    const n = match ? Number(match[1]) : 1;
    for (let i = 0; i < n && game.commandDeck.length; i++) p.hand.push(game.commandDeck.pop()!);
    return;
  }

  // Free unit/gear purchase (persistent per-round or next-purchase effects — approximated as
  // a flat resource grant at completion time, same as sim.py).
  if (
    instant.includes("free unit") ||
    instant.includes("next unit is free") ||
    instant.includes("next 2 units are free") ||
    instant.includes("free equip") ||
    instant.includes("next equip") ||
    instant.includes("next item is free") ||
    instant.includes("next gear item is free") ||
    instant.includes("rank 1 units are free") ||
    instant.includes("mech half price") ||
    instant.includes("vehicles half price") ||
    (instant.includes("rank") && instant.includes("unit is free"))
  ) {
    p.res.Organic += 5;
    p.res.Tech += 5;
    p.res.Alien += 2;
  }
}
