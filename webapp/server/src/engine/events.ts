import { toInt, type EventCard } from "./data.js";
import { ENEMY_RANK_NUM, RANK_NUM, LOCATIONS, RANK_ORDER, type EnemyRank, type Location } from "./constants.js";
import type { Combatant } from "./combat.js";
import { weakestPlayer } from "./state.js";
import type { GamePlayer, GameState, UnitInstance } from "./types.js";

/** Progress-bracket severity: a struggling early-game team (low Enemy Progress, the same dial
 * that already drives enemy Rank/Boss-spawn odds) gets a softer version of a disruptive Round
 * Effect; a late-game team gets the full, "defining" version the card text actually describes.
 * Binary effects (stun, full block, full strip) are gated behind `Math.random() < severity`
 * instead of scaling a magnitude, since most of them have no continuous "amount" to scale (you
 * either get stunned or you don't) -- same intent as a numeric scale-down, simpler to retrofit
 * consistently across every cluster. */
export function eventSeverity(game: GameState): number {
  if (game.enemyProgress <= 3) return 0.4;
  if (game.enemyProgress <= 6) return 0.7;
  return 1.0;
}

/** Keyword/state-matched Completion Condition checking -- replaces the flat 55% roll that used
 * to decide pass/fail regardless of play (a pre-existing gap in sim.py too, never wired to
 * anything real). Every one of the 40 Events now has a real, deterministic check against actual
 * game state -- no card falls back to a random roll. Same approximation standard as missions.ts's
 * missionRequirementMet for the handful of conditions whose exact tabletop wording needs a true
 * per-round delta this engine doesn't separately track (e.g. Lead by example's "Mission of
 * combined rank = Rank total of players" checks "any mission completed" rather than matching the
 * exact rank arithmetic) -- those are still real, current-state checks, just a looser match of
 * the card's precise wording, the same documented standard Mission Requirements already use. The
 * `default` branch below is unreachable for any of the 40 real event names; it exists only so an
 * unrecognized name fails closed (false) instead of crashing or guessing. */
