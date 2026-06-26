<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { socket } from "./socket";
  import FirstUseTip from "./FirstUseTip.svelte";

  interface EventOption {
    name: string;
    roundEffect: string;
    completionCondition: string;
    completionReward: string;
    failurePenalty: string;
  }
  interface EventChoicePrompt {
    requestId: string;
    timeoutMs: number;
    options: EventOption[];
  }

  let prompt = $state<EventChoicePrompt | null>(null);
  let secondsLeft = $state(0);
  let timerHandle: ReturnType<typeof setInterval> | undefined;

  function onPrompt(payload: EventChoicePrompt) {
    prompt = payload;
    secondsLeft = Math.round(payload.timeoutMs / 1000);
    clearInterval(timerHandle);
    timerHandle = setInterval(() => {
      secondsLeft = Math.max(0, secondsLeft - 1);
      if (secondsLeft <= 0) clearInterval(timerHandle);
    }, 1000);
  }

  onMount(() => socket.on("eventChoice:prompt", onPrompt));
  onDestroy(() => {
    socket.off("eventChoice:prompt", onPrompt);
    clearInterval(timerHandle);
  });

  function choose(index: number) {
    if (!prompt) return;
    socket.emit("eventChoice:choose", { requestId: prompt.requestId, index });
    prompt = null;
    clearInterval(timerHandle);
  }
</script>

{#if prompt}
  <div class="event-choice-panel">
    <FirstUseTip
      tipId="eventChoice"
      text="As commander, you draw 2 Events each round and pick which one is active. Its Round Effect applies all round regardless of outcome -- weigh that against the Completion Reward you'd get for meeting the condition."
    />
    <div class="header">
      <strong>Pick this round's active Event</strong>
      <span class="timer">{secondsLeft}s left</span>
    </div>
    <div class="options">
      {#each prompt.options as opt, i}
        <div class="option">
          <div class="opt-name">{opt.name}</div>
          <div class="opt-text"><strong>Round Effect:</strong> {opt.roundEffect}</div>
          <div class="opt-text"><strong>Condition:</strong> {opt.completionCondition}</div>
          <div class="opt-text"><strong>Reward:</strong> {opt.completionReward}</div>
          <div class="opt-text"><strong>Penalty:</strong> {opt.failurePenalty}</div>
          <button onclick={() => choose(i)}>Choose this one</button>
        </div>
      {/each}
    </div>
  </div>
{/if}

<style>
  .event-choice-panel {
    border: 2px solid #2a8f4e;
    border-radius: 8px;
    padding: 0.6rem 0.8rem;
    margin: 0.5rem 0;
    background: #f3fbf6;
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
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.6rem;
  }
  @media (max-width: 600px) {
    .options {
      grid-template-columns: 1fr;
    }
  }
  .option {
    border: 1px solid #cfe8d8;
    border-radius: 6px;
    padding: 0.5rem;
    background: white;
    font-size: 0.8em;
  }
  .opt-name {
    font-weight: bold;
    margin-bottom: 0.2rem;
  }
  .opt-text {
    color: #444;
    margin: 0.1rem 0;
  }
  .option button {
    margin-top: 0.4rem;
    background: #2a8f4e;
    color: white;
    border: none;
  }
  .option button:hover {
    background: #226e3c;
  }
</style>
