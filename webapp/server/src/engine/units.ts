import { toInt, type UnitCard } from "./data.js";
import { Combatant } from "./combat.js";
import { canActivateAbility, canUseEffect, healUnit, recordAbilityActivation, recordEffectUse, type RoundTempState } from "./state.js";
import type { GamePlayer, GameState, UnitInstance } from "./types.js";

/** Ported 1:1 from Working/sim.py's UNIT_KEYWORD_RULES: keyword-classification dispatch that
 * handles the bulk of Unit ability text by substring-matching recurring patterns, rather than
 * one branch per card (103 units have too much unique text to hand-code individually). */
const UNIT_KEYWORD_RULES: [string, string[]][] = [
  ["ignore_armor", ["ignores armor", "ignore armor"]],
  ["attacks_first", ["attacks 1st", "attacks before enemies"]],
  ["reflect_half", ["reflects half damage", "reflect half"]],
  ["reflect_retaliate", ["retaliate with 1/2 damage"]],
  ["consecutive_damage", ["consecutive hits", "hits against same target"]],
  ["long_range", ["long range", "target any lane", "can target any lane"]],
  ["lane_heal", ["vehicles and mechs in same lane", "active vehicles and mechs"]],
  ["shields_no_reserve", ["shields when no reserves"]],
  ["attack_no_reserve", ["attack when no reserves"]],
  ["explode_on_death", ["explodes on death", "explodes for", "death dealing", "damage to all enemies on death", "on death explodes dealing"]],
  ["delete_on_kill", ["delete units killed", "delete enemies on kill", "deletes enemies on kill"]],
  ["execute_low_hp", ["execute", "kills enemies under 1/4", "under 1/4 health"]],
  ["heal_on_kill", ["heals hp = attack on kill", "health on kill"]],
  ["heal_full_on_kill", ["on kill heal missing health"]],
  ["shields_on_kill", ["gain shields on kill", "shields on kill"]],
  ["precombat_shield", ["shields before each combat round", "gain 5 shields before"]],
  ["precombat_heal", ["restores 4 hp before", "restore 3 hp between"]],
  ["once_per_combat_heal", ["once per combat: heal"]],
  ["revive_once", ["revive once without gear"]],
  ["boost_others_damage", ["boosts damage of other units"]],
  ["resource_on_kill", ["grants +1 progress when killed"]],
  ["trample", ["trample"]],
  ["trample_unlimited", ["through all reserve units"]],
  ["stun_on_attack_full_hp", ["stun when attacking full hp"]],
  ["stun_on_kill", ["on kill stun"]],
  ["stun_on_death", ["stuns all enemies when killed"]],
  ["stun_all_on_enter_active", ["stun all enemies when entering active slot"]],
  ["stun_all_on_combat_start", ["on combat start if active slot, stun all enemies"]],
  ["stun_at_half_hp", ["stuns all enemies when falling below half hp"]],
  ["stun_when_first_damaged", ["stun 1st enemy to damage"]],
  ["stun_precombat", ["once per turn: stun target enemy"]],
  ["stun_deploy_from_scout", ["stun enemy when deployed from scout"]],
  ["shred_armor_on_hit", ["reduce armor by 1 per attack", "enemy loses 1 armor", "remove 3 armor on hit"]],
  ["splash_adjacent", ["attacks hit target adjacent lane for half damage", "deals half damage to lanes next to target"]],
  ["reserve_infantry_heal", ["infantry restore half of missing hp"]],
  ["hits_double", ["hits twice"]],
  ["player_attacks_all_lanes", ["attacks all lanes simultaneously"]],
  ["buff_lane_dmg_armor", ["friendly units get +10 damage"]],
  ["counter_after_enemy_hit", ["attacks an additional time after enemy attacks"]],
  ["attacks_every_other", ["attacks every 2nd round", "attacks every 2nd hit", "only attacks every 2nd"]],
];

const unitTagCache = new Map<string, Set<string>>();

