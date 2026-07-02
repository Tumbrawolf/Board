<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { socket } from "./socket";

  interface Prompt {
    requestId: string;
    timeoutMs: number;
    total: number;
  }

  let data = $state<Prompt | null>(null);
  let secondsLeft = $state(0);
  let timerHandle: ReturnType<typeof setInterval> | undefined;
  let organic = $state(0);
  let tech = $state(0);
  let alien = $state(0);

  function onPrompt(payload: Prompt) {
    data = payload;
    organic = payload.total;
    tech = 0;
    alien = 0;
    secondsLeft = Math.round(payload.timeoutMs / 1000);
    clearInterval(timerHandle);
    timerHandle = setInterval(() => {
      secondsLeft = Math.max(0, secondsLeft - 1);
      if (secondsLeft <= 0) clearInterval(timerHandle);
    }, 1000);
  }

  onMount(() => socket.on("mission:resourceSplit:prompt", onPrompt));
  onDestroy(() => { socket.off("mission:resourceSplit:prompt", onPrompt); clearInterval(timerHandle); });

  const remaining = $derived(data ? data.total - organic - tech - alien : 0);
  const valid = $derived(
    data !== null &&
    organic >= 0 && tech >= 0 && alien >= 0 &&
    organic + tech + alien === data.total
  );

  function confirm() {
    if (!data || !valid) return;
    socket.emit("mission:resourceSplit:response", {
      requestId: data.requestId,
      Organic: organic,
      Tech: tech,
      Alien: alien,
    });
    data = null;
    clearInterval(timerHandle);
  }
</script>

{#if data}
  <div class="panel">
    <div class="header">
      <strong>Mission Reward — Split {data.total} Resources</strong>
      <span class="timer">{secondsLeft}s</span>
    </div>
    <p class="instruction">Split {data.total} points across Organic / Tech / Alien:</p>
    <div class="inputs">
      <label>Organic <input type="number" min="0" max={data.total} bind:value={organic} /></label>
      <label>Tech <input type="number" min="0" max={data.total} bind:value={tech} /></label>
      <label>Alien <input type="number" min="0" max={data.total} bind:value={alien} /></label>
    </div>
    <p class="remain" class:over={remaining < 0}>
      {remaining < 0 ? `Over by ${-remaining}` : remaining === 0 ? "Exact ✓" : `${remaining} remaining`}
    </p>
    <button class="confirm-btn" disabled={!valid} onclick={confirm}>Confirm Split</button>
  </div>
{/if}

<style>
  .panel {
    border: 2px solid #27ae60;
    border-radius: 8px;
    padding: 0.6rem 0.8rem;
    margin: 0.5rem 0;
    background: #f0fff6;
  }
  .header {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    margin-bottom: 0.4rem;
    font-size: 0.9em;
  }
  .timer { color: #888; font-size: 0.85em; margin-left: auto; }
  .instruction { font-size: 0.85em; margin: 0.2rem 0 0.5rem; }
  .inputs {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-bottom: 0.4rem;
  }
  .inputs label {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.85em;
  }
  .inputs input {
    width: 60px;
    padding: 0.2rem 0.4rem;
    border: 1px solid #a0d8b4;
    border-radius: 4px;
    font-size: 0.9em;
  }
  .remain { font-size: 0.85em; color: #27ae60; margin: 0 0 0.4rem; }
  .remain.over { color: #c0392b; }
  .confirm-btn {
    background: #27ae60;
    color: white;
    border: none;
    padding: 0.3rem 0.8rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85em;
  }
  .confirm-btn:disabled { background: #ccc; cursor: not-allowed; }
  .confirm-btn:not(:disabled):hover { background: #1e8449; }
</style>
