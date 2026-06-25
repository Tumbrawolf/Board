import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { RoomState } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "..", "data.sqlite");

export const db = new DatabaseSync(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_code TEXT NOT NULL,
    started_at INTEGER NOT NULL,
    ended_at INTEGER,
    settings_json TEXT NOT NULL,
    seats_json TEXT NOT NULL,
    result_json TEXT
  );
`);

export function recordGameStart(room: RoomState): number {
  const stmt = db.prepare(
    `INSERT INTO games (room_code, started_at, settings_json, seats_json) VALUES (?, ?, ?, ?)`
  );
  const info = stmt.run(
    room.code,
    Date.now(),
    JSON.stringify(room.settings),
    JSON.stringify(room.seats)
  );
  return Number(info.lastInsertRowid);
}

/** Stage 2: the engine can now actually finish a game, so this fills in the row recordGameStart
 * created -- final round reached and win/loss, not yet per-player stats (that's a later stage). */
export function recordGameEnd(gameId: number, status: string, finalRound: number) {
  db.prepare(`UPDATE games SET ended_at = ?, result_json = ? WHERE id = ?`).run(
    Date.now(),
    JSON.stringify({ status, finalRound }),
    gameId
  );
}

export function listRecentGames(limit = 20) {
  return db.prepare(`SELECT * FROM games ORDER BY started_at DESC LIMIT ?`).all(limit);
}
