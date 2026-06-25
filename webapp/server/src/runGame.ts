import type { Server } from "socket.io";
import { GameEngine, type SeatInput } from "./engine/game.js";
import { toInt } from "./engine/data.js";
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

  // `engine` is assigned just below -- broadcastAll only ever runs after that, but is declared
  // first since MixedDecisionProvider needs it (for live updates during a Planning window) before
  // the engine that needs `decisions` can be constructed.
  let engine!: GameEngine;

  function broadcastAll() {
    io.to(room.code).emit("game:state", snapshot(engine));
    for (const p of engine.game.players) {
      const seat = room.seats.find((s) => s?.seatIndex === p.seatIndex);
      if (!seat || seat.isBot) continue;
      const socket = lookupSocket(seat.clientId);
      socket?.emit("game:privateState", privateSnapshot(p));
    }
  }

  const decisions = new MixedDecisionProvider(
    io,
    room,
    lookupSocket,
    (player) => {
      io.to(room.code).emit("game:log", { text: `  [Placement timed out] ${player.name} -- defaulting to a bot pick` });
    },
    () => broadcastAll(),
    (player) => {
      io.to(room.code).emit("game:log", { text: `  [Planning timed out] ${player.name} -- defaulting to a bot pick` });
    },
    (player) => {
      io.to(room.code).emit("game:log", { text: `  [Battlefield card window timed out] ${player.name} -- defaulting to a bot pick` });
    }
  );

  engine = new GameEngine(seats, room.settings.difficulty, decisions, (text) => {
    io.to(room.code).emit("game:log", { text });
  });
  engine.onPlacement = (seatIndex, location) => {
    io.to(room.code).emit("placement:placed", { seatIndex, location });
  };

  broadcastAll();

  let going = true;
  while (going) {
    going = await engine.runRound();
    broadcastAll();
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
    commanderSeatIndex: g.players[g.commanderIdx]?.seatIndex ?? null,
    shopUnits: g.shopUnits.map((u) => ({
      name: u.Name,
      rank: u.Rank,
      damage: toInt(u.Damage),
      hp: toInt(u.HP),
      armor: toInt(u.Armor),
      shields: toInt(u.Shields),
      organicCost: toInt(u["Organic Cost"]),
      techCost: toInt(u["Tech Cost"]),
      alienCost: toInt(u["Alien Cost"]),
      type: u.Type,
    })),
    shopGear: g.shopGear.map((gear) => ({
      name: gear.Name,
      rank: gear["Rank Name"],
      damage: toInt(gear.Damage),
      hp: toInt(gear.HP),
      armor: toInt(gear.Armor),
      shields: toInt(gear.Shields),
      organicCost: toInt(gear["Organic Cost"]),
      techCost: toInt(gear["Tech Cost"]),
      alienCost: toInt(gear["Alien Cost"]),
      type: gear.Type,
    })),
    players: g.players.map((p) => ({
      seatIndex: p.seatIndex,
      name: p.name,
      rank: p.rank,
      res: p.res,
      active: p.active
        ? { id: p.active.id, name: p.active.card.Name, hp: p.active.curHp, maxHp: p.active.maxHp, shields: p.active.curShields, equipped: p.active.equipped.map((eq) => (eq as any).Name).filter(Boolean) }
        : null,
      reserve: p.reserve.map((u) => ({ id: u.id, name: u.card.Name, hp: u.curHp, maxHp: u.maxHp, shields: u.curShields })),
      laneEnemyReserve: p.laneEnemyReserve.map((e) => ({ name: e.Name, hp: toInt(e.HP), damage: toInt(e.Damage) })),
      stats: p.stats,
    })),
  };
}

/** Sent only to the owning player's own socket -- a hidden hand stays hidden. */
function privateSnapshot(p: GameEngine["game"]["players"][number]) {
  return {
    seatIndex: p.seatIndex,
    hand: p.hand.map((c) => ({
      name: c.Name,
      building: c.Building,
      passiveEffect: c["Passive Effect"],
      activeEffect: c["Active Effect"],
      organic: toInt(c.Organic),
      tech: toInt(c.Tech),
      alien: toInt(c.Alien),
    })),
    gearHand: p.gearHand.map((g: any) => ({
      name: g.Name,
      rank: g["Rank Name"],
      damage: toInt(g.Damage),
      hp: toInt(g.HP),
      armor: toInt(g.Armor),
      shields: toInt(g.Shields),
    })),
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
