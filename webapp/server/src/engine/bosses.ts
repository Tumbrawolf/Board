import { toInt } from "./data.js";
import { equippedBonus } from "./combat.js";
import { tryChronostasisSave } from "./gear.js";
import type { BossActive, GamePlayer, GameState } from "./types.js";

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
  // 'Rust Elemental' (avoid mutating a shared card dict) and 'The Culling' (delete lower-rank
  // units) have no analogous risk/hook in this engine -- documented no-ops, same as sim.py.
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
export function resolveBossExchange(game: GameState, log: (t: string) => void) {
  const boss = game.bossActive;
  if (!boss) return;
  const target = game.players[Math.floor(Math.random() * game.players.length)];
  applyBossPassive(boss, target);
  const bossCard = boss.card;
  const bossDmg = toInt(bossCard.Damage) + boss.dmgBonus;
  if (target.active) {
    const targetArmor = toInt(target.active.card.Armor) + equippedBonus(target.active, "Armor");
    const dealt = bossDmg > 0 ? Math.max(1, bossDmg - targetArmor) : 0;
    target.active.curHp -= dealt;
    log(`  [BOSS] ${bossCard.Name} hits ${target.name}'s lane for ${dealt}`);
    if (target.active.curHp <= 0 && !tryChronostasisSave(game, target, target.active, log)) {
      target.graveyard.push(target.active);
      target.stats.deaths += 1;
      target.active = target.reserve.length ? target.reserve[0] : null;
      target.reserve = target.reserve.length > 1 ? target.reserve.slice(1) : [];
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
