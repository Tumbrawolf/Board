# Files Changed This Session (2026-06-28) — Card Redistribution Pass

## What happened this session

1. Redistributed 13 Command/Battlefield cards to thematically appropriate locations to balance the deck from a 4–18 spread to a tight 8–10 range across all six locations.
2. Updated resource costs for all moved cards to match destination location cost profile.
3. Fixed all 6 stale `locationUpgradesBuilt` passive lookups in `game.ts` and 1 in `planningActions.ts` that referenced old locations.
4. Added README Feedback #45.

## Files changed

| File | What changed |
|---|---|
| `Command Cards.csv` | 13 cards' `Building` field and costs updated: Field Testing/Eradicator Cannon/Priority Construction/Security Drones → Armory; Reinforcements/Forward Command → Barracks; Perfect Information/Suppression/Scouting Update → Containment Block; Final Stand/Tranq Rounds/Barrier Systems → Medical Bay; Nuke/Strategic Withdrawal → Battlefield |
| `webapp/server/src/engine/game.ts` | Fixed 6 passive lookups: Forward Command (Battlefield→Barracks), Eradicator Cannon passive (Command→Armory), Scouting Update (Command→Containment Block), Barrier Systems passive (Battlefield→Medical Bay), Security Drones passive (Battlefield→Armory), Tranq Rounds passive (Battlefield→Medical Bay) |
| `webapp/server/src/engine/planningActions.ts` | Fixed 1 passive lookup: Field Testing equip-cost check (Command→Armory) |
| `README.md` | Added Feedback #45 |

---

# Files Changed This Session (2026-06-28) — Command Card Pass

## What happened this session

1. Full card-by-card review of all Command and Battlefield cards in the web-app engine. Every stub and random-roll approximation replaced with mechanics matching the card text exactly.
2. Deleted 4 cards this session: **Ammo Stockpiles**, **Covering Fire**, **Early Warning Network** (no clean implementation path); **Collaboration** deleted in prior session. Command card total: 62 → 55.
3. Extended `resolveLaneCombat` with three new optional hooks: `onFirstPlayerDeath` (You Shall Not Pass), `onEnemyKill` (Punch Through), `doubleFirstAttack` flag (Whites of Their Eyes).
4. Added `RoundTempState` flags: `reserveImmuneThisRound`, `youShallNotPassArmed`, `tranqRoundsActiveThisRound`.
5. Added `GameState` fields for pre-decision targeting and armed flags across 10+ cards.
6. Wired Battlefield card passives at combat start (Barrier Systems shields, Defense Turrets reveal kills, Security Drones empty-lane drones, Tranq Rounds damage reduction, Eradicator Cannon boss damage).
7. Perfect Information uses `perfectInfoArmed` deferred flag — fires post-hoard-build when enemy stacks exist.
8. Fixed dead code: removed unreachable `Suppression`/`Bunkers` cases from `applyCommandActive`.
9. Updated CSV text for Final Stand ("target any unit"), Punch Through ("free boss hit on kill"), Whites of Their Eyes ("target lane").

## Files changed

