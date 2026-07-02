<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { socket } from "./socket";

  interface UnitOption { id: string; name: string; rank: string; }
  interface LaneOption { seatIndex: number; ownerName: string; rank: number; activeUnit: string | null; }

  interface Prompt {
    requestId: string;
    timeoutMs: number;
    yourUnits: UnitOption[];
    lanes: LaneOption[];
  }

  let data = $state<Prompt | null>(null);
  let secondsLeft = $state(0);
  let timerHandle: ReturnType<typeof setInterval> | undefined;
  let moves = $state<{ unitId: string; destSeatIndex: number }[]>([]);
  let selectedUnit = $state("");
  let selectedLane = $state(-1);

  function onPrompt(payload: Prompt) {
    data = payload;
    moves = [];
    selectedUnit = "";
    selectedLane = -1;
    secondsLeft = Math.round(payload.timeoutMs / 1000);
    clearInterval(timerHandle);
    timerHandle = setInterval(() => {
      secondsLeft = Math.max(0, secondsLeft - 1);
      if (secondsLeft <= 0) { clearInterval(timerHandle); submit(); }
    }, 1000);
  }

  onMount(() => socket.on("chessmaster:reassign:prompt", onPrompt));
  onDestroy(() => { socket.off("chessmaster:reassign:prompt", onPrompt); clearInterval(timerHandle); });

  function addMove() {
    if (!selectedUnit || selectedLane === -1) return;
    if (moves.length >= 2) return;
    if (moves.some((m) => m.unitId === selectedUnit)) return;
    moves = [...moves, { unitId: selectedUnit, destSeatIndex: selectedLane }];
    selectedUnit = "";
    selectedLane = -1;
  }

  function removeMove(i: number) {
    moves = moves.filter((_, idx) => idx !== i);
  }

  function submit() {
    if (!data) return;
    socket.emit("chessmaster:reassign:response", { requestId: data.requestId, moves });
    data = null;
    clearInterval(timerHandle);
  }

  function skip() {
    if (!data) return;
    socket.emit("chessmaster:reassign:response", { requestId: data.requestId, moves: [] });
    data = null;
    clearInterval(timerHandle);
  }
</script>

{#if data}
  <div class="panel">
    <div class="header">
      <strong>Chessmaster — Reassign Units</strong>
      <span class="timer">{secondsLeft}s</span>
    </div>
    <p class="instruction">Send up to 2 of your units to other lanes (requires their consent).</p>

    {#if moves.length < 2}
      <div class="add-move">
        <select bind:value={selectedUnit}>
          <option value="">— pick unit —</option>
          {#each data.yourUnits as u}
            <option value={u.id}>{u.name} (Rk{u.rank})</option>
          {/each}
        </select>
        <select bind:value={selectedLane}>
          <option value={-1}>— pick lane —</option>
          {#each data.lanes as l}
            <option value={l.seatIndex}>{l.ownerName} (Rk{l.rank}){l.activeUnit ? ` — ${l.activeUnit}` : " — empty"}</option>
          {/each}
        </select>
        <button onclick={addMove} disabled={!selectedUnit || selectedLane === -1}>Add</button>
      </div>
    {/if}

    {#if moves.length > 0}
      <div class="moves">
        {#each moves as m, i}
          {@const unit = data.yourUnits.find((u) => u.id === m.unitId)}
          {@const lane = data.lanes.find((l) => l.seatIndex === m.destSeatIndex)}
          <div class="move-row">
            <span>{unit?.name} → {lane?.ownerName}'s lane</span>
            <button class="remove" onclick={() => removeMove(i)}>✕</button>
          </div>
        {/each}
      </div>
    {/if}

    <div class="actions">
      <button class="confirm-btn" onclick={submit}>Send ({moves.length})</button>
      <button class="skip-btn" onclick={skip}>Skip</button>
    </div>
  </div>
{/if}

<style>
  .panel {
    border: 2px solid #7b5ea7;
    border-radius: 8px;
    padding: 0.6rem 0.8rem;
    margin: 0.5rem 0;
    background: #faf7ff;
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
  .add-move {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
    align-items: center;
    margin-bottom: 0.5rem;
  }
  select {
    font-size: 0.8em;
    padding: 0.25rem 0.4rem;
    border: 1px solid #c9b8e0;
    border-radius: 4px;
    flex: 1;
    min-width: 120px;
  }
  .add-move button {
    background: #7b5ea7;
    color: white;
    border: none;
    padding: 0.25rem 0.6rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8em;
    white-space: nowrap;
  }
  .add-move button:disabled { background: #ccc; cursor: not-allowed; }
  .add-move button:not(:disabled):hover { background: #6344a0; }
  .moves { margin-bottom: 0.5rem; }
  .move-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85em;
    padding: 0.2rem 0;
  }
  .remove { background: none; border: none; color: #c0392b; cursor: pointer; font-size: 0.85em; padding: 0; }
  .actions { display: flex; gap: 0.5rem; }
  .confirm-btn {
    background: #7b5ea7;
    color: white;
    border: none;
    padding: 0.3rem 0.8rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85em;
  }
  .confirm-btn:hover { background: #6344a0; }
  .skip-btn {
    background: none;
    border: 1px solid #bbb;
    padding: 0.3rem 0.8rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85em;
    color: #666;
  }
  .skip-btn:hover { background: #f0f0f0; }
</style>
