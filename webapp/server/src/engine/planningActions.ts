import { RANK_NUM, UPGRADE_SLOT_CAP, type Location } from "./constants.js";
import type { CommandCard, GearCard, UnitCard } from "./data.js";
import { toInt } from "./data.js";
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
import { tacticianBypassesRankCheck, tacticianDiscountedCost, tacticianRankCeiling } from "./tactician.js";
import type { GamePlayer, GameState } from "./types.js";

/** Single source of truth for the buy/equip/build/activate mutations used during a round's
 * Planning stage -- shared by BotDecisionProvider (Stage 2-4's heuristics, now just a caller of
 * these) and the new interactive human Planning window (humanDecisions.ts), so neither path can
 * silently drift from the other's rules. Extracted unchanged from the bodies of game.ts's old
 * runPurchasing/resolveHand/resolveNonCommanderHands -- no behavior change, just decomposition. */

/** Command Requisition: "players can spend command resources" -- while active, shop purchases
 * can draw their shortfall from game.commandPool on top of the player's own resources, same
 * fromSelf/remainder split nonCommanderActivateCardMutation already uses for Command Card costs.
 * No-op (falls through to the plain canAfford/pay) the rest of the time. */
function commandRequisitionActive(game: GameState): boolean {
  return game.activeEvent?.["Event name"] === "Command Requisition";
}

/** True if the card is a unit (Infantry/Mech/Vehicle), not gear. Used to gate unit-only effects. */
function isUnitCard(card: UnitCard | GearCard): boolean {
  const type = (card as any).Type ?? "";
  return type.includes("Infantry") || type.includes("Mech") || type.includes("Vehicle");
}

/** Computes the final effective cost for a single cost key, applying all active modifiers:
 * Flash Sale multiplier, Mad Science Experimental free, Mad Science gear Alien half,
 * Advanced Mechanized Mech/Vehicle Tech discount, shopCostBonus surcharge. */
function effectiveCost(game: GameState, card: UnitCard | GearCard, k: string): number {
  const base = toInt((card as any)[k]);
  if (base === 0) return 0;
  const key = k.split(" ")[0] as keyof typeof game.shopCostBonus;
  const type = (card as any).Type ?? "";
  const isGear = !isUnitCard(card);

  // Mad Science passive: Experimental gear only pays Alien
  if (isGear && game.experimentalOrganicTechFree && type === "Experimental" && (k === "Organic Cost" || k === "Tech Cost")) return 0;

  let cost = Math.ceil(base * (game.shopCostMultiplier ?? 1));

  // Ethics Committee active: all Alien costs = 0 this round
  if (game.allAlienFreeThisRound && k === "Alien Cost") return 0;

  // Ethics Committee passive: basic (non-Experimental) gear Alien costs = 0
  if (isGear && game.basicGearAlienFree && type !== "Experimental" && k === "Alien Cost") return 0;

  // Mad Science active: halve gear Alien costs
  if (isGear && game.gearAlienHalfThisRound && k === "Alien Cost") cost = Math.ceil(cost * 0.5);

  // Advanced Mechanized: flat Tech discount for Mech/Vehicle units
  const discount = k === "Tech Cost" && !isGear
    ? (type.includes("Mech") ? (game.mechTechDiscount ?? 0) : type.includes("Vehicle") ? (game.vehicleTechDiscount ?? 0) : 0)
    : 0;

  const surcharge = game.shopCostBonus?.[key] ?? 0;
  return Math.max(0, cost + surcharge - discount);
}

function drainAcross(p: GamePlayer, game: GameState, cmdReq: boolean, order: (keyof typeof p.res)[], amount: number) {
  let remaining = amount;
  for (const rk of order) {
    const fromSelf = Math.min(p.res[rk], remaining);
    p.res[rk] -= fromSelf;
    remaining -= fromSelf;
    if (remaining > 0 && cmdReq) {
      const fromPool = Math.min(game.commandPool[rk], remaining);
      game.commandPool[rk] -= fromPool;
      remaining -= fromPool;
    }
    if (remaining <= 0) break;
  }
}