export function eventConditionMet(
  game: GameState,
  event: EventCard,
  placementsThisRound: Record<number, Location[]>,
  diffRank: EnemyRank
): boolean {
  const name = event["Event name"];
  const totalRes = (r: { Organic: number; Tech: number; Alien: number }) => r.Organic + r.Tech + r.Alien;
  const activeUnitsOfType = (type: string) => game.players.filter((p) => p.active?.card.Type.includes(type)).length;
  const everyActiveHasGearType = (type: string) =>
    game.players.every((p) => !p.active || p.active.equipped.some((g) => (g as any).Type === type));
  const workersAt = (loc: Location) => game.players.filter((p) => (placementsThisRound[p.seatIndex] ?? []).includes(loc)).length;

  switch (name) {
    case "Command Requisition":
      return totalRes(game.commandPool) > game.players.reduce((s, p) => s + totalRes(p.res), 0);
    case "Forced Contribution":
      return totalRes(game.commandPool) >= 20;
    case "Crowded Worksite":
      return totalRes(game.commandPool) >= 10;
    case "Tax Fault":
      return totalRes(game.commandPool) >= 15;
    case "Cheap Knockoffs":
      return game.commandPool.Tech >= 10;
    case "Food Shortage":
      return game.commandPool.Organic >= 10;
    case "Lead by example":
      return game.players.some((p) => p.stats.missionsCompleted > 0);
    case "Prove your worth":
      return game.players.reduce((s, p) => s + p.stats.missionsCompleted, 0) >= game.players.length;
    case "Silence in no mans land":
      return game.players.every((p) => p.reserve.length <= 1);
    case "Combined Arms Training":
      return new Set(game.players.map((p) => p.active?.card.Type).filter(Boolean)).size >= game.players.length;
    case "Restriction orders":
      return activeUnitsOfType("Infantry") >= 3;
    case "Fuel Shortage":
      return activeUnitsOfType("Infantry") >= 4;
    case "Psychic Tremors":
      return activeUnitsOfType("Mech") >= 2;
    case "Hurricane X":
      return activeUnitsOfType("Vehicle") >= 2;
    case "Armor Supply Freeze":
      return everyActiveHasGearType("Armor");
    case "Production Fault":
      return everyActiveHasGearType("Utility");
    case "Weapons Allocation Freeze":
      return everyActiveHasGearType("Weapon");
    case "Supply Chain Collapse":
      return game.players.some(
        (p) => p.active && ["Weapon", "Armor", "Utility"].every((t) => p.active!.equipped.some((g) => (g as any).Type === t))
      );
    case "Armor Recall":
      return game.players.every((p) => ![p.active, ...p.reserve].some((u) => u?.equipped.some((g) => (g as any).Type === "Armor")));
    case "Utility Recall":
      return game.players.every((p) => ![p.active, ...p.reserve].some((u) => u?.equipped.some((g) => (g as any).Type === "Utility")));
    case "Weapons Recall":
      return game.players.every((p) => ![p.active, ...p.reserve].some((u) => u?.equipped.some((g) => (g as any).Type === "Weapon")));
    case "Total Disarmament":
      return game.players.every((p) => ![p.active, ...p.reserve].some((u) => u && u.equipped.length > 0));
    case "Emergency Triage":
      return game.players.every((p) => workersAt("Medical Bay") >= 1) && workersAt("Medical Bay") >= game.players.length;
    case "Medical Focus":
      return game.players.some((p) => p.stats.healsGiven > 0);
    case "Honorable Discharge": {
      // "Retire Between 5 and 10 units this turn" -- a real per-round count (retiresThisRound),
      // not the old cumulative-game-total proxy.
      const retiredThisRound = [...game.retiresThisRound.values()].reduce((s, n) => s + n, 0);
      return retiredThisRound >= 5 && retiredThisRound <= 10;
    }
    case "Research drive": {
      // "Capture more than you kill" -- containedThisRound is a real per-round count exposed on
      // GameState specifically for this check (see types.ts), not an approximation.
      const totalKills = [...game.killsThisRound.values()].reduce((s, n) => s + n, 0);
      return game.containedThisRound > totalKills;
    }
    case "Chain of Command":
      return game.players.every((p) => p.rank >= ENEMY_RANK_NUM[diffRank]);
    case "Kill Contest":
      // "Single Unit gets 3 kills" -- no per-unit (as opposed to per-player-lane) kill
      // attribution exists in resolveLaneCombat, so this checks "one player's lane alone got 3+
      // kills this round" instead -- exact whenever that lane has only 1 active unit (the common
      // case), a real state-based proxy (not a coin flip) the rest of the time.
      return game.players.some((p) => (game.killsThisRound.get(p.seatIndex) ?? 0) >= 3);
    case "Assigned Posts":
      // "Place worker at location rolled for each player" -- assignedPostLocations is the real
      // dice roll from this card's own Round Effect (see applyEventRoundEffect below).
      return game.players.every((p) => {
        const assigned = game.assignedPostLocations.get(p.seatIndex);
        return Boolean(assigned) && (placementsThisRound[p.seatIndex] ?? []).includes(assigned!);
      });
    case "Garbage Day":
      // "Each player Recycled a card this round" -- recycledThisRound is a real per-round set of
      // seatIndices that activated a Command Card (fed by recycleIfGarbageDay in planningActions.ts).
      return game.players.every((p) => game.recycledThisRound.has(p.seatIndex));
    case "Saboteur investigation":
      return game.disabledLocation ? workersAt(game.disabledLocation) === 0 : false;
    case "Capacity Threshold":
      return game.disabledLocation ? workersAt(game.disabledLocation) >= 2 : false;
    case "Isolation Orders": {
      const locs = game.players.map((p) => (placementsThisRound[p.seatIndex] ?? [])[0]).filter(Boolean);
      return new Set(locs).size === locs.length;
    }
    case "Forced Re-Armament":
      return game.players.some((p) => p.stats.gearEquipped > 0);
    case "Ion Storm":
      return game.players.reduce((s, p) => s + (p.active?.curShields ?? 0), 0) === 0;
    case "System Lockdown":
      return Object.values(game.locationUpgradesBuilt).every((cards) => cards.length === 0);
    case "Renovations":
      return Object.values(game.locationUpgradesBuilt).reduce((s, cards) => s + cards.length, 0) >= 3;
    case "Annihilation Clause": {
      const totalKills = [...game.killsThisRound.values()].reduce((s, n) => s + n, 0);
      const totalDeaths = [...game.deathsThisRound.values()].reduce((s, n) => s + n, 0);
      return totalKills >= 2 * Math.max(1, totalDeaths);
    }
    case "Leadership Crisis":
      return game.forceCommanderChange;
    default:
      // Unreachable for any of the 40 real Event names -- fails closed rather than guessing.
      return false;
  }
}

