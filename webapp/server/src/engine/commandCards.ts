import { RANK_NUM, RANK_ORDER } from "./constants.js";
import type { EnemyCard, CommandCard, UnitCard } from "./data.js";
import { toInt } from "./data.js";
import { equippedBonus } from "./combat.js";
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
import { scoutValue, type RoundTempState } from "./state.js";

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
    case "Mech Station": {
      if (!game.mechUnlocked) break;
      const freeMech = game.shopUnits
        .filter((u) => u.Type.includes("Mech") && RANK_NUM[u.Rank] <= commander.rank)
        .sort((a, b) => RANK_NUM[b.Rank] - RANK_NUM[a.Rank])[0];
      if (freeMech) {
        game.shopUnits.splice(game.shopUnits.indexOf(freeMech), 1);
        refillShopUnit(game);
        addTempUnitPerm(commander, makeUnitInstance(freeMech));
        ctx.log(`  [Mech Station] ${commander.name} recruits ${freeMech.Name} for free`);
      }
      break;
    }
    case "Vehicle Bay": {
      if (!game.vehicleUnlocked) break;
      const freeVehicle = game.shopUnits
        .filter((u) => u.Type.includes("Vehicle") && RANK_NUM[u.Rank] <= commander.rank)
        .sort((a, b) => RANK_NUM[b.Rank] - RANK_NUM[a.Rank])[0];
      if (freeVehicle) {
        game.shopUnits.splice(game.shopUnits.indexOf(freeVehicle), 1);
        refillShopUnit(game);
        addTempUnitPerm(commander, makeUnitInstance(freeVehicle));
        ctx.log(`  [Vehicle Bay] ${commander.name} recruits ${freeVehicle.Name} for free`);
      }
      break;
    }
    case "Combined Arms": {
      // Active can be used to unlock both types immediately (simulating "upgrade Mech Station or Vehicle Bay")
      if (!game.mechUnlocked) {
        game.unitDeck.push(...game.mechDeckLocked);
        game.mechDeckLocked = [];
        game.mechUnlocked = true;
        ctx.log(`  [Combined Arms] Mech units added to unit deck`);
      }
      if (!game.vehicleUnlocked) {
        game.unitDeck.push(...game.vehicleDeckLocked);
        game.vehicleDeckLocked = [];
        game.vehicleUnlocked = true;
        ctx.log(`  [Combined Arms] Vehicle units added to unit deck`);
      }
      break;
    }
    case "Conscription": {
      if (!game.shopUnits.length) break;
      const lowestRank = Math.min(...game.shopUnits.map((u) => RANK_NUM[u.Rank]));
      const pool = game.shopUnits.filter((u) => RANK_NUM[u.Rank] === lowestRank);
      const u = pool[Math.floor(Math.random() * pool.length)];
      game.shopUnits.splice(game.shopUnits.indexOf(u), 1);
      refillShopUnit(game);
      const ui = makeUnitInstance(u);
      if (w.active) {
        w.benchedUnits.push(w.active);
        w.active = ui;
      } else {
        w.active = ui;
      }
      break;
    }
    case "Additional Bedding": {
      const pool = game.shopUnits.filter((u) => RANK_NUM[u.Rank] <= commander.rank);
      if (pool.length) {
        const u = pool[Math.floor(Math.random() * pool.length)];
        game.shopUnits.splice(game.shopUnits.indexOf(u), 1);
        refillShopUnit(game);
        addTempUnitPerm(commander, makeUnitInstance(u));
      }
      break;
    }
    case "Advanced Mechanized":
      game.mechTechDiscount += 2;
      game.vehicleTechDiscount += 3;
      break;
    case "AI advancements":
      game.unitOrganicFree = true;
      break;
    case "Gene Modding":
      game.techCanUseOrganic = true;
      break;
    case "Flash Sale":
      game.shopCostMultiplier = 0.5;
      game.shopCostMultiplierNextRound = 2;
      break;
    case "Mad Science":
      game.gearAlienHalfThisRound = true;
      break;
    case "Experimental Science":
      for (const p of game.players) p.res.Alien *= 2;
      break;
    case "Ethics Committee":
      game.allAlienFreeThisRound = true;
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
    case "Tag Team":
      for (const p of game.players) {
        if (p.reserve.length && p.active) {
          const oldActive = p.active;
          p.active = p.reserve[0];
          p.reserve[0] = oldActive;
        }
      }
      break;
    case "Combat Stims": {
      const dmg = ctx.game.combatStimsPendingDmg || 1;
      ctx.game.combatStimsPendingDmg = 0;
      if (commander.active) {
        commander.active.curHp = Math.max(1, commander.active.curHp - dmg);
        tempState.tempBuff(commander.active, { Damage: dmg * 2 });
        ctx.log(`  [Combat Stims] ${commander.name} takes ${dmg} self-damage → +${dmg * 2} Attack this round on ${commander.active.card.Name}`);
      }
      break;
    }
    case "Countermeasures": {
      const seat = ctx.game.countermeasuresTargetSeat;
      ctx.game.laneAbilitiesFullySuppressed.add(seat);
      ctx.game.destroyNextActivatedCard = true;
      const name = ctx.game.players.find((p) => p.seatIndex === seat)?.name ?? `seat ${seat}`;
      ctx.log(`  [Countermeasures] All enemy abilities suppressed in ${name}'s lane this round (card destroyed)`);
      break;
    }
    case "Exploitation": {
      if (commander.active) {
        const totalDmg = toInt(commander.active.card.Damage) + equippedBonus(commander.active, "Damage");
        tempState.tempBuff(commander.active, { Damage: totalDmg * 2 });
        tempState.mustDieAfterCombat.add(commander.active.id);
        ctx.log(`  [Exploitation] ${commander.active.card.Name} attack tripled (${totalDmg} → ${totalDmg * 3}); dies after combat`);
      }
      break;
    }
    case "Necromancy": {
      const idx = ctx.game.necromancyPickedIdx;
      ctx.game.necromancyPickedIdx = -1;
      const graveyard = commander.graveyard;
      const pickIdx = idx >= 0 && idx < graveyard.length ? idx : graveyard.length - 1;
      if (pickIdx >= 0) {
        const [ui] = graveyard.splice(pickIdx, 1);
        ui.curHp = ui.maxHp;
        ui.curShields = toInt((ui.card as any).Shields ?? 0);
        addTempUnitPerm(commander, ui);
        ctx.log(`  [Necromancy] ${commander.name} revives ${ui.card.Name} (${ui.curHp} HP)`);
      }
      break;
    }
    case "Donor Organs": {
      const idx = ctx.game.donorOrgansPickedIdx;
      ctx.game.donorOrgansPickedIdx = -1;
      const pickIdx = idx >= 0 && idx < commander.medBayUnits.length ? idx : -1;
      if (pickIdx >= 0) {
        const ui = commander.medBayUnits[pickIdx];
        const cost = toInt(ui.card["Organic Cost"]);
        if (commander.res.Organic >= cost) {
          commander.res.Organic -= cost;
          commander.medBayUnits.splice(pickIdx, 1);
          healUnit(ui, undefined, ctx.game);
          addTempUnitPerm(commander, ui);
          commander.stats.healsGiven += 1;
          ctx.log(`  [Donor Organs] ${commander.name} returns ${ui.card.Name} to lane (paid ${cost} Organic)`);
        }
      }
      break;
    }
    case "Ashes to Ashes": {
      const idx = ctx.game.ashesToAshesPickedIdx;
      ctx.game.ashesToAshesPickedIdx = -1;
      const pickIdx = idx >= 0 && idx < commander.medBayUnits.length ? idx : commander.medBayUnits.length - 1;
      if (pickIdx >= 0) {
        const [ui] = commander.medBayUnits.splice(pickIdx, 1);
        const refund = toInt(ui.card["Organic Cost"]) * 2;
        commander.res.Organic += refund;
        ctx.log(`  [Ashes to Ashes] ${commander.name} destroys ${ui.card.Name} → +${refund} Organic`);
      }
      break;
    }
    case "Share Rooms":
      // Retrieve all units from all players' Med Bay pools to their reserves
      for (const p of game.players) {
        while (p.medBayUnits.length > 0) {
          const ui = p.medBayUnits.shift()!;
          healUnit(ui, undefined, ctx.game);
          if (p.active === null) p.active = ui; else p.reserve.push(ui);
          p.stats.healsGiven += 1;
        }
      }
      break;
    case "Battle Medics":
      for (const p of game.players) {
        if (p.active) {
          game.battleMedicsActiveUnits.add(p.active.id);
          ctx.log(`  [Battle Medics] ${p.active.card.Name} will restore to full HP on death this round`);
        }
      }
      break;
    case "We can Rebuild them":
      game.weCanRebuildActive = true;
      ctx.log(`  [We Can Rebuild Them] Units that die this round can be rebuilt at half HP by paying their Tech Cost`);
      break;
    case "Increased Budget":
      for (const p of game.players) {
        while (p.medBayUnits.length > 0) {
          const ui = p.medBayUnits.shift()!;
          healUnit(ui, undefined, ctx.game);
          addTempUnitPerm(p, ui);
          p.stats.healsGiven += 1;
          ctx.log(`  [Increased Budget] ${p.name} retrieves ${ui.card.Name} from Med Bay`);
        }
      }
      break;
    case "Work Order":
      for (const p of game.players) {
        if (p.active) {
          game.commandPool.Organic += toInt(p.active.card["Organic Cost"]);
          game.commandPool.Tech += toInt(p.active.card["Tech Cost"]);
          game.commandPool.Alien += toInt(p.active.card["Alien Cost"]);
          ctx.log(`  [Work Order] ${p.active.card.Name} contributes ${p.active.card["Organic Cost"]}/${p.active.card["Tech Cost"]}/${p.active.card["Alien Cost"]} to command pool`);
        }
      }
      break;
    case "Orders from Above": {
      const drawn = game.ordersFromAboveDrawn;
      const keepIdx = game.ordersFromAboveKeepIdx;
      if (drawn.length === 0) break;
      const kept = drawn[keepIdx];
      const discarded = drawn.filter((_, i) => i !== keepIdx);
      // Grant the costs of the 2 discarded cards as resources to the activating player.
      for (const d of discarded) {
        commander.res.Organic += toInt(d.Organic);
        commander.res.Tech += toInt(d.Tech);
        commander.res.Alien += toInt(d.Alien);
        // Return discarded cards to bottom of deck.
        game.commandDeck.unshift(d);
      }
      // Put kept card into hand.
      if (kept) commander.hand.push(kept);
      game.ordersFromAboveDrawn = [];
      game.ordersFromAboveKeepIdx = -1;
      break;
    }
    case "Income Tax":
      for (const p of game.players) {
        for (const res of ["Organic", "Tech", "Alien"] as const) {
          game.commandPool[res] += Math.floor(p.incomeThisRound[res] / 2);
        }
      }
      break;
    case "Request Aid":
      // Halve all player income already earned this round (floor), then grant 2x income for next 2 rounds.
      for (const p of game.players) {
        for (const res of ["Organic", "Tech", "Alien"] as const) {
          const lost = Math.floor(p.incomeThisRound[res] / 2);
          p.res[res] = Math.max(0, p.res[res] - lost);
        }
      }
      game.requestAidBonusRounds = 2;
      break;
    case "Priority Operations":
      game.priorityOperationsRoundsLeft = 3;
      break;
    case "Priority Construction":
      game.priorityConstructionRoundsLeft = 3;
      break;
    case "Take Credit":
      game.takeCreditCommanderSeat = commander.seatIndex;
      break;
    case "Pull Rank": {
      // Barracks: if commander outranks every unit for sale, take the lowest-rank unit for free.
      if (game.shopUnits.length && game.shopUnits.every((u) => RANK_NUM[u.Rank] < commander.rank)) {
        const cheapest = game.shopUnits.reduce((a, b) => (RANK_NUM[a.Rank] <= RANK_NUM[b.Rank] ? a : b));
        game.shopUnits.splice(game.shopUnits.indexOf(cheapest), 1);
        refillShopUnit(game);
        addTempUnitPerm(commander, makeUnitInstance(cheapest));
      }
      // Armory: if commander outranks every gear item for sale, take the lowest-rank gear for free.
      if (game.shopGear.length && game.shopGear.every((g) => RANK_NUM[(g as any)["Rank Name"]] < commander.rank)) {
        const cheapestGear = game.shopGear.reduce((a, b) =>
          RANK_NUM[(a as any)["Rank Name"]] <= RANK_NUM[(b as any)["Rank Name"]] ? a : b
        );
        game.shopGear.splice(game.shopGear.indexOf(cheapestGear), 1);
        refillShopGear(game);
        commander.gearHand.push(cheapestGear);
      }
      break;
    }
    case "Leader Speech":
      if (game.playerProgress < 10) { game.playerProgress += 1; commander.stats.progressAsCommander += 1; }
      break;
    case "Nuke": {
      const target = game.players.find((p) => p.seatIndex === game.nukeLaneSeat)
        ?? game.players.reduce((a, b) => b.laneEnemyReserve.length > a.laneEnemyReserve.length ? b : a);
      target.laneEnemyReserve = [];
      for (const ui of [...(target.active ? [target.active] : []), ...target.reserve]) {
        target.graveyard.push(ui);
        target.stats.deaths += 1;
      }
      target.active = null;
      target.reserve = [];
      game.nukeLaneSeat = -1;
      break;
    }
    case "Promotion": {
      const others = game.players.filter((p) => p !== commander);
      if (others.length) {
        const target = game.players.find((p) => p.seatIndex === game.promotionTargetSeat && p !== commander)
          ?? others.reduce((a, b) => (b.rank < a.rank ? b : a));
        game.promotionTargetSeat = -1;
        if (target.rank < RANK_ORDER.length) {
          const takeCreditSeat = game.takeCreditCommanderSeat;
          const recipient = takeCreditSeat >= 0 ? (game.players.find((p) => p.seatIndex === takeCreditSeat) ?? target) : target;
          if (takeCreditSeat >= 0) game.takeCreditCommanderSeat = -1;
          recipient.rank += 1;
          recipient.stats.promotionsReceived += 1;
        }
      }
      break;
    }
    case "Reinforcements": {
      // Pull the 2 highest-rank units from the shop.
      const sorted = [...game.shopUnits].sort((a, b) => RANK_NUM[b.Rank] - RANK_NUM[a.Rank]);
      const top2 = sorted.slice(0, 2);
      for (const u of top2) game.shopUnits.splice(game.shopUnits.indexOf(u), 1);
      const instances = top2.map((u) => makeUnitInstance(u));
      for (const ui of instances) {
        tempState.addTempUnit(commander, ui);
        game.reinforcementUnitIds.add(ui.id);
      }
      // Equip all shop gear distributed across the two units (round-robin), then clear the shop.
      const allGear = [...game.shopGear];
      game.shopGear = [];
      allGear.forEach((g, i) => {
        if (instances.length) instances[i % instances.length].equipped.push(g as any);
      });
      break;
    }
    case "Perfect information":
      game.perfectInfoArmed = true;
      break;
    case "Field Testing": {
      if (!game.shopGear.length) break;
      const gIdx = game.fieldTestingGearIdx >= 0 && game.fieldTestingGearIdx < game.shopGear.length
        ? game.fieldTestingGearIdx
        : game.shopGear.reduce((best, g, i) => RANK_NUM[(g as any)["Rank Name"]] > RANK_NUM[(game.shopGear[best] as any)["Rank Name"]] ? i : best, 0);
      const g = game.shopGear[gIdx];
      game.shopGear.splice(gIdx, 1);
      refillShopGear(game);
      const units = [...(commander.active ? [commander.active] : []), ...commander.reserve];
      const uIdx = game.fieldTestingUnitIdx >= 0 && game.fieldTestingUnitIdx < units.length
        ? game.fieldTestingUnitIdx
        : units.findIndex((u) => u.equipped.length === Math.min(...units.map((u2) => u2.equipped.length)));
      const target = units[uIdx];
      if (target) {
        target.equipped.push(g as any);
        target.maxHp += toInt((g as any).HP);
        target.curHp += toInt((g as any).HP);
        target.curShields += toInt((g as any).Shields);
        commander.stats.gearEquipped += 1;
      }
      game.fieldTestingGearIdx = -1;
      game.fieldTestingUnitIdx = -1;
      break;
    }
    case "Scouting update": {
      if (game.teamScoutPool.length) {
        const scout = game.teamScoutPool.reduce((a, b) => scoutValue(b) > scoutValue(a) ? b : a);
        game.commandPool.Organic += toInt((scout.card as any)["Organic Scout"]);
        game.commandPool.Tech += toInt((scout.card as any)["Tech Scout"]);
        game.commandPool.Alien += toInt((scout.card as any)["Alien Scout"]);
      }
      break;
    }
    case "Forward Command":
      tempState.reserveImmuneThisRound = true;
      tempState.halfOverrunDamage = true;
      break;
    case "Eradicator Cannon": {
      // Active: draw 2 new cards. Card is destroyed (not returned) via destroyNextActivatedCard set in pre-decision.
      const drawn: string[] = [];
      for (let i = 0; i < 2 && game.commandDeck.length > 0; i++) {
        const card = game.commandDeck.shift()!;
        commander.hand.push(card);
        drawn.push(card.Name);
      }
      ctx.log(`  [Eradicator Cannon] ${commander.name} draws ${drawn.length} card(s): ${drawn.join(", ") || "none"}.`);
      break;
    }
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

