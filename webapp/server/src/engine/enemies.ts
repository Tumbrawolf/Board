import { toInt } from "./data.js";
import type { EnemyCard } from "./data.js";
import type { Combatant } from "./combat.js";

/** Ported 1:1 from Working/sim.py's ENEMY_KEYWORD_RULES: keyword-classification dispatch over
 * the Passive column, same substring-matching approach as Units (engine/units.ts). */
const ENEMY_KEYWORD_RULES: [string, string[]][] = [
  ["ignore_armor", ["ignores armor"]],
  ["pierce_armor_2", ["pierce upto 2 armor", "pierce up to 2 armor"]],
  ["shred_armor_on_hit", ["shred", "remove 1 armor each hit", "remove an additional", "removes all armor"]],
  ["attacks_first", ["always hits 1st"]],
  ["reflect_full", ["reflects damage"]],
  ["reflect_on_armor", ["deals damage = armor when damaged"]],
  ["lifesteal", ["has lifesteal"]],
  ["heal_self_on_hit", ["heal active unit by this units attack", "heals 10 on hit"]],
  ["execute_low_hp", ["execute units under 1/4"]],
  ["double_hp", ["double this units hp"]],
  ["double_attack", ["double this units attack"]],
  ["multistrike_2", ["hit twice", "hits twice", "attacks an additional time"]],
  ["multistrike_4", ["hits 4 times"]],
  ["multistrike_6", ["attacks 6 times", "attack 6 times per exchange"]],
  ["gain_armor_on_hit", ["gains 2 armor on hit", "gain 2 armor on hit"]],
  ["gain_shield_on_hit", ["enemies gain 5 shield on hit", "gain 5 shield on hit"]],
  ["takes_half_damage", ["takes half damage"]],
  ["stun_on_hit_once", ["stuns on 1st hit"]],
  ["stun_on_hit", ["stun on hit", "stuns on hit"]],
  ["targets_scout", ["hits the scout", "damage from this unit hits the scout"]],
  ["heal_ally_on_exchange", ["heal active unit by this units attack", "heal active unit by half this units attack"]],
  ["delete_on_kill", ["deletes units on kill"]],
  ["armor_equals_shields", ["gains armor = to shields", "gains armor equal to shields"]],
  ["armor_blocks_extra_50", ["armor blocks an additional 50%"]],
  ["all_enemies_gain_armor", ["all enemies gain 4 armor"]],
  ["all_enemies_gain_shields_passive", ["gives all enemies 10 shields before combat"]],
  ["add_dmg_to_allies_passive", ["add this units damage to all active enemies"]],
  ["blocks_abilities_in_lane", ["prevents activation of abilities in lane"]],
  ["targets_lowest_hp_player", ["attacks target lowest hp unit", "target lowest hp unit"]],
  ["shield_on_player_kill_overkill", ["gain shields = excess damage on kill", "gain shield = excess damage on kill"]],
  ["double_dmg_on_activation", ["double this units damage when humans activate abilities"]],
  ["splash_adjacent_half_on_attack", ["attacks hit adjacent lanes for half damage", "attacks hit adjacent lanes at half damage"]],
  ["explode_on_death_2x", ["explode for 2x damage on death"]],
  ["on_death_steal_vehicle_mech", ["on death, take vehicle or mech from the graveyard", "take vehicle or mech from the graveyard"]],
  ["emitter_infantry_dot", ["infantry in all lanes take 2 damage per round of combat"]],
  ["targets_reserve_player", ["targets reserve"]],
  ["untargetable_by_abilities", ["cannot be targeted by abilities"]],
  ["execute_below_attack", ["hp falls below this units attack value"]],
  ["stun_on_hit_every_3", ["stun enemies every 3 attacks"]],
  ["splash_adjacent_full_on_attack", ["hits adjacent lanes, deals double damage"]],
  ["blocks_abilities_globally", ["abilities cannot be activated while this unit is alive"]],
  ["splash_reserve_on_kill", ["splash damage to reserve on kill"]],
  ["all_enemies_buff_attack_hp", ["all enemies gain 10 attack and 10 max hp"]],
  ["dmg_plus_missing_hp", ["missing health is added to damage"]],
  ["shred_shield_on_hit", ["5 shield on hit", "removes all armor and shields on hit"]],
  ["stun_all_on_kill", ["stun all units on kill"]],
  ["oracle_absorb_reveal", ["prevent the next 20 damage"]],
  ["armor_reset_on_kill", ["reset on kill"]],
  ["reflect_with_shields", ["reflects damage while unit has shields"]],
  ["crown_splitter_infantry_dmg_boost", ["enemies deal 15 bonus damage to infantry"]],
  ["attacks_all_lanes", ["attacks hit all units", "hits all active", "attacks hit all active", "hits all lanes"]],
  ["gain_dmg_on_hit", ["gains 15 attack on hit", "gain 15 attack on hit"]],
  ["totem_nonmech_dot", ["deals 5 damage to all non mechanical units"]],
  ["absorb_half_stats_on_kill", ["when any unit dies, add half of its stats"]],
  ["all_enemies_buff_20", ["give all enemies 20 damage"]],
  ["bonus_attack_on_kill", ["attacks an additional time per kill"]],
  ["halves_to_reserve", ["half of damage targeting this unit is moved onto reserve"]],
];

