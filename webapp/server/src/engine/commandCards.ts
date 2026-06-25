import { RANK_NUM, RANK_ORDER } from "./constants.js";
import type { EnemyCard, CommandCard, UnitCard } from "./data.js";
import { toInt } from "./data.js";
import {
  addTempUnitPerm,
  canUseEffect,
  healUnit,
  instancePower,
  makeTempCard,
  makeUnitInstance,
  recordEffectUse,
  weakestPlayer,
} from "./state.js";
import { refillShopGear, refillShopUnit } from "./shop.js";
import type { GamePlayer, GameState } from "./types.js";
import type { RoundTempState } from "./state.js";

export interface CommandContext {
  game: GameState;
  commander: GamePlayer;
  tempState: RoundTempState;
  enemyPool: EnemyCard[]; // this round's enemy-rank pool, for Containment Protocol
  log: (text: string) => void;
}

/** Active Effects for Barracks/Armory/Containment Block/Medical Bay/Command cards. Battlefield
 * cards are handled separately (applyBattlefieldActive) since they need enemy hoards already dealt.
 *
 * Ported from Working/sim.py's apply_command_active, 1:1 where the underlying system exists in
 * Stage 2's scope. Several cards there are themselves already a flat-resource-grant
 * simplification of their card text (e.g. Advanced Mechanized/AI advancements/Gene Modding all
 * just grant +5 Tech) -- this keeps that same simplification rather than inventing a richer
 * version sim.py itself didn't have. Cards needing a system not yet ported in Stage 2 (Boss,
 * Vehicle/Mech locked decks, Tactician, enemy-ability prevention) are documented no-ops, same
 * convention sim.py itself uses for its own undispatched mechanics.
 */
