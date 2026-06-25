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

/** Records a game starting (Stage 1: no real engine yet, just proves the persistence wiring).
 * Stage 2+ will update this row's ended_at/result_json once a real game can finish. */
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

export function listRecentGames(limit = 20) {
  return db.prepare(`SELECT * FROM games ORDER BY started_at DESC LIMIT ?`).all(limit);
}
