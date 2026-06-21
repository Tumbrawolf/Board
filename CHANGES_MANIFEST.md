# Files Changed This Session

Drop these directly into your repo, overwriting the existing files of the same
name. All paths are repo-root level — no subfolders.

## Modified (git already tracks these, will show as changes)

| File | What changed |
|---|---|
| `Boss Stats.csv` | Plate Host's Boss Passive rewritten (self-targeted armor instead of all-enemies) |
| `Command Cards.csv` | Ability-text style standardized ("Once per X:" prefix); a few cards' Passive/Active text tightened during the simulator coverage audit |
| `Enemy Stats.csv` | New `Armor`/`Shields` columns (9 enemies have a real value); redundant stat text removed from `Passive` where it was extracted into the new columns |
| `Gear Stats.csv` | New `Armor`/`Shields` columns (9 items have a real value); same text cleanup as above |
| `Keywords.csv` | Added 2 new keywords: **Long Range**, **Mobile** (38 entries total, up from 37) |
| `Tactician Cards.csv` | Added **The Quartermaster** (18th Tactician); ability-text style standardized |
| `Unit Stats.csv` | New `Armor`/`Shields` columns (25 units have a real value); 16 units' ability text consolidated to use the new Long Range / Mobile keywords instead of repeated full sentences; redundant stat text removed where extracted into the new columns |

`git diff --stat` (run against the original clone) confirms these are the only
7 CSVs with any changes — every other CSV (`Event cards.csv`, `Mission Cards.csv`,
`Secret Objective Cards.csv`, `Location Actions.csv`, `Round Flow.csv`) is untouched.

## Replaced (not flagged by git in the working copy, but genuinely updated)

| File | Why git didn't already show this as modified |
|---|---|
| `Rules.docx` | Edited as a separate working copy throughout this session, not the file inside this exact clone — git has no diff to show until you actually overwrite the tracked file with this one. Contains every rules change from the full session: Escalate Round-1 grace, shop slot fill mechanic, worker-sharing, Boss Tier Escalation (locked in as final), the Plate Host fix, Location Upgrades, the Command Pool definition, Medbay/Containment slot locks, Key Terms glossary, Vote of No Confidence (optional rule), and more — see the new README's Feedback #14–18 for the full list. |
| `README.md` | Same situation — continues the existing numbered Feedback log from #14 onward rather than replacing its history. |

## New file (didn't exist in the original repo)

| File | What it is |
|---|---|
| `Board_Rules_Reorganized.docx` | Same rules as `Rules.docx`, restructured for teaching a new player and for table-side lookup (Quick Start → Setup → full round walkthrough → reference sections → an appendix explaining every playtest change and why). Optional to add to the repo; the two documents say the same things, just organized differently. If you keep editing one by hand going forward, remember to mirror changes into the other — there's no automatic link between them. |

## Not included

The Python balance simulator (the code that validated all of the above) isn't
part of this repo's existing CSV/docx structure, so it wasn't bundled here —
ask separately if you want that added in too.