function canAffordIncludingCommand(game: GameState, p: GamePlayer, card: UnitCard | GearCard, keys: readonly string[]): boolean {
  const cmdReq = commandRequisitionActive(game);
  for (const k of keys) {
    const cost = effectiveCost(game, card, k);
    if (cost === 0) continue;
    const key = k.split(" ")[0] as keyof typeof p.res;

    if (k === "Organic Cost" && isUnitCard(card)) {
      if (game.unitOrganicFree) continue;
      if (game.unitOrganicCanUseTechOrAlien) {
        const pool = cmdReq
          ? p.res.Organic + p.res.Tech + p.res.Alien + game.commandPool.Organic + game.commandPool.Tech + game.commandPool.Alien
          : p.res.Organic + p.res.Tech + p.res.Alien;
        if (pool < cost) return false;
        continue;
      }
    }

    if (k === "Tech Cost" && game.techCanUseOrganic) {
      const pool = cmdReq
        ? p.res.Tech + p.res.Organic + game.commandPool.Tech + game.commandPool.Organic
        : p.res.Tech + p.res.Organic;
      if (pool < cost) return false;
      continue;
    }

    const avail = cmdReq ? p.res[key] + game.commandPool[key] : p.res[key];
    if (avail < cost) return false;
  }
  return true;
}

function payIncludingCommand(game: GameState, p: GamePlayer, card: UnitCard | GearCard, keys: readonly string[]) {
  const cmdReq = commandRequisitionActive(game);
  for (const k of keys) {
    const cost = effectiveCost(game, card, k);
    if (cost === 0) continue;
    const key = k.split(" ")[0] as keyof typeof p.res;

    if (k === "Organic Cost" && isUnitCard(card)) {
      if (game.unitOrganicFree) continue;
      if (game.unitOrganicCanUseTechOrAlien) {
        drainAcross(p, game, cmdReq, ["Organic", "Tech", "Alien"], cost);
        continue;
      }
    }

    if (k === "Tech Cost" && game.techCanUseOrganic) {
      drainAcross(p, game, cmdReq, ["Tech", "Organic"], cost);
      continue;
    }

    if (cmdReq) {
      const fromSelf = Math.min(p.res[key], cost);
      p.res[key] -= fromSelf;
      game.commandPool[key] -= cost - fromSelf;
    } else {
      p.res[key] -= cost;
    }
  }
}

export function affordableUnits(game: GameState, p: GamePlayer): UnitCard[] {
  return game.shopUnits.filter((u) => {
    if (RANK_NUM[u.Rank] > tacticianRankCeiling(p, u) && !tacticianBypassesRankCheck(p, u)) return false;
    const uRank = RANK_NUM[u.Rank] ?? 0;
    // Mission free-unit flags
    if (p.rankOneFree && uRank === 1) return true;
    if (p.nextRankFreeUnit > 0 && uRank <= p.nextRankFreeUnit) return true;
    if (p.nextUnitFreeCount > 0) return true;
    // Half-price unit types: always affordable if player has resources > 0
    if (p.mechHalfPrice && u.Type.includes("Mech")) {
      const halved: any = { ...tacticianDiscountedCost(p, u, "unit", game) };
      for (const k of UNIT_COST_KEYS) halved[k] = Math.ceil(toInt(halved[k]) / 2);
      return canAffordIncludingCommand(game, p, halved, UNIT_COST_KEYS);
    }
    if (p.vehicleHalfPrice && u.Type.includes("Vehicle")) {
      const halved: any = { ...tacticianDiscountedCost(p, u, "unit", game) };
      for (const k of UNIT_COST_KEYS) halved[k] = Math.ceil(toInt(halved[k]) / 2);
      return canAffordIncludingCommand(game, p, halved, UNIT_COST_KEYS);
    }
    return canAffordIncludingCommand(game, p, tacticianDiscountedCost(p, u, "unit", game), UNIT_COST_KEYS);
  });
}

