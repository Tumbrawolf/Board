# Playtest Game 1 — Pure Cooperative Baseline (No Saboteur, No Chaos)

## Game Parameters

| Setting | Value |
|---|---|
| Players | 4 (all seats narrated by the same author, hands kept genuinely separate) |
| Difficulty | Normal (Overrun Tracker starts at 10; lane hoard size 3 base, +1 at Player Progress 5-7, +1 more at 8-10, caps at 5) |
| Optional rules in use | Commander's Call (commander picks who gets full income at a shared location, replacing the lowest-Rank-priority default). Vote of No Confidence is available but not forced. |
| Secret Objective pool | `exclude_chaos_saboteur` — every Secret Objective this game is Allied or Neutral. No hidden antagonist exists. |
| Seed | 1001 (deterministic, via `dealer.py`, isolated state file `state_game1.json`) |
| Tiered Mission Draw | Not used — default blind Mission Assignment draw. |

## What this game is testing

This is the "pure cooperative" control case of a three-game test batch: every Secret Objective is Allied or Neutral, so there is no Saboteur and no Chaos agent at the table. Mechanically, that means:

- Combat, economy, and Promotion rules get exercised exactly as they would in any game.
- Secret Objectives still matter and are still kept hidden at the table (for realism and consistency with the other two games in the batch), but resolving them can never produce a "the team was secretly sabotaged" reveal — only "this player was quietly also chasing X."
- If a Vote of No Confidence is ever called in this game, it is *guaranteed* to be a false accusation, since nobody here can actually be Saboteur/Chaos-aligned. That's a fine and useful outcome to test — it will only happen if in-fiction circumstances plausibly justify someone getting paranoid, never manufactured for its own sake.

This document applies Playtest Log entries **#31** (commander-role holdover timing for Commander Actions), **#32** (Command Card hand refill happens at Cleanup, not Planning), and **#33** (Fodder-rank enemy supply — treat every Enemy card as having unlimited physical copies) throughout.

---

## Setup

### Deck Prep

`dealer.py init 1001 exclude_chaos_saboteur` shuffled and prepared:

- **Units**: 41 base Infantry/Infantry Scout (Vehicles/Mechs set aside, 62 cards, until a Vehicle Bay/Mech Station/Combined Arms upgrade is bought)
- **Gear**: 60 base (8 Experimental set aside until Experimental Science is bought)
- **Enemies**: split into Rank piles — Fodder 2, Grunt 8, Core 6, Advanced 35, Elite 14, General 17, Conqueror 11 (the Fodder shortfall is the known #33 issue; resolved per the provisional ruling)
- **Secret Objectives**: 26 cards remain in the Allied/Neutral-only pool after the Saboteur/Chaos filter
- **Missions**: 117, **Events**: 40, **Tactician**: 18, **Command Cards**: 61, **Boss**: 15

### The Table

Four players, each assigned one lane:

| Seat | Lane | Starting Rank |
|---|---|---|
| **P1 — Reyes** | Lane 1 | Conscript |
| **P2 — Voss** | Lane 2 | Conscript (pre-Leader-bonus) |
| **P3 — Adeyemi** | Lane 3 | Conscript |
| **P4 — Kowalski** | Lane 4 | Conscript |

### Player Setup (2 Secret Objectives, 2 Missions, 1 Tactician, 2 Command Cards each)

**Secret Objectives** *(hidden — described obliquely; full reveal saved for the end-of-game section)*:
- P1 (Reyes) holds two cards: one rewards ability/item-driven kills, the other rewards broad mission completion.
- P2 (Voss) holds two cards: one rewards hoarding a particular resource, the other rewards spreading gear across the team's lanes.
- P3 (Adeyemi) holds two cards: one rewards fully committing to a few locations' upgrade paths, the other rewards reaching a personal Rank milestone.
- P4 (Kowalski) holds two cards: one rewards keeping a single unit alive a long time, the other rewards *not* over-building infrastructure.

(All eight cards are genuinely Allied or Neutral this game — see the end-of-game reveal for exact names and resolutions.)

**Mission pool drawn for Player Setup** (8 cards, 2 per player per the Player Setup rule — distinct from the later in-round Mission Assignment pool):

1. Tech Donated IV [Captain] — Donate 20 Tech to Command
2. Medical Bay Detail [Sergeant] — Deploy worker to Medical Bay
3. Medical Emergency [Captain] — Fill Medbay
4. Tech Donated III [Sergeant] — Donate 15 Tech to Command
5. Secure the Specimens [Captain] — Fill containment
6. Desperate Stand [Major] — Enemy Progress over 7
7. Lane Specialist II [Captain] — Activate 10 abilities in 1 lane
8. First Blood [Conscript] — Kill 1 enemy

Distribution: **P1** got First Blood + Lane Specialist II, **P2** got Medical Bay Detail + Tech Donated III, **P3** got Secure the Specimens + Desperate Stand, **P4** got Medical Emergency + Tech Donated IV. Since all but First Blood require Sergeant+/Captain+/Major+ and nobody starts above Conscript, First Blood is the only immediately-completable mission at the table — a normal, low-stakes opening hand.

**Tactician Cards** (1 each, permanent for the game):
- **P1 (Reyes)**: The Drillmaster — Passive: units under Rank 5 gain Attack/HP = double Reyes's rank minus their own rank. Active: recruit the lowest-rank shop unit free. Resource: units under Rank 5 cost no Alien.
- **P2 (Voss)**: The Engineer — Passive: Utility equipment gains +1 target. Active: refresh a utility's cooldown free, ignoring its cost for that activation. Resource: Utilities cost 2 less (Voss's choice of resource).
- **P3 (Adeyemi)**: The Chessmaster — Passive: can reassign units any time; once per lane, a reassigned unit takes half damage on its first hit. Active: swap two enemy units' lane positions, ignoring reveals, double damage to them. Resource: mobility-gear costs 1 less Tech.
- **P4 (Kowalski)**: The Jailer — Passive: contained enemies aren't consumed while Kowalski has a worker at Containment. Active: combine both Containment units and move them to Kowalski's lane. Resource: Containment upgrades cost no Alien.

**Starting Command Cards** (2 each, before the Leader bonus):
- P1: Work Order [Command], Barrier Systems [Battlefield]
- P2: Share Rooms [Medical Bay], Vehicle Bay [Barracks]
- P3: Perfect Information [Command], Necromancy [Containment Block]
- P4: Final Stand [Battlefield], Field Testing [Command]

### Leader Selection

Per the rules: "Players vote on who is the starting leader, this player starts with +1 Rank. The selected leader also starts with +2 Command Cards." Resolved with a d8 roll (1d8 → **2**) standing in for the table's vote, mapped to Player 2 (Voss), since this is a solo-narrated playtest with no genuine preference signal among four identical opening hands.

**Voss is Leader**: +1 Rank (Conscript → **Private**), +2 Command Cards drawn fresh from the deck — Work Order [Command] and Barrier Systems [Battlefield] (both happen to duplicate cards P1 already holds, which is fine; nothing prevents multiple copies of the same Command Card existing across different hands).

Voss's starting hand is therefore 4 cards: Share Rooms, Vehicle Bay, Work Order, Barrier Systems — over the normal 2-card hand size, which is allowed; the Cleanup refill (Log #32) only ever tops hands *up* toward size, never discards down.

Per **Playtest Log #31**, Round 1 has no previous round to hold a commander over from, so **the Leader (Voss) fills in as Round 1's commander** for this round's Commander Actions, and whoever's Worker Placement claims Command this round becomes commander for Round 2.

### Initial Shop Fill

Both Barracks (4 unit slots) and Armory (2 gear slots) need filling before Round 1 begins. As Round 1 commander, Voss chooses **Direct Fill** for every slot — guaranteed Rank 1-3 cards, no roll — since nobody on the team can deploy anything above Conscript yet and a whiffed Roll Fill could hand the table a card nobody can field for several rounds.

**Barracks:**
1. *Conscript* [Conscript Infantry] — DMG 1/HP 1, cost O1
2. *Recruit* [Private Infantry] — DMG 2/HP 2, cost O3/T1
3. *Rookie Marksman* [Private Infantry, Long Range] — DMG 2/HP 2, cost O3/T1
4. *Rookie Scout* [Private Infantry Scout, Mobile] — DMG 2/HP 2, cost O3/T1

**Armory:**
1. *Grenades* [Conscript Weapon] — DMG 3/HP 2 (bonus to wielder), cost O1/T2
2. *Basic Medkit* [Private Utility] — DMG 1/HP 2 (bonus to wielder), cost O2/T4

Voss's visible reasoning: with everyone still Conscript, cheap bodies and a Scout-type unit (eventually donatable to Command as a scout) matter more right now than rolling for a stronger but currently-unaffordable card.

---

## Round 1

### Planning Stage