export function applyCommandActive(ctx: CommandContext, card: CommandCard) {
  const { game, commander, tempState } = ctx;
  const name = card.Name;
  const w = weakestPlayer(game);

  switch (name) {
    case "Mech Station":
    case "Vehicle Bay":
    case "Combined Arms":
    case "Conscription":
    case "Rapid Deployment":
      // No locked Vehicle/Mech sub-deck in Stage 2 (all units are in one pool from the start) --
      // documented no-op until that system is ported.
      break;
    case "Additional Bedding": {
      const pool = game.unitDeck.filter((u) => RANK_NUM[u.Rank] <= commander.rank);
      if (pool.length) {
        const u = pool[Math.floor(Math.random() * pool.length)];
        game.unitDeck.splice(game.unitDeck.indexOf(u), 1);
        addTempUnitPerm(commander, makeUnitInstance(u));
      }
      break;
    }
    case "Advanced Mechanized":
    case "AI advancements":
    case "Gene Modding":
    case "Ammo Stockpiles":
      commander.res.Tech += 5;
      break;
    case "Flash Sale":
      commander.res.Tech += 5;
      break;
    case "Mad Science":
      commander.res.Alien += 3;
      break;
    case "Experimental Science":
      for (const p of game.players) p.res.Alien *= 2;
      break;
    case "Ethics Committee":
      commander.res.Alien += 5;
      break;
    case "Containment Protocol": {
      if (ctx.enemyPool.length) {
        const e = ctx.enemyPool[Math.floor(Math.random() * ctx.enemyPool.length)];
        // Captured enemies fight as a unit but have no real player Rank -- tag Conscript so
        // Rank-based logic (Retire from Duty, shop gating) stays valid, same as sim.py.
        const captured = { ...e, Rank: "Conscript" } as unknown as UnitCard;
        addTempUnitPerm(commander, makeUnitInstance(captured));
      }
      break;
    }
    case "Garrison": {
      for (const p of game.players) {
        const pool = game.unitDeck.filter((u) => RANK_NUM[u.Rank] <= p.rank);
        if (pool.length) {
          const u = pool[Math.floor(Math.random() * pool.length)];
          tempState.addTempUnit(p, makeUnitInstance(u));
        }
      }
      break;
    }
    case "Tag Team":
      for (const p of game.players) {
        if (p.reserve.length && p.active) {
          const oldActive = p.active;
          p.active = p.reserve[0];
          p.reserve[0] = oldActive;
        }
      }
      break;
    case "Combat Stims":
      if (commander.active) {
        commander.active.curHp = Math.max(1, commander.active.curHp - 2);
        tempState.tempBuff(commander.active, { Damage: 4 });
      }
      break;
    case "Extraction":
      game.commandPool.Organic += 2;
      game.commandPool.Tech += 2;
      game.commandPool.Alien += 2;
      break;
    case "Countermeasures":
    case "Suppression":
    case "Bunkers":
      // No enemy-ability subsystem yet to suppress -- documented no-op, same as sim.py.
      break;
    case "Exploitation":
      if (commander.active) {
        commander.graveyard.push(commander.active);
        commander.stats.deaths += 1;
        commander.active = commander.reserve.length ? commander.reserve[0] : null;
        commander.reserve = commander.reserve.length > 1 ? commander.reserve.slice(1) : [];
      }
      break;
    case "Necromancy":
      if (w.graveyard.length) {
        const ui = w.graveyard.pop()!;
        ui.curHp = ui.maxHp;
        addTempUnitPerm(w, ui);
      }
      break;
    case "Donor Organs": {
      const units = [...(w.active ? [w.active] : []), ...w.reserve];
      const target = units.reduce(
        (best, ui) => (ui.maxHp - ui.curHp > (best ? best.maxHp - best.curHp : -1) ? ui : best),
        null as (typeof units)[number] | null
      );
      if (target) healUnit(target);
      break;
    }
    case "Ashes to Ashes":
      if (commander.reserve.length) {
        const u = commander.reserve.reduce((a, b) => (instancePower(b) < instancePower(a) ? b : a));
        commander.reserve.splice(commander.reserve.indexOf(u), 1);
        commander.graveyard.push(u);
        commander.res.Organic += toInt(u.card["Organic Cost"]);
      }
      break;
    case "Share Rooms":
    case "Battle Medics":
    case "We can Rebuild them":
      for (const p of game.players) {
        for (const ui of [...(p.active ? [p.active] : []), ...p.reserve]) healUnit(ui);
      }
      break;
    case "Increased Budget":
      for (const p of game.players) {
        for (const ui of [...(p.active ? [p.active] : []), ...p.reserve]) {
          healUnit(ui, Math.floor((ui.maxHp - ui.curHp) / 2));
        }
      }
      break;
    case "Work Order":
      for (const p of game.players) {
        if (p.active) game.commandPool.Tech += 1;
      }
      break;
    case "Orders from Above":
      commander.res.Organic += 3;
      commander.res.Tech += 3;
      commander.res.Alien += 3;
      break;
    case "Income Tax":
      for (const p of game.players) {
        for (const res of ["Organic", "Tech", "Alien"] as const) {
          const half = Math.floor(p.res[res] / 2);
          p.res[res] -= half;
          game.commandPool[res] += half;
        }
      }
      break;
    case "Request Aid":
      for (const res of ["Organic", "Tech", "Alien"] as const) {
        const half = Math.floor(commander.res[res] / 2);
        commander.res[res] -= half;
        game.commandPool[res] += half;
      }
      break;
    case "Priority Operations":
    case "Priority Construction":
      game.commandPool.Tech += 5;
      break;
    case "Take Credit":
      // No Mission/Event-driven promotion roll exists yet in Stage 2 (only Rank Trickle, which
      // isn't "a promotion someone else would get") -- documented no-op for now.
      break;
    case "Pull Rank":
      if (game.shopUnits.length && commander.rank > Math.max(...game.shopUnits.map((u) => RANK_NUM[u.Rank]))) {
        const cheapest = game.shopUnits.reduce((a, b) => (RANK_NUM[b.Rank] < RANK_NUM[a.Rank] ? b : a));
        game.shopUnits.splice(game.shopUnits.indexOf(cheapest), 1);
        refillShopUnit(game);
        addTempUnitPerm(commander, makeUnitInstance(cheapest));
      }
      break;
    case "Leader Speech":
      game.playerProgress = Math.min(10, game.playerProgress + 1);
      break;
    case "Nuke": {
      const target = game.players.reduce((a, b) =>
        b.laneEnemyReserve.length > a.laneEnemyReserve.length ? b : a
      );
      target.laneEnemyReserve = [];
      for (const ui of [...(target.active ? [target.active] : []), ...target.reserve]) {
        target.graveyard.push(ui);
        target.stats.deaths += 1;
      }
      target.active = null;
      target.reserve = [];
      break;
    }
    case "Promotion": {
      const others = game.players.filter((p) => p !== commander);
      if (others.length) {
        const target = others.reduce((a, b) => (b.rank < a.rank ? b : a));
        if (target.rank < RANK_ORDER.length) {
          target.rank += 1;
          target.stats.promotionsReceived += 1;
        }
      }
      break;
    }
    case "Reinforcements": {
      const top2 = [...game.shopUnits].sort((a, b) => RANK_NUM[b.Rank] - RANK_NUM[a.Rank]).slice(0, 2);
      for (const u of top2) tempState.addTempUnit(commander, makeUnitInstance(u));
      break;
    }
    case "Perfect information":
      tempState.hoardReduction.set("__global__", (tempState.hoardReduction.get("__global__") ?? 0) + 1);
      break;
    case "Field Testing": {
      const target = w.active;
      if (target && game.shopGear.length) {
        const g = game.shopGear.reduce((a, b) => (RANK_NUM[b["Rank Name"]] > RANK_NUM[a["Rank Name"]] ? b : a));
        game.shopGear.splice(game.shopGear.indexOf(g), 1);
        refillShopGear(game);
        target.equipped.push(g);
        target.maxHp += toInt(g.HP);
        target.curHp += toInt(g.HP);
        target.curShields += toInt(g.Shields);
      }
      break;
    }
    case "Collaboration":
      // No Mission system yet in Stage 2 ("cover mission costs") -- documented no-op.
      break;
    case "Scouting update":
      commander.res.Organic += 3;
      commander.res.Tech += 3;
      commander.res.Alien += 3;
      break;
    case "Forward Command":
      tempState.halfOverrunDamage = true;
      break;
    case "Eradicator Cannon":
      // No Boss system yet in Stage 2 -- documented no-op.
      break;
    case "Strategic Withdrawal":
      if (canUseEffect(game, "Strategic Withdrawal", 1)) {
        recordEffectUse(game, "Strategic Withdrawal");
        game.enemyProgress = Math.max(0, game.enemyProgress - 3);
        game.playerProgress = Math.max(0, game.playerProgress - 1);
        ctx.log(
          `  [Strategic Withdrawal] ${commander.name} plays it: EnemyProg -3 -> ${game.enemyProgress}/10, PlayerProg -1 -> ${game.playerProgress}/10`
        );
      }
      break;
    default:
      break;
  }
}

