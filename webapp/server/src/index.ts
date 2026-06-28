import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { RoomManager } from "./rooms.js";
import { recordGameStart } from "./db.js";
import { runGame } from "./runGame.js";
import {
  resolveAccusationChoice,
  resolveAccusationVote,
  resolveCommanderVote,
  resolveCommandersCallChoice,
  resolveEventChoice,
  resolveGearDiscardChoice,
  resolveLaneAssignmentChoice,
  resolvePerfectInfoLayout,
  resolvePlacementChoice,
  resolveTacticianActiveChoice,
} from "./humanDecisions.js";
import type { RoomSettings } from "./types.js";

const PORT = Number(process.env.PORT ?? 3001);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

const app = express();
app.get("/health", (_req, res) => res.json({ ok: true }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: CLIENT_ORIGIN, methods: ["GET", "POST"] },
});

const rooms = new RoomManager();

// Each connected socket carries the room code + clientId it's currently associated with,
// so we know who to broadcast to and who to clean up on disconnect.
interface SocketData {
  roomCode?: string;
  clientId?: string;
}

// clientId -> current socket id, so the game engine can prompt a specific connected human
// (Stage 3 worker placement) without going through the whole room. Looked up live, not cached,
// so a reconnect (new socket id, same clientId) is always handled correctly.
const clientSockets = new Map<string, string>();
function lookupSocket(clientId: string) {
  const socketId = clientSockets.get(clientId);
  return socketId ? io.sockets.sockets.get(socketId) : undefined;
}

