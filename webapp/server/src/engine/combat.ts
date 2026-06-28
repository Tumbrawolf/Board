import { toInt } from "./data.js";
import type { EnemyCard, UnitCard } from "./data.js";
import type { UnitInstance } from "./types.js";

/** A combat participant. Gear-driven and Enemy-driven modifiers (ignoreArmor, shieldMultiplier,
 * etc.) aren't dispatched onto these yet -- that's a later stage (Gear, then Enemy) -- but the
 * fields exist now so Unit ability dispatch (engine/units.ts) has a real Combatant to set them on. */
export class Combatant {
  name: string;
  dmg: number;
  hp: number;
  curHp: number;
  armor: number;
  curShields: number;
  ignoreArmor = false;
  shieldMultiplier = 1;
  shredArmor = 0;
  firstHitPrevented = false;
  deleteOnKill = false;
  attacksFirst = false;
  reflectFraction = 0;
  lifestealFraction = 0;

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
  if (defender.firstHitPrevented) {
    defender.firstHitPrevented = false;
    return 0;
  }
  const effectiveArmor = attacker.ignoreArmor ? 0 : defender.armor;
  if (attacker.shredArmor && defender.armor > 0) {
    defender.armor -= Math.min(attacker.shredArmor, defender.armor);
  }
  let dealt = Math.max(1, attacker.dmg - effectiveArmor);
  if (defender.curShields > 0) {
    const shieldDmg = dealt * attacker.shieldMultiplier;
    const absorbed = Math.min(defender.curShields, shieldDmg);
    defender.curShields -= absorbed;
    dealt -= Math.floor(absorbed / attacker.shieldMultiplier);
  }
  dealt = Math.max(0, dealt);
  if (defender.reflectFraction) {
    attacker.curHp -= Math.floor(dealt * defender.reflectFraction);
  }
  if (attacker.lifestealFraction) {
    attacker.curHp = Math.min(attacker.hp, attacker.curHp + Math.floor(dealt * attacker.lifestealFraction));
  }
  return dealt;
}

export interface LaneCombatResult {
  overrun: boolean;
  playerSurvivors: Combatant[];
  enemySurvivors: Combatant[];
  totalShieldsAbsorbed: number;
}

/** Default (per README #33): the enemy's Active card deals damage first each exchange,
 * resolving completely (including an outright kill) before the player's unit responds.
 * bonusPlayerDmgPerAttack: Tag Team passive -- flat bonus damage applied to the enemy after each
 * player attack (sum of reserve unit damage values, no additional armor interaction). */
export function resolveLaneCombat(
  playerCombatants: Combatant[],
  enemyCombatants: Combatant[],
  bonusPlayerDmgPerAttack = 0,
  onFirstPlayerDeath?: (dying: Combatant, currentEnemy: Combatant) => void,
  doubleFirstAttack = false,
  onEnemyKill?: (killer: Combatant) => void
): LaneCombatResult {
  const pq = [...playerCombatants];
  const eq = [...enemyCombatants];
  let totalShieldsAbsorbed = 0;
  let deathCb = onFirstPlayerDeath;
  let firstExchangeDone = false;
  const fireDeathCb = (dying: Combatant) => {
    if (deathCb && eq[0]) { deathCb(dying, eq[0]); deathCb = undefined; }
  };
  const fireKillCb = (killer: Combatant) => { if (onEnemyKill) onEnemyKill(killer); };
  const dmgMult = () => (doubleFirstAttack && !firstExchangeDone) ? 2 : 1;
  while (pq.length && eq.length) {
    const p = pq[0];
    const e = eq[0];
    const mult = dmgMult();
    if (p.attacksFirst) {
      const eBefore = e.curShields;
      e.curHp -= computeDealt(p, e) * mult;
      e.curHp -= bonusPlayerDmgPerAttack;
      totalShieldsAbsorbed += eBefore - e.curShields;
      if (e.curHp <= 0) {
        firstExchangeDone = true;
        fireKillCb(p);
        eq.shift();
        continue;
      }
      const pBefore = p.curShields;
      p.curHp -= computeDealt(e, p) * mult;
      totalShieldsAbsorbed += pBefore - p.curShields;
    } else {
      const pBefore = p.curShields;
      p.curHp -= computeDealt(e, p) * mult;
      totalShieldsAbsorbed += pBefore - p.curShields;
      if (p.curHp <= 0) {
        firstExchangeDone = true;
        fireDeathCb(p);
        pq.shift();
        continue;
      }
      const eBefore = e.curShields;
      e.curHp -= computeDealt(p, e) * mult;
      e.curHp -= bonusPlayerDmgPerAttack;
      totalShieldsAbsorbed += eBefore - e.curShields;
    }
    firstExchangeDone = true;
    if (p.curHp <= 0) { fireDeathCb(p); pq.shift(); }
    if (e.curHp <= 0) { fireKillCb(pq[0] ?? p); eq.shift(); }
  }
  return { overrun: eq.length > 0, playerSurvivors: pq, enemySurvivors: eq, totalShieldsAbsorbed };
}
