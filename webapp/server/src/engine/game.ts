import {
  COMMAND_HAND_SIZE,
  COMMANDER_HAND_SIZE,
  ENEMY_RANK_NUM,
  LOCATIONS,
  OVERRUN_START,
  RANK_NUM,
  RANK_ORDER,
  UPGRADE_SLOT_CAP,
  enemyRankFromProgress,
  hoardCount,
  type Difficulty,
  type EnemyRank,
  type Location,
} from "./constants.js";
import { loadGameData, toInt, type CommandCard, type EnemyCard, type UnitCard } from "./data.js";
import {
  combatantFromUnit,
  equippedBonus,
  resolveLaneCombat,
  Combatant,
} from "./combat.js";
import { applyBattlefieldActive, applyCommandActive } from "./commandCards.js";
import { applyExplodeOnDeath, applyPrecombatUnit, applyUnitCombatMods, tryReviveOnce } from "./units.js";
import { applyEnemyCombatMods } from "./enemies.js";
import { applyGearCombatMods, applyPrecombatGear, tryChronostasisSave } from "./gear.js";
import { type BotDecisionProvider, type DecisionProvider } from "./decisions.js";
import { ensureLowestRankGear, ensureLowestRankUnit, refillShopGear, refillShopUnit } from "./shop.js";
import {
  RoundTempState,
  canAfford,
  canUseEffect,
  GEAR_COST_KEYS,
  healUnit,
  instancePower,
  makeUnitInstance,
  pay,
  recordEffectUse,
  UNIT_COST_KEYS,
  weakestPlayer,
} from "./state.js";
import type { GamePlayer, GameState, UnitInstance } from "./types.js";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface SeatInput {
  seatIndex: number;
  name: string;
  isBot: boolean;
}

export type LogFn = (text: string) => void;

export class GameEngine {
  game: GameState;
  private unitDeckFull: UnitCard[];
  private gearDeckFull: GearCard2[];
  private commandDeckFull: CommandCard[];
  private enemyByRank: Record<EnemyRank, EnemyCard[]>;
  private decisions: DecisionProvider;
  private onLog: LogFn;
  private placementsThisRound: Record<number, Location[]> = {};
  private containedEnemies: EnemyRank[] = [];
  private locationUpgradesBuilt: Record<Location, CommandCard[]>;
  private nextCommanderSeatIndex: number | null = null;
  /** Fired once per resolved worker placement (bot or human), for the server layer to broadcast
   * live board updates during the placement phase -- separate from onLog since this is
   * structured data, not a text line. */
  onPlacement?: (seatIndex: number, location: Location) => void;

  constructor(seats: SeatInput[], difficulty: Difficulty, decisions: DecisionProvider, onLog: LogFn) {
    const data = loadGameData();
    this.unitDeckFull = shuffle(data.units);
    this.gearDeckFull = shuffle(data.gear) as any;
    this.commandDeckFull = shuffle(data.commandCards);
    this.enemyByRank = {} as any;
    for (const e of data.enemies) {
      const r = e.Rank as EnemyRank;
      (this.enemyByRank[r] ??= []).push(e);
    }
    this.decisions = decisions;
    this.onLog = onLog;
    this.locationUpgradesBuilt = Object.fromEntries(LOCATIONS.map((l) => [l, []])) as any;

    const players: GamePlayer[] = seats.map((s) => ({
      seatIndex: s.seatIndex,
      name: s.name,
      isBot: s.isBot,
      rank: 1,
      res: { Organic: 2, Tech: 0, Alien: 0 }, // README #36 starting Organic lever
      active: null,
      reserve: [],
      laneEnemyReserve: [],
      hand: [],
      gearHand: [],
      graveyard: [],
      overrunLastRound: false,
      stats: { kills: 0, deaths: 0, overrunsSuffered: 0, promotionsReceived: 0 },
    }));

    const leaderIdx = Math.floor(Math.random() * players.length);
    players[leaderIdx].rank = 2;

    this.game = {
      players,
      commanderIdx: leaderIdx,
      roundNum: -1,
      playerProgress: 0,
      enemyProgress: 0,
      overrunTracker: OVERRUN_START[difficulty],
      overrunTrackerMax: OVERRUN_START[difficulty],
      settings: { difficulty },
      commandPool: { Organic: 0, Tech: 0, Alien: 0 },
      shopUnits: [],
      shopGear: [] as any,
      unitDeck: this.unitDeckFull,
      gearDeck: this.gearDeckFull as any,
      commandDeck: this.commandDeckFull,
      locationUpgradesBuilt: this.locationUpgradesBuilt,
      teamScoutPool: [],
      status: "running",
      log: [],
      effectUses: new Map(),
    };

    refillShopUnit(this.game);
    refillShopGear(this.game);

    for (const p of players) {
      p.hand = this.dealCommandCards(COMMAND_HAND_SIZE);
    }
    players[leaderIdx].hand.push(...this.dealCommandCards(2));

    this.log(`Leader: ${players[leaderIdx].name} (starts at Rank 2 / Private)`);
    this.log(`Difficulty: ${difficulty} | Overrun Tracker starts at ${this.game.overrunTracker}/20`);
  }

