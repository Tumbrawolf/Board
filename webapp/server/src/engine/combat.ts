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
  /** Bypass up to this many armor points per hit without removing them. */
  pierceArmor = 0;
  firstHitPrevented = false;
  deleteOnKill = false;
  /** Set to true when a deleteOnKill enemy kills this combatant — bypasses all revival effects. */
  deletedByEnemy = false;
  attacksFirst = false;
  /** The Chessmaster active: player units deal double damage to this enemy. */
  takesDoubleDamage = false;
  reflectFraction = 0;
  lifestealFraction = 0;
  /** Unit skips its next attack (clears after the skipped turn). */
  stunned = false;
  /** Remaining stun-on-hit charges. 0 = off, finite N = one-off/limited, Infinity = always. */
  stunOnHitCharges = 0;
  /** Redirect all attacks to the scout unit instead of the active player combatant. */
  targetsScout = false;
  /** Heal the active ally (eq[0]) by this amount after each exchange while this unit is in reserve. */
  healActiveAllyPerExchange = 0;
  /** Enemy attacks the lowest-curHp player combatant each exchange instead of the active. */
  targetsLowestHpPlayer = false;
  /** Enemy attacks the first reserve player slot (pq[1]) instead of the active (pq[0]). */
  targetsReservePlayer = false;
  /** Gain shields equal to overkill damage each time this enemy kills a player unit. */
  gainShieldOnKillOverkill = false;
  /** On death deal (dmg × this fraction) to the active player combatant. */
  explodeOnDeathFraction = 0;
  /** On death deal this flat amount of damage to the active player combatant (bypasses armor). */
  explodeOnDeathFlat = 0;
  /** Unit type string from the source card (e.g. "Infantry", "Vehicle"). Used for type-targeted effects. */
  unitType = "";
  /** Flat bonus damage applied after armor/shields when attacking a specific unit type (lowercased key). */
  bonusDmgVsType: Record<string, number> = {};
  /** Execute: instantly kill any player combatant whose curHp is below this fixed value (Sniper Squad). */
  executeBelowFixed = 0;
  /** Execute: instantly kill any player combatant whose curHp < (maxHp × this fraction) (Ravager). */
  executeBelowFraction = 0;
  /** Gain this much armor each time this unit deals damage. */
  gainArmorOnHit = 0;
  /** Grant this much shield to self each time this unit deals damage. */
  gainShieldOnHit = 0;
  /** Bonus armor fraction: effectiveArmor *= (1 + armorBonusFraction). Crawling Forge passive. */
  armorBonusFraction = 0;
  /** Thorn Hide: when damaged, deal this unit's current armor value back to the attacker. */
  reflectEqualToArmor = false;
  /** Cryo Spitter: stun the target every Nth attack (0 = off). */
  stunOnHitInterval = 0;
  /** Cryo Spitter: tracks how many attacks have been made for interval-stun. */
  stunHitCount = 0;
  /** Plasma Artillery / Inferno Artillery: fraction of damage (0=none, 0.5=half, 1=full) dealt to adjacent lanes. */
  splashAdjacentFraction = 0;
  /** Plasma Artillery / Inferno Artillery: unit types (lowercased) this enemy deals double effective damage to. */
  doubleDmgVsTypes: Set<string> = new Set();
  /** Annihilator Tank: deal half attack damage to the next reserve unit after killing the active player unit. */
  splashToReserveOnKill = false;
  /** Base damage before any per-exchange recalculation (e.g. Super Grunt). Set once at construction. */
  baseDmg = 0;
  /** Super Grunt: attack bonus = (maxHp - curHp) each exchange. */
  dmgPlusMissingHp = false;
  /** Shatter Cannon: shred this many shields from the target on each hit. */
  shredShieldOnHit = 0;
  /** Shatter Cannon: stun all remaining player units when this enemy kills one. */
  stunAllOnKill = false;
  /** High Praetor: after killing a player unit, reset armor to this value (0 = disabled). */
  armorResetOnKill = 0;
  /** Alpha Thorn Hide: only apply reflectFraction when the defender had shields at the start of the hit. */
  reflectOnlyWithShields = false;
  /** Black Rain / Titan: each attack also deals damage to active player combatants in all other lanes (resolved via callback). */
  attacksAllLanes = false;
  /** Oblivion Walker: gain this much flat attack each time this unit deals damage. */
  gainDmgOnHit = 0;
  /** Soul Eater: absorb half of attack and max HP from each player unit this enemy kills. */
  absorbHalfStatsOnKill = false;
  /** Machine Mind: absorb full attack, max HP, and armor from each player unit this enemy kills. */
  absorbFullStatsOnKill = false;
  /** Hydra: doubles attack and gains shields at each 25%-HP threshold crossed during combat. */
  hydraThresholdActive = false;
  /** Hydra: how many 25%-HP thresholds have already been crossed (tracks double-attack stacks and shield grants). */
  hydraThresholdsFired = 0;
  /** Blood Hunter: gain one additional attack (baseDmg added to dmg) per player unit killed. */
  bonusAttackOnKill = false;
  /** Cerberus face 2: gain this many flat attack points per player unit killed. */
  gainFlatDmgOnKill = 0;
  /** Cerberus face 3: gain this many armor points per player unit killed. */
  gainArmorOnKill = 0;
  /** Cerberus face 4: heal this many HP per player unit killed. */
  healSelfOnKill = 0;
  /** Manipulator: half of incoming player damage is redirected to the first reserve enemy. */
  halvesToReserveOnHit = false;
  /** Mobile Temple aura: active enemy heals this much HP each time it deals damage to a player. */
  healSelfFlatOnHit = 0;
  /** Icon of Fear: probability (0–1) of stunning the target player unit on each attack. */
  stunOnHitChance = 0;
  /** High Priest: heal all enemies in lane by this amount each exchange, and grant each healed enemy shields = healed. */
  healAllEnemiesOnAttack = 0;

  constructor(card: UnitCard | EnemyCard) {
    this.name = card.Name;
    this.dmg = toInt(card.Damage);
    this.baseDmg = this.dmg;
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
  c.unitType = (ui.card as any).Type ?? "";
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
  const hadShields = defender.curShields > 0;
  if (attacker.shredArmor && defender.armor > 0) {
    defender.armor -= Math.min(attacker.shredArmor, defender.armor);
  }
  // Shields absorb from the raw attack value — armor does not reduce damage to shields.
  let raw = attacker.dmg;
  if (defender.curShields > 0) {
    const shieldDmg = raw * attacker.shieldMultiplier;
    const absorbed = Math.min(defender.curShields, shieldDmg);
    defender.curShields -= absorbed;
    raw -= Math.floor(absorbed / attacker.shieldMultiplier);
  }
  // Armor reduces whatever gets through shields; minimum 1 only when damage remains.
  const baseArmor = attacker.ignoreArmor ? 0 : Math.max(0, defender.armor - attacker.pierceArmor);
  const effectiveArmor = defender.armorBonusFraction
    ? Math.floor(baseArmor * (1 + defender.armorBonusFraction))
    : baseArmor;
  let dealt = raw > 0 ? Math.max(1, raw - effectiveArmor) : 0;
  if (defender.reflectFraction && (!defender.reflectOnlyWithShields || hadShields)) {
    attacker.curHp -= Math.floor(dealt * defender.reflectFraction);
  }
  if (defender.reflectEqualToArmor && dealt > 0) {
    attacker.curHp -= defender.armor;
  }
  if (attacker.lifestealFraction) {
    attacker.curHp = Math.min(attacker.hp, attacker.curHp + Math.floor(dealt * attacker.lifestealFraction));
  }
  return dealt;
}

