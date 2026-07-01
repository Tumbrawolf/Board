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
  /** Set by The Chessmaster's Reassign action; cleared at round start. Grants half-damage
   * protection on the unit's first combat hit this round. */
  reassignedThisRound?: boolean;
  /** Set by Regen Plates active; cleared after combat. Suppresses all keyword-driven passive
   * combat mods (reflect, trample, shields_on_kill, etc.) for this unit this round. */
  passiveSuppressedForCombat?: boolean;
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
  /** Worker Detail instants: location names where this player's first worker placement counts as 2.
   * Set by Barracks Detail / Armory Detail / etc. mission instants. Persistent. */
  workerDoubleLocations: Set<string>;
  /** Mission instants: permanent per-round free gear-equip credit rate. Added to nextGearFreeCount
   * each round. "1 Free equip per turn" → 1, "2 Free equips per turn" → 2, etc. */
  freeEquipsPerRound: number;
  /** Free equip credits available this round (one-shot mission grants + per-round reloads from
   * freeEquipsPerRound). Decremented on each free equip use. Reset to freeEquipsPerRound each round. */
  nextGearFreeCount: number;
  /** One-shot free unit credits. "Your next unit is free" → 1, "next 2 units are free" → 2. */
  nextUnitFreeCount: number;
  /** Highest rank that the next free-unit credit covers. 0 = none. "Your next Rank 3 unit is free"
   * sets this to 3; consumed on the next unit purchase of that rank or lower. */
  nextRankFreeUnit: number;
  /** Sacrifice discount from Conscript/Recruit family: applied to next unit purchase. */
  nextRecruitmentDiscount: { Organic: number; Tech: number; Alien: number } | null;
  /** Permanent half-price discount on Mech units. Set by Steel Supremacy instant. */
  mechHalfPrice: boolean;
  /** Permanent half-price discount on Vehicle units. Set by Armored Column instant. */
  vehicleHalfPrice: boolean;
  /** Rank 1 units are always free for this player. Set by Conscription instant. */
  rankOneFree: boolean;
  /** Shield Projector passive: lane-wide shared shield pool (HP) that absorbs incoming enemy damage
   * before it reaches individual unit combatants. Replenished to 60 each round by precombat gear.
   * Tracks live value during combat so the pool can be depleted across multiple exchanges. */
  sharedShieldPool: number;
  /** Vote of No Confidence: set when one of this player's own Secret Objective cards has been
   * publicly revealed (read-only knowledge for everyone else) -- the card itself is unaffected,
   * still theirs, still counts toward their win condition. Not the same as losing a card. */
  revealedSecretObjective: string | null;
  /** Combat Stims passive: flat bonus damage this player's lane deals per attack this round (set by Reveal dispatch). */
  combatStimsRevealBonus: number;
  /** Tracks raw income earned this round (per-resource) so Income Tax can duplicate 50% into the command pool. Reset each round. */
  incomeThisRound: ResourcePool;
  stats: {
    kills: number;
    deaths: number;
    overrunsSuffered: number;
    promotionsReceived: number;
    donationsMade: ResourcePool;
    healsGiven: number;
    /** Total HP actually restored across all heal actions (exact, not approximated). Used by
     * the Combat Medic mission requirement ("Heal N damage during combat") and the Medic SO. */
    healedHp: number;
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
    /** Interdictor SO: total enemy abilities (reveals) this player has caused to be denied. */
    abilitiesDenied: number;
    /** AFK SO: number of rounds this player completed without adding any unit or gear to any lane. */
    afkCleanRounds: number;
    /** Kremlen SO: total resources this player drew from the command pool (card activations + Command Requisition buys). */
    commandPoolSpendTotal: number;
    /** Kremlen SO: total resources this player spent from their own pool (card activations + Command Requisition buys). */
    ownSpendTotal: number;
    /** Mission requirement: max enemy abilities denied in any single round (Prevent N abilities in 1 turn). */
    maxAbilitiesDeniedInRound: number;
    /** Mission requirement: rounds completed without losing any unit (Win a round without losing units). */
    roundsWithoutUnitLoss: number;
    /** Sundering Blow: max armor+shields stripped from enemies in a single round. */
    maxArmorShieldStrippedInRound: number;
    /** Impenetrable: rounds where enemies attacked but the active unit took 0 HP damage (armor absorbed all). */
    roundsArmorAbsorbedAll: number;
    /** Crushing Advance: total trample kills this game. */
    trampleKillsTotal: number;
    /** Shock and Awe / Total Suppression req: total enemy stuns caused by this player. */
    stunsMade: number;
    /** Giant Slayer req: enemies killed whose rank is strictly above the killing player's rank at kill time. */
    aboveRankKills: number;
    /** Just a flesh wound req: units this player retired while at or below half their max HP. */
    unitsRetiredUnderHalfHp: number;
    /** War Hero req: units this player retired with exactly 1 HP remaining and rank > 4. */
    unitsRetiredHighRankWith1Hp: number;
    /** Strategic Recall req: units this player retired at full HP with rank > 4. */
    unitsRetiredHighRankFullHp: number;
    /** Flawless Assault req: max kills achieved in a single round where the player had 0 deaths. */
    maxKillsInRoundWithNoDeaths: number;
  };
  /** Honorable Discharge / War Hero: unit held after retirement, redeployed at the next planning
   * phase. Null when inactive. */
  honorableDischargeUnit: UnitInstance | null;
  /** Stasis Suit / Emergency Extractor: units returned to hand mid-combat (with gear attached).
   * Redeployed at the next planning phase, same as honorableDischargeUnit. */
  unitHand: UnitInstance[];
  /** Indices into laneEnemyReserve that have been revealed/scouted (face-up) for this player.
   * Index 0 is always implicitly revealed (next-in-line). Cleared and re-populated each round when
   * the hoard is built. Persists within a round as enemies are killed/shifted. */
  revealedEnemyIndices: Set<number>;
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
  /** Tag Team passive: reserve units deal their damage alongside the active unit each attack. */
  tagTeamPassive: boolean;
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
  /** Enemy cards killed during the current round's combat — rotated to enemiesKilledLastRound at round start. */
  enemiesKilledThisRound: EnemyCard[];
  /** Enemy cards killed last round — available for Reanimator's reveal. */
  enemiesKilledLastRound: EnemyCard[];
  /** Number of pending reveal-prevention charges available to players this round. Each preventable
   * enemy reveal consumes one charge and is fully skipped. Reveals whose text contains
   * "this cannot be prevented" bypass this check entirely. Set by The Pathfinder active
   * (tactician.ts) and the "Block the next N enemy abilities" mission instant (missions.ts). */
  revealPreventionCharges: number;
  /** Enemy card Names whose passive effects are suppressed this round. Covers both keyword-driven
   * passives (applyEnemyCombatMods) and all manual passive check sites. Reset each round.
   * No current player card populates this set — it is scaffolded for a future passive-suppression
   * mechanic. The Oracle's own passive ("enemies cannot have their abilities prevented") blocks
   * reveal prevention but does not interact with this set. */
  suppressedPassiveEnemyNames: Set<string>;
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
  grandSaboteurDisabledLocation: Location | null;
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
  /** Gear recycle pile: receives gear from hand overflow, unit death, and retire paths.
   * The Reclaimer passive intercepts the first item recycled each round and returns it to hand. */
  recyclePile: (CommandCard | GearCard)[];
  /** Gear items returned to a player's hand from unit-death/retire this round, keyed by seatIndex.
   * Cap: 1 normally, 2 for The Reclaimer. Reset each round. */
  gearHandReturnedThisRound: Map<number, number>;
  /** AFK SO: seatIndices that added a unit or gear to any lane this round. Reset each round. */
  unitsOrGearAddedSeats: Set<number>;
  /** Quartermaster active: GearCards currently in shopGear that arrived via a rank roll-fill (not direct-fill).
   * Used to offer the once-per-round reroll. Reset each round. */
  quartermasterRolledShopGear: Set<GearCard>;
  /** Quartermaster active: UnitCards currently in shopUnits that arrived via a rank roll-fill (not direct-fill).
   * Parallel to quartermasterRolledShopGear. Reset each round. */
  quartermasterRolledShopUnits: Set<UnitCard>;
  /** The Gunsmith resource: 1st weapon purchase per round is free. Tracks which seats have used it. Reset each round. */
  gunsmithFreeWeaponUsedSeats: Set<number>;
  /** The Bulwark resource: 1st armor purchase per round is free. Tracks which seats have used it. Reset each round. */
  bulwarkFreeArmorUsedSeats: Set<number>;
  /** Tracks which players have already had their Reclaimer passive ("1st item to recycle → hand")
   * fire this round. Reset each round. */
  reclaimerPassiveFiredThisRound: Set<number>;
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
  /** Plague passive: blocks all player unit healing while Plague is alive. */
  plagueActive: boolean;
  /** Shadow Sower passive: blocks scout pool effects and scout-targeting enemy mods while alive. */
  shadowSowerActive: boolean;
  /** The Chessmaster Tactician's Active -- cloned EnemyCard references that were swapped this
   * round. Any enemy whose reference is in this Set gets Combatant.takesDoubleDamage = true,
   * so player attacks deal 2× damage to it. Reset each round. */
  chessmasterDoubledEnemies: Set<EnemyCard>;
  /** Contained enemy pool -- moved from GameEngine's private field so Tactician actives (The
   * Jailer), Events, and future mechanics can read/modify it without extra parameters. Fed by
   * the containment logic in runDeploymentAndCombat. */
  containedEnemyPool: EnemyCard[];
  /** Combat Stims passive: set true when the once-per-round Reveal ability has been used this round. */
  combatStimsUsedThisRound: boolean;
  /** Combat Stims active: damage amount chosen by the player before dispatch (0 = not set). */
  combatStimsPendingDmg: number;
  /** Countermeasures passive: per-lane remaining ability-prevention budget this round (seatIndex → count). */
  laneAbilityPreventions: Map<number, number>;
  /** Countermeasures active: lanes where ALL enemy abilities are fully suppressed this round. */
  laneAbilitiesFullySuppressed: Set<number>;
  /** Set by Countermeasures active dispatch so the activation callback skips returning the card to the deck. */
  destroyNextActivatedCard: boolean;
  /** Countermeasures active: lane (seatIndex) chosen before dispatch. */
  countermeasuresTargetSeat: number;
  /** Necromancy passive: seatIndexes where the first death this combat has already been prevented. Reset each round. */
  necromancyDeathPrevented: Set<number>;
  /** Necromancy active: graveyard index chosen before dispatch (-1 = none/fallback). */
  necromancyPickedIdx: number;
  /** Donor Organs active: medBayUnits index chosen before dispatch (-1 = none/fallback). */
  donorOrgansPickedIdx: number;
  /** Ashes to Ashes active: medBayUnits index chosen before dispatch (-1 = none/fallback). */
  ashesToAshesPickedIdx: number;
  /** We Can Rebuild Them active: this round, any unit that dies can be revived by paying its Tech Cost. */
  weCanRebuildActive: boolean;
  /** We Can Rebuild Them: unit IDs that have already been rebuilt this round (once per unit). */
  rebuiltThisRound: Set<string>;
  /** Battle Medics passive: set true once the first death this round has been prevented at full HP. */
  battleMedicsPassiveUsed: boolean;
  /** Battle Medics active: unit IDs granted a one-time full-HP revive on death this round. */
  battleMedicsActiveUnits: Set<string>;
  /** Orders from Above: the 3 drawn cards pending the player's keep choice. */
  ordersFromAboveDrawn: CommandCard[];
  /** Orders from Above: index into ordersFromAboveDrawn of the card the player chose to keep (-1 = fallback). */
  ordersFromAboveKeepIdx: number;
  /** Request Aid: rounds remaining where all player income is doubled (set to 2 on activation, decremented after each income phase). */
  requestAidBonusRounds: number;
  /** Priority Operations: rounds remaining where non-commander command card activation costs are halved (set to 3 = current + 2, decremented at round start). */
  priorityOperationsRoundsLeft: number;
  /** Priority Construction: rounds remaining where upgrade build costs (paid from commandPool) are halved (set to 3 = current + 2, decremented at round start). */
  priorityConstructionRoundsLeft: number;
  /** Take Credit: when set, the next non-trickle promotion granted to any player is stolen by the commander instead. Cleared on intercept or round end. */
  takeCreditCommanderSeat: number;
  /** Nuke active: seatIndex of the lane chosen to destroy (-1 = fallback/auto). */
  nukeLaneSeat: number;
  /** Promotion active: seatIndex of the player chosen to promote (-1 = fallback/auto). */
  promotionTargetSeat: number;
  /** Reinforcements active: unit IDs of the two temp units pulled from the shop. Surviving units (and their gear) are returned to their decks at round end; dead units leave gear destroyed in graveyard. */
  reinforcementUnitIds: Set<string>;
  /** Perfect Information active: armed during planning, consumed after hoard build to let the commander rearrange enemies across lanes. */
  perfectInfoArmed: boolean;
  /** Field Testing active: index into shopGear of the chosen item (-1 = fallback). */
  fieldTestingGearIdx: number;
  /** Field Testing active: index into all lane units (0 = active, 1+ = reserve[idx-1]) to equip onto (-1 = fallback). */
  fieldTestingUnitIdx: number;
  /** Final Stand active: unit ID of the chosen unit that cannot die this round ("" = not set). */
  finalStandTargetUnitId: string;
  /** Whites of Their Eyes active: seatIndex of the lane where first-attack damage is doubled (-1 = not set). */
  whitesOfTheirEyesTargetSeat: number;
  /** Punch Through active: seatIndex of the lane where kills deal a free hit to the boss (-1 = not set). */
  punchThroughActiveSeat: number;
  /** Eradicator Cannon passive: current Alien cost to fire (starts at 2, doubles each use, persists across rounds). */
  eradicatorCannonCost: number;
  /** Eradicator Cannon active: if true, after hoard build kill one enemy chosen by the player. */
  eradicatorCannonKillArmed: boolean;
  /** Eradicator Cannon active: seatIndex of the lane to kill from (-1 = auto). */
  eradicatorCannonLaneSeat: number;
  /** Per-round free-activation markers, keyed by "${unitId}-${gearName}". Set by The Engineer
   * Tactician's Active (refresh + free next use). Consumed by the gear active loop: if the key
   * is present, cost is skipped once and the entry is deleted. Reset each round. */
  freeAbilityNextUse: Set<string>;
  /** When set, skips the normal commander-handoff at end of the round (then cleared). */
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
  /** Containment Block Sealed instant: when true, players may contain boss enemies. */
  canContainBosses: boolean;
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
  /** Cumulative count of enemy reveal abilities that actually fired this game (not prevented).
   * Used by "Enemies activate N abilities" mission requirements. Never reset. */
  enemyAbilitiesActivated: number;
  /** Current containment slot capacity (mirrors GameEngine.containmentSlots). Updated whenever
   * containmentSlots changes so missions.ts can check it without private-field access. */
  containmentSlotsCap: number;
  /** Per-round count of reveal abilities denied per seatIndex. Reset each round.
   * Used to update maxAbilitiesDeniedInRound after each round. */
  abilitiesDeniedThisRound: Map<number, number>;

  // ── Mission instant / gear / unit mechanic flags ──────────────────────────────────────────────

  /** Night Vision reveal: names of enemies scouted/revealed this round.
   * Night Vision's free attack only fires against these. Reset each round. */
  revealedEnemyNames: Set<string>;
  /** Flawless Assault instant: seat indices whose unit deaths this round return to game.shopUnits. Reset each round. */
  flawlessAssaultSeats: Set<number>;
  /** Strategic Recall instant: next round unit deaths → benchedUnits (retired) instead of destroyed. Consumed at next combat phase start. */
  strategicRecallActive: boolean;
  /** Command Central instant: seat indices that may play command cards even when not commander. Persistent. */
  commandCentralSeats: Set<number>;
  /** Battlefield Dominance instant: seat indices whose units all attack before enemies this round. Reset each round. */
  battlefieldDominanceSeats: Set<number>;
  /** Steady Hand instant: seat indices protected from the next involuntary commander role loss. Persistent until consumed. */
  steadyHandSeats: Set<number>;
  /** Armed and Ready instant: seat indices whose next gear equip during combat is free. Persistent until consumed. */
  armedAndReadySeats: Set<number>;
  /** Assume Command instant: seat indices that count as 1 rank higher while holding commander. Persistent. */
  assumeCommandBonusSeats: Set<number>;
  /** Secure the Specimens instant: seat indices that gain Alien = rank of most-contained enemy each round. Persistent. */
  secureSpecimensSeats: Set<number>;
  /** Honorable Discharge instant: seat indices whose next retire returns to hand instead of benchedUnits. Consumed one-shot. */
  honorableDischargeSeats: Set<number>;
  /** War Hero instant: seat indices whose next retire triggers (return to hand + full heal on redeploy). Consumed one-shot. */
  warHeroSeats: Set<number>;
  /** Crushing Advance instant: seat indices where trample damage can chain through multiple enemies. Persistent. */
  crushingAdvanceSeats: Set<number>;
  /** Impenetrable instant: seat indices whose active unit reflects damage equal to its armor stat. Persistent. */
  impenetrableSeats: Set<number>;
  /** Mission Failure instant: prevent the next event failure penalty. Consumed on next failure. */
  missionEventFailurePrevented: boolean;
  /** Medical Emergency instant: when > 0, overrides the default med-bay slot cap (default 2 → this value). */
  medBaySlotCapOverride: number;
  /** Mission enemy-stun carry: seat indices whose front enemy starts next combat stunned.
   * Set by Total Suppression / Shock and Awe instants; merged into tempState.pendingEnemyStunSeats
   * at the start of combat, then cleared. */
  missionEnemyStunSeats: Set<number>;
  /** Mission hoard-reduction carry: deal this many fewer enemies in the next combat.
   * Set by Breach / Collapse / Total Breakdown instants; consumed at hoard generation, then zeroed. */
  hoardReductionNextCombat: number;
  /** Ability-denial damage bonus: deal this much damage to the enemy when any ability is prevented.
   * Set by Total Shutdown (4) / Absolute Lockdown (10) instants; stacks. */
  abilityDenialDamage: number;
  /** Sundering Blow carry: seatIndex whose next front enemy has armor + shields zeroed at combat
   * start. -1 when inactive. */
  sunderedLaneSeat: number;
  /** Iron Grip instant: seat indices where the commander may not rotate away without a player vote.
   * Persistent. When the current commander is in this set, rotation is blocked unless overridden. */
  ironGripSeats: Set<number>;

  // ── Ability Interception flags (Stealth Buggy/Tank, MCP Slapper, EMP Slayer) ─────────────────

  /** Ability Interception: seat indices where directed (targeted) enemy abilities are blocked this
   * round. Set by Stealth Buggy/Tank "cannot be targeted by abilities" passive when active.
   * Does NOT block AoE passives (Emitter DoT, Totem of Decay, Hive Mind buffs). Reset each round. */
  directedAbilityImmuneLanes: Set<number>;
  /** Ability Interception: first-ability cancel budget remaining per lane this round.
   * Key = seatIndex, value = cancels remaining (Stealth Buggy/Tank cancel 1st enemy ability). Reset each round. */
  firstAbilityCancelPerLane: Map<number, number>;
  /** Ability Interception: seat indices whose front enemy's abilities are fully suppressed this round
   * (MCP "Slapper" targeting). Covers both activated and passive effects in that lane. Reset each round. */
  enemyAbilitySuppressedSeats: Set<number>;
}