export function affordableGear(game: GameState, p: GamePlayer): GearCard[] {
  return game.shopGear.filter((g) => {
    if (RANK_NUM[(g as any)["Rank Name"]] > p.rank) return false;
    if (game.shopGearFreeType === (g as any).Type || game.shopGearFreeType === "any") return true;
    const gType = (g as any).Type as string;
    // Gunsmith/Bulwark resource: first purchase of the matching type is free
    if (p.tactician?.Name === "The Gunsmith" && gType === "Weapon" && !game.gunsmithFreeWeaponUsedSeats.has(p.seatIndex)) return true;
    if (p.tactician?.Name === "The Bulwark" && gType === "Armor" && !game.bulwarkFreeArmorUsedSeats.has(p.seatIndex)) return true;
    // Mission free gear credits
    if (p.nextGearFreeCount > 0) return true;
    return canAffordIncludingCommand(game, p, tacticianDiscountedCost(p, g as any, "gear", game), GEAR_COST_KEYS);
  });
}

/** Pays for and takes delivery of a shop unit -- to the team scout pool if it's a Scout-type
 * upgrade over the pool's current best, else to the buyer's own active/reserve. */
export function buyUnitMutation(game: GameState, p: GamePlayer, choice: UnitCard, log: (t: string) => void) {
  const uRank = RANK_NUM[choice.Rank] ?? 0;
  const isFreeRankOne = p.rankOneFree && uRank === 1;
  const isFreeRankCredit = !isFreeRankOne && p.nextRankFreeUnit > 0 && uRank <= p.nextRankFreeUnit;
  const isFreeOneShot = !isFreeRankOne && !isFreeRankCredit && p.nextUnitFreeCount > 0;
  if (isFreeRankOne) {
    log(`  [Conscription] ${p.name}'s Rank 1 unit ${choice.Name} is free`);
  } else if (isFreeRankCredit) {
    p.nextRankFreeUnit = 0;
    log(`  [Free Unit] ${p.name}'s ${choice.Name} (Rank ${uRank}) is free`);
  } else if (isFreeOneShot) {
    p.nextUnitFreeCount--;
    log(`  [Free Unit] ${p.name}'s ${choice.Name} is free (${p.nextUnitFreeCount} credit(s) remaining)`);
  } else {
    const base = tacticianDiscountedCost(p, choice, "unit", game);
    if (p.nextRecruitmentDiscount) {
      const disc = p.nextRecruitmentDiscount;
      p.nextRecruitmentDiscount = null;
      const discounted: any = { ...base };
      const discMap: Record<string, number> = {
        "Organic Cost": disc.Organic,
        "Tech Cost": disc.Tech,
        "Alien Cost": disc.Alien,
      };
      for (const k of UNIT_COST_KEYS) {
        discounted[k] = String(Math.max(0, toInt(discounted[k]) - (discMap[k] ?? 0)));
      }
      log(`  [Sacrifice Discount] ${p.name} buys ${choice.Name} with reduced cost`);
      if (p.mechHalfPrice && choice.Type.includes("Mech")) {
        const halved: any = { ...discounted };
        for (const k of UNIT_COST_KEYS) halved[k] = Math.ceil(toInt(halved[k]) / 2);
        payIncludingCommand(game, p, halved, UNIT_COST_KEYS);
      } else if (p.vehicleHalfPrice && choice.Type.includes("Vehicle")) {
        const halved: any = { ...discounted };
        for (const k of UNIT_COST_KEYS) halved[k] = Math.ceil(toInt(halved[k]) / 2);
        payIncludingCommand(game, p, halved, UNIT_COST_KEYS);
      } else {
        payIncludingCommand(game, p, discounted, UNIT_COST_KEYS);
      }
    } else if (p.mechHalfPrice && choice.Type.includes("Mech")) {
      const halved: any = { ...base };
      for (const k of UNIT_COST_KEYS) halved[k] = Math.ceil(toInt(halved[k]) / 2);
      payIncludingCommand(game, p, halved, UNIT_COST_KEYS);
      log(`  [Steel Supremacy] ${p.name}'s Mech ${choice.Name} at half price`);
    } else if (p.vehicleHalfPrice && choice.Type.includes("Vehicle")) {
      const halved: any = { ...base };
      for (const k of UNIT_COST_KEYS) halved[k] = Math.ceil(toInt(halved[k]) / 2);
      payIncludingCommand(game, p, halved, UNIT_COST_KEYS);
      log(`  [Armored Column] ${p.name}'s Vehicle ${choice.Name} at half price`);
    } else {
      payIncludingCommand(game, p, base, UNIT_COST_KEYS);
    }
  }
  game.unitsOrGearAddedSeats.add(p.seatIndex); // AFK SO tracking
  game.shopUnits.splice(game.shopUnits.indexOf(choice), 1);
  refillShopUnit(game);
  const ui = makeUnitInstance(choice);
  const currentBestScoutValue = game.teamScoutPool.length ? Math.max(...game.teamScoutPool.map((u) => scoutValue(u))) : -1;
  if (choice.Type.includes("Scout") && scoutValue(ui) > currentBestScoutValue) {
    // Pathfinder passive: scouts have double combat stats
    if (p.tactician?.Name === "The Pathfinder") {
      ui.card = { ...choice, Damage: String(toInt(choice.Damage) * 2), HP: String(ui.maxHp * 2) } as UnitCard;
      ui.maxHp = ui.maxHp * 2;
      ui.curHp = ui.maxHp;
    }
    game.teamScoutPool.push(ui);
    log(`  ${p.name} donates ${ui.card.Name} to the team scout pool${p.tactician?.Name === "The Pathfinder" ? " (double stats)" : ""}`);
  } else if (p.active === null) {
    p.active = ui;
  } else {
    p.reserve.push(ui);
  }
}

