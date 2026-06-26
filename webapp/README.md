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

## Stage 4: Backfilling deferred rules systems — done

Stage 4 covers two different things from the original roadmap line (more human decision points,
and backfilling the systems Stage 2 deliberately deferred) — by agreement, backfilling came
first, one full deck/system at a time, in the order most likely to fix the "loses more than the
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

**Enemies — done.** `engine/enemies.ts` ports `ENEMY_KEYWORD_RULES`/`classify_enemy` (same
substring-matching approach, over the Passive column) and `apply_enemy_combat_mods`:
`shred_armor_on_hit`, `multistrike_2/4/6`, `lifesteal`, `reflect_full`/`reflect_on_armor`,
`double_hp`/`double_attack`, `ignore_armor`, `takes_half_damage`, `gain_armor_on_hit`. Note:
`attacks_first` is classified for enemies too but — exactly as in `sim.py` — never changes combat
order, since `resolveLaneCombat` only branches on the *player* side's `attacksFirst` (the enemy
already acts first by default). Unlike Units, this backfill mostly makes specific enemies
*tougher* (lifesteal, double HP, armor shred are enemy-side buffs) rather than helping players —
expected, not a sign the wrong thing got ported.

**Gear — done.** `engine/gear.ts` ports the full Gear dispatch: `apply_gear_combat_mods`
(name-set based equip-time mods — ignore-armor, shield-multiplier, armor-shred, first-hit-free,
delete-on-kill weapons), `apply_precombat_gear` (reserve-unit healers, precombat
heals/shields, the dice-roll items — XVL3/XVL33, Holographic Decoys, Quantum Plates — and
auto-activating every affordable equipped Active effect each round, since `sim.py` has no human
choice here either), `apply_gear_active`'s ~30-branch name dispatch (medkits, enemy-hoard-thinning
items like Grenades/Landmines/Artillery Strike, Shield Generator, Nanite Tech's item-transfer,
Chronostasis), and Chronostasis's death-save (added to the same death-handling chain as
Rambo's revive-once, before it, matching `sim.py`'s order). A handful of items (Expanded
Backpack, Resupply Drone, Smoke Launcher, Night Vision, Reanimator) have no clean mechanical
hook — documented no-ops, same as the source.

**Missions, Events, Bosses, Secret Objectives, Tactician — done.** All five ported close to 1:1:

- `engine/missions.ts` — deck, per-round draw, keyword-matched Requirement checking, Resource/
  Instant reward dispatch, completion → Rank gain. This is the Mission-driven promotion path
  that stacks with Rank Trickle, and turned out to be the single biggest lever in the whole
  deferred-systems list (see Result below).
- `engine/events.ts` — deck, per-round draw + Round Effect, Completion Reward/Failure Penalty
  dispatch on the existing flat 55% pass/fail roll, including the promotion-on-pass mechanic.
- `engine/bosses.ts` — spawn roll, tier escalation (live lookup from Enemy Progress), Boss
  Passive dispatch, the one-exchange-per-round combat block.
- `engine/secretObjectives.ts` — 2 dealt per player at setup, the full alignment-flavored
  personal-win-condition dispatch checked at game end, including Deus Machina's Overrun Tracker
  save.
- `engine/tactician.ts` — shop cost discounts for 6 roles, plus The Doctor's Medical Bay
  heal-double/Organic-rank bonus. The other 9 roles (The Tactician, Kingmaker, Jailer, Reclaimer,
  Pathfinder, Breaker, Bastion, Chessmaster, Quartermaster) have no clean hook in this model —
  documented no-ops, same as the source.

**Final pass caught real mis-ports from Stage 2.** Several Command Cards were written *before*
Missions/Events/Bosses existed and got marked "no-op, system not ported yet" — re-checking every
such comment against `sim.py`'s actual current code (not just the old assumption) turned up 8
fixes: "Collaboration" and "Eradicator Cannon" were never actually about Missions/Bosses at all
(flat resource transfer and hoard-reduction respectively — just mislabeled); "Conscription"/
"Rapid Deployment" don't touch the still-unported locked Vehicle/Mech deck and were portable all
along; "Take Credit", "Punch Through", "Exploitation", and the `explode_on_death` Unit keyword's
Boss-targeting branch all needed the now-real `bossActive` to wire up. Also fixed Containment
storage, which had been hardcoded always-on instead of gated behind actually building
"Containment Protocol" first, matching `sim.py`'s real `containment_slots` behavior. Verified
with an automated coverage check confirming every one of the 62 Command Cards and 41 Secret
Objectives has a real dispatch case, not a silent fallthrough.

