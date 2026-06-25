<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { socket } from "./socket";
  import FirstUseTip from "./FirstUseTip.svelte";
  import type { GameStateSnapshot } from "./types";

  let { snapshot, mySeatIndex }: { snapshot: GameStateSnapshot; mySeatIndex: number | null } = $props();

  interface PlanningCard {
    name: string;
    building: string;
    passiveEffect: string;
    activeEffect: string;
    organic: number;
    tech: number;
    alien: number;
    canBuild: boolean;
    canActivate: boolean;
  }
  interface PlanningPrompt {
    isCommander: boolean;
    eligibleToActivateAsNonCommander: boolean;
    hand: PlanningCard[];
    timeoutMs: number;
  }

  let prompt = $state<PlanningPrompt | null>(null);
  let resolvedCards = $state<Record<string, "build" | "activate" | "skip">>({});
  let errorMsg = $state<string | null>(null);
  let secondsLeft = $state(0);
  let timerHandle: ReturnType<typeof setInterval> | undefined;

  function onPrompt(payload: PlanningPrompt) {
    prompt = payload;
    resolvedCards = {};
    errorMsg = null;
    secondsLeft = Math.round(payload.timeoutMs / 1000);
    clearInterval(timerHandle);
    timerHandle = setInterval(() => {
      secondsLeft = Math.max(0, secondsLeft - 1);
      if (secondsLeft <= 0) clearInterval(timerHandle);
    }, 1000);
  }
  function onUpdate(payload: { hand: PlanningCard[] }) {
    if (prompt) prompt = { ...prompt, hand: payload.hand };
  }

  onMount(() => {
    socket.on("planning:prompt", onPrompt);
    socket.on("planning:update", onUpdate);
  });
  onDestroy(() => {
    socket.off("planning:prompt", onPrompt);
    socket.off("planning:update", onUpdate);
    clearInterval(timerHandle);
  });

  const me = $derived(snapshot.players.find((p) => p.seatIndex === mySeatIndex) ?? null);

  function ack(label: string) {
    return (res: { ok: boolean; error?: string }) => {
      if (!res?.ok) errorMsg = res?.error ?? `Couldn't ${label}.`;
      else errorMsg = null;
    };
  }

  function buyUnit(name: string) {
    socket.emit("planning:buyUnit", { name }, ack("buy that unit"));
  }
  function buyGear(name: string) {
    socket.emit("planning:buyGear", { name }, ack("buy that gear"));
  }
  function resolveCard(name: string, action: "build" | "activate" | "skip") {
    resolvedCards = { ...resolvedCards, [name]: action };
    socket.emit("planning:resolveCard", { name, action }, ack("resolve that card"));
  }
  function finishPlanning() {
    socket.emit("planning:done");
    prompt = null;
    clearInterval(timerHandle);
  }
</script>

