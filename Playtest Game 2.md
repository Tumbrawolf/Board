# Playtest Game 2 — The Saboteur Dynamic

**Players:** 4 (all seats narrated by the same session: Aiko, Brennan, Corvin, Dessa)
**Difficulty:** Normal (Overrun Tracker starts at 10; enemy hoard size 3/lane base, +1 at Player Progress 5-7, +1 more at 8-10, caps at 5)
**Optional rules in use:** Commander's Call (commander — not lowest Rank — chooses who gets the full-income spot at a shared location); Vote of No Confidence is available but will only be called if in-fiction evidence justifies it — nothing is being manufactured for drama.
**Seed:** 2002 **Align mode:** `exclude_chaos_guarantee_saboteur` (Chaos-aligned Secret Objectives removed from the pool entirely this game; the dealer guarantees at least one dealt hand includes a Saboteur card)

## What this game is testing

Game 1 exercised the core round loop end-to-end. This game is specifically about the **hidden-player dynamic**: does a Saboteur's secret objective create genuinely interesting tension at the table without being either invisible (no mechanical teeth) or a free "gotcha" the moment it's dealt? And does **Vote of No Confidence** — the optional rule that lets the team formally accuse a suspected traitor — actually work as a costed, two-sided gamble when real suspicion arises organically, rather than as a rubber stamp or a rule nobody ever touches?

Per the session brief, the Saboteur's identity and true motive are being played as genuinely hidden information. Everything below the Setup section is written the way an observing player would experience it — what a player visibly does, not why they're secretly doing it — except where noted as already-public information (a revealed Secret Objective, a Vote of No Confidence outcome, etc.). The full reveal is saved for the End-of-Game section.

---

## Setup

### Deck preparation

Ran `dealer.py init 2002 exclude_chaos_guarantee_saboteur`. Per Managing Decks (Initial Setup):

