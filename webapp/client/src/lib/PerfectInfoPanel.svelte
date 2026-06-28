<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { socket } from "./socket";

  interface EnemySummary {
    name: string;
    rank: string;
    damage: string;
    hp: string;
  }

  interface LaneInfo {
    seatIndex: number;
    ownerName: string;
    enemyIndices: number[];
  }

  interface Prompt {
    requestId: string;
    timeoutMs: number;
    pool: EnemySummary[];
    currentLanes: LaneInfo[];
  }

  let data = $state<Prompt | null>(null);
  let secondsLeft = $state(0);
  let timerHandle: ReturnType<typeof setInterval> | undefined;
  // layout: poolIdx -> seatIndex of target lane
  let layout = $state<number[]>([]);

  function onPrompt(payload: Prompt) {
    data = payload;
    // Initialize to current lane assignments.
    const assignment = new Array<number>(payload.pool.length).fill(payload.currentLanes[0]?.seatIndex ?? 0);
    for (const lane of payload.currentLanes) {
      for (const idx of lane.enemyIndices) assignment[idx] = lane.seatIndex;
    }
    layout = assignment;
    secondsLeft = Math.round(payload.timeoutMs / 1000);
    clearInterval(timerHandle);
    timerHandle = setInterval(() => {
      secondsLeft = Math.max(0, secondsLeft - 1);
      if (secondsLeft <= 0) clearInterval(timerHandle);
    }, 1000);
  }

  onMount(() => socket.on("perfectInfo:prompt", onPrompt));
  onDestroy(() => {
    socket.off("perfectInfo:prompt", onPrompt);
    clearInterval(timerHandle);
  });

  function setLane(poolIdx: number, seatIndex: number) {
    layout = layout.map((s, i) => (i === poolIdx ? seatIndex : s));
  }

  function confirm() {
    if (!data) return;
    // Build { seatIndex: poolIdx[] } map.
    const result: Record<string, number[]> = {};
    for (const lane of data.currentLanes) result[String(lane.seatIndex)] = [];
    layout.forEach((seat, idx) => {
      if (result[String(seat)]) result[String(seat)].push(idx);
    });
    socket.emit("perfectInfo:response", { requestId: data.requestId, layout: result });
    data = null;
    clearInterval(timerHandle);
  }

  function keepCurrent() {
    if (!data) return;
    const result: Record<string, number[]> = {};
    for (const lane of data.currentLanes) result[String(lane.seatIndex)] = [...lane.enemyIndices];
    socket.emit("perfectInfo:response", { requestId: data.requestId, layout: result });
    data = null;
    clearInterval(timerHandle);
  }

  function laneNameOf(seatIndex: number): string {
    return data?.currentLanes.find((l) => l.seatIndex === seatIndex)?.ownerName ?? String(seatIndex);
  }
</script>

{#if data}
  <div class="pi-panel">
    <div class="header">
      <strong>Perfect Information</strong>
      <span class="sub">Reassign enemies across lanes before combat</span>
      <span class="timer">{secondsLeft}s</span>
    </div>

    <table class="enemy-table">
      <thead>
        <tr><th>Enemy</th><th>Rank</th><th>ATK</th><th>HP</th><th>Assign to Lane</th></tr>
      </thead>
      <tbody>
        {#each data.pool as enemy, i}
          <tr>
            <td class="name">{enemy.name}</td>
            <td class="rank">{enemy.rank}</td>
            <td>{enemy.damage}</td>
            <td>{enemy.hp}</td>
            <td>
              <select
                value={layout[i]}
                onchange={(e) => setLane(i, Number((e.target as HTMLSelectElement).value))}
              >
                {#each data.currentLanes as lane}
                  <option value={lane.seatIndex}>{lane.ownerName}</option>
                {/each}
              </select>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>

    <div class="actions">
      <button class="keep-btn" onclick={keepCurrent}>Keep Current</button>
      <button class="confirm-btn" onclick={confirm}>Confirm Layout</button>
    </div>
  </div>
{/if}

<style>
  .pi-panel {
    border: 2px solid #8e44ad;
    border-radius: 8px;
    padding: 0.6rem 0.8rem;
    margin: 0.5rem 0;
    background: #fdf5ff;
  }
  .header {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-bottom: 0.5rem;
    font-size: 0.9em;
    flex-wrap: wrap;
  }
  .sub { color: #555; font-size: 0.85em; flex: 1; }
  .timer { color: #888; font-size: 0.85em; margin-left: auto; }
  .enemy-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.82em;
    margin-bottom: 0.5rem;
  }
  .enemy-table th, .enemy-table td {
    padding: 0.25rem 0.4rem;
    border: 1px solid #ddd;
    text-align: left;
  }
  .enemy-table th { background: #f0e6ff; font-weight: 600; }
  .name { font-style: italic; }
  .rank { color: #8e44ad; font-weight: 600; }
  select {
    padding: 0.15rem 0.3rem;
    border: 1px solid #c39bd3;
    border-radius: 4px;
    font-size: 0.85em;
  }
  .actions { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
  .keep-btn {
    background: #ecf0f1; border: 1px solid #bdc3c7;
    border-radius: 4px; padding: 0.3rem 0.8rem;
    cursor: pointer; font-size: 0.85em;
  }
  .keep-btn:hover { background: #d5dbdb; }
  .confirm-btn {
    background: #8e44ad; color: white; border: none;
    border-radius: 4px; padding: 0.3rem 0.8rem;
    cursor: pointer; font-size: 0.85em;
  }
  .confirm-btn:hover { background: #6c3483; }
</style>
