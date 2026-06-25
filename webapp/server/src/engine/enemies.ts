import type { EnemyCard } from "./data.js";
import type { Combatant } from "./combat.js";

/** Ported 1:1 from Working/sim.py's ENEMY_KEYWORD_RULES: keyword-classification dispatch over
 * the Passive column, same substring-matching approach as Units (engine/units.ts). */
const ENEMY_KEYWORD_RULES: [string, string[]][] = [
  ["ignore_armor", ["ignores armor"]],
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
  ["multistrike_4", ["hit all units 4 times", "hits 4 times"]],
  ["multistrike_6", ["attack 6 times"]],
  ["gain_armor_on_hit", ["gains 2 armor on hit", "gain 2 armor on hit"]],
  ["takes_half_damage", ["takes half damage"]],
];

const enemyTagCache = new Map<string, Set<string>>();

export function classifyEnemy(card: EnemyCard): Set<string> {
  const cached = enemyTagCache.get(card.Name);
  if (cached) return cached;
  const text = (card.Passive ?? "").toLowerCase();
  const tags = new Set<string>();
  for (const [tag, subs] of ENEMY_KEYWORD_RULES) {
    if (subs.some((s) => text.includes(s))) tags.add(tag);
  }
  enemyTagCache.set(card.Name, tags);
  return tags;
}

/** Note: 'attacks_first' is classified but, exactly as in sim.py, never actually changes combat
 * order here -- resolveLaneCombat only branches on the PLAYER side's attacksFirst (the enemy
 * already acts first by default), so this flag is inert for enemies in both engines. Kept for
 * fidelity with the source rather than silently dropped. */
export function applyEnemyCombatMods(c: Combatant, card: EnemyCard) {
  const tags = classifyEnemy(card);
  if (tags.has("ignore_armor")) c.ignoreArmor = true;
  if (tags.has("shred_armor_on_hit")) c.shredArmor = 3;
  if (tags.has("attacks_first")) c.attacksFirst = true;
  if (tags.has("reflect_full") || tags.has("reflect_on_armor")) c.reflectFraction = 1.0;
  if (tags.has("lifesteal")) c.lifestealFraction = 1.0;
  if (tags.has("double_hp")) {
    c.hp *= 2;
    c.curHp = c.hp;
  }
  if (tags.has("double_attack")) c.dmg *= 2;
  if (tags.has("multistrike_2")) c.dmg *= 2;
  if (tags.has("multistrike_4")) c.dmg *= 4;
  if (tags.has("multistrike_6")) c.dmg *= 6;
  if (tags.has("takes_half_damage")) {
    // Approximated as near-total damage reduction, floor-clamped to 1 by computeDealt's
    // max(1, ...) -- same approximation sim.py itself uses, not a new simplification.
    c.armor += 999;
  }
}