const SACRIFICE_UNIT_NAMES = new Set(["Conscript", "Recruit", "Stubborn Recruit", "Lazy Recruit", "Recruit Prodigy"]);

/** Sacrifice a Conscript-family unit from the player's active or reserve slot to gain a cost
 * discount on the next unit purchase. Returns true if a unit was sacrificed. */
export function sacrificeForDiscountMutation(game: GameState, p: GamePlayer, log: (t: string) => void): boolean {
  // Find the first sacrifice-eligible unit in reserve, or active as fallback.
  let target: import("./types.js").UnitInstance | null = null;
  const reserveIdx = p.reserve.findIndex((u) => SACRIFICE_UNIT_NAMES.has(u.card.Name));
  if (reserveIdx >= 0) {
    [target] = p.reserve.splice(reserveIdx, 1);
  } else if (p.active && SACRIFICE_UNIT_NAMES.has(p.active.card.Name)) {
    target = p.active;
    p.active = p.reserve.shift() ?? null;
  }
  if (!target) return false;
  const bonus = target.card.Name === "Recruit Prodigy" ? 2 : 1;
  const disc = {
    Organic: Math.max(0, toInt((target.card as any)["Organic Cost"]) + bonus),
    Tech: Math.max(0, toInt((target.card as any)["Tech Cost"]) + bonus),
    Alien: Math.max(0, toInt((target.card as any)["Alien Cost"]) + bonus),
  };
  p.nextRecruitmentDiscount = disc;
  log(`  [Sacrifice] ${p.name} sacrifices ${target.card.Name} â†’ next unit costs -${disc.Organic}O/-${disc.Tech}T/-${disc.Alien}A`);
  return true;
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
  // Slayer Suit: "Cannot Equip Utility" -- block all Utility items on this unit
  if (gType === "Utility" && p.active.equipped.some((eq) => (eq as any).Name === "Slayer Suit")) {
    p.gearHand.push(g);
    log(`  ${p.name} cannot equip ${g.Name} (Slayer Suit restriction: Cannot Equip Utility) -- held in hand`);
    return false;
  }
  if (gType && SLOT_LIMITED_TYPES.has(gType)) {
    const sameTypeCount = p.active.equipped.filter((eq) => (eq as any).Type === gType).length;
    const cap = equipSlotCap(p.active, gType);
    if (sameTypeCount >= cap) {
      p.gearHand.push(g);
      log(`  ${p.name} has no free ${gType} slot for ${g.Name} (${sameTypeCount}/${cap} used) -- held in hand`);
      return false;
    }
  }
  const cost = RANK_NUM[g["Rank Name"]] ?? 1;
  const fieldTestingBuilt = (game.locationUpgradesBuilt["Armory"] ?? []).some((c) => c.Name === "Field Testing");
  if (!fieldTestingBuilt) {
    // Command Requisition: shortfall can come out of the command pool too, same as shop purchases.
    const commandReq = commandRequisitionActive(game);
    if (p.res.Tech + (commandReq ? game.commandPool.Tech : 0) < cost) {
      p.gearHand.push(g);
      log(`  ${p.name} can't afford ${cost} Tech to equip ${g.Name} -- held in hand`);
      return false;
    }
    const fromSelf = Math.min(p.res.Tech, cost);
    p.res.Tech -= fromSelf;
    if (commandReq) game.commandPool.Tech -= cost - fromSelf;
  }
  p.active.equipped.push(g);
  game.unitsOrGearAddedSeats.add(p.seatIndex); // AFK SO tracking
  const hpBonus = toInt(g.HP);
  p.active.maxHp += hpBonus;
  p.active.curHp += hpBonus;
  p.active.curShields += toInt(g.Shields);
  p.stats.gearEquipped += 1;
  if (g.Name === "Recon Satellite") p.hasReconSatellite = true;
  if (g.Name === "Last Stand Beacon") p.hasLastStandBeacon = true;
  log(
    `  ${p.name} equips ${g.Name} (${fieldTestingBuilt ? "free via Field Testing" : `Tech -${cost}`}) (Dmg+${toInt(g.Damage)} HP+${toInt(g.HP)} Arm+${toInt(g.Armor)} Shd+${toInt(g.Shields)})`
  );
  return true;
}

