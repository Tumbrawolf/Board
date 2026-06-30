import { randomUUID } from "node:crypto";
import type { Server, Socket } from "socket.io";
import { LOCATIONS, type Location } from "./engine/constants.js";
import {
  BotDecisionProvider,
  type BattlefieldWindowCtx,
  type CommandCardChoice,
  type ContestedLocation,
  type CombatRoundSnapshot,
  type DecisionProvider,
  type PlacedWorker,
  type PlanningWindowCtx,
  type TacticianActivePrompt,
  type TacticianActiveResponse,
} from "./engine/decisions.js";
import { toInt, type CommandCard, type EventCard, type GearCard, type UnitCard } from "./engine/data.js";
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

// --- Combat pacing (pause / skip / per-round ack) ---
const COMBAT_ACK_TIMEOUT_MS = 15000;

const combatPausedRooms = new Set<string>();
const combatResumeCallbacks = new Map<string, Array<() => void>>();
// socket.id → true once that client presses Skip for this combat session.
const combatSkippedSocketIds = new Map<string, Set<string>>(); // roomCode → socketIds

interface CombatRoundPending {
  requestId: string;
  pending: Map<string, { resolve: () => void; timerId: ReturnType<typeof setTimeout> }>;
}
const pendingCombatRound = new Map<string, CombatRoundPending>();

function waitForResume(roomCode: string): Promise<void> {
  if (!combatPausedRooms.has(roomCode)) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const callbacks = combatResumeCallbacks.get(roomCode) ?? [];
    callbacks.push(resolve);
    combatResumeCallbacks.set(roomCode, callbacks);
  });
}

/** Called when a human socket sends `combat:ack`. */
export function resolveCombatAck(socketId: string, requestId: string, roomCode: string) {
  const round = pendingCombatRound.get(roomCode);
  if (!round || round.requestId !== requestId) return;
  const entry = round.pending.get(socketId);
  if (!entry) return;
  clearTimeout(entry.timerId);
  round.pending.delete(socketId);
  entry.resolve();
}

/** Toggle pause globally for a room. Broadcasts `combat:paused` to all clients. */
export function setCombatPause(roomCode: string, io: Server) {
  combatPausedRooms.add(roomCode);
  io.to(roomCode).emit("combat:paused");
}

/** Resume a paused room. Immediately resolves all pending acks so combat continues. */
export function setCombatResume(roomCode: string, io: Server) {
  combatPausedRooms.delete(roomCode);
  const callbacks = combatResumeCallbacks.get(roomCode) ?? [];
  combatResumeCallbacks.delete(roomCode);
  for (const cb of callbacks) cb();
  // Immediately unblock any in-flight acks so the next exchange fires.
  const round = pendingCombatRound.get(roomCode);
  if (round) {
    for (const [, entry] of round.pending) {
      clearTimeout(entry.timerId);
      entry.resolve();
    }
    round.pending.clear();
  }
  io.to(roomCode).emit("combat:resumed");
}

/** Mark a socket as "skip" — auto-resolves all future acks for them this combat. */
export function setCombatSkip(socketId: string, roomCode: string) {
  if (!combatSkippedSocketIds.has(roomCode)) combatSkippedSocketIds.set(roomCode, new Set());
  combatSkippedSocketIds.get(roomCode)!.add(socketId);
  // Immediately resolve any in-flight ack for this socket.
  const round = pendingCombatRound.get(roomCode);
  if (round) {
    const entry = round.pending.get(socketId);
    if (entry) {
      clearTimeout(entry.timerId);
      round.pending.delete(socketId);
      entry.resolve();
    }
  }
}

/** Clear per-room combat skip state at the end of combat (call once combat finishes). */
export function clearCombatSkip(roomCode: string) {
  combatSkippedSocketIds.delete(roomCode);
  pendingCombatRound.delete(roomCode);
}