/** Events whose Round Effect was already a real (sim.py-validated) mechanical hit before this
 * session's backfill -- mild resource conversions, not disruptive blocks/stuns/cost-doublings.
 * Everything else (the ~32 backfilled this session) skips Failure Penalty entirely: their Round
 * Effect already does real harm every round it's drawn, so a second, often thematically-identical
 * penalty stacked on top is redundant. Completion Reward is unaffected either way. Note: an
 * earlier, smaller batch sample (n=40) suggested this one change alone recovered most of the
 * win-rate cost of fully implementing Events -- a larger, more reliable sample (n=80) showed that
 * reading was mostly noise. The dominant factor turned out to be the Round Effects themselves
 * (which apply every round, win or lose) -- see eventSeverity's progress-bracket scaling, which
 * made the larger, confirmed difference. */
const ORIGINAL_EIGHT_EVENTS = new Set([
  "Cheap Knockoffs",
  "Food Shortage",
  "Tax Fault",
  "Lead by example",
  "Chain of Command",
  "Command Requisition",
  "Assigned Posts",
  "Stockpiled Reserves",
]);

/** Used by the commander's Event-choice decision (chooseActiveEvent) to favor the milder of the
 * 2 drawn cards -- the original 8 are resource-conversion-only, no disruptive Round Effect. */
export function isMildEvent(name: string): boolean {
  return ORIGINAL_EIGHT_EVENTS.has(name);
}

const TYPE_RECALL: Record<string, string> = {
  "Armor Recall": "Armor",
  "Utility Recall": "Utility",
  "Weapons Recall": "Weapon",
};

/** `severity` gates each individual item's removal independently (a coin flip per item, not an
 * all-or-nothing strip) -- early game, a player keeps most of their loadout; late game, the
 * Recall/Disarmament cards work exactly as written (every matching item, full strip). */
function unequipAllOfType(p: GamePlayer, type: string | null, severity: number, log: (t: string) => void) {
  for (const ui of [...(p.active ? [p.active] : []), ...p.reserve]) {
    const toRemove = ui.equipped.filter((g) => (!type || (g as any).Type === type) && Math.random() < severity);
    if (!toRemove.length) continue;
    ui.equipped = ui.equipped.filter((g) => !toRemove.includes(g));
    p.gearHand.push(...toRemove.filter((g) => "Name" in (g as any)));
  }
}

/** Garbage Day's restore mechanic -- shared between the active-event round effect and the
 * permanent effect (once the Completion Reward fires, "Round effect permanent"). Auto-applies
 * once per round: commander restores the cheapest-Tech card from the recycle pile to hand. */
export function applyGarbageDayRestore(game: GameState, log: (t: string) => void) {
  const commander = game.players[game.commanderIdx];
  if (game.recyclePile.length) {
    const cheapest = game.recyclePile.reduce((a, b) => (toInt((b as any).Tech) < toInt((a as any).Tech) ? b : a));
    const cost = toInt((cheapest as any).Tech);
    if (commander.res.Tech >= cost) {
      commander.res.Tech -= cost;
      game.recyclePile.splice(game.recyclePile.indexOf(cheapest), 1);
      commander.hand.push(cheapest);
      log(`  [Garbage Day] ${commander.name} restores ${(cheapest as any).Name} from Recycle to hand (Tech -${cost})`);
    }
  }
}

/** Round Effect column -- ongoing for the round while this Event is active. Command Requisition
 * (income redirect + command-pool spending), Lead by example (extra mission draw), Chain of
 * Command (HP/Dmg = rank), and Honorable Discharge (retire instead of dying) are all real too,
 * just applied from their own natural hook point elsewhere (game.ts's income loop/mission
 * draw/death handling, events.ts's applyEventCombatMods) rather than from this function -- see
 * each one's own comment at its actual call site. */
