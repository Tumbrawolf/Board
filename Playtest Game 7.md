# Playtest Game 7 — Full Walkthrough (2026-06-25): The New Late-Game Cliff

## Purpose of this game

Playtest Game 6 confirmed README #42's Reveal-damage fix breaks the Round 4-6 board-wide-wipe pattern that ended Games 4 and 5, but its Findings section flagged a *different* candidate failure mode from the same 15-seed batch: in the 8 losing seeds, losses no longer cluster at Round 4-6 — they spread Round 9-15 — and the mechanism looks like **multiple lanes overrunning in the same round outpacing Lane Reinforcement's "1 donor lane per round" capacity**, rather than a single board-wide Reveal spike.

**This game's purpose is to pull a real losing seed from that batch and confirm (or rule out) that diagnosis with an actual example**, the same way Games 4-6 each pulled a real run to confirm a specific diagnosis rather than reasoning about it in the abstract.

## Methodology note

Same as Game 6: this is a real `python3 sim.py 12` run (seed 12, picked from the original 15-seed validation batch specifically because it loses at Round 14 with a clean, illustrative failure at the end) — every number and event below is copied from that run's actual output, not invented. See Game 6 for the fuller methodology disclosure (bot-driven buy/equip heuristics, not human judgment).

## Game Parameters

Same as Game 6: 4 players (Alex, Bree, Cole, Dana), Normal difficulty, full Secret Objective mix. Leader: Bree (Private). Seed 12.

---

## Rounds 0-6 — no early cliff, same as Game 6's finding

Round 0 prep ran clean. Rounds 1-2 (Fodder) each had exactly 1 lane overrun, both caught and saved by Lane Reinforcement — Overrun Tracker untouched at **10/20** through Round 2. Rank Trickle's first application (end of Round 2): `Major, Captain, Captain, Captain`.

Round 3 (still Fodder, Strategic Withdrawal not yet drawn into a hand) — all 4 lanes cleared, no overruns at all.

**Round 4** — the exact checkpoint that ended Games 4 and 5 outright. Boss **Wreathing Mass** spawned (roll 1 ≤ Enemy Progress 2). Bree and Dana both overran; Alex's clearing lane saved Bree, but Cole's reinforcement into Dana's lane wasn't enough to fully clear it — **Overrun Tracker takes its first damage of the game here: -1 → 9/20**. This is a real difference from Game 6 (which took zero damage through Round 10) and from Games 4/5 (which were wiped outright) — a partial, survivable dent rather than either extreme. Rank Trickle: `Colonel, Colonel, Major, Colonel`.

**Round 6** — Grunt rank, 3 lanes overran simultaneously (Alex, Bree, Dana); only Cole had a clearing lane to reinforce with, and it wasn't enough to save Dana's. **Overrun Tracker: -3 → 6/20.** This is the first clear sign of the new failure pattern: when 3 of 4 lanes go down in the same round, a single reinforcing lane can't cover all of them.

---

## Rounds 7-12 — a slow bleed, not a cliff

| Round | Lanes overrun | Reinforced & saved | Overrun Tracker |
|---|---|---|---|
| 7 | Alex, Cole | Alex saved (by Bree); Cole reinforced but stayed overrun | -1 → 5/20 |
| 8 | Bree, Dana | Dana saved (by Alex); Bree not reached | -1 → 4/20 |
| 9 | Alex, Cole | Both saved (Dana→Alex, Bree→Cole) | no change |
| 10 | Alex | Saved (by Bree) | no change |
| 11 | none | — | no change |
| 12 | Cole | Saved (by Alex) | no change |

Round 7 also saw Cole play the team's **Strategic Withdrawal** (once-per-game): Enemy Progress -3 → 2, Player Progress -1 → 2 — the same trade Game 6's Cole made in Round 3, just later and under more pressure here. **Early Warning Network** got built/activated multiple times across this stretch (Rounds 8 and 13) but, as in Game 6, never lined up with a multi-lane Reveal hit large enough in this particular seed to show its teeth directly.

