# Board Game — Full Data Audit Report
*Generated 2026-06-30. All findings are from direct file reads — no assumptions.*

---

## Executive Summary

| File | Status | Notes |
|------|--------|-------|
| Unit Stats.csv | ⚠️ Issues | 103 cards ✓, 2 full duplicate cards, 3 near-duplicates, multiple typos |
| Enemy Stats.csv | ❌ Count Wrong | 92 cards (expected 93), identical Light Tank / Heavy Tank, balance inversions |
| Boss Stats.csv | ⚠️ Issues | 15 bosses ✓, Wreathing Mass DMG=0, Dread Echo T2 inconsistency, trailing commas |
| Gear Stats.csv | ❌ Cost Errors | 68 cards ✓, Exosuit and Repair Kit cost entries look like data entry errors |
| Keywords.csv | ⚠️ Gaps | 38 keywords ✓, but **Shred, Reveal, AOE, Attacks 1st** are all used widely with no definition |
| Command Cards.csv | ❌ Count Wrong | **55 cards (expected 61) — 6 missing**, truncated passive on Countermeasures |
| Tactician Cards.csv | ❌ Count + Schema | **17 tacticians (expected 18) — 1 missing**, Resource column header is wrong |
| Mission Cards.csv | ⚠️ Issues | 117 cards ✓, Full Export 5/6 identical, reward scaling gaps at Colonel/Specialist/Brigadier |
| Secret Objective Cards.csv | ❌ Count Wrong | **40 cards (expected 41) — 1 missing**, Dictator = Leader win condition |
| Event Cards.csv | ❌ Count Wrong | **35 cards (expected 40) — 5 missing**, multiple ambiguous/unquantified conditions |
| Location Actions.csv | ⚠️ Issues | No header row, "X" capacity undefined, Medical Bay healing mechanic missing detail |
| Rules.docx | ❌ Conflicts | Armor minimum-1 contradicts Plate Host design note; Reorg has broken cross-references |

**Card count shortfalls across all files:** 6 Command Cards + 1 Tactician + 1 Enemy + 1 Secret Objective + 5 Events = **14 cards missing from the project entirely.**

---

## Cross-Cutting Issues (Affects All Files)

These problems appear in multiple CSVs and both rules documents simultaneously.

### Missing Keywords — Used Everywhere, Defined Nowhere

The following mechanics are referenced across 5+ card types but have **no entry in Keywords.csv**:

| Missing Keyword | Used In |
|-----------------|---------|
| **Shred** | Gear (Chem Strike, Explosive Rounds), Enemy (Spitters, Dragon, Shatter Cannon), Mission (Sundering Blow), Tactician (The Breaker, The Bastion), Unit text |
| **Reveal / Revealed** | Gear (Night Vision), Unit (RDMP "Spotter", Python, AMP "Surveyor"), Enemy (multiple), Command Cards (9 cards), Tactician (Driver, Recruiter, Pilot, Pathfinder, Chessmaster) |
| **Overrun Tracker** | Gear (Last Stand Beacon), Enemy (Tunnler passive), Mission (Breach, Collapse), Secret Objective (Misdirector, Trojan, Deus Machina), Rules docs |
| **Retire** | Mission (Honorable Discharge, Just a Flesh Wound, War Hero), Event (Honorable Discharge), Secret Objective (Exporter) |
| **Overrun** (as an action) | Mission (multiple), Secret Objective (6 cards), Rules docs |
| **Promote / Commander** | Mission (Assume Command, Steady Hand), Event (Leadership Crisis, Chain of Command), Secret Objective (Dictator, Leader, Advisor, Incompetence, Tactician) |
| **Attacks 1st** | Unit (AMP "Volt", AMP "Wolf", MCP "Hound", Battle Buggy, MG Quad, Flac Truck, others) — "Haste" is the defined keyword but no card uses that word |

**Existing Keywords in Keywords.csv that no card actually uses by name:** Banish, Spawns. Lifesteal, Multistrike, Damage Over Time, and Haste are all present in the file but the matching cards use different phrasing instead of the keyword name — making these entries unused.

---

## Unit Stats.csv

### Card Count
103 confirmed. ✓

### Fully Duplicate Cards (Identical Stats AND Abilities)
Both pairs need differentiation — one of each is currently a duplicate card with a different name.

| Card A | Card B | Rank / Type |
|--------|--------|-------------|
| RDMP "Glass" | RDMP "Impailer" | Sergeant / Mech — same stats, same Long Range + Penetration effect |
| Hovercraft | Hover Tank | Sergeant / Vehicle — same stats, same Mobile effect |

