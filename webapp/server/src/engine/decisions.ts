import { LOCATIONS, RANK_NUM, type Location } from "./constants.js";
import type { CommandCard, GearCard, UnitCard } from "./data.js";
import type { GamePlayer, GameState } from "./types.js";

export type CommandCardChoice = "build" | "activate" | "skip";

export interface PlacedWorker {
  seatIndex: number;
  name: string;
}

/** Per-seat decision points. Stage 2 only had BotDecisionProvider (mirroring Working/sim.py's
 * existing AI heuristics). Stage 3 adds chooseWorkerPlacement as the first decision a human can
 * actually make (see server/src/humanDecisions.ts) -- everything else stays bot-decided for every
 * seat this stage, per the agreed Stage 3 scope. */
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
   * eligibility) -- the provider must only return an option that's currently legal. */
  chooseCommandCardAction(
    player: GamePlayer,
    game: GameState,
    card: CommandCard,
    canBuild: boolean,
    canActivate: boolean
  ): Promise<CommandCardChoice>;
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
}
