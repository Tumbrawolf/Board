<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { socket } from "./socket";

  interface VoteCandidate {
    seatIndex: number;
    name: string;
    rank: number;
  }
  interface VotePrompt {
    requestId: string;
    candidates: VoteCandidate[];
  }

  let prompt = $state<VotePrompt | null>(null);
  let secondsLeft = $state(0);
  let timerHandle: ReturnType<typeof setInterval> | undefined;

  function onPrompt(payload: VotePrompt) {
    prompt = payload;
    secondsLeft = 20;
    clearInterval(timerHandle);
    timerHandle = setInterval(() => {
      secondsLeft = Math.max(0, secondsLeft - 1);
      if (secondsLeft <= 0) clearInterval(timerHandle);
    }, 1000);
  }

  onMount(() => socket.on("leadershipCrisis:votePrompt", onPrompt));
  onDestroy(() => {
    socket.off("leadershipCrisis:votePrompt", onPrompt);
    clearInterval(timerHandle);
  });

  function vote(seatIndex: number) {
    if (!prompt) return;
    socket.emit("leadershipCrisis:vote", { requestId: prompt.requestId, seatIndex });
    prompt = null;
    clearInterval(timerHandle);
  }
</script>

{#if prompt}
  <div class="vote-panel">
    <div class="header">
      <strong>Leadership Crisis — Vote for next commander</strong>
      <span class="timer">{secondsLeft}s</span>
    </div>
    <p class="hint">All players vote simultaneously. If everyone agrees, the winner and current commander each gain +1 rank.</p>
    <div class="candidates">
      {#each prompt.candidates as c}
        <button onclick={() => vote(c.seatIndex)}>
          {c.name} <span class="rank">Rk{c.rank}</span>
        </button>
      {/each}
    </div>
  </div>
{/if}

<style>
  .vote-panel {
    border: 2px solid #8e44ad;
    border-radius: 8px;
    padding: 0.6rem 0.8rem;
    margin: 0.5rem 0;
    background: #f9f4fc;
  }
  .header {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    margin-bottom: 0.3rem;
    font-size: 0.9em;
  }
  .timer {
    color: #888;
    font-size: 0.85em;
  }
  .hint {
    font-size: 0.8em;
    color: #666;
    margin: 0 0 0.5rem;
  }
  .candidates {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .candidates button {
    background: #8e44ad;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 0.35rem 0.7rem;
    cursor: pointer;
    font-size: 0.85em;
  }
  .candidates button:hover {
    background: #6c3483;
  }
  .rank {
    opacity: 0.8;
    font-size: 0.85em;
  }
</style>
