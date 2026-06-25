import { toInt } from "./data.js";
import type { EnemyCard, UnitCard } from "./data.js";
import type { UnitInstance } from "./types.js";

/** A simplified combat participant -- Stage 2 scope has no per-card ability dispatch yet for
 * Units/Enemies/Gear (that's a later stage), so this only tracks flat numeric stats. */
export class Combatant {
  name: string;
  dmg: number;
  hp: number;
  curHp: number;
  armor: number;
  curShields: number;
  attacksFirst = false;

  constructor(card: UnitCard | EnemyCard) {
    this.name = card.Name;
    this.dmg = toInt(card.Damage);
    this.hp = toInt(card.HP) || 1;
    this.curHp = this.hp;
    this.armor = toInt(card.Armor);
    this.curShields = toInt(card.Shields);
  }
}

export function combatantFromUnit(ui: UnitInstance): Combatant {
  const c = new Combatant(ui.card);
  c.dmg += equippedBonus(ui, "Damage");
  c.armor += equippedBonus(ui, "Armor");
  c.hp = ui.maxHp;
  c.curHp = ui.curHp;
  c.curShields = ui.curShields;
  return c;
}

export function equippedBonus(ui: UnitInstance, stat: "Damage" | "Armor" | "HP" | "Shields"): number {
  return ui.equipped.reduce((sum, g) => sum + toInt((g as any)[stat]), 0);
}

export function computeDealt(attacker: Combatant, defender: Combatant): number {
  if (attacker.dmg <= 0) return 0;
  const effectiveArmor = defender.armor;
  let dealt = Math.max(1, attacker.dmg - effectiveArmor);
  if (defender.curShields > 0) {
    const absorbed = Math.min(defender.curShields, dealt);
    defender.curShields -= absorbed;
    dealt -= absorbed;
  }
  return Math.max(0, dealt);
}

export interface LaneCombatResult {
  overrun: boolean;
  playerSurvivors: Combatant[];
  enemySurvivors: Combatant[];
}

/** Default (per README #33): the enemy's Active card deals damage first each exchange,
 * resolving completely (including an outright kill) before the player's unit responds. */
export function resolveLaneCombat(
  playerCombatants: Combatant[],
  enemyCombatants: Combatant[]
): LaneCombatResult {
  const pq = [...playerCombatants];
  const eq = [...enemyCombatants];
  while (pq.length && eq.length) {
    const p = pq[0];
    const e = eq[0];
    if (p.attacksFirst) {
      e.curHp -= computeDealt(p, e);
      if (e.curHp <= 0) {
        eq.shift();
        continue;
      }
      p.curHp -= computeDealt(e, p);
    } else {
      p.curHp -= computeDealt(e, p);
      if (p.curHp <= 0) {
        pq.shift();
        continue;
      }
      e.curHp -= computeDealt(p, e);
    }
    if (p.curHp <= 0) pq.shift();
    if (e.curHp <= 0) eq.shift();
  }
  return { overrun: eq.length > 0, playerSurvivors: pq, enemySurvivors: eq };
}
