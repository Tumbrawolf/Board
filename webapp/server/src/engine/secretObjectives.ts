import { LOCATIONS, OVERRUN_START, UPGRADE_SLOT_CAP } from "./constants.js";
import type { SecretObjectiveCard } from "./data.js";
import type { GamePlayer, GameState } from "./types.js";

/** Checked once at game end. Uses the stats/state tracked through the round loop -- falls back
 * to False (not silently True) for anything without a clean tracked counter, since an
 * unverifiable personal objective shouldn't be assumed complete. Ported 1:1 from sim.py's
 * secret_objective_met; the handful of "no clean hook" cases there stay false here too. */
export function secretObjectiveMet(game: GameState, so: SecretObjectiveCard, p: GamePlayer): boolean {
  const name = so.Name;
  const others = game.players.filter((q) => q !== p);
  const overrunStart = OVERRUN_START[game.settings.difficulty];
  switch (name) {
    case "Disruptor":
      return p.stats.eventsFailed >= 3;
    case "Slacker":
      return p.stats.missionsCompleted < 5;
    case "Corrupt Logistics":
      return p.stats.gearDiscarded >= 10;
    case "Martyr":
      return p.stats.deaths >= 20;
    case "Misdirector":
      return p.stats.misdirectorOtherOverruns >= 3;
    case "Trojan":
      return overrunStart - game.overrunTrackerMin >= 5;
    case "Usurper":
      return p.stats.commanderStolenFromHigher >= 3;
    case "Dictator":
      return p.stats.commanderRounds >= 5;
    case "Ghost":
      return p.rank === Math.min(...game.players.map((q) => q.rank));
    case "Incompetence":
      return (game.overrunDropsBySeat.get(p.seatIndex) ?? 0) >= 3;
    case "Problem Solver":
      return p.stats.eventsPassed >= 5;
    case "Adventurer":
      return p.stats.missionsCompleted >= 6;
    case "Armorer":
      return p.stats.gearEquippedToAllies >= 10;
    case "Enforcer":
      return p.stats.kills >= 10;
    case "The Wall":
      return p.stats.overrunsSuffered === 0;
    case "Medic":
      return p.stats.healedHp > 30;
    case "Stubborn":
      return overrunStart - game.overrunTrackerMin <= 5;
    case "Conductor":
      return p.stats.conductorCommandFromLower >= 5;
    case "Leader":
      return p.stats.commanderRounds >= 5;
    case "Tactician":
      return p.stats.progressAsCommander >= 5;
    case "High Command":
      return p.rank === Math.max(...game.players.map((q) => q.rank));
    case "Decorated":
      return p.rank >= 5;
    case "Interdictor":
      return p.stats.abilitiesDenied >= 5;
    case "Hoarder":
      return p.res.Organic >= 40;
    case "Nerd":
      return p.res.Tech >= 40;
    case "Collector":
      return p.res.Alien >= 20;
    case "Chef":
      return p.stats.donationsMade.Organic >= 10;
    case "Technician":
      return p.stats.donationsMade.Tech >= 10;
    case "Scientist":
      return p.stats.donationsMade.Alien >= 5;
    case "Middleman": {
      const pool = others.length ? others : [p];
      return Math.min(...pool.map((q) => q.rank)) < p.rank && p.rank < Math.max(...pool.map((q) => q.rank));
    }
    case "Exporter":
      return p.stats.unitsRetired >= 5;
    case "Advisor":
      return p.stats.commanderRounds === 0;
    case "Hunter":
      // Enemies with a non-empty Reveal or Passive field count as "ability enemies".
      // Threshold of 10 matches the feel of other combat-focused SOs (Enforcer: kills >= 10).
      return p.stats.abilityEnemyKills >= 10;
    case "Architect":
      return LOCATIONS.filter((loc) => game.locationUpgradesBuilt[loc].length >= UPGRADE_SLOT_CAP[loc]).length >= 3;
    case "Minimalist":
      return LOCATIONS.reduce((s, loc) => s + (UPGRADE_SLOT_CAP[loc] - game.locationUpgradesBuilt[loc].length), 0) >= 3;
    case "Survivor":
      return p.stats.longestActiveSurvival >= 3;
    case "Deus Machina":
      return p.stats.secretObjectiveComplete === "Deus Machina";
    case "Leroy":
      return p.stats.roundsWithSingleUnit >= 1;
    case "AFK":
      return p.stats.afkCleanRounds >= 3;
    case "Kremlen":
      return p.stats.commandPoolSpendTotal > p.stats.ownSpendTotal && p.stats.commandPoolSpendTotal > 0;
    default:
      return false;
  }
}

export function checkSecretObjectives(game: GameState, log: (t: string) => void) {
  log("\n=== Secret Objectives ===");
  for (const p of game.players) {
    for (const so of p.secretObjectives) {
      if (secretObjectiveMet(game, so, p)) {
        log(`  ${p.name} completes [${so.Alignment}] ${so.Name}`);
      }
    }
  }
}