**Bonus fix along the way**: bots no longer donate a Scout-type unit to the shared scout pool
unless it's actually better than the pool's current best (only one scout is ever assigned per
round) — they used to dump every Scout-type purchase into the pool unconditionally, including
units that would have been more useful fighting in their own lane.

**Result**: win rate climbed from 0/15 (end of the ability-text-only backfill) to a consistent
~30% (6/20 in the final batch) once Missions/Events/Bosses/Secret Objectives/Tactician landed,
with games now running 8-15 rounds — much closer to the validated full-ruleset range
(`Playtest Game 6-7.md`: ~47%, Round 9-15). Missions turned out to matter most, confirming the
theory from the ability-text-only checkpoint: the extra Rank-promotion path was the biggest
single piece of the original gap.

## Stage 5: Basic UI + the remaining decision points (purchases, equip, Command Cards) — done

By agreement, this stage built UI for the still-bot-only decisions first, then wired them in --
not a thin sequential wizard, but everything open in one screen at once, since real tabletop
Planning isn't a strict turn order either.

**Board/Lane view (`client/BoardView.svelte`)** -- replaces the old plain-text player list with a
real per-player lane: resources, active unit (HP/Shields/equipped gear), reserve units, and lane
enemies, plus a commander badge and a "you" marker. Needed a server-side companion,
**`game:privateState`**: a player's Command Card hand and unequipped gear hand are now sent only
to their own socket, never broadcast room-wide -- the first real hidden information in this
engine. The public `game:state` snapshot was also enriched with live shop contents and full unit
detail so the new panels (below) have what they need without a separate round-trip.

