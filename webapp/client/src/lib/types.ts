export type Difficulty = "Easy" | "Normal" | "Hard";
export type AntagonistMix = "none" | "guaranteedSaboteur" | "guaranteedChaos" | "full";

export interface RoomSettings {
  difficulty: Difficulty;
  antagonistMix: AntagonistMix;
  optionalRules: {
    tieredMissionDraw: boolean;
    voteOfNoConfidence: boolean;
    commandersCall: boolean;
  };
}

export interface Seat {
  seatIndex: number;
  clientId: string;
  name: string;
  isBot: boolean;
  isHost: boolean;
  ready: boolean;
  connected: boolean;
}

export type RoomStatus = "lobby" | "started";

export interface RoomState {
  code: string;
  status: RoomStatus;
  seats: (Seat | null)[];
  settings: RoomSettings;
  createdAt: number;
}

export const MAX_SEATS = 4;

export interface ResourcePool {
  Organic: number;
  Tech: number;
  Alien: number;
}

export interface ShopUnit {
  name: string;
  rank: string;
  damage: number;
  hp: number;
  armor: number;
  shields: number;
  organicCost: number;
  techCost: number;
  alienCost: number;
  type: string;
}

export interface ShopGear {
  name: string;
  rank: string;
  damage: number;
  hp: number;
  armor: number;
  shields: number;
  organicCost: number;
  techCost: number;
  alienCost: number;
  type: string;
}

export interface UnitView {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  shields: number;
  equipped?: string[];
}

export interface EnemyView {
  name: string;
  hp: number;
  damage: number;
}

export interface PlayerView {
  seatIndex: number;
  name: string;
  rank: number;
  res: ResourcePool;
  active: UnitView | null;
  reserve: UnitView[];
  laneEnemyReserve: EnemyView[];
  revealedSecretObjective: string | null;
  stats: Record<string, number | string | null>;
}

export interface GameStateSnapshot {
  roundNum: number;
  status: string;
  playerProgress: number;
  enemyProgress: number;
  overrunTracker: number;
  overrunTrackerMax: number;
  commandPool: ResourcePool;
  commanderSeatIndex: number | null;
  disabledLocation: string | null;
  shopUnits: ShopUnit[];
  shopGear: ShopGear[];
  players: PlayerView[];
}

export interface CommandCardView {
  name: string;
  building: string;
  passiveEffect: string;
  activeEffect: string;
  organic: number;
  tech: number;
  alien: number;
}

export interface GearHandView {
  name: string;
  rank: string;
  damage: number;
  hp: number;
  armor: number;
  shields: number;
}

export interface PrivateStateSnapshot {
  seatIndex: number;
  hand: CommandCardView[];
  gearHand: GearHandView[];
}

export interface LobbyEntry {
  code: string;
  playerCount: number;
  maxSeats: number;
}

export const DEFAULT_SETTINGS: RoomSettings = {
  difficulty: "Normal",
  antagonistMix: "full",
  optionalRules: {
    tieredMissionDraw: false,
    voteOfNoConfidence: false,
    commandersCall: false,
  },
};
