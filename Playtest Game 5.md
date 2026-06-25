# Playtest Game 5 — Full Walkthrough (2026-06-25): Testing Rank Trickle

## Purpose of this game

Playtest Game 4 validated the 17-change README #31-40 revision against the original 3-game batch's diagnosis of "early-game resource starvation": Game 4's Rounds 1-3 were a clean sweep, zero net Overrun Tracker damage through 3 full combat rounds — proof the early economy fixes (Round 0, Lane Reinforcement, same-round Reserve promotion, worker-free Command Donations, starting Organic, etc.) worked exactly as intended. But Game 4 still **lost outright at Round 6**, the moment Grunt-rank (Round 4) and then Core-rank (Round 6) enemies arrived. The post-game analysis found the real bottleneck had simply moved: **Rank**, not resources. Unit deploy-Rank is gated to a player's own Rank, and Rank only climbs via Mission completion or commander Promotion — both unreliable, opportunity-cost-laden, and in Game 4's case left 2 of the 4 players (Casey, Blair) stuck at Conscript for the entire game, fielding 1 Damage/1 HP stat-sticks against Core-rank enemies hitting for 7-12 Damage with 12-15 HP — while the team's Command pool sat on a nearly-idle 29 Organic/26 Tech/12 Alien at the moment of the final loss. Enemy Progress climbs a guaranteed, unconditional +1/round after Round 1's grace period; Rank had no equivalent guaranteed floor.

**README Feedback #41, "Rank Trickle,"** is the direct response: every player automatically gains +1 Rank every 2 rounds (end of Round 2, Round 4, Round 6, etc. — Round 0 doesn't count), capped at Brigadier, stacking on top of whatever Missions/Promotions already grant that round. Written into both `Rules.docx` and `Board_Rules_Reorganized.docx`'s Cleanup Stage, directly after the Escalate subsection.

**This game's entire purpose is to find out whether Rank Trickle actually closes the gap** — does the team survive meaningfully longer / further into Grunt-Core-Elite rank enemies than Game 4 did, with Ranks now climbing on a guaranteed schedule alongside Enemy Progress? Everything else from the prior 17-change batch (#31-40) remains active and is expected to come up naturally; this is not a re-test of those, it's a test of the one new lever stacked on top.

## Game Parameters

- **Players:** 4 (all seats narrated by the assistant)
- **Difficulty:** Normal (Overrun Tracker starts at 10; hoard size 3/lane base, +1 at Player Progress 5-7, +1 more at 8-10, caps at 5/lane)
- **Optional rules in use:** Commander's Call (commander chooses who gets full income at a shared location, instead of default lowest-Rank-priority)
- **Secret Objectives:** Allied/Neutral only this game (no Saboteur/Chaos) — a clean mechanical baseline matching Game 4, so the Rank comparison isn't confounded by hidden-traitor play
- **Tooling:** `dealer.py`, seed `5005`, state file `state_game5.json`, align mode `exclude_chaos_saboteur`

## The Table

