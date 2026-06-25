import type { EventCard } from "./data.js";
import { RANK_ORDER } from "./constants.js";
import { weakestPlayer } from "./state.js";
import type { GamePlayer, GameState } from "./types.js";

/** Round Effect column -- ongoing for the round while this Event is active. Covers the
 * mechanically tractable subset (resource conversions); board-wide stun/equip-type restrictions
 * and location-disabling effects have no clean hook in this combat model yet, same as sim.py. */
export function applyEventRoundEffect(game: GameState, event: EventCard) {
  const name = event["Event name"];
  if (name === "Cheap Knockoffs") {
    for (const p of game.players) {
      p.res.Tech += p.res.Organic + p.res.Alien;
      p.res.Organic = 0;
      p.res.Alien = 0;
    }
  } else if (name === "Food Shortage") {
    for (const p of game.players) {
      p.res.Organic += p.res.Tech + p.res.Alien;
      p.res.Tech = 0;
      p.res.Alien = 0;
    }
  } else if (name === "Tax Fault") {
    for (const p of game.players) {
      p.res.Organic = Math.floor(p.res.Organic / 2);
      p.res.Tech = Math.floor(p.res.Tech / 2);
      p.res.Alien = Math.floor(p.res.Alien / 2);
    }
  }
}

/** Completion Reward / Failure Penalty -- covers the clearest, most mechanically tractable
 * effects; the underlying pass/fail roll stays the established flat 55% rate, same as sim.py
 * (no real Completion Condition evaluation -- that's a documented gap in the source too). */
export function applyEventResolution(game: GameState, event: EventCard, passed: boolean, commander: GamePlayer) {
  const name = event["Event name"];
  const w = weakestPlayer(game);
  if (passed) {
    const rewardText = (event["Completion Reward"] ?? "").toLowerCase();
    if (["Cheap Knockoffs", "Food Shortage"].includes(name) || rewardText.includes("all players gain")) {
      const match = /gain (\d+)/.exec(rewardText);
      const n = match ? Number(match[1]) : 1;
      const res = rewardText.includes("tech") ? "Tech" : rewardText.includes("organic") ? "Organic" : "Alien";
      for (const p of game.players) p.res[res as "Organic" | "Tech" | "Alien"] += n;
    } else if (name === "Lead by example") {
      for (const p of game.players) p.rank = Math.min(RANK_ORDER.length, p.rank + 1);
    } else if (name === "Chain of Command") {
      const promo = game.players.reduce((a, b) => (b.rank < a.rank ? b : a));
      promo.rank = Math.min(RANK_ORDER.length, promo.rank + 1);
    } else if (["Command Requisition", "Assigned Posts"].includes(name)) {
      for (let i = 0; i < 3; i++) {
        const roll = 1 + Math.floor(Math.random() * 6);
        const res = (["Organic", "Tech", "Alien"] as const)[roll % 3];
        game.commandPool[res] += roll;
      }
    }
    // 'Stockpiled Reserves': covered generically by Mission's own Resource/Instant dispatch elsewhere, same as sim.py.
  } else {
    if (name === "Lead by example") {
      for (const p of game.players) p.rank = Math.max(1, p.rank - 1);
    } else if (name === "Chain of Command") {
      const demote = game.players.reduce((a, b) => (b.rank > a.rank ? b : a));
      demote.rank = Math.max(1, demote.rank - 1);
    }
    // Tax Fault/Cheap Knockoffs/Food Shortage failure penalties: cost-increase penalties have no
    // shop-cost-modifier hook to apply against here, same documented gap as sim.py.
  }
}