export function classifyUnit(card: UnitCard): Set<string> {
  const cached = unitTagCache.get(card.Name);
  if (cached) return cached;
  const text = `${card["Main Effect"] ?? ""} ${card["Bonus Effects"] ?? ""}`.toLowerCase();
  const tags = new Set<string>();
  for (const [tag, subs] of UNIT_KEYWORD_RULES) {
    if (subs.some((s) => text.includes(s))) tags.add(tag);
  }
  unitTagCache.set(card.Name, tags);
  return tags;
}

export function applyUnitCombatMods(c: Combatant, ui: UnitInstance) {
  if (c.suppressPassives) return;
  const tags = classifyUnit(ui.card);
  const cardText = `${(ui.card as any)["Main Effect"] ?? ""} ${(ui.card as any)["Bonus Effects"] ?? ""}`;
  if (tags.has("ignore_armor")) c.ignoreArmor = true;
  if (tags.has("attacks_first")) c.attacksFirst = true;
  if (tags.has("reflect_half") || tags.has("reflect_retaliate")) c.reflectFraction = 0.5;
  if (tags.has("consecutive_damage")) c.dmg += ui.charges["consecutive_hits"] ?? 0;
  if (tags.has("execute_low_hp")) c.executeEnemyBelowFraction = 0.25;
  if (tags.has("heal_full_on_kill")) {
    c.healFullOnKill = true;
  } else if (tags.has("heal_on_kill")) {
    const fixedHeal = cardText.match(/gain\s+(\d+)\s+(?:health|hp)\s+on\s+kill/i);
    c.healOnKill = fixedHeal ? parseInt(fixedHeal[1]) : c.dmg;
  }
  if (tags.has("shields_on_kill")) c.shieldsOnKill = 10;
  if (tags.has("trample") || tags.has("trample_unlimited")) c.trample = true;
  if (tags.has("trample_unlimited")) c.trampleUnlimited = true;
  if (tags.has("long_range")) c.longRange = true;
  if (tags.has("stun_on_attack_full_hp")) c.stunOnAttackFullHp = true;
  if (tags.has("stun_on_kill")) c.stunOnKill = true;
  if (tags.has("stun_at_half_hp")) c.stunBelowHalf = true;
  if (tags.has("stun_when_first_damaged")) c.stunNextAttacker = true;
  if (tags.has("shred_armor_on_hit")) {
    const m = cardText.match(/(?:reduce\s+armor\s+by|enemy\s+loses\s+|remove\s+)(\d+)/i);
    c.shredArmor = m ? parseInt(m[1]) : 1;
  }
  if (tags.has("splash_adjacent")) c.splashAdjacentFraction = 0.5;
  // delete_on_kill: handled in game.ts Phase 3 (skip containment for that lane)
  if (tags.has("hits_double")) c.hitsDouble = true;
  if (tags.has("player_attacks_all_lanes")) c.playerAttacksAllLanes = true;
  if (tags.has("counter_after_enemy_hit")) c.counterAfterEachEnemyHit = true;
  if (tags.has("attacks_every_other")) c.attacksEveryOther = true;
  if (tags.has("execute_low_hp") && ui.card.Name === "Attack Dogs") c.executeRequiresSameOrLowerRank = true;
}

/** "Revive once without Gear if no reserves in lane" (Rambo) -- a per-unit, once-per-game save
 * distinct from Chronostasis (no item to destroy, just a built-in unit ability). */
export function tryReviveOnce(game: GameState, p: GamePlayer, ui: UnitInstance, log: (t: string) => void): boolean {
  const tags = classifyUnit(ui.card);
  const key = `revive-${ui.id}`;
  if (tags.has("revive_once") && p.reserve.length === 0 && canUseEffect(game, key, 1)) {
    recordEffectUse(game, key);
    ui.equipped = [];
    ui.curHp = ui.maxHp;
    log(`  [Revive] ${p.name}'s ${ui.card.Name} revives once (no gear) since the lane had no reserves`);
    return true;
  }
  return false;
}