/** Battlefield Active Effects -- run after Deployment deals hoards (most target "active
 * enemies"/"a lane"). Ported 1:1 from Working/sim.py's apply_battlefield_active, including its
 * own existing simplifications (e.g. Chemical Warfare truncates to 1 enemy rather than a true
 * 1-HP-all-enemies effect; "Tranq rounds"/"Whites of their eyes" approximate their text as flat
 * stat buffs) -- Punch Through (Boss) and Early Warning Network's real effect (multi-lane Reveal
 * damage isn't ported yet) are documented no-ops in Stage 2. */
export function applyBattlefieldActive(ctx: CommandContext, card: CommandCard) {
  const { game, tempState } = ctx;
  const name = card.Name;
  const w = weakestPlayer(game);

  switch (name) {
    case "Air Strike":
    case "Land Mines":
      w.laneEnemyReserve = w.laneEnemyReserve.filter((e) => toInt(e.HP) > 10);
      break;
    case "Defense Turrets":
      w.laneEnemyReserve = w.laneEnemyReserve.filter((e) => toInt(e.HP) > 15);
      break;
    case "Chemical Warfare":
      w.laneEnemyReserve = w.laneEnemyReserve.slice(0, 1);
      break;
    case "You Shall Not Pass":
      if (w.active) tempState.tempBuff(w.active, { Damage: w.active.curHp });
      break;
    case "Suppression":
    case "Bunkers":
      break; // no enemy-ability subsystem yet, same as Command-side Countermeasures/Suppression
    case "Early Warning Network":
      // Real effect (halves multi-lane Reveal/Passive damage) has nothing to act on yet --
      // multi-lane Reveal dispatch isn't ported in Stage 2. Documented no-op for now.
      break;
    case "Barrier Systems":
      if (w.active) tempState.tempBuff(w.active, { Shields: 10 });
      break;
    case "Final Stand":
      if (w.active) tempState.cannotDie.add(w.active.id);
      break;
    case "Covering Fire":
      if (w.reserve.length && w.active) {
        const oldActive = w.active;
        w.active = w.reserve[0];
        w.reserve[0] = oldActive;
      }
      break;
    case "Whites of their eyes":
      if (w.active) tempState.tempBuff(w.active, { Damage: toInt(w.active.card.Damage) });
      break;
    case "Punch Through":
      // No Boss system yet in Stage 2 -- documented no-op.
      break;
    case "Tranq rounds":
      if (w.active) tempState.tempBuff(w.active, { Armor: 4 });
      break;
    case "Security Drones":
      for (const p of game.players) {
        for (let i = 0; i < 2; i++) {
          addTempUnitPerm(p, makeUnitInstance(makeTempCard("Drone", 1, 1)));
        }
      }
      break;
    default:
      break;
  }
}
