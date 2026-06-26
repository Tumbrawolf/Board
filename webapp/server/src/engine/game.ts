import {
  COMMAND_HAND_SIZE,
  COMMANDER_HAND_SIZE,
  ENEMY_RANK_NUM,
  LOCATIONS,
  OVERRUN_START,
  RANK_NUM,
  RANK_ORDER,
  bossTierFromProgress,
  enemyRankFromProgress,
  hoardCount,
  type AntagonistMix,
  type Difficulty,
  type EnemyRank,
  type Location,
  type OptionalRules,
} from "./constants.js";
import { loadGameData, toInt, type CommandCard, type EnemyCard, type EventCard, type SecretObjectiveCard, type UnitCard } from "./data.js";
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
import { applyBossTier, resolveBossExchange } from "./bosses.js";
import { applyEventResolution, applyEventRoundEffect } from "./events.js";
import { applyMissionReward, missionRequirementMet } from "./missions.js";
import { checkSecretObjectives } from "./secretObjectives.js";
import { payEscrow, resolveAccusation } from "./accusations.js";
import { type CommandCardChoice, type DecisionProvider } from "./decisions.js";
import {
  buildCardMutation,
  canActivateAsNonCommander,
  canBuildCard,
  cardEligibleForPlanning,
  commanderActivateCardMutation,
  nonCommanderActivateCardMutation,
} from "./planningActions.js";
import { ensureLowestRankGear, ensureLowestRankUnit, refillShopGear, refillShopUnit } from "./shop.js";
import {
  RoundTempState,
  canUseEffect,
  healUnit,
  instancePower,
  recordEffectUse,
  scoutValue,
  weakestPlayer,
} from "./state.js";
import type { GamePlayer, GameState, UnitInstance } from "./types.js";

/** Reorders the Secret Objective deck so that, once the caller pops `dealCount` cards off the
 * END of the returned array (one deal per player x 2), the antagonistMix setting's guarantee
 * holds: "none" excludes Saboteur/Chaos from the dealt set entirely, "guaranteedSaboteur"/
 * "guaranteedChaos" ensures at least 1 dealt card has that alignment, "full" (default) leaves
 * the deck untouched -- the original behavior, no guarantees either way. */
