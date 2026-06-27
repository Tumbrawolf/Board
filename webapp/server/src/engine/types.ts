import type {
  BossCard,
  CommandCard,
  EnemyCard,
  EventCard,
  GearCard,
  MissionCard,
  SecretObjectiveCard,
  TacticianCard,
  UnitCard,
} from "./data.js";
import type { Difficulty, Location } from "./constants.js";

export interface ResourcePool {
  Organic: number;
  Tech: number;
  Alien: number;
}

export interface UnitInstance {
  id: string;
  card: UnitCard;
  maxHp: number;
  curHp: number;
  curShields: number;
  equipped: GearCard[];
  /** Per-unit ability counters (e.g. consecutive_hits for "bonus damage on consecutive hits"
   * abilities) -- mirrors Working/sim.py's UnitInstance.charges Counter. */
  charges: Record<string, number>;
}

export interface GamePlayer {
  seatIndex: number;
  name: string;
  isBot: boolean;
  rank: number; // 1-8, index into RANK_ORDER (1-based)
  res: ResourcePool;
  active: UnitInstance | null;
  reserve: UnitInstance[];
  laneEnemyReserve: EnemyCard[];
  hand: CommandCard[];
  gearHand: GearCard[];
  graveyard: UnitInstance[];
  overrunLastRound: boolean;
  missions: MissionCard[];
  secretObjectives: SecretObjectiveCard[];
  tactician: TacticianCard | null;
  hasReconSatellite: boolean;
  hasLastStandBeacon: boolean;
  /** Vote of No Confidence: set when one of this player's own Secret Objective cards has been
   * publicly revealed (read-only knowledge for everyone else) -- the card itself is unaffected,
   * still theirs, still counts toward their win condition. Not the same as losing a card. */
  revealedSecretObjective: string | null;
  stats: {
    kills: number;
    deaths: number;
    overrunsSuffered: number;
    promotionsReceived: number;
    donationsMade: number;
    healsGiven: number;
    gearEquipped: number;
    missionsCompleted: number;
    eventsPassed: number;
    eventsFailed: number;
    commanderRounds: number;
    unitsRetired: number;
    secretObjectiveComplete: string | null;
    accusationsMade: number;
    accusationsCorrect: number;
    timesAccused: number;
  };
}

export interface GameSettings {
  difficulty: Difficulty;
}

export interface GameLogEntry {
  round: number;
  text: string;
}

export type GameStatus = "running" | "won" | "lost";

export interface BossActive {
  card: BossCard;
  hpCur: number;
  tierReached: number;
  dmgBonus: number;
  shieldBonus: number; // tracked for fidelity with sim.py -- never actually consumed in combat there either
  armorBonus: number;
  healsOnKill: number;
}

export interface GameState {
  players: GamePlayer[];
  commanderIdx: number;
  roundNum: number;
  playerProgress: number;
  enemyProgress: number;
  overrunTracker: number;
  overrunTrackerMax: number;
  overrunTrackerMin: number;
  overrunDropsBySeat: Map<number, number>;
  settings: GameSettings;
  commandPool: ResourcePool;
  shopUnits: UnitCard[];
  shopGear: GearCard[];
  unitDeck: UnitCard[];
  gearDeck: GearCard[];
  commandDeck: CommandCard[];
  missionDeck: MissionCard[];
  eventDeck: EventCard[];
  secretObjectiveDeck: SecretObjectiveCard[];
  tacticianDeck: TacticianCard[];
  bossDeck: BossCard[];
  bossActive: BossActive | null;
  bossDiedLastRound: boolean;
  locationUpgradesBuilt: Record<Location, CommandCard[]>;
  teamScoutPool: UnitInstance[];
  status: GameStatus;
  log: GameLogEntry[];
  effectUses: Map<string, number>;
  /** Reanimator's "return the last killed enemy to combat under your control" -- the most
   * recent enemy card killed in normal lane combat (Boss kills and contained enemies don't set
   * this, only the everyday per-lane Combat Cycle). Consumed (set back to null) once revived. */
  lastKilledEnemy: EnemyCard | null;
  /** Night Vision's "Roll D6, Reveal that many enemies" -- added to the round's base scout
   * reveal count, reset to 0 each round. */
  nightVisionRevealBonus?: number;
  /** The round's drawn Event, if any -- stored on GameState (not just a runRound-local variable)
   * so combat-time Event Round Effects (e.g. "Active Non-Infantry are stunned") can be checked
   * from the Combatant-construction code in runDeploymentAndCombat. */
  activeEvent: EventCard | null;
  /** Per-round Event flags, all reset to their default (false/null) at the start of each round's
   * Event draw -- see runRound. Each backs one Event's Round Effect that needs to be checked from
   * a different part of the round loop than events.ts itself (worker income, gear equip cost,
   * Medical Bay, worker placement eligibility, Containment capacity, commander handoff). */
  missionRankReqRemoved: boolean;
  medicalBayCostsOrganic: boolean;
  equipCostDoubled: boolean;
  gearActiveCostDoubledType: string | null;
  locationsWithUpgradesBlocked: boolean;
  disabledLocation: Location | null;
  forceCommanderChange: boolean;
  containmentCapacityDoubled: boolean;
  /** Per-round kill/death counts by seatIndex, reset at the start of each round -- distinct from
   * stats.kills/stats.deaths, which accumulate for the whole game. Used by Event Completion
   * Conditions that reference "this round" specifically (Kill Contest, Annihilation Clause). */
  killsThisRound: Map<number, number>;
  deathsThisRound: Map<number, number>;
  /** Per-round retired-unit counts by seatIndex -- fed by both the normal end-of-round obsolete-
   * reserve retirement (runRetireFromDuty) and Honorable Discharge's "units retire on death
   * instead of dying" Round Effect. Used by Honorable Discharge's own Completion Condition. */
  retiresThisRound: Map<number, number>;
  /** Garbage Day's "Recycle" pile -- Command Cards pushed here when activated (while this Event
   * is active or garbageDayPermanent is set), so "restore from recycle to hand" has something
   * real to draw from. */
  recyclePile: CommandCard[];
  /** Per-round set of seatIndices that activated a Command Card this round (feeding recyclePile).
   * Used by Garbage Day's Completion Condition ("each player Recycled a card this round"). */
  recycledThisRound: Set<number>;
  /** Set when Garbage Day's Completion Reward fires ("Round effect permanent") -- keeps the
   * restore-from-recycle mechanic active every round even after the event card has expired. */
  garbageDayPermanent: boolean;
  /** Assigned Posts' "Roll Dice to select locations" -- one location rolled per seatIndex when
   * the Event becomes active. Normally cleared at the next round's Event-flag reset like every
   * other per-round Event flag; assignedPostsPersist (set by this card's own Failure Penalty,
   * "Effect persists after event") skips that one clear so the assignment carries into the next
   * round instead. */
  assignedPostLocations: Map<number, Location>;
  assignedPostsPersist: boolean;
  /** Honorable Discharge's Failure Penalty ("Retire costs no longer gives resource") -- a
   * standing rule change once triggered (the card text says "no longer," not "this round"), so
   * unlike the other per-round Event flags this one is never reset. */
  retireGivesNoResource: boolean;
  /** Research drive's Completion Condition ("Capture more than you kill") -- the private
   * containedEnemies count lives on GameEngine, not GameState, so events.ts (a free function)
   * had no way to see it and fell back to an approximation. Exposed here as a real per-round
   * count instead. */
  containedThisRound: number;
}
