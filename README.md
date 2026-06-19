# Board

A cooperative (with hidden-traitor potential), tactical resource-management board game for the tabletop, currently in active design. Players defend against waves of enemies across multiple combat lanes while managing a shared economy, recruiting and upgrading units, and completing missions — all while one or more players may secretly be working against the group.

> **Status:** Design in progress. Rules, card data, and board layouts are still being iterated on. This README reflects the current state of the repo, not a finished ruleset.

## Overview

Players act as commanders defending against escalating threats (fodder, infantry, drones, beasts, mechanised units, abominations, and tiered bosses) across active combat lanes. To survive, players:

- Recruit and rank up **units** (Infantry, Scout, Mech, Mech Scout, Vehicle) from Conscript through higher officer ranks.
- Spend a three-resource economy — **Organic, Tech, and Alien** — to recruit units, buy gear, and trigger location abilities.
- Staff shared **locations** (Barracks, Armory, Medical Bay, Containment Block, Command, Battlefield) to generate passive effects and unlock active abilities each round.
- Equip units with **Gear** (Armor, Weapon, Utility, Consumable), with restrictions for Infantry-only or Vehicle/Mech-only equipment.
- Play a **Tactician** — one of 17 commander roles (e.g. The Gunsmith, The Bulwark, The Drillmaster, The Kingmaker) — each granting unique passive and active abilities that shape strategy.
- Resolve random **Events** each round with pass/fail conditions and consequences.
- Complete **Missions** for escalating rewards, from early "kill 1 enemy" objectives to late-game resource/unit sacrifices.
- Pursue a **Secret Objective** aligned as Allied, Neutral, Saboteur, or Chaos — meaning not everyone at the table is rooting for the group's survival.
- Eventually face a **Boss** drawn from a pool of 15+ named bosses, scaling across 5 tiers of difficulty.

## Repository Contents

