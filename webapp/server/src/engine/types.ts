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
}
