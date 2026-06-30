import { RANK_NUM, type Location } from "./constants.js";
import { toInt, type CommandCard, type EnemyCard, type GearCard, type UnitCard } from "./data.js";
import type { TacticianActivePrompt, TacticianActiveResponse, DecisionProvider } from "./decisions.js";
import { classifyEnemy } from "./enemies.js";
import { canActivateAbility, makeUnitInstance, recordAbilityActivation, reorderActive, canUseEffect, recordEffectUse, type RoundTempState } from "./state.js";
import type { GamePlayer, GameState } from "./types.js";

/** Returns a cost-adjusted copy of card for affordability/payment purposes -- covers the
 * clearest, most mechanically tractable Tactician Resource effects (shop cost reductions).
 * Ported 1:1 from tactician_discounted_cost for the first 9 roles; the other 9 (The Tactician,
 * Kingmaker, Jailer, Reclaimer, Pathfinder, Breaker, Bastion, Chessmaster, Quartermaster) were
 * sim.py-side no-ops too -- now given real hooks below where one exists (see
 * tacticianBypassesRankCheck, tacticianContainmentBuildDiscount, applyTacticianCombatMods,
 * applyTacticianPrecombat). The Reclaimer (needs a "Recycling" shared discard pile that doesn't
 * exist) and The Chessmaster (needs a distinct "Reassign" action separate from normal
 * reserve/active management, and gear text never actually says "mobility skills") still have no
 * clean hook -- documented no-ops, consistent with how this engine treats every other card
 * needing infrastructure that doesn't exist. Tactician ACTIVE effects (all 18 roles, not just
 * these 9) are a separate, consistent gap project-wide -- sim.py never dispatches them either,
 * and building a real trigger for them is a bigger, separate piece of work (a new once-per-round
 * decision point), not something this pass adds. */
export function tacticianDiscountedCost<T extends UnitCard | GearCard>(p: GamePlayer, card: T, kind: "unit" | "gear"): T {
  const t = p.tactician;
  if (!t) return card;
  const name = t.Name;
  const c: any = { ...card };
  const ctype = (card as any).Type ?? "";
  const rank = RANK_NUM[(card as any).Rank ?? (card as any)["Rank Name"]] ?? 0;

  if (kind === "gear") {
    if (name === "The Gunsmith" && ctype === "Weapon") c["Tech Cost"] = Math.max(0, toInt(c["Tech Cost"]) - 1);
    else if (name === "The Bulwark" && ctype === "Armor") c["Tech Cost"] = Math.max(0, toInt(c["Tech Cost"]) - 1);
    else if (name === "The Engineer" && ctype === "Utility") c["Tech Cost"] = Math.max(0, toInt(c["Tech Cost"]) - 2);
  } else if (kind === "unit") {
    if (name === "The Drillmaster" && rank < 5) c["Alien Cost"] = 0;
    else if (name === "The Specialist" && rank > 4) c["Alien Cost"] = Math.floor(toInt(c["Alien Cost"]) / 2);
    else if (name === "The Driver" && ctype.includes("Vehicle")) {
      c["Tech Cost"] = Math.floor(toInt(c["Tech Cost"]) / 2);
      c["Organic Cost"] = Math.floor(toInt(c["Organic Cost"]) / 2);
    } else if (name === "The Recruiter" && ctype.includes("Infantry")) {
      c["Organic Cost"] = Math.floor(toInt(c["Organic Cost"]) / 2);
    } else if (name === "The Pilot" && ctype.includes("Mech")) {
      c["Tech Cost"] = Math.floor(toInt(c["Tech Cost"]) / 2);
    }
  }
  // The Quartermaster: "Direct-fill slots cost 1 less of your choice" -- this engine's shop
  // refill doesn't tag which slots came from Direct vs. Roll fill, so this approximates as a
  // flat -1 Tech (the most universal resource) on every unit/gear purchase instead.
  if (name === "The Quartermaster") c["Tech Cost"] = Math.max(0, toInt(c["Tech Cost"]) - 1);
  return c as T;
}