io.on("connection", (socket) => {
  const data = socket.data as SocketData;

  function broadcastRoom(code: string) {
    const room = rooms.get(code);
    if (room) io.to(code).emit("room:state", room.state);
  }

  socket.on("room:create", ({ clientId, name }: { clientId: string; name: string }, ack) => {
    const room = rooms.createRoom();
    const seat = room.addOrReconnectPlayer(clientId, name);
    if ("error" in seat) {
      ack?.({ ok: false, error: seat.error });
      return;
    }
    data.roomCode = room.state.code;
    data.clientId = clientId;
    clientSockets.set(clientId, socket.id);
    socket.join(room.state.code);
    ack?.({ ok: true, roomCode: room.state.code });
    broadcastRoom(room.state.code);
  });

  socket.on(
    "room:join",
    ({ clientId, name, roomCode }: { clientId: string; name: string; roomCode: string }, ack) => {
      const room = rooms.get(roomCode);
      if (!room) {
        ack?.({ ok: false, error: "Room not found" });
        return;
      }
      const seat = room.addOrReconnectPlayer(clientId, name);
      if ("error" in seat) {
        ack?.({ ok: false, error: seat.error });
        return;
      }
      data.roomCode = room.state.code;
      data.clientId = clientId;
      clientSockets.set(clientId, socket.id);
      socket.join(room.state.code);
      ack?.({ ok: true, roomCode: room.state.code });
      broadcastRoom(room.state.code);
    }
  );

  socket.on("placement:choose", ({ requestId, location }: { requestId: string; location: string }) => {
    resolvePlacementChoice(socket.id, requestId, location);
  });

  socket.on(
    "commandersCall:choose",
    ({ requestId, assignments }: { requestId: string; assignments: Record<string, number[]> }) => {
      resolveCommandersCallChoice(socket.id, requestId, assignments ?? {});
    }
  );

  socket.on("accusation:choose", ({ requestId, accusedSeatIndex }: { requestId: string; accusedSeatIndex: number | null }) => {
    resolveAccusationChoice(socket.id, requestId, accusedSeatIndex);
  });

  socket.on("accusationVote:choose", ({ requestId, believed }: { requestId: string; believed: boolean }) => {
    resolveAccusationVote(socket.id, requestId, believed);
  });

  socket.on("eventChoice:choose", ({ requestId, index }: { requestId: string; index: number }) => {
    resolveEventChoice(socket.id, requestId, index);
  });

  socket.on("tactician:active:response", ({ requestId, response }: { requestId: string; response: any }) => {
    resolveTacticianActiveChoice(socket.id, requestId, response);
  });

  socket.on("gear:discard:response", ({ requestId, discardIndices }: { requestId: string; discardIndices: number[] }) => {
    resolveGearDiscardChoice(socket.id, requestId, discardIndices);
  });
  socket.on("lane:assignment:response", ({ requestId, assignments }: { requestId: string; assignments: Record<string, number> }) => {
    resolveLaneAssignmentChoice(socket.id, requestId, assignments);
  });
  socket.on("perfectInfo:response", ({ requestId, layout }: { requestId: string; layout: Record<string, number[]> }) => {
    resolvePerfectInfoLayout(socket.id, requestId, layout);
  });
  socket.on("leadershipCrisis:vote", ({ requestId, seatIndex }: { requestId: string; seatIndex: number }) => {
    resolveCommanderVote(socket.id, requestId, seatIndex);
  });

  socket.on("room:toggleReady", ({ ready }: { ready: boolean }, ack) => {
    if (!data.roomCode || !data.clientId) {
      ack?.({ ok: false, error: "Not in a room" });
      return;
    }
    const room = rooms.get(data.roomCode);
    room?.setReady(data.clientId, ready);
    if (room) broadcastRoom(room.state.code);
    ack?.({ ok: true });
  });

  socket.on("room:toggleBot", ({ seatIndex }: { seatIndex: number }, ack) => {
    if (!data.roomCode || !data.clientId) return;
    const room = rooms.get(data.roomCode);
    if (!room) return;
    const result = room.toggleBot(seatIndex, data.clientId);
    ack?.(result.error ? { ok: false, error: result.error } : { ok: true });
    if (!result.error) broadcastRoom(room.state.code);
  });

  socket.on("room:removeSeat", ({ seatIndex }: { seatIndex: number }, ack) => {
    if (!data.roomCode || !data.clientId) return;
    const room = rooms.get(data.roomCode);
    if (!room) return;
    const result = room.removeSeat(seatIndex, data.clientId);
    ack?.(result.error ? { ok: false, error: result.error } : { ok: true });
    if (!result.error) broadcastRoom(room.state.code);
  });

  socket.on("room:updateSettings", ({ settings }: { settings: RoomSettings }, ack) => {
    if (!data.roomCode || !data.clientId) return;
    const room = rooms.get(data.roomCode);
    if (!room) return;
    const result = room.updateSettings(data.clientId, settings);
    ack?.(result.error ? { ok: false, error: result.error } : { ok: true });
    if (!result.error) broadcastRoom(room.state.code);
  });

  socket.on("room:start", (_payload, ack) => {
    if (!data.roomCode || !data.clientId) return;
    const room = rooms.get(data.roomCode);
    if (!room) return;
    const result = room.start(data.clientId);
    if (result.error) {
      ack?.({ ok: false, error: result.error });
      return;
    }
    const gameId = recordGameStart(room.state);
    ack?.({ ok: true });
    broadcastRoom(room.state.code);
    runGame(io, room.state, gameId, lookupSocket).catch((err) => {
      console.error(`Game in room ${room.state.code} crashed:`, err);
      io.to(room.state.code).emit("game:log", { text: `[ERROR] Game crashed: ${String(err)}` });
    });
  });

  socket.on("disconnect", () => {
    if (data.clientId && clientSockets.get(data.clientId) === socket.id) {
      clientSockets.delete(data.clientId);
    }
    if (!data.roomCode || !data.clientId) return;
    const room = rooms.get(data.roomCode);
    if (!room) return;
    room.markDisconnected(data.clientId);
    broadcastRoom(room.state.code);
    rooms.deleteIfEmpty(room.state.code);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Board webapp server listening on http://localhost:${PORT}`);
});
