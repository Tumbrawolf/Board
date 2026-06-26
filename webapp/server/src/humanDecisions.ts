import { randomUUID } from "node:crypto";
import type { Server, Socket } from "socket.io";
import { LOCATIONS, type Location } from "./engine/constants.js";
import {
  BotDecisionProvider,
  type BattlefieldWindowCtx,
  type CommandCardChoice,
  type ContestedLocation,
  type DecisionProvider,
  type PlacedWorker,
  type PlanningWindowCtx,
} from "./engine/decisions.js";
import type { CommandCard, EventCard, GearCard, UnitCard } from "./engine/data.js";
import {
  affordableGear,
  affordableUnits,
  buildCardMutation,
  buyGearMutation,
  buyUnitMutation,
  canActivateAsNonCommander,
  canBuildCard,
  cardEligibleForBattlefield,
  cardEligibleForPlanning,
  commanderActivateCardMutation,
  nonCommanderActivateCardMutation,
} from "./engine/planningActions.js";
import type { GamePlayer, GameState } from "./engine/types.js";
import type { RoomState } from "./types.js";

const PLACEMENT_TIMEOUT_MS = 30000;
const PLANNING_TIMEOUT_MS = 60000;
const BATTLEFIELD_TIMEOUT_MS = 30000;
const COMMANDERS_CALL_TIMEOUT_MS = 30000;
const ACCUSATION_TIMEOUT_MS = 20000;
const ACCUSATION_VOTE_TIMEOUT_MS = 20000;
const EVENT_CHOICE_TIMEOUT_MS = 20000;

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

interface PendingCommandersCall {
  socketId: string;
  resolve: (assignments: Record<string, number[]> | null) => void;
}

const pendingCommandersCall = new Map<string, PendingCommandersCall>();

/** Called from the server's `commandersCall:choose` socket handler -- same stale/spoofed-drop
 * convention as resolvePlacementChoice. */
export function resolveCommandersCallChoice(socketId: string, requestId: string, assignments: Record<string, number[]>) {
  const req = pendingCommandersCall.get(requestId);
  if (!req || req.socketId !== socketId) return;
  pendingCommandersCall.delete(requestId);
  req.resolve(assignments);
}

interface PendingAccusation {
  socketId: string;
  resolve: (accusedSeatIndex: number | null) => void;
}

const pendingAccusation = new Map<string, PendingAccusation>();

export function resolveAccusationChoice(socketId: string, requestId: string, accusedSeatIndex: number | null) {
  const req = pendingAccusation.get(requestId);
  if (!req || req.socketId !== socketId) return;
  pendingAccusation.delete(requestId);
  req.resolve(typeof accusedSeatIndex === "number" ? accusedSeatIndex : null);
}

interface PendingAccusationVote {
  socketId: string;
  resolve: (believed: boolean | null) => void;
}

const pendingAccusationVote = new Map<string, PendingAccusationVote>();

export function resolveAccusationVote(socketId: string, requestId: string, believed: boolean) {
  const req = pendingAccusationVote.get(requestId);
  if (!req || req.socketId !== socketId) return;
  pendingAccusationVote.delete(requestId);
  req.resolve(Boolean(believed));
}

interface PendingEventChoice {
  socketId: string;
  resolve: (index: number | null) => void;
}

const pendingEventChoice = new Map<string, PendingEventChoice>();

export function resolveEventChoice(socketId: string, requestId: string, index: number) {
  const req = pendingEventChoice.get(requestId);
  if (!req || req.socketId !== socketId) return;
  pendingEventChoice.delete(requestId);
  req.resolve(typeof index === "number" ? index : null);
}

