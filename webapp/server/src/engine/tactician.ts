import { RANK_NUM } from "./constants.js";
import { toInt, type GearCard, type UnitCard } from "./data.js";
import type { GamePlayer } from "./types.js";

/** Returns a cost-adjusted copy of card for affordability/payment purposes -- covers the
 * clearest, most mechanically tractable Tactician Resource effects (shop cost reductions).
 * The remaining roles (The Tactician, Kingmaker, Jailer, Reclaimer, Pathfinder, Breaker,
 * Bastion, Chessmaster, Quartermaster) have no clean hook in this economy/combat model yet,
 * same as sim.py. Ported 1:1 from tactician_discounted_cost. */
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
  return c as T;
}
