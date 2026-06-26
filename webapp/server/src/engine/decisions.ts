import { LOCATIONS, RANK_NUM, type Location } from "./constants.js";
import type { CommandCard, GearCard, UnitCard } from "./data.js";
import {
  affordableGear,
  affordableUnits,
  buyGearMutation,
  buyUnitMutation,
  canActivateAsNonCommander,
  canBuildCard,
  cardEligibleForBattlefield,
  buildCardMutation,
  commanderActivateCardMutation,
  nonCommanderActivateCardMutation,
  equipGearOntoActiveMutation,
} from "./planningActions.js";
import { reorderActive } from "./state.js";
import type { GamePlayer, GameState } from "./types.js";

export type CommandCardChoice = "build" | "activate" | "skip";

export interface PlacedWorker {
  seatIndex: number;
  name: string;
}

/** One location's worker list, as seen by the Commander's Call decision -- `workers` is in
 * placement order (the index a provider returns in chooseFullIncomeOrder's result refers to
 * positions in THIS array, since the same player can appear more than once). */
export interface ContestedLocation {
  location: Location;
  workers: GamePlayer[];
  fullSlots: number;
}

/** Stage 4's Planning window: a player's Shop/Equip purchases are applied immediately (they only
 * ever depend on the player's own resources + shop contention), but their Command Card choices
 * are just RECORDED here (card name -> build/activate/skip) and re-validated/applied later, once
 * the round's Donation step has actually finished topping up the shared command pool -- exactly
 * mirroring when sim.py's own build/activate funds checks were always evaluated. */
export interface PlanningWindowCtx {
  isCommander: boolean;
  eligibleToActivateAsNonCommander: boolean;
  log: (text: string) => void;
}

/** Stage 7's Battlefield-card window: unlike the Planning window, there's no later step whose
 * state changes what's legal here (no Donation-equivalent occurs between this and Combat), so
 * choices apply immediately instead of being recorded for later. */
export interface BattlefieldWindowCtx {
  isCommander: boolean;
  eligibleToActivateAsNonCommander: boolean;
  log: (text: string) => void;
  dispatch: (card: CommandCard, loc: Location) => void;
}

/** Per-seat decision points. Stage 2 only had BotDecisionProvider (mirroring Working/sim.py's
 * existing AI heuristics). Stage 3 added chooseWorkerPlacement as the first decision a human can
 * actually make; Stage 4 adds runPlanningWindow (Shop/Equip/Command Cards, all open at once) for
 * a human seat, via MixedDecisionProvider (see server/src/humanDecisions.ts). */
export interface DecisionProvider {
  /** One worker at a time, round-robin across players -- placedSoFar is every placement already
   * resolved this round (across all players), so a provider can see what's contested/taken. */
  chooseWorkerPlacement(
    player: GamePlayer,
    game: GameState,
    placedSoFar: Record<Location, PlacedWorker[]>
  ): Promise<Location>;

  chooseNextUnitPurchase(
    player: GamePlayer,
    game: GameState,
    affordable: UnitCard[]
  ): Promise<UnitCard | null>;

  chooseNextGearPurchase(
    player: GamePlayer,
    game: GameState,
    affordable: GearCard[]
  ): Promise<GearCard | null>;

  /** canBuild/canActivate tell the provider what's actually legal right now (slot cap, funds,
   * eligibility) -- the provider must only return an option that's currently legal. Still used by
   * the bot path directly (game.ts's Phase 2 + the separate Battlefield-card phase); a human
   * seat's choices instead come back from runPlanningWindow's returned map. */
  chooseCommandCardAction(
    player: GamePlayer,
    game: GameState,
    card: CommandCard,
    canBuild: boolean,
    canActivate: boolean
  ): Promise<CommandCardChoice>;

  /** True only for a human-controlled, currently-connected seat -- lets game.ts decide whether to
   * re-ask chooseCommandCardAction live (bots, Phase 2) or read back the choices already recorded
   * during this player's Planning window (humans). */
  isInteractiveSeat(player: GamePlayer): boolean;

