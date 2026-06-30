import { toInt, type GearCard } from "./data.js";
import { Combatant } from "./combat.js";
import { eventSeverity } from "./events.js";
import { RANK_NUM } from "./constants.js";
import { canActivateAbility, canAfford, canUseEffect, GEAR_COST_KEYS, grantShields, healUnit, makeUnitInstance, pay, recordAbilityActivation, recordEffectUse, weakestPlayer, type RoundTempState } from "./state.js";
import type { GamePlayer, GameState, UnitInstance } from "./types.js";

/** Name-keyed dispatch tables, ported 1:1 from Working/sim.py -- Gear has fewer cards with more
 * genuinely distinct effects than Units/Enemies, so it's dispatched by exact name rather than
 * keyword-classified, same as Command Cards. */
const GEAR_IGNORE_ARMOR = new Set(["Ion Weapons", "Nanite Tech", "Magnetized Barrels", "Toxin Rounds"]);
const GEAR_DOUBLE_VS_SHIELDS = new Set(["Plasma Weapons"]);
const GEAR_SHRED_ARMOR: Record<string, number> = { "Explosive Rounds": 999, "Chem Strike": 5 };
const GEAR_FIRST_HIT_FREE = new Set(["Basic Camo", "Shadow Tech", "Exosuit"]);
const GEAR_DELETE_ON_KILL = new Set(["Apocalypse Rounds", "Black Iron"]);

const GEAR_RESERVE_HEAL: Record<string, number> = { "Basic Medkit": 2, Medkit: 3, "Field Medkit": 4, "Triage Pack": 5 };
const GEAR_PRECOMBAT_HEAL: Record<string, number> = { "Regen Plates": 4, "Repair Kit": 3 };
const GEAR_PRECOMBAT_SHIELD: Record<string, number> = { "Shield Generator": 5, "Deployable Shield": 10 };

function roll1to6(): number {
  return 1 + Math.floor(Math.random() * 6);
}

function unitsOf(p: GamePlayer): UnitInstance[] {
  return [...(p.active ? [p.active] : []), ...p.reserve];
}

export function applyGearCombatMods(c: Combatant, ui: UnitInstance, commanderRank = 1, p?: GamePlayer, playerProgress = 0) {
  const names = new Set(ui.equipped.filter((g) => "Name" in (g as any)).map((g) => (g as any).Name as string));
  // Gunsmith passive: each Weapon-type gear adds +Progress damage
  if (p?.tactician?.Name === "The Gunsmith" && playerProgress > 0) {
    const weaponCount = ui.equipped.filter((g) => (g as any).Type === "Weapon").length;
    if (weaponCount > 0) c.dmg += weaponCount * playerProgress;
  }
  // Bulwark passive: each Armor-type gear adds +3 armor
  if (p?.tactician?.Name === "The Bulwark") {
    const armorCount = ui.equipped.filter((g) => (g as any).Type === "Armor").length;
    if (armorCount > 0) c.armor += armorCount * 3;
  }
  if ([...names].some((n) => GEAR_IGNORE_ARMOR.has(n))) c.ignoreArmor = true;
  if ([...names].some((n) => GEAR_DOUBLE_VS_SHIELDS.has(n))) c.shieldMultiplier = 2;
  for (const [n, amt] of Object.entries(GEAR_SHRED_ARMOR)) {
    if (names.has(n)) c.shredArmor = Math.max(c.shredArmor, amt);
  }
  if ([...names].some((n) => GEAR_FIRST_HIT_FREE.has(n))) c.firstHitPrevented = true;
  // Smoke Pack: "When under Half HP cannot be targeted by abilities" — ability immunity checked
  // at reveal dispatch in game.ts; no combat-stat change here.
  // Laser Designator: "Other units can target your lane when attacking" — no-op; Long Range already
  // handles cross-lane targeting for units with the long_range tag; this gear has no additional hook.
  if (names.has("Slayer Suit")) c.shieldsOnDmgFraction = 0.25;
  if ([...names].some((n) => GEAR_DELETE_ON_KILL.has(n))) c.deleteOnKill = true;
  if ((ui.charges["Holographic Decoys"] ?? 0) > 0) {
    ui.charges["Holographic Decoys"] -= 1;
    c.firstHitPrevented = true;
  }
  // Uranium Rounds: "+2 damage for consecutive hits" -- the exact same stacking counter the
  // Unit-side consecutive_damage keyword already tracks every round in applyPrecombatUnit,
  // just consumed by name here instead of by tag.
  if (names.has("Uranium Rounds")) c.dmg += (ui.charges["consecutive_hits"] ?? 0) * 2;
  // Prototype Weapons: "This item stats * (2x rank of commander)" -- equippedBonus() already
  // counted this item's printed Damage once; add the rest of the multiplier on top so the total
  // scales with the CURRENT commander's rank every round, not a one-time equip-time snapshot.
  const proto = ui.equipped.find((g) => (g as any).Name === "Prototype Weapons") as any;
  if (proto) {
    const base = toInt(proto.Damage);
    c.dmg += base * (2 * commanderRank - 1);
  }
}

