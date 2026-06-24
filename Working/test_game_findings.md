# Test Game Findings — Seed 7, Post-Full-Coverage Build

Full round-by-round action log: `test_game_round_log.txt` (same seed used throughout
this project's testing, run after all 10 sections of the card-coverage initiative
were implemented).

## Result
Players lost on **Round 7** (Overrun Tracker hit 0, ending at -2/20). Player Progress
reached 1/10. This matches the established baseline — 15/15 test seeds currently lose,
Round 6-11, via the Overrun Tracker. Balance tuning is intentionally deferred until
every card was implemented; this run is the "everything's in" baseline to tune against.

## Notable observations from this specific run

1. **The Command pool's Organic/Tech imbalance is still live and severe**, even after
   the Armory/Barracks income-split fix from earlier in the project. By Round 7:
   Organic sat at 0, Tech had climbed to 75, Alien to 40. Tech is accumulating far
   faster than it can be spent (no sink big enough exists), while Organic stays
   chronically near zero. This is the same structural issue identified earlier in the
   project, now confirmed still present after the full card-coverage build.

2. **Round 6-7 was the actual collapse point.** Through Round 5 the team was in good
   shape (Overrun Tracker only down to 5/20, mostly clean rounds). The instant Enemy
   Progress crossed into Core rank (Round 6, EnemyProg 4→5), 3 of 4 lanes overran in
   Round 6 (-4) and 3 of 4 again in Round 7 (-3) — back-to-back near-total wipes that
   account for 7 of the game's 10 total Overrun Tracker losses. Combat power isn't
   keeping pace with enemy hoard strength right at that rank transition.

3. **The new Command Card hand-based system is firing constantly and correctly** —
   3-5+ Active Effects per round by mid-game, a mix of free commander activations and
   paid non-commander activations, exactly as designed in the rules-review rebuild.

4. **Gear-returns-on-retire fix confirmed working in real play**: Round 7, Alex retired
   a unit holding 3 gear items, then immediately re-equipped all 3 onto a different
   unit for free ("re-equips ... from hand (free)") — the fix holds up outside of
   synthetic testing.

5. **Saboteur Cell (Unit) and the per-game-use cap registry both fired correctly**
   (Round 7, reduced Enemy Progress, tracked at "1/3" uses) — confirms the older
   Section-1-era mechanics still coexist cleanly with everything built on top since.

6. **Secret Objectives**: 3 of 4 players completed a hidden objective this game (Chef,
   Slacker, Enforcer); Dana completed neither of hers. Consistent with the ~40%
   completion rate seen across the broader 30-game coverage check for this section.

## Carried-forward, not new
- The Organic/Tech command-pool imbalance (#1) was a known issue before this build;
  it's listed here because this run reconfirms it's unresolved, not because it's new.
- The general "team loses to Overrun Tracker via lane overruns, not Player Progress
  ever reaching 10" failure mode is the same one observed throughout this whole
  project's testing — this run doesn't change that picture, it's the fresh baseline
  for it post-full-build.