/** Chessmaster Reassign: move a unit from one player's lane to another's. Marks the unit as
 * reassigned so it receives half-damage protection on its first combat hit this round. */
export function chessmasterReassignMutation(
  game: GameState,
  fromPlayer: GamePlayer,
  unitId: string,
  toPlayer: GamePlayer,
  log: (t: string) => void
): boolean {
  const allUnits = [...(fromPlayer.active ? [fromPlayer.active] : []), ...fromPlayer.reserve];
  const ui = allUnits.find((u) => u.id === unitId);
  if (!ui) return false;
  // EMP "Behemoth" is immovable — cannot be reassigned.
  if (ui.card.Name === 'EMP "Behemoth"') { log(`  [EMP "Behemoth"] Cannot be moved — immovable unit`); return false; }
  // Remove from source lane
  if (fromPlayer.active?.id === unitId) fromPlayer.active = fromPlayer.reserve.length ? fromPlayer.reserve.shift()! : null;
  else fromPlayer.reserve = fromPlayer.reserve.filter((u) => u.id !== unitId);
  // Add to destination lane
  if (!toPlayer.active) toPlayer.active = ui;
  else toPlayer.reserve.push(ui);
  ui.reassignedThisRound = true;
  log(`  [Chessmaster Reassign] ${ui.card.Name} moved from ${fromPlayer.name}'s lane to ${toPlayer.name}'s lane`);
  return true;
}

export function buyGearMutation(game: GameState, p: GamePlayer, choice: GearCard, log: (t: string) => void) {
  const isFreeType = game.shopGearFreeType === (choice as any).Type || game.shopGearFreeType === "any";
  const gType = (choice as any).Type as string;
  const isGunsmithFree = p.tactician?.Name === "The Gunsmith" && gType === "Weapon" && !game.gunsmithFreeWeaponUsedSeats.has(p.seatIndex);
  const isBulwarkFree = p.tactician?.Name === "The Bulwark" && gType === "Armor" && !game.bulwarkFreeArmorUsedSeats.has(p.seatIndex);
  const isMissionFree = !isFreeType && !isGunsmithFree && !isBulwarkFree && p.nextGearFreeCount > 0;
  if (isGunsmithFree) {
    game.gunsmithFreeWeaponUsedSeats.add(p.seatIndex);
    log(`  [Gunsmith] ${p.name}'s 1st weapon purchase this round (${(choice as any).Name}) is free`);
  } else if (isBulwarkFree) {
    game.bulwarkFreeArmorUsedSeats.add(p.seatIndex);
    log(`  [Bulwark] ${p.name}'s 1st armor purchase this round (${(choice as any).Name}) is free`);
  } else if (isMissionFree) {
    p.nextGearFreeCount--;
    log(`  [Free Equip] ${p.name}'s ${(choice as any).Name} is free (${p.nextGearFreeCount} credit(s) remaining)`);
  } else if (!isFreeType) {
    payIncludingCommand(game, p, tacticianDiscountedCost(p, choice as any, "gear", game), GEAR_COST_KEYS);
  }
  game.shopGear.splice(game.shopGear.indexOf(choice as any), 1);
  refillShopGear(game);
  equipGearOntoActiveMutation(game, p, choice, log);
}