/** HP snapshot for one exchange, used by the client to render combat animations. */
export interface ExchangeData {
  playerUnitName: string;
  playerHpBefore: number;
  /** null when the player unit died this exchange. */
  playerHpAfter: number | null;
  playerMaxHp: number;
  enemyName: string;
  enemyHpBefore: number;
  /** null when the enemy died this exchange. */
  enemyHpAfter: number | null;
  enemyMaxHp: number;
}

export interface LaneCombatResult {
  overrun: boolean;
  playerSurvivors: Combatant[];
  enemySurvivors: Combatant[];
  totalShieldsAbsorbed: number;
  /** Populated only when exitAfterEachExchange is set — describes the one exchange that just ran. */
  lastExchange?: ExchangeData;
}

export interface LaneCombatOptions {
  /** Tag Team passive: flat bonus damage added to the enemy after each player attack. */
  bonusPlayerDmgPerAttack?: number;
  /** You Shall Not Pass: fires once when the first player unit dies. */
  onFirstPlayerDeath?: (dying: Combatant, currentEnemy: Combatant) => void;
  /** Whites of Their Eyes: doubles damage on both sides for the first exchange. */
  doubleFirstAttack?: boolean;
  /** Punch Through: fires each time an enemy is killed. */
  onEnemyKill?: (killer: Combatant) => void;
  /** Scorpions / redirect: called instead of normal enemy→player damage each time the enemy attacks.
   *  The callback is responsible for applying damage elsewhere (e.g. to the scout). */
  onEnemyAttack?: (attacker: Combatant) => void;
  /** Shard Beast / splash: called after normal enemy attack with the damage actually dealt,
   *  so the callback can apply secondary effects (e.g. half damage to adjacent lanes). */
  onAfterEnemyAttack?: (attacker: Combatant, dmgDealt: number) => void;
  /** Emmiter passive: flat HP damage (ignores armor/shields) applied to every Infantry player
   *  combatant at the top of each exchange before attacks resolve. */
  perExchangeInfantryDoT?: number;
  /** Totem of Decay passive: flat HP damage applied to every non-Mechanical (non-Vehicle/Mech) player
   *  combatant at the top of each exchange. */
  perExchangeNonMechDoT?: number;
  /** Puppeteer passive: after each player attack, the attacker also deals its raw dmg to a random
   *  reserve ally (pq[1+]). Deaths from friendly fire are swept at the end of each exchange. */
  splashAllyOnPlayerAttack?: boolean;
  /** Black Rail passive: fires instead of the normal enemy attack; receives the live player queue
   *  so the callback can target the active or reserve group as appropriate. */
  enemyGroupAttack?: (attacker: Combatant, pq: Combatant[]) => void;
  /** Death Cloak passive: while set, enemy HP is floored at 1 after player attacks; overflow
   *  damage is redirected to the Death Cloak combatant found in the enemy queue. The floor
   *  deactivates automatically once Death Cloak is removed from eq. */
  deathCloakFloor?: boolean;
  /** Alpha Storm Claw passive: hits accumulate +1 per exchange on the same target; resets to 0 on kill. */
  stackAttacksOnSameTarget?: boolean;
  /** Rotation combat system: stop after the active enemy (eq[0]) is killed so the outer loop can
   *  rotate to the next lane before continuing. Does not stop on reserve-enemy incidental kills. */
  exitAfterFirstEnemyKill?: boolean;
  /** Mid-combat action system: stop after a single exchange (one round of attacks across all
   *  participants) so the engine can emit exchange data and await player actions before continuing. */
  exitAfterEachExchange?: boolean;
}

