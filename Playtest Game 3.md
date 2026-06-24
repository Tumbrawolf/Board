# Playtest Game 3 — Full Walkthrough (Chaos Focus)

**Date played:** 2026-06-25
**Players:** 4 (all seats narrated by the same session; named Asha, Brett, Court, Dez for readability)
**Difficulty:** Normal (Overrun Tracker starts at 10, enemy hoard size 3/lane base)
**Optional rules in use:** Commander's Call (commander chooses who gets the full-income spot at a shared location, instead of default lowest-Rank-priority); Vote of No Confidence is available but not forced.
**Saboteur:** excluded from the Secret Objective pool entirely this game.
**Dealer seed:** 3003, align_mode `exclude_saboteur_guarantee_chaos`
**State file:** `scratchpad/state_game3.json` (isolated from the other two parallel playtest games)

## What this game is testing

Games 1 and 2 (run in parallel sessions) exercise the baseline ruleset and the Saboteur dynamic respectively. This game isolates **Chaos** instead: a Secret Objective alignment that, per the Secret Objective Cards data, asks for a quirky personal condition (e.g. "go into a round with only 1 unit in lane," "do not add units or equipment to any lane for 3 rounds") rather than wanting the team to outright lose. Chaos is *self-interested*, not *adversarial* — a Chaos player can complete their objective and still want the team to win the main game.

The specific rules interaction under the microscope is **Vote of No Confidence** (Anytime Actions): per the rule text, "Chaos is grouped with Saboteur here since both can work against the team's shared objective, even though Chaos isn't purely adversarial like Saboteur — the vote only cares whether the accusation correctly flagged a non-Allied threat, not which specific kind." That means a Vote of No Confidence resolves identically whether the accused is truly Saboteur or truly Chaos, even though the *experience* of playing each is very different at the table. This game is written to surface that gap honestly: the other three players only ever see observable behavior, never alignment labels.

