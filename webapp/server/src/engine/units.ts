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
  ["explode_on_death", ["explodes on death", "explodes for", "death dealing"]],
  ["delete_on_kill", ["delete units killed", "delete enemies on kill", "deletes enemies on kill"]],
  ["execute_low_hp", ["execute", "kills enemies under 1/4", "under 1/4 health"]],
  ["heal_on_kill", ["heal missing health", "heals hp = attack on kill", "health on kill"]],
  ["shields_on_kill", ["gain shields on kill", "shields on kill"]],
  ["precombat_shield", ["shields before each combat round", "gain 5 shields before"]],
  ["precombat_heal", ["restores 4 hp before", "restore 3 hp between"]],
  ["once_per_combat_heal", ["once per combat: heal"]],
  ["revive_once", ["revive once without gear"]],
  ["boost_others_damage", ["boosts damage of other units"]],
  ["resource_on_kill", ["grants +1 progress when killed"]],
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
  const tags = classifyUnit(ui.card);
  if (tags.has("ignore_armor")) c.ignoreArmor = true;
  if (tags.has("attacks_first")) c.attacksFirst = true;
  if (tags.has("reflect_half") || tags.has("reflect_retaliate")) c.reflectFraction = 0.5;
  if (tags.has("consecutive_damage")) c.dmg += ui.charges["consecutive_hits"] ?? 0;
  if (tags.has("execute_low_hp")) c.executeEnemyBelowFraction = 0.25;
  if (tags.has("heal_on_kill")) c.healOnKill = c.dmg;
  if (tags.has("shields_on_kill")) c.shieldsOnKill = 10;
  // long_range: multi-lane targeting — no hook in single-lane model (same as sim.py)
  // delete_on_kill: handled in game.ts Phase 3 (skip containment for that lane)
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
  if (tags.has("explode_on_death")) {
    const dmg = toInt(ui.card.Damage) * 3;
    if (game.bossActive) {
      game.bossActive.hpCur -= dmg;
    } else if (p.laneEnemyReserve.length) {
      p.laneEnemyReserve = p.laneEnemyReserve.filter((e) => toInt(e.HP) > dmg);
    }
    log(`  [Explode] ${p.name}'s ${ui.card.Name} explodes on death for ${dmg}`);
  }
}

/** Unit-ability passives that resolve once before combat: lane-self-heals, no-reserve bonuses,
 * and building this round's consecutive-hit damage stack. resource_on_kill/boost_others_damage
 * are documented no-ops (need a multi-unit-active model this engine doesn't have, same as sim.py). */
export function applyPrecombatUnit(p: GamePlayer, tempState: RoundTempState, game?: GameState) {
  const allUnits = [...(p.active ? [p.active] : []), ...p.reserve];
  const noReserve = p.reserve.length === 0;
  for (const ui of allUnits) {
    const tags = classifyUnit(ui.card);
    if (tags.has("precombat_heal") || tags.has("once_per_combat_heal")) healUnit(ui, 4, game);
    if (tags.has("precombat_shield")) ui.curShields += 5;
    if (tags.has("lane_heal") && ui === p.active) {
      for (const other of p.reserve) healUnit(other, 2, game);
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
  }
}