By end of Round 12: Overrun Tracker **4/20**, Player Progress 6/10, Enemy Progress 7/10, every player Brigadier (Rank Trickle long since capped out). The team is clearly behind pace compared to Game 6's win (which crossed Player Progress 10 by Round 12) but still alive, and every overrun through Round 12 was either fully or partially absorbed by Lane Reinforcement — no round lost more than 3 points at once.

---

## Round 13 — the cap gets overwhelmed

Enemy Progress crosses into Elite (4/lane). **3 of 4 lanes overran simultaneously** (Alex, Cole, Dana) — only Bree's lane cleared, and her reinforcement into Cole's lane wasn't enough to fully save it. **Overrun Tracker: -3 → 1/20.** This is the same shape as Round 6, but now there's no cushion left.

## Round 14 — the wipe

Two things compound here:

1. **Dana's commander turn activated "Nuke"** ("Destroy everything in a lane, Enemy and Allies") during Planning, before this round's hoard was even dealt. The sim's targeting heuristic for Nuke picks whichever player is currently sitting on the most leftover enemies in their lane — in this case, clearing that player's lane of last round's leftover enemies *and* their own units in the same stroke, for free. That player now enters Round 14's General-rank hoard (4/lane) with an empty lane and nothing deployed.
2. Enemy Progress hits 9 → General rank, the toughest tier in the game.

All 4 lanes overran. With zero lanes clearing, **there was no donor lane for Lane Reinforcement to use at all** — exactly the predicted failure mode: not "too many overruns for one reinforcement," but the more extreme case where *no* reinforcement is even possible. **Overrun Tracker: -4 → -3/20. PLAYERS LOSE on Round 14.**

---

## Findings

1. **The new late-game failure mode is confirmed, and it's worse than originally framed.** Game 6's Findings predicted "multiple simultaneous overruns outpacing Reinforcement's 1-donor-lane cap." This game shows the sharper edge case: **zero clearing lanes means zero reinforcement is possible at all**, regardless of capacity. Lane Reinforcement's entire mechanism depends on at least 1 lane clearing outright every round — once the enemy hoard is tough enough (or the team's deployment thin enough) that nobody clears, the safety net that carried Rounds 1-12 disappears in a single round.

2. **This is a gradual multi-round bleed (10→9→6→5→4→1→loss), not a single-round cliff** — a meaningfully different shape from Games 4/5's instant Round-4/6 wipe-to-zero. The team had 13 rounds of partial warning (the Overrun Tracker visibly dropping) before the actual loss, which is arguably a healthier failure mode for a real table to play around (a human team would see the tracker bleeding out and could deliberately invest in more Reserve depth or Early Warning Network earlier) — but the sim's fixed AI heuristics don't course-correct on a losing trajectory, so this run can't tell us whether a human table would have caught and reversed it.

3. **The "Nuke" Command Card's targeting heuristic is a real, if narrow, sim-AI bug worth a look independent of the rules.** It removes both a player's own units and the enemies in whichever lane has the most leftover enemies, with no check for "does this player need those units to fight next round's hoard." In a human game this card would presumably be played with better judgment (e.g., only against an already-empty or already-doomed lane); the bot played it the round before a General-rank hoard landed, directly contributing to that lane's wipe. This is a simulator AI-quality issue, not a rules-design finding — worth fixing in `sim.py` if Nuke-targeting comes up as a recurring pattern across more seeds, but not something to act on in the rules themselves from a single occurrence.

4. **Comparing Game 6 (win) and Game 7 (loss) directly**, both teams faced the identical Round 4-6 window without a cliff-style wipe — the difference between winning and losing in this pair came down to (a) how many lanes overran *simultaneously* in later rounds, and (b) whether at least 1 lane was clearing each round to provide a reinforcement donor. That's a sharper, more specific target for any future tuning pass than "Reveal damage is too strong" was.

**Bottom line: README #42 holds up under a 2nd, losing-seed test — it does not reintroduce the old cliff, and this loss happens for a clearly different, identified reason.** The next natural lever to playtest, if the design wants to push survivability further, is something that gives Lane Reinforcement (or an equivalent) a fallback when zero lanes clear in a given round — not another Reveal-damage adjustment.
