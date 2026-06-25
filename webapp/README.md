# Board — Web Sim

Interactive, multiplayer web version of the **Board** tabletop game. Lives on the `web-sim`
branch. See the root `README.md` for the game's design/rules; this folder is the playable
implementation.

## Stage 1: Lobby skeleton — done

- `server/` — Node + TypeScript backend: Express + Socket.IO for real-time rooms, `node:sqlite`
  (built into Node, no native deps) for a lightweight record of each started game.
- `client/` — Svelte 5 + TypeScript + Vite frontend.

Host a lobby (get a 4-letter room code), up to 4 players join by code, host can fill empty seats
with bots or remove seats, host edits room settings (Difficulty, Secret Objective mix, a few
optional rules) and everyone sees them live, players ready up, host starts the game once
everyone (non-bot) is ready.

## Stage 2: Rules engine, bot-only — done

The round loop now actually runs, in TypeScript, server-side: `server/src/engine/` is a port of
`Working/sim.py`'s core game logic (Round 0, worker placement/income, shop, equip, Command
Donations, combat with the enemy-acts-first default and Lane Reinforcement, Rank Trickle,
Overrun Tracker, win/loss) plus the full Command Card build-or-activate dispatch
(`engine/commandCards.ts`). Pressing "Start Game" now plays a complete game end-to-end, streaming
a log line per event and a state snapshot per round to everyone in the room over Socket.IO
(`game:log` / `game:state` / `game:over`), and records the final result back into `data.sqlite`.

**Every seat was bot-controlled in Stage 2**, regardless of the lobby's human/bot toggle.

**Deliberately out of scope for Stage 2** (mirrors how `sim.py` itself was built section by
section — see the engine files' own comments for the exact list): per-card ability text for
Units/Enemies/Gear (so no "Attacks 1st" priority, no enemy Reveal/multi-lane damage, no Boss
fights yet — Units/Enemies/Gear are plain stat-lines: Damage/HP/Armor/Shields/Cost only); no
Missions, Events, Secret Objectives, Tactician, or Vehicle/Mech-locked decks. **Because of this,
bot-only games lose noticeably more often and earlier than the validated full ruleset**
(`Playtest Game 6-7.md` saw ~47% wins; smoke testing here saw 0 wins in 8 runs, settling within
4-8 rounds each time) — that's an expected, scope-driven gap, not a balance regression to chase
down. The numbers won't be meaningful again until those deferred systems land in later stages.

## Stage 3: Worker placement is a real human decision — done

Worker placement is no longer pooled-and-shuffled — it's a genuine turn-based race, round-robin
starting to the commander's left (commander goes last each lap), one worker at a time. **The
commander for the next round is now determined by who actually places first at Command this
round** (`engine/game.ts`'s `runWorkerPlacementAndIncome` + the Cleanup-stage commander handoff),
replacing Stage 1-2's plain round-robin rotation — this is the literal tabletop rule ("the 1st
worker placed at Command each round takes it") implemented for real, not approximated.

When it's a connected human seat's turn, the server actually pauses and prompts that specific
player (`placement:prompt` over Socket.IO, answered with `placement:choose`) instead of having
the engine decide for them — `server/src/humanDecisions.ts`'s `MixedDecisionProvider`. Bot seats
(and a human who doesn't respond within 30s — logged, then falls back to the same bot heuristic
so the game never stalls) still resolve instantly via `BotDecisionProvider`. **Every other
decision this stage — purchases, equip, Command Card build/activate — stays bot-decided even for
human seats**, per the agreed Stage 3 scope; that's Stage 4's job.

## Stage 4 (current): Backfilling deferred rules systems, one deck at a time

Stage 4 covers two different things from the original roadmap line (more human decision points,
and backfilling the systems Stage 2 deliberately deferred) — by agreement, backfilling comes
first, one full deck at a time, in the order most likely to fix the "loses more than the
validated ruleset" gap.

**Units — done.** `engine/units.ts` ports `Working/sim.py`'s `UNIT_KEYWORD_RULES` +
`classify_unit` keyword-classification dispatch (substring-matching each unit's Main
Effect/Bonus Effects text against ~20 recurring patterns, rather than one branch per card) plus
the combat-time/precombat/death-time effects that actually consume those tags: `attacks_first`
(9 units — the single most-cited gap, since enemies act first unconditionally otherwise),
`ignore_armor`, `reflect_half`/`reflect_retaliate`, `consecutive_damage`, precombat
heals/shields/no-reserve bonuses, `revive_once` (Rambo), and `explode_on_death`. `Combatant`
(`engine/combat.ts`) was extended with the full field set (`shieldMultiplier`, `shredArmor`,
`firstHitPrevented`, `reflectFraction`, `lifestealFraction`) so Gear and Enemy dispatch can reuse
the same machinery when their turn comes. A few keyword tags sim.py itself classifies but never
actually dispatches anywhere (`long_range`, `delete_on_kill` for units specifically,
`execute_low_hp`, `heal_on_kill`, `shields_on_kill`, `once_per_combat_heal`) are left unconsumed
here too — faithfully matching the source, not a gap introduced by the port.

**Still deferred**: Enemy and Gear ability text (next, in that order per the original
Gear→Unit→Enemy build order sim.py used — Units jumped the queue this round specifically for the
Attacks-1st fix), Missions, Events, Bosses, Secret Objectives, Tactician.

**Result so far**: bot-only games run longer (5-9 rounds vs. 4-8 before, across a 12-run sample)
but still 0 wins — expected, since Enemy and Gear dispatch (probably carrying similar weight)
aren't ported yet. Not a regression; the win-rate gap closes incrementally as each deck lands.

## Running it locally

Two processes, in two terminals:

```bash
cd webapp/server
npm install      # first time only
npm run dev       # http://localhost:3001

cd webapp/client
npm install       # first time only
npm run dev       # http://localhost:5173
```

Open `http://localhost:5173` in up to 4 browser tabs/windows (or have other people on the same
network hit `http://<your-LAN-ip>:5173` once the client's started with `--host`) to test a
multi-player lobby. One tab creates the room and shares the 4-letter code; the others join with
it.

## Roadmap (see the project conversation for the full staging discussion)

1. ~~Lobby skeleton~~ (Stage 1, done)
2. ~~Wire the rules engine in, all seats bot-controlled first~~ (Stage 2, done — see above for
   what's deliberately still missing)
3. ~~Make worker placement the first real human decision point~~ (Stage 3, done — see above)
4. Backfilling deferred systems (Stage 4, in progress — Units done, see above) and expanding to
   the rest of the human decision points (purchases, equip, Command Cards, targeting)
5. Visual UI pass (board/lanes/resource trackers)
6. Rules page + Tutorial content