### Near-Duplicate Cards (Same Stats, Minor Ability Difference)
These may be intentional but should be reviewed:
- **APC / Heavy APC** (Major / Vehicle): identical stats, only differ in Bonus Effect shield grant (10 vs 15)
- **Battle Buggy / MG Quad** (Major / Vehicle): identical stats, "Attacks before enemies" on both
- **Recon Bike / ATV** (Major / Vehicle Scout): identical stats, different bonus abilities

### Missing / Incomplete Cards
- **Light Tank** (Captain / Vehicle): both Main Effect and Bonus Effects are **completely blank** — the only Captain+ unit with no abilities at all.
- **Heavy Tank** (Major / Vehicle): Bonus Effect reads "Has **X** Shields and Armor" — stat columns show 27 Shields / 5 Armor, but the card text uses a placeholder "X." Either the text needs the real numbers, or the columns should not be populated.

### Typos in Card Names
| Wrong | Correct |
|-------|---------|
| Flac Truck | Flak Truck |
| RDMP "Impailer" | RDMP "Impaler" |
| MCP B2 "Balista" | MCP B2 "Ballista" |

### Other Anomalies
- **Saboteur Cell** (Infantry Scout / Major) is placed at the very end of the file, after all Brigadier cards — out of rank order.
- **RDMP "Mother"** and **"Python"** have malformed multi-line cells using `/` as an in-cell separator. This breaks standard CSV parsing.
- **Toxin Tank** Main Effect: "cannot **active** abilities" — should be "activate."
- **AMP "Surveyor"** Bonus Effect says "effects" instead of "abilities" (inconsistent with all other cards).
- **Scout** (row 38, Infantry Scout / Sergeant): Organic Scout = 0 — unique among all Infantry Scouts.
- **"Python"** (Brigadier): Organic Scout = 55 — highest scout cost by 14 points over the next highest.
- **Stubborn Recruit** (Private): Shields = 7 — far above every other Private (next highest is 4).

---

## Enemy Stats.csv

### Card Count
**92 cards found. Expected 93. One card is missing.** No stub/placeholder row exists — the card is simply absent. The Advanced tier (35 cards) is the most populated and the most likely source of the gap.

### Duplicate Cards
- **Light Tank / Heavy Tank** (both Advanced / Mechanised): identical stats (DMG=11, HP=20, Armor=4, Shields=20), identical Reveal ("Double this unit's HP"), both have blank Passives. These are the same card with different names. Heavy Tank needs distinct stats or a Passive to differentiate.

### Balance Issues
| Issue | Card | Detail |
|-------|------|--------|
| Damage exceeds all Conquerors | **Ruin** (General / Experimental) | DMG=25 — higher than every Conqueror card's damage (Conqueror max is 22). Likely a balance error. |
| General weaker than Conqueror | **Oracle** (General / Drones) | HP=13, DMG=11 — weaker than Shadow Sower (Conqueror / Drones, HP=15, DMG=14). Rank inversion. |
| General HP bleeds into Conqueror range | **Soul eater / Plague** (General) | HP=47 — exceeds 6 of 11 Conqueror cards. The General/Conqueror HP boundary is soft. |
| Weakest Conqueror | **Shadow Sower** (Conqueror / Drones) | HP=15, DMG=14 — far below the Conqueror average. May be intentional (utility passive), but is a marked outlier. |

### Keyword Issues
- **"Shred"** used in Spitters, Dragon, Shatter Cannon, and multiple reveal texts — not in Keywords.csv.
- **"Pierce"** used in 3 passives (Lancer, Eye Drones, Knights) — the formal keyword is "Penetration."
- **"Overrun Tracker"** referenced in Tunnler passive — not in Keywords.csv.

### Typos
`Emmiter` → Emitter | `Tunnler` → Tunneler | `upto` (×3) | `eachother` → each other | `gainst` → gains (High Praetor) | `Delets on Kill` → Deletes on Kill | `Cannot be target` → targeted | `Heal 10 kill` → Heal 10 on kill (Boss Stats, The Culling T3)

---

## Boss Stats.csv

### Card Count
15 bosses × 5 tiers. All 75 cells populated. ✓