/** The Pathfinder: "Scouts rank is not needed to recruit" -- bypasses the normal
 * RANK_NUM[card.Rank] <= player.rank eligibility check for Scout-type units specifically. */
export function tacticianBypassesRankCheck(p: GamePlayer, card: UnitCard): boolean {
  return p.tactician?.Name === "The Pathfinder" && card.Type.includes("Scout");
}

/** The Jailer: "Containment Block upgrades cost no Alien." */
export function tacticianContainmentBuildDiscount(p: GamePlayer, loc: Location, card: CommandCard): CommandCard {
  if (p.tactician?.Name !== "The Jailer" || loc !== "Containment Block") return card;
  return { ...card, Alien: "0" };
}

/** The Breaker ("Units in your lane Shred on hit = your rank"), The Bastion ("Units in your
 * lane Shred 2 when entering combat"), and The Drillmaster ("Units under Rank 5 gain
 * Attack/HP = double your rank − their rank") all modify per-Combatant stats at construction.
 * Pass the source UnitInstance so Drillmaster can read the unit's rank. */
export function applyTacticianCombatMods(c: import("./combat.js").Combatant, p: GamePlayer, ui?: import("./types.js").UnitInstance) {
  const name = p.tactician?.Name;
  if (name === "The Breaker") c.shredArmor = Math.max(c.shredArmor, p.rank);
  else if (name === "The Bastion") c.shredArmor = Math.max(c.shredArmor, 2);
  else if (name === "The Drillmaster" && ui) {
    const unitRank = RANK_NUM[(ui.card as any).Rank ?? ""] ?? 0;
    if (unitRank > 0 && unitRank < 5) {
      const bonus = 2 * p.rank - unitRank;
      if (bonus > 0) {
        c.dmg  += bonus;
        c.hp   += bonus;
        c.curHp = Math.min(c.curHp + bonus, c.hp);
      }
    }
  }
}

/** The Bastion: "...they also start with Shield = your rank" -- applied once before combat,
 * same timing as every other precombat Unit/Gear shield bonus. */
export function applyTacticianPrecombat(p: GamePlayer) {
  if (p.tactician?.Name === "The Bastion" && p.active) {
    p.active.curShields += p.rank;
  }
}

/** Once-per-round (or once-per-game for The Kingmaker) Active effects for all 18 Tactician
 * roles. Called pre-combat, BEFORE gear actives, so The Engineer's refresh takes effect in
 * the same round's gear active loop. Bot decisions use BotDecisionProvider heuristics;
 * human seats emit a socket prompt via chooseTacticianActiveTarget and wait for a response.
 *
 * `dispatch` is a closure over GameEngine.dispatchEffect -- passed in so The Tactician can
 * immediately activate the drawn command card. `commander` is the current round's commander,
 * needed for The Tactician's dispatch context.
 *
 * Deferred (no real hook yet): The Pathfinder (needs reveal system -- see project memory
 * "Deferred mechanics"), The Quartermaster (needs roll-fill tracking). */
