import type {
  BossCard,
  CommandCard,
  EnemyCard,
  EventCard,
  GearCard,
  MissionCard,
  SecretObjectiveCard,
  TacticianCard,
  UnitCard,
} from "./data.js";
import type { Difficulty, EnemyRank, Location } from "./constants.js";

export interface ResourcePool {
  Organic: number;
  Tech: number;
  Alien: number;
}

export interface UnitInstance {
  id: string;
  card: UnitCard;
  maxHp: number;
  curHp: number;
  curShields: number;
  equipped: GearCard[];
  /** Per-unit ability counters (e.g. consecutive_hits for "bonus damage on consecutive hits"
   * abilities) -- mirrors Working/sim.py's UnitInstance.charges Counter. */
  charges: Record<string, number>;
}

export interface GamePlayer {
  seatIndex: number;
  name: string;
  isBot: boolean;
  rank: number; // 1-8, index into RANK_ORDER (1-based)
  res: ResourcePool;
  active: UnitInstance | null;
  reserve: UnitInstance[];
  /** Units removed from reserve during "Silence in no mans land" so bots can meet the ≤1
   * reserve condition without permanently losing the units. Restored to reserve at round start. */
  benchedUnits: UnitInstance[];
  /** Units sent to Medical Bay instead of dying. Each worker placed at Medical Bay retrieves one
   * unit from this pool, heals it to full, and returns it to reserve. Persists across rounds. */
  medBayUnits: UnitInstance[];
  laneEnemyReserve: EnemyCard[];
  hand: CommandCard[];
  gearHand: GearCard[];
  graveyard: UnitInstance[];
  overrunLastRound: boolean;
  /** Which physical lane (by lane-owner seatIndex) this player controls this round. Default: own
   * seatIndex (identity). Commander may reassign at round start; resets to identity each round.
   * Units/gear stay in their physical lane; resources/workers/hand stay with the player; combat
   * stats (kills, overruns) are credited to the controller of each lane. */
  controlledLaneSeat: number;
  missions: MissionCard[];
  secretObjectives: SecretObjectiveCard[];
  tactician: TacticianCard | null;
  hasReconSatellite: boolean;
  hasLastStandBeacon: boolean;
  /** Vote of No Confidence: set when one of this player's own Secret Objective cards has been
   * publicly revealed (read-only knowledge for everyone else) -- the card itself is unaffected,
   * still theirs, still counts toward their win condition. Not the same as losing a card. */
  revealedSecretObjective: string | null;
  stats: {
    kills: number;
    deaths: number;
    overrunsSuffered: number;
    promotionsReceived: number;
    donationsMade: ResourcePool;
    healsGiven: number;
    gearEquipped: number;
    gearEquippedToAllies: number;
    gearDiscarded: number;
    misdirectorOtherOverruns: number;
    misdirectorLaneClean: boolean;
    commanderStolenFromHigher: number;
    conductorCommandFromLower: number;
    progressAsCommander: number;
    missionsCompleted: number;
    eventsPassed: number;
    eventsFailed: number;
    commanderRounds: number;
    unitsRetired: number;
    /** Hunter SO: how many enemies with a non-empty Reveal or Passive ability this player has killed. */
    abilityEnemyKills: number;
    /** Survivor SO: the highest consecutive-round survival count achieved by any single active unit
     * this player has ever controlled. Incremented after each round the same unit is still active. */
    longestActiveSurvival: number;
    /** Leroy SO: number of rounds this player entered with exactly 1 unit in lane (active, no reserve). */
    roundsWithSingleUnit: number;
    secretObjectiveComplete: string | null;
    accusationsMade: number;
    accusationsCorrect: number;
    timesAccused: number;
  };
}

export interface GameSettings {
  difficulty: Difficulty;
}

export interface GameLogEntry {
  round: number;
  text: string;
}

export type GameStatus = "running" | "won" | "lost";

export interface BossActive {
  card: BossCard;
  hpCur: number;
  tierReached: number;
  dmgBonus: number;
  shieldBonus: number; // tracked for fidelity with sim.py -- never actually consumed in combat there either
  armorBonus: number;
  healsOnKill: number;
}

