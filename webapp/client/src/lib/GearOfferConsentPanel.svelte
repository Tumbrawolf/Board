<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { socket } from "./socket";

  interface Prompt {
    requestId: string;
    timeoutMs: number;
    fromName: string;
    gearName: string;
    gearType: string;
  }

  let data = $state<Prompt | null>(null);
  let secondsLeft = $state(0);
  let timerHandle: ReturnType<typeof setInterval> | undefined;

  function onPrompt(payload: Prompt) {
    data = payload;
    secondsLeft = Math.round(payload.timeoutMs / 1000);
    clearInterval(timerHandle);
    timerHandle = setInterval(() => {
      secondsLeft = Math.max(0, secondsLeft - 1);
      if (secondsLeft <= 0) { clearInterval(timerHandle); respond(false); }
    }, 1000);
  }

  onMount(() => socket.on("planning:gearOffer", onPrompt));
  onDestroy(() => { socket.off("planning:gearOffer", onPrompt); clearInterval(timerHandle); });

  function respond(accepted: boolean) {
    if (!data) return;
    socket.emit("planning:gearOfferResponse", { requestId: data.requestId, accepted });
    data = null;
    clearInterval(timerHandle);
  }
</script>

{#if data}
  <div class="panel">
    <div class="header">
      <strong>Gear Offer</strong>
      <span class="timer">{secondsLeft}s</span>
    </div>
    <p class="instruction">
      <strong>{data.fromName}</strong> wants to equip <strong>{data.gearName}</strong>
      [{data.gearType}] on your active unit. Accept?
    </p>
    <div class="actions">
      <button class="accept-btn" onclick={() => respond(true)}>Accept</button>
      <button class="decline-btn" onclick={() => respond(false)}>Decline</button>
    </div>
  </div>
{/if}

<style>
  .panel {
    border: 2px solid #2ecc71;
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
  .instruction { font-size: 0.9em; margin: 0.2rem 0 0.6rem; }
  .actions { display: flex; gap: 0.5rem; }
  .accept-btn {
    background: #27ae60;
    color: white;
    border: none;
    padding: 0.3rem 0.8rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85em;
  }
  .accept-btn:hover { background: #1e8449; }
  .decline-btn {
    background: none;
    border: 1px solid #bbb;
    padding: 0.3rem 0.8rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85em;
    color: #666;
  }
  .decline-btn:hover { background: #f0f0f0; }
</style>