  private dealCommandCards(n: number): CommandCard[] {
    const out: CommandCard[] = [];
    for (let i = 0; i < n && this.game.commandDeck.length; i++) {
      out.push(this.game.commandDeck.pop()!);
    }
    return out;
  }

  private log(text: string) {
    this.game.log.push({ round: this.game.roundNum, text });
    this.onLog(text);
  }

  /** Runs one round (Planning/Deployment/Combat/Cleanup, or the Round 0 prep variant). Returns
   * false once the game has reached a win/loss/safety-cap end state (caller should stop calling). */
  async runRound(): Promise<boolean> {
    const game = this.game;
    game.roundNum += 1;
    if (game.roundNum > 40) {
      this.log(`--- SAFETY CAP: stopping after 40 rounds (no resolution) ---`);
      game.status = "lost";
      return false;
    }
    const isPrepRound = game.roundNum === 0;
    const commander = game.players[game.commanderIdx];
    this.log(
      `\n========== ROUND ${game.roundNum}${isPrepRound ? " (PREP, no enemies)" : ""} | Commander: ${commander.name} (Rk${commander.rank}) | PlayerProg ${game.playerProgress}/10 | EnemyProg ${game.enemyProgress}/10 | Overrun ${game.overrunTracker}/20 ==========`
    );

    const tempState = new RoundTempState();
    const diffCount = hoardCount(game.settings.difficulty, game.playerProgress);
    const diffRank = enemyRankFromProgress(game.enemyProgress);

    if (isPrepRound) {
      this.log("  [Round 0] Prep round -- no enemy hoard, no Combat Stage.");
    }

    // ---------------- PLANNING ----------------
    this.placementsThisRound = Object.fromEntries(game.players.map((p) => [p.seatIndex, []]));
    await this.runWorkerPlacementAndIncome(commander, diffCount);

    ensureLowestRankUnit(game);
    ensureLowestRankGear(game);

    for (const p of game.players) {
      if (p.overrunLastRound) {
        p.res.Organic += 3;
        p.res.Tech += 3;
        p.res.Alien += 2;
        this.log(`  [Catch-up Resupply] ${p.name} (overrun last round) gets +3 Organic +3 Tech +2 Alien`);
      }
    }

    this.runRetireFromDuty();
    for (const p of game.players) {
      await this.runPurchasing(p);
    }

    for (const p of game.players) {
      if (p !== commander) {
        for (const res of ["Organic", "Tech", "Alien"] as const) {
          const donate = Math.floor(p.res[res] / 3);
          p.res[res] -= donate;
          game.commandPool[res] += donate;
        }
      }
    }

    await this.resolveHand(commander, (loc) => loc !== "Battlefield", tempState, diffRank);
    await this.resolveNonCommanderHands(commander, (loc) => loc !== "Battlefield", tempState, diffRank);

    this.log(`  Placements: ${JSON.stringify(this.placementsThisRound)}`);
    this.log(`  Command pool: O${game.commandPool.Organic} T${game.commandPool.Tech} A${game.commandPool.Alien}`);

    let overrunLanes = 0;

    if (!isPrepRound) {
      overrunLanes = await this.runDeploymentAndCombat(commander, diffCount, diffRank, tempState);
    } else {
      this.log("  [Round 0] No enemies, no Combat Stage this round.");
    }

    // ---------------- CLEANUP ----------------
    tempState.clear();

    for (const p of game.players) {
      const cap = p === commander ? COMMANDER_HAND_SIZE : COMMAND_HAND_SIZE;
      while (p.hand.length < cap && game.commandDeck.length) {
        p.hand.push(game.commandDeck.pop()!);
      }
    }

    let dmg = 0;
    if (overrunLanes) {
      dmg = tempState.halfOverrunDamage ? Math.floor(overrunLanes / 2) : overrunLanes;
      dmg = Math.max(dmg, 1);
      game.overrunTracker -= dmg;
      this.log(`  Overrun Tracker -${dmg} -> ${game.overrunTracker}/20`);
    }

    if (game.overrunTracker <= 0) {
      this.log(`\n#### PLAYERS LOSE on Round ${game.roundNum}. Overrun Tracker hit 0. ####`);
      game.status = "lost";
      return false;
    }

    if (game.roundNum > 1) {
      game.enemyProgress = Math.min(10, game.enemyProgress + 1);
      if (overrunLanes === 0) game.playerProgress += 1;
    }
    this.log(`  After Escalate: PlayerProg ${game.playerProgress}/10, EnemyProg ${game.enemyProgress}/10`);

    if (game.roundNum > 0 && game.roundNum % 2 === 0) {
      for (const p of game.players) {
        if (p.rank < RANK_ORDER.length) p.rank += 1;
      }
      this.log(`  [Rank Trickle] Every player +1 Rank -> [${game.players.map((p) => RANK_ORDER[p.rank - 1]).join(", ")}]`);
    }

    // README 4.5/7.2: the commander is whoever placed the FIRST worker at Command this round
    // (a real race now that placement is turn-based -- see runWorkerPlacementAndIncome). Falls
    // back to round-robin only on the rare round nobody chooses Command at all.
    if (this.nextCommanderSeatIndex !== null) {
      const idx = game.players.findIndex((p) => p.seatIndex === this.nextCommanderSeatIndex);
      game.commanderIdx = idx !== -1 ? idx : (game.commanderIdx + 1) % game.players.length;
    } else {
      game.commanderIdx = (game.commanderIdx + 1) % game.players.length;
    }

    if (game.playerProgress >= 10) {
      this.log(`\n#### PLAYERS WIN on Round ${game.roundNum}! Player Progress reached 10. ####`);
      game.status = "won";
      return false;
    }

    return true;
  }