/** Chronostasis Passive: destroy the item to fully heal and remove the unit from this round's
 * combat instead of dying. Checked at every point a unit would otherwise die, before
 * tryReviveOnce (engine/units.ts). */
export function tryChronostasisSave(game: GameState, p: GamePlayer, ui: UnitInstance, log: (t: string) => void): boolean {
  const key = `Chronostasis-${ui.id}`;
  if (ui.equipped.some((g) => (g as any).Name === "Chronostasis") && canUseEffect(game, key, 1)) {
    recordEffectUse(game, key);
    ui.equipped = ui.equipped.filter((g) => (g as any).Name !== "Chronostasis");
    ui.curHp = ui.maxHp;
    log(`  [Chronostasis] ${p.name}'s ${ui.card.Name} is saved from death and pulled out of this round's combat`);
    return true;
  }
  return false;
}

/** Passives that resolve once, right before this lane's combat: reserve-unit healers, pre-round
 * self-heal/shield, charge rolls, the dice-roll defensive items, and then auto-activating every
 * affordable Active effect on equipped gear (sim.py has no choice here either -- if affordable,
 * it fires; making this a real human decision is a later stage, same as it was for Command
 * Cards before that became one). */
export function applyPrecombatGear(game: GameState, p: GamePlayer, log: (t: string) => void, tempState: RoundTempState) {
  const activeUnit = p.active;
  const allUnits = unitsOf(p);

  for (const ui of [...p.reserve]) {
    for (const g of ui.equipped) {
      const amt = GEAR_RESERVE_HEAL[(g as any).Name];
      if (amt && activeUnit) {
        const healed = healUnit(activeUnit, amt, game);
        if (healed) { p.stats.healsGiven += 1; p.stats.healedHp += healed; }
      }
    }
  }

  for (const ui of allUnits) {
    for (const g of ui.equipped) {
      const name = (g as any).Name as string | undefined;
      if (!name) continue;
      if (name in GEAR_PRECOMBAT_HEAL) healUnit(ui, GEAR_PRECOMBAT_HEAL[name], game);
      if (name in GEAR_PRECOMBAT_SHIELD) grantShields(ui, GEAR_PRECOMBAT_SHIELD[name], p);
      if (name === "XVL3" || name === "XVL33") {
        const roll = roll1to6();
        ui.charges[name] = roll;
        const perChargeDmg = name === "XVL3" ? 4 : 10;
        const perChargeSelf = name === "XVL3" ? 2 : 5;
        tempState.tempBuff(ui, { Damage: roll * perChargeDmg });
        ui.curHp = Math.max(1, ui.curHp - roll * perChargeSelf);
      }
      if (name === "Holographic Decoys") {
        ui.charges["Holographic Decoys"] = roll1to6();
      }
      if (name === "Quantum Plates") {
        const roll = roll1to6();
        ui.charges["Quantum Plates Roll"] = roll;
        if (roll === 2 || roll === 3) tempState.tempBuff(ui, { Armor: -4 });
        else if (roll === 4 || roll === 5) tempState.tempBuff(ui, { Armor: 6 });
        else if (roll === 6) ui.curHp = 0;
      }
      if (name === "Shield Projector") {
        // Shared pool drawn collectively by all units in the lane during combat — not distributed.
        const pool = p.tactician?.Name === "The Bastion" ? 120 : 60;
        p.sharedShieldPool = pool;
      }
      if (name === "Slayer Suit") grantShields(ui, 5, p);
      if (name === "Exosuit") tempState.tempBuff(ui, { Armor: 3 });
      // Night Vision Passive: "Unit gets a free attack against Revealed enemies" — fires a bonus
      // attack (unit's Damage as a temp buff for this round) only if the front enemy in this lane
      // is currently in revealedEnemyNames (scouted or triggered their reveal ability).
      if (name === "Night Vision") {
        const frontEnemy = p.laneEnemyReserve[0];
        if (frontEnemy && game.revealedEnemyNames.has(frontEnemy.Name)) {
          tempState.tempBuff(ui, { Damage: toInt(ui.card.Damage) });
          log(`  [Night Vision] ${ui.card.Name} gets +${toInt(ui.card.Damage)} damage vs revealed ${frontEnemy.Name}`);
        }
      }
      // Reanimator Passive: "Can be played at any time, Return last killed enemy to combat
      // under your control with this item equipped" -- consumes game.lastKilledEnemy once,
      // adding it to this player's reserve as a controlled unit (same instancing as any other
      // unit, equipped with this same Reanimator so it carries over to its next death too).
      if (name === "Reanimator" && game.lastKilledEnemy) {
        const revived = makeUnitInstance({ ...(game.lastKilledEnemy as any), Rank: "Conscript" } as any);
        revived.equipped.push(g);
        ui.equipped = ui.equipped.filter((eq) => eq !== g);
        if (!p.active) p.active = revived;
        else p.reserve.push(revived);
        log(`  [Reanimator] ${p.name} returns ${game.lastKilledEnemy.Name} to combat under their control`);
        game.lastKilledEnemy = null;
      }
      // Grenade Launcher Passive: "Deal 1/2 attack damage before combat" -- fires once on the
      // active unit only (reserve units don't attack). Uses unit's printed Damage, no armor reduction.
      if (name === "Grenade Launcher" && ui === p.active && p.laneEnemyReserve.length) {
        const halfDmg = Math.floor(toInt(ui.card.Damage) / 2);
        if (halfDmg > 0) {
          const t = p.laneEnemyReserve[0];
          const remaining = toInt(t.HP) - halfDmg;
          if (remaining <= 0) {
            p.laneEnemyReserve.shift();
            log(`  [Grenade Launcher] ${p.name}'s precombat shot kills ${t.Name}`);
          } else {
            p.laneEnemyReserve[0] = { ...t, HP: String(remaining) };
            log(`  [Grenade Launcher] ${p.name}'s precombat shot deals ${halfDmg} to ${t.Name} (${remaining} HP left)`);
          }
        }
      }
    }
  }

  const PRECOMBAT_ONLY_ACTIVE = new Set(["XVL3", "XVL33", "Holographic Decoys"]);
  // Slayer Suit active fires mid-combat (game.ts Phase 2) after an enemy drops below 1/4 HP,
  // so it must NOT auto-activate in the pre-combat pass.
  const MIDCOMBAT_ONLY_ACTIVE = new Set(["Slayer Suit"]);
  for (const ui of allUnits) {
    for (const g of [...ui.equipped]) {
      const card = g as any;
      const name = card.Name as string | undefined;
      if (!name || !card.Active?.trim() || PRECOMBAT_ONLY_ACTIVE.has(name) || MIDCOMBAT_ONLY_ACTIVE.has(name)) continue;
      if (name === "Emergency Extractor" && ui.curHp >= Math.floor(ui.maxHp / 2)) continue;
      const isConsumable = card.Type === "Consumable";
      // Activation cost = Tech equal to the gear's rank value (separate from the equip purchase
      // cost). Gear-freeze Events double this; their Completion Reward waives it entirely.
      const doubled = game.gearActiveCostDoubledType === card.Type || game.gearActiveCostDoubledType === "any";
      const isFreeType = game.gearActiveFreeType === card.Type || game.gearActiveFreeType === "any";
      const rankCost = RANK_NUM[card["Rank Name"]] ?? 1;
      if (!canActivateAbility(game, ui.id, name)) continue;
      const freeKey = `${ui.id}-${name}`;
      const isFree = game.freeAbilityNextUse.has(freeKey);
      if (isFree) game.freeAbilityNextUse.delete(freeKey);
      const activationTech = (isFree || isFreeType) ? 0 : doubled ? rankCost * 2 : rankCost;
      if (!isConsumable && p.res.Tech < activationTech) continue;
      if (!isConsumable && activationTech > 0) p.res.Tech -= activationTech;
      applyGearActive(game, name, ui, p, log, tempState);
      recordAbilityActivation(game, p.seatIndex, ui.id, name);
      if (isConsumable) ui.equipped = ui.equipped.filter((x) => x !== g);
      log(`  ${p.name} activates ${ui.card.Name}'s ${name}${isConsumable ? " (consumable)" : activationTech > 0 ? ` (-${activationTech} Tech)` : " (free)"}`);
    }
  }
}

