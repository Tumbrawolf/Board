import { randomBytes } from "node:crypto";
import {
  DEFAULT_SETTINGS,
  MAX_SEATS,
  type RoomSettings,
  type RoomState,
  type Seat,
} from "./types.js";

function generateRoomCode(): string {
  // 4 uppercase letters, easy to read aloud/type, e.g. "QXKP"
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // skip I/O to avoid confusion with 1/0
  let code = "";
  const bytes = randomBytes(4);
  for (let i = 0; i < 4; i++) {
    code += alphabet[bytes[i] % alphabet.length];
  }
  return code;
}

class Room {
  state: RoomState;

  constructor(code: string) {
    this.state = {
      code,
      status: "lobby",
      seats: new Array(MAX_SEATS).fill(null),
      settings: structuredClone(DEFAULT_SETTINGS),
      createdAt: Date.now(),
    };
  }

  get hostSeat(): Seat | null {
    return this.state.seats.find((s) => s?.isHost) ?? null;
  }

  findSeatByClientId(clientId: string): Seat | null {
    return this.state.seats.find((s) => s?.clientId === clientId) ?? null;
  }

  firstEmptySeatIndex(): number {
    return this.state.seats.findIndex((s) => s === null);
  }

  addOrReconnectPlayer(clientId: string, name: string): Seat | { error: string } {
    const existing = this.findSeatByClientId(clientId);
    if (existing) {
      existing.connected = true;
      existing.name = name || existing.name;
      return existing;
    }
    const idx = this.firstEmptySeatIndex();
    if (idx === -1) return { error: "Room is full" };
    const seat: Seat = {
      seatIndex: idx,
      clientId,
      name: name || `Player ${idx + 1}`,
      isBot: false,
      isHost: this.state.seats.every((s) => s === null), // first human in is host
      ready: false,
      connected: true,
    };
    this.state.seats[idx] = seat;
    return seat;
  }

  markDisconnected(clientId: string) {
    const seat = this.findSeatByClientId(clientId);
    if (seat && !seat.isBot) seat.connected = false;
  }

  removeSeat(seatIndex: number, requesterClientId: string): { error?: string } {
    const requester = this.findSeatByClientId(requesterClientId);
    if (!requester?.isHost) return { error: "Only the host can do that" };
    if (seatIndex < 0 || seatIndex >= MAX_SEATS) return { error: "Invalid seat" };
    const wasHost = this.state.seats[seatIndex]?.isHost;
    this.state.seats[seatIndex] = null;
    if (wasHost) this.promoteNextHost();
    return {};
  }

  private promoteNextHost() {
    const next = this.state.seats.find((s) => s !== null);
    if (next) next.isHost = true;
  }

  toggleBot(seatIndex: number, requesterClientId: string): { error?: string } {
    const requester = this.findSeatByClientId(requesterClientId);
    if (!requester?.isHost) return { error: "Only the host can do that" };
    const current = this.state.seats[seatIndex];
    if (current && !current.isBot) {
      return { error: "Seat is occupied by a connected player" };
    }
    if (current?.isBot) {
      this.state.seats[seatIndex] = null;
      return {};
    }
    if (seatIndex < 0 || seatIndex >= MAX_SEATS) return { error: "Invalid seat" };
    if (this.state.seats[seatIndex] !== null) return { error: "Seat is occupied" };
    this.state.seats[seatIndex] = {
      seatIndex,
      clientId: `bot-${seatIndex}-${randomBytes(3).toString("hex")}`,
      name: `Bot ${seatIndex + 1}`,
      isBot: true,
      isHost: false,
      ready: true,
      connected: true,
    };
    return {};
  }

  setReady(clientId: string, ready: boolean) {
    const seat = this.findSeatByClientId(clientId);
    if (seat) seat.ready = ready;
  }

  updateSettings(requesterClientId: string, settings: RoomSettings): { error?: string } {
    const requester = this.findSeatByClientId(requesterClientId);
    if (!requester?.isHost) return { error: "Only the host can do that" };
    this.state.settings = settings;
    return {};
  }

  canStart(): boolean {
    const filled = this.state.seats.filter((s) => s !== null);
    if (filled.length < 1) return false;
    return filled.every((s) => s!.isBot || s!.ready);
  }

  start(requesterClientId: string): { error?: string } {
    const requester = this.findSeatByClientId(requesterClientId);
    if (!requester?.isHost) return { error: "Only the host can do that" };
    if (!this.canStart()) return { error: "All connected players must be ready first" };
    this.state.status = "started";
    return {};
  }

  isEmpty(): boolean {
    return this.state.seats.every((s) => s === null || (!s.connected && !s.isBot));
  }
}

export class RoomManager {
  private rooms = new Map<string, Room>();

  createRoom(): Room {
    let code = generateRoomCode();
    while (this.rooms.has(code)) code = generateRoomCode();
    const room = new Room(code);
    this.rooms.set(code, room);
    return room;
  }

  get(code: string): Room | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  deleteIfEmpty(code: string) {
    const room = this.rooms.get(code);
    if (room?.isEmpty()) this.rooms.delete(code);
  }

  findRoomByClientId(clientId: string): Room | undefined {
    for (const room of this.rooms.values()) {
      if (room.findSeatByClientId(clientId)) return room;
    }
    return undefined;
  }
}
