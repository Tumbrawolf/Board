<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { socket } from "./socket";
  import FirstUseTip from "./FirstUseTip.svelte";

  interface AccusationPrompt {
    requestId: string;
    timeoutMs: number;
    others: { seatIndex: number; name: string }[];
  }
  interface VotePrompt {
    requestId: string;
    timeoutMs: number;
    accuserName: string;
    accusedName: string;
  }

  let accusePrompt = $state<AccusationPrompt | null>(null);
  let votePrompt = $state<VotePrompt | null>(null);
  let secondsLeft = $state(0);
  let timerHandle: ReturnType<typeof setInterval> | undefined;

  function startTimer(ms: number) {
    secondsLeft = Math.round(ms / 1000);
    clearInterval(timerHandle);
    timerHandle = setInterval(() => {
      secondsLeft = Math.max(0, secondsLeft - 1);
      if (secondsLeft <= 0) clearInterval(timerHandle);
    }, 1000);
  }

  function onAccusePrompt(payload: AccusationPrompt) {
    accusePrompt = payload;
    startTimer(payload.timeoutMs);
  }
  function onVotePrompt(payload: VotePrompt) {
    votePrompt = payload;
    startTimer(payload.timeoutMs);
  }

  onMount(() => {
    socket.on("accusation:prompt", onAccusePrompt);
    socket.on("accusationVote:prompt", onVotePrompt);
  });
  onDestroy(() => {
    socket.off("accusation:prompt", onAccusePrompt);
    socket.off("accusationVote:prompt", onVotePrompt);
    clearInterval(timerHandle);
  });

  function accuse(seatIndex: number | null) {
    if (!accusePrompt) return;
    socket.emit("accusation:choose", { requestId: accusePrompt.requestId, accusedSeatIndex: seatIndex });
    accusePrompt = null;
    clearInterval(timerHandle);
  }

  function vote(believed: boolean) {
    if (!votePrompt) return;
    socket.emit("accusationVote:choose", { requestId: votePrompt.requestId, believed });
    votePrompt = null;
    clearInterval(timerHandle);
  }
</script>

{#if accusePrompt}
  <div class="vnc-panel">
    <FirstUseTip
      tipId="voteOfNoConfidence-accuse"
      text="Vote of No Confidence is on: you can accuse a player of being Saboteur/Chaos-aligned. It costs an escrow up front, and the table votes on whether to believe you -- a wrong accusation that's believed costs YOU. Use it if you have real reason to suspect someone, not as a guess."
    />
    <div class="header">
      <strong>Accuse someone this round?</strong>
      <span class="timer">{secondsLeft}s left</span>
    </div>
    <div class="options">
      {#each accusePrompt.others as o}
        <button onclick={() => accuse(o.seatIndex)}>Accuse {o.name}</button>
      {/each}
      <button class="skip" onclick={() => accuse(null)}>Skip</button>
    </div>
  </div>
{/if}

{#if votePrompt}
  <div class="vnc-panel">
    <div class="header">
      <strong>{votePrompt.accuserName} accuses {votePrompt.accusedName} of being Saboteur/Chaos-aligned</strong>
      <span class="timer">{secondsLeft}s left</span>
    </div>
    <p>Do you believe this accusation?</p>
    <div class="options">
      <button class="believe" onclick={() => vote(true)}>Believed</button>
      <button class="disbelieve" onclick={() => vote(false)}>Not Believed</button>
    </div>
  </div>
{/if}

<style>
  .vnc-panel {
    border: 2px solid #7a2a8a;
    border-radius: 8px;
    padding: 0.6rem 0.8rem;
    margin: 0.5rem 0;
    background: #faf3fb;
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
  .options {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
  }
  .skip {
    margin-left: auto;
  }
  .believe {
    background: #7a2a8a;
    color: white;
    border: none;
  }
  .believe:hover {
    background: #631f6f;
  }
  .disbelieve {
    background: #888;
    color: white;
    border: none;
  }
  .disbelieve:hover {
    background: #6f6f6f;
  }
</style>