| File | What changed |
|---|---|
| `Command Cards.csv` | Deleted Ammo Stockpiles, Covering Fire, Early Warning Network rows; updated Final Stand, Punch Through, Whites of Their Eyes active text to match implemented mechanics |
| `webapp/server/src/engine/types.ts` | Added `finalStandTargetUnitId`, `whitesOfTheirEyesTargetSeat`, `punchThroughActiveSeat`, `eradicatorCannonCost/KillArmed/LaneSeat`, `requestAidBonusRounds`, `priorityOperationsRoundsLeft`, `priorityConstructionRoundsLeft`, `reinforcementUnitIds`, `perfectInfoArmed`, `fieldTestingGearIdx/UnitIdx` |
| `webapp/server/src/engine/state.ts` | Added `reserveImmuneThisRound`, `youShallNotPassArmed`, `tranqRoundsActiveThisRound` to `RoundTempState` with `clear()` resets |
| `webapp/server/src/engine/combat.ts` | Added `onFirstPlayerDeath`, `doubleFirstAttack`, `onEnemyKill` params to `resolveLaneCombat` |
| `webapp/server/src/engine/commandCards.ts` | Fully implemented all Command and Battlefield card actives; removed dead Suppression/Bunkers cases from `applyCommandActive`; removed Collaboration, Ammo Stockpiles, Covering Fire, Early Warning Network cases |
| `webapp/server/src/engine/game.ts` | Constructor + round-reset inits for all new fields; Battlefield passives block at combat start; pre-decision blocks for all targeting cards in both commander and non-commander resolvers; `perfectInfoArmed` deferred execution post-hoard; Punch Through/Whites of Their Eyes/You Shall Not Pass callbacks wired at `resolveLaneCombat` call site |
| `webapp/server/src/engine/planningActions.ts` | Priority Operations (half activation cost), Priority Construction (half build cost), Field Testing passive (skip equip cost) |
| `webapp/server/src/engine/decisions.ts` | `choosePerfectInfoLayout` added to `DecisionProvider`; bot implementation redistributes weakest enemies to weakest lanes |
| `webapp/server/src/humanDecisions.ts` | `choosePerfectInfoLayout` human implementation with socket prompt and timeout fallback |
| `webapp/server/src/index.ts` | `perfectInfo:response` socket handler |
| `webapp/client/src/lib/PerfectInfoPanel.svelte` | New — enemy rearrangement UI for Perfect Information card |
| `webapp/client/src/lib/Lobby.svelte` | Mounted PerfectInfoPanel |
| `README.md` | Command Cards count 62→55; added Feedback #44 |

---

# Files Changed This Session (2026-06-28) — Event Card Pass

## What happened this session

