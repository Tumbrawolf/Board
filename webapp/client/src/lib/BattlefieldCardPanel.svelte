<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { socket } from "./socket";
  import FirstUseTip from "./FirstUseTip.svelte";

  interface BattlefieldCard {
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
  interface BattlefieldPrompt {
    isCommander: boolean;
    eligibleToActivateAsNonCommander: boolean;
    hand: BattlefieldCard[];
    timeoutMs: number;
  }

  let prompt = $state<BattlefieldPrompt | null>(null);
  let errorMsg = $state<string | null>(null);
  let secondsLeft = $state(0);
  let timerHandle: ReturnType<typeof setInterval> | undefined;

  function onPrompt(payload: BattlefieldPrompt) {
    prompt = payload;
    errorMsg = null;
    secondsLeft = Math.round(payload.timeoutMs / 1000);
    clearInterval(timerHandle);
    timerHandle = setInterval(() => {
      secondsLeft = Math.max(0, secondsLeft - 1);
      if (secondsLeft <= 0) clearInterval(timerHandle);
    }, 1000);
  }
  function onUpdate(payload: { hand: BattlefieldCard[] }) {
    if (prompt) prompt = { ...prompt, hand: payload.hand };
  }

  onMount(() => {
    socket.on("battlefield:prompt", onPrompt);
    socket.on("battlefield:update", onUpdate);
  });
  onDestroy(() => {
    socket.off("battlefield:prompt", onPrompt);
    socket.off("battlefield:update", onUpdate);
    clearInterval(timerHandle);
  });

  function resolveCard(name: string, action: "build" | "activate" | "skip") {
    socket.emit("battlefield:resolveCard", { name, action }, (res: { ok: boolean; error?: string }) => {
      if (!res?.ok) errorMsg = res?.error ?? "Couldn't resolve that card.";
      else errorMsg = null;
    });
  }
  function finish() {
    socket.emit("battlefield:done");
    prompt = null;
    clearInterval(timerHandle);
  }
</script>

{#if prompt}
  <div class="battlefield-panel">
    <div class="header">
      <strong>Battlefield Cards (enemies are deployed -- act now if you want to)</strong>
      <span class="timer">{secondsLeft}s left</span>
      <button class="done" onclick={finish}>Done</button>
    </div>
    {#if errorMsg}<div class="error">{errorMsg}</div>{/if}
    <FirstUseTip
      tipId="battlefield"
      text="These Command Cards act on the enemies that just got deployed (thinning hoards, buffing your lane, etc.) -- separate from your Planning-stage hand, and resolved right before Combat."
    />
    {#if !prompt.hand.length}
      <div class="hint">Nothing actionable in your hand this round.</div>
    {/if}
    <ul>
      {#each prompt.hand as c}
        <li class="card">
          <div class="card-name">{c.name}</div>
          <div class="card-text">{c.passiveEffect ? `Build: ${c.passiveEffect}` : ""}</div>
          <div class="card-text">{c.activeEffect ? `Activate: ${c.activeEffect}` : ""}</div>
          <div class="card-cost">Cost: O{c.organic}/T{c.tech}/A{c.alien}</div>
          <div class="card-actions">
            {#if c.canBuild}<button onclick={() => resolveCard(c.name, "build")}>Build</button>{/if}
            {#if c.canActivate}<button onclick={() => resolveCard(c.name, "activate")}>Activate</button>{/if}
            <button onclick={() => resolveCard(c.name, "skip")}>Skip</button>
          </div>
        </li>
      {/each}
    </ul>
  </div>
{/if}

<style>
  .battlefield-panel {
    border: 2px solid #a33;
    border-radius: 8px;
    padding: 0.6rem 0.8rem;
    margin: 0.5rem 0;
    background: #fff5f5;
  }
  .header {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    margin-bottom: 0.4rem;
    font-size: 0.9em;
  }
  .timer {
    color: #666;
    font-size: 0.85em;
  }
  .done {
    margin-left: auto;
    background: #a33;
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
  .card-name {
    font-weight: bold;
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
  .hint {
    color: #888;
    font-size: 0.8em;
    font-style: italic;
  }
  button {
    cursor: pointer;
  }
</style>
