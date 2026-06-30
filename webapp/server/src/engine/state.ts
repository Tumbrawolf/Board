import { RANK_ORDER } from "./constants.js";
import { toInt } from "./data.js";
import type { GearCard, UnitCard } from "./data.js";
import type { GamePlayer, GameState, ResourcePool, UnitInstance } from "./types.js";

let nextId = 1;
export function makeUnitInstance(card: UnitCard): UnitInstance {
  const maxHp = toInt(card.HP) || 1;
  return {
    id: `u${nextId++}`,
    card,
    maxHp,
    curHp: maxHp,
    curShields: toInt(card.Shields),
    equipped: [],
    charges: {},
  };
}

export function makeTempCard(name: string, damage = 0, hp = 1, armor = 0, shields = 0): UnitCard {
  return {
    Type: "Drone",
    Rank: "Conscript",
    Name: name,
    "Main Effect": "",
    "Bonus Effects": "",
    Damage: String(damage),
    HP: String(hp),
    "Organic Cost": "0",
    "Tech Cost": "0",
    "Alien Cost": "0",
    "Organic Scout": "0",
    "Tech Scout": "0",
    "Alien Scout": "0",
    Armor: String(armor),
    Shields: String(shields),
  };
}

export function scoutValue(ui: UnitInstance): number {
  return (
    toInt((ui.card as any)["Organic Scout"]) +
    toInt((ui.card as any)["Tech Scout"]) +
    toInt((ui.card as any)["Alien Scout"])
  );
}

export function reorderActive(p: GamePlayer) {
  const units = [...(p.active ? [p.active] : []), ...p.reserve];
  if (!units.length) return;
  units.sort((a, b) => instancePower(b) - instancePower(a));
  p.active = units[0];
  p.reserve = units.slice(1);
}

export function instancePower(ui: UnitInstance): number {
  return (
    toInt(ui.card.Damage) +
    equippedBonus(ui, "Damage") +
    ui.curHp +
    2 * toInt(ui.card.Armor) +
    equippedBonus(ui, "Armor") +
    ui.curShields
  );
}

export function equippedBonus(ui: UnitInstance, stat: "Damage" | "Armor" | "HP" | "Shields"): number {
  return ui.equipped.reduce((sum, g) => sum + toInt((g as any)[stat]), 0);
}

export function unitsOf(p: GamePlayer): UnitInstance[] {
  return [...(p.active ? [p.active] : []), ...p.reserve];
}

export function lanePower(p: GamePlayer): number {
  return unitsOf(p).reduce((sum, ui) => sum + instancePower(ui), 0);
}

export function weakestPlayer(game: GameState): GamePlayer {
  return game.players.reduce((a, b) => (lanePower(b) < lanePower(a) ? b : a));
}

export function strongestPlayer(game: GameState): GamePlayer {
  return game.players.reduce((a, b) => (lanePower(b) > lanePower(a) ? b : a));
}

/** Apply damage to a UnitInstance before combat (armor reduces, shields absorb after armor,
 * minimum 1 HP damage if anything gets through). Returns actual HP damage dealt. */
export function dealPreCombatDamage(ui: UnitInstance, rawDmg: number, ignoreArmor = false): number {
  if (rawDmg <= 0) return 0;
  const armor = ignoreArmor ? 0 : Math.max(0, toInt((ui.card as any).Armor ?? 0) + equippedBonus(ui, "Armor"));
  let dmg = Math.max(1, rawDmg - armor);
  if (ui.curShields > 0) {
    const absorbed = Math.min(ui.curShields, dmg);
    ui.curShields -= absorbed;
    dmg -= absorbed;
  }
  dmg = Math.max(0, dmg);
  ui.curHp -= dmg;
  return dmg;
}

export function healUnit(ui: UnitInstance, amount?: number, game?: { plagueActive: boolean }): number {
  if (game?.plagueActive) return 0;
  if (amount === undefined) {
    const healed = ui.maxHp - ui.curHp;
    ui.curHp = ui.maxHp;
    return healed;
  }
  const healed = Math.min(amount, ui.maxHp - ui.curHp);
  ui.curHp += healed;
  return healed;
}

/** Grant shields to a player unit, doubling the amount for The Bastion ("Double Shield gains"). */
export function grantShields(ui: UnitInstance, amount: number, p: GamePlayer) {
  if (amount <= 0) return;
  ui.curShields += p.tactician?.Name === "The Bastion" ? amount * 2 : amount;
}

export const UNIT_COST_KEYS = ["Organic Cost", "Tech Cost", "Alien Cost"] as const;
export const GEAR_COST_KEYS = ["Organic Cost", "Tech Cost", "Alien Cost"] as const;

export function canAfford(res: ResourcePool, card: UnitCard | GearCard, keys: readonly string[]): boolean {
  return keys.every((k) => res[k.split(" ")[0] as keyof ResourcePool] >= toInt((card as any)[k]));
}

export function pay(res: ResourcePool, card: UnitCard | GearCard, keys: readonly string[]) {
  for (const k of keys) {
    res[k.split(" ")[0] as keyof ResourcePool] -= toInt((card as any)[k]);
  }
}