  /** Opens this player's Shop/Equip/Command-Card window. Implementations apply Shop/Equip actions
   * immediately (via planningActions.ts's mutators) and return the player's recorded Command Card
   * choices (possibly empty -- a bot still decides those live in game.ts's later Phase 2). */
  runPlanningWindow(player: GamePlayer, game: GameState, ctx: PlanningWindowCtx): Promise<Map<string, CommandCardChoice>>;

  /** Opens this player's Battlefield-card window (Combat stage, after enemy hoards exist). Unlike
   * runPlanningWindow, choices apply immediately -- there's no later step that changes what's
   * legal here. */
  runBattlefieldCardWindow(player: GamePlayer, game: GameState, ctx: BattlefieldWindowCtx): Promise<void>;

  /** Commander's Call (optional rule): instead of the default "first N workers to arrive get the
   * location's full-income slot(s)", the commander picks which workers get them, across every
   * location that actually has a contested choice this round. Returns one reordered copy of
   * `workers` per contested location, in the SAME order as the input array -- the first
   * `fullSlots` entries of each are the chosen full-income workers. */
  chooseFullIncomeOrder(commander: GamePlayer, game: GameState, contested: ContestedLocation[]): Promise<GamePlayer[][]>;

  /** Vote of No Confidence (optional rule): does this player want to accuse someone of being
   * Saboteur/Chaos-aligned this round? Returns the accused player's seatIndex, or null to skip.
   * Bots never initiate (no real basis to suspect anyone) -- only a connected human seat can
   * return non-null here; BotDecisionProvider always returns null. */
  chooseAccusation(player: GamePlayer, game: GameState, others: GamePlayer[]): Promise<number | null>;

  /** Vote of No Confidence: does this voter believe the accusation? Bots vote Believed
   * unconditionally if a human made the accusation, or randomly if a bot did (no real basis for
   * suspicion either way -- this distinction is just to make bot-initiated accusations, which
   * never actually happen given chooseAccusation's bot behavior, resolve sensibly if ever used). */
  castAccusationVote(voter: GamePlayer, game: GameState, accuser: GamePlayer, accused: GamePlayer): Promise<boolean>;
}

const BOT_LOCATION_PRIORITY: Location[] = [
  "Command",
  "Barracks",
  "Armory",
  "Containment Block",
  "Battlefield",
  "Medical Bay",
];

export class BotDecisionProvider implements DecisionProvider {
  async chooseWorkerPlacement(
    _player: GamePlayer,
    _game: GameState,
    placedSoFar: Record<Location, PlacedWorker[]>
  ): Promise<Location> {
    // Prefer a still-open "full income" slot (first 2 workers at a location both earn full) in
    // a fixed priority order; once everywhere has 2+, just pile onto the least-crowded location.
    const open = BOT_LOCATION_PRIORITY.find((loc) => placedSoFar[loc].length < 2);
    if (open) return open;
    return LOCATIONS.reduce((a, b) => (placedSoFar[b].length < placedSoFar[a].length ? b : a));
  }

  async chooseNextUnitPurchase(
    player: GamePlayer,
    _game: GameState,
    affordable: UnitCard[]
  ): Promise<UnitCard | null> {
    if (!affordable.length) return null;
    // Mirrors sim.py: prioritize Saboteur Cell on sight, else the highest-Rank affordable unit.
    const sabo = affordable.find((u) => u.Name === "Saboteur Cell");
    if (sabo) return sabo;
    return affordable.reduce((best, u) =>
      RANK_NUM[u.Rank] > RANK_NUM[best.Rank] ? u : best
    );
  }

  async chooseNextGearPurchase(
    player: GamePlayer,
    _game: GameState,
    affordable: GearCard[]
  ): Promise<GearCard | null> {
    if (!affordable.length) return null;
    return affordable.reduce((best, g) =>
      RANK_NUM[g["Rank Name"]] > RANK_NUM[best["Rank Name"]] ? g : best
    );
  }

  async chooseCommandCardAction(
    player: GamePlayer,
    game: GameState,
    card: CommandCard,
    canBuild: boolean,
    canActivate: boolean
  ): Promise<CommandCardChoice> {
    // Mirrors sim.py: prefer building a permanent Upgrade if affordable and slot-eligible,
    // otherwise activate for free/cheap, otherwise skip this round.
    if (canBuild) return "build";
    if (canActivate) return "activate";
    return "skip";
  }

