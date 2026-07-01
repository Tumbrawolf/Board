# Open Questions — Engine Wiring

These items need your answers before they can be implemented correctly.
Audit date: 2026-07-02

---

## Q1 — Mobile unit: which unit does the human player pick to swap? (#2)

**Context:** When a mobile unit triggers a lane swap, the code currently auto-selects `p.active` as the unit that swaps. You said "player in control of the swapper unit picks."

**Question:** Is this a client-UI decision (the player just clicks which unit they want to move, handled by the frontend), or does the engine need a new `chooseSwapUnit` mutation for this? The engine currently has `moveMobileUnitMutation` but always picks the active unit.

---

## Q2 — Mobile mid-combat (#3)

**Context:** You said mobile lane-switching works "mid-combat on demand." Currently `moveMobileUnitMutation` is only called during the planning phase. Mid-combat is a completely different execution window in the engine.

**Question:** How does mid-combat mobile work exactly?
- Does it interrupt the current combat exchange?
- Does it happen between exchanges (between rounds of attacking)?
- Can it happen on the enemy's turn too?
- Once moved mid-combat, does the unit immediately attack in the new lane that same exchange?

---

## Q3 — Ronin (#10)

**Context:** The audit found no "Ronin" card in the engine files. Your clarification #10 said "fires as a counterattack automatically when any ability targets Ronin."

**Question:** Which CSV file is Ronin in (Unit Stats, Gear Stats, Commander)? What faction is it? A search for "Ronin" in the CSVs didn't turn up a match in the audited files.

---

## Q4 — Unknown card: "deals unit's rank as flat damage to active enemy every exchange" (#19)

**Context:** This was your answer #19 to a clarification question. No card in Unit Stats.csv or Gear Stats.csv matches this description.

**Question:** What is the name of this card? Is it a gear card or unit card?

---

## Q5 — Pack Mule gear choice (#23)

**Context:** You said "Player picks which gear piece moves to the new active." Currently the code auto-picks `packMule.equipped.shift()` (first item). 

**Question:** Is this a client-UI choice (player taps which gear to transfer, sent as part of the deploy action), or should the bot logic just auto-pick (and the human player always confirms before deployment)? If it needs a UI prompt, this is deferred until the client UI is built.

---

## Q6 — Long Range: structural change (#24)

**Context:** You said "every player unit across all lanes can target the enemy in the same way Long Range works." The audit found that Long Range only fires when the unit's own lane is EMPTY — it redirects that one unit's cross-lane attack. It does NOT make all units in all lanes simultaneously target the same enemy.

**Question:** To implement this correctly the combat routing needs a significant restructure. Confirming your intent:
- When any unit has Long Range, do ALL friendly units (in all lanes) get to attack the same single enemy target?
- Or does Long Range mean: this unit specifically can attack an enemy in a different lane (cross-lane for the Long Range unit only)?
- If it's the first option (all units), which enemy does everyone target — the one with the most HP, highest rank, or does the player choose?

---

## Q7 — ATV trigger (#33)

**Context:** You said ATV is "player-triggered (human chooses when), or automatic when any ability fires if bot." Currently ATV fires unconditionally at the start of combat by sorting lanes and swapping the top two.

**Question:** 
- For the human player: does triggering ATV pause the combat and ask the player to confirm the swap? Or is it triggered during planning (before combat starts)?
- For the bot: "automatic when any ability fires" — which ability? The first enemy ability that fires that round? Any ability at all?

---

## Q8 — Firesale target: human choice (#25)

**Context:** You said Firesale target is "chosen at activation." The bot auto-targets the most-enemy lane. There is no human-facing choice prompt.

**Question:** Is this a client-UI concern (deferred until the UI is built), or should the engine store a `firesaleTargetSeat` that the client sets before combat begins?

---

## Q9 — TMRG exclusion from shop/deck (#29, #30)

**Context:** You said to remove TMRG from the game. The CSV row was deleted, but the engine may still reference "TMRG" in comments or data arrays. The audit couldn't verify whether TMRG is excluded from the shop/deck selection.

**Question:** Is there a data file (e.g., an enemy deck list, a unit shop pool) where TMRG would need to be explicitly excluded? Or is deleting the CSV row sufficient?

---

## Already fixed (no action needed)
- #32 Field Medic — now returns dying active to unitHand (not medbay) ✓
- #16 Stasis Suit passive — gear destroyed, unit to hand ✓
- #26 Plasma Tank — shield gain moved to kill event only (fix in progress)
- #17 Stasis Suit active — now targets any friendly lane (fix in progress)
- #14 Landmines — now fires per promotion not precombat (fix in progress)
- #11/#12 EMP Slayer — now applies redirect instead of dropping effect (fix in progress)
- #7/#8 MCP Slapper — now gates mid-combat callbacks too (fix in progress)