  /** README 4.5/7.2 ("the 1st worker placed at Command each round takes it") implemented as a
   * real turn-based race: workers go one at a time, round-robin starting to the commander's
   * left (same convention as Mission Assignment passing), commander going last each lap. Each
   * player's DecisionProvider picks a location for their own worker; whoever's the first to ever
   * pick Command this round becomes next round's commander (consumed in runRound's Cleanup). */
  private async runWorkerPlacementAndIncome(commander: GamePlayer, diffCount: number) {
    const game = this.game;
    const workerCount = (p: GamePlayer) => (p.rank >= 4 ? 3 : 2);
    const remaining = new Map(game.players.map((p) => [p.seatIndex, workerCount(p)]));
    remaining.set(commander.seatIndex, remaining.get(commander.seatIndex)! + 1);

    const commanderPos = game.players.findIndex((p) => p.seatIndex === commander.seatIndex);
    const turnOrder = [
      ...game.players.slice(commanderPos + 1),
      ...game.players.slice(0, commanderPos + 1),
    ];

    const locWorkers: Record<Location, GamePlayer[]> = Object.fromEntries(LOCATIONS.map((l) => [l, []])) as any;
    this.nextCommanderSeatIndex = null;
    let anyRemaining = true;
    while (anyRemaining) {
      anyRemaining = false;
      for (const p of turnOrder) {
        if (remaining.get(p.seatIndex)! <= 0) continue;
        anyRemaining = true;
        const placedSoFar = Object.fromEntries(
          LOCATIONS.map((l) => [l, locWorkers[l].map((q) => ({ seatIndex: q.seatIndex, name: q.name }))])
        ) as Record<Location, { seatIndex: number; name: string }[]>;
        const loc = await this.decisions.chooseWorkerPlacement(p, game, placedSoFar);
        locWorkers[loc].push(p);
        remaining.set(p.seatIndex, remaining.get(p.seatIndex)! - 1);
        this.placementsThisRound[p.seatIndex].push(loc);
        if (loc === "Command" && this.nextCommanderSeatIndex === null) {
          this.nextCommanderSeatIndex = p.seatIndex;
        }
        this.log(`  ${p.name} places a worker at ${loc}`);
        this.onPlacement?.(p.seatIndex, loc);
      }
    }

    for (const loc of LOCATIONS) {
      const workers = locWorkers[loc];
      workers.forEach((p, idx) => {
        const full = idx < 2;
        if (loc === "Barracks") {
          const totalRank = game.shopUnits.reduce((s, u) => s + RANK_NUM[u.Rank], 0) + (4 - game.shopUnits.length);
          const amt = full ? totalRank : Math.floor(totalRank / 2);
          p.res.Organic += amt;
          p.res.Tech += Math.floor(amt / 2);
        } else if (loc === "Armory") {
          const totalRank = game.shopGear.reduce((s, g) => s + RANK_NUM[(g as any)["Rank Name"]], 0) + (2 - game.shopGear.length);
          const amt = full ? totalRank * 2 : Math.floor((totalRank * 2) / 2);
          p.res.Tech += amt;
          p.res.Organic += Math.floor(amt / 2);
        } else if (loc === "Medical Bay") {
          p.res.Organic += full ? 1 : 0;
          const wounded = [...(p.active ? [p.active] : []), ...p.reserve].filter((u) => u.curHp < u.maxHp);
          const target = wounded[0];
          if (target) {
            const healed = healUnit(target);
            if (healed) {
              p.res.Organic += 2;
              this.log(`  ${p.name} heals ${target.card.Name} at Medical Bay (+${healed} HP)`);
            }
          }
        } else if (loc === "Containment Block") {
          const containedRank = this.containedEnemies.reduce((s, r) => s + ENEMY_RANK_NUM[r], 0);
          const amt = full ? containedRank + 1 : Math.floor((containedRank + 1) / 2);
          p.res.Alien += amt;
        } else if (loc === "Battlefield") {
          game.commandPool.Organic += full ? 1 : 0;
          game.commandPool.Tech += full ? 1 : 0;
          game.commandPool.Alien += full ? 2 : 1;
        } else if (loc === "Command") {
          p.res.Alien += full ? p.rank : Math.floor(p.rank / 2);
        }
      });
    }
  }