/** Default: both sides attack simultaneously each exchange — deaths resolve after both attacks land.
 * p.attacksFirst: player strikes first; if enemy dies the enemy cannot retaliate.
 * e.attacksFirst: enemy strikes first; if the active player unit dies it cannot retaliate. */
export function resolveLaneCombat(
  playerCombatants: Combatant[],
  enemyCombatants: Combatant[],
  options: LaneCombatOptions = {}
): LaneCombatResult {
  const {
    bonusPlayerDmgPerAttack = 0,
    onFirstPlayerDeath,
    doubleFirstAttack = false,
    onEnemyKill,
    onEnemyAttack,
    onAfterEnemyAttack,
    perExchangeInfantryDoT = 0,
    perExchangeNonMechDoT = 0,
    splashAllyOnPlayerAttack = false,
    enemyGroupAttack,
    deathCloakFloor = false,
    stackAttacksOnSameTarget = false,
    exitAfterFirstEnemyKill = false,
    exitAfterEachExchange = false,
  } = options;
  let lastExchange: ExchangeData | undefined;
  const pq = [...playerCombatants];
  const eq = [...enemyCombatants];
  let totalShieldsAbsorbed = 0;
  let deathCb = onFirstPlayerDeath;
  let firstExchangeDone = false;
  let alphaStack = 0; // Alpha Storm Claw: extra hits per exchange on same target; resets on kill
  const fireDeathCb = (dying: Combatant) => {
    if (deathCb && eq[0]) { deathCb(dying, eq[0]); deathCb = undefined; }
  };
  const fireKillCb = (killer: Combatant) => { if (onEnemyKill) onEnemyKill(killer); };
  const dmgMult = () => (doubleFirstAttack && !firstExchangeDone) ? 2 : 1;

  const enemyAttacks = (e: Combatant, p: Combatant, mult: number) => {
    if (e.stunned) { e.stunned = false; return; }
    if (enemyGroupAttack) { enemyGroupAttack(e, pq); return; }
    if (onEnemyAttack) {
      onEnemyAttack(e);
      return;
    }
    if (e.dmgPlusMissingHp) e.dmg = e.baseDmg + Math.max(0, e.hp - e.curHp); // Super Grunt: recompute each attack
    const pBefore = p.curShields;
    const eDmg = computeDealt(e, p) * mult;
    p.curHp -= eDmg;
    totalShieldsAbsorbed += pBefore - p.curShields;
    // Type-targeted bonus damage (e.g. Burner: +5 vs Infantry). Applied after armor; bypasses armor.
    const typeBonus = Object.entries(e.bonusDmgVsType)
      .find(([t]) => p.unitType.toLowerCase() === t)?.[1] ?? 0;
    if (typeBonus > 0) p.curHp -= typeBonus;
    // Double damage vs type (e.g. Plasma Artillery vs Vehicle/Mech): deal effective damage a second time.
    if (eDmg > 0 && e.doubleDmgVsTypes.has(p.unitType.toLowerCase().replace(/s$/, ""))) p.curHp -= eDmg;
    const totalDmg = eDmg + typeBonus;
    if (totalDmg > 0) {
      if (e.stunOnHitCharges > 0) { p.stunned = true; if (isFinite(e.stunOnHitCharges)) e.stunOnHitCharges--; }
      if (e.stunOnHitInterval > 0) { e.stunHitCount++; if (e.stunHitCount % e.stunOnHitInterval === 0) p.stunned = true; }
      if (e.stunOnHitChance > 0 && Math.random() < e.stunOnHitChance) p.stunned = true;
      if (e.gainArmorOnHit > 0) e.armor += e.gainArmorOnHit;
      if (e.gainShieldOnHit > 0) e.curShields += e.gainShieldOnHit;
      if (e.gainDmgOnHit > 0) { e.dmg += e.gainDmgOnHit; e.baseDmg += e.gainDmgOnHit; }
      if (e.shredShieldOnHit > 0) p.curShields = Math.max(0, p.curShields - e.shredShieldOnHit);
      if (e.healSelfFlatOnHit > 0) e.curHp = Math.min(e.hp, e.curHp + e.healSelfFlatOnHit);
      if (onAfterEnemyAttack) onAfterEnemyAttack(e, eDmg);
    }
  };

  const playerAttacks = (p: Combatant, e: Combatant, mult: number) => {
    if (p.stunned) { p.stunned = false; return; }
    const eBefore = e.curShields;
    let pDmg = computeDealt(p, e) * mult * (e.takesDoubleDamage ? 2 : 1);
    // Manipulator passive: redirect half of dealt damage to the first reserve enemy.
    if (e.halvesToReserveOnHit && eq.length > 1) {
      const redirected = Math.floor(pDmg / 2);
      eq[1].curHp -= redirected;
      pDmg -= redirected;
    }
    e.curHp -= pDmg + bonusPlayerDmgPerAttack;
    totalShieldsAbsorbed += eBefore - e.curShields;
    if (p.stunOnHitCharges > 0 && pDmg > 0) { e.stunned = true; if (isFinite(p.stunOnHitCharges)) p.stunOnHitCharges--; }
    if (splashAllyOnPlayerAttack && pq.length > 1) {
      const allyIdx = 1 + Math.floor(Math.random() * (pq.length - 1));
      pq[allyIdx].curHp -= p.dmg;
    }
  };

  // Death Cloak passive: floor the attacked enemy at 1 HP; redirect overflow to Death Cloak in reserve.
  // No-ops when Death Cloak is the active target, already dead, or not in the queue.
  const applyDeathCloakFloor = (target: Combatant) => {
    if (!deathCloakFloor || target.curHp >= 1 || target.name === "Death Cloak") return;
    const dc = eq.find((c) => c.name === "Death Cloak");
    if (!dc) return; // Death Cloak already gone — floor lifted.
    const overflow = 1 - target.curHp;
    target.curHp = 1;
    dc.curHp -= overflow;
    if (dc.curHp <= 0) eq.splice(eq.indexOf(dc), 1);
  };

  // Sniper Squad / Ravager: instantly kill player units whose HP falls below the execute threshold.
  const executeCheck = (activeEnemy: Combatant) => {
    for (let j = pq.length - 1; j >= 0; j--) {
      const pc = pq[j];
      const fixed = activeEnemy.executeBelowFixed;
      const frac = activeEnemy.executeBelowFraction > 0 ? Math.floor(pc.hp * activeEnemy.executeBelowFraction) : 0;
      const thresh = Math.max(fixed, frac);
      if (thresh > 0 && pc.curHp > 0 && pc.curHp < thresh) {
        pc.curHp = 0;
        if (j === 0) fireDeathCb(pc);
        pq.splice(j, 1);
      }
    }
  };

  while (pq.length && eq.length) {
    // Snapshot active combatant HP before any exchange code runs (for ExchangeData on exit).
    const _xPName = pq[0]?.name ?? "";
    const _xPHp   = pq[0]?.curHp ?? 0;
    const _xPMax  = pq[0]?.hp ?? 0;
    const _xEName = eq[0]?.name ?? "";
    const _xEHp   = eq[0]?.curHp ?? 0;
    const _xEMax  = eq[0]?.hp ?? 0;
    // Emmiter passive: bypass-armor DoT on Infantry player combatants before each exchange.
    if (perExchangeInfantryDoT > 0) {
      for (const pc of pq) {
        if (pc.unitType.toLowerCase() === "infantry") pc.curHp -= perExchangeInfantryDoT;
      }
      let j = 0;
      while (j < pq.length) {
        if (pq[j].curHp <= 0) { if (j === 0) fireDeathCb(pq[j]); pq.splice(j, 1); }
        else j++;
      }
      if (!pq.length) break;
    }
    if (perExchangeNonMechDoT > 0) {
      const mechTypes = new Set(["vehicle", "mech", "mechanised"]);
      for (const pc of pq) {
        if (!mechTypes.has(pc.unitType.toLowerCase())) pc.curHp -= perExchangeNonMechDoT;
      }
      let k = 0;
      while (k < pq.length) {
        if (pq[k].curHp <= 0) { if (k === 0) fireDeathCb(pq[k]); pq.splice(k, 1); }
        else k++;
      }
      if (!pq.length) break;
    }
    if (eq[0]) executeCheck(eq[0]);
    if (!pq.length) break;
    const p = pq[0]; // active player — always retaliates
    const e = eq[0];
    const mult = dmgMult();
    // Lance Turret / Shadow Knight: enemy may target a non-active player unit.
    const eTargetIdx = e.targetsLowestHpPlayer
      ? pq.reduce((minI, c, i) => c.curHp < pq[minI].curHp ? i : minI, 0)
      : (e.targetsReservePlayer && pq.length > 1) ? 1
      : 0;
    const eTarget = pq[eTargetIdx];
    if (p.attacksFirst) {
      // Player strikes first — enemy cannot retaliate if killed this exchange.
      playerAttacks(p, e, mult);
      applyDeathCloakFloor(e);
      if (e.curHp <= 0) {
        firstExchangeDone = true;
        if (pq[0]) {
          if (e.explodeOnDeathFraction > 0) pq[0].curHp -= Math.floor(e.dmg * e.explodeOnDeathFraction);
          if (e.explodeOnDeathFlat > 0) pq[0].curHp -= e.explodeOnDeathFlat;
        }
        fireKillCb(p); eq.shift();
        if (exitAfterFirstEnemyKill) break;
        continue;
      }
      enemyAttacks(e, eTarget, mult);
    } else if (e.attacksFirst) {
      // Enemy strikes first — active player unit cannot retaliate if killed this exchange.
      enemyAttacks(e, eTarget, mult);
      if (eTargetIdx === 0 && eTarget.curHp <= 0) {
        firstExchangeDone = true;
        if (e.gainShieldOnKillOverkill && eTarget.curHp < 0) e.curShields += Math.abs(eTarget.curHp);
        if (e.deleteOnKill) eTarget.deletedByEnemy = true;
        fireDeathCb(eTarget); pq.splice(0, 1);
        if (e.splashToReserveOnKill && pq.length > 0) pq[0].curHp -= Math.floor(e.dmg / 2);
        if (e.stunAllOnKill) for (const pc of pq) pc.stunned = true;
        if (e.armorResetOnKill > 0) e.armor = e.armorResetOnKill;
        if (e.absorbHalfStatsOnKill) { e.dmg += Math.floor(eTarget.dmg / 2); e.hp += Math.floor(eTarget.hp / 2); e.curHp += Math.floor(eTarget.hp / 2); }
        if (e.absorbFullStatsOnKill) { e.dmg += eTarget.dmg; e.hp += eTarget.hp; e.curHp += eTarget.hp; e.armor += eTarget.armor; e.baseDmg += eTarget.dmg; }
        if (e.bonusAttackOnKill) { e.dmg += e.baseDmg; }
        if (e.gainFlatDmgOnKill > 0) { e.dmg += e.gainFlatDmgOnKill; e.baseDmg += e.gainFlatDmgOnKill; }
        if (e.gainArmorOnKill > 0) e.armor += e.gainArmorOnKill;
        if (e.healSelfOnKill > 0) e.curHp = Math.min(e.hp, e.curHp + e.healSelfOnKill);
        continue;
      }
      playerAttacks(p, e, mult);
      applyDeathCloakFloor(e);
    } else {
      // Default: simultaneous — both attack, deaths resolve after both land.
      enemyAttacks(e, eTarget, mult);
      // Alpha Storm Claw stacking: +1 additional hit per consecutive exchange on the same target.
      for (let h = 0; h < alphaStack && eTarget.curHp > 0; h++) {
        enemyAttacks(e, eTarget, mult);
      }
      playerAttacks(p, e, mult);
      applyDeathCloakFloor(e);
    }
    firstExchangeDone = true;
    if (eTarget.curHp <= 0) {
      if (e.gainShieldOnKillOverkill && eTarget.curHp < 0) e.curShields += Math.abs(eTarget.curHp);
      if (e.deleteOnKill) eTarget.deletedByEnemy = true;
      fireDeathCb(eTarget); pq.splice(eTargetIdx, 1);
      if (eTargetIdx === 0 && e.splashToReserveOnKill && pq.length > 0) pq[0].curHp -= Math.floor(e.dmg / 2);
      if (e.stunAllOnKill) for (const pc of pq) pc.stunned = true;
      if (eTargetIdx === 0 && e.armorResetOnKill > 0) e.armor = e.armorResetOnKill;
      if (eTargetIdx === 0 && e.absorbHalfStatsOnKill) { e.dmg += Math.floor(eTarget.dmg / 2); e.hp += Math.floor(eTarget.hp / 2); e.curHp += Math.floor(eTarget.hp / 2); }
      if (eTargetIdx === 0 && e.absorbFullStatsOnKill) { e.dmg += eTarget.dmg; e.hp += eTarget.hp; e.curHp += eTarget.hp; e.armor += eTarget.armor; e.baseDmg += eTarget.dmg; }
      if (eTargetIdx === 0 && e.bonusAttackOnKill) { e.dmg += e.baseDmg; }
      if (e.gainFlatDmgOnKill > 0) { e.dmg += e.gainFlatDmgOnKill; e.baseDmg += e.gainFlatDmgOnKill; }
      if (e.gainArmorOnKill > 0) e.armor += e.gainArmorOnKill;
      if (e.healSelfOnKill > 0) e.curHp = Math.min(e.hp, e.curHp + e.healSelfOnKill);
      if (stackAttacksOnSameTarget) alphaStack = 0; // target killed — reset stack for new target
    } else if (stackAttacksOnSameTarget) {
      alphaStack++; // same target survived — stack grows
    }
    if (e.curHp <= 0) {
      if (pq[0]) {
        if (e.explodeOnDeathFraction > 0) pq[0].curHp -= Math.floor(e.dmg * e.explodeOnDeathFraction);
        if (e.explodeOnDeathFlat > 0) pq[0].curHp -= e.explodeOnDeathFlat;
      }
      fireKillCb(pq[0] ?? p); eq.shift();
      if (exitAfterFirstEnemyKill) break;
    }
    // Reserve enemy healers (e.g. Cleric passive): heal the active enemy after each exchange.
    if (eq[0]) {
      for (let i = 1; i < eq.length; i++) {
        if (eq[i].healActiveAllyPerExchange > 0) {
          eq[0].curHp = Math.min(eq[0].hp, eq[0].curHp + eq[i].healActiveAllyPerExchange);
        }
      }
    }
    // High Priest passive: heal all enemies in lane by N and grant shields = healed after each exchange.
    for (const healer of eq) {
      if (healer.healAllEnemiesOnAttack <= 0) continue;
      for (const ally of eq) {
        const healed = Math.min(healer.healAllEnemiesOnAttack, ally.hp - ally.curHp);
        if (healed > 0) { ally.curHp += healed; ally.curShields += healed; }
      }
    }
    // Hydra passive: for each new 25%-HP threshold crossed, double attack and gain shields = curHp.
    for (const en of eq) {
      if (!en.hydraThresholdActive || en.hp <= 0) continue;
      const thresholdsCrossed = Math.min(3, Math.floor((en.hp - Math.max(0, en.curHp)) / (en.hp * 0.25)));
      while (en.hydraThresholdsFired < thresholdsCrossed) {
        en.dmg *= 2;
        en.baseDmg *= 2;
        en.curShields += Math.max(0, en.curHp);
        en.hydraThresholdsFired++;
      }
    }
    // Execute check: kill any player unit whose HP fell below the threshold this exchange.
    if (eq[0]) executeCheck(eq[0]);
    // Puppeteer passive / Black Rail reserve-mode: sweep reserve units that died this exchange.
    if (splashAllyOnPlayerAttack || enemyGroupAttack) {
      for (let j = pq.length - 1; j >= 1; j--) {
        if (pq[j].curHp <= 0) pq.splice(j, 1);
      }
    }
    // Mid-combat action window: exit after one full exchange so the engine can prompt players.
    if (exitAfterEachExchange) {
      lastExchange = {
        playerUnitName: _xPName,
        playerHpBefore: _xPHp,
        playerHpAfter: pq.some(c => c.name === _xPName) ? (pq.find(c => c.name === _xPName)!.curHp) : null,
        playerMaxHp: _xPMax,
        enemyName: _xEName,
        enemyHpBefore: _xEHp,
        enemyHpAfter: eq.some(c => c.name === _xEName) ? (eq.find(c => c.name === _xEName)!.curHp) : null,
        enemyMaxHp: _xEMax,
      };
      break;
    }
  }
  return { overrun: eq.length > 0, playerSurvivors: pq, enemySurvivors: eq, totalShieldsAbsorbed, lastExchange };
}
