<script lang="ts">
  import type { GameStateSnapshot } from "./types";

  let { snapshot, mySeatIndex }: { snapshot: GameStateSnapshot; mySeatIndex: number | null } = $props();
</script>

<div class="board">
  {#each snapshot.players as p}
    <div class="lane" class:mine={p.seatIndex === mySeatIndex} class:commander={p.seatIndex === snapshot.commanderSeatIndex}>
      <div class="lane-header">
        <strong>{p.name}</strong>
        <span class="rank">Rk{p.rank}</span>
        {#if p.seatIndex === snapshot.commanderSeatIndex}<span class="badge">commander</span>{/if}
        {#if p.seatIndex === mySeatIndex}<span class="badge you">you</span>{/if}
      </div>

      <div class="res">
        <span title="Organic">O {p.res.Organic}</span>
        <span title="Tech">T {p.res.Tech}</span>
        <span title="Alien">A {p.res.Alien}</span>
      </div>

      <div class="unit-row">
        <span class="label">Active:</span>
        {#if p.active}
          <span class="unit">
            {p.active.name} — {p.active.hp}/{p.active.maxHp} HP{p.active.shields ? ` +${p.active.shields} Shd` : ""}
            {#if p.active.equipped?.length}
              <span class="equipped">[{p.active.equipped.join(", ")}]</span>
            {/if}
          </span>
        {:else}
          <em class="empty">none</em>
        {/if}
      </div>

      {#if p.reserve.length}
        <div class="unit-row">
          <span class="label">Reserve:</span>
          <span class="unit">
            {p.reserve.map((u) => `${u.name} (${u.hp}/${u.maxHp})`).join(", ")}
          </span>
        </div>
      {/if}

      {#if p.laneEnemyReserve.length}
        <div class="unit-row enemies">
          <span class="label">Enemies:</span>
          <span class="unit">
            {p.laneEnemyReserve.map((e) => `${e.name} (${e.hp}HP/${e.damage}DMG)`).join(", ")}
          </span>
        </div>
      {:else}
        <div class="unit-row enemies"><span class="label">Enemies:</span> <em class="empty">clear</em></div>
      {/if}

      {#if p.revealedSecretObjective}
        <div class="unit-row revealed">
          <span class="label">Revealed:</span>
          <span class="unit">{p.revealedSecretObjective} (Secret Objective, via Vote of No Confidence)</span>
        </div>
      {/if}
    </div>
  {/each}

  <div class="shared">
    <div>Command Pool: O {snapshot.commandPool.Organic} / T {snapshot.commandPool.Tech} / A {snapshot.commandPool.Alien}</div>
  </div>
</div>

<style>
  .board {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.6rem;
    margin: 0.5rem 0;
  }
  @media (max-width: 480px) {
    .board {
      grid-template-columns: 1fr;
    }
  }
  .lane {
    border: 1px solid #ddd;
    border-radius: 6px;
    padding: 0.5rem 0.6rem;
    font-size: 0.85em;
    background: #fafafa;
  }
  .lane.mine {
    border-color: #2a6f97;
    background: #eef6fb;
  }
  .lane.commander {
    box-shadow: 0 0 0 2px #d9a300 inset;
  }
  .lane-header {
    display: flex;
    align-items: baseline;
    gap: 0.4rem;
    margin-bottom: 0.3rem;
  }
  .rank {
    color: #666;
    font-size: 0.85em;
  }
  .badge {
    font-size: 0.7em;
    background: #d9a300;
    color: white;
    border-radius: 3px;
    padding: 0.05rem 0.35rem;
  }
  .badge.you {
    background: #2a6f97;
  }
  .res {
    display: flex;
    gap: 0.6rem;
    color: #555;
    margin-bottom: 0.3rem;
  }
  .unit-row {
    margin: 0.15rem 0;
  }
  .label {
    color: #888;
    margin-right: 0.3rem;
  }
  .equipped {
    color: #777;
    font-size: 0.9em;
  }
  .empty {
    color: #aaa;
  }
  .enemies .unit {
    color: #a33;
  }
  .revealed .unit {
    color: #8a6d00;
    font-style: italic;
  }
  .shared {
    grid-column: 1 / -1;
    font-size: 0.85em;
    color: #555;
    padding-top: 0.3rem;
    border-top: 1px solid #eee;
  }
</style>