  isInteractiveSeat(_player: GamePlayer): boolean {
    return false;
  }

  /** Same buy-units-then-equip/buy-gear loop that used to live inline in game.ts's old
   * runPurchasing -- moved here so the human path (MixedDecisionProvider) and the bot path share
   * one call site in game.ts. Command Card decisions are deliberately NOT made here (returns an
   * empty map) -- a bot still decides those live, in game.ts's Phase 2, exactly as before. */
  async runPlanningWindow(player: GamePlayer, game: GameState, ctx: PlanningWindowCtx): Promise<Map<string, CommandCardChoice>> {
    let bought = 0;
    while (bought < 2) {
      const choice = await this.chooseNextUnitPurchase(player, game, affordableUnits(game, player));
      if (!choice) break;
      buyUnitMutation(game, player, choice, ctx.log);
      bought += 1;
    }

    const pendingHand = [...player.gearHand];
    player.gearHand = [];
    for (const g of pendingHand) {
      if (player.active) equipGearOntoActiveMutation(player, g, ctx.log);
      else player.gearHand.push(g);
    }

    let gearBought = 0;
    while (player.active && gearBought < 2) {
      const choice = await this.chooseNextGearPurchase(player, game, affordableGear(game, player));
      if (!choice) break;
      buyGearMutation(game, player, choice as any, ctx.log);
      gearBought += 1;
    }

    reorderActive(player);
    return new Map();
  }

  /** Mirrors the old resolveHand/resolveNonCommanderHands live-ask loop, just relocated here so
   * the bot path and the human path (MixedDecisionProvider) share one call site in game.ts. */
  async runBattlefieldCardWindow(player: GamePlayer, game: GameState, ctx: BattlefieldWindowCtx): Promise<void> {
    for (const card of [...player.hand].filter((c) => cardEligibleForBattlefield(game, c))) {
      let choice: CommandCardChoice;
      if (ctx.isCommander) {
        choice = await this.chooseCommandCardAction(player, game, card, canBuildCard(game, card), true);
      } else {
        if (!ctx.eligibleToActivateAsNonCommander) continue;
        choice = await this.chooseCommandCardAction(player, game, card, false, canActivateAsNonCommander(game, player, card));
      }
      if (choice === "skip") continue;
      if (!ctx.isCommander && choice !== "activate") continue;
      player.hand.splice(player.hand.indexOf(card), 1);
      if (choice === "build") {
        buildCardMutation(game, card, ctx.log, () => {});
      } else if (ctx.isCommander) {
        commanderActivateCardMutation(card, player, ctx.log, ctx.dispatch);
      } else {
        nonCommanderActivateCardMutation(game, card, player, ctx.log, ctx.dispatch);
      }
    }
  }

  /** Bot/default heuristic for Commander's Call: favor whichever workers belong to the
   * currently-weakest players (lowest total resources) for the full-income slots, same logic the
   * design's own playtest examples used for a thoughtful commander -- rather than just keeping
   * the arrival-order default, which is what NOT having this optional rule on already does. */
  async chooseFullIncomeOrder(_commander: GamePlayer, _game: GameState, contested: ContestedLocation[]): Promise<GamePlayer[][]> {
    return contested.map(({ workers }) =>
      workers
        .map((p, i) => ({ p, i }))
        .sort((a, b) => {
          const totalA = a.p.res.Organic + a.p.res.Tech + a.p.res.Alien;
          const totalB = b.p.res.Organic + b.p.res.Tech + b.p.res.Alien;
          return totalA !== totalB ? totalA - totalB : a.i - b.i;
        })
        .map(({ p }) => p)
    );
  }

  async chooseAccusation(_player: GamePlayer, _game: GameState, _others: GamePlayer[]): Promise<number | null> {
    return null;
  }

  async castAccusationVote(_voter: GamePlayer, _game: GameState, accuser: GamePlayer, _accused: GamePlayer): Promise<boolean> {
    if (!accuser.isBot) return true;
    return Math.random() < 0.5;
  }
}