### Stat / Progression Issues
- **Wreathing Mass**: Base Damage = 0 — only boss with zero base damage. Its passive absorbs stats from absorbed units, so this may be intentional, but needs explicit confirmation.
- **Undeath**: Base Damage = 2 — every other boss (excluding Wreathing Mass) has Damage = 5. Possibly intentional given its revival passive.
- **Dread Echo T2**: "+10 Attack" — every other boss gives "+5 Attack" at T2. This doubles Dread Echo's damage jump relative to all peers.
- **Plasma Channeler and Aegis Eater T4**: Give "+20 Shields" (not "+20 Health" like all others).
- **Rust Elemental and Plate Host T4**: Give "+3 Armor" (not "+20 Health" like all others).
  - The shield/armor T4 variants appear thematically intentional but break the standard T4 template.

### Trailing Commas — Possibly Truncated Content
Three T2 cells end with a trailing comma, suggesting content was deleted:
- Lightning Wisp T2: `"+5 Attack, Gear costs +1 more to equip this round,"`
- Null Engineer T2: `"+5 Attack, Gear effects cost +1 Tech more to activate,"`
- The Culling T2: `"+5 Attack, Heal 3 on kill,"`

### Undefined Mechanic
- **"Roll" targeting**: Used by Null Engineer, The Balance, Plate Host, and Dread Echo. No definition of which die to roll or how the result maps to a lane exists anywhere in either rules document or the CSV.

---

## Gear Stats.csv

### Card Count
68 confirmed. ✓

### High-Priority Cost Errors (Likely Data Entry)
| Card | Problem |
|------|---------|
| **Exosuit** (Brigadier / Armor) | Tech Cost = **11** — all other Brigadier cards cost 16–24 Tech. This is below the Specialist range. Likely should be 21. |
| **Repair Kit** (Colonel / Utility) | Organic=10, Tech=**20** — more expensive than Colonel Experimental cards (which cost Organic=9, Tech=18). No utility card should exceed Experimental pricing. |
| **Plasma Weapons** (Captain / Weapon) | Tech = **5** — below the Sergeant minimum. Captain weapons should be 7–8. |
| **Smoke Pack** (Conscript / Utility) | Restrictions = "**Vehicles and Mech only**" — every other Conscript card is "Infantry only." Smoke Pack's name and flavour suggest infantry equipment. |

### Missing Effect Text
- **Deployable Shield** (Sergeant / Utility): Passive and Active are **both blank** despite having Shields=10 in the stat column. The shields exist in the data but there is no text explaining the passive effect on the card.
- **Last Stand Beacon** and **Recon Satellite**: Restrictions field is blank — likely "Any" but inconsistent with all other cards that have a value.

### Other Issues
- **Reanimator** (Specialist / Experimental): Restrictions = "Enemy" — unique value, not consistent with any other restriction format ("Infantry only", "Vehicles and Mech only", "Any"). Meaning is ambiguous.
- **Stun Grenades**: Active adds "prevent active abilities until end of combat" on top of the Stun effect — this goes beyond the Stun keyword definition ("Skip a turn").
- **Prototype Weapons** (Sergeant): Passive references "rank of commander" as a multiplier — this stat has no defined resolution method in the CSV schema.
- **XVL3 vs XVL33**: Nearly identical names, different ranks. Naming could cause confusion at the table.
- **Basic Camo** (Private): Tech = 3 — 1 below all other Private cards. Minor but notable.

### Undefined Mechanics in Effect Text
`AOE` | `1v1` (Isolation Field active) | `Scout` (Scouting Drones active) | `Support` (Bomber Drone target) | `Rank damage` (Toxin Rounds) | `Shred` (Chem Strike, Explosive Rounds) | `Reveal` (Night Vision)

---

## Keywords.csv

### Count
38 keywords. All have non-blank definitions. No duplicates. ✓

### Gaps
The following are used as game terms across multiple CSVs but have no keyword entry:
- Shred, Reveal, Overrun Tracker, Attacks 1st, Retire, Promote, Overrun (action), Commander (role), Reserve (zone), Graveyard (zone), AOE, 1v1, Scout (action), Support (zone/position), Rank damage, Refresh

The following keywords ARE defined but are never used by that name on any card:
- Banish, Spawns, Haste, Lifesteal (cards use "on Kill Heal" phrasing), Multistrike (cards say "Hits Twice" or "attacks an additional time"), Damage Over Time (cards describe the effect in prose)

---

## Command Cards.csv

### Card Count
**55 cards found. Expected 61. Six cards are missing.** Per-building breakdown:

| Building | Count |
|----------|-------|
| Barracks | 10 |
| Armory | 8 |
| Containment Block | 9 |
| Medical Bay | 9 |
| Command | 9 |
| Battlefield | 10 |
| **Total** | **55** |