function serializeHand(
  game: GameState,
  player: GamePlayer,
  ctx: { isCommander: boolean; eligibleToActivateAsNonCommander: boolean },
  eligible: (game: GameState, card: CommandCard) => boolean
) {
  return player.hand
    .filter((c) => eligible(game, c))
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
    private onPlanningTimeout: (player: GamePlayer) => void = () => {},
    private onBattlefieldTimeout: (player: GamePlayer) => void = () => {},
    private onCommandersCallTimeout: (player: GamePlayer) => void = () => {}
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
        socket.emit("planning:update", { hand: serializeHand(game, player, ctx, cardEligibleForPlanning) });
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
        hand: serializeHand(game, player, ctx, cardEligibleForPlanning),
        timeoutMs: PLANNING_TIMEOUT_MS,
      });
    });
  }

  /** Stage 7: the Battlefield-card window, opened mid-Combat after enemy hoards exist. Unlike
   * runPlanningWindow, there's no later step that changes legality here, so choices apply
   * immediately instead of being recorded for later. */
  async runBattlefieldCardWindow(player: GamePlayer, game: GameState, ctx: BattlefieldWindowCtx): Promise<void> {
    const seat = this.room.seats.find((s) => s?.seatIndex === player.seatIndex);
    if (!seat || seat.isBot) return this.bot.runBattlefieldCardWindow(player, game, ctx);
    const socket = this.lookupSocket(seat.clientId);
    if (!socket) return this.bot.runBattlefieldCardWindow(player, game, ctx);

    return new Promise<void>((resolveWindow) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        socket.off("battlefield:resolveCard", onResolveCard);
        socket.off("battlefield:done", onDone);
        resolveWindow();
      };

      const timer = setTimeout(() => {
        this.onBattlefieldTimeout(player);
        finish();
      }, BATTLEFIELD_TIMEOUT_MS);

      const sendUpdate = () => {
        socket.emit("battlefield:update", { hand: serializeHand(game, player, ctx, cardEligibleForBattlefield) });
      };

      const onResolveCard = (payload: { name: string; action: CommandCardChoice }, ack?: (r: { ok: boolean; error?: string }) => void) => {
        const card = player.hand.find((c) => c.Name === payload?.name);
        if (!card || !cardEligibleForBattlefield(game, card)) {
          ack?.({ ok: false, error: "Card not available." });
          return;
        }
        if (payload.action === "skip") {
          ack?.({ ok: true });
          sendUpdate();
          return;
        }
        if (payload.action === "build") {
          if (!ctx.isCommander || !canBuildCard(game, card)) {
            ack?.({ ok: false, error: "Can't build that right now." });
            return;
          }
          player.hand.splice(player.hand.indexOf(card), 1);
          buildCardMutation(game, card, ctx.log, () => {});
        } else if (ctx.isCommander) {
          player.hand.splice(player.hand.indexOf(card), 1);
          commanderActivateCardMutation(card, player, ctx.log, ctx.dispatch);
        } else {
          if (!ctx.eligibleToActivateAsNonCommander || !canActivateAsNonCommander(game, player, card)) {
            ack?.({ ok: false, error: "Can't afford to activate that right now." });
            return;
          }
          player.hand.splice(player.hand.indexOf(card), 1);
          nonCommanderActivateCardMutation(game, card, player, ctx.log, ctx.dispatch);
        }
        ack?.({ ok: true });
        this.onStateChange();
        sendUpdate();
      };

      const onDone = () => finish();

      socket.on("battlefield:resolveCard", onResolveCard);
      socket.on("battlefield:done", onDone);

      socket.emit("battlefield:prompt", {
        isCommander: ctx.isCommander,
        eligibleToActivateAsNonCommander: ctx.eligibleToActivateAsNonCommander,
        hand: serializeHand(game, player, ctx, cardEligibleForBattlefield),
        timeoutMs: BATTLEFIELD_TIMEOUT_MS,
      });
    });
  }

  /** Commander's Call (optional rule): a single request/response prompt, same shape as
   * chooseWorkerPlacement, sent only when at least one location actually has a contested
   * full-income choice this round. */
  async chooseFullIncomeOrder(commander: GamePlayer, game: GameState, contested: ContestedLocation[]): Promise<GamePlayer[][]> {
    if (!contested.length) return [];
    const seat = this.room.seats.find((s) => s?.seatIndex === commander.seatIndex);
    if (!seat || seat.isBot) return this.bot.chooseFullIncomeOrder(commander, game, contested);
    const socket = this.lookupSocket(seat.clientId);
    if (!socket) return this.bot.chooseFullIncomeOrder(commander, game, contested);

    const requestId = randomUUID();
    const assignments = await new Promise<Record<string, number[]> | null>((resolve) => {
      const timer = setTimeout(() => {
        pendingCommandersCall.delete(requestId);
        resolve(null);
      }, COMMANDERS_CALL_TIMEOUT_MS);
      pendingCommandersCall.set(requestId, {
        socketId: socket.id,
        resolve: (a) => {
          clearTimeout(timer);
          resolve(a);
        },
      });
      socket.emit("commandersCall:prompt", {
        requestId,
        timeoutMs: COMMANDERS_CALL_TIMEOUT_MS,
        locations: contested.map((c) => ({
          location: c.location,
          fullSlots: c.fullSlots,
          workers: c.workers.map((p, i) => ({ index: i, seatIndex: p.seatIndex, name: p.name })),
        })),
      });
    });

    if (!assignments) {
      this.onCommandersCallTimeout(commander);
      return this.bot.chooseFullIncomeOrder(commander, game, contested);
    }

    const results: GamePlayer[][] = [];
    for (const c of contested) {
      const chosenIdx = (assignments[c.location] ?? []).filter(
        (i) => Number.isInteger(i) && i >= 0 && i < c.workers.length
      );
      const uniqueChosen = [...new Set(chosenIdx)];
      if (uniqueChosen.length !== c.fullSlots) {
        // Malformed/incomplete response for this one location -- fall back to the bot heuristic
        // for just this location rather than discarding the rest of a valid response.
        const [fallback] = await this.bot.chooseFullIncomeOrder(commander, game, [c]);
        results.push(fallback);
        continue;
      }
      const chosenSet = new Set(uniqueChosen);
      const chosen = uniqueChosen.map((i) => c.workers[i]);
      const rest = c.workers.filter((_, i) => !chosenSet.has(i));
      results.push([...chosen, ...rest]);
    }
    return results;
  }

  /** Vote of No Confidence: does this player want to accuse someone this round? A single
   * request/response prompt, same shape as chooseWorkerPlacement -- not responding within
   * ACCUSATION_TIMEOUT_MS just means skip (accusing is always optional, never forced). */
  async chooseAccusation(player: GamePlayer, game: GameState, others: GamePlayer[]): Promise<number | null> {
    const seat = this.room.seats.find((s) => s?.seatIndex === player.seatIndex);
    if (!seat || seat.isBot) return this.bot.chooseAccusation(player, game, others);
    const socket = this.lookupSocket(seat.clientId);
    if (!socket) return this.bot.chooseAccusation(player, game, others);

    const requestId = randomUUID();
    return new Promise<number | null>((resolve) => {
      const timer = setTimeout(() => {
        pendingAccusation.delete(requestId);
        resolve(null);
      }, ACCUSATION_TIMEOUT_MS);
      pendingAccusation.set(requestId, {
        socketId: socket.id,
        resolve: (seatIndex) => {
          clearTimeout(timer);
          resolve(seatIndex);
        },
      });
      socket.emit("accusation:prompt", {
        requestId,
        timeoutMs: ACCUSATION_TIMEOUT_MS,
        others: others.map((p) => ({ seatIndex: p.seatIndex, name: p.name })),
      });
    });
  }

  /** Vote of No Confidence: does this voter believe the accusation? Not responding within
   * ACCUSATION_VOTE_TIMEOUT_MS defaults to Not Believed -- same innocent-until-proven default
   * used for tie-breaking the vote count itself. */
  async castAccusationVote(voter: GamePlayer, game: GameState, accuser: GamePlayer, accused: GamePlayer): Promise<boolean> {
    const seat = this.room.seats.find((s) => s?.seatIndex === voter.seatIndex);
    if (!seat || seat.isBot) return this.bot.castAccusationVote(voter, game, accuser, accused);
    const socket = this.lookupSocket(seat.clientId);
    if (!socket) return this.bot.castAccusationVote(voter, game, accuser, accused);

    const requestId = randomUUID();
    const believed = await new Promise<boolean | null>((resolve) => {
      const timer = setTimeout(() => {
        pendingAccusationVote.delete(requestId);
        resolve(null);
      }, ACCUSATION_VOTE_TIMEOUT_MS);
      pendingAccusationVote.set(requestId, {
        socketId: socket.id,
        resolve: (b) => {
          clearTimeout(timer);
          resolve(b);
        },
      });
      socket.emit("accusationVote:prompt", {
        requestId,
        timeoutMs: ACCUSATION_VOTE_TIMEOUT_MS,
        accuserName: accuser.name,
        accusedName: accused.name,
      });
    });
    return believed ?? false;
  }

  /** The commander picks which of the 2 drawn Events becomes active this round -- a single
   * request/response prompt, same shape as chooseWorkerPlacement. Not responding within
   * EVENT_CHOICE_TIMEOUT_MS falls back to the bot heuristic (favor the milder card). */
  async chooseActiveEvent(commander: GamePlayer, game: GameState, drawn: EventCard[]): Promise<number> {
    if (drawn.length <= 1) return 0;
    const seat = this.room.seats.find((s) => s?.seatIndex === commander.seatIndex);
    if (!seat || seat.isBot) return this.bot.chooseActiveEvent(commander, game, drawn);
    const socket = this.lookupSocket(seat.clientId);
    if (!socket) return this.bot.chooseActiveEvent(commander, game, drawn);

    const requestId = randomUUID();
    const index = await new Promise<number | null>((resolve) => {
      const timer = setTimeout(() => {
        pendingEventChoice.delete(requestId);
        resolve(null);
      }, EVENT_CHOICE_TIMEOUT_MS);
      pendingEventChoice.set(requestId, {
        socketId: socket.id,
        resolve: (i) => {
          clearTimeout(timer);
          resolve(i);
        },
      });
      socket.emit("eventChoice:prompt", {
        requestId,
        timeoutMs: EVENT_CHOICE_TIMEOUT_MS,
        options: drawn.map((e) => ({
          name: e["Event name"],
          roundEffect: e["Round Effect"],
          completionCondition: e["Completion Condition"],
          completionReward: e["Completion Reward"],
          failurePenalty: e["Failure Penalty"],
        })),
      });
    });

    if (index === null || index < 0 || index >= drawn.length) return this.bot.chooseActiveEvent(commander, game, drawn);
    return index;
  }
}
