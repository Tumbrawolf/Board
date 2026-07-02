<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { socket } from "./socket";

  interface PlayerOption { seatIndex: number; name: string; rank: number; }

  interface Prompt {
    requestId: string;
    timeoutMs: number;
    resource: string;
    amount: number;
    players: PlayerOption[];
  }

  let data = $state<Prompt | null>(null);
  let secondsLeft = $state(0);
  let timerHandle: ReturnType<typeof setInterval> | undefined;
  let selected = $state(-1);

  function onPrompt(payload: Prompt) {
    data = payload;
    selected = -1;
    secondsLeft = Math.round(payload.timeoutMs / 1000);
    clearInterval(timerHandle);
    timerHandle = setInterval(() => {
      secondsLeft = Math.max(0, secondsLeft - 1);
      if (secondsLeft <= 0) clearInterval(timerHandle);
    }, 1000);
  }

  onMount(() => socket.on("mission:targetPlayer:prompt", onPrompt));
  onDestroy(() => { socket.off("mission:targetPlayer:prompt", onPrompt); clearInterval(timerHandle); });

  function confirm() {
    if (!data || selected === -1) return;
    socket.emit("mission:targetPlayer:response", { requestId: data.requestId, targetSeatIndex: selected });
    data = null;
    clearInterval(timerHandle);
  }
</script>

{#if data}
  <div class="panel">
    <div class="header">
      <strong>Mission Complete — Choose Recipient</strong>
      <span class="timer">{secondsLeft}s</span>
    </div>
    <p class="instruction">
      Give <strong>{data.amount} {data.resource}</strong> to a player:
    </p>
    {#each data.players as p}
      <button
        class="player-btn"
        class:sel={selected === p.seatIndex}
        onclick={() => (selected = p.seatIndex)}
      >
        {p.name} (Rk{p.rank})
      </button>
    {/each}
    <button class="confirm-btn" disabled={selected === -1} onclick={confirm}>Confirm</button>
  </div>
{/if}

<style>
  .panel {
    border: 2px solid #f39c12;
    border-radius: 8px;
    padding: 0.6rem 0.8rem;
    margin: 0.5rem 0;
    background: #fffbf0;
  }
  .header {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    margin-bottom: 0.4rem;
    font-size: 0.9em;
  }
  .timer { color: #888; font-size: 0.85em; margin-left: auto; }
  .instruction { font-size: 0.9em; margin: 0.2rem 0 0.5rem; }
  .player-btn {
    display: block;
    width: 100%;
    text-align: left;
    padding: 0.25rem 0.5rem;
    margin: 0.15rem 0;
    background: white;
    border: 1px solid #f0c060;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85em;
  }
  .player-btn:hover { background: #fef3e0; }
  .player-btn.sel { background: #f9e4aa; border-color: #f39c12; font-weight: bold; }
  .confirm-btn {
    margin-top: 0.5rem;
    background: #f39c12;
    color: white;
    border: none;
    padding: 0.3rem 0.8rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85em;
  }
  .confirm-btn:disabled { background: #ccc; cursor: not-allowed; }
  .confirm-btn:not(:disabled):hover { background: #d68910; }
</style>
