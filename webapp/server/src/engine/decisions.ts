import { ENEMY_RANK_NUM, GEAR_HAND_LIMIT, LOCATIONS, RANK_NUM, type EnemyRank, type Location } from "./constants.js";
import type { CommandCard, EventCard, GearCard, UnitCard } from "./data.js";
import type { EnemyCard } from "./data.js";
import { isMildEvent } from "./events.js";
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
import { lanePower, reorderActive } from "./state.js";
import type { GamePlayer, GameState } from "./types.js";

export type CommandCardChoice = "build" | "activate" | "skip";

// ── Tactician active targeting ────────────────────────────────────────────────

export interface TacticianLaneEnemy {
  seatIndex: number;
  playerName: string;
  enemies: { name: string; hp: number; armor: number; idx: number }[];
}

export interface TacticianGearOption {
  unitId: string;
  unitName: string;
  gearName: string;
  gearType: string;
  /** Index into the unit's equipped array. */
  equippedIdx: number;
}

export type TacticianActiveKind =
  | "enemy_pick"           // Gunsmith: pick 1 enemy from any lane
  | "gear_pick"            // Bulwark (Armor) / Engineer (Utility): pick 1 gear from own units
  | "player_pick"          // Kingmaker: pick 1 player to become commander
  | "card_action"          // Tactician: choose how to use the drawn card
  | "shop_pick"            // Drillmaster/Specialist: pick among tied-rank units
  | "recycle_pick"         // Reclaimer: pick gear from recycle pile
  | "swap_enemies"         // Chessmaster: pick 2 enemies from 2 different lanes to swap
  | "combat_stims_passive" // Combat Stims passive: pick a contained enemy to trigger its Reveal
  | "combat_stims_active"; // Combat Stims active: pick damage amount (idx = damage, options via shopOptions)

export interface TacticianActivePrompt {
  tacticianName: string;
  kind: TacticianActiveKind;
  /** Lanes with enemies (enemy_pick, swap_enemies). */
  laneEnemies?: TacticianLaneEnemy[];
  /** Gear options on the player's own units (gear_pick). */
  gearOptions?: TacticianGearOption[];
  /** Other players available to pick (player_pick). */
  playerOptions?: { seatIndex: number; name: string; rank: number }[];
  /** Drawn command card name + effects (card_action). */
  cardName?: string;
  cardActiveEffect?: string;
  cardBuildEffect?: string;
  canActivate?: boolean;
  canBuild?: boolean;
  /** Shop units with tied rank (shop_pick). */
  shopOptions?: { name: string; rank: string; idx: number }[];
  /** Recycle pile items eligible by rank (recycle_pick). */
  recycleOptions?: { name: string; rankName: string; idx: number }[];
}