{#if prompt && me}
  <div class="planning">
    <div class="planning-header">
      <strong>Your Planning turn</strong>
      <span class="timer">{secondsLeft}s left</span>
      <button class="done" onclick={finishPlanning}>Done with Planning</button>
    </div>
    {#if errorMsg}<div class="error">{errorMsg}</div>{/if}
    <FirstUseTip
      tipId="planning"
      text="Buy units, buy/equip gear, and build/activate/skip Command Cards in any order -- they're all open at once. Hit 'Done with Planning' when you're finished (or it'll auto-resolve after the timer)."
    />

    <div class="columns">
      <section class="col">
        <h4>Shop: Units</h4>
        <div class="res-line">Your resources: O {me.res.Organic} / T {me.res.Tech} / A {me.res.Alien} (Rank {me.rank})</div>
        <ul>
          {#each snapshot.shopUnits as u}
            <li>
              <span class="item-name">{u.name}</span>
              <span class="item-stats">Rk{u.rank} Dmg{u.damage} HP{u.hp} Arm{u.armor} Shd{u.shields}</span>
              <span class="item-cost">O{u.organicCost}/T{u.techCost}/A{u.alienCost}</span>
              <button onclick={() => buyUnit(u.name)}>Buy</button>
            </li>
          {/each}
        </ul>
      </section>

      <section class="col">
        <h4>Shop: Gear (auto-equips onto your active unit)</h4>
        <ul>
          {#each snapshot.shopGear as g}
            <li>
              <span class="item-name">{g.name}</span>
              <span class="item-stats">Rk{g.rank} Dmg{g.damage} HP{g.hp} Arm{g.armor} Shd{g.shields}</span>
              <span class="item-cost">O{g.organicCost}/T{g.techCost}/A{g.alienCost}</span>
              <button onclick={() => buyGear(g.name)} disabled={!me.active}>Buy</button>
            </li>
          {/each}
        </ul>
        {#if !me.active}<div class="hint">No active unit yet -- gear can't be equipped until you have one.</div>{/if}
      </section>

      <section class="col">
        <h4>Command Cards</h4>
        {#if !prompt.hand.length}
          <div class="hint">Nothing actionable in your hand this round.</div>
        {/if}
        <ul>
          {#each prompt.hand as c}
            <li class="card">
              <div class="card-name">{c.name} <span class="card-loc">({c.building})</span></div>
              <div class="card-text">{c.passiveEffect ? `Build: ${c.passiveEffect}` : ""}</div>
              <div class="card-text">{c.activeEffect ? `Activate: ${c.activeEffect}` : ""}</div>
              <div class="card-cost">Cost: O{c.organic}/T{c.tech}/A{c.alien}</div>
              <div class="card-actions">
                {#if c.canBuild}
                  <button class:selected={resolvedCards[c.name] === "build"} onclick={() => resolveCard(c.name, "build")}>Build</button>
                {/if}
                {#if c.canActivate}
                  <button class:selected={resolvedCards[c.name] === "activate"} onclick={() => resolveCard(c.name, "activate")}>Activate</button>
                {/if}
                <button class:selected={!resolvedCards[c.name] || resolvedCards[c.name] === "skip"} onclick={() => resolveCard(c.name, "skip")}>
                  Skip
                </button>
              </div>
            </li>
          {/each}
        </ul>
      </section>
    </div>
  </div>
{/if}

<style>
  .planning {
    border: 2px solid #2a6f97;
    border-radius: 8px;
    padding: 0.6rem 0.8rem;
    margin: 0.5rem 0;
    background: #f4faff;
  }
  .planning-header {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    margin-bottom: 0.4rem;
  }
  .timer {
    color: #666;
    font-size: 0.85em;
  }
  .done {
    margin-left: auto;
    background: #2a6f97;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 0.3rem 0.8rem;
    cursor: pointer;
  }
  .error {
    color: #a33;
    font-size: 0.85em;
    margin-bottom: 0.4rem;
  }
  .columns {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.8rem;
  }
  .col h4 {
    margin: 0 0 0.3rem;
    font-size: 0.9em;
  }
  .res-line {
    font-size: 0.8em;
    color: #555;
    margin-bottom: 0.3rem;
  }
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    font-size: 0.8em;
  }
  li {
    margin-bottom: 0.3rem;
    padding: 0.3rem;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    background: white;
  }
  .item-name {
    font-weight: bold;
    display: block;
  }
  .item-stats,
  .item-cost {
    display: inline-block;
    color: #666;
    margin-right: 0.4rem;
  }
  .card-name {
    font-weight: bold;
  }
  .card-loc {
    color: #888;
    font-weight: normal;
  }
  .card-text {
    color: #555;
    font-size: 0.95em;
  }
  .card-cost {
    color: #888;
    margin: 0.15rem 0;
  }
  .card-actions {
    display: flex;
    gap: 0.3rem;
    margin-top: 0.2rem;
  }
  .card-actions button.selected {
    background: #2a6f97;
    color: white;
  }
  .hint {
    color: #888;
    font-size: 0.8em;
    font-style: italic;
  }
  button {
    cursor: pointer;
  }
</style>