  private runRetireFromDuty() {
    const game = this.game;
    for (const p of game.players) {
      const obsolete = p.reserve.filter((u) => p.rank - RANK_NUM[u.card.Rank] >= 2);
      for (const u of obsolete) {
        p.reserve.splice(p.reserve.indexOf(u), 1);
        const refundKeys = ["Organic Cost", "Tech Cost", "Alien Cost"] as const;
        const biggest = refundKeys.reduce((a, b) => (toInt((u.card as any)[b]) > toInt((u.card as any)[a]) ? b : a));
        p.res[biggest.split(" ")[0] as keyof typeof p.res] += toInt((u.card as any)[biggest]);
        game.unitDeck.push(u.card);
        p.gearHand.push(...u.equipped.filter((g) => "Rank Name" in (g as any)));
        this.log(`  ${p.name} retires ${u.card.Name} (Rank ${u.card.Rank}) for a partial refund`);
      }
    }
  }

  private async runPurchasing(p: GamePlayer) {
    const game = this.game;
    let bought = 0;
    while (bought < 2) {
      const affordable = game.shopUnits.filter(
        (u) => RANK_NUM[u.Rank] <= p.rank && canAfford(p.res, u, UNIT_COST_KEYS)
      );
      const choice = await this.decisions.chooseNextUnitPurchase(p, game, affordable);
      if (!choice) break;
      pay(p.res, choice, UNIT_COST_KEYS);
      game.shopUnits.splice(game.shopUnits.indexOf(choice), 1);
      refillShopUnit(game);
      const ui = makeUnitInstance(choice);
      if (choice.Type.includes("Scout")) {
        game.teamScoutPool.push(ui);
        this.log(`  ${p.name} donates ${ui.card.Name} to the team scout pool`);
      } else if (p.active === null) {
        p.active = ui;
      } else {
        p.reserve.push(ui);
      }
      bought += 1;
    }

    const equipOntoActive = (g: any): boolean => {
      const cost = RANK_NUM[g["Rank Name"]] ?? 1;
      if (p.res.Tech < cost) {
        p.gearHand.push(g);
        this.log(`  ${p.name} can't afford ${cost} Tech to equip ${g.Name} -- held in hand`);
        return false;
      }
      p.res.Tech -= cost;
      p.active!.equipped.push(g);
      const hpBonus = toInt(g.HP);
      p.active!.maxHp += hpBonus;
      p.active!.curHp += hpBonus;
      p.active!.curShields += toInt(g.Shields);
      this.log(
        `  ${p.name} equips ${g.Name} (Tech -${cost}) (Dmg+${toInt(g.Damage)} HP+${toInt(g.HP)} Arm+${toInt(g.Armor)} Shd+${toInt(g.Shields)})`
      );
      return true;
    };

    const pendingHand = [...p.gearHand];
    p.gearHand = [];
    for (const g of pendingHand) {
      if (p.active) equipOntoActive(g);
      else p.gearHand.push(g);
    }

    let gearBought = 0;
    while (p.active && gearBought < 2) {
      const affordableG = game.shopGear.filter(
        (g) => RANK_NUM[(g as any)["Rank Name"]] <= p.rank && canAfford(p.res, g as any, GEAR_COST_KEYS)
      );
      const choice = await this.decisions.chooseNextGearPurchase(p, game, affordableG as any);
      if (!choice) break;
      pay(p.res, choice as any, GEAR_COST_KEYS);
      game.shopGear.splice(game.shopGear.indexOf(choice as any), 1);
      refillShopGear(game);
      equipOntoActive(choice);
      gearBought += 1;
    }

    reorderActive(p);
  }

