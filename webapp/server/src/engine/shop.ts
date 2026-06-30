import { RANK_NUM } from "./constants.js";
import type { GearCard, UnitCard } from "./data.js";
import type { GameState } from "./types.js";

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Quartermaster passive: roll fill uses 2d6 (sum, capped at 8) instead of 1d8. */
function shopRankRoll(game: GameState): number {
  if (game.players.some((p) => p.tactician?.Name === "The Quartermaster")) {
    const sum = (1 + Math.floor(Math.random() * 6)) + (1 + Math.floor(Math.random() * 6));
    return Math.min(sum, 8);
  }
  return 1 + Math.floor(Math.random() * 8);
}

export function ensureLowestRankUnit(game: GameState) {
  const lowestRank = Math.min(...game.players.map((p) => p.rank));
  if (!game.shopUnits.some((u) => RANK_NUM[u.Rank] === lowestRank)) {
    const pool = game.unitDeck.filter((u) => RANK_NUM[u.Rank] === lowestRank);
    if (pool.length && game.shopUnits.length) {
      const evictIdx = Math.floor(Math.random() * game.shopUnits.length);
      const evicted = game.shopUnits.splice(evictIdx, 1)[0];
      game.unitDeck.push(evicted);
      game.shopUnits.push(pick(pool));
    }
  }
}

export function ensureLowestRankGear(game: GameState) {
  const lowestRank = Math.min(...game.players.map((p) => p.rank));
  if (!game.shopGear.some((g) => RANK_NUM[g["Rank Name"]] === lowestRank)) {
    const pool = game.gearDeck.filter((g) => RANK_NUM[g["Rank Name"]] === lowestRank);
    if (pool.length && game.shopGear.length) {
      const evictIdx = Math.floor(Math.random() * game.shopGear.length);
      const evicted = game.shopGear.splice(evictIdx, 1)[0];
      (game.recyclePile as any[]).push(evicted);
      game.shopGear.push(pick(pool));
    }
  }
}

export function refillShopUnit(game: GameState) {
  while (game.shopUnits.length < (game.unitShopCap ?? 4)) {
    let pool: UnitCard[];
    if (Math.random() < 0.5) {
      pool = game.unitDeck.filter((u) => RANK_NUM[u.Rank] <= 3);
    } else {
      const topRank = Math.max(...game.players.map((p) => p.rank), 1);
      const roll = shopRankRoll(game);
      const targetRank = Math.min(roll, topRank);
      pool = game.unitDeck.filter((u) => RANK_NUM[u.Rank] === targetRank);
      if (!pool.length) pool = game.unitDeck.filter((u) => RANK_NUM[u.Rank] <= 3);
    }
    if (!pool.length) pool = game.unitDeck;
    if (!pool.length) break;
    game.shopUnits.push(pick(pool));
  }
}

export function refillShopGear(game: GameState) {
  while (game.shopGear.length < 2) {
    let pool: GearCard[];
    let isRollFill = false;
    if (Math.random() < 0.5) {
      pool = game.gearDeck.filter((g) => RANK_NUM[g["Rank Name"]] <= 3);
    } else {
      isRollFill = true;
      const topRank = Math.max(...game.players.map((p) => p.rank), 1);
      const roll = shopRankRoll(game);
      const targetRank = Math.min(roll, topRank);
      pool = game.gearDeck.filter((g) => RANK_NUM[g["Rank Name"]] === targetRank);
      if (!pool.length) { isRollFill = false; pool = game.gearDeck.filter((g) => RANK_NUM[g["Rank Name"]] <= 3); }
    }
    if (!pool.length) pool = game.gearDeck;
    if (!pool.length) break;
    const filled = pick(pool);
    game.shopGear.push(filled);
    if (isRollFill) game.quartermasterRolledShopGear.add(filled);
  }
}