/** Active Effects for equipped Gear. Ported close to 1:1 from sim.py's apply_gear_active,
 * including its own existing simplifications. Expanded Backpack/Resupply Drone/Smoke Launcher/
 * Night Vision/Reanimator were sim.py-side no-ops (no cooldown/scouting/status-effect subsystem
 * existed) -- now implemented here with reasonable mechanical analogs to the closest systems
 * that DO exist in this engine (effectUses' per-effect cap counters, the round's scout reveal
 * count, tempState's temp-buff list, item-transfer same as Nanite Tech). This is intentionally
 * beyond what sim.py itself ever did for these 5 -- see the webapp README for the audit that
 * found them. */
function applyGearActive(
  game: GameState,
  name: string,
  ui: UnitInstance,
  p: GamePlayer,
  log: (t: string) => void,
  tempState: RoundTempState
) {
  const w = weakestPlayer(game);
  const other = game.players.find((q) => q !== p) ?? p;
  // Engineer passive: utility gear actives get +1 additional target (different from the 1st)
  const isEngineer = p.tactician?.Name === "The Engineer" && ui.equipped.some((g) => (g as any).Name === name && (g as any).Type === "Utility");

  switch (name) {
    case "Combat Stims": {
      const dmg = ui.curHp > 1 ? Math.min(10, ui.curHp - 1) : 0;
      ui.curHp -= dmg;
      tempState.tempBuff(ui, { Damage: dmg * 2 });
      break;
    }
    case "Grenade Launcher":
    case "Scoped Weapons":
    case "Black Iron":
      if (w.laneEnemyReserve.length) w.laneEnemyReserve = w.laneEnemyReserve.slice(isEngineer ? 2 : 1);
      break;
    case "Grenades":
      w.laneEnemyReserve = w.laneEnemyReserve.filter((e) => toInt(e.HP) > 5);
      break;
    case "Scouting Drones":
      p.res.Organic += 2;
      p.res.Tech += 2;
      p.res.Alien += 2;
      break;
    case "Basic Exo": {
      const owned = unitsOf(p);
      if (!owned.includes(ui)) break;
      const hasSuit = ui.equipped.some((g) => (g as any).Name === "Slayer Suit");
      // Slayer Suit cannot enter reserve — only allow move if target lane's active slot is free
      if (hasSuit && w.active !== null) break;
      if (p.active === ui) p.active = p.reserve.length ? p.reserve[0] : null;
      else p.reserve = p.reserve.filter((u) => u !== ui);
      if (!w.active) w.active = ui;
      else w.reserve.push(ui);
      break;
    }
    case "Basic Medkit":
    case "Medkit":
    case "Field Medkit": {
      const targets = unitsOf(w).filter((u) => u.curHp < u.maxHp).sort((a, b) => (a.curHp - a.maxHp) - (b.curHp - b.maxHp));
      const healCount = isEngineer ? 2 : 1;
      for (const t of targets.slice(0, healCount)) {
        const medkitHealed = healUnit(t, Math.floor(t.maxHp / 2) + 1, game);
        if (medkitHealed) { w.stats.healsGiven += 1; w.stats.healedHp += medkitHealed; }
      }
      break;
    }
    case "Triage Pack": {
      const targets = unitsOf(w).filter((u) => u.curHp < u.maxHp).sort((a, b) => (a.curHp - a.maxHp) - (b.curHp - b.maxHp));
      const healCount = isEngineer ? 2 : 1;
      for (const t of targets.slice(0, healCount)) {
        const triageHealed = healUnit(t, undefined, game);
        if (triageHealed) { w.stats.healsGiven += 1; w.stats.healedHp += triageHealed; }
      }
      break;
    }
    case "Landmines":
    case "Artillery Strike":
    case "Bomber Drone":
    case "Chem Strike":
    case "Reactive Plating":
      w.laneEnemyReserve = w.laneEnemyReserve.filter((e) => toInt(e.HP) > (name === "Reactive Plating" ? 15 : 10));
      break;
    case "Toxin Rounds":
      for (const q of game.players) {
        q.laneEnemyReserve = q.laneEnemyReserve.filter((e) => toInt(e.HP) > q.rank * 3);
      }
      break;
    case "Shield Pack":
      grantShields(ui, 20, p);
      ui.equipped = ui.equipped.filter((g) => (g as any).Name !== "Shield Pack");
      break;
    case "Entrenchment":
      if (w.active) tempState.tempBuff(w.active, { Armor: 5 });
      if (isEngineer && w.reserve[0]) tempState.tempBuff(w.reserve[0], { Armor: 5 });
      break;
    case "Stun Grenades": {
      const target = game.players.reduce((a, b) => (b.laneEnemyReserve.length > a.laneEnemyReserve.length ? b : a));
      if (target.laneEnemyReserve.length) target.laneEnemyReserve = target.laneEnemyReserve.slice(isEngineer ? 2 : 1);
      break;
    }
    case "Deployable Sentry":
      if (w.active) tempState.tempBuff(w.active, { Damage: 5 });
      if (isEngineer && w.reserve[0]) tempState.tempBuff(w.reserve[0], { Damage: 5 });
      break;
    case "Heavy Sentry":
      if (w.active) tempState.tempBuff(w.active, { Damage: 7 });
      if (isEngineer && w.reserve[0]) tempState.tempBuff(w.reserve[0], { Damage: 7 });
      break;
    case "Isolation Field":
      if (w.laneEnemyReserve.length) w.laneEnemyReserve = w.laneEnemyReserve.slice(0, 1);
      break;
    case "Railgun Tech": {
      const cap = toInt(ui.card.Damage);
      for (const q of game.players) {
        q.laneEnemyReserve = q.laneEnemyReserve.filter((e) => toInt(e.HP) > cap);
      }
      break;
    }
    case "Regen Plates":
      healUnit(ui, undefined, game);
      ui.passiveSuppressedForCombat = true;
      log(`  [Regen Plates] ${ui.card.Name} restored to full HP — passive suppressed this combat`);
      break;
    case "Repair Kit": {
      const candidates = unitsOf(w)
        .filter((u) => u.curHp < u.maxHp && (u.card.Type.includes("Vehicle") || u.card.Type.includes("Mech")))
        .sort((a, b) => (a.curHp - a.maxHp) - (b.curHp - b.maxHp));
      const repairCount = isEngineer ? 2 : 1;
      for (const t of candidates.slice(0, repairCount)) {
        const repairHealed = healUnit(t, Math.floor(t.maxHp / 2), game);
        if (repairHealed) { w.stats.healsGiven += 1; w.stats.healedHp += repairHealed; }
      }
      break;
    }
    case "Stasis Suit":
      ui.equipped = ui.equipped.filter((g) => (g as any).Name !== "Stasis Suit");
      p.res.Organic += 2;
      break;
    case "Apocalypse Rounds":
      tempState.tempBuff(ui, { Damage: toInt(ui.card.Damage) });
      break;
    case "Emergency Extractor": {
      if (ui.curHp < Math.floor(ui.maxHp / 2)) {
        const owned = unitsOf(p);
        if (owned.includes(ui)) {
          if (p.active === ui) p.active = p.reserve.length ? p.reserve[0] : null;
          else p.reserve = p.reserve.filter((u) => u !== ui);
          p.gearHand.push(...ui.equipped.filter((g) => "Name" in (g as any)));
        }
      }
      break;
    }
    case "Nanite Tech": {
      if (w.active && w.active !== ui) {
        const owned = unitsOf(p);
        if (owned.includes(ui) && ui.equipped.some((g) => (g as any).Name === "Nanite Tech")) {
          ui.equipped = ui.equipped.filter((g) => (g as any).Name !== "Nanite Tech");
          w.active.equipped.push({ Name: "Nanite Tech", Damage: 0, HP: 0, Armor: 0, Shields: 0 } as any);
        }
      }
      break;
    }
    case "Shield Generator":
      if (w.active) grantShields(w.active, 20, w);
      if (isEngineer && w.reserve[0]) grantShields(w.reserve[0], 20, w);
      break;
    case "Exosuit":
      if (other.active && p.active && other.active !== p.active) {
        const tmp = p.active;
        p.active = other.active;
        other.active = tmp;
      }
      break;
    case "Quantum Plates": {
      // Undo the passive roll that fired earlier this same precombat phase, then apply a fresh one.
      const prev = ui.charges["Quantum Plates Roll"] ?? 0;
      if (prev === 2 || prev === 3) tempState.tempBuff(ui, { Armor: 4 });
      else if (prev === 4 || prev === 5) tempState.tempBuff(ui, { Armor: -6 });
      else if (prev === 6) ui.curHp = ui.maxHp;
      const roll = roll1to6();
      ui.charges["Quantum Plates Roll"] = roll;
      if (roll === 2 || roll === 3) tempState.tempBuff(ui, { Armor: -4 });
      else if (roll === 4 || roll === 5) tempState.tempBuff(ui, { Armor: 6 });
      else if (roll === 6) ui.curHp = 0;
      break;
    }
    case "Shadow Tech":
      if (w.laneEnemyReserve.length) {
        const [banished, ...rest] = w.laneEnemyReserve;
        w.laneEnemyReserve = [...rest, banished];
      }
      break;
    case "Expanded Backpack": {
      // "Reset the cooldown of another equipped item" -- refunds 1 use to one of THIS unit's
      // other equipped items that's currently tracked against a per-unit use cap (Chronostasis
      // is the only such item today; this generalizes automatically if more get one later).
      const other2 = ui.equipped.find((g2) => (g2 as any).Name && (g2 as any).Name !== "Expanded Backpack");
      if (other2) {
        const key = `${(other2 as any).Name}-${ui.id}`;
        const used = game.effectUses.get(key) ?? 0;
        if (used > 0) game.effectUses.set(key, used - 1);
      }
      break;
    }
    case "Resupply Drone":
      // "Refresh the active effects of each lane" -- refunds 1 use to every currently-tracked
      // capped effect game-wide (Recon Satellite, Saboteur Cell, Strategic Withdrawal,
      // Chronostasis instances, etc.), approximating a team-wide refresh.
      for (const [key, used] of game.effectUses) {
        if (used > 0) game.effectUses.set(key, used - 1);
      }
      break;
    case "Smoke Launcher":
      // "Move this effect to target lane" -- transfers the item itself to the weakest player's
      // active unit, same item-transfer pattern as Nanite Tech.
      if (w.active && w.active !== ui) {
        const owned = unitsOf(p);
        if (owned.includes(ui)) {
          ui.equipped = ui.equipped.filter((g2) => (g2 as any).Name !== "Smoke Launcher");
          w.active.equipped.push({ Name: "Smoke Launcher", Damage: 0, HP: 0, Armor: 0, Shields: 0 } as any);
        }
      }
      break;
    case "Night Vision": {
      // "Roll D6, Reveal that many enemies" -- feeds the round's scout reveal count, same
      // resource as Civilian Survivalist/"Python"'s reveal bonuses.
      const roll = roll1to6();
      game.nightVisionRevealBonus = (game.nightVisionRevealBonus ?? 0) + roll;
      log(`  ${p.name}'s Night Vision rolls a ${roll} -- +${roll} enemies revealed this round`);
      break;
    }
    case "Reanimator":
      // Active: "Remove status effects from this unit" -- this unit's temp debuffs (negative
      // tempBuffs, e.g. Quantum Plates' Armor penalty) are cleared early instead of waiting for
      // Cleanup's normal tempState.clear().
      tempState.tempBuffs = tempState.tempBuffs.filter(({ ui: u, buff }) => {
        if (u !== ui) return true;
        const isDebuff = Object.values(buff).some((v) => typeof v === "number" && v < 0);
        if (isDebuff) {
          const idx = u.equipped.indexOf(buff as any);
          if (idx !== -1) u.equipped.splice(idx, 1);
        }
        return !isDebuff;
      });
      break;
    default:
      break;
  }
}
