import type { Server } from "socket.io";
import { GameEngine, type SeatInput } from "./engine/game.js";
import { recordGameEnd } from "./db.js";
import { MixedDecisionProvider, type SocketLookup } from "./humanDecisions.js";
import type { RoomState } from "./types.js";

const ROUND_PACING_MS = 600;

/** Stage 3: human-controlled, connected seats get a real choice for worker placement
 * (MixedDecisionProvider); every other decision (purchases, equip, Command Cards) stays
 * bot-decided for every seat, including human ones, per the agreed Stage 3 scope. Runs to
 * completion, streaming a log line + a lightweight state snapshot to the room after each round
 * so connected clients can watch it play out instead of getting one final dump. */
export async function runGame(io: Server, room: RoomState, gameId: number, lookupSocket: SocketLookup) {
  const seats: SeatInput[] = room.seats
    .filter((s): s is NonNullable<typeof s> => s !== null)
    .map((s) => ({ seatIndex: s.seatIndex, name: s.name, isBot: s.isBot }));

  const decisions = new MixedDecisionProvider(io, room, lookupSocket, (player) => {
    io.to(room.code).emit("game:log", { text: `  [Placement timed out] ${player.name} -- defaulting to a bot pick` });
  });

  const engine = new GameEngine(seats, room.settings.difficulty, decisions, (text) => {
    io.to(room.code).emit("game:log", { text });
  });
  engine.onPlacement = (seatIndex, location) => {
    io.to(room.code).emit("placement:placed", { seatIndex, location });
  };

  io.to(room.code).emit("game:state", snapshot(engine));

  let going = true;
  while (going) {
    going = await engine.runRound();
    io.to(room.code).emit("game:state", snapshot(engine));
    if (going) await sleep(ROUND_PACING_MS);
  }

  engine.reportSecretObjectives();

  const game = engine.game;
  io.to(room.code).emit("game:over", { status: game.status, round: game.roundNum });
  recordGameEnd(gameId, game.status, game.roundNum);
}

function snapshot(engine: GameEngine) {
  const g = engine.game;
  return {
    roundNum: g.roundNum,
    status: g.status,
    playerProgress: g.playerProgress,
    enemyProgress: g.enemyProgress,
    overrunTracker: g.overrunTracker,
    overrunTrackerMax: g.overrunTrackerMax,
    commandPool: g.commandPool,
    players: g.players.map((p) => ({
      seatIndex: p.seatIndex,
      name: p.name,
      rank: p.rank,
      res: p.res,
      active: p.active ? { name: p.active.card.Name, hp: p.active.curHp, maxHp: p.active.maxHp, shields: p.active.curShields } : null,
      reserveCount: p.reserve.length,
      stats: p.stats,
    })),
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
