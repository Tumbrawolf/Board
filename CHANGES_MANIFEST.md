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
