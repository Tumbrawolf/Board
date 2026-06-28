<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { socket } from "./socket";

  interface GearOption { idx: number; name: string; rankName: string; }

  interface Prompt {
    requestId: string;
    timeoutMs: number;
    mustDiscard: number;
    hand: GearOption[];
  }

  let data = $state<Prompt | null>(null);
  let secondsLeft = $state(0);
  let timerHandle: ReturnType<typeof setInterval> | undefined;
  let selected = $state<Set<number>>(new Set());

  function onPrompt(payload: Prompt) {
    data = payload;
    selected = new Set();
    secondsLeft = Math.round(payload.timeoutMs / 1000);
    clearInterval(timerHandle);
    timerHandle = setInterval(() => {
      secondsLeft = Math.max(0, secondsLeft - 1);
      if (secondsLeft <= 0) clearInterval(timerHandle);
    }, 1000);
  }

  onMount(() => socket.on("gear:discard:prompt", onPrompt));
  onDestroy(() => {
    socket.off("gear:discard:prompt", onPrompt);
    clearInterval(timerHandle);
  });

  function toggle(idx: number) {
    const s = new Set(selected);
    if (s.has(idx)) s.delete(idx);
    else if (s.size < (data?.mustDiscard ?? 0)) s.add(idx);
    selected = s;
  }

  function confirm() {
    if (!data || selected.size !== data.mustDiscard) return;
    socket.emit("gear:discard:response", { requestId: data.requestId, discardIndices: [...selected] });
    data = null;
    clearInterval(timerHandle);
  }
</script>

{#if data}
  <div class="discard-panel">
    <div class="header">
      <strong>Gear Hand Limit — Discard {data.mustDiscard}</strong>
      <span class="timer">{secondsLeft}s</span>
    </div>
    <p class="instruction">
      Your gear hand is over the limit. Select {data.mustDiscard} card{data.mustDiscard !== 1 ? "s" : ""} to discard.
    </p>
    {#each data.hand as g}
      <button
        class="gear-btn"
        class:selected={selected.has(g.idx)}
        onclick={() => toggle(g.idx)}
      >
        {g.name} [{g.rankName}]
      </button>
    {/each}
    <button
      class="confirm-btn"
      disabled={selected.size !== data.mustDiscard}
      onclick={confirm}
    >
      Discard Selected ({selected.size}/{data.mustDiscard})
    </button>
  </div>
{/if}

<style>
  .discard-panel {
    border: 2px solid #c0392b;
    border-radius: 8px;
    padding: 0.6rem 0.8rem;
    margin: 0.5rem 0;
    background: #fff8f7;
  }
  .header {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    margin-bottom: 0.4rem;
    font-size: 0.9em;
  }
  .timer {
    color: #888;
    font-size: 0.85em;
    margin-left: auto;
  }
  .instruction {
    font-size: 0.85em;
    margin: 0.2rem 0 0.5rem;
  }
  .gear-btn {
    display: block;
    width: 100%;
    text-align: left;
    margin: 0.15rem 0;
    padding: 0.25rem 0.5rem;
    background: white;
    border: 1px solid #e8a8a8;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8em;
  }
  .gear-btn:hover { background: #fde8e8; }
  .gear-btn.selected {
    background: #f5b8b8;
    border-color: #c0392b;
    font-weight: bold;
    text-decoration: line-through;
  }
  .confirm-btn {
    margin-top: 0.5rem;
    background: #c0392b;
    color: white;
    border: none;
    padding: 0.3rem 0.8rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85em;
  }
  .confirm-btn:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
  .confirm-btn:not(:disabled):hover { background: #a93226; }
</style>