/** Battlefield Active Effects -- run after Deployment deals hoards (most target "active enemies"/"a lane"). */
export function applyBattlefieldActive(ctx: CommandContext, card: CommandCard) {
  const { game, tempState } = ctx;
  const name = card.Name;
  const w = weakestPlayer(game);

  switch (name) {
    case "Air Strike":
      for (const p of game.players) {
        if (p.laneEnemyReserve.length > 0 && toInt(p.laneEnemyReserve[0].HP) <= 10) {
          const killed = p.laneEnemyReserve.shift()!;
          ctx.log(`  [Air Strike] Killed ${killed.Name} (HP ${killed.HP}) in ${p.name}'s lane.`);
        }
      }
      break;
    case "Land Mines":
      for (const p of game.players) {
        const before = p.laneEnemyReserve.length;
        p.laneEnemyReserve = p.laneEnemyReserve.filter((e) => toInt(e.HP) > 10);
        const killed = before - p.laneEnemyReserve.length;
        if (killed > 0) ctx.log(`  [Land Mines] ${p.name}'s lane: ${killed} enemy/enemies killed on reveal (HP ≤ 10), reveal effects denied.`);
      }
      break;
    case "Defense Turrets":
      for (const p of game.players) {
        const before = p.laneEnemyReserve.length;
        p.laneEnemyReserve = p.laneEnemyReserve.filter((e) => !(e.Reveal && toInt(e.HP) <= 15));
        const killed = before - p.laneEnemyReserve.length;
        if (killed > 0) ctx.log(`  [Defense Turrets] ${p.name}'s lane: ${killed} reveal-effect enemy/enemies killed (HP ≤ 15).`);
      }
      break;
    case "Chemical Warfare":
      for (const p of game.players) {
        p.laneEnemyReserve = p.laneEnemyReserve.map((e) => ({
          ...e,
          HP: "1",
          Damage: String(toInt(e.Damage) * 2),
        }));
        if (p.laneEnemyReserve.length) ctx.log(`  [Chemical Warfare] ${p.name}'s lane: all enemies reduced to 1HP, attack doubled.`);
      }
      break;
    case "You Shall Not Pass":
      tempState.youShallNotPassArmed = true;
      break;
    case "Suppression":
      // Lane suppression is handled in the dispatch wrapper (game.ts resolveBattlefieldCards)
      // where the activating player's seatIndex is in scope.
      break;
    case "Bunkers":
      for (const p of game.players) {
        const cur = game.laneAbilityPreventions.get(p.seatIndex) ?? 0;
        game.laneAbilityPreventions.set(p.seatIndex, cur + 1);
      }
      ctx.log(`  [Bunkers] First damage ability in each lane blocked this round.`);
      break;
    case "Barrier Systems":
      // Active (10 shields to all units in target lane) handled in dispatch wrapper in game.ts.
      break;
    case "Final Stand": {
      const targetId = game.finalStandTargetUnitId;
      const allUnits = game.players.flatMap((p) => [...(p.active ? [p.active] : []), ...p.reserve]);
      const target = targetId ? allUnits.find((ui) => ui.id === targetId) : allUnits[0];
      if (target) {
        tempState.cannotDie.add(target.id);
        ctx.log(`  [Final Stand] ${target.card.Name} cannot die this round.`);
      }
      break;
    }
    case "Whites of their eyes":
      // Target lane + doubleFirstAttack handled via whitesOfTheirEyesTargetSeat pre-decision and resolveLaneCombat flag.
      break;
    case "Punch Through":
      // Handled via punchThroughActiveSeat set in dispatch wrapper and onEnemyKill callback in resolveLaneCombat.
      break;
    case "Tranq rounds":
      tempState.tranqRoundsActiveThisRound = true;
      ctx.log(`  [Tranq Rounds] All enemy damage halved this round.`);
      break;
    case "Security Drones": {
      // Active: add 8 1/1 drones split evenly across all lanes (bypass lane unit limit by design).
      const dronesPerLane = Math.floor(8 / game.players.length);
      const remainder = 8 % game.players.length;
      game.players.forEach((p, i) => {
        const count = dronesPerLane + (i < remainder ? 1 : 0);
        for (let j = 0; j < count; j++) tempState.addTempUnit(p, makeUnitInstance(makeTempCard("Drone", 1, 1)));
      });
      ctx.log(`  [Security Drones] Added 8 1/1 drones split across ${game.players.length} lane(s).`);
      break;
    }
    default:
      break;
  }
}