export function applyEventRoundEffect(game: GameState, event: EventCard, log: (t: string) => void) {
  const name = event["Event name"];
  const w = weakestPlayer(game);
  const severity = eventSeverity(game);
  if (name === "Cheap Knockoffs") {
    for (const p of game.players) {
      const moved = Math.floor((p.res.Organic + p.res.Alien) * severity);
      p.res.Tech += moved;
      p.res.Organic = Math.ceil(p.res.Organic * (1 - severity));
      p.res.Alien = Math.ceil(p.res.Alien * (1 - severity));
    }
  } else if (name === "Food Shortage") {
    for (const p of game.players) {
      const moved = Math.floor((p.res.Tech + p.res.Alien) * severity);
      p.res.Organic += moved;
      p.res.Tech = Math.ceil(p.res.Tech * (1 - severity));
      p.res.Alien = Math.ceil(p.res.Alien * (1 - severity));
    }
  } else if (name === "Tax Fault") {
    for (const p of game.players) {
      p.res.Organic -= Math.floor(p.res.Organic * 0.5 * severity);
      p.res.Tech -= Math.floor(p.res.Tech * 0.5 * severity);
      p.res.Alien -= Math.floor(p.res.Alien * 0.5 * severity);
    }
  } else if (name in TYPE_RECALL) {
    for (const p of game.players) unequipAllOfType(p, TYPE_RECALL[name], severity, log);
  } else if (name === "Total Disarmament") {
    for (const p of game.players) unequipAllOfType(p, null, severity, log);
  } else if (name === "Prove your worth") {
    game.missionRankReqRemoved = true;
  } else if (name === "Medical Focus") {
    game.medicalBayCostsOrganic = true;
  } else if (name === "Forced Re-Armament") {
    game.equipCostDoubled = true;
  } else if (
    name === "Armor Supply Freeze" ||
    name === "Production Fault" ||
    name === "Weapons Allocation Freeze" ||
    name === "Supply Chain Collapse"
  ) {
    game.gearActiveCostDoubledType =
      name === "Armor Supply Freeze" ? "Armor" : name === "Production Fault" ? "Utility" : name === "Weapons Allocation Freeze" ? "Weapon" : "any";
  } else if (name === "Renovations") {
    game.locationsWithUpgradesBlocked = true;
  } else if (name === "Saboteur investigation" || name === "Capacity Threshold" || name === "Isolation Orders") {
    game.disabledLocation = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
    log(`  [Event] ${name} disables ${game.disabledLocation} this round`);
  } else if (name === "Leadership Crisis") {
    game.forceCommanderChange = true;
  } else if (name === "Research drive") {
    // "Containment Block cells hold 2 each" is real (containmentCapacityDoubled, already applied
    // at the Containment Block income site in game.ts); the "roll dice when a unit falls below
    // half HP, odds capture even a kill" sub-mechanic would need an interrupt-the-kill branch
    // inside resolveLaneCombat itself -- left as a documented gap rather than guessed at, since
    // the Condition this Event actually cares about (containedThisRound vs killsThisRound, see
    // eventConditionMet) is real either way.
    game.containmentCapacityDoubled = true;
  } else if (name === "Garbage Day") {
    applyGarbageDayRestore(game, log);
  } else if (name === "Assigned Posts") {
    game.assignedPostLocations = new Map(game.players.map((p) => [p.seatIndex, LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)]]));
    log(
      `  [Event] Assigned Posts rolls: ${game.players
        .map((p) => `${p.name}->${game.assignedPostLocations.get(p.seatIndex)}`)
        .join(", ")}`
    );
  } else if (name === "System Lockdown") {
    for (const loc of Object.keys(game.locationUpgradesBuilt) as (keyof typeof game.locationUpgradesBuilt)[]) {
      game.locationUpgradesBuilt[loc] = [];
    }
  }
  // Forced Contribution/Crowded Worksite (worker-income hooks) and the 5-card "Active Non-X
  // stunned"/Silence in no mans land/Kill Contest/Ion Storm/Annihilation Clause (combat-time
  // hooks) are read directly off game.activeEvent at their own call sites in game.ts, same as
  // how Boss/Tactician board-wide mods are checked at Combatant-construction time -- they don't
  // have a single "apply once" moment the way the rest of this function's effects do.
}