| Seat | Name | Starting Rank | Lane | Tactician | Secret Objectives |
|---|---|---|---|---|---|
| P1 | Reese | Conscript | 1 | The Quartermaster | Scientist (Neutral, donate 5 Alien), Architect (Neutral, fully upgrade 3 buildings) |
| P2 | Blake | Conscript | 2 | The Chessmaster | The Wall (Allied, don't let your lane overrun), Adventurer (Allied, complete 6 missions) |
| P3 | Sasha | Conscript | 3 | The Bastion | Hoarder (Neutral, stockpile 40 Organic), Minimalist (Neutral, end game with 3 empty upgrade slots) |
| P4 | Toren | **Private** (Leader, +1 Rank) | 4 | The Kingmaker | Exporter (Neutral, retire 5 units), Survivor (Neutral, Active unit survives 3 rounds) |

Leader was decided by a d8 roll mod 4 (result 4 → seat 4, **Toren**). Toren starts at Private (+1 Rank for being Leader) and begins with 4 Command Cards instead of 2: Flash Sale, Collaboration, AI advancements, Experimental Science. Everyone else holds the standard starting 2: Reese — Priority Operations, Scouting update; Blake — Whites of their eyes, Mad Science; Sasha — Bunkers, Leader Speech.

Notable coincidence of the deal: Toren's Tactician, **The Kingmaker**, has a Passive reading "You cannot be the commander; if you would become commander, make another player commander instead" — same Passive Game 4's Drew held. Toren is therefore never eligible to take the Command worker-placement race this game either, for the entire game, regardless of Rank.

Per Player Setup (README #36), each player also starts with **2 Organic** on top of their normal starting cards. All starting hands above already reflect that.

Starting Mission hands (2 each, drawn from the unsorted Mission pool): Reese — Mission Success (Conscript), Command Detail (Captain). Blake — Medical Emergency (Captain), Balanced Contribution IV (Captain). Sasha — Special Operations (Captain), Iron Grip (Specialist). Toren — Containment Block Detail (Sergeant), Conscription (Conscript).

---

## Setup

**Decks.** Per Managing Decks: Secret Objectives, Missions, Events, Tactician, and Command Cards shuffled as single piles. Enemies separated into Rank piles. Units: Vehicles/Mechs set aside, remaining Infantry pool split into Rank piles. Gear: Experimental set aside, remaining gear split into Rank piles.

```
Units(base)=41 setaside=62 (Vehicles/Mechs)
Gear(base)=60 setaside=8 (Experimental)
Enemy piles: Fodder=2, Grunt=8, Core=6, Advanced=35, Elite=14, General=17, Conqueror=11
Secret=26 (post-deal, Allied/Neutral only) Missions=117 Events=40 Tactician=18 Command=61 Boss=15
```

**Overrun Tracker** starts at 10 (Normal). **Player Progress** and **Enemy Progress** both start at 0.

With Leader Selection complete, the game now runs **Round 0** in full before Round 1 begins.

---

## Round 0 — Prep Round

**What Round 0 is.** A full Planning Stage and full Deployment Stage, run exactly as any other round — worker placement, income, purchasing, Command Donations, healing, scouting, reassigning, equipping — but with **no enemies and no Combat Stage at all**. Cleanup only handles Managing the Dead (trivially empty) and Command Card Refill; Overrunning Lanes, Event Resolution, Promotions, and Escalate are all skipped outright.

**Commander for Round 0.** Since Round 0 has no previous round, the Leader-fills-in-as-commander exception applies here instead of Round 1 — but as in Game 4, nobody actually needed it: Round 0 still runs its own real Worker Placement, and whoever wins the Command race becomes Round 0's actual commander.

**Worker Placement.** Each player has 2 Worker Tokens (nobody is yet Captain-rank for a 3rd). Turn order ran seat order P1→P2→P3→P4.

- **Reese (P1)** → 1 worker to **Command** (wins the Command race, becomes Round 0's commander), 1 worker to **Barracks**.
- **Blake (P2)** → 1 worker to **Armory**, 1 worker to **Command** (sharing with Reese).
- **Sasha (P3)** → 2 workers to **Barracks** (sharing with Reese).
- **Toren (P4)** → 2 workers to **Battlefield**. Toren's Tactician, **The Kingmaker**, bars him from ever contesting Command — moot here since he didn't try.

**Sharing locations.** This is a 4-player game, so the first TWO workers at a shared location both earn full income; only a 3rd worker onward halves. Barracks had 3 workers this round (Reese ×1, Sasha ×2): Reese (1st) and Sasha's 1st worker both full; Sasha's 2nd worker is that location's 3rd and halves. Command had exactly 2 workers (Reese, Blake) — both full under the 4-player rule, no decision needed even with Commander's Call active.

**Income generated:**

Barracks shop total Rank at the time of income: 2 Conscript-rank slots (Civilian Scout, Civilian Survivalist) + 2 Private-rank slots (Stubborn Recruit, Rookie Technician) = 1+1+2+2 = **6**. Armory shop total Rank: Scoped Weapons (Conscript) + Basic Camo (Private) = 1+2 = **3**.

| Location | Workers | Effect | Result |
|---|---|---|---|
| Barracks | Reese (full), Sasha (1st, full), Sasha (2nd, half) | Tech+Organic = total shop Rank (6) | Reese +6/+6; Sasha +6/+6 (1st) +3/+3 (2nd, half of 6) = **+9/+9** |
| Armory | Blake (1, full) | Tech = 2× total shop Rank (3×2=6) | Blake +6 Tech |
| Command | Reese (1, full), Blake (1, full) | Resources of choice = Rank per worker (Conscript=1) | Reese +1 Tech, Blake +1 Tech |
| Battlefield | Toren (2, both full) | +1 all resources **to Command pool** per worker | Command pool +2 Organic +2 Tech +2 Alien |

Personal resource totals after income (starting 2 Organic + the above):

| Player | Organic | Tech | Alien |
|---|---|---|---|
| Reese (P1) | 2 + 6 = 8 | 6 + 1 = 7 | 0 |
| Blake (P2) | 2 | 6 + 1 = 7 | 0 |
| Sasha (P3) | 2 + 9 = 11 | 9 | 0 |
| Toren (P4) | 2 | 0 | 0 |
| **Command pool** | 2 | 2 | 2 |

**Purchasing.** Barracks shop (Direct-filled, Rank 1-3 pool): Civilian Scout, Civilian Survivalist, Stubborn Recruit (Private, Shields 7), Rookie Technician (Private, Shields 4). Armory shop: Scoped Weapons (Conscript Weapon), Basic Camo (Private Armor).

- **Reese** bought **Stubborn Recruit** (O3/T1, Shields 7) for Lane 1 Active. Remaining: 5 Organic / 6 Tech.
- **Blake** bought **Civilian Scout** (O1/T0) for Lane 2 Active. Remaining: 1 Organic / 7 Tech.
- **Sasha** bought **Rookie Technician** (O3/T1, Shields 4) for Lane 3 Active. Remaining: 8 Organic / 5 Tech.
- **Toren** bought **Civilian Scout** (O1/T0, refilled into the slot) for Lane 4 Active. Remaining: 1 Organic / 0 Tech.

Each purchase Direct-filled its shop slot immediately from the relevant Rank pile.

**Command Donations.** None this round — nobody had spare resources worth banking yet, and the active scout pile already had a Scout-eligible unit available from setup.

**Deployment Stage.**
- *Heal Units:* nothing to heal.
- *Assign Scouts:* Reese (commander) assigned **Civilian Survivalist** as the active scout (its Scout Value: Organic 4 / Tech 1 / Alien 1, added to Command pool the moment it's assigned — though it had already been sitting in the scout pool from a designer note in this game's setup pull, so this is simply confirming it into the active slot).
- *Reassign Units / Manage Equipment:* each player's purchase deployed straight into their lane's Active slot. No Reserve units exist yet. No gear equipped this round.

**Mission Assignment.** Reese (commander, Conscript = Rank-tier 1) drew missions = players (4) + commander's Rank-tier (1) = **5** mission cards, passed starting from the player to his left (Blake):

1. Blake picked **Organic Contribution II** (Private — donate 10 Organic to Command; reward +3 all resources).
2. Sasha picked **Tech Export 4** (Captain — return 20 Tech to supply; reward +10 Tech).
3. Toren picked **Steel Supremacy** (Private — own more Mechs than Infantry/Vehicles; not yet possible, no Mechs exist on the team).
4. Reese picked **Full Export 6** (Specialist — a deep stretch for now).
5. Pool didn't divide evenly (5 cards / 4 players), so Blake picked again: **Combat Medic I** (Private — heal 10 damage during combat; reward +3 all resources).

No mission was completable yet this round.

**Cleanup Stage.** Managing the Dead: nothing (no combat happened). Overrunning Lanes / Event Resolution / Promotions / Escalate: all skipped outright, exactly as Round 0 specifies. (Rank Trickle's own clause — "Round 0 doesn't count toward this" — also means this round contributes nothing toward the every-2-rounds cadence; the count starts fresh at Round 1.) **Command Card Refill** ran on schedule: Reese (this round's commander) is below his target hand size of 4, so he drew up to it (drew 2 more: Countermeasures, Punch Through). Blake and Sasha are each capped at hand size 3 (non-commander) and held 2, so each drew 1 more (Blake: Nuke; Sasha: Ethics Committee). Toren already sits at exactly 4 cards from his Leader bonus — but his target as a non-commander this round is only 3, so per the refill rule he should discard down to size, not draw. **Ruling applied here:** the refill rule's "discards unwanted cards to the bottom of the deck and redraws up to hand size" is read as a floor-only correction when a player is already above their target (i.e., a player above hand size is not forced to discard down — Toren keeps all 4 of his Leader-bonus cards going forward, since nothing in the rule text says hand size is also a cap, only a refill target). This is a new edge case, logged at the end of this document.

**End of Round 0 state:** Overrun Tracker 10, Player Progress 0, Enemy Progress 0. Each lane has exactly 1 Active unit deployed, no Reserves yet. **Reese is confirmed as Round 1's commander** (holdover from Round 0's Worker Placement win).

---

## Round 1

**Commander Actions (Planning).** Reese (holdover commander) ran this round's Commander Actions. Boss spawn roll: 1d10 = 4, compared against Enemy Progress 0 — rolling at or below 0 is needed to spawn, mechanically impossible at EP0, so no Boss spawned. Event draw: **Food Shortage** (all income converts to Organic; completes by returning 10 Organic to supply, reward +5 Organic each; failure raises shop Organic costs by 2) vs. **Saboteur investigation** (dice-gated location lockdown; reward is a bonus upgrade draw, failure shrinks the team's upgrade-slot cap). Reese picked **Food Shortage** — straightforward, no real downside this early since nobody's deep into upgrade-slot planning yet.

**Mission Assignment.** Reese drew missions = 4 players + his own Rank-tier (Conscript = 1) = 5 cards, passed starting from Blake (to his left): Blake took **Organic export 2** (Private) and, second pass (5 doesn't divide evenly across 4), also took **Tech Donated III** (Sergeant). Sasha took **Xenobiology Delivered I** (Conscript — donate 1 Alien to Command; doable immediately but not yet acted on). Toren took **Boots on the Ground** (Private — "fill a lane with only Infantry").

Toren's **Boots on the Ground** completed the instant it was drawn: Lane 4 already holds exactly 1 unit, Civilian Scout, which is an Infantry Scout (a subtype of Infantry, not a separate category per the card-breakdown rules) — "filled with only Infantry" is trivially satisfied. Reward: +3 all resources. Completing 1 mission grants +1 Rank at end of turn; Private→Sergeant is only 1 tier above Toren's current Rank (not the 3+ tier stretch the Mission Rank-scaling bonus requires), so just the flat +1 Rank applies, promoting **Toren: Private → Sergeant** at end of Round 1.

**Worker Placement.** Reese gets a 3rd worker this round for being commander; everyone else still has 2.

- Reese (3): Command (1), Barracks (1), Medical Bay (1).
- Blake (2): Armory (1), Medical Bay (1).
- Sasha (2): Barracks (1), Battlefield (1).
- Toren (2): Battlefield (1), Medical Bay (1).

All 3 of Reese, Blake, and Toren placed at Medical Bay — Reese and Blake's workers are full income (1st and 2nd there), Toren's 3rd worker halves (rounds down to 0 on the flat +1 Organic portion, with nothing wounded yet anyway).

**Income.** Barracks shop total Rank = 6 (Civilian Scout + Conscript at rank 1 each, Lazy Recruit + Rookie Gunner at rank 2 each): Reese and Sasha both full there: +6/+6 each. Armory shop total Rank = 3 (Scoped Weapons + Basic Camo, unsold leftovers from Round 0): Blake alone, full: +6 Tech (2×3). Command: Reese alone this round (Blake moved to Armory): +1 Tech (Conscript = Rank 1). Battlefield: Sasha + Toren, both full: Command pool +2 Organic/+2 Tech/+2 Alien. Medical Bay: +1 Organic flat to Reese and Blake (full), +0 to Toren (halved, rounds down) — nobody wounded yet so the heal-based bonus doesn't apply to anyone. The active scout (Civilian Survivalist)'s Scout Value (Organic 4/Tech 1/Alien 1) trickled into the Command pool again, on the reading (confirmed in Game 4) that Scout Value pays out every round a scout serves, not just at first assignment.

Per **Food Shortage**'s Round Effect, all the above income converted to Organic instead of its normal resource type this round.

Updated personal totals after Round 1 income (Organic-converted): Reese 5+6+6+1+1=19 Organic, 6 Tech (carried, untouched since income converted to Organic not Tech this round), 0 Alien. Blake 1+6+6+1=14 Organic, 7 Tech (carried), 0 Alien. Sasha 8+6+6=20 Organic, 5 Tech (carried), 0 Alien. Toren 1+0(Boots reward, +3 all)=4 Organic +3 Tech +3 Alien, then Medical Bay's halved 0.

**Purchasing.** Reese bought **Reinforced Barrels** (O1/T2, Weapon, +3 DMG/+2 HP) from the Armory and equipped it onto Stubborn Recruit for 1 Tech (Conscript-rank equip cost) — Stubborn Recruit is now effectively 5 DMG/4 HP on top of Armor 1/Shields 7. Blake bought a **Civilian Scout** for Lane 2's Reserve. Sasha bought a **Conscript** for Lane 3's Reserve. Toren, still thin on Tech, donated his spare 3 Alien to the Command pool instead of buying (worker-free Command Donation, no worker placed at Command required).

**Deployment Stage.** Nothing wounded to heal. Scout already assigned. Reassign/Equip: gear above is the only change; everyone's fresh Reserve purchases slotted in behind their Round 0 Actives.

**Commander Actions (Deployment) — Enemy Draw.** Normal difficulty, Player Progress 0 → hoard size 3/lane base. Total pool = 3×4 = **12 enemies**, drawn at Fodder rank (Enemy Progress 0-1): Pests/Ticks, plain 1 Damage/1 HP stat-sticks with no Reveal/Passive text by design. The active scout's reveal count (1 base + 1 from Civilian Survivalist's "Scouts +1 enemy" = 2) flipped 2 of the 12 face-up before the pool was reshuffled and dealt 3-per-lane — cosmetic this round, since every Fodder card is mechanically identical.

**Combat Stage.** Reese (commander) chose lane order 1→2→3→4.

- **Lane 1 (Reese):** Stubborn Recruit, now boosted by Reinforced Barrels (5 DMG/4 HP, Armor 1, Shields 7), simply steamrolled all 3 of its lane's 1 HP/1 DMG enemies — Shields absorbed every hit without ever dropping HP. **Cleared**, Stubborn Recruit untouched at full HP, Shields 4/7.
- **Lane 2 (Blake):** Civilian Scout (1/1, Shields 1) traded its Shield away on the first hit, then died to the 2nd Ticks in a mutual kill; same-round Reserve promotion brought in the freshly-purchased 2nd Civilian Scout, who one-shot the last Pests using its own Shield to survive. **Lane 2 cleared.**
- **Lane 3 (Sasha):** Rookie Technician (2/2, Shields 4) ground through all 3 of its enemies without ever dropping below Shields 1. **Lane 3 cleared,** no losses.
- **Lane 4 (Toren):** Civilian Scout traded its Shield for the first hit, then died to the 2nd enemy simultaneously with killing it; Toren had no Reserve purchased this round (he donated instead of buying), so the lane's 3rd enemy (a Pests) found nobody home in the Active slot the instant the 2nd enemy's combat resolved. **Lane 4 overran**, with 1 Pests surviving uncontested — the direct, predictable cost of Toren choosing to donate rather than restock his Reserve.

**Lane Reinforcement.** Lanes 1 and 3 cleared with surplus (Lane 1: Stubborn Recruit at full health, no Reserve to spare since none was bought; Lane 3: Rookie Technician untouched, also no Reserve bought). Neither lane actually has a spare unit to send — Lane Reinforcement requires moving **surviving units**, and both cleared lanes' only unit is still their own Active, needed to stay put. **No reinforcement was possible this round** despite 2 lanes clearing cleanly, since nobody had bought a 2nd unit for either lane. Lane 4's overrun stands.

**Cleanup Stage.**
- *Managing the Dead:* Civilian Scout ×2 (Lane 2, one original one promoted-and-died... correction: only the original Lane 2 Civilian Scout died; the promoted reserve survived as Lane 2's new Active), Civilian Scout (Lane 4) — 2 player units lost. All 11 of the 12 enemies that fought died; 1 (the Lane 4 survivor) is still alive and uncontested.
- *Overrunning Lanes:* **1 lane overran** (Lane 4). Overrun Tracker drops from **10 to 9**.
- *Event Resolution:* **Food Shortage** required returning 10 Organic to supply to succeed; nobody did (everyone was busy spending/banking what Food Shortage had just converted) — **failed**. Failure Penalty: shop Organic costs +2 across the board, effective next round's purchasing.
- *Promotions:* the event failed, so no Promotions step this round.
- *Escalate:* Round 1's grace period skips Enemy Progress's advance — **Enemy Progress stays at 0**. Not all lanes survived (Lane 4 overran) — **Player Progress does NOT advance**, holds at 0.
- Toren's Boots on the Ground promotion resolves: **Toren: Private → Sergeant.**
- *Command Card Refill:* Reese (next round's commander again) is at hand size 4 already (no change). Blake/Sasha at 3 already. Toren still sits at 4 from his Leader bonus, above the 3-card non-commander floor — no forced discard, per the ruling established in Round 0.

**End of Round 1:** Overrun Tracker **9** (down 1 from the starting 10), Player Progress **0**, Enemy Progress **0**. Reese remains commander into Round 2.

**Rank check (Round 1):** Reese Conscript, Blake Conscript, Sasha Conscript, Toren **Sergeant** (promoted via Boots on the Ground). Rank Trickle has not fired yet — its first checkpoint is end of Round 2.

---

## Round 2 — Rank Trickle's first checkpoint

This is the round whose Cleanup is expected to fire Rank Trickle for the first time: every player gains +1 Rank automatically at end of Round 2, regardless of what else happens.

**Commander Actions (Planning).** Boss roll: 1d10 = 3, still above Enemy Progress 0 (unchanged — Round 1's Escalate was skipped, so Enemy Progress entering Round 2's Planning is still 0) — no Boss. Event draw: **Forced Re-Armament** (doubles equipment costs; completes by fully re-gearing a unit, reward "equip anytime without the upgrade") vs. **Honorable Discharge** (Round Effect: units that die in combat Retire instead — a soft buff, since Retire returns a resource refund and lets gear come back to hand, where a normal combat death only saves 1 item; completes by retiring 5-10 units deliberately, unlikely; failure penalty just turns off Retire's resource refund). Reese picked **Honorable Discharge** — the Round Effect alone is a genuine upside with no real downside risk this early, and the failure penalty is mild since the team wasn't planning to chase its Completion Condition anyway.

**Mission Assignment.** 5 cards again (4 players + Reese's Rank-tier 1), passed starting from Blake: Blake took **Organic export 5** (Major) and, second pass, **Organic Contribution V** (Major) — both deep stretches for now. Sasha took **Xenobiology Delivered II** (Private — donate 3 Alien to Command). Toren took **Maintain Morale** (Sergeant — "be over 5 progress," not yet true). Reese took **Strategic Surplus** (Captain — "Command has over 60 total resources," a real target given the Command pool's current 9/5/5).

**Worker Placement.** Reese (3, commander bonus): Command, Barracks, Armory. Blake (2): Armory, Battlefield. Sasha (2): Barracks, Battlefield. Toren (2): Battlefield, Medical Bay — Toren has no unit at all in Lane 4 right now (it overran and emptied last round), so restocking is the priority; he kept 1 worker on Battlefield to keep feeding the Command pool and 1 on Medical Bay in case any future heal capacity is useful, but mainly needs to spend his own resources on a purchase, not on more workers this round.

**Income.** Barracks shop Rank = 6 (2 Conscript-rank, 2 Private-rank slots, same shape as before): Reese + Sasha both full there: +6/+6 each. Armory shop: with Reinforced Barrels sold off the slot last round, the current shop is Basic Camo (Private, rank 2, unsold leftover) + a fresh Conscript-rank Direct fill — total rank 3: Reese + Blake both full: +6 Tech each (2×3). Command: Reese alone: +1 Tech. Battlefield: Blake + Sasha + Toren (3 workers) — first two full, 3rd (Toren) halves: Command pool +2/+2/+2 (Blake) +2/+2/+2 (Sasha) +1/+1/+1 (Toren, halved) = **+5 Organic/+5 Tech/+5 Alien** to Command pool. Medical Bay: Toren alone, full: +1 Organic flat (still nobody wounded). Scout Value (Civilian Survivalist): Command pool +4 Organic/+1 Tech/+1 Alien again.

Updated personal totals: Reese 19+6+6+1=32 Organic, 5+6=11 Tech. Blake 14+6=20 Organic, 7+6=13 Tech. Sasha 20+6=26 Organic, 5 Tech. Toren 4+1=5 Organic, 3 Tech.

Command pool after income: 9+5+4=18 Organic, 5+5+1=11 Tech, 5+5+1=11 Alien.

**Purchasing.** Toren — the one player with an empty lane — bought **Pack Mule** (O3/T1, Private rank, Shields 4) for Lane 4's Active, restocking the lane that overran last round. This also satisfies the spirit of his earlier Boots on the Ground pattern (a single Infantry unit filling the lane), though that mission's already spent. Reese bought a 2nd unit, **Recruit Prodigy** (O3/T1, Private, Scout-type), for Lane 1's Reserve — the first round any lane has had a real Reserve behind its Active. Blake bought a **Conscript** for Lane 2's Reserve. Sasha bought a **Civilian Survivalist** for Lane 3's Reserve, and donated 3 Alien to Command toward her Xenobiology Delivered II mission requirement (not yet complete — needs to check at Cleanup or whenever the threshold's tracked; ruling: missions can complete "any time," so this lands as soon as the donation posts — donating exactly 3 Alien completes it immediately). Reward: +3 all resources, +1 Rank at end of turn (Private bracket, only 1 tier above Sasha's Conscript — flat +1, no stretch bonus).

**Deployment Stage.** Nothing wounded to heal. Reassign/Equip: fresh purchases slot into Reserve (or Active for Toren's empty Lane 4) behind/in place of existing units.

**Commander Actions (Deployment) — Enemy Draw.** Player Progress is still 0 (held from Round 1's overrun), hoard size still base 3/lane. Enemy Progress is still 0 (Round 1's Escalate was skipped) — **another 12 Fodder-rank enemies**, the team's last round of the gentle Pests/Ticks tier before Round 2's own Escalate pushes Enemy Progress to 1 (still Fodder band) and Round 3's pushes it further. Scouted 2 of 12 before dealing 3-per-lane.

**Combat Stage.** Lane order 1→2→3→4.

- **Lane 1 (Reese):** Stubborn Recruit (5 DMG/4 HP, Armor 1, Shields 7 carried from Round 1, untouched) cleanly killed all 3 of its 1 HP enemies without losing a single Shield point worth noting. **Cleared**, full health, Recruit Prodigy still sitting untouched in Reserve.
- **Lane 2 (Blake):** the surviving Civilian Scout (full HP, 0 Shields — spent surviving Round 1) traded into the first Ticks and died simultaneously; same-round promotion brought the freshly-bought Conscript into Active, who one-shot the next Pests using its own fresh Shield, then traded down to the last Ticks and died in a mutual kill (Conscript's Shield only covers 1 hit). With no further Reserve, the lane's combat ends there — but only 2 of 3 enemies died: **0 enemies remain? Let's check: 3 enemies dealt, 2 died (1 to the dying Scout, 1 to the Conscript's shielded kill), Conscript itself died on its 2nd exchange (to the 3rd enemy) — does the 3rd enemy also die or survive that trade?** Conscript's 1 DMG vs the 3rd enemy's 1 HP is exactly lethal — it's a mutual kill, so the 3rd enemy also dies. **Lane 2 cleared,** at the cost of both the original Scout and the promoted Conscript.
- **Lane 3 (Sasha):** Rookie Technician (Shields 4, slightly worn from Round 1 but still full HP) handled all 3 of its enemies inside its Shield buffer alone. **Cleared,** Civilian Survivalist untouched in Reserve.
- **Lane 4 (Toren):** the freshly-deployed Pack Mule (Shields 4) handled all 3 of its lane's Fodder enemies the same way — Shields absorbing every hit. **Cleared.**

**All 4 lanes cleared this round — the first all-clean round of Game 5.** Lane Reinforcement had nothing to do (no lane overran). The Overrun Tracker holds.

**Cleanup Stage.**
- *Managing the Dead:* Civilian Scout + Conscript (both Lane 2) — 2 player losses. All 12 enemies died.
- *Overrunning Lanes:* 0 lanes overran. Overrun Tracker holds at **9**.
- *Event Resolution:* **Honorable Discharge**'s Completion Condition (retire 5-10 units this turn) was never attempted — nobody retired anything — so it **failed**. Failure Penalty: Retire from Duty no longer gives its resource refund, going forward (a mild, slow-burn penalty; doesn't affect anything that happened this round).
- *Promotions:* the event failed — no Promotions step.
- *Escalate:* **Enemy Progress advances to 1** (still inside Fodder, 0-1 — Round 3 will push it to 2, crossing into Grunt). All 4 lanes survived clean — **Player Progress advances to 1**.
- Sasha's Xenobiology Delivered II promotion resolves: **Sasha: Conscript → Private.**
- **Rank Trickle fires for the first time:** end of Round 2, every player gains +1 Rank automatically, on top of anything else this round already granted. Reese: Conscript → **Private**. Blake: Conscript → **Private**. Sasha: already promoted this round to Private via her mission (flat +1) — Rank Trickle stacks on top, per its own text ("on top of anything earned from Missions or Promotions that round"): Private → **Sergeant**. Toren: Sergeant → **Captain**.
- *Command Card Refill:* Reese at 4 (commander), Blake/Sasha at 3 — no changes needed. Toren still above his 3-card floor at 4 — no forced discard.

**End of Round 2:** Overrun Tracker **9**, Player Progress **1**, Enemy Progress **1**. Reese remains commander into Round 3.

**Rank check (Round 2, post-Trickle):** Reese **Private**, Blake **Private**, Sasha **Sergeant**, Toren **Captain**. Compare Game 4's Round 2 end-state, where all 4 players were still sitting at Conscript/Conscript/Conscript/Private (only Avery, the Leader, had moved off the floor at all) — this game's spread is already visibly wider and higher across the board after just 1 Rank Trickle application, with the team's best-ranked player (Toren) now 2 full Ranks ahead of Game 4's best (Drew, Private at the same checkpoint).

---

## Round 3 — the Fodder→Grunt transition round

This round's own Escalate pushes Enemy Progress from 1 to 2 — the same transition that, in Game 4, was the last "easy" round before Round 4's Grunt-rank wipeout. Round 3 itself is still Fodder.

**Commander Actions (Planning).** Boss roll: 1d10 = 7 vs Enemy Progress 1 — no Boss. Event draw: **Combined Arms Training** (stuns an Active unit if another Active unit shares its type; completes with 1 of each unit type fielded — the team has fielded nothing but Infantry/Infantry Scout all game, a real risk) vs. **Garbage Day** (lets players restore items from Recycling for Tech, or recycle items into the deck for Organic; completes if Recycling ends the round at half its starting size; reward is a permanent ongoing effect; failure just deletes items on death instead of the normal gear-survives-1-item rule). Reese picked **Garbage Day** — Combined Arms Training's stun clause was a real, live risk (every unit on the board is Infantry-type) where Garbage Day's worst case (failure) only matters once gear actually starts dying, which hasn't happened yet.

**Mission Assignment.** 5 cards, passed starting from Blake: Blake took **Full Export 2** (Private) and, second pass, **Balanced Contribution II** (Private). Sasha took **Double Loadout** (Captain). Toren took **Fully Armed** (Private — "fully equip a unit," achievable soon with the team's growing Tech reserves). Reese took **Lane Specialist II** (Captain).

**Worker Placement.** Reese (3, commander bonus): Command, Barracks, Armory. Blake (2): Barracks, Battlefield — Blake's lane is completely empty after Round 2's losses and needs restocking above all else. Sasha (2): Armory, Battlefield. Toren (2): Battlefield, Medical Bay.

**Income.** Barracks shop Rank = 6 (2 Conscript + 2 Private slots): Reese + Blake both full: +6/+6 each. Armory shop: Basic Camo (Private, rank 2, still unsold) + a fresh Conscript Direct fill (rank 1) = rank 3: Reese + Sasha both full: +6 Tech each. Command: Reese alone: +2 Tech (Private = Rank 2 now, after Round 2's Trickle promotion). Battlefield: Blake + Sasha + Toren (3 workers, first two full, 3rd halves): Command pool +2/+2/+2 (Blake) +2/+2/+2 (Sasha) +1/+1/+1 (Toren, halved) = +5/+5/+5. Medical Bay: Toren alone, full: +1 Organic flat. Scout Value: Command pool +4/+1/+1.

Updated personal totals: Reese 32+6+6+2=46 Organic, 11+6=17 Tech. Blake 20+6=26 Organic, 13 Tech. Sasha 26+6=32 Organic, 5+6=11 Tech, 3 Alien. Toren 5+1=6 Organic, 3 Tech.

Command pool after income: 18+5=23 Organic, 11+5+1=17 Tech, 8+5+1=14 Alien.

**Purchasing.** Blake — restocking from zero — bought **Civilian Scout** AND **Civilian Survivalist** for Lane 2 (Active + Reserve), the first time this game a lane has been rebuilt from a complete wipe; with 26 Organic on hand this barely dented his reserves. Reese bought **Airburst Rounds** (O2/T4, Weapon, 7 DMG/3 HP, Passive "Attacks splash onto adjacent lanes") from the Armory and equipped it onto Recruit Prodigy in Lane 1's Reserve for 2 Tech (Private-rank equip cost) — preparing a 2nd strong unit behind Stubborn Recruit. Sasha bought **Recruit** for Lane 3's Reserve (now 2-deep there too). Toren, still comparatively thin on Tech but flush on Organic, bought **Lazy Recruit** for Lane 4's Reserve.

**Deployment Stage.** Nothing wounded. Fresh purchases slot into Reserve (or fill Lane 2's Active for Blake).

**Commander Actions (Deployment) — Enemy Draw.** Player Progress is 1 (still under the 5-7 threshold), hoard size still base 3/lane. Enemy Progress is still 1 going into this round's draw (Round 2's Escalate only brought it to 1; Round 3's own Escalate hasn't run yet) — one more round of Fodder, 12 more Pests/Ticks.

**Combat Stage.** Lane order 1→2→3→4.

- **Lane 1 (Reese):** Stubborn Recruit (5 DMG/4 HP, Armor 1, Shields 7) cleared all 3 enemies without dropping a Shield point. **Cleared,** Recruit Prodigy + Airburst Rounds untouched in Reserve.
- **Lane 2 (Blake):** the freshly-bought Civilian Scout's Shield absorbed the 1st hit and killed that enemy in the trade, then died to the 2nd enemy in a mutual kill (no Shield left). Same-round promotion brought in Civilian Survivalist, who used its own fresh Shield 1 to kill the 3rd enemy and survive. **Lane 2 cleared,** losing the original Scout but keeping the promoted Survivalist standing.
- **Lane 3 (Sasha):** Rookie Technician (Shields 4, slightly worn) absorbed all 3 hits inside its Shield buffer. **Cleared,** no losses, Recruit still untouched in Reserve.
- **Lane 4 (Toren):** Pack Mule (Shields 4) did the same. **Cleared,** Lazy Recruit untouched in Reserve.

**All 4 lanes cleared again — the second clean round in a row.** Lane Reinforcement had nothing to do.

**Cleanup Stage.**
- *Managing the Dead:* Civilian Scout (Lane 2 only) — 1 player loss, the lightest casualty round yet. All 12 enemies died.
- *Overrunning Lanes:* 0 lanes overran. Overrun Tracker holds at **9**.
- *Event Resolution:* **Garbage Day**'s Completion Condition (Recycling at half its starting size) was trivially true — nothing was in Recycling to begin with (0 stays at "half of 0"). **Succeeded.** Reward: an ongoing permanent effect (continue being able to restore/recycle items for resources going forward).
- *Promotions:* the event passed. Reese (commander, Private) could promote a player below his Rank — nobody is currently below Private (Blake's also Private after Round 2's Trickle) — no player is strictly below Reese's Rank, so no Promotions-step promotion happened.
- *Escalate:* **Enemy Progress advances to 2** — crossing out of Fodder (0-1) into **Grunt** (2-3) for the first time, exactly on schedule with Game 4. All 4 lanes survived — **Player Progress advances to 2**.
- *Command Card Refill:* no changes needed (Reese 4, Blake/Sasha 3, Toren still above floor at 4).
- **Rank Trickle does not fire this round** — its cadence is every 2 rounds (Round 2, 4, 6...), so Round 3 is a skip.

**End of Round 3:** Overrun Tracker **9** (still only down 1 from the starting 10, after 3 full combat rounds), Player Progress **2**, Enemy Progress **2** (Grunt band begins). This is the checkpoint comparable to Game 4's Round 3 ending (Overrun Tracker 10, Player Progress 3, Enemy Progress 2) — slightly behind Game 4 on Player Progress (Game 4 had a clean Round 1 where this game took Lane 4's 1-point overrun), but the Rank spread entering the Grunt transition is dramatically different: this game sits at **Private/Private/Sergeant/Captain**, where Game 4 at the same checkpoint sat at **Private/Conscript/Conscript/Sergeant**. That's the entire point of this test.

**Rank check (Round 3):** Reese Private, Blake Private, Sasha Sergeant, Toren Captain — unchanged from Round 2 (no Trickle this round, no new mission/promotion Rank gains either).

---

## Round 4 — the first real Grunt fight

This is the exact round Game 4 lost all 4 lanes simultaneously to Grunt-rank enemies. Same Enemy Progress (2), and — deliberately, to make the comparison as direct as possible — the enemy pool drawn this round includes the same core Grunt-rank cast Game 4 faced in its own Round 4: Lance Turret, Lancer (×2), Wasp (×2), Cleric (×2), Hound, Grunt (×2), Scorpions.

**Commander Actions (Planning).** Boss roll: 1d10 = 6 vs Enemy Progress 2 — no Boss. Event draw: **Hurricane X** (stuns ALL Active non-Vehicle units at combat start; the team owns zero Vehicles, so this would stun every lane) vs. **Assigned Posts** (dice-driven worker-location lock; completes if every player's worker lands where the dice say; failure just persists the lock). Reese picked **Assigned Posts** — Hurricane X's stun clause would have been a hard, board-wide own-goal with zero Vehicles to dodge it.

**Mission Assignment.** 5 cards, passed from Blake: Blake took **Elite Asset** (Captain — "own a Rank 4 unit," newly reachable now that Toren is Captain) and, second pass, **Tech Export 5** (Major). Sasha took **Crushing Advance** (Colonel). Toren took **Total Breakdown** (Sergeant — "have all lanes overrun," not true and actively undesirable). Reese took **Strategic Recall** (Colonel).

**Worker Placement.** Reese (3, commander bonus): Command, Barracks, Armory. Blake (2): Barracks, Battlefield. Sasha (2): Armory, Battlefield. Toren (2): Battlefield, Medical Bay.

**Income.** Barracks shop this round, with the team's Rank ceiling now at Captain, mixed Direct fill (Rank 1-3, commander's choice) and Roll fill (1d8, scales to team's highest Rank on overshoot) across its 4 slots: Reese Direct-filled 2 Private slots (Rookie Scout, Recruit), then Roll-filled the other 2 — a 1d8 roll of 5 against the team's Rank ceiling (Captain, tier 4) scales down to Captain since 5 > 4, landing a **Field Intelligence** (Captain, 5 DMG/5 HP, Armor 1/Shields 5) in one slot, and a separate roll landed a **Scout** (Sergeant, 3 DMG/3 HP) in the other. Total shop Rank = 2(Private)+2(Private)+3(Sergeant)+4(Captain) = 11. Reese + Blake both full there: **+11/+11 each.** Armory shop Rank 3 (unsold leftovers): Reese + Sasha both full: +6 Tech each. Command: Reese alone: +2 Tech. Battlefield: Blake + Sasha + Toren (3, first two full, 3rd halves): Command pool +2/+2/+2 ×2 +1/+1/+1 = +5/+5/+5. Medical Bay: Toren alone, full: +1 Organic. Scout Value: Command pool +4/+1/+1.

This is the single biggest income jump of the game so far — directly because the Barracks' shop-Rank-sum income formula scales with whatever Rank of unit sits in its slots, and for the first time those slots include Sergeant/Captain-rank cards, not just Conscript/Private filler. Updated personal totals: Reese 46+11+6+2=65 Organic, 17+11+6=34 Tech. Blake 26+11=37 Organic, 13+11=24 Tech. Sasha 32+6=38 Organic, 11+6=17 Tech, 3 Alien. Toren 6+1=7 Organic, 3 Tech.

Command pool after income: 23+5=28 Organic, 17+5+1=23 Tech, 14+5+1=20 Alien.

**Purchasing — the first real Rank-driven gear-up of the game.** With the Barracks shop itself having rolled a Captain-rank and a Sergeant-rank card this round, and real money on hand for the first time:

- **Reese** (Private, capped at Private-rank deploys) bought **Recruit** for Lane 1's 2nd Reserve slot — still capped by his own Rank regardless of wallet size, the same structural gate Game 4 identified.
- **Blake** (also Private) bought **Rookie Scout** for Lane 2's Reserve, restocking behind Civilian Survivalist.
- **Sasha** (Sergeant) bought the shop's **Scout** unit (Sergeant rank, 3 DMG/3 HP, Mobile) for Lane 3's Reserve — the first Sergeant-rank unit fielded all game, made possible specifically because Sasha's own Rank (Sergeant, via Round 2's Trickle) now permits it.
- **Toren** (Captain) bought the shop's **Field Intelligence** (Captain rank, 5 DMG/5 HP, Armor 1/Shields 5, Passive "reduce enemy ability damage by half while in reserve") for Lane 4 — easily the single strongest unit fielded by either team in either game so far, and only legal because Toren is Captain-rank. He slotted it into Lane 4's Reserve behind Pack Mule, planning to promote it in if Pack Mule falls.

This is the moment the entire Rank Trickle experiment was designed to produce: real money meeting a real Rank ceiling high enough to spend it on something better than a 1-2 Damage stat-stick.

**Deployment Stage.** Nothing wounded. Fresh purchases slot into Reserve.

**Commander Actions (Deployment) — Enemy Draw.** Player Progress is 2 (still under 5-7), hoard size still base 3/lane. Enemy Progress is now **2**, crossing into **Grunt** (2-3) for the first time:

| Enemy | DMG | HP | Reveal | Passive |
|---|---|---|---|---|
| Gloom (Beast) | 5 | 7 | — | Prevents activation of abilities in lane |
| Lance Turret (Mechanised) | 6 | 9 | Swap to lane with lowest-Damage active unit | Attacks target lowest-HP unit |
| Lancer ×2 (Infantry) | 5 | 4 | Deal 2× attack damage to active AND reserve in this lane | Attacks Pierce up to 2 Armor |
| Wasp ×2 (Drones) | 3 | 3 | Stun enemies in adjacent lane | Stuns on 1st hit of each combat |
| Cleric ×2 (Infantry) | 4 | 6 | Move to reserve, Shield active units +5 | Heals Active unit by its own attack |
| Hound (Beast) | 5 | 7 | Deal 10 damage to lowest-HP unit | Attacks hit twice |
| Grunt ×2 (Infantry) | 4 | 5 | Deal 2× attack damage to all lanes | — |
| Scorpions (Infantry) | 5 | 4 | Deal 2× attack damage to Scout | Damage from this unit hits the Scout |

Scouted 2 of 12 (Lance Turret and Hound) before the pool reshuffled and dealt 3-per-lane: Lane 1 got Gloom/Lance Turret(scouted)/Lancer, Lane 2 got Wasp/Cleric/Hound(scouted), Lane 3 got Grunt/Scorpions/Lancer, Lane 4 got Wasp/Cleric/Grunt.

**Enemy Scouting.** Lane 1's already-scouted Lance Turret flipped without re-triggering. Lane 2's already-scouted Hound flipped without re-triggering. Lane 1's Gloom flipped fresh — no Reveal, just its always-on Passive (denies ability activation in-lane). Lane 3's Grunt flipped fresh: Reveal "deal 2× attack damage (4×2=8) to all lanes" — this is the single most dangerous instant in the round, hitting every lane's Active unit simultaneously for 8:

- **Lane 1:** Stubborn Recruit (5 DMG/4 HP, Armor 1, Shields 7) absorbed all 8 into Shields (7→0, with 1 point overflowing past Shields onto HP after Armor reduces it by 1: 8-1=7 net, Shields 7 absorbs exactly 7, **0 spills to HP**). Survived clean.
- **Lane 2:** Civilian Survivalist (1 HP, Shields 1, no Armor) was annihilated outright — 8 damage obliterates a 1 HP/1 Shield target with massive overkill. **Died instantly**, before Lane 2's own Combat Cycle even started. Same-round promotion has nothing to promote — Blake bought only 1 Reserve unit (Rookie Scout) this round, which now steps up to Active, also about to face this same Lane's already-scouted Hound fresh.

  Wait — re-reading: Rookie Scout WAS Blake's purchase this round, sitting in Reserve; with Civilian Survivalist dead to the Reveal, Rookie Scout (2 DMG/2 HP, Shields 1) promotes into Active immediately, same-round, per the established ruling that Reserve promotion applies to deaths during Enemy Scouting, not just the Combat Cycle proper.
- **Lane 3:** Sasha's Active Rookie Technician (Shields 4) absorbed the 8 instance fully within its Shield buffer minus Armor (0 Armor here): 8 damage straight to Shields 4 — overflow 4 spills to HP (2 HP) — **Rookie Technician dies outright** (4 HP needed, only had Shields 4 + HP 2 = 6 total, took 8). Same-round promotion: Sasha's freshly-bought **Scout** (Sergeant, 3 DMG/3 HP, Shields 2) steps into Active.
- **Lane 4:** Toren's Active Pack Mule (Shields 4, 2 HP, 0 Armor) took the same 8 — Shields 4 absorbs 4, overflow 4 hits HP (2) for a clean kill with 2 damage to spare. **Pack Mule dies.** Same-round promotion: Toren's freshly-bought **Field Intelligence** (Captain, 5 DMG/5 HP, Armor 1, Shields 5) — bought specifically to backstop this lane — steps into Active. Field Intelligence's own Passive ("reduce enemy ability damage by half while in reserve") didn't apply here since it was already promoted to Active by the time the Reveal resolved instantaneously... actually, the Reveal and the promotion are sequenced: the Reveal kills Pack Mule, THEN Field Intelligence promotes, so Field Intelligence was still in Reserve at the moment of the 8-damage Reveal and its Passive should have applied — **ruling needed here**, logged at the end of this document. Applying the Passive retroactively doesn't make sense (the unit wasn't the one hit), so this is moot in practice: the Passive only reduces damage taken by attacks against units WHILE they're in reserve, but the Reveal's "deal 2x damage to all lanes" hit each lane's Active unit, not its Reserve. Field Intelligence in Reserve was never a target of this particular Reveal anyway. No ruling actually needed — false alarm, noted for clarity only.

Lane 2 and Lane 4 are still down to 1 unit each (Lane 2: Rookie Scout, fresh off a promotion, full health; Lane 4: Field Intelligence, fresh off a promotion, full health) before their Combat Cycles have even begun fighting a single live enemy.

**Combat Stage.**

- **Lane 1 (Reese):** Stubborn Recruit, Shields fully spent (0/7) from the Reveal but HP untouched, now fought Gloom (5 DMG/7 HP, ability-denial Passive — moot, Stubborn Recruit has no Active ability to deny) directly: Stubborn Recruit's 5 DMG (boosted by Reinforced Barrels) chipped Gloom 7→2, took 5 back with 0 Shields left and Armor 1 reducing it to 4 — Stubborn Recruit's HP 4→0, **dies**. Same-round promotion: Recruit Prodigy (2 DMG/2 HP, Shields 2, equipped with Airburst Rounds — 7 DMG/3 HP base before unit stats combine, meaning Recruit Prodigy now hits for a combined 9 DMG) steps in and **one-shots the wounded Gloom** (2 HP left, 9 incoming) outright. Same-round promotion brings in the already-scouted Lance Turret (6 DMG/9 HP, Shield-less but tough): Recruit Prodigy's 9 DMG (with Airburst Rounds' "splash onto adjacent lanes" passive also chipping Lane 2 and Lane 4's combat — see below) nearly cleared Lance Turret in one hit (9 dmg leaves 0 HP — **Lance Turret dies too**, another one-shot from the same combined Weapon+unit stat line). Reese's last Reserve enemy was Lancer — but the enemy Reserve is now empty (Gloom, Lance Turret both dead), so **Lane 1 clears** with Recruit Prodigy standing at full HP, having solo-killed 2 of its lane's 3 enemies in 2 exchanges and never taking a hit itself (it was never the Active target during either kill — wait, it WAS active when it killed both; it just never got hit back since both died before swinging — Gloom died outright to the kill-shot before its own attack resolved? Re-checking: simultaneous damage means both sides hit at once UNLESS a priority ability is in play; Recruit Prodigy has no stated priority, so this should have been simultaneous, not a clean one-shot with no return damage).

> **Correction applied:** simultaneous combat means Gloom (5 DMG) should have hit Recruit Prodigy (2 HP/2 Shields) back the same exchange it died. Re-resolving: Recruit Prodigy's 9 combined DMG kills Gloom (2 HP left) outright, AND Gloon's 5 DMG simultaneously hits Recruit Prodigy — Shields 2 absorbs 2, overflow 3 hits HP 2, **Recruit Prodigy also dies**, a mutual kill. Lane 1 has no further Reserve (Stubborn Recruit and Recruit Prodigy both spent) — Lance Turret and Lancer are both still alive and unopposed. **Lane 1 overruns** after all, the correction reversing the outcome above. This is logged honestly as a resolved-mid-narration error, not silently fixed.

- **Lane 2 (Blake):** Rookie Scout (2 DMG/2 HP, Shields 1, freshly promoted) faced the already-scouted Hound (5 DMG/7 HP, hits twice — 10 effective). Rookie Scout's Shield absorbed the first of Hound's two hits, the second landed clean on HP for an outright kill, Rookie Scout's own 2 DMG chipped Hound 7→5 before dying. No further Reserve. **Lane 2 overruns**, Hound (5 HP), Wasp, and Cleric all still alive.
- **Lane 3 (Sasha):** the freshly-promoted Scout (Sergeant, 3 DMG/3 HP, Shields 2) faced Grunt (already spent its Reveal, now just a 4 DMG/5 HP stat-line with no Passive) — Scout's Shields absorbed 2, overflow 2 hit HP (3→1), Scout's own 3 DMG chipped Grunt 5→2; next exchange Grunt's 4 DMG finished Scout off (1 HP left), Scout's last 3 DMG dropped Grunt to -1, a **mutual kill**, clearing Grunt. No further Reserve (Sasha's only purchase this round was the Scout, already spent). **Lane 3 overruns**, with Scorpions and the 2nd Lancer still alive and unopposed.
- **Lane 4 (Toren):** Field Intelligence (Captain, 5 DMG/5 HP, Armor 1, Shields 5 — easily the toughest unit either game has fielded) faced Wasp (3 DMG/3 HP, stuns on 1st hit). Wasp's stun landed first (Passive: "stuns on 1st hit of each combat") — but Stun's actual game-text effect ("skip a turn," per Keywords) only prevents the STUNNED unit from acting, it doesn't prevent the OTHER side from acting; Field Intelligence still dealt its own damage this exchange (no text says Stun is mutual), one-shotting Wasp (3 HP, 5 incoming) while taking 0 damage back (Wasp's own attack was the one that triggered the stun text, read as applying to itself triggering on the unit it's targeting — actually this needs its own ruling, logged at the end). Working ruling for this combat: Stun affects the unit being attacked who triggers it (i.e., Wasp's Passive stuns Field Intelligence, the unit Wasp is fighting), meaning **Field Intelligence is the one stunned**, not Wasp — Wasp gets a free, unanswered hit this exchange. Re-resolving: Wasp's 3 DMG hits Field Intelligence's Shields 5 (5→2, no overflow), Field Intelligence (stunned, deals no damage back this exchange). Next exchange, no more stun (only triggers on "1st hit of each combat"): Field Intelligence's 5 DMG one-shots Wasp (3 HP). Cleric promotes in next: its Reveal already spent by scouting (wait, Cleric was dealt fresh into Lane 4, not pre-scouted — Reveal fires now: "move this unit to reserve, Shield active units +5" — Cleric immediately retreats to Reserve and shields the LANE'S active unit, which is itself about to be the next enemy up... this is a self-referential edge case). Reading it as written: Cleric's Reveal shields "active units" (plural/ambiguous scope) — ruled as the enemy side's own upcoming Active unit (the next enemy in this lane's Reserve, i.e. Grunt) gaining +5 Shields preemptively, while Cleric itself retreats to Reserve (out of the fight for now, to heal whoever's Active later via its Passive). Grunt (4 DMG/5 HP) steps up with a fresh +5 Shields buffer: Field Intelligence's 5 DMG (Armor-piercing? No Pierce keyword on Field Intelligence) hits Grunt's Shields (5→0), no overflow, **Grunt survives at full 5 HP**; Grunt's 4 DMG hits Field Intelligence's remaining Shields (2→0, overflow 2 hits Armor-reduced... Armor reduces by 1, net 1 to HP, HP 5→4). Lane 4 still has Cleric in Reserve behind Grunt. **Lane 4 does not clear this round** — Field Intelligence survives at 4 HP but Grunt (full Shields-refreshed HP) and Cleric remain.

**Net result entering Lane Reinforcement: all 4 lanes either overran or remain contested with no clear win.** Re-stating cleanly: Lane 1 overran (Lance Turret + Lancer alive). Lane 2 overran (Hound at 5 HP + Wasp + Cleric alive). Lane 3 overran (Scorpions + Lancer alive). Lane 4 — Field Intelligence is still alive and Active (4 HP) but Grunt and Cleric remain in its enemy Reserve; this counts as **overrun** too, since the rule is "if any enemies survived combat the lane overruns," regardless of whether the player's own unit is also still alive.

**Lane Reinforcement had nothing to do** — no lane fully cleared its enemy side this round, so there's no qualifying donor lane.

**Cleanup Stage.**
- *Managing the Dead:* Stubborn Recruit + Recruit Prodigy (Lane 1), Civilian Survivalist + Rookie Scout (Lane 2), Rookie Technician + Scout (Lane 3) — 6 player units lost. Field Intelligence (Lane 4) survives, the only Active unit left standing anywhere on the board. Gear-survives-1-item: Reese's Stubborn Recruit had only Reinforced Barrels equipped (survives automatically, nothing to choose between); Recruit Prodigy had only Airburst Rounds (survives automatically).
- *Overrunning Lanes:* **4 lanes overran.** Overrun Tracker drops from **9 to 5**.
- *Event Resolution:* **Assigned Posts**' Completion Condition (every player's worker lands on its dice-rolled location) wasn't deliberately tracked this round and didn't align — **failed**. Failure Penalty: the dice-driven lock persists into next round.
- *Promotions:* event failed — no Promotions step.
- *Escalate:* **Enemy Progress advances to 3** (still inside Grunt, 2-3). Not all lanes survived — **Player Progress holds at 2.**
- *Command Card Refill:* no changes needed.
- **Rank Trickle fires (Round 4, on schedule):** every player +1 Rank automatically. Reese: Private → **Sergeant**. Blake: Private → **Sergeant**. Sasha: Sergeant → **Captain**. Toren: Captain → **Major**.

**End of Round 4:** Overrun Tracker **5** (down from 9), Player Progress **2**, Enemy Progress **3**. This is the direct comparison point to Game 4's Round 4 ending (Overrun Tracker 6, Player Progress 3, Enemy Progress 3) — this game's Overrun Tracker is actually 1 point worse off in raw terms (5 vs 6) because all 4 lanes overran here too, same as Game 4. **Rank Trickle did NOT prevent the Round 4 Grunt-wipe pattern from repeating** — the enemy stat jump (Grunt-rank Reveal effects dealing 8-10 damage in a single instance) was severe enough to overwhelm even Captain-rank gear (Field Intelligence, Shields 5/Armor 1) once Cleric's Shield-refresh kept its target alive. The team's higher Ranks bought meaningfully tougher individual units (Field Intelligence alone survived where Game 4's entire roster died outright), but board-wide Reveal damage that hits every lane's Active unit simultaneously is a problem Rank alone doesn't fully solve — better stats raise the bar a round or two, they don't remove the spike.

**Rank check (Round 4, post-Trickle):** Reese **Sergeant**, Blake **Sergeant**, Sasha **Captain**, Toren **Major**. Compare Game 4's Round 4 end-state: Avery Private, Blair Conscript, Casey Conscript, Drew Sergeant — this game's full team is now 2+ Ranks ahead of Game 4's equivalent checkpoint across the board, and nobody is anywhere near the Conscript floor anymore.

---

## Round 5 — full rebuild, with real Rank behind it this time

Lanes 1-3 are completely empty. Lane 4 still has Field Intelligence alive (4 HP, 0 Shields) facing a Grunt (full Shields-refreshed via Cleric) and a Cleric still in Reserve. This is the same "full rebuild from zero" position Game 4 hit in its own Round 5 — but this time every player rebuilding has a genuinely higher Rank ceiling to rebuild with.

**Commander Actions (Planning).** Boss roll: 1d10 = 6 vs Enemy Progress 3 — no Boss. Event draw: **Restriction Orders** (stuns Active non-Infantry at combat start; completes with 3 Active Infantry, reward +5 Shields per Active Infantry; failure is the same Shields loss instead) vs. **Armor Supply Freeze** (doubles Armor active-effect costs; completes if every lane's Active unit has Armor equipped — currently false everywhere). Reese picked **Restriction Orders** — the team has fielded nothing but Infantry/Infantry Scout all game, so the stun clause is a complete non-issue and the Completion Condition (3 Active Infantry) is realistically achievable this exact round during the rebuild, for a real Shields bonus.

**Mission Assignment.** 5 cards, passed from Blake: Blake took **Combat Medic IV** (Brigadier, far off) and, second pass, **Armored Convoy** (Major). Sasha took **Giant Slayer** (Private — "kill 2 units above your rank," already a low bar at Sasha's Captain Rank). Toren took **Barracks Detail** (Conscript — trivially low-bar, and irrelevant to his own Rank). Reese took **Absolute Lockdown** (Brigadier, far off).

**Worker Placement.** Reese (3, commander bonus): Command, Barracks, Armory. Blake (2): Barracks, Battlefield. Sasha (2): Armory, Battlefield. Toren (2): Battlefield, Medical Bay.

**Income.** Barracks shop this round: 2 Direct-filled low-rank slots (Conscript, Pack Mule) + 2 Roll-filled slots that landed **Combat Medic** (Captain, rolled 4) and **Breacher** (Sergeant, rolled 3) — both legitimate rolls since the team's Rank ceiling is now Major (tier 5), comfortably above both results. Total shop Rank = 1+2+4+3 = **10**. Reese + Blake both full: **+10/+10 each.** Armory shop Rank 3 (unsold leftovers): Reese + Sasha both full: +6 Tech each. Command: Reese alone: +2 Tech (Sergeant = Rank 3 now). Battlefield: Blake + Sasha + Toren (3, first two full, 3rd halves): Command pool +5/+5/+5 (same shape as before). Medical Bay: Toren alone, full: +1 Organic. Scout Value: Command pool +4/+1/+1.

Updated personal totals: Reese 65+10+6+2=83 Organic, 34+10+6=50 Tech. Blake 37+10=47 Organic, 24+10=34 Tech. Sasha 38+6=44 Organic, 17+6=23 Tech, 3 Alien. Toren 7+1=8 Organic, 3 Tech.

Command pool after income: 28+5=33 Organic, 23+5+1=29 Tech, 20+5+1=26 Alien.

**Purchasing — the real test of whether Rank Trickle's promotions translate into board strength.**

- **Reese** (Sergeant) bought **Breacher** (Sergeant, 3 DMG/3 HP, "stun when attacking full HP enemies") for Lane 1's Active, plus **Conscript** for Reserve depth. A genuinely mid-tier unit, not a 1-HP filler card.
- **Blake** (Sergeant) similarly bought **Pack Mule** (Private, Shields 4) for Lane 2's Active and a 2nd cheap unit for Reserve.
- **Sasha** (Captain) bought **Combat Medic** (Captain, 4 DMG/6 HP, Armor 2/Shields 8, "once per combat: heal target Infantry by 10, deal this much damage to target") for Lane 3's Active — by a wide margin the toughest unit Sasha has ever fielded, with a real Active ability attached.
- **Toren** (Major) — sitting comparatively poor on personal resources (8 Organic/3 Tech, after spending heavily on Field Intelligence last round) — couldn't actually afford anything new from the Captain/Sergeant-rank shop slots despite being the highest-Ranked player at the table. This directly echoes Game 4's Blair-with-0-Organic moment: Rank sets the ceiling, but the wallet still has to clear it. Toren instead **donated his spare 3 Tech to the Command pool** and left Field Intelligence to keep fighting alone in Lane 4.

Sasha also bought **Artillery Strike** (Sergeant Consumable, "deal 10 damage to Active enemies") from the Armory, planning to use it on Lane 4's tough Grunt to help bail out Toren's lone survivor.

**Deployment Stage.** Nothing wounded yet to heal (Field Intelligence's HP loss has no Med Bay slot used — no worker placed there with capacity this round; carries its damage into combat). Reassign/Equip: fresh purchases deploy straight to Active in the 3 empty lanes.

**Commander Actions (Deployment) — Enemy Draw.** Player Progress is 2 (still under 5-7), hoard size still base 3/lane. Enemy Progress is **3**, still inside Grunt (2-3) for one more round, but Lane 4 already carries 2 leftover enemies (Grunt, Cleric) from last round — those are NOT re-dealt, they're still sitting in that lane's Reserve from before. Fresh enemies are drawn only for the now-fully-cleared Lanes 1-3 worth (3 each = 9), while Lane 4 gets exactly 1 fresh enemy to round its hoard back up to a normal 3-enemy lane (1 fresh + Grunt + Cleric already there).

New Grunt-rank pool drawn (10 cards: 9 for Lanes 1-3, 1 for Lane 4): another mix of Lancer, Wasp, Scorpions, Gloom, Hound, Cleric, Lance Turret-type cards.

**Combat Stage.**

- **Lane 1 (Reese):** Breacher (3 DMG/3 HP, Stun-on-full-HP-attack) faced a fresh Lancer (5 DMG/4 HP, Pierce 2 Armor, no Armor on Breacher anyway so Pierce is moot). Breacher's Stun triggered on the first hit (Lancer was at full HP) — Lancer's own attack this exchange is skipped, Breacher's 3 DMG lands clean, Lancer 4→1 HP. Next exchange (Lancer no longer full HP, no 2nd stun) — Lancer's 5 DMG kills Breacher (3 HP) outright, Breacher's 3 DMG simultaneously finishes Lancer (1 HP) — mutual kill. Same-round promotion: Reese's Conscript steps in against the lane's 2nd enemy (a fresh Wasp, 3 DMG/3 HP) — Conscript's Shield 1 absorbs the stun-exchange's hit, dies to the 2nd; trades its own 1 DMG into Wasp, not enough to kill (3→2 HP). No further Reserve. **Lane 1 overruns**, Wasp (2 HP) and a 3rd undrawn enemy survive.
- **Lane 2 (Blake):** Pack Mule (Shields 4) absorbed 1 full hit from a fresh Scorpions (5 DMG, Pierce-immune since no Armor present to pierce) — Shields 4 vs 5 DMG, overflow 1 hits HP (2→1); Pack Mule's 2 DMG chips Scorpions (4→2). Next exchange, Scorpions' 5 DMG finishes Pack Mule; Pack Mule's last 2 DMG drops Scorpions to 0 — mutual kill. Same-round promotion: Blake's 2nd cheap purchase (a Civilian Scout) faces the lane's next enemy and trades itself for a 1-shield kill the same way prior Fodder-era trades worked, except this is now Grunt-rank — Civilian Scout (1 HP/1 Shield) is simply annihilated with no kill in return by anything bigger than Fodder. **Lane 2 overruns.**
- **Lane 3 (Sasha):** Combat Medic (4 DMG/6 HP, Armor 2, Shields 8 — the single tankiest unit on the board) faced a fresh Gloom (5 DMG/7 HP). Combat Medic's Armor 2 reduced Gloom's 5 DMG to 3, fully absorbed by Shields (8→5); Combat Medic's 4 DMG chipped Gloom (7→3). Next exchange: same trade, Gloom 3→-1 — **Gloom dies**, Combat Medic barely scratched (Shields 5→2 after Armor reduction). Combat Medic then used its Active ability (once per combat: heal target Infantry by 10, deal this much damage to target) — with no ally needing a heal, it targeted itself for the "deal this much damage" half against the lane's next enemy preemptively... **ruling needed**: does Combat Medic's Active require both halves to resolve (heal AND damage to the SAME stated target, "Target Infantry," meaning damage also goes to an Infantry ally, not an enemy)? Re-reading the card text: "heal target Infantry by 10, deal this much damage to target" — the 2nd "target" is ambiguously worded but most plausibly refers to a 2nd, different (enemy) target, consistent with similar dual-clause cards elsewhere. Ruled: heal an ally Infantry (none needed this exchange, so this half fizzles with no effect) and deal 10 damage to an enemy target of choice — used on the lane's next enemy (a 2nd fresh Grunt-rank card) for a clean kill before it ever got to act. **Lane 3 fully clears**, Combat Medic standing at Shields 2/8, HP 6/6, having killed all 3 of its lane's enemies (1 in combat, 1 via Active) without ever taking HP damage.
- **Lane 4 (Toren):** Field Intelligence (4 HP, 0 Shields, carried over) faced the same Grunt left over from last round (Shields refreshed to 5 via Cleric, full 5 HP) plus Cleric still in Reserve. Sasha's **Artillery Strike** Consumable (10 damage to Active enemies) was activated this round specifically to bail Toren out — 10 damage straight to Grunt's Shields 5 (overflow 5 to HP 5, exactly lethal) — **Grunt dies before combat even starts**, without Field Intelligence having to fight it at all. Cleric promotes into Active fresh: its own Reveal already spent (it retreated to Reserve last round, not freshly revealed this round) — fights as a plain 4 DMG/6 HP stat-line. Field Intelligence's 5 DMG (Armor-less target) chips Cleric (6→1); Cleric's 4 DMG hits Field Intelligence's Armor 1 (reduced to 3), HP 4→1. Next exchange, Field Intelligence's 5 DMG finishes Cleric. **Lane 4 fully clears**, Field Intelligence surviving at 1 HP — battered but alive, having now survived parts of 2 consecutive rounds of combat (relevant to Toren's own Secret Objective, Survivor — "Active unit survives 3 rounds").

**Lane Reinforcement.** Lanes 3 and 4 cleared this round; Lanes 1 and 2 overran. Sasha's Combat Medic (Shields 2/8, HP 6/6, full health effectively) is the obvious donor — Lane 4's Field Intelligence is too badly hurt (1 HP) to risk moving.

- **Lane 3 → Lane 1:** Combat Medic moved in to face Lane 1's surviving Wasp (2 HP) — one-shot it clean (4 DMG vs 2 HP), taking Wasp's 3 DMG back (Shields 2 absorbs 2, overflow 1 to HP, 6→5). Same-round promotion chain: Lane 1's last enemy (the 3rd, never-engaged card from this round's fresh draw) promotes in — a fresh Cleric — Combat Medic's 4 DMG vs Cleric's 6 HP doesn't kill outright (6→2), Cleric's 4 DMG hits back (Shields 0 now, HP 5→1). **Lane 1 not fully cleared this reinforcement pass** — Cleric survives at 2 HP, Combat Medic at 1 HP. The single reinforcing unit ran out of steam against a 2nd reserve card it couldn't one-shot.

**Net after Lane Reinforcement:** Lane 1 still has 1 enemy alive (Cleric, 2 HP) — **still overrun**. Lane 2 unchanged — **overrun** (no donor reached it; Combat Medic could only reinforce 1 lane). Lane 3 and Lane 4 — both cleared, no longer counted (Combat Medic physically relocated to Lane 1, but Lane 3's own enemy side was already empty before it left, so Lane 3 stays "cleared" for this round's Cleanup check regardless of where its unit physically ended up).

**Cleanup Stage.**
- *Managing the Dead:* Breacher + Conscript (Lane 1), Pack Mule + Civilian Scout (Lane 2) — 4 player units lost. Combat Medic (relocated, alive at 1 HP) and Field Intelligence (alive at 1 HP) both survive the round, battered but standing — the first round either game has ended with multiple player units still alive after a Grunt/Core-tier fight.
- *Overrunning Lanes:* **2 lanes overran** (Lane 1, Lane 2) — Overrun Tracker drops from **5 to 3**.
- *Event Resolution:* **Restriction Orders**' Completion Condition (3 Active Infantry at some point this round) was satisfied — Reese, Blake, Sasha, and Toren all fielded Infantry-type Actives simultaneously at various points. **Succeeded.** Reward: Active Infantry gain +5 Shields per Active Infantry at combat start, going forward.
- *Promotions:* event passed. Reese (commander, Sergeant) could promote a player below his Rank — nobody is below Sergeant (Blake's tied, Sasha/Toren are above) — no promotion.
- *Escalate:* **Enemy Progress advances to 4** — crossing into **Core** (4-5) for Round 6. Not all lanes survived — **Player Progress holds at 2.**
- *Command Card Refill:* no changes needed.
- **Rank Trickle does not fire this round** (Round 5 is a skip; next fires end of Round 6).

**End of Round 5:** Overrun Tracker **3** (down from 5, down from 9 two rounds ago), Player Progress **2**, Enemy Progress **4** (Core band begins). Compare Game 4's Round 5 ending: Overrun Tracker 2, Player Progress 3, Enemy Progress 4 — almost identical Overrun Tracker position (3 vs 2) and Enemy Progress (4 vs 4), this game trailing Game 4 by exactly 1 Player Progress point. **The raw tracker numbers are converging on the same shape Game 4 had at this point** — both games are 1 bad round away from a loss heading into Round 6 — but this game has visibly tougher units doing the surviving: 2 player units (Combat Medic, Field Intelligence) are still alive entering Round 6, where Game 4's entire roster was dead at the equivalent point.

**Rank check (Round 5):** Reese Sergeant, Blake Sergeant, Sasha Captain, Toren Major — unchanged (no Trickle this round).

---

## Round 6 — the round that ended Game 4

Game 4 lost outright at this exact round, to this exact enemy tier (Core, Enemy Progress 4), with the Overrun Tracker crossing 0 mid-Cleanup. This game enters Round 6 at Overrun Tracker 3 — worse off in absolute terms than Game 4's Round 6 entry of 2 was bad, but not by much; **3 more overrun lanes this round still loses the game outright** (3 lanes × -1 = tracker hits 0). The pressure is identical. The question is whether the team's now-much-higher Rank ceiling (Sergeant/Sergeant/Captain/Major, vs. Game 4's Private/Conscript/Conscript/Sergeant) changes the outcome.

**Commander Actions (Planning).** Boss roll: 1d10 = 3 vs Enemy Progress 4 — no Boss (a real 40% chance dodged, same as Game 4's equivalent round). Event draw: **Cheap Knockoffs** (income converts to Tech; completes by returning 10 Tech, reward +5 Tech each; failure raises shop Tech costs by 2) vs. **Total Disarmament** (unequips everything immediately on draw; completes if nobody re-equips by end of round; failure destroys all equipment outright). Reese picked **Cheap Knockoffs** — Total Disarmament's failure penalty (destroy ALL equipped gear) was an unacceptable risk with Field Intelligence and Combat Medic both being the team's last 2 survivors.

**Mission Assignment.** 5 cards, passed from Blake: Blake took **War Hero** (Colonel) and, second pass, **Collapse** (Major — "have 2 lanes overrun," grimly already true entering this round from last round's carryover state, though Collapse's own check happens at Cleanup, by which point this round's combat will have already changed the picture). Sasha took **Combined Arms** (Colonel). Toren took **Armored Column** (Captain — moot, no Vehicles). Reese took **Organic export 4** (Captain).

**Worker Placement.** Reese (3, commander bonus): Command, Barracks, Armory. Blake (2): Barracks, Battlefield. Sasha (2): Armory, Battlefield. Toren (2): Battlefield, Medical Bay.

**Income.** Barracks shop this round: 1 Direct-filled Sergeant slot (Marksman) + 1 Direct-filled Private slot (Recruit Prodigy) + 2 Roll-filled slots that both landed **Major**-rank cards (a roll of 5 lands exactly at the team's Rank ceiling; a roll of 8 overshoots and also scales down to the same ceiling) — **Sniper** (9 DMG/7 HP, "ignores armor, can target any lane") and **Mortar Squad** (9 DMG/7 HP, "explodes on death for 3× damage in lane"). Total shop Rank = 3+2+5+5 = **15** — by far the highest shop-Rank total of the game. Reese + Blake both full: **+15/+15 each.** Armory shop Rank (Reactive Plating, Major-rank Armor + Carbon Plating, Captain-rank Armor, unsold leftovers from a Roll fill earlier) = 5+4=9: Reese + Sasha both full: +18 Tech each (2×9). Command: Reese alone: +2 Tech. Battlefield: Blake + Sasha + Toren (3, first two full, 3rd halves): Command pool +5/+5/+5. Medical Bay: Toren alone, full: +1 Organic. Scout Value: Command pool +4/+1/+1.

Per **Cheap Knockoffs**' Round Effect, all the above income converted to Tech this round instead of its normal type.

Updated personal totals (Tech-converted): Reese 50+15+18+2=85 Tech (83 Organic carried, untouched). Blake 34+15=49 Tech (47 Organic carried). Sasha 23+18=41 Tech (44 Organic carried), 3 Alien. Toren 3+0(Medical Bay's flat Organic also converts to Tech this round)=4 Tech (8 Organic carried).

Command pool after income: 33 Organic (unchanged, the Battlefield/Scout contributions also convert to Tech this round) — actually correcting: Cheap Knockoffs converts ALL income to Tech, including the Command pool's own Battlefield/Scout inflows. Command pool: 33 Organic (no Organic income this round), Tech 29+5+1=35, Alien 26 (no Alien income this round, also converted away).

**Purchasing — spending real Major-rank money on Major-rank units, for the first time in either game.**

- **Reese** (Sergeant, capped at Sergeant-rank deploys regardless of his huge Tech pile) bought **Marksman** (Sergeant, 3 DMG/3 HP, Long Range) for Lane 1's Active — Reese's own Rank, not his wallet, is still the gate, exactly as the rules intend; he's rich but still Sergeant-capped.
- **Blake** (also Sergeant) bought **Recruit Prodigy** for Lane 2's Active plus a 2nd cheap Reserve unit.
- **Sasha** (Captain) bought **Carbon Plating** (Captain Armor, +4 Armor/+14 HP, no Active) from the Armory and equipped it onto her surviving Combat Medic in Lane 1 for 4 Tech (Captain-rank equip cost) — Combat Medic, already alive at 1 HP from last round, is now sitting on a massive defensive buffer (Armor 2+4=6, HP effectively 1+14=15 once the gear's flat HP bonus applies) heading into this round's fight.
- **Toren** (Major, the team's highest Rank) bought **Sniper** (Major, 9 DMG/7 HP, "ignores armor, can target any lane") for Lane 4's Reserve, backstopping Field Intelligence (still alive at 1 HP from last round), and **Reactive Plating** (Major Armor, +17 HP, "immune to AOE") which he equipped onto Field Intelligence for 5 Tech (Major-rank equip cost) — Field Intelligence (1 HP, Armor 1, 0 Shields) is now sitting at a combined 18 HP and, critically, **immune to AOE** — a direct, deliberate counter to exactly the kind of board-wide Reveal damage (Grunt's "2× damage to all lanes," Round 4's killer) that nearly ended the game 2 rounds ago.

This is the clearest demonstration yet of what Rank Trickle actually bought the team: not just bigger numbers, but access to a genuinely different tier of defensive tools (Reactive Plating's AOE immunity didn't exist as an option for a Conscript/Private-capped roster).

**Deployment Stage.** Med Bay healed nothing new this round (Toren's worker there, but neither Combat Medic nor Field Intelligence physically sit in the Medical Bay — they're still each their lane's Active unit, carrying their HP forward). Equip as above.

**Commander Actions (Deployment) — Enemy Draw.** Enemy Progress is now **4**, crossing into **Core** (4-5) for the first time — and the stat jump from Grunt to Core is sharp, matching Game 4's own experience exactly:

| Enemy | DMG | HP | Reveal | Passive |
|---|---|---|---|---|
| War Hound ×2 (Beast) | 7 | 12 | Deal 15 damage to lowest-HP unit | Attacks hit twice |
| Crawler ×2 (Mechanised) | 8 | 15 | Roll D4, swap lanes with the active unit there | — |
| Space Lions ×2 (Beast) | 7 | 12 | Gain Shields = excess damage on kill | — |
| Shard Beast ×2 (Abomination) | 12 | 15 | Attacks hit adjacent lanes for half damage | Explodes for 2× damage on death |
| Knights ×2 (Infantry) | 7 | 7 | Gain 20 Shield | Attacks Pierce up to 2 Armor |
| Eye Drones ×2 (Drones) | 5 | 4 | Roll D4, move to that lane | Attacks Pierce up to 2 Armor |

(Identical cast to Game 4's own Round 6 draw — deliberate, for the cleanest possible comparison.) Scouted 2 of 12 (a War Hound and a Knights) before reshuffling and dealing 3-per-lane: Lane 1 got Crawler/Space Lions/Eye Drones, Lane 2 got Shard Beast/War Hound(scouted)/Knights(scouted), Lane 3 got War Hound/Crawler/Shard Beast, Lane 4 got Space Lions/Knights/Eye Drones.

**Enemy Scouting.** Lane 1's Crawler Reveal rolled a d4 (result: 3) for "swap lanes with the active unit in that lane" — landing on Lane 3, swapping Crawler (8 DMG/15 HP) into Lane 3 and Lane 3's own War Hound into Lane 1 instead (per the established ruling: enemy-side swap, by analogy with Lance Turret). Lane 2's already-scouted War Hound and Knights both flip without re-triggering. Lane 4's Eye Drones Reveal rolled a d4 (result: 1) for "move to that lane" — Lane 1, joining the freshly-swapped War Hound there.

**Combat Stage.**

- **Lane 1 (Reese):** now hosting War Hound (swapped in, 7 DMG/12 HP, hits twice) AND Eye Drones (moved in, 5 DMG/4 HP, Pierce 2 Armor) stacked in Reserve behind whatever's Active — Marksman (3 DMG/3 HP, Long Range, no Shields/Armor) faces War Hound first. War Hound's double-attack (7+7=14 effective) one-shots Marksman before Marksman's own 3 DMG can matter much (War Hound 12→9 after the trade). No Reserve for Reese (he only bought 1 unit this round). **Lane 1 overruns** — War Hound (9 HP), Eye Drones, and the original Space Lions all still alive.
- **Lane 2 (Blake):** Recruit Prodigy (2 DMG/2 HP, Shields 2) faces the already-scouted Shard Beast (12 DMG/15 HP, splits half-damage to adjacent lanes on its Reveal — already spent). Shard Beast's 12 DMG annihilates Recruit Prodigy instantly (Shields 2 absorbs 2, overflow 10 to 2 HP, massive overkill); Recruit Prodigy's 2 DMG barely dents Shard Beast (15→13). Same-round promotion: Blake's 2nd cheap unit faces the same Shard Beast and dies the same way, dealing another trivial chip. No further Reserve. **Lane 2 overruns** — Shard Beast (11 HP), War Hound, and Knights all alive.
- **Lane 3 (Sasha):** now hosting the swapped-in Crawler (8 DMG/15 HP) instead of War Hound. Combat Medic — Armor 6 (2 base + 4 from Carbon Plating), Shields 0 (spent last round, gear added flat HP not Shields), HP 15 (1 carried + 14 from Carbon Plating) — faces Crawler: Armor 6 reduces Crawler's 8 DMG to 2, landing clean on HP (15→13); Combat Medic's 4 DMG chips Crawler (15→11). This trade repeats for several exchanges — Crawler's Armor-reduced 2 DMG/exchange means Combat Medic can tank roughly 7 full exchanges before dying, while chipping 4 DMG back each time. After 4 exchanges: Crawler 15→11→7→3→**dead** (4th hit), Combat Medic 15→13→11→9→7 HP, still very much alive. Combat Medic's Active ability (once per combat: heal target Infantry by 10, deal 10 to a target) fires on the next enemy, Shard Beast (15 HP, the original Lane 3 enemy queued behind Crawler before the swap): 10 damage clean to Shard Beast (15→5), no heal needed (Combat Medic's own HP wasn't critical). Following melee exchange: Combat Medic's 4 DMG vs Shard Beast's 5 HP — chips to 1, takes Shard Beast's 12 DMG back (Armor 6 reduces to 6, HP 7→1) — Combat Medic survives at the very edge. Next exchange finishes Shard Beast (1 HP, Combat Medic's 4 DMG is overkill) — **Shard Beast dies**, but its own Passive ("explodes for 2× damage on death," = 24) fires: Combat Medic's Armor 6 reduces 24 to 18, HP 1→**dead**. Same-round promotion: Lane 3 has no further Reserve — but the lane's enemy side is ALSO now empty (Crawler and Shard Beast both dead). **Lane 3 clears**, at the cost of Combat Medic in the final exchange's explosion — the single longest, most resource-intensive lane fight either game has produced, and the first time a Core-rank lane has fully cleared on its own without a same-round wipe.
- **Lane 4 (Toren):** Field Intelligence — now sitting at a combined 18 HP (1 carried + 17 from Reactive Plating) and immune to AOE — faces Space Lions (7 DMG/12 HP, "gain Shields = excess damage on kill," no AOE component to be immune to here, the immunity is simply unused this exchange). Field Intelligence's 5 DMG vs Space Lions' 12 HP (12→7), Space Lions' 7 DMG vs Field Intelligence's Armor 1 (reduced to 6), HP 18→12. Next exchange: Field Intelligence's 5 DMG (7→2), Space Lions' 7→6 (Armor), HP 12→6. 3rd exchange: Field Intelligence's 5 DMG finishes Space Lions (2 HP) — **dies**, no excess damage to convert to Shields since it died exactly at 0. Field Intelligence takes no return hit this exchange (Space Lions died before its own attack resolved — simultaneous damage should still apply here; correcting: Space Lions' 7 DMG also lands this exchange, Armor reduces to 6, HP 6→0 — **Field Intelligence also dies**, a mutual kill on the 3rd exchange). Same-round promotion: Toren's freshly-bought **Sniper** (9 DMG/7 HP, ignores Armor, can target any lane) steps in against Knights (7 DMG/7 HP, just gained 20 Shield from its own Reveal). Sniper's "ignores armor" doesn't help against Shields (a different stat) — Sniper's 9 DMG vs Knights' Shields 20 (20→11, no overflow); Knights' 7 DMG Pierces up to 2 of Sniper's Armor (Sniper has 0 Armor, irrelevant) — Sniper has 0 Armor/0 Shields, HP 7→0, **dies** outright. No further Reserve. **Lane 4 overruns** — Knights (Shields 11) and Eye Drones (the original Lane 4 card, not the one that moved to Lane 1) both alive.

**Lane Reinforcement.** Only Lane 3 cleared this round (at the cost of its own unit, with nothing left to send). **No reinforcement is possible** — there's no surviving unit anywhere on the board to redeploy. Lanes 1, 2, and 4 all stand overrun.

**Cleanup Stage — the critical check.** Overrunning Lanes: **3 lanes overran** this round (Lane 1, Lane 2, Lane 4). The Overrun Tracker entered this check at **3**. 3 lanes × -1 = **Overrun Tracker drops to 0 exactly**, during this same Cleanup check. Per the rule, the moment the tracker reaches 0 **during** this check, the game ends immediately as a loss, and no further Cleanup sub-steps run — Event Resolution, Promotions, and Escalate for Round 6 never happen, exactly as the rule specifies.

**THE GAME ENDS IN A LOSS, AT ROUND 6, ON THE OVERRUN TRACKER REACHING 0 — the same round, the same cause, as Game 4.**

---

## End of Game

**Result: LOSS.** Overrun Tracker hit 0 during Round 6's Cleanup (Overrunning Lanes check), ending the game immediately and skipping Round 6's Event Resolution, Promotions, and Escalate entirely — identical failure mode to Game 4.

**Final track values:**

| Track | Value |
|---|---|
| Overrun Tracker | **0** (started at 10, Normal difficulty) |
| Player Progress | **2** of 10 |
| Enemy Progress | **4** of 10 (Core band) |
| Rounds played | **Round 0 (prep) + Rounds 1-6** (6 real combat rounds) |

**Round-by-round Overrun Tracker history:** Round 1: 9 (1 overrun — Lane 4, Toren donated instead of restocking). Round 2: 9 (0 overruns — first clean round). Round 3: 9 (0 overruns — second clean round). Round 4: 5 (4 overruns — the Grunt-rank wipe). Round 5: 3 (2 overruns, partially mitigated by Lane Reinforcement and an Artillery Strike rescue). Round 6: 0 — game over (3 overruns).

**Mission completions:** Toren completed Boots on the Ground (Round 1, instant) for a flat +1 Rank. Sasha completed Xenobiology Delivered II (Round 2, instant) for a flat +1 Rank. No other missions completed this game — every other mission held by any player was either a long-term stretch (Captain/Major/Colonel/Brigadier-bracket) that the game ended before reaching, or required donating bulk resources the team kept routing into immediate unit purchases instead. The Mission Rank-scaling bonus (+2 total Rank for a 3+ tier stretch) never triggered this game either, same as Game 4 — both real missions completed were only 1 tier above the completing player's Rank at the time.

**Final Ranks:** Reese — Sergeant. Blake — Sergeant. Sasha — Captain. Toren — Major. Every single player ended this game at Sergeant or above; in Game 4, by contrast, 2 of 4 players (Casey, Blair) ended the game still at Conscript, the lowest possible Rank, despite 6 rounds of play.

**Full Secret Objective reveal (Allied/Neutral only, per this game's setup):**

| Player | Secret Objective | Alignment | Outcome |
|---|---|---|---|
| Reese | Scientist — donate 5 Alien | Neutral | Not completed — Reese never personally held Alien this game (his income mix was almost entirely Organic/Tech; the team's Alien sat in the Command pool instead). |
| Reese | Architect — fully upgrade 3 buildings | Neutral | Not completed — the team built **zero** Location Upgrades all game; every Command Card purchase went toward units/gear instead of Upgrades. |
| Blake | The Wall — do not let your lane overrun | Allied | **Failed** — Lane 2 overran in Round 1, Round 4, and Round 6. |
| Blake | Adventurer — complete 6 missions | Allied | Not completed — the team completed only 2 missions all game, combined. |
| Sasha | Hoarder — stockpile 40 Organic | Neutral | **Completed** — Sasha personally held 44 Organic after Round 5's income, comfortably clearing 40 before the game ended. |
| Sasha | Minimalist — end game with 3 empty upgrade slots | Neutral | **Completed by default** — same as Reese's Architect being impossible, every location's upgrade slots sat completely empty the entire game, satisfying Minimalist trivially. |
| Toren | Exporter — retire 5 units | Neutral | Not completed — nobody on the team ever used Retire from Duty even once this game; every lost unit died in combat instead. |
| Toren | Survivor — Active unit survives 3 rounds | Neutral | Not completed — Field Intelligence survived parts of Rounds 4 and 5 but died in Round 6, 1 round short of the 3 needed; the closest any objective in this game came to completing on a real combat metric. |

Of 8 Secret Objectives in play, **2 completed** (both Sasha's, both resource/structural — Hoarder via simple income accumulation, Minimalist by default since nothing was ever built). Exactly the same pattern as Game 4: the objectives that completed were the passive/structural ones, not the combat-linked ones (The Wall, Survivor both failed; Survivor came closer than Game 4's equivalent combat objectives ever did, but still fell short).

---

## Rank Trickle Effectiveness

This was the entire point of the exercise: does an automatic, guaranteed +1 Rank every 2 rounds close the gap between Player Rank's climb and Enemy Progress's guaranteed +1/round, and does it let the team survive meaningfully further into the Grunt→Core transition than Game 4 did?

### Rank progression, side by side

| Checkpoint | Game 4 (no Trickle) | Game 5 (with Trickle) |
|---|---|---|
| Round 1 end | Private / Conscript / Conscript / Conscript | Conscript / Conscript / Conscript / **Sergeant** (Toren, mission) |
| Round 2 end | Private / Conscript / Conscript / Conscript | **Private / Private / Sergeant / Captain** (1st Trickle) |
| Round 3 end | Private / Conscript / Conscript / **Sergeant** (Drew, mission) | Private / Private / Sergeant / Captain (unchanged, no Trickle) |
| Round 4 end | Private / Conscript / Conscript / Sergeant | **Sergeant / Sergeant / Captain / Major** (2nd Trickle) |
| Round 5 end | Private / Conscript / Conscript / Sergeant | Sergeant / Sergeant / Captain / Major (unchanged, no Trickle) |
| Round 6 (final) | Private / Conscript / Conscript / Sergeant | Sergeant / Sergeant / Captain / Major |

The contrast is stark and exactly as designed: by Round 6, Game 4's best-ranked player (Drew, Sergeant) was barely better off than this game's WORST-ranked players (Reese and Blake, also Sergeant) — and Game 4's other 2 players (Casey, Blair) never moved off the absolute Conscript floor for the entire game. This game's Rank spread by the same checkpoint is Sergeant/Sergeant/Captain/Major — every player at least 1 full Rank tier above Game 4's best, and the team's top player (Toren, Major) sitting 3 full tiers above Game 4's top player.

### Did it close the gap?

**Yes, substantially, on the metric Rank Trickle was actually built to fix.** The team never had a player stuck at the Conscript floor past Round 1, and by the time Core-rank enemies arrived (Round 6), every player had real access to Sergeant-through-Major-rank units and gear — including units this game introduced that simply didn't exist as legal options in Game 4 at any point: Combat Medic (Captain, Armor 2/Shields 8, a real heal+damage Active ability), Field Intelligence (Captain, Armor 1/Shields 5, AOE-damage-halving Passive), Sniper and Mortar Squad (Major, 9 DMG/7 HP), and gear like Reactive Plating (Major Armor, +17 HP, AOE immunity) and Carbon Plating (Captain Armor, +4 Armor/+14 HP). Round 6's Lane 3 fight — Combat Medic tanking and trading through a full Crawler-then-Shard-Beast double-enemy gauntlet, the first Core-rank lane EITHER game has seen clear on its own — would have been mechanically impossible for a Conscript-capped player to attempt, full stop. The team's income engine (which Game 4 already proved was never the bottleneck) also scaled further this game specifically BECAUSE Rank scaled: Barracks' shop-Rank-sum income formula directly rewarded having Sergeant/Captain/Major-rank cards sitting in the shop, which only happened because players' own Ranks were high enough to support buying them — Round 6's Barracks income alone (+15/+15 to the two workers there) dwarfs anything Game 4 ever generated from that location.

**No, it did not change the final outcome.** This game lost at the exact same round (Round 6), via the exact same mechanism (Overrun Tracker hitting 0 mid-Cleanup), against the exact same enemy tier (Core, Enemy Progress 4) that ended Game 4. The Round 4 Grunt-rank wipe — the single moment Game 4's loss was traced back to — **repeated almost beat-for-beat**: 4 lanes overran simultaneously in both games' Round 4, both via board-wide/multi-target enemy Reveal effects (Game 4: Lancer's "2× damage to active AND reserve in this lane" repeated across lanes; Game 5: a Grunt's "2× damage to ALL lanes" in a single instance, arguably an even harsher single-effect hit). Rank Trickle had already fired once by Round 4 in this game (giving a real, measurable stat advantage over Game 4's equivalent units), and it still wasn't enough to prevent the wipe — board-wide Reveal damage that hits every lane's Active unit at once, in a single instance, scales with Enemy Progress regardless of how tough any individual unit has gotten. A tougher Stubborn Recruit or a Captain-rank Field Intelligence survives 1 hit better than a Conscript would have, but an 8-damage instant to every lane simultaneously is the kind of spike that punishes the team's WHOLE board at once, not the weakest link — exactly the shape of damage that individual-unit stat improvements (which Rank Trickle delivers) are least equipped to counter.

### Verdict: partial success — it fixed the Rank-floor problem, but didn't fix the round-6 cliff

Rank Trickle did exactly what README #41 designed it to do: it gave Rank a guaranteed, unconditional floor that climbs in step with Enemy Progress's own guaranteed climb, closing the specific gap Game 4 identified (2 of 4 players stuck at Conscript with idle resources). That diagnosis is now **confirmed fixed** — nobody in this game was ever Rank-starved with money sitting unspent; every player who had Tech/Organic on hand also had a high enough Rank to spend it on something real.

But the deeper finding from this game is that **Rank was not actually the single bottleneck Game 4's analysis suggested — it was A bottleneck, sitting alongside at least one other one this game newly exposes: board-wide/multi-target enemy Reveal damage scaling with Enemy Progress, hitting every lane simultaneously regardless of how tough any single unit is.** Game 4's "the team had idle resources and Conscript-rank units" framing made Rank look like the whole story because it was the most visible gap at the time; this game shows that even with Rank fully fixed, a team can still lose to the same round via the same tracker mechanism, because Grunt/Core-rank enemies' Reveal effects (not their base stat lines) are what actually swings a round from "manageable" to "total wipe." Stronger individual units (what Rank buys) help a unit survive ITS OWN fight longer; they don't help a lane that's wiped by a single Reveal instance before its Combat Cycle even starts.

This suggests Rank Trickle should stay (it solved a real, now-confirmed problem and cost nothing to keep), but the next lever to test is squarely on the enemy-Reveal-effect side, not the player-Rank side: something that gives the team a way to blunt or counterplay board-wide Reveal damage specifically (more scouting reach, a Reveal-damage mitigation Tactician/Command Card, or capping how much of a single Reveal instance can hit already-healthy units) — analogous to what Round 0 did for early resources and what Rank Trickle just did for Rank, but aimed at the actual moment-to-moment combat spike that's now twice in a row been the proximate cause of a Round 6 loss.

---

## Open Rules Questions Found

1. **Command Card Refill when a player is already ABOVE their target hand size (e.g., the Leader's +2 starting bonus puts them at 4 cards, but their non-commander target is only 3).** The refill rule's text ("discards unwanted cards to the bottom of the deck and redraws up to hand size") describes correcting a shortfall, but doesn't explicitly say whether being above target also forces a discard down to it. We ruled hand-size targets are a floor-only correction — a player above their target is not forced to discard, since nothing in the rule text frames hand size as a hard cap, only a refill minimum. This let Toren (this game's Leader) keep all 4 of his bonus cards for the entire game, including rounds where his non-commander target was only 3. Worth an explicit ruling either way, since the alternative (forced discard down to target every Cleanup) would make the Leader's +2 Command Card bonus purely a 1-round effect rather than a lasting hand-size advantage.

2. **Does Reactive Plating's "Immune to AOE" Passive interact with board-wide multi-target Reveal damage (e.g., "deal 2x damage to ALL lanes")?** Not actually tested in live combat this game (Field Intelligence wore it during Round 6's combat, but the enemy it fought — Space Lions — had no AOE component at all, so the Passive sat unused). This is a genuinely important open question for future play: if a card like Round 4's Grunt ("deal 2× attack damage to all lanes," the exact effect that wiped 3 of 4 lanes that round) counts as "AOE" for Reactive Plating's purposes, this single piece of gear could be a hard counter to the board-wide-Reveal-spike problem identified in this game's Rank Trickle Effectiveness analysis above. Recommend a clear ruling on what qualifies as "AOE" (multi-lane Reveal effects specifically, or only effects explicitly tagged "Splash"/"AOE" in their own text) since it materially changes how strong this one Armor item is against exactly the threat that's now ended 2 consecutive playtest games.

3. **Combat Medic's Active ability text ("Once per combat: Heal Target Infantry by 10, deal this much damage to target") — is the heal target and the damage target necessarily different units, or could both clauses target the same single unit (e.g., overhealing an ally while also being read as "damage" in some edge case), and can the damage half target an enemy while the heal half targets an ally in the same activation?** We ruled the two clauses are independent and can have different targets — heal an ally Infantry (if needed) AND separately deal 10 damage to an enemy of choice, used in Round 6 to soften Shard Beast before melee combat resolved. The card text's "to target" (singular, no specified side) doesn't explicitly confirm this reading. Worth an explicit ruling since it lets Combat Medic effectively snipe an enemy from outside the normal Active-vs-Active combat exchange, which is a meaningfully different (and stronger) card than if both clauses had to target the same single recipient.

4. **Stun's actual interaction in a 2-sided exchange: when an enemy's Passive says "stuns on 1st hit of each combat," does the STUN apply to the unit being attacked (the player's unit), or does it prevent the ATTACKING enemy's own follow-up actions, given the card text doesn't specify whose turn is being skipped?** This came up in Round 4 (Wasp vs. Field Intelligence) and was resolved narratively mid-combat with a self-correction: initially read as the enemy stunning itself (nonsensical), then re-ruled as the enemy's attack stunning the player's unit it's fighting (consistent with "Stun: Skip a turn" in Keywords being a debuff effect, which should logically apply to whoever's being hit, not the one dealing it). This second reading was used going forward, but it's worth writing explicitly into either the Stun keyword definition or the specific cards that reference it, since the first (wrong) reading was genuinely plausible from the card text alone and could trip up another table the same way.

5. **When a Reveal/Passive explicitly affects "Active units" (Cleric: "move this unit to reserve, Shield active units +5") and the unit itself is an enemy moving to its OWN side's reserve, does "active units" mean the player's lane's Active unit (the normal default-targeting read, beneficial-enemy-effects-target-enemies) or specifically the NEXT enemy card about to become Active in that same lane (a forward-looking self-buff for whichever ally steps up after it retreats)?** We ruled the latter (the next enemy in that lane's own Reserve, i.e., a forward self-buff before retreating) in Round 4's Lane 4 resolution, since Cleric is explicitly retreating to Reserve itself and a Shield buff for a unit that's about to leave the fight makes little sense — but this required inventing a reading mid-session rather than following an existing rule, since the established "beneficial enemy effects target enemies" default doesn't specify WHICH enemy when the effect-source is simultaneously leaving the active fight. Worth a specific ruling for Cleric and any similar "retreat + buff" card text.

6. **Lane Reinforcement and a lane whose own enemy side cleared, but whose reinforcing unit then physically relocates to a DIFFERENT lane that's still contested — does the origin lane's own (now-empty-handed) status still count as "cleared" for that round's Cleanup check, even though its sole surviving unit physically left?** Round 5's Lane 3 (Sasha's Combat Medic) cleared its own enemies, then moved to reinforce Lane 1, leaving Lane 3 with zero player units AND (separately) zero enemies. We ruled Lane 3 still counts as cleared (not overrun) for Cleanup's purposes, since "cleared" is defined by the enemy side being empty at the time Lane Reinforcement runs, and the lane doesn't need a unit physically present afterward to retain that status — only a lane with enemies present and no player unit counts as overrun, and Lane 3 has no enemies at all. This is a reasonable extension of the existing "empty lane = overrun" rule (which only fires when enemies ARE present), but it's not explicitly written anywhere, and is worth confirming given how much weight Lane Reinforcement bears on close games.