  private async resolveHand(
    commander: GamePlayer,
    buildingFilter: (loc: Location) => boolean,
    tempState: RoundTempState,
    diffRank: EnemyRank
  ) {
    const game = this.game;
    for (const card of [...commander.hand]) {
      const loc = card.Building as Location;
      if (!buildingFilter(loc) || !canUseEffect(game, card.Name, card.Name === "Strategic Withdrawal" ? 1 : Infinity)) {
        continue;
      }
      const canBuild =
        Boolean(card["Passive Effect"]?.trim()) &&
        game.locationUpgradesBuilt[loc].length < UPGRADE_SLOT_CAP[loc] &&
        (["Organic", "Tech", "Alien"] as const).every((k) => game.commandPool[k] >= toInt((card as any)[k]));
      const choice = await this.decisions.chooseCommandCardAction(commander, game, card, canBuild, true);
      commander.hand.splice(commander.hand.indexOf(card), 1);
      if (choice === "build") {
        for (const k of ["Organic", "Tech", "Alien"] as const) game.commandPool[k] -= toInt((card as any)[k]);
        game.locationUpgradesBuilt[loc].push(card);
        this.log(`  [Upgrade built] ${loc}: ${card.Name} (from ${commander.name}'s hand)`);
      } else {
        this.log(`  [Active Effect] ${loc}: ${commander.name} activates ${card.Name} for free (commander) -> ${card["Active Effect"]}`);
        this.dispatchEffect(card, loc, commander, tempState, diffRank);
        game.commandDeck.unshift(card);
      }
    }
  }

