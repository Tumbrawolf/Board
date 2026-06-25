import { randomUUID } from "node:crypto";
import type { Server, Socket } from "socket.io";
import { LOCATIONS, type Location } from "./engine/constants.js";
import { BotDecisionProvider, type CommandCardChoice, type DecisionProvider, type PlacedWorker } from "./engine/decisions.js";
import type { CommandCard, GearCard, UnitCard } from "./engine/data.js";
import type { GamePlayer, GameState } from "./engine/types.js";
import type { RoomState } from "./types.js";

const PLACEMENT_TIMEOUT_MS = 30000;

interface PendingPlacement {
  socketId: string;
  resolve: (location: Location | null) => void;
}

const pending = new Map<string, PendingPlacement>();

/** Called from the server's `placement:choose` socket handler. Ignores anything that doesn't
 * match a live, still-pending request (stale/duplicate/spoofed-socket responses are just dropped
 * rather than erroring -- the placement promise will simply time out and fall back to a bot pick). */
export function resolvePlacementChoice(socketId: string, requestId: string, location: string) {
  const req = pending.get(requestId);
  if (!req || req.socketId !== socketId) return;
  pending.delete(requestId);
  req.resolve(LOCATIONS.includes(location as Location) ? (location as Location) : null);
}

/** Looks up the live Socket for a clientId right now (not cached) so reconnects/seat changes
 * are always handled correctly. */
export type SocketLookup = (clientId: string) => Socket | undefined;

/** Every decision stays bot-driven (BotDecisionProvider) EXCEPT chooseWorkerPlacement for a
 * human-controlled, currently-connected seat -- per Stage 3's agreed scope. A human who doesn't
 * respond within PLACEMENT_TIMEOUT_MS (disconnected, AFK, whatever) falls back to the same bot
 * heuristic rather than stalling the whole game. */
export class MixedDecisionProvider implements DecisionProvider {
  private bot = new BotDecisionProvider();

  constructor(
    private io: Server,
    private room: RoomState,
    private lookupSocket: SocketLookup,
    private onTimeout: (player: GamePlayer) => void
  ) {}

  async chooseWorkerPlacement(
    player: GamePlayer,
    game: GameState,
    placedSoFar: Record<Location, PlacedWorker[]>
  ): Promise<Location> {
    const seat = this.room.seats.find((s) => s?.seatIndex === player.seatIndex);
    if (!seat || seat.isBot) return this.bot.chooseWorkerPlacement(player, game, placedSoFar);

    const socket = this.lookupSocket(seat.clientId);
    if (!socket) return this.bot.chooseWorkerPlacement(player, game, placedSoFar);

    const requestId = randomUUID();
    const choice = await new Promise<Location | null>((resolve) => {
      const timer = setTimeout(() => {
        pending.delete(requestId);
        resolve(null);
      }, PLACEMENT_TIMEOUT_MS);
      pending.set(requestId, {
        socketId: socket.id,
        resolve: (loc) => {
          clearTimeout(timer);
          resolve(loc);
        },
      });
      socket.emit("placement:prompt", { requestId, locations: LOCATIONS, placedSoFar });
    });

    if (choice) return choice;
    this.onTimeout(player);
    return this.bot.chooseWorkerPlacement(player, game, placedSoFar);
  }

  chooseNextUnitPurchase(player: GamePlayer, game: GameState, affordable: UnitCard[]) {
    return this.bot.chooseNextUnitPurchase(player, game, affordable);
  }

  chooseNextGearPurchase(player: GamePlayer, game: GameState, affordable: GearCard[]) {
    return this.bot.chooseNextGearPurchase(player, game, affordable);
  }

  chooseCommandCardAction(
    player: GamePlayer,
    game: GameState,
    card: CommandCard,
    canBuild: boolean,
    canActivate: boolean
  ): Promise<CommandCardChoice> {
    return this.bot.chooseCommandCardAction(player, game, card, canBuild, canActivate);
  }
}