const PLACEMENT_TIMEOUT_MS = 30000;
const PLANNING_TIMEOUT_MS = 60000;
const BATTLEFIELD_TIMEOUT_MS = 30000;
const COMMANDERS_CALL_TIMEOUT_MS = 30000;
const ACCUSATION_TIMEOUT_MS = 20000;
const ACCUSATION_VOTE_TIMEOUT_MS = 20000;
const EVENT_CHOICE_TIMEOUT_MS = 20000;
const TACTICIAN_ACTIVE_TIMEOUT_MS = 20000;
const GEAR_DISCARD_TIMEOUT_MS = 30000;
const LANE_ASSIGNMENT_TIMEOUT_MS = 45000;

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

interface PendingTacticianActive {
  socketId: string;
  resolve: (response: TacticianActiveResponse | null) => void;
}

const pendingTacticianActive = new Map<string, PendingTacticianActive>();

interface PendingGearDiscard {
  socketId: string;
  resolve: (indices: number[] | null) => void;
}

const pendingGearDiscard = new Map<string, PendingGearDiscard>();

interface PendingLaneAssignment {
  socketId: string;
  resolve: (assignments: Record<string, number> | null) => void;
}

const pendingLaneAssignment = new Map<string, PendingLaneAssignment>();

export function resolveLaneAssignmentChoice(socketId: string, requestId: string, assignments: Record<string, number>) {
  const req = pendingLaneAssignment.get(requestId);
  if (!req || req.socketId !== socketId) return;
  pendingLaneAssignment.delete(requestId);
  req.resolve(typeof assignments === "object" && assignments !== null ? assignments : null);
}

interface PendingCommanderVote {
  socketId: string;
  resolve: (seatIndex: number | null) => void;
}

const pendingCommanderVote = new Map<string, PendingCommanderVote>();

export function resolveCommanderVote(socketId: string, requestId: string, seatIndex: number) {
  const req = pendingCommanderVote.get(requestId);
  if (!req || req.socketId !== socketId) return;
  pendingCommanderVote.delete(requestId);
  req.resolve(typeof seatIndex === "number" ? seatIndex : null);
}

export function resolveGearDiscardChoice(socketId: string, requestId: string, discardIndices: number[]) {
  const req = pendingGearDiscard.get(requestId);
  if (!req || req.socketId !== socketId) return;
  pendingGearDiscard.delete(requestId);
  req.resolve(discardIndices);
}

// ── Chessmaster Reassign ──────────────────────────────────────────────────────

const CHESSMASTER_REASSIGN_TIMEOUT_MS = 30000;
const CHESSMASTER_CONSENT_TIMEOUT_MS = 20000;

interface PendingChessmasterReassign {
  socketId: string;
  resolve: (moves: { unitId: string; destSeatIndex: number }[] | null) => void;
}
const pendingChessmasterReassign = new Map<string, PendingChessmasterReassign>();

interface PendingChessmasterConsent {
  socketId: string;
  resolve: (accepted: boolean | null) => void;
}
const pendingChessmasterConsent = new Map<string, PendingChessmasterConsent>();

export function resolveChessmasterReassign(
  socketId: string,
  requestId: string,
  moves: { unitId: string; destSeatIndex: number }[]
) {
  const req = pendingChessmasterReassign.get(requestId);
  if (!req || req.socketId !== socketId) return;
  pendingChessmasterReassign.delete(requestId);
  req.resolve(Array.isArray(moves) ? moves : null);
}

export function resolveChessmasterConsent(socketId: string, requestId: string, accepted: boolean) {
  const req = pendingChessmasterConsent.get(requestId);
  if (!req || req.socketId !== socketId) return;
  pendingChessmasterConsent.delete(requestId);
  req.resolve(Boolean(accepted));
}

// ── Cross-Lane Gear Offer ─────────────────────────────────────────────────────

const GEAR_OFFER_TIMEOUT_MS = 20000;