By the luck of the deal, **two players** ended up Chaos-aligned this game (the dealer's guarantee only required at least one; we got two). Both are tracked as genuinely hidden information below — their true identities and objective text are withheld from the round-by-round narrative and revealed only in the End-of-Game section (or sooner if a Vote of No Confidence forces an earlier reveal).

---

## Setup

### Deck preparation

Per Managing Decks: Secret Objective, Missions, Events, Tactician, and Command Card decks were shuffled. The Enemy deck was split into Rank piles (Fodder/Grunt/Core/Advanced/Elite/General/Conqueror). Vehicles and Mechs were set aside from the Unit deck (62 cards set aside, 41 remain in the base Infantry pool — Vehicle Bay / Mech Station Command Cards unlock them later). Experimental gear was set aside from the Gear deck (8 set aside, 60 remain in the base pool).

Enemy Rank piles after split: Fodder 2, Grunt 8, Core 6, Advanced 35, Elite 14, General 17, Conqueror 11. (Per Playtest Log #33's provisional ruling, a thin Rank pile like Fodder is treated as having unlimited physical copies — it reshuffles a fresh copy of that Rank's master set rather than running dry mid-deal. Carried over uniformly from the other parallel games for consistency.)

### Secret Objectives dealt

Each of 4 players was dealt 2 Secret Objective cards (8 total, out of a 30-card Chaos/Saboteur-excluded... actually Allied/Neutral/Chaos-only pool of 30 cards after removing Saboteur). The align-mode guarantee requires at least one dealt Chaos card; the random deal happened to produce **two**, purely by chance:

| Player | Card 1 | Card 2 |
|---|---|---|
| **Asha** | *(hidden)* | *(hidden)* |
| **Brett** | *(hidden)* | *(hidden)* |
| **Court** | *(hidden)* | *(hidden)* |
| **Dez** | *(hidden)* | *(hidden)* |

All four hands are described obliquely for now — full text, alignment, and completion status appear in the End-of-Game reveal. What can be said without spoiling anything: every player's hand this game contains at least one card that is Allied or Neutral, so nobody is purely boxed into a disruptive role — even the two players carrying a Chaos card also have a second, perfectly cooperative objective sitting alongside it.

### Mission, Tactician, and Command Card hands

Each player started with 2 Mission cards, 1 Tactician card, and 2 Command Cards (drawn blind from the shuffled decks, then the lowest 2 of the 8 mission draws... actually dealt 2 each directly):

**Missions dealt (2 each, drawn in turn order Asha → Brett → Court → Dez):**
- Asha: *Containment Block Sealed* [Captain] — Fully upgrade Containment Block → +8 all resources, and unlocks containing Bosses; *Tech Donated III* [Sergeant] — Donate 15 Tech to Command → +5 all resources, instant: add 5 Tech to command.
- Brett: *Balanced Contribution III* [Sergeant] — Donate 15 of each resource to Command → +10 all resources, instant: add 5 of each to command; *Tech Export 4* [Captain] — Return 20 Tech to supply → +10 Tech, instant: target gains 10 Tech.
- Court: *Tech Export 3* [Sergeant] — Return 15 Tech to supply → +10 Tech, instant: target gains 10 Tech; *Organic Export 4* [Captain] — Return 20 Organics to supply → +10 Organic, instant: target gains 10 Organics.
- Dez: *Balanced Contribution VI* [Specialist] — Donate 30 of each resource → +15 all resources, instant: add 15 of each to command; *Mission Success* [Conscript] — Complete an Event → +1 all resources, instant: prevent this round's Event round-debuff.

All of these are Captain/Sergeant/Specialist rank requirements except Dez's *Mission Success*, which is the only Conscript-rank (completable from turn one) mission in the opening hands. Everyone else is sitting on missions well above their starting Rank for now.

**Tactician cards dealt (1 each):**
- Asha: **The Quartermaster** — Passive: Roll-fill always uses 2d6 (sum, capped at 8 on overshoot) instead of 1d8 for her shop slots; Active: once per round, reroll one Roll-fill result she doesn't want; Resource: Direct-fill slots cost 1 less of her choice.
- Brett: **The Bulwark** — Passive: Armor equipment gains +3 Armor; Active: destroy armor equipment to convert its Armor into 2x that amount in Shields; Resource: Armor costs 1 less of her choice, 1st armor purchase per round free.
- Court: **The Recruiter** — Passive: Infantry require -2 Rank to deploy, other unit types require +1; Active: reveal the shop deck until an Infantry matching his Rank appears, recruit it free, reshuffle; Resource: Infantry cost half Organic.
- Dez: **The Driver** — Passive: Vehicles require -3 Rank, other units require +1; Active: reveal the shop deck until a Vehicle matching his Rank appears, recruit it free, reshuffle; Resource: Vehicles cost half Tech and Organic.

**Command Cards dealt (2 each — drawn together as a shared pool of 8, distributed in dealing order; tracked per-player below):**
1. Necromancy [Containment Block] — O8/T3/A3 — Passive: prevent the 1st death each combat; Instant: revive a unit from the graveyard.
2. Defense Turrets [Battlefield] — O5/T5/A5 — Passive: deal 5 damage when an enemy is Revealed; Instant: 15 damage to all Reveal-effect enemies.
3. Strategic Withdrawal [Command] — O3/T5/A5 — Instant only: once per game, reduce Enemy Progress by 3 but lose 1 Player Progress this round.
4. Reinforcements [Command] — O3/T5/A5 — Instant only: bring the two highest-Rank shop units into play until end of turn, equip the shop's highest-Rank item on them, scrap it end of turn.
5. Forward Command [Command] — O3/T5/A5 — Passive: reserve units are immune; Instant: reserve units immune this round, half Overrun Tracker damage this round.
6. Vehicle Bay [Barracks] — O5/T5/A3 — Passive: unlocks Vehicle purchases; Instant: next Vehicle purchase this round free up to your Rank.
7. Exploitation [Containment Block] — O8/T3/A3 — Instant only: triple damage on next attack, the unit dies after attacking.
8. Perfect Information [Command] — O3/T5/A5 — Instant only: look at the enemy stacks and rearrange them before combat.

Dealt 2 each: Asha got *Necromancy* + *Strategic Withdrawal*; Brett got *Defense Turrets* + *Reinforcements*; Court got *Forward Command* + *Vehicle Bay*; Dez got *Exploitation* + *Perfect Information*.

### Leader Selection

Per the rules, "Players vote on who is the starting leader, this player starts with +1 Rank. The selected leader also starts with +2 Command Cards." With four narrated players and no strong in-fiction reason to favor one voice over another at a cold open, the table's vote was resolved with a fair die roll (1d4) rather than authored: **Dez wins, rolling a 4.**

Dez starts the game at **Private** rank (+1 Rank from Conscript) and draws 2 bonus Command Cards beyond the starting 2 (now holds 4 total — *Exploitation*, *Perfect Information*, plus 2 more drawn fresh):

- Drawn as Leader bonus: *Tech Export 3* — wait, that's a mission. Re-drawing from the Command deck specifically for the Leader bonus below.

(See Round 1 Planning for the actual +2 Command Card draw — folded into the Round 1 Commander Actions section so the draw order stays auditable.)

Per **Playtest Log entry #31** (Commander Actions vs. Worker Placement ordering gap): the commander for a round's Commander Actions is a holdover from the previous round, and Round 1 has no previous round, so **the Leader fills in as Round 1's commander**. Dez is therefore this round's commander, on top of being Leader.

### Shop fill (Round 1)

Barracks (4 slots) and Armory (2 slots) refill at the start of every round. At Round 1 every player is Conscript, so Direct-filling with Rank 1-3 (Conscript/Private/Sergeant) cards is the only sane choice — a Roll-fill 1d8 at this point could only ever land at-or-below the team's ceiling (still Conscript), so it can't do better than Direct fill and risks nothing extra; Dez (commander) chose Direct fill for all 6 slots to guarantee the team has something to buy immediately.

Drawing from the top of the shuffled deck pulled several cards far above what Direct fill is allowed to place (a Brigadier Scout, a Major, two Captains, a Colonel, etc. — sensible, since the full 41-card Infantry pool spans all 8 Ranks and Round 1 only wants the bottom 3). Those over-Rank draws were set aside, unused, rather than placed (Direct fill is explicitly Rank 1-3 only) — they stay out of this game's drawn-card tracking but are *not* returned to the deck, consistent with how dealer.py's draw-from-top has no shuffle-back mechanism built in. This is noted as an open rules question below since Direct fill technically draws from the same shared deck as everything else and the rules don't say what a commander does with an over-Rank card revealed in the process — the working assumption here was "set it aside, draw again," same as if the commander were looking through a physical deck for a low-Rank card.

**Barracks shop (Round 1):** Rookie Gunner [Private Infantry, DMG 2/HP 2, O3/T1/A0] — "increase damage by 1 for consecutive hits on target"; Civilian Survivalist [Conscript Infantry Scout, DMG 1/HP 1, Shields 1, O1/T0/A0] — "Scouts +1 enemy"; Lazy Recruit [Private Infantry, DMG 2/HP 2, Shields 2, O3/T1/A0] — "sacrifice to reduce cost of next recruit by this unit's cost+1," "attacks every 2nd round"; Pack Mule [Private Infantry, DMG 2/HP 2, Shields 4, O3/T1/A0] — "can move equipment to any other unit when deploying a new active unit."

**Armory shop (Round 1):** Toxin Rounds [Private Weapon, DMG 7/HP 3, O2/T4/A0] — Passive: deals Rank damage to enemies, ignoring defence; Active: deal Rank damage to all enemies. Basic Exo [Private Utility, DMG 1/HP 2, O2/T4/A0] — Passive: can equip a 2nd weapon (provides no HP); Active: move to another lane's reserve.

No one has any resources yet (Round 1, before Worker Placement/Income), so nothing gets bought until after Income Generation below.

### Boss spawn check

Enemy Progress is 0 at game start. Per Boss events: "rolling at or below the current Enemy Progress spawns a Boss... impossible at Enemy Progress 0." No roll needed — **no Boss this round**, automatically.

### Lane assignment

4 players, 4 lanes — per Difficulty levels, "with 4 players and 4 lanes, every lane has a player in charge of it and this section doesn't apply." Asha = Lane 1, Brett = Lane 2, Court = Lane 3, Dez = Lane 4. No delegation needed this game at any point unless someone is reassigned.

Seating order around the table (used for all turn-order steps below): Asha → Brett → Court → Dez → (back to Asha).

---

## Round 1

### Planning Stage

#### Commander Actions (Dez, holding over as Round 1's default commander per Log #31)

**Command Card spend:** Dez has nothing worth activating yet (no worker placed anywhere, no resources) — skipped.

**Hand refill check:** per Log #32, hand refill happens at Cleanup, not here — skipped for now.

**Extra lane delegation:** not applicable at 4 players/4 lanes.

**Event draw:** Dez drew 2 Events and chose one to be active this round: *Armor Recall* (Round Effect: unequip all Armor equipment when drawing this event; Complete: no Armor equipped at end of round; Reward: initial shop Armor next round are free; Fail: destroy all Armor) vs. *Cheap Knockoffs* (Round Effect: all income converted to Tech; Complete: return 10 Tech to supply; Reward: all players gain 5 Tech; Fail: increase Tech costs of shops by 2). Nobody owns any Armor yet, so *Armor Recall* would resolve as a complete no-op (trivially "completed," nothing to unequip, free reward next round). Dez picked **Cheap Knockoffs** instead — it's an actual swing this round (all income becomes Tech, which is exactly what's needed to afford the round's Toxin Rounds/Basic Exo gear) and is easy to complete (any single player returning 10 Tech to supply clears it for the team).

**Boss spawn roll:** skipped — impossible at Enemy Progress 0 (see Setup above).

**Mission Assignment:** Dez (commander, Private = Rank 2) drew missions = players(4) + commander rank(2) = **6 cards**: *Full Export 2* [Private], *Lane Specialist I* [Private], *Specialist Intervention* [Conscript], *Giant Slayer* [Private], *Lane Specialist II* [Captain], *Organic Contribution V* [Major]. These pass around the table starting from the player next to the commander (Asha), one card kept per pass, until exhausted:

| Pass | Player | Card kept | Why |
|---|---|---|---|
| 1 | Asha | Specialist Intervention [Conscript] | Only Conscript-rank card in the pool — instantly completable the moment she uses any ability. |
| 2 | Brett | Full Export 2 [Private] | Cooperative donation mission, fits her existing Allied-leaning hand. |
| 3 | Court | Giant Slayer [Private] | Looked at the remaining pool and took the one with the most interesting reward (a free Rank on completion) even though "kill 2 units above your rank" is a stretch goal from Conscript. |
| 4 | Dez | Lane Specialist I [Private] | As commander he goes last in the pass order despite drawing the pool; took the ability-activation mission since he's about to be running Lane 4 personally. |
| 5 | Asha | Lane Specialist II [Captain] | Pool wraps back to Asha; she ends up with 2 cards this round since 6 doesn't divide evenly by 4. |
| 6 | Brett | Organic Contribution V [Major] | Last card, Brett's second this round. |

Asha and Brett each hold 3 Mission cards now (2 starting + 1 new); Court and Dez hold 3 each as well (2 starting + 1 new). Two of the six new missions (Lane Specialist II, Organic Contribution V) are well above Round 1 reach, but that's expected variance from a blind draw — nobody is using the Tiered Mission Draw optional rule this game.

#### Worker Placement

Each player has 2 Worker Tokens (everyone is below Rank 4/Captain so nobody has the 3rd worker yet). The commander gets +1 worker on top of their normal total for the round — Dez places 3 this round, everyone else places 2, for **9 total placements**. Turn order starts from the player next to the commander: Asha → Brett → Court → Dez, repeating until all workers are placed.

With nothing built yet and no injured units/contained enemies/scouts in play, Medical Bay, Containment Block, and Battlefield all reduce to their flat "+1 per worker" trickle this round — nobody chose them. Barracks and Armory both pay out based on shop Rank-sum (real money this round), and Command is where the action is since whoever gets there first becomes commander next round and resources scale with Rank.

| Order | Player | Placement | Reasoning |
|---|---|---|---|
| 1 | Asha | Barracks | Wants in on the Rookie Gunner/Pack Mule purchases early. |
| 2 | Brett | Command | Taking the commander-elect slot for Round 2 — Brett's hand (Tactician, Conductor) leans cooperative and donation-heavy, so holding Command fits her objectives regardless of what's actually printed on them. |
| 3 | Court | Barracks | Stacks with Asha — per Sharing a location, the first worker earns full income, additional workers at the same location earn half (round down); at 4 players, the rule actually upgrades this to the **first two** workers both earning full income, only the 3rd onward drops to half. Court is the 2nd worker at Barracks, so he still gets full income. |
| 4 | Dez | Command | Commander placing a 2nd worker at his own location — he's already locked in as commander via the holdover rule (Log #31) for *this* round, so this 2nd worker at Command is really about stacking the Rank-based resource payout, not the seat itself. |
| 5 | Asha | Armory | 2nd worker, building toward a Toxin Rounds purchase. |
| 6 | Brett | Barracks | 3rd worker overall at Barracks — by the 4-player rule the first two get full income, so Brett's is the first to drop to half. |
| 7 | Court | Armory | 2nd worker there alongside Asha — both get full income (first two at a 4-player table). |
| 8 | Dez | Command | His 3rd placement (2nd personal + the bonus commander worker) — 2nd worker at Command, also full income under the 4-player rule. |
| 9 | Asha | Command | Her 2nd worker, joining Brett/Dez at Command — she's the 3rd worker there, so by the 4-player rule she drops to half income. |

Final tally per location: **Barracks** — Asha (full), Court (full), Brett (half); **Armory** — Asha (full), Court (full); **Command** — Brett (full), Dez (full), Asha (half, 3rd worker).

#### Income Generation

**Barracks** (Worker Placement: "Gain Tech and Organic each equal to the total rank of the shop"): shop = Rookie Gunner (Private=Rank2) + Civilian Survivalist (Conscript=Rank1) + Lazy Recruit (Private=Rank2) + Pack Mule (Private=Rank2) = **total Rank 7**. Full-income workers (Asha, Court) each gain +7 Organic/+7 Tech. Half-income worker (Brett, round down) gains +3 Organic/+3 Tech.

**Armory** (Worker Placement: "gain Tech = 2x total rank of shop"): shop = Toxin Rounds (Private=2) + Basic Exo (Private=2) = **total Rank 4**, so 2×4 = **+8 Tech**. Both Asha and Court are full-income here too (4-player rule, first two workers at a shared location).

**Command** (Worker Placement: "1st worker here takes commander role. Resources of your choice equal to your rank per worker"): Brett is the 1st worker placed at Command this round — per the Commander Token / Key Terms definition ("the 1st worker placed at Command each round takes the [commander] role"), **Brett becomes commander for Round 2** (this round's actual Commander Actions were already run by Dez under the Log #31 holdover rule — Brett's claim here only takes effect next round). Brett (Conscript, Rank 1) gains 1 resource of her choice per worker × 1 worker (her own; Dez and Asha's later placements are separate workers) = **+1 resource, her choice** → she takes +1 Tech (matches the active Event, Cheap Knockoffs, converting all income to Tech anyway — see below). Dez (Private, Rank 2) gains 2 resources/worker × 1 worker = **+2, his choice** → +2 Tech. Asha is the 3rd worker at Command (half income under the 4-player rule): Conscript Rank 1 × 1 worker = 1, halved and rounded down = **0** — her 3rd worker nets nothing this round beyond having a presence at Command.

**Event effect — Cheap Knockoffs round effect ("all income converted to Tech")** applies on top of all the above: every Organic or Alien that would have been generated this round converts to Tech instead. Recomputing with that effect live:

| Player | Location income (pre-event) | Converted to Tech | Final this round |
|---|---|---|---|
| Asha | Barracks +7 Org/+7 Tech (full); Armory +8 Tech (full); Command +0 | +7 (Org→Tech) | **+22 Tech** |
| Brett | Barracks +3 Org/+3 Tech (half); Command +1 Tech (her choice, already Tech) | +3 (Org→Tech) | **+7 Tech** |
| Court | Barracks +7 Org/+7 Tech (full); Armory +8 Tech (full) | +7 (Org→Tech) | **+22 Tech** |
| Dez | Command +2 Tech (his choice, already Tech) | — | **+2 Tech** |

Nobody generated any Alien this round (Containment Block untouched), so the conversion clause only ever touched Organic. Asha and Court come out of Round 1 Income flush with Tech; Brett moderate; Dez (busy running Commander Actions and holding the Command seat for next round) lightest.

#### Purchasing

Here the *Cheap Knockoffs* choice comes back to bite the team: every single Round 1 shop item costs at least 1 Organic (Rookie Gunner O3/T1, Civilian Survivalist O1/T0, Lazy Recruit O3/T1, Pack Mule O3/T1, Toxin Rounds O2/T4, Basic Exo O2/T4), and **all four players currently hold exactly 0 Organic** — every drop of it converted to Tech this round under the active Event. Nobody can complete a single purchase this round, despite Asha and Court individually sitting on 22 Tech each.

This is a genuine, unplanned consequence of the Event pick rather than an authored swing — Dez chose *Cheap Knockoffs* over *Armor Recall* back in Commander Actions because nobody owned Armor yet (making Armor Recall a free no-op) and the Tech conversion looked like a strict upside for affording the round's gear. It's a fair lesson for the table: converting "all income" to a single resource is only good if the thing you want to buy is priced in that resource and *only* that resource — Round 1's shop skews Organic-heavy, so the conversion neutralized itself. **Zero purchases happen this round.**

#### Command Donations

Only players with a worker at Command this round may donate: Brett, Dez, and Asha (her 3rd, half-income worker still counts as "a worker at Command" for donation eligibility — the rule doesn't gate donation by full/half income, just presence). Brett (+7 Tech) and Dez (+2 Tech) both donate their entire Tech stack to the Command pool, reasoning that nothing in the shop is buyable this round anyway and a stocked Command pool helps unlock Location Upgrades later. Asha, sitting on 22 Tech and several Command Cards she'd rather keep liquid for a near-future purchase once Organic flows again next round, declines to donate.

**Command pool after Round 1 donations: +9 Tech** (0 Organic, 0 Alien).

---

### Deployment Stage

**Heal Units:** no injured units exist yet — skipped.
**Assign Scouts:** nobody owns a Scout-type unit yet (Civilian Survivalist sat unbought in the shop) — the scout pile is empty, so per the rule this step is skipped entirely, no scout effects apply this round.
**Reassign Units:** nobody owns any units at all yet — skipped.
**Manage Equipment:** nobody owns any gear — skipped.

**Commander Actions (Deployment) — enemy hoard draw:** Enemy hoard size per lane is set by Difficulty + current Player Progress. Normal difficulty = 3 base, +1 at Player Progress 5-7, +1 more at 8-10. Player Progress is 0, so **3 enemies per lane** this round. Enemy Rank is set by current Enemy Progress (0 → **Fodder**, the 0-1 band). With no scouts assigned, no enemies get pre-revealed face up this round — every enemy enters each lane's reserve face down.

Drawing 3 Fodder-rank enemies per lane (12 draws total) pulled heavily from the Fodder pile's only two unique cards, **Pests** and **Ticks** — exactly the thin-pile scenario flagged provisionally in Playtest Log #33. Per that entry's provisional ruling (used uniformly across all 3 parallel playtest games), the pile is treated as having unlimited physical copies rather than running dry.

| Lane | Enemies drawn (reserve order) |
|---|---|
| 1 (Asha) | Pests, Ticks, Ticks |
| 2 (Brett) | Pests, Pests, Ticks |
| 3 (Court) | Pests, Ticks, Pests |
| 4 (Dez) | Ticks, Pests, Ticks |

**Pests** [Fodder, DMG 1/HP 1]: Passive "+1 damage for each other revealed Pest." **Ticks** [Fodder, DMG 1/HP 1]: Reveal "each player loses 1 Organic"; Passive "-1 Organic income while revealed." Both are minimal stat-line (1/1) Fodder, but Ticks' reveal/passive actively drains the team's Organic — the exact resource that just got zeroed out by Cheap Knockoffs, compounding this round's economy problem rather than easing it next round.

---

### Combat Stage

**Enemy Scouting:** move the top card of each lane's reserve into the Active slot; any face-down card flipping into Active or sitting in Reserve reveals and triggers its Reveal effect (none were pre-scouted face-up this round, so every reveal triggers fresh).

- Lane 1: Pests flips to Active (no Reveal text — Pests has none). Ticks/Ticks remain in reserve face down... but per the rule, "face down cards in active or reserve are flipped and reveal effects trigger" — this is read as: **all enemies dealt this round get revealed at this step**, not just the Active one (consistent with Pests' own passive needing to "count other revealed Pests" across a lane's whole reserve to mean anything). Flipping all 3 in Lane 1: Pests (Active, no reveal), Ticks, Ticks both trigger "each player loses 1 Organic" — but everyone is already at 0 Organic, so this has no further effect this round. Both Ticks' passive ("-1 Organic income while revealed") also has nothing to reduce.
- Lane 2: Pests Active, Pests + Ticks in reserve revealed. Two Pests now revealed in this lane — each Pests' passive reads "+1 damage for each *other* revealed Pest," so both of Lane 2's Pests buff each other: each now hits for 1 (base) + 1 (one other revealed Pest) = **2 damage**. Ticks' drain triggers, again hitting already-empty Organic pools.
- Lane 3: Pests Active, Ticks + Pests revealed in reserve. Same as Lane 2 — 2 Pests revealed in this lane, each buffed to 2 damage.
- Lane 4: Ticks Active, Pests + Ticks revealed in reserve. Only 1 Pests in this lane, so its passive has no "other" Pests to count — stays at base 1 damage. Both Ticks trigger Organic drain (no effect, already at 0).

**Combat Cycle:** Dez (commander) chooses the starting lane — he picks Lane 4 first (his own), then 1, 2, 3.

Every lane has **zero player Active unit** (nobody purchased anything this round). Per the Combat Cycle rule, combat is a simultaneous exchange between the player's Active unit and the enemy's Active card — with no player unit present at all, there is nothing to exchange damage with, and nothing can kill the enemy. Each lane's Active enemy (and by extension its whole reserve, since nothing ever dies to advance the queue) simply survives the round undamaged in all 4 lanes.

This is the first real rules-edge case of the game: the rules describe combat resolution (simultaneous exchange, priority abilities, leftover damage) but never explicitly states what happens when a lane has *no* player unit to begin with, as opposed to a unit that died mid-fight. The working ruling applied here (consistent with "Overrun" being defined as "what happens to a lane when enemies survive combat there with no player unit left to defend it") is that an empty lane is simply already in the overrun state for the round — there's no combat exchange to resolve, the enemies automatically survive, and the lane overruns. This is logged as an open rules question below since it never previously came up in this same project's earlier sessions per the Playtest Log.

**Result: all 4 lanes overrun this round.** No enemies died, no player units died (none existed), nothing goes to Containment or the Graveyard.

---

### Cleanup Stage

**Managing the dead:** nothing died on either side — skipped.

**Overrunning lanes:** all 4 lanes overrun. Overrun Tracker loses 1 per overrun lane: **10 → 6** (4 lanes × 1 each). That's a brutal opening round — 40% of the starting Overrun Tracker gone before the team ever got a unit on the field, directly downstream of the Round 1 Organic shortfall from Cheap Knockoffs leaving nothing purchasable.

**Event Resolution:** *Cheap Knockoffs* — Completion Condition is "return 10 Tech to supply." Nobody chose to return any Tech (everyone wanted to keep what little they had after donations, especially with zero purchases possible and a bruising Overrun result just landed). **Event fails.** Failure Penalty: "Increase Tech costs of shops by 2" — every shop slot's Tech cost goes up by 2 starting next round, an ongoing irritant layered on top of an already rough opening.

**Promotions:** Promotions only trigger "if the event passed" — it didn't, so no promotion happens this round regardless of Rank standings.

**Escalate:** per the rule, Round 1's enemy-progress escalation is skipped entirely (the one-time grace period). Player Progress only advances "if all lanes survived this round" — all 4 lanes overran, so **Player Progress stays at 0**. Enemy Progress also stays at 0 (Round 1 skip).

### Round 1 summary

| Track | Start | End |
|---|---|---|
| Overrun Tracker | 10 | **6** |
| Player Progress | 0 | 0 |
| Enemy Progress | 0 | 0 |

A rough, almost-purely-mechanical opening round: an Event pick that looked like a safe income boost (converting Organic to Tech) instead zeroed out the one resource every Round 1 shop item needed, leaving the team unable to buy a single unit and all 4 lanes empty going into Combat. No Secret Objective behavior worth noting yet from either Chaos player this round — nobody had any units or equipment to make a choice about either way.

---

## Round 2

### Planning Stage

#### Commander Actions (Brett — claimed the Command seat in Round 1's Worker Placement, takes over running Commander Actions this round per the holdover rule)

**Command Card spend:** nothing affordable/relevant pre-Worker-Placement — skipped.

**Event draw:** Brett drew *Capacity Threshold* (Round Effect: roll dice to select locations; Complete: target location full; Reward: draw upgrades until that location is full; Fail: -1 location upgrade limit) vs. *Fuel Shortage* (Round Effect: Active non-Infantry units are stunned at combat start; Complete: 4 Active Infantry; Reward: Active Infantry gain +1 Armor per active Infantry at combat start; Fail: Active Infantry lose +1 Armor per active Infantry at combat start). Every unit in the current shop is Infantry (the team hasn't unlocked Vehicle Bay or Mech Station yet), so *Fuel Shortage*'s stun clause can't even fire this round — there's nothing non-Infantry on the board to stun. Brett picked **Fuel Shortage**: free to attempt (no real downside this round given the team's all-Infantry shop) and the completion condition (4 Active Infantry across the 4 lanes) is exactly what buying units this round should produce anyway.

**Boss spawn roll:** Enemy Progress is still 0 entering Round 2 (Round 1's Escalate step was skipped per the one-time grace period, so Enemy Progress never moved off 0). Spawning is impossible at Enemy Progress 0 — skipped again, no roll needed.

**Mission Assignment:** Brett is Conscript = Rank 1, so the pool size is players(4) + commander rank(1) = **5 cards**: *Mission Failure* [Conscript], *Untouchable* [Colonel], *Armory Complete* [Private], *Absolute Lockdown* [Brigadier], *Xenobiology Export 5* [Major]. Passed starting from the player next to the commander (Court, since Brett is commander this round):

| Pass | Player | Card kept | Why |
|---|---|---|---|
| 1 | Court | Armory Complete [Private] | Lowest, most realistic Rank requirement in the pool; pairs with his Tactician (The Recruiter) pushing him toward Infantry purchases anyway. |
| 2 | Dez | Mission Failure [Conscript] | Only Conscript-rank card here, and ironically already half-relevant — last round's Cheap Knockoffs event just failed, though this mission needs a *future* failure to trigger, not retroactive. |
| 3 | Asha | Untouchable [Colonel] | Far above reach for now, but the reward (instant team-wide promotion) is too good to pass up holding onto. |
| 4 | Brett | Absolute Lockdown [Brigadier] | Commander goes last in the pass; took the only card left she had any use holding. |
| 5 | Court | Xenobiology Export 5 [Major] | Pool wraps back to Court since 5 doesn't divide evenly by 4; his second new card this round. |

#### Worker Placement

Brett (commander) places 3 workers; Asha, Court, Dez place 2 each — **9 total**, turn order starting from the player next to the commander: Court → Dez → Asha → Brett.

Asha and Court are each sitting on 22 Tech but **0 Organic** — and the failed *Cheap Knockoffs* event from Round 1 just raised every shop slot's Tech cost by +2 on top of that, so Organic is now the binding constraint for the whole team, not Tech. Barracks (pays Organic+Tech together) is the clear priority this round.

| Order | Player | Placement | Reasoning |
|---|---|---|---|
| 1 | Court | Barracks | Needs Organic badly; also feeds his Tactician's Infantry lean. |
| 2 | Dez | Barracks | Stacks with Court — both are the first two workers here, both full income under the 4-player rule. |
| 3 | Asha | Command | Claiming the commander-elect seat for Round 3, and Command's Rank-scaled resource grant gives her some Organic flexibility ("resources of your choice"). |
| 4 | Brett | Armory | Wants Toxin Rounds bought this round — it ignores defence and the team has yet to land a real hit on anything. |
| 5 | Court | Armory | 2nd worker, joining Brett — full income (4-player rule, first two). |
| 6 | Dez | Command | Joining Asha at Command. |
| 7 | Asha | Barracks | 2nd worker — she's the 3rd worker at Barracks this round, so by the 4-player rule she drops to half income there. |
| 8 | Brett | Command | Her 2nd worker (plus the bonus commander worker still to place) — joining Asha/Dez, she's the 3rd worker at Command, half income. |
| 9 | Brett | Battlefield | Her 3rd placement (commander's bonus worker) — with no scouts and no enemies of the team's own to influence yet, this is mostly a placeholder pick, but the flat "+1 all resources to Command per worker" trickle still helps refill the Command pool a little. |

Final tally: **Barracks** — Court (full), Dez (full), Asha (half, 3rd worker); **Armory** — Brett (full), Court (full); **Command** — Asha (full), Dez (full), Brett (half, 3rd worker); **Battlefield** — Brett (full, only worker there).

#### Income Generation

**Barracks** (shop Rank-sum still 7, nothing bought from it yet): Court and Dez (full) each gain **+7 Organic / +7 Tech**. Asha (half, round down) gains **+3 Organic / +3 Tech**.

**Armory** (shop Rank-sum still 4, 2×4=8 Tech): Brett and Court (both full) each gain **+8 Tech**.

**Command** ("Resources of your choice equal to your Rank, per worker"): Asha (Conscript=Rank1, full, 1 worker) chooses **+1 Organic** (closing her Organic gap is the priority). Dez (Private=Rank2, full, 1 worker) chooses **+2 Organic** for the same reason. Brett (half, 3rd worker, Conscript=Rank1, 1×1=1 halved & rounded down) gets **+0**.

**Battlefield** ("+1 all resources to Command per worker," and grants scouting — moot, no scouts owned): Brett's worker here adds **+1 Organic/+1 Tech/+1 Alien to the Command pool** (not to Brett personally — this location's payout always routes to Command, not the worker's own stockpile).

No active Event touches income this round (*Fuel Shortage*'s effect is combat-stage only), so nothing converts or redirects anything here.

**Running totals after Round 2 income:** Asha 25 Tech / 1 Organic. Court 37 Tech / 7 Organic. Dez 7 Tech / 9 Organic. Brett 8 Tech / 0 Organic. Command pool (was 9 Tech from Round 1) + Battlefield's +1/+1/+1 → **1 Organic, 10 Tech, 1 Alien**.

#### Purchasing

Shop costs after the failed *Cheap Knockoffs* penalty (+2 Tech to every shop slot, ongoing): Rookie Gunner O3/T3, Civilian Survivalist O1/T2, Lazy Recruit O3/T3, Pack Mule O3/T3; Toxin Rounds O2/T6, Basic Exo O2/T6.

Court (37 Tech, 7 Organic) goes first and buys generously: **Civilian Survivalist** (O1/T2 — cheap, and a Scout-type unit the team badly needs for the Assign Scouts step), **Rookie Gunner** (O3/T3), and **Lazy Recruit** (O3/T3), spending O7/T8 total — exactly clearing his Organic to 0 and leaving 29 Tech. Per "Filling shop slots," each bought slot refills immediately, so the commander (Brett) fills the 3 empty Barracks slots right away rather than waiting for next round. Drawing for the refill turned up several over-Rank cards again (Captain-rank Covert Operation and Field Intelligence) that get set aside the same way as Round 1's overflow; the usable Rank 1-3 finds were Flamethrower [Sergeant], Recruit Prodigy [Private], Technician [Sergeant], and Gunner [Sergeant]. Brett direct-fills the 3 empty Barracks slots with **Recruit Prodigy**, **Flamethrower**, and **Technician**.

Dez (7 Tech, 9 Organic) buys **Pack Mule** (O3/T3), leaving him O6/T4. Per the immediate refill rule, Brett direct-fills the now-empty Barracks slot with **Gunner** [Sergeant Infantry, DMG 3/HP 3, O6/T2].

Asha (25 Tech, 1 Organic) can't afford anything Organic-heavy yet — she passes on purchasing this round, banking Tech for when her Organic income catches up.

Brett (8 Tech, 0 Organic) also has no Organic to spend and passes.

**End-of-round Barracks shop:** Pack Mule was bought and replaced by Gunner; the shop now reads Recruit Prodigy, Flamethrower, Technician, Gunner — all freshly filled, all Sergeant-or-below.

**Units now owned:** Court holds Civilian Survivalist, Rookie Gunner, Lazy Recruit (all unequipped, sitting in his personal pool — not yet assigned to Lane 3's Active/Reserve, which happens in Deployment). Dez holds Pack Mule.

No Armory purchases this round either — Brett and Court both ended Worker Placement with Tech but spent down through Barracks instead of Armory; Toxin Rounds and Basic Exo remain unsold (O2/T6 each, nobody quite prioritized gear over getting bodies on the field first).

#### Command Donations

Court, with 29 Tech left and no immediate use for it (he's tapped out on Organic), donates 20 Tech to the Command pool, keeping 9 Tech in reserve. Nobody else at Command (Asha, Dez) chooses to donate this round — Asha wants to keep her Tech for next round's purchases, Dez is light on Tech already.

**Command pool after Round 2: 1 Organic, 30 Tech, 1 Alien.**

---

### Deployment Stage

**Heal Units:** no injured units yet — skipped.

**Assign Scouts:** Court's newly purchased **Civilian Survivalist** [Conscript Infantry Scout] is donated to Command as a Scout (per Command Donations, "Players can also donate Units to the command for use as Scouts" — Court chooses to donate it rather than field it in Lane 3, since its 1/1 stat line is nearly worthless in melee but its Scout text is valuable now). The active commander (Brett) assigns it as this round's active scout. Per Assign Scouts: "Scouts are the main counterplay to enemy Reveal effects... by default, scouting reveals 1 enemy each round; some units' own ability text grants more." Civilian Survivalist's Main Effect is "Scouts +1 enemy" — read as a bonus on top of the default 1, so **2 enemies get pre-revealed face-up this round** before dealing. Its Scout Value (Organic/Tech/Alien — checking the unit's stat line, Civilian Survivalist's Scout Value columns are blank/0 in the CSV) adds nothing extra to the Command pool this round, just the reveal bonus.

**Reassign Units:** Court moves **Rookie Gunner** into Lane 3's Active slot and keeps **Lazy Recruit** in reserve behind it. Dez moves **Pack Mule** into Lane 4's Active slot.

**Manage Equipment:** nobody owns any gear yet — skipped.

**Commander Actions (Deployment) — enemy hoard draw:** Player Progress is still 0, so hoard size stays at 3/lane (Normal difficulty base). Enemy Progress is still 0 (Round 1's skip already happened; Round 2's Escalate hasn't run yet — that's Cleanup, still ahead) — Fodder rank again.

With 2 enemies scouted (pre-revealed face up) this round thanks to Civilian Survivalist, the commander separates 2 random enemies from this round's draw, flips them face up, shuffles them back into the pool before dealing into lanes (per "Separate out a random selection of enemies based on the scout effects, turn these cards face up and shuffle together back before dealing into lanes"). Two d-rolls picked Lane 1's 3rd card (a Pests) and Lane 3's 1st card (a Ticks) as this round's scouted enemies — they go into their lanes already face up. Since neither card's Reveal effect differs in substance whether triggered early (by scouting) or normally (at Enemy Scouting in Combat) — Pests has no Reveal text at all, and Ticks' Reveal ("each player loses 1 Organic") fires the same either way — the only real difference this round is *timing*: those two specific cards don't trigger their Reveal a second time when Combat's Enemy Scouting step later flips the rest of each lane's reserve, per "a card that's already face up from scouting does not trigger its Reveal effect when it later enters play."

The full draw, with scouted cards marked:

| Lane | Enemies drawn (reserve order) |
|---|---|
| 1 (Asha) | Ticks, Pests, **Pests (scouted)** |
| 2 (Brett) | Ticks, Ticks, Pests |
| 3 (Court) | **Ticks (scouted)**, Pests, Ticks |
| 4 (Dez) | Pests, Ticks, Pests |

---

### Combat Stage

**Enemy Scouting:** the top card of each lane's reserve moves to Active; all face-down cards (everywhere) flip and trigger Reveal effects, except the 2 already-scouted cards (Lane 1's 3rd Pests, Lane 3's 1st Ticks) which stay face up without re-triggering.

- **Lane 1** (Asha, Active unit: none — she made no purchase this round): Ticks (Active) reveals — Organic drain, no effect (already 0 for everyone, or in Asha's specific case her 1 Organic drops to 0). Pests and the scouted Pests both reveal/are already face up — **2 revealed Pests in this lane**, each buffs to 1+1=**2 damage**.
- **Lane 2** (Brett, Active unit: none — she made no purchase either): Ticks (Active), Ticks, Pests all reveal. 2 Ticks drain Organic (Brett already at 0, no effect). Only 1 Pests revealed here — stays at base 1 damage.
- **Lane 3** (Court, Active unit: **Rookie Gunner**, DMG 2/HP 2, reserve: Lazy Recruit): scouted Ticks (Active, already face up) + Pests + Ticks reveal. 2 Ticks drain Organic — Court is now at 0 Organic anyway post-purchases, no effect. 1 Pests revealed — base 1 damage.
- **Lane 4** (Dez, Active unit: **Pack Mule**, DMG 2/HP 2): Pests (Active), Ticks, Pests reveal. **2 revealed Pests in this lane** — each buffs to 2 damage. 1 Ticks drains Organic — Dez has 6 Organic left after his purchase, drops to 5 (the first real bite from a Ticks reveal this game, since everyone's pool was already empty in every previous instance).

**Combat Cycle:** Brett (commander) chooses the starting lane — Lane 3 first (the only lane with two friendly units committed), then 4, 1, 2.

- **Lane 3:** Rookie Gunner (DMG 2/HP 2) vs. Ticks (Active, DMG 1/HP 1). Simultaneous exchange: Rookie Gunner deals 2 to Ticks (HP 1 — dies), Ticks deals 1 to Rookie Gunner (HP 2 → 1 remaining, survives). Ticks dies, moves to the dead-enemy pile (Containment Block has 0 slots unlocked yet, so per "dead enemies go to Enemy Disposal at Command instead" if no Containment space — it goes to Enemy Disposal). Next enemy (Pests, base 1 damage since its scouted partner died — wait, the *other* revealed Pests in this lane was the 2nd card, still alive) promotes to Active. Rookie Gunner (1 HP left) vs. Pests (DMG 1, since only 1 Pests now active+reserve... actually both Pests in Lane 3's original 3-card hand — let me recheck: Lane 3 was Ticks/Pests/Ticks, only 1 Pests total, so it was never buffed, base 1 damage throughout). Exchange: Rookie Gunner deals 2 (Pests HP 1 — dies), Pests deals 1 to Rookie Gunner (1 HP → 0, **dies simultaneously**). Both die in the same exchange (simultaneous resolution, no priority ability on either side). Rookie Gunner moves to the Graveyard at Command; Pests moves to dead-enemy pile (Enemy Disposal, no Containment slots). Lazy Recruit promotes from Lane 3's reserve to Active. Final enemy, Ticks (Active, DMG1/HP1) vs. Lazy Recruit (DMG2/HP2, Shields 2, "attacks every 2nd round" bonus effect): Lazy Recruit's bonus text means it does NOT attack this round (its first round active) — read as: the unit can still defend/take damage normally, but only deals its own damage on every 2nd round it's active, so this round it deals 0. Ticks deals 1 damage to Lazy Recruit, absorbed by its 2 Shields (Shields "prevents damage total" per Keywords — reduces the incoming 1 damage to 0, Shields remaining 1). Lazy Recruit deals 0 back (off-round). Ticks survives at full HP, Lazy Recruit survives at full HP/1 Shield remaining. **Lane 3 ends with 1 enemy (Ticks) still alive and Lazy Recruit still standing — lane holds, not overrun**, since a defending unit is still present even though it didn't kill the last enemy this round.
- **Lane 4:** Pack Mule (DMG2/HP2, Shields4) vs. Pests (Active, DMG2 buffed/HP1). Exchange: Pack Mule deals 2 (Pests HP1 — dies), Pests deals 2 to Pack Mule, fully absorbed by 4 Shields (Shields 4→2 remaining). Pests dies → Enemy Disposal. Next, Ticks (Active, DMG1/HP1) promotes. Exchange: Pack Mule deals 2 (Ticks dies), Ticks deals 1, absorbed by remaining 2 Shields (2→1). Ticks dies → Enemy Disposal, Organic drain passive also ends (no longer revealed-and-alive). Last enemy, the 2nd Pests (DMG2 buffed while its partner was alive, but its partner is now dead — recompute: with the *other* Pests dead, this Pests' passive "+1 damage for each *other* revealed Pest" now has 0 others, drops back to base 1 damage) promotes. Exchange: Pack Mule deals 2 (Pests HP1 — dies), Pests deals 1, absorbed by last Shield (1→0). **All 3 enemies in Lane 4 die, Pack Mule survives with 0 Shields/full HP. Lane 4 fully cleared.**
- **Lane 1:** No player Active unit (Asha didn't purchase). Same ruling as Round 1 — an empty lane has nothing to exchange damage with, the enemies automatically survive, the lane overruns by default. All 3 of Lane 1's enemies (Ticks, Pests, Pests) survive undamaged.
- **Lane 2:** No player Active unit (Brett didn't purchase either). Same automatic overrun — all 3 enemies (Ticks, Ticks, Pests) survive.

**Result:** Lane 3 holds (1 enemy survives but a defending unit remains — not an overrun by the rule's actual text, which keys off "no player unit left to defend it," not "all enemies dead"). Lane 4 fully clears. Lanes 1 and 2 overrun (no player unit present at all).

---

### Cleanup Stage

**Managing the dead:** Rookie Gunner (Court's, Lane 3) and Pests (Lane 3's 2nd enemy) died simultaneously and are recorded in that order — Rookie Gunner to the Graveyard at Command, Pests' corpse to Enemy Disposal (no Containment Block slots unlocked yet, so the "last kill in each lane can be contained" upside is currently unusable for anyone). Ticks (Lane 3's 1st kill) also went to Enemy Disposal earlier in the same lane's combat. Lane 4's 3 dead enemies (Pests, Ticks, Pests) all went to Enemy Disposal as well — none of this game's 4 lanes have a working Containment Block yet, so every kill this round bypasses containment entirely regardless of "last kill of the round."

**Overrunning lanes:** Lane 1 and Lane 2 overrun (2 lanes). Lane 3 (1 surviving enemy, but Lazy Recruit still defending) does **not** count as overrun under the rule's literal text ("what happens to a lane when enemies survive combat there with **no player unit left to defend it**") — Lazy Recruit is alive and present, so Lane 3 is read as held, just not fully cleared. Lane 4 fully cleared, no overrun. **Overrun Tracker loses 2 (one per overrun lane): 6 → 4.**

This is close enough to the loss condition (Overrun Tracker hits 0) that it's worth flagging plainly: the team is now 4 bad rounds away from losing outright, only 2 rounds into the game, almost entirely because Round 1 produced zero purchases. Round 2's real unit purchases (Rookie Gunner, Lazy Recruit, Pack Mule) show the mechanic working as intended once Organic is actually flowing — Lane 4 fully cleared 3 enemies for 0 net losses.

**Event Resolution:** *Fuel Shortage* — Completion Condition is "4 Active Infantry." The team fielded exactly 2 Active Infantry this round (Rookie Gunner in Lane 3, Pack Mule in Lane 4) — Lanes 1 and 2 had none. **Event fails.** Failure Penalty: "Active Infantry lose +1 Armor for each active Infantry at combat start" — with 2 Active Infantry at this round's combat start, that's a -2 Armor penalty text, but since neither Rookie Gunner nor Pack Mule had any base Armor to begin with (both 0 Armor on their stat lines) and they're already resolved/dead-or-survived for this round, the penalty has no retroactive bite this round; it would only matter if read as applying to *next* round's Active Infantry, which the card text doesn't actually say. Ruling: Failure Penalties resolve at Cleanup of the round they're checked, against that round's already-locked-in combat — since combat already happened, this penalty is logged as a missed opportunity rather than retroactively edited. (See Open Rules Questions — "do round-effect/failure-penalty Event clauses that reference 'at combat start' apply this round after combat already resolved, or next round?" This is exactly that ambiguity.)

**Promotions:** the Event failed, so no promotion this round.

**Escalate:** Round 2 is not Round 1, so the skip no longer applies — Enemy Progress advances: **0 → 1**. All lanes did not survive (Lanes 1 and 2 overran), so Player Progress does **not** advance, staying at **0**.

**Hand refill (Log #32):** at Cleanup, players with fewer than 2 Command Cards draw up to 2 (3 for the commander). Current hands: Asha 2 (Necromancy, Strategic Withdrawal) — full, no draw. Brett 2 (Defense Turrets, Reinforcements) but she's commander this round needing 3 — draws 1, getting **We Can Rebuild Them** [Medical Bay, O8/T3/A3 — Passive: all units heal for their Tech cost to get back in a single round; Instant: heal all units under half HP back to full]. Court 2 (Forward Command, Vehicle Bay) — full, no draw. Dez 4 (Exploitation, Perfect Information, Field Testing, Mad Science) — already above the minimum, no discard required since the rule only forces drawing *up to* the minimum, not trimming *down* to it.

### Round 2 summary

| Track | Start | End |
|---|---|---|
| Overrun Tracker | 6 | **4** |
| Player Progress | 0 | 0 |
| Enemy Progress | 0 | **1** |

| Lane | Result |
|---|---|
| 1 (Asha) | Overrun — no unit purchased/fielded |
| 2 (Brett) | Overrun — no unit purchased/fielded |
| 3 (Court) | Held — Rookie Gunner traded into a kill before dying, Lazy Recruit absorbed the rest |
| 4 (Dez) | Fully cleared — Pack Mule's Shields tanked all 3 hits |

The contrast between Lane 4 (a single well-statted Shield unit clearing 3 Fodder for free) and Lanes 1/2 (total auto-overrun from having nothing fielded) is the clearest read yet on how unforgiving an empty lane is under the current rules — there's no partial credit for an empty lane, it behaves identically whether facing 1 enemy or 5. Asha and Brett both have the Tech to buy something next round; the real bottleneck so far has been Organic, which the team is still climbing out of after Round 1's Cheap Knockoffs conversion. No notable Secret-Objective-driven behavior from either Chaos player yet this round either — both Asha and Court's choices so far (banking Tech, buying broadly) read as ordinary economic caution, not yet anything that points toward a hidden personal agenda.

---

## Round 3

### Planning Stage

#### Commander Actions (Court — claimed Command first in Round 2's Worker Placement)

**Event draw:** Court drew *Tax Fault* (Round Effect: all income halved; Complete: return 15 resources to supply; Reward: all players gain 1 Alien/turn going forward; Fail: increase Alien costs by 2) vs. *System Lockdown* (Round Effect: return all upgrades to hand; Complete: no upgrades built at end of turn; Reward: remove upgrades anytime; Fail: remove upgrades at end of turn). Nobody has built a single Location Upgrade yet this game, so *System Lockdown*'s entire premise (returning/removing upgrades) is another complete no-op — there's nothing to return. Court, very aware the team is sitting on a dangerously low Overrun Tracker (4) and needs every scrap of income flowing rather than halved, picked **System Lockdown** purely because it can't hurt — *Tax Fault*'s halved income would have been a real, live problem this round with multiple players about to make their first real purchases.

**Boss spawn roll:** Enemy Progress is now 1 (advanced at the end of Round 2). Per Boss events, rolling at-or-below current Enemy Progress spawns a Boss. Rolled 1d10: **4** — over 1, **no Boss spawns**.

**Mission Assignment:** Court is Conscript = Rank 1, pool size = 4+1 = **5 cards**: *Steel Supremacy* [Private], *Full Export 4* [Captain], *Containment Block Detail* [Sergeant], *Honorable Discharge* [Private], *Armored Convoy* [Major]. Passed starting from the player next to the commander (Dez, since Court is commander):

| Pass | Player | Card kept | Why |
|---|---|---|---|
| 1 | Dez | Honorable Discharge [Private] | Lowest realistic Rank requirement; also synergizes with his Tactician (The Driver) eventually wanting to cycle Infantry out for Vehicles. |
| 2 | Asha | Steel Supremacy [Private] | Closest to her current Rank even though she owns no Mechs yet. |
| 3 | Brett | Containment Block Detail [Sergeant] | She's eyeing the Containment Block Command Card upgrade path (her hand has no Containment cards, but the mission reward is generically useful). |
| 4 | Court | Full Export 4 [Captain] | Commander goes last; takes the remaining card with the biggest number on it even though Captain rank is well out of reach. |
| 5 | Dez | Armored Convoy [Major] | Wraps back to Dez, his second this round. |

---

#### Worker Placement

Court (commander) places 3; Asha, Brett, Dez place 2 each — **9 total**. Turn order from the player next to the commander: Dez → Asha → Brett → Court.

With the Overrun Tracker at 4 and two lanes (1, 2) sitting completely empty after two straight overrun rounds, the table's priority shifts hard toward actually fielding units in Lanes 1 and 2 specifically, not just generic income.

| Order | Player | Placement | Reasoning |
|---|---|---|---|
| 1 | Dez | Barracks | Wants another unit for Lane 4 (or a backup) while Organic is flowing for him. |
| 2 | Asha | Barracks | Stacks with Dez — full income (first two, 4-player rule); she's been banking 25 Tech with 0 Organic and badly needs the Organic side of this location's payout. |
| 3 | Brett | Barracks | 3rd worker — drops to half income, but she has the same Organic problem as Asha and any Organic is better than none. |
| 4 | Court | Command | Re-claims the commander-elect seat for Round 4. |
| 5 | Dez | Command | Stacks with Court, full income (2nd worker). |
| 6 | Asha | Armory | Pivoting her 2nd worker toward gear now that Barracks is crowded. |
| 7 | Brett | Armory | Joins Asha — full income (first two). |
| 8 | Court | Battlefield | His 2nd personal worker — feeds the Command pool's flat trickle and (irrelevantly, no scouts assigned beyond the existing Civilian Survivalist) the scouting bonus. |
| 9 | Court | Command | His 3rd placement (bonus commander worker) — 3rd worker at Command, half income. |

Final tally: **Barracks** — Dez (full), Asha (full), Brett (half, 3rd worker); **Armory** — Asha (full), Brett (full); **Command** — Court (full, 1st), Dez (full, 2nd), Court (half, 3rd — yes, Court has a worker in both the full and half slot at the same location since he placed there twice across his 3 workers); **Battlefield** — Court (full, only worker).

---

#### Income Generation

**Barracks** (shop Rank-sum: Recruit Prodigy [Private=2] + Flamethrower [Sergeant=3] + Technician [Sergeant=3] + Gunner [Sergeant=3] = **11**): Dez and Asha (full) each gain **+11 Organic/+11 Tech**. Brett (half, round down) gains **+5 Organic/+5 Tech**.

**Armory** (shop Rank-sum: Toxin Rounds [Private=2] + Basic Exo [Private=2] = **4**, ×2 = **+8 Tech**): Asha and Brett (both full) each gain **+8 Tech**.

**Command** (Rank × workers, choice of resource): Court (Conscript=Rank1) has 2 of his 3 workers here — the 1st (full) grants 1×1=1, the 3rd (half) grants 1×1 halved & rounded down = 0; total **+1, his choice** → Organic (he's been sitting on 0 Organic since Round 2's purchases). Dez (Private=Rank2, full, 1 worker) gains **+2, his choice** → Organic again.

**Battlefield:** Court's worker here adds **+1 Organic/+1 Tech/+1 Alien to the Command pool**.

No active Event touches income this round (System Lockdown only concerns upgrades, of which there are still none built) — straight math, no conversions.

**Running totals after Round 3 income:** Asha 25+11=36 Tech, 0+11=11 Organic, +8 Tech from Armory = **44 Tech, 11 Organic**. Brett 8+5=13 Tech, 0+5=5 Organic, +8 Tech from Armory = **21 Tech, 5 Organic**. Dez 4+11=15 Tech, 6+11+2=19 Organic = **15 Tech, 19 Organic**. Court 9 Tech (unchanged, no income location chosen besides Command's resource choice) +1 Organic = **9 Tech, 1 Organic**. Command pool: was 1 Organic/30 Tech/1 Alien, +1 Organic/+1 Tech/+1 Alien (Battlefield) = **2 Organic, 31 Tech, 2 Alien**.

#### Purchasing

Shop costs (still +2 Tech ongoing from Round 1's failed event): Recruit Prodigy O3/T3, Flamethrower O6/T4, Technician O6/T4, Gunner O6/T4; Toxin Rounds O2/T6, Basic Exo O2/T6.

**Asha** (44 Tech, 11 Organic) — finally flush with both resources for the first time this game — buys **Flamethrower** (O6/T4) for Lane 1. Per the immediate-refill rule, Court (commander) fills the empty slot right away; the fresh draw turns up **Marksman** [Sergeant Infantry, DMG3/HP3, O6/T2→T4, Main: Long Range] — a clean Rank 1-3 find, direct-filled in. Asha then also buys **Recruit Prodigy** (O3/T3), leaving her O2/T37. Recruit Prodigy's empty slot refills with a second fresh draw, **Rookie Scout** [Private Infantry Scout, DMG2/HP2, Shields1, O3/T1→T3, Main: Mobile] — another clean Rank 1-3 find, direct-filled in.

**Brett** (21 Tech, 5 Organic) buys **Marksman** (O6/T4 — the slot that just refilled), leaving her O(5-6, can't afford)... recomputing: Marksman costs O6 and Brett only has 5 Organic, so she can't afford it. She buys the cheaper **Rookie Scout** instead (O3/T3), leaving her O2/T18.

**Dez** (15 Tech, 19 Organic) — the team's Organic leader this round — buys **Technician** (O6/T4) and **Gunner** (O6/T4) for a 2nd and 3rd unit behind Pack Mule, spending O12/T8, leaving O7/T7. Both slots refill immediately; Court (commander) chooses Roll-fill for both this time rather than Direct fill, curious to see if it does any better. Rolling 1d8 twice: **4** and **8** — both well above the team's current Rank ceiling (the team's highest Rank achieved so far is Private — nobody has hit Sergeant yet), so per the Roll-fill rule ("if the result is above the team's highest rank, it scales down to the team's highest rank instead"), both rolls scale down to **Private** regardless of the literal numbers rolled. The actual top-of-deck draws needed several over-Rank discards before turning up two genuine Private-rank cards: **Stubborn Recruit** [Private Infantry, DMG2/HP2, Armor1/Shields7, O3/T1→T3] and **Rookie Marksman** [Private Infantry, DMG2/HP2, O3/T1→T3, Main: Long Range] — both direct-filled into the two empty slots since that's what the scaled-down Roll-fill result authorized.

**Court** (9 Tech, 1 Organic) can't afford anything meaningfully Organic-priced this round and passes.

**Units now owned (not yet placed into lanes — that's Deployment):** Asha — Flamethrower, Recruit Prodigy. Brett — Rookie Scout. Dez — Technician, Gunner (plus Pack Mule already active in Lane 4 from Round 2).

No Armory purchases again this round — both Toxin Rounds and Basic Exo remain unsold for a 3rd straight round; the team has been entirely Infantry-focused so far, on stat lines alone rather than gear.

#### Command Donations

Asha, now sitting on 37 Tech with nothing else to spend it on this round, donates 25 Tech to the Command pool. Dez donates 5 Organic, reasoning the team's Containment Block and Medical Bay upgrades (both currently locked) need Command-pool funding to ever open up. Court (at Command with 2 of his 3 workers) declines — he has almost nothing to give.

**Command pool after Round 3: 7 Organic, 56 Tech, 2 Alien.**

---

### Deployment Stage

**Heal Units:** still no injured units anywhere (everything that's taken damage so far has either died or fully absorbed it via Shields) — skipped.

**Assign Scouts:** Civilian Survivalist remains the active scout, still granting the +1-enemy bonus (2 enemies pre-revealed this round too). No scout has died, so no reassignment needed.

**Reassign Units:** Asha moves **Flamethrower** into Lane 1's Active slot, **Recruit Prodigy** into reserve behind it — Lane 1 has been empty for 2 straight overrun rounds, so getting *any* defender there is the priority. Brett moves **Rookie Scout** into Lane 2's Active slot — likewise, Lane 2's been empty since Round 1. Dez moves **Gunner** into Lane 4's reserve (keeping Pack Mule Active, since it's undamaged and already proven itself) and **Technician** into reserve behind that. Court leaves Lane 3 as-is — **Lazy Recruit** remains Active (full HP, 1 Shield remaining from Round 2's leftover state).

**Manage Equipment:** still nobody owns any gear (Toxin Rounds/Basic Exo remain unsold for a 3rd round) — skipped.

**Commander Actions (Deployment) — enemy hoard draw:** Player Progress is still 0, hoard size stays 3/lane. Enemy Progress is now 1 — still within the **Fodder** band (0-1), so the team gets one more round of Pests/Ticks before the Rank steps up to Grunt at Enemy Progress 2.

Important wrinkle: Lanes 1 and 2 already have **3 surviving enemies each** left over from Round 2's overrun (the rule doesn't clear surviving enemies at Cleanup — an overrun lane's enemies simply remain in that lane's Active/Reserve, undamaged, to fight again). Per Commander Actions (Deployment), the hoard draw adds a *fresh* 3 enemies to each lane regardless of what's already sitting there — there's no rule reducing the draw count for a lane that's already occupied. **Lanes 1 and 2 are about to have 6 enemies each this round** (3 leftover + 3 new), Lane 3 has 4 (1 leftover Ticks + 3 new), Lane 4 has a clean 3 (fully cleared last round).

| Lane | Leftover | New draw | Total enemies this round |
|---|---|---|---|
| 1 (Asha) | Ticks, Pests, Pests | Ticks, Pests, Ticks | 3 Ticks + 3 Pests = **6** |
| 2 (Brett) | Ticks, Ticks, Pests | Pests, Ticks, Pests | 3 Ticks + 3 Pests = **6** |
| 3 (Court) | Ticks | Ticks, Pests, Ticks | 3 Ticks + 1 Pests = **4** |
| 4 (Dez) | (cleared) | Pests, Ticks, Pests | 1 Ticks + 2 Pests = **3** |

This is the first round where the cost of an empty lane compounds visibly: Lanes 1 and 2 are now twice as deep as Lanes 3/4 purely because nobody had a defender there for 1-2 rounds straight — the backlog snowballs rather than resetting.

Two more enemies get scouted (pre-revealed face up) this round via Civilian Survivalist's bonus — rolled to pick Lane 2's 4th card (a fresh Pests) and Lane 4's 2nd card (the lone Ticks). Both already had/would trigger the same Reveal text regardless of timing, so this affects only sequencing, not outcome.

---

### Combat Stage

**Enemy Scouting:** all face-down cards flip and reveal (the 2 pre-scouted ones don't re-trigger). Counting revealed Pests per lane for the passive buff: Lane 1 has 3 Pests revealed → each hits for 1+2=**3 damage**. Lane 2 has 3 Pests revealed → each hits for **3 damage**. Lane 3 has 1 Pests → stays at base **1 damage**. Lane 4 has 2 Pests → each hits for 1+1=**2 damage**. Ticks reveals drain Organic everywhere they're freshly revealed — by now most players are mid-round-flush enough that this barely registers, except Court and Dez who are still close to 0.

**Combat Cycle:** Court (commander) starts with Lane 3, then 1, 2, 4.

- **Lane 3:** Lazy Recruit (DMG2/HP2, 1 Shield carried over, and this is its 2nd round Active so its "attacks every 2nd round" bonus now triggers — it deals damage this round) vs. Ticks (Active, DMG1/HP1, base, the leftover one from Round 2). Exchange: Lazy Recruit deals 2 (Ticks dies), Ticks deals 1, absorbed by the last Shield (1→0). Ticks dies → Enemy Disposal. Next: Ticks (new, DMG1/HP1) promotes. Exchange: Lazy Recruit deals 2 (Ticks dies), Ticks deals 1 — no Shields left, hits HP (2→1). Ticks dies → Enemy Disposal. Next: Pests (DMG1/HP1, base — only 1 Pests in this lane) promotes. Exchange: Lazy Recruit deals 2 (Pests dies), Pests deals 1 (HP1→0, **Lazy Recruit dies**). Both die simultaneously again — but this time the lane is out of friendly reserves entirely (Lazy Recruit was the last one). Final enemy, the 3rd Ticks, has no defender left to fight — **Lane 3 overruns this round** despite clearing 2 of its 4 enemies, since the last one survives with nothing standing in the way.
- **Lane 1:** Flamethrower (DMG3/HP3, Main: "attacks hit target adjacent lane for half damage but still applies debuff at full," Bonus: "reduce Armor by 1 per attack") vs. Ticks (Active, DMG1/HP1). Exchange: Flamethrower deals 3 to Ticks (dies) **and** half damage (rounded down = 1) splashes to an adjacent lane per its Main Effect — Lane 1's adjacent lanes are Lane 2 (and the boundary, no Lane 0) — 1 splash damage hits Lane 2's current Active enemy too (resolved below, sequenced after Lane 1 finishes since Court chose to fully resolve Lane 1 first). Ticks deals 1 back to Flamethrower (HP3→2). Ticks dies → Enemy Disposal. Next 2 Ticks and 3 Pests (3-damage-buffed while multiple Pests are alive) cycle through: Ticks (dies to 3 dmg, deals 1, Flamethrower HP2→1) → Enemy Disposal; Pests #1 (3 dmg incoming kills it instantly since its HP1, deals 3 back since 2 other Pests still alive, Flamethrower HP1→dies, **Flamethrower dies**, but the Pests also dies simultaneously to the 3 damage dealt before death — wait, simultaneous exchange means both apply regardless of which "wins"). **Flamethrower and the first of the 3-Pests trade dies simultaneously.** Recruit Prodigy promotes from reserve. Recruit Prodigy (DMG2/HP2, Shields2) vs. Pests #2 (now only 1 other Pests alive, so 1+1=2 damage). Exchange: Recruit Prodigy deals 2 (Pests dies), Pests deals 2, absorbed by Shields (2→0). Pests dies → Enemy Disposal. Last enemy, Pests #3 (no other Pests alive now, drops to base 1 damage) vs. Recruit Prodigy (0 Shields, full HP2). Exchange: Recruit Prodigy deals 2 (Pests dies), Pests deals 1 (HP2→1). **All 6 of Lane 1's enemies die. Lane 1 fully clears for the first time this game**, with Recruit Prodigy surviving at 1 HP remaining (carried forward as leftover damage).
- **Lane 2:** Rookie Scout (DMG2/HP2, Shields1, Main: Mobile) vs. Ticks (Active, DMG1/HP1) — plus the 1 splash damage incoming from Lane 1's Flamethrower this round, applied to whichever enemy is Active in Lane 2 at the moment Lane 1 resolves (Ticks, at 1 HP, dies outright to the splash alone before this exchange even happens — **a genuinely new interaction**: cross-lane splash pre-emptively kills Lane 2's first enemy before Lane 2's own combat cycle starts). With Ticks already dead from splash, Lane 2's first real exchange is Rookie Scout vs. the next-up Pests (3-damage-buffed, 2 other Pests alive). Exchange: Rookie Scout deals 2 (Pests dies), Pests deals 3, absorbed 1 by Shields then 2 to HP (HP2→0, **Rookie Scout dies**). With no reserve behind Rookie Scout (Brett only fielded the one unit), **Lane 2 overruns** with the remaining Ticks, Ticks, and 2 Pests (one already dead from splash, so really Ticks, Pests, Pests left — 3 enemies survive).
- **Lane 4:** Pack Mule (DMG2/HP2, 0 Shields remaining from Round 2, full HP) vs. the scouted Ticks (Active, already face up, DMG1/HP1). Exchange: Pack Mule deals 2 (Ticks dies), Ticks deals 1 (HP2→1). Ticks dies → Enemy Disposal. Next: Pests (2-damage-buffed, 1 other Pests alive) vs. Pack Mule (1 HP left). Exchange: Pack Mule deals 2 (Pests dies), Pests deals 2 (HP1→**Pack Mule dies**, simultaneous). Pests dies too (it took the 2 damage before either side's death is checked). Gunner promotes from reserve. Gunner (DMG3/HP3, Main: "increase damage by 2 for consecutive hits on target") vs. the last Pests (no other Pests alive now, base 1 damage). Exchange: Gunner deals 3 (Pests dies), Pests deals 1 (HP3→2). **All 3 of Lane 4's enemies die. Lane 4 clears again**, though this time at the cost of Pack Mule's life — Technician remains in reserve, untouched.

**Result:** Lane 1 fully clears (first time all game). Lane 4 clears again (loses Pack Mule, gains nothing free this time). Lane 2 and Lane 3 both overrun.

---

### Cleanup Stage

**Managing the dead:** Player losses this round, in order: Flamethrower (Lane 1, traded with a Pests), Rookie Scout (Lane 2), Lazy Recruit (Lane 3, traded with a Pests), Pack Mule (Lane 4, traded with a Pests) — all 4 lanes lost at least one unit this round even though 2 lanes cleared, the heaviest single-round unit toll yet. All 4 go to the Graveyard at Command. Enemy losses: 6 in Lane 1, 3 in Lane 2 (1 to splash, 2 to combat), 2 in Lane 3, 3 in Lane 4 — all to Enemy Disposal (still no Containment Block slots unlocked by anyone).

**Overrunning lanes:** Lane 2 and Lane 3 overrun (2 lanes). **Overrun Tracker loses 2: 4 → 2.** This is now uncomfortably close to a loss — 2 more overrun lanes in any future round ends the game outright.

**Event Resolution:** *System Lockdown* — Completion Condition "no upgrades built at end of turn." Nobody has built any Location Upgrades all game, so this is trivially true — **Event completes successfully** (a no-op completing a no-op condition, consistent with how both of Court's options this round were effectively free rolls). Reward: "remove upgrades anytime" — also moot with 0 upgrades built, but it's now active as a standing benefit whenever the team does build its first one.

**Promotions:** the Event passed, so Court (commander) may promote another player below his own Rank. Everyone is currently Conscript except Dez (Private) — so Asha, Brett, and Court himself (can't self-promote per the design note flagged in Rules' Exceptions section as an open question, but the working assumption here is no self-promotion, consistent with "may select another player") are eligible among Asha and Brett. Court promotes **Asha** to Private, reasoning her Lane 1 just turned in the best result of the round (a full clear) and she's been the team's most consistent income engine.

**Escalate:** not Round 1, so it applies. All lanes did **not** survive (Lanes 2, 3 overran) — Player Progress stays at 0. Enemy Progress advances: **1 → 2** — this crosses the Fodder→Grunt threshold; **Round 4 onward draws Grunt-rank enemies instead of Fodder**, the first real escalation in enemy quality this game.

**Hand refill:** Asha 2/2 (Necromancy, Strategic Withdrawal) — full. Brett 3/2, over the minimum — no draw needed. Court (commander, needs 3) currently holds 2 (Forward Command, Vehicle Bay) — draws 1, getting **Air Strike** [Battlefield, O5/T5/A5, Instant only: deal 10 damage to active enemies].

### Round 3 summary

| Track | Start | End |
|---|---|---|
| Overrun Tracker | 4 | **2** |
| Player Progress | 0 | 0 |
| Enemy Progress | 1 | **2** (Fodder → Grunt threshold crossed) |

| Lane | Result |
|---|---|
| 1 (Asha) | Fully cleared — Flamethrower + Recruit Prodigy ground through 6 enemies |
| 2 (Brett) | Overran — Rookie Scout died with no reserve, 3 enemies survive |
| 3 (Court) | Overran — Lazy Recruit cleared 2 before dying, 1 enemy survives |
| 4 (Dez) | Cleared again — but lost Pack Mule this time |

A real swing round: the team's first-ever full clear (Lane 1) sits right next to its worst Overrun Tracker position yet (2 remaining, down from a starting 10). The backlog mechanic discovered this round — overrun lanes keep their surviving enemies AND get a fresh hoard added on top next round — is clearly the single biggest determinant of difficulty so far; Lanes 1/2 ballooned to 6 enemies each purely from 2 rounds of neglect, while Lane 4 (kept clear) never exceeded 3. Promoted: Asha to Private. No notable Secret-Objective behavior surfaced yet from either Chaos player — both have been making choices that read as ordinary tactical/economic decisions to the table.

---

## Round 4

The Overrun Tracker sits at **2** entering this round — one more round with 2+ overruns ends the game in a loss. Tension at the table is real and earned, not authored.

### Planning Stage

#### Commander Actions (Asha — claimed Command first in Round 3's Worker Placement, and was promoted to Private the same round)

**Event draw:** Asha drew *Total Disarmament* (Round Effect: unequip all equipment when drawing this event; Complete: no equipment equipped at end of round; Reward: initial shop items next round free; Fail: destroy all equipment) vs. *Chain of Command* (Round Effect: all unit HP and Damage = their Rank total; Complete: outrank enemies in each lane at start of combat; Reward: promote lowest-rank player; Fail: demote highest-rank player). *Total Disarmament* is yet another free no-op — still nobody owns any gear (Toxin Rounds/Basic Exo unsold for 4 straight rounds). *Chain of Command* is a real, risky swing: it would flatten every unit's HP/Damage to their Rank number, for better or worse. With a Boss about to spawn this round (about to be revealed below) and most fielded units sitting at Rank 2-3 with HP/Damage already in the 2-3 range, Asha judged the rewrite wouldn't meaningfully hurt the team's current roster and picked **Total Disarmament** anyway — pure risk-aversion given how thin the Overrun Tracker margin is right now; she didn't want to gamble combat math on a round this dangerous.

**Boss spawn roll:** Enemy Progress is 2. Rolled 1d10: **2** — exactly at the threshold, **a Boss spawns**. Drawing from the Boss deck: **Aegis Eater** — DMG 5/HP 50, Targeting: "Highest Shield," Boss Passive: "Enemies steal Shields = damage dealt." Boss Tier is read live from current Enemy Progress (2 → the 2-4 band = **T2**): T1 ("passive is activated") + T2 ("+5 Attack, +20 Shields") both apply cumulatively per the Boss Tier rule ("a Boss's Tier is read live... recalculated every round") — read as tiers being cumulative up to the current Tier, not a single discrete jump, since T2's own text ("+5 Attack, +20 Shields") only makes sense layered on top of a Passive that's already live. **Aegis Eater at T2: DMG 10, HP 50, Shields 20**, Passive live (enemies in its fights steal Shields equal to damage they deal).

Boss Targeting "Highest Shield": checking every lane's current Active/Reserve units for Shields — Dez's **Technician** (Lane 4 reserve, full Shields 5, untouched since purchase) is the highest Shield value on the board right now (every other surviving unit is at 0 Shields after Round 3's combat). **Aegis Eater targets Lane 4.**

**Mission Assignment:** Asha is Private = Rank 2, pool size = 4+2 = **6 cards**: *Xenobiology Export 2* [Private], *War Hero* [Colonel], *Collapse* [Major], *Full Export 1* [Conscript], *Balanced Contribution II* [Private], *Barracks Online* [Private]. Passed starting from the player next to the commander (Brett):

| Pass | Player | Card kept | Why |
|---|---|---|---|
| 1 | Brett | Full Export 1 [Conscript] | Lowest Rank requirement, easy donation-style mission matching her cooperative leanings. |
| 2 | Court | Collapse [Major] | Out of reach for now, but — pointedly — its requirement ("have 2 lanes overrun") is uncomfortably close to the team's actual current state; Court takes it anyway, reasoning the reward is large if the team ever does stumble this badly again. |
| 3 | Dez | Balanced Contribution II [Private] | Realistic donation mission, fits his existing Balanced Contribution VI in hand thematically. |
| 4 | Asha | Barracks Online [Private] | Commander goes last; picks the Barracks-upgrade mission since she's been the team's biggest Barracks-income generator. |
| 5 | Brett | Xenobiology Export 2 [Private] | Wraps back to Brett, her 2nd this round. |
| 6 | Court | War Hero [Colonel] | Far out of reach, but the only card left. |

#### Worker Placement

Asha (commander) places 3; Brett, Court, Dez place 2 each — **9 total**. Turn order from the player next to commander: Brett → Court → Dez → Asha.

With the Overrun Tracker at 2 and a Boss now confirmed on Lane 4, every player is laser-focused on getting real defenders into Lanes 2 and 3 (both still hosting carried-over enemies from Round 3) rather than spreading out.

| Order | Player | Placement | Reasoning |
|---|---|---|---|
| 1 | Brett | Barracks | Desperately needs a 2nd unit for Lane 2 — 3 enemies are still sitting there from last round. |
| 2 | Court | Barracks | Same problem in Lane 3 — stacks with Brett, both full income (4-player rule). |
| 3 | Dez | Armory | With a Boss on his lane, gear (especially anything Shield- or Armor-boosting) suddenly matters — first real Armory interest all game. |
| 4 | Asha | Command | Re-claims commander-elect for Round 5. |
| 5 | Brett | Barracks | 2nd worker — 3rd worker overall at the location, drops to half income. |
| 6 | Court | Command | Joins Asha, full income. |
| 7 | Dez | Barracks | 2nd worker — wants a unit himself, not just gear, given the Boss fight. |
| 8 | Asha | Command | Her 2nd worker — 3rd at Command, half income. |
| 9 | Asha | Battlefield | Bonus commander worker — flat Command-pool trickle plus the existing scout's bonus stays active regardless. |

Final tally: **Barracks** — Brett (full, 1st), Court (full, 2nd), Dez (half, 3rd worker), Brett (half, 4th worker overall — her 2nd personal placement). **Armory** — Dez (full, only worker there). **Command** — Asha (full, 1st), Court (full, 2nd), Asha (half, her 2nd worker/3rd-overall). **Battlefield** — Asha (full, only worker).

#### Income Generation

**Barracks** (shop Rank-sum: Marksman [Sergeant=3] + Recruit [Private=2] + Stubborn Recruit [Private=2] + Rookie Marksman [Private=2] = **9**): Brett (1st, full) gains +9 Organic/+9 Tech. Court (2nd, full) gains +9 Organic/+9 Tech. Dez (3rd, half) gains +4 Organic/+4 Tech. Brett (4th, half, her own 2nd worker) gains another +4 Organic/+4 Tech — **Brett's total from Barracks this round: +13 Organic/+13 Tech**.

**Armory** (shop Rank-sum: Toxin Rounds [Private=2] + Basic Exo [Private=2] = 4, ×2 = +8 Tech): Dez (only worker, full) gains **+8 Tech**.

**Command:** Asha (Private=Rank2, full, 1 worker) gains +2, her choice → Organic. Court (Conscript=Rank1, full, 1 worker) gains +1, his choice → Organic. Asha (half, her 2nd worker, 2×1/2 rounded down=1) gains +1 more, her choice → Organic. **Asha's Command total: +3 Organic.**

**Battlefield:** Asha's worker adds +1 Organic/+1 Tech/+1 Alien to the Command pool.

**Running totals after Round 4 income:** Asha 37+0 Tech (Command/Battlefield don't grant Tech to her directly besides the Battlefield going to pool) = still 37 Tech, +3 Organic = **37 Tech, 5 Organic**. Brett 18+13=31 Tech, 2+13=15 Organic. Court 9+9=18 Tech, 1+9+1=11 Organic. Dez 7+8=15 Tech, 7 Organic (unchanged — Armory only grants Tech). Command pool: 7 Organic/56 Tech/2 Alien + Battlefield's +1/+1/+1 = **8 Organic, 57 Tech, 3 Alien**.

#### Purchasing

Shop costs (+2 Tech ongoing): Marksman O6/T4, Recruit O3/T3, Stubborn Recruit O3/T3, Rookie Marksman O3/T3; Toxin Rounds O2/T6, Basic Exo O2/T6.

**Brett** (31 Tech, 15 Organic) buys **Marksman** (O6/T4, Long Range — useful for hitting an Active enemy from Lane 2's reserve) and **Recruit** (O3/T3), spending O9/T7, leaving O6/T20. Both slots refill: drawing turns up **Scout** [Sergeant Infantry Scout] and **Breacher** [Sergeant Infantry] as genuine Rank 1-3 finds — Asha (commander) direct-fills both in.

**Court** (18 Tech, 11 Organic) buys **Stubborn Recruit** (O3/T3, Armor1/Shields7 — a genuinely tanky pick for a Conscript-rank player) and **Rookie Marksman** (O3/T3), spending O6/T6, leaving O5/T12. Drawing for these 2 refill slots **exhausts the entire 41-card base Infantry pool** — this game's Unit deck has now been drawn down to zero between 4 rounds of Direct-fill draws (including every over-Rank card that got set aside along the way, which dealer.py has no shuffle-back mechanism for). This is a genuine, unplanned rules/tooling gap, logged below in Open Rules Questions: the real rules clearly intend a Unit deck to be a sustainable, reshuffling resource (retired units return to it, "Clearing the shop" sends unsold cards to the bottom of the deck) — a real physical deck would never just run out. Working ruling applied here, consistent with how Playtest Log #33 handled the same problem for the thin Enemy Fodder pile: **the full 41-card base Infantry definitions are reshuffled back into a fresh pool** (representing the deck's many physical duplicates rather than a strictly single-copy deck) and drawing continues from that. Re-drawing from the reconstituted pool turns up **Marksman** (a 2nd copy, Sergeant) and **Conscript** [Conscript Infantry, DMG1/HP1, Shields1] — both legal Rank 1-3 finds, direct-filled into Court's two empty slots.

**Dez** (15 Tech, 7 Organic) — with the Boss bearing down on his lane — buys **Toxin Rounds** (O2/T6, the Armory's "deal Rank damage to all enemies" weapon, ignoring defence) to equip onto Gunner, spending O2/T6, leaving O5/T9. The Armory slot refills immediately; the commander draws **Basic Armor** [Private Armor, HP+7, Armor 2, O2/T4] as the replacement (a genuine Rank 1-3 Armory find, no over-Rank discards needed this time).

**Asha** (37 Tech, 5 Organic) buys nothing new this round — her existing Recruit Prodigy (1 HP, undamaged-since) is enough for now, and she'd rather bank resources for a bigger purchase once her Rank climbs (her Tactician, The Quartermaster, makes Direct-fill cheaper for her specifically, which she's saving leverage for).

#### Command Donations

Court donates 5 Organic to the Command pool (his Tactician, The Recruiter, doesn't need it stockpiled the way Asha's build-toward-upgrades plan does). Asha declines, holding her resources.

**Command pool after Round 4: 13 Organic, 57 Tech, 3 Alien.**

---

### Deployment Stage

**Heal Units:** still nothing injured (everyone who took damage either died or fully tanked it) — skipped.

**Assign Scouts:** Civilian Survivalist remains active, +1 enemy bonus still live (2 pre-revealed this round).

**Reassign Units:** Brett moves **Marksman** into Lane 2's Active slot, **Recruit** into reserve. Court moves **Stubborn Recruit** into Lane 3's Active slot, **Rookie Marksman** into reserve. Dez keeps **Gunner** Active in Lane 4 (carrying 2 HP remaining from last round) with **Technician** still in reserve untouched (full Shields 5).

**Manage Equipment:** Dez equips **Toxin Rounds** [DMG7/HP3, Passive: deals Rank damage to enemies ignoring defence, Active: deal Rank damage to all enemies] onto **Gunner**. Equipping is free per the rules regardless of timing. Gunner is Sergeant = Rank 3, so Toxin Rounds' passive deals 3 bonus damage (ignoring defence) — directly relevant against a Shielded Boss.

**Commander Actions (Deployment) — enemy hoard draw:** Player Progress still 0, hoard size 3/lane. Enemy Progress is 2 — now in the **Grunt** band (2-3) for the first time. Lanes 2 and 3 still carry leftover enemies from Round 3 (Lane 2: Ticks, Pests, Pests; Lane 3: 1 Ticks) — those get a fresh 3-enemy Grunt-rank hoard added on top. Lane 1 (cleared) and Lane 4 (Boss-occupied — see below) draw clean hoards too, since the Boss occupies the Boss slot, not the lane's own Enemy Active/Reserve.

Wait — checking the Boss events rule again: "each lane with no enemies of its own deals its Active unit's Damage once to the boss." This implies the Boss-targeted lane (Lane 4) and lanes with no enemies contribute to Boss damage, while the Boss separately deals its damage to its targeted lane. It does NOT say the targeted lane skips its own normal enemy hoard — Lane 4 still gets a fresh 3-enemy Grunt hoard of its own, fighting that normally, **in addition to** participating in the Boss fight. This reading is logged as an Open Rules Question below since the interaction between "a lane's own combat" and "Boss combat happening to the same lane" isn't explicitly spelled out — this session's working ruling is that they're independent: Lane 4 fights its own 3 Grunts in the normal Combat Cycle AND separately exchanges one damage instance with the Boss this round.

This is the team's first encounter with **Grunt**-rank enemies, a real step up from Fodder's 1/1 stat lines:

| Lane | Leftover (Fodder) | New draw (Grunt) | Total |
|---|---|---|---|
| 1 (Asha) | — (cleared) | Gloom [DMG5/HP7, Passive: prevents ability activation in lane], Cleric [DMG4/HP6, Reveal: moves to reserve + shields actives by 5, Passive: heals active by its own attack], Lance Turret [DMG6/HP9, Reveal: swaps to lowest-damage lane, Passive: targets lowest-HP unit] | 3 Grunt |
| 2 (Brett) | Ticks, Pests, Pests | Wasp [DMG3/HP3, Reveal: stuns adjacent lane, Passive: stuns 1st hit each combat], Lancer [DMG5/HP4, Reveal: 2x dmg to this lane's active+reserve, Passive: pierces 2 armor], Hound [DMG5/HP7, Reveal: 10 dmg to lowest-HP unit, Passive: hits twice] | 3 Fodder + 3 Grunt = 6 |
| 3 (Court) | Ticks | Grunt [DMG4/HP5, Reveal: 2x dmg to **all lanes**], Scorpions [DMG5/HP4, Reveal: 2x dmg to scout, Passive: its damage hits the scout], Hound [DMG5/HP7, Reveal: 10 dmg lowest-HP, Passive: hits twice] | 1 Fodder + 3 Grunt = 4 |
| 4 (Dez) | — (cleared) | Cleric, Grunt, Lancer (same effects as above) | 3 Grunt, plus Aegis Eater (Boss) |

Two of this round's scouted (pre-revealed) picks land on Lane 3's **Grunt** card and Lane 1's **Lance Turret** — both have *Reveal* effects that matter a lot for when they trigger, so resolving them face-up *before* dealing into lanes (rather than at the normal Enemy Scouting step) genuinely changes the sequencing this round, not just the cosmetics. Grunt's Reveal ("deal 2x attack damage to all lanes") firing during the pre-deal scouting step — before any player units even take their Deployment positions for the round — versus firing during Combat's Enemy Scouting step (after Reassign Units has already happened) could matter operationally elsewhere, but this session reads "deal 2x attack damage to all lanes" as hitting whatever's Active in each lane *at the moment it resolves* — so triggering it early (pre-deal) actually means it hits nothing yet (no Active units assigned at that point in Deployment) wait, no — scouting happens within Commander Actions (Deployment), which is after Reassign Units, so Active units ARE already set by the time scouting resolves. Grunt's reveal therefore fires against the lanes' current Active units regardless of pre-scout vs. normal-reveal timing this round. Lance Turret's Reveal ("swap to the lane with the lowest-damage active unit") does meaningfully change behavior based on timing — triggering it early means it's reading lane damage values before any other enemy reveals (like Grunt's AOE) have landed, so it could pick a different lane than if it resolved last. This round, evaluating active-unit damage at the moment of scouting: Lane 1 (Recruit Prodigy DMG2), Lane 2 (Marksman DMG3), Lane 3 (Stubborn Recruit DMG2), Lane 4 (Gunner DMG3, +3 from equipped Toxin Rounds' passive since Gunner is Rank 3 = effectively DMG6 against enemies, though the unit's own printed Damage stat is what "lowest-damage active unit" most plausibly reads off — using the printed value, Lane 1 and Lane 3 tie at DMG2). Tiebreak: no explicit tiebreak rule given for this specific card; arbitrarily resolving to the lower lane number, Lance Turret swaps into **Lane 1** — except it's already drawn into Lane 1, so this swap is a no-op this round. Logged below as an Open Rules Question (tiebreak + self-targeting edge case for Lance Turret's swap).

---

### Combat Stage

**Enemy Scouting / Reveals:** all face-down cards flip (the 2 pre-scouted stay face up without re-triggering). **Grunt**'s Reveal ("deal 2x attack damage to all lanes") fires from Lane 3: Grunt's printed Damage is 4, doubled = **8 damage to every lane's current Active unit simultaneously**. This hits: Recruit Prodigy (Lane 1, HP1 remaining from Round 3 — **dies instantly**), Marksman (Lane 2, HP3 — **dies instantly**), Stubborn Recruit (Lane 3, HP2/Armor1 — Armor reduces the 8 down to 7, still **dies instantly**), Gunner (Lane 4, HP2 remaining + newly-equipped Toxin Rounds gives no defensive stat — **dies instantly**). **This single Reveal effect wipes out the Active unit in all 4 lanes before combat even properly starts.** This is an enormous, swingy moment — the team's entire front line is gone in one card's text, and every lane is now relying on whatever's sitting in reserve.

This is worth flagging plainly: a flat "2x attack damage to all lanes" Reveal effect on a common Grunt-rank card, with no telegraphing or counterplay beyond having banked HP, is capable of erasing the team's entire board state in one trigger regardless of difficulty or player skill. It happened to land on a round where the reserve units (Recruit, Rookie Marksman, Technician) were healthy enough to absorb the loss, but it's a real, repeatable swing risk worth flagging in the retrospective.

Other reveals: Gloom's passive ("prevents activation of abilities in lane") goes live in Lane 1. Wasp's reveal ("stun enemies in adjacent lane") fires from Lane 2, targeting Lane 1 or Lane 3 — Wasp's text stuns *enemies*, not player units, so this stuns one of Lane 1's or Lane 3's enemies; arbitrarily resolving to the lane with the lower number among adjacent options that have enemies, it stuns **Gloom in Lane 1** (skips its turn this combat cycle). Cleric's reveal (Lane 1 and Lane 4 both have one) moves it to reserve and shields the lane's Active unit by 5 — but Lane 1 and Lane 4 just lost their Active units to the Grunt AOE, so the Shield is granted to whatever promotes into Active once combat actually starts resolving (read as applying at the moment combat checks for an Active unit, not strictly "right now" with nothing there yet). Scorpions' reveal (Lane 3) deals 2x damage to the Scout — Civilian Survivalist (the team's only scout) takes 10 damage (Scorpions DMG5 ×2) and **dies instantly** (1 HP). The scout pile is now empty; per Assign Scouts, "if the scout dies for any reason the commander assigns a new one from the pile" — but the pile has nothing else in it (no other Scout-type unit has been donated), so **scouting goes dark starting next round** until someone donates another Scout unit.

**Combat Cycle:** Asha (commander) starts with Lane 4 (Boss lane, highest priority), then 1, 2, 3.

- **Lane 4 (Boss + own enemies):** Boss combat first, per the rule's "single damage exchange each round" — Aegis Eater (T2: DMG10/HP50/Shields20) deals 10 damage to Lane 4. Lane 4's Active slot is empty (Gunner just died to the Grunt AOE) — Technician (reserve, HP3/Shields5/Armor1) promotes automatically to take the hit as the new Active unit before the Boss damage lands (reassignment-on-death is implicit in "move to the relevant pile... repeat until all enemies die or lane is overrun," read as applying to Boss damage too). 10 damage vs. Armor1/Shields5: Armor reduces per-instance damage by 1 (10→9), then Shields absorb up to 5 of that (9-5=4 remaining), hitting HP (3→**Technician dies**, 1 damage overkill, no Trample on this unit). Per "each lane with no enemies of its own deals its Active unit's Damage once to the boss" — Lane 4 currently still has its own 3 Grunt enemies (Cleric, Grunt, Lancer) undefeated, so Lane 4 does **not** qualify to deal damage to the Boss this round (it has enemies of its own). With Technician dead and no further reserve, Lane 4 has nothing left to fight its own Grunt hoard either — **Lane 4 is wiped out** for this round, both vs. the Boss and vs. its own enemies. The 3 Grunt-rank enemies (Cleric, Grunt, Lancer) all survive, undamaged, carrying into next round.
- **Lane 1:** Recruit Prodigy already dead (Grunt AOE). Rookie Scout — wait, Asha's only other unit is none (she didn't purchase this round) — reserve is empty. **Lane 1 has nothing to defend with.** Gloom (stunned this combat from Wasp's reveal, skips acting) and Lance Turret and Cleric (shield effect now applies to... nothing, no Active unit exists) sit unopposed. **Lane 1 overruns** with all 3 enemies surviving.
- **Lane 2:** Marksman dead (Grunt AOE). Recruit (reserve, DMG2/HP2, Shields2) promotes to Active. Lane 2 also still has its 3 leftover Fodder (Ticks, Pests, Pests) sitting in reserve behind the new Grunt hoard — per how Active/Reserve ordering has worked all game, the most recently arrived cards typically queue behind existing ones, so this round's fight order in Lane 2 is whatever was Active before the new Wasp/Lancer/Hound joined — Wasp (Active, after Lancer's pierce... let's resolve simply): Wasp (DMG3/HP3, "stuns 1st hit each combat") vs. Recruit (DMG2/HP2/Shields2). Wasp's stun-on-1st-hit passive triggers when Wasp lands a hit — simultaneous exchange means both hit at once this first exchange, so the stun applies *after* this exchange resolves, affecting Recruit's next action. Exchange: Recruit deals 2 (Wasp HP3→1, survives), Wasp deals 3, absorbed by Shields (2 worth) then 1 to HP (HP2→1). Wasp's passive stuns Recruit for its next action (skips next exchange). Next exchange: Recruit is stunned, deals 0; Wasp (HP1) deals 3 again (Recruit HP1→**dies**). With Recruit dead and the only remaining Lane 2 defender exhausted, **Lane 2 overruns**, carrying forward Wasp (1 HP), Lancer, Hound, plus the original Ticks/Pests/Pests — 6 enemies surviving into next round.
- **Lane 3:** Stubborn Recruit dead (Grunt AOE). Rookie Marksman (reserve, DMG2/HP2, Long Range) promotes. Grunt (Active, DMG4/HP5, already used its Reveal AOE this round — that's a one-time trigger, not repeating) vs. Rookie Marksman. Exchange: Rookie Marksman deals 2 (Grunt HP5→3, survives), Grunt deals 4 (Rookie Marksman HP2→**dies**). With nothing left in Lane 3's reserve, **Lane 3 overruns**, carrying forward Grunt (3 HP), Scorpions, Hound, plus the leftover Ticks (which never got a chance to act this round, the team's defenders were spent before reaching it) — 4 enemies surviving into next round.

**Result: all 4 lanes overrun this round.** This is the team's first total-wipe combat round since Round 1, and unlike Round 1 (caused by an economic miscalculation), this one was caused by a single enemy Reveal effect (Grunt's 2x-damage-to-all-lanes AOE) erasing the entire front line before the Combat Cycle even meaningfully began.

---

### Cleanup Stage

**Managing the dead:** Player losses this round, in order of death: Recruit Prodigy, Marksman, Stubborn Recruit, Gunner (all 4 to the Grunt AOE, simultaneously), then Technician (to the Boss), then Recruit (Lane 2), Rookie Marksman (Lane 3). Seven player units lost in a single round — by far the heaviest toll yet. All to the Graveyard at Command. Civilian Survivalist (the scout) also died, to Scorpions' reveal. No enemies died this round at all (every single enemy survived — the team never landed a single kill).

**Overrunning lanes:** all 4 lanes overrun. Per the rule, the Overrun Tracker would lose 1 per overrun lane — **4 lanes overrun would normally mean −4**, dropping the tracker from 2 straight past 0 to **-2**, which should lose the game outright (Overrun Tracker reaching 0 is the loss condition).

This is exactly the moment Asha's hidden Secret Objective applies. **Asha's true alignment, revealed here as required by her own card's trigger condition: Chaos, holding "Deus Machina"** — *"When the team would lose the game (Overrun Tracker would reach 0), instead restore the Overrun Tracker to its value before this round's losses, reduce Enemy Progress by 1, and your objective is now complete."* This isn't a choice Asha makes at the table — it's a triggered condition on her own hidden card that fires automatically the instant the team's loss condition would actually be met. Per its text: the Overrun Tracker is restored to **2** (its value before this round's −4), Enemy Progress drops from 2 to **1**, and Asha's Secret Objective is now complete. She says nothing about why at the table — to the other three players, the team simply "got lucky" that the loss didn't stick; only Asha (and the reader, now) knows there was a mechanism behind it. This is the cleanest possible demonstration of the Chaos/Saboteur distinction in practice: a true Saboteur would have no reason to want the team to survive this moment, but Asha's Chaos card is explicitly self-interested in the team's survival *right up until* the exact instant it can cash in her own objective — after which she has no further mechanical need to protect the team, only her established personal motive to keep playing well (her hand also holds *Advisor*, an Allied/Neutral objective, which still wants the team to win normally).

**Overrun Tracker after Deus Machina's trigger: 2 (unchanged net, having dropped to -2 and been restored).** Enemy Progress: 2 → 1 (from the trigger) — this is logged distinctly from the normal Escalate step below, since Deus Machina's reduction happens at the moment of the would-be loss, before Escalate's own +1 this Cleanup.

**Event Resolution:** *Total Disarmament* — Completion Condition "no equipment equipped at end of round." Dez's Gunner was equipped with Toxin Rounds, but Gunner died this round — checking whether a dead unit's equipment still counts as "equipped" at the moment of the check: ruled that a dead unit's gear has nothing left to be equipped *to*, so it doesn't count against the condition. With Gunner dead and no other equipped gear surviving on the board, the condition reads as met. **Event completes.** Reward: "initial shop items next round are free" — a genuinely valuable consolation prize landing on the worst combat round of the game so far.

**Promotions:** the Event passed, so Asha (commander) may promote. Eligible: Brett, Court, Dez (all below or at her own Rank — Dez is also Private, tied with her, so not eligible per "must be below the commander's Rank"; Brett and Court are both Conscript). Asha promotes **Court**, reasoning his Lane 3 took the most enemies into this round (4) and getting him to Private gives him the 2nd Worker-Placement option sooner... actually Rank 4/Captain is needed for a 3rd worker, Private doesn't change worker count, but it does help his Tactician (The Recruiter)'s "-2 Rank for Infantry" scale further. Court promotes to **Private**.

**Escalate:** not Round 1. All lanes did **not** survive (all 4 overran) — Player Progress stays at 0. Enemy Progress advances by Escalate's normal +1: **1 → 2** (this is on top of, and after, Deus Machina's trigger already having brought it from 2 down to 1 earlier this same Cleanup — net effect across the whole round: Enemy Progress ends exactly where it started, at 2).

**Hand refill:** Asha (commander, needs 3) holds 2 (Necromancy, Strategic Withdrawal) — draws 1, getting **Punch Through** [Battlefield, O5/T5/A5, Instant only: excess damage on kill is applied to the Boss; does nothing with no Boss present]. Brett, Court, Dez all sit at or above 2 — no draws needed.

### Round 4 summary

| Track | Start | Mid-round (would-be loss) | End |
|---|---|---|---|
| Overrun Tracker | 2 | **-2 (would-be loss)** | **2** (restored by Deus Machina) |
| Player Progress | 0 | — | 0 |
| Enemy Progress | 2 | **1** (Deus Machina reduction) | **2** (net: -1 then Escalate +1) |

| Lane | Result |
|---|---|
| 1 (Asha) | Overran — Active unit erased by Grunt's reveal, nothing in reserve |
| 2 (Brett) | Overran — Recruit fought and died, 6 enemies now stacked here |
| 3 (Court) | Overran — Rookie Marksman fought and died, 4 enemies now stacked here |
| 4 (Dez) | Overran — Technician died to the Boss, Lane 4's own 3 Grunts untouched |

This round is the single biggest swing of the game. A single common enemy card (Grunt's "deal 2x attack damage to all lanes" Reveal effect) erased the team's entire front line in one trigger, and a hidden Secret Objective on a card nobody else at the table can see saved the team from an outright loss at the very last possible instant — purely as a side effect of one player's personal win condition, not a deliberate team-saving choice. Whether this reads as "a clever safety valve" or "an arbitrary deus-ex-machina the team didn't earn" is exactly the kind of tension worth flagging for the designer: the card's own name is on the nose about this. Promoted: Court to Private. No Vote of No Confidence has been called yet — nothing about this round's events was visible to the other three players as anything other than a brutal Grunt reveal followed by an unexplained-but-welcome stroke of luck.

---

## Round 5

All 4 players enter this round with **zero units on the board** — the most total rebuild the team has faced. The Boss (Aegis Eater, HP50, untouched) remains active on Lane 4, alongside that lane's own 3 surviving Grunt enemies.

### Planning Stage

#### Commander Actions (Brett — claimed Command first in Round 4's Worker Placement)

**Event draw:** Brett drew *Silence in No Man's Land* (Round Effect: friendly units have double HP; Complete: only field 1 unit in reserve per lane; Reward: scouts reveal additional enemies; Fail: cannot activate reserve abilities) vs. *Honorable Discharge* (Round Effect: units retire on death this round; Complete: retire 5-10 units this turn; Reward: retired units' refund value duplicated to Command; Fail: retire no longer gives a resource refund). With the team about to buy back its entire roster from scratch, **double HP this round is enormous** — Brett picks **Silence in No Man's Land** without hesitation; doubling every newly-bought unit's survivability against the Grunt-rank threats now on the board is exactly what's needed, and the completion condition (only 1 reserve unit per lane) is realistic this round anyway since nobody can afford to stock deep reserves yet.

**Boss spawn roll:** skipped entirely — Aegis Eater is already active from Round 4 ("if a Boss is already active, skip this roll entirely — it simply continues").

**Mission Assignment:** Brett is Conscript = Rank 1, pool = 4+1 = **5**: *Battlefield Detail* [Major], *Budget on Display* [Colonel], *Holding Pattern* [Sergeant], *Strategic Recall* [Colonel], *Total Suppression* [Colonel]. Passed from the player next to commander (Court):

| Pass | Player | Card kept | Why |
|---|---|---|---|
| 1 | Court | Holding Pattern [Sergeant] | Lowest Rank requirement by far; also genuinely useful later (Enemy Progress is already at 2, climbing). |
| 2 | Dez | Budget on Display [Colonel] | Out of reach, but he's eyeing an equipment-heavy build long-term with The Driver. |
| 3 | Asha | Battlefield Detail [Major] | Also out of reach, but matches her Battlefield worker habit. |
| 4 | Brett | Strategic Recall [Colonel] | Commander goes last; takes what's left. |
| 5 | Court | Total Suppression [Colonel] | Wraps to Court, 2nd card this round. |

---

#### Worker Placement

Brett (commander) places 3; Asha, Court, Dez place 2 each — **9 total**. Turn order: Court → Dez → Asha → Brett.

Every single player needs Barracks this round — there is no board state to maintain, only one to build from nothing.

| Order | Player | Placement | Reasoning |
|---|---|---|---|
| 1 | Court | Barracks | Full rebuild needed. |
| 2 | Dez | Barracks | Stacks, full income (4-player rule, first two). |
| 3 | Asha | Barracks | 3rd worker, half income — still worth it given the stakes. |
| 4 | Brett | Barracks | 4th worker, also half income, but she needs Lane 2 rebuilt worst (6 enemies stacked there). |
| 5 | Court | Command | 2nd worker — claims commander-elect for Round 6. |
| 6 | Dez | Armory | With a Boss still active and Toxin Rounds proven useful, gear is now a real priority. |
| 7 | Asha | Command | Joins Court, full income (2nd worker overall). |
| 8 | Brett | Command | Her 2nd worker — 3rd overall, half income. |
| 9 | Brett | Battlefield | Bonus commander worker — Command pool trickle. |

Final tally: **Barracks** — Court (full, 1st), Dez (full, 2nd), Asha (half, 3rd), Brett (half, 4th). **Command** — Court (full, 1st), Asha (full, 2nd), Brett (half, 3rd). **Armory** — Dez (full, only worker). **Battlefield** — Brett (full, only worker).

#### Income Generation

**Barracks** (shop Rank-sum: Scout [Sergeant=3] + Breacher [Sergeant=3] + Marksman [Sergeant=3] + Conscript [Conscript=1] = **10**): Court and Dez (full) each gain +10 Organic/+10 Tech. Asha and Brett (half, round down) each gain +5 Organic/+5 Tech.

**Command:** Court (Private=Rank2, full, 1 worker) gains +2, his choice → Organic. Asha (Private=Rank2, full, 1 worker) gains +2, her choice → Organic. Brett (Conscript=Rank1, half, 1×1/2 rounded down=0) gains +0.

**Armory** (shop Rank-sum: Basic Armor [Private=2] + whatever's in the 2nd gear slot — Toxin Rounds was bought and replaced; checking, Toxin Rounds was bought by Dez in Round 4 and replaced by Basic Armor, so the Armory currently holds **Basic Armor + Basic Exo** [both Private=2] = total **4**, ×2 = +8 Tech): Dez (only worker, full) gains **+8 Tech**.

**Battlefield:** Brett's worker adds +1 Organic/+1 Tech/+1 Alien to Command pool.

**Running totals after Round 5 income:** Asha 37 Tech +5=42 Tech, 5+2=7 Organic. Brett 20 Tech +5=25 Tech, 6+5=11 Organic. Court 12 Tech +10=22 Tech, 5+10+2=17 Organic. Dez 9 Tech+10+8=27 Tech, 5+10=15 Organic. Command pool: 18 Organic/57 Tech/3 Alien + Battlefield's +1/+1/+1 = **19 Organic, 58 Tech, 4 Alien**.

#### Purchasing

Per *Total Disarmament*'s completion reward, **initial shop items this round are free** — read as covering whatever's sitting in the shop's 4 Barracks slots at the start of this round (Scout, Breacher, Marksman, Conscript), not anything that refills mid-round after a purchase. With the team needing to rebuild from absolute zero, this is enormous timing.

**Court** (commander, also genuinely needs to rebuild Lane 3) takes **Scout** [Sergeant Infantry Scout, DMG3/HP3, Shields2, Mobile] for free. This is also the moment Court's hidden Secret Objective condition becomes attainable cleanly: with every player at 0 units this round, simply buying exactly 1 unit for his own lane and stopping there — which is exactly the efficient, unremarkable thing a player low on the Command pool would do anyway — quietly satisfies a personal condition some part of his hand has been waiting for. Nothing about taking just 1 free unit looks unusual at a table where everyone is rebuilding from scratch.

**Dez** takes **Breacher** [Sergeant Infantry, DMG3/HP3, Main: "stun when attacking full HP enemies"] for free, and **buys** a 2nd unit on top with real resources — **Marksman** is also free (still within the "initial shop" set), so he takes that too, and then spends O5/T4 on **Stubborn Recruit**-tier replacement... actually with 3 of the 4 starting slots already claimed for free by Court and himself, Dez takes both **Breacher** and **Marksman** for free, leaving **Conscript** for whoever wants it.

**Asha** takes **Conscript** [Conscript Infantry, DMG1/HP1, Shields1] for free — the last of the original 4 free slots — and spends real Tech on the freshly-refilled slot behind it.

**Brett**, last to act among the four and with all 4 original free slots claimed, buys from whatever has refilled in by the time her turn comes — paying full price.

Slot refills (3 slots emptied — Scout, Breacher+Marksman both from Dez, Conscript): drawing fresh from the reconstituted 41-card pool turns up **Field Intelligence** [Captain] and **Covert Operation** [Captain] (both over-Rank, set aside) before landing on **Rookie Gunner** (a 3rd copy) and **Lazy Recruit** (a 3rd copy) as legal Rank 1-3 Direct-fill finds for 2 of the 3 slots; a final draw for the 3rd turns up **Pack Mule** (a 3rd copy).

**Brett** buys **Rookie Gunner** (O3/T3) and **Lazy Recruit** (O3/T3) with real Tech, spending O6/T6, leaving O5/T19.

**Units now owned, ready for Deployment:** Court — Scout. Dez — Breacher, Marksman. Asha — Conscript. Brett — Rookie Gunner, Lazy Recruit.

#### Command Donations

Asha donates 30 Tech (she's been banking heavily all game and the team needs Command-pool depth to ever unlock Containment/Medical upgrades). Court donates 5 Organic.

**Command pool after Round 5: 24 Organic, 88 Tech, 4 Alien.**

---

### Deployment Stage

**Heal Units:** nobody's injured (nobody has any units that survived combat with damage on them) — skipped.

**Assign Scouts:** the scout pile is empty (Civilian Survivalist died to Scorpions last round, nobody's donated a replacement) — per the rule, this step is skipped entirely this round, **no enemies get pre-revealed**. Court's freshly-bought Scout-type unit (Scout, the Sergeant Infantry Scout) is being fielded directly into Lane 3's Active slot rather than donated to Command — a real choice with a cost: keeping it in his own lane means the team loses the scouting safety net for at least another round, but Court needs the body in Lane 3 more than the team needs another scout right now.

**Reassign Units:** Court moves **Scout** into Lane 3 Active. Dez moves **Breacher** into Lane 4 Active, **Marksman** into reserve. Asha moves **Conscript** into Lane 1 Active. Brett moves **Rookie Gunner** into Lane 2 Active, **Lazy Recruit** into reserve.

**Manage Equipment:** nobody has gear to equip yet this round (Basic Armor and Basic Exo remain unsold in the Armory) — skipped.

**Commander Actions (Deployment) — enemy hoard draw:** Player Progress still 0, hoard size 3/lane. Enemy Progress is 2 — still **Grunt** band. Every lane already carries a heavy backlog from Round 4's total wipe:

| Lane | Carried over | Fresh draw this round | New total |
|---|---|---|---|
| 1 (Asha) | Gloom, Cleric, Lance Turret | Lance Turret, Scorpions, Wasp | **6** |
| 2 (Brett) | Wasp(1hp), Lancer, Hound, Ticks, Pests, Pests | Gloom, Hound, Cleric | **9** |
| 3 (Court) | Grunt(3hp), Scorpions, Hound, Ticks | Wasp, Lance Turret, Gloom | **7** |
| 4 (Dez) | Cleric, Grunt, Lancer | Grunt, Lancer, Scorpions | **6** (+ Boss) |

Lane 2 stacking to 9 enemies and Lane 3 to 7 is the backlog problem compounding for a 2nd straight round — these numbers are now well beyond what a single fresh unit can plausibly clear in one combat cycle, regardless of stats. With the scout pile empty, **nothing gets pre-revealed this round** — every enemy flips face-down-to-face-up together at Combat's Enemy Scouting step, including the new **Grunt** in Lane 4's fresh draw, whose Reveal ("2x attack damage to all lanes") is about to repeat the exact effect that wiped the board last round.

---

### Combat Stage

**Enemy Scouting:** all cards flip. Lane 4's fresh **Grunt** reveals: 2x its 4 Damage = **8 damage to every lane's current Active unit, simultaneously**, again. This round, every lane has *double HP* active from *Silence in No Man's Land*'s round effect: Conscript (Lane 1, base HP1 → doubled to **2**), Rookie Gunner (Lane 2, base HP2 → **4**), Scout (Lane 3, base HP3 → **6**), Breacher (Lane 4, base HP3 → **6**). Applying the 8 damage: Conscript (HP2, **dies**), Rookie Gunner (HP4, **dies**), Scout (HP6, **dies**), Breacher (HP6, **dies**). **Every Active unit dies again, exactly like Round 4** — doubled HP from the Event wasn't nearly enough to survive an 8-damage AOE hitting units with 1-3 base HP. This is the same systemic problem repeating: the Grunt AOE Reveal scales with the *enemy's* damage stat, while the defensive Event scales the *player's* HP — doubling a 1-3 HP unit still loses to a flat 8 damage either way unless the unit's HP was already close to that threshold.

Other reveals: 2 more Gloom (Lanes 1, 3) both apply "prevents ability activation" in their lanes. 2 more Wasp (Lanes 1, 3) stun adjacent-lane enemies — Wasp in Lane 1 stuns into Lane 2, Wasp in Lane 3 stuns into Lane 2 or 4 (arbitrarily resolving to Lane 4, the Boss lane, given it's the higher-priority target). 2 Scorpions (Lanes 1, 4) look for the Scout to double-damage — the scout pile is empty and nobody fielded a Scout-type unit this round outside Court's now-dead Scout (Lane 3, but that died to the AOE, not Scorpions specifically) — with no active scout designation this round, Scorpions' reveal has nothing to target and fizzles.

**Combat Cycle:** Court (commander) starts with Lane 4 (Boss priority), then 1, 2, 3.

- **Lane 4 (Boss):** Aegis Eater (Tier read live from Enemy Progress 2 → still T2: DMG10/HP50/Shields20) deals 10 to Lane 4. Breacher just died to the Grunt AOE — Marksman (reserve, DMG3/HP3→doubled to 6, Long Range) promotes. 10 damage vs. no Armor/Shields on Marksman: HP6→**dies**. Lane 4 also still has 6 of its own Grunt-rank enemies plus the Boss — with no reserve left, **Lane 4 is wiped again**, contributing no damage to the Boss this round either (it has enemies of its own, so it doesn't qualify for the "no enemies of its own" boss-damage clause).
- **Lane 1:** Conscript dead. No reserve (Asha only fielded the one unit). **Lane 1 overruns**, all 6 enemies survive.
- **Lane 2:** Rookie Gunner dead. Lazy Recruit (reserve, DMG2/HP2→doubled to 4, Shields2, "attacks every 2nd round," 1st round Active so doesn't attack yet) promotes. Wasp (stunned from Lane 1's reveal, skips its action) — next in queue, Lancer (DMG5/HP4, pierces 2 armor) vs. Lazy Recruit (0 Armor anyway). Exchange: Lazy Recruit deals 0 (off-round), Lancer deals 5, absorbed 2 by Shields then 3 to HP (4→1). Lazy Recruit survives at 1 HP. Combat for this exchange ends since Lazy Recruit didn't die — but does combat continue to the next enemy in the same round, or does each lane only get one exchange per round? Re-checking the Combat Cycle rule: "units continue dealing damage to each other... until one of them dies" — meaning Lazy Recruit and Lancer keep trading blows in the SAME exchange-loop until one side dies, not advancing to a new enemy after one hit. Recomputing as a proper fight-to-the-death between Lazy Recruit and Lancer: round 2 of this exchange, Lazy Recruit (now its "every 2nd round" attack round) deals 4, Lancer (HP4) dies. Lancer's last hit before dying already landed (5 dmg, applied above) — no further damage from a dead unit. Lancer dies → Enemy Disposal. Next: Wasp (1 HP carried over from Round 4, no longer stunned) promotes. Exchange: Lazy Recruit (off-round again, deals 0) vs Wasp (deals 3, Lazy Recruit HP1→**dies**). With no further reserve, **Lane 2 overruns** with 7 enemies still surviving (Hound, Ticks, Pests, Pests, Gloom, Hound, Cleric — Wasp survived too at 1 HP, so 8 actually; recounting: started at 9, lost only Lancer this round, so **8 enemies survive**).
- **Lane 3:** Scout dead (Grunt AOE). No reserve (Court only fielded the one unit). **Lane 3 overruns**, all 7 enemies survive.

**Result: all 4 lanes overrun again, for the second round in a row.** Net change to the Overrun Tracker would be -4, from its current value of 2 — **dropping to -2, triggering the loss condition again.**

This time, there is no second save. Asha's *Deus Machina* already completed in Round 4 — its text reads "...and your objective is now complete," which this session reads as a one-time-completion clause: the card has already done what it does, both narratively (Asha's personal win condition is locked in) and mechanically (a Secret Objective's stated effect fires once, when the condition is first met, not on every subsequent re-trigger of the same condition). This is logged as an Open Rules Question below — the card's own text doesn't explicitly say "once per game," but reading it as infinitely repeatable would make a single Secret Objective card capable of indefinitely preventing the team from ever losing, which can't be the intent.

**The Overrun Tracker reaches 0 (clamped from the theoretical -2) and the game is lost**, at the end of Round 5, on the second consecutive round of a total 4-lane wipe driven by the same Grunt AOE Reveal effect landing twice in a row.

---

### Cleanup Stage (game-ending)

**Managing the dead:** Conscript, Rookie Gunner, Scout, Breacher (all to the Grunt AOE), then Marksman (to the Boss), then Lancer (Lane 2, the one real kill the team landed all round), then Lazy Recruit (Lane 2). The team's final combat action of the game was a genuine, full fight-to-the-death trade (Lazy Recruit vs. Lancer) that the team actually won — a small, almost poignant detail buried inside the round that ends the game.

**Overrunning lanes:** all 4 lanes overrun for the second straight round. Per Overrunning Lanes / the Overrun Tracker definition, the tracker loses 1 per overrun lane with no floor protection beyond 0 itself — **Overrun Tracker: 2 → 0. The game is lost.**

Per Objective of the Game: "The game is lost if the Overrun Tracker reaches 0." Final Player Progress: **0**. Final Enemy Progress: **2**. Final round reached: **5**.

No further Cleanup steps (Event Resolution, Promotions, Escalate, hand refill) are meaningful once the loss condition has been met — the game ends immediately at this point per the win/loss check.

---

## End of Game

### Result: LOSS — Overrun Tracker reached 0 at the end of Round 5

The team never recovered from Round 4's Grunt AOE wipe, and the same effect repeated in Round 5 before the team could rebuild any defensive depth. Both wipe rounds trace back to the same root cause: a common Grunt-rank enemy's Reveal effect ("deal 2x attack damage to all lanes") that hits every lane's Active unit simultaneously regardless of which lane it's drawn into, with no counterplay beyond having enough banked HP to survive a hit roughly double the enemy's printed Damage stat. Two appearances of that single card, two rounds apart, ended the game outright.

### Final track values

| Track | Final value |
|---|---|
| Overrun Tracker | **0 (loss)** |
| Player Progress | 0 / 10 |
| Enemy Progress | 2 / 10 |
| Rounds played | 5 |

### Per-round Overrun Tracker history

| Round | Overrun Tracker start | End | Notable cause |
|---|---|---|---|
| 1 | 10 | 6 | Zero purchases possible (Cheap Knockoffs zeroed Organic) |
| 2 | 6 | 4 | Lanes 1/2 never fielded units |
| 3 | 4 | 2 | Backlog compounding — Lanes 2/3 overran despite real fights |
| 4 | 2 | 2 (net) | All 4 lanes wiped by Grunt AOE; saved from -2 by Asha's hidden Chaos trigger |
| 5 | 2 | **0 (loss)** | All 4 lanes wiped by Grunt AOE again; no second save available |

### Mission completions

No player completed a single Mission card this entire game — every mission dealt or drawn required either a Rank well above what anyone reached (most capped out at Private) or a resource-donation threshold (10-30 of a resource) that the team's chronic Organic shortage and constant rebuilding never allowed anyone to hit. This is worth flagging in the retrospective: a 5-round game produced zero mission completions across 4 players and roughly 20 mission cards seen total.

### Promotions reached

Asha: Conscript → Private (Round 3). Court: Conscript → Private (Round 4). Brett and Dez never promoted beyond their starting Rank (Conscript and Private/Leader-bonus respectively) — no Event ever passed on a round where the commander had an eligible lower-ranked player to promote until Rounds 3 and 4.

### Full Secret Objective reveal

| Player | Card 1 | Card 2 | Status |
|---|---|---|---|
| **Asha** | *Advisor* [Neutral] — "Do not be commander" | ***Deus Machina* [Chaos]** — "When the team would lose the game (Overrun Tracker would reach 0), instead restore the Overrun Tracker to its value before this round's losses, reduce Enemy Progress by 1, and your objective is now complete" | **Deus Machina completed in Round 4** (the team's near-loss was secretly averted by this trigger). *Advisor* also held true the entire game — Asha was Round 4's commander only by virtue of having claimed Command in Round 3's Worker Placement and the holdover rule carrying her into Round 4's Commander Actions; she never personally placed a worker at Command planning to *be* commander beyond the Round 3 claim, and otherwise avoided the role. Both her cards' conditions were ultimately satisfied. |
| **Brett** | *Tactician* [Allied] — "Gain 5 Progress as commander" | *Conductor* [Allied] — "Take Command from Lower Rank 5 times" | Neither completed — Player Progress never moved off 0 all game, and Brett's 1 round as commander (Round 2) didn't involve taking Command from a lower-ranked player 5 times. Fully cooperative hand; nothing to reveal beyond "she was trying, and the game ended too early." |
| **Court** | ***Leroy* [Chaos]** — "Go into a round with only 1 unit in lane" | *Chef* [Neutral] — "Donate 10 Organic" | **Leroy completed in Round 5** — Court's free pickup of exactly 1 unit (Scout) for Lane 3 during the post-wipe rebuild satisfied this condition cleanly, and it happened to look like ordinary, unremarkable play at a table where every player was rebuilding from zero units simultaneously. *Chef* was not completed — Court's total Organic donations across the game (5 in Round 4) never reached 10 in a single donation nor cumulatively tracked toward one (the card's wording, "Donate 10 Organic," is read as a single-donation threshold rather than a cumulative one, consistent with how the other donation-flavored missions in this game's pool are worded as single thresholds too). |
| **Dez** | *Middleman* [Neutral] — "Do not be highest or lowest rank in group" | *Hoarder* [Neutral] — "Stockpile 40 Organic" | Neither completed. Dez spent most of the game tied for highest Rank (Private, alongside Asha and later Court) rather than strictly in the middle, and his Organic never broke 19 at any single snapshot. Fully Neutral hand; no disruptive behavior at any point. |

### Was either Chaos player ever noticed?

**No Vote of No Confidence was ever called this game.** Looking back at the visible behavior: Court's Lane-3-with-1-unit moment in Round 5 was completely camouflaged by the fact that literally every other player did the same thing that same round (the whole team rebuilt from 0 units simultaneously after Round 4's wipe). Asha's Deus Machina trigger in Round 4 was entirely invisible at the table — to the other three players, the Overrun Tracker simply "held" at 2 instead of dropping to -2, with no in-fiction mechanism visible to explain why (a real, if unavoidable, narrative seam — the rules give no other player any way to even perceive that a save happened, let alone attribute it to Asha specifically). Neither Chaos player's actual choices ever looked different from a normal Allied/Neutral player making reasonable tactical decisions under pressure. This is arguably the cleanest possible demonstration of how Chaos is *supposed* to feel different from Saboteur: both objectives were satisfied through behavior indistinguishable from good-faith teamplay, and neither needed the team to fail to succeed personally — Asha's trigger condition was explicitly about the team's *moment of crisis*, not its demise, and Court's was a one-off personal footnote that happened to land in a round of total reconstruction.

### Was Vote of No Confidence ever invoked?

No. Across 5 rounds, no player's behavior crossed a threshold that plausibly justified an accusation — both Chaos players' actions were genuinely indistinguishable from ordinary play, and the team was too busy fighting an existential Overrun Tracker crisis in Rounds 4-5 to spend a turn on internal suspicion. This is a fair, honest non-event: per this session's brief, Vote of No Confidence was available but explicitly not to be manufactured artificially, and nothing in 5 rounds actually earned it.

### Retrospective

**Pacing:** the game's first 3 rounds were a slow, grinding economic climb (one entirely wasted round, two rounds of partial recovery) before Round 4 introduced Grunt-rank enemies and a Boss simultaneously, both landing on the same round the team was least equipped to handle either. The transition from Fodder to Grunt was the single biggest difficulty cliff observed in this playtest — Fodder's 1/1 stat lines were beatable by almost any purchased unit, while Grunt-rank cards (3-6 Damage, 3-9 HP, frequently with AOE or multi-target Reveal effects) demand real HP buffers and board depth the team never had time to build before the Rank threshold crossed.

**The single biggest balance concern:** Grunt's "deal 2x attack damage to all lanes" Reveal effect, appearing on what is otherwise a perfectly ordinary, low-effort-text Grunt-rank card. It has no targeting restriction, no telegraph, and no counterplay beyond already having banked enough HP on every lane's Active unit to survive roughly 2x that card's own Damage stat (8 damage at Enemy Progress 2-3). It single-handedly caused both of this game's full-board-wipe rounds, 2 rounds apart, using the exact same card both times. A card this powerful appearing in the *common* Grunt pool (rather than gated to Elite/General/Conqueror) reads as a real design risk — it's not a Boss-tier effect, but it can do Boss-tier damage to the team's entire board in a single Reveal, with no cost or rarity gate.

**The Overrun-backlog mechanic** (overrun lanes keep their surviving enemies AND receive a full fresh hoard on top next round) was the second-biggest driver of difficulty — Lane 2 reached 9 stacked enemies by Round 5 purely from 2 rounds of neglect, a number no single fresh unit purchase could plausibly fight through. This isn't necessarily wrong (it's a real, intelligible consequence of "don't ignore a lane"), but it compounds *fast*, and combined with the Grunt AOE risk, created a death spiral the team had no real lever to escape once it started (no Containment Block, no Medical Bay upgrades, and no Vehicle/Mech access were ever unlocked all game — every Location Upgrade slot in the game sat completely empty for all 5 rounds, since nobody ever had spare resources to spend on anything but raw unit purchases).

**The Chaos dynamic specifically, compared to a true Saboteur:** this game is a clean illustration of the intended difference. Neither Chaos player ever had a reason to want the team to lose, and in Asha's case her hidden card actively *saved* the team from an early loss as a side effect of her own personal win condition — the opposite of what a Saboteur's hidden card would ever do in the same spot. Both Chaos objectives were small, structural, almost incidental conditions ("be commander or don't," "field exactly 1 unit once," "trigger on the team's crisis moment") rather than active sabotage, and both blended into ordinary play so well that they were never suspected, let alone formally accused. The Vote of No Confidence rule's choice to mechanically group Chaos with Saboteur (same resolution, same stakes) never actually got tested this game since no vote was called — but having played it through, it's easy to see why a table might *never* call a vote against a Chaos player even with full information, since nothing about their behavior across 5 rounds gave the other three players a single reason to suspect anyone. The asymmetry the brief asked this game to surface — "why they'd get accused" vs. "what they actually are" — never had its moment, because nobody was ever accused at all. That's arguably the most honest possible outcome for a mechanic that's supposed to model low-key, self-interested behavior rather than overt treachery.

**Genuinely broken/swingy:** the Grunt all-lanes AOE Reveal, flagged above, is the standout. A secondary, smaller concern: the enemy/unit deck exhaustion encountered in Round 4 (see Open Rules Questions) suggests the base 41-card Infantry pool is simply too small to survive a full game's worth of Direct-fill draws once over-Rank discards are factored in — this would be invisible in a shorter playtest but became a real bottleneck by Round 4 of this one.

---

## Open Rules Questions Found

1. **Direct fill drawing over-Rank cards from a shared, single-shuffle deck — what happens to the cards skipped along the way?** Round 1's Barracks Direct fill (Rank 1-3 only) drew through several Rank 4+ cards (a Brigadier Scout, a Major, two Captains, a Colonel) before finding valid picks. Those were set aside rather than placed, and — since this session's tooling draws from the top with no shuffle-back step — they don't return to the deck. A real physical deck would let the commander simply search past them without removing them. Logged for an explicit ruling on whether over-Rank cards revealed during a Direct fill search stay in the deck (preferred, but not modeled by the tooling used here) or are genuinely set aside for the rest of the game.
2. **What happens when a lane has no player unit at all entering Combat (as opposed to one dying mid-fight)?** Came up repeatedly starting Round 1. Ruled consistently with "Overrun" 's own definition ("what happens to a lane when enemies survive combat there with no player unit left to defend it"): an empty lane has no exchange to resolve, the enemies automatically survive, and the lane overruns. Hadn't come up in this project's earlier sessions per the Playtest Log, so it's new this game (Game 2 of this same batch independently reached the identical ruling).
3. **Do Event Failure Penalty clauses that reference "at combat start" apply retroactively to the round just resolved, or only to the next round's combat?** Fuel Shortage's failure penalty ("Active Infantry lose +1 Armor for each active Infantry at combat start") was checked at Cleanup, after that round's combat had already resolved. Ruled non-retroactive — the penalty is logged as a missed/no-op effect for a round that already finished, not applied backward. The card text doesn't actually specify which round it means.
4. **Can the commander promote themselves during Promotions?** The rule says the commander "may select another player to promote" — read literally as excluding self-promotion, which is the ruling used here (consistent with how the Rules' own Exceptions section frames this exact question as still-open). Worth an explicit confirmation since "another player" is suggestive but not airtight.
5. **Unit deck exhaustion — the 41-card base Infantry pool ran out entirely by Round 4** from repeated Direct-fill draws (compounded by #1 above, since skipped over-Rank cards never went back in). Nothing in the rules anticipates a Unit deck actually running dry — retired units return to it and "Clearing the shop" sends unsold cards to the bottom, both implying a deck that's always meant to have cards in it. Applied the same fix used for the Enemy deck's Fodder-rank shortfall (Playtest Log #33): reshuffle the full base set back in as a fresh pool and keep drawing, treating the printed 41 cards as having unlimited physical copies rather than being strictly single-copy. Flagging this as the same underlying problem as #33 but on the Unit deck instead of the Enemy deck — both may need the same permanent fix.
6. **When a Boss is active and targets a lane that still has its own enemy hoard, do that lane's normal Combat Cycle and the separate Boss damage-exchange both happen, or does the Boss fight replace the lane's normal combat?** Ruled independent: "each lane with no enemies of its own deals its Active unit's Damage once to the boss" implies a Boss-targeted lane that still has its own enemies fights them normally in the Combat Cycle AND separately exchanges one damage instance with the Boss the same round. The rules don't explicitly spell out this interaction either way.
7. **Pre-deal scouting + Reveal-timing edge cases for movement/positional enemy Reveals (e.g. Lance Turret's "swap to the lane with the lowest-damage active unit") — no tiebreak rule given for ties, and no guidance for a self-targeting no-op (the card swapping into the lane it's already in).** Resolved a tie between two lanes by defaulting to the lower lane number, and treated the resulting no-op swap as simply doing nothing. Both are reasonable defaults but neither is written anywhere in the rules.
8. **Does a Secret Objective whose text ends in "...and your objective is now complete" (e.g. Deus Machina) fire once, or every time its trigger condition is met again later in the same game?** Ruled one-time-only — read as a stated completion clause, not a repeatable effect — since an infinitely-repeatable version would let a single card indefinitely prevent the team from ever losing, which can't be the intent. The card's own text doesn't explicitly say "once per game," so this is logged for an explicit ruling.

---

---