export async function applyTacticianActive(
  game: GameState,
  p: GamePlayer,
  decisions: DecisionProvider,
  log: (t: string) => void,
  tempState: RoundTempState,
  dispatch: (card: CommandCard, loc: Location) => void
): Promise<void> {
  const tac = p.tactician;
  if (!tac) return;
  const name = tac.Name;
  const synId = `tac-${p.seatIndex}`;

  // The Kingmaker is once-per-game (effectUses); all others are once-per-round.
  if (name === "The Kingmaker") {
    if (!canUseEffect(game, `tac-kingmaker-${p.seatIndex}`, 1)) return;
  } else {
    if (!canActivateAbility(game, synId, name)) return;
  }

  const allUnits = (q: GamePlayer) => [...(q.active ? [q.active] : []), ...q.reserve];
  let activated = false;

  switch (name) {
    // ── The Gunsmith ──────────────────────────────────────────────────────────
    case "The Gunsmith": {
      if (!p.active) break;
      const laneEnemies = game.players
        .filter(q => q.laneEnemyReserve.some(e => !classifyEnemy(e).has("untargetable_by_abilities")))
        .map(q => ({
          seatIndex: q.seatIndex,
          playerName: q.name,
          enemies: q.laneEnemyReserve
            .map((e, idx) => ({ name: e.Name, hp: toInt(e.HP), armor: toInt(e.Armor ?? "0"), idx }))
            .filter(entry => !classifyEnemy(q.laneEnemyReserve[entry.idx]).has("untargetable_by_abilities")),
        }))
        .filter(lane => lane.enemies.length);
      if (!laneEnemies.length) break;
      const resp = await decisions.chooseTacticianActiveTarget(p, game, {
        tacticianName: name, kind: "enemy_pick", laneEnemies,
      });
      const targetLane = game.players.find(q => q.seatIndex === resp.seatIndex);
      const enemy = targetLane?.laneEnemyReserve[resp.enemyIdx ?? -1];
      if (!targetLane || !enemy) break;
      const dmg = toInt(p.active.card.Damage);
      const armor = toInt((enemy as any).Armor ?? "0");
      const net = Math.max(0, dmg - armor);
      if (net >= toInt(enemy.HP)) {
        targetLane.laneEnemyReserve = targetLane.laneEnemyReserve.filter((_, i) => i !== resp.enemyIdx);
        log(`  [The Gunsmith] ${p.name} deals ${net} dmg to ${enemy.Name} in ${targetLane.name}'s lane -- eliminated`);
      } else {
        const newHp = toInt(enemy.HP) - net;
        (enemy as any).HP = String(newHp);
        log(`  [The Gunsmith] ${p.name} deals ${net} dmg to ${enemy.Name} -- survived (${newHp} HP remaining, carries into combat)`);
      }
      activated = true;
      break;
    }

    // ── The Bulwark ───────────────────────────────────────────────────────────
    case "The Bulwark": {
      if (!p.active) break;
      const armorGear = p.active.equipped
        .map((g, equippedIdx) => ({ g, equippedIdx }))
        .filter(({ g }) => (g as any).Type === "Armor");
      if (!armorGear.length) break;
      const gearOptions = armorGear.map(({ g, equippedIdx }) => ({
        unitId: p.active!.id, unitName: p.active!.card.Name,
        gearName: (g as any).Name, gearType: "Armor", equippedIdx,
      }));
      const resp = await decisions.chooseTacticianActiveTarget(p, game, {
        tacticianName: name, kind: "gear_pick", gearOptions,
      });
      const pick = gearOptions[resp.gearOptIdx ?? 0];
      if (!pick) break;
      const g = p.active.equipped[pick.equippedIdx] as any;
      const armorStat = toInt(g.Armor ?? "0");
      p.active.equipped.splice(pick.equippedIdx, 1); // destroyed
      p.active.curShields += armorStat * 2;
      log(`  [The Bulwark] ${p.name} destroys ${g.Name} (${armorStat} Armor) for +${armorStat * 2} shields`);
      activated = true;
      break;
    }

    // ── The Engineer ──────────────────────────────────────────────────────────
    case "The Engineer": {
      // Find Utility gear on any of this player's units that has already been used this round.
      const usedUtilities: TacticianActivePrompt["gearOptions"] = [];
      for (const ui of allUnits(p)) {
        for (let i = 0; i < ui.equipped.length; i++) {
          const g = ui.equipped[i] as any;
          if (g.Type !== "Utility") continue;
          const key = `${ui.id}-${g.Name}`;
          if ((game.abilityUsesThisRound.get(key) ?? 0) > 0) {
            usedUtilities.push({ unitId: ui.id, unitName: ui.card.Name, gearName: g.Name, gearType: "Utility", equippedIdx: i });
          }
        }
      }
      if (!usedUtilities.length) break;
      const resp = await decisions.chooseTacticianActiveTarget(p, game, {
        tacticianName: name, kind: "gear_pick", gearOptions: usedUtilities,
      });
      const pick = usedUtilities[resp.gearOptIdx ?? 0];
      if (!pick) break;
      // Reset use count AND mark for one free activation this round.
      const key = `${pick.unitId}-${pick.gearName}`;
      game.abilityUsesThisRound.set(key, 0);
      game.freeAbilityNextUse.add(key);
      log(`  [The Engineer] ${p.name} refreshes ${pick.gearName} on ${pick.unitName} (1 free re-activation this round)`);
      activated = true;
      break;
    }

    // ── The Tactician ─────────────────────────────────────────────────────────
    case "The Tactician": {
      if (!game.commandDeck.length) break;
      const card = game.commandDeck.pop()!;
      const loc = card.Building as Location;
      const resp = await decisions.chooseTacticianActiveTarget(p, game, {
        tacticianName: name, kind: "card_action",
        cardName: card.Name,
        cardActiveEffect: card["Active Effect"],
        cardBuildEffect: card["Passive Effect"] ?? card.Building,
        canActivate: true,
        canBuild: true,
      });
      if (resp.cardAction === "activate") {
        dispatch(card, loc);
        log(`  [The Tactician] ${p.name} draws ${card.Name} and activates it for free`);
        activated = true;
      } else if (resp.cardAction === "build") {
        // Build for free: would normally cost command pool resources; skip payment.
        // The card goes back to the command deck after building, same as normal build.
        dispatch(card, loc); // building dispatch handles the permanent upgrade
        log(`  [The Tactician] ${p.name} draws ${card.Name} and builds it for free`);
        activated = true;
      } else {
        // Keep in hand: return card to player's hand for later use.
        p.hand.push(card);
        log(`  [The Tactician] ${p.name} draws ${card.Name} and keeps it in hand`);
        activated = true; // still counts as using the active
      }
      break;
    }

    // ── The Kingmaker ─────────────────────────────────────────────────────────
    case "The Kingmaker": {
      const opts = game.players
        .filter(q => q.seatIndex !== p.seatIndex)
        .map(q => ({ seatIndex: q.seatIndex, name: q.name, rank: q.rank }));
      if (!opts.length) break;
      const resp = await decisions.chooseTacticianActiveTarget(p, game, {
        tacticianName: name, kind: "player_pick", playerOptions: opts,
      });
      const newCommIdx = game.players.findIndex(q => q.seatIndex === resp.targetSeat);
      if (newCommIdx === -1) break;
      game.commanderIdx = newCommIdx;
      game.commanderLocked = true;
      recordEffectUse(game, `tac-kingmaker-${p.seatIndex}`);
      log(`  [The Kingmaker] ${p.name} designates ${game.players[newCommIdx].name} as commander (locked for 1 round)`);
      activated = true;
      break;
    }

    // ── The Drillmaster ───────────────────────────────────────────────────────
    case "The Drillmaster": {
      if (!game.shopUnits.length) break;
      const minRank = Math.min(...game.shopUnits.map(u => RANK_NUM[u.Rank] ?? 1));
      const tied = game.shopUnits.map((u, idx) => ({ u, idx })).filter(({ u }) => (RANK_NUM[u.Rank] ?? 1) === minRank);
      let chosen = tied[0];
      if (tied.length > 1) {
        const opts = tied.map(({ u, idx }) => ({ name: u.Name, rank: u.Rank, idx }));
        const resp = await decisions.chooseTacticianActiveTarget(p, game, {
          tacticianName: name, kind: "shop_pick", shopOptions: opts,
        });
        chosen = tied[resp.optionIdx ?? 0] ?? tied[0];
      }
      game.shopUnits.splice(chosen.idx, 1);
      const ui = makeUnitInstance(chosen.u);
      if (!p.active) p.active = ui; else p.reserve.push(ui);
      log(`  [The Drillmaster] ${p.name} recruits ${chosen.u.Name} (Rank ${chosen.u.Rank}) from shop for free`);
      activated = true;
      break;
    }

    // ── The Specialist ────────────────────────────────────────────────────────
    case "The Specialist": {
      if (!game.shopUnits.length) break;
      const maxRank = Math.max(...game.shopUnits.map(u => RANK_NUM[u.Rank] ?? 1));
      const tied = game.shopUnits.map((u, idx) => ({ u, idx })).filter(({ u }) => (RANK_NUM[u.Rank] ?? 1) === maxRank);
      let chosen = tied[0];
      if (tied.length > 1) {
        const opts = tied.map(({ u, idx }) => ({ name: u.Name, rank: u.Rank, idx }));
        const resp = await decisions.chooseTacticianActiveTarget(p, game, {
          tacticianName: name, kind: "shop_pick", shopOptions: opts,
        });
        chosen = tied[resp.optionIdx ?? 0] ?? tied[0];
      }
      game.shopUnits.splice(chosen.idx, 1);
      // Pay Organic + Tech as normal; Alien cost is waived.
      p.res.Organic -= toInt((chosen.u as any)["Organic Cost"] ?? "0");
      p.res.Tech -= toInt((chosen.u as any)["Tech Cost"] ?? "0");
      const ui = makeUnitInstance(chosen.u);
      if (!p.active) p.active = ui; else p.reserve.push(ui);
      reorderActive(p);
      log(`  [The Specialist] ${p.name} recruits ${chosen.u.Name} (Rank ${chosen.u.Rank}) with no Alien cost`);
      activated = true;
      break;
    }

    // ── The Driver / The Recruiter / The Pilot ────────────────────────────────
    case "The Driver":
    case "The Recruiter":
    case "The Pilot": {
      const typeMap: Record<string, string> = {
        "The Driver": "Vehicle", "The Recruiter": "Infantry", "The Pilot": "Mech",
      };
      const wantType = typeMap[name];
      const matchIdx = game.unitDeck.findIndex(
        u => u.Type.includes(wantType) && (RANK_NUM[u.Rank] ?? 1) === p.rank
      );
      if (matchIdx === -1) {
        log(`  [${name}] ${p.name} searches deck -- no ${wantType} at Rank ${p.rank} found`);
        break;
      }
      const [found] = game.unitDeck.splice(matchIdx, 1);
      const ui = makeUnitInstance(found);
      if (!p.active) p.active = ui; else p.reserve.push(ui);
      reorderActive(p);
      log(`  [${name}] ${p.name} recruits ${found.Name} (Rank ${found.Rank}) from deck for free`);
      activated = true;
      break;
    }

    // ── The Reclaimer ─────────────────────────────────────────────────────────
    case "The Reclaimer": {
      const eligible = game.recyclePile
        .map((g, idx) => ({ g, idx }))
        .filter(({ g }) => (RANK_NUM[(g as any)["Rank Name"]] ?? 0) <= p.rank);
      if (!eligible.length) break;
      // Sort ascending by rank so the bot picks the last (highest) entry.
      eligible.sort((a, b) => (RANK_NUM[(a.g as any)["Rank Name"]] ?? 0) - (RANK_NUM[(b.g as any)["Rank Name"]] ?? 0));
      const recycleOptions = eligible.map(({ g, idx }) => ({
        name: (g as any).Name ?? "?", rankName: (g as any)["Rank Name"] ?? "?", idx,
      }));
      const resp = await decisions.chooseTacticianActiveTarget(p, game, {
        tacticianName: name, kind: "recycle_pick", recycleOptions,
      });
      const pick = eligible[resp.optionIdx ?? eligible.length - 1] ?? eligible[eligible.length - 1];
      game.recyclePile.splice(pick.idx, 1);
      p.gearHand.push(pick.g as any);
      log(`  [The Reclaimer] ${p.name} recovers ${(pick.g as any).Name} from recycle pile`);
      activated = true;
      break;
    }

    // ── The Breaker ───────────────────────────────────────────────────────────
    case "The Breaker":
      game.breakerActive = true;
      log(`  [The Breaker] ${p.name} strips all shields and armor from enemies across every lane`);
      activated = true;
      break;

    // ── The Bastion ───────────────────────────────────────────────────────────
    case "The Bastion": {
      const gain = p.rank * 10;
      for (const q of game.players) {
        if (q.active) q.active.curShields += gain;
      }
      log(`  [The Bastion] ${p.name} grants +${gain} shields to all friendlies`);
      activated = true;
      break;
    }

    // ── The Chessmaster ───────────────────────────────────────────────────────
    case "The Chessmaster": {
      const laneEnemies = game.players
        .filter(q => q.laneEnemyReserve.some(e => !classifyEnemy(e).has("untargetable_by_abilities")))
        .map(q => ({
          seatIndex: q.seatIndex,
          playerName: q.name,
          enemies: q.laneEnemyReserve
            .map((e, idx) => ({ name: e.Name, hp: toInt(e.HP), armor: toInt((e as any).Armor ?? "0"), idx }))
            .filter(entry => !classifyEnemy(q.laneEnemyReserve[entry.idx]).has("untargetable_by_abilities")),
        }))
        .filter(lane => lane.enemies.length);
      if (laneEnemies.length < 2) break;
      const resp = await decisions.chooseTacticianActiveTarget(p, game, {
        tacticianName: name, kind: "swap_enemies", laneEnemies,
      });
      if (!resp.enemyA || !resp.enemyB) break;
      const laneA = game.players.find(q => q.seatIndex === resp.enemyA!.seatIndex);
      const laneB = game.players.find(q => q.seatIndex === resp.enemyB!.seatIndex);
      if (!laneA || !laneB || laneA === laneB) break;
      const idxA = resp.enemyA.enemyIdx;
      const idxB = resp.enemyB.enemyIdx;
      if (!laneA.laneEnemyReserve[idxA] || !laneB.laneEnemyReserve[idxB]) break;
      // Clone both so they become unique references for the doubled-set.
      const cloneA = { ...laneA.laneEnemyReserve[idxA] } as EnemyCard;
      const cloneB = { ...laneB.laneEnemyReserve[idxB] } as EnemyCard;
      laneA.laneEnemyReserve[idxA] = cloneB; // A gets B's enemy
      laneB.laneEnemyReserve[idxB] = cloneA; // B gets A's enemy
      game.chessmasterDoubledEnemies.add(cloneA);
      game.chessmasterDoubledEnemies.add(cloneB);
      log(`  [The Chessmaster] ${p.name} swaps ${cloneA.Name} (into ${laneB.name}'s lane) ↔ ${cloneB.Name} (into ${laneA.name}'s lane) -- both take double damage`);
      activated = true;
      break;
    }

    // ── The Jailer ────────────────────────────────────────────────────────────
    case "The Jailer": {
      if (!game.containedEnemyPool.length) break;
      // "Combine both units from Containment Block and move them to your lane" -- pulls all
      // contained enemies out of the pool and adds them to this player's lane as controlled
      // units (same Reanimator pattern: makeUnitInstance from the enemy's stat-line).
      for (const enemy of game.containedEnemyPool) {
        const synUnit = makeUnitInstance({ ...enemy, Rank: "Conscript" } as unknown as UnitCard);
        if (!p.active) p.active = synUnit; else p.reserve.push(synUnit);
      }
      log(`  [The Jailer] ${p.name} moves ${game.containedEnemyPool.length} contained unit(s) into their lane`);
      game.containedEnemyPool = [];
      activated = true;
      break;
    }

    // ── Deferred ──────────────────────────────────────────────────────────────
    case "The Pathfinder":
      // Active ("prevent reveal ability on next 2 enemies") requires a reveal-trigger dispatch
      // system that doesn't exist yet. Tracked in project memory "Deferred mechanics".
      break;
    case "The Quartermaster":
      // Active ("reroll one Roll-fill result") requires per-slot roll-fill tracking that
      // doesn't exist yet. Tracked in project memory "Deferred mechanics".
      break;

    default:
      break;
  }

  if (activated) {
    if (name !== "The Kingmaker") {
      recordAbilityActivation(game, p.seatIndex, synId, name);
    }
  }
}
