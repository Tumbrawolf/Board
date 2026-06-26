<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { socket } from "./socket";
  import FirstUseTip from "./FirstUseTip.svelte";

  interface WorkerSlot {
    index: number;
    seatIndex: number;
    name: string;
  }
  interface ContestedLocation {
    location: string;
    fullSlots: number;
    workers: WorkerSlot[];
  }
  interface CommandersCallPrompt {
    requestId: string;
    timeoutMs: number;
    locations: ContestedLocation[];
  }

  let prompt = $state<CommandersCallPrompt | null>(null);
  let selected = $state<Record<string, number[]>>({});
  let secondsLeft = $state(0);
  let timerHandle: ReturnType<typeof setInterval> | undefined;

  function onPrompt(payload: CommandersCallPrompt) {
    prompt = payload;
    selected = Object.fromEntries(payload.locations.map((l) => [l.location, []]));
    secondsLeft = Math.round(payload.timeoutMs / 1000);
    clearInterval(timerHandle);
    timerHandle = setInterval(() => {
      secondsLeft = Math.max(0, secondsLeft - 1);
      if (secondsLeft <= 0) clearInterval(timerHandle);
    }, 1000);
  }

  onMount(() => socket.on("commandersCall:prompt", onPrompt));
  onDestroy(() => {
    socket.off("commandersCall:prompt", onPrompt);
    clearInterval(timerHandle);
  });

  function toggle(location: string, fullSlots: number, idx: number) {
    const cur = selected[location] ?? [];
    if (cur.includes(idx)) {
      selected = { ...selected, [location]: cur.filter((i) => i !== idx) };
    } else if (cur.length < fullSlots) {
      selected = { ...selected, [location]: [...cur, idx] };
    }
  }

  const allDone = $derived(
    prompt ? prompt.locations.every((l) => (selected[l.location]?.length ?? 0) === l.fullSlots) : false
  );

  function confirm() {
    if (!prompt) return;
    socket.emit("commandersCall:choose", { requestId: prompt.requestId, assignments: selected });
    prompt = null;
    clearInterval(timerHandle);
  }
</script>

{#if prompt}
  <div class="cc-panel">
    <FirstUseTip
      tipId="commandersCall"
      text="Commander's Call is on: for each location below, pick which worker(s) get full income instead of it being decided by who placed first."
    />
    <div class="header">
      <strong>Commander's Call -- assign full income</strong>
      <span class="timer">{secondsLeft}s left</span>
    </div>
    {#each prompt.locations as loc}
      <div class="loc">
        <div class="loc-name">{loc.location} -- pick {loc.fullSlots} for full income</div>
        <div class="workers">
          {#each loc.workers as w}
            <button
              class:selected={(selected[loc.location] ?? []).includes(w.index)}
              onclick={() => toggle(loc.location, loc.fullSlots, w.index)}
            >
              {w.name}
            </button>
          {/each}
        </div>
      </div>
    {/each}
    <button class="confirm" disabled={!allDone} onclick={confirm}>Confirm</button>
  </div>
{/if}

<style>
  .cc-panel {
    border: 2px solid #d9a300;
    border-radius: 8px;
    padding: 0.6rem 0.8rem;
    margin: 0.5rem 0;
    background: #fffaf0;
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
  .loc {
    margin: 0.4rem 0;
  }
  .loc-name {
    font-size: 0.85em;
    color: #555;
    margin-bottom: 0.2rem;
  }
  .workers {
    display: flex;
    gap: 0.3rem;
    flex-wrap: wrap;
  }
  .workers button.selected {
    background: #d9a300;
    color: white;
    border-color: #d9a300;
  }
  .confirm {
    margin-top: 0.5rem;
    background: #d9a300;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 0.3rem 0.8rem;
    cursor: pointer;
  }
  .confirm:disabled {
    background: #e0c46c;
    cursor: not-allowed;
  }
</style>