### Truncated Card Text
- **Countermeasures** (Containment Block): Passive ends mid-sentence — `"...prevent active abilities number of times in target lane = dice roll, on a 6"` — the consequence of rolling a 6 is missing.

### Ambiguous Card Text
- **Reinforcements** (Barracks): Active brings in 2 units but says "scrap it" (singular) for an item. Unclear whether each unit gets an item or only one item is distributed.
- **Combat Stims** (Containment Block): "double the damage deal" — does "deal" refer to the self-inflicted damage chosen, or the unit's stat? Phrasing is confusing.

### Other Issues
- File has a UTF-8 BOM — harmless if parsed with `utf-8-sig` but corrupts the first column header under plain `utf-8`.
- Medical Bay and Containment Block share identical cost profiles (8/3/3) with no differentiation.
- 5 card names use inconsistent casing: `Perfect information`, `Scouting update`, `We can Rebuild them`, `Whites of their eyes`, `Tranq rounds` — all others use Title Case.
- All Command building cards (9) have no Passive — implicit "Active-only" rule not captured in schema.

---

## Tactician Cards.csv

### Card Count
**17 tacticians found. Expected 18. One is missing.**

### Schema Error — Resource Column Mislabeled
The `Resource` column header implies it should contain `Organic`, `Tech`, or `Alien` as the tactician's resource specialty. It does not. It contains a **third ability text** describing a cost-reduction or purchasing bonus for every tactician. The column header needs to be renamed (e.g., "Resource Bonus" or "Shop Bonus"), and if a resource-type specialty was intended, that data is entirely absent from the file.

### Incomplete / Ambiguous Ability Text
- **The Gunsmith**: Passive = `"Weapons Equipment Gain +Progress damage"` — "+Progress damage" is undefined. Does damage scale with progress track position?
- **The Doctor**: Active uses "this unit" — ambiguous whether it refers to the dying unit or the Doctor's assigned unit.
- **The Tactician**: Passive says cards can be played "from anywhere" — location-access system makes this ambiguous without a definition.

### Deferred Mechanics (From Memory)
- **The Pathfinder**: Active depends on a reveal-tracking system not yet implemented in the engine.
- **The Quartermaster**: Passive and Active both depend on a roll-fill tracking mechanic not yet implemented.

---

## Mission Cards.csv

### Card Count
117 confirmed. ✓

### Identical Cards at Different Ranks
- **Full Export 5** (Major) and **Full Export 6** (Specialist): All three columns (Requirement, Resource, Instant) are **word-for-word identical**. A Specialist card should not have the same requirement as a Major card.
- **Balanced Contribution V** (Major) and **VI** (Specialist): Same Requirement (Donate 30 of each), only Instant differs. Requirement needs to scale.

### Reward Scaling Errors
| Card | Problem |
|------|---------|
| **Balanced Contribution IV** (Captain) | Reward = +10 All resources — Captain standard is +8. Only Captain mission with a Major-tier reward. |
| **Xenobiology Export 5** (Major) | Reward = +5 Alien — same as Export 4 (Captain). No scaling from Captain to Major. |
| **Balanced Contribution I** (Conscript) | Reward = +5 All resources — all other Conscript missions give +1. (May be intentional for high requirement cost.) |
| **Full Export 3** (Sergeant) and **4** (Captain) | Both give +10 — Export series runs ahead of the standard reward curve. |

### Series Gaps at High Ranks
The following mission series all stop at Major with no cards at Colonel, Specialist, or Brigadier:
Tech Donated, Organic Contribution, Xenobiology Delivered, Tech Export, Organic Export, Xenobiology Export. These are the ranks with the most resources to donate — the absence feels like an incomplete pass rather than a design choice.

