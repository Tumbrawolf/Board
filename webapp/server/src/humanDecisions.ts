import { randomUUID } from "node:crypto";
import type { Server, Socket } from "socket.io";
import { LOCATIONS, type Location } from "./engine/constants.js";
import {
  BotDecisionProvider,
  type CommandCardChoice,
  type DecisionProvider,
  type PlacedWorker,
  type PlanningWindowCtx,
} from "./engine/decisions.js";
import type { CommandCard, GearCard, UnitCard } from "./engine/data.js";
import {
  affordableGear,
  affordableUnits,
  buyGearMutation,
  buyUnitMutation,
  canActivateAsNonCommander,
  canBuildCard,
  cardEligibleForPlanning,
} from "./engine/planningActions.js";
import type { GamePlayer, GameState } from "./engine/types.js";
import type { RoomState } from "./types.js";

const PLACEMENT_TIMEOUT_MS = 30000;
const PLANNING_TIMEOUT_MS = 60000;

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

function serializeHandForPlanning(game: GameState, player: GamePlayer, ctx: PlanningWindowCtx) {
  return player.hand
    .filter((c) => cardEligibleForPlanning(game, c))
    .map((c) => ({
      name: c.Name,
      building: c.Building,
      passiveEffect: c["Passive Effect"],
      activeEffect: c["Active Effect"],
      organic: (c as any).Organic,
      tech: (c as any).Tech,
      alien: (c as any).Alien,
      canBuild: ctx.isCommander && canBuildCard(game, c),
      canActivate: ctx.isCommander ? true : ctx.eligibleToActivateAsNonCommander && canActivateAsNonCommander(game, player, c),
    }));
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
    private onTimeout: (player: GamePlayer) => void,
    /** Called after every Shop/Equip action that actually mutates state, so the server layer can
     * re-broadcast game:state/game:privateState immediately instead of waiting for round-end. */
    private onStateChange: () => void = () => {},
    private onPlanningTimeout: (player: GamePlayer) => void = () => {}
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

  isInteractiveSeat(player: GamePlayer): boolean {
    const seat = this.room.seats.find((s) => s?.seatIndex === player.seatIndex);
    return Boolean(seat && !seat.isBot && this.lookupSocket(seat.clientId));
  }

  /** Stage 4's Planning window: Shop/Equip/Command-Card panels are all open at once on the
   * client. Shop/Equip actions apply immediately; Command Card choices are just recorded (the
   * returned map) since their legality depends on the round's Donation step, which hasn't
   * happened yet -- game.ts re-validates and applies them afterward. */
  async runPlanningWindow(player: GamePlayer, game: GameState, ctx: PlanningWindowCtx): Promise<Map<string, CommandCardChoice>> {
    const seat = this.room.seats.find((s) => s?.seatIndex === player.seatIndex);
    if (!seat || seat.isBot) return this.bot.runPlanningWindow(player, game, ctx);
    const socket = this.lookupSocket(seat.clientId);
    if (!socket) return this.bot.runPlanningWindow(player, game, ctx);

    const cardChoices = new Map<string, CommandCardChoice>();

    return new Promise<Map<string, CommandCardChoice>>((resolveWindow) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        socket.off("planning:buyUnit", onBuyUnit);
        socket.off("planning:buyGear", onBuyGear);
        socket.off("planning:resolveCard", onResolveCard);
        socket.off("planning:done", onDone);
        resolveWindow(cardChoices);
      };

      const timer = setTimeout(() => {
        this.onPlanningTimeout(player);
        finish();
      }, PLANNING_TIMEOUT_MS);

      const sendUpdate = () => {
        socket.emit("planning:update", { hand: serializeHandForPlanning(game, player, ctx) });
      };

      const onBuyUnit = (payload: { name: string }, ack?: (r: { ok: boolean; error?: string }) => void) => {
        const choice = affordableUnits(game, player).find((u) => u.Name === payload?.name);
        if (!choice) {
          ack?.({ ok: false, error: "Not affordable or not in the shop right now." });
          return;
        }
        buyUnitMutation(game, player, choice, ctx.log);
        ack?.({ ok: true });
        this.onStateChange();
        sendUpdate();
      };

      const onBuyGear = (payload: { name: string }, ack?: (r: { ok: boolean; error?: string }) => void) => {
        const choice = affordableGear(game, player).find((g) => g.Name === payload?.name);
        if (!choice) {
          ack?.({ ok: false, error: "Not affordable or not in the shop right now." });
          return;
        }
        buyGearMutation(game, player, choice, ctx.log);
        ack?.({ ok: true });
        this.onStateChange();
        sendUpdate();
      };

      const onResolveCard = (payload: { name: string; action: CommandCardChoice }, ack?: (r: { ok: boolean; error?: string }) => void) => {
        const card = player.hand.find((c) => c.Name === payload?.name);
        if (!card || !cardEligibleForPlanning(game, card)) {
          ack?.({ ok: false, error: "Card not available." });
          return;
        }
        if (payload.action === "build" && !ctx.isCommander) {
          ack?.({ ok: false, error: "Only the commander can build." });
          return;
        }
        cardChoices.set(card.Name, payload.action);
        ack?.({ ok: true });
        sendUpdate();
      };

      const onDone = () => finish();

      socket.on("planning:buyUnit", onBuyUnit);
      socket.on("planning:buyGear", onBuyGear);
      socket.on("planning:resolveCard", onResolveCard);
      socket.on("planning:done", onDone);

      socket.emit("planning:prompt", {
        isCommander: ctx.isCommander,
        eligibleToActivateAsNonCommander: ctx.eligibleToActivateAsNonCommander,
        hand: serializeHandForPlanning(game, player, ctx),
        timeoutMs: PLANNING_TIMEOUT_MS,
      });
    });
  }
}
