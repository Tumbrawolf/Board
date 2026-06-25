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

export const DEFAULT_SETTINGS: RoomSettings = {
  difficulty: "Normal",
  antagonistMix: "full",
  optionalRules: {
    tieredMissionDraw: false,
    voteOfNoConfidence: false,
    commandersCall: false,
  },
};

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
