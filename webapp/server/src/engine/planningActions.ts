import { RANK_NUM, UPGRADE_SLOT_CAP, type Location } from "./constants.js";
import type { CommandCard, GearCard, UnitCard } from "./data.js";
import { toInt } from "./data.js";
import { eventSeverity } from "./events.js";
import { refillShopGear, refillShopUnit } from "./shop.js";
import {
  GEAR_COST_KEYS,
  UNIT_COST_KEYS,
  canAfford,
  canUseEffect,
  makeUnitInstance,
  pay,
  scoutValue,
} from "./state.js";
import { tacticianBypassesRankCheck, tacticianDiscountedCost } from "./tactician.js";
import type { GamePlayer, GameState } from "./types.js";

/** Single source of truth for the buy/equip/build/activate mutations used during a round's
 * Planning stage -- shared by BotDecisionProvider (Stage 2-4's heuristics, now just a caller of
 * these) and the new interactive human Planning window (humanDecisions.ts), so neither path can
 * silently drift from the other's rules. Extracted unchanged from the bodies of game.ts's old
 * runPurchasing/resolveHand/resolveNonCommanderHands -- no behavior change, just decomposition. */

export function affordableUnits(game: GameState, p: GamePlayer): UnitCard[] {
  return game.shopUnits.filter(
    (u) =>
      (RANK_NUM[u.Rank] <= p.rank || tacticianBypassesRankCheck(p, u)) &&
      canAfford(p.res, tacticianDiscountedCost(p, u, "unit"), UNIT_COST_KEYS)
  );
}

export function affordableGear(game: GameState, p: GamePlayer): GearCard[] {
  return game.shopGear.filter(
    (g) => RANK_NUM[(g as any)["Rank Name"]] <= p.rank && canAfford(p.res, tacticianDiscountedCost(p, g as any, "gear"), GEAR_COST_KEYS)
  );
}

/** Pays for and takes delivery of a shop unit -- to the team scout pool if it's a Scout-type
 * upgrade over the pool's current best, else to the buyer's own active/reserve. */
export function buyUnitMutation(game: GameState, p: GamePlayer, choice: UnitCard, log: (t: string) => void) {
  pay(p.res, tacticianDiscountedCost(p, choice, "unit"), UNIT_COST_KEYS);
  game.shopUnits.splice(game.shopUnits.indexOf(choice), 1);
  refillShopUnit(game);
  const ui = makeUnitInstance(choice);
  const currentBestScoutValue = game.teamScoutPool.length ? Math.max(...game.teamScoutPool.map((u) => scoutValue(u))) : -1;
  if (choice.Type.includes("Scout") && scoutValue(ui) > currentBestScoutValue) {
    game.teamScoutPool.push(ui);
    log(`  ${p.name} donates ${ui.card.Name} to the team scout pool`);
  } else if (p.active === null) {
    p.active = ui;
  } else {
    p.reserve.push(ui);
  }
}

/** Equips a gear card (from the shop or from gearHand) onto the player's active unit, paying its
 * Tech cost. Returns false (and holds the card in gearHand) if there's no active unit yet or the
 * player can't afford the equip cost right now. */
const SLOT_LIMITED_TYPES = new Set(["Weapon", "Armor", "Utility"]);
/** Ammo Pouches/Extra Holster raise their own unit's Utility/Weapon slot cap from 1 to 2 --
 * the entire reason either item exists. No other Gear has a stated slot effect, so every other
 * type just uses the flat base cap (Consumable/Experimental are uncapped: they're typically
 * one-shot or rare enough not to need a limit). */
function equipSlotCap(active: GamePlayer["active"], type: string): number {
  if (!active || !SLOT_LIMITED_TYPES.has(type)) return Infinity;
  const expander = type === "Utility" ? "Ammo Pouches" : type === "Weapon" ? "Extra Holster" : null;
  const hasExpander = expander && active.equipped.some((eq) => (eq as any).Name === expander);
  return hasExpander ? 2 : 1;
}

export function equipGearOntoActiveMutation(game: GameState, p: GamePlayer, g: any, log: (t: string) => void): boolean {
  if (!p.active) {
    p.gearHand.push(g);
    return false;
  }
  const gType = g.Type as string | undefined;
  if (gType && SLOT_LIMITED_TYPES.has(gType)) {
    const sameTypeCount = p.active.equipped.filter((eq) => (eq as any).Type === gType).length;
    const cap = equipSlotCap(p.active, gType);
    if (sameTypeCount >= cap) {
      p.gearHand.push(g);
      log(`  ${p.name} has no free ${gType} slot for ${g.Name} (${sameTypeCount}/${cap} used) -- held in hand`);
      return false;
    }
  }
  // Forced Re-Armament Event: "Equipment costs doubled" this round -- scaled by progress-bracket
  // severity (0.4-1.0): early game it's only a 1.4x bump, late game the full 2x the card says.
  const cost = (RANK_NUM[g["Rank Name"]] ?? 1) * (game.equipCostDoubled ? 1 + eventSeverity(game) : 1);
  if (p.res.Tech < cost) {
    p.gearHand.push(g);
    log(`  ${p.name} can't afford ${cost} Tech to equip ${g.Name} -- held in hand`);
    return false;
  }
  p.res.Tech -= cost;
  p.active.equipped.push(g);
  const hpBonus = toInt(g.HP);
  p.active.maxHp += hpBonus;
  p.active.curHp += hpBonus;
  p.active.curShields += toInt(g.Shields);
  p.stats.gearEquipped += 1;
  if (g.Name === "Recon Satellite") p.hasReconSatellite = true;
  if (g.Name === "Last Stand Beacon") p.hasLastStandBeacon = true;
  log(
    `  ${p.name} equips ${g.Name} (Tech -${cost}) (Dmg+${toInt(g.Damage)} HP+${toInt(g.HP)} Arm+${toInt(g.Armor)} Shd+${toInt(g.Shields)})`
  );
  return true;
}

