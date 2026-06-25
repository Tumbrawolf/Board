import { RANK_NUM } from "./constants.js";
import type { CommandCard, GearCard, UnitCard } from "./data.js";
import type { GamePlayer, GameState } from "./types.js";

export type CommandCardChoice = "build" | "activate" | "skip";

/** Per-seat decision points. Stage 2 only implements BotDecisionProvider (mirroring
 * Working/sim.py's existing AI heuristics); Stage 3 adds a HumanDecisionProvider with the same
 * shape that resolves its promises from an incoming socket message instead of deciding
 * synchronously. Worker placement is NOT yet a per-seat decision here -- it's still the same
 * team-wide pooled/shuffled assignment sim.py uses; making it a real per-player race is Stage 3's
 * whole point. */
export interface DecisionProvider {
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
   * eligibility) -- the provider must only return an option that's currently legal. */
  chooseCommandCardAction(
    player: GamePlayer,
    game: GameState,
    card: CommandCard,
    canBuild: boolean,
    canActivate: boolean
  ): Promise<CommandCardChoice>;
}

export class BotDecisionProvider implements DecisionProvider {
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
}