export interface GameState {
  players: GamePlayer[];
  commanderIdx: number;
  roundNum: number;
  playerProgress: number;
  enemyProgress: number;
  overrunTracker: number;
  overrunTrackerMax: number;
  overrunTrackerMin: number;
  overrunDropsBySeat: Map<number, number>;
  settings: GameSettings;
  commandPool: ResourcePool;
  shopUnits: UnitCard[];
  shopGear: GearCard[];
  unitDeck: UnitCard[];
  /** Mech and Vehicle units start locked -- added to unitDeck when Mech Station / Vehicle Bay is built. */
  mechDeckLocked: UnitCard[];
  vehicleDeckLocked: UnitCard[];
  mechUnlocked: boolean;
  vehicleUnlocked: boolean;
  /** Unit shop slot cap -- starts at 3, raised to 4 when Additional Bedding is built. */
  unitShopCap: number;
  /** Per-round Tech cost discount on Mech/Vehicle unit purchases. Set by Advanced Mechanized
   * passive (permanent while built) and active (this-round bonus). Reset to passive-only value
   * at round start. */
  mechTechDiscount: number;
  vehicleTechDiscount: number;
  /** AI advancements active: unit Organic costs = 0 this round. */
  unitOrganicFree: boolean;
  /** AI advancements passive: unit Organic costs can be covered by Tech or Alien. */
  unitOrganicCanUseTechOrAlien: boolean;
  /** Gene Modding passive/active: Tech costs on purchases can be covered by Organic. */
  techCanUseOrganic: boolean;
  /** Flash Sale: cost multiplier applied to all shop purchases this round (default 1).
   * 0.5 = half price (rounded up); 2 = double price. */
  shopCostMultiplier: number;
  /** Flash Sale penalty: becomes shopCostMultiplier at start of the following round. */
  shopCostMultiplierNextRound: number;
  /** Experimental gear starts locked -- added to gearDeck when Experimental Science is built. */
  experimentalGearDeckLocked: GearCard[];
  experimentalGearUnlocked: boolean;
  /** Mad Science passive: Experimental gear Organic and Tech costs = 0 (only Alien cost applies). */
  experimentalOrganicTechFree: boolean;
  /** Mad Science active: all gear Alien costs halved this round. */
  gearAlienHalfThisRound: boolean;
  /** Ethics Committee passive: non-Experimental gear Alien costs = 0 while built. */
  basicGearAlienFree: boolean;
  /** Ethics Committee active: all purchase Alien costs = 0 this round. */
  allAlienFreeThisRound: boolean;
  gearDeck: GearCard[];
  commandDeck: CommandCard[];
  missionDeck: MissionCard[];
  eventDeck: EventCard[];
  secretObjectiveDeck: SecretObjectiveCard[];
  tacticianDeck: TacticianCard[];
  bossDeck: BossCard[];
  bossActive: BossActive | null;
  bossDiedLastRound: boolean;
  locationUpgradesBuilt: Record<Location, CommandCard[]>;
  teamScoutPool: UnitInstance[];
  status: GameStatus;
  log: GameLogEntry[];
  effectUses: Map<string, number>;
  /** Reanimator's "return the last killed enemy to combat under your control" -- the most
   * recent enemy card killed in normal lane combat (Boss kills and contained enemies don't set
   * this, only the everyday per-lane Combat Cycle). Consumed (set back to null) once revived. */
  lastKilledEnemy: EnemyCard | null;
  /** Night Vision's "Roll D6, Reveal that many enemies" -- added to the round's base scout
   * reveal count, reset to 0 each round. */
  nightVisionRevealBonus?: number;
  /** The round's drawn Event, if any -- stored on GameState (not just a runRound-local variable)
   * so combat-time Event Round Effects (e.g. "Active Non-Infantry are stunned") can be checked
   * from the Combatant-construction code in runDeploymentAndCombat. */
  activeEvent: EventCard | null;
  /** Per-round Event flags, all reset to their default (false/null) at the start of each round's
   * Event draw -- see runRound. Each backs one Event's Round Effect that needs to be checked from
   * a different part of the round loop than events.ts itself (worker income, gear equip cost,
   * Medical Bay, worker placement eligibility, Containment capacity, commander handoff). */
  medicalBayCostsOrganic: boolean;
  gearActiveCostDoubledType: string | null;
  locationsWithUpgradesBlocked: boolean;
  disabledLocation: Location | null;
  forceCommanderChange: boolean;
  containmentCapacityDoubled: boolean;
  /** Per-round kill/death counts by seatIndex, reset at the start of each round -- distinct from
   * stats.kills/stats.deaths, which accumulate for the whole game. Used by Event Completion
   * Conditions that reference "this round" specifically (Kill Contest, Annihilation Clause). */
  killsThisRound: Map<number, number>;
  deathsThisRound: Map<number, number>;
  /** Per-round retired-unit counts by seatIndex -- fed by both the normal end-of-round obsolete-
   * reserve retirement (runRetireFromDuty) and Honorable Discharge's "units retire on death
   * instead of dying" Round Effect. Used by Honorable Discharge's own Completion Condition. */
  retiresThisRound: Map<number, number>;
  /** Sum of RANK_NUM values of all missions completed this round. Used by Lead by example's exact
   * Completion Condition ("combined rank of completed missions = rank total of players"). Reset
   * each round. */
  missionRankCompletedThisRound: number;
  /** Garbage Day's "Recycle" pile -- Command Cards pushed here when activated (while this Event
   * is active or garbageDayPermanent is set), so "restore from recycle to hand" has something
   * real to draw from. */
  recyclePile: CommandCard[];
  /** Per-round set of seatIndices that activated a Command Card this round (feeding recyclePile).
   * Used by Garbage Day's Completion Condition ("each player Recycled a card this round"). */
  recycledThisRound: Set<number>;
  /** Set when Garbage Day's Completion Reward fires ("Round effect permanent") -- keeps the
   * restore-from-recycle mechanic active every round even after the event card has expired. */
  garbageDayPermanent: boolean;
  /** Forced Contribution reward/penalty accumulator: each point adds +1 Organic income per
   * additional co-located worker (reward stacks positive, penalty stacks negative). Starts at 0,
   * never resets -- reward/penalty are standing rule changes, same as retireGivesNoResource. */
  locationSharingBonus: number;
  /** Per-resource tally of resources players discarded to supply this round (Tax Fault, Cheap
   * Knockoffs, Food Shortage, Forced Contribution completion conditions). Reset each round. */
  returnedToSupplyThisRound: ResourcePool;
  /** Tax Fault Completion Reward: permanent +N Alien granted to every player each round, after
   * income. Stacks if reward fires multiple times. */
  locationAlienBonus: number;
  /** Persistent flat surcharge added to each resource's cost for all shop purchases (units and
   * gear). Cheap Knockoffs penalty → .Tech += 2, Food Shortage → .Organic += 2,
   * Tax Fault → .Alien += 2. Stacks each time a penalty fires. */
  shopCostBonus: ResourcePool;
  /** Assigned Posts' "Roll Dice to select locations" -- one location rolled per seatIndex when
   * the Event becomes active. Normally cleared at the next round's Event-flag reset like every
   * other per-round Event flag; assignedPostsPersist (set by this card's own Failure Penalty,
   * "Effect persists after event") skips that one clear so the assignment carries into the next
   * round instead. */
  assignedPostLocations: Map<number, Location>;
  assignedPostsPersist: boolean;
  /** Honorable Discharge's Failure Penalty ("Retire costs no longer gives resource") -- a
   * standing rule change once triggered (the card text says "no longer," not "this round"), so
   * unlike the other per-round Event flags this one is never reset. */
  retireGivesNoResource: boolean;
  /** Research drive's Completion Condition ("Capture more than you kill") -- the private
   * containedEnemies count lives on GameEngine, not GameState, so events.ts (a free function)
   * had no way to see it and fell back to an approximation. Exposed here as a real per-round
   * count instead. */
  containedThisRound: number;
  /** Per-round total ability activations by seatIndex (gear actives, Tactician actives, command
   * card activations). Reset each round. Used by "Activate an ability" mission requirements. */
  activationsThisRound: Map<number, number>;
  /** Per-ability-instance use count this round, keyed by "${unitId}-${abilityName}". Enforces
   * the default once-per-turn limit for gear and Tactician actives. Reset each round. */
  abilityUsesThisRound: Map<string, number>;
  /** Persistent overrides to the default once-per-turn limit, keyed by
   * "${unitId}-${abilityName}" (instance-specific) or just "${abilityName}" (name-wide).
   * Set by mission rewards or card text that grants extra uses; never reset per round. */
  abilityLimitOverrides: Map<string, number>;
  /** The Breaker Tactician's Active ("Remove all Shields and Armor from active enemies in all
   * lanes") -- set when the active fires this round. Consumed at enemy Combatant construction
   * to zero curShields and apply max shredArmor across every lane. Reset each round. */
  breakerActive: boolean;
  /** The Chessmaster Tactician's Active -- cloned EnemyCard references that were swapped this
   * round. Any enemy whose reference is in this Set has its Combatant curHp halved at
   * construction (equivalent to taking double damage). Reset each round. */
  chessmasterDoubledEnemies: Set<EnemyCard>;
  /** Contained enemy pool -- moved from GameEngine's private field so Tactician actives (The
   * Jailer), Events, and future mechanics can read/modify it without extra parameters. Fed by
   * the containment logic in runDeploymentAndCombat. */
  containedEnemyPool: EnemyRank[];
  /** Per-round free-activation markers, keyed by "${unitId}-${gearName}". Set by The Engineer
   * Tactician's Active (refresh + free next use). Consumed by the gear active loop: if the key
   * is present, cost is skipped once and the entry is deleted. Reset each round. */
  freeAbilityNextUse: Set<string>;
  /** The Kingmaker Tactician's Active ("Command cannot change next turn") -- skips the normal
   * commander-handoff block at end of the round it is set, then cleared. */
  commanderLocked: boolean;
  /** Silence in no mans land Completion Reward: "Scouts reveal additional enemies" -- permanently
   * adds to every round's scout reveal count. Stacks if the reward fires multiple times. */
  permanentScoutRevealBonus: number;
  /** Silence in no mans land Failure Penalty: "No reserve ability activations" -- reserve units'
   * gear combat mods are skipped this round. Reset at the start of the next round. */
  reserveAbilitiesDisabled: boolean;
  /** Gear-freeze Event Reward ("Active effects free this round") -- the gear type whose actives
   * cost 0 Tech this round. Copied from gearActiveFreeNextRound at round start, then that field
   * is cleared. Null = no free type active. */
  gearActiveFreeType: string | null;
  /** Carry field: set post-combat by a gear-freeze Completion Reward, copied into gearActiveFreeType
   * at the next round's reset so the reward applies during the following round's combat. */
  gearActiveFreeNextRound: string | null;
  /** Carry field: set post-combat by a gear-freeze Failure Penalty, copied into
   * gearActiveCostDoubledType at the next round's reset so the penalty applies next round. */
  gearActiveCostDoubledNextRound: string | null;
  /** Recall Event Completion Reward: gear of this type in the shop is free to purchase next round.
   * "any" = all types (Total Disarmament). Copied from shopGearFreeTypeNextRound at round start. */
  shopGearFreeType: string | null;
  /** Carry field: set post-combat by a Recall Completion Reward, applied next round then cleared. */
  shopGearFreeTypeNextRound: string | null;
  /** Emergency Triage Completion Reward ("Double future Healing") -- each worker at Medical Bay
   * retrieves this many extra units per visit (stacks if reward fires multiple times). */
  healingPerWorkerBonus: number;
  /** Medical Focus Completion Reward ("Healing Generates organics") -- permanently, Med Bay
   * retrievals always generate Organic even if a future Medical Focus round effect is active. */
  medBayAlwaysGeneratesOrganic: boolean;
  /** Medical Focus Failure Penalty ("Healing costs organics with cap") -- permanently, Med Bay
   * retrievals cost 2 Organic per unit retrieved instead of granting Organic. */
  medBayCostOrganicPermanently: boolean;
  /** Kill Contest Completion Reward -- every round, the highest-rank active unit across all lanes
   * deals double damage at combat start. Permanent once set. */
  killContestHighRankDoubled: boolean;
  /** Kill Contest Failure Penalty -- every round, the highest-rank active unit across all lanes
   * deals half damage at combat start. Permanent once set. */
  killContestHighRankHalved: boolean;
  /** Leadership Crisis: seatIndex of the unanimous winner of this round's blind vote, or null if
   * the vote was split. Reset each round. Used by eventConditionMet and the commander handoff. */
  leadershipCrisisWinner: number | null;
  /** Leadership Crisis Failure Penalty: every other round the commander is forced to change.
   * Permanent once set; commanderEveryOtherRoundParity determines which rounds it fires on. */
  commanderMustChangeEveryOtherRound: boolean;
  /** Parity (0 or 1) that determines which rounds the every-other-round forced change fires.
   * Set to (roundNum + 1) % 2 when the penalty first fires. */
  commanderEveryOtherRoundParity: number;
  /** Isolation Orders Completion Reward: permanent solo income bonus — each worker alone at a
   * location grants +isolationSoloBonus of the player's lowest resource. Stacks per pass. */
  isolationSoloBonus: number;
  /** Isolation Orders Failure Penalty: permanent co-location penalty — each co-located worker
   * costs isolationSharingPenalty of that location's primary resource. Stacks per failure. */
  isolationSharingPenalty: number;
  /** Saboteur Investigation Completion Reward: bonus upgrades drawn from the deck and placed at
   * each location beyond the normal slot cap. Per-location count so canBuildCard can exclude
   * them from the regular-upgrade tally when checking the slot limit. */
  locationBonusUpgradesCount: Record<Location, number>;
  /** Saboteur Investigation / Capacity Threshold Failure Penalty: permanent cumulative −1 to the
   * effective upgrade slot cap at every location. Stacks each time a penalty fires. */
  locationUpgradeLimitPenalty: number;
  /** Renovations round effect: built upgrades at each location, temporarily moved aside while the
   * round runs. Restored after event resolution; excess goes to the commander's hand. Null when
   * Renovations is not the active event this round. */
  renovationSetAsideUpgrades: Record<Location, CommandCard[]> | null;
  /** Companion bonus-count snapshot taken when renovationSetAsideUpgrades is populated, so
   * restoration can correctly distinguish regular vs. bonus upgrades. */
  renovationSetAsideBonusCounts: Record<Location, number> | null;
  /** Renovations Completion Reward: players may remove any built upgrade from a location to free
   * a slot (builds at cap auto-remove the cheapest existing upgrade to make room). */
  renovationRemoveUnlock: boolean;
  /** Renovations Failure Penalty: at the end of every future round all built upgrades are
   * stripped from their locations and returned to the command deck. */
  renovationEndOfRoundStrip: boolean;
  /** Annihilation Clause Completion Reward: enemies killed by a player whose rank exceeds the
   * current enemy tier rank have deleteOnKill set — they skip containment. Permanent once set. */
  annihilationEnemiesDeletedByHigherRank: boolean;
  /** Annihilation Clause Failure Penalty: allies killed by enemies of higher tier than the player's
   * rank bypass all saves (Chronostasis, doctor, revive). Permanent once set. */
  annihilationAlliesDeletedByHigherRank: boolean;
  /** Ion Storm Completion Reward: permanently strips all shields from each enemy when its Combatant
   * is created (i.e., scouted/revealed at combat start). Permanent once set. */
  ionStormScoutedLoseShields: boolean;
  /** Ion Storm Failure Penalty: permanent cumulative bonus shields added to each enemy at combat
   * entry. Stacks +10 per failure. */
  ionStormEnemyEntryShields: number;
  /** Per-round total shield points absorbed (destroyed) across all combatants in both combat passes.
   * Used by Ion Storm's Completion Condition ("40 shields destroyed this round"). Reset each round. */
  shieldsDestroyedThisRound: number;
}