- **Units:** Vehicles and Mechs set aside (62 cards), 41 base Infantry/Infantry Scout units shuffled into the draw deck.
- **Gear:** Experimental gear set aside (8 cards), 60 base gear cards shuffled into the draw deck.
- **Enemies:** split into Rank piles — Fodder 2, Grunt 8, Core 6, Advanced 35, Elite 14, General 17, Conqueror 11 — each shuffled independently. (Per Playtest Log #33, the Fodder pile's startlingly small 2-card size is a known issue; this game uses the same provisional "unlimited physical copies" ruling as the other two parallel games for consistency — a Rank pile recycles a freshly-shuffled copy of itself rather than running dry.)
- **Secret Objectives:** Chaos-aligned cards removed entirely (down to 37 cards), Saboteur-guarantee logic armed.
- **Missions** (117), **Events** (40), **Tactician** (18), **Command Cards** (61), **Boss deck** (15) shuffled as normal.

### Secret Objectives dealt

Each player received 2 Secret Objective cards. **(hidden)** — what follows is only what's outwardly knowable: each player privately looked at two cards and kept them face down. Nobody at the table has any information yet about anyone else's alignment.

For the record (author/orchestrator knowledge only, not yet known to the table):

- **Aiko** — *Tactician* (Allied: gain 5 Progress while serving as commander) and *Chef* (Neutral: donate 10 Organic over the game).
- **Brennan** — *Middleman* (Neutral: finish the game neither the highest- nor lowest-Rank player) and *Stubborn* (Allied: keep the Overrun Tracker from dropping more than 5 over the whole game).
- **Corvin** — *Technician* (Neutral: donate 10 Tech over the game) and *Architect* (Neutral: fully upgrade 3 buildings).
- **Dessa** — *Slacker* (**Saboteur**: the game must end with Dessa having completed **fewer than 5 missions**) and *Minimalist* (Neutral: end the game with 3 empty Upgrade slots across all locations).

Dessa is this game's hidden antagonist. Her Saboteur win condition is unusually passive and easy to disguise: she succeeds by simply *not* over-performing on mission completion — no sabotage of the board, no risky misplay required, just quietly declining to rack up mission turn-ins while still looking like a normal cooperative player elsewhere (worker placement, combat, purchasing). That's going to make her genuinely hard to read; under-completing missions looks identical to bad luck, unlucky mission draws, or a player who's focused on combat instead. Her *Minimalist* card actually pulls in a compatible direction (fewer building upgrades is easy to justify as "saving resources for units"), so her two objectives don't even fight each other — there's no tension forcing a visible tell.

### Tactician Cards dealt

| Player | Tactician Card | Passive | Active | Resource |
|---|---|---|---|---|
| Aiko | The Gunsmith | Weapons Equipment gain +Progress damage | Deal Units damage directly to target enemy, ignoring Shields but not Armor | Weapons cost 1 less of your choice; 1st armor purchase per round is free |
| Brennan | The Driver | Vehicles require -3 Rank, other units require +1 | Reveal shop deck top until a Vehicle matching your Rank shows, recruit free, reshuffle | Vehicles cost half Tech and Organic |
| Corvin | The Reclaimer | 1st item put into Recycling each turn returns to your hand | Search Recycling for equipment at/under your Rank, return to hand | Purchase equipment from Recycling at half cost |
| Dessa | The Jailer | Contained enemies aren't consumed while you have a worker at Containment Block | Combine both Containment Block units, move to your lane | Containment Block upgrades cost no Alien |

(Brennan's Driver and Dessa's Jailer are largely dead weight until Vehicle Bay and Containment Block are unlocked respectively — neither building exists yet. Both shrug this off for now.)

### Mission Cards dealt (2 each)

Initial hand of 8 missions, drawn and split 2/2/2/2 in player order:

| Player | Mission | Rank Req. | Requirement | Reward |
|---|---|---|---|---|
| Aiko | Crushing Advance | Colonel | Trample damage kills | +10 All resources |
| Aiko | Desperate Stand | Major | Enemy Progress over 7 | +10 All resources |
| Brennan | Medical Bay Detail | Sergeant | Deploy a worker to Medical Bay | +5 All resources |
| Brennan | Xenobiology Export 3 | Sergeant | Return 5 Alien to supply | +3 Alien |
| Corvin | Enemy Momentum I | Sergeant | Enemies activate 5 abilities | +5 All resources |
| Corvin | Specialist Intervention | Conscript | Activate an ability | +1 All resources |
| Dessa | Organic Contribution I | Conscript | Donate 5 Organics to Command | +1 All resources |
| Dessa | Barracks Online | Private | Fully upgrade Barracks | +3 All resources |

Every player starts at Conscript except whoever wins Leader Selection (+1 Rank). That leaves most of this opening hand unreachable Round 1 — Aiko's two missions (Colonel, Major) are well out of reach for a long time, Brennan and Corvin's Sergeant-rank missions need 2 promotions first, and only Dessa drew anything immediately actionable: *Specialist Intervention* is actually Conscript-rank too (listed under Corvin) and *Organic Contribution I* (Conscript) sits in Dessa's hand alongside *Barracks Online* (Private). Dessa quietly has the most completable missions of anyone at the table on paper — a detail that won't mean anything yet, but is worth remembering.

### Command Cards dealt (2 each)

| Player | Command Card | Building | Cost (O/T/A) |
|---|---|---|---|
| Aiko | Rapid Deployment | Barracks | 5/5/3 |
| Aiko | Ashes to Ashes | Medical Bay | 8/3/3 |
| Brennan | We Can Rebuild Them | Medical Bay | 8/3/3 |
| Brennan | Pull Rank | Command | 3/5/5 |
| Corvin | AI Advancements | Barracks | 5/5/3 |
| Corvin | Air Strike | Battlefield | 5/5/5 |
| Dessa | Collaboration | Command | 3/5/5 |
| Dessa | Leader Speech | Command | 3/5/5 |

All eight are well beyond Round 1 affordability (cheapest is 11 total resources), so none of these come into play yet either as Upgrades or Instants — they're hand assets for later rounds. Per Anytime Actions, any player can play a card's **Instant** effect for free if they have a worker at Command or Battlefield and the current commander allows it — wait, re-reading: "the commander also plays the Instant portion of cards for free" — any *other* eligible player pays the card's cost to use its Instant. Only the commander gets it free. Nobody's paying 11+ resources in Round 1, so this is moot for now.

### Leader Selection

Per 1st Turn Actions: players vote on a starting Leader, who gets **+1 Rank** immediately and **+2 Command Cards**. Around the table:

Corvin pitches himself — he's holding *Architect* (openly stated as wanting "to get the Barracks/Armory/Command upgrade tracks moving early," which is true as far as it goes, since Corvin genuinely intends to chase fully-upgraded buildings). Aiko points out her own *Tactician* card rewards her personally for commanding, but is happy to nominate Corvin since the Leader bump doesn't have to go to whoever becomes commander first round (a different vote chooses that, later). Brennan has no strong preference. Dessa stays quiet and doesn't lobby either way — nothing suspicious about that on its own; plenty of players don't care who leads Round 1.

**Vote: Corvin elected Leader**, 3-1 (Dessa voted for herself, a normal-looking single dissenting vote with no comment attached). Corvin jumps to **Private** (Rank index 1) and draws 2 extra Command Cards.


<invoke name="Bash">
<parameter name="command">export DEALER_PATH="C:/Users/kinne/AppData/Local/Temp/claude/c--Users-kinne-Documents-GitHub-Board/891b2e0f-c78d-46e6-86a0-0383a575ed1d/scratchpad/dealer.py"
export DEALER_STATE="C:/Users/kinne/AppData/Local/Temp/claude/c--Users-kinne-Documents-GitHub-Board/891b2e0f-c78d-46e6-86a0-0383a575ed1d/scratchpad/state_game2.json"
Corvin's 2 extra Leader Command Cards, drawn from the top of the deck:

| Card | Building | Cost (O/T/A) | Passive (build) | Active (instant) |
|---|---|---|---|---|
| Whites of Their Eyes | Battlefield | 5/5/5 | — | Deal and take double damage on 1st attack of combat |
| Forward Command | Command | 3/5/5 | Reserve units are immune | Reserve units immune this round; take half Overrun Tracker damage this round |

Corvin now holds 4 Command Cards total (Leader's +2 stack on top of his normal starting 2): AI Advancements, Air Strike, Whites of Their Eyes, Forward Command.

### Round 1 commander (per Playtest Log #31)

Commander Actions for a round are run by whoever was commander **last** round — Round 1 has no previous round, so the **Leader fills in as Round 1's commander** by default. **Corvin is Round 1's commander.** This round's Worker Placement (the race for the Command slot) will determine who commands Round 2's Commander Actions instead.

### Shop fill (Round 1)

Both shop locations start empty and need a full fill before Worker Placement. Corvin, as commander, chooses Direct fill (Rank 1-3, guaranteed, no roll) for all of Round 1 — at table Rank 0-1 there is no upside to gambling on Roll fill yet (the team's highest Rank is only Private, so a Roll fill could land as low as Conscript anyway; Direct fill gives Corvin certainty instead).

**Barracks (4 slots) — drawn pool, Corvin selects 4 cards of Rank 1-3 to seat:**

| Slot | Unit | Rank | Stats | Cost (O/T/A) |
|---|---|---|---|---|
| 1 | Recruit | Private | DMG 2 / HP 2 / Shields 2 | 3/1/0 |
| 2 | Marksman | Sergeant | DMG 3 / HP 3, Long Range | 6/2/0 |
| 3 | Pack Mule | Private | DMG 2 / HP 2 / Shields 4 | 3/1/0 |
| 4 | Stubborn Recruit | Private | DMG 2 / HP 2 / Armor 1 / Shields 7 | 3/1/0 |

Only 2 of the first 6 units drawn for sampling (Recruit, Pack Mule, Marksman) were Rank 1-3; the other 3 (Field Medic, Mortar Squad, Attack Dogs, all Major) are out of range for Direct fill this early. Filling the 4th slot took another short run through the deck (Sniper/Major, Combat Medic/Captain, Rambo/Captain all skipped as too high-Rank) before landing on Stubborn Recruit (Private). Rookie Technician (Private), drawn in the same batch, stays in the deck's circulation for a future slot rather than being seated now — Round 1's 4 slots are already full.

**Armory (2 slots):** of the 4 gear cards sampled, only **Reinforced Barrels** (Conscript Weapon, DMG 3, Cost 1/2/0) is Rank 1-3. Expanded Backpack (Private Utility) also qualifies. Juggernaut Armor (Major) and Heavy Sentry (Specialist) are out of range and set aside.

| Slot | Item | Rank | Stats | Cost (O/T/A) |
|---|---|---|---|---|
| 1 | Reinforced Barrels | Conscript | Weapon, DMG 3 | 1/2/0 |
| 2 | Expanded Backpack | Private | Utility, reset another item's cooldown | 2/4/0 |

Shop fill complete. Setup is done — Round 1 begins.

---

## Round 1

### Planning Stage — Commander Actions

Corvin (this round's commander, per the Leader holdover rule) runs Commander Actions in order, per Playtest Log #31/#32:

1. **Spend command resources on Command Cards from hand.** Command pool is currently empty (0/0/0) — nothing to spend yet.
2. **Command Card hand refill** — per Log #32, this actually happens at **Cleanup**, not here, despite the old Planning-stage text; skipped for now, applied at end of round.
3. **Delegate extra lanes.** Moot — exactly 4 players, 4 lanes, no extra lanes to assign (Difficulty levels: "With 4 players and 4 lanes, every lane has a player in charge of it and this section doesn't apply.").
4. **Draw 2 Events, choose 1 active for the round.** Drawn: *Forced Re-Armament* (Round Effect: equipment costs doubled; Complete by buying a full new gear set for one unit; Reward: equip Anytime without needing the Upgrade; Fail: double Equip costs again) vs. *Food Shortage* (Round Effect: all income converts to Organic; Complete by returning 10 Organic to supply; Reward: all players +5 Organic; Fail: shop Organic costs +2). Corvin picks **Food Shortage** — Round 1 has no equipment purchased yet, so doubling gear costs (Forced Re-Armament) would land on nobody, while Food Shortage's all-income-to-Organic clause meaningfully shapes this round's Worker Placement math instead. **Food Shortage is active.**
5. **Boss spawn roll.** Current Enemy Progress = 0, and the rule states spawning is "impossible at Enemy Progress 0." Rolled anyway for the record: 1d10 → **1**. Roll is irrelevant at EP 0 either way — **no Boss this round.**
6. **Mission Assignment.** Draw count = players (4) + commander's Rank index (Corvin is Private = Rank 1) = **5** cards:

   | # | Mission | Rank Req. | Requirement | Reward |
   |---|---|---|---|---|
   | 1 | Xenobiology Delivered III | Sergeant | Donate 5 Alien to Command | +5 All resources |
   | 2 | Sundering Blow | Captain | Shred 10 Armor/Shields in 1 turn | +8 All resources |
   | 3 | Organic Export 4 | Captain | Return 20 Organics to supply | +10 Organic |
   | 4 | Balanced Contribution V | Major | Donate 30 of each resource to Command | +15 All resources |
   | 5 | Organic Contribution II | Private | Donate 10 Organics to Command | +3 All resources |

   Passing order starts from the player next to the commander and goes around: Dessa picks first, then Aiko, Brennan, back to Corvin, then Dessa again for the 5th card (pool doesn't divide evenly across 4 players).

   - **Dessa** takes **Organic Contribution II** (Private — the only Rank she can act on immediately). A second completable mission, on top of her existing Conscript-rank *Organic Contribution I* and Private-rank *Barracks Online* — Dessa is now sitting on 3 missions she could plausibly finish soon, more than anyone else at the table.
   - **Aiko** takes **Sundering Blow** (Captain) — out of reach for a long while, but she likes the resource shred angle for her Gunsmith kit later and nothing else in the pool was reachable anyway.
   - **Brennan** takes **Xenobiology Delivered III** (Sergeant) — pairs with his existing Xenobiology Export 3 mission, building toward an Alien-economy plan a couple Ranks out.
   - **Corvin**, back around, takes **Organic Export 4** (Captain) — a long-term resource-sink mission.
   - **Dessa** receives the leftover 5th card, **Balanced Contribution V** (Major) — unreachable for a long time, no real choice involved.

   Dessa now holds 4 missions to everyone else's 3, and 2 of hers (the two Organic Contribution cards) are completable within the next round or two just by donating at Command — exactly the kind of mission load a normal player would be thrilled to land. Nothing here reads as suspicious; if anything, Dessa looks like she's set up to be the team's most productive mission-completer this game.

*(Author's note, not visible at the table: this is exactly the setup that makes Slacker interesting to play. Dessa doesn't need to avoid completable missions — she needs to avoid* finishing *them while still looking like she's contributing normally elsewhere. Donating to Command, fielding units, taking lane duty — all of that is free cover. The only thing she actually has to dodge, quietly, all game, is turning in 5 mission completions. Two free Organic-donation missions sitting in her hand are a minor trap for her, not a boon — completing them is easy and would visibly count against her own win condition. Whether she dodges them outright or just "gets to it later" is the first real decision point of her game.)*

### Worker Placement

Each player has 2 Worker Tokens (everyone is Conscript/Private, well below the Rank 4/Captain threshold for a 3rd). The round's commander (Corvin) gets **+1 worker** on top of his normal total for this round only — 3 workers for Corvin, 2 each for the other three. Turn order starts from the player next to the commander and proceeds around the table; per Log #31 the commander for *this* round's Worker Placement is still Corvin (the same Corvin who ran Commander Actions above), but **whoever wins the Command slot this round becomes next round's commander.**

Locations available: Barracks, Medical Bay, Containment Block, Armory, Command, Battlefield. Containment Block has 0 unlocked Holding Cells and Medical Bay has nobody hurt yet, so neither does much this round — but a worker placed there to staff for next round, or just to bank the flat per-worker resource, is still a live option for some.

With **Food Shortage** active this round ("all income converted to Organic"), every location's normal resource type converts to Organic instead — this changes the calculus noticeably: Armory's Tech-heavy payout and Command's player's-choice payout both become pure Organic, while Barracks' mixed Tech+Organic payout becomes double Organic. Containment Block produces 0 currently (no contained enemies, no unlocked cells beyond the 1-per-worker flat amount, all converted to Organic too).

Placements, in turn order (Dessa, Aiko, Brennan, Corvin):

- **Dessa** places both workers at **Barracks**. Barracks pays Tech+Organic equal to shop total Rank (4 unit slots: Private 1 + Sergeant 2 + Private 1 + Private 1 = total Rank 5, so normally +5 Tech +5 Organic; under Food Shortage this converts to **+10 Organic** total for the location, split across however many workers share it). Dessa wants the Organic to feed her own *Organic Contribution* missions later — a completely natural, well-justified choice for someone who (as far as the table knows) is trying to knock out her mission stack quickly.
- **Aiko** places one worker at **Command** (claiming the Commander slot for next round) and one at **Battlefield**. Command's payout is normally resources of choice per Rank — folded into Organic this round — plus first claim on the Commander role for Round 2. Aiko's own *Tactician* card rewards her personally for Progress gained *while serving as commander*, so angling for the Round 2 commander seat is a clean, explicable move regardless of her hidden card.
- **Brennan** places both workers at **Armory**. Armory pays 2x shop total Rank in Tech (Conscript 1 + Private 2 = total Rank 3, so 6 Tech normally), converted fully to **Organic** this round under Food Shortage.
- **Corvin**, with 3 workers as commander, places 1 at **Command** (sharing with Aiko) and 2 at **Barracks** (sharing with Dessa).

**Sharing at Command (Aiko + Corvin):** with **Commander's Call** active (this game's optional rule), the commander — Corvin, still finishing out his commander duties this round — chooses who gets the full-income spot rather than defaulting to lowest Rank. Both Aiko and Corvin are effectively tied in relevant terms (Aiko Conscript, Corvin Private — lowest-Rank default would favor Aiko anyway), and Corvin sees no reason to override the obvious call: full income to **Aiko**, half (round down) to himself.

**Sharing at Barracks (Dessa + Corvin x2):** three workers total on one location. Per the 4-player rule, "the first TWO workers at a shared location both earn full income... only the 3rd worker onward earns half." Commander's Call decides who the two full-income slots go to. Corvin has 2 of the 3 workers here himself; Commander's Call lets him simply assign full income to both of his own workers and half to Dessa's — and he does exactly that, with no comment from the table beyond Dessa noting dryly that "commander's call sure is convenient when you're the commander." It's a mild, normal-sounding grumble, the kind any player might make about a self-favoring commander choice; nobody treats it as more than banter.

Resulting income this round (all converted to Organic per Food Shortage):

**Barracks (4 workers total: Dessa x2, Corvin x2).** Under the 4-player shared-location rule, the first 2 workers earn full income, the 3rd and 4th earn half each; Commander's Call lets Corvin pick who gets which. He assigns both full-income slots to his own 2 workers and leaves Dessa's 2 at half. Base payout per worker at full income = total shop Rank (5) in Tech + 5 in Organic, fully converted to **10 Organic per full-income worker** under Food Shortage; half-income workers get half that, rounded down (**5 Organic per half-income worker**).
- Corvin: 2 x 10 = 20 Organic
- Dessa: 2 x 5 = 10 Organic

**Command (2 workers: Aiko x1, Corvin x1).** Base payout = resources of choice equal to Rank per worker (Conscript = 1, Private = 2 on the same 1-per-step convention Barracks/Armory use for "empty slot = Rank 1"), fully converted to Organic. Commander's Call gives the full slot to Aiko: Aiko (Conscript, full) = 1 Organic; Corvin (Private, half) = 2 halved, rounded down = 1 Organic.

**Armory (2 workers, both Brennan's).** With only one player here, both of his workers count as "first" regardless of the 4-player threshold (there's no 3rd+ worker to discount). Base payout = 2x shop total Rank (3) = 6 Tech per worker, fully converted to **6 Organic per worker** = 12 Organic total.

**Round 1 income summary (Food Shortage converts everything to Organic):**

| Player | Location(s) | Organic gained |
|---|---|---|
| Dessa | Barracks (half x2) | 10 |
| Aiko | Command (full) | 1 |
| Brennan | Armory (full x2) | 12 |
| Corvin | Barracks (full x2) + Command (half) | 21 |

Corvin's outsized haul is a direct consequence of stacking his bonus 3rd worker plus Commander's Call self-priority — a legitimate, rules-correct outcome, but one the table visibly notices. Aiko jokes that commanding next round is "looking pretty good for the wallet."

### Purchasing

Turn order for purchases. Everyone needs at least one unit fielded before Combat — with only Organic available this round (Food Shortage), and most shop items needing a little Tech too, choices are tight.

- **Corvin (21 Organic, 0 Tech, 0 Alien)** buys **Stubborn Recruit** (Private, 3/1/0) — but he has 0 Tech, and the cost needs 1 Tech. *Ruling:* no rule lets a player substitute Organic for a missing Tech cost (that's specifically what Aiko's Command Card "AI Advancements" would unlock, and it isn't built yet) — Corvin can't actually complete this purchase despite having plenty of raw Organic. He pivots to **Recruit** instead — same problem, also needs 1 Tech. Every Barracks unit and most Armory items in this shop need at least a little Tech, which nobody generated this round under Food Shortage. Corvin ends Round 1 unable to buy anything from the shop at all, sitting on 21 Organic with nothing to spend it on yet.
- **Brennan (12 Organic)** hits the identical wall — every shop slot needs Tech he doesn't have. No purchase.
- **Dessa (10 Organic)** same wall. No purchase.
- **Aiko (1 Organic)** — moot; she couldn't afford anything even with Tech.

**Nobody buys anything in Round 1.** This is a real, table-visible consequence of Food Shortage's Round-Effect text ("all income converted to Organic") landing on a round where the entire shop's cheapest items still carry a small Tech cost — the event doesn't just reshape the math, it can flatly lock purchasing for a round if nobody already has banked Tech from a prior round. Round 1 has no prior round, so this bites hard right out of the gate. Noted below as an Open Rules Question: should "all income converts to Organic" apply to *generation* only (leaving existing zero balances at zero) — which is what happened here — or should it also be read as silently waiving Tech/Alien costs at the shop for the round? The rules text only describes the Round Effect on income, not on costs, so the literal reading (apply only to income, take the purchasing lockout as a real and intended consequence) is what's used here.

This also means **every player goes into Combat with no fielded unit and no equipped gear.** That's about to matter a great deal.

### Command Donations

Aiko and Corvin both have a worker at Command this round, so both are eligible to donate to the Command pool (separate from their personal resources). Neither donates — both are holding onto their only resource (Organic) hoping to convert it into a unit next round once Tech is flowing again. No Unit donations either; nobody owns a Scout-eligible unit yet (no units have been purchased at all). **Command pool stays at 0/0/0.**

### Deployment Stage

**Heal Units:** nobody is hurt yet (no units exist). Skipped.
**Assign Scouts:** scout pile is empty — no Scout-type unit has ever been donated. Per rule, this step is skipped entirely; no enemies get pre-revealed by scouting this round.
**Reassign Units / Manage Equipment:** nobody owns a unit or gear yet. Skipped.

**Commander Actions (Deployment):** enemy hoard size per lane is set by Difficulty and current Player Progress. Normal difficulty at Player Progress 0 = **3 enemies/lane base** (the +1 at PP 5-7 and +1 more at PP 8-10 don't apply yet). Rank drawn is set by current Enemy Progress: EP 0 → **Fodder**. No scout effects to separate out (scout pile empty), so all draws go straight face-down into each lane's reserve.

| Lane | Player | Enemies drawn (face-down into reserve) |
|---|---|---|
| 1 | Aiko | Pests, Ticks, Ticks |
| 2 | Brennan | Pests, Pests, Ticks |
| 3 | Corvin | Ticks, Pests, Pests |
| 4 | Dessa | Ticks, Ticks, Pests |

This is the Fodder-pile shortfall flagged in Playtest Log #33 showing up immediately and concretely: the entire Fodder rank is only 2 unique cards (Pests, Ticks), so with the provisional "unlimited copies" ruling in effect, all 12 cards dealt this round are some combination of just those two. Worth tracking whether this trivializes or dominates Round 1-2 combat, per that entry's note to revisit if results hinge on it.

### Combat Stage

**Enemy Scouting:** move the top card of each lane's reserve into the Active slot; flip any face-down cards (everything here is face-down, nothing was pre-scouted). Reveal effects trigger on the flip:

- Lane 1: **Ticks** moves to Active... wait — reserves were dealt in draw order (Pests, Ticks, Ticks); the *top* card goes Active first. Lane 1's Active is **Pests** (no Reveal text). Lane 2's Active is **Pests** (no Reveal). Lane 3's Active is **Ticks** (Reveal: each player loses 1 Organic). Lane 4's Active is **Ticks** (Reveal: each player loses 1 Organic).

Both Ticks reveals fire their "each player loses 1 Organic" effect — that's 2 separate Ticks revealing this round (one in Lane 3, one in Lane 4), so **every player loses 2 Organic** total (1 per Ticks reveal, stacking). Checking against actual balances: Aiko (1 Organic) drops to 0 — wait, she only has 1, can't go negative; floor at 0. Brennan 12 → 10. Corvin 21 → 19. Dessa 10 → 8.

**Combat Cycle:** the commander (Corvin) picks which lane goes first. He calls **Lane 4 first** (Dessa's), reasoning aloud that "we should see the worst stuff early while everyone's fresh" — a plausible, defensible reason with no hidden angle.

Every lane has the identical problem: **no player has a fielded unit.** With no Active unit on the defending side, there's nothing to deal damage back, and nothing standing between the enemy's Active card and the lane being overrun. Per Combat Cycle's text, combat is unit-vs-unit exchanges "until one of them dies" — with no player unit present at all, there's no exchange to resolve; the enemy's Active card simply has no opposition.

- **Lane 4 (Dessa):** Ticks (1 DMG/1 HP, currently -1 Organic income passive while revealed) faces an empty Active slot. No player unit to trade damage with. Lane is contested by enemies with no defender.
- **Lane 1 (Aiko):** Pests (1 DMG/1 HP) faces an empty Active slot. Same situation.
- **Lane 2 (Brennan):** Pests (1 DMG/1 HP) faces an empty Active slot. Same situation.
- **Lane 3 (Corvin):** Ticks (1 DMG/1 HP) faces an empty Active slot. Same situation.

**All 4 lanes end combat with surviving enemies and no player unit able to contest them.** This is the first real edge case of the game: the rules don't explicitly define "what happens when a lane never had a unit deployed to it at all," as opposed to a unit dying mid-fight. Ruling used here (not yet in the shared Playtest Log, noted below in Open Rules Questions): treat an empty Active slot exactly like a defeated defender for Overrun purposes — the lane has enemies surviving combat with no player unit standing, which is the literal trigger condition for Overrunning Lanes ("If any enemies survived combat the lane overruns"). All 4 lanes overrun.

### Cleanup Stage

**Managing the dead:** no units or enemies died this round — nothing to move to any pile.

**Overrunning lanes:** all 4 lanes overrun. Overrun Tracker loses 1 per overrun lane: **10 → 6** (4 lanes x 1 each). That's 40% of the starting Normal-difficulty Overrun Tracker gone in a single round, entirely because nobody could field a unit thanks to the Food Shortage/Tech lockout. A rough start.

**Event Resolution — Food Shortage:** Completion condition was "return 10 Organic to supply." Nobody did (everyone was hoarding their only resource hoping to spend it once Tech flows again) — **event fails.** Failure Penalty: "increase Organic costs of shops by 2." Applied to both Barracks and Armory going forward until changed.

**Promotions:** Food Shortage failed, and per the rule, "if the event passed, the commander may select another player to promote" — the event did not pass, so **no promotion this round.**

**Escalate:** per the rule, Round 1's escalation step is skipped entirely (the one-time grace period). Enemy Progress stays at 0, Player Progress stays at 0 (and wouldn't have advanced anyway — not all lanes survived).

**Command Card hand refill (per Log #32, happens here at Cleanup, not Planning):** hand size target is 2 normal / 3 for the round's commander. Corvin (this round's commander) already holds 4 cards (well above 3) — the rule only says players *below* hand size must draw up to it; it doesn't force a discard for being above, so Corvin keeps all 4 cards as-is. Aiko (2) and Brennan (2) and Dessa (2) are already at the 2-card normal minimum — no draws needed for anyone this round.

**Round 2 commander:** per Worker Placement above, Aiko won the full-income Command slot this round (Commander's Call gave her priority over Corvin). **Aiko becomes Round 2's commander.**

#### Round 1 summary

| Track | Value |
|---|---|
| Overrun Tracker | 6 / 10 (started 10, -4 this round) |
| Player Progress | 0 / 10 |
| Enemy Progress | 0 / 10 (escalation skipped, Round 1 grace) |
| Active Event | Food Shortage — FAILED, penalty applied (shop Organic costs +2 going forward) |
| Commander | Corvin (Round 1) → Aiko (Round 2) |

No casualties (nobody had units to lose), no missions completed, no purchases made. A rough, instructive opening round — entirely driven by an Event interaction (Food Shortage zeroing out Tech generation) that nobody could see coming until it actively locked the shop. Whether that's "working as intended" (early Events should be able to genuinely hurt) or "too punishing for Round 1" is worth flagging for the retrospective.

---

## Round 2

### Planning Stage — Commander Actions

**Aiko** is Round 2's commander (won the full-income Command slot in Round 1).

1. **Spend command resources on Command Cards.** Command pool is still 0/0/0 — nothing donated yet. Nothing to spend.
2. **Command Card hand refill** — happens at Cleanup (Log #32), not here.
3. **Delegate extra lanes** — moot at 4 players/4 lanes.
4. **Draw 2 Events, choose 1.** Drawn: *Crowded Worksite* (Round Effect: income blocked entirely if another worker shares that location; Complete by donating 10 resources to Command; Reward: future worker income auto-adds 1 of that resource to Command; Fail: only 1 player can donate per turn) vs. *Forced Contribution* (Round Effect: income **+1** if another worker shares that location; Complete by returning 20 resources to supply; Reward: +1 income per additional shared worker; Fail: -1 income per additional shared worker). Aiko picks **Forced Contribution** — it's the friendlier of the two no matter what (a bonus for sharing instead of a penalty that blocks income outright), and after Round 1's Tech lockout the table wants a round that rewards consolidating workers at fewer locations rather than punishing it. **Forced Contribution is active.**
5. **Boss spawn roll.** Enemy Progress still 0 (Escalate didn't run Round 1) — spawning remains impossible at EP 0. Rolled for the record: 1d10 → **1**. No Boss.
6. **Mission Assignment.** Draw count = players (4) + commander's Rank index (Aiko, Conscript = 0) = **4** cards:

   | # | Mission | Rank Req. | Requirement | Reward |
   |---|---|---|---|---|
   | 1 | Untouchable | Colonel | Win a round without losing units | +10 All resources |
   | 2 | Full Export 5 | Major | Return 30 of each resource to supply | +15 All resources |
   | 3 | Steel Supremacy | Private | Own more Mechs than Infantry & Vehicles | +3 All resources |
   | 4 | Command Vanguard | Major | Own a Rank 5 unit | +10 All resources |

   Passing starts from the player next to the commander (Aiko): Brennan picks first, then Corvin, Dessa, then back to Aiko for the last card.

   - **Brennan** takes **Steel Supremacy** (Private) — the only one anybody can act on any time soon, and only once Mechs are unlocked (they aren't yet — nobody's bought Combined Arms or Mech Station). Still, it's the "least far away" option.
   - **Corvin** takes **Full Export 5** (Major) — a long-term resource-return mission, fits his existing Architect/Organic Export pattern of liking big resource-sink objectives.
   - **Dessa** takes **Untouchable** (Colonel) — miles out of reach, but no other choice was better; she shrugs and pockets it without comment.
   - **Aiko** gets the leftover **Command Vanguard** (Major).

   Nobody gains an immediately actionable mission this round. Dessa's existing hand (Organic Contribution I & II, Barracks Online) remains her most reachable set by a wide margin — and remains untouched; she hasn't donated toward either Organic mission yet, despite having had 8-10 Organic in hand since Round 1. Nobody's tracking that consciously yet; it just hasn't come up.

Shop state carries over unchanged (nothing was bought Round 1, so nothing needed refilling): Barracks still holds Recruit, Marksman, Pack Mule, Stubborn Recruit; Armory still holds Reinforced Barrels, Expanded Backpack — all now costing **+2 Organic** apiece from Food Shortage's failure penalty.

### Worker Placement

Workers: 2 each for Brennan/Corvin/Dessa, 3 for Aiko (commander bonus). **Forced Contribution** is active (+1 income per additional shared worker at a location this round). Turn order starts from the player next to the commander: Brennan, Corvin, Dessa, then Aiko.

- **Brennan** places both workers at **Armory** again — last round's 12 Organic came from there and he wants to push for Tech now that Food Shortage has lapsed.
- **Corvin**, sitting on 19 Organic with nothing to spend it on, places both workers at **Command** — chasing his *Architect* objective (fully upgrade 3 buildings) means banking Command-pool resources toward Upgrades, and Command's payout is resources of his choice.
- **Dessa** places both workers at **Barracks** again.
- **Aiko**, with 3 workers, places 1 at **Armory** (sharing with Brennan), 1 at **Command** (sharing with Corvin), and 1 at **Battlefield** alone.

**Armory (Brennan x2, Aiko x1 = 3 workers).** First 2 (Commander's Call, Aiko picks) get full income, 3rd gets half. Aiko assigns full income to both of Brennan's workers (no self-favoring this time) and takes the half-income slot herself — a visibly generous call after Corvin's self-favoring Round 1 choice; Brennan thanks her for it at the table. Base = 2x shop total Rank (3) = 6 Tech per worker; **Forced Contribution** adds +1 income per additional shared worker on top — with 3 workers sharing, the 2 "extra" workers beyond the first each add +1, so each worker's payout gets +2 Tech this round (2 additional workers x 1 each). Brennan's 2 full workers: (6+2) Tech each = 16 Tech total. Aiko's 1 half-income worker: 6 Tech halved = 3, +2 Forced Contribution bonus = 5 Tech.

**Command (Corvin x2, Aiko x1 = 3 workers).** Same structure. Aiko, still commander, gives both full-income slots to Corvin's workers, keeping the half-income slot for herself again — consistent, generous calls all round. Base = Rank-equivalent per worker (Corvin Private = 2) in resources of choice, +2 Forced Contribution bonus per worker (3 workers sharing, 2 "extra"): Corvin's 2 full workers choose Tech (matching his stockpile-Organic-but-need-Tech problem) — wait, Command's base payout is resource of *choice*, so Corvin picks Tech to finally unstick his Round 1 purchases: (2+2) Tech each = 8 Tech total. Aiko's half-income worker: 2 halved = 1, +2 = 3 Tech.

**Barracks (Dessa x2 alone).** No sharing this round — both her workers count as full income by default (no 3rd+ worker). Base = shop total Rank (5) in Tech+Organic, doubled... no: Barracks pays Tech equal to shop Rank AND Organic equal to shop Rank (separate amounts, not doubled) — 5 Tech + 5 Organic per worker. Dessa's 2 workers: 10 Tech + 10 Organic total.

**Battlefield (Aiko x1 alone).** Base = +1 all resources to Command pool per worker (this is a Command-pool contribution, not personal income) plus Scout-additional-units-per-worker (moot, no scout). Aiko's worker adds +1 Organic, +1 Tech, +1 Alien to the **Command pool** — first time it's seen any income. Command pool: 0/0/0 → 1/1/1.

**Round 2 income summary:**

| Player | Location(s) | Tech | Organic | Alien |
|---|---|---|---|---|
| Brennan | Armory (full x2) | +16 | — | — |
| Aiko (personal) | Armory (half) + Command (half) | +8 | — | — |
| Corvin | Command (full x2) | +8 | — | — |
| Dessa | Barracks (full x2) | +10 | +10 | — |
| Command pool | Battlefield (Aiko x1) | +1 | +1 | +1 |

Running personal totals after income: Brennan 10 Organic / 16 Tech. Aiko 0 Organic / 8 Tech. Corvin 19 Organic / 8 Tech. Dessa 18 Organic / 10 Tech.

### Purchasing

Tech is finally flowing. Shop costs are +2 Organic from the Food Shortage penalty (Armory/Barracks both).

- **Dessa (18 Organic, 10 Tech)** buys **Stubborn Recruit** (Private, base 3/1/0 + 2 penalty = 5 Organic/1 Tech/0 Alien). Pays 5 Organic, 1 Tech. Remaining: 13 Organic, 9 Tech. Slot refills immediately.
- **Brennan (10 Organic, 16 Tech)** buys **Marksman** (Sergeant, base 6/2/0 +2 = 8 Organic/2 Tech/0 Alien). Pays 8 Organic, 2 Tech. Remaining: 2 Organic, 14 Tech. Slot refills.
- **Corvin (19 Organic, 8 Tech)** buys **Recruit** (Private, base 3/1/0 +2 = 5 Organic/1 Tech/0 Alien). Pays 5 Organic, 1 Tech. Remaining: 14 Organic, 7 Tech. Slot refills.
- **Aiko (0 Organic, 8 Tech)** can't afford anything — every shop item needs at least a little Organic and she spent Round 1 with almost none banked. No purchase.

Three Barracks slots refill immediately (per Filling Shop Slots: "a slot never sits empty waiting for next round"). Aiko, as commander, chooses Direct fill (Rank 1-3, guaranteed) for all 3 — the team's still too low-Rank for Roll fill to offer any real upside. After skipping several Captain/Colonel draws that were out of range, the 3 slots seat:

| Slot | Unit | Rank | Stats | Cost (+2 penalty applied) |
|---|---|---|---|---|
| 1 | Gunner | Sergeant | DMG 3/HP 3, +2 dmg per consecutive hit | 8 Organic / 2 Tech |
| 2 | Lazy Recruit | Private | DMG 2/HP 2/Shields 2, attacks every 2nd round | 5 Organic / 1 Tech |
| 3 | Breacher | Sergeant | DMG 3/HP 3, Stuns full-HP enemies on hit | 8 Organic / 2 Tech |

Armory is untouched (nobody bought gear this round) — still Reinforced Barrels and Expanded Backpack, both +2 Organic from the penalty.

### Command Donations

Corvin, with a worker at Command, donates **10 Organic** to the Command pool toward his Architect objective (fully upgrading 3 buildings will need a deep Command-pool stockpile eventually) — Command pool Organic: 1 → 11. No unit donations yet (no Scout-type unit owned by anyone).

### Deployment Stage

**Heal Units:** nobody's hurt. **Assign Scouts:** scout pile still empty, skipped. **Reassign Units / Manage Equipment:** each player puts their newly-bought unit straight into their lane's Active slot (their only unit, so no real choice) — Dessa fields **Stubborn Recruit**, Brennan fields **Marksman**, Corvin fields **Recruit**. Aiko has nothing to field; her lane goes into combat with an **empty Active slot again**, the same situation that overran every lane in Round 1. No gear owned by anyone yet, so nothing to equip.

**Commander Actions (Deployment):** Enemy Progress still 0 → Fodder rank, 3 enemies/lane (Player Progress still 0, base hoard size).

| Lane | Player | Enemies drawn |
|---|---|---|
| 1 | Aiko | Pests, Ticks, Ticks |
| 2 | Brennan | Pests, Ticks, Pests |
| 3 | Corvin | Pests, Ticks, Ticks |
| 4 | Dessa | Pests, Pests, Ticks |

### Combat Stage

**Enemy Scouting:** top card of each reserve flips to Active. Lane 1: **Pests** (no Reveal). Lane 2: **Pests** (no Reveal). Lane 3: **Pests** (no Reveal). Lane 4: **Pests** (no Reveal). No Ticks revealed this time — no Organic-loss trigger this round.

**Combat Cycle:** Aiko, now commander, picks lane order. She starts with **Lane 4** (Dessa's), continuing the "see the rough stuff first" habit Corvin started.

- **Lane 4 (Dessa vs. Pests):** Stubborn Recruit (DMG 2/HP 2/Armor 1/Shields 7) vs. Pests (DMG 1/HP 1). Simultaneous exchange: Stubborn Recruit deals 2 to Pests (1 HP) — dead. Pests deals 1 to Stubborn Recruit, reduced by Armor 1 to a minimum-1 floor ("Armor: reduce damage per instance, minimum 1 damage always gets through") — so 1 damage still lands, but it hits Shields first (Shields "prevents damage total," consumed before HP) — Shields 7 → 6, HP untouched. **Pests dies, Stubborn Recruit survives at full HP / 6 Shields.** Lane 4 enemy reserve promotes next card (Pests) into Active for awareness, but combat for this lane is done for the round once enemies stop coming — actually, re-reading Combat Cycle: "units continue dealing damage to each other... until one of them dies... move to next lane" — once Pests dies, does the next reserve enemy immediately also fight the same Active unit this round, or does each lane only resolve ONE Active-vs-Active exchange per round? Re-checking: Enemy Scouting only promotes "the top card of each enemy reserve into active" once, at the start of Combat Stage — it doesn't say lanes keep cycling fresh reserve enemies into Active within the same round after a kill. Ruling (noted below in Open Questions): one Active-vs-Active matchup per lane per round; if the enemy dies, the lane is cleared for the round (no overrun) and remaining reserve enemies simply carry over face-up to next round's Enemy Scouting step. If the player's unit dies instead, the lane overruns with whatever reserve enemies remain. Going with this reading for the rest of the game for consistency.

  Under that ruling: Lane 4 clears its Active Pests, no overrun, 2 enemies (Pests, Ticks) remain in reserve for next round.

- **Lane 2 (Brennan vs. Pests):** Marksman (DMG 3/HP 3, Long Range) vs. Pests (DMG 1/HP 1). Marksman deals 3, Pests dies instantly. Pests deals 1 back, Marksman HP 3→2. **Lane clears, no overrun.** 2 enemies remain in reserve (Ticks, Pests).

- **Lane 3 (Corvin vs. Pests):** Recruit (DMG 2/HP 2/Shields 2) vs. Pests (DMG 1/HP 1). Recruit deals 2, Pests dies. Pests deals 1, absorbed entirely by Shields (2→1). **Lane clears, no overrun.** 2 enemies remain in reserve (Ticks, Ticks).

- **Lane 1 (Aiko, empty Active slot vs. Pests):** No player unit to fight back. Per the Round 1 ruling (an empty Active slot counts as enemies-surviving-combat for Overrun purposes), **Lane 1 overruns.**

Three of four lanes hold for the first time this game — a unit with even 2-3 HP comfortably beats 1-HP Fodder, confirming Fodder rank is exactly as toothless as its name suggests when any unit at all is fielded. The only lane that overruns is the one with no defender, which is entirely an artifact of Aiko spending all her Round 1+2 income on worker placement income engines instead of a starter unit.

### Cleanup Stage

**Managing the dead:** 3 Pests died this round (Lanes 2, 3, 4), no player units died. Per Combat Stage, "Dead Enemies can be moved to containment if there is spaces... If no space is freed up, the dead enemy goes to Enemy Disposal at Command instead." Containment Block has 0 unlocked Holding Cells — all 3 dead Pests go to **Enemy Disposal**.

**Overrunning lanes:** 1 lane overran (Lane 1, Aiko — no defender). Overrun Tracker: **6 → 5**.

**Event Resolution — Forced Contribution:** Completion condition was "return 20 resources to supply." Nobody did — **fails.** Failure Penalty: "players lose -1 income for each additional player at a location" — this retroactively shapes future shared-location math; noted for next time a location is shared.

**Promotions:** the event failed, so per the rule's own text ("if the event passed, the commander may select another player to promote") there is **no promotion path this round regardless** — moot here since nobody below Aiko's Conscript Rank exists anyway (everyone but Corvin is also Conscript, and Corvin already outranks her).

**Escalate:** Round 2 is past the Round 1 grace period — Enemy Progress advances: **0 → 1** (still Fodder rank: 0-1). Not all lanes survived (Lane 1 overran), so **Player Progress stays at 0.**

**Command Card hand refill:** hand-size targets are 2 normal / 3 for commander. Aiko (commander) holds 2 (Rapid Deployment, Ashes to Ashes) — below her 3-card target, draws 1 to reach 3. Everyone else is already at 2. Corvin still holds 4 (above target, no forced discard).

#### Round 2 summary

| Track | Value |
|---|---|
| Overrun Tracker | 5 / 10 |
| Player Progress | 0 / 10 |
| Enemy Progress | 1 / 10 |
| Active Event | Forced Contribution — FAILED (future shared-location income -1 per extra worker) |
| Commander | Aiko (R2) → Corvin (R3), per the Command slot won this round |

First real combat of the game: 3 Pests killed, 0 player casualties, 1 lane overrun purely from having no defender. Dessa, Brennan, and Corvin all now have a functioning lane.

---

## Round 3

### Planning Stage — Commander Actions

**Corvin** is Round 3's commander.

1. **Command resources.** Pool sits at 11 Organic / 1 Tech / 1 Alien — still far short of any Command Card's cost (cheapest in hand is 11 total). Nothing spent.
2. **Hand refill** — Cleanup, not here.
3. **Delegate lanes** — moot.
4. **Draw 2 Events, choose 1.** Drawn: *Tax Fault* (Round Effect: all income halved; Complete by returning 15 resources to supply; Reward: +1 Alien/turn for all; Fail: Alien costs +2) vs. *Research Drive* (Round Effect: Containment Block cells empty and hold 2 units each, with a dice-based capture-or-kill mechanic; Complete by capturing more than killing; Reward: keep the storage stack upgrade; Fail: disable a Containment Block slot). Corvin picks **Research Drive** — Containment Block isn't even unlocked yet (0 Holding Cells), so its Round Effect has no target to act on and effectively does nothing this round, which beats Tax Fault's blanket income halving on a round where the team's economy is finally starting to move. **Research Drive is active (effectively inert).**
5. **Boss spawn roll.** Enemy Progress = 1 (escalated last Cleanup). Spawns if roll ≤ 1. Rolled: 1d10 → **2**. Over the threshold — **no Boss.**
6. **Mission Assignment.** Draw count = 4 + Corvin's Rank index (Private = 1) = **5**:

   | # | Mission | Rank Req. | Requirement | Reward |
   |---|---|---|---|---|
   | 1 | Medical Bay Operational | Captain | Fully upgrade Medical Bay | +8 All resources |
   | 2 | Tech Export 4 | Captain | Return 20 Tech to supply | +10 Tech |
   | 3 | Total Breakdown | Sergeant | Have all 4 lanes overrun in one round | +5 All resources |
   | 4 | Armory Complete | Private | Fully upgrade Armory | +3 All resources |
   | 5 | Iron Grip | Specialist | Hold commander role 3 rounds running | +15 All resources |

   Passing starts next to commander: Dessa, Aiko, Brennan, Corvin, then back to Dessa for the 5th.

   - **Dessa** takes **Armory Complete** (Private) — actually reachable once Armory's single Upgrade slot gets filled; she muses aloud "might as well grab something I could actually finish," which reads as completely normal mission-hand management.
   - **Aiko** takes **Total Breakdown** (Sergeant) — a strange one to want (it rewards the team for losing badly), but nobody else wanted it either; she shrugs and takes the "least bad of what's left."
   - **Brennan** takes **Tech Export 4** (Captain) — distant but matches his Alien/Tech economy interest.
   - **Corvin** takes **Medical Bay Operational** (Captain) — another "fully upgrade a building" mission, stacking with his own Architect objective without him realizing the irony of how thematically matched they are.
   - **Dessa** gets the leftover **Iron Grip** (Specialist) — wildly out of reach, no real choice.

   Dessa now holds **5 missions**: Organic Contribution I (Conscript, reachable), Organic Contribution II (Private, reachable), Barracks Online (Private, reachable once Barracks' 4 slots are upgraded), Untouchable (Colonel, far), Iron Grip (Specialist, far). Three of her five are realistically within reach over the next several rounds — by a comfortable margin the most actionable mission stack at the table. She still hasn't turned in a single one.

### Worker Placement

Resources entering this round: Aiko 0 Organic/8 Tech, Brennan 2 Organic/14 Tech, Corvin 14 Organic/7 Tech (+3 from commander bonus worker), Dessa 13 Organic/9 Tech. Ranks: all still Conscript except Corvin (Private).

- **Aiko**, having learned her lesson, places both workers at **Barracks** to finally generate enough Organic for a starter unit.
- **Brennan** places 1 worker at **Armory** (keep the Tech engine running) and 1 at **Medical Bay** — nothing's hurt yet, but he wants a worker pre-positioned there since Medical Bay Detail (his Sergeant-rank mission) requires deploying a worker there, and getting ahead of that requirement now means the mission triggers the moment he hits Sergeant.
- **Corvin**, with 3 workers, places 2 at **Command** (continuing the push toward Architect-grade Command pool resources) and 1 at **Battlefield**.
- **Dessa** places 1 worker at **Barracks** (sharing with Aiko) and 1 at **Command** (sharing with Corvin) — splitting her attention rather than going all-in anywhere. On its face this looks like sensible diversification; it also conveniently keeps her present at Command without donating anything once she's there (Command Donations are optional, not mandatory).

**Barracks (Aiko x2, Dessa x1 = 3 workers).** First 2 full income (Corvin's call — wait, Corvin isn't sharing this location, but Commander's Call still applies regardless of who's sharing, the *commander* always decides). Corvin gives both full slots to **Aiko** (she has 2 workers here and badly needs the Organic) and the half slot to **Dessa**. Base = shop total Rank: Gunner(2)+Lazy Recruit(1)+Breacher(2)+ empty slot(1) = 6 Tech + 6 Organic per worker. Aiko: 2 x (6 Tech + 6 Organic) = 12 Tech + 12 Organic. Dessa: half of that, rounded down = 3 Tech + 3 Organic.

**Command (Corvin x2, Dessa x1 = 3 workers).** Corvin, generously again, gives both full slots to himself this time (no other commander-favoritism complaints have come up, and nobody's tracking it as a pattern yet) — actually, on reflection this is the second round running Corvin's claimed both full slots when sharing Command with himself as one of the sharers, which starts to look a little consistent. Base = Rank-equivalent in resources of choice per worker (Private = 2): Corvin's 2 full workers choose Tech: 2x2=4 Tech, wait base before doubling — Corvin picks 2 Tech per worker since he's full income at "Rank per worker," so 2 full workers = 4 Tech total. Dessa's half-income worker: 2 halved = 1 Tech (her choice, also Tech).

**Medical Bay (Brennan x1 alone).** Base = "2 Organic per injured unit healed, +1 Organic per worker regardless" — nobody's injured, so just the flat +1 Organic.

**Armory (Brennan x1 alone).** Base = 2x shop total Rank: Reinforced Barrels(1)+Expanded Backpack(2) = total Rank 3, x2 = 6 Tech.

**Battlefield (Corvin x1 alone).** Base = +1 all resources to Command pool per worker. Command pool +1/+1/+1.

**Round 3 income summary:**

| Player | Organic | Tech |
|---|---|---|
| Aiko | +12 | +12 |
| Dessa | +3 | +1 |
| Corvin (personal) | — | +4 |
| Brennan | +1 | +6 |
| Command pool | +1 | +1 (+1 Alien too) |

Running totals: Aiko 12 Organic/20 Tech. Brennan 3 Organic/20 Tech. Corvin 14 Organic/11 Tech. Dessa 16 Organic/10 Tech. Command pool: 12 Organic/3 Tech/2 Alien.

### Purchasing

Food Shortage's +2 Organic shop penalty is still in effect (no rule has reset it yet).

- **Aiko (12 Organic, 20 Tech)** finally buys a unit: **Gunner** (Sergeant, base 6/2/0 +2 = 8 Organic/2 Tech). Pays 8/2. Remaining: 4 Organic/18 Tech. Slot refills.
- **Brennan (3 Organic, 20 Tech)** buys **Reinforced Barrels** (Conscript Weapon, base 1/2/0 +2 = 3 Organic/2 Tech) for his Marksman. Pays 3/2. Remaining: 0 Organic/18 Tech. Slot refills.
- **Dessa (16 Organic, 10 Tech)** buys **Breacher** (Sergeant, base 6/2/0 +2 = 8 Organic/2 Tech) as a 2nd unit for her lane reserve. Pays 8/2. Remaining: 8 Organic/8 Tech. Slot refills.
- **Corvin (14 Organic, 11 Tech)** buys **Lazy Recruit** (Private, base 3/1/0 +2 = 5 Organic/1 Tech) as a reserve unit. Pays 5/1. Remaining: 9 Organic/10 Tech. Slot refills.

4 Barracks slots refill, Corvin (commander) Direct-fills all (Rank 1-3, still the team ceiling):

| Slot | Unit | Rank | Notes | Cost (+2 pen.) |
|---|---|---|---|---|
| 1 | Recruit Prodigy | Private | Infantry Scout, Shields 2 | 5/3/0 |
| 2 | Civilian Scout | Conscript | Infantry Scout, mobile in reserve, no gear | 3/2/0 |
| 3 | Civilian Survivalist | Conscript | Infantry Scout, Scouts +1 enemy | 3/2/0 |
| 4 | Rookie Gunner | Private | +1 dmg per consecutive hit | 5/3/0 |

Armory refill (Brennan bought Reinforced Barrels, so 1 slot needs refilling): after skipping a long run of Captain/Major/Specialist/Colonel gear (Repair Kit, Slayer Suit, Night Vision, Apocalypse Rounds, Recon Satellite, Plasma Weapons, Reactive Plating, Nanite Tech, Last Stand Beacon, Ion Weapons, Magnetized Barrels, Explosive Rounds — none Rank 1-3), the slot seats **Grenade Launcher** (Conscript Utility, deals 1/2 attack damage before combat starts, Active: Stun target enemy; cost 1/2/0 +2 penalty = 3 Organic/4 Tech). Armory now holds Expanded Backpack + Grenade Launcher.

This long dry spell of high-Rank gear draws (12 cards skipped to find 1 valid Rank 1-3 item) is worth flagging: the base Gear deck (Experimental removed) skews much higher-Rank than the Unit deck does, making early Armory Direct fills slower and more card-churning than early Barracks fills. Noted below in Open Rules Questions.

### Command Donations

Corvin (2 workers at Command) donates again: **9 Organic** toward the Architect push. Command pool Organic: 12 → 21. Dessa, also present at Command this round, donates nothing — she's holding her resources for her own mission stack, a defensible, ordinary-looking choice (everyone keeps some resources back sometimes).

### Deployment Stage

**Heal:** nobody hurt. **Scouts:** still no Scout-type unit donated — Civilian Scout, Civilian Survivalist, and Recruit Prodigy are all Scout-eligible and sitting in the shop, but nobody's bought one yet, so the scout pile remains empty. **Reassign/Equip:** Brennan equips **Reinforced Barrels** onto Marksman (free to equip; +3 DMG, Marksman now hits for 6). Dessa's new Breacher and Corvin's new Lazy Recruit go to their lane reserves behind their existing Active units.

**Commander Actions (Deployment):** Enemy Progress = 1 → still Fodder rank. Player Progress = 0 → still base 3 enemies/lane.

| Lane | Player | New enemies drawn | Reserve now |
|---|---|---|---|
| 1 | Aiko | Pests, Pests, Ticks | (Aiko's lane had no leftover reserve from Round 2's overrun — ruling: an overrun lane's surviving Active enemy and reserve carry forward; Aiko's Round 2 Active Pests survived since nothing fought it, plus her 2 Ticks reserve, so this round's 3 fresh draws join those) |
| 2 | Brennan | Ticks, Pests, Pests | joins existing reserve (Ticks, Pests) |
| 3 | Corvin | Pests, Ticks, Pests | joins existing reserve (Ticks, Ticks) |
| 4 | Dessa | Ticks, Pests, Ticks | joins existing reserve (Pests, Ticks) |

Lane 1 (Aiko) now has a backlog: the surviving Pests from Round 2 (never fought, since she had no unit) plus 2 Ticks reserve from Round 2 plus 3 fresh draws = 6 enemies stacked in that lane. This is the cost of skipping 2 full rounds without a defender — now that Aiko has a Gunner, she's facing a much bigger backlog than anyone else.

### Combat Stage

**Enemy Scouting:** still no scout, all face-down. Lane 1's top reserve card flips to Active: it's the surviving **Pests** from Round 2 (no Reveal text). Lane 2: **Ticks** (Reveal: each player loses 1 Organic). Lane 3: **Pests** (no Reveal). Lane 4: **Ticks** (Reveal: each player loses 1 Organic).

Two Ticks reveal this round (Lanes 2 and 4) — **every player loses 2 Organic.** Aiko 4→2, Brennan 0→0 (floored), Corvin 9→7, Dessa 8→6.

**Combat Cycle:** Corvin (commander) picks lane order, starting with **Lane 1** this time — "let's clear Aiko's backlog before it gets worse."

- **Lane 1 (Aiko vs. Pests):** Gunner (DMG 3/HP 3, +2 dmg per consecutive hit) vs. Pests (DMG 1/HP 1). Gunner deals 3, Pests dies instantly. Pests deals 1, Gunner HP 3→2. **Lane 1 finally clears its Active slot.** 5 enemies remain in reserve for next round (2 Pests, 2 Ticks, 1 Ticks from this round's draw — wait, tallying: pre-existing reserve was 2 Ticks; new draws were Pests, Pests, Ticks; total reserve after this round's Active resolves = 2 Ticks + Pests + Pests + Ticks = 5). **No overrun.**
- **Lane 2 (Brennan vs. Ticks):** Marksman, now with Reinforced Barrels equipped (DMG 3+3=6/HP 2 after last round's chip damage) vs. Ticks (DMG 1/HP 1). Marksman deals 6, Ticks dies instantly. Ticks deals 1 back, Marksman HP 2→1. **Clears, no overrun.**
- **Lane 3 (Corvin vs. Pests):** Recruit (DMG 2/HP 2/Shields 1, chipped from Round 2) vs. Pests (DMG 1/HP 1). Recruit deals 2, Pests dies. Pests deals 1, absorbed by last Shield point (Shields 1→0). **Clears, no overrun.**
- **Lane 4 (Dessa vs. Ticks):** Stubborn Recruit (DMG 2/HP 2/Armor 1/Shields 6) vs. Ticks (DMG 1/HP 1). Stubborn Recruit deals 2, Ticks dies. Ticks deals 1, reduced by Armor to the 1-minimum floor, absorbed by Shields (6→5). **Clears, no overrun.**

**All 4 lanes hold for the first time this game.** Zero player casualties, 4 enemies killed (1 per lane), no overruns.

### Cleanup Stage

**Managing the dead:** 4 enemies died (Pests, Ticks, Pests, Ticks). Containment Block still has 0 unlocked Holding Cells — all 4 go to **Enemy Disposal**.

**Overrunning lanes:** none. Overrun Tracker unchanged: **5/10.**

**Event Resolution — Research Drive:** Completion condition was "capture more than you kill." With Containment Block still locked (0 cells), 0 enemies were ever capturable — 0 captures vs. 4 kills, condition fails by definition. **Event fails.** Failure Penalty: "disable a Containment Block slot" — but Containment Block currently has 0 unlocked slots to disable. Ruling (Open Question below): a penalty that targets a resource/slot which doesn't exist yet has nothing to apply to; treating this as a no-op rather than pre-emptively disabling a slot that would otherwise be unlocked later (the more punitive reading would make the *first* Containment Protocol purchase permanently give only 1 slot instead of 2 — going with the gentler no-op reading instead, since nothing in the card text suggests it should reach forward in time).

**Promotions:** event failed — no promotion path this round.

**Escalate:** not Round 1, escalation applies. Enemy Progress: **1 → 2** (crosses into Grunt rank territory for next round: Grunt = EP 2-3). All 4 lanes survived this round → **Player Progress: 0 → 1.** First Progress point of the game.

**Command Card hand refill:** Corvin (commander, target 3) holds 4 — no refill needed (above target, no discard forced). Everyone else at 2 — no refill needed.

**Round 3 commander:** Corvin's 2 full-income Command workers this round keep him on top of the Command race once again — **Corvin stays commander for Round 4.**

#### Round 3 summary

| Track | Value |
|---|---|
| Overrun Tracker | 5 / 10 |
| Player Progress | 1 / 10 |
| Enemy Progress | 2 / 10 (now Grunt rank starting next round) |
| Active Event | Research Drive — FAILED (no-op penalty, Containment Block not yet unlocked) |
| Commander | Corvin (held) |

First clean round of the game — every lane defended, first Player Progress point earned. Enemy Progress crossing into Grunt rank (2-3) next round means Fodder's 1 HP/1 DMG joke-tier enemies are about to be phased out.

---

## Round 4

### Planning Stage — Commander Actions

**Corvin** holds the commander role again.

1. **Command resources.** Pool: 21 Organic/3 Tech/2 Alien. Still nothing affordable (cheapest hand card needs 11+ combined, and these are split unevenly) — actually 21 Organic alone covers several cards' Organic component, but Tech (3) and Alien (2) are short for everything in hand. Nothing spent yet.
2. **Hand refill** — Cleanup.
3. **Delegate lanes** — moot.
4. **Draw 2 Events.** *Honorable Discharge* (Round Effect: units retire-on-death instead of dying outright this round; Complete by retiring 5-10 units this turn; Reward: retired-unit refunds duplicate to Command; Fail: Retire-from-Duty no longer refunds resources) vs. *Medical Focus* (Round Effect: Medical Bay healing costs Organic; Complete by getting the Med Bay to empty or full HP; Reward: healing generates Organic instead of costing it; Fail: healing costs Organic with a cap going forward). Corvin picks **Honorable Discharge** — its Round Effect is a pure upside this round (any unit that would die instead retires, refunding part of its cost) with a completion condition (retire 5-10 units) that's unreachable either way since the team only owns ~6 units total and isn't trying to mass-retire — but unlike Medical Focus, choosing it can't actively cost anyone resources this round. **Honorable Discharge active.**
5. **Boss spawn roll.** EP=2, spawns at roll ≤2. Rolled: 1d10 → **10**. No Boss.
6. **Mission Assignment.** Draw count = 4+1 = **5**:

   | # | Mission | Rank Req. | Requirement | Reward |
   |---|---|---|---|---|
   | 1 | Balanced Contribution I | Conscript | Donate 5 of each resource to Command | +5 All resources |
   | 2 | Balanced Contribution VI | Specialist | Donate 30 of each resource to Command | +15 All resources |
   | 3 | Tech Export 2 | Private | Return 10 Tech to supply | +5 Tech |
   | 4 | Combat Medic III | Colonel | Heal 40 damage during combat | +10 All resources |
   | 5 | Xenobiology Export 5 | Major | Return 20 Alien to supply | +5 Alien |

   Passing from Dessa: Dessa, Aiko, Brennan, Corvin, then Dessa again.

   - **Dessa** takes **Balanced Contribution I** (Conscript) — fully in reach right now (she has 6 Organic, 8 Tech, 0 Alien — needs a little Alien to complete it, but it's close). This makes **6 missions** in Dessa's hand, 4 of them realistically reachable within a round or two.
   - **Aiko** takes **Tech Export 2** (Private) — reachable, she's swimming in Tech (18).
   - **Brennan** takes **Xenobiology Export 5** (Major) — distant, no better option.
   - **Corvin** takes **Combat Medic III** (Colonel) — distant.
   - **Dessa** gets leftover **Balanced Contribution VI** (Specialist) — distant, no choice.

   Dessa is now visibly the mission-richest player at the table by a wide margin: 6 cards, with Organic Contribution I, Organic Contribution II, Balanced Contribution I, and Armory Complete all realistically closeable in the near term. She still hasn't completed a single one.

### Worker Placement

- **Aiko** places 1 at **Armory** (push toward gear) and 1 at **Medical Bay** (pre-positioning, like Brennan did, plus she's noticed nobody's actually using the Med Bay despite 2 free slots).
- **Brennan** places both workers at **Armory**, sharing with Aiko.
- **Corvin**, 3 workers, places 2 at **Command** (still chasing Architect) and 1 at **Barracks**.
- **Dessa** places both workers at **Command**, sharing with Corvin.

At the table, Corvin notes lightly that Dessa's spent more worker-rounds at Command than anyone except himself, while donating noticeably less than he has — he's put in 19 Organic across 2 rounds; Dessa's contributed 0 despite passing through Command 3 times now (Round 1 lane wasn't Command, but Round 3 and Round 4 both have her there). It's a fair, low-key observation, not an accusation — "you've been at Command a lot, you don't owe anything though" — and Dessa shrugs it off: "saving it for my own missions." Nobody pushes further. It's a perfectly normal-sounding answer, and as far as anyone can tell, true.

**Armory (Aiko x1, Brennan x2 = 3 workers).** Commander's Call: Corvin gives both full slots to Brennan, half to Aiko. Base = 2x shop total Rank: Expanded Backpack(2)+Grenade Launcher(1) = total Rank 3, x2 = 6 Tech per worker. Brennan: 2x6=12 Tech. Aiko: half = 3 Tech.

**Medical Bay (Aiko x1 alone).** Base = +1 Organic per worker (nobody injured to heal yet). Aiko +1 Organic.

**Command (Corvin x2, Dessa x2 = 4 workers).** First 2 full income, next 2 half (4-worker threshold). Corvin gives both full slots to himself again — third round running he's claimed full priority for his own workers when sharing Command with someone else, a pattern now clear enough that Brennan jokingly calls him "the toll booth." Corvin laughs it off: "I'm putting it all into the team pool anyway" (true — he has been). Base = Rank-equivalent resources of choice per worker (Private=2): Corvin's 2 full = 2x2=4 (his choice, Tech). Dessa's 2 half = 2 each halved =1 each = 2 total (her choice — she picks Alien, inching toward completing Balanced Contribution I).

**Barracks (Corvin x1 alone).** Base = shop total Rank in Tech+Organic: Recruit Prodigy(2)+Civilian Scout(1)+Civilian Survivalist(1)+Rookie Gunner(2) = total Rank 6 → 6 Tech + 6 Organic.

**Round 4 income summary:**

| Player | Organic | Tech | Alien |
|---|---|---|---|
| Aiko | +1 | +3 | — |
| Brennan | — | +12 | — |
| Corvin (personal) | +6 | +10 | — |
| Dessa | — | — | +2 |

Running totals: Aiko 3 Organic/21 Tech. Brennan 0 Organic/30 Tech. Corvin 13 Organic/20 Tech. Dessa 6 Organic/8 Tech/2 Alien.

### Purchasing

Still +2 Organic shop penalty from Food Shortage.

- **Brennan (0 Organic, 30 Tech)** can't afford anything — every item needs at least a little Organic. No purchase, despite a huge Tech bank. He grumbles about it; this is the same Tech/Organic mismatch problem from Round 1, just mirrored.
- **Corvin (13 Organic, 20 Tech)** buys **Civilian Survivalist** (Conscript, base 1/0/0 +2 = 3 Organic/2 Tech) — cheap, and "Scouts +1 enemy" is exactly the Scout-type unit the team needs to donate to finally get scouting online. Pays 3/2. Remaining: 10 Organic/18 Tech.
- **Aiko (3 Organic, 21 Tech)** buys **Rookie Gunner** (Private, base 3/1/0 +2 = 5 Organic/3 Tech) — wait, she only has 3 Organic, short by 2. Can't afford. She instead buys **Civilian Scout** (Conscript, base 1/0/0 +2 = 3 Organic/2 Tech) as a 2nd unit. Pays 3/2. Remaining: 0 Organic/19 Tech.
- **Dessa (6 Organic, 8 Tech)** buys nothing this round — sits on her resources, says she's "saving up." Given the Command-donation pattern just noticed, this reads slightly differently than it would have in Round 1, though still well within normal variance for a player managing toward future missions.

2 Barracks slots refill (Corvin's Civilian Survivalist + Aiko's Civilian Scout both sold), Direct fill, skipping Field Researcher/Field Intelligence/Elite Sniper (all too high-Rank): **Rookie Marksman** (Private, Long Range, 5 Organic/3 Tech with penalty) and **Conscript** (Conscript, base unit, 3 Organic/2 Tech with penalty).

### Command Donations

Corvin donates **10 Organic** again, pushing his running total toward Architect. Command pool Organic: 21 → 31. Still short on Tech/Alien for any of his hand's Command Card Upgrades (cheapest needs 5 Tech, pool only has ~4) — none built yet.

### Deployment Stage

**Heal:** nobody hurt. **Scouts:** Corvin donates his new Civilian Survivalist to Command as the team's first Scout-eligible unit. **The scout pile now has 1 unit, and Civilian Survivalist becomes this round's active scout.** Its Scout Value (4 Organic/1 Tech/1 Alien) is added to the Command pool immediately: 31→35 Organic, 4→5 Tech, 2→3 Alien. Its base ability also reads "Scouts +1 enemy" — so this round, scouting reveals **2 enemies** instead of the default 1 (base 1 + this unit's +1 bonus).

**Reassign/Equip:** Aiko's new Civilian Scout and Corvin's new Rookie Marksman + Conscript all go to their lane reserves.

**Commander Actions (Deployment):** Enemy Progress = 2 → **Grunt rank now** (Fodder's 1HP/1DMG joke tier is over). Player Progress = 1 → still base 3 enemies/lane.

| Lane | Player | New Grunt-rank enemies drawn |
|---|---|---|
| 1 | Aiko | Gloom (5 DMG/7 HP, blocks lane abilities), Hound (5 DMG/7 HP, hits twice, Reveal: 10 dmg to lowest-HP unit), Cleric (4 DMG/6 HP, heals Active enemy) |
| 2 | Brennan | Lancer (5 DMG/4 HP, pierces 2 Armor, Reveal: 2x dmg to lane), Grunt (4 DMG/5 HP, Reveal: 2x dmg to ALL lanes), Lance Turret (6 DMG/9 HP, targets lowest-HP unit) |
| 3 | Corvin | Scorpions (5 DMG/4 HP, hits the Scout), Wasp (3 DMG/3 HP, stuns on 1st hit), Cleric (4 DMG/6 HP) |
| 4 | Dessa | Grunt (4 DMG/5 HP, Reveal: 2x dmg to ALL lanes), Gloom (5 DMG/7 HP), Lance Turret (6 DMG/9 HP) |

This is a real spike from Fodder's 1/1 stat line — every Grunt-rank card here has 3-9 HP and 3-6 DMG, several times tougher than the entire roster the team has fielded so far (current Active units: Gunner 2HP, Marksman 1HP, Recruit 2HP, Stubborn Recruit 2HP). **Brennan and Dessa's lanes both drew a "Grunt" enemy whose Reveal text deals double damage to ALL lanes, not just its own** — that's about to matter for everyone, not just those two lanes.

Per Commander Actions (Deployment)'s actual sequencing ("separate out a random selection of enemies based on the scout effects, turn these cards face up and shuffle together back before dealing into lanes") — scouting happens **before** dealing, not after. With Civilian Survivalist's "Scouts +1 enemy" active, 2 of the 12 drawn cards get pulled out, flipped face-up, then shuffled back into the pool before the 12 are dealt out 3-per-lane. The 2 scouted-face-up cards: both copies of **Grunt** (the "2x damage to all lanes" one) — already a lucky, useful catch, since both threats that hit every lane at once are now known in advance and will not trigger their Reveal effect again once dealt (a card already face-up from scouting doesn't re-trigger Reveal on deal-in). Re-shuffled and dealt, the lane assignments above hold as drawn (both Grunts landed back in Lanes 2 and 4 respectively after the reshuffle, narratively treated as unchanged for simplicity) — but this time **face-up**, so neither one will deal its double-damage-to-all-lanes Reveal effect when Combat Stage flips them.

### Combat Stage

**Enemy Scouting:** top card of each lane's reserve flips to Active.

- Lane 1 (Aiko): top of reserve is **Gloom** (5 DMG/7 HP, no Reveal text, Passive blocks ability activation in-lane).
- Lane 2 (Brennan): top of reserve is **Lancer** (5 DMG/4 HP, Reveal: 2x dmg to active+reserve in this lane, Passive pierces 2 Armor) — the face-up **Grunt** is 2nd in this lane's order, not yet Active.
- Lane 3 (Corvin): top of reserve is **Scorpions** (5 DMG/4 HP, Reveal: 2x dmg to the Scout, Passive routes this unit's damage to the Scout instead of the lane's unit).
- Lane 4 (Dessa): top of reserve is **Grunt** — already face-up from scouting, so its "2x damage to all lanes" Reveal does **not** trigger (per the no-retrigger rule).

Lancer's Reveal triggers: 2x damage to active AND reserve units in Lane 2 — Brennan's Marksman (1 HP) and his reserve are about to take a hit before the exchange even starts. Scorpions' Reveal triggers: 2x damage to **the Scout** specifically — Civilian Survivalist (1 HP), the team's only scout, takes 2x5=10 damage and dies instantly, even though it's stationed at the Battlefield's Scout Slot, not in any lane. **The scout pile is now empty again** — Assign Scouts will need a new donation before any future round's scouting works again.

Lancer's Reveal damage: 2x its 5 DMG = 10 damage, split how? Ruling (Open Question below, rule doesn't specify splitting on multi-target Reveal damage): apply full 10 to the Active unit first (Marksman, 1 HP) — Marksman dies before combat even starts, then remaining "splash" carries to reserve per "Splash: hits multiple targets," but Brennan's lane currently has no reserve units (he never bought a 2nd unit), so the excess has nothing to hit. **Marksman is dead before the Combat Cycle even begins**, and Lane 2 enters the cycle with an empty Active slot.

**Combat Cycle:** Corvin (commander) calls **Lane 2 first** — "Brennan just lost his guy to the reveal, let's see what's left."

- **Lane 2 (Brennan, empty Active vs. Lancer):** No defender. Per the Round 1/2 ruling (empty Active slot = enemies-survive-combat for Overrun purposes), **Lane 2 overruns.**
- **Lane 1 (Aiko vs. Gloom):** Gunner (DMG 3/HP 2) vs. Gloom (DMG 5/HP 7). Gunner deals 3, Gloom HP 7→4 (survives). Gloom deals 5, Gunner HP 2 → dead (2-5 = -3, well past 0). **Gunner dies.** Lane 1's reserve is empty (Aiko never bought a 2nd unit either) — **Lane 1 overruns** with Gloom still standing at 4 HP.
- **Lane 3 (Corvin vs. Scorpions):** Recruit (DMG 2/HP 2) vs. Scorpions (DMG 5/HP 4, already used its Reveal on the dead scout this round, no further bonus now). Recruit deals 2, Scorpions HP 4→2 (survives). Scorpions deals 5, Recruit HP 2 → dead. Corvin has a reserve: **Lazy Recruit** (DMG 2/HP 2, "attacks every 2nd round") promotes into Active immediately per Reserve's definition (units waiting "until promoted into the Active slot... when the Active unit/enemy dies") — but Lazy Recruit's own ability text caveats it only attacks every 2nd round; this is its first round in Active, so ruling: it still defends (takes/deals based on its normal stats unless its text says it can't act at all) — checking the card text again: "Attacks every 2nd round" most plausibly means it skips its attack but still has HP. Same combat cycle, same round: does the promoted reserve unit get a fresh exchange against the same still-Active Scorpions, or does the lane's combat for the round end once the first Active unit dies? This directly mirrors the open question already flagged in Round 2 about reserve enemies refreshing into Active mid-round — applying the same one-exchange-per-round ruling symmetrically (it would be inconsistent to let player reserves refresh mid-round while denying it to enemy reserves), **Lazy Recruit promotes to Active for next round but does not fight this round.** Scorpions, still alive at 2 HP, **lane 3 overruns.**
- **Lane 4 (Dessa vs. Grunt):** Stubborn Recruit (DMG 2/HP 2/Armor 1/Shields 5) vs. Grunt (DMG 4/HP 5, Reveal already fizzled from being pre-scouted). Stubborn Recruit deals 2, Grunt HP 5→3 (survives). Grunt deals 4, reduced by Armor 1 = 3 effective, hits Shields first (5→2), HP untouched. **Stubborn Recruit survives at full HP, 2 Shields left.** Dessa has reserve **Breacher** waiting, not needed yet — Grunt is still alive at 3 HP, so per the same one-exchange ruling, **Lane 4 overruns too** (enemy survived the round's single exchange), even though Dessa's unit itself didn't die.

**All 4 lanes overrun this round** — the Grunt-rank jump landed hard: 2 units dead (Gunner, Marksman via Lancer's Reveal), the team's only Scout killed before combat even started, and every single lane ends with a surviving enemy.

(Aside: this exact result — all 4 lanes overrun in one round — is the literal trigger condition for Aiko's *Total Breakdown* mission. But mission rank-gating still applies: Total Breakdown requires Sergeant Rank to complete, and Aiko is still Conscript. The condition fired; the mission can't be turned in yet. A genuinely funny near-miss — the team's worst round of the game so far almost paid out a mission reward, blocked purely by Rank.)

### Cleanup Stage

**Managing the dead:** Gunner (Aiko's) and Marksman (Brennan's) both died this round. Honorable Discharge's Round Effect is active: "Units Retire on death this round" — instead of going to the Graveyard, both dead units instead resolve as if their owners chose Retire from Duty. Per Retire from Duty: "one of their 3 resources refunded" and equipped gear returns to hand. Gunner refunds part of its Organic cost to Aiko; Marksman's Reinforced Barrels gear returns to Brennan's hand (he can re-equip it later, equipping is always free). Scorpions' kill on Civilian Survivalist (the Scout) is a different matter — Scout units killed via enemy Reveal effects aren't "retiring," they're simply dying in place at the Scout Slot; Honorable Discharge's text doesn't obviously extend to a unit that was never in a lane to begin with. Ruling (Open Question below): Honorable Discharge's Round Effect is read as lane-combat-specific ("units retire on death" in the context of the Managing the Dead section, which is about lane casualties) — the Scout's death is handled normally, no retirement refund for it.

**Overrunning lanes:** all 4 lanes overrun. Overrun Tracker: **5 → 1.** This is now a genuine crisis — one more bad round loses the game outright.

**Event Resolution — Honorable Discharge:** Completion condition was "retire between 5 and 10 units this turn" — only 2 units were retired (both involuntarily, via the death-effect above), short of the 5-10 window. **Event fails.** Failure Penalty: "Retire costs no longer gives resource" — voluntary Retire-from-Duty (the Anytime Action) no longer refunds a resource going forward, until/unless something resets it. This doesn't touch what already happened (Gunner/Marksman still got their involuntary refunds under the Round Effect, which already resolved); it only changes future voluntary retirements.

**Promotions:** event failed — no promotion.

**Escalate:** not Round 1. Enemy Progress: **2 → 3** (still Grunt rank: 2-3, this is the last round before Core rank at EP 4). Not all lanes survived (all 4 overran) — **Player Progress stays at 1.**

**Command Card hand refill:** everyone at or above target — no draws needed.

**Round 4 commander:** Corvin's 2 full-income Command workers keep him on top again — **Corvin remains commander for Round 5.**

#### Round 4 summary

| Track | Value |
|---|---|
| Overrun Tracker | **1 / 10** — crisis point |
| Player Progress | 1 / 10 |
| Enemy Progress | 3 / 10 (Grunt, 1 round from Core) |
| Active Event | Honorable Discharge — FAILED (future voluntary Retire no longer refunds) |
| Commander | Corvin (held) |

The single worst round of the game so far: the Grunt-rank jump exposed how thin the team's unit roster and HP pools were after 3 rounds of conservative, economy-focused play. 2 units dead, the only Scout killed, all 4 lanes overrun, Overrun Tracker cratered from 5 to 1. The team has no margin left — the very next overrun lane, of any size, ends the game.

---

## Round 5 — Crisis Round

Overrun Tracker at 1. Any single lane overrunning this round ends the game in a loss. The table's mood shifts sharply — this round is genuinely make-or-break.

### Planning Stage — Commander Actions

**Corvin** holds commander.

1. **Command resources.** Pool: 35 Organic/5 Tech/3 Alien. **AI Advancements** (Barracks, 5/5/3) is now affordable! Corvin builds it as a Barracks Upgrade immediately: "Organic costs can be covered by Tech or Alien resource" — a permanent Passive fix for the exact problem that crippled Round 1 and has dogged Brennan's huge Tech stockpile ever since. Pool after: 30 Organic/0 Tech/0 Alien. Barracks now has 1/4 Upgrade slots filled.
2. **Hand refill** — Cleanup.
3. **Delegate lanes** — moot.
4. **Draw 2 Events.** *Supply Chain Collapse* (Round Effect: double Gear Active-effect costs; Complete: have 1 unit fully equipped; Reward: free Gear actives this round; Fail: Gear actives cost Tech=Rank) vs. *Leadership Crisis* (Round Effect: blind group vote on next commander; Complete: commander changes unanimously; Reward: commander can willingly pass the role; Fail: commander must change every round). Corvin, very aware of how badly the team needs stability and unit power right now, picks **Supply Chain Collapse** — nobody has any equipped gear with an Active effect costing anything meaningful this round anyway (only Reinforced Barrels, a passive-only weapon, and an un-equipped Grenade Launcher in the shop), so the downside is close to nothing, while Leadership Crisis randomly shuffling the commander mid-crisis feels like an unnecessary risk to stability. **Supply Chain Collapse active.**
5. **Boss spawn roll.** EP=3, spawns at roll ≤3. Rolled: 1d10 → **4**. No Boss — a small mercy given the Overrun Tracker situation.
6. **Mission Assignment.** Draw count = 4+1 = **5**:

   | # | Mission | Rank Req. | Requirement | Reward |
   |---|---|---|---|---|
   | 1 | Organic Contribution IV | Captain | Donate 20 Organic to Command | +8 All resources |
   | 2 | Xenobiology Export 2 | Private | Return 3 Alien to supply | +2 Alien |
   | 3 | Armored Convoy | Major | Fill a lane with only Vehicles | +10 All resources |
   | 4 | Absolute Lockdown | Brigadier | Prevent 10 abilities in 1 turn | +20 All resources |
   | 5 | Full Export 1 | Conscript | Return 5 of each resource to supply | +5 All resources |

   Passing from Dessa: Dessa, Aiko, Brennan, Corvin, Dessa.

   - **Dessa** takes **Full Export 1** (Conscript) — immediately reachable (she has 6 Organic/8 Tech/2 Alien, just shy of 5-of-each but close). **7 missions in hand now.**
   - **Aiko** takes **Xenobiology Export 2** (Private) — reachable once she gets any Alien at all (currently 0).
   - **Brennan** takes **Organic Contribution IV** (Captain) — distant for now, but his Tech-rich, Organic-poor profile makes this an odd one to want; he takes it anyway since nothing else fit better.
   - **Corvin** takes **Armored Convoy** (Major) — distant, Vehicles aren't even unlocked.
   - **Dessa** gets leftover **Absolute Lockdown** (Brigadier) — wildly distant, no real choice.

   Dessa's hand is now **7 missions** deep, by far the largest of the game, with at least 5 of them realistically reachable within the next few rounds (Organic Contribution I & II, Balanced Contribution I, Armory Complete, Full Export 1). She still has not turned in a single completion.

### Worker Placement

With the Overrun Tracker at 1, every player pivots hard toward Barracks (units to replace the dead Gunner and Marksman) and Medical Bay (nobody's hurt yet, but reserves matter now). AI Advancements is live, meaning Tech/Alien can now cover Organic costs too — Brennan's 30 Tech stockpile is suddenly fully unlocked.

- **Aiko** places both workers at **Barracks** — desperate to replace Gunner.
- **Brennan** places both workers at **Barracks** too, sharing with Aiko — same need, and now that AI Advancements means his Tech can substitute for Organic, he's no longer locked out.
- **Corvin**, 3 workers, places 2 at **Command** (still pushing Architect — 1 Upgrade built, 2 more buildings to go) and 1 at **Barracks**, sharing with Aiko/Brennan.
- **Dessa** places 1 at **Command** (continuing her Command presence) and 1 at **Containment Block** — a new location for anyone this game; she explains she wants to "get ahead of unlocking it since enemies are tougher now and we'll want the resources." Reasonable on its face. Containment Block currently has 0 unlocked Holding Cells, so this nets her only the flat +1 Alien per worker regardless — a small, low-cost placement either way.

**Barracks (Aiko x2, Brennan x2, Corvin x1 = 5 workers).** Now at the highest worker count any location has seen. Per the 4-player rule, first 2 full income, rest half. Corvin (commander) assigns the 2 full slots to Aiko (most urgent need) and gives Brennan and himself half-income each. Base = shop total Rank: Rookie Marksman(2)+Conscript(1)+Recruit Prodigy(2)+Civilian Survivalist — wait, Civilian Survivalist was sold to Corvin last round and donated to Command as scout (now dead); that slot refilled. Checking current Barracks: Rookie Marksman(2), Conscript(1), Recruit Prodigy(2), and a 4th slot — recall Civilian Scout was also bought (by Aiko). So Barracks currently holds: Rookie Marksman, Conscript, Recruit Prodigy, and 1 empty-then-refilled slot. Total Rank ≈ 2+1+2+1(empty counts as 1) = 6 → 6 Tech + 6 Organic per full-income worker.

Aiko's 2 full workers: 2x(6+6) = 12 Tech + 12 Organic. Brennan's 1 half worker: half of (6+6) = 3 Tech + 3 Organic. Corvin's 1 half worker: same, 3 Tech + 3 Organic.

**Command (Corvin x2, Dessa x1 = 3 workers).** Corvin again takes both full slots for himself, Dessa gets the half. Base = Rank-equivalent resources of choice (Corvin Private=2): 2 full workers = 2x2=4 (Tech, his choice). Dessa's half = 1 (her choice, Alien — continuing to chase Full Export 1 / Balanced Contribution I).

**Containment Block (Dessa x1 alone).** Base = Alien equal to contained-unit Ranks (0, nothing contained) + 1 flat per worker = **+1 Alien.**

**Round 5 income summary:**

| Player | Organic | Tech | Alien |
|---|---|---|---|
| Aiko | +12 | +12 | — |
| Brennan | +3 | +3 | — |
| Corvin (personal) | +3 | +7 | — |
| Dessa | — | — | +2 |

Running totals: Aiko 12 Organic/31 Tech. Brennan 3 Organic/33 Tech. Corvin 3 Organic/25 Tech. Dessa 6 Organic/8 Tech/4 Alien.

### Purchasing

With the Overrun Tracker at 1, every purchase this round is about surviving the next combat, not economy. AI Advancements (built this round) means Organic costs can now be paid from Tech or Alien — Brennan's huge Tech bank is finally useful.

- **Aiko (12 Organic, 31 Tech)** buys **Rookie Marksman** (Private, base 3/1/0 +2 penalty = 5/3/0) to replace her dead Gunner. Pays 5 Organic/3 Tech. Remaining: 7 Organic/28 Tech. Slot refills.
- **Brennan (3 Organic, 33 Tech)** buys **Recruit Prodigy** (Private, base 3/1/0 +2 = 5/3/0) to replace his dead Marksman — covers the 2-Organic shortfall using AI Advancements' Tech-substitution. Remaining: 0 Organic/27 Tech. Slot refills.
- **Corvin (3 Organic, 25 Tech)** buys **Conscript** (Conscript, base 1/0/0 +2 = 3/2/0) as a 2nd unit backing up Lazy Recruit. Pays 3 Organic/2 Tech. Remaining: 0 Organic/23 Tech. Slot refills.
- **Dessa (6 Organic, 8 Tech, 4 Alien)** already has a healthy lane (Stubborn Recruit Active, Breacher in reserve) — no Barracks purchase needed. She buys **Grenade Launcher** (Conscript Utility, base 1/2/0 +2 = 3/4/0) from the Armory for Stubborn Recruit instead. Pays 3 Organic/4 Tech. Remaining: 3 Organic/4 Tech/4 Alien.

3 Barracks slots refill (Aiko's, Brennan's, Corvin's purchases) — Direct fill, Rank 1-3 only attempted, but the base Unit draw pile (41 cards) came up fully exhausted at this point: every Direct-fill search this game has been skipping past higher-Rank cards to find Rank 1-3 ones, and those skipped higher-Rank cards were drawn-and-discarded by the dealer tool rather than staying in the deck (the tool has no "this card was looked at but not taken" return path for non-enemy decks). Combined with 8 actual purchases removing more cards permanently, the 41-card pool ran dry. **Ruling (Open Question below):** treat the exhausted Unit deck the same way the provisional Enemy-deck ruling (Log #33) treats Fodder — reshuffle a fresh copy of the full 41-card base Unit list and continue drawing from that reshuffled pool. This is a tooling artifact of this dealer script's no-discard-pile design for non-enemy decks, not a real game-rules gap — flagged for the record so the other parallel games' results aren't read as having hit the same wall for the same reason if they manage their draws differently.

Reshuffled and redrawn, skipping Special Forces/Elite Marksman/Hunter Unit (too high-Rank), the 3 slots seat: **Recruit** (Private, Shields 2, 5 Organic/3 Tech with penalty), **Rookie Scout** (Private, Infantry Scout, Mobile, 5/3), **Conscript** (Conscript, base unit, 3/2).

### Command Donations

Corvin, with 2 workers at Command, donates **0 Organic** this round (he's down to 0 Organic himself after buying Conscript) — no donation possible. Dessa, also at Command, donates nothing again. Command pool stays at 30 Organic/4 Tech/0 Alien (Tech was spent on AI Advancements earlier this round, reducing the pool's Tech from 5 to 0, but the Battlefield/per-worker incomes haven't fed it again yet this round — pool currently 30/0/0 plus whatever residual; tracked precisely in bookkeeping).

### Deployment Stage

**Heal:** nobody hurt — both casualties from last round (Gunner, Marksman) were fully dead/retired, not injured-and-recoverable. **Scouts:** scout pile is empty (Civilian Survivalist died last round) — skipped, no enemies pre-revealed this round. This is a meaningful loss heading into a crisis round: no advance warning on Reveal effects this time.

**Reassign/Equip:** Aiko equips nothing new (Rookie Marksman has no gear available to her). Brennan re-equips the recovered **Reinforced Barrels** (returned to hand when Marksman retired) onto his new Recruit Prodigy: +3 DMG, Recruit Prodigy now hits for 5. Dessa equips **Grenade Launcher** onto Stubborn Recruit: passive "deal 1/2 attack damage before combat" — Stubborn Recruit's 2 DMG triggers a 1 pre-combat damage tick before the main exchange even starts.

**Commander Actions (Deployment):** Enemy Progress = 3 → still **Grunt rank** (2-3, last round before Core). Player Progress = 1 → still base 3 enemies/lane. Lanes already have substantial carryover reserves from last round's overruns (every lane overran, so every Active/surviving enemy carries forward) plus 3 fresh draws each.

| Lane | Player | Carryover (surviving from last round) | Fresh draws |
|---|---|---|---|
| 1 | Aiko | Gloom (4 HP left) | Wasp, Hound, Scorpions |
| 2 | Brennan | Lancer (4 HP, untouched — Brennan had no defender) | Lancer, Gloom, Grunt |
| 3 | Corvin | Scorpions (2 HP left) | Wasp, Cleric, Lance Turret |
| 4 | Dessa | Grunt (3 HP left) | Hound, Lancer, Scorpions |

Every lane now has a real backlog. No scout active this round — nothing pre-revealed.

### Combat Stage

**Enemy Scouting:** the carryover enemy from last round was already Active and never died, so it stays Active (no new flip needed there) — only freshly-drawn reserve cards get flipped as new arrivals join the reserve queue behind it. Re-confirming each lane's Active card:

- Lane 1: **Gloom** (still Active, 4 HP, blocks ability activation in-lane).
- Lane 2: **Lancer** (still Active, 4 HP, pierces 2 Armor) — its Reveal already fired last round when it first appeared face-down; it doesn't re-trigger just for staying Active.
- Lane 3: **Scorpions** (still Active, 2 HP) — same logic, Reveal already used.
- Lane 4: **Grunt** (still Active, 3 HP) — Reveal already fizzled last round (it was pre-scouted face-up that round).

No new Reveal triggers this round — all 4 Active cards were already revealed last round and are simply continuing the fight.

**Combat Cycle:** Corvin calls **Lane 4 first** — "Dessa's the one most likely to actually win hers, let's bank a clean lane immediately."

- **Lane 4 (Dessa vs. Grunt, 3 HP):** Stubborn Recruit (DMG 2/HP 2/Armor 1/Shields 2, now also equipped with Grenade Launcher: "deal 1/2 attack damage before combat" = 1 pre-combat damage). Pre-combat tick: Grunt 3→2 HP. Main exchange: Stubborn Recruit deals 2, Grunt HP 2→0, **dead.** Grunt deals 4 back, reduced by Armor 1 = 3, hits Shields (2→0) then 1 spills to HP (2→1). **Stubborn Recruit survives at 1 HP, 0 Shields. Lane 4 clears — no overrun.** Breacher (reserve) promotes to Active for next round.
- **Lane 1 (Aiko vs. Gloom, 4 HP):** Rookie Marksman (DMG 2/HP 2, Long Range) vs. Gloom (DMG 5/HP 4). Rookie Marksman deals 2, Gloom HP 4→2 (survives). Gloom deals 5, Rookie Marksman HP 2 → dead. Aiko's reserve: Civilian Scout (DMG 1/HP 1) — per the established one-exchange-per-round ruling, it promotes to Active for **next** round but doesn't fight this round. Gloom survives at 2 HP. **Lane 1 overruns.**

  **Overrun Tracker would hit 0 right here if this resolves immediately — checking whether Cleanup batches all overruns at once or whether the game ends the instant the tracker hits 0 mid-Combat-Stage.** Per Key Terms, "reaching 0 loses the game," and Overrunning Lanes is a Cleanup Stage step, not a live check during Combat — the tracker isn't actually decremented until Cleanup tallies overruns for the round. Continuing the Combat Cycle for the remaining 2 lanes before any loss check, per the rules' own stage ordering.

- **Lane 2 (Brennan vs. Lancer, 4 HP):** Recruit Prodigy (DMG 2+3=5 with Reinforced Barrels/HP 2/Shields 2) vs. Lancer (DMG 5/HP 4, pierces 2 Armor — irrelevant here, Recruit Prodigy has 0 Armor anyway). Recruit Prodigy deals 5, Lancer HP 4→ dead. Lancer deals 5 back, absorbed by Shields (2) then 3 spills to HP (2→ dead). **Both die simultaneously** (per Combat Cycle's default: "both applying before either side checks for death"). Brennan has no reserve. **Lane 2 has no surviving enemy and no surviving player unit — checking Overrun condition: "If any enemies survived combat the lane overruns."** Lancer did NOT survive (it died in the trade) — **Lane 2 does NOT overrun**, despite Brennan's unit also dying. A clean mutual kill, narrowly avoiding the same empty-Active-slot problem from being retroactively punished, because the rule's actual trigger is enemy survival, not player-unit survival.
- **Lane 3 (Corvin vs. Scorpions, 2 HP):** Lazy Recruit ("attacks every 2nd round" — this is Lazy Recruit's first round ever in Active, back in Round 4 it was promoted but didn't fight; is this round its "1st" active round or its "2nd"? Ruling: counting from when it was actually promoted into Active, Round 4 was its 1st round occupying the slot (non-attacking by its own text), making Round 5 its 2nd round — **it attacks this round**) vs. Scorpions (DMG 5/HP 2). Lazy Recruit deals 2, Scorpions HP 2→ dead. Scorpions deals 5 back, Lazy Recruit HP 2 → dead. **Both die.** Corvin's reserve: Conscript (DMG 1/HP 1) promotes to Active for next round. Scorpions didn't survive — **Lane 3 does NOT overrun.**

**Final tally: Lane 1 overruns (Aiko, Gloom survives at 2 HP); Lanes 2, 3, 4 hold (2 via mutual-kill technicality, 1 via a clean win).**

### Cleanup Stage

**Managing the dead:** Rookie Marksman (Aiko's), Recruit Prodigy (Brennan's) and Lazy Recruit (Corvin's) all died this round. Honorable Discharge's penalty already resolved last Cleanup (no more refund on voluntary Retire going forward), but that doesn't affect these — these are combat deaths, going straight to the Graveyard normally (Honorable Discharge's Round Effect was a Round 4-only effect, already expired). 3 dead enemies this round (Grunt, Lancer, Scorpions) head to **Enemy Disposal** (still 0 Containment slots unlocked).

**Overrunning lanes:** exactly 1 lane overran (Lane 1, Aiko). Overrun Tracker: **1 → 0.**

**THE OVERRUN TRACKER HAS REACHED 0. PER KEY TERMS: "REACHING 0 LOSES THE GAME."**

The game ends here, at the end of Round 5's Combat Stage resolving into Cleanup, on a single overrun lane that could not be prevented — Aiko's lane lost its only defender to Gloom's damage output (5 DMG, more than enough to kill any 2-HP unit the team could currently field) with no reserve unit ready to step in immediately, while the other 3 lanes only barely held via mutual-kill trades that easily could have gone the other way (Brennan's Lancer fight and Corvin's Scorpions fight were both simultaneous-death trades — if either of *those* enemies had survived instead, the game would have ended on multiple overruns simultaneously rather than one, the same outcome either way once the Tracker was already sitting at a bare 1).

**LOSS.** Game ends at Round 5. No further Cleanup steps (Event Resolution, Promotions, Escalate) are processed — the loss condition triggers immediately upon the Overrun Tracker hitting 0, mid-Cleanup, before those later sub-steps would run. (Ruling, Open Question below: the rules don't explicitly say whether remaining Cleanup sub-steps still resolve once the loss condition fires partway through Cleanup; treating the loss as immediate and final once detected, since playing out Event Resolution/Promotions/Escalate on a game that's already lost has no mechanical purpose.)

---

## End of Game

### Outcome: LOSS, Round 5, Overrun Tracker reached 0

The team never recovered from Round 4's Grunt-rank spike. Round 1 cost 4 overruns purely from a Food Shortage Event locking the shop's Tech requirement out entirely (nobody could field a single unit). Round 4's jump from 1-HP Fodder to 4-9 HP, 3-6 DMG Grunts caught a team running 2-HP starter units completely unprepared, costing 2 units, the only Scout, and all 4 lanes in one round. By Round 5 the Overrun Tracker had no cushion left, and a single lost lane — entirely plausible given the team's still-thin roster — ended the game.

### Final track values

| Track | Final value |
|---|---|
| Overrun Tracker | **0 / 10 — LOSS** |
| Player Progress | 1 / 10 |
| Enemy Progress | 3 / 10 (Grunt rank) |
| Round reached | 5 |

### Per-player mission completions

**Nobody completed a single mission this entire game.** Final mission hands at time of loss:

| Player | Missions held (none completed) |
|---|---|
| Aiko | Crushing Advance (Colonel), Desperate Stand (Major), Total Breakdown (Sergerant — condition met Round 4, blocked by Rank), Xenobiology Export 2 (Private) |
| Brennan | Medical Bay Detail (Sergeant), Xenobiology Export 3 (Sergeant), Tech Export 4 (Captain), Organic Contribution IV (Captain) |
| Corvin | Enemy Momentum I (Sergeant), Specialist Intervention (Conscript), Medical Bay Operational (Captain), Armored Convoy (Major) |
| Dessa | Organic Contribution I (Conscript), Barracks Online (Private), Organic Contribution II (Private), Iron Grip (Specialist), Armory Complete (Private), Balanced Contribution VI (Specialist), Full Export 1 (Conscript) |

This is a real, table-wide pattern worth separating from Dessa's specific situation: **the entire team finished the game with zero mission completions**, not just Dessa. Several missions had requirements that were technically reachable (Corvin's *Specialist Intervention* just needed "activate an ability" — something that may have happened incidentally but was never tracked/declared as a completion; Dessa's *Organic Contribution I* needed only 5 Organic donated, which she had the resources for from Round 2 onward). The team simply never prioritized turning missions in over building economy and combat readiness — an emergent table behavior, not a forced one.

### Full Secret Objective reveal

| Player | Card 1 | Card 2 | Status at game end |
|---|---|---|---|
| Aiko | *Tactician* (Allied) — gain 5 Progress while commander | *Chef* (Neutral) — donate 10 Organic | Neither completed. Aiko was never commander while Progress advanced (the only Progress point came in Round 3, under Corvin). Chef needed 10 Organic donated — Aiko personally donated 0 all game. |
| Brennan | *Middleman* (Neutral) — finish neither highest nor lowest Rank | *Stubborn* (Allied) — Overrun Tracker doesn't drop more than 5 over the game | Middleman: moot, nobody ever promoted (everyone stayed Conscript except Leader-bumped Corvin at Private) — Brennan was tied at the bottom the whole game, arguably a failure on a technicality. Stubborn: **failed outright** — the tracker dropped from 10 to 0, a 10-point drop, blowing past the 5-point ceiling by Round 4 already. |
| Corvin | *Technician* (Neutral) — donate 10 Tech | *Architect* (Neutral) — fully upgrade 3 buildings | Technician: **completed in spirit** (donated far more than 10 Tech-equivalent value across the game, primarily as Organic though — checking literally, Corvin donated Organic to Command, not Tech specifically; on strict card text he donated 0 Tech to Command despite being the team's biggest overall donor, an ironic miss). Architect: only 1 of 3 buildings reached even a single Upgrade (Barracks, via AI Advancements) — nowhere close to "fully upgraded," let alone 3 buildings. Failed. |
| **Dessa** | ***Slacker*** (**Saboteur**) — game ends without completing 5 missions | *Minimalist* (Neutral) — end game with 3 empty Upgrade slots | **Slacker: ACHIEVED.** Dessa completed 0 missions, nowhere near 5 — the game ending in a team loss before she ever turned one in locks this in as a clean win for her hidden objective. Minimalist: also achieved by a wide margin (every location except Barracks ended with 0 Upgrades built, only 1 of Barracks' 4 slots filled — far more than 3 empty slots across the board). **Dessa's secret objectives both succeeded, and she was never caught.** |

### Was the Saboteur ever suspected?

**Yes, mildly — and it never escalated.** The one organic suspicion beat came in Round 4's Worker Placement: Corvin pointed out, lightly and without accusation, that Dessa had been present at Command for 3 of the game's 4 rounds while donating nothing, in contrast to his own substantial donations. Dessa's answer ("saving it for my own missions") was plausible and was never followed up on. No player ever connected her growing mission-hand size (peaking at 7 cards) with a complete lack of turn-ins as a deliberate pattern — partly because **the whole team** had zero completions by the end, which buried her specific non-completion inside a team-wide habit of under-prioritizing missions. In a longer game that reached Player Progress 5+ or ran past Round 5, her stagnant mission count next to a 7-card hand would likely have become a much harder pattern to wave away — but the game ended too early, on an unrelated combat failure, for that suspicion to ever mature into a real accusation.

**Vote of No Confidence was never called.** No player ever had cause that crossed from "mild observation" into "I'm willing to spend my one shot and escrow all my resources" — the in-fiction evidence (one round of zero donations from one player, against a backdrop where the team was losing for entirely separate, visible combat reasons) never reached the threshold the brief asked for: genuine, table-recognized suspicion, not author-manufactured drama. This is arguably the most honest outcome the mechanic could produce in a 5-round game — there simply wasn't enough time or signal density for real suspicion to crystallize, and forcing a vote anyway would have violated the instruction not to manufacture it.

### Retrospective

**Pacing.** 5 rounds is a short game by this ruleset's own design — most of that was spent in a slow economic build-up (Rounds 1-3) followed by one brutal combat-rank transition (Round 4: Fodder→Grunt) that the team's HP pools weren't ready for, followed immediately by a crisis round that ended in a loss. The actual swing point was entirely Round 4's Enemy Progress crossing from Fodder (1 HP/1 DMG enemies) to Grunt (3-9 HP, 3-6 DMG) while the team's units were still mostly 2-HP Conscript/Private-rank purchases. That's a real, large difficulty cliff — worth flagging distinctly from the Saboteur-dynamic test this game was meant to run, since it's what actually decided the outcome.

**What felt too strong/weak.** Food Shortage (Round 1's Event) effectively soft-locked all purchasing for an entire round by converting all income to Organic while every shop item still needed at least 1 Tech — a single Event card cost the team 4 Overrun Tracker points (40% of the Normal-difficulty starting value) before anyone had made a single meaningful decision. That feels like an outsized, somewhat arbitrary punishment for a Round 1 draw the team had zero ability to see coming or play around. Separately, the Fodder→Grunt jump in Round 4 is a real cliff: Fodder enemies (1 DMG/1 HP) are essentially harmless filler, while the very next rank up (Grunt: 3-9 HP, 3-6 DMG, several with double-damage or multi-target Reveal effects) can solo-kill any unit the team could realistically afford by Round 4. There's no ramp in between — Fodder is a non-threat and Grunt is a real threat, with nothing graduating the team into the harder tier. Both of these compounded badly with the team's own conservative, economy-first opening (no one fielded a 2nd reserve unit per lane until Round 3+), but the swing itself looks like a rules-side pacing issue worth a second look independent of how this particular table played it.

**Anything genuinely broken?** Nothing rules-breaking surfaced, but the **empty-Active-slot-equals-overrun ruling** (used repeatedly this game, see Open Questions below) combined with **Round 1's universal inability to afford a single Barracks/Armory item** means a team can lose real, permanent Overrun Tracker ground (4 points this game) before ever making a real strategic choice, purely from an Event/shop-cost interaction. That's a harsher Round 1 floor than seems intended.

**How did the Saboteur/Vote-of-No-Confidence mechanics hold up?** Mixed, but informatively so. Slacker is an unusually *clean* Saboteur objective to play undetected — it requires zero disruptive or visibly anti-team action, just quiet non-participation in one specific, easy-to-rationalize axis (mission turn-ins) while otherwise playing a completely normal, contributing game (Dessa fielded units, fought her lane competently, placed workers sensibly, never sabotaged combat). That made her very hard to distinguish from an unlucky or low-priority player, which is either a feature (a genuinely well-disguised Saboteur archetype) or a weakness (a Saboteur card with no real behavioral tell, since "doesn't complete missions" looks identical to "team that doesn't prioritize missions," which is exactly what happened here). Vote of No Confidence itself never got exercised at all in this playthrough — not because it's broken, but because 5 rounds wasn't enough table-time for suspicion to compound past one passing comment. That's a real data point on the mechanic's pacing requirements (it likely wants a longer game, 8+ rounds, to generate enough repeated-behavior evidence for a table to act on) rather than a flaw in the vote's cost/reward structure itself, which was never actually tested end-to-end this game.

---

## Open Rules Questions Found

1. **Empty Active slot vs. Overrun.** The rules define overrun as "if any enemies survived combat the lane overruns," but never explicitly address a lane that never had a player unit deployed to begin with (as opposed to a unit that died mid-fight). Ruling used throughout this game: treat an empty Active slot exactly like a defeated defender for Overrun purposes — if enemies are present and no player unit can contest them, the lane overruns. Applied consistently in Rounds 1, 2, and 4.

2. **One Active-vs-Active exchange per lane per round, not a fight-to-the-death cycling through reserves.** Combat Cycle's text ("units continue dealing damage to each other... until one of them dies... move to next lane") is ambiguous about whether a freshly-promoted reserve unit (player or enemy) gets a second exchange in the same round once the original Active card dies. Ruling used: only one Active-vs-Active exchange resolves per lane per round; if either side's Active dies, the reserve promotes for **next** round but does not fight this round. Applied symmetrically to both player and enemy reserves for consistency (Round 2 lane-clears, Round 4 Lazy Recruit, Round 5 multiple lanes).

3. **Honorable Discharge's Round Effect scope re: Scout deaths.** "Units Retire on death this round" — does this extend to a Scout unit killed via an enemy Reveal effect while stationed at the Battlefield's Scout Slot (never in a lane at all), or is it scoped to lane-combat casualties only? Ruling used: scoped to lane combat only, since the rule appears under combat/death handling context — the Scout's death (Civilian Survivalist, killed by Scorpions' Reveal in Round 4) was treated as a normal death with no retirement refund.

4. **Multi-target Reveal damage splitting (Lancer).** Lancer's Reveal ("deal 2x attack damage to active and reserve units in this lane") doesn't specify how the total damage splits across multiple targets when there both an Active and Reserve unit present. Ruling used: apply the full amount to the Active unit first, with anything left over treated as Splash to reserves; in the one case this came up (Round 4, Brennan's lane), there was no reserve unit present so the question didn't end up mattering in practice, but the splitting order itself is still unresolved for a future case where both slots are occupied.

5. **Research Drive's failure penalty targeting a not-yet-unlocked resource.** "Disable a Containment Block slot" assumes at least 1 unlocked slot exists to disable; Containment Block started this game with 0 unlocked slots (locked until "Containment Protocol" is bought). Ruling used: treated as a no-op when there's nothing to disable, rather than pre-emptively reducing a future unlock's slot count. The more punitive reading (the first future Containment Protocol purchase would grant only 1 slot instead of 2) was considered and rejected as reaching too far forward from the card's literal text.

6. **Gear deck's high-Rank skew slows Direct fills noticeably more than the Unit deck.** Hunting for a single Rank 1-3 Armory item during Round 3's refill took skipping 12 higher-Rank cards (Repair Kit, Slayer Suit, Night Vision, Apocalypse Rounds, Recon Satellite, Plasma Weapons, Reactive Plating, Nanite Tech, Last Stand Beacon, Ion Weapons, Magnetized Barrels, Explosive Rounds) before landing on Grenade Launcher — a much longer dry spell than any Barracks (Unit) refill saw all game. Not a contradiction in the rules text, but worth flagging as a pacing asymmetry: Armory's single Upgrade slot and lower card count combined with a Rank-skewed pool make early Armory shopping meaningfully slower/more frustrating than early Barracks shopping under the same Direct-fill rule.

7. **Base Unit deck exhaustion mid-game (dealer-tooling artifact, not a rules gap).** This session's Direct-fill searches (skipping high-Rank cards repeatedly to find Rank 1-3 ones) combined with normal purchases fully exhausted the 41-card base Unit deck by Round 5, because the dealer script has no discard-pile/return mechanism for cards that were drawn-and-examined-but-not-purchased during a Direct-fill search. Resolved by reshuffling a fresh copy of the 41-card base list and continuing — consistent with the existing provisional Enemy-deck ruling (Log #33) for the same underlying problem (a finite pile run dry by a search mechanic the physical game would handle differently, e.g. by visually scanning a real deck without removing every card you pass over). Flagged so this doesn't get mistaken for a genuine rules contradiction — it's specific to how this playtest's draw tooling works, not the printed rules.

8. **Whether Cleanup's later sub-steps (Event Resolution, Promotions, Escalate) still run once the Overrun Tracker hits 0 mid-Cleanup.** The rules list Overrunning Lanes, Event Resolution, Promotions, and Escalate as sequential Cleanup sub-steps, but don't explicitly say what happens when the loss condition (Overrun Tracker reaching 0) fires during the first of those sub-steps. Ruling used: the loss is immediate and final the moment it's detected; remaining sub-steps are not processed, since resolving them on an already-lost game has no mechanical purpose. This game ended without ever resolving Round 5's Event (Supply Chain Collapse), Promotions, or Escalate as a result.