interface PendingGearOfferConsent {
  socketId: string;
  resolve: (accepted: boolean | null) => void;
}
const pendingGearOfferConsent = new Map<string, PendingGearOfferConsent>();

export function resolveGearOfferConsent(socketId: string, requestId: string, accepted: boolean) {
  const req = pendingGearOfferConsent.get(requestId);
  if (!req || req.socketId !== socketId) return;
  pendingGearOfferConsent.delete(requestId);
  req.resolve(Boolean(accepted));
}

interface PendingPerfectInfo {
  socketId: string;
  resolve: (layout: Record<string, number[]> | null) => void;
}

const pendingPerfectInfo = new Map<string, PendingPerfectInfo>();
const PERFECT_INFO_TIMEOUT_MS = 45000;

export function resolvePerfectInfoLayout(socketId: string, requestId: string, layout: Record<string, number[]>) {
  const req = pendingPerfectInfo.get(requestId);
  if (!req || req.socketId !== socketId) return;
  pendingPerfectInfo.delete(requestId);
  req.resolve(typeof layout === "object" && layout !== null ? layout : null);
}

export function resolveTacticianActiveChoice(socketId: string, requestId: string, response: TacticianActiveResponse) {
  const req = pendingTacticianActive.get(requestId);
  if (!req || req.socketId !== socketId) return;
  pendingTacticianActive.delete(requestId);
  req.resolve(response);
}

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
        socket.off("planning:sendGear", onSendGear);
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

      // Cross-lane gear equip: send gear from this player's gearHand to another player's active unit.
      // Requires the destination player's consent (if human). No additional Tech cost — gear was already purchased.
      const onSendGear = async (
        payload: { gearName: string; toSeatIndex: number },
        ack?: (r: { ok: boolean; error?: string }) => void
      ) => {
        const gearIdx = player.gearHand.findIndex((g) => (g as any).Name === payload?.gearName);
        if (gearIdx < 0) { ack?.({ ok: false, error: "Gear not in hand." }); return; }
        const gear = player.gearHand[gearIdx];
        const destPlayer = game.players.find((q) => q.seatIndex === payload?.toSeatIndex);
        if (!destPlayer || !destPlayer.active) { ack?.({ ok: false, error: "Target has no active unit." }); return; }
        if (destPlayer === player) { ack?.({ ok: false, error: "Use buyGear to equip on your own unit." }); return; }

        // Slot availability check (mirrors equipGearOntoActiveMutation)
        const gType = (gear as any).Type as string | undefined;
        const SLOT_LIMITED = new Set(["Weapon", "Armor", "Utility"]);
        if (gType && SLOT_LIMITED.has(gType)) {
          const expander = gType === "Utility" ? "Ammo Pouches" : gType === "Weapon" ? "Extra Holster" : null;
          const hasExpander = expander ? destPlayer.active.equipped.some((eq) => (eq as any).Name === expander) : false;
          const cap = hasExpander ? 2 : 1;
          const sameTypeCount = destPlayer.active.equipped.filter((eq) => (eq as any).Type === gType).length;
          if (sameTypeCount >= cap) { ack?.({ ok: false, error: `${destPlayer.name} has no free ${gType} slot.` }); return; }
        }

        // Get consent from the destination player (skip for bots — they always accept)
        const destSeat = this.room.seats.find((s) => s?.seatIndex === payload.toSeatIndex);
        const destSocket = destSeat && !destSeat.isBot ? this.lookupSocket(destSeat.clientId) : null;
        let accepted = true;
        if (destSocket) {
          const offerId = randomUUID();
          accepted = await new Promise<boolean>((resolve) => {
            const timer = setTimeout(() => { pendingGearOfferConsent.delete(offerId); resolve(false); }, GEAR_OFFER_TIMEOUT_MS);
            pendingGearOfferConsent.set(offerId, { socketId: destSocket.id, resolve: (a) => { clearTimeout(timer); resolve(a ?? false); } });
            destSocket.emit("planning:gearOffer", {
              requestId: offerId, timeoutMs: GEAR_OFFER_TIMEOUT_MS,
              fromName: player.name, gearName: (gear as any).Name, gearType: gType ?? "?",
            });
          });
        }
        if (!accepted) { ack?.({ ok: false, error: `${destPlayer.name} declined.` }); return; }

        // Apply equip
        player.gearHand.splice(gearIdx, 1);
        destPlayer.active.equipped.push(gear);
        const hpBonus = toInt((gear as any).HP ?? "0");
        destPlayer.active.maxHp += hpBonus;
        destPlayer.active.curHp += hpBonus;
        destPlayer.active.curShields += toInt((gear as any).Shields ?? "0");
        if ((gear as any).Name === "Recon Satellite") destPlayer.hasReconSatellite = true;
        if ((gear as any).Name === "Last Stand Beacon") destPlayer.hasLastStandBeacon = true;
        game.unitsOrGearAddedSeats.add(destPlayer.seatIndex);
        player.stats.gearEquippedToAllies += 1;
        ctx.log(`  [Cross-lane] ${player.name} equips ${(gear as any).Name} onto ${destPlayer.name}'s ${destPlayer.active.card.Name}`);
        ack?.({ ok: true });
        this.onStateChange();
        sendUpdate();
      };

      const onDone = () => finish();

      socket.on("planning:buyUnit", onBuyUnit);
      socket.on("planning:buyGear", onBuyGear);
      socket.on("planning:resolveCard", onResolveCard);
      socket.on("planning:sendGear", onSendGear);
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
          commanderActivateCardMutation(game, card, player, ctx.log, ctx.dispatch);
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

  /** Tactician active targeting: send the prompt to the human's socket; if they don't respond
   * within 20 s fall back to the bot heuristic so the round never stalls. */
  async chooseTacticianActiveTarget(
    player: GamePlayer,
    game: GameState,
    prompt: TacticianActivePrompt
  ): Promise<TacticianActiveResponse> {
    const seat = this.room.seats.find((s) => s?.seatIndex === player.seatIndex);
    if (!seat || seat.isBot) return this.bot.chooseTacticianActiveTarget(player, game, prompt);
    const socket = this.lookupSocket(seat.clientId);
    if (!socket) return this.bot.chooseTacticianActiveTarget(player, game, prompt);

    const requestId = randomUUID();
    const response = await new Promise<TacticianActiveResponse | null>((resolve) => {
      const timer = setTimeout(() => {
        pendingTacticianActive.delete(requestId);
        resolve(null);
      }, TACTICIAN_ACTIVE_TIMEOUT_MS);
      pendingTacticianActive.set(requestId, {
        socketId: socket.id,
        resolve: (r) => {
          clearTimeout(timer);
          resolve(r);
        },
      });
      socket.emit("tactician:active:prompt", { requestId, timeoutMs: TACTICIAN_ACTIVE_TIMEOUT_MS, prompt });
    });

    if (!response) {
      this.onTimeout(player);
      return this.bot.chooseTacticianActiveTarget(player, game, prompt);
    }
    return response;
  }

  async chooseGearHandDiscard(player: GamePlayer, game: GameState, hand: GearCard[]): Promise<number[]> {
    const seat = this.room.seats.find((s) => s?.seatIndex === player.seatIndex);
    if (!seat || seat.isBot) return this.bot.chooseGearHandDiscard(player, game, hand);
    const socket = this.lookupSocket(seat.clientId);
    if (!socket) return this.bot.chooseGearHandDiscard(player, game, hand);

    const mustDiscard = hand.length - 3;
    const requestId = randomUUID();
    const indices = await new Promise<number[] | null>((resolve) => {
      const timer = setTimeout(() => {
        pendingGearDiscard.delete(requestId);
        resolve(null);
      }, GEAR_DISCARD_TIMEOUT_MS);
      pendingGearDiscard.set(requestId, {
        socketId: socket.id,
        resolve: (r) => { clearTimeout(timer); resolve(r); },
      });
      socket.emit("gear:discard:prompt", {
        requestId,
        timeoutMs: GEAR_DISCARD_TIMEOUT_MS,
        mustDiscard,
        hand: hand.map((g, i) => ({ idx: i, name: (g as any).Name ?? "?", rankName: (g as any)["Rank Name"] ?? "" })),
      });
    });

    if (!indices || indices.length !== mustDiscard) {
      this.onTimeout(player);
      return this.bot.chooseGearHandDiscard(player, game, hand);
    }
    return indices;
  }

  /** Lane assignment: only fires for the commander, and only if the commander is a human seat.
   * Sends each player's current lane state so the commander can build a reassignment permutation.
   * Times out after 45 s and falls back to the bot (identity = no change). */
  async chooseLaneAssignments(commander: GamePlayer, game: GameState): Promise<Map<number, number>> {
    const seat = this.room.seats.find((s) => s?.seatIndex === commander.seatIndex);
    if (!seat || seat.isBot) return this.bot.chooseLaneAssignments(commander, game);
    const socket = this.lookupSocket(seat.clientId);
    if (!socket) return this.bot.chooseLaneAssignments(commander, game);

    const requestId = randomUUID();
    const raw = await new Promise<Record<string, number> | null>((resolve) => {
      const timer = setTimeout(() => {
        pendingLaneAssignment.delete(requestId);
        resolve(null);
      }, LANE_ASSIGNMENT_TIMEOUT_MS);
      pendingLaneAssignment.set(requestId, {
        socketId: socket.id,
        resolve: (r) => { clearTimeout(timer); resolve(r); },
      });
      socket.emit("lane:assignment:prompt", {
        requestId,
        timeoutMs: LANE_ASSIGNMENT_TIMEOUT_MS,
        lanes: game.players.map((p) => ({
          seatIndex: p.seatIndex,
          ownerName: p.name,
          rank: p.rank,
          activeUnit: p.active ? `${p.active.card.Name} (Rk${p.active.card.Rank}, ${p.active.curHp}/${p.active.maxHp} HP)` : null,
          reserveCount: p.reserve.length,
          currentControllerSeat: p.controlledLaneSeat,
        })),
      });
    });

    if (!raw) {
      this.onTimeout(commander);
      return this.bot.chooseLaneAssignments(commander, game);
    }

    // Validate: must be a bijection over all seatIndexes.
    const seatSet = new Set(game.players.map((p) => p.seatIndex));
    const result = new Map<number, number>();
    for (const [k, v] of Object.entries(raw)) {
      const controller = Number(k);
      const lane = Number(v);
      if (!seatSet.has(controller) || !seatSet.has(lane)) continue;
      result.set(controller, lane);
    }
    // Verify bijection: every seat must appear exactly once as a controller and once as a lane.
    const controllers = new Set(result.keys());
    const lanes = new Set(result.values());
    const isValid =
      controllers.size === seatSet.size &&
      lanes.size === seatSet.size &&
      [...seatSet].every((s) => controllers.has(s) && lanes.has(s));
    if (!isValid) return this.bot.chooseLaneAssignments(commander, game);
    return result;
  }

  async chooseCommanderVote(
    player: GamePlayer,
    game: GameState,
    candidates: { seatIndex: number; name: string; rank: number }[],
    votesSoFar: Map<number, number>
  ): Promise<number> {
    const seat = this.room.seats.find((s) => s?.seatIndex === player.seatIndex);
    if (!seat || seat.isBot) return this.bot.chooseCommanderVote(player, game, candidates, votesSoFar);
    const socket = this.lookupSocket(seat.clientId);
    if (!socket) return this.bot.chooseCommanderVote(player, game, candidates, votesSoFar);

    const requestId = randomUUID();
    const choice = await new Promise<number | null>((resolve) => {
      const timer = setTimeout(() => {
        pendingCommanderVote.delete(requestId);
        resolve(null);
      }, 20000);
      pendingCommanderVote.set(requestId, {
        socketId: socket.id,
        resolve: (s) => { clearTimeout(timer); resolve(s); },
      });
      socket.emit("leadershipCrisis:votePrompt", { requestId, candidates });
    });

    if (typeof choice === "number" && candidates.some((c) => c.seatIndex === choice)) return choice;
    this.onTimeout(player);
    return this.bot.chooseCommanderVote(player, game, candidates, votesSoFar);
  }

  async choosePerfectInfoLayout(commander: GamePlayer, game: GameState): Promise<Map<number, import("./engine/data.js").EnemyCard[]> | null> {
    const seat = this.room.seats.find((s) => s?.seatIndex === commander.seatIndex);
    if (!seat || seat.isBot) return this.bot.choosePerfectInfoLayout(commander, game);
    const socket = this.lookupSocket(seat.clientId);
    if (!socket) return this.bot.choosePerfectInfoLayout(commander, game);

    // Build a flat pooled list and per-lane current assignment for the client.
    const pool = game.players.flatMap((p) =>
      p.laneEnemyReserve.map((e) => ({ name: e.Name, rank: e.Rank, damage: e.Damage, hp: e.HP }))
    );
    let poolIdx = 0;
    const currentLanes = game.players.map((p) => ({
      seatIndex: p.seatIndex,
      ownerName: p.name,
      enemyIndices: p.laneEnemyReserve.map(() => poolIdx++),
    }));

    const requestId = randomUUID();
    const layout = await new Promise<Record<string, number[]> | null>((resolve) => {
      const timer = setTimeout(() => {
        pendingPerfectInfo.delete(requestId);
        resolve(null);
      }, PERFECT_INFO_TIMEOUT_MS);
      pendingPerfectInfo.set(requestId, {
        socketId: socket.id,
        resolve: (a) => { clearTimeout(timer); resolve(a); },
      });
      socket.emit("perfectInfo:prompt", { requestId, timeoutMs: PERFECT_INFO_TIMEOUT_MS, pool, currentLanes });
    });

    if (!layout) return this.bot.choosePerfectInfoLayout(commander, game);

    // Reconstruct per-player EnemyCard arrays from the flat pool response.
    const flatPool = game.players.flatMap((p) => p.laneEnemyReserve);
    const result = new Map<number, import("./engine/data.js").EnemyCard[]>();
    for (const p of game.players) {
      const indices = (layout[String(p.seatIndex)] ?? []).filter((i) => Number.isInteger(i) && i >= 0 && i < flatPool.length);
      result.set(p.seatIndex, indices.map((i) => flatPool[i]));
    }
    // Validate total count matches (if malformed, fall back to bot).
    const totalAssigned = [...result.values()].reduce((s, arr) => s + arr.length, 0);
    if (totalAssigned !== flatPool.length) return this.bot.choosePerfectInfoLayout(commander, game);
    return result;
  }

  /** Emit one round of exchange data to all clients and wait for every non-skipped human to ack
   * (or the hard timeout). Pauses freeze the wait; resumes immediately unblock all pending acks. */
  async waitForCombatAck(game: GameState, snapshot: CombatRoundSnapshot): Promise<void> {
    const roomCode = this.room.code;

    // Hold here until any active pause clears.
    await waitForResume(roomCode);

    const requestId = randomUUID();
    this.io.to(roomCode).emit("combat:round", { requestId, ...snapshot });

    // Collect connected, non-skipped human socket ids.
    const skipped = combatSkippedSocketIds.get(roomCode) ?? new Set<string>();
    const humanSocketIds: string[] = [];
    for (const seat of this.room.seats) {
      if (!seat || seat.isBot) continue;
      const sock = this.lookupSocket(seat.clientId);
      if (!sock || skipped.has(sock.id)) continue;
      humanSocketIds.push(sock.id);
    }
    if (humanSocketIds.length === 0) return;

    const round: CombatRoundPending = { requestId, pending: new Map() };
    pendingCombatRound.set(roomCode, round);

    await Promise.all(
      humanSocketIds.map(
        (socketId) =>
          new Promise<void>((resolve) => {
            const timerId = setTimeout(() => {
              round.pending.delete(socketId);
              resolve();
            }, COMBAT_ACK_TIMEOUT_MS);
            round.pending.set(socketId, { resolve, timerId });
          })
      )
    );

    pendingCombatRound.delete(roomCode);
  }

  async chooseChessmasterReassign(
    player: import("./engine/types.js").GamePlayer,
    game: import("./engine/types.js").GameState
  ): Promise<{ unitId: string; destSeatIndex: number }[]> {
    const seat = this.room.seats.find((s) => s?.seatIndex === player.seatIndex);
    if (!seat || seat.isBot) return this.bot.chooseChessmasterReassign(player, game);
    const socket = this.lookupSocket(seat.clientId);
    if (!socket) return this.bot.chooseChessmasterReassign(player, game);

    const allUnits = [...(player.active ? [player.active] : []), ...player.reserve];
    if (!allUnits.length) return [];

    // Step 1: ask the Chessmaster to propose up to 2 moves
    const requestId = randomUUID();
    const proposed = await new Promise<{ unitId: string; destSeatIndex: number }[] | null>((resolve) => {
      const timer = setTimeout(() => { pendingChessmasterReassign.delete(requestId); resolve(null); }, CHESSMASTER_REASSIGN_TIMEOUT_MS);
      pendingChessmasterReassign.set(requestId, { socketId: socket.id, resolve: (m) => { clearTimeout(timer); resolve(m); } });
      socket.emit("chessmaster:reassign:prompt", {
        requestId, timeoutMs: CHESSMASTER_REASSIGN_TIMEOUT_MS,
        yourUnits: allUnits.map((u) => ({ id: u.id, name: u.card.Name, rank: u.card.Rank })),
        lanes: game.players.filter((q) => q.seatIndex !== player.seatIndex).map((q) => ({
          seatIndex: q.seatIndex, ownerName: q.name, rank: q.rank,
          activeUnit: q.active ? q.active.card.Name : null,
        })),
      });
    });

    if (!proposed || proposed.length === 0) return [];

    // Step 2: for each proposed move, get consent from the destination lane owner
    const accepted: { unitId: string; destSeatIndex: number }[] = [];
    for (const move of proposed.slice(0, 2)) {
      const destPlayer = game.players.find((q) => q.seatIndex === move.destSeatIndex);
      const unit = allUnits.find((u) => u.id === move.unitId);
      if (!destPlayer || !unit) continue;

      const destSeat = this.room.seats.find((s) => s?.seatIndex === move.destSeatIndex);
      const destSocket = destSeat && !destSeat.isBot ? this.lookupSocket(destSeat.clientId) : null;

      let consentGiven = true; // bots always consent
      if (destSocket) {
        const consentId = randomUUID();
        consentGiven = await new Promise<boolean>((resolve) => {
          const timer = setTimeout(() => { pendingChessmasterConsent.delete(consentId); resolve(false); }, CHESSMASTER_CONSENT_TIMEOUT_MS);
          pendingChessmasterConsent.set(consentId, { socketId: destSocket.id, resolve: (a) => { clearTimeout(timer); resolve(a ?? false); } });
          destSocket.emit("chessmaster:reassign:consent", {
            requestId: consentId, timeoutMs: CHESSMASTER_CONSENT_TIMEOUT_MS,
            fromName: player.name, unitName: unit.card.Name, unitRank: unit.card.Rank,
          });
        });
      }
      if (consentGiven) accepted.push(move);
    }
    return accepted;
  }
}
