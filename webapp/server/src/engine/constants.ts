export const RANK_ORDER = [
  "Conscript",
  "Private",
  "Sergeant",
  "Captain",
  "Major",
  "Colonel",
  "Specialist",
  "Brigadier",
] as const;
export type Rank = (typeof RANK_ORDER)[number];

export const RANK_NUM: Record<string, number> = Object.fromEntries(
  RANK_ORDER.map((r, i) => [r, i + 1])
);

export const ENEMY_RANK_ORDER = [
  "Fodder",
  "Grunt",
  "Core",
  "Advanced",
  "Elite",
  "General",
  "Conqueror",
] as const;
export type EnemyRank = (typeof ENEMY_RANK_ORDER)[number];

export const ENEMY_RANK_NUM: Record<string, number> = Object.fromEntries(
  ENEMY_RANK_ORDER.map((r, i) => [r, i + 1])
);

export type Difficulty = "Easy" | "Normal" | "Hard";

/** Mirrors the lobby's RoomSettings shape (server/types.ts), redeclared here so the engine stays
 * self-contained and doesn't reach up into the room/lobby layer for its own types. */
export type AntagonistMix = "none" | "guaranteedSaboteur" | "guaranteedChaos" | "full";

export interface OptionalRules {
  tieredMissionDraw: boolean;
  voteOfNoConfidence: boolean;
  commandersCall: boolean;
}

export const OVERRUN_START: Record<Difficulty, number> = { Easy: 15, Normal: 10, Hard: 5 };

export const HOARD_TABLE: Record<Difficulty, { base: number; mid: number; late: number }> = {
  Easy: { base: 2, mid: 3, late: 3 },
  Normal: { base: 3, mid: 4, late: 5 },
  Hard: { base: 4, mid: 6, late: 7 },
};

export function hoardCount(difficulty: Difficulty, playerProgress: number): number {
  const t = HOARD_TABLE[difficulty];
  if (playerProgress >= 8) return t.late;
  if (playerProgress >= 5) return t.mid;
  return t.base;
}

export function enemyRankFromProgress(ep: number): EnemyRank {
  if (ep <= 1) return "Fodder";
  if (ep <= 3) return "Grunt";
  if (ep <= 5) return "Core";
  if (ep <= 7) return "Advanced";
  if (ep === 8) return "Elite";
  if (ep === 9) return "General";
  return "Conqueror";
}

export function bossTierFromProgress(ep: number): number {
  if (ep <= 1) return 1;
  if (ep <= 4) return 2;
  if (ep <= 6) return 3;
  if (ep <= 8) return 4;
  return 5;
}

export const LOCATIONS = [
  "Barracks",
  "Armory",
  "Medical Bay",
  "Containment Block",
  "Command",
  "Battlefield",
] as const;
export type Location = (typeof LOCATIONS)[number];

export const UPGRADE_SLOT_CAP: Record<Location, number> = {
  Barracks: 3,
  Armory: 3,
  "Medical Bay": 3,
  "Containment Block": 3,
  Command: 3,
  Battlefield: 3,
};

/** Primary player-facing resource each location produces. Battlefield is omitted -- its income
 * goes to the shared command pool, not player stocks, so per-player effects don't apply there. */
export const LOCATION_PRIMARY_RESOURCE: Partial<Record<Location, "Organic" | "Tech" | "Alien">> = {
  Barracks: "Organic",
  Armory: "Tech",
  "Medical Bay": "Organic",
  "Containment Block": "Alien",
  Command: "Alien",
};

export const COMMAND_HAND_SIZE = 3;
export const COMMANDER_HAND_SIZE = 4;
export const GEAR_HAND_LIMIT = 3;