export function buyGearMutation(game: GameState, p: GamePlayer, choice: GearCard, log: (t: string) => void) {
  pay(p.res, tacticianDiscountedCost(p, choice as any, "gear"), GEAR_COST_KEYS);
  game.shopGear.splice(game.shopGear.indexOf(choice as any), 1);
  refillShopGear(game);
  equipGearOntoActiveMutation(game, p, choice, log);
}

/** Both roles share this gate: a card with a capped one-time effect (Strategic Withdrawal) that's
 * already been used this game can't be built OR activated by anyone -- skip it entirely. Only
 * non-Battlefield cards belong in the Planning-stage window; Battlefield cards resolve in their
 * own separate window during Combat, after enemy hoards exist (cardEligibleForBattlefield, see
 * game.ts's resolveBattlefieldCards). */
export function cardEligibleForPlanning(game: GameState, card: CommandCard): boolean {
  return card.Building !== "Battlefield" && canUseEffect(game, card.Name, card.Name === "Strategic Withdrawal" ? 1 : Infinity);
}

export function cardEligibleForBattlefield(game: GameState, card: CommandCard): boolean {
  return card.Building === "Battlefield" && canUseEffect(game, card.Name, card.Name === "Strategic Withdrawal" ? 1 : Infinity);
}

/** Whether the COMMANDER can build this card as a permanent Upgrade right now (slot cap + funds
 * out of the shared command pool) -- non-commanders can never build, only activate. Caller must
 * have already checked cardEligibleForPlanning. */
export function canBuildCard(game: GameState, card: CommandCard): boolean {
  const loc = card.Building as Location;
  return (
    Boolean(card["Passive Effect"]?.trim()) &&
    game.locationUpgradesBuilt[loc].length < UPGRADE_SLOT_CAP[loc] &&
    (["Organic", "Tech", "Alien"] as const).every((k) => game.commandPool[k] >= toInt((card as any)[k]))
  );
}

/** Whether a NON-commander can activate this card right now -- their own resources plus the
 * shared command pool must cover its cost. Caller must have already checked
 * cardEligibleForPlanning. */
export function canActivateAsNonCommander(game: GameState, actor: GamePlayer, card: CommandCard): boolean {
  return (["Organic", "Tech", "Alien"] as const).every((res) => actor.res[res] + game.commandPool[res] >= toInt((card as any)[res]));
}

export function buildCardMutation(game: GameState, card: CommandCard, log: (t: string) => void, onContainmentBuilt: () => void) {
  const loc = card.Building as Location;
  for (const k of ["Organic", "Tech", "Alien"] as const) game.commandPool[k] -= toInt((card as any)[k]);
  game.locationUpgradesBuilt[loc].push(card);
  if (card.Name === "Containment Protocol") onContainmentBuilt();
  log(`  [Upgrade built] ${loc}: ${card.Name}`);
}

/** A commander's own hand activates for free -- no resource cost at all, matching sim.py. */
export function commanderActivateCardMutation(
  card: CommandCard,
  commander: GamePlayer,
  log: (t: string) => void,
  dispatch: (card: CommandCard, loc: Location) => void
) {
  const loc = card.Building as Location;
  log(`  [Active Effect] ${loc}: ${commander.name} activates ${card.Name} for free (commander) -> ${card["Active Effect"]}`);
  dispatch(card, loc);
}

export function nonCommanderActivateCardMutation(
  game: GameState,
  card: CommandCard,
  actor: GamePlayer,
  log: (t: string) => void,
  dispatch: (card: CommandCard, loc: Location) => void
) {
  const loc = card.Building as Location;
  for (const res of ["Organic", "Tech", "Alien"] as const) {
    const cost = toInt((card as any)[res]);
    const fromSelf = Math.min(actor.res[res], cost);
    actor.res[res] -= fromSelf;
    game.commandPool[res] -= cost - fromSelf;
  }
  log(`  [Active Effect] ${loc}: ${actor.name} (non-commander) activates ${card.Name} -> ${card["Active Effect"]}`);
  dispatch(card, loc);
}