/** The Doctor Tactician's Active ("Activate on Unit death -- Move this unit to med bay with its
 * equipment"). Sets the dying unit to 1 HP with gear intact; the caller is responsible for pushing
 * it to p.medBayUnits. Fires mid-combat (Phase 2) on the first unit death detected that exchange;
 * Phase 3 is a fallback for deaths not caught mid-combat. Once per round. */
export function tryDoctorSave(game: GameState, p: GamePlayer, ui: UnitInstance, log: (t: string) => void): boolean {
  if (p.tactician?.Name !== "The Doctor") return false;
  const syntheticId = `tac-${p.seatIndex}`;
  if (!canActivateAbility(game, syntheticId, "The Doctor")) return false;
  ui.curHp = 1;
  recordAbilityActivation(game, p.seatIndex, syntheticId, "The Doctor");
  log(`  [The Doctor] ${p.name}'s ${ui.card.Name} is moved to med bay instead of dying (1 HP, gear intact)`);
  return true;
}

export function applyExplodeOnDeath(game: GameState, p: GamePlayer, ui: UnitInstance, log: (t: string) => void) {
  const tags = classifyUnit(ui.card);
  if (!tags.has("explode_on_death")) return;
  const fullText = `${(ui.card as any)["Main Effect"] ?? ""} ${(ui.card as any)["Bonus Effects"] ?? ""}`.toLowerCase();
  const multMatch = fullText.match(/(\d+)x\s*(?:attack\s+)?damage/);
  const flatMatch = !multMatch ? fullText.match(/(?:dealing|for)\s+(\d+)\s+(?:to|damage)/) : null;
  const dmg = multMatch ? toInt(ui.card.Damage) * parseInt(multMatch[1])
            : flatMatch ? parseInt(flatMatch[1])
            : toInt(ui.card.Damage) * 3;
  const allLanes = /to all enemies/.test(fullText);
  if (game.bossActive) {
    game.bossActive.hpCur -= dmg;
    log(`  [Explode] ${p.name}'s ${ui.card.Name} explodes on death for ${dmg} (boss)`);
  } else if (allLanes) {
    for (const lp of game.players) {
      lp.laneEnemyReserve = lp.laneEnemyReserve.filter((e) => toInt(e.HP) > dmg);
    }
    log(`  [Explode] ${p.name}'s ${ui.card.Name} explodes on death for ${dmg} to all lanes`);
  } else {
    if (p.laneEnemyReserve.length) {
      p.laneEnemyReserve = p.laneEnemyReserve.filter((e) => toInt(e.HP) > dmg);
    }
    log(`  [Explode] ${p.name}'s ${ui.card.Name} explodes on death for ${dmg}`);
  }
}

/** Covert Operation: stun all enemies in lane for next round when this unit is killed.
 * Called alongside applyExplodeOnDeath in Phase 3 for each dying unit. */
export function applyDeathStun(tempState: RoundTempState, p: GamePlayer, ui: UnitInstance, log: (t: string) => void) {
  const tags = classifyUnit(ui.card);
  if (tags.has("stun_on_death")) {
    tempState.pendingEnemyStunAllSeats.add(p.seatIndex);
    p.stats.stunsMade += 1;
    log(`  [Death Stun] ${p.name}'s ${ui.card.Name} stunned all enemies in lane (next round)`);
  }
}

/** Unit-ability passives that resolve once before combat: lane-self-heals, no-reserve bonuses,
 * consecutive-hit damage stack, and Front Line Commander's ally damage boost. */