/** Round-scoped temporary state, mirroring Working/sim.py's TEMP_BUFFS/TEMP_UNITS/CANNOT_DIE/
 * HOARD_REDUCTION/HALF_OVERRUN_DAMAGE globals -- all cleared at Cleanup each round. */
export class RoundTempState {
  tempBuffs: { ui: UnitInstance; buff: Partial<Record<string, number>> }[] = [];
  tempUnits: { player: GamePlayer; ui: UnitInstance }[] = [];
  cannotDie = new Set<string>();
  mustDieAfterCombat = new Set<string>();
  hoardReduction = new Map<string, number>();
  halfOverrunDamage = false;
  reserveImmuneThisRound = false;
  youShallNotPassArmed = false;
  tranqRoundsActiveThisRound = false;
  /** Player seat indices where Gloom (or similar) blocks unit/gear ability activations this round. */
  abilityBlockedSeats = new Set<number>();
  /** Player seat indices whose active unit starts combat stunned (set by cross-lane reveal effects). */
  pendingPlayerStunSeats = new Set<number>();
  /** Player seat indices whose active enemy starts combat stunned (set by cross-lane reveal effects). */
  pendingEnemyStunSeats = new Set<number>();
  /** Extra shields to add to the active enemy combatant in each lane when built. */
  pendingEnemyActiveShields = new Map<number, number>();
  /** Player seat indices whose active unit starts combat stunned because they activated an ability while Titan is alive. */
  titanStunnedSeats = new Set<number>();

  tempBuff(ui: UnitInstance, stats: { Damage?: number; Armor?: number; HP?: number; Shields?: number }) {
    const buff: any = { ...stats };
    ui.equipped.push(buff);
    if (stats.HP) {
      ui.maxHp += stats.HP;
      ui.curHp += stats.HP;
    }
    if (stats.Shields) {
      ui.curShields += stats.Shields;
    }
    this.tempBuffs.push({ ui, buff });
  }

  addTempUnit(player: GamePlayer, ui: UnitInstance) {
    if (player.active === null) player.active = ui;
    else player.reserve.push(ui);
    this.tempUnits.push({ player, ui });
  }

  clear() {
    for (const { ui, buff } of this.tempBuffs) {
      const idx = ui.equipped.indexOf(buff as any);
      if (idx !== -1) ui.equipped.splice(idx, 1);
    }
    this.tempBuffs = [];
    for (const { player, ui } of this.tempUnits) {
      if (player.active === ui) {
        player.active = player.reserve.length ? player.reserve[0] : null;
        player.reserve = player.reserve.length > 1 ? player.reserve.slice(1) : [];
      } else {
        const idx = player.reserve.indexOf(ui);
        if (idx !== -1) player.reserve.splice(idx, 1);
      }
    }
    this.tempUnits = [];
    this.cannotDie.clear();
    this.hoardReduction.clear();
    this.halfOverrunDamage = false;
    this.reserveImmuneThisRound = false;
    this.youShallNotPassArmed = false;
    this.tranqRoundsActiveThisRound = false;
    this.abilityBlockedSeats.clear();
    this.pendingPlayerStunSeats.clear();
    this.pendingEnemyStunSeats.clear();
    this.pendingEnemyActiveShields.clear();
  }
}

/** Returns the seat indices of lanes immediately adjacent to `seatIndex` in player order. */
export function adjacentSeats(game: GameState, seatIndex: number): number[] {
  const seats = game.players.map((p) => p.seatIndex);
  const idx = seats.indexOf(seatIndex);
  if (idx === -1) return [];
  const result: number[] = [];
  if (idx > 0) result.push(seats[idx - 1]);
  if (idx < seats.length - 1) result.push(seats[idx + 1]);
  return result;
}

export function addTempUnitPerm(player: GamePlayer, ui: UnitInstance) {
  if (player.active === null) player.active = ui;
  else player.reserve.push(ui);
}

export function maxRankIndex(): number {
  return RANK_ORDER.length;
}

export function canUseEffect(game: GameState, name: string, cap: number): boolean {
  return (game.effectUses.get(name) ?? 0) < cap;
}

export function recordEffectUse(game: GameState, name: string) {
  game.effectUses.set(name, (game.effectUses.get(name) ?? 0) + 1);
}

/** Check whether an ability use is within its per-turn limit (default 1).
 * Key: "${unitId}-${abilityName}" for instance-specific; falls back to a name-wide override
 * in abilityLimitOverrides, then to the hard default of 1. */
export function canActivateAbility(game: GameState, unitId: string, abilityName: string): boolean {
  const key = `${unitId}-${abilityName}`;
  const used = game.abilityUsesThisRound.get(key) ?? 0;
  const limit =
    game.abilityLimitOverrides.get(key) ??
    game.abilityLimitOverrides.get(abilityName) ??
    1;
  return used < limit;
}

/** Record one activation: increments the per-ability-instance use count and the player's
 * total activations-this-round counter (consumed by "Activate an ability" mission checks). */
export function recordAbilityActivation(
  game: GameState,
  seatIndex: number,
  unitId: string,
  abilityName: string
) {
  const key = `${unitId}-${abilityName}`;
  game.abilityUsesThisRound.set(key, (game.abilityUsesThisRound.get(key) ?? 0) + 1);
  game.activationsThisRound.set(seatIndex, (game.activationsThisRound.get(seatIndex) ?? 0) + 1);
}