function applyAntagonistMix(deck: SecretObjectiveCard[], mix: AntagonistMix, dealCount: number): SecretObjectiveCard[] {
  const isAntagonist = (c: SecretObjectiveCard) => c.Alignment === "Saboteur" || c.Alignment === "Chaos";
  if (mix === "none") {
    const clean = deck.filter((c) => !isAntagonist(c));
    const dirty = deck.filter(isAntagonist);
    return [...dirty, ...clean]; // clean cards sit at the end -> popped first
  }
  if (mix === "guaranteedSaboteur" || mix === "guaranteedChaos") {
    const wantAlign = mix === "guaranteedSaboteur" ? "Saboteur" : "Chaos";
    const wanted = deck.filter((c) => c.Alignment === wantAlign);
    const others = shuffle(deck.filter((c) => c.Alignment !== wantAlign));
    if (!wanted.length || dealCount < 1) return deck;
    const dealt = shuffle([wanted[0], ...others.slice(0, dealCount - 1)]);
    const remaining = [...others.slice(dealCount - 1), ...wanted.slice(1)];
    return [...remaining, ...dealt]; // dealt set sits at the end -> popped first, guarantee included
  }
  return deck; // "full" -- unchanged
}

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
  /** sim.py's containment_slots: starts at 0 (Containment storage genuinely does nothing until
   * "Containment Protocol" is built, unlike the other Passive-unlock flags it sets alongside,
   * which are inert everywhere in the source too -- only this one is actually consumed). */
  private containmentSlots = 0;
  private locationUpgradesBuilt: Record<Location, CommandCard[]>;
  private nextCommanderSeatIndex: number | null = null;
  /** Each player's recorded Command Card choices from this round's Planning window (build /
   * activate / skip per card name). Bots leave this empty -- they're still asked live in
   * resolveCommanderCards/resolveNonCommanderCardsFor, exactly as before this refactor. */
  private pendingCardChoices: Record<number, Map<string, CommandCardChoice>> = {};
  /** Fired once per resolved worker placement (bot or human), for the server layer to broadcast
   * live board updates during the placement phase -- separate from onLog since this is
   * structured data, not a text line. */
  onPlacement?: (seatIndex: number, location: Location) => void;
  private optionalRules: OptionalRules;

  constructor(
    seats: SeatInput[],
    difficulty: Difficulty,
    decisions: DecisionProvider,
    onLog: LogFn,
    antagonistMix: AntagonistMix = "full",
    optionalRules: OptionalRules = { tieredMissionDraw: false, voteOfNoConfidence: false, commandersCall: false }
  ) {
    this.optionalRules = optionalRules;
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

    const missionDeck = shuffle(data.missions);
    const secretObjectiveDeck = applyAntagonistMix(shuffle(data.secretObjectives), antagonistMix, seats.length * 2);
    const tacticianDeck = shuffle(data.tacticians);

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
      missions: [],
      secretObjectives: secretObjectiveDeck.length >= 2 ? [secretObjectiveDeck.pop()!, secretObjectiveDeck.pop()!] : [],
      tactician: tacticianDeck.pop() ?? null,
      hasReconSatellite: false,
      hasLastStandBeacon: false,
      revealedSecretObjective: null,
      stats: {
        kills: 0,
        deaths: 0,
        overrunsSuffered: 0,
        promotionsReceived: 0,
        donationsMade: 0,
        healsGiven: 0,
        gearEquipped: 0,
        missionsCompleted: 0,
        eventsPassed: 0,
        eventsFailed: 0,
        commanderRounds: 0,
        unitsRetired: 0,
        secretObjectiveComplete: null,
        accusationsMade: 0,
        accusationsCorrect: 0,
        timesAccused: 0,
      },
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
      overrunTrackerMax: 20, // the tracker's true physical component cap (0-20), independent of the difficulty-specific starting value below
      overrunTrackerMin: OVERRUN_START[difficulty],
      overrunDropsBySeat: new Map(),
      settings: { difficulty },
      commandPool: { Organic: 0, Tech: 0, Alien: 0 },
      shopUnits: [],
      shopGear: [] as any,
      unitDeck: this.unitDeckFull,
      gearDeck: this.gearDeckFull as any,
      commandDeck: this.commandDeckFull,
      missionDeck,
      eventDeck: shuffle(data.events),
      secretObjectiveDeck,
      tacticianDeck,
      bossDeck: shuffle(data.bosses),
      bossActive: null,
      bossDiedLastRound: false,
      locationUpgradesBuilt: this.locationUpgradesBuilt,
      teamScoutPool: [],
      status: "running",
      log: [],
      effectUses: new Map(),
      lastKilledEnemy: null,
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

  /** Call once after the round loop ends (won/lost) -- prints which of each player's 2 hidden
   * Secret Objectives were actually completed over the course of the game. */
  reportSecretObjectives() {
    checkSecretObjectives(this.game, (t) => this.log(t));
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
    if (isPrepRound) {
      // README #32: no Boss check on Round 0 -- nothing for it to act on yet.
    } else if (game.bossActive === null) {
      if (game.bossDiedLastRound) {
        game.bossDiedLastRound = false;
        this.log("  [Boss check] Grace period -- a Boss died last round, none can spawn this round.");
      } else {
        const roll = 1 + Math.floor(Math.random() * 10);
        if (roll <= game.enemyProgress) {
          if (!game.bossDeck.length) game.bossDeck = shuffle(loadGameData().bosses);
          const card = game.bossDeck.pop()!;
          game.bossActive = { card, hpCur: toInt(card.HP), tierReached: 0, dmgBonus: 0, shieldBonus: 0, armorBonus: 0, healsOnKill: 0 };
          this.log(`  [BOSS SPAWN] Rolled ${roll} <= EnemyProg ${game.enemyProgress} -> ${card.Name} appears!`);
        } else {
          this.log(`  [Boss check] Rolled ${roll} > EnemyProg ${game.enemyProgress} -> no boss this round.`);
        }
      }
    } else {
      const tier = bossTierFromProgress(game.enemyProgress);
      applyBossTier(game.bossActive, tier);
      this.log(`  [Boss active] ${game.bossActive.card.Name} at T${tier}, HP ${game.bossActive.hpCur}/${game.bossActive.card.HP}`);
    }

    // Tiered Mission Draw (optional rule, README #19): Rank 1-3 missions are always available;
    // Rank 4+ missions need a 1d8 roll (scaled down to highest player Rank + 1 on overshoot) to
    // even be in the draw pool this round -- one shared roll for the whole round, same as the
    // commander rolling once for the table in the original draft mechanic. This engine draws
    // missions per-player on demand rather than as a one-time shared draft (a pre-existing
    // simplification, not something this rule changes), so the roll's effect here is "raises or
    // caps which Mission Ranks are eligible to be drawn at all this round" rather than literally
    // gating a shared pool -- same intent (small tables don't get stuck holding only above-Rank
    // missions), adapted to this engine's draw model.
    let highTierMissionCap = Infinity;
    if (this.optionalRules.tieredMissionDraw) {
      const highestPlayerRank = Math.max(...game.players.map((q) => q.rank));
      const roll = 1 + Math.floor(Math.random() * 8);
      highTierMissionCap = Math.min(roll, highestPlayerRank + 1);
      this.log(`  [Tiered Mission Draw] Rolled ${roll}, capped to ${highTierMissionCap} -- Rank 4+ missions above that stay out of this round's draws.`);
    }

    for (const p of game.players) {
      if (p.missions.length < 3 && game.missionDeck.length) {
        let candidates = game.missionDeck.filter((m) => RANK_NUM[m["Player Rank"]] <= p.rank + 1);
        if (this.optionalRules.tieredMissionDraw) {
          candidates = candidates.filter((m) => RANK_NUM[m["Player Rank"]] <= 3 || RANK_NUM[m["Player Rank"]] <= highTierMissionCap);
        }
        if (candidates.length) {
          const m = candidates[Math.floor(Math.random() * candidates.length)];
          game.missionDeck.splice(game.missionDeck.indexOf(m), 1);
          p.missions.push(m);
        }
      }
    }

    // Commander draws 2 Events and chooses 1 to be active this round (README #32: skipped on
    // Round 0 -- there's no Combat Stage for a Round Effect to apply to, nothing to resolve later).
    let activeEvent: EventCard | null = null;
    if (!isPrepRound) {
      if (!game.eventDeck.length) game.eventDeck = shuffle(loadGameData().events);
      const drawn = [];
      for (let i = 0; i < Math.min(2, game.eventDeck.length); i++) drawn.push(game.eventDeck.pop()!);
      activeEvent = drawn.length ? drawn[Math.floor(Math.random() * drawn.length)] : null;
      for (const e of drawn) {
        if (e !== activeEvent) game.eventDeck.unshift(e);
      }
      if (activeEvent) {
        this.log(`  [Event] Active this round: ${activeEvent["Event name"]} -- ${activeEvent["Round Effect"]}`);
        applyEventRoundEffect(game, activeEvent);
      }
    }

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

    await this.runVoteOfNoConfidence();

    this.runRetireFromDuty();
    // README/Stage 4: a connected human seat's Shop+Equip+Command-Card Planning window is open
    // all at once (covered together in one screen, per the agreed design) and runs concurrently
    // with every OTHER human's window -- real multiplayer contention over the shared shop, judged
    // by whoever's action actually arrives first.
    //
    // Bots are walked in a plain sequential for-loop instead of folded into that same Promise.all
    // -- even though a bot's "decision" has no real async work, every `await` still yields a
    // microtask tick, so Promise.all-ing several bots' per-unit purchase loops together would
    // round-robin-interleave their shop purchases (bot0 buys 1, bot1 buys 1, bot0 buys 2, ...)
    // instead of each bot fully finishing before the next starts, as the original code did. That
    // changed which bot wins ties for scarce shop items and measurably moved a verified all-bot
    // win-rate sample (confirmed by re-running a 40-game batch before this fix landed) -- this
    // for-loop keeps bot-vs-bot behavior bit-for-bit what it was before this refactor. Command
    // Card choices are only RECORDED here -- their actual legality depends on Donation (just
    // below) having already happened, so they're applied afterward by
    // resolveCommanderCards/resolveNonCommanderCards.
    const planningCtx = (p: GamePlayer) => {
      const isCommander = p === commander;
      return {
        isCommander,
        eligibleToActivateAsNonCommander:
          isCommander ||
          this.placementsThisRound[p.seatIndex].includes("Command") ||
          this.placementsThisRound[p.seatIndex].includes("Battlefield"),
        log: (t: string) => this.log(t),
      };
    };
    const botPlayers = game.players.filter((p) => !this.decisions.isInteractiveSeat(p));
    const humanPlayers = game.players.filter((p) => this.decisions.isInteractiveSeat(p));
    for (const p of botPlayers) {
      this.pendingCardChoices[p.seatIndex] = await this.decisions.runPlanningWindow(p, game, planningCtx(p));
    }
    await Promise.all(
      humanPlayers.map(async (p) => {
        this.pendingCardChoices[p.seatIndex] = await this.decisions.runPlanningWindow(p, game, planningCtx(p));
      })
    );

    commander.stats.commanderRounds += 1;
    for (const p of game.players) {
      if (p !== commander) {
        for (const res of ["Organic", "Tech", "Alien"] as const) {
          const donate = Math.floor(p.res[res] / 3);
          p.res[res] -= donate;
          game.commandPool[res] += donate;
          if (donate) p.stats.donationsMade += donate;
        }
      }
    }

    await this.resolveCommanderCards(commander, tempState, diffRank);
    await this.resolveNonCommanderCards(commander, tempState, diffRank);

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
      game.overrunTrackerMin = Math.min(game.overrunTrackerMin, game.overrunTracker);
      game.overrunDropsBySeat.set(commander.seatIndex, (game.overrunDropsBySeat.get(commander.seatIndex) ?? 0) + dmg);
      this.log(`  Overrun Tracker -${dmg} -> ${game.overrunTracker}/20`);
    }

    // Last Stand Beacon: only usable at EnemyProg>=8; AI plays it once the Overrun Tracker is
    // actually in danger of hitting 0, rather than burning it on the very first eligible round.
    if (game.enemyProgress >= 8 && game.overrunTracker <= 5) {
      const holder = game.players.find((p) => p.hasLastStandBeacon);
      if (holder) {
        holder.hasLastStandBeacon = false;
        game.playerProgress = Math.max(0, game.playerProgress - 2);
        game.overrunTracker = Math.min(game.overrunTrackerMax, game.overrunTracker + 5);
        this.log(
          `  [Last Stand Beacon] ${holder.name} sacrifices 2 Player Progress -> ${game.playerProgress}/10, restores Overrun Tracker +5 -> ${game.overrunTracker}/20`
        );
      }
    }

    // README #34: the Overrun Tracker hitting 0 ends the game IMMEDIATELY -- no remaining
    // Cleanup sub-steps run once it happens, even mid-Cleanup. Deus Machina (a hidden Secret
    // Objective) is the one thing that can intervene first.
    if (game.overrunTracker <= 0) {
      const deusHolder = game.players.find(
        (p) => p.secretObjectives.some((so) => so.Name === "Deus Machina") && canUseEffect(game, "Deus Machina", 1)
      );
      if (deusHolder) {
        recordEffectUse(game, "Deus Machina");
        game.overrunTracker += dmg; // restore to before this round's losses
        game.enemyProgress = Math.max(0, game.enemyProgress - 1);
        deusHolder.stats.secretObjectiveComplete = "Deus Machina";
        this.log(
          `  [Deus Machina] ${deusHolder.name}'s hidden objective triggers: Overrun Tracker restored to ${game.overrunTracker}/20, EnemyProg -1 -> ${game.enemyProgress}/10. Their Secret Objective is now complete.`
        );
      } else {
        this.log(`\n#### PLAYERS LOSE on Round ${game.roundNum}. Overrun Tracker hit 0. ####`);
        game.status = "lost";
        return false;
      }
    }

    // README #32: Round 0's Cleanup skips Event Resolution and Promotions entirely -- nothing
    // for either to act on yet.
    if (!isPrepRound) {
      const eventPassed = Math.random() < 0.55;
      this.log(`  Event ${eventPassed ? "PASSED" : "FAILED"}${activeEvent ? ` (${activeEvent["Event name"]})` : ""}`);
      for (const p of game.players) {
        if (eventPassed) p.stats.eventsPassed += 1;
        else p.stats.eventsFailed += 1;
      }
      if (activeEvent) applyEventResolution(game, activeEvent, eventPassed, commander);

      if (eventPassed) {
        const eligible = game.players.filter((p) => p.rank < commander.rank);
        if (eligible.length) {
          const promo = eligible.reduce((a, b) => (b.rank < a.rank ? b : a));
          promo.rank = Math.min(RANK_ORDER.length, promo.rank + 1);
          promo.stats.promotionsReceived += 1;
          this.log(`  Promotion: ${promo.name} -> Rank ${RANK_ORDER[promo.rank - 1]}`);
        }
      }
    }

    // Mission completion (the OTHER promotion path). Players are racing to rank up ASAP for
    // stronger units, so: always complete the best eligible promoting mission if one is held.
    for (const p of game.players) {
      const eligibleMissions = p.missions.filter(
        (m) => RANK_NUM[m["Player Rank"]] >= p.rank && missionRequirementMet(game, m, p, this.placementsThisRound)
      );
      if (eligibleMissions.length) {
        const m = eligibleMissions.reduce((a, b) => (RANK_NUM[b["Player Rank"]] > RANK_NUM[a["Player Rank"]] ? b : a));
        p.missions.splice(p.missions.indexOf(m), 1);
        // README #36: a mission whose bracketed Rank is 3+ tiers above the completing player's
        // current Rank grants +2 total instead of the usual +1 (capped at +2).
        const gain = RANK_NUM[m["Player Rank"]] - p.rank >= 3 ? 2 : 1;
        p.rank = Math.min(RANK_ORDER.length, p.rank + gain);
        p.stats.promotionsReceived += 1;
        applyMissionReward(game, m, p);
        this.log(`  Mission complete: ${p.name} finishes '${m.Name}' (+${gain} Rank) -> Rank ${RANK_ORDER[p.rank - 1]}`);
        p.stats.missionsCompleted += 1;
        if (p.hasReconSatellite && canUseEffect(game, "Recon Satellite", 3)) {
          game.enemyProgress = Math.max(0, game.enemyProgress - 1);
          recordEffectUse(game, "Recon Satellite");
          this.log(`  [Recon Satellite] ${p.name} reduces Enemy Progress by 1 -> ${game.enemyProgress}/10`);
        }
      }
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

    // Commander's Call (optional rule): the commander picks who gets a contested location's
    // full-income slot(s), instead of the default arrival-order assignment below. Only locations
    // with more workers than full slots (2) have an actual choice to make.
    if (this.optionalRules.commandersCall) {
      const contested = LOCATIONS.filter((loc) => locWorkers[loc].length > 2).map((loc) => ({
        location: loc,
        workers: locWorkers[loc],
        fullSlots: 2,
      }));
      if (contested.length) {
        const reordered = await this.decisions.chooseFullIncomeOrder(commander, game, contested);
        contested.forEach((c, i) => {
          locWorkers[c.location] = reordered[i];
          this.log(`  [Commander's Call] ${commander.name} assigns full income at ${c.location} to ${reordered[i].slice(0, c.fullSlots).map((p) => p.name).join(", ")}`);
        });
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
          const isDoctor = p.tactician?.Name === "The Doctor";
          const targetsPerWorker = isDoctor ? 2 : 1; // "Medical bay heals double" when your workers are there
          for (const target of wounded.slice(0, targetsPerWorker)) {
            const healed = healUnit(target);
            if (healed) {
              p.res.Organic += 2 + (isDoctor ? p.rank : 0);
              p.stats.healsGiven += 1;
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

  /** Vote of No Confidence (optional rule, README Feedback #14/#20). Each player gets one chance
   * per round to accuse another of being Saboteur/Chaos-aligned -- a bot never initiates (no real
   * basis to suspect anyone), so in practice this only ever fires when a connected human chooses
   * to. The accuser's own vote always counts as Believed (it's their stated position); every
   * other player except the accused votes; a tie defaults to Not Believed. Simplification worth
   * knowing about: the rule gives the wrongly-accused player (false-believed branch) or the
   * accused player (rejected branch) a choice of WHICH of the accuser's cards gets
   * discarded/revealed -- this picks deterministically (the first remaining card) instead of
   * adding a second interactive sub-decision, to keep this already-large feature's scope bounded. */
  private async runVoteOfNoConfidence() {
    if (!this.optionalRules.voteOfNoConfidence) return;
    const game = this.game;
    for (const accuser of game.players) {
      const others = game.players.filter((p) => p !== accuser);
      if (!others.length) continue;
      const accusedSeat = await this.decisions.chooseAccusation(accuser, game, others);
      if (accusedSeat === null) continue;
      const accused = game.players.find((p) => p.seatIndex === accusedSeat && p !== accuser);
      if (!accused) continue;

      const escrowPaid = payEscrow(accuser);
      this.log(
        `  [Vote of No Confidence] ${accuser.name} accuses ${accused.name} of being Saboteur/Chaos-aligned! Escrow paid: O${escrowPaid.Organic}/T${escrowPaid.Tech}/A${escrowPaid.Alien}`
      );

      const voters = game.players.filter((p) => p !== accuser && p !== accused);
      let believedCount = 1; // the accuser's own vote always counts as Believed
      let notBelievedCount = 0;
      for (const voter of voters) {
        const vote = await this.decisions.castAccusationVote(voter, game, accuser, accused);
        if (vote) believedCount += 1;
        else notBelievedCount += 1;
      }
      const believed = believedCount > notBelievedCount;
      this.log(`  [Vote of No Confidence] Vote: ${believedCount} Believed, ${notBelievedCount} Not Believed -> ${believed ? "BELIEVED" : "NOT BELIEVED"}`);

      const result = resolveAccusation(
        accuser,
        accused,
        believed,
        escrowPaid,
        game.commandPool,
        () => {
          const idx = game.secretObjectiveDeck.findIndex((c) => c.Alignment === "Allied");
          return idx === -1 ? null : game.secretObjectiveDeck.splice(idx, 1)[0];
        },
        () => 0,
        () => 0
      );
      for (const line of result.log) this.log(line);
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
        p.stats.unitsRetired += 1;
        this.log(`  ${p.name} retires ${u.card.Name} (Rank ${u.card.Rank}) for a partial refund`);
      }
    }
  }

  /** Planning-stage Command Card resolution for the commander's own hand (build-or-activate, both
   * free of out-of-pocket cost -- build draws from the shared command pool, activate is entirely
   * free). A bot is still asked live via chooseCommandCardAction, exactly as before this refactor;
   * a human's choices were already recorded during their Planning window (runPlanningWindow) and
   * just get re-validated here against the now-final (post-Donation) command pool. */
  private async resolveCommanderCards(commander: GamePlayer, tempState: RoundTempState, diffRank: EnemyRank) {
    const game = this.game;
    const interactive = this.decisions.isInteractiveSeat(commander);
    for (const card of [...commander.hand].filter((c) => cardEligibleForPlanning(game, c))) {
      let choice: CommandCardChoice;
      if (interactive) {
        const requested = this.pendingCardChoices[commander.seatIndex]?.get(card.Name) ?? "skip";
        if (requested === "build" && !canBuildCard(game, card)) {
          this.log(`  ${commander.name} wanted to build ${card.Name} but it's no longer affordable/slot-full -- skipped`);
          choice = "skip";
        } else {
          choice = requested;
        }
      } else {
        choice = await this.decisions.chooseCommandCardAction(commander, game, card, canBuildCard(game, card), true);
      }
      if (choice === "skip") continue;
      commander.hand.splice(commander.hand.indexOf(card), 1);
      if (choice === "build") {
        buildCardMutation(game, card, (t) => this.log(t), () => {
          this.containmentSlots = 2;
        });
      } else {
        commanderActivateCardMutation(card, commander, (t) => this.log(t), (c, loc) => {
          this.dispatchEffect(c, loc, commander, tempState, diffRank);
          game.commandDeck.unshift(c);
        });
      }
    }
  }

  /** Planning-stage Command Card resolution for eligible non-commanders (activate-only, costed
   * from their own resources first with the command pool covering any shortfall). Same
   * bot-live-ask vs human-recorded-choice split as resolveCommanderCards. */
  private async resolveNonCommanderCards(commander: GamePlayer, tempState: RoundTempState, diffRank: EnemyRank) {
    const game = this.game;
    const eligible = game.players.filter(
      (p) =>
        p !== commander &&
        (this.placementsThisRound[p.seatIndex].includes("Command") ||
          this.placementsThisRound[p.seatIndex].includes("Battlefield"))
    );
    for (const actor of eligible) {
      const interactive = this.decisions.isInteractiveSeat(actor);
      for (const card of [...actor.hand].filter((c) => cardEligibleForPlanning(game, c))) {
        let activate: boolean;
        if (interactive) {
          const requested = this.pendingCardChoices[actor.seatIndex]?.get(card.Name) ?? "skip";
          activate = requested === "activate" && canActivateAsNonCommander(game, actor, card);
          if (requested === "activate" && !activate) {
            this.log(`  ${actor.name} wanted to activate ${card.Name} but can no longer afford it -- skipped`);
          }
        } else {
          const choice = await this.decisions.chooseCommandCardAction(actor, game, card, false, canActivateAsNonCommander(game, actor, card));
          activate = choice === "activate";
        }
        if (!activate) continue;
        actor.hand.splice(actor.hand.indexOf(card), 1);
        nonCommanderActivateCardMutation(game, card, actor, (t) => this.log(t), (c, loc) => {
          this.dispatchEffect(c, loc, commander, tempState, diffRank);
          game.commandDeck.unshift(c);
        });
      }
    }
  }

  /** Stage 7: the Battlefield-card phase (after enemy hoards exist) is now interactive for a
   * connected human seat too, via the same DecisionProvider.runBattlefieldCardWindow call site
   * for bots and humans alike. Same bot-sequential / human-concurrent split as the Planning
   * window's Promise.all -- bots must stay in a plain loop or their per-card decisions
   * round-robin-interleave instead of each bot resolving its whole hand before the next starts. */
  private async resolveBattlefieldCards(commander: GamePlayer, tempState: RoundTempState, diffRank: EnemyRank) {
    const game = this.game;
    const ctxFor = (p: GamePlayer) => {
      const isCommander = p === commander;
      return {
        isCommander,
        eligibleToActivateAsNonCommander:
          isCommander ||
          this.placementsThisRound[p.seatIndex].includes("Command") ||
          this.placementsThisRound[p.seatIndex].includes("Battlefield"),
        log: (t: string) => this.log(t),
        dispatch: (card: CommandCard, loc: Location) => {
          this.dispatchEffect(card, loc, commander, tempState, diffRank);
          game.commandDeck.unshift(card);
        },
      };
    };
    const botPlayers = game.players.filter((p) => !this.decisions.isInteractiveSeat(p));
    const humanPlayers = game.players.filter((p) => this.decisions.isInteractiveSeat(p));
    for (const p of botPlayers) {
      await this.decisions.runBattlefieldCardWindow(p, game, ctxFor(p));
    }
    await Promise.all(humanPlayers.map((p) => this.decisions.runBattlefieldCardWindow(p, game, ctxFor(p))));
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

    let revealCount = 2 + (game.nightVisionRevealBonus ?? 0);
    game.nightVisionRevealBonus = 0;
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

    await this.resolveBattlefieldCards(commander, tempState, diffRank);

    // No on_reveal dispatch in Stage 2 (multi-lane Reveal damage isn't ported yet) -- enemies are
    // plain stat-lines until the engine grows enemy-text dispatch in a later stage.

    // Airburst Rounds ("Attacks splash onto adjacent lanes"): a precombat pass against
    // neighboring lanes' enemy pools (adjacency = game.players array index +/-1, circular),
    // before any lane's own combat starts, since this engine resolves lanes one at a time, not
    // simultaneously -- splash is approximated as a once-per-round flat-damage filter on the
    // neighbor's whole enemy pool, the same idiom already used by every other "deal damage to
    // the enemy pool" Gear effect here (e.g. Grenades), since individual enemies aren't
    // HP-tracked outside an active combat resolution.
    for (let i = 0; i < game.players.length; i++) {
      const p = game.players[i];
      const active = p.active;
      if (!active?.equipped.some((g) => (g as any).Name === "Airburst Rounds")) continue;
      const splashDmg = Math.max(1, Math.floor((toInt(active.card.Damage) + equippedBonus(active, "Damage")) / 2));
      for (const offset of [-1, 1]) {
        const neighbor = game.players[(i + offset + game.players.length) % game.players.length];
        if (neighbor === p || !neighbor.laneEnemyReserve.length) continue;
        const before = neighbor.laneEnemyReserve.length;
        neighbor.laneEnemyReserve = neighbor.laneEnemyReserve.filter((e) => toInt(e.HP) > splashDmg);
        if (neighbor.laneEnemyReserve.length < before) {
          this.log(`  [Airburst Rounds] ${p.name}'s splash thins ${neighbor.name}'s adjacent lane (${before - neighbor.laneEnemyReserve.length} enemy(s) cleared)`);
        }
      }
    }

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
        applyGearCombatMods(c, ui, game.players[game.commanderIdx].rank);
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
        const killedCombatants = eCombatants.filter((c) => !enemySurvivors.includes(c));
        if (killedCombatants.length) {
          const lastKilledIdx = eCombatants.lastIndexOf(killedCombatants[killedCombatants.length - 1]);
          game.lastKilledEnemy = p.laneEnemyReserve[lastKilledIdx] ?? game.lastKilledEnemy;
        }
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
          applyExplodeOnDeath(game, p, ui, (t) => this.log(t));
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
        applyGearCombatMods(c, ui, game.players[game.commanderIdx].rank);
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

    if (game.bossActive) {
      resolveBossExchange(game, (t) => this.log(t));
    }

    if (lanesWithKill.length && this.containmentSlots > 0 && this.containedEnemies.length < this.containmentSlots) {
      this.containedEnemies.push(diffRank);
      this.log(`  [Containment] stores a ${diffRank} (${this.containedEnemies.length}/${this.containmentSlots} cells filled)`);
    }

    return overrunLanes;
  }
}

// GearCard type alias used in the deck fields above (kept local to avoid a circular import).
type GearCard2 = ReturnType<typeof loadGameData>["gear"][number];