1. Reviewed all 40 Event cards against the TypeScript engine (`webapp/server/src/engine/`), implementing round effects, conditions, rewards, and penalties card by card.
2. Deleted **Forced Re-Armament** and **System Lockdown** — both removed from `Event cards.csv` and all engine code; Event card total drops from 40 to 38.
3. Redesigned and fully wired **Ion Storm**: new round effect (all enemies +5 shields; shield damage doubled), condition raised to 40 shields destroyed (tracked via new `shieldsDestroyedThisRound` field), permanent reward (scouted units enter with 0 shields) and permanent penalty (enemies permanently enter with +10 shields).
4. Redesigned and fully wired **Renovations**: round effect now sets aside built upgrades (restores after event, overflow to commander hand rather than blocking new builds), reward unlocks removing a built upgrade to free a slot, penalty strips all built upgrades at end of every round.
5. Wired **Annihilation Clause** correctly: round effect applies to all combatants (deleted on death, all saves suppressed, no containment), condition simplified to kills > deaths, rank-comparison reward/penalty added as permanent standing effects.
6. Updated `Event cards.csv`, `README.md` (count 40→38, Feedback #43), and `CHANGES_MANIFEST.md`.

## Files changed

| File | What changed |
|---|---|
| `Event cards.csv` | Deleted Forced Re-Armament and System Lockdown rows; updated Ion Storm round effect/condition/reward/penalty text; updated Renovations round effect/reward/penalty text (Annihilation Clause condition text updated in prior session) |
| `webapp/server/src/engine/types.ts` | Added 9 new `GameState` fields: `ionStormScoutedLoseShields`, `ionStormEnemyEntryShields`, `shieldsDestroyedThisRound`, `renovationSetAsideUpgrades`, `renovationSetAsideBonusCounts`, `renovationRemoveUnlock`, `renovationEndOfRoundStrip`, `annihilationEnemiesDeletedByHigherRank`, `annihilationAlliesDeletedByHigherRank` |
| `webapp/server/src/engine/combat.ts` | Added `totalShieldsAbsorbed` to `LaneCombatResult`; `resolveLaneCombat` now accumulates shields absorbed by reading `curShields` before/after each `computeDealt` call |
| `webapp/server/src/engine/events.ts` | Removed Forced Re-Armament and System Lockdown branches; updated Ion Storm condition (40 shields), round effect (double shield damage), reward/penalty; implemented Renovations round effect (set-aside/restore), reward/penalty; wired Annihilation Clause condition (kills > deaths), round effect (`deleteOnKill` on all), reward/penalty |
| `webapp/server/src/engine/game.ts` | Constructor: initialized 9 new fields; per-round reset: clears `shieldsDestroyedThisRound`; both `resolveLaneCombat` call sites accumulate `totalShieldsAbsorbed` into `shieldsDestroyedThisRound`; Renovations restoration block added after `applyEventResolution`; Renovations end-of-round strip block added; `deleteOnKill` now consumed (containment skip + save bypass via `annihilationNoSaves`); Annihilation Clause reward applied when creating enemy combatants |
| `webapp/server/src/engine/planningActions.ts` | Removed Forced Re-Armament equipment-cost doubling; `canBuildCard` updated to allow building at cap when `renovationRemoveUnlock` is set; `buildCardMutation` updated to auto-remove cheapest upgrade to free a slot when `renovationRemoveUnlock` active |
| `README.md` | Event Cards count 40→38 in Card Counts table; added Feedback #43 (full event audit session description) |

---

# Files Changed This Session (2026-06-25)

A per-session log of what changed and why. Earlier in this project's history, `Rules.docx`/`README.md` were sometimes edited as a separate working copy outside the tracked clone, so this file used to exist to tell the user what to manually copy over (git showed no diff for those files until the user did so). **That gap doesn't apply this session** — every file below was edited directly in the tracked repo and is already committed/pushed to `origin/main`. This file is now just a session summary, not a "drop these in" instruction sheet.

## What happened this session

1. Played 3 full manual playtest games to genuine win/loss completion (Games 1-3: no antagonist / guaranteed Saboteur / guaranteed Chaos), surfacing a real early-game collapse pattern across all 3.
2. Implemented a 17-change rules revision in response (README Feedback #31-40): Round 0 prep round, Fodder enemies stripped of ability text, post-combat Lane Reinforcement, same-round Reserve promotion, gear-survives-1-on-death, worker-free Command Donations, Rank-separated Unit/Gear decks with never-exhaustible cards, Tech-cost gear equipping, raised Command Card hand size, plus several combat/cleanup edge-case clarifications.
3. Played a 4th game (Game 4) validating that revision — confirmed the resource-starvation fixes worked, but found a new bottleneck: Player Rank climbing far slower than Enemy Progress.
4. Added **Rank Trickle** (Feedback #41) — every player gains +1 Rank automatically every 2 rounds.
5. Played a 5th game (Game 5) validating Rank Trickle — confirmed it closed the Rank-floor gap, but the team still lost via a different mechanism: board-wide enemy Reveal effects wiping all 4 lanes at once.
6. Added a 3-pronged fix for that (Feedback #42): scouting baseline reveal count 1→2, a multi-lane damage cap, and a new Command Card ("Early Warning Network").

All 21 of these rule changes have been verified present in **both** `Rules.docx` and `Board_Rules_Reorganized.docx` (full-text re-extraction + checklist grep against both, not just spot-checks), and the Component Count tables in both docs plus README's Card Counts table all agree with the actual CSV row counts (Command Cards 62, Units 103, Gear 68, Enemies 93, Secret Objective 41, Missions 117, Tactician 18, Events 40, Boss 15).

## Files changed

| File | What changed |
|---|---|
| `Rules.docx` | All 21 rule changes above (see README Feedback #31-42 for full reasoning on each) |
| `Board_Rules_Reorganized.docx` | Same 21 changes, written in this doc's own structure/voice — no automatic sync between the two docs, every change was applied to both by hand |
| `Enemy Stats.csv` | `Pests`/`Ticks` (Fodder rank) had their `Reveal`/`Passive` columns blanked — now plain stat-stick filler, by design (Feedback #31) |
| `Command Cards.csv` | Added **Early Warning Network** (Battlefield, 62nd card) — Feedback #42 |
| `README.md` | Added Feedback #31-42; fixed a stale Command Cards count (61→62) in the Card Counts table; added Repository Contents rows for `Board_Rules_Reorganized.docx` (previously, inaccurately, described as "not in this repo") and the 5 new `Playtest Game *.md` files plus the Playtest Log |
| `Playtest Game 1.md` – `Playtest Game 5.md` | New — full manual playtest transcripts, see README's Repository Contents table |
| `Playtest Log - Full Game Walkthrough.md` | New — running rules-gap log with a "Resolution" section disposing of every item found across the 5 games |

## Not included

The Python dealer/RNG script used to run the 5 playtest games (deterministic shuffling, dice, deck state) lives in a session-scratch directory, not this repo — it's tooling for running playtests, not part of the game's actual rules/data, so it wasn't checked in.