/** Returns roll-filled shop gear the Quartermaster can reroll this round (active not yet used). */
export function rerollableGear(game: GameState, p: GamePlayer): GearCard[] {
  if (p.tactician?.Name !== "The Quartermaster") return [];
  const key = `qm-reroll-${p.seatIndex}`;
  if ((game.abilityUsesThisRound.get(key) ?? 0) > 0) return [];
  return game.shopGear.filter((g) => game.quartermasterRolledShopGear.has(g));
}

/** Quartermaster active: remove a roll-filled slot and re-roll it with 2d6. Once per round. */
export function quartermasterRerollMutation(game: GameState, p: GamePlayer, choice: GearCard, log: (t: string) => void) {
  const idx = game.shopGear.indexOf(choice);
  if (idx < 0) return;
  game.shopGear.splice(idx, 1);
  game.quartermasterRolledShopGear.delete(choice);
  game.gearDeck.push(choice);
  // Roll 2d6, fill a new slot
  const topRank = Math.max(...game.players.map((q) => q.rank), 1);
  const sum = (1 + Math.floor(Math.random() * 6)) + (1 + Math.floor(Math.random() * 6));
  const roll = Math.min(sum, 8);
  const targetRank = Math.min(roll, topRank);
  let pool = game.gearDeck.filter((g) => RANK_NUM[g["Rank Name"]] === targetRank);
  if (!pool.length) pool = game.gearDeck.filter((g) => RANK_NUM[g["Rank Name"]] <= 3);
  if (!pool.length) pool = game.gearDeck;
  if (pool.length) {
    const picked = pool[Math.floor(Math.random() * pool.length)];
    game.shopGear.push(picked);
    game.quartermasterRolledShopGear.add(picked);
    log(`  [Quartermaster Active] ${p.name} rerolled shop slot: ${(choice as any).Name} â†’ ${(picked as any).Name} (2d6 roll: ${roll})`);
  }
  game.abilityUsesThisRound.set(`qm-reroll-${p.seatIndex}`, 1);
}

/** Reclaimer resource: buy gear from recyclePile at half the normal cost. */
export function buyGearFromRecycleMutation(game: GameState, p: GamePlayer, choice: GearCard, log: (t: string) => void) {
  const base = tacticianDiscountedCost(p, choice as any, "gear", game);
  const halved: any = { ...base };
  for (const k of GEAR_COST_KEYS) halved[k] = Math.ceil(toInt(halved[k]) / 2);
  payIncludingCommand(game, p, halved, GEAR_COST_KEYS);
  const idx = (game.recyclePile as any[]).indexOf(choice);
  if (idx >= 0) (game.recyclePile as any[]).splice(idx, 1);
  equipGearOntoActiveMutation(game, p, choice, log);
}

/** Returns recyclePile gear the Reclaimer player can afford at half cost. */
export function affordableRecyclePileGear(game: GameState, p: GamePlayer): GearCard[] {
  if (p.tactician?.Name !== "The Reclaimer") return [];
  return (game.recyclePile as any[]).filter((g: any) => {
    if (!("Rank Name" in g)) return false; // skip Command Cards in recyclePile
    const halved: any = { ...tacticianDiscountedCost(p, g, "gear", game) };
    for (const k of GEAR_COST_KEYS) halved[k] = Math.ceil(toInt(halved[k]) / 2);
    return canAfford(p.res, halved, GEAR_COST_KEYS);
  }) as GearCard[];
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
  const regularBuilt = game.locationUpgradesBuilt[loc].length - (game.locationBonusUpgradesCount?.[loc] ?? 0);
  const effectiveCap = Math.max(0, UPGRADE_SLOT_CAP[loc] - (game.locationUpgradeLimitPenalty ?? 0));
  const slotOk = game.renovationRemoveUnlock ? regularBuilt <= effectiveCap : regularBuilt < effectiveCap;
  const costMult = game.priorityConstructionRoundsLeft > 0 ? 0.5 : 1;
  return (
    Boolean(card["Passive Effect"]?.trim()) &&
    slotOk &&
    (["Organic", "Tech", "Alien"] as const).every((k) => game.commandPool[k] >= Math.ceil(toInt((card as any)[k]) * costMult))
  );
}

