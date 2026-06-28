import {
  COMMAND_HAND_SIZE,
  COMMANDER_HAND_SIZE,
  ENEMY_RANK_NUM,
  GEAR_HAND_LIMIT,
  LOCATION_PRIMARY_RESOURCE,
  LOCATIONS,
  OVERRUN_START,
  RANK_NUM,
  RANK_ORDER,
  UPGRADE_SLOT_CAP,
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
import { applyExplodeOnDeath, applyPrecombatUnit, applyUnitCombatMods, tryDoctorSave, tryReviveOnce } from "./units.js";
import { applyEnemyCombatMods } from "./enemies.js";
import { applyGearCombatMods, applyPrecombatGear, tryChronostasisSave } from "./gear.js";
import { applyBossBoardWideMods, applyBossTier, resolveBossExchange } from "./bosses.js";
import { applyEventCombatMods, applyEventResolution, applyEventRoundEffect, applyGarbageDayRestore, eventConditionMet, eventSeverity } from "./events.js";
import { applyMissionReward, missionRequirementMet } from "./missions.js";
import { checkSecretObjectives } from "./secretObjectives.js";
import { payEscrow, resolveAccusation } from "./accusations.js";
import {
  applyTacticianActive,
  applyTacticianCombatMods,
  applyTacticianPrecombat,
  tacticianContainmentBuildDiscount,
} from "./tactician.js";
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
  makeTempCard,
  makeUnitInstance,
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
    const allUnits = shuffle(data.units);
    this.unitDeckFull = allUnits.filter((u) => !u.Type.includes("Mech") && !u.Type.includes("Vehicle"));
    const allGear = shuffle(data.gear) as any[];
    this.gearDeckFull = allGear.filter((g) => g.Type !== "Experimental") as any;
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
      benchedUnits: [],
      medBayUnits: [],
      laneEnemyReserve: [],
      hand: [],
      gearHand: [],
      graveyard: [],
      overrunLastRound: false,
      combatStimsRevealBonus: 0,
      incomeThisRound: { Organic: 0, Tech: 0, Alien: 0 },
      controlledLaneSeat: s.seatIndex,
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
        donationsMade: { Organic: 0, Tech: 0, Alien: 0 },
        healsGiven: 0,
        gearEquipped: 0,
        gearEquippedToAllies: 0,
        gearDiscarded: 0,
        misdirectorOtherOverruns: 0,
        misdirectorLaneClean: true,
        commanderStolenFromHigher: 0,
        conductorCommandFromLower: 0,
        progressAsCommander: 0,
        missionsCompleted: 0,
        eventsPassed: 0,
        eventsFailed: 0,
        commanderRounds: 0,
        unitsRetired: 0,
        abilityEnemyKills: 0,
        longestActiveSurvival: 0,
        roundsWithSingleUnit: 0,
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
      mechDeckLocked: allUnits.filter((u) => u.Type.includes("Mech")),
      vehicleDeckLocked: allUnits.filter((u) => u.Type.includes("Vehicle")),
      mechUnlocked: false,
      vehicleUnlocked: false,
      unitShopCap: 3,
      mechTechDiscount: 0,
      vehicleTechDiscount: 0,
      unitOrganicFree: false,
      unitOrganicCanUseTechOrAlien: false,
      techCanUseOrganic: false,
      shopCostMultiplier: 1,
      shopCostMultiplierNextRound: 1,
      experimentalOrganicTechFree: false,
      gearAlienHalfThisRound: false,
      tagTeamPassive: false,
      basicGearAlienFree: false,
      allAlienFreeThisRound: false,
      gearDeck: this.gearDeckFull as any,
      experimentalGearDeckLocked: allGear.filter((g) => g.Type === "Experimental") as any,
      experimentalGearUnlocked: false,
      commandDeck: this.commandDeckFull,
      missionDeck,
      eventDeck: shuffle(data.events.filter((e) => e["Event name"] !== "Forced Disposal" && e["Event name"] !== "Crowded Worksite" && e["Event name"] !== "Prove your worth")),
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
      activeEvent: null,
      medicalBayCostsOrganic: false,
      gearActiveCostDoubledType: null,
      locationsWithUpgradesBlocked: false,
      disabledLocation: null,
      forceCommanderChange: false,
      containmentCapacityDoubled: false,
      killsThisRound: new Map(),
      deathsThisRound: new Map(),
      retiresThisRound: new Map(),
      missionRankCompletedThisRound: 0,
      recyclePile: [],
      recycledThisRound: new Set(),
      garbageDayPermanent: false,
      locationSharingBonus: 0,
      returnedToSupplyThisRound: { Organic: 0, Tech: 0, Alien: 0 },
      locationAlienBonus: 0,
      shopCostBonus: { Organic: 0, Tech: 0, Alien: 0 },
      assignedPostLocations: new Map(),
      assignedPostsPersist: false,
      retireGivesNoResource: false,
      containedThisRound: 0,
      activationsThisRound: new Map(),
      abilityUsesThisRound: new Map(),
      abilityLimitOverrides: new Map(),
      breakerActive: false,
      chessmasterDoubledEnemies: new Set(),
      containedEnemyPool: [],
      freeAbilityNextUse: new Set(),
      commanderLocked: false,
      permanentScoutRevealBonus: 0,
      reserveAbilitiesDisabled: false,
      gearActiveFreeType: null,
      gearActiveFreeNextRound: null,
      gearActiveCostDoubledNextRound: null,
      shopGearFreeType: null,
      shopGearFreeTypeNextRound: null,
      healingPerWorkerBonus: 0,
      medBayAlwaysGeneratesOrganic: false,
      medBayCostOrganicPermanently: false,
      killContestHighRankDoubled: false,
      killContestHighRankHalved: false,
      leadershipCrisisWinner: null,
      commanderMustChangeEveryOtherRound: false,
      commanderEveryOtherRoundParity: 0,
      isolationSoloBonus: 0,
      isolationSharingPenalty: 0,
      locationBonusUpgradesCount: Object.fromEntries(LOCATIONS.map((l) => [l, 0])) as Record<Location, number>,
      locationUpgradeLimitPenalty: 0,
      ionStormScoutedLoseShields: false,
      ionStormEnemyEntryShields: 0,
      shieldsDestroyedThisRound: 0,
      renovationSetAsideUpgrades: null,
      renovationSetAsideBonusCounts: null,
      renovationRemoveUnlock: false,
      renovationEndOfRoundStrip: false,
      annihilationEnemiesDeletedByHigherRank: false,
      annihilationAlliesDeletedByHigherRank: false,
      combatStimsUsedThisRound: false,
      combatStimsPendingDmg: 0,
      laneAbilityPreventions: new Map(),
      laneAbilitiesFullySuppressed: new Set(),
      destroyNextActivatedCard: false,
      countermeasuresTargetSeat: 0,
      necromancyDeathPrevented: new Set(),
      necromancyPickedIdx: -1,
      donorOrgansPickedIdx: -1,
      ashesToAshesPickedIdx: -1,
      weCanRebuildActive: false,
      rebuiltThisRound: new Set(),
      battleMedicsPassiveUsed: false,
      battleMedicsActiveUnits: new Set(),
      ordersFromAboveDrawn: [],
      ordersFromAboveKeepIdx: -1,
      requestAidBonusRounds: 0,
      priorityOperationsRoundsLeft: 0,
      priorityConstructionRoundsLeft: 0,
      takeCreditCommanderSeat: -1,
      nukeLaneSeat: -1,
      promotionTargetSeat: -1,
      reinforcementUnitIds: new Set(),
      perfectInfoArmed: false,
      fieldTestingGearIdx: -1,
      fieldTestingUnitIdx: -1,
      finalStandTargetUnitId: "",
      whitesOfTheirEyesTargetSeat: -1,
      punchThroughActiveSeat: -1,
      eradicatorCannonCost: 2,
      eradicatorCannonKillArmed: false,
      eradicatorCannonLaneSeat: -1,
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

    // Commander draws 2 Events and chooses 1 to be active this round (README #32: skipped on
    // Round 0 -- there's no Combat Stage for a Round Effect to apply to, nothing to resolve later).
    let activeEvent: EventCard | null = null;
    game.medicalBayCostsOrganic = false;
    game.gearActiveCostDoubledType = game.gearActiveCostDoubledNextRound;
    game.gearActiveCostDoubledNextRound = null;
    game.gearActiveFreeType = game.gearActiveFreeNextRound;
    game.gearActiveFreeNextRound = null;
    game.shopGearFreeType = game.shopGearFreeTypeNextRound;
    game.shopGearFreeTypeNextRound = null;
    game.shopCostMultiplier = game.shopCostMultiplierNextRound;
    game.shopCostMultiplierNextRound = 1;
    game.locationsWithUpgradesBlocked = false;
    game.disabledLocation = null;
    game.forceCommanderChange = false;
    game.leadershipCrisisWinner = null;
    if (game.commanderMustChangeEveryOtherRound && game.roundNum % 2 === game.commanderEveryOtherRoundParity) {
      game.forceCommanderChange = true;
    }
    game.containmentCapacityDoubled = false;
    game.killsThisRound = new Map();
    game.deathsThisRound = new Map();
    game.retiresThisRound = new Map();
    game.missionRankCompletedThisRound = 0;
    game.recycledThisRound = new Set();
    game.returnedToSupplyThisRound = { Organic: 0, Tech: 0, Alien: 0 };
    game.containedThisRound = 0;
    game.shieldsDestroyedThisRound = 0;
    game.activationsThisRound = new Map();
    game.abilityUsesThisRound = new Map();
    game.mechTechDiscount = 0;
    game.vehicleTechDiscount = 0;
    game.unitOrganicFree = false;
    game.unitOrganicCanUseTechOrAlien = false;
    game.techCanUseOrganic = false;
    game.experimentalOrganicTechFree = false;
    game.gearAlienHalfThisRound = false;
    game.tagTeamPassive = false;
    game.basicGearAlienFree = false;
    game.allAlienFreeThisRound = false;
    game.breakerActive = false;
    game.combatStimsUsedThisRound = false;
    game.combatStimsPendingDmg = 0;
    for (const p of game.players) {
      p.combatStimsRevealBonus = 0;
      p.incomeThisRound = { Organic: 0, Tech: 0, Alien: 0 };
    }
    game.laneAbilityPreventions = new Map();
    game.laneAbilitiesFullySuppressed = new Set();
    game.destroyNextActivatedCard = false;
    game.countermeasuresTargetSeat = 0;
    game.necromancyDeathPrevented = new Set();
    game.necromancyPickedIdx = -1;
    game.donorOrgansPickedIdx = -1;
    game.ashesToAshesPickedIdx = -1;
    game.weCanRebuildActive = false;
    game.rebuiltThisRound = new Set();
    game.battleMedicsPassiveUsed = false;
    game.battleMedicsActiveUnits = new Set();
    game.ordersFromAboveDrawn = [];
    game.ordersFromAboveKeepIdx = -1;
    if (game.priorityOperationsRoundsLeft > 0) game.priorityOperationsRoundsLeft--;
    if (game.priorityConstructionRoundsLeft > 0) game.priorityConstructionRoundsLeft--;
    game.takeCreditCommanderSeat = -1;
    game.nukeLaneSeat = -1;
    game.promotionTargetSeat = -1;
    game.reinforcementUnitIds = new Set();
    game.perfectInfoArmed = false;
    game.fieldTestingGearIdx = -1;
    game.fieldTestingUnitIdx = -1;
    game.finalStandTargetUnitId = "";
    game.whitesOfTheirEyesTargetSeat = -1;
    game.punchThroughActiveSeat = -1;
    game.eradicatorCannonKillArmed = false;
    game.eradicatorCannonLaneSeat = -1;
    game.chessmasterDoubledEnemies = new Set();
    game.freeAbilityNextUse = new Set();
    game.commanderLocked = false;
    game.reserveAbilitiesDisabled = false;
    // Reset lane assignments to identity each round (commander re-assigns below after Event pick).
    for (const p of game.players) p.controlledLaneSeat = p.seatIndex;
    // Silence in no mans land: restore any units benched last round back to reserve.
    for (const p of game.players) {
      p.reserve.push(...p.benchedUnits);
      p.benchedUnits = [];
    }
    // Assigned Posts' Failure Penalty: re-roll locations each persist round, then force first
    // worker placement in runWorkerPlacementAndIncome (detected by activeEvent !== "Assigned Posts"
    // with assignedPostLocations non-empty). Consumed after 1 extra round.
    if (game.assignedPostsPersist) {
      game.assignedPostLocations = new Map(game.players.map((p) => [p.seatIndex, LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)]]));
      game.assignedPostsPersist = false;
    } else {
      game.assignedPostLocations = new Map();
    }
    if (!isPrepRound) {
      if (!game.eventDeck.length) game.eventDeck = shuffle(loadGameData().events.filter((e) => e["Event name"] !== "Forced Disposal" && e["Event name"] !== "Crowded Worksite" && e["Event name"] !== "Prove your worth"));
      const drawn = [];
      for (let i = 0; i < Math.min(2, game.eventDeck.length); i++) drawn.push(game.eventDeck.pop()!);
      // Commander picks which of the 2 drawn cards becomes active -- previously a random pick in
      // both this engine and sim.py (the comment said "chooses," the code never did).
      const chosenIdx = drawn.length ? await this.decisions.chooseActiveEvent(commander, game, drawn) : 0;
      activeEvent = drawn.length ? drawn[Math.max(0, Math.min(chosenIdx, drawn.length - 1))] : null;
      for (const e of drawn) {
        if (e !== activeEvent) game.eventDeck.unshift(e);
      }
      if (activeEvent) {
        this.log(`  [Event] Active this round: ${activeEvent["Event name"]} -- ${activeEvent["Round Effect"]}`);
        applyEventRoundEffect(game, activeEvent, (t) => this.log(t));
      }
      // Leadership Crisis: collect blind commander votes right after the event is revealed,
      // before worker placement so players know the stakes when choosing their locations.
      if (activeEvent?.["Event name"] === "Leadership Crisis") {
        const candidates = game.players.map((p) => ({ seatIndex: p.seatIndex, name: p.name, rank: p.rank }));
        const votes = new Map<number, number>();
        for (const p of game.players) {
          const voted = await this.decisions.chooseCommanderVote(p, game, candidates, votes);
          votes.set(p.seatIndex, voted);
        }
        const votedSeats = new Set([...votes.values()]);
        if (votedSeats.size === 1) {
          game.leadershipCrisisWinner = [...votedSeats][0];
          const winnerName = game.players.find((p) => p.seatIndex === game.leadershipCrisisWinner)?.name ?? "?";
          this.log(`  [Leadership Crisis] Unanimous vote — ${winnerName} elected next commander`);
        } else {
          game.leadershipCrisisWinner = null;
          const tally = [...votes.entries()].map(([voter, pick]) => {
            const vName = game.players.find((p) => p.seatIndex === voter)?.name ?? "?";
            const pName = game.players.find((p) => p.seatIndex === pick)?.name ?? "?";
            return `${vName}→${pName}`;
          }).join(", ");
          this.log(`  [Leadership Crisis] Split vote (${tally}) — no consensus`);
        }
      }
    }
    game.activeEvent = activeEvent;
    // Garbage Day permanent effect: once earned, the restore-from-recycle mechanic applies every
    // round even when some other event is active (Garbage Day itself already handles it above).
    if (game.garbageDayPermanent && game.activeEvent?.["Event name"] !== "Garbage Day") {
      applyGarbageDayRestore(game, (t) => this.log(t));
    }

    // Commander lane assignment: commander may reassign which player controls which physical lane
    // this round. Returns a Map<controllerSeatIndex, laneOwnerSeatIndex>. Bot always returns
    // identity (no change). Human commander gets a socket prompt with current lane states.
    if (!isPrepRound) {
      const assignments = await this.decisions.chooseLaneAssignments(commander, game);
      if (assignments.size) {
        for (const p of game.players) {
          const assigned = assignments.get(p.seatIndex);
          if (typeof assigned === "number") p.controlledLaneSeat = assigned;
        }
        const nonIdentity = game.players.filter((p) => p.controlledLaneSeat !== p.seatIndex);
        if (nonIdentity.length) {
          this.log(
            `  [Lane Assignment] ${nonIdentity.map((p) => {
              const lp = game.players.find((q) => q.seatIndex === p.controlledLaneSeat)!;
              return `${p.name} → ${lp.name}'s lane`;
            }).join(", ")}`
          );
        }
      }
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

    // Lead by example Event: "Players draw additional missions this turn" -- one extra draw
    // attempt per player this round (still capped at the normal 3-mission hand limit).
    const missionDrawsThisRound = activeEvent?.["Event name"] === "Lead by example" ? 2 : 1;
    for (const p of game.players) {
      for (let draw = 0; draw < missionDrawsThisRound; draw++) {
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
    }

    this.placementsThisRound = Object.fromEntries(game.players.map((p) => [p.seatIndex, []]));
    await this.runWorkerPlacementAndIncome(commander, diffCount);

    // Advanced Mechanized passive: permanent Tech cost discount on Mech/Vehicle purchases while built
    if (game.locationUpgradesBuilt["Barracks"].some((c) => c.Name === "Advanced Mechanized")) {
      game.mechTechDiscount += 2;
      game.vehicleTechDiscount += 3;
    }
    // AI advancements passive: Organic costs on units can be covered by Tech or Alien while built
    if (game.locationUpgradesBuilt["Barracks"].some((c) => c.Name === "AI advancements")) {
      game.unitOrganicCanUseTechOrAlien = true;
    }
    // Gene Modding passive: Tech costs can be covered by Organic while built
    if (game.locationUpgradesBuilt["Barracks"].some((c) => c.Name === "Gene Modding")) {
      game.techCanUseOrganic = true;
    }
    // Ethics Committee passive: ban Experimental gear, remove Alien costs from basic gear
    if (game.locationUpgradesBuilt["Armory"].some((c) => c.Name === "Ethics Committee")) {
      game.basicGearAlienFree = true;
      // If Experimental Science was built, remove it from upgrades and re-lock its gear
      const expSciIdx = game.locationUpgradesBuilt["Armory"].findIndex((c) => c.Name === "Experimental Science");
      if (expSciIdx !== -1) {
        const [removed] = game.locationUpgradesBuilt["Armory"].splice(expSciIdx, 1);
        game.commandDeck.push(removed);
        this.log(`  [Ethics Committee] Experimental Science removed from Armory -- Experimental gear banned`);
      }
      if (game.experimentalGearUnlocked) {
        const expGear = game.gearDeck.filter((g) => (g as any).Type === "Experimental");
        game.gearDeck = game.gearDeck.filter((g) => (g as any).Type !== "Experimental");
        const expInShop = game.shopGear.filter((g) => (g as any).Type === "Experimental");
        game.shopGear = game.shopGear.filter((g) => (g as any).Type !== "Experimental");
        game.experimentalGearDeckLocked.push(...expGear, ...expInShop);
        game.experimentalGearUnlocked = false;
      }
    }
    // Experimental Science passive: add Experimental gear to deck when built
    if (!game.experimentalGearUnlocked && game.locationUpgradesBuilt["Armory"].some((c) => c.Name === "Experimental Science")) {
      game.gearDeck.push(...game.experimentalGearDeckLocked);
      game.experimentalGearDeckLocked = [];
      game.experimentalGearUnlocked = true;
      this.log(`  [Experimental Science] Experimental gear added to gear deck`);
    }
    // Tag Team passive: reserve units deal damage alongside active each attack
    if (game.locationUpgradesBuilt["Containment Block"].some((c) => c.Name === "Tag Team")) {
      game.tagTeamPassive = true;
    }
    // Mad Science passive: Experimental gear Organic+Tech costs = 0 while built
    if (game.locationUpgradesBuilt["Armory"].some((c) => c.Name === "Mad Science")) {
      game.experimentalOrganicTechFree = true;
    }
    // Conscription passive: lowest rank unit from shop auto-placed into weakest player's reserve each round
    if (game.locationUpgradesBuilt["Barracks"].some((c) => c.Name === "Conscription") && game.shopUnits.length) {
      const lowestRank = Math.min(...game.shopUnits.map((u) => RANK_NUM[u.Rank]));
      const cPool = game.shopUnits.filter((u) => RANK_NUM[u.Rank] === lowestRank);
      const cUnit = cPool[Math.floor(Math.random() * cPool.length)];
      game.shopUnits.splice(game.shopUnits.indexOf(cUnit), 1);
      refillShopUnit(game);
      const cw = weakestPlayer(game);
      if (cw.active === null) cw.active = makeUnitInstance(cUnit); else cw.reserve.push(makeUnitInstance(cUnit));
      this.log(`  [Conscription passive] ${cUnit.Name} (Rank ${cUnit.Rank}) auto-deployed to ${cw.name}'s lane`);
    }
    // Unlock 4th unit shop slot when Additional Bedding is built
    if (game.unitShopCap < 4 && game.locationUpgradesBuilt["Barracks"].some((c) => c.Name === "Additional Bedding")) {
      game.unitShopCap = 4;
      this.log(`  [Additional Bedding] Unit shop expanded to 4 slots`);
    }
    // Unlock Mech/Vehicle unit pools when the respective upgrade has been built
    if (!game.mechUnlocked) {
      const built = game.locationUpgradesBuilt["Barracks"].map((c) => c.Name);
      if (built.includes("Mech Station") || built.includes("Combined Arms")) {
        game.unitDeck.push(...game.mechDeckLocked);
        game.mechDeckLocked = [];
        game.mechUnlocked = true;
        this.log(`  [Mech Station] Mech units added to unit deck`);
      }
    }
    if (!game.vehicleUnlocked) {
      const built = game.locationUpgradesBuilt["Barracks"].map((c) => c.Name);
      if (built.includes("Vehicle Bay") || built.includes("Combined Arms")) {
        game.unitDeck.push(...game.vehicleDeckLocked);
        game.vehicleDeckLocked = [];
        game.vehicleUnlocked = true;
        this.log(`  [Vehicle Bay] Vehicle units added to unit deck`);
      }
    }
    ensureLowestRankUnit(game);
    ensureLowestRankGear(game);

    // Combat Stims passive: once per round the commander may trigger a contained enemy's Reveal effect.
    if (
      game.locationUpgradesBuilt["Containment Block"].some((c) => c.Name === "Combat Stims") &&
      game.containedEnemyPool.length > 0 &&
      !game.combatStimsUsedThisRound
    ) {
      const options = game.containedEnemyPool.map((e, i) => ({
        name: `${e.Name}${(e as any).Reveal ? ` — ${(e as any).Reveal}` : " (no Reveal)"}`,
        rank: (e as any).Rank ?? "Unknown",
        idx: i,
      }));
      const resp = await this.decisions.chooseTacticianActiveTarget(commander, game, {
        tacticianName: "Combat Stims",
        kind: "combat_stims_passive" as any,
        shopOptions: options,
      });
      if (resp?.optionIdx !== undefined && resp.optionIdx >= 0 && resp.optionIdx < game.containedEnemyPool.length) {
        const chosen = game.containedEnemyPool[resp.optionIdx];
        const reveal: string = (chosen as any).Reveal ?? "";
        game.combatStimsUsedThisRound = true;
        const dmgMatch = reveal.match(/Deal (\d+)/i);
        if (dmgMatch) {
          const dmg = parseInt(dmgMatch[1]);
          commander.combatStimsRevealBonus += dmg;
          this.log(`  [Combat Stims passive] ${chosen.Name} Reveal "${reveal}" → +${dmg} bonus combat damage`);
        } else if (/Gain (\d+) Shield/i.test(reveal) && commander.active) {
          const shields = parseInt(reveal.match(/Gain (\d+) Shield/i)![1]);
          tempState.tempBuff(commander.active, { Shields: shields });
          this.log(`  [Combat Stims passive] ${chosen.Name} Reveal "${reveal}" → +${shields} shields on ${commander.active.card.Name}`);
        } else if (reveal) {
          this.log(`  [Combat Stims passive] ${chosen.Name} Reveal "${reveal}" — effect not implemented`);
        } else {
          this.log(`  [Combat Stims passive] ${chosen.Name} has no Reveal effect`);
        }
      }
    }

    // Countermeasures passive: roll D4 for lane, D4 for ability-prevention count in that lane.
    if (game.locationUpgradesBuilt["Containment Block"].some((c) => c.Name === "Countermeasures")) {
      const laneRoll = 1 + Math.floor(Math.random() * 4);
      const preventRoll = 1 + Math.floor(Math.random() * 4);
      const target = game.players[(laneRoll - 1) % game.players.length];
      const cur = game.laneAbilityPreventions.get(target.seatIndex) ?? 0;
      game.laneAbilityPreventions.set(target.seatIndex, cur + preventRoll);
      this.log(`  [Countermeasures passive] D4=${laneRoll} → ${target.name}'s lane, D4=${preventRoll} ability prevention(s)`);
    }

    // Forward Command passive: reserve units are immune to all damage while this upgrade is built.
    if (game.locationUpgradesBuilt["Barracks"].some((c) => c.Name === "Forward Command")) {
      tempState.reserveImmuneThisRound = true;
    }

    // Bunkers passive: reserve units can only be damaged by the active enemy (same as Forward Command).
    if (game.locationUpgradesBuilt["Battlefield"].some((c) => c.Name === "Bunkers")) {
      tempState.reserveImmuneThisRound = true;
    }

    // Eradicator Cannon passive: any player may pay current Alien cost to deal 5 damage to boss (ignores prevention/immunities).
    if (
      game.bossActive &&
      game.locationUpgradesBuilt["Armory"].some((c) => c.Name === "Eradicator Cannon")
    ) {
      for (const p of game.players) {
        while (p.res.Alien >= game.eradicatorCannonCost) {
          const opts = [
            { name: `Fire (costs ${game.eradicatorCannonCost} Alien → 5 dmg to Boss, next use costs ${game.eradicatorCannonCost * 2})`, rankName: "", idx: 0 },
            { name: "Skip", rankName: "", idx: 1 },
          ];
          const resp = await this.decisions.chooseTacticianActiveTarget(p, game, {
            tacticianName: "Eradicator Cannon",
            kind: "recycle_pick",
            recycleOptions: opts,
          });
          if (resp?.optionIdx !== 0) break;
          if (!game.bossActive) break;
          p.res.Alien -= game.eradicatorCannonCost;
          game.eradicatorCannonCost *= 2;
          game.bossActive.hpCur -= 5;
          this.log(`  [Eradicator Cannon] ${p.name} pays ${game.eradicatorCannonCost / 2} Alien → 5 direct boss damage (ignores immunities). Boss HP: ${game.bossActive.hpCur}`);
          if (game.bossActive.hpCur <= 0) {
            this.log(`  [Eradicator Cannon] Boss ${game.bossActive.card.Name} defeated!`);
            game.bossActive = null;
            game.bossDiedLastRound = true;
            break;
          }
        }
      }
    }

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
          if (donate) p.stats.donationsMade[res] += donate;
        }
      }
    }

    await this.resolveCommanderCards(commander, tempState, diffRank);
    await this.resolveNonCommanderCards(commander, tempState, diffRank);

    // Gear hand limit: players may not carry more than GEAR_HAND_LIMIT cards into combat.
    for (const p of game.players) {
      if (p.gearHand.length > GEAR_HAND_LIMIT) {
        const toDiscard = await this.decisions.chooseGearHandDiscard(p, game, p.gearHand);
        const discardSet = new Set(toDiscard);
        const discarded = p.gearHand.filter((_, i) => discardSet.has(i));
        p.gearHand = p.gearHand.filter((_, i) => !discardSet.has(i));
        p.stats.gearDiscarded += discarded.length;
        if (discarded.length) this.log(`  ${p.name} discards ${discarded.map((g) => (g as any).Name).join(", ")} (gear hand limit)`);
      }
    }

    this.log(`  Placements: ${JSON.stringify(this.placementsThisRound)}`);
    this.log(`  Command pool: O${game.commandPool.Organic} T${game.commandPool.Tech} A${game.commandPool.Alien}`);

    let overrunLanes = 0;

    // Leroy SO: count rounds where the player enters combat with exactly 1 unit (active, no reserve).
    for (const p of game.players) {
      if (!isPrepRound && p.active !== null && p.reserve.length === 0) p.stats.roundsWithSingleUnit += 1;
    }

    // Survivor SO: snapshot pre-combat active unit IDs so we can detect same-unit survival.
    const preActiveIds = new Map(game.players.map((p) => [p.seatIndex, p.active?.id]));

    if (!isPrepRound) {
      overrunLanes = await this.runDeploymentAndCombat(commander, diffCount, diffRank, tempState);
    } else {
      this.log("  [Round 0] No enemies, no Combat Stage this round.");
    }

    // Survivor SO: if the same unit is still active post-combat, increment its survival counter.
    for (const p of game.players) {
      if (p.active && p.active.id === preActiveIds.get(p.seatIndex)) {
        p.active.charges["active_survival"] = (p.active.charges["active_survival"] ?? 0) + 1;
        p.stats.longestActiveSurvival = Math.max(p.stats.longestActiveSurvival, p.active.charges["active_survival"]);
      }
    }

    // ---------------- CLEANUP ----------------
    // Reinforcements: surviving temp units and their gear return to their decks; dead units leave gear destroyed.
    if (game.reinforcementUnitIds.size > 0) {
      for (const uid of game.reinforcementUnitIds) {
        for (const p of game.players) {
          const inActive = p.active?.id === uid;
          const reserveIdx = p.reserve.findIndex((u) => u.id === uid);
          if (inActive || reserveIdx >= 0) {
            const ui = inActive ? p.active! : p.reserve[reserveIdx];
            for (const g of ui.equipped) game.gearDeck.push(g as any);
            game.unitDeck.push(ui.card);
            if (inActive) {
              p.active = p.reserve.length ? p.reserve.shift()! : null;
            } else {
              p.reserve.splice(reserveIdx, 1);
            }
            this.log(`  [Reinforcements] ${ui.card.Name} and gear returned to deck`);
          }
        }
      }
      game.reinforcementUnitIds.clear();
    }
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
      // Silence in no mans land: bots bench excess reserve units after combat so the ≤1 condition
      // can be met without losing the units -- they're restored at the start of next round.
      if (activeEvent?.["Event name"] === "Silence in no mans land") {
        for (const p of game.players) {
          if (p.isBot && p.reserve.length > 1) {
            const sorted = [...p.reserve].sort((a, b) => instancePower(b) - instancePower(a));
            p.reserve = sorted.slice(0, 1);
            p.benchedUnits.push(...sorted.slice(1));
          }
        }
      }

      // Completion Condition is now a real, fully keyword/state-matched check (eventConditionMet)
      // for every one of the 40 Events -- no card falls back to a coin flip any more. No active
      // event at all (vanishingly rare, only if the deck is somehow empty) still has nothing to
      // check, so that one case alone keeps the old flat rate.
      const eventPassed = activeEvent ? eventConditionMet(game, activeEvent, this.placementsThisRound, diffRank) : Math.random() < 0.55;
      this.log(`  Event ${eventPassed ? "PASSED" : "FAILED"}${activeEvent ? ` (${activeEvent["Event name"]})` : ""}`);
      for (const p of game.players) {
        if (eventPassed) p.stats.eventsPassed += 1;
        else p.stats.eventsFailed += 1;
      }
      if (activeEvent) applyEventResolution(game, activeEvent, eventPassed, commander);
      // Renovations: restore set-aside upgrades after resolution; regular overflow → commander hand.
      if (game.renovationSetAsideUpgrades) {
        for (const loc of LOCATIONS) {
          const setAside = game.renovationSetAsideUpgrades[loc] ?? [];
          const bonusCount = game.renovationSetAsideBonusCounts?.[loc] ?? 0;
          const regularCount = Math.max(0, setAside.length - bonusCount);
          const bonusCards = setAside.slice(regularCount);
          const regularCards = setAside.slice(0, regularCount);
          const currentRegular = game.locationUpgradesBuilt[loc].length - (game.locationBonusUpgradesCount[loc] ?? 0);
          const effectiveCap = Math.max(0, UPGRADE_SLOT_CAP[loc] - game.locationUpgradeLimitPenalty);
          const slotsLeft = Math.max(0, effectiveCap - currentRegular);
          const fittingRegular = regularCards.slice(0, slotsLeft);
          const overflowRegular = regularCards.slice(slotsLeft);
          game.locationUpgradesBuilt[loc].push(...fittingRegular, ...bonusCards);
          game.locationBonusUpgradesCount[loc] = (game.locationBonusUpgradesCount[loc] ?? 0) + bonusCount;
          if (overflowRegular.length) {
            commander.hand.push(...overflowRegular.filter((c) => "Name" in (c as any)));
            this.log(`  [Renovations] ${overflowRegular.length} upgrade(s) overflow from ${loc} → ${commander.name}'s hand`);
          }
        }
        game.renovationSetAsideUpgrades = null;
        game.renovationSetAsideBonusCounts = null;
      }
      // Renovations penalty: strip all built upgrades at end of every round once set.
      if (game.renovationEndOfRoundStrip) {
        for (const loc of LOCATIONS) {
          if (game.locationUpgradesBuilt[loc].length) {
            game.commandDeck.unshift(...game.locationUpgradesBuilt[loc].filter((c) => "Name" in (c as any)));
            game.locationUpgradesBuilt[loc] = [];
            game.locationBonusUpgradesCount[loc] = 0;
          }
        }
        this.log(`  [Renovations penalty] All built upgrades returned to command deck`);
      }
      // Research drive's Failure Penalty ("Disable a Containment Block slot") touches
      // GameEngine's private containmentSlots, which events.ts (a free function over GameState)
      // can't reach -- handled here instead, same pattern as onContainmentBuilt.
      if (!eventPassed && activeEvent?.["Event name"] === "Research drive" && this.containmentSlots > 0) {
        this.containmentSlots -= 1;
        this.log(`  [Research drive] A Containment Block slot is disabled (${this.containmentSlots} left)`);
      }

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
        game.missionRankCompletedThisRound += RANK_NUM[m["Player Rank"]] ?? 1;
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
      if (overrunLanes === 0) { game.playerProgress += 1; commander.stats.progressAsCommander += 1; }
    }
    this.log(`  After Escalate: PlayerProg ${game.playerProgress}/10, EnemyProg ${game.enemyProgress}/10`);

    if (game.roundNum > 0 && game.roundNum % 2 === 0) {
      for (const p of game.players) {
        if (p.rank < RANK_ORDER.length) p.rank += 1;
      }
      this.log(`  [Rank Trickle] Every player +1 Rank -> [${game.players.map((p) => RANK_ORDER[p.rank - 1]).join(", ")}]`);
    }

    const prevCommanderRank = game.players[game.commanderIdx].rank;
    if (game.commanderLocked) {
      // The Kingmaker's active locked the commander for this round -- skip the handoff.
      this.log(`  [The Kingmaker] Commander position locked -- ${game.players[game.commanderIdx].name} remains commander next round`);
    } else if (game.forceCommanderChange) {
      // Leadership Crisis (or every-other-round penalty): use unanimous vote winner if available,
      // otherwise pick randomly (split vote = no agreed candidate, someone gets picked anyway).
      const target = game.leadershipCrisisWinner ?? game.players[Math.floor(Math.random() * game.players.length)].seatIndex;
      const idx = game.players.findIndex((p) => p.seatIndex === target);
      game.commanderIdx = idx !== -1 ? idx : game.commanderIdx;
      const how = game.leadershipCrisisWinner !== null ? "unanimous vote" : "random (split vote)";
      this.log(`  [Leadership Crisis] Commander handoff via ${how} → ${game.players[game.commanderIdx].name}`);
    } else if (this.nextCommanderSeatIndex !== null) {
      // README 4.5/7.2: the commander is whoever placed the FIRST worker at Command this round
      // (a real race now that placement is turn-based -- see runWorkerPlacementAndIncome). Falls
      // back to round-robin only on the rare round nobody chooses Command at all.
      const idx = game.players.findIndex((p) => p.seatIndex === this.nextCommanderSeatIndex);
      game.commanderIdx = idx !== -1 ? idx : (game.commanderIdx + 1) % game.players.length;
    } else {
      game.commanderIdx = (game.commanderIdx + 1) % game.players.length;
    }
    // The Kingmaker: "You cannot be the commander -- if you would become commander, make
    // another player commander instead." Redirects to the next player in seat order.
    if (game.players[game.commanderIdx].tactician?.Name === "The Kingmaker") {
      const kingmaker = game.players[game.commanderIdx];
      game.commanderIdx = (game.commanderIdx + 1) % game.players.length;
      this.log(`  [The Kingmaker] ${kingmaker.name} cannot be commander -- passes the role to ${game.players[game.commanderIdx].name}`);
    }
    // Usurper / Conductor SO: track handoffs where incoming rank is lower / higher than outgoing.
    if (!game.commanderLocked) {
      const newCommander = game.players[game.commanderIdx];
      if (newCommander.rank < prevCommanderRank) newCommander.stats.commanderStolenFromHigher += 1;
      if (newCommander.rank > prevCommanderRank) newCommander.stats.conductorCommandFromLower += 1;
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
    const firstWorkerPlaced = new Set<number>();
    let anyRemaining = true;
    while (anyRemaining) {
      anyRemaining = false;
      for (const p of turnOrder) {
        if (remaining.get(p.seatIndex)! <= 0) continue;
        anyRemaining = true;
        const placedSoFar = Object.fromEntries(
          LOCATIONS.map((l) => [l, locWorkers[l].map((q) => ({ seatIndex: q.seatIndex, name: q.name }))])
        ) as Record<Location, { seatIndex: number; name: string }[]>;
        let loc = await this.decisions.chooseWorkerPlacement(p, game, placedSoFar);
        // Renovations Event: "cannot send workers to locations with upgrades" -- redirect to the
        // first still-upgrade-free location rather than re-prompting (the prompt itself still
        // offers every location; this engine doesn't have a way to filter a provider's choices
        // before the fact without changing the DecisionProvider contract again).
        if (game.locationsWithUpgradesBlocked && game.locationUpgradesBuilt[loc].length > 0) {
          const fallback = LOCATIONS.find((l) => game.locationUpgradesBuilt[l].length === 0);
          if (fallback) {
            this.log(`  [Event] Renovations blocks ${p.name} from ${loc} (has upgrades) -- redirected to ${fallback}`);
            loc = fallback;
          }
        }
        // Assigned Posts Failure Penalty: first worker is forced to the dice-rolled location
        // (locations re-rolled each persist round in the round reset above). Only applies in the
        // persist round (activeEvent !== "Assigned Posts") -- during the event itself, placement
        // is still voluntary so players can choose to complete it.
        if (!firstWorkerPlaced.has(p.seatIndex)) {
          firstWorkerPlaced.add(p.seatIndex);
          const forced = game.assignedPostLocations.size > 0 && game.activeEvent?.["Event name"] !== "Assigned Posts"
            ? game.assignedPostLocations.get(p.seatIndex)
            : null;
          if (forced) {
            this.log(`  [Assigned Posts Penalty] ${p.name}'s first worker forced to ${forced}`);
            loc = forced;
          }
        }
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

    const eventName = game.activeEvent?.["Event name"];
    const eventSev = eventSeverity(game);
    // Command Requisition Event: "Generated resources go to the command instead" -- every normal
    // income grant this round lands in the shared pool rather than the worker's own stock (the
    // card's other clause, "players can spend command resources," is handled at the shop/equip
    // payment sites in planningActions.ts).
    const commandRequisitionActive = eventName === "Command Requisition";
    const grantIncome = (p: GamePlayer, key: "Organic" | "Tech" | "Alien", amt: number) => {
      const effective = game.requestAidBonusRounds > 0 ? amt * 2 : amt;
      if (commandRequisitionActive) {
        game.commandPool[key] += effective;
      } else {
        p.res[key] += effective;
        p.incomeThisRound[key] += effective;
      }
    };
    for (const loc of LOCATIONS) {
      const workers = locWorkers[loc];
      // Saboteur investigation/Capacity Threshold/Isolation Orders Events: a dice-picked location
      // is disabled (no income) for the round -- same severity scaling.
      if (game.disabledLocation === loc && workers.length && Math.random() < eventSev) {
        this.log(`  [Event] ${loc} is disabled this round -- no income for ${workers.map((w) => w.name).join(", ")}`);
        continue;
      }
      workers.forEach((p, idx) => {
        const full = idx < 2;
        // Forced Contribution Event: "Income +1 if another worker at location."
        if (eventName === "Forced Contribution" && workers.length > 1) p.res.Tech += 1;
        if (loc === "Barracks") {
          const totalRank = game.shopUnits.reduce((s, u) => s + RANK_NUM[u.Rank], 0) + (4 - game.shopUnits.length);
          const amt = full ? totalRank : Math.floor(totalRank / 2);
          grantIncome(p, "Organic", amt);
          grantIncome(p, "Tech", Math.floor(amt / 2));
        } else if (loc === "Armory") {
          const totalRank = game.shopGear.reduce((s, g) => s + RANK_NUM[(g as any)["Rank Name"]], 0) + (2 - game.shopGear.length);
          const amt = full ? totalRank * 2 : Math.floor((totalRank * 2) / 2);
          grantIncome(p, "Tech", amt);
          grantIncome(p, "Organic", Math.floor(amt / 2));
        } else if (loc === "Medical Bay") {
          // +1 Organic per worker regardless (Location Actions.csv: "plus 1 Organic per worker")
          grantIncome(p, "Organic", 1);
          const isDoctor = p.tactician?.Name === "The Doctor";
          const increasedBudgetBuilt = (game.locationUpgradesBuilt["Medical Bay"] ?? []).some((c) => c.Name === "Increased Budget");
          const targetsPerWorker = 1 + game.healingPerWorkerBonus + (isDoctor ? 1 : 0) + (increasedBudgetBuilt ? 1 : 0);
          // Retrieve up to targetsPerWorker units from this player's Med Bay pool, heal to full, return to reserve
          // Cost mode: Medical Focus round effect OR permanent penalty flag (overridden by permanent reward flag)
          const costOrganic = (game.medicalBayCostsOrganic || game.medBayCostOrganicPermanently) && !game.medBayAlwaysGeneratesOrganic;
          for (let i = 0; i < targetsPerWorker && p.medBayUnits.length > 0; i++) {
            const ui = p.medBayUnits.shift()!;
            if (costOrganic) {
              if (p.res.Organic < 2) { p.medBayUnits.unshift(ui); break; }
              p.res.Organic -= 2;
            } else {
              grantIncome(p, "Organic", 2 + (isDoctor ? p.rank : 0));
            }
            healUnit(ui);
            p.reserve.push(ui);
            p.stats.healsGiven += 1;
            this.log(`  ${p.name} retrieves ${ui.card.Name} from Medical Bay`);
          }
          // We Can Rebuild Them passive: retrieve all remaining Med Bay units by paying each unit's Tech Cost.
          if (game.locationUpgradesBuilt["Medical Bay"].some((c) => c.Name === "We can Rebuild them")) {
            while (p.medBayUnits.length > 0) {
              const ui = p.medBayUnits[0];
              const techCost = toInt(ui.card["Tech Cost"]);
              if (p.res.Tech < techCost) break;
              p.medBayUnits.shift();
              p.res.Tech -= techCost;
              healUnit(ui);
              p.reserve.push(ui);
              p.stats.healsGiven += 1;
              this.log(`  [We Can Rebuild Them] ${p.name} rebuilds ${ui.card.Name} (paid ${techCost} Tech)`);
            }
          }
        } else if (loc === "Containment Block") {
          const containedRank = game.containedEnemyPool.reduce((s, r) => s + ENEMY_RANK_NUM[(r as any).Rank as EnemyRank], 0);
          const capacityMult = game.containmentCapacityDoubled ? 2 : 1;
          const amt = (full ? containedRank + 1 : Math.floor((containedRank + 1) / 2)) * capacityMult;
          grantIncome(p, "Alien", amt);
        } else if (loc === "Battlefield") {
          // Already command-pool income by default -- Command Requisition has nothing to redirect here.
          game.commandPool.Organic += full ? 1 : 0;
          game.commandPool.Tech += full ? 1 : 0;
          game.commandPool.Alien += full ? 2 : 1;
        } else if (loc === "Command") {
          grantIncome(p, "Alien", full ? p.rank : Math.floor(p.rank / 2));
        }
        // Forced Contribution reward/penalty: persistent ±1 Organic per additional co-located
        // worker, accumulated via locationSharingBonus (reward = +1, penalty = -1 per stack).
        if (game.locationSharingBonus !== 0 && workers.length > 1 && loc !== "Battlefield") {
          const sharing = game.locationSharingBonus * (workers.length - 1);
          if (sharing > 0) grantIncome(p, "Organic", sharing);
          else p.res.Organic = Math.max(0, p.res.Organic + sharing);
        }
        // Isolation Orders reward: +isolationSoloBonus of lowest resource when alone at location.
        // Isolation Orders penalty: −isolationSharingPenalty of location's primary resource per
        // co-located worker. Both skip Battlefield (income goes to command pool, not player stock).
        if (loc !== "Battlefield") {
          if (game.isolationSoloBonus > 0 && workers.length === 1) {
            const res = (["Organic", "Tech", "Alien"] as const).reduce((a, b) => p.res[a] <= p.res[b] ? a : b);
            grantIncome(p, res, game.isolationSoloBonus);
          }
          if (game.isolationSharingPenalty > 0 && workers.length > 1) {
            const primaryRes = LOCATION_PRIMARY_RESOURCE[loc];
            if (primaryRes) {
              p.res[primaryRes] = Math.max(0, p.res[primaryRes] - game.isolationSharingPenalty * (workers.length - 1));
            }
          }
        }
      });
    }

    // Tax Fault Reward: every player gains locationAlienBonus Alien per round, applied after
    // all location income (so it's immune to Command Requisition interference).
    if (game.locationAlienBonus > 0) {
      for (const p of game.players) {
        p.res.Alien += game.locationAlienBonus;
      }
    }

    // Request Aid: decrement the 2x income bonus counter after all income is distributed.
    if (game.requestAidBonusRounds > 0) game.requestAidBonusRounds--;

    // Return-to-supply events: bots collectively donate the minimum needed to pass the Completion
    // Condition, then stop. Cheap Knockoffs needs 10 Tech, Food Shortage needs 10 Organic, Tax
    // Fault and Forced Contribution need 15/20 total. Each bot donates its fair share of what's
    // still needed (excess above floor 3), but never more than needed.
    const rtsEvent = game.activeEvent?.["Event name"];
    const RTS_THRESHOLDS: Record<string, number> = {
      "Cheap Knockoffs": 10,
      "Food Shortage": 10,
      "Tax Fault": 15,
      "Forced Contribution": 20,
    };
    if (rtsEvent && rtsEvent in RTS_THRESHOLDS) {
      const threshold = RTS_THRESHOLDS[rtsEvent];
      const wantRes = (res: "Organic" | "Tech" | "Alien") =>
        rtsEvent === "Cheap Knockoffs" ? res === "Tech" :
        rtsEvent === "Food Shortage"   ? res === "Organic" : true;
      let totalReturned = 0;
      for (const p of game.players) {
        const currentTotal =
          game.returnedToSupplyThisRound.Organic +
          game.returnedToSupplyThisRound.Tech +
          game.returnedToSupplyThisRound.Alien;
        if (currentTotal >= threshold) break;
        for (const res of ["Organic", "Tech", "Alien"] as const) {
          if (!wantRes(res)) continue;
          const needed = threshold - (game.returnedToSupplyThisRound.Organic + game.returnedToSupplyThisRound.Tech + game.returnedToSupplyThisRound.Alien);
          if (needed <= 0) break;
          const donate = Math.min(Math.max(0, p.res[res] - 3), needed);
          if (donate > 0) {
            p.res[res] -= donate;
            game.returnedToSupplyThisRound[res] += donate;
            totalReturned += donate;
          }
        }
      }
      if (totalReturned > 0) {
        this.log(`  [${rtsEvent}] Players returned ${totalReturned} resources to supply`);
      }
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
        () => 0,
        game
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
        // Honorable Discharge's Failure Penalty ("Retire costs no longer gives resource") is a
        // standing rule change once triggered, not a one-round effect -- checked here too so it
        // also applies to this engine's other retire path (obsolete reserve units), not just
        // deaths redirected into retirement.
        if (!game.retireGivesNoResource) {
          const refundKeys = ["Organic Cost", "Tech Cost", "Alien Cost"] as const;
          const biggest = refundKeys.reduce((a, b) => (toInt((u.card as any)[b]) > toInt((u.card as any)[a]) ? b : a));
          p.res[biggest.split(" ")[0] as keyof typeof p.res] += toInt((u.card as any)[biggest]);
        }
        game.unitDeck.push(u.card);
        p.gearHand.push(...u.equipped.filter((g) => "Rank Name" in (g as any)));
        p.stats.unitsRetired += 1;
        game.retiresThisRound.set(p.seatIndex, (game.retiresThisRound.get(p.seatIndex) ?? 0) + 1);
        this.log(`  ${p.name} retires ${u.card.Name} (Rank ${u.card.Rank})${game.retireGivesNoResource ? "" : " for a partial refund"}`);
      }
    }
  }

  /** Shared slot cap for Med Bay: 2 base, 4 with Share Rooms built, Infinity during Emergency Triage. */
  private effectiveMedBaySlotCap(): number {
    const game = this.game;
    // Emergency Triage unlocks to the board max (4); Share Rooms built also unlocks to 4; base is 2.
    const shareRoomsBuilt = (game.locationUpgradesBuilt["Medical Bay"] ?? []).some((c) => c.Name === "Share Rooms");
    if (game.activeEvent?.["Event name"] === "Emergency Triage" || shareRoomsBuilt) return 4;
    return 2;
  }

  /** Priority: Honorable Discharge retire → Med Bay (if space) → graveyard. */
  private retireOrGraveyard(p: GamePlayer, ui: UnitInstance) {
    const game = this.game;
    if (game.activeEvent?.["Event name"] === "Honorable Discharge") {
      if (!game.retireGivesNoResource) {
        const refundKeys = ["Organic Cost", "Tech Cost", "Alien Cost"] as const;
        const biggest = refundKeys.reduce((a, b) => (toInt((ui.card as any)[b]) > toInt((ui.card as any)[a]) ? b : a));
        p.res[biggest.split(" ")[0] as keyof typeof p.res] += toInt((ui.card as any)[biggest]);
      }
      game.unitDeck.push(ui.card);
      p.gearHand.push(...ui.equipped.filter((g) => "Rank Name" in (g as any)));
      p.stats.unitsRetired += 1;
      game.retiresThisRound.set(p.seatIndex, (game.retiresThisRound.get(p.seatIndex) ?? 0) + 1);
      this.log(`  [Honorable Discharge] ${ui.card.Name} retires instead of dying`);
    } else {
      const totalInMedBay = game.players.reduce((s, pl) => s + pl.medBayUnits.length, 0);
      if (totalInMedBay < this.effectiveMedBaySlotCap()) {
        p.medBayUnits.push(ui);
        this.log(`  ${p.name}'s ${ui.card.Name} is transferred to Medical Bay`);
      } else {
        p.graveyard.push(ui);
      }
      p.stats.deaths += 1;
      game.deathsThisRound.set(p.seatIndex, (game.deathsThisRound.get(p.seatIndex) ?? 0) + 1);
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
      // The Jailer: "Containment Block upgrades cost no Alien" -- a cost-adjusted copy used only
      // for the build affordability check/charge, same pattern as tacticianDiscountedCost.
      const buildCard = tacticianContainmentBuildDiscount(commander, card.Building as Location, card);
      let choice: CommandCardChoice;
      if (interactive) {
        const requested = this.pendingCardChoices[commander.seatIndex]?.get(card.Name) ?? "skip";
        if (requested === "build" && !canBuildCard(game, buildCard)) {
          this.log(`  ${commander.name} wanted to build ${card.Name} but it's no longer affordable/slot-full -- skipped`);
          choice = "skip";
        } else {
          choice = requested;
        }
      } else {
        choice = await this.decisions.chooseCommandCardAction(commander, game, card, canBuildCard(game, buildCard), true);
      }
      if (choice === "skip") continue;
      commander.hand.splice(commander.hand.indexOf(card), 1);
      if (choice === "build") {
        buildCardMutation(game, buildCard, (t) => this.log(t), () => {
          this.containmentSlots = 2;
        });
      } else {
        // Orders from Above: draw 3, player picks 1 to keep; discard 2 and gain their costs.
        if (card.Name === "Orders from Above") {
          const drawn: CommandCard[] = [];
          for (let i = 0; i < 3 && game.commandDeck.length; i++) drawn.push(game.commandDeck.pop()!);
          game.ordersFromAboveDrawn = drawn;
          if (drawn.length > 0) {
            const cardCost = (c: CommandCard) => toInt(c.Organic) + toInt(c.Tech) + toInt(c.Alien);
            const opts = drawn.map((c, i) => ({
              name: `${c.Name} (keep) | discard others → +${drawn.filter((_, j) => j !== i).reduce((s, d) => s + cardCost(d), 0)} total resources`,
              rankName: c.Building,
              idx: i,
            }));
            const resp = await this.decisions.chooseTacticianActiveTarget(commander, game, {
              tacticianName: "Orders from Above",
              kind: "recycle_pick",
              recycleOptions: opts,
            });
            game.ordersFromAboveKeepIdx = resp?.optionIdx ?? drawn.findIndex((c) => cardCost(c) === Math.max(...drawn.map(cardCost)));
          }
        }
        // Ashes to Ashes active: player picks which med bay unit to destroy for 2x Organic refund.
        if (card.Name === "Ashes to Ashes" && commander.medBayUnits.length) {
          const opts = commander.medBayUnits.map((ui, i) => ({
            name: `${ui.card.Name} (refunds ${toInt(ui.card["Organic Cost"]) * 2} Organic)`,
            rankName: ui.card.Rank,
            idx: i,
          }));
          const resp = await this.decisions.chooseTacticianActiveTarget(commander, game, {
            tacticianName: "Ashes to Ashes",
            kind: "recycle_pick",
            recycleOptions: opts,
          });
          game.ashesToAshesPickedIdx = resp?.optionIdx ?? 0;
        }
        // Donor Organs active: player picks which infantry unit to retrieve from their own Med Bay.
        if (card.Name === "Donor Organs") {
          const affordable = commander.medBayUnits
            .map((ui, i) => ({ ui, i }))
            .filter(({ ui }) => ui.card.Type.includes("Infantry") && commander.res.Organic >= toInt(ui.card["Organic Cost"]));
          if (affordable.length) {
            const opts = affordable.map(({ ui, i }) => ({
              name: `${ui.card.Name} (costs ${toInt(ui.card["Organic Cost"])} Organic)`,
              rankName: ui.card.Rank,
              idx: i,
            }));
            const resp = await this.decisions.chooseTacticianActiveTarget(commander, game, {
              tacticianName: "Donor Organs",
              kind: "recycle_pick",
              recycleOptions: opts,
            });
            game.donorOrgansPickedIdx = resp?.optionIdx ?? affordable[affordable.length - 1].i;
          }
        }
        // Necromancy active: player picks which unit to revive from their graveyard.
        if (card.Name === "Necromancy" && commander.graveyard.length) {
          const opts = commander.graveyard.map((ui, i) => ({
            name: ui.card.Name,
            rankName: ui.card.Rank,
            idx: i,
          }));
          const resp = await this.decisions.chooseTacticianActiveTarget(commander, game, {
            tacticianName: "Necromancy",
            kind: "recycle_pick",
            recycleOptions: opts,
          });
          game.necromancyPickedIdx = resp?.optionIdx ?? opts.length - 1;
        }
        // Countermeasures active: player picks which lane to fully suppress enemy abilities in.
        if (card.Name === "Countermeasures") {
          const playerOptions = game.players.map((p) => ({ seatIndex: p.seatIndex, name: p.name, rank: p.rank }));
          const resp = await this.decisions.chooseTacticianActiveTarget(commander, game, {
            tacticianName: "Countermeasures",
            kind: "player_pick",
            playerOptions,
          });
          game.countermeasuresTargetSeat = resp?.targetSeat ?? game.players[0].seatIndex;
        }
        // Combat Stims active: player chooses how much self-damage to take before dispatch reads it.
        if (card.Name === "Combat Stims" && commander.active) {
          const maxDmg = Math.min(5, Math.max(1, commander.active.curHp - 1));
          const options = Array.from({ length: maxDmg }, (_, i) => ({
            name: `Deal ${i + 1} dmg → +${(i + 1) * 2} Attack this round`,
            rank: "",
            idx: i + 1,
          }));
          const resp = await this.decisions.chooseTacticianActiveTarget(commander, game, {
            tacticianName: "Combat Stims",
            kind: "combat_stims_active" as any,
            shopOptions: options,
          });
          game.combatStimsPendingDmg = resp?.optionIdx ?? 1;
        }
        // Eradicator Cannon active: pick which lane's enemy to kill after hoard build.
        if (card.Name === "Eradicator Cannon") {
          const playerOptions = game.players.map((p) => ({ seatIndex: p.seatIndex, name: p.name, rank: p.rank }));
          const resp = await this.decisions.chooseTacticianActiveTarget(commander, game, {
            tacticianName: "Eradicator Cannon",
            kind: "player_pick",
            playerOptions,
          });
          game.eradicatorCannonLaneSeat = resp?.targetSeat ?? game.players[0].seatIndex;
          game.eradicatorCannonKillArmed = true;
          game.destroyNextActivatedCard = true;
        }
        // Field Testing active: player picks gear from shop then a unit in their lane.
        if (card.Name === "Field Testing" && game.shopGear.length) {
          const gearOpts = game.shopGear.map((g, i) => ({
            name: `${(g as any).Name} (Rk${(g as any)["Rank Name"]})`,
            rankName: (g as any)["Rank Name"],
            idx: i,
          }));
          const gResp = await this.decisions.chooseTacticianActiveTarget(commander, game, {
            tacticianName: "Field Testing",
            kind: "recycle_pick",
            recycleOptions: gearOpts,
          });
          game.fieldTestingGearIdx = gResp?.optionIdx ?? 0;
          const units = [...(commander.active ? [commander.active] : []), ...commander.reserve];
          if (units.length) {
            const unitOpts = units.map((ui, i) => ({ name: ui.card.Name, rankName: ui.card.Rank, idx: i }));
            const uResp = await this.decisions.chooseTacticianActiveTarget(commander, game, {
              tacticianName: "Field Testing (unit)",
              kind: "recycle_pick",
              recycleOptions: unitOpts,
            });
            game.fieldTestingUnitIdx = uResp?.optionIdx ?? 0;
          }
        }
        // Nuke active: player picks which lane to destroy.
        if (card.Name === "Nuke") {
          const playerOptions = game.players.map((p) => ({ seatIndex: p.seatIndex, name: p.name, rank: p.rank }));
          const resp = await this.decisions.chooseTacticianActiveTarget(commander, game, {
            tacticianName: "Nuke",
            kind: "player_pick",
            playerOptions,
          });
          const botDefault = game.players.reduce((a, b) => b.laneEnemyReserve.length > a.laneEnemyReserve.length ? b : a).seatIndex;
          game.nukeLaneSeat = resp?.targetSeat ?? botDefault;
        }
        // Promotion active: player picks which non-self player to promote.
        if (card.Name === "Promotion") {
          const others = game.players.filter((p) => p !== commander);
          if (others.length) {
            const playerOptions = others.map((p) => ({ seatIndex: p.seatIndex, name: p.name, rank: p.rank }));
            const resp = await this.decisions.chooseTacticianActiveTarget(commander, game, {
              tacticianName: "Promotion",
              kind: "player_pick",
              playerOptions,
            });
            const botDefault = others.reduce((a, b) => b.rank < a.rank ? b : a).seatIndex;
            game.promotionTargetSeat = resp?.targetSeat ?? botDefault;
          }
        }
        // Final Stand active: pick any unit across all lanes to be immune to death this round.
        if (card.Name === "Final Stand") {
          const allUnits = game.players.flatMap((p) => [...(p.active ? [p.active] : []), ...p.reserve]);
          if (allUnits.length) {
            const opts = allUnits.map((ui, i) => ({ name: `${ui.card.Name} (${ui.curHp}/${ui.maxHp}HP)`, rankName: ui.card.Rank, idx: i }));
            const resp = await this.decisions.chooseTacticianActiveTarget(commander, game, {
              tacticianName: "Final Stand",
              kind: "recycle_pick",
              recycleOptions: opts,
            });
            const botDefault = allUnits.reduce((a, b) => b.curHp < a.curHp ? b : a);
            game.finalStandTargetUnitId = allUnits[resp?.optionIdx ?? allUnits.indexOf(botDefault)].id;
          }
        }
        // Whites of Their Eyes active: pick target lane.
        if (card.Name === "Whites of their eyes") {
          const playerOptions = game.players.map((p) => ({ seatIndex: p.seatIndex, name: p.name, rank: p.rank }));
          const resp = await this.decisions.chooseTacticianActiveTarget(commander, game, {
            tacticianName: "Whites of their eyes",
            kind: "player_pick",
            playerOptions,
          });
          const botDefault = game.players.reduce((a, b) => b.laneEnemyReserve.length > a.laneEnemyReserve.length ? b : a).seatIndex;
          game.whitesOfTheirEyesTargetSeat = resp?.targetSeat ?? botDefault;
        }
        commanderActivateCardMutation(game, card, commander, (t) => this.log(t), (c, loc) => {
          this.dispatchEffect(c, loc, commander, tempState, diffRank);
          if (game.destroyNextActivatedCard) {
            game.destroyNextActivatedCard = false;
            this.log(`  [Card destroyed] ${c.Name} removed from play`);
          } else {
            game.commandDeck.unshift(c);
          }
        });
        game.activationsThisRound.set(commander.seatIndex, (game.activationsThisRound.get(commander.seatIndex) ?? 0) + 1);
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
    const usedFreeCardThisRound = new Set<number>();
    for (const actor of eligible) {
      const interactive = this.decisions.isInteractiveSeat(actor);
      for (const card of [...actor.hand].filter((c) => cardEligibleForPlanning(game, c))) {
        // The Tactician: "effects on command cards are free for the 1st card per turn."
        const freeCard = actor.tactician?.Name === "The Tactician" && !usedFreeCardThisRound.has(actor.seatIndex);
        const canActivate = freeCard || canActivateAsNonCommander(game, actor, card);
        let activate: boolean;
        if (interactive) {
          const requested = this.pendingCardChoices[actor.seatIndex]?.get(card.Name) ?? "skip";
          activate = requested === "activate" && canActivate;
          if (requested === "activate" && !activate) {
            this.log(`  ${actor.name} wanted to activate ${card.Name} but can no longer afford it -- skipped`);
          }
        } else {
          const choice = await this.decisions.chooseCommandCardAction(actor, game, card, false, canActivate);
          activate = choice === "activate";
        }
        if (!activate) continue;
        actor.hand.splice(actor.hand.indexOf(card), 1);
        if (freeCard) {
          usedFreeCardThisRound.add(actor.seatIndex);
          const loc = card.Building as Location;
          this.log(`  [Active Effect] ${loc}: ${actor.name} activates ${card.Name} for free (The Tactician) -> ${card["Active Effect"]}`);
          this.dispatchEffect(card, loc, commander, tempState, diffRank);
          game.commandDeck.unshift(card);
        } else {
          if (card.Name === "Ashes to Ashes" && actor.medBayUnits.length) {
            const opts = actor.medBayUnits.map((ui, i) => ({
              name: `${ui.card.Name} (refunds ${toInt(ui.card["Organic Cost"]) * 2} Organic)`,
              rankName: ui.card.Rank,
              idx: i,
            }));
            const resp = await this.decisions.chooseTacticianActiveTarget(actor, game, {
              tacticianName: "Ashes to Ashes",
              kind: "recycle_pick",
              recycleOptions: opts,
            });
            game.ashesToAshesPickedIdx = resp?.optionIdx ?? 0;
          }
          if (card.Name === "Donor Organs") {
            const affordable = actor.medBayUnits
              .map((ui, i) => ({ ui, i }))
              .filter(({ ui }) => ui.card.Type.includes("Infantry") && actor.res.Organic >= toInt(ui.card["Organic Cost"]));
            if (affordable.length) {
              const opts = affordable.map(({ ui, i }) => ({
                name: `${ui.card.Name} (costs ${toInt(ui.card["Organic Cost"])} Organic)`,
                rankName: ui.card.Rank,
                idx: i,
              }));
              const resp = await this.decisions.chooseTacticianActiveTarget(actor, game, {
                tacticianName: "Donor Organs",
                kind: "recycle_pick",
                recycleOptions: opts,
              });
              game.donorOrgansPickedIdx = resp?.optionIdx ?? affordable[affordable.length - 1].i;
            }
          }
          if (card.Name === "Necromancy" && actor.graveyard.length) {
            const opts = actor.graveyard.map((ui, i) => ({ name: ui.card.Name, rankName: ui.card.Rank, idx: i }));
            const resp = await this.decisions.chooseTacticianActiveTarget(actor, game, {
              tacticianName: "Necromancy",
              kind: "recycle_pick",
              recycleOptions: opts,
            });
            game.necromancyPickedIdx = resp?.optionIdx ?? opts.length - 1;
          }
          if (card.Name === "Countermeasures") {
            const playerOptions = game.players.map((p) => ({ seatIndex: p.seatIndex, name: p.name, rank: p.rank }));
            const resp = await this.decisions.chooseTacticianActiveTarget(actor, game, {
              tacticianName: "Countermeasures",
              kind: "player_pick",
              playerOptions,
            });
            game.countermeasuresTargetSeat = resp?.targetSeat ?? game.players[0].seatIndex;
          }
          if (card.Name === "Combat Stims" && actor.active) {
            const maxDmg = Math.min(5, Math.max(1, actor.active.curHp - 1));
            const options = Array.from({ length: maxDmg }, (_, i) => ({
              name: `Deal ${i + 1} dmg → +${(i + 1) * 2} Attack this round`,
              rank: "",
              idx: i + 1,
            }));
            const resp = await this.decisions.chooseTacticianActiveTarget(actor, game, {
              tacticianName: "Combat Stims",
              kind: "combat_stims_active" as any,
              shopOptions: options,
            });
            game.combatStimsPendingDmg = resp?.optionIdx ?? 1;
          }
          if (card.Name === "Orders from Above") {
            const drawn: CommandCard[] = [];
            for (let i = 0; i < 3 && game.commandDeck.length; i++) drawn.push(game.commandDeck.pop()!);
            game.ordersFromAboveDrawn = drawn;
            if (drawn.length > 0) {
              const cardCost = (c: CommandCard) => toInt(c.Organic) + toInt(c.Tech) + toInt(c.Alien);
              const opts = drawn.map((c, i) => ({
                name: `${c.Name} (keep) | discard others → +${drawn.filter((_, j) => j !== i).reduce((s, d) => s + cardCost(d), 0)} total resources`,
                rankName: c.Building,
                idx: i,
              }));
              const resp = await this.decisions.chooseTacticianActiveTarget(actor, game, {
                tacticianName: "Orders from Above",
                kind: "recycle_pick",
                recycleOptions: opts,
              });
              game.ordersFromAboveKeepIdx = resp?.optionIdx ?? drawn.findIndex((c) => cardCost(c) === Math.max(...drawn.map(cardCost)));
            }
          }
          if (card.Name === "Eradicator Cannon") {
            const playerOptions = game.players.map((p) => ({ seatIndex: p.seatIndex, name: p.name, rank: p.rank }));
            const resp = await this.decisions.chooseTacticianActiveTarget(actor, game, {
              tacticianName: "Eradicator Cannon",
              kind: "player_pick",
              playerOptions,
            });
            game.eradicatorCannonLaneSeat = resp?.targetSeat ?? game.players[0].seatIndex;
            game.eradicatorCannonKillArmed = true;
            game.destroyNextActivatedCard = true;
          }
          if (card.Name === "Field Testing" && game.shopGear.length) {
            const gearOpts = game.shopGear.map((g, i) => ({
              name: `${(g as any).Name} (Rk${(g as any)["Rank Name"]})`,
              rankName: (g as any)["Rank Name"],
              idx: i,
            }));
            const gResp = await this.decisions.chooseTacticianActiveTarget(actor, game, {
              tacticianName: "Field Testing",
              kind: "recycle_pick",
              recycleOptions: gearOpts,
            });
            game.fieldTestingGearIdx = gResp?.optionIdx ?? 0;
            const units = [...(actor.active ? [actor.active] : []), ...actor.reserve];
            if (units.length) {
              const unitOpts = units.map((ui, i) => ({ name: ui.card.Name, rankName: ui.card.Rank, idx: i }));
              const uResp = await this.decisions.chooseTacticianActiveTarget(actor, game, {
                tacticianName: "Field Testing (unit)",
                kind: "recycle_pick",
                recycleOptions: unitOpts,
              });
              game.fieldTestingUnitIdx = uResp?.optionIdx ?? 0;
            }
          }
          if (card.Name === "Nuke") {
            const playerOptions = game.players.map((p) => ({ seatIndex: p.seatIndex, name: p.name, rank: p.rank }));
            const resp = await this.decisions.chooseTacticianActiveTarget(actor, game, {
              tacticianName: "Nuke",
              kind: "player_pick",
              playerOptions,
            });
            const botDefault = game.players.reduce((a, b) => b.laneEnemyReserve.length > a.laneEnemyReserve.length ? b : a).seatIndex;
            game.nukeLaneSeat = resp?.targetSeat ?? botDefault;
          }
          if (card.Name === "Promotion") {
            const others = game.players.filter((p) => p !== actor);
            if (others.length) {
              const playerOptions = others.map((p) => ({ seatIndex: p.seatIndex, name: p.name, rank: p.rank }));
              const resp = await this.decisions.chooseTacticianActiveTarget(actor, game, {
                tacticianName: "Promotion",
                kind: "player_pick",
                playerOptions,
              });
              const botDefault = others.reduce((a, b) => b.rank < a.rank ? b : a).seatIndex;
              game.promotionTargetSeat = resp?.targetSeat ?? botDefault;
            }
          }
          if (card.Name === "Final Stand") {
            const allUnits = game.players.flatMap((p) => [...(p.active ? [p.active] : []), ...p.reserve]);
            if (allUnits.length) {
              const opts = allUnits.map((ui, i) => ({ name: `${ui.card.Name} (${ui.curHp}/${ui.maxHp}HP)`, rankName: ui.card.Rank, idx: i }));
              const resp = await this.decisions.chooseTacticianActiveTarget(actor, game, {
                tacticianName: "Final Stand",
                kind: "recycle_pick",
                recycleOptions: opts,
              });
              const botDefault = allUnits.reduce((a, b) => b.curHp < a.curHp ? b : a);
              game.finalStandTargetUnitId = allUnits[resp?.optionIdx ?? allUnits.indexOf(botDefault)].id;
            }
          }
          if (card.Name === "Whites of their eyes") {
            const playerOptions = game.players.map((p) => ({ seatIndex: p.seatIndex, name: p.name, rank: p.rank }));
            const resp = await this.decisions.chooseTacticianActiveTarget(actor, game, {
              tacticianName: "Whites of their eyes",
              kind: "player_pick",
              playerOptions,
            });
            const botDefault = game.players.reduce((a, b) => b.laneEnemyReserve.length > a.laneEnemyReserve.length ? b : a).seatIndex;
            game.whitesOfTheirEyesTargetSeat = resp?.targetSeat ?? botDefault;
          }
          nonCommanderActivateCardMutation(game, card, actor, (t) => this.log(t), (c, loc) => {
            this.dispatchEffect(c, loc, commander, tempState, diffRank);
            if (game.destroyNextActivatedCard) {
              game.destroyNextActivatedCard = false;
              this.log(`  [Card destroyed] ${c.Name} removed from play`);
            } else {
              game.commandDeck.unshift(c);
            }
          });
        }
        game.activationsThisRound.set(actor.seatIndex, (game.activationsThisRound.get(actor.seatIndex) ?? 0) + 1);
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
          if (card.Name === "Suppression") {
            game.laneAbilitiesFullySuppressed.add(p.seatIndex);
            this.log(`  [Suppression] ${p.name}'s lane: all enemy activated abilities suppressed this round.`);
          }
          if (card.Name === "Barrier Systems") {
            const units = [...(p.active ? [p.active] : []), ...p.reserve];
            for (const ui of units) tempState.tempBuff(ui, { Shields: 10 });
            this.log(`  [Barrier Systems] ${p.name}'s lane: all ${units.length} unit(s) gain 10 shields.`);
          }
          if (card.Name === "Punch Through") {
            game.punchThroughActiveSeat = p.seatIndex;
          }
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

    let revealCount = 2 + (game.nightVisionRevealBonus ?? 0) + game.permanentScoutRevealBonus;
    game.nightVisionRevealBonus = 0;
    if (game.teamScoutPool.length) {
      const scout = game.teamScoutPool.reduce((a, b) =>
        scoutValue(b) > scoutValue(a) ? b : a
      );
      const scoutMult = (game.locationUpgradesBuilt["Containment Block"] ?? []).some((c) => c.Name === "Scouting update") ? 2 : 1;
      game.commandPool.Organic += toInt((scout.card as any)["Organic Scout"]) * scoutMult;
      game.commandPool.Tech += toInt((scout.card as any)["Tech Scout"]) * scoutMult;
      game.commandPool.Alien += toInt((scout.card as any)["Alien Scout"]) * scoutMult;
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

    // Perfect Information: commander can see and rearrange enemy stacks after hoard build.
    if (game.perfectInfoArmed) {
      game.perfectInfoArmed = false;
      const newLayout = await this.decisions.choosePerfectInfoLayout(commander, game);
      if (newLayout) {
        for (const [seatIndex, enemies] of newLayout) {
          const p = game.players.find((pl) => pl.seatIndex === seatIndex);
          if (p) p.laneEnemyReserve = enemies;
        }
      }
    }

    // Eradicator Cannon active: kill one non-boss enemy from the chosen lane.
    if (game.eradicatorCannonKillArmed) {
      game.eradicatorCannonKillArmed = false;
      const targetPlayer = game.players.find((p) => p.seatIndex === game.eradicatorCannonLaneSeat) ?? game.players[0];
      if (targetPlayer.laneEnemyReserve.length > 0) {
        const killed = targetPlayer.laneEnemyReserve.shift()!;
        this.log(`  [Eradicator Cannon] Active: killed ${killed.Name} (non-boss) from ${targetPlayer.name}'s lane.`);
      } else {
        this.log(`  [Eradicator Cannon] Active: no non-boss enemy in ${targetPlayer.name}'s lane to kill.`);
      }
      game.eradicatorCannonLaneSeat = -1;
    }

    await this.resolveBattlefieldCards(commander, tempState, diffRank);

    // Barrier Systems passive: all player units gain 5 shields at combat start.
    if ((game.locationUpgradesBuilt["Medical Bay"] ?? []).some((c) => c.Name === "Barrier Systems")) {
      for (const p of game.players) {
        const units = [...(p.active ? [p.active] : []), ...p.reserve];
        for (const ui of units) tempState.tempBuff(ui, { Shields: 5 });
      }
      this.log(`  [Barrier Systems passive] All player units gain 5 shields.`);
    }

    // Security Drones passive: lanes with no active unit at combat start receive drones equal to commander rank.
    // Drones bypass the lane unit limit by design.
    if ((game.locationUpgradesBuilt["Armory"] ?? []).some((c) => c.Name === "Security Drones")) {
      const droneCount = commander.rank;
      for (const p of game.players) {
        if (p.active === null) {
          for (let i = 0; i < droneCount; i++) tempState.addTempUnit(p, makeUnitInstance(makeTempCard("Drone", 1, 1)));
          this.log(`  [Security Drones passive] ${p.name}'s lane is empty — spawned ${droneCount} 1/1 drone(s).`);
        }
      }
    }

    // Defense Turrets passive: enemies with HP ≤ 5 die on reveal across all lanes.
    if ((game.locationUpgradesBuilt["Battlefield"] ?? []).some((c) => c.Name === "Defense Turrets")) {
      for (const p of game.players) {
        const before = p.laneEnemyReserve.length;
        p.laneEnemyReserve = p.laneEnemyReserve.filter((e) => toInt(e.HP) > 5);
        const killed = before - p.laneEnemyReserve.length;
        if (killed > 0) this.log(`  [Defense Turrets passive] ${p.name}'s lane: ${killed} enemy/enemies killed on reveal (HP ≤ 5).`);
      }
    }

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

    // Lane control swap: move each controller's assigned lane's units and enemies into their own
    // player slot for the duration of combat. Airburst splash (above) uses physical adjacency and
    // runs before the swap intentionally. After all combat and post-combat steps, swap-back
    // restores units to their physical lane (units stay with the lane, stats stay with the controller).
    const hasNonIdentityAssignment = game.players.some((p) => p.controlledLaneSeat !== p.seatIndex);
    const preCombatActive = new Map(game.players.map((p) => [p.seatIndex, p.active]));
    const preCombatReserve = new Map(game.players.map((p) => [p.seatIndex, p.reserve]));
    const preCombatEnemies = new Map(game.players.map((p) => [p.seatIndex, p.laneEnemyReserve]));
    if (hasNonIdentityAssignment) {
      for (const p of game.players) {
        p.active = preCombatActive.get(p.controlledLaneSeat) ?? null;
        p.reserve = preCombatReserve.get(p.controlledLaneSeat) ?? [];
        p.laneEnemyReserve = preCombatEnemies.get(p.controlledLaneSeat) ?? [];
      }
    }

    let overrunLanes = 0;
    const overranPlayers = new Set<GamePlayer>();
    const lanesWon = new Set<GamePlayer>();
    const lanesWithKill: GamePlayer[] = [];
    const overrunLeftover = new Map<GamePlayer, Combatant[]>();

    // Tactician actives fire BEFORE gear actives so The Engineer's "refresh + free next use"
    // takes effect in the same round's gear active loop.
    for (const p of game.players) {
      await applyTacticianActive(game, p, this.decisions, (t) => this.log(t), tempState, (card, loc) => {
        this.dispatchEffect(card, loc, commander, tempState, diffRank);
        game.activationsThisRound.set(p.seatIndex, (game.activationsThisRound.get(p.seatIndex) ?? 0) + 1);
      });
    }

    for (const p of game.players) {
      applyPrecombatGear(game, p, (t) => this.log(t), tempState);
      applyPrecombatUnit(p, tempState);
      applyTacticianPrecombat(p);
      const pUnits = [...(p.active ? [p.active] : []), ...p.reserve];
      const activeCount = p.active ? 1 : 0;
      const pCombatants = pUnits.map((ui, i) => {
        const c = combatantFromUnit(ui);
        if (!game.reserveAbilitiesDisabled || i < activeCount) {
          applyGearCombatMods(c, ui, game.players[game.commanderIdx].rank);
        }
        applyUnitCombatMods(c, ui);
        applyTacticianCombatMods(c, p);
        applyBossBoardWideMods(game, c, false);
        applyEventCombatMods(game, c, false, ui);
        return c;
      });
      const eCombatants = p.laneEnemyReserve.map((e) => {
        const c = new Combatant(e);
        applyEnemyCombatMods(c, e);
        applyBossBoardWideMods(game, c, true);
        applyEventCombatMods(game, c, true);
        // The Breaker: strip all shields and armor from every enemy this round.
        if (game.breakerActive) {
          c.curShields = 0;
          c.armor = 0;
        }
        // The Chessmaster: swapped enemies take double damage (halve starting HP so the same
        // damage math yields double the kill rate without a separate damage multiplier path).
        if (game.chessmasterDoubledEnemies.has(e)) {
          c.curHp = Math.max(1, Math.floor(c.curHp / 2));
        }
        // Annihilation Clause reward: enemies in a lane where player rank > enemy tier are deleted on kill.
        if (game.annihilationEnemiesDeletedByHigherRank && p.rank > ENEMY_RANK_NUM[diffRank]) {
          c.deleteOnKill = true;
        }
        // Tranq Rounds passive: reduce enemy damage by 2 × enemy rank.
        if ((game.locationUpgradesBuilt["Medical Bay"] ?? []).some((u) => u.Name === "Tranq rounds")) {
          c.dmg = Math.max(0, c.dmg - 2 * (ENEMY_RANK_NUM[e.Rank] ?? 1));
        }
        // Tranq Rounds active: halve enemy damage this round (applied after passive).
        if (tempState.tranqRoundsActiveThisRound) {
          c.dmg = Math.max(0, Math.floor(c.dmg / 2));
        }
        return c;
      });
      if (!eCombatants.length) {
        this.log(`  ${p.name}: no enemies this lane (clean).`);
        continue;
      }
      const tagTeamBonus = game.tagTeamPassive ? pCombatants.slice(1).reduce((s, c) => s + c.dmg, 0) : 0;
      const combatStimsBonus = p.combatStimsRevealBonus ?? 0;
      const ynpCb = tempState.youShallNotPassArmed
        ? (dying: import("./combat.js").Combatant, enemy: import("./combat.js").Combatant) => {
            const retaliationDmg = dying.dmg + dying.hp;
            enemy.curHp -= retaliationDmg;
            tempState.youShallNotPassArmed = false;
            this.log(`  [You Shall Not Pass] ${dying.name} dies and retaliates for ${retaliationDmg} damage!`);
          }
        : undefined;
      const whitesDoubleFirst = p.seatIndex === game.whitesOfTheirEyesTargetSeat;
      const punchCb = (game.bossActive && p.seatIndex === game.punchThroughActiveSeat)
        ? (killer: import("./combat.js").Combatant) => {
            if (game.bossActive) {
              game.bossActive.hpCur -= killer.dmg;
              this.log(`  [Punch Through] ${killer.name} kills an enemy and punches through for ${killer.dmg} damage to boss! Boss HP: ${game.bossActive.hpCur}`);
            }
          }
        : undefined;
      const { overrun, playerSurvivors, enemySurvivors, totalShieldsAbsorbed } = resolveLaneCombat(pCombatants, eCombatants, tagTeamBonus + combatStimsBonus, ynpCb, whitesDoubleFirst, punchCb);
      game.shieldsDestroyedThisRound += totalShieldsAbsorbed;
      const kills = eCombatants.length - enemySurvivors.length;
      if (kills > 0) {
        lanesWithKill.push(p);
        p.stats.kills += kills;
        game.killsThisRound.set(p.seatIndex, (game.killsThisRound.get(p.seatIndex) ?? 0) + kills);
        const killedCombatants = eCombatants.filter((c) => !enemySurvivors.includes(c));
        if (killedCombatants.length) {
          const lastKilledIdx = eCombatants.lastIndexOf(killedCombatants[killedCombatants.length - 1]);
          game.lastKilledEnemy = p.laneEnemyReserve[lastKilledIdx] ?? game.lastKilledEnemy;
          // Hunter SO: count kills on enemies that have a Reveal or Passive ability.
          for (const kc of killedCombatants) {
            const ekIdx = eCombatants.indexOf(kc);
            const ek = p.laneEnemyReserve[ekIdx];
            if (ek && ((ek as any).Reveal || (ek as any).Passive)) p.stats.abilityEnemyKills += 1;
          }
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
      const annihilationNoSaves =
        game.activeEvent?.["Event name"] === "Annihilation Clause" ||
        (game.annihilationAlliesDeletedByHigherRank && ENEMY_RANK_NUM[diffRank] > p.rank);
      const newUnits: UnitInstance[] = [];
      pUnits.forEach((ui, i) => {
        const c = pCombatants[i];
        if (playerSurvivors.includes(c)) {
          ui.curHp = c.curHp;
          ui.curShields = c.curShields;
          newUnits.push(ui);
        } else if (!annihilationNoSaves && tempState.cannotDie.has(ui.id)) {
          ui.curHp = 1;
          newUnits.push(ui);
        } else if (
          !annihilationNoSaves &&
          game.locationUpgradesBuilt["Containment Block"].some((c) => c.Name === "Necromancy") &&
          !game.necromancyDeathPrevented.has(p.seatIndex)
        ) {
          game.necromancyDeathPrevented.add(p.seatIndex);
          ui.curHp = 1;
          newUnits.push(ui);
          this.log(`  [Necromancy passive] First death in ${p.name}'s lane prevented`);
        } else if (
          !annihilationNoSaves &&
          game.locationUpgradesBuilt["Medical Bay"].some((c) => c.Name === "Battle Medics") &&
          !game.battleMedicsPassiveUsed
        ) {
          game.battleMedicsPassiveUsed = true;
          ui.curHp = ui.maxHp;
          newUnits.push(ui);
          this.log(`  [Battle Medics passive] ${ui.card.Name} restored to full HP`);
        } else if (!annihilationNoSaves && game.battleMedicsActiveUnits.has(ui.id)) {
          game.battleMedicsActiveUnits.delete(ui.id);
          ui.curHp = ui.maxHp;
          newUnits.push(ui);
          this.log(`  [Battle Medics active] ${ui.card.Name} restored to full HP`);
        } else if (
          !annihilationNoSaves &&
          game.weCanRebuildActive &&
          !game.rebuiltThisRound.has(ui.id) &&
          p.res.Tech >= toInt(ui.card["Tech Cost"])
        ) {
          p.res.Tech -= toInt(ui.card["Tech Cost"]);
          game.rebuiltThisRound.add(ui.id);
          ui.curHp = Math.max(1, Math.floor(ui.maxHp / 2));
          newUnits.push(ui);
          this.log(`  [We Can Rebuild Them] ${ui.card.Name} rebuilt at ${ui.curHp} HP (paid ${toInt(ui.card["Tech Cost"])} Tech)`);
        } else if (!annihilationNoSaves && tryChronostasisSave(game, p, ui, (t) => this.log(t))) {
          newUnits.push(ui);
        } else if (!annihilationNoSaves && tryReviveOnce(game, p, ui, (t) => this.log(t))) {
          newUnits.push(ui);
        } else if (!annihilationNoSaves && tryDoctorSave(game, p, ui, (t) => this.log(t))) {
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
          this.retireOrGraveyard(p, ui);
        }
      });
      p.active = newUnits.length ? newUnits[0] : null;
      p.reserve = newUnits.length > 1 ? newUnits.slice(1) : [];
      // Exploitation: unit survived combat but is marked to die after attacking.
      if (p.active && tempState.mustDieAfterCombat.has(p.active.id)) {
        this.log(`  [Exploitation] ${p.active.card.Name} dies after attacking`);
        p.stats.deaths += 1;
        this.retireOrGraveyard(p, p.active);
        p.active = p.reserve.length ? p.reserve[0] : null;
        p.reserve = p.reserve.length > 1 ? p.reserve.slice(1) : [];
      }
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
        applyTacticianCombatMods(c, p);
        applyBossBoardWideMods(game, c, false);
        applyEventCombatMods(game, c, false, ui);
        return c;
      });
      const tagTeamBonus2 = game.tagTeamPassive ? rCombatants.slice(1).reduce((s, c) => s + c.dmg, 0) : 0;
      const { overrun: overrun2, playerSurvivors: rSurv, enemySurvivors: eSurv2, totalShieldsAbsorbed: osa } = resolveLaneCombat(
        rCombatants,
        overrunLeftover.get(target)!,
        tagTeamBonus2
      );
      game.shieldsDestroyedThisRound += osa;
      const newReinforcements: UnitInstance[] = [];
      reinforcements.forEach((ui, i) => {
        const c = rCombatants[i];
        if (rSurv.includes(c)) {
          ui.curHp = c.curHp;
          ui.curShields = c.curShields;
          newReinforcements.push(ui);
        } else {
          this.retireOrGraveyard(p, ui);
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

    // Misdirector SO tracking: count other-lane overruns while own lane stays clean between them.
    for (const p of game.players) {
      const ownOverran = overranPlayers.has(p);
      const othersOverran = [...overranPlayers].some((q) => q !== p);
      if (othersOverran) {
        if (!ownOverran && p.stats.misdirectorLaneClean) p.stats.misdirectorOtherOverruns += 1;
        p.stats.misdirectorLaneClean = !ownOverran;
      } else if (ownOverran) {
        p.stats.misdirectorLaneClean = false;
      }
    }

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
      resolveBossExchange(game, (t) => this.log(t), (p, ui) => this.retireOrGraveyard(p, ui));
    }

    if (lanesWithKill.length && game.activeEvent?.["Event name"] !== "Annihilation Clause" && this.containmentSlots > 0 && game.containedEnemyPool.length < this.containmentSlots) {
      const capturePool = this.enemyByRank[diffRank] ?? [];
      const captured = capturePool.length ? capturePool[Math.floor(Math.random() * capturePool.length)] : null;
      if (captured) {
        game.containedEnemyPool.push(captured);
        game.containedThisRound += 1;
        this.log(`  [Containment] stores ${captured.Name} (${game.containedEnemyPool.length}/${this.containmentSlots} cells filled)`);
      }
    }

    // Lane control swap-back: units return to their physical lanes. Each controller's current
    // active/reserve (post-combat, possibly updated by reinforcement/redeploy) is written back
    // into the physical lane slot the controller was assigned to this round.
    if (hasNonIdentityAssignment) {
      const postActive = new Map(game.players.map((p) => [p.controlledLaneSeat, p.active]));
      const postReserve = new Map(game.players.map((p) => [p.controlledLaneSeat, p.reserve]));
      for (const p of game.players) {
        p.active = postActive.get(p.seatIndex) ?? null;
        p.reserve = postReserve.get(p.seatIndex) ?? [];
      }
    }

    return overrunLanes;
  }
}

// GearCard type alias used in the deck fields above (kept local to avoid a circular import).
type GearCard2 = ReturnType<typeof loadGameData>["gear"][number];
