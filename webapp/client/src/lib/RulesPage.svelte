<script lang="ts">
  let { onBack }: { onBack: () => void } = $props();
</script>

<div class="rules">
  <button class="back" onclick={onBack}>&larr; Back to Lobby</button>
  <h1>Board — Rules &amp; How to Play</h1>
  <p class="intro">
    A cooperative tactical defense game. Your team holds lanes against escalating waves of enemies
    while managing a shared economy, recruiting and upgrading units, and completing missions —
    some players may secretly be working against the group. This page covers the current
    ruleset and how it maps onto this web version specifically.
  </p>

  <section>
    <h2>Quick Start (this web version)</h2>
    <ol>
      <li>Host a lobby, share the 4-letter room code, fill empty seats with bots or other players, then Ready Up and Start.</li>
      <li>Each round, you'll get a <strong>worker placement</strong> prompt when it's your turn — pick a location (Barracks, Armory, Medical Bay, Containment Block, Command, or Battlefield).</li>
      <li>Once everyone's placed, your <strong>Planning window</strong> opens: Shop Units, Shop Gear (auto-equips onto your active unit), and your Command Card hand are all shown together. Act on whichever you want, in any order, then hit "Done with Planning."</li>
      <li>Combat, healing, scouting, and enemy deployment all resolve automatically — watch the log and the board view to see what happened.</li>
      <li>The game ends when Player Progress reaches 10 (win) or the Overrun Tracker hits 0 (loss).</li>
    </ol>
  </section>

  <section>
    <h2>The Economy</h2>
    <p>Three resources: <strong>Organic</strong>, <strong>Tech</strong>, and <strong>Alien</strong>. You earn them from your placed workers each round, and spend them on units, gear, and location abilities.</p>
    <p>The <strong>Command Pool</strong> is a separate, shared stockpile — fed by player donations (non-commanders automatically donate a third of their leftover resources each round) and spent mostly on permanent <strong>Location Upgrades</strong> (built by the commander from their Command Card hand).</p>
  </section>

  <section>
    <h2>Locations &amp; Worker Placement</h2>
    <p>Each round you place 2 workers (3 at Rank 4+; the commander gets 1 extra). Workers go one at a time in turn order, starting to the left of the current commander. <strong>Whoever places the first worker at Command becomes next round's commander.</strong></p>
    <ul>
      <li><strong>Barracks</strong> — Organic + some Tech income, scaled by the current shop's unit Ranks.</li>
      <li><strong>Armory</strong> — Tech + some Organic income, scaled by the current shop's gear Ranks.</li>
      <li><strong>Medical Bay</strong> — heals a wounded unit and grants a small Organic bonus per heal.</li>
      <li><strong>Containment Block</strong> — Alien income from any captured/contained enemies (needs "Containment Protocol" built first).</li>
      <li><strong>Battlefield</strong> — feeds the shared Command Pool directly.</li>
      <li><strong>Command</strong> — Alien income scaled by your Rank; also makes you eligible to build/activate Command Cards this round, and makes you next round's commander if you're first there.</li>
    </ul>
    <p>The first worker at a location earns full income; additional workers that round earn half. With the <strong>Commander's Call</strong> optional rule on, the commander picks who gets the full-income slot(s) instead of it being decided by placement order.</p>
  </section>

  <section>
    <h2>Lobby settings</h2>
    <ul>
      <li><strong>Secret Objective mix</strong> — "Full" deals everyone's 2 Secret Objectives with no guarantees; "None" excludes Saboteur/Chaos entirely (a purely cooperative game); "Guaranteed Saboteur"/"Guaranteed Chaos" ensure at least one player is dealt that alignment.</li>
      <li><strong>Tiered Mission Draw</strong> (optional) — Rank 1-3 missions always draw freely; Rank 4+ missions need a shared roll to be eligible that round. Makes higher-Rank missions harder to come by.</li>
      <li><strong>Commander's Call</strong> (optional) — see above.</li>
      <li><strong>Vote of No Confidence</strong> (optional) — once per round, you can accuse another player of being Saboteur/Chaos-aligned. It costs an escrow up front; everyone except the accused votes Believed/Not Believed (ties go to Not Believed). Guess right and it's believed: the accused is exposed down to 1 clean Secret Objective, you get your escrow back plus a promotion. Guess wrong and it's believed anyway: you're demoted and lose a Secret Objective card of your own. Not believed either way: your escrow is refunded, but you have to reveal one of your own cards. Use it on real suspicion, not a guess.</li>
    </ul>
  </section>

  <section>
    <h2>Units, Gear, and Rank</h2>
    <p>Units come in Ranks from Conscript up through higher officer ranks — you can only deploy/buy units at or below your own Rank. Gear equips onto your active unit for a Tech cost scaled to its Rank, boosting its stats or granting an Active ability.</p>
    <p>Rank climbs three ways: completing a <strong>Mission</strong> (+1, or +2 if the mission is well above your current Rank), a Promotion (Command Card, or automatically on a passed Event), and <strong>Rank Trickle</strong> — every player gains +1 Rank automatically every 2 rounds, a guaranteed floor so Rank never falls too far behind the enemy's own escalation.</p>
  </section>

  <section>
    <h2>Combat</h2>
    <p>Enemies are dealt into lanes during Deployment. By default the enemy's active card hits first each exchange; a handful of "Attacks 1st" units flip that for their lane. Combat resolves lane by lane, with leftover damage carrying between fights. A lane that fully clears can reinforce a lane that's still fighting before Cleanup.</p>
    <p>A lane with enemies and no defender (dead or never deployed) is <strong>overrun</strong> — costing the Overrun Tracker, not Player Progress.</p>
  </section>

  <section>
    <h2>Winning and Losing</h2>
    <ul>
      <li><strong>Win:</strong> Player Progress reaches 10. A clean round (no overruns) advances it by 1, after Round 1.</li>
      <li><strong>Lose:</strong> the Overrun Tracker reaches 0. It starts at a Difficulty-based value and only ever goes down (-1 per overrun lane, no natural healing) — a few rare Gear/Command Cards can restore some of it.</li>
      <li>Enemy Progress is a separate danger dial (not a loss condition by itself) — it drives enemy Rank and how often a Boss spawns, escalating by 1 each round.</li>
    </ul>
  </section>

  <section>
    <h2>Missions, Events, Bosses, Tacticians, Secret Objectives</h2>
    <ul>
      <li><strong>Missions</strong> — complete a requirement (donate, kill, heal, equip, etc.) for a resource/instant reward and a Rank gain.</li>
      <li><strong>Events</strong> — one drawn and active each round, resolved at Cleanup on a pass/fail roll with its own reward/penalty.</li>
      <li><strong>Bosses</strong> — spawn on a rising chance as Enemy Progress climbs, escalate through 5 tiers, and trade one damage exchange per round with any lane that's clear of its own enemies.</li>
      <li><strong>Tactician</strong> — your commander role, a passive identity that shapes your strategy (cheaper purchases for certain card types, bonus Medical Bay healing, etc.) for the whole game.</li>
      <li><strong>Secret Objective</strong> — a hidden personal win condition, aligned Allied/Neutral/Saboteur/Chaos. Not everyone at the table is necessarily rooting for the same outcome.</li>
    </ul>
  </section>

  <section>
    <h2>What's still bot-only in this web version</h2>
    <p>Targeting decisions are still automatic for every seat, including humans — there's no ability in the engine yet that genuinely needs a player to pick a target. Everything else — purchases, equip, and both rounds of Command Card build/activate/skip (Planning-stage, and the Battlefield-building cards resolved mid-Combat) — is a real decision for a connected human player.</p>
  </section>
</div>

<style>
  .rules {
    max-width: 760px;
    margin: 0 auto;
    padding: 1rem 1.2rem 3rem;
    font-size: 0.95em;
    line-height: 1.45;
  }
  .back {
    background: none;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 0.3rem 0.7rem;
    cursor: pointer;
    margin-bottom: 0.8rem;
  }
  h1 {
    margin-bottom: 0.3rem;
  }
  .intro {
    color: #555;
  }
  section {
    margin-top: 1.4rem;
  }
  section h2 {
    border-bottom: 1px solid #e0e0e0;
    padding-bottom: 0.2rem;
    font-size: 1.1em;
  }
  ul,
  ol {
    padding-left: 1.3rem;
  }
  li {
    margin-bottom: 0.35rem;
  }
</style>
