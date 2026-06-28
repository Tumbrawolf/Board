<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { socket } from "./socket";

  interface LaneInfo {
    seatIndex: number;
    ownerName: string;
    rank: number;
    activeUnit: string | null;
    reserveCount: number;
    currentControllerSeat: number;
  }

  interface Prompt {
    requestId: string;
    timeoutMs: number;
    lanes: LaneInfo[];
  }

  let data = $state<Prompt | null>(null);
  let secondsLeft = $state(0);
  let timerHandle: ReturnType<typeof setInterval> | undefined;
  // assignments: controllerSeat -> laneSeat
  let assignments = $state<Record<number, number>>({});

  function onPrompt(payload: Prompt) {
    data = payload;
    // Initialize to identity
    assignments = Object.fromEntries(payload.lanes.map((l) => [l.seatIndex, l.seatIndex]));
    secondsLeft = Math.round(payload.timeoutMs / 1000);
    clearInterval(timerHandle);
    timerHandle = setInterval(() => {
      secondsLeft = Math.max(0, secondsLeft - 1);
      if (secondsLeft <= 0) clearInterval(timerHandle);
    }, 1000);
  }

  onMount(() => socket.on("lane:assignment:prompt", onPrompt));
  onDestroy(() => {
    socket.off("lane:assignment:prompt", onPrompt);
    clearInterval(timerHandle);
  });

  function isValid(): boolean {
    if (!data) return false;
    const controlled = new Set(Object.values(assignments));
    const seats = new Set(data.lanes.map((l) => l.seatIndex));
    return controlled.size === seats.size && [...seats].every((s) => controlled.has(s));
  }

  function setAssignment(controllerSeat: number, laneSeat: number) {
    assignments = { ...assignments, [controllerSeat]: laneSeat };
  }

  function keepDefault() {
    if (!data) return;
    assignments = Object.fromEntries(data.lanes.map((l) => [l.seatIndex, l.seatIndex]));
    confirm();
  }

  function confirm() {
    if (!data || !isValid()) return;
    socket.emit("lane:assignment:response", { requestId: data.requestId, assignments });
    data = null;
    clearInterval(timerHandle);
  }

  function ownerOf(laneSeat: number): LaneInfo | undefined {
    return data?.lanes.find((l) => l.seatIndex === laneSeat);
  }
</script>

{#if data}
  <div class="lane-panel">
    <div class="header">
      <strong>Lane Assignment</strong>
      <span class="sub">Commander's authority — assign each player to a lane</span>
      <span class="timer">{secondsLeft}s</span>
    </div>

    <div class="grid">
      {#each data.lanes as controller}
        {@const laneSeat = assignments[controller.seatIndex] ?? controller.seatIndex}
        {@const lane = ownerOf(laneSeat)}
        <div class="row">
          <div class="controller-name">
            <span class="rank">Rk{controller.rank}</span>
            {controller.ownerName}
          </div>
          <span class="arrow">→</span>
          <select
            value={laneSeat}
            onchange={(e) => setAssignment(controller.seatIndex, Number((e.target as HTMLSelectElement).value))}
          >
            {#each data.lanes as opt}
              <option value={opt.seatIndex}>{opt.ownerName}'s lane</option>
            {/each}
          </select>
          <div class="lane-preview">
            {#if lane?.activeUnit}
              <span class="unit">{lane.activeUnit}</span>
              {#if lane.reserveCount > 0}<span class="reserve">+{lane.reserveCount}</span>{/if}
            {:else}
              <span class="empty">empty</span>
            {/if}
          </div>
        </div>
      {/each}
    </div>

    {#if !isValid()}
      <p class="warn">Each lane must be assigned to exactly one player.</p>
    {/if}

    <div class="actions">
      <button class="default-btn" onclick={keepDefault}>Keep Default</button>
      <button class="confirm-btn" disabled={!isValid()} onclick={confirm}>
        Confirm Assignments
      </button>
    </div>
  </div>
{/if}

<style>
  .lane-panel {
    border: 2px solid #2980b9;
    border-radius: 8px;
    padding: 0.6rem 0.8rem;
    margin: 0.5rem 0;
    background: #f0f8ff;
  }
  .header {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-bottom: 0.5rem;
    font-size: 0.9em;
    flex-wrap: wrap;
  }
  .sub {
    color: #555;
    font-size: 0.85em;
    flex: 1;
  }
  .timer {
    color: #888;
    font-size: 0.85em;
    margin-left: auto;
  }
  .grid {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85em;
  }
  .controller-name {
    min-width: 8rem;
    font-weight: 500;
  }
  .rank {
    background: #2980b9;
    color: white;
    border-radius: 3px;
    padding: 0 4px;
    font-size: 0.8em;
    margin-right: 4px;
  }
  .arrow { color: #2980b9; font-weight: bold; }
  select {
    padding: 0.2rem 0.3rem;
    border: 1px solid #aaccee;
    border-radius: 4px;
    background: white;
    font-size: 0.85em;
    min-width: 9rem;
  }
  .lane-preview {
    flex: 1;
    font-size: 0.8em;
    color: #444;
  }
  .unit { font-style: italic; }
  .reserve { color: #2980b9; margin-left: 0.3rem; font-weight: bold; }
  .empty { color: #aaa; font-style: italic; }
  .warn {
    color: #c0392b;
    font-size: 0.8em;
    margin: 0.3rem 0;
  }
  .actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.6rem;
  }
  .default-btn {
    background: #ecf0f1;
    border: 1px solid #bdc3c7;
    border-radius: 4px;
    padding: 0.3rem 0.8rem;
    cursor: pointer;
    font-size: 0.85em;
  }
  .default-btn:hover { background: #d5dbdb; }
  .confirm-btn {
    background: #2980b9;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 0.3rem 0.8rem;
    cursor: pointer;
    font-size: 0.85em;
  }
  .confirm-btn:disabled { background: #ccc; cursor: not-allowed; }
  .confirm-btn:not(:disabled):hover { background: #1a6fa3; }
</style>