### Ambiguous / Problematic Conditions
- **Mission Failure** (Conscript): Rewards deliberate event failure, then prevents the failure penalty. Allows an exploit where a player intentionally fails to complete the mission.
- **Giant Slayer** (Private): "Kill 2 units above your rank" — "above your rank" is ambiguous (enemy rank tier vs another player's rank?).
- **Crushing Advance** (Colonel): Requirement = "Trample Damage kills" — grammatical fragment. Missing the object.
- **Impenetrable** (Colonel): "Prevent all damage with armor" — unclear if this means all damage in a round or a single instance.

### Keyword Gaps in Missions
`Shred` (Sundering Blow) | `Refresh` (4 cards) | `Retire` (4 cards) | `Promote` (2 cards) | `Overrun` (3 cards) | `Commander` (4 cards) — none defined in Keywords.csv.

### Naming / Capitalization
- All `Organic export` cards use lowercase 'e' — every other Export series uses capital 'E'.
- `Just a flesh wound` uses sentence case — all other multi-word missions use Title Case.
- `Barracks Detail` Instant uses lowercase "barracks" — all other Detail cards capitalize the building name.
- `upto` (not a word) appears in Medical Emergency and Infantry Doctrine.

---

## Secret Objective Cards.csv

### Card Count
**40 cards found. Expected 41. One card is missing.**

### Alignment Distribution
| Alignment | Count |
|-----------|-------|
| Allied | 13 |
| Neutral | 13 |
| Saboteur | 10 |
| Chaos | 4 |

Chaos has only 4 cards — by far the thinnest pool. The missing 41st card most likely belongs here.

### Identical Win Conditions
- **Dictator** (Saboteur) and **Leader** (Allied) have the **exact same condition**: "Be commander for 5 turns." A Saboteur and an Allied player are competing for the same action with no mechanical differentiation between the two cards other than alignment label. If intentional, the rules need to address this explicitly.

### Undefined Threshold
- **Hunter** (Neutral): Condition = "Kill enemies with active abilities or items" — no numerical threshold. As written, this completes on the first qualifying kill. Every other kill-based objective specifies a count.

### Other Issues
- **Misdirector** (Saboteur): "Lanes you don't control **is** overrun" — should be "are."
- **Armorer** (Allied): "Equip 10 Gear to **allies lanes**" — should be "allies' lanes."
- **Kremlen** (Chaos): Almost certainly a misspelling of "Kremlin."
- **Deus Machina** (Chaos): Completes passively the moment the team would lose — requires no active play, and its effect benefits the whole team. Effectively plays itself.
- **Incompetence** vs **Trojan** (both Saboteur, both Overrun Tracker conditions): Incompetence is strictly harder (must be commander, threshold of 3 vs 5) with no compensating benefit.

---

## Event Cards.csv

### Card Count
**35 cards found. Expected 40. Five cards are missing.** No stubs or placeholder rows — these cards need to be authored.

### Ambiguous / Unplayable Conditions
| Card | Problem |
|------|---------|
| **Medical Focus** | Condition: "Empty/Full Hp med bay" — "Empty" and "Full HP" are opposite states. Genuinely ambiguous. |
| **Garbage Day** | Reward: "Ongoing effect" — zero specifics. What persists? Unplayable as written. |
| **Isolation Orders** | Reward: "Bonuses to resources when alone" / Penalty: "Penalty to resources when together" — no amounts, no resource types, no caps. |
| **Silence in no mans land** | "Only field 1 unit in reserve" — "field" means Active, not Reserve. Contradictory phrasing. |
| **Research Drive** | Round Effect: "Roll dice on when unit falls below half HP odds capture even kill" — syntactically broken sentence. |
| **Assigned Posts** | Penalty: "Effect persists after event" — this could be a reward or penalty depending on dice outcome. Column used incorrectly. |
| **Kill Contest** | "Single Unit gets 3 kills" — ambiguous whether multi-strike kills count as multiple. |

### Near-Duplicate Events
- **Restriction Orders** and **Fuel Shortage**: Both have identical Round Effects ("Active Non Infantry are stunned at start of combat"). They differ only in Completion Condition and reward type.

### No Dice-to-Location Mapping
Four events roll dice to select a location (Assigned Posts, Saboteur investigation, Capacity Threshold, Isolation Orders). No location-number mapping exists anywhere in either rules document or Location Actions.csv.

### Typos
`Increse` (×3, in Tax Fault, Cheap Knockoffs, Food Shortage) | `equiped` (×4, in Armor/Utility/Weapons Recall, Total Disarmament) | `requirments` (Saboteur investigation) | `Saboteur investigation` (lowercase 'i') | `Combined Arms Training` penalty: `"Lose +4 Shields"` — plus sign makes no sense in a penalty context.

---

## Location Actions.csv

### Schema
No header row — first row is `Board` as a document label, not a column header. A header row of `Location, Slot/Action, Capacity, Description` should be added.

### Capacity Values — Undefined
Three distinct capacity markers are used with no legend anywhere in the file:
- **Integer** (e.g., 4) — fixed slot count
- **NA** — slot exists but is locked until a Command Card upgrade is built
- **X** — unlimited or variable. No definition of what X means.

### Undefined References in Descriptions
- **Armory — Experimental Deck**: "Add **these** to deck when upgrade enabled" — "these" has no antecedent in a standalone row.
- **Barracks — Vehicles / Mech**: Same "Add these to deck" problem.
- **Containment Block — Cell**: "last kill of round can be stored here for **bonuses**" — no bonuses are defined in this file.
- **Medical Bay — Medical**: "Heals Units Wounded in Combat" — no mechanism, rate, or cost. The most minimal description in the file.
- **Battlefield — Take Lead**: The relationship between Take Lead and the Resource row above it is undefined — is it a triggered bonus or a separate action?

### Missing Locations
- **Research Lab**: Referenced in the audit prompt as an expected location. Does not appear anywhere in Location Actions.csv or any other CSV. Either planned-but-never-added or cleanly removed (no dangling references found).

### Other
- **Overrun Tracker** is mentioned in the Battlefield → Progress Track description but is not defined as a location or slot anywhere.
- Battlefield has 11 entries mixing "zone definitions" and "player actions" in the same schema with no type differentiation.

---

## Rules Documents (Rules.docx / Board_Rules_Reorganized.docx)

### Confirmed Conflicts

#### Present in Both Documents
1. **Armor minimum-1 vs Plate Host design note**: The keyword glossary says "minimum 1 damage always gets through" against Armor. The Plate Host design note treats 1 damage − 1 Armor = 0. These directly contradict each other. The same text appears identically in both files.

2. **"Clearing the shop" placement**: The rule says it happens "During Cleanup Stage" but it is placed structurally inside the Planning Stage → Purchasing subsection in both documents. New readers following section order will be confused about when this happens.

3. **Round 0 gaps**: Round 0 says to skip the Event-draw step. It does not address whether the Boss Roll or Mission Assignment also happen in Round 0. A Boss spawning in Round 0 has no Combat Stage to fight in.

4. **Gear equip timing conflict**: Manage Equipment (Deployment Stage) says equip "before combat." Gear Usage (Anytime Actions) says equip "any time." Neither document reconciles these — it is ambiguous whether gear can be equipped mid-combat.

5. **Scout baseline (no scout assigned) vs default reveal count**: No-scout baseline = "1 enemy card revealed." Default reveal = "2 enemies each round (raised from 1 after a playtest)." Unclear whether "2 by default" applies when no scout unit is assigned at all.

6. **Exceptions section contains 2 unresolved questions**: "Can player progress go below 0 from overruns?" and "Can the commander target themselves with Promotion?" — both explicitly flagged but neither answered anywhere in either document.

#### Present Only in Board_Rules_Reorganized.docx
7. **Broken cross-reference**: Key Terms entry for "Tier (Boss)" says "See 3.3 Boss Tier Escalation." Section 3.3 is titled "3.3 Combat Stage" — Boss Tier Escalation does not exist as a subsection.

8. **Stale changelog entry (Section 8.4)**: Says "clarified that the lost progress applies to the PLAYER progress track specifically." Current rules say the opposite — overruns do NOT affect the player progress track. The changelog entry reads as if the current rule says overruns cost player progress.

9. **Section 1.2 Quick Start inaccuracy**: "Lose any lane and the enemy gains ground instead." The enemy Progress Track advances +1 every round from Round 2 regardless of lane outcome. Losing a lane damages the Overrun Tracker, not the enemy progress rate. This sentence is factually incorrect as a description of the current mechanics.

10. **Medical Bay and Containment Block slot/unlock info dropped**: Rules.docx specifies that Medical Bay has 2 slots available from start and 2 locked until "Share Rooms" is built; Containment Block starts with 0 slots locked until "Containment Protocol" is built. Reorg omits all of this from both location sections.

### Undefined Terms in Rules

| Term | Gap |
|------|-----|
| Primary / Secondary Ability | Referenced in Key Terms (Ability Activation) but never defined. Unit cards use "Main Effect" and "Bonus Effects" — no document equates these. |
| How purchased units enter a lane | No rule describes where a purchased unit goes (hand, directly to reserve?), or when/how a unit is "deployed" for the first time. "Rank required to deploy" is on every unit card but "deploying" has no rules definition. |
| Secondary win condition resolution | Players have Secret Objective cards representing personal win conditions. Neither document defines what happens when one completes while the team is losing, or how outcomes are declared. |
| "Consumed" (Containment Block) | Containment Block says "Consumed units are removed from play entirely" but no action is ever named "consume." |
| "Exhausted Commands" (Battlefield slot) | Listed as a slot. What moves a card there and when cards cycle back is unexplained. |
| Graveyard procedure | Listed as a location. Duration, retrieval, and procedure are not described. |
| Resources split at Command | "Resources of your choice equal to your rank per worker" — unclear if each worker grants Rank-amount of one resource or can be split across resources. |
| Retire from Duty refund | "One of their 3 resources refunded" — unclear whether this means 1 unit of one chosen resource type or the full original cost of one resource component. |

### Orphaned References (Named but Not Defined Anywhere)
- `Playtest Log #31` — cited in Rules.docx Round 0 section. No log is attached to either document.
- `Share Rooms` Command Card — named in Rules.docx Medical Bay as the unlock card. No card content exists anywhere.
- `Containment Protocol` Command Card — named in Rules.docx Containment Block. Same issue.
- `Vehicle Bay`, `Mech Station`, `Combined Arms`, `Experimental Science` Command Cards — named as unlock conditions in Barracks/Armory. No card content exists.
- `Restriction Orders` — named as an example in the Enemy Type section ("Restriction Orders affects Infantry specifically"). Never defined or described elsewhere.
- `Commander Token` — listed in game components. Its use is never described in the rules body.

---

## Consolidated Issue List by Priority

### Must Fix — Broken or Missing

| # | File | Issue |
|---|------|-------|
| 1 | Command Cards.csv | **6 cards missing** (55 found, 61 expected) |
| 2 | Event Cards.csv | **5 cards missing** (35 found, 40 expected) |
| 3 | Secret Objective Cards.csv | **1 card missing** (40 found, 41 expected) — Chaos most likely candidate |
| 4 | Tactician Cards.csv | **1 tactician missing** (17 found, 18 expected) |
| 5 | Enemy Stats.csv | **1 enemy missing** (92 found, 93 expected) |
| 6 | Tactician Cards.csv | `Resource` column header is wrong — holds ability text, not resource type |
| 7 | Command Cards.csv | `Countermeasures` passive text truncated mid-sentence |
| 8 | Unit Stats.csv | Light Tank (Captain) has **no effects** at all |
| 9 | Enemy Stats.csv | Light Tank / Heavy Tank are **identical cards** — Heavy Tank needs differentiation |
| 10 | Rules docs (both) | **Armor "minimum 1" contradicts Plate Host "0 net"** design note |
| 11 | Mission Cards.csv | Full Export 5 (Major) = Full Export 6 (Specialist) — completely identical cards at different ranks |
| 12 | Mission Cards.csv | Balanced Contribution V (Major) = Balanced Contribution VI (Specialist) requirement |
| 13 | Secret Objectives | **Dictator (Saboteur) = Leader (Allied)** — identical win conditions |
| 14 | Secret Objectives | **Hunter (Neutral)** has no numerical threshold — triggers on first qualifying kill |
| 15 | Event Cards.csv | **Garbage Day** reward = "Ongoing effect" — placeholder text, no actual effect |
| 16 | Event Cards.csv | **Medical Focus** condition is ambiguous (Empty OR Full HP — opposite states) |
| 17 | Event Cards.csv | **Research Drive** Round Effect is a broken, unparseable sentence |
| 18 | Gear Stats.csv | **Exosuit** Tech Cost = 11 (should be ~21 for Brigadier) |
| 19 | Gear Stats.csv | **Repair Kit** costs more than Colonel Experimental cards |
| 20 | Gear Stats.csv | **Deployable Shield** has Shields=10 but empty Passive and Active text |
| 21 | Rules docs (Reorg only) | Section 8.4 changelog says overruns cost player progress — current rule is the opposite |
| 22 | Rules docs (Reorg only) | Section 1.2 "lose a lane and enemy gains ground" is factually incorrect |

### Should Fix — Design Gaps and Consistency

| # | File | Issue |
|---|------|-------|
| 23 | Keywords.csv | **Shred** used in 8+ cards across 5 files — needs a keyword definition |
| 24 | Keywords.csv | **Reveal** used in 15+ cards across 5 files — needs a keyword definition |
| 25 | Keywords.csv | **Attacks 1st** used in 9+ unit cards — "Haste" is defined but never used by that name |
| 26 | Keywords.csv | **Retire, Overrun (action), Promote, Commander (role), Refresh** — all need definitions |
| 27 | Enemy Stats.csv | **Ruin** (General) DMG=25 exceeds every Conqueror unit — likely balance error |
| 28 | Enemy Stats.csv | **Oracle** (General) is weaker than Shadow Sower (Conqueror) — rank inversion |
| 29 | Unit Stats.csv | **RDMP "Glass" = RDMP "Impailer"** — identical cards, need differentiation |
| 30 | Unit Stats.csv | **Hovercraft = Hover Tank** — identical cards, need differentiation |
| 31 | Gear Stats.csv | **Plasma Weapons** (Captain) Tech=5 — below Sergeant floor |
| 32 | Gear Stats.csv | **Smoke Pack** (Conscript) Restrictions="Vehicles and Mech only" — mismatches all other Conscripts |
| 33 | Boss Stats.csv | **"Roll" targeting** for 4 bosses — no die specified, no resolution method defined |
| 34 | Boss Stats.csv | Trailing commas in Lightning Wisp, Null Engineer, The Culling T2 — possible truncated content |
| 35 | Boss Stats.csv | **Dread Echo T2** gives +10 Attack (all others give +5) — verify intent |
| 36 | Mission Cards.csv | Export/Contribution series end at Major — no Colonel/Specialist/Brigadier entries |
| 37 | Mission Cards.csv | Balanced Contribution I (Conscript) gives +5 reward vs +1 for all other Conscripts |
| 38 | Rules docs (both) | Round 0: Boss Roll and Mission Assignment status unaddressed |
| 39 | Rules docs (both) | Gear equip timing: "before combat" (Deploy) vs "any time" (Anytime Actions) — conflict |
| 40 | Rules docs (both) | Scout baseline (1 reveal when no scout) conflicts with default (2 reveals) |
| 41 | Rules docs (both) | Secondary win condition (Secret Objectives) has no resolution rules |
| 42 | Rules docs (both) | "Primary/Secondary Ability" key term undefined — unit cards use "Main Effect/Bonus Effects" |
| 43 | Location Actions | "X" capacity value is never defined |
| 44 | Location Actions | No header row |
| 45 | Location Actions | Medical Bay — Cell healing mechanic minimal/incomplete |
| 46 | Location Actions | Containment Block — "bonuses" from contained enemies not defined |

### Fix When Possible — Typos and Minor Inconsistencies

| # | File | Issue |
|---|------|-------|
| 47 | Unit Stats.csv | Typos: "Flac Truck", "Impailer", "Balista", Toxin Tank "active" → activate |
| 48 | Unit Stats.csv | Saboteur Cell placed after Brigadier cards (out of rank order) |
| 49 | Unit Stats.csv | RDMP "Mother" and "Python" have `/` separator in multi-line cells |
| 50 | Enemy Stats.csv | Typos: Emmiter, Tunnler, upto (×3), eachother, gainst, Delets, Cannot be target |
| 51 | Boss Stats.csv | "Heal 10 kill" (The Culling T3) → "Heal 10 on kill"; "equiped" → equipped |
| 52 | Gear Stats.csv | Last Stand Beacon, Recon Satellite: blank Restrictions (should say "Any") |
| 53 | Gear Stats.csv | Stun Grenades active effect exceeds Stun keyword definition |
| 54 | Command Cards.csv | 5 card names not in Title Case |
| 55 | Command Cards.csv | UTF-8 BOM on file |
| 56 | Tactician Cards.csv | The Gunsmith passive: "+Progress damage" is undefined |
| 57 | Mission Cards.csv | "Organic export" series uses lowercase 'e' — all others capitalize |
| 58 | Mission Cards.csv | "Just a flesh wound" — sentence case instead of Title Case |
| 59 | Mission Cards.csv | "Barracks Detail" Instant: lowercase "barracks" |
| 60 | Mission Cards.csv | `upto` in Medical Emergency and Infantry Doctrine |
| 61 | Mission Cards.csv | Crushing Advance (Colonel): requirement text is a grammatical fragment |
| 62 | Secret Objectives | Misdirector: "is overrun" → "are overrun" |
| 63 | Secret Objectives | Armorer: "allies lanes" → "allies' lanes" |
| 64 | Secret Objectives | "Kremlen" → "Kremlin" |
| 65 | Event Cards.csv | `Increse` ×3, `equiped` ×4, `requirments`, `+4` in penalty |
| 66 | Event Cards.csv | "Saboteur investigation" — lowercase 'i' in name |
| 67 | Reorg rules | Broken cross-reference: "See 3.3 Boss Tier Escalation" (section doesn't exist) |
