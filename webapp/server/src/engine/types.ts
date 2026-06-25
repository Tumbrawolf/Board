import type { CommandCard, EnemyCard, GearCard, UnitCard } from "./data.js";
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
  stats: {
    kills: number;
    deaths: number;
    overrunsSuffered: number;
    promotionsReceived: number;
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

export interface GameState {
  players: GamePlayer[];
  commanderIdx: number;
  roundNum: number;
  playerProgress: number;
  enemyProgress: number;
  overrunTracker: number;
  overrunTrackerMax: number;
  settings: GameSettings;
  commandPool: ResourcePool;
  shopUnits: UnitCard[];
  shopGear: GearCard[];
  unitDeck: UnitCard[];
  gearDeck: GearCard[];
  commandDeck: CommandCard[];
  locationUpgradesBuilt: Record<Location, CommandCard[]>;
  teamScoutPool: UnitInstance[];
  status: GameStatus;
  log: GameLogEntry[];
  effectUses: Map<string, number>;
}