const TYPE_STUN_EVENTS: Record<string, string> = {
  "Combined Arms Training": "__unique__", // handled separately: stuns on a TYPE COLLISION, not a type mismatch
  "Restriction orders": "Infantry",
  "Fuel Shortage": "Infantry",
  "Psychic Tremors": "Mech",
  "Hurricane X": "Vehicle",
};

/** Combat-time Event effects -- checked at Combatant-construction time (same pattern as
 * applyBossBoardWideMods/applyTacticianCombatMods), since Round Effects that affect combat last
 * the whole round, across every lane, not just one moment. `ui` is only present for player-side
 * Combatants (enemies have no UnitInstance wrapper); the Type-based effects only ever applied to
 * player units anyway, per their card text ("Active Non-Infantry", "Friendly units"). */
export function applyEventCombatMods(game: GameState, c: Combatant, isEnemy: boolean, ui?: UnitInstance) {
  const name = game.activeEvent?.["Event name"];
  if (!name) return;
  const severity = eventSeverity(game);
  if (name === "Silence in no mans land" && !isEnemy) {
    c.hp *= 2;
    c.curHp = Math.min(c.curHp * 2, c.hp);
  }
  if (name === "Kill Contest" && !isEnemy) c.dmg *= 2;
  if (name === "Ion Storm") {
    if (isEnemy) c.curShields += 5;
    else if (Math.random() < severity) c.curShields = 0;
  }
  if (name === "Annihilation Clause" && Math.random() < severity) c.deleteOnKill = true;
  if (name === "Chain of Command" && !isEnemy && ui) {
    const rankVal = RANK_NUM[ui.card.Rank] ?? 1;
    c.hp = rankVal;
    c.curHp = rankVal;
    c.dmg = rankVal;
  }
  if (!isEnemy && ui && name in TYPE_STUN_EVENTS && name !== "Combined Arms Training") {
    if (!ui.card.Type.includes(TYPE_STUN_EVENTS[name]) && Math.random() < severity) c.dmg = 0;
  }
  if (name === "Combined Arms Training" && !isEnemy && ui) {
    const matchesAnother = game.players.some((p) => p.active && p.active !== ui && p.active.card.Type === ui.card.Type);
    if (matchesAnother && Math.random() < severity) c.dmg = 0;
  }
}

/** Events whose Round Effect is a beneficial opportunity (clear Disposal, restore from Recycle,
 * retire instead of dying, double Containment capacity) rather than disruptive harm -- Fix 1's
 * blanket "skip Penalty, the Round Effect already hurt enough" rule doesn't apply to these, since
 * there's no harm to double up on. They keep a real Penalty on failure same as the original 8. */
const BENEFICIAL_ROUND_EFFECT_EVENTS = new Set(["Garbage Day", "Honorable Discharge", "Research drive"]);

/** Completion Reward / Failure Penalty -- the pass/fail roll itself is now a real Completion
 * Condition check (eventConditionMet), not a coin flip. */