export function buildCardMutation(game: GameState, card: CommandCard, log: (t: string) => void, onContainmentBuilt: () => void) {
  const loc = card.Building as Location;
  // Renovations reward: if at cap, auto-remove the cheapest regular upgrade to free a slot.
  if (game.renovationRemoveUnlock) {
    const bonusCount = game.locationBonusUpgradesCount?.[loc] ?? 0;
    const regularBuilt = game.locationUpgradesBuilt[loc].length - bonusCount;
    const effectiveCap = Math.max(0, UPGRADE_SLOT_CAP[loc] - (game.locationUpgradeLimitPenalty ?? 0));
    if (regularBuilt >= effectiveCap) {
      const regularCards = game.locationUpgradesBuilt[loc].slice(0, game.locationUpgradesBuilt[loc].length - bonusCount);
      if (regularCards.length) {
        const cheapest = regularCards.reduce((a, b) => {
          const ca = toInt((a as any).Organic) + toInt((a as any).Tech) + toInt((a as any).Alien);
          const cb = toInt((b as any).Organic) + toInt((b as any).Tech) + toInt((b as any).Alien);
          return cb < ca ? b : a;
        });
        const idx = game.locationUpgradesBuilt[loc].indexOf(cheapest);
        game.locationUpgradesBuilt[loc].splice(idx, 1);
        game.commandDeck.unshift(cheapest);
        log(`  [Renovations] ${cheapest.Name} removed from ${loc} to free slot`);
      }
    }
  }
  const buildCostMult = game.priorityConstructionRoundsLeft > 0 ? 0.5 : 1;
  for (const k of ["Organic", "Tech", "Alien"] as const) game.commandPool[k] -= Math.ceil(toInt((card as any)[k]) * buildCostMult);
  game.locationUpgradesBuilt[loc].push(card);
  if (card.Name === "Containment Protocol") onContainmentBuilt();
  log(`  [Upgrade built] ${loc}: ${card.Name}`);
}

/** Whether a NON-commander can activate this card right now -- their own resources plus the
 * shared command pool must cover its cost. Caller must have already checked
 * cardEligibleForPlanning. */
export function canActivateAsNonCommander(game: GameState, actor: GamePlayer, card: CommandCard): boolean {
  const mult = game.priorityOperationsRoundsLeft > 0 ? 0.5 : 1;
  return (["Organic", "Tech", "Alien"] as const).every((res) => actor.res[res] + game.commandPool[res] >= Math.ceil(toInt((card as any)[res]) * mult));
}

/** A commander's own hand activates for free -- no resource cost at all, matching sim.py. */
export function commanderActivateCardMutation(
  game: GameState,
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
  const costMult = game.priorityOperationsRoundsLeft > 0 ? 0.5 : 1;
  for (const res of ["Organic", "Tech", "Alien"] as const) {
    const cost = Math.ceil(toInt((card as any)[res]) * costMult);
    const fromSelf = Math.min(actor.res[res], cost);
    const fromPool = cost - fromSelf;
    actor.res[res] -= fromSelf;
    game.commandPool[res] -= fromPool;
    actor.stats.ownSpendTotal += fromSelf; // Kremlen SO tracking
    actor.stats.commandPoolSpendTotal += fromPool;
  }
  log(`  [Active Effect] ${loc}: ${actor.name} (non-commander) activates ${card.Name} -> ${card["Active Effect"]}`);
  dispatch(card, loc);
}