export function applyPrecombatUnit(p: GamePlayer, tempState: RoundTempState, game?: GameState) {
  const allUnits = [...(p.active ? [p.active] : []), ...p.reserve];
  const noReserve = p.reserve.length === 0;
  for (const ui of allUnits) {
    const tags = classifyUnit(ui.card);
    if (tags.has("precombat_heal") || tags.has("once_per_combat_heal")) healUnit(ui, 4, game);
    if (tags.has("precombat_shield")) ui.curShields += 5;
    if (tags.has("lane_heal")) {
      const cardText = `${(ui.card as any)["Main Effect"] ?? ""} ${(ui.card as any)["Bonus Effects"] ?? ""}`;
      const healMatch = cardText.match(/heal\s+(?:by\s+)?(\d+)/i);
      const healAmt = healMatch ? parseInt(healMatch[1]) : 2;
      const laneUnits = [...(p.active ? [p.active] : []), ...p.reserve];
      for (const other of laneUnits) {
        if (other === ui) continue;
        if (/vehicle|mech/i.test(((other.card as any).Type ?? ""))) healUnit(other, healAmt, game);
      }
    }
    if (tags.has("shields_no_reserve") && noReserve && ui === p.active) {
      ui.curShields += 20;
    }
    if (tags.has("attack_no_reserve") && noReserve && ui === p.active) {
      tempState.tempBuff(ui, { Damage: 5 });
    }
    if (ui === p.active) {
      ui.charges["consecutive_hits"] = (ui.charges["consecutive_hits"] ?? 0) + 1;
    } else {
      ui.charges["consecutive_hits"] = 0;
    }
    // Mammoth Tank: stun all enemies on entering active slot (fires once per active-slot entry via charges).
    if (tags.has("stun_all_on_enter_active") && ui === p.active && !ui.charges["enterActiveStunFired"]) {
      ui.charges["enterActiveStunFired"] = 1;
      tempState.pendingEnemyStunAllSeats.add(p.seatIndex);
      p.stats.stunsMade += 1;
    }
    // Tesla Tank: stun all enemies at combat start each round when active.
    if (tags.has("stun_all_on_combat_start") && ui === p.active) {
      tempState.pendingEnemyStunAllSeats.add(p.seatIndex);
      p.stats.stunsMade += 1;
    }
    // Howitzer / Mobile Artillery: stun front enemy once per turn when active.
    if (tags.has("stun_precombat") && ui === p.active) {
      tempState.pendingEnemyStunSeats.add(p.seatIndex);
      p.stats.stunsMade += 1;
    }
    // Ambulance: while in reserve, heals infantry in lane by half their missing HP.
    if (tags.has("reserve_infantry_heal") && ui !== p.active) {
      const laneUnits = [...(p.active ? [p.active] : []), ...p.reserve];
      for (const other of laneUnits) {
        if (other === ui) continue;
        if (/infantry/i.test(((other.card as any).Type ?? ""))) {
          const missing = other.maxHp - other.curHp;
          if (missing > 0) healUnit(other, Math.floor(missing / 2), game);
        }
      }
    }
    // Overlord Tank: while active, all friendly units in lane get +10 Dmg and +5 Armor.
    if (tags.has("buff_lane_dmg_armor") && ui === p.active) {
      const laneUnits = [...(p.active ? [p.active] : []), ...p.reserve];
      for (const other of laneUnits) {
        if (other === ui) continue;
        tempState.tempBuff(other, { Damage: 10, Armor: 5 });
      }
    }
    // Siege Tank: prevent all player stuns this round while active.
    if (ui.card.Name === "Siege Tank" && ui === p.active && game) {
      (game as any)._siegeTankActive = true;
    }
    // RDMP "Mother": generates resources each round when in reserve slot.
    if (ui.card.Name === 'RDMP "Mother"' && ui !== p.active) {
      const org = toInt((ui.card as any)["Organic Scout"]);
      const tech = toInt((ui.card as any)["Tech Scout"]);
      const alien = toInt((ui.card as any)["Alien Scout"]);
      if (org > 0) p.res.Organic += org;
      if (tech > 0) p.res.Tech += tech;
      if (alien > 0) p.res.Alien += alien;
    }
  }
  // Front Line Commander: "Boosts Damage of other units by this unit's attack when Active"
  if (p.active && classifyUnit(p.active.card).has("boost_others_damage")) {
    const boost = toInt(p.active.card.Damage);
    for (const u of p.reserve) tempState.tempBuff(u, { Damage: boost });
  }
}
