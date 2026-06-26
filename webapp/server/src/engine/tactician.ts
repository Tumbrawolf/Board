import { RANK_NUM, type Location } from "./constants.js";
import { toInt, type CommandCard, type GearCard, type UnitCard } from "./data.js";
import type { GamePlayer } from "./types.js";

/** Returns a cost-adjusted copy of card for affordability/payment purposes -- covers the
 * clearest, most mechanically tractable Tactician Resource effects (shop cost reductions).
 * Ported 1:1 from tactician_discounted_cost for the first 9 roles; the other 9 (The Tactician,
 * Kingmaker, Jailer, Reclaimer, Pathfinder, Breaker, Bastion, Chessmaster, Quartermaster) were
 * sim.py-side no-ops too -- now given real hooks below where one exists (see
 * tacticianBypassesRankCheck, tacticianContainmentBuildDiscount, applyTacticianCombatMods,
 * applyTacticianPrecombat). The Reclaimer (needs a "Recycling" shared discard pile that doesn't
 * exist) and The Chessmaster (needs a distinct "Reassign" action separate from normal
 * reserve/active management, and gear text never actually says "mobility skills") still have no
 * clean hook -- documented no-ops, consistent with how this engine treats every other card
 * needing infrastructure that doesn't exist. Tactician ACTIVE effects (all 18 roles, not just
 * these 9) are a separate, consistent gap project-wide -- sim.py never dispatches them either,
 * and building a real trigger for them is a bigger, separate piece of work (a new once-per-round
 * decision point), not something this pass adds. */
export function tacticianDiscountedCost<T extends UnitCard | GearCard>(p: GamePlayer, card: T, kind: "unit" | "gear"): T {
  const t = p.tactician;
  if (!t) return card;
  const name = t.Name;
  const c: any = { ...card };
  const ctype = (card as any).Type ?? "";
  const rank = RANK_NUM[(card as any).Rank ?? (card as any)["Rank Name"]] ?? 0;

  if (kind === "gear") {
    if (name === "The Gunsmith" && ctype === "Weapon") c["Tech Cost"] = Math.max(0, toInt(c["Tech Cost"]) - 1);
    else if (name === "The Bulwark" && ctype === "Armor") c["Tech Cost"] = Math.max(0, toInt(c["Tech Cost"]) - 1);
    else if (name === "The Engineer" && ctype === "Utility") c["Tech Cost"] = Math.max(0, toInt(c["Tech Cost"]) - 2);
  } else if (kind === "unit") {
    if (name === "The Drillmaster" && rank < 5) c["Alien Cost"] = 0;
    else if (name === "The Specialist" && rank > 4) c["Alien Cost"] = Math.floor(toInt(c["Alien Cost"]) / 2);
    else if (name === "The Driver" && ctype.includes("Vehicle")) {
      c["Tech Cost"] = Math.floor(toInt(c["Tech Cost"]) / 2);
      c["Organic Cost"] = Math.floor(toInt(c["Organic Cost"]) / 2);
    } else if (name === "The Recruiter" && ctype.includes("Infantry")) {
      c["Organic Cost"] = Math.floor(toInt(c["Organic Cost"]) / 2);
    } else if (name === "The Pilot" && ctype.includes("Mech")) {
      c["Tech Cost"] = Math.floor(toInt(c["Tech Cost"]) / 2);
    }
  }
  // The Quartermaster: "Direct-fill slots cost 1 less of your choice" -- this engine's shop
  // refill doesn't tag which slots came from Direct vs. Roll fill, so this approximates as a
  // flat -1 Tech (the most universal resource) on every unit/gear purchase instead.
  if (name === "The Quartermaster") c["Tech Cost"] = Math.max(0, toInt(c["Tech Cost"]) - 1);
  return c as T;
}

/** The Pathfinder: "Scouts rank is not needed to recruit" -- bypasses the normal
 * RANK_NUM[card.Rank] <= player.rank eligibility check for Scout-type units specifically. */
export function tacticianBypassesRankCheck(p: GamePlayer, card: UnitCard): boolean {
  return p.tactician?.Name === "The Pathfinder" && card.Type.includes("Scout");
}

/** The Jailer: "Containment Block upgrades cost no Alien." */
export function tacticianContainmentBuildDiscount(p: GamePlayer, loc: Location, card: CommandCard): CommandCard {
  if (p.tactician?.Name !== "The Jailer" || loc !== "Containment Block") return card;
  return { ...card, Alien: "0" };
}

/** The Breaker ("Units in your lane Shred on hit = your rank") and The Bastion ("Units in your
 * lane Shred 2 when entering combat") both set the same Combatant.shredArmor field every Unit
 * combat mod already uses -- just sourced from the player's Tactician/Rank instead of a
 * per-card keyword. */
export function applyTacticianCombatMods(c: import("./combat.js").Combatant, p: GamePlayer) {
  const name = p.tactician?.Name;
  if (name === "The Breaker") c.shredArmor = Math.max(c.shredArmor, p.rank);
  else if (name === "The Bastion") c.shredArmor = Math.max(c.shredArmor, 2);
}

/** The Bastion: "...they also start with Shield = your rank" -- applied once before combat,
 * same timing as every other precombat Unit/Gear shield bonus. */
export function applyTacticianPrecombat(p: GamePlayer) {
  if (p.tactician?.Name === "The Bastion" && p.active) {
    p.active.curShields += p.rank;
  }
}