  private async resolveNonCommanderHands(
    commander: GamePlayer,
    buildingFilter: (loc: Location) => boolean,
    tempState: RoundTempState,
    diffRank: EnemyRank
  ) {
    const game = this.game;
    const eligible = game.players.filter(
      (p) =>
        p !== commander &&
        (this.placementsThisRound[p.seatIndex].includes("Command") ||
          this.placementsThisRound[p.seatIndex].includes("Battlefield"))
    );
    for (const actor of eligible) {
      for (const card of [...actor.hand]) {
        const loc = card.Building as Location;
        if (!buildingFilter(loc) || !canUseEffect(game, card.Name, card.Name === "Strategic Withdrawal" ? 1 : Infinity)) {
          continue;
        }
        const canActivate = (["Organic", "Tech", "Alien"] as const).every(
          (res) => actor.res[res] + game.commandPool[res] >= toInt((card as any)[res])
        );
        const choice = await this.decisions.chooseCommandCardAction(actor, game, card, false, canActivate);
        if (choice !== "activate") continue;
        for (const res of ["Organic", "Tech", "Alien"] as const) {
          const cost = toInt((card as any)[res]);
          const fromSelf = Math.min(actor.res[res], cost);
          actor.res[res] -= fromSelf;
          game.commandPool[res] -= cost - fromSelf;
        }
        actor.hand.splice(actor.hand.indexOf(card), 1);
        this.log(`  [Active Effect] ${loc}: ${actor.name} (non-commander) activates ${card.Name} -> ${card["Active Effect"]}`);
        this.dispatchEffect(card, loc, commander, tempState, diffRank);
        game.commandDeck.unshift(card);
      }
    }
  }

  private dispatchEffect(card: CommandCard, loc: Location, commander: GamePlayer, tempState: RoundTempState, diffRank: EnemyRank) {
    const ctx = {
      game: this.game,
      commander,
      tempState,
      enemyPool: this.enemyByRank[diffRank] ?? [],
      log: (t: string) => this.log(t),
    };
    if (loc === "Battlefield") applyBattlefieldActive(ctx, card);
    else applyCommandActive(ctx, card);
  }

