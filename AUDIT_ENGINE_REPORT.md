# Board Game — Engine Wiring Audit Report
*Generated 2026-06-30. All findings from direct source reads of the TypeScript engine and sim.py. No assumptions.*

Cross-reference of [AUDIT_REPORT.md](AUDIT_REPORT.md) findings against actual engine implementation.

---

## Engine File Map

| File | Purpose |
|------|---------|
| `webapp/server/src/engine/types.ts` | All TypeScript interfaces and GameState model |
| `webapp/server/src/engine/data.ts` | CSV loading — reads all card files at startup |
| `webapp/server/src/engine/game.ts` | Main round loop, scout/reveal, event resolution, cleanup |
| `webapp/server/src/engine/combat.ts` | Lane combat, damage calculation, Combatant model |
| `webapp/server/src/engine/tactician.ts` | All 17 tactician implementations |
| `webapp/server/src/engine/decisions.ts` | Bot decision-making |
| `webapp/server/src/engine/bosses.ts` | Boss combat and targeting |
| `webapp/server/src/engine/gear.ts` | Gear passive/active effects, pre-combat shields |
| `webapp/server/src/engine/units.ts` | Unit keyword-to-tag classification |
| `webapp/server/src/engine/enemies.ts` | Enemy keyword-to-tag classification |
| `webapp/server/src/engine/commandCards.ts` | Command card active effects |
| `webapp/server/src/engine/missions.ts` | Mission completion checks |
| `webapp/server/src/engine/secretObjectives.ts` | Secret objective completion checks |
| `webapp/server/src/engine/events.ts` | Event resolution |
| `webapp/server/src/engine/planningActions.ts` | Worker placement, purchase, equip mutations |
| `webapp/server/src/engine/shop.ts` | Shop roll/fill logic |
| `webapp/server/src/engine/state.ts` | Initial state construction |
| `webapp/server/src/engine/constants.ts` | Difficulty settings, rank tables |
| `Working/sim.py` | Separate Python simulator (predates web app engine) |

---

## Status Legend

| Label | Meaning |
|-------|---------|
| **MATCHES** | Engine behavior correctly implements the CSV/rules intent |
| **ENGINE BUG** | Engine does something wrong — active defect, not a gap |
| **GAP** | Mechanic exists in CSV/rules but has no implementation |
| **DEFERRED** | Intentionally not implemented, acknowledged in code comments |
| **SILENT GAP** | No error, but engine ignores data it should use |

---

## 1. Keyword Mechanics in Engine

### Shred (armor removal)
**Status: MATCHES**

Implemented as `shredArmor` field on `Combatant` (combat.ts:17). Applied in `computeDealt` (combat.ts:174-178) — removes armor from the defender before damage calculation, permanently for the combat exchange. Sources:
- Enemy: `classifyEnemy` tags `"shred_armor_on_hit"` from ability text (enemies.ts:94-100)
- Player units: `applyTacticianCombatMods` for The Breaker and The Bastion (tactician.ts:90-91)
- Gear: `GEAR_SHRED_ARMOR` constant (gear.ts:13)

This is correct armor *removal* (stat reduction), distinct from the `Penetration` keyword which bypasses armor. The CSV/rules "Shred" mechanic is fully wired despite having no Keywords.csv entry.

### Reveal
**Status: MATCHES (dual-use, both wired)**

"Reveal" means two different things in the engine, both implemented:
1. **Enemy Reveal abilities** (triggered on entry): dispatched via regex patterns in game.ts:2521+, gated by `revealPreventionCharges`.
2. **Scout reveal count** (enemies revealed per lane each round): `revealCount` variable (game.ts:2370) controls how many enemies per lane enter `game.revealedEnemyNames`.

These are separate subsystems sharing the word "Reveal" — consistent with the audit's finding that it's an undefined keyword (it covers two mechanics, not one).

### Attacks 1st / Initiative
**Status: MATCHES**

