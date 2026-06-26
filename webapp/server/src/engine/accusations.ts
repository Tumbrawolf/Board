import { RANK_ORDER } from "./constants.js";
import type { GamePlayer, ResourcePool } from "./types.js";

/** Vote of No Confidence's escrow cost. The rules describe "escrowed resources/cards" without a
 * stated amount -- this is an assumption (a flat, moderate cost in the same range as other
 * round-number costs already in this engine, e.g. Catch-up Resupply's +3/+3/+2), not a value
 * pulled from Rules.docx. Flagging clearly since it should be checked against the real text if
 * that ever surfaces. Resources/cards only -- no card-escrow modeled (unspecified which cards). */
export const ACCUSATION_ESCROW: ResourcePool = { Organic: 5, Tech: 5, Alien: 5 };

/** Deducts what the accuser can actually afford (capped at 0, never negative) and returns the
 * amount actually taken -- an accuser with fewer resources than the full escrow still pays
 * everything they have, rather than the accusation being blocked outright. */
export function payEscrow(accuser: GamePlayer): ResourcePool {
  const paid: ResourcePool = { Organic: 0, Tech: 0, Alien: 0 };
  for (const k of ["Organic", "Tech", "Alien"] as const) {
    const amt = Math.min(accuser.res[k], ACCUSATION_ESCROW[k]);
    accuser.res[k] -= amt;
    paid[k] = amt;
  }
  return paid;
}

function refundEscrow(accuser: GamePlayer, paid: ResourcePool) {
  for (const k of ["Organic", "Tech", "Alien"] as const) accuser.res[k] += paid[k];
}

function isAntagonist(so: { Alignment: string }) {
  return so.Alignment === "Saboteur" || so.Alignment === "Chaos";
}

export interface AccusationResult {
  believed: boolean;
  wasActuallyAntagonist: boolean;
  log: string[];
}

/** Resolves one Vote of No Confidence, per the rebalanced Feedback #20 rules:
 *  - Believed + accused really is Saboteur/Chaos: accused drops to 1 Secret Objective (keeps a
 *    non-antagonist card if they had one; if both were antagonist-aligned, dealt 1 new Allied
 *    card instead, revealed). Accuser's escrow is returned and they're promoted.
 *  - Believed + accused is NOT antagonist-aligned (a false accusation the table believed anyway):
 *    accuser's escrow is lost (to the command pool) and they're demoted; they ALSO drop to 1
 *    Secret Objective card, with the wrongly-accused player choosing which of the accuser's 2
 *    cards gets discarded.
 *  - Not believed (rejected), regardless of truth: escrow is fully refunded, no rank changes, and
 *    the accused player picks one of the accuser's 2 cards to REVEAL (not discard, still theirs).
 */
export function resolveAccusation(
  accuser: GamePlayer,
  accused: GamePlayer,
  believed: boolean,
  escrowPaid: ResourcePool,
  commandPool: ResourcePool,
  newAllyCardIfNeeded: () => { Alignment: string; Name: string; "Bonus Objective": string } | null,
  pickDiscardCard: (cards: GamePlayer["secretObjectives"]) => number,
  pickRevealCard: (cards: GamePlayer["secretObjectives"]) => number
): AccusationResult {
  const log: string[] = [];
  const wasActuallyAntagonist = accused.secretObjectives.some(isAntagonist);
  accuser.stats.accusationsMade += 1;
  accused.stats.timesAccused += 1;

  if (believed && wasActuallyAntagonist) {
    accuser.stats.accusationsCorrect += 1;
    const clean = accused.secretObjectives.filter((so) => !isAntagonist(so));
    if (clean.length) {
      accused.secretObjectives = [clean[0]];
      log.push(`  [Vote of No Confidence] ${accused.name} is exposed -- keeps their one non-antagonist Secret Objective, the rest discarded.`);
    } else {
      const fresh = newAllyCardIfNeeded();
      accused.secretObjectives = fresh ? [fresh as any] : [];
      accused.revealedSecretObjective = fresh ? fresh.Name : null;
      log.push(`  [Vote of No Confidence] ${accused.name} is exposed -- both cards were antagonist-aligned, dealt 1 new Allied card, revealed: ${fresh?.Name ?? "(none left in deck)"}.`);
    }
    refundEscrow(accuser, escrowPaid);
    if (accuser.rank < RANK_ORDER.length) {
      accuser.rank += 1;
      accuser.stats.promotionsReceived += 1;
    }
    log.push(`  [Vote of No Confidence] ${accuser.name}'s accusation was correct -- escrow returned, promoted to ${RANK_ORDER[accuser.rank - 1]}.`);
  } else if (believed && !wasActuallyAntagonist) {
    for (const k of ["Organic", "Tech", "Alien"] as const) commandPool[k] += escrowPaid[k];
    if (accuser.rank > 1) accuser.rank -= 1;
    if (accuser.secretObjectives.length > 1) {
      const idx = pickDiscardCard(accuser.secretObjectives);
      const discarded = accuser.secretObjectives.splice(idx, 1)[0];
      log.push(`  [Vote of No Confidence] False accusation believed -- ${accuser.name} is demoted and ${accused.name} discards their '${discarded?.Name}' card.`);
    } else {
      log.push(`  [Vote of No Confidence] False accusation believed -- ${accuser.name} is demoted (escrow forfeit to the command pool).`);
    }
  } else {
    refundEscrow(accuser, escrowPaid);
    if (accuser.secretObjectives.length) {
      const idx = pickRevealCard(accuser.secretObjectives);
      const revealed = accuser.secretObjectives[idx];
      accuser.revealedSecretObjective = revealed?.Name ?? null;
      log.push(`  [Vote of No Confidence] Accusation against ${accused.name} rejected -- escrow refunded to ${accuser.name}, who must reveal '${revealed?.Name}'.`);
    } else {
      log.push(`  [Vote of No Confidence] Accusation against ${accused.name} rejected -- escrow refunded to ${accuser.name}.`);
    }
  }

  return { believed, wasActuallyAntagonist, log };
}