const enemyTagCache = new Map<string, Set<string>>();

export function classifyEnemy(card: EnemyCard): Set<string> {
  const cached = enemyTagCache.get(card.Name);
  if (cached) return cached;
  // Check both Passive and Reveal — some mechanics are described only in the Reveal column.
  const text = ((card.Passive ?? "") + " " + ((card as any).Reveal ?? "")).toLowerCase();
  const tags = new Set<string>();
  for (const [tag, subs] of ENEMY_KEYWORD_RULES) {
    if (subs.some((s) => text.includes(s))) tags.add(tag);
  }
  enemyTagCache.set(card.Name, tags);
  return tags;
}

/** Note: 'attacks_first' for enemies gives the old sequential behaviour — enemy strikes first and
 * the active player unit cannot retaliate if killed that exchange. Default combat is simultaneous.
 * Pass suppressed=true to skip all keyword-driven passive mods (used by suppressedPassiveEnemyNames). */
export function applyEnemyCombatMods(c: Combatant, card: EnemyCard, suppressed = false) {
  if (suppressed) return;
  const tags = classifyEnemy(card);
  if (tags.has("ignore_armor")) c.ignoreArmor = true;
  if (tags.has("pierce_armor_2")) c.pierceArmor = 2;
  if (tags.has("shred_armor_on_hit")) {
    if (/all armor/i.test(card.Passive ?? "")) {
      c.shredArmor = 999; // Dragon: shred all armor
    } else {
      const shredMatch = (card.Passive ?? "").match(/(?:remove(?:s)?|shreds?)\s+(?:an additional\s+)?(\d+)\s+armor/i);
      c.shredArmor = shredMatch ? parseInt(shredMatch[1]) : 1;
    }
  }
  if (tags.has("attacks_first")) c.attacksFirst = true;
  if (tags.has("reflect_full")) c.reflectFraction = 1.0;
  if (tags.has("reflect_on_armor")) c.reflectEqualToArmor = true;
  if (tags.has("lifesteal")) c.lifestealFraction = 1.0;
  if (tags.has("double_hp")) {
    c.hp *= 2;
    c.curHp = c.hp;
  }
  if (tags.has("double_attack")) c.dmg *= 2;
  if (tags.has("multistrike_2")) c.dmg *= 2;
  if (tags.has("multistrike_4")) c.dmg *= 4;
  if (tags.has("multistrike_6")) c.dmg *= 6;
  if (tags.has("gain_armor_on_hit")) c.gainArmorOnHit = 2;
  if (tags.has("gain_shield_on_hit")) c.gainShieldOnHit = 5;
  if (tags.has("stun_on_hit_once")) c.stunOnHitCharges = 1;
  if (tags.has("stun_on_hit")) c.stunOnHitCharges = Infinity;
  if (tags.has("stun_on_hit_every_3")) c.stunOnHitInterval = 3;
  if (tags.has("targets_scout")) c.targetsScout = true;
  if (tags.has("targets_lowest_hp_player")) c.targetsLowestHpPlayer = true;
  if (tags.has("targets_reserve_player")) c.targetsReservePlayer = true;
  if (tags.has("shield_on_player_kill_overkill")) c.gainShieldOnKillOverkill = true;
  if (tags.has("explode_on_death_2x")) c.explodeOnDeathFraction = 2;
  // Jack In the Box / any "on Death Deal N damage" passive — parse N directly.
  const onDeathFlatMatch = ((card.Passive ?? "") + " " + ((card as any).Reveal ?? "")).match(/on death deal (\d+) damage/i);
  if (onDeathFlatMatch) c.explodeOnDeathFlat = parseInt(onDeathFlatMatch[1]);
  // Burner: "Deals N Bonus damage to <Type>" — parse type and amount from passive text.
  const bonusVsTypeMatch = (card.Passive ?? "").match(/deals? (\d+) bonus damage to (\w+)/i);
  if (bonusVsTypeMatch) c.bonusDmgVsType[bonusVsTypeMatch[2].toLowerCase()] = parseInt(bonusVsTypeMatch[1]);
  if (tags.has("heal_self_on_hit")) {
    // "Enemies Heal N on hit" — flat self-heal applied in enemyAttacks each time damage is dealt.
    // The global passive scan in game.ts propagates this to all active enemies while Mobile Temple is alive.
    const flatMatch = (card.Passive ?? "").match(/heal(?:s)?\s+(?:enemies\s+)?(\d+)\s+on\s+hit/i);
    if (flatMatch) c.healSelfFlatOnHit = parseInt(flatMatch[1]);
  }
  if (tags.has("heal_ally_on_exchange")) {
    const half = (card.Passive ?? "").toLowerCase().includes("half");
    c.healActiveAllyPerExchange = half ? Math.floor(c.dmg / 2) : c.dmg;
  }
  if (tags.has("execute_low_hp")) c.executeBelowFraction = 0.25;
  if (tags.has("execute_below_attack")) c.executeBelowFixed = c.dmg;
  if (tags.has("splash_adjacent_half_on_attack")) c.splashAdjacentFraction = 0.5;
  if (tags.has("splash_adjacent_full_on_attack")) c.splashAdjacentFraction = 1.0;
  // Artillery: "Deals double damage to <Type> and <Type>" — parse all types from passive text.
  const doubleDmgMatch = (card.Passive ?? "").match(/(?:deals? )?double damage to ([\w\s,]+)/i);
  if (doubleDmgMatch) {
    const types = doubleDmgMatch[1].split(/\s+and\s+|,\s*/i)
      .map((t) => t.trim().toLowerCase().replace(/s$/, ""))
      .filter(Boolean);
    for (const t of types) c.doubleDmgVsTypes.add(t);
  }
  if (tags.has("delete_on_kill")) c.deleteOnKill = true;
  if (tags.has("splash_reserve_on_kill")) c.splashToReserveOnKill = true;
  if (tags.has("dmg_plus_missing_hp")) { c.dmgPlusMissingHp = true; c.baseDmg = c.dmg; }
  if (tags.has("shred_shield_on_hit")) {
    if (/removes all armor and shields on hit/i.test(card.Passive ?? "")) {
      c.shredShieldOnHit = 999; // Ruin: remove all shields
      c.shredArmor = 999;       // Ruin: remove all armor (note: shred_armor_on_hit also sets this)
    } else {
      const shieldShredMatch = (card.Passive ?? "").match(/(\d+)\s+shield\s+on\s+hit/i);
      c.shredShieldOnHit = shieldShredMatch ? parseInt(shieldShredMatch[1]) : 5;
    }
  }
  if (tags.has("stun_all_on_kill")) c.stunAllOnKill = true;
  if (tags.has("armor_reset_on_kill")) c.armorResetOnKill = c.armor; // Store post-reveal armor as reset baseline.
  if (tags.has("reflect_with_shields")) { c.reflectFraction = 1.0; c.reflectOnlyWithShields = true; }
  if (tags.has("attacks_all_lanes")) c.attacksAllLanes = true;
  if (tags.has("gain_dmg_on_hit")) {
    const gainMatch = (card.Passive ?? "").match(/gains?\s+(\d+)\s+attack\s+on\s+hit/i);
    c.gainDmgOnHit = gainMatch ? parseInt(gainMatch[1]) : 15;
  }
  if (tags.has("absorb_half_stats_on_kill")) c.absorbHalfStatsOnKill = true;
  if (tags.has("bonus_attack_on_kill")) c.bonusAttackOnKill = true;
  if (tags.has("halves_to_reserve")) c.halvesToReserveOnHit = true;
  if (tags.has("armor_equals_shields")) c.armor = toInt(card.Shields);
  if (tags.has("armor_blocks_extra_50")) c.armorBonusFraction = 0.5;
  if (tags.has("takes_half_damage")) {
    // Approximated as near-total damage reduction, floor-clamped to 1 by computeDealt's
    // max(1, ...) -- same approximation sim.py itself uses, not a new simplification.
    c.armor += 999;
  }
}