**The Planning window (`client/PlanningPanel.svelte` + `server/humanDecisions.ts`'s
`runPlanningWindow`)** -- a connected human seat gets Shop Units, Shop Gear (auto-equips onto
their active unit), and their Command Card hand (Build/Activate/Skip per card) all on screen at
once, acts on whichever in whatever order, then hits "Done with Planning" (or a 60s timeout falls
back to the bot heuristic, same precedent as Stage 3's placement prompt). Shop/Equip actions apply
immediately; Command Card choices are only *recorded* during the window and applied afterward
(`resolveCommanderCards`/`resolveNonCommanderCards`), once Donation has actually topped up the
shared command pool -- matching exactly when their legality was always evaluated. The actual
buy/equip/build/activate mutations now live in one shared module, `engine/planningActions.ts`,
called by both the bot path and the human path, so neither can silently drift from the other's
rules.

**Caught and fixed a real regression before this shipped**: the first version ran every seat
(bots included) through one `Promise.all` for their Planning window. That's correct for humans
(real contention over the shared shop is the point), but for bots it silently changed behavior --
every `await`, even on an already-resolved bot decision, yields one microtask tick, so several
bots sharing one `Promise.all` round-robin-interleave their per-unit purchase loops instead of
each bot finishing its shopping before the next starts, like the original sequential code did. A
40-game batch comparison caught it (win rate dropped from the validated ~30%+ to 20%); splitting
bots into a plain sequential loop and only human seats into the concurrent `Promise.all` restored
it (37.5%, no crashes, over a fresh 40-game batch).

**Verified end-to-end** with a live server and a simulated human seat exercising all three panels
over real Socket.IO round-trips: buyUnit, buyGear, and resolveCard (build/activate/skip) all
round-trip correctly, and the game reaches a clean win/loss every run.

**The Battlefield-building Command Card phase is interactive too, now** (added right after this
shipped, same session): `client/BattlefieldCardPanel.svelte` + `humanDecisions.ts`'s new
`runBattlefieldCardWindow` cover the cards resolved during Combat, after enemy hoards exist.
Unlike the Planning window, choices apply immediately -- there's no Donation-equivalent step
between this and Combat that changes what's legal, so there's nothing to defer. Same
bot-sequential / human-concurrent `Promise.all` split as the Planning window, verified the same
way (a 40-game bot-only batch at 30%, no crashes; a live Socket.IO test confirming build/
activate/skip on a human seat).

**Still not done**: targeting (no ability currently *needs* a player to pick a target -- the few
multi-target effects in this engine already resolve via the same heuristics bots always used, so
there's nothing to wire yet) and any further visual polish -- this is intentionally a "basic UI,"
not a final pass.

## Stage 7: Rules page — started

A "Rules & How to Play" button in the lobby header (`client/RulesPage.svelte`) covers the economy,
locations/worker placement, units/gear/Rank, combat, win/loss conditions, and the supporting
systems, plus a Quick Start section specific to how this web version's interactive parts actually
work. Tutorial content (a guided in-game walkthrough, as opposed to a reference page) is still
open.

## Stage 6/7 follow-up: first-use tooltips + a code-only visual polish pass

A small dismissible callout (`client/FirstUseTip.svelte`, localStorage-backed so it only shows
once per browser) explains the worker placement prompt, the board/lane view, the Planning window,
and the Battlefield Command Card window the first time each one appears — chosen over a full
guided overlay or a separate practice mode, since it's far cheaper to build and doesn't require
maintaining a second game-flow variant.

Also fixed a real, fairly clear-cut layout bug found by reading the CSS: the page wrapper was
capped at 640px max-width everywhere, including in-game, where BoardView (2 columns) and
PlanningPanel (3 columns) need real room — now widens to 1100px once a game has started, while the
lobby/join/settings screens keep the narrower centered-card width. Added responsive breakpoints so
those grids stack to 1 column on narrow viewports, and global button hover/focus states that were
missing entirely. This pass was done from code alone (no browser available while working) — it
hasn't been visually verified yet.

## Lobby settings: 3 of 4 now actually wired into the engine

For a while, only **Difficulty** affected the actual game -- the lobby's **Secret Objective mix**
and 3 **optional rules** synced live across clients and looked functional, but the engine never
read them. Fixed for 3 of the 4:

- **Secret Objective mix**: "none" excludes Saboteur/Chaos from dealing; "guaranteedSaboteur"/
  "guaranteedChaos" ensure at least one dealt card has that alignment; "full" is unchanged.
- **Commander's Call**: the commander now picks which workers get a contested location's
  full-income slot(s) (`CommandersCallPanel.svelte` for a human commander; a "favor the
  currently-weakest player" heuristic for a bot one), replacing the default arrival-order pick.
- **Tiered Mission Draw**: Rank 1-3 missions always draw freely; Rank 4+ missions need a shared
  1d8 roll (capped to highest player Rank + 1) to be eligible at all that round. **Worth knowing**:
  a 30-game batch comparison found this one has a real cost here (~33% win rate baseline -> ~20%
  with it on) -- the tabletop rule's whole point is avoiding a small table's mission draft going
  completely dead, but this engine draws missions per-player on demand with a Rank+1 eligibility
  cap that already prevents that outcome, so turning this on only inherits the rule's cost (Rank
  4+ missions getting harder to draw) without the benefit it was designed to provide. Not a bug,
  but a real difficulty increase beyond what the tabletop version implies.

**Vote of No Confidence — done, all 4 lobby settings now wired.** The big one: a real accuse +
escrow + vote + branching-resolution mechanic (README Feedback #14/#20), not just a dealing/
draw-rate tweak. Each player gets one chance per round to accuse another of being Saboteur/
Chaos-aligned (`DecisionProvider.chooseAccusation`) -- bots never initiate (no real basis to
suspect anyone), so this only fires when a connected human chooses to
(`client/VoteOfNoConfidencePanel.svelte`). Voting is majority-rules among everyone except the
accused (ties go to Not Believed; the accuser's own vote always counts as Believed); bots vote
Believed unconditionally if a human made the accusation, or randomly if a bot did. All 3
resolution branches are ported from the rebalanced Feedback #20 rules in `engine/accusations.ts`:
correct-and-believed (accused drops to 1 Secret Objective, accuser's escrow returns + promotion),
false-and-believed (accuser demoted + drops to 1 Secret Objective, escrow forfeit to the command
pool), and rejected (escrow fully refunded, accuser must reveal one of their own cards -- shown on
the board view once it happens).

**Known simplifications, worth knowing about**: the escrow amount (O5/T5/A5) is an assumption --
the rules describe "escrowed resources/cards" without a stated number, and the full Rules.docx
text wasn't available to check against. Which specific card gets discarded/revealed in the
false-accusation and rejected branches picks deterministically (the first remaining card) rather
than adding a second interactive sub-decision for the player who'd normally choose, to keep this
already-large feature's scope bounded.

Verified with a 30-game bot-only batch (no crash, no behavior change -- bots never trigger it, as
designed), a live Socket.IO test with a human always accusing (both "Believed" branches confirmed
end-to-end with correct escrow/rank/card consequences), and a standalone unit check of the
"Rejected" branch (can't occur naturally with only 1 human seat, since bots always believe a
human accuser).

## Full-implementation pass: every Gear/Tactician/Boss item gets a real hook, Events get fixed

Stage 4 ported Missions/Events/Bosses/Secret Objectives/Tactician faithfully to `sim.py`'s level
of completeness, which left a known list of "no clean hook, documented no-op" items behind: 11
Gear cards, 9 of 15 Tactician roles, 2 Boss passives, and all 32 Events beyond the original 8
(still a flat 55% pass/fail roll with no real Round Effect/Condition/Penalty). This pass went
beyond sim.py's own scope and built real infrastructure for nearly all of them rather than
skipping or approximating:

- **Gear** (`engine/gear.ts`): all 11 previously no-op items now have real mechanics — an equip
  slot-cap system (`planningActions.ts`'s `equipSlotCap`) for the items that needed one, Uranium
  Rounds' consecutive-hit tracking, Night Vision's precombat reveal bonus, Reanimator's
  battlefield revive off `game.lastKilledEnemy`, Expanded Backpack/Resupply Drone/Smoke
  Launcher/Night Vision/Reanimator Actives.
- **Tactician** (`engine/tactician.ts`): 7 more roles now have real dispatch — Pathfinder bypasses
  the Rank-gate on unit purchases, Jailer discounts Containment builds, Breaker/Bastion get real
  combat-time `shredArmor`/shield hooks. Reclaimer and Chessmaster stayed documented no-ops (no
  Recycling pile or distinct Reassign action exists in this model to hook into).
- **Bosses** (`engine/bosses.ts`): Rust Elemental (zero-out all combatants' armor for the round)
  and The Culling (enemies become delete-on-kill) — both board-wide effects, so they're applied at
  Combatant-construction time in `game.ts` rather than inside the single-lane `applyBossPassive`.
- **Events** (`engine/events.ts`): all 32 cards wired up real Round Effects/Conditions/Penalties —
  see below, this one wasn't a clean win.

**The Events pass caused a severe regression, root-caused and fixed.** Making all 32 Events real
dropped bot win rate from a stable ~40% baseline to 7-18% (n=80 batches). Git-stash bisection
confirmed the regression was isolated to this change; cluster-by-cluster isolation testing (7
event clusters disabled one at a time) found no single cluster was dominant — the harm was broadly
distributed, and Round Effects firing every round (not the Penalty/Condition channel) turned out
to be the dominant cost. Four fixes landed together:

1. **Skip Failure Penalty when the Round Effect already deals real harm.** Only the original 8
   events still roll a Penalty on top of their Round Effect — the 32 new ones don't double up.
2. **Real Completion Condition checking** (`eventConditionMet`) replacing the flat 55% roll, using
   two new per-round delta trackers (`game.killsThisRound`/`deathsThisRound`) since the existing
   stat fields are cumulative-only and couldn't answer "did this happen *this round*."
3. **Progress-bracket severity scaling** (`eventSeverity`): binary Round Effects (stun/block/strip,
   no natural "amount" to scale) now gate behind `Math.random() < severity`, where severity is
   0.4/0.7/1.0 keyed off `game.enemyProgress` — easing harm early, ramping it up as the game
   progresses. This alone was the highest-leverage fix, ~8%→24% on n=80.
4. **Real commander choice for event selection** (`chooseActiveEvent`) — fixed a long-standing
   discrepancy where a code comment claimed "commander chooses" but the actual logic (in both
   `sim.py` and this port) was `random.choice(drawn)`. Two Events are now drawn and the commander
   picks which becomes active; bots favor the milder of the original 8 via a heuristic, human
   seats get a 20-second Socket.IO prompt (`client/EventChoicePanel.svelte`) with the same
   bot-heuristic fallback on timeout used by every other decision point.

**Result**: 25% win rate on n=80, no crashes — a genuine multi-fold recovery from the regression,
though still below the pristine ~40% baseline. The gap is the real cost of Events no longer being
a no-op: harsher Round Effects can still land even with severity scaling and a real choice point,
which is the intended tradeoff rather than a bug.

## Follow-up audit: the first Events pass still had 6 cards with no real Round Effect, 3 with a coin flip

A direct re-check of all 40 Events against the actual CSV text (not just the summary above) found
the first pass hadn't actually reached 100%, despite this file saying so: 3 cards' Completion
Condition (Assigned Posts, Garbage Day, Forced Disposal) still fell back to a flat
`Math.random() < 0.55`, and 6 cards' Round Effect text was never wired to a single line of game
logic at all (Command Requisition, Lead by example, Chain of Command, Honorable Discharge, plus
Assigned Posts' own Round Effect). Built real mechanics for all of them:

- **Command Requisition**: "Generated resources go to command instead" now actually redirects the
  worker-placement income loop to `game.commandPool`; "players can spend command resources" lets
  Unit/Gear purchases and equip costs draw their shortfall from the command pool too
  (`planningActions.ts`'s `canAffordIncludingCommand`/`payIncludingCommand`).
- **Lead by example**: players get a real second mission-draw attempt this round, not just the
  promote/demote Reward/Penalty that already existed.
- **Chain of Command**: a real combat-time mod sets every player unit's HP and Damage equal to
  its Rank value (`RANK_NUM`), via `applyEventCombatMods` at the same Combatant-construction sites
  every other combat-time Event effect uses.
- **Honorable Discharge**: unit deaths this round are redirected into the same retire-for-partial-
  refund treatment `runRetireFromDuty` already uses for obsolete reserve units
  (`retireOrGraveyard` in `game.ts`), so its own Completion Condition ("Retire 5-10 units") has a
  real per-round count to check.
- **Assigned Posts**: a real per-player dice-rolled location assignment
  (`game.assignedPostLocations`), checked against where players actually placed that round.

The 3 coin-flip Conditions needed inventing two pile systems this engine (and `sim.py`) never had
at all -- a "Disposal" pile (fed by units that die, not retire) and a "Recycle" pile (fed by
Command Cards that get activated instead of vanishing). Built both at minimal scope: real running
counts/contents, a snapshot at the start of the round the card is active so "shrank by half" is an
exact comparison, and an auto-apply convention for the spend/restore side (no UI decision point
exists for either, so the commander auto-clears/restores when affordable, same convention Gear
Actives already use). Two Penalties stayed honest no-ops rather than guessed at: Garbage Day's
"Delete items on death" needs to know about deaths before Event resolution runs, which happens
after combat already finished for the round -- a structural ordering conflict, not a missing
hook. Research drive's "roll dice on capture-vs-kill odds" sub-mechanic would need an
interrupt-the-kill branch inside `resolveLaneCombat` itself; left undone since the card's actual
Completion Condition (capture more than you kill) is checked exactly either way, via a real
`containedThisRound` counter exposed for it.

Re-verified after all of this: clean `tsc`/`svelte-check`, 18-23% win rate across two more n=80
batches (consistent with the 25% above, within the noise band already established for this
sample size), no crashes.

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
4. ~~Backfill deferred systems~~ (Stage 4, done — see above)
5. ~~Basic UI + remaining decision points (purchases, equip, Command Cards)~~ (Stage 5, done — see
   above). Targeting is still untouched -- no ability currently needs a player to pick one.
6. Further visual polish pass (the board/lanes view is basic by design so far)
7. Rules page + Tutorial content