`attacksFirst` field on `Combatant` (combat.ts:24). Enemies tagged `"attacks_first"` when passive includes `"always hits 1st"` (enemies.ts:102). Player units tagged from text `"attacks 1st"` or `"attacks before enemies"` (units.ts:52). Fully wired in `resolveLaneCombat` (combat.ts:471, 488). The audit finding that "Haste" is defined in Keywords.csv but no card uses that name is confirmed — cards say "Attacks 1st" and the engine matches that string, bypassing "Haste" entirely.

### Retire
**Status: MATCHES**

`runRetireFromDuty` called each round (game.ts:1047). Stats track `unitsRetired` (types.ts:223) and `retiresThisRound` (types.ts:285). `retireGivesNoResource` is a persistent flag (types.ts:341).

### Overrun Tracker
**Status: MATCHES**

Fully separate from Progress Track. Fields on `GameState` (types.ts:181-184): `overrunTracker`, `overrunTrackerMax` (hardcoded 20), `overrunTrackerMin` (0), `overrunDropsBySeat`. Decremented on lane overruns (game.ts:1194-1196). Starting values by difficulty: Easy=15, Normal=10, Hard=5 (constants.ts:44). Distinct from `playerProgress` and `enemyProgress`.

---

## 2. Missing Card Counts — Engine Visibility

**Status: GAP across all card types**

Cards are loaded in `data.ts:128-142` via `loadCsv()`. There are **no count checks, assertions, or warnings** anywhere in the engine. The engine runs silently with whatever the CSV contains.

| Card Type | CSV Count | Expected | Engine Sees | Impact |
|-----------|-----------|----------|-------------|--------|
| Command Cards | 55 | 61 | 55 | 6 cards never in any hand |
| Tactician Cards | 17 | 18 | 17 | 1 role never assigned |
| Event Cards | 35 | 40 | **32** | 3 additional events filtered out at runtime (see below) |
| Enemy Stats | 92 | 93 | 92 | 1 enemy never spawned |
| Secret Objective Cards | 40 | 41 | 40 | 1 objective never assigned |

**Additional Event filtering:** Three events are explicitly excluded from the deck when it reshuffles (game.ts:627): `"Forced Disposal"`, `"Crowded Worksite"`, and `"Prove your worth"`. These cards are in the CSV but the engine actively removes them. The effective event pool during play is **32 cards**, not the 35 in the file or the 40 expected by the design.

---

## 3. Duplicate Cards — Engine Differentiation

**Status: ENGINE BUG (CSV-origin) for all three pairs**

The engine dispatches all unit/enemy effects via text-regex matching on the card's ability text. Since the duplicate cards have identical text, the engine produces identical results for both.

| Pair | Type | CSV Issue | Engine Result |
|------|------|-----------|---------------|
| RDMP "Glass" / RDMP "Impailer" | Unit / Sergeant Mech | Identical stats AND identical Main/Bonus Effect text | Engine cannot distinguish — both dispatch identically |
| Hovercraft / Hover Tank | Unit / Sergeant Vehicle | Identical stats AND identical Main Effect, both blank Bonus | Engine cannot distinguish |
| Light Tank / Heavy Tank | Enemy / Advanced Mechanised | Identical stats AND identical Reveal ("Double this units HP"), both blank Passive | `game.ts:2851` regex fires identically for both |

These are CSV-origin defects. The engine is working as designed; it just has two physical cards that are truly the same card. Fixing requires differentiating the cards in the CSV first, then the engine will automatically dispatch them differently via its text-matching rules.

---

## 4. Tactician "Resource" Column

**Status: SILENT GAP**

The `Resource` column is loaded from the CSV and stored on `TacticianCard` (data.ts interface). It is **never read** anywhere in the engine — not in `tactician.ts`, `decisions.ts`, `planningActions.ts`, or `game.ts`. The column's contents (discount/bonus abilities like "Weapons cost 1 less of your choice, 1st weapon purchase per round is free") are entirely ignored.

