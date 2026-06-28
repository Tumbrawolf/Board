import { toInt } from "./data.js";
import { Combatant, equippedBonus } from "./combat.js";
import { tryChronostasisSave } from "./gear.js";
import type { BossActive, GamePlayer, GameState, UnitInstance } from "./types.js";

/** The Boss Passive column -- "Passive is activated" at T1 means it's on for the boss's whole
 * lifetime once spawned. Covers the mechanically tractable subset; the rest (graveyard merging,
 * damage-spreading across the team, etc.) have no clean hook in this combat model, same as sim.py. */
export function applyBossPassive(boss: BossActive, target: GamePlayer) {
  const name = boss.card.Name;
  if (name === "Plasma Channeler" && target.active) {
    target.active.curShields = 0;
  } else if (name === "Plate Host") {
    boss.armorBonus = boss.armorBonus || 1;
  }
}

/** Rust Elemental ("No Armor for Allies or Enemies") and The Culling ("Enemies Delete units of
 * lower Rank") both apply board-wide, to every Combatant built this round, not just the one lane
 * Boss combat itself targets -- so these are checked at Combatant-construction time instead of
 * inside applyBossPassive (which only ever sees the Boss's own single target lane).
 *
 * The Culling is approximated as "enemies delete every unit they kill" rather than truly
 * comparing each individual matchup's Rank -- a single Combatant has no per-opponent-pair state
 * to express "only delete THIS specific lower-rank target," and a lane can hold multiple
 * player units of different Ranks fighting the same enemy in sequence. Same kind of
 * approximate-the-intent simplification already used elsewhere here (e.g. Chemical Warfare
 * truncating to 1 enemy instead of true 1-HP-all). */
export function applyBossBoardWideMods(game: GameState, c: Combatant, isEnemy: boolean) {
  const name = game.bossActive?.card.Name;
  if (!name) return;
  if (name === "Rust Elemental") c.armor = 0;
  if (name === "The Culling" && isEnemy) c.deleteOnKill = true;
}

/** T1-T5 escalation. Tier is a LIVE lookup (recalculated every round), but each tier's stat
 * boost is a one-time, permanent gain for that boss's lifetime once first reached -- not
 * reapplied every round it stays at that tier, which would runaway-stack "+5 Attack". */
export function applyBossTier(boss: BossActive, tier: number) {
  if (tier <= boss.tierReached) return;
  const card = boss.card as any;
  for (let t = boss.tierReached + 1; t <= tier; t++) {
    const text: string = card[`T${t}Boss`] ?? "";
    const matches = text.matchAll(/\+(\d+)\s*(Attack|Health|Shields|Armor)/g);
    for (const m of matches) {
      const amt = Number(m[1]);
      const stat = m[2];
      if (stat === "Attack") boss.dmgBonus += amt;
      else if (stat === "Health") boss.hpCur += amt;
      else if (stat === "Shields") boss.shieldBonus += amt;
      else if (stat === "Armor") boss.armorBonus += amt;
    }
    if (text.toLowerCase().includes("heals 5 health on kill")) boss.healsOnKill = 5;
  }
  boss.tierReached = tier;
}

/** One damage exchange per round: the Boss hits a random target lane once, and every
 * enemy-free lane hits back once. Ported 1:1 from the main round loop's Boss combat block. */
function hasEquipped(p: GameState["players"][number], gearName: string): boolean {
  return Boolean(p.active?.equipped.some((g) => (g as any).Name === gearName)) ||
    p.reserve.some((ui) => ui.equipped.some((g) => (g as any).Name === gearName));
}

export function resolveBossExchange(game: GameState, log: (t: string) => void, killUnit?: (p: GamePlayer, ui: UnitInstance) => void) {
  const boss = game.bossActive;
  if (!boss) return;
  // Laser Designator ("Other units can target your lane when attacking") draws the Boss's
  // attention preferentially; Smoke Launcher ("cannot be targeted by abilities") removes a lane
  // from consideration entirely, unless every lane has it (then it can't matter either way).
  const designated = game.players.filter((p) => hasEquipped(p, "Laser Designator"));
  const eligible = game.players.filter((p) => !hasEquipped(p, "Smoke Launcher"));
  const pool = designated.length ? designated : eligible.length ? eligible : game.players;
  const target = pool[Math.floor(Math.random() * pool.length)];
  applyBossPassive(boss, target);
  const bossCard = boss.card;
  const bossDmg = toInt(bossCard.Damage) + boss.dmgBonus;
  if (target.active) {
    const targetArmor = toInt(target.active.card.Armor) + equippedBonus(target.active, "Armor");
    const dealt = bossDmg > 0 ? Math.max(1, bossDmg - targetArmor) : 0;
    target.active.curHp -= dealt;
    log(`  [BOSS] ${bossCard.Name} hits ${target.name}'s lane for ${dealt}`);
    if (target.active.curHp <= 0 && !tryChronostasisSave(game, target, target.active, log)) {
      const dying = target.active;
      target.active = target.reserve.length ? target.reserve[0] : null;
      target.reserve = target.reserve.length > 1 ? target.reserve.slice(1) : [];
      if (killUnit) killUnit(target, dying); else { target.graveyard.push(dying); target.stats.deaths += 1; }
      if (boss.healsOnKill) boss.hpCur += boss.healsOnKill;
    }
  }
  const bossArmor = boss.armorBonus;
  for (const p of game.players) {
    if (!p.laneEnemyReserve.length && p.active) {
      const atk = toInt(p.active.card.Damage) + equippedBonus(p.active, "Damage");
      const dealt = atk > 0 ? Math.max(1, atk - bossArmor) : 0;
      boss.hpCur -= dealt;
    }
  }
  if (boss.hpCur <= 0) {
    log(`  [BOSS DEFEATED] ${bossCard.Name} is dead!`);
    game.bossActive = null;
    game.bossDiedLastRound = true;
  }
}