export interface TacticianActiveResponse {
  /** enemy_pick: which enemy to target. */
  seatIndex?: number;
  enemyIdx?: number;
  /** swap_enemies: two enemies from two different lanes. */
  enemyA?: { seatIndex: number; enemyIdx: number };
  enemyB?: { seatIndex: number; enemyIdx: number };
  /** gear_pick: index into gearOptions. */
  gearOptIdx?: number;
  /** player_pick: target player seat. */
  targetSeat?: number;
  /** card_action: what to do with the drawn card. */
  cardAction?: "activate" | "build" | "keep";
  /** shop_pick / recycle_pick: index into the options array. */
  optionIdx?: number;
}

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

  /** The commander draws 2 Events each round and picks which becomes active -- previously a
   * random pick in both this engine and sim.py (the comment said "chooses," the code never did).
   * Returns the chosen card's index into `drawn` (0 or 1). */
  chooseActiveEvent(commander: GamePlayer, game: GameState, drawn: EventCard[]): Promise<number>;

  /** Fired once per round for any Tactician whose Active requires a player choice (targeting an
   * enemy, selecting a gear item, picking a player, etc.). The `prompt.kind` field describes
   * which Tactician is asking and what shape of response is expected. Bot implementations
   * return a heuristic pick; human seats emit a socket event and wait for the client. */
  chooseTacticianActiveTarget(
    player: GamePlayer,
    game: GameState,
    prompt: TacticianActivePrompt
  ): Promise<TacticianActiveResponse>;

  /** End-of-planning gear hand trim: called when the player's gearHand exceeds GEAR_HAND_LIMIT.
   * Returns the indices (into `hand`) of cards to discard. Must return exactly
   * `hand.length - GEAR_HAND_LIMIT` indices. */
  chooseGearHandDiscard(
    player: GamePlayer,
    game: GameState,
    hand: GearCard[]
  ): Promise<number[]>;

  /** Commander lane assignment: called once per round (after Event pick, before planning) so the
   * commander can reassign which player controls which physical lane. Returns a Map where
   * key=controllerSeatIndex, value=laneOwnerSeatIndex. An empty map or identity mapping means no
   * change. Must be a valid permutation (bijection over all seatIndexes). */
  chooseLaneAssignments(
    commander: GamePlayer,
    game: GameState
  ): Promise<Map<number, number>>;

  /** Leadership Crisis Event: each player blind-votes for who should be next commander.
   * votesSoFar contains votes already cast (seatIndex -> voted seatIndex) so bots can
   * follow the plurality. Returns the seatIndex of the player this voter wants as commander. */
  chooseCommanderVote(
    player: GamePlayer,
    game: GameState,
    candidates: { seatIndex: number; name: string; rank: number }[],
    votesSoFar: Map<number, number>
  ): Promise<number>;

  /** Perfect Information active: commander sees all enemy stacks and may redistribute enemies
   * across lanes. Returns a Map<seatIndex, EnemyCard[]> of the new per-lane assignments using
   * the same total pool; null means keep current layout unchanged. */
  choosePerfectInfoLayout(
    commander: GamePlayer,
    game: GameState
  ): Promise<Map<number, EnemyCard[]> | null>;
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
    player: GamePlayer,
    game: GameState,
    placedSoFar: Record<Location, PlacedWorker[]>
  ): Promise<Location> {
    // Emergency Triage: condition requires every player at Medical Bay -- force it if not yet placed there
    if (
      game.activeEvent?.["Event name"] === "Emergency Triage" &&
      !(placedSoFar["Medical Bay"] ?? []).some((w) => w.seatIndex === player.seatIndex)
    ) {
      return "Medical Bay";
    }
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
      if (player.active) equipGearOntoActiveMutation(game, player, g, ctx.log);
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
        commanderActivateCardMutation(game, card, player, ctx.log, ctx.dispatch);
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

  /** Favors whichever of the 2 drawn cards is "mild" (the original 8 resource-conversion-only
   * events, no disruptive Round Effect) over a disruptive one. If both or neither are mild,
   * picks randomly between them -- no finer-grained harshness ranking exists for the rest. */
  async chooseActiveEvent(_commander: GamePlayer, _game: GameState, drawn: EventCard[]): Promise<number> {
    if (drawn.length === 1) return 0;
    const mild = drawn.map((e) => isMildEvent(e["Event name"]));
    if (mild[0] && !mild[1]) return 0;
    if (mild[1] && !mild[0]) return 1;
    return Math.floor(Math.random() * drawn.length);
  }

  async chooseTacticianActiveTarget(
    player: GamePlayer,
    _game: GameState,
    prompt: TacticianActivePrompt
  ): Promise<TacticianActiveResponse> {
    switch (prompt.kind) {
      case "enemy_pick": {
        // Gunsmith: weakest enemy (lowest HP) across all lanes
        let best: { seatIndex: number; enemyIdx: number; hp: number } | null = null;
        for (const lane of prompt.laneEnemies ?? []) {
          for (const e of lane.enemies) {
            if (!best || e.hp < best.hp) best = { seatIndex: lane.seatIndex, enemyIdx: e.idx, hp: e.hp };
          }
        }
        return best ? { seatIndex: best.seatIndex, enemyIdx: best.enemyIdx } : {};
      }
      case "gear_pick":
        // Bulwark: first Armor gear. Engineer: first Utility that was used (presented in order).
        return prompt.gearOptions?.length ? { gearOptIdx: 0 } : {};
      case "player_pick": {
        // Kingmaker: next player in seat order that isn't The Kingmaker themselves
        const opts = (prompt.playerOptions ?? []).filter(o => o.seatIndex !== player.seatIndex);
        return opts.length ? { targetSeat: opts[0].seatIndex } : {};
      }
      case "card_action":
        if (prompt.canActivate) return { cardAction: "activate" };
        if (prompt.canBuild) return { cardAction: "build" };
        return { cardAction: "keep" };
      case "shop_pick":
        return { optionIdx: 0 };
      case "recycle_pick": {
        // Reclaimer: highest-rank eligible item (last in the sorted options list)
        const opts = prompt.recycleOptions ?? [];
        return { optionIdx: opts.length ? opts.length - 1 : 0 };
      }
      case "swap_enemies": {
        // Chessmaster: move the heaviest enemy from the largest lane into the smallest lane
        const lanes = prompt.laneEnemies ?? [];
        if (lanes.length < 2) return {};
        const sorted = [...lanes].sort((a, b) => b.enemies.length - a.enemies.length);
        const fromLane = sorted[0];
        const toLane = sorted[sorted.length - 1];
        if (!fromLane.enemies.length || !toLane.enemies.length) return {};
        const fromEnemy = fromLane.enemies.reduce((a, b) => (b.hp > a.hp ? b : a));
        const toEnemy = toLane.enemies.reduce((a, b) => (b.hp < a.hp ? b : a));
        return {
          enemyA: { seatIndex: fromLane.seatIndex, enemyIdx: fromEnemy.idx },
          enemyB: { seatIndex: toLane.seatIndex, enemyIdx: toEnemy.idx },
        };
      }
      case "combat_stims_passive": {
        // Use first contained enemy that has a Reveal effect; otherwise first available.
        const opts = prompt.shopOptions ?? [];
        const withReveal = opts.findIndex((o) => !o.name.includes("(no Reveal)"));
        return withReveal >= 0 ? { optionIdx: withReveal } : opts.length ? { optionIdx: 0 } : {};
      }
      case "combat_stims_active": {
        // Deal ~1/3 of available options (idx = damage amount); each opt.idx is the damage value.
        const opts = prompt.shopOptions ?? [];
        const chosen = opts[Math.floor(opts.length / 3)] ?? opts[0];
        return chosen ? { optionIdx: chosen.idx } : { optionIdx: 1 };
      }
      default:
        return {};
    }
  }

  async chooseGearHandDiscard(
    _player: GamePlayer,
    _game: GameState,
    hand: GearCard[]
  ): Promise<number[]> {
    const rankOf = (g: GearCard) => RANK_NUM[(g as any)["Rank Name"] as keyof typeof RANK_NUM] ?? 0;
    const discard = hand.length - GEAR_HAND_LIMIT;
    return [...hand]
      .map((g, i) => ({ g, i }))
      .sort((a, b) => rankOf(a.g) - rankOf(b.g))
      .slice(0, discard)
      .map(({ i }) => i);
  }

  async chooseLaneAssignments(_commander: GamePlayer, game: GameState): Promise<Map<number, number>> {
    // Bot commanders never reassign lanes -- return identity so all players control their own lane.
    return new Map(game.players.map((p) => [p.seatIndex, p.seatIndex]));
  }

  async chooseCommanderVote(
    _player: GamePlayer,
    _game: GameState,
    candidates: { seatIndex: number; name: string; rank: number }[],
    votesSoFar: Map<number, number>
  ): Promise<number> {
    const tally = new Map<number, number>();
    for (const voted of votesSoFar.values()) tally.set(voted, (tally.get(voted) ?? 0) + 1);
    const sorted = [...candidates].sort((a, b) => {
      const voteDiff = (tally.get(b.seatIndex) ?? 0) - (tally.get(a.seatIndex) ?? 0);
      return voteDiff !== 0 ? voteDiff : b.rank - a.rank;
    });
    return sorted[0].seatIndex;
  }

  async choosePerfectInfoLayout(_commander: GamePlayer, game: GameState): Promise<Map<number, EnemyCard[]> | null> {
    // Pool all enemies, sort weakest-first; assign weakest enemies to weakest lanes (cooperative optimum).
    const pool: EnemyCard[] = game.players.flatMap((p) => p.laneEnemyReserve);
    if (!pool.length) return null;
    const byRank = (e: EnemyCard) => ENEMY_RANK_NUM[e.Rank as EnemyRank] ?? 0;
    pool.sort((a, b) => byRank(a) - byRank(b));
    const lanes = [...game.players].sort((a, b) => lanePower(a) - lanePower(b));
    const result = new Map<number, EnemyCard[]>(lanes.map((p) => [p.seatIndex, []]));
    pool.forEach((e, i) => {
      const lane = lanes[i % lanes.length];
      result.get(lane.seatIndex)!.push(e);
    });
    return result;
  }
}