Some of these abilities have been implemented via other paths (e.g., The Gunsmith's weapon discount is wired through `applyTacticianShopDiscount` in tactician.ts), but several are not covered:
- **The Tactician**: "effects on command cards are free for the 1st card per turn" — no implementation found
- Some others may or may not be wired separately; a full per-tactician cross-check would be needed

The column header "Resource" is wrong (it holds ability text, not Organic/Tech/Alien). Because the engine never reads it, the wrong header causes no runtime bug — but any future code that tried to use `.Resource` as a resource type label would break.

---

## 5. Deployable Shield

**Status: MATCHES**

`gear.ts:19` puts `"Deployable Shield": 10` in `GEAR_PRECOMBAT_SHIELD`. Applied pre-combat via `gear.ts:110-111`: `if (name in GEAR_PRECOMBAT_SHIELD) grantShields(ui, GEAR_PRECOMBAT_SHIELD[name], p)`. Unit gets 10 shields before each round's combat. The CSV has blank Passive and Active text but the engine has a hardcoded implementation that correctly reflects the card's intent.

---

## 6. Countermeasures (Command Card — Truncated Passive Text)

**Status: MATCHES**

The truncated CSV passive ("on a 6" with no consequence) is irrelevant — the engine does not parse it. Fully custom hardcoded implementation:
- **Passive** (game.ts:983-990): Rolls two D4s when built. One picks a lane, one sets `game.laneAbilityPreventions` — the number of abilities that can be prevented in that lane this round.
- **Active** (commandCards.ts:171-177): Sets `game.laneAbilitiesFullySuppressed.add(seat)` (full suppression in chosen lane) and `game.destroyNextActivatedCard = true`.

The "on a 6" text is dead content as far as the engine is concerned. The working implementation is separate from and supersedes it.

---

## 7. Light Tank (Unit, Captain) — No Effects

**Status: MATCHES (correctly empty)**

Light Tank (Vehicle / Captain) has empty Main Effect and Bonus Effect in the CSV. `classifyUnit` in `units.ts` returns an empty tag set. `applyUnitCombatMods` applies no modifiers. The card operates on its raw stats only (Damage, HP, Armor, Shields). Engine correctly handles the empty card. The defect is in the CSV design, not the engine.

---

## 8. Heavy Tank (Unit, Major) — "Has X Shields and Armor" Placeholder

**Status: GAP**

Bonus Effect = `"Has X Shields and Armor"`. No keyword regex in `units.ts` matches this text. No hardcoded special case exists for Heavy Tank by name. The engine ignores the Bonus Effect entirely — the unit operates on its base stat columns (Damage:7, HP:9, Armor:5, Shields:27). The intended "bonus Shields and Armor" from the text is never applied. The engine reads the numeric stat columns directly, so the 27 Shields and 5 Armor *are* applied (those are in the stat columns), but the Bonus Effect as a *description* is a stale placeholder. This is not a runtime bug but the card text is wrong.

---

## 9. Armor Minimum-1 Rule

**Status: MATCHES**

`combat.ts:193`:
```typescript
let dealt = raw > 0 ? Math.max(1, raw - effectiveArmor) : 0;
```
When `raw > 0` (damage gets past shields), minimum dealt is 1. When `raw == 0` (fully absorbed by shields), dealt is 0 — the minimum-1 does not apply to shield-absorbed attacks. This correctly implements "minimum 1 damage always gets through Armor." The contradiction between this rule and the Plate Host design note ("1 − 1 Armor = 0 net") is in the rules documents only — the engine enforces minimum-1 consistently.

---

## 10. Gear Equip Timing

**Status: ENGINE BUG**

The rules have a conflict: Deployment Stage says equip "before combat," Anytime Actions says "any time." The engine's current state is:

- Gear equipping happens via `buyGearMutation` → `equipGearOntoActiveMutation` in `planningActions.ts` (planning phase only).
- There is **no in-combat gear equip action path** in the engine.
- `armedAndReadySeats` (types.ts:555-556) is a flag that grants a free mid-combat equip — set by a mission instant in `missions.ts:538-541` — but **is never read anywhere in the engine**. The flag is set, stored in state, and silently discarded each round.

The mission that grants `armedAndReadySeats` (likely an "Armed and Ready" card) fires its effect with no actual consequence — the equip never happens. This is an ENGINE BUG: a mission instant that does nothing.

---

## 11. Round 0

**Status: ENGINE BUG (mission draw not skipped)**

Round 0 is correctly identified via `isPrepRound = game.roundNum === 0` (game.ts:465).

| Sub-step | Skipped in Round 0? | Code Location |
|----------|---------------------|---------------|
| Boss Roll | ✅ Skipped | game.ts:480-481 |
| Event draw | ✅ Skipped | game.ts:626 |
| Combat Stage | ✅ Skipped | game.ts:1129-1133 |
| Event Resolution | ✅ Skipped | game.ts:1236-1238 |
| Promotions | ✅ Skipped | game.ts:1236-1238 |
| **Mission Assignment** | ❌ **NOT skipped** | game.ts:714-729 — no `isPrepRound` guard |

Players draw mission cards during Round 0. If the design intent is that missions are only dealt from Round 1 onward, this is an engine bug. Players start the game with setup missions (dealt at init) and then draw again in Round 0, potentially exhausting the mission deck earlier than intended.

---

## 12. Scout / Reveal Count Baseline

**Status: ENGINE BUG (or rules discrepancy to resolve)**

`game.ts:2370`:
```typescript
let revealCount = 2 + (game.nightVisionRevealBonus ?? 0) + game.permanentScoutRevealBonus;
```

The baseline is **2** whether or not a scout unit is assigned. When the scout pool is empty, the engine logs "scout pool empty — baseline reveal of 2 only, no income" and proceeds with `revealCount = 2`.

The rules audit found a conflict: the no-scout baseline text says "1 enemy card" while the "default" scouting text says "2 enemies by default." The engine resolves this by always using 2. If the intended no-scout baseline is 1, the engine over-reveals by 1 enemy per lane every round when no scout is deployed.

**Action required:** Decide which rule is correct (1 or 2 when no scout assigned) and either update the rules docs or change the engine constant.

---

## 13. The Pathfinder and The Quartermaster

### The Pathfinder
**Status: MATCHES — not deferred as memory suggested**

The memory file flagged Pathfinder as deferred pending a reveal system. The actual engine has it fully wired:
- **Passive** (tactician.ts:54-56): `tacticianBypassesRankCheck` flag bypasses rank check for Scout-type units during purchase. Called from `planningActions.ts`.
- **Active** (tactician.ts:433-439): `game.revealPreventionCharges += 2`. Prevention charges consumed at game.ts:2526-2534.

Both passive and active are wired end-to-end. The memory is stale on this item.

### The Quartermaster
**Status: DEFERRED (active only)**

- **Passive** (tactician.ts:40-48): Wired. `tacticianDiscountedCost` checks `quartermasterRolledShopGear` / `quartermasterRolledShopUnits` to identify direct-fill slots and applies -1 cost. State tracking exists (types.ts:299-304) and resets each round.
- **Active** (tactician.ts:442-446): The switch case exists but is a comment placeholder: *"Active handled during the planning phase (planning loop in decisions.ts calls `quartermasterRerollMutation` when roll-filled gear is below player rank)."* Whether `quartermasterRerollMutation` is actually called in `decisions.ts` is unconfirmed from this audit.

---

## 14. Boss Targeting Column

**Status: SILENT GAP — all targeting types ignored**

`bosses.ts` does not read `bossCard.Targeting` anywhere. All bosses use the same targeting logic regardless of their Targeting column value:
```typescript
const designated = game.players.filter((p) => hasEquipped(p, "Laser Designator"));
const eligible = game.players.filter((p) => !hasEquipped(p, "Smoke Launcher"));
const pool = designated.length ? designated : eligible.length ? eligible : game.players;
const target = pool[Math.floor(Math.random() * pool.length)];
```

This is random selection from the eligible pool (modified only by Laser Designator and Smoke Launcher gear). The following targeting types all silently resolve the same way:

| Boss | Targeting Column | Actual Engine Behavior |
|------|-----------------|----------------------|
| Null Engineer | Roll | Random from eligible pool |
| The Balance | Roll | Random from eligible pool |
| Plate Host | Roll | Random from eligible pool |
| Dread Echo | Roll | Random from eligible pool |
| Shadow Fiend | Low HP | Random from eligible pool |
| Skinwalkers | Low HP | Random from eligible pool |
| Wreathing Mass | High HP | Random from eligible pool |
| Phantom | Most Shields lost | Random from eligible pool |
| High Praetor | Most Armor lost | Random from eligible pool |
| Zeus | Tech Cost | Random from eligible pool |
| Cerberus | High HP | Random from eligible pool |
| Null Engineer | Most Gear | Random from eligible pool |
| Undeath | High Damage | Random from eligible pool |
| Soul Harvester | Least Gear | Random from eligible pool |
| Aegis Eater | Highest Shield | Random from eligible pool |

All 15 bosses effectively use "Roll" targeting, regardless of the column. The strategic differentiation intended by boss targeting (e.g., Phantom targeting the player who lost the most shields) does not exist in the engine.

---

## 15. Types Defined in types.ts

For reference — the complete internal model of the game:

| Type | Description |
|------|-------------|
| `ResourcePool` | `{ Organic, Tech, Alien: number }` |
| `UnitInstance` | Deployed unit: id, card ref, maxHp, curHp, curShields, equipped gear array, charges, per-round flags |
| `GamePlayer` | Per-player state: rank, resources, active unit, reserve, bench, medBay, laneEnemies, command hand, gear hand, graveyard, missions, secret objectives, tactician, 50+ one-shot effect flags, 25+ cumulative stats |
| `GameSettings` | `{ difficulty: Difficulty }` |
| `GameLogEntry` | `{ round: number; text: string }` |
| `GameStatus` | `"running" | "won" | "lost"` |
| `BossActive` | Active boss: card ref, hpCur, tierReached, dmgBonus, shieldBonus, armorBonus, healsOnKill |
| `GameState` | Full board state: 140+ fields — all shared decks, progress tracks, event state, overrun tracker, containment pool, per-round kill/death/retire maps, per-round suppression sets, multi-round carry-over flags |

Card types (`UnitCard`, `EnemyCard`, `GearCard`, etc.) are defined in `data.ts` as plain interfaces matching CSV column names exactly.

---

## Consolidated Engine Status

### Engine Bugs (Active Defects)

| # | Bug | Location | Impact |
|---|-----|----------|--------|
| **E1** | Duplicate cards indistinguishable in engine | units.ts, enemies.ts, combat.ts | RDMP "Glass"/"Impailer", Hovercraft/"Hover Tank", enemy Light/Heavy Tank all play identically |
| **E2** | `armedAndReadySeats` flag set but never consumed | missions.ts:538-541 (set), nowhere (read) | Mission instant that grants mid-combat equip does nothing |
| **E3** | Mission Assignment runs on Round 0 | game.ts:714-729 | Players draw missions in the prep round, not just at setup |
| **E4** | Scout baseline is 2 even with no scout assigned | game.ts:2370 | Rules say 1 when no scout; engine uses 2 — one extra reveal per lane per round when scouting is not set up |

### Silent Gaps (Data Ignored, No Error)

| # | Gap | Location | Impact |
|---|-----|----------|--------|
| **G1** | No card count validation for any deck | data.ts | Missing cards (6 command, 5 events, 1 tactician, 1 enemy, 1 SO) are invisible |
| **G2** | Tactician `Resource` column never read | tactician.ts, decisions.ts | Some tactician abilities (especially The Tactician's command card cost reduction) may be absent |
| **G3** | Boss `Targeting` column never read | bosses.ts | All 15 bosses target randomly; designed targeting behaviors don't exist |
| **G4** | 3 event cards filtered out at runtime | game.ts:627 | Forced Disposal, Crowded Worksite, Prove your worth are in CSV but excluded from play |

### Correctly Implemented (No Action Needed)

| # | Item |
|---|------|
| C1 | Shred (armor removal) — `shredArmor` field, full pipeline |
| C2 | Reveal (both: enemy ability trigger and scout reveal count) |
| C3 | Attacks 1st / initiative — `attacksFirst` field, wired in combat |
| C4 | Retire — `runRetireFromDuty`, stats tracked |
| C5 | Overrun Tracker — separate from Progress Track, own state fields |
| C6 | Deployable Shield — hardcoded 10-shield precombat via `GEAR_PRECOMBAT_SHIELD` |
| C7 | Countermeasures — hardcoded implementation, ignores truncated CSV text |
| C8 | Light Tank (unit) — correctly dispatches no abilities (empty CSV) |
| C9 | Armor minimum-1 — `Math.max(1, raw - effectiveArmor)` when `raw > 0` |
| C10 | Pathfinder — both passive and active fully wired (memory was stale) |
| C11 | Overrun-on-Round-0 skipped — `isPrepRound` guards on Boss Roll, Event, Combat, Cleanup sub-steps |

### Deferred (Acknowledged, Not Yet Implemented)

| # | Item |
|---|------|
| D1 | Quartermaster active — comment says it delegates to decisions.ts; confirm `quartermasterRerollMutation` is wired |

---

## Priority Action List

**Fix first (engine bugs that affect gameplay correctness):**

1. **E2 — armedAndReadySeats never consumed.** Find where this flag is supposed to grant a free equip and wire the consumption. Currently a mission instant fires with zero effect.
2. **E3 — Mission draw on Round 0.** Add `if (!isPrepRound)` guard to the mission assignment block at game.ts:714-729, consistent with how event draw, combat, and cleanup are already guarded.
3. **E4 — Scout baseline.** Decide: is the no-scout reveal count 1 or 2? Update either the rules docs or `game.ts:2370` to match. Currently the engine uses 2 unconditionally.
4. **E1 — Duplicate cards.** Fix the CSV first (differentiate RDMP "Glass"/"Impailer", Hovercraft/"Hover Tank", enemy Light/Heavy Tank), then verify the engine dispatches them differently via its text-matching rules.

**Fix next (silent gaps that limit game fidelity):**

5. **G3 — Boss targeting.** Implement boss targeting dispatch in `bosses.ts` — read `bossCard.Targeting` and select accordingly (Low HP, High HP, Most Gear, etc.). 15 bosses currently all behave identically strategically.
6. **G2 — Tactician Resource column.** Audit all 17 tacticians: check whether each Resource-column ability is implemented elsewhere. Add any missing ones. Rename the column header to "Resource Bonus" to reflect actual content.
7. **G4 — Filtered events.** Decide whether Forced Disposal, Crowded Worksite, Prove your worth are intentionally excluded. If so, remove them from the CSV. If not, fix whatever caused them to be filtered and remove the exclusion at game.ts:627.
8. **G1 — Count validation.** Add startup validation in data.ts that warns (or throws) when a loaded deck doesn't match expected counts. This would have caught all five count gaps immediately.

**Fix when CSV is updated:**

9. **Heavy Tank placeholder text** — once the CSV uses real numbers instead of "X", the engine will pick them up automatically (stat columns are read directly; only the Bonus Effect text fails to dispatch).
10. **Light Tank empty effects** — once the CSV has an effect, the engine will classify and dispatch it automatically.