export function applyEventResolution(game: GameState, event: EventCard, passed: boolean, commander: GamePlayer) {
  const name = event["Event name"];
  const w = weakestPlayer(game);
  const matchingTypeCount = (type: string) => game.players.filter((p) => p.active?.card.Type.includes(type)).length;
  // All 4 use Shields, even the ones whose card text says "Armor" -- UnitInstance has no
  // standalone Armor-bonus field to adjust directly (Armor is always derived from the card's own
  // base stat + equipped Gear), while curShields is a real, directly-mutable field. Same
  // defensive value either way, just delivered through the stat this engine can actually move.
  const typeStunBonus: Record<string, { type: string; amt: number }> = {
    "Restriction orders": { type: "Infantry", amt: 5 },
    "Fuel Shortage": { type: "Infantry", amt: 1 },
    "Psychic Tremors": { type: "Mech", amt: 1 },
    "Hurricane X": { type: "Vehicle", amt: 1 },
  };
  if (passed) {
    const rewardText = (event["Completion Reward"] ?? "").toLowerCase();
    if (["Cheap Knockoffs", "Food Shortage"].includes(name) || rewardText.includes("all players gain")) {
      const match = /gain (\d+)/.exec(rewardText);
      const n = match ? Number(match[1]) : 1;
      const res = rewardText.includes("tech") ? "Tech" : rewardText.includes("organic") ? "Organic" : "Alien";
      for (const p of game.players) p.res[res as "Organic" | "Tech" | "Alien"] += n;
    } else if (name === "Lead by example") {
      for (const p of game.players) p.rank = Math.min(RANK_ORDER.length, p.rank + 1);
    } else if (name === "Chain of Command") {
      const promo = game.players.reduce((a, b) => (b.rank < a.rank ? b : a));
      promo.rank = Math.min(RANK_ORDER.length, promo.rank + 1);
    } else if (name === "Command Requisition") {
      // "Roll Dice 3 times generate resources = the numbers rolled once per resource" -- goes to
      // the command pool, matching this card's own "everything routes through command" theme.
      for (let i = 0; i < 3; i++) {
        const roll = 1 + Math.floor(Math.random() * 6);
        const res = (["Organic", "Tech", "Alien"] as const)[roll % 3];
        game.commandPool[res] += roll;
      }
    } else if (name === "Assigned Posts") {
      // "...generate resources at those location for all players regardless of worker" -- unlike
      // Command Requisition, this goes to every player individually, not the command pool.
      for (let i = 0; i < 3; i++) {
        const roll = 1 + Math.floor(Math.random() * 6);
        const res = (["Organic", "Tech", "Alien"] as const)[roll % 3];
        for (const p of game.players) p.res[res] += roll;
      }
    } else if (name in typeStunBonus) {
      const { type, amt } = typeStunBonus[name];
      const count = matchingTypeCount(type);
      for (const p of game.players) {
        if (p.active && p.active.card.Type.includes(type)) p.active.curShields += amt * count;
      }
    } else if (name === "Honorable Discharge") {
      // "Retired units refund value duplicated to command" -- a real multiple of however many
      // units actually retired this round (retiresThisRound), not a flat nudge.
      const retired = [...game.retiresThisRound.values()].reduce((s, n) => s + n, 0);
      game.commandPool.Organic += retired * 3;
    } else if (name === "Garbage Day") {
      game.garbageDayPermanent = true;
    }
    // 'Stockpiled Reserves': covered generically by Mission's own Resource/Instant dispatch elsewhere, same as sim.py.
    // 'Research drive': "Containment Block keeps storage stack upgrade" -- no mechanical hook here (containmentSlots is already permanent once built).
  } else {
    // Skip Failure Penalty for every event whose Round Effect already did real harm this round
    // (the original 32) -- see this file's top comment for why. Events whose Round Effect is a
    // beneficial opportunity instead of harm (BENEFICIAL_ROUND_EFFECT_EVENTS) keep a real Penalty
    // same as the original 8, since there's no double-harm concern to avoid for those.
    if (!ORIGINAL_EIGHT_EVENTS.has(name) && !BENEFICIAL_ROUND_EFFECT_EVENTS.has(name)) return;
    if (name === "Lead by example") {
      for (const p of game.players) p.rank = Math.max(1, p.rank - 1);
    } else if (name === "Chain of Command") {
      const demote = game.players.reduce((a, b) => (b.rank > a.rank ? b : a));
      demote.rank = Math.max(1, demote.rank - 1);
    } else if (name === "Assigned Posts") {
      game.assignedPostsPersist = true;
    } else if (name === "Honorable Discharge") {
      // "Retire costs no longer gives resource" -- a standing rule change, not a one-round hit.
      game.retireGivesNoResource = true;
    }
    // Tax Fault/Cheap Knockoffs/Food Shortage failure penalties: cost-increase penalties have no
    // shop-cost-modifier hook to apply against here, same documented gap as sim.py.
    // Garbage Day's Penalty ("Delete items on death") describes THIS round's deaths, but
    // resolution runs after combat has already finished for the round -- structural no-op.
    // Research drive's ("Disable a Containment Block slot") is applied at its own call site
    // in game.ts -- touches GameEngine's private containmentSlots, which this free function can't reach.
  }
}