**Commander Actions (Voss, holdover Leader-as-commander per Log #31):**
- *Spend command resources on Command Cards*: Command pool is empty (0/0/0) — nothing to spend.
- *Hand-refill check*: per Log #32 this happens at Cleanup, not here — explicitly skipped at this point in the round.
- *Lane delegation*: a full 4-player game has every lane already assigned to a player, so this sub-step is a no-op every round this game.
- *Event draw*: draw 2 Events, Voss chooses 1 to be active for the round.
- *Boss spawn roll*: "If no Boss is currently active, roll 1d10. Rolling at or below the current Enemy Progress spawns a Boss... impossible at Enemy Progress 0." Enemy Progress is 0 this round, so the roll is mathematically impossible to succeed and is skipped outright. **No Boss this round.**
- *Mission Assignment*: draw missions = players + commander's Rank. Reading "commander's Rank" as the rank's tier number (Conscript=1 ... Brigadier=8), Voss (Private) = 2, so pool size = 4 + 2 = **6**, passed around the table starting from the player next to the commander.

**Event draw** (2 cards):
- *Medical Focus* — Round Effect: Medbay costs Organics to heal. Complete: empty/full HP med bay. Reward: healing generates Organics. Fail: healing costs Organics with a cap.
- *Honorable Discharge* — Round Effect: units retire on death this round. Complete: retire between 5 and 10 units this turn. Reward: retired units' refund value is duplicated to Command. Fail: Retire no longer gives a resource.

Voss picks **Honorable Discharge**: nobody has anything in the Medbay yet, so Medical Focus would be dead text this round, while Honorable Discharge's downside (failing to hit 5-10 retirements) is low-risk this early since nobody has many units to lose anyway.

**Mission Assignment pool** (6 cards, drawn blind):

1. Maintain Morale [Sergeant] — Req: be over 5 Progress. Reward: +5 all resources. Instant: gain 1 Progress.
2. Xenobiology Delivered I [Conscript] — Req: donate 1 Alien to Command. Reward: +1 all resources. Instant: each player gains 1 Alien.
3. Full Export 5 [Major] — Req: return 30 of each resource to supply. Reward: +15 all resources. Instant: gain 20 resources, split any way.
4. Xenobiology Delivered V [Major] — Req: donate 20 Alien to Command. Reward: +10 all resources. Instant: add 5 Alien to Command.
5. Organic Export 3 [Sergeant] — Req: return 15 Organics to supply. Reward: +10 Organic. Instant: target player gains 10 Organics.
6. Full Export 4 [Captain] — Req: return 20 of each resource to supply. Reward: +10 all resources. Instant: gain 10 resources, split any way.

Passed starting from the player next to the commander (P3), one card kept per pass, around the table twice (6 cards / 4 players): **P3 → P4 → P1 → P2 → P3 → P4**.

- P3 takes **Xenobiology Delivered I** (the only Conscript-rank card — immediately completable)
- P4 takes **Organic Export 3**
- P1 takes **Full Export 4**
- P2 (Voss) takes **Maintain Morale**
- P3 takes **Full Export 5**
- P4 takes **Xenobiology Delivered V**

Everything beyond Xenobiology Delivered I is Sergeant+ or higher and aspirational for a table of Conscripts/one Private — a normal early-game spread.

### Worker Placement

**Worker Placement** rule: "Each player has 2 Worker Tokens, rising to 3 once they reach Rank 4 (Captain) or higher. Whoever is commander this round gets one additional worker on top of their normal total, for the round." Voss is commander, so she places **3** workers this round; everyone else places 2. Turn order starts from the player next to the commander (P3) and proceeds around the table, repeating until everyone's workers are placed.

| Order | Player | Worker # | Location |
|---|---|---|---|
| 1 | P3 | 1 | Barracks |
| 2 | P4 | 1 | Medical Bay |
| 3 | P1 | 1 | Armory |
| 4 | P2 (Voss) | 1 | Command (claims commander role for **Round 2**) |
| 5 | P3 | 2 | Battlefield |
| 6 | P4 | 2 | Barracks (shares with P3) |
| 7 | P1 | 2 | Battlefield (shares with P3) |
| 8 | P2 (Voss) | 2 | Command (her own 2nd worker) |
| 9 | P2 (Voss) | 3 (commander bonus) | Barracks (3rd worker there) |

**Sharing resolution at Barracks** (3 workers total: P3, P4, P2): per the 4-player rule, "the first TWO workers at a shared location both earn full income... only the 3rd worker onward earns half." P3 placed first, P4 second — both get full income. Voss's 3rd worker there gets half (rounded down). Commander's Call (optional rule, active this game) would let Voss override who gets the full-income slots, but since the first two are simply the first two arrivals and Voss is the one arriving 3rd, there's no contested tie to resolve here — Commander's Call had nothing to adjudicate this round.

**Battlefield** had 2 workers (P3, P1) — both automatically full under the "first two" rule, no contention.

### Income Generation

- **Barracks** (Worker Placement — Locations: "Gain Tech and Organic each equal to the total rank of the shop"): shop = Conscript(1) + Private(2) + Private(2) + Private(2) = total rank **7**. Full-income workers (P3, P4) each gain **+7 Tech, +7 Organic**. Half-income worker (Voss) gains **+3 Tech, +3 Organic** (7÷2 = 3.5, rounded down).
- **Armory** (P1): "gain Tech = 2× total rank of shop." Shop = Conscript(1) + Private(2) = total rank 3 → **+6 Tech**.
- **Medical Bay** (P4): "+1 Organic per worker regardless," no injured units to heal yet → **+1 Organic**.
- **Command** (Voss, 2 workers): "Resources of your choice equal to your rank per worker." Voss is Private (tier 2) → **+2 resources of choice per worker**, twice. She chooses **Organic** both times (to keep affording Barracks purchases as commander) → **+4 Organic**.
- **Battlefield** (P3, P1): "+1 all resources to Command per worker." Each contributes **+1 Organic/+1 Tech/+1 Alien to the Command pool** — these do not go to the player, they go to the shared pool. Command pool: **+2 Organic, +2 Tech, +2 Alien** (from P3 and P1 combined).

**Resulting resources before purchasing:**

| Player | Organic | Tech | Alien |
|---|---|---|---|
| P1 (Reyes) | 3 | 3+6=9 | 3 |
| P2 (Voss) | 3+4(Command)+3(half Barracks)=10 | 3+3(half Barracks)=6 | 3 |
| P3 (Adeyemi) | 3+7=10 | 3+7=10 | 3 |
| P4 (Kowalski) | 3+1+7=11 | 3+7=10 | 3 |

Command pool after Battlefield contributions: **2 Organic / 2 Tech / 2 Alien**.

### Purchasing

Turn order for purchasing (no fixed rule beyond "players may take turns" — resolved in the same around-the-table order as Worker Placement, P3→P4→P1→P2):

- **P3** buys *Conscript* (O1) and *Recruit* (O3/T1) — two cheap bodies for the lane. Remaining: O6/T9/A3.
- **P4** buys *Rookie Scout* (O3/T1, Scout-type — eventually donatable) and *Basic Medkit* (O2/T4). Remaining: O6/T5/A3.
- **P1** buys *Rookie Marksman* (O3/T1, Long Range). Remaining: O0/T8/A3.
- **P2 (Voss)** buys *Grenades* (O1/T2). Remaining: O9/T4/A3.

Every slot bought sold out **all 6 shop slots** in a single round — every Barracks unit and both Armory items moved. Per the refill rule ("a slot never sits empty waiting for next round"), Voss immediately Direct Fills all 6 again with fresh Rank 1-3 cards, repeating her Round-1 logic (nobody can afford or deploy anything higher yet):

**Barracks refill:** Stubborn Recruit (Private), Pack Mule (Private), Civilian Scout (Conscript, Scout-type), Rookie Technician (Private)
**Armory refill:** Scoped Weapons (Conscript Weapon), Basic Armor (Private Armor)

### Command Donations

Only players with a worker at Command may donate — this round that's only Voss. She donates **2 Organic** to the Command pool as a show of good faith for the team's shared upgrade fund (not yet enough banked for any real upgrade, but starting the habit early).

- Voss's resources after donation: **O7/T4/A3**
- Command pool after donation: **O4/T2/A2**

### Deployment Stage

**Heal Units**: nobody has an injured unit in the Medbay yet — no effect this round despite P4's worker there (the Organic income from working Medical Bay is separate from the heal-count bonus, and triggers regardless per its own text).

**Assign Scouts**: the scout pile is empty — no unit has been donated to Command as a Scout (P4's new Rookie Scout sits in their own lane instead, and donating requires a worker at Command, which P4 doesn't have this round). Per the rule, this step is skipped entirely with an empty pile — no enemies get pre-revealed by scouting this round.

**Reassign Units / Manage Equipment**: each player slots their newly purchased unit into their lane.

| Lane | Active unit | Reserve |
|---|---|---|
| 1 (Reyes) | Rookie Marksman (DMG2/HP2, Long Range) | — |
| 2 (Voss) | *(none — no unit purchased this round)* | — |
| 3 (Adeyemi) | Recruit (DMG2/HP2) | Conscript (DMG1/HP1) |
| 4 (Kowalski) | Rookie Scout (DMG2/HP2, Mobile) + **Basic Medkit** equipped (+2 HP → HP4) | — |

Voss's Grenades sit unequipped in hand — gear can only be equipped onto an Active unit or the topmost Reserve unit in your own lane, and Voss has neither this round. Lane 2 heads into combat completely empty.

### Commander Actions (Deployment): Enemy Draw

Normal difficulty, Player Progress 0 → base hoard size of **3 enemies per lane**. Enemy Progress 0 → Fodder rank (covers Progress 0-1). Drawing 3 Fodder-rank cards per lane (4 lanes, 12 draws total) immediately exercises the Log #33 supply ruling: the Fodder pile only has 2 unique cards (Pests, Ticks), so it recycles continuously.

| Lane | Reserve (face-down, draw order) |
|---|---|
| 1 | Pests, Ticks, Ticks |
| 2 | Pests, Ticks, Pests |
| 3 | Pests, Ticks, Pests |
| 4 | Ticks, Ticks, Pests |

**Pests** — DMG1/HP1, no Reveal effect, Passive "+1 damage for each other revealed Pest." **Ticks** — DMG1/HP1, Reveal "each player loses 1 Organic," Passive "-1 Organic income while revealed." Both are explicitly Fodder-rank "Melee Fodder" / "Damages Economy" flavor enemies — exactly the kind of low-stakes Round 1 speed bump Fodder rank should be.

### Combat Stage

**Enemy Scouting**: with no scout active, nothing is pre-revealed; each lane's top reserve card flips face-up (triggering its Reveal effect) the moment it's promoted to Active.

The commander (Voss) chooses the lane resolution order: **Lane 2 → Lane 1 → Lane 3 → Lane 4** (starting with her own already-doomed lane to get it over with).

**A genuine rules question came up here**: Pests' Passive reads "+1 damage for each other revealed Pest," with no stated scope (this lane vs. the whole board). Since the Combat Cycle rule has the commander resolve lanes one at a time in a chosen order (not simultaneously), I ruled this counts **all Pests revealed so far this round, board-wide**, in actual resolution order — consistent with Reveal being a one-time event per card that accumulates across the whole Combat Stage. Logged below under Open Rules Questions, since the card text doesn't explicitly state its scope.

**Lane 2 (Voss) — no defender.** Pests flips face-up (1st board-wide), then Ticks (each player loses 1 Organic; this is universal, not lane-scoped), then Pests flips face-up (2nd board-wide). With no Active unit to fight back, all three enemies simply sit there unopposed — Lane 2 overruns by default the moment any enemy is present with nothing defending.

**Lane 1 (Reyes).** Pests (3rd board-wide, no other Pests revealed yet when it flips — wait, 2 already are from Lane 2, so it actually enters at +2 dmg... let's resolve precisely): Pests flips (3rd revealed, 2 others already up → **+2 damage, DMG3**) vs Rookie Marksman (DMG2/HP2). Simultaneous exchange: Marksman deals 2 (Pests HP1, dies), Pests deals 3 (Marksman HP2 → dead, overkill 1). **Both die.** Next: Ticks flips (Reveal: each player loses 1 Organic) — Lane 1 has no Active or Reserve unit left, so Lane 1 is already overrun for the remainder of the round; the last Ticks and the round's resolution simply confirm it.

**Lane 3 (Adeyemi).** Pests flips (4th board-wide, 3 others already up → **+3 damage, DMG4**) vs Recruit (DMG2/HP2). Simultaneous: Recruit deals 2 (Pests dies), Pests deals 4 (Recruit HP2 → dead). Recruit dies; **Reserve Conscript (DMG1/HP1) promotes to Active.** Next: Ticks flips (each player loses 1 Organic again) vs Conscript (DMG1/HP1): simultaneous, Conscript deals 1 (Ticks dies), Ticks deals 1 (Conscript HP1 → dead). Conscript dies; Lane 3's reserve is now empty. Next: Pests flips (5th board-wide, 4 others already up → **+4 damage, DMG5**) — no defender left. Lane 3 cleared 2 of its 3 enemies but loses both its units and overruns on the 3rd.

**Lane 4 (Kowalski).** Ticks flips (each player loses 1 Organic) vs Rookie Scout+Medkit (DMG2/HP4): simultaneous, Scout deals 2 (Ticks dies), Ticks deals 1 (Scout HP4→3). Next: Ticks flips (each player loses 1 Organic again) vs Scout (HP3): simultaneous, Scout deals 2 (Ticks dies), Ticks deals 1 (Scout HP3→2). Next: Pests flips (6th board-wide, 5 others already up → **+5 damage, DMG6**) vs Scout (HP2): simultaneous, Scout deals 2 (Pests HP1 → dies), Pests deals 6 (Scout HP2 → dead, heavy overkill). **Both die.** Lane 4 fully clears all 3 enemies, at the cost of its unit.

**Combat summary**: every Pests after the first got meaningfully scarier purely from board-wide reveal stacking — by Lane 4's 3rd enemy, a base 1-damage Fodder card was hitting for 6. That escalation is a direct, mechanical consequence of how many total Pests get revealed in a round, which scales with however many lanes/slots happen to deal Pests that round — worth watching in later rounds if Pests reappear at higher hoard sizes (Normal caps at 5/lane × 4 lanes = up to 20 reveals in the same round, which could make even a late Pests draw deal +19 damage if the dice keep landing on it).

### Cleanup Stage

**Managing the dead, via the active Event**: Honorable Discharge's Round Effect ("units retire on death this round") reframes every unit that would have died in combat as **retiring** instead — returned to the shop deck, refunding 1 of the unit's 3 resource costs, gear unequipped back to the owning player's hand. This is a genuinely different outcome from a normal round, where these 4 units would have gone to the Graveyard instead:

- Rookie Marksman (Lane 1) — retired, refunds 1 Organic to Reyes
- Recruit (Lane 3) — retired, refunds 1 Organic to Adeyemi
- Conscript (Lane 3) — retired, refunds 1 Organic to Adeyemi
- Rookie Scout (Lane 4) — retired, refunds 1 Organic to Kowalski; Basic Medkit unequips back to Kowalski's hand instead of being lost

**Overrunning lanes**: Lanes 1 and 2 ended combat with a live, undefeated enemy and no defender (Lane 1's final Ticks, Lane 2's entire hoard). Lanes 3 and 4 fully cleared all 3 of their enemies, even though both lost their unit doing it — a cleared lane does **not** overrun even at the cost of the defending unit. **Overrun Tracker: 10 − 2 = 8.**

**Event Resolution**: Honorable Discharge needed 5-10 retirements this turn to complete; only 4 happened. **Event fails.** Failure Penalty: "Retire costs no longer gives resource" — a narrow, mostly cosmetic penalty since it only affects the already-resolved retire-refund interaction going forward, not anything bigger.

**Promotions**: the rule reads "If the event passed, the commander may select another player to promote." Honorable Discharge failed, so **no promotion this round.**

**Command Card hand refill** (Cleanup, per Log #32 — size 2 normal / 3 for commander): P1 (2/2), P3 (2/2), P4 (2/2) are all already at their cap, no draw. Voss, this round's commander, holds 4 (Share Rooms, Vehicle Bay, Work Order, Barrier Systems) — already over her cap of 3, so no draw either; refill only ever tops hands *up*, never discards down.

**Escalate**: explicitly skipped on Round 1 per the rules ("Skip this step entirely on Round 1"). Enemy Progress stays at 0. Player Progress would only rise "if all lanes survived" — Lanes 1 and 2 overran, so Player Progress also stays at 0 regardless.

### Round 1 Summary

| Track | Value |
|---|---|
| Player Progress | 0 |
| Enemy Progress | 0 (Escalate skipped) |
| Overrun Tracker | 8 / 10 (started 10, −2 from Lanes 1 & 2) |
| Boss active | No |
| Commander next round | Voss (claimed Command first again) |

| Player | Rank | Organic | Tech | Alien | Lane status |
|---|---|---|---|---|---|
| P1 Reyes | Conscript | 0+1(refund)=0\* | 8 | 3 | Empty (Marksman retired) |
| P2 Voss | Private | 7 | 4 | 3 | Empty (never fielded a unit) |
| P3 Adeyemi | Conscript | 6+2(refunds)=6\* | 9 | 3 | Empty (both units retired) |
| P4 Kowalski | Conscript | 6+1(refund)=6\* | 5 | 3 | Empty (Scout retired, Medkit in hand) |

\* Refund amounts already folded into the listed totals above (computed post-Purchasing, post-Donation, post-refund).

Every lane is empty going into Round 2 — a rough, but not fatal, Round 1. The team learned two real lessons in-fiction: (1) leaving a lane with zero Active unit (Lane 2) is an automatic, guaranteed overrun with no chance to fight back, and (2) Pests' board-wide reveal-stacking passive makes the *order* enemies get revealed in matter a lot more than their flat 1 damage suggests.

---

## Round 2

### Planning Stage

**Commander Actions (Voss continues — she claimed Command first in Round 1's Worker Placement, so she holds over as Round 2's commander per Log #31):**
- *Command resource spend*: pool sits at O4/T2/A2 — nothing the table can currently afford to build (no commander holds a buildable upgrade card yet anyway).
- *Boss spawn roll*: Enemy Progress is still 0 entering Round 2 Planning — the Escalate step that raises it to 1 only fires during **Round 2's own Cleanup** (the rule's "Round 2 onward" describes which round's Cleanup performs the step, it isn't retroactive). Rolling "at or below 0" stays mathematically impossible, so the roll (drawn as 1d10 → 10, irrelevant either way) still can't spawn a Boss. **No Boss again.**
- *Event draw*: 2 cards — **Chain of Command** (Round Effect: all unit HP and Damage = their Rank total. Complete: outrank enemies in each lane at start of combat. Reward: promote the lowest-rank player. Fail: demote the highest-rank player) and **Forced Re-Armament** (equipment costs doubled this round; complete by buying a full new gear set for one unit). Voss picks **Chain of Command** — the reward (a free promotion) looked stronger than dodging Forced Re-Armament's fairly mild tax, especially with the team about to buy several units.
- *Mission Assignment*: pool size still 4 + Voss's Rank (Private = tier 2) = **6**, passed starting next to the commander (P3).

**Mission Assignment pool**: Breach [Private] (have a lane overrun), Armored Column [Captain], Untouchable [Colonel], Balanced Contribution V [Major], Iron Grip [Specialist], Balanced Contribution II [Private].

P3 immediately recognized **Breach**'s requirement was already true — Lanes 1 and 2 overran last round, and Missions Completion is an Anytime Action ("Missions can be completed at any time"), so P3 claimed it the instant it entered hand: **+3 all resources**, the Instant clause ("deal 2 less enemies next turn") ruled to apply to the *next round's* hoard rather than literally this instant, and — per "completing 1 mission = your rank will promote you at end of turn" — **P3 is promoted Conscript → Private at the end of Round 2**, independent of anything the active Event does.

Picks, in order (P3 → P4 → P1 → P2 → P3 → P4): P3 takes Breach (completed on the spot) and later Untouchable; P4 takes Balanced Contribution II and later Balanced Contribution V; P1 takes Armored Column; Voss takes Iron Grip.

### Worker Placement

All 4 lanes are sitting empty after Round 1's bloodbath, so this round's placements lean hard into re-arming. Voss (commander) again places 3 workers; everyone else places 2. Turn order: P3, P4, P1, P2, repeating.

| Pass | P3 | P4 | P1 | P2 (Voss) |
|---|---|---|---|---|
| 1 | Barracks | Medical Bay | Armory | Command |
| 2 | Barracks | Barracks | Barracks | Command |
| 3 (Voss bonus) | — | — | — | Battlefield |

**Barracks ends up with 4 workers** (P3 ×2, P4 ×1, P1 ×1) — a genuine sharing contest. Voss invoked **Commander's Call** here for the first meaningfully different outcome of the optional rule this game: rather than defaulting to lowest-Rank-gets-priority (which would have favored P3, already a Conscript like everyone but about to promote anyway), she assigned the two full-income slots to **P4 and P1** — the two players who'd otherwise be left with the worst Barracks return, since they only had 1 worker there each, while P3's 2 workers would still net the same total either way. P3 took both half-income slots instead.

### Income Generation

- **Barracks** (total shop rank: Stubborn Recruit 2 + Pack Mule 2 + Civilian Scout 1 + Rookie Technician 2 = **7**): P4 and P1 (full income, by Commander's Call) each get **+7 Tech/+7 Organic**; P3's two workers (half income each, 7÷2=3 rounded down) get **+3 Tech/+3 Organic apiece (+6/+6 total)**.
- **Armory** (shop rank: Scoped Weapons 1 + Basic Armor 2 = 3, income = 2×total): P1 gets **+6 Tech**.
- **Medical Bay** (P4): no injured units yet, flat **+1 Organic**.
- **Command** (Voss, 2 workers, Private = rank tier 2 per worker): **+2 resources of choice per worker**, chosen as Organic again → **+4 Organic**.
- **Battlefield** (Voss, 1 worker, solo): **+1 Organic/+1 Tech/+1 Alien to the Command pool** (not to Voss directly).

| Player | Organic | Tech | Alien |
|---|---|---|---|
| P1 (Reyes) | 0+7=7 | 8+6+7=21 | 3 |
| P2 (Voss) | 7+4=11 | 4 | 3 |
| P3 (Adeyemi) | 6+6=12 | 9+6=15 | 3 |
| P4 (Kowalski) | 6+1+7=14 | 5+7=12 | 3 |

Command pool: **O5/T3/A3** (carried over O4/T2/A2 from Round 1, +1/+1/+1 from Voss's Battlefield worker).

### Purchasing

- **P1** buys *Stubborn Recruit* (O3/T1, Private) for Lane 1, and equips *Scoped Weapons* (O1/T2, Conscript, "can target reserve") onto it — gear stats are additive on top of the unit's own line, giving a combined **DMG5/HP4**. Remaining: O3/T18/A3.
- **P3** buys *Pack Mule* (O3/T1, Private) for Lane 3. Remaining: O9/T14/A3.
- **P4** buys *Rookie Technician* (O3/T1, Private) for Lane 4, equips the *Basic Medkit* already sitting in hand from Round 1's retirement (equipping is always free) for a combined **DMG3/HP4**. Remaining: O11/T11/A3.
- **P2 (Voss)** buys *Civilian Scout* (O1, Conscript, Scout-type) for Lane 2 — cheapest available body, though its own card text reads "Cannot equip gear," so the Grenades sitting in her hand stay unused again. Remaining: O10/T4/A3.

This bought out all 4 Barracks slots and 1 of 2 Armory slots. The Conscript/Private pool of unique unit cards is now fully exhausted (every one has been bought at least once across the two rounds), so Voss's Direct Fill refill reaches into **Sergeant** (still legal — Direct Fill covers "Conscript, Private, or Sergeant," i.e. Rank 1-3) for the first time: **Breacher, Marksman, Gunner, Flamethrower** (all Sergeant Infantry, DMG3/HP3) fill Barracks, and **Artillery Strike** (Sergeant gear) fills the open Armory slot.

### Command Donations

Voss donates **3 Organic**, bringing the Command pool to **O8/T3/A3** — which happens to exactly match Containment Protocol's build cost (O8/T3/A3, unlocking Containment Block's holding cells). Nobody at the table currently holds that specific Command Card, though, and only the commander may spend the pool on a card's Upgrade function — so the funds sit banked rather than getting spent immediately. Voss: O7/T4/A3 after the donation.

### Deployment Stage

No injured units to heal. No Scout-type unit has been donated to Command yet (everyone kept their Scout-tagged units in their own lanes instead), so Assign Scouts is skipped again. Lanes reload:

| Lane | Active unit |
|---|---|
| 1 (Reyes) | Stubborn Recruit + Scoped Weapons → **DMG5/HP4** |
| 2 (Voss) | Civilian Scout → **DMG1/HP1** |
| 3 (Adeyemi) | Pack Mule → **DMG2/HP2** |
| 4 (Kowalski) | Rookie Technician + Basic Medkit → **DMG3/HP4** |

Enemy draw: Player Progress is still 0, so hoard size stays at the Normal-difficulty base of 3/lane; Enemy Progress is still 0, so Fodder rank again. Reserves dealt: Lane 1 — Pests, Ticks, Ticks. Lane 2 — Pests, Ticks, Pests. Lane 3 — Ticks, Pests, Pests. Lane 4 — Ticks, Pests, Ticks.

### Combat Stage

**A genuine wrinkle from the active Event**: Chain of Command's Round Effect ("All unit HP and Damage = their Rank total") needed a ruling on what scale "Rank total" reads from for two different audiences. Ruling adopted: each side uses its own Rank scale's tier number — players from Conscript(1)...Brigadier(8), enemies from Fodder(1)...Conqueror(7) — applied to the unit/enemy's **base** stat line, with any equipped gear's own Damage/HP still adding on top afterward (gear is a separate card, not the unit itself). At this specific point in the game the effect turned out to be a complete coincidence no-op: every player unit fielded this round is Private (tier 2, base DMG2/HP2) or Conscript (tier 1, base DMG1/HP1) — both of which already equal their own tier number — and Fodder enemies are DMG1/HP1, matching Fodder's tier 1 exactly. So combat math this round is identical to what it would have been without the Event; only the Event's win/fail condition (see below) actually mattered.

Voss chose to resolve **Lane 2 first** this round (the weakest lane, to see the worst case early), then Lane 4, Lane 1, Lane 3.

**Lane 2 (Voss).** Civilian Scout (DMG1/HP1) vs. the lane's own Pests (1st Pest revealed board-wide, 0 others up, so no bonus, DMG1): simultaneous trade — Scout kills Pests, Pests' 1 damage kills Scout. **Both die.** No reserve in Lane 2; the remaining Ticks and 2nd Pests simply sit unopposed. **Overrun.**

**Lane 4 (Kowalski).** Rookie Technician+Medkit (DMG3/HP4) vs. Ticks (lose 1 Organic each, DMG1): kills it, takes 1 (HP4→3). vs. Pests (2nd revealed board-wide, 1 other already up from Lane 2 → +1 damage, DMG2): kills it, takes 2 (HP3→1). vs. Ticks (lose 1 Organic again, DMG1): kills it, takes 1 (HP1→0, dies). **Lane 4 clears all 3 enemies but loses its unit on the very last exchange** — Rookie Technician and the equipped Basic Medkit both go down together.

**Lane 1 (Reyes).** Stubborn Recruit+Scoped Weapons (DMG5/HP4) vs. Pests (3rd revealed board-wide, 2 others up → +2 damage, DMG3): kills it, takes 3 (HP4→1). vs. Ticks (lose 1 Organic, DMG1): kills it, takes 1 (HP1→0, dies). No reserve; the final Ticks overruns unopposed. **Overrun.**

**Lane 3 (Adeyemi).** Pack Mule (DMG2/HP2) vs. Ticks (lose 1 Organic, DMG1): kills it, takes 1 (HP2→1). vs. Pests (4th revealed board-wide, 3 others up → +3 damage, DMG4): Mule deals 2 (kills the 1-HP Pests), Pests deals 4 (Mule HP1 → dead, heavy overkill). No reserve; the final Pests (5th board-wide) overruns unopposed. **Overrun.**

Only Lane 4 fully cleared its hoard this round — and even that cost its unit. Lanes 1, 2, and 3 all overran.

### Cleanup Stage

**Managing the dead** — with no Honorable-Discharge-style Event active this round, these are genuine combat deaths, not retirements: **Stubborn Recruit** (Lane 1, died with Scoped Weapons still equipped), **Civilian Scout** (Lane 2), **Pack Mule** (Lane 3) all go to the Graveyard. This is the first real test of the open question about equipped gear surviving a unit's death — applying the provisional ruling from Round 1 (gear is lost alongside a unit that dies in combat, since only the Retire path's text mentions returning items to hand), **Scoped Weapons goes to Recycling** along with Stubborn Recruit. Rookie Technician (Lane 4) and its Basic Medkit also died this round and likewise go to Graveyard/Recycling respectively — Lane 4 cleared its enemies but didn't keep its unit alive doing it.

**Overrunning lanes**: Lanes 1, 2, and 3 overran. **Overrun Tracker: 8 − 3 = 5.**

**Event Resolution**: Chain of Command's Complete condition needed every lane to outrank its enemy at the start of combat. Checking tier numbers: Lane 1 Stubborn Recruit (Private=2) vs. Pests (Fodder=1) — outranks. Lane 3 Pack Mule (Private=2) vs. Ticks (Fodder=1) — outranks. Lane 4 Rookie Technician (Private=2) vs. Ticks (Fodder=1) — outranks. **Lane 2's Civilian Scout (Conscript=1) vs. Pests (Fodder=1) is a tie, not an outrank.** Since the condition requires it in *each* lane, one tied lane sinks the whole check. **Event fails.** Failure Penalty: demote the highest-rank player — that's Voss (the only Private at the table) — **Voss demoted Private → Conscript.**

**Promotions**: the commander-granted promotion only triggers "if the event passed" — it didn't, so no promotion from that path this round. However, **P3's Breach mission completion earlier in Planning is a separate, Anytime-Action-driven promotion** ("completing 1 mission = your rank will promote you") that doesn't depend on the Event at all: **P3 promoted Conscript → Private at end of Round 2.** Both the Event's demotion and the Mission's promotion land in the same round, on different players, for unrelated reasons — a clean illustration that these two promotion/demotion paths are genuinely independent systems.

**Command Card refill**: P1, P3, P4 all sit at their 2-card cap, no draw. Voss (commander, cap 3) is still holding 4 from Round 1's Leader bonus — over cap, so still no draw; refill never discards down.

**Escalate**: Round 2 is the first round this step actually fires (it's explicitly skipped only on Round 1). Enemy Progress: 0 → **1**. Player Progress: not all lanes survived (3 of 4 overran) → stays at **0**.

**Commander for Round 3**: Voss placed the first worker at Command again this round, so **Voss holds over as commander for Round 3** — interestingly, despite having just been demoted back to Conscript by Chain of Command's failure. The commander role tracks who claimed the Command worker slot, not current Rank, so a demotion doesn't unseat a sitting commander.

### Round 2 Summary

| Track | Value |
|---|---|
| Player Progress | 0 |
| Enemy Progress | 1 |
| Overrun Tracker | 5 / 10 |
| Boss active | No |
| Commander next round | Voss (Conscript again, holds over) |

| Player | Rank | Organic | Tech | Alien | Lane status |
|---|---|---|---|---|---|
| P1 Reyes | Conscript | 3 | 18 | 3 | Empty (Recruit + Scoped Weapons both died) |
| P2 Voss | Conscript (demoted) | 7 | 4 | 3 | Empty (Scout died) |
| P3 Adeyemi | **Private (promoted)** | 9 | 14 | 3 | Empty (Pack Mule died) |
| P4 Kowalski | Conscript | 11 | 11 | 3 | Empty (Technician + Medkit both died) |

Two rounds in, the Overrun Tracker has dropped from 10 to 5 — half gone — entirely from Fodder-rank Pests/Ticks chip damage and a string of 1-for-1 trades that keep leaving lanes empty going into the next round's enemy draw. Every lane has been wiped out both rounds running. The team has spent both rounds' full income on rearming rather than ever getting ahead of the curve. This is the clearest early signal in the game so far: starting Conscript/Private stat lines (DMG1-2/HP1-2) are barely keeping pace with Fodder's DMG1/HP1 floor once Pests' reveal-stacking passive is in play, and a single empty lane (no Reserve unit queued up) is an automatic, guaranteed overrun the instant its Active unit dies, regardless of how the other 2 enemies in that lane's hoard would have gone. Queuing a Reserve unit, not just an Active one, looks like a near-mandatory move going forward.

---

## Round 3

From here on, well-established mechanics (income formulas, the basic Worker Placement/Purchasing/refill loop, Reveal-trigger combat) get a shorter writeup unless something plays out differently than before. Full detail returns whenever a new wrinkle shows up.

### Planning Stage

Voss holds over as commander again (3rd round running). Boss roll: Enemy Progress is 1 entering this round; rolled 1d10 → 8, which is above 1, so still **no Boss**. Event draw: **Cheap Knockoffs** (all income converted to Tech this round; complete by returning 10 Tech to supply) vs. **Weapons Allocation Freeze** (double Weapon Active-effect costs; complete if every lane's Active unit has Weapon-type gear). Voss picked **Weapons Allocation Freeze** — Cheap Knockoffs would have starved the team of the Organic they badly need for unit purchases, while nobody currently has a Weapon-Active-effect to double the cost of anyway.

Mission Assignment pool (6 cards): Organic export 1 [Conscript], Command Vanguard [Major], Balanced Contribution VI [Specialist], Enemy Momentum II [Major], Collapse [Major], Giant Slayer [Private]. **Collapse**'s requirement ("have 2 lanes overrun") was already true twice over by this point, but its bracketed Rank (Major) gates *completion*, not just pickup — nobody's Major yet, so P4 banked it for later rather than completing it now. **P3 claimed Organic export 1 on the spot** (Conscript-rank, immediately completable): paid 5 Organic to supply, received the +5 Organic reward back, and used the Instant clause to gift 5 Organic to P1 (the player sitting lowest on Organic that round). Completing a mission promotes regardless of rank gate on the card itself — **P3 promoted Private → Sergeant** at end of Round 3, P3's second promotion in three rounds purely from missions, completely independent of the Event's promotion/demotion path.

### Worker Placement, Income, Purchasing

Heavy Barracks investment again, with Voss invoking **Commander's Call** a second time to steer the 4-worker Barracks contention toward P1 and P4 (full income) over P3/herself (half each) — same logic as Round 2, favoring whoever's currently weakest on resources rather than defaulting to lowest-Rank-first. Barracks shop rank totaled 12 (four Sergeant-rank units at tier 3 each), so full-income workers picked up +12 Tech/+12 Organic apiece, half-income +6/+6.

Resources climbed sharply across the board (P1 ended pre-purchase at O20/T40/A3, P4 at O24/T23/A3) — the team is now solidly affording Sergeant-rank cards (DMG3/HP3, cost O6/T2) instead of scraping by on Conscript/Private bodies. **Purchasing priority this round explicitly targeted filling BOTH Active and Reserve slots**, directly responding to the pattern from Rounds 1-2 where every empty-reserve lane auto-overran the instant its lone unit died:

- P3 bought **Breacher** (Sergeant, stun on full-HP hit) — Active only, no Reserve this round (lower funds than P1/P4).
- P4 bought **Marksman** and **Gunner** (both Sergeant) — Active + Reserve.
- P1 bought **Flamethrower** and **Technician** (both Sergeant), plus **Basic Armor** (Private gear, +7 HP, no Damage) equipped onto Flamethrower — Active + Reserve, with the Active unit now tanky at DMG3/HP10.
- Voss bought **Scout** (Sergeant, Mobile, Scout-type — finally a Scout unit, though she chose to field it in her own empty lane rather than donate it to Command this round) plus **Artillery Strike** (Sergeant Consumable, Active: deal 10 damage to Active enemies) — Active only, no Reserve.

The Conscript/Private/Sergeant Infantry name pool is now fully cycled at least once (all 6 Sergeant names — Gunner, Technician, Marksman, Breacher, Flamethrower, Scout — have appeared in the shop across Rounds 2-3), so several of this round's refills were repeat copies of names already seen, consistent with the established multi-copy pattern (Pests/Ticks, duplicate Command Cards) rather than treating any unit name as a one-of. End-of-round shop: Barracks — Technician, Scout, Marksman, Breacher (all Sergeant); Armory — Advanced Armor, Reinforced Barrels (fresh names, Sergeant/Conscript).

Voss donated 2 Organic to Command (pool now O11/T4/A4) — still nobody holds Containment Protocol to spend it on, so it stays banked.

### Deployment & Combat

| Lane | Active | Reserve |
|---|---|---|
| 1 (Reyes) | Flamethrower + Basic Armor → DMG3/HP10 | Technician (DMG3/HP3) |
| 2 (Voss) | Scout → DMG3/HP3 | — |
| 3 (Adeyemi) | Breacher → DMG3/HP3 | — |
| 4 (Kowalski) | Marksman → DMG3/HP3 | Gunner (DMG3/HP3) |

Enemy draw uses the Enemy Progress value carried in from the *previous* round's Cleanup — Round 3's Deployment Stage draws with Enemy Progress still at **1** (it only escalates to 2 at the end of this same round's own Cleanup, too late to affect this round's own draw). So Round 3 still draws **Fodder** rank (band 0-1); it's **Round 4** that will be the first to draw from the **Grunt** pile (band 2-3) now that Enemy Progress sits at 2 going in. Worth flagging explicitly so the Fodder→Grunt transition lands on the correct round rather than one round early.

Reserves dealt (3/lane, Fodder): L1 Pests/Ticks/Pests, L2 Ticks/Pests/Ticks, L3 Ticks/Pests/Ticks, L4 Pests/Ticks/Pests.

Resolution order (Voss's choice): Lane 3 → Lane 2 → Lane 1 → Lane 4.

- **Lane 3**: Breacher (DMG3/HP3) clears Ticks → Pests (1st board-wide) → Ticks, taking 1 each time (HP3→2→1→0). **Clears all 3 enemies, dies on the last one.** A cleared lane does not overrun even though the unit didn't survive.
- **Lane 2**: Scout (DMG3/HP3) clears Ticks (HP3→2), then Pests (2nd board-wide, +1 dmg → DMG2, HP2→0, dies). No Reserve — **the final Ticks overruns unopposed.**
- **Lane 1**: Flamethrower+Armor (DMG3/HP10) clears Pests (3rd board-wide, +2 → DMG3, HP10→7), Ticks (HP7→6), Pests (4th board-wide, +3 → DMG4, HP6→2). **Clears all 3, survives at HP2/10** — the first unit this game to come out of combat still standing with damage on it rather than dying or never being touched. Basic Armor's flat +7 HP is what made the difference.
- **Lane 4**: Marksman (DMG3/HP3) faces Pests first this time (5th board-wide, +4 → DMG5) and dies outright on the very first exchange despite dealing the killing blow back. Reserve Gunner promotes, clears Ticks (HP3→2), then meets Pests again (6th board-wide, +5 → **DMG6**) and also dies, trading down to the last point. **Clears all 3, but loses both units** — a direct, visible demonstration of how punishing it is to be the last lane resolved in a round with several Pests in play.

### Cleanup Stage

Overrun lanes: only Lane 2. **Overrun Tracker: 5 − 1 = 4** — under half of its Round 1 starting value, after just 3 rounds. Graveyard gains Breacher, Scout, Marksman, Gunner; Recycling gains Artillery Strike (lost with Scout, never activated — its O3/T6/A1 cost was never paid since the unit died before anyone chose to use it). Flamethrower+Basic Armor and the untouched Technician (still in Reserve, never promoted to Active) are this game's first units to survive a full round of combat.

Event (Weapons Allocation Freeze) needed every lane's Active unit to carry Weapon-type gear — none did (Basic Armor is Armor-type, Artillery Strike is Consumable-type) — **fails**. Failure penalty (Tech-cost to activate Weapon Actives going forward) is currently moot with no Weapon actives on the board. No commander-granted promotion (event failed), but P3's mission-driven promotion from Planning Stage still lands at end of round regardless: **Sergeant**, confirmed.

Command Card refill: everyone at or over cap, no draws. Escalate: Enemy Progress 1→**2** (this is the value that will govern Round 4's enemy draw — see the Grunt-rank note above). Player Progress stays **0** (Lane 2 overran).

Commander for Round 4: Voss holds over again.

### Round 3 Summary

| Track | Value |
|---|---|
| Player Progress | 0 |
| Enemy Progress | 2 (Round 4 draws from **Grunt** rank for the first time) |
| Overrun Tracker | 4 / 10 |
| Boss active | No |

| Player | Rank | Organic | Tech | Alien | Lane status |
|---|---|---|---|---|---|
| P1 Reyes | Conscript | 6 | 32 | 3 | Flamethrower+Armor (HP2/10) Active, Technician (HP3/3) Reserve |
| P2 Voss | Conscript | 4 | 2 | 2 | Empty (Scout died) |
| P3 Adeyemi | **Sergeant** | 9 | 18 | 3 | Empty (Breacher died, lane cleared) |
| P4 Kowalski | Conscript | 12 | 19 | 3 | Empty (both units died, lane cleared) |

Three rounds in, the Overrun Tracker sits at 4/10 — a single more bad round away from real danger, even though the team's resource economy is now thriving (P1 and P4 are both sitting on 19-32 Tech apiece) and P3 has quietly promoted twice already through missions alone, untouched by combat losses. The gap between "the team's economy is healthy" and "the team's board state is healthy" is the headline finding of these first 3 rounds: gold/resources have never been the bottleneck, but keeping any unit alive past 1 round of Fodder combat has been the real struggle, and Pests' board-wide reveal-stacking passive is the single biggest swing factor in whether a given lane survives clean or gets ground down — almost independent of how good a player's purchases were that round.

---

## Round 4 — Total Collapse

### Planning Stage

Voss holds over as commander a 4th straight round. Boss roll (Enemy Progress 2 entering this round): 1d10 → 7, above 2, **no Boss**. Event draw: **Utility Recall** (unequip all Utility gear when drawn; complete by having no Utility equipped at end of round) vs. **Hurricane X** (all Active non-Vehicle units stunned at start of combat; complete with 2 Active Vehicles). With no Vehicle Bay unlocked and therefore zero Vehicles possible, Hurricane X would have stunned literally every Active unit on the board — Voss picked Utility Recall instead, which does nothing this round since nobody had Utility-type gear equipped anyway.

Mission Assignment drew a pool sized off Voss's rank — a bookkeeping slip drew 7 cards instead of the correct 5 (4 players + Voss's Conscript tier-1), noted here rather than re-shuffled back in. **P3 (Sergeant)** received **Full Export 3** [Sergeant] at-rank but couldn't yet afford its 15-of-each-resource cost (only 3 Alien on hand) — banked. Nobody completed a mission this round.

### Worker Placement, Income, Purchasing

Resources continued climbing fast (P3 and P4 both crossed 25-36 in their main resources after income), letting every player except Voss field 2 units this round — explicitly targeting Active+Reserve depth in every lane after three straight rounds of empty-lane overruns. Final lane setups going into Deployment:

| Lane | Active | Reserve |
|---|---|---|
| 1 (Reyes) | Flamethrower + Basic Armor — DMG3/HP2 *(damage carried over from Round 3, never healed)* | Technician + Advanced Armor — DMG3/HP13/Armor1 |
| 2 (Voss) | **Empty** — Voss's purchasing went toward a gear item instead of a unit; her remaining O5/T0/A2 fell just short of a fresh Sergeant unit's O6/T2 cost | — |
| 3 (Adeyemi) | Technician + Reinforced Barrels — DMG6/HP5 | Scout — DMG3/HP3, Mobile |
| 4 (Kowalski) | Marksman — DMG3/HP3, Long Range | Breacher — DMG3/HP3 |

Voss's empty lane this round is a direct, organic consequence of her resource situation rather than a forced outcome: she's spent 4 rounds running Command worker duty (rank-based income, only +1-2/worker at Conscript) instead of the higher-yield Barracks, and donating modestly to the Command pool on top of that, leaving her chronically behind on raw purchasing power compared to teammates who worked Barracks instead.

### Deployment Stage — Enemy Draw (first Grunt-rank enemies)

Enemy Progress reads **2** this round (it escalated 1→2 at the end of Round 3's own Cleanup) — the first round to draw from the **Grunt** pile (band 2-3) instead of Fodder. Grunt-rank enemies are a serious step up: DMG3-6/HP3-9, several with board-altering Reveal effects instead of Fodder's mostly-cosmetic ones. Reserves dealt (3/lane, Player Progress still 0 so hoard size stays at base):

| Lane | Reserve (draw order) |
|---|---|
| 1 | Lance Turret (DMG6/HP9, Reveal: swap to the lane with the lowest-damage active unit), Cleric (DMG4/HP6, Reveal: retreat to reserve + shield active enemies by 5), Lancer (DMG5/HP4, Reveal: deal 2× attack damage to active+reserve units in this lane, Passive: pierce up to 2 Armor) |
| 2 | Grunt (DMG4/HP5, Reveal: deal 2× attack damage to **all lanes**), Gloom (DMG5/HP7, no Reveal, Passive: prevents ability activation in lane), Wasp (DMG3/HP3) |
| 3 | Scorpions (DMG5/HP4, Reveal: deal 2× attack damage to the Scout), Hound (DMG5/HP7, Reveal: deal 10 damage to the lowest-HP unit, Passive: attacks twice), Scorpions again |
| 4 | Gloom (DMG5/HP7), Grunt (DMG4/HP5, same all-lanes Reveal as above), Lancer |

### Combat Stage — multiple genuine sequencing rulings needed

This round forced several real rules questions that the base text doesn't cleanly answer, all logged below. The short version of each ruling actually used:

- **Enemy Scouting only flips the top card of each lane simultaneously** — it is not a cascading reveal of an entire lane's reserve at once. Subsequent cards only reveal later, when they're promoted into Active (whether because the prior occupant died in combat, or — as ruled here — because it left Active some other way, like Lance Turret's swap or Cleric's retreat).
- **A reveal-driven departure (swap/retreat, not death) still triggers exactly one replacement promotion**, and that replacement is itself revealed (since it was face-down) — but a chain of three reveals from one Scouting flip felt like more cascade than the rules intend, so this is flagged as a genuine open question rather than treated as fully settled.
- **Hound's "deal 10 damage to the lowest-HP unit" and Grunt's "deal 2× attack damage to all lanes"** were both read as targeting the **player** side specifically (consistent with every other enemy Reveal that targets player resources/units rather than other enemies), and Grunt's effect was read as hitting each lane's current Active **player** unit, not the enemy side.
- **Scorpions' "deal 2× damage to the Scout"** had no valid target all game — nobody ever assigned a unit to the Command Scout slot (Assign Scouts has been skipped every round, no Scout-type unit was ever donated) — so this Reveal simply fizzled both times it appeared.

**Lane 1** (Reyes): Lance Turret reveals and swaps itself to **Lane 2** (the empty lane — an empty lane's "active unit damage" was read as 0, the lowest possible, so Lance Turret always prefers an undefended lane the instant one exists). Cleric promotes into the gap, reveals, and immediately retreats to reserve (shielding the *enemy* side by 5, achieving nothing useful against an empty slot). Lancer promotes in behind it and reveals: **10 damage to every unit in Lane 1**, active and reserve alike. Flamethrower (HP2) dies outright. Technician+Advanced Armor (HP13, Armor1) takes the hit at full force — Lancer's Passive pierces up to 2 Armor, and Technician only has 1, so the pierce fully bypasses it — dropping Technician to HP3. Technician promotes to fill the now-empty Active slot and immediately fights Lancer: Technician deals 3 (Lancer HP4→1, survives), Lancer deals 5, pierces the 1 Armor completely, Technician (HP3) dies. **Lane 1 overruns** with Lancer still alive at HP1 and no reserve left to answer it.

**Lane 2** (Voss): already overrun by simply having no unit — Lance Turret's arrival (DMG6/HP9) didn't change the outcome, just the specific enemy now sitting there unopposed.

**Lane 3** (Adeyemi): Scorpions' Reveal fizzles (no Scout target). Technician+Reinforced Barrels (DMG6/HP5) trades with Scorpions (DMG5/HP4): both die simultaneously. Scout (DMG3/HP3, Mobile) promotes from Reserve to face **Hound** (DMG5/HP7). Hound's Reveal fires first — 10 damage to the lowest-HP player unit board-wide. At this exact moment in resolution order, Scout (HP3) is the only player unit still standing anywhere on the board, so it takes the full 10 and dies before ever swinging at Hound. **Lane 3 overruns**, with Hound and a 2nd Scorpions still in reserve, completely unopposed.

**Lane 4** (Kowalski): before Lane 4 even gets resolved in Combat Cycle order, Lane 2's Grunt reveal (2× attack = 8 damage to every lane's Active player unit) has already killed Marksman (HP3) outright as collateral from a different lane entirely. Breacher (DMG3/HP3) promotes from Reserve to face Gloom (DMG5/HP7): Breacher deals 3 (Gloom HP7→4, survives), Gloom deals 5 (Breacher HP3→dead). **Lane 4 overruns**, with Gloom at HP4 plus a fresh Grunt and Lancer still in reserve, unopposed.

### Cleanup Stage — Game Over

**All 4 lanes overran this round.** Overrun Tracker: 4 − 4 = **0**.

> **The Overrun Tracker has reached 0. The game is lost.**

The collapse traces to one structural fact: Grunt rank's Reveal effects hit far harder and wider than anything Fodder rank does, and they specifically punish exactly the team's weakest points — Lance Turret seeks out the lowest-damage lane (the empty one), Grunt's "all lanes" Reveal deals flat unavoidable damage to every Active unit regardless of that lane's own fight, and Hound snipes whatever's lowest on HP board-wide. A team that had spent 3 rounds building up Sergeant-tier DMG3/HP3 bodies (correctly responding to Fodder-tier threats) walked into Grunt rank with units that mostly die to a single Reveal before they even get to swing — the team's gear/Rank pace and the enemy Rank-band pace were badly out of sync at exactly this transition point.

---

## End of Game

### Final Outcome: **LOSS** — Overrun Tracker reached 0 at the end of Round 4

| Track | Final Value |
|---|---|
| Player Progress | 0 (never advanced past Round 1 — every round had at least one overrun) |
| Enemy Progress | 2 (Grunt rank, T1 had it been a Boss round) |
| Overrun Tracker | **0 / 10** — loss condition met |
| Rounds played | 4 |
| Boss encountered | No — Enemy Progress never climbed high enough for a spawn roll to have any real chance, and rolls of 10, 8, 7 across the 3 attempts that could fire all landed safely above the (very low) threshold anyway |

### Mission Completions

| Player | Missions completed | Notes |
|---|---|---|
| P1 (Reyes) | 0 | Held Full Export 4, Armored Column, Giant Slayer, War Hero — all banked, none affordable/at-rank in time |
| P2 (Voss) | 0 | Held Maintain Morale, Iron Grip, Organic Contribution III, Enemy Momentum II — all aspirational, never close |
| P3 (Adeyemi) | **2** — Breach (Round 2), Organic Export 1 (Round 3) | Both immediately-completable Conscript/Private-rank missions, claimed the instant they entered hand. Promoted twice purely from missions, untouched by the team's combat losses — the standout individual performance of the game |
| P4 (Kowalski) | 0 | Held Organic Export 3, Xenobiology Delivered V, Balanced Contribution II/V, Collapse, Battlefield Dominance — all banked, none completed |

### Secret Objective Reveal

All eight cards this game were genuinely Allied or Neutral — there was no hidden antagonist to catch, and the team's loss was entirely a straightforward difficulty/pacing problem, not sabotage.

| Player | Secret Objectives | Achieved? |
|---|---|---|
| **P1 (Reyes)** | **Hunter** [Neutral] — Kill enemies with active abilities or items | **No.** Every kill this game was a base-stat combat trade; no unit ever activated an ability or item to land a kill. |
| | **Adventurer** [Allied] — Game ends with you completing 6 missions | **No.** P1 completed 0 missions. |
| **P2 (Voss)** | **Collector** [Neutral] — Stockpile 20 Alien | **No.** Voss peaked around 3 Alien and ended the game at 0, having donated her last 2 to Command in Round 4. |
| | **Armorer** [Allied] — Equip 10 Gear to allies' lanes | **No.** Voss equipped only a handful of items across the game (Grenades never used, Civilian Scout couldn't equip gear at all, Artillery Strike and Reinforced Barrels both went onto her own lane) — nowhere close to 10, and mostly her own lane rather than allies'. |
| **P3 (Adeyemi)** | **Architect** [Neutral] — Fully upgrade 3 buildings | **No.** Zero Location Upgrades were built anywhere on the board all game — the Command pool sat banked at O13/T6/A8 by the end, but nobody at the table ever held a matching buildable Command Card for a location they wanted to commit to. |
| | **Decorated** [Allied] — Complete game at Rank 5 (Major) or higher | **No.** P3 reached Sergeant (tier 3) by game's end via 2 mission-driven promotions — closest anyone got to a Rank-based objective, but still 2 tiers short. |
| **P4 (Kowalski)** | **Survivor** [Neutral] — Active unit survives 3 rounds | **No.** No single unit survived more than 1-2 rounds before dying or being lost to an overrun; the closest was Lane 1's Flamethrower, which survived Round 3 (entering it fresh, leaving at HP2) but died outright at the start of Round 4 to Lancer's Reveal before ever fighting again. |
| | **Minimalist** [Neutral] — End game with 3+ empty upgrade slots | **Yes** — but essentially by default. With zero Location Upgrades ever built across all 6 locations (Armory 1 slot, Medical Bay 2, Command 2, Battlefield 3, Containment Block 3, Barracks 4 — all sitting completely empty), this objective was trivially satisfied without Kowalski doing anything to specifically pursue it. |

Only one Secret Objective was achieved this game, and it was the one that rewarded inaction rather than active pursuit — a side effect of nobody ever prioritizing Location Upgrades over rearming dead lanes, not a deliberate strategy.

### Vote of No Confidence

**Never invoked.** Nothing in this game's fiction ever plausibly justified an accusation — the team was uniformly busy fighting for survival rather than suspecting each other, and the game ended (in a loss) before any extended mid-game lull where suspicion might have had room to form. Since every Secret Objective this game was genuinely Allied/Neutral, any accusation that had been raised would necessarily have been false by construction — this game simply never produced the social conditions to test that path at all.

### Retrospective

**Pacing**: this was a short, brutal game — 4 rounds from setup to total loss, with the Overrun Tracker bleeding 2, 3, 1, and then 4 lanes' worth of damage across those rounds respectively (10 → 8 → 5 → 4 → 0). The Round 1-2 chip damage from Fodder-rank Pests/Ticks already cost half the starting Overrun Tracker before any "real" enemy ever appeared — and then the very first Grunt-rank round wiped the rest out in one clean sweep.

**What felt too strong**: Grunt rank's Reveal effects, as a category, are dramatically more impactful than Fodder's. Where Fodder's worst Reveal is "each player loses 1 Organic," Grunt rank has "deal 2× attack damage to all lanes" (an unavoidable, no-counterplay flat hit to every lane's defender, completely independent of how that lane's own fight is going), "deal 10 damage to the lowest-HP unit" (a precision snipe that specifically punishes having any damaged survivor anywhere on the board), and a self-relocating tank that always seeks out whichever lane is currently weakest. Any one of these would be a notable step up from Fodder; having all of them appear in the very first Grunt-rank round, with the team still on its first round of Sergeant-tier (DMG3/HP3) units, reads as a real spike rather than a smooth ramp.

**What felt too weak**: Boss spawning never got a real test — Enemy Progress stayed low enough (capping at 2 before the loss) that the spawn roll was never seriously in danger of succeeding. This game ended before Bosses, Location Upgrades, Containment Block, or the Vehicle/Mech Bay expansions were ever meaningfully exercised — a longer or less brutal game would be needed to test those systems.

**What felt swingy**: Pests' board-wide reveal-stacking passive (see Open Rules Questions #1) meant the same Fodder card could deal anywhere from 1 to 6 damage purely based on how many other Pests happened to get revealed earlier the same round — a huge variance band for what's supposed to be the game's gentlest enemy tier, and one that punishes whichever lane the commander happens to resolve last, almost independent of that lane's own preparation.

**What felt genuinely broken / most actionable finding**: the gap between Fodder and Grunt rank, as written, is not a gradual ramp — it's a cliff. The team never struggled on resources (everyone was sitting on double-digit Tech/Organic by Round 3-4) and was making reasonable, defensible purchasing decisions each round (Active+Reserve in every lane, upgrading from Private to Sergeant-tier units as soon as affordable) — and still lost outright the moment Grunt rank's Reveal effects came into play, in the very first round they appeared. If this pattern holds across the other two games in this batch, the Fodder→Grunt transition (Enemy Progress 1→2, typically Round 3-4 under Normal's escalation schedule) deserves a specific look — either softening Grunt's Reveal effects, slowing the Enemy Progress ramp, or giving players a clearer signal/window to gear up specifically for Reveal-heavy threats before they arrive.

---

## Open Rules Questions Found

1. **Pests' Passive scope ("+1 damage for each other revealed Pest")** — not stated as lane-local or board-wide. Ruled board-wide, accumulating in actual lane-resolution order, for this game (see Rounds 1-3 Combat Stages). This produced a real swing every round it came up: a flat 1-damage Fodder enemy hit as hard as DMG6 by the 6th Pests revealed in a single round. Needs an explicit ruling, especially since higher Player Progress raises hoard size per lane (up to 5/lane at Normal, 20 total reveals possible across 4 lanes) — under the board-wide reading this card could spike dramatically harder in a busy mid-game round than it ever did in this short game.
2. **Does equipped gear survive a unit's death in combat (not retirement)?** Retire from Duty explicitly returns equipped items to the owner's hand; the rules say nothing about whether gear is likewise salvageable when a unit dies in combat instead of retiring. Exercised repeatedly from Round 2 onward (Scoped Weapons with Stubborn Recruit, Basic Medkit with Rookie Technician, Advanced Armor with Technician in the final round) — under the provisional ruling applied here, gear is lost alongside its unit on a combat death, only surviving (returning to hand) on an explicit Retire. This is a real, recurring cost that makes gearing up a unit that might die this round meaningfully riskier than it would be if gear were salvageable on death.
3. **Chain of Command's "all unit HP and Damage = their Rank total" — whose Rank scale for enemies?** Enemies don't have a "Rank" in the player sense (Conscript...Brigadier); they have their own Enemy Rank Order (Fodder...Conqueror). Ruled that each side reads its own scale's tier number, with gear bonuses still applying on top of the Event-overridden base stat. Also needed a ruling on whether the Event's "outrank enemies in each lane" Complete condition compares those two different scales directly by tier number — used that reading here since no other comparable axis exists, but it's a real cross-scale comparison the base rules never spell out.
4. **Enemy Progress timing relative to its own round's enemy draw.** The Escalate step (Cleanup) that raises Enemy Progress to its new value happens *after* that same round's Deployment-Stage enemy draw already used the old value — meaning a round's own Escalate never affects its own enemy draw, only the next round's. This is the only internally consistent reading (the alternative would require Escalate to somehow run before Deployment within the same round, which isn't how the stage order is written), but it's worth making explicit since it's easy to misapply the new Enemy Progress value one round early (as this document's draft very nearly did for Round 3/4).
5. **Enemy Scouting's reveal cascade scope — does a Reveal-driven departure from Active (without dying, e.g. a swap or retreat effect) trigger a fresh reveal on whatever promotes into the vacated slot, and does that chain keep going?** Round 4's Lane 1 saw 3 enemies (Lance Turret, Cleric, Lancer) all effectively reveal in sequence within what should have been a single Enemy Scouting flip, because the first two left Active without dying. Ruled here that this chain is allowed and resolves immediately (each departure-without-death triggers exactly one more reveal, repeating until something actually stays in Active), but this could plausibly also be intended to cap at one promotion per round, or to defer subsequent reveals to later exchanges in the Combat Cycle instead of resolving them all during the upfront Scouting step. The base rules describe Enemy Scouting as moving "the top card" into Active, singular, which doesn't obviously anticipate a chain — this needs an explicit ruling, especially since enemy decks include several swap/retreat/movement Reveal effects exactly like the two that triggered this chain.
6. **Scope of multi-target enemy Reveal effects ("deal damage to all lanes," "deal damage to the lowest-HP unit") — player side only, or do they also affect enemies/other lanes' enemies?** Ruled both as targeting the player side exclusively (consistent with the general pattern that enemy Reveal effects target player resources/units, with explicit exceptions like "Stun enemies in adjacent lane" calling out enemies by name when that's genuinely intended). Also ruled that "all lanes" / "lowest-HP unit" effects can reach across lanes that have already finished resolving combat this round or haven't started yet, since the cards don't restrict themselves to "this lane" or "not-yet-resolved lanes." This produced one of the most decisive single effects in the whole game (Round 4's Grunt killing 2 full-HP Active units in lanes it wasn't even fighting in) and deserves a clear, explicit ruling rather than this game's best-guess reading.
7. **Can a player complete a Mission Card whose bracketed Rank is higher than their own current Rank, as long as the objective text is already true?** Treated the bracketed Rank as a completion gate (must be at least that Rank to claim the mission), not just a flavor label — e.g. Collapse [Major]'s "have 2 lanes overrun" condition was true from Round 2 onward, but P4 (never above Conscript this game) couldn't claim it. This reading seems the most consistent with Direct/Roll Fill and other Rank-gated systems in the rules, but the Missions Completion section itself doesn't explicitly state this, so it's logged here for confirmation.