  private async runDeploymentAndCombat(
    commander: GamePlayer,
    diffCount: number,
    diffRank: EnemyRank,
    tempState: RoundTempState
  ): Promise<number> {
    const game = this.game;

    let revealCount = 2;
    if (game.teamScoutPool.length) {
      const scout = game.teamScoutPool.reduce((a, b) =>
        scoutValue(b) > scoutValue(a) ? b : a
      );
      game.commandPool.Organic += toInt((scout.card as any)["Organic Scout"]);
      game.commandPool.Tech += toInt((scout.card as any)["Tech Scout"]);
      game.commandPool.Alien += toInt((scout.card as any)["Alien Scout"]);
      if (scout.card.Name === "Civilian Survivalist") revealCount += 1;
      if (scout.card.Name === '"Python"') revealCount *= 2;
      if (scout.card.Name === "Saboteur Cell" && canUseEffect(game, "Saboteur Cell", 3)) {
        game.enemyProgress = Math.max(0, game.enemyProgress - 1);
        recordEffectUse(game, "Saboteur Cell");
        this.log(`  [Saboteur Cell] scouting reduces Enemy Progress by 1 -> ${game.enemyProgress}/10`);
      }
      this.log(`  [Assign Scouts] ${scout.card.Name} scouts this round, revealing ${revealCount} enemies`);
    } else {
      this.log(`  [Assign Scouts] scout pool empty -- baseline reveal of ${revealCount} only, no income`);
    }

    this.log(`  Enemy hoard this round: ${diffCount}x ${diffRank} per lane`);
    const globalReduction = tempState.hoardReduction.get("__global__") ?? 0;
    const enemyPool = this.enemyByRank[diffRank] ?? [];
    const fullPool: EnemyCard[] = [];
    const perPlayerCounts = new Map<number, number>();
    for (const p of game.players) {
      const count = Math.max(0, diffCount - globalReduction - (tempState.hoardReduction.get(String(p.seatIndex)) ?? 0));
      perPlayerCounts.set(p.seatIndex, count);
      if (enemyPool.length) {
        for (let i = 0; i < count; i++) fullPool.push(enemyPool[Math.floor(Math.random() * enemyPool.length)]);
      }
    }
    const shuffled = shuffle(fullPool);
    let idx = 0;
    for (const p of game.players) {
      const n = perPlayerCounts.get(p.seatIndex)!;
      p.laneEnemyReserve = shuffled.slice(idx, idx + n);
      idx += n;
    }

    await this.resolveHand(commander, (loc) => loc === "Battlefield", tempState, diffRank);
    await this.resolveNonCommanderHands(commander, (loc) => loc === "Battlefield", tempState, diffRank);

    // No on_reveal dispatch in Stage 2 (multi-lane Reveal damage isn't ported yet) -- enemies are
    // plain stat-lines until the engine grows enemy-text dispatch in a later stage.

    let overrunLanes = 0;
    const overranPlayers = new Set<GamePlayer>();
    const lanesWon = new Set<GamePlayer>();
    const lanesWithKill: GamePlayer[] = [];
    const overrunLeftover = new Map<GamePlayer, Combatant[]>();

    for (const p of game.players) {
      applyPrecombatGear(game, p, (t) => this.log(t), tempState);
      applyPrecombatUnit(p, tempState);
      const pUnits = [...(p.active ? [p.active] : []), ...p.reserve];
      const pCombatants = pUnits.map((ui) => {
        const c = combatantFromUnit(ui);
        applyGearCombatMods(c, ui);
        applyUnitCombatMods(c, ui);
        return c;
      });
      const eCombatants = p.laneEnemyReserve.map((e) => {
        const c = new Combatant(e);
        applyEnemyCombatMods(c, e);
        return c;
      });
      if (!eCombatants.length) {
        this.log(`  ${p.name}: no enemies this lane (clean).`);
        continue;
      }
      const { overrun, playerSurvivors, enemySurvivors } = resolveLaneCombat(pCombatants, eCombatants);
      const kills = eCombatants.length - enemySurvivors.length;
      if (kills > 0) {
        lanesWithKill.push(p);
        p.stats.kills += kills;
      }
      if (overrun) {
        overrunLanes += 1;
        overranPlayers.add(p);
        overrunLeftover.set(p, enemySurvivors);
        p.stats.overrunsSuffered += 1;
        this.log(`  ${p.name}'s lane OVERRUN (${enemySurvivors.length} enemies still standing)`);
      } else {
        this.log(`  ${p.name}'s lane CLEARED (${playerSurvivors.length} units survived)`);
        lanesWon.add(p);
      }
      const newUnits: UnitInstance[] = [];
      pUnits.forEach((ui, i) => {
        const c = pCombatants[i];
        if (playerSurvivors.includes(c)) {
          ui.curHp = c.curHp;
          ui.curShields = c.curShields;
          newUnits.push(ui);
        } else if (tempState.cannotDie.has(ui.id)) {
          ui.curHp = 1;
          newUnits.push(ui);
        } else if (tryChronostasisSave(game, p, ui, (t) => this.log(t))) {
          newUnits.push(ui);
        } else if (tryReviveOnce(game, p, ui, (t) => this.log(t))) {
          newUnits.push(ui);
        } else {
          applyExplodeOnDeath(p, ui, (t) => this.log(t));
          const realGear = ui.equipped.filter((g) => "Name" in (g as any));
          if (realGear.length) {
            const kept = realGear.reduce((a, b) =>
              toInt((b as any).Damage) + toInt((b as any).HP) + toInt((b as any).Armor) + toInt((b as any).Shields) >
              toInt((a as any).Damage) + toInt((a as any).HP) + toInt((a as any).Armor) + toInt((a as any).Shields)
                ? b
                : a
            );
            p.gearHand.push(kept as any);
          }
          p.graveyard.push(ui);
          p.stats.deaths += 1;
        }
      });
      p.active = newUnits.length ? newUnits[0] : null;
      p.reserve = newUnits.length > 1 ? newUnits.slice(1) : [];
    }

    // Post-combat Lane Reinforcement (README #33).
    for (const p of [...lanesWon].sort((a, b) => (b.active ? instancePower(b.active) : 0) - (a.active ? instancePower(a.active) : 0))) {
      if (!overrunLeftover.size) break;
      const reinforcements = [...(p.active ? [p.active] : []), ...p.reserve];
      if (!reinforcements.length) continue;
      let target: GamePlayer | null = null;
      let bestHp = -1;
      for (const [q, enemies] of overrunLeftover) {
        const hp = enemies.reduce((s, c) => s + c.curHp, 0);
        if (hp > bestHp) {
          bestHp = hp;
          target = q;
        }
      }
      if (!target) continue;
      const rCombatants = reinforcements.map((ui) => {
        const c = combatantFromUnit(ui);
        applyGearCombatMods(c, ui);
        applyUnitCombatMods(c, ui);
        return c;
      });
      const { overrun: overrun2, playerSurvivors: rSurv, enemySurvivors: eSurv2 } = resolveLaneCombat(
        rCombatants,
        overrunLeftover.get(target)!
      );
      const newReinforcements: UnitInstance[] = [];
      reinforcements.forEach((ui, i) => {
        const c = rCombatants[i];
        if (rSurv.includes(c)) {
          ui.curHp = c.curHp;
          ui.curShields = c.curShields;
          newReinforcements.push(ui);
        } else {
          p.graveyard.push(ui);
          p.stats.deaths += 1;
        }
      });
      p.active = null;
      p.reserve = [];
      target.active = newReinforcements.length ? newReinforcements[0] : target.active;
      target.reserve = [...target.reserve, ...newReinforcements.slice(1)];
      if (!overrun2) {
        this.log(`  [Lane Reinforcement] ${p.name}'s survivors save ${target.name}'s lane!`);
        overrunLanes -= 1;
        overranPlayers.delete(target);
        lanesWon.add(target);
        overrunLeftover.delete(target);
      } else {
        overrunLeftover.set(target, eSurv2);
        this.log(`  [Lane Reinforcement] ${p.name}'s survivors reinforce ${target.name}'s lane but it's still overrun`);
      }
    }

    for (const p of game.players) p.overrunLastRound = overranPlayers.has(p);

    // Redeploy: a player whose lane WON may send a spare reserve unit to the weakest teammate.
    for (const p of [...lanesWon].sort((a, b) => {
      const ap = a.reserve.length ? instancePower(a.reserve[0]) : 0;
      const bp = b.reserve.length ? instancePower(b.reserve[0]) : 0;
      return bp - ap;
    })) {
      if (!p.reserve.length) continue;
      const lanePowerOf = (q: GamePlayer) =>
        [...(q.active ? [q.active] : []), ...q.reserve].reduce((s, u) => s + instancePower(u), 0);
      const weakest = game.players.filter((q) => q !== p).reduce((a, b) => (lanePowerOf(b) < lanePowerOf(a) ? b : a));
      if (lanePowerOf(weakest) < lanePowerOf(p)) {
        const spare = p.reserve.reduce((a, b) => (instancePower(b) < instancePower(a) ? b : a));
        p.reserve.splice(p.reserve.indexOf(spare), 1);
        if (weakest.active === null) weakest.active = spare;
        else weakest.reserve.push(spare);
        this.log(`  [Redeploy] ${p.name}'s lane won -- sends ${spare.card.Name} to reinforce ${weakest.name}`);
      }
    }

    if (lanesWithKill.length && this.containedEnemies.length < 2) {
      this.containedEnemies.push(diffRank);
      this.log(`  [Containment] stores a ${diffRank} (${this.containedEnemies.length}/2 cells filled)`);
    }

    return overrunLanes;
  }
}

function scoutValue(ui: UnitInstance): number {
  return (
    toInt((ui.card as any)["Organic Scout"]) +
    toInt((ui.card as any)["Tech Scout"]) +
    toInt((ui.card as any)["Alien Scout"])
  );
}

function reorderActive(p: GamePlayer) {
  const units = [...(p.active ? [p.active] : []), ...p.reserve];
  if (!units.length) return;
  units.sort((a, b) => instancePower(b) - instancePower(a));
  p.active = units[0];
  p.reserve = units.slice(1);
}

// GearCard type alias used in the deck fields above (kept local to avoid a circular import).
type GearCard2 = ReturnType<typeof loadGameData>["gear"][number];