| File / Folder | Description |
|---|---|
| `Rules.docx` | Primary rules document |
| `Unit Stats.csv` | Recruitable unit stat lines and abilities, by type and rank |
| `Enemy Stats.csv` | Enemy stat lines and abilities, by type and rank |
| `Gear Stats.csv` | Equipment stats, costs, and restrictions |
| `Boss Stats.csv` | Boss stat blocks across 5 difficulty tiers |
| `Command Cards.csv` | Location ability cards (Barracks, Armory, Medical Bay, Containment Block, Command, Battlefield) |
| `Event Cards.csv` | Per-round event cards with pass/fail effects |
| `Mission Cards.csv` | Mission objectives, requirements, and rewards |
| `Tactician Cards.csv` | The 17 commander roles and their abilities |
| `Secret Objective Cards.csv` | Hidden win conditions for Allied/Neutral/Saboteur/Chaos alignments |
| `Keywords.csv` | Glossary of recurring ability terms (Stun, Execute, Convert, etc.), exported from `Data for cards.xlsx`'s `Keywords` sheet |
| `Location Actions.csv` | Slot counts and effects per board location, exported from `Data for cards.xlsx`'s `Location Actions` sheet |
| `Round Flow.csv` | Earlier round-by-round phase breakdown, exported from `Data for cards.xlsx`'s `Round Flow` sheet — superseded by `Rules.docx`'s prose version, see [Round Structure](#round-structure) and [Feedback](#feedback) #6 |
| `Boards/` | Board section mockups (Battlefield, Barracks, Armory, Medical Bay, Containment Block, Command) |

## Playtesting

Physical board layouts for each location are provided as PNGs in `Boards/`. There's currently no Tabletop Simulator config or card art in the repo — both were removed; see [Feedback](#feedback) #13.

## Round Structure

Taken from `Rules.docx`, which reads as the current, more detailed source (it diverges from `Data for cards.xlsx`'s `Round Flow` tab in a few places — see [Feedback](#feedback) #6). Each round runs through four stages, plus actions players can take anytime:

1. **Planning Stage** — the commander spends from the command pool to activate command cards in hand (players under 2 cards in hand draw up to 2, commander up to 3); the commander assigns each lane to a player (or covers it themself), favoring higher rank; draws 2 Events and picks one active for the round; draws the round's Boss; and runs Mission Assignment (draw players + commander-rank mission cards, each player keeps one and passes the rest along). Then players place worker tokens at locations in turn order (starting from the player next to the commander); income is generated from those placements; players purchase Units/Gear in turn order; and players with a worker at Command may donate resources or units (as Scouts) to the command pool.
2. **Deployment Stage** — heal med-bay units (1 per worker placed there); the commander assigns a Scout from the scout pile (replaced if it dies); players rearrange their lane's active/reserve units, move units to the med bay, retire units back to the shop deck, or trade with other lanes (damage follows a unit when it moves); players equip gear onto their active or topmost reserve unit (own lane only). The commander then draws enemy cards based on current progress, sets aside a random selection per the active scout's effect, and shuffles before dealing into lanes.
3. **Combat Stage** — the top card of each enemy reserve moves to active; face-down cards (active or reserve) flip and trigger reveal effects (cards already face-up from scouting don't re-trigger). The commander picks a lane to start; combat resolves lane by lane with leftover damage carried between fights; a lane is cleared when all its enemies die (dead enemies can move to the Containment Block if space allows) or overrun if any survive. Bosses with ongoing effects trigger when their condition is met; the boss attacks per its card, and a lane with no enemies has its units deal damage to the boss instead.
4. **Cleanup Stage** — move lost units/gear to their piles in the order lost; overrun lanes lose progress; resolve the active Event's conditions; if the Event passed, the commander promotes a player below their own rank (or rolls to decide if none qualify); advance the enemy progress track by 1, and the player progress track by 1 if all lanes survived.
5. **Anytime** — complete missions (kept in front of the player; completing a mission at your rank promotes you at end of turn, lower-rank missions don't count); use equipped gear once per round, or pay its cost again to equip it onto a unit at any time; use unit abilities once per round; retire a living unit between fights for a partial resource refund (its gear can be re-equipped for free that round); activate command cards any time you have a worker at Command (only the commander can use a card's upgrade function, and plays its Instant effect for free).

## Card Counts

Generated from the current CSVs, for a sense of content volume and where the gaps are:

| Card Set | Total |
|---|---|
| Unit Stats | 102 |
| Enemy Stats | 93 |
| Gear Stats | 66 |
| Mission Cards | 117 |
| Command Cards | 60 |
| Event Cards | 40 |
| Secret Objective Cards | 41 |
| Tactician Cards | 17 |
| Boss Stats | 15 bosses (each scaling across 5 tiers) |

**Units by rank:** Conscript 3, Private 9, Sergeant 24, Captain 18, Major 17, Colonel 17, Specialist 7, Brigadier 7
**Units by type:** Infantry 29, Vehicle 29, Mech 21, Scout 11, Mech Scout 6, Vehicle Scout 6

**Enemies by rank:** Fodder 2, Grunt 8, Core 6, Advanced 35, Elite 14, General 17, Conqueror 11
**Enemies by type:** Mechanised 25, Infantry 22, Beast 17, Drones 10, Abomination 9, Experimental 8, Fodder 2

**Gear by rank:** Conscript 10, Specialist 11, Private 8, Sergeant 8, Captain 9, Major 8, Colonel 7, Brigadier 5
**Gear by type:** Utility 17, Armor 16, Weapon 15, Consumable 10, Experimental 8

**Secret Objectives by alignment:** Allied 13, Neutral 13, Saboteur 11, Chaos 4

A few things this surfaces at a glance: Sergeant is the deepest unit rank (24 cards) while Private is thin (9); enemy Advanced rank is by far the biggest bucket (35, more than a third of all enemies) while Fodder and Core are sparse (2 and 6); and Chaos is a real 4th alignment alongside Allied/Neutral/Saboteur (see [Feedback](#feedback) #12).

## Status & Next Steps

This repo currently holds the raw design materials (rules draft, card data, board mockups) rather than a packaged rulebook or print-and-play kit. See [Feedback](#feedback) below for suggested next steps to make the project easier to playtest and share.

---

## Feedback

A few things worth considering as the project matures:

1. ~~No single source of truth for rules.~~ **Resolved.**
2. ~~Binary formats resist version control.~~ **Resolved.** Exported the 3 unique sheets (`Keywords`, `Location Actions`, `Round Flow`) to their own CSVs. Before deleting `Data for cards.xlsx`, diffed all 9 overlapping sheets against the matching CSVs by row name (not position — the xlsx and CSVs aren't sorted the same way) to make sure nothing would be lost. The differences found weren't missing data, they were the CSVs having moved on: e.g. Mission Cards' "Desperate Stand" requirement and Boss Stats' "Wreathing Mass" tier effects have been substantively redesigned in the CSVs since the xlsx was last touched, on top of the typo fixes from #5. The CSVs are confirmed the current, authoritative version everywhere — deleted `Data for cards.xlsx`. `Rules.docx` and `Boards/*.png` remain binary; the rules doc would benefit most from a Markdown conversion for real diffs on future rules changes, but that's a bigger lift and is left as-is for now.
3. ~~`E2.csv` is unclear.~~ **Resolved.** Diffed all 12 rows against `Enemy Stats.csv` — byte-for-byte identical, nothing to merge. Deleted `E2.csv`.
4. ~~No card count/balance summary.~~ **Resolved** — see [Card Counts](#card-counts) above.
5. ~~Typos in shipped data.~~ **Resolved** — fixed 40+ occurrences of misspellings across all CSVs, including a follow-up pass: "Sabotour" → "Saboteur" in `Secret Objective Cards.csv` (flagged earlier but not actually applied at the time), and "Food" → "Organic" in `Unit Stats.csv`'s "Mobile Command vehicle" card, which referenced a resource name that doesn't exist anywhere else in the game (the three resources are Organic/Tech/Alien).
6. ~~No setup/turn-structure summary.~~ **Resolved** — see [Round Structure](#round-structure) above, written from `Rules.docx`. Comparing it against `Round Flow.csv` (the old, now-superseded source) surfaced a few loose ends inside `Rules.docx` itself, since fixed:
   - ~~**`Rules.docx`'s own table of contents disagreed with its body.**~~ **Resolved.** The ToC listed Planning Stage as Worker Placement → Income → Purchasing → Donations → Commander Actions, but the body covers Commander Actions *first*. Reordered the ToC to match the body.
   - ~~**`Rules.docx`'s component count table was stale.**~~ **Resolved.** "Secret objective: 37" → 41, "Events: 30" → 40, matching the live CSVs. (Note: there's still a separate, unfixed duplicate "Enemies" entry in that same component list — minor, didn't touch it since it wasn't part of this round of fixes.)
   - **`Rules.docx`'s "Key Terms" and "Quick reference & Keywords" sections are still empty placeholders.** `Keywords.csv` now exists and is more complete (see below), but pasting it into the doc itself is still outstanding — "Key Terms" likely needs separate content (basic vocabulary like Lane/Rank/Reserve/Progress) that doesn't exist anywhere in the repo yet.
   - The boss/lane-timing and promotion-tie-break disagreements between `Round Flow.csv` and `Rules.docx` are now moot — `Round Flow.csv` is legacy and `Rules.docx` is authoritative, so there's nothing to reconcile.
   - **`Keywords.csv` rebuilt.** Went through every CSV's ability text looking for recurring effect-type terms not yet covered by the glossary's original 33 entries. Found 5 real gaps and added them: **Multistrike** (attack the same target multiple times — Alpha Ravanger, Mammoth Tank's "Hits Twice," etc.), **Lifesteal** (Ravanger, Alpha Ravanger), **Charges** (stacking counters — TMRG, XVL3, XVL33, Holographic Decoys), **Sacrifice** (destroy your own unit for a benefit — 11+ cards), and **Banish** (Shadow Tech's temporary removal, distinct from the permanent "Delete"). Considered and rejected adding "Garrison" — it's a one-off Command Card name, not a reusable effect category like the others. Also checked the *other* direction — whether any existing entries were unused — and found one, "Base" (`Effects Base modules`), backed by only a single, arguably mismatched reference (`Underminer`'s "disables base upgrades," which reads more like the existing "Denial" category). Removed it; `Keywords.csv` now has 37 entries, each backed by real, repeated card usage.
7. ~~Mission filename was a date snapshot.~~ **Moot** — renamed `Missions 26-02-2026.json` to `missions.json` at the time; the file (along with `Cards.pdf` and `Notes.docx`) has since been removed entirely, see #13.
8. **License/ownership — not needed yet.** While the repo stays private, copyright is automatic and unpublished work defaults to "all rights reserved," which is the safest possible default — a private repo with no license is not an exposure risk. Worth revisiting only if/when you make the repo public, hand it to outside playtesters, or move toward publishing, at which point you'd want explicit terms (even an informal "don't redistribute" note for playtesters).
9. ~~Stray trailing empty columns.~~ **Resolved.** `Enemy Stats.csv` had 2 unused trailing columns and `Tactician Cards.csv` had 1 (leftover from however they were originally exported from Excel) — confirmed all rows were empty in those columns, then trimmed both files. No data lost.
10. ~~Location naming is inconsistent across the repo.~~ **Resolved.** Picked one canonical name per location, based on whichever name already had majority usage (fewest total changes): **Medical Bay**, **Containment Block**, **Battlefield**. Applied them everywhere: renamed `Boards/Combat Zones.png` → `Battlefield.png`; updated the `Building`/section values in `Command Cards.csv` and `Location Actions.csv`; updated the two matching headings in `Rules.docx` ("Medical" → "Medical Bay", "Containment" → "Containment Block"). A follow-up pass also caught the same inconsistency inside card *text* (not just the location-name fields): `Mission Cards.csv`'s "Med Bay Detail"/"Med Bay Operational" missions, and `Containment Detail`/`Containment Sealed` missions plus a `Tactician Cards.csv` ability (The Jailer) and an `Event cards.csv` event (Research drive) that all referred to the locations by their old names. Also fixed two more typos found along the way: "Contaiment" in a Command Card, and "Sabotour investigation" in `Event cards.csv` (separate from the Secret Objective one fixed in #5).
11. ~~Card-schema column names don't match `Rules.docx`'s documented schema.~~ **Resolved.** Standardized on the terms the majority of files already used: renamed `Gear Stats.csv`'s `Attack` column to `Damage` (matching `Unit Stats.csv`/`Enemy Stats.csv`/`Boss Stats.csv`), and updated `Rules.docx`'s "Breakdown of card info" section so its `Attack:` field labels (Units, Enemies, Gear) now read `Damage:` to match. Also updated `Rules.docx`'s Secret Objective field from `Faction:` to `Alignment:` to match `Secret Objective Cards.csv`'s actual column name.
12. ~~Secret Objective alignment terminology conflicts, and one alignment is undocumented.~~ **Resolved.** `Rules.docx` now reads "Alignment: Allied, Neutral, Saboteur, or Chaos" — replacing "Traitor" with "Saboteur" to match the CSV, and adding "Chaos" as a documented 4th alignment.
13. **Nothing in this repo is tracked by git except `README.md`.** During an earlier pass, `Cards.pdf`, `Notes.docx`, and `missions.json` were found missing from disk (none of which were touched by any edit made here); they were recoverable from the Windows Recycle Bin with original location and timestamps intact, so no data was lost. They've since been intentionally deleted (Tabletop Simulator config and card art/notes are no longer part of this repo). `git status` confirms every other file here (all CSVs, `Rules.docx`, `Boards/`, etc.) is still untracked, meaning git provides zero safety net for any of it — an unrecoverable deletion is one accidental Recycle Bin empty away. Strongly recommend committing everything to git now that the repo is in a cleaner state.
14. **Full-repo audit pass.** Ran a dedicated read-only review of every CSV and `Rules.docx` for typos, internal contradictions, balance outliers, and structural issues. Findings acted on:
    - ~~~30 more typos/grammar errors~~ **Resolved**, fixed across all 9 main CSVs, `Keywords.csv`, and `Round Flow.csv` (e.g. Resuply→Resupply, Belistic→Ballistic, Tripple→Triple, "is show"→"is shown" in 3 Tactician cards, "Skip an turn"→"a turn", and more).
    - ~~3 blank/missing data values~~ **Resolved.** `Unit Stats.csv`'s Sergeant "Scout" had no Organic Cost — filled with 6, matching the Infantry-rank cost progression (1/3/6/9...) Scout already follows at other ranks. `Gear Stats.csv`'s "Repair Kit" had no Restrictions — added "Vehicles and Mech only," matching its own Active text. `Location Actions.csv`'s Barracks "Deck" had no description — filled with "Holds Deck of Shop items," matching Armory's equivalent entry.
    - ~~"The Pilot" Tactician contradicted itself~~ **Resolved** — its Passive said "Vehicles," copy-pasted from "The Driver," while its Active/Resource were clearly Mech-themed; changed to "Mechs."
    - ~~Command Card "Forward Command" contradicted itself~~ **Resolved** — Passive said "Take double progress damage," Active said "Take half" — removed the Passive's progress-damage clause, keeping the immunity effect.
    - ~~Mission Cards "Organic export 3"/"Tech Export 3" had a reward/instant mismatch~~ **Resolved** — Instant granted 5 while Resource granted 10; fixed Instant to 10 to match.
    - ~~Tactician "The Bastion" had an unconditional team-wide buff unlike every peer Active~~ **Resolved** — added "Once per round," matching the frequency-limiter pattern used elsewhere (e.g. The Tactician).
    - ~~Mission rewards "First Blood," "Giant Slayer," and "Flawless Assault" were 2.5-5x their rank's normal reward~~ **Resolved** — brought down to their rank's standard "+1/+3/+8 All resources," since each already has a strong, unique Instant effect doing the real differentiation.
    - ~~Enemy "Soul eater" (General rank) had Damage 5 vs. its tier's 11-22 range~~ **Resolved** — set to Damage 22/HP 47, matching its exact cost-twins "Plague" and "Ruin" (same Organic/Tech/Alien cost, same tier).
    - ~~Gear "Heavy Sentry" had a literal unfilled "X attack" placeholder~~ **Resolved** — filled with 7, scaling "Deployable Sentry"'s (Major) "5 attack" by the same ~1.4x cost ratio Heavy Sentry (Specialist) already uses for its own Organic/Tech/Alien costs.
    - ~~Boss Stats' T2 and T4 tiers were word-for-word identical across all 15 bosses~~ **Resolved for 9 bosses.** Swapped the generic stat bump for something tied to each boss's own theme: **Plasma Channeler** and **Aegis Eater** (Shields-themed) and **The Thing** (gear/armor-themed) now get Shields instead of flat Health at T2/T4. **Rust Elemental** and **Plate Host** (Armor-themed) get a small Armor bonus (+2/+3) instead — kept deliberately low since Armor reduces damage on *every individual hit* for the rest of the fight, unlike a one-time Shield/Health pool, so a flat number-for-number swap would have made them dramatically stronger than intended. **Lightning Wisp** and **Null Engineer** (gear-cost themed) get an escalation of their own gear-cost mechanic instead. **The Culling** (on-kill themed) gets a small Heal-on-kill. **Dread Echo** (damage themed) gets +10 Attack instead of a stat split. The remaining 6 bosses (Shadow Fiend, The Balance, The Root, Undeath, Wreathing Mass, Skinwalkers) have no clear stat affinity in their kit and were left on the generic bump rather than forcing a theme onto them.
    - **One thing intentionally NOT fixed:** `Rules.docx`'s Locations section has ~27 instances of mis-encoded en dashes, rendering as "â€"" instead of "–" — a classic UTF-8/Windows-1252 mismatch. All 27 are confined to paragraphs 261-295 (the Barracks/Medical Bay/Containment Block/Armory/Command/Battlefield sub-sections), each one separating a feature name from its description (e.g. "Deck â€" Unit Deck"). Confirmed character-by-character what the correct fix is (replace with U+2013 EN DASH) but held off on applying it pending confirmation.
    - **One item explicitly deferred by design, not fixed:** `Rules.docx`'s "Difficulty levels" section (has a ToC entry, no body content) — to be filled in once other design work settles.
    - A few items were reviewed and intentionally left as-is: Secret Objective "Dictator" (Saboteur) and "Leader" (Allied) sharing identical text, Boss "Undeath"'s lower Damage (2 vs. the usual 5) — both confirmed intentional, not bugs.

None of these block playtesting as-is — they're mostly about making the project easier to maintain and hand off as it grows.
