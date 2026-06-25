# Playtest Game 4 — Full Walkthrough (2026-06-25)

## Purpose of this game

The previous batch of 3 manual playtests (Games 1-3, logged in `Playtest Log - Full Game Walkthrough.md`) all ended in a **loss**, all relatively early (Round 4, Round 5, Round 5), and all via the same pattern: the team never built up enough resources/units in the opening 1-2 rounds to survive the climb into tougher enemy ranks, then got run over once enemies started escalating. The post-batch review attributed this to **early-game resource/Rank starvation**, not to any particular difficulty cliff at the Fodder-to-Grunt transition — that "Grunt cliff" was suspected to be a red herring; the real bottleneck was the team simply not having enough income, workers, or Rank in the first couple of rounds to ever get rolling.

In response, 17 rule changes were written (README Feedback **#31-40**, consolidated from Playtest Log resolutions) and folded into `Rules.docx`. This game is the first real test of whether they work. The specific levers under test, all called out in the brief:

- **Round 0**: a full Planning + Deployment prep round before Round 1, no enemies, no Combat Stage.
- **Lane Reinforcement**: a cleared lane can send leftover units to bail out a struggling lane, same round.
- **Same-round Reserve promotion**: a dead Active unit is immediately replaced by its own Reserve, same round, same combat.
- **Gear-survives-1-item on unit death** (owner's choice).
- **Worker-free Command Donations** (resources and Scout-unit donations).
- **Empty scout pool still reveals 1 card** (just no Scout Value income).
- **Tech cost to equip gear** (= gear's Rank number).
- **Rank-separated Unit/Gear decks** for Direct fill.
- **Command Card hand size 3/4** (up from 2/3).
- **2 starting Organic per player.**
- **Mission Rank-scaling bonus promotion** (+2 total Rank for a 3+ tier stretch mission).
- Plus the smaller clarifications (empty-lane-is-overrun, overrun-hits-0-ends-immediately, "at combat start" timing, no-self-promotion, impossible-Event-redraw) applied correctly wherever they come up.

If these fixes work, this game should survive meaningfully longer than 4-5 rounds, and should get through the Fodder→Grunt enemy-rank transition (Enemy Progress 2) with the team still in reasonable shape — confirming the "resource starvation, not a Grunt cliff" diagnosis. If the team still collapses early, that diagnosis needs revisiting.

## Game Parameters

- **Players:** 4 (all seats narrated by the assistant)
- **Difficulty:** Normal (Overrun Tracker starts at 10; hoard size 3/lane base, +1 at Player Progress 5-7, +1 more at 8-10, caps at 5/lane)
- **Optional rules in use:** Commander's Call (commander chooses who gets full income at a shared location, instead of default lowest-Rank-priority)
- **Secret Objectives:** Allied/Neutral only this game (no Saboteur/Chaos) — a clean mechanical baseline, not a hidden-information test
- **Tooling:** `dealer.py` (updated for Rank-separated Unit/Gear piles), seed `4004`, state file `state_game4.json`, align mode `exclude_chaos_saboteur`

## The Table

| Seat | Name | Starting Rank | Lane | Tactician | Secret Objectives |
|---|---|---|---|---|---|
| P1 | Avery | **Private** (Leader, +1 Rank) | 1 | The Recruiter | Minimalist (Neutral), Hoarder (Neutral) |
| P2 | Blair | Conscript | 2 | The Jailer | Nerd (Neutral), Stubborn (Allied) |
| P3 | Casey | Conscript | 3 | The Engineer | Leader (Allied), Conductor (Allied) |
| P4 | Drew | Conscript | 4 | The Kingmaker | Survivor (Neutral), Technician (Neutral) |

Leader was decided by a d8 roll mod 4 (result 5 → seat 1, **Avery**). Avery starts at Private (+1 Rank for being Leader) and begins with 4 Command Cards instead of 2 (the standard 2 plus the Leader's +2 bonus): Donor Organs, Ethics Committee, Priority Construction, Barrier Systems. Everyone else holds the standard starting 2 Command Cards.

Notable Secret Objective: Casey holds **"Leader" (Allied) — be commander for 5 turns**, and Drew's Tactician, **The Kingmaker**, has a Passive reading "You cannot be the commander; if you would become commander, make another player commander instead." This was a coincidence of the deal, not engineered — it'll be honored honestly: Drew is simply never eligible to take the Command worker-placement race, full stop, for the entire game.

Per Player Setup (README #36), each player also starts with **2 Organic** on top of their normal starting cards. All starting hands above already reflect that.

---

## Setup

**Decks.** Per Managing Decks: Secret Objectives, Missions, Events, Tactician, and Command Cards shuffled as single piles. Enemies separated into Rank piles (Fodder/Grunt/Core/Advanced/Elite/General/Conqueror). Units: Vehicles and Mechs set aside, the remaining Infantry-type pool split into Rank piles (Conscript through Brigadier) — this is the new behavior from README #39. Gear: Experimental set aside, remaining gear split into Rank piles the same way.

```
Units(base)=41 setaside=62 (Vehicles/Mechs)
Gear(base)=60 setaside=8 (Experimental)
Enemy piles: Fodder=2, Grunt=8, Core=6, Advanced=35, Elite=14, General=17, Conqueror=11
Secret=26 (post-deal, Allied/Neutral only) Missions=117 Events=40 Tactician=18 Command=61 Boss=15
```

**Player setup.** Each player dealt 2 Secret Objectives, 2 Mission Cards, 1 Tactician Card, 2 Command Cards (4 for the Leader), and 2 starting Organic — all shown in the table above.

**Overrun Tracker** starts at 10 (Normal). **Player Progress** and **Enemy Progress** both start at 0.

With Leader Selection complete, the game now runs **Round 0** in full before Round 1 begins.

---

## Round 0 — Prep Round

**What Round 0 is** (README #32): a full Planning Stage and full Deployment Stage, run exactly as any other round — worker placement, income, purchasing, Command Donations, healing, scouting, reassigning, equipping — but with **no enemies and no Combat Stage at all**. Cleanup only handles Managing the Dead (trivially empty — nothing fought) and Command Card Refill; Overrunning Lanes, Event Resolution, Promotions, and Escalate are all skipped outright, since none of them have anything to act on yet.

**Commander for Round 0.** Normally a round's commander is a holdover from the previous round's Worker Placement winner. Round 0 has no previous round, so (per the Playtest Log Resolution, README #32) the **Leader-fills-in-as-commander exception now applies to Round 0** rather than Round 1 — except Avery (the Leader) didn't actually need to use it, because Round 0 still runs its own real Worker Placement, and whoever wins the Command race there becomes Round 0's actual commander. (The exception only matters if nobody contests Command; here, someone did.)

**Worker Placement.** Each player has 2 Worker Tokens (no one is yet Captain-rank for a 3rd). Turn order ran seat order P1→P2→P3→P4 (no previous commander to anchor "next to commander" off of). Placements:

- **Casey (P3)** → 1 worker to **Command** (wins the Command race, becomes Round 0's commander — directly serving her own Secret Objective, "Leader: be commander for 5 turns"), 1 worker to **Barracks**.
- **Avery (P1)** → 2 workers to **Barracks**.
- **Blair (P2)** → 1 worker to **Armory**, 1 worker to **Command** (sharing with Casey).
- **Drew (P4)** → 2 workers to **Battlefield**. Drew's Tactician, **The Kingmaker**, has a Passive reading "You cannot be the commander; if you would become commander, make another player commander instead" — Drew is simply never eligible to contest Command this game, full stop.

**Sharing at Command:** Casey and Blair are both Conscript (tied lowest Rank), and Casey placed first in turn order, so by the default lowest-Rank/placement-order tiebreak Casey gets the full-income slot... except this game uses the **Commander's Call** optional rule, so whoever is commander (Casey, once she's confirmed by winning the race) chooses who gets full income at a shared location. Casey kept full income for herself and let Blair also take full income — moot in this specific case since it's a 4-player game and the **first TWO workers at a shared location both get full income** (README's 4-player worker-sharing rule); only a 3rd worker onward would be halved. Both got full Command income with no decision actually needed.

**Income generated:**

Barracks shop total Rank at the time of income = 2 Conscript-rank slots + 2 Private-rank slots = 1+1+2+2 = 6. Armory shop total Rank = 1 Conscript + 1 Private = 3.

Ruling applied here (see Open Rules Question #1 at the end of this document): the 4-player "first two workers at a shared location both get full income" rule is read **per-location across all workers there, regardless of which player placed them** — not "the first two players." Barracks had 3 workers this round (Casey ×1, Avery ×2): the first two (Casey's, then Avery's first) are full income; Avery's second is that location's 3rd worker and halves (rounded down).

| Location | Workers | Effect | Result |
|---|---|---|---|
| Barracks | Casey (1, full), Avery (1st, full), Avery (2nd, half) | Tech+Organic = total shop Rank (6) | Casey +6 Organic +6 Tech; Avery +6 Organic +6 Tech (1st worker) +3 Organic +3 Tech (2nd worker, half of 6) = **+9/+9** |
| Armory | Blair (1, full) | Tech = 2× total shop Rank (3×2=6) | Blair +6 Tech |
| Command | Casey (1, full), Blair (1, full — both full under 4p rule) | Resources of choice = Rank per worker (Conscript=1) | Casey +1 Tech, Blair +1 Tech |
| Battlefield | Drew (2, both full) | +1 all resources **to Command pool** per worker | Command pool +2 Organic +2 Tech +2 Alien |

Personal resource totals after income (starting 2 Organic + the above):

| Player | Organic | Tech | Alien |
|---|---|---|---|
| Avery (P1) | 2 + 9 = 11 | 9 | 0 |
| Blair (P2) | 2 | 7 | 0 |
| Casey (P3) | 2 + 6 = 8 | 7 | 0 |
| Drew (P4) | 2 | 0 | 0 |
| **Command pool** | 2 | 2 | 2 |

(Bookkeeping note: the figures actually carried forward in the JSON ledger used Avery at 8 Organic/6 Tech rather than 11/9 — a transcription slip made mid-session when the half-income correction was applied after the fact. The narrative table above is the corrected/intended math; Avery's purchasing below is conservatively based on the lower 8/6 figure actually in the ledger, so nothing downstream double-counts the extra 3 Organic/3 Tech. Flagged honestly rather than silently fixed, since Avery's purchasing power this round was slightly understated as a result.)

**Purchasing.** Barracks shop (Direct-filled, Rank 1-3 pool): Conscript, Civilian Survivalist (Scout), Lazy Recruit (Private), Rookie Marksman (Private). Armory shop: Scouting Drones (Conscript Consumable), Basic Medkit (Private Utility).

- **Avery** bought **Rookie Marksman** (O3/T1, Long Range) for Lane 1, and **Civilian Survivalist** (O1/T0, Scout unit) to donate to Command as a Scout. Remaining: 4 Organic / 5 Tech.
- **Blair** bought **Conscript** (O1/T0) for Lane 2. Remaining: 1 Organic / 7 Tech.
- **Casey** bought **Lazy Recruit** (O3/T1) for Lane 3, and **Basic Medkit** (O2/T4, heals Active unit 2/round while in reserve) gear. Remaining: 3 Organic / 2 Tech before the equip cost below.
- **Drew** bought **Civilian Scout** (O1/T0, refilled into the Conscript slot after Blair's purchase) for Lane 4. Remaining: 1 Organic / 0 Tech.

Each purchase immediately refilled its shop slot via Direct fill (Rank-separated piles, README #39 — no searching/skipping needed).

**Command Donations** (README #35 — no worker required at Command for this). Avery donated her freshly-bought **Civilian Survivalist** to the Command scout pool. This is the first real exercise of the worker-free donation rule: Avery had no worker at Command this round (both her workers went to Barracks) and donated anyway.

**Deployment Stage.**

- *Heal Units:* nothing to heal — no units have taken damage yet.
- *Assign Scouts:* Casey (commander) assigned **Civilian Survivalist** as the active scout from the now-non-empty pool. Scout Value for this card is listed as Organic 4 (its Scout Value stat) — added to the Command pool the moment it's assigned. (Round 0 itself doesn't deal/scout enemies since there are none, but the assignment happens on schedule so the scout is in place for Round 1's Deployment.)
- *Reassign Units / Manage Equipment:* Each player's newly purchased unit was deployed straight into their lane's Active slot (no Reserve units exist yet to choose between). Casey equipped **Basic Medkit** onto her Lazy Recruit, paying the new Tech-to-equip cost (README #38): Basic Medkit is Private-rank, so the cost is **2 Tech**. Casey's final Round 0 total after this: 3 Organic / 0 Tech.

**Mission Assignment.** Casey (commander, Conscript = Rank-tier 1) drew missions = players (4) + commander's Rank-tier (1) = **5** mission cards, passed starting from the player to her left (Drew):

1. Drew picked **Balanced Contribution I** (Conscript — donate 5 of each resource to Command; reward +5 all resources).
2. Avery picked **Tech Export 2** (Private — return 10 Tech to supply; reward +5 Tech).
3. Blair picked **Medical Bay Detail** (Sergeant — deploy a worker to Medical Bay; reward +5 all resources).
4. Casey picked **Combat Medic II** (Captain — heal 20 damage during combat; reward +8 all resources).
5. Pool didn't divide evenly (5 cards / 4 players), so Drew picked again: **Organic export 5** (Major — return 30 Organic to supply; reward +15 Organic).

No mission was completable yet this round (Drew can't afford Balanced Contribution I's 5-of-each cost with only 1 Organic/0 Tech on hand).

**Cleanup Stage.** Managing the Dead: nothing (no combat happened). Overrunning Lanes / Event Resolution / Promotions / Escalate: all skipped outright, exactly as Round 0 specifies. **Command Card Refill** ran on schedule: Casey (this round's commander) refilled to hand size 4 (drew Flash Sale, Necromancy, total 4 cards), Blair and Drew refilled to hand size 3 (Blair drew Eradicator Cannon; Drew drew Land Mines), and Avery — who is NOT this round's commander despite being the game's overall Leader — was capped at hand size 3 and had to discard her weakest card (Ethics Committee, an Armory-only situational removal-of-Alien-cost card) to the bottom of the Command deck before the round closed.

**End of Round 0 state:** Overrun Tracker 10 (untouched, no combat exists yet), Player Progress 0, Enemy Progress 0. Each lane has exactly 1 Active unit deployed, no Reserves yet. Casey's Command Worker Placement win carries over: **Casey is confirmed as Round 1's commander**, the first real exercise of the commander-holdover rule (since Round 0, not Round 1, was the one-time exception case).

---

## Round 1

**Commander Actions (Planning).** Casey (holdover commander from Round 0) ran this round's Commander Actions. Boss spawn roll: 1d10 = 3, compared against Enemy Progress 0 — rolling at or below 0 is needed to spawn, so this was mechanically impossible and no Boss spawned (expected at Enemy Progress 0; this check becomes a real gamble later). Event draw: 2 cards, **Leadership Crisis** (risky commander-rotation event) vs. **Emergency Triage** (unlocks all 4 Medical Bay slots this round; completes if every player places a worker there; failure kills units in Med Bay — moot with nobody injured yet). Casey chose **Emergency Triage** — free upside, no real downside risk this early.

**Mission Assignment.** Casey drew missions = 4 players + her own Rank-tier (Conscript = 1) = 5 cards, passed starting from Drew (to her left): Drew took **Barracks Detail** (Conscript) and, on the second pass-around (pool of 5 doesn't divide evenly across 4 players), also took **Conscription** (Conscript — "Own a Rank 1 unit," which Drew's already-owned Civilian Scout satisfies immediately). Avery took **Barracks Online** (Private). Blair took **Combat Medic I** (Private). Casey took **Organic export 4** (Captain — a stretch for now).

Drew's **Conscription** mission completed the instant it was drawn (he already owned a Rank-1 unit) — first live test of the "missions completable any time, the moment the condition is already true" ruling from the previous batch. Reward: +1 all resources. Completing 1 mission grants +1 Rank at end of turn; since Conscript→Private is only 1 tier above Drew's current Rank (not the 3+ tiers the Mission Rank-scaling bonus (README #36) requires), Drew gets the normal flat +1 Rank only, promoting **Conscript → Private** at end of Round 1.

**Worker Placement.** Casey gets a 3rd worker this round for being commander (2 base + 1 commander bonus); everyone else still has 2 (nobody's reached Captain yet for the Rank-based 3rd worker). Placements:

- Casey (3): Command (1, re-securing commander for Round 2), Barracks (1), Medical Bay (1).
- Avery (2): Barracks (1), Medical Bay (1).
- Blair (2): Armory (1), Medical Bay (1).
- Drew (2): Battlefield (1), Medical Bay (1).

All 4 players placed a worker at Medical Bay this round — completing **Emergency Triage**'s condition outright (reward resolves at Cleanup: Double future Healing, an ongoing buff carried forward). Nobody is wounded yet so the heal-units effect itself does nothing this round, but the flat "+1 Organic per worker regardless" still paid out to all 4.

**Income.** Barracks shop total Rank = 6 (2 Conscript + 2 Private slots), only Casey and Avery worked it (both full, 2 workers total, no 3rd to halve): Casey +6/+6, Avery +6/+6. Armory shop total Rank = 3 (Scouting Drones, the unsold Round-0 leftover, + Landmines): Blair +6 Tech. Command: Casey +1 Tech (Conscript=1 per worker). Battlefield: Drew (1 worker, full) sent +1 all resources to the **Command pool** (not to himself personally — the Battlefield's effect explicitly routes to Command). Medical Bay: +1 Organic per worker to all 4 players (flat portion; no wounded units to trigger the 2-Organic-per-heal portion yet).

The active scout (Civilian Survivalist, assigned at the end of Round 0 and never having needed replacing) is still in place; its Scout Value (Organic 4 / Tech 1 / Alien 1) trickled into the Command pool again this round, on the reading that Scout Value pays out every round a scout is serving, not just once at first assignment.

**Purchasing.** Five more units were bought across the table this round (Avery 2, Blair 1, Casey 1, Drew 1) to stock every lane's Reserve before real combat began: Avery bought **Stubborn Recruit** (Private, notably high Shields-7 stat) and a **Civilian Scout** for Lane 1's reserve; Blair bought a **Civilian Scout** for Lane 2; Casey bought **Rookie Technician** for Lane 3; Drew bought two more **Civilian Scouts** for Lane 4 (the shop's Conscript-rank Direct-fill kept surfacing the same card, which is expected — Civilian Scout/Civilian Survivalist/Conscript are simply 3 of the only handful of Conscript-Infantry cards in the base pool, and decks are never treated as exhaustible). Each purchase Direct-filled its slot back from the Conscript or Private Rank pile immediately. Blair also bought **Scouting Drones** (Conscript Consumable, O1/T2) from the Armory for later use.

This is the first round every lane enters combat with a real Reserve behind its Active unit — exactly the setup Round 0 + the extra starting Organic were meant to enable.

**Deployment Stage.** Nothing to heal. Scouts already assigned. Reassign/Equip: no changes needed (everyone's fresh purchases slotted straight into Reserve, Actives were already set from Round 0).

**Commander Actions (Deployment) — Enemy Draw.** Normal difficulty, Player Progress 0 → hoard size 3/lane base. Total pool = 3 × 4 lanes = **12 enemies**, drawn at Fodder rank (Enemy Progress 0-1): a 50/50 mix of **Pests** and **Ticks**, both plain 1 Damage / 1 HP stat-sticks with blank Reveal/Passive text (README #31's Fodder-detext change, confirmed live: no swingy stacking, no scoping questions, just simple filler). The active scout's reveal count (1 base + 1 from Civilian Survivalist's own "Scouts +1 enemy" text = 2) flipped 2 of the 12 face-up before the pool was reshuffled and dealt 3-per-lane — though since every card in this particular pool is mechanically identical, the reveal was cosmetic this round with nothing to actually dodge.

**Combat Stage — Combat Cycle.** Casey chose lane order 1→2→3→4. This is the first round to exercise **same-round Reserve promotion** (README's headline combat fix) for real, repeatedly, in every lane:

- **Lane 1 (Avery):** Rookie Marksman (2 DMG/2 HP) killed a Pests outright, took 1 back (now 1/2 HP). The next Pests promoted into Active immediately, same round — and this exchange killed both simultaneously (Marksman's last HP traded for the kill). Avery's Reserve promoted **Stubborn Recruit** (2 DMG/2 HP, Shield 7) into Active the same round, who shrugged off the lane's last enemy (a Ticks) with its absurd Shield stat barely scratched (7→6). Enemy reserve now empty: **Lane 1 cleared**, Stubborn Recruit standing at full HP, Shield 6/7.
- **Lane 2 (Blair):** Conscript (1/1, Shield 1) traded evenly with 2 Ticks in a row (shield soaked the first hit, then died to the second simultaneously with killing it), promoting Blair's last Reserve unit, **Civilian Scout**, into Active the same round — who one-shot the lane's final Pests using its own Shield to survive the trade. **Lane 2 cleared**, Civilian Scout at full HP, Shield spent.
- **Lane 3 (Casey):** **Lazy Recruit** (2/2 HP, Shield 2) ground through all 3 of its lane's enemies (Pests, Ticks, Ticks) across 3 same-round promotions on the enemy side, losing its Shield along the way and 1 HP to the last exchange. **Lane 3 cleared** — the only lane where the player's own Active unit never had to be replaced, ending at 1/2 HP.
- **Lane 4 (Drew):** First **Civilian Scout** killed a Ticks (shield-soaked), then traded itself for a Pests in the next exchange (both died simultaneously, no shield left). Drew's 2nd Reserve unit — also a Civilian Scout, purchased this same round specifically to backstop this lane — promoted into Active the same round and finished the lane's last Pests using its own Shield to survive. **Lane 4 cleared.**

Ruling note on **Lazy Recruit's "Attacks every 2nd round" Bonus Effect**: since this is the unit's first round ever in combat, we ruled it counts this (its 1st combat round) as an attack round, with the skip landing on its 2nd round of combat, not a flat odd/even calendar round — the more natural reading of "every 2nd round" as a per-unit cadence rather than a global one. Worth flagging as an Open Rules Question below, since the card text doesn't actually say which.

**All 4 lanes cleared with zero enemies surviving anywhere.** This is the headline result of Round 1: not a single overrun, meaning **Lane Reinforcement had nothing to do this round** — no lane needed rescuing. The Overrun Tracker stayed untouched at 10.

**Cleanup Stage.**
- *Managing the Dead:* Player losses this round: Rookie Marksman (Lane 1), Conscript (Lane 2), 1 of Drew's 2 Civilian Scouts (Lane 4) — all moved to the Graveyard. Lane 3 had zero player losses. All 12 enemies (Pests/Ticks) died and were Disposed/Contained as capacity allowed.
- *Overrunning Lanes:* 0 lanes overrun. Overrun Tracker holds at **10**.
- *Event Resolution:* **Emergency Triage** completed (all 4 players placed a worker at Medical Bay this round) — reward **Double future Healing** applied as an ongoing effect going forward.
- *Promotions:* the event passed, so Casey could promote another player below her Rank — but nobody is below Conscript (Casey's own Rank), so no Promotions-step promotion happened this round.
- *Escalate:* Round 1's grace period (README's Playtest Change) skips Enemy Progress's advance — **Enemy Progress stays at 0**. All 4 lanes survived clean, so **Player Progress advances to 1**.
- *Command Card Refill:* everyone was already sitting exactly at their target hand size (3 non-commander / 4 for Casey as next round's commander again) — no discards or draws needed.
- Drew's Mission-completion promotion from earlier this round resolves now: **Drew promotes Conscript → Private.**

**End of Round 1:** Overrun Tracker 10, Player Progress 1, Enemy Progress 0. Every lane holds a surviving Active unit plus whatever Reserve is left. Casey remains commander into Round 2 (uncontested holdover).

---

## Round 2

**Commander Actions (Planning).** Boss roll: 1d10 = 6, still above Enemy Progress 0 — no Boss. Event draw: **Forced Disposal** (lets players pay Organic to clear the Enemy Disposal pile; rewards Command Alien if Disposal ends the round at half its starting total, penalizes Command Alien if not) vs. **Isolation Orders** (risk of a disabled location). Casey picked **Forced Disposal** — lower downside with a full Disposal pile already sitting there from Round 1's 12 kills.

**Mission Assignment.** 5 cards again (4 players + Casey's Rank-tier 1). Drew picked **Basic Training** (Private — "Own a Rank 2 unit," not yet true, he only owns Conscript-rank Civilian Scouts) and, on the uneven second pass, **Combat Medic III** (Colonel, a long-term stretch). Avery picked **Xenobiology Export 2**. Blair picked **Enemy Momentum I**. Casey picked **Combined Arms**. Nothing completed immediately this round.

**Worker Placement.** Casey (3, commander bonus): Command (re-securing), Barracks, Armory. Avery (2): Barracks, Battlefield. Blair (2): Armory, Battlefield. Drew (2): Battlefield, Medical Bay.

**Income.** Barracks shop Rank 6 (Casey + Avery, both full): Casey +6/+6, Avery +6/+6. Armory shop Rank 3 (Casey + Blair, both full): each +6 Tech (2× shop Rank). Command: Casey +1 Tech. Battlefield: 3 workers this round (Avery, Blair, Drew) — first two full, 3rd halves; +1 all resources to Command pool per full worker (the half-rate 3rd worker rounds its contribution down to 0): Command pool +2/+2/+2. Medical Bay: Drew +1 Organic flat (still nobody wounded). The active scout's Scout Value (Organic 4/Tech 1/Alien 1) trickled into the Command pool again.

**Location Upgrade purchased.** With the Command pool sitting comfortably at O13/T7/A7 after income, Casey built **Containment Protocol** (O8/T3/A3) — unlocking both of Containment Block's Holding Cells. This had been sitting completely unused since Round 1 disposed all 12 of its kills for nothing (no Containment slots existed yet); from this round on, the last kill in up to 2 lanes per round can be Contained for Alien income instead of wasted to Enemy Disposal.

**Purchasing.** Avery bought **Rookie Gunner** and a **Civilian Scout** for Lane 1's reserve. Casey bought **Rookie Scout** (Mobile) and a **Conscript** for Lane 3's reserve. Drew (down to 2 Organic/1 Tech/1 Alien after a thin couple of rounds) couldn't afford anything this round and instead **donated his spare 1 Alien to the Command pool** — the first clean exercise of worker-free Command Donations on the resource side (Drew had a worker at Battlefield and Medical Bay, neither is Command, and donated anyway). Blair, sitting on 0 Organic but a big Tech surplus, donated 10 Tech to Command for the same reason.

**Deployment Stage.** Nothing wounded yet to heal. Scout/equipment unchanged.

**Commander Actions (Deployment) — Enemy Draw.** Player Progress is 2 (still under the 5-7 threshold for bigger hoards), so hoard size is still base 3/lane — 12 more Fodder-rank enemies (Enemy Progress is still 0 going into this round's draw, since Round 1's Escalate was skipped). Scouted 2 of 12 as before; dealt 3 per lane.

**Combat Stage.** Lane order 1→2→3→4 again. Critically, **damage and reduced Shields from Round 1 carried over** — nothing auto-heals between rounds except via Medical Bay, and nobody had healed yet. Going into this round: Stubborn Recruit (Lane 1) sat at full HP / Shield 6 of 7 (only 1 point spent in Round 1); Lazy Recruit (Lane 3) was down to 1 HP of 2 with 0 Shield left — a genuinely fragile unit walking into another fight.

- **Lane 1 (Avery):** Stubborn Recruit's Shield 6→3 absorbed all 3 of this lane's enemies without ever losing HP. **Cleared**, no losses, 3 full Reserve units (Rookie Gunner, 2× Civilian Scout) untouched behind it.
- **Lane 2 (Blair):** the lone Civilian Scout (full HP but 0 Shield, having spent it surviving Round 1) traded simultaneously with the first Ticks — both died. **Blair had no Reserve left at all** (his only Reserve unit had already been promoted to Active back in Round 1). The enemy side's next card (Pests) promoted into Active and found no player unit to fight: by the empty-Active-slot-is-overrun rule, **Lane 2 overran**, with a 2nd enemy (Ticks) still sitting unfought in Reserve.
- **Lane 3 (Casey):** Lazy Recruit's own Bonus Effect, "Attacks every 2nd round," came due — this was its 2nd round of combat, so per the ruling below it skipped its attack entirely this exchange. With 1 HP and 0 Shield, it had nothing to fall back on: Pests' 1 damage killed it outright, for zero damage dealt in return. Same-round Reserve promotion kicked in immediately: Rookie Technician (2 DMG/2 HP, Shield 4) stepped in and ground through the still-alive Pests plus 2 more same-round promotions (Ticks, then another Pests), spending Shield 4→1 along the way. **Cleared**, but at the cost of Lazy Recruit — and only because the skip-round mechanic left it defenseless at the worst possible moment.
- **Lane 4 (Drew):** the same story as Lane 2 — Civilian Scout (2) traded simultaneously with a Ticks (both died), Drew had no Reserve left to promote (both of his Civilian Scouts were already spent), and the next enemy card (Pests) found nobody home. **Lane 4 overran**, 1 enemy (Ticks) still unfought in Reserve.

> **Ruling applied — Lazy Recruit's "Attacks every 2nd round":** treated as a per-unit cadence (1st combat round = attacks, 2nd = skips, 3rd = attacks, etc.) rather than tied to the game's global round counter. The card text doesn't specify which, and this ruling directly cost a unit its life this round — flagged as Open Rules Question below since a different reading (e.g., skip on odd global rounds, or only skip every time the unit's OWN internal counter says so starting from when it was purchased rather than when it first fought) could have changed this outcome.

**Lane Reinforcement.** After all 4 lanes resolved their normal Combat Cycle, the result was 2 lanes cleared with real surplus (Lane 1: 3 full-HP Reserve units behind Stubborn Recruit; Lane 3: 2 untouched Reserve units behind Rookie Technician) and 2 lanes overrun with enemies still alive (Lane 2: Pests active + Ticks reserve; Lane 4: Pests active + Ticks reserve). This is exactly the scenario Lane Reinforcement exists for:

- **Lane 1 → Lane 2:** Avery sent a **Civilian Scout** over. It killed the lane's Active Pests (Shield soaking the trade), and — since Lane Reinforcement's own text says the reinforcement exchange is "resolved under the normal Combat Cycle rules," which includes same-round Reserve promotion — the lane's last enemy (Ticks) immediately promoted into Active and traded simultaneous deaths with the reinforcing Scout. **Lane 2 rescued**: enemy Reserve now empty, even though the reinforcing unit didn't survive the rescue.
- **Lane 3 → Lane 4:** Casey sent her **Rookie Scout** (Mobile, Shield 1) over. It killed the lane's Active Pests (Shield-soaked), the same-round-promotion chain pulled the last Ticks into Active, and Rookie Scout — now out of Shield — traded its own HP to finish the kill but survived at 1 of 2 HP. **Lane 4 rescued**, and this time the reinforcing unit lived, now sitting as Lane 4's new Active unit going forward (still owned/tracked under Casey's roster, just physically fighting in Lane 4).

> **Open Rules Question #2 found here:** Lane Reinforcement's text describes "one additional combat exchange" (singular) but also says it resolves "under the normal Combat Cycle rules." Those two phrasings are in tension once same-round Reserve promotion is one of "the normal Combat Cycle rules" — does a reinforcement freshly trigger the SAME chain-until-a-side-runs-out resolution that a normal lane gets, or does it really mean just 1 exchange and then stop regardless of what's left? We ruled the chain continues (both rescues above resolved a full 2 exchanges, clearing each lane's enemy Reserve entirely, not stopping after 1 trade) since "the normal Combat Cycle rules" is fairly explicit text to override "one additional exchange" being read as a hard cap. Logged at the end of this document.

**Result: all 4 lanes cleared this round too** — 2 directly, 2 via reinforcement. Zero overruns reached Cleanup. This is the second straight round with no Overrun Tracker damage at all.

**Cleanup Stage.**
- *Managing the Dead:* Player losses this round: the original Lane 2 Civilian Scout, the reinforcing Lane-1-to-Lane-2 Civilian Scout, Lazy Recruit (Lane 3), Civilian Scout (2) (Lane 4) — 4 player units lost, all to the Graveyard. All 12 of this round's enemies died.
- *Containment / Disposal:* with Containment Protocol now active, the last kill in 2 of this round's 4 lanes (Lane 1's and Lane 3's, both ending in a Pests) went into the 2 freshly-unlocked Holding Cells instead of Disposal — the first time this game any dead enemy avoided being wasted. The other 10 went to Enemy Disposal.
- *Overrunning Lanes:* 0 lanes overrun (after Lane Reinforcement). Overrun Tracker holds at **10** for the second round running.
- *Event Resolution:* **Forced Disposal** required the team to actively spend Organic clearing Disposal down to half its round-start total to succeed; nobody did, so it **failed** — Failure Penalty: Command loses Alien equal to units disposed of this round (10), dropping the Command pool's Alien from 5 to 0.
- *Promotions:* the event failed, so (per the rule's own "if the event passed" gate) no Promotions step happened this round at all.
- *Escalate:* Round 2 is past the Round 1 grace period — **Enemy Progress advances to 1** (still inside the Fodder band, 0-1). All 4 lanes survived (post-reinforcement) — **Player Progress advances to 2**.
- *Command Card Refill:* everyone already sat at their target hand size; no draws needed.

**End of Round 2:** Overrun Tracker **10** (still untouched after 2 full rounds of combat), Player Progress **2**, Enemy Progress **1**. Casey remains commander into Round 3.

---

## Round 3 — the Fodder→Grunt transition round

This is the round the previous batch's "Grunt cliff" suspicion is about: Round 3's Escalate step pushes Enemy Progress from 1 to 2, meaning **Round 4's enemy draw will be the team's first taste of Grunt-rank enemies** (real Reveal/Passive text, real stat lines, no longer the gentle Fodder filler). Round 3 itself is still a Fodder-rank fight, but it's the last one.

**Commander Actions (Planning).** Boss roll: 1d10 = 6 vs Enemy Progress 1 — no Boss. Event draw: **Armor Recall** (forces an Armor unequip, rewards a free Armor shop next round if nobody ends the round with Armor equipped) vs. **Ion Storm** (would give every enemy +5 Shields — a genuinely dangerous pick against units that mostly deal 1-2 damage). Casey picked **Armor Recall** — nobody had Armor-type gear equipped yet, so its Round Effect was a complete no-op and its Completion Condition was trivially already true.

**Mission Assignment.** 5 cards. Drew took **Tech Export 1** (Conscript) and, second pass, **Lane Specialist II** (Captain). Avery took **Xenobiology Delivered II**. Blair took **Organic Contribution II**. Casey took **Desperate Stand** (Major — "Enemy Progress over 7," a real long-game payoff card to bank for later).

**Worker Placement / Income.** Same shape as Round 2: Casey (3) → Command, Barracks, Armory; Avery (2) → Barracks, Battlefield; Blair (2) → Armory, Medical Bay; Drew (2) → Battlefield, Medical Bay. Barracks shop Rank 6 (Casey/Avery full): +6/+6 each. Armory shop Rank 3 (Casey/Blair full): +6 Tech each. Command: Casey +1 Tech. Battlefield (Avery + Drew, both full): Command pool +2/+2/+2. Medical Bay (Blair + Drew): +1 Organic flat each, still nobody wounded. Scout Value (Civilian Survivalist, still serving): Command pool +4 Organic/+1 Tech/+1 Alien again.

**Purchasing.** Drew — sitting on only 3 Organic/1 Tech after 2 thin rounds — could just afford **Pack Mule** (O3/T1, Private rank, Shield 4) for Lane 4's reserve, which also immediately completed his **Basic Training** mission ("own a Rank 2 unit") the instant it was bought: +1 all resources, and +1 Rank at end of turn (Private → **Sergeant**, his 2nd promotion this game). Avery bought **Recruit** and a **Civilian Scout** for Lane 1's reserve, plus **Grenade Launcher** (Conscript Utility gear, Passive "deal 1/2 attack damage before combat," Active "Stun target enemy") from the Armory — equipped onto **Stubborn Recruit** for **1 Tech** (Conscript-rank equip cost, README #38). Casey bought a **Conscript** for Lane 3's reserve.

**Deployment.** Nothing wounded to heal. No scout/equipment changes beyond the gear above.

**Commander Actions (Deployment) — Enemy Draw.** Still Enemy Progress 1 going into this round's draw (Escalate from Round 2 only brought it to 1; Round 3's own Escalate hasn't run yet) — one more round of plain Fodder, 12 more Pests/Ticks, hoard size still base 3/lane (Player Progress 2, under the 5-7 threshold).

**Combat Stage.** Lane order 1→2→3→4.

- **Lane 1 (Avery):** this is the first round Avery's newly-equipped **Grenade Launcher** came online. Its Passive, "deal 1/2 attack damage before combat," fires before the main simultaneous exchange even happens — against a Fodder-rank 1-HP target, half of Stubborn Recruit's 2 base Damage (1) is already a one-shot kill, every single time, before the enemy ever gets to swing back. All 3 of Lane 1's enemies (Pests, Ticks, Pests, across 2 same-round promotions) died to pre-combat damage alone. **Stubborn Recruit took zero damage all round** — Lane 1 cleared without so much as a scratch, and the lane's 4-deep, fully-untouched Reserve (Rookie Gunner, 2× Civilian Scout, Recruit) sat ready to spare.
- **Lane 2 (Blair):** Lane 2 entered this round with **zero player units** — Active or Reserve — after Round 2 wiped it out completely and nobody (neither Blair nor commander Casey, coordinating worker/purchase priorities) restocked it during Deployment. Per the Overrun rule ("a lane with enemies present and ZERO player units... counts as overrun exactly like a lane whose defender died — there is no exchange to resolve, the enemies simply survive uncontested"), **Lane 2 overran the instant Combat Stage began**, before any dice were even relevant — all 3 of its enemies (Ticks, Pests, Ticks) survived completely untouched. This is the most concrete in-game consequence yet of a team simply failing to manage a lane, not a rules problem — a real, earned mistake.
- **Lane 3 (Casey):** Rookie Technician (full HP, Shield 1 carried over) killed 2 enemies before dying to the 3rd in a mutual trade (no Shield left to save it). Same-round promotion brought in a fresh **Conscript**, but by the time it stood up the enemy Reserve was already empty — **Lane 3 cleared**, losing Rookie Technician in the process.
- **Lane 4 (Drew):** Rookie Scout (1/2 HP, 0 Shield carried over from Round 2's reinforcement) traded itself for the lane's first Pests (mutual kill). Same-round promotion brought in the freshly-purchased **Pack Mule** (Shield 4), who cleanly handled the remaining 2 Ticks using its Shield as a buffer. **Lane 4 cleared.**

> **Open Rules Question #3 found here:** Grenade Launcher's Passive ("deal 1/2 attack damage before combat") raises a sequencing question the rules don't address: when pre-combat damage alone kills the enemy's Active card, does the equipped unit's MAIN attack still also land that exchange (effectively double-killing an already-dead target, wasted), or does the engagement end immediately and the next enemy promote without a "real" exchange happening at all? We ruled the latter (pre-combat damage that kills ends the engagement outright, the main swing is moot, the defender takes 0 damage back since the dead enemy never got to act) since the alternative would let any unit-stacked enemy take a "free" second hit it has no way to survive into anyway — but the card text only says "before combat," it doesn't describe what happens to the main exchange once the pre-combat phase already resolved the kill. Logged at the end of this document.

**Lane Reinforcement.** Result before reinforcement: Lanes 1, 3, 4 cleared; Lane 2 overran with all 3 of its original enemies untouched. Lane 1's 4-unit-deep untouched Reserve made it the obvious donor. Avery sent **2** units this time (Rookie Gunner, then Recruit queued behind it) — testing whether reinforcement can absorb a lane that's overrun with its FULL original hoard still intact, not just 1-2 leftover stragglers like Round 2's rescues.

- **Lane 2 reinforcement:** Rookie Gunner (the 1st reinforcer, becomes Lane 2's new Active) killed the lane's Active Ticks, took 1 back (HP 2→1), then the same-round-promotion chain pulled in Pests — Rookie Gunner traded its last HP to kill it (mutual death). With Rookie Gunner dead, Lane 2's own freshly-arrived Reserve (Recruit, the 2nd reinforcer Avery queued behind the first) promoted in **the same round**, and finished the last Ticks using its own Shield to survive the trade. **Lane 2 fully rescued** — all 3 of its original enemies dead, despite losing 1 of the 2 reinforcing units in the process.

This is the clearest demonstration yet that Lane Reinforcement, same-round Reserve promotion, and a single well-stocked lane's surplus can together absorb a FULL enemy hoard in an otherwise-undefended lane — not just patch a near-miss. **Net result: 0 lanes overran this round** (Lane 2's overrun was fully reversed before Cleanup ever checked it), despite a real in-game team mistake (forgetting to restock Lane 2) that, in any of the 3 previous-batch games, would very likely have cost an Overrun Tracker point outright.

**Cleanup Stage.**
- *Managing the Dead:* Rookie Gunner (reinforced into Lane 2, died there), Rookie Technician (Lane 3), Rookie Scout (Lane 4) — 3 player losses. All 12 of this round's enemies died (3 from Lane 1's pre-combat one-shots, 3 from Lane 3, 3 from Lane 4, 3 from the Lane 2 rescue).
- *Containment/Disposal:* the 2 unlocked Holding Cells took the last kill from 2 of the round's lanes; the rest went to Disposal (no active event penalizing this round).
- *Overrunning Lanes:* 0 (after reinforcement). Overrun Tracker holds at **10** for a 3rd straight round.
- *Event Resolution:* **Armor Recall** succeeded trivially (no Armor equipped to begin with) — reward: the Armory's initial shop slots are free next round.
- *Promotions:* the event passed, so Casey could promote someone below her Rank — but Casey (Conscript) and Blair (Conscript) are tied for the game's lowest Rank, and nobody else is below Casey. No Promotion happened.
- *Escalate:* **Enemy Progress advances to 2** — this crosses out of the Fodder band (0-1) into **Grunt** (2-3) for the very first time this game. **Player Progress advances to 3** (all lanes survived, post-reinforcement).
- Drew's Basic Training promotion resolves: **Private → Sergeant.**
- *Command Card Refill:* everyone already at target hand size.

**End of Round 3:** Overrun Tracker **10** (completely untouched through 3 full rounds), Player Progress **3**, Enemy Progress **2** (Grunt band begins). This is the checkpoint the entire game was designed to test: **the team enters the Fodder→Grunt transition with the Overrun Tracker at its starting value, having never lost a single net lane to an overrun** — a sharp contrast to all 3 previous-batch games, which were already bleeding Overrun Tracker points well before this point.

---

## Round 4 — the first real Grunt fight

**Commander Actions (Planning).** Boss roll: 1d10 = 9 vs Enemy Progress 2 — no Boss. Event draw: **Assigned Posts** (a dice-driven worker-location lock) vs. **Fuel Shortage** (stuns Active non-Infantry at combat start; completes if all 4 lanes have an Active Infantry unit, rewarding +1 Armor per Active Infantry; fails by losing that same Armor instead). Since the team had **zero Vehicles or Mechs** at this point — every single deployed unit so far has been base Infantry — Casey picked **Fuel Shortage** as a free-looking pick: the stun clause was moot (nothing non-Infantry to stun) and the Completion Condition looked trivially already true going into the round.

**Mission Assignment.** 5 cards. Drew took **Stockpiled Reserves** (Private — "Command has over 40 total resources," not yet true) and, second pass, **Balanced Contribution VI** (Specialist, a long-term stretch). Avery took **Balanced Contribution II**. Blair took **Tech Donated V**. Casey took **Armored Column** (Captain — moot for now, no Vehicles owned).

**Worker Placement / Income.** Same shape as previous rounds. Barracks shop Rank 6 (Casey/Avery full): +6/+6 each. Armory shop Rank 3 (Casey/Blair full): +6 Tech each. Command: Casey +1 Tech. Battlefield (Avery/Drew, both full): Command pool +2/+2/+2. Medical Bay (Blair/Drew): +1 Organic flat each. Scout Value: Command pool +4/+1/+1 again. This pushed the Command pool's total resources over 40, which immediately completed Drew's **Stockpiled Reserves** mission (+1 all resources, no Rank bonus since it's only 1 tier above his current Rank) the moment income resolved.

**Lesson applied from Round 3's mistake:** this round the team explicitly prioritized re-stocking every thin lane before combat. Blair bought a **Civilian Scout** for Lane 2's empty Reserve (originally tried to buy the pricier Rookie Scout but didn't actually have enough Organic — corrected to the affordable pick), Drew bought **Recruit Prodigy** for Lane 4's empty Reserve, and Casey bought a **Civilian Survivalist** for Lane 3's Reserve. Avery also picked up **Landmines** (Consumable, Active "deal 5 damage to enemies any time they move this round") and Casey grabbed **Smoke Pack** (Utility, Passive "when under half HP cannot be targeted by abilities") — both **free**, since Armor Recall's Round 3 completion reward made the Armory's then-current shop contents free this round. Avery equipped Landmines onto Stubborn Recruit (now dual-equipped alongside the already-equipped Grenade Launcher) for 2 Tech (Private-rank equip cost); Casey equipped Smoke Pack onto her Active Conscript for 1 Tech.

**Commander Actions (Deployment) — Enemy Draw.** Enemy Progress is now **2**, crossing into the **Grunt** band (2-3) for the first time. Hoard size is still base 3/lane (Player Progress 3, under the 5-7 threshold) — 12 enemies, but now genuinely dangerous ones:

| Enemy | DMG | HP | Shield | Reveal | Passive |
|---|---|---|---|---|---|
| Lance Turret (Mechanised) | 6 | 9 | 5 | Swap to lane with lowest-Damage active unit | Attacks target lowest-HP unit |
| Grunt ×2 (Infantry) | 4 | 5 | 2 | Deal 2× attack damage to all lanes | — |
| Cleric (Infantry) | 4 | 6 | 2 | Move to reserve, Shield active units +5 | Heals Active unit by its own attack |
| Wasp ×2 (Drones) | 3 | 3 | 2 | Stun enemies in adjacent lane | Stuns on 1st hit of each combat |
| Hound (Beast) | 5 | 7 | 2 | Deal 10 damage to lowest-HP unit | Attacks hit twice |
| Lancer ×2 (Infantry) | 5 | 4 | 1 | Deal 2× attack damage to active AND reserve units in this lane | Attacks Pierce up to 2 Armor |
| Gloom (Beast) | 5 | 7 | 2 | — | Prevents activation of abilities in this lane |
| Scorpions ×2 (Infantry) | 5 | 4 | 1 | Deal 2× attack damage to Scout | Damage from this unit hits the Scout |

Compare this to Round 1-3's Pests/Ticks: 1 DMG / 1 HP / 0 Shield, no abilities at all. This is the single biggest stat-line jump in the game so far — every Grunt-rank card has more HP than our best unit's entire Damage output, real Shield values, and (unlike Fodder) genuine Reveal/Passive text that hits back. The active scout revealed 2 of the 12 (Hound and 1 of the 2 Scorpions) before the pool was reshuffled and dealt 3-per-lane.

**Enemy Scouting (top card of each lane flips, triggers Reveal unless already scouted).** This step alone reshaped the round before the Combat Cycle even started:

- **Lane 1:** **Gloom** flipped up — no Reveal text, just its always-on Passive ("prevents activation of abilities in this lane").
- **Lane 2:** the already-scouted **Scorpions** flipped face-up without re-triggering its Reveal (the scouting counterplay working as intended).
- **Lane 3:** **Lance Turret** flipped up. Its Reveal ("swap to the lane with the lowest-Damage active unit") checked all 4 lanes' Active Damage — Stubborn Recruit 2, Recruit 2, Conscript 1, Pack Mule 2 — and found Lane 3's OWN Conscript (1 Damage) was already the lowest. Same-lane "swap" is a no-op (the same convention used in the previous playtest batch for Lance Turret specifically).
- **Lane 4:** **Lancer** flipped up, and its Reveal landed hardest of the entire round: "deal 2× attack damage (5×2=10) to active AND reserve units in this lane." That single instance of 10 damage hit BOTH Drew's Active **Pack Mule** (2 HP, Shield 2 — fully overkilled) AND his Reserve **Recruit Prodigy** (2 HP, Shield 2 — also fully overkilled), wiping Lane 4's entire roster before a single normal combat exchange happened anywhere in the round.

**Combat Stage.** With Lane 4 already empty, the remaining 3 lanes fought their Combat Cycles — and every one of them lost:

- **Lane 1 (Avery):** Gloom's Passive shut down Landmines' Active ability for the round (Denial in effect — Passive effects like Grenade Launcher's pre-combat trigger still fired, since "Passive effects never count [as Ability Activation], since they are continuously in effect," but Landmines' Active use was blocked outright). Grenade Launcher's pre-combat 1 damage chipped Gloom's Shield down by 1, then the main exchange: Stubborn Recruit's Shield 3 fully absorbed nothing close to Gloom's 5 Damage, and Stubborn Recruit died outright in the very first exchange. Same-round promotion brought in both Civilian Scouts in turn — each traded 1 damage into Gloom and died instantly to the 4-overkill return swing. **Avery's entire 3-unit roster died in 3 straight exchanges**, and Gloom (down to 4 HP but still alive) plus the still-untouched Wasp and Lancer behind it meant **Lane 1 overran**.
- **Lane 2 (Blair):** Recruit traded into Scorpions' Shield and died to the massive 5-Damage return swing; the promoted Civilian Scout did the same. Both of Blair's units died without ever bringing Scorpions below 2 HP. **Lane 2 overran**, with Grunt and Cleric still queued behind Scorpions.
- **Lane 3 (Casey):** Lance Turret's Shield 5 no-sold all 3 of Casey's units in turn (2 Conscripts, then Civilian Survivalist) — each chipped 1 Shield point off and died outright to the 6-Damage return swing. Lance Turret ended the lane at 9 HP / Shield 2, barely scratched. **Lane 3 overran**, with Hound and Grunt still queued behind it.
- **Lane 4 (Drew):** already wiped by the Reveal before combat began — automatically overran per the empty-lane rule, with Lancer (still fully intact, having only used its Reveal so far this round, plus Wasp and Scorpions) surviving uncontested.

**Lane Reinforcement had nothing to do.** Unlike Rounds 2 and 3, where at least 1-2 lanes cleared with surplus Reserve to spare, **all 4 lanes overran this round simultaneously** — there was no cleared lane anywhere on the board to draw a rescue from. This is the first round Lane Reinforcement simply couldn't help, because the precondition (at least one fully-cleared lane) never existed.

**Cleanup Stage.**
- *Managing the Dead:* every player unit on the board died this round — Stubborn Recruit + 2 Civilian Scouts (Lane 1), Recruit + Civilian Scout (Lane 2), 2 Conscripts + Civilian Survivalist (Lane 3), Pack Mule + Recruit Prodigy (Lane 4, lost to the Reveal alone). **8 player units lost in a single round** — more losses than the previous 3 rounds combined. Gear-survives-1-item (README #33) applied: Avery's Stubborn Recruit had 2 items equipped (Grenade Launcher, Landmines) — she kept Grenade Launcher, Landmines was lost for good. Casey's Conscript had only Smoke Pack equipped, which survived automatically (only 1 item, nothing to choose between).
- *Overrunning Lanes:* **4 lanes overran** — the Overrun Tracker loses 1 per lane, dropping from **10 to 6** in a single round.
- *Event Resolution:* **Fuel Shortage**'s Completion Condition ("4 Active Infantry") is checked at Cleanup, by which point all 4 lanes had **zero** Active units (3 died completely, the 4th never had one this round) — **0 of 4, the event failed**. Failure Penalty ("Active Infantry lose Armor equal to Active Infantry count, at combat start") references "at combat start," which per the established ruling applies to the NEXT round's combat, not retroactively — so this penalty is now pending for whatever Active Infantry exist when Round 5's Combat Stage begins.
- *Promotions:* event failed, no Promotions step.
- *Escalate:* **Enemy Progress advances to 3** (still inside Grunt, 2-3 — next round risks crossing into Core at Enemy Progress 4). Not all lanes survived this round, so **Player Progress does NOT advance** — it holds at 3.

**End of Round 4:** Overrun Tracker **6** (down from 10), Player Progress **3** (held), Enemy Progress **3**. This is the single worst round of the game so far by a wide margin — a complete, simultaneous wipe across every lane, the first round any Overrun Tracker damage landed at all, and 4 points of it landing at once. The team now has 4 fully-empty lanes to rebuild from scratch heading into Round 5, against enemies that have already shown they one-shot or near-one-shot every unit type the team has fielded so far.

---

## Round 5 — full rebuild, and a second straight wipe

**Commander Actions (Planning).** Boss roll: 1d10 = 9 vs Enemy Progress 3 — no Boss. Event draw was a genuine no-win choice: **Hurricane X** (stuns ALL Active non-Vehicle units at combat start — and the team owns precisely zero Vehicles, so this would stun every single lane simultaneously) vs. **System Lockdown** (returns all built Upgrades to hand immediately; completes if nobody rebuilds one by end of round, rewarding a permanent "remove upgrades anytime" rule; fails by re-removing upgrades, which is moot if nothing's built). Casey picked **System Lockdown** — costing the team its one built Location Upgrade (Containment Protocol, unlocked back in Round 2) rather than risk stunning the entire board during an already-difficult rebuild. Containment Block's 2 Holding Cells locked again the instant this resolved.

**Mission Assignment.** 5 cards: Drew took **Organic Contribution I** and, second pass, **Honorable Discharge**. Avery took **Tech Export 4**. Blair took **Special Operations**. Casey took **War Hero**.

**Worker Placement / Income.** Same shape as recent rounds. Despite the previous round's total wipeout, the income engine itself kept running undisturbed — Barracks (+6/+6 ×2), Armory (+6 Tech ×2), Command (+1 Tech), Battlefield (Command pool +2/+2/+2), Scout Value (Command pool +4/+1/+1) all paid out exactly as normal, since none of those depend on having units in lanes. This is worth flagging explicitly: **a total board wipe does NOT also wipe the team's economy** — the worker-placement income loop and the unit roster are fully decoupled systems. Going into Round 5's purchasing, the team actually had more combined resources on hand (Command pool alone: 23 Organic / 23 Tech / 9 Alien) than at almost any earlier point in the game.

**Full rebuild purchasing.** Every lane needed a complete rebuild from zero. This is also where a quieter structural problem surfaced clearly for the first time: **unit deploy-Rank gating is keyed to the managing player's own Rank, not the buyer's wallet.** Casey and Blair are both still **Conscript** — the game's lowest Rank — meaning even with deep resource reserves, the only units they can legally deploy into Lanes 3 and 2 are Conscript-rank (1 DMG / 1 HP stat-stick) cards. Avery (Private) could field Private-rank units; Drew (Sergeant) could in principle field up to Sergeant-rank, but his own resources were so thin after 2 rounds of losses that he could only actually afford a Conscript-rank pick anyway. Final rebuild: Avery → **Stubborn Recruit** (Active, the same high-Shield card from Round 1) + **Lazy Recruit** (Reserve) for Lane 1; Blair → **Civilian Scout** (Active only, couldn't afford a 2nd unit) for Lane 2; Casey → **Civilian Survivalist** (Active) + **Civilian Scout** (Reserve) for Lane 3; Drew → **Civilian Survivalist** (Active only) for Lane 4.

**Gear.** With huge Tech surpluses sitting idle (Casey alone held 56 Tech at one point), Casey and Avery each bought **Reinforced Barrels** (Weapon, +3 Damage/+2 HP, no Passive/Active) from the Armory and equipped them — Casey onto her Civilian Survivalist (now effectively 4 DMG/3 HP instead of 1/1), Avery onto Stubborn Recruit (now 5 DMG/4 HP on top of its already-massive Shield 7, plus +1 Armor). Equip cost was 1 Tech each (Conscript-rank gear).

> **Open Rules Question #4 found here (not a new ruling exactly, but worth flagging as a balance observation):** this round made visible a real structural tension between two of the game's own systems — the deploy-Rank gate (a player can't deploy above their own Rank, regardless of resources) and Promotions (the only way to raise that gate is completing missions or being promoted by a higher-Rank commander). Casey has been commander every single round so far (partly by design — she holds the "be commander for 5 turns" Secret Objective — partly because nobody's contested her for it), which means she's spent her own action economy on Commander Actions rather than mission-chasing, and as the team's own commander she's also the one person who can never be the beneficiary of the Promotions step (the rule explicitly bars self-promotion). The result: the team's commander is *structurally* one of its weakest-equipped lanes for as long as she holds the role, through no fault of bad luck. This isn't necessarily a bug — it might be a deliberate tension the design wants — but it's worth flagging since it directly weakened Lane 3 going into the exact rounds where lane strength mattered most.

**Commander Actions (Deployment) — Enemy Draw.** Enemy Progress is **3**, still inside Grunt (2-3) for one more round — but this round's pool was, if anything, even nastier than Round 4's: **two Lance Turrets** (6 DMG/9 HP/Shield 5 each), **two Hounds** (5 DMG/7 HP, hits twice — effectively 10 DMG per exchange), two Gloom, two Cleric, a Lancer, a Grunt, a Wasp, and a Scorpions. Scouted 2 of 12 (a Lance Turret and a Cleric) before dealing 3-per-lane: Lane 1 got Lancer/Gloom/Cleric, Lane 2 got Lance Turret(scouted)/Grunt/Wasp, Lane 3 got both Hounds plus a Gloom, and Lane 4 got the 2nd Lance Turret/Cleric(scouted)/Scorpions.

**Enemy Scouting — another round reshaped before Combat Cycle even began:**

- **Lane 1:** Lancer's Reveal (2× its own 5 DMG = 10 damage to active AND reserve in this lane) hit both of Avery's units in one instance. Stubborn Recruit — now actually carrying Armor (+1 from Reinforced Barrels) and a real HP pool (4) on top of Shield 7 — **survived for the first time against this exact effect**: Armor reduced the 10 to 9, Shield 7 absorbed 7 of that, the remaining 2 landed on HP (4→2). The reserve Lazy Recruit had no such protection and died outright to the same instance.
- **Lane 2:** the already-scouted Lance Turret flipped up without re-triggering.
- **Lane 3:** the first Hound's Reveal ("deal 10 damage to lowest HP unit") was read as board-wide, consistent with the established cross-lane targeting default. The lowest-HP units at that moment were three different 1-HP Conscript-tier cards tied across 3 lanes; applying the same lowest-lane-number tiebreak used for Lance Turret elsewhere, it landed on **Lane 2's Civilian Scout** — killing Blair's only unit before Lane 2's own Combat Cycle ever started. Lane 2's Reserve (a Conscript) promoted into Active immediately to fill the gap.
- **Lane 4:** the 2nd Lance Turret's Reveal ("swap to the lane with the lowest-Damage active unit") checked all 4 lanes' current Active Damage (Lane 1: 5, Lane 2: 1 just after the promotion above, Lane 3: 4, Lane 4: 1, itself) — Lane 2 and Lane 4 tied at 1. The lowest-lane-number tiebreak sent it to **Lane 2**, meaning Lane 2 now had to face **two separate Lance Turrets** stacked in its hoard (the swapped-in one queued to Reserve, behind the original).

> **Open Rules Question #5 found here:** two new sequencing questions surfaced this round that the existing rules/Playtest Log resolutions don't quite cover. First, does same-round Reserve promotion apply to a death that happens during Enemy Scouting (a Reveal effect killing a unit before Combat Cycle has technically begun), or only to deaths during the Combat Cycle proper? We ruled yes, it still applies — an empty Active slot pulls from Reserve immediately whenever it's vacated, regardless of which stage caused the vacancy, since the alternative (a defenseless Active slot sitting empty until Combat Cycle "officially" starts) doesn't track with how every other empty-slot situation in the rules is handled. Second, when an enemy lane-swap effect (like Lance Turret's) sends a unit into a lane that already has its own dealt hoard, does the swapped-in card enter that lane's Active slot or its Reserve? We ruled Reserve (queued behind whatever's already there), by analogy to how Lane Reinforcement and other lane-insertion effects elsewhere in the rules work. Both logged for confirmation.

**Combat Stage.** All 4 lanes lost outright, for the second round running:

- **Lane 1 (Avery):** Stubborn Recruit (now at 2/4 HP, 0 Shield after the Reveal) traded with Lancer — Grenade Launcher's pre-combat damage chipped Lancer down first, then the main exchange killed Lancer but Lancer's Pierce-up-to-2-Armor stripped Stubborn Recruit's new Armor bonus before dealing its own 5 damage back, killing Stubborn Recruit too. Avery had no Reserve left (Lazy Recruit already dead to the Reveal). **Lane 1 overran** — Gloom and Cleric survived untouched.
- **Lane 2 (Blair):** the promoted Conscript chipped 1 Shield point off the first Lance Turret's massive Shield 5 and died instantly to the 6-Damage return swing. Blair had no Reserve. **Lane 2 overran** with an enormous backlog still alive: Lance Turret (9 HP, Shield 4), Grunt, Wasp, AND the 2nd Lance Turret that swapped in — 4 full enemies, completely unopposed.
- **Lane 3 (Casey):** the Hound's "Attacks Hit Twice" Passive meant every exchange dealt its 5 Damage TWICE (10 total) — Casey's Reinforced-Barrels-boosted Civilian Survivalist (4 DMG/3 HP) still died outright to just the first of the two hits, with the second hit wasted (no Trample). The promoted Civilian Scout died the same way one exchange later. **Lane 3 overran** — the first Hound (down to 4 HP), the 2nd Hound, and Gloom all survived.
- **Lane 4 (Drew):** Civilian Survivalist traded into Cleric's Shield and died to the 4-Damage return swing (Cleric's own Reveal had already been spent by scouting, so it never got its "move to reserve + Shield active units +5" effect — it just stood and fought as a plain stat-line instead). Drew had no Reserve (his thin rebuild only stretched to 1 unit). **Lane 4 overran** — Cleric (6 HP, Shield 1) and Scorpions survived.

**Lane Reinforcement had nothing to do, again.** Zero lanes cleared this round — there was no surplus anywhere on the board to draw a rescue from, for the second round in a row.

**Cleanup Stage.**
- *Managing the Dead:* every unit purchased during the Round 5 rebuild died this same round — Stubborn Recruit + Lazy Recruit (Lane 1), Conscript (Lane 2, after Civilian Scout died to the Hound Reveal), Civilian Survivalist + Civilian Scout (Lane 3), Civilian Survivalist (Lane 4). Gear-survives-1-item applied again: Avery's Stubborn Recruit had 2 items (Grenade Launcher, Reinforced Barrels) — she kept Grenade Launcher; Casey's Civilian Survivalist had only Reinforced Barrels equipped, which survived automatically.
- *Overrunning Lanes:* **4 lanes overran again** — Overrun Tracker drops from **6 to 2**.
- *Event Resolution:* **System Lockdown** succeeded (its own Completion Condition — "no upgrades built at end of turn" — was already guaranteed true the moment its own Round Effect tore down Containment Protocol and nobody rebuilt anything). Reward: a permanent "remove upgrades anytime" rule, low-impact with zero Upgrades currently built.
- *Promotions:* event passed, but Casey (commander, still Conscript) and Blair are tied for the game's lowest Rank — nobody is strictly below Casey. No Promotion happened, the same gap noted above.
- *Escalate:* **Enemy Progress advances to 4** — crossing out of Grunt into **Core** (4-5) for Round 6. Not all lanes survived, so **Player Progress holds at 3**.

**End of Round 5:** Overrun Tracker **2** (down from 6, down from 10 two rounds ago), Player Progress **3**, Enemy Progress **4** (Core band begins). The team is now one more all-lanes-overrun round away from an outright loss, heading into Core-rank enemies — a tier the team hasn't even seen the stat lines for yet — with no Location Upgrades, no gear advantage beyond 2 surviving Weapon items, and the same structural Rank gap (Casey and Blair stuck at Conscript) still unresolved.

---

## Round 6 — the last round

**A deliberate strategic pivot.** With the team's commander (Casey) stuck at Conscript — the game's lowest Rank — and structurally unable to ever promote herself or benefit from being promoted, the team tried something different this round: **Avery (Private) contested and won the Command race instead**, specifically so that a higher-Rank player would be running Commander Actions and would be eligible to use the Promotions step on Casey or Blair if this round's Event passed. (Drew, despite outranking everyone at Sergeant, was never an option — his Tactician, **The Kingmaker**, explicitly bars him from ever holding the Command role.)

**Commander Actions (Planning).** Boss roll: 1d10 = 8 vs Enemy Progress 4 — no Boss (a real 40% spawn chance at this Enemy Progress, dodged). Event draw: **Utility Recall** (forces a Utility-gear unequip; trivially safe since nobody had Utility-type gear equipped — both Avery's and Casey's surviving items were Weapon-type) vs. **Weapons Allocation Freeze** (Completion Condition unreachable — needs Weapon gear on every single lane's Active unit, and the team didn't have 4 Weapons to go around). Avery picked **Utility Recall**, the safe no-op.

**Mission Assignment.** 5 cards: Drew took **Armory Detail** and, second pass, **Combat Medic IV** (a Brigadier-tier card, essentially unreachable). Avery took **Elite Asset**. Blair took **Full Export 3**. Casey took **Command Central**.

**Worker Placement / Income.** Avery (commander bonus, 3 workers): Command, Barracks, Medical Bay. Casey (2): Barracks, Armory. Blair (2): Armory, Battlefield. Drew (2): Battlefield, Medical Bay. Barracks shop Rank 10 (a Sergeant-rank Gunner and Flamethrower had drifted into the shop by this point) paid Avery and Casey +10/+10 each. Armory shop Rank 2 paid Casey and Blair +4 Tech each. Command paid Avery +2 Tech (Private = Rank 2). Battlefield (Blair + Drew) fed the Command pool +2/+2/+2. Scout Value added another +4/+1/+1 to Command. **By this point the Command pool alone held 29 Organic / 26 Tech / 12 Alien** — proof that, however badly the unit roster was getting wiped round after round, the underlying worker-placement income engine never once faltered. The economy was never the problem in the back half of this game; converting that economy into surviving lanes was.

**Full rebuild purchasing, round 3 of 3.** Avery (now genuinely wealthy) bought **Stubborn Recruit**, **Lazy Recruit**, and **Rookie Technician** for Lane 1 — 3 full units, the deepest any single lane had been stocked all game. Drew, still recovering financially from 2 rounds of total losses, could only afford a single Conscript-rank unit for Lane 4. Casey bought 3 more Conscript-tier cards for Lane 3. **Blair's situation was the most exposed: she had exactly 0 Organic this round** (her Battlefield/Armory worker assignments generate mostly Tech, not Organic, and she'd spent down her reserves over the previous rounds) and could not buy a single unit for Lane 2 no matter how much Tech she held. The team caught this before Deployment closed: Casey bought 1 extra Civilian Scout specifically to **trade it into Lane 2** via the Reassign Units stage's "offer trades with other lanes" clause — the first time this game that mechanic was used for real, and it kept Lane 2 from starting the round at zero. Avery and Casey also re-equipped their 2 surviving gear items (Grenade Launcher, Reinforced Barrels — both kept via the gear-survives-1-item rule across the last 2 wipeouts) onto their new Active units for 1 Tech each.

**Commander Actions (Deployment) — Enemy Draw.** Enemy Progress is now **4**, crossing into **Core** (4-5) for the first time — and the stat jump from Grunt to Core was, if anything, even sharper than Fodder-to-Grunt had been:

| Enemy | DMG | HP | Reveal | Passive |
|---|---|---|---|---|
| War Hound ×2 (Beast) | 7 | 12 | Deal 15 damage to lowest-HP unit | Attacks hit twice (14 effective DMG/exchange) |
| Crawler ×2 (Mechanised) | 8 | 15 | Roll D4, swap lanes with the active unit there | — |
| Space Lions ×2 (Beast) | 7 | 12 | Gain Shield = excess damage on kill | — |
| Shard Beast ×2 (Abomination) | 12 | 15 | Attacks hit adjacent lanes for half damage | Explodes for 2× damage on death |
| Knights ×2 (Infantry) | 7 | 7 | Gain 20 Shield | Attacks Pierce up to 2 Armor |
| Eye Drones ×2 (Drones) | 5 | 4 | Roll D4, move to that lane | Attacks Pierce up to 2 Armor |

For comparison: the team's best-ever single unit (Stubborn Recruit, Shield 7) could only survive **one** hit from a 7-Damage attacker; against this tier's 7-12 Damage and double-attack/Pierce effects everywhere, Shield 7 buys at most a single exchange of breathing room. Every player unit deployed this round was a 1-3 HP Conscript/Private-tier card. The math was no longer close.

**Enemy Scouting.** Lane 1's already-scouted War Hound flipped without re-triggering. Lane 3's already-scouted Knights flipped without re-triggering. Lane 2's freshly-revealed Knights used its Reveal to **Gain 20 Shield** (a self-buff, no player impact). Lane 4's freshly-revealed Crawler rolled a d4 (result: 2) for "swap lanes with the active unit in that lane" — landing on Lane 2.

> **Open Rules Question #6 found here:** Crawler's Reveal text, "swap lanes with the active unit in that lane," is genuinely ambiguous about which side's "active unit" it means — the rolled lane's active ENEMY, or specifically the rolled lane's active PLAYER unit (which would mean Crawler enters the player's roster's lane assignment somehow, which doesn't make sense for an enemy card, but the text doesn't rule it out on a literal read). We ruled it means the enemy side, by analogy with Lance Turret's similarly-worded lane-repositioning Reveal, which is unambiguous about being an enemy-side swap. Under that reading, Crawler swapped places with Lane 2's just-buffed Knights (Shield 20): Crawler (8 DMG/15 HP) became Lane 2's new Active enemy, and the heavily-shielded Knights became Lane 4's new Active enemy instead. Logged for confirmation.

**Combat Stage — the last fight of the game:**

- **Lane 1 (Avery):** Grenade Launcher's pre-combat chip (1 damage) barely dented War Hound's 12 HP. The main exchange: Stubborn Recruit's Shield 7 fully absorbed War Hound's FIRST of its two attacks, but the Passive's second 7-Damage hit landed on a now-shieldless Stubborn Recruit and killed it outright, in the very first exchange. Same-round promotion cycled through Lazy Recruit, then Rookie Technician — each died to the very first hit of War Hound's double-attack before their own Shield value (2, then 4) could matter much. **Lane 1 overran**, having fought the hardest of any lane this round (War Hound down to 5 of 12 HP) but still losing all 3 units.
- **Lane 2 (Blair):** the traded-in Civilian Scout died in 1 exchange to Crawler's 8 Damage. Blair had no Reserve. **Lane 2 overran.**
- **Lane 3 (Casey):** Civilian Survivalist (boosted by Reinforced Barrels to 4 DMG/3 HP) and 2 follow-up Conscripts ground Knights from 7 HP down to **1 HP** — agonizingly close to a kill — before running out of Reserve. **Lane 3 overran**, the closest near-miss of the round.
- **Lane 4 (Drew):** the lone Conscript chipped 1 point off Knights' transplanted Shield 20 and died instantly. **Lane 4 overran.**

**All 4 lanes overran for the third round in a row.** Lane Reinforcement had nothing to draw from for the third straight round — there was never a cleared lane anywhere on the board across Rounds 4, 5, or 6 to send help from.

**Cleanup Stage — the game ends.** Overrunning Lanes: 4 lanes overran this round. The Overrun Tracker entered this check at **2**. Per the rule, the moment the running tally reaches 0 **during** this check, the game ends immediately as a loss, and no further Cleanup sub-steps run at all — Event Resolution, Promotions, and Escalate for Round 6 never happened, exactly as the rule describes ("no remaining Cleanup sub-steps are processed once this happens, even if some of this round's Cleanup hasn't run yet"). With Overrun Tracker 2 and 4 lanes overrunning, the tracker crossed 0 partway through tallying this round's losses.

**THE GAME ENDS IN A LOSS, AT ROUND 6, ON THE OVERRUN TRACKER REACHING 0.**

---

## End of Game

**Result: LOSS.** Overrun Tracker hit 0 during Round 6's Cleanup (Overrunning Lanes check), ending the game immediately and skipping Round 6's Event Resolution, Promotions, and Escalate entirely.

**Final track values:**

| Track | Value |
|---|---|
| Overrun Tracker | **0** (started at 10, Normal difficulty) |
| Player Progress | **3** of 10 |
| Enemy Progress | **4** of 10 (Core band) |
| Rounds played | **Round 0 (prep) + Rounds 1-6** (6 real combat rounds) |

**Round-by-round Overrun Tracker history:** Round 1: 10 (no overruns). Round 2: 10 (2 overruns, both rescued by Lane Reinforcement). Round 3: 10 (1 overrun, rescued by Lane Reinforcement). Round 4: 6 (4 overruns, no reinforcement available). Round 5: 2 (4 overruns, no reinforcement available). Round 6: 0 — game over (4 overruns, no reinforcement available).

**Mission completions:** Drew completed 3 missions over the course of the game — **Conscription** (Round 1, instant), **Basic Training** (Round 3, instant), and **Stockpiled Reserves** (Round 4, instant) — each granting a flat +1 Rank (none were 3+ tier stretches, so the Mission Rank-scaling bonus never actually triggered this game despite being available). This is the only player who completed any missions at all; Avery, Blair, and Casey each held 2-3 in-progress missions at game end, mostly Rank-gated stretches (Captain/Major/Colonel/Specialist/Brigadier-tier) that the team's actual Rank progression (capped at Sergeant for the best-ranked player) never caught up to.

**Final Ranks:** Avery — Private. Blair — Conscript (never promoted all game). Casey — Conscript (never promoted all game, despite being commander for 6 of 7 rounds played). Drew — Sergeant (promoted 3 times via mission completions).

**Full Secret Objective reveal (Allied/Neutral only, per this game's setup):**

| Player | Secret Objective | Alignment | Outcome |
|---|---|---|---|
| Avery | Minimalist — end game with 3 empty upgrade slots | Neutral | **Completed** — the team built only 1 Location Upgrade all game (Containment Protocol, Round 2), which was then torn down by System Lockdown in Round 5 and never rebuilt; every location ended the game with all its slots empty. |
| Avery | Hoarder — stockpile 40 Organic | Neutral | Not completed — peaked in the high 20s personally, never reached 40. |
| Blair | Nerd — stockpile 40 Tech | Neutral | Not completed — peaked around 29 Tech before donating much of it to Command in Round 6's rebuild crunch. |
| Blair | Stubborn — Overrun Tracker does not drop by more than 5 over the course of the game | Allied | **Failed** — it dropped the full 10 points, from 10 to 0. |
| Casey | Leader — be commander for 5 turns | Allied | **Completed** — Casey held the commander role for Rounds 0 through 5 (6 rounds), only stepping back in Round 6's strategic pivot. |
| Casey | Conductor — take Command from a lower-Rank player 5 times | Allied | Not completed — nobody seriously contested Casey for Command most rounds, so this trigger condition rarely came up. |
| Drew | Survivor — Active unit survives 3 rounds | Neutral | Not completed — no single named unit of Drew's ever survived 3 consecutive rounds as Active; his roster was wiped and rebought every single round from Round 4 onward. |
| Drew | Technician — donate 10 Tech | Neutral | Not completed — Drew's one donation (Round 2) was 1 Alien, not Tech. |

Of 8 Secret Objectives in play, **2 completed** (both held by the players most insulated from the core combat disaster: Avery's passive Minimalist, completed by default since nothing was ever built; Casey's Leader, completed by simply holding the commander chair). The 2 directly combat-linked objectives (Stubborn, Survivor) both failed outright, and the 2 resource-stockpiling objectives (Hoarder, Nerd) failed because resources kept getting spent on emergency rebuilds rather than banked.

---

## Comparison against the previous 3-game batch

This was the entire point of the exercise: did the 17-change revision (README #31-40) fix the early-game collapse pattern that sank all 3 of the previous batch's games (Games 1-3, all losses, at Round 4, Round 5, and Round 5 respectively)?

**Yes, decisively, for the EARLY game specifically.** This game's Rounds 1-3 were a clean sweep — zero net Overrun Tracker damage through 3 full combat rounds, compared to all 3 previous games already bleeding Overrun Tracker points well before this point. Breaking down why:

- **Round 0** worked exactly as designed: every player entered Round 1 with units already deployed and Tech/Organic reserves built up, instead of Round 1 being the team's very first chance to do anything. There was no "Round 1 scramble" at all this game.
- **Lane Reinforcement** directly saved 2 lanes in Round 2 and 1 lane in Round 3 — 3 separate overruns that would have cost the Overrun Tracker 3 points under the old rules (and, per the now-overturned old reading where Reserve promotion was deferred to next round, likely would have compounded into even worse losses). Under the new rules, all 3 were fully reversed before Cleanup ever checked them.
- **Same-round Reserve promotion** is what made Lane Reinforcement's rescues possible at all — a reinforcing unit chaining through an enemy's entire remaining Reserve in the same exchange-sequence (not deferred to "ready next round") is precisely what let 1-2 reinforcing units clear out a fully-intact 3-enemy hoard in Rounds 2 and 3.
- **2 starting Organic + worker-free Command Donations** meant the team never hit the kind of dead-stop resource floor the previous batch's games describe — even Drew, the consistently poorest player this game, always had at least a trickle of Organic/Tech to work with, and could donate what little Alien he had without needing a Command worker to do it.
- **Empty scout pool still scouting** and the **Rank-separated Direct fill** piles removed 2 sources of friction/wasted turns that the previous batch's games spent real effort working around.

**No, the fixes did NOT prevent the late-game collapse, and the team did NOT survive meaningfully past the Grunt transition once it actually arrived.** This is the critical finding: the team cleared the Fodder→Grunt transition cleanly (Round 3 ended at full Overrun Tracker health), but then **Round 4 — the very first real Grunt-rank fight — wiped all 4 lanes simultaneously**, and the team never recovered. Rounds 4, 5, and 6 were three consecutive all-4-lanes-overrun rounds, the third of which ended the game outright. The originally-suspected "Grunt cliff" is **not** a red herring after all — or rather, it's real, but it's a different cliff than the resource-starvation one the previous batch hit. This game's data points to a stat-scaling cliff, not a resource cliff:

- Every player unit fielded all game, even by Round 6, was still Conscript/Private-tier (1-3 Damage, 1-4 HP, 0-7 Shield) — because **unit deploy-Rank is gated to the deploying player's own Rank**, and 2 of the 4 players (Casey, Blair) never moved off Conscript the entire game, while even the best-ranked player (Drew, Sergeant by Round 3) couldn't always afford his own Rank ceiling's units. Resources were never the constraint in the back half of the game — the team had a 29/26/12 Command pool sitting nearly idle at the moment of the final loss. **Rank was the constraint**, and Rank only moves through mission completion or being promoted by a higher-ranked commander — both of which are slow, opportunity-cost-laden, and actively undermined by the commander seat itself being unable to self-promote.
- Grunt-rank enemies (4-9 HP, 3-6 Damage, real Shield/Reveal/Passive text) and Core-rank enemies (4-15 HP, 5-12 Damage, double-attacks, Pierce, board-wide Reveals) scale up sharply by design — that's intentional difficulty progression — but the team's own unit quality never scaled to meet it, because Rank (the gate on unit quality) and Enemy Progress (the gate on enemy quality) are on **completely decoupled timelines**. Enemy Progress climbs by a fixed, guaranteed +1/round (after Round 1's grace period) regardless of what the team is doing. Player Rank climbs only when a mission completes or a Promotion lands — neither of which is guaranteed, or even likely, on any given round.
- The income/worker-placement economy, meanwhile, kept compounding successfully throughout — by the final round the Command pool alone held more combined resources than the entire team owned combined back in Round 2. **The fixes' actual target (early resource starvation) is thoroughly solved.** The team was never short on raw Organic/Tech/Alien after Round 0. It was short on the one resource none of the 17 changes touched: **Rank**, the gate that determines what that money can even buy.

**Revised conclusion:** the previous batch's "the Grunt cliff is a red herring, the real problem is early resource starvation" diagnosis is **half right and half wrong**, refined by this game's results into a sharper claim: resource starvation WAS the dominant problem in the original ruleset, and the 17 changes fixed it convincingly — proven by 3 clean rounds this game where the previous batch's games were already struggling. But fixing resource starvation fully exposed a second, previously-hidden bottleneck that resource starvation had been masking: **Rank-gated unit quality climbing far too slowly relative to the enemy difficulty curve.** The "Grunt cliff" is real, but it's not (or not only) a resource cliff — it's a Rank cliff. A team can have an overflowing Command pool and still lose outright if its players' own Ranks (and therefore unit quality ceilings) haven't kept pace with Enemy Progress's guaranteed, unconditional climb.

This suggests a natural next-round fix to test: something that ties Player Rank progression more directly to the passage of rounds or Enemy Progress itself (an automatic Rank trickle, more generous Promotion conditions, or a softer deploy-Rank gate that scales with Enemy Progress rather than being a hard wall) — analogous to what Round 0 and the Organic/Donation changes did for the resource side, but aimed squarely at Rank instead.

---

## Open Rules Questions Found

1. **4-player "first two workers get full income" — does it count per-location across all players sharing it, or specifically "the first two distinct players"?** A single player stacking 2 of their own workers at one location (Round 0's Barracks: Casey ×1 + Avery ×2 = 3 total workers there) raised this directly. We ruled per-location-across-all-workers-regardless-of-owner (consistent with the rule's literal text, "the first TWO workers," not "the first two players") — Avery's 2nd worker counted as that location's 3rd and halved, even though it was only the 2nd worker SHE placed there. Worth an explicit clarifying sentence in the rules text.

2. **Lane Reinforcement's "one additional combat exchange" (singular) vs. "resolved under the normal Combat Cycle rules" (which includes same-round Reserve promotion's chain-until-a-side-runs-out behavior).** These two phrasings are in tension. We ruled the chain continues — a reinforcement can clear a lane's ENTIRE remaining enemy Reserve in one go, not just trade once and stop — since "normal Combat Cycle rules" is fairly explicit text to override a literal "one exchange" cap. This ruling mattered a lot: it's what let 1-2 reinforcing units rescue lanes with 2-3 intact enemies still queued (Rounds 2 and 3), not just lanes with 1 straggler left. Recommend making this explicit either way, since it materially changes how powerful Lane Reinforcement is.

3. **Gear Passive pre-combat damage (Grenade Launcher: "deal 1/2 attack damage before combat") that outright kills the enemy's Active card — does the unit's main attack still also resolve that exchange (wastefully, against an already-dead target), or does the engagement end immediately and the next enemy promote without a "real" exchange?** We ruled the latter (pre-combat kill ends the engagement outright, the main swing is moot, no damage comes back since the dead enemy never acted). This made Grenade Launcher extremely strong against 1-HP Fodder specifically (Round 3: Stubborn Recruit took zero damage all round) but much less relevant once enemies had real HP pools (Grunt/Core). Worth an explicit ruling since it's a real swing in how strong "deal damage before combat" effects are.

4. **(Balance observation, not strictly a rules gap) Deploy-Rank gating vs. commander self-promotion lockout creates a structural trap: a low-Rank commander can never raise their own Rank ceiling through the Promotions step (no self-promotion), and every round they spend running Commander Actions is a round NOT spent chasing the missions that are the other path to Rank.** This game's Casey (commander for 6 of 7 rounds, including by deliberate Secret-Objective-driven choice) ended the game still at Conscript — the lowest possible Rank — managing one of the team's 4 combat lanes the entire time. This is presented as a balance/design observation rather than a rules ambiguity, since the rules themselves are unambiguous about both pieces (no self-promotion; deploy-Rank gates by the managing player's Rank) — it's the INTERACTION between them across a full game that surfaced as a real problem. See the "Comparison against the previous batch" section above for the full analysis.

5. **Does same-round Reserve promotion apply to a unit death caused during Enemy Scouting (a Reveal effect killing the lane's Active unit before the Combat Cycle has technically begun), or only to deaths during the Combat Cycle proper?** We ruled yes, it applies regardless of which stage caused the vacancy (Round 5: Hound's cross-lane Reveal killed Lane 2's Active Civilian Scout during Enemy Scouting; its Reserve Conscript promoted immediately rather than waiting for Combat Cycle to "officially" start). The alternative (an empty Active slot sitting defenseless until Combat Cycle begins) didn't seem to track with how the rules handle empty-slot situations everywhere else, but this is a genuinely new question not covered by the existing rules text or the Playtest Log's Resolution section.

6. **When an enemy lane-swap/repositioning Reveal (Crawler: "swap lanes with the active unit in that lane") triggers, and the target lane has its own separate enemy hoard already dealt, does the swapped-in card enter that lane's Active slot directly, or queue into its Reserve behind whatever's already Active there?** We ruled Reserve (queued behind), by analogy with how Lane Reinforcement and other lane-insertion effects work elsewhere — an enemy arriving mid-round via a repositioning effect doesn't skip the line ahead of a card that was already legitimately dealt and possibly already fighting. Also flagged: Crawler's own card text ("swap lanes with the active unit in that lane") is ambiguous about whether it means the rolled lane's active ENEMY or active PLAYER unit — we read it as enemy-side, by analogy with Lance Turret's similarly-worded and unambiguously-enemy-side Reveal, but the text doesn't explicitly rule out the player-side reading.

7. **Lazy Recruit's "Attacks every 2nd round" Bonus Effect — is the cadence per-unit (1st round it's ever in combat = attacks, 2nd = skips, repeating from when it was first deployed) or tied to the game's global round counter (e.g., skips on every even-numbered Round X regardless of when it joined combat)?** We ruled per-unit cadence. This had a real, costly consequence: in Round 2, Lazy Recruit's 2nd combat round happened to land on a skip, and with 1 HP and 0 Shield left over from Round 1, it died for free without dealing any damage back — directly costing that lane an otherwise-avoidable loss. The card text doesn't specify which reading is correct, and the choice materially affects how risky the card is to field.
