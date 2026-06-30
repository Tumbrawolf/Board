<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { socket } from "./socket";

  interface LaneExchange {
    seatIndex: number;
    playerName: string;
    playerUnitName: string;
    playerHpBefore: number;
    playerHpAfter: number | null;
    playerMaxHp: number;
    enemyName: string;
    enemyHpBefore: number;
    enemyHpAfter: number | null;
    enemyMaxHp: number;
    combatComplete: boolean;
  }

  interface RoundData {
    requestId: string;
    roundIndex: number;
    lanes: LaneExchange[];
  }

  const DEFAULT_MS = 1500;
  const SLOW_MS = 3000;

  let data = $state<RoundData | null>(null);
  let acked = $state(false);    // sent ack for current round
  let paused = $state(false);   // server broadcast combat:paused
  let slow = $state(false);     // player local toggle
  let skipped = $state(false);  // sticky: pressed Skip this combat

  let msLeft = $state(0);
  let timerHandle: ReturnType<typeof setTimeout> | undefined;
  let tickHandle: ReturnType<typeof setInterval> | undefined;

  function clearTimers() {
    clearTimeout(timerHandle);
    clearInterval(tickHandle);
    timerHandle = undefined;
    tickHandle = undefined;
  }

  function sendAck() {
    if (!data || acked) return;
    acked = true;
    clearTimers();
    socket.emit("combat:ack", { requestId: data.requestId });
    if (data.lanes.every((l) => l.combatComplete)) {
      setTimeout(() => {
        data = null;
        acked = false;
      }, 800);
    }
  }

  function startTimer() {
    clearTimers();
    if (acked || paused) return;
    const delay = slow ? SLOW_MS : DEFAULT_MS;
    msLeft = delay;
    tickHandle = setInterval(() => {
      msLeft = Math.max(0, msLeft - 100);
    }, 100);
    timerHandle = setTimeout(sendAck, delay);
  }

  function onCombatRound(payload: RoundData) {
    clearTimers();
    data = payload;
    acked = false;
    if (skipped) {
      sendAck();
    } else if (!paused) {
      startTimer();
    }
    // If paused: data is shown, timer starts after resume.
  }

  function onCombatPaused() {
    paused = true;
    clearTimers();
  }

  function onCombatResumed() {
    paused = false;
    if (data && !acked && !skipped) startTimer();
  }

  function togglePause() {
    socket.emit(paused ? "combat:resume" : "combat:pause");
    // Server broadcasts combat:paused / combat:resumed back — we react in the handlers above.
  }

  function pressSkip() {
    skipped = true;
    socket.emit("combat:skip");
    sendAck();
  }

  // Restart timer when slow is toggled mid-round.
  $effect(() => {
    void slow;
    if (data && !acked && !paused && !skipped) startTimer();
  });

  onMount(() => {
    socket.on("combat:round", onCombatRound);
    socket.on("combat:paused", onCombatPaused);
    socket.on("combat:resumed", onCombatResumed);
  });

  onDestroy(() => {
    socket.off("combat:round", onCombatRound);
    socket.off("combat:paused", onCombatPaused);
    socket.off("combat:resumed", onCombatResumed);
    clearTimers();
  });

  function fillPct(hp: number, max: number) {
    return max > 0 ? Math.max(0, Math.min(100, (hp / max) * 100)) : 0;
  }

  function dmgPct(before: number, after: number | null, max: number) {
    if (after === null || max <= 0) return 0;
    return Math.max(0, Math.min(100, ((before - after) / max) * 100));
  }

  function timerPct() {
    const delay = slow ? SLOW_MS : DEFAULT_MS;
    return delay > 0 ? (1 - msLeft / delay) * 100 : 100;
  }
</script>

{#if data}
  <div class="combat-panel">
    <div class="combat-header">
      <strong>Combat</strong>
      <span class="exchange-tag">Exchange {data.roundIndex + 1}</span>
      <span class="status-chip" class:paused-chip={paused} class:waiting-chip={acked && !paused}>
        {#if paused}PAUSED{:else if acked}waiting...{:else}{(msLeft / 1000).toFixed(1)}s{/if}
      </span>
      <div class="controls">
        <label class="slow-label">
          <input type="checkbox" bind:checked={slow} />
          Slow
        </label>
        {#if skipped}
          <span class="skipping-tag">skipping</span>
        {:else}
          <button class="ctrl-btn skip-btn" onclick={pressSkip}>Skip</button>
        {/if}
        <button class="ctrl-btn pause-btn" class:active={paused} onclick={togglePause}>
          {paused ? "Resume" : "Pause"}
        </button>
      </div>
    </div>

    <div class="lanes">
      {#each data.lanes as lane}
        <div class="lane-row" class:done={lane.combatComplete}>
          <div class="lane-title">
            {lane.playerName}
            {#if lane.combatComplete}<span class="done-tag">clear</span>{/if}
          </div>

          <div class="matchup">
            <!-- Player unit -->
            <div class="combatant">
              <span class="cname player-name">{lane.playerUnitName}</span>
              <div class="bar-wrap">
                <div class="bar-bg">
                  <div
                    class="bar-fill pfill"
                    style="width:{fillPct(lane.playerHpAfter ?? lane.playerHpBefore, lane.playerMaxHp)}%"
                  ></div>
                  <div
                    class="bar-dmg"
                    style="left:{fillPct(lane.playerHpAfter ?? lane.playerHpBefore, lane.playerMaxHp)}%;
                           width:{dmgPct(lane.playerHpBefore, lane.playerHpAfter, lane.playerMaxHp)}%"
                  ></div>
                </div>
              </div>
              <span class="hp-text">
                {lane.playerHpAfter ?? lane.playerHpBefore}/{lane.playerMaxHp}
                {#if lane.playerHpAfter !== null && lane.playerHpAfter < lane.playerHpBefore}
                  <span class="dmg-num">-{lane.playerHpBefore - lane.playerHpAfter}</span>
                {:else if lane.playerHpAfter !== null && lane.playerHpAfter === 0}
                  <span class="dead-tag">KO</span>
                {/if}
              </span>
            </div>

            <span class="vs">vs</span>

            <!-- Enemy -->
            <div class="combatant">
              <span class="cname enemy-name">{lane.enemyName}</span>
              <div class="bar-wrap">
                <div class="bar-bg">
                  <div
                    class="bar-fill efill"
                    style="width:{fillPct(lane.enemyHpAfter ?? lane.enemyHpBefore, lane.enemyMaxHp)}%"
                  ></div>
                  <div
                    class="bar-dmg"
                    style="left:{fillPct(lane.enemyHpAfter ?? lane.enemyHpBefore, lane.enemyMaxHp)}%;
                           width:{dmgPct(lane.enemyHpBefore, lane.enemyHpAfter, lane.enemyMaxHp)}%"
                  ></div>
                </div>
              </div>
              <span class="hp-text">
                {lane.enemyHpAfter ?? lane.enemyHpBefore}/{lane.enemyMaxHp}
                {#if lane.enemyHpAfter !== null && lane.enemyHpAfter < lane.enemyHpBefore}
                  <span class="dmg-num">-{lane.enemyHpBefore - lane.enemyHpAfter}</span>
                {:else if lane.enemyHpAfter !== null && lane.enemyHpAfter === 0}
                  <span class="dead-tag">dead</span>
                {/if}
              </span>
            </div>
          </div>
        </div>
      {/each}
    </div>

    {#if !acked && !paused}
      <div class="progress-track">
        <div class="progress-fill" style="width:{timerPct()}%"></div>
      </div>
    {/if}
  </div>
{/if}

<style>
  .combat-panel {
    border: 2px solid #c0392b;
    border-radius: 8px;
    padding: 0.6rem 0.8rem;
    margin: 0.5rem 0;
    background: #fff8f8;
  }

  .combat-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    flex-wrap: wrap;
  }

  .exchange-tag {
    color: #888;
    font-size: 0.8em;
  }

  .status-chip {
    font-size: 0.8em;
    font-variant-numeric: tabular-nums;
    min-width: 3.5rem;
    text-align: center;
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
    background: #f0f0f0;
    color: #555;
  }
  .status-chip.paused-chip {
    background: #fdecea;
    color: #c0392b;
    font-weight: bold;
  }
  .status-chip.waiting-chip {
    color: #aaa;
  }

  .controls {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-left: auto;
  }

  .slow-label {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.8em;
    color: #555;
    cursor: pointer;
    margin: 0;
  }
  .slow-label input {
    margin: 0;
    display: inline;
  }

  .ctrl-btn {
    font-size: 0.78em;
    padding: 0.2rem 0.55rem;
    border-radius: 4px;
    cursor: pointer;
    border: 1px solid #ccc;
    background: white;
  }
  .ctrl-btn:hover {
    background: #f5f5f5;
  }
  .pause-btn.active {
    background: #c0392b;
    color: white;
    border-color: #c0392b;
  }
  .skip-btn {
    border-color: #e67e22;
    color: #e67e22;
  }
  .skip-btn:hover {
    background: #fff3e8;
  }

  .skipping-tag {
    font-size: 0.75em;
    color: #e67e22;
  }

  /* Lanes */
  .lanes {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .lane-row {
    border: 1px solid #eee;
    border-radius: 6px;
    padding: 0.4rem 0.5rem;
    background: white;
  }
  .lane-row.done {
    opacity: 0.6;
  }

  .lane-title {
    font-size: 0.75em;
    color: #777;
    margin-bottom: 0.3rem;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  .done-tag {
    font-size: 0.85em;
    background: #d8f3dc;
    color: #1b4332;
    padding: 0.05rem 0.3rem;
    border-radius: 3px;
  }

  .matchup {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .combatant {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .cname {
    font-size: 0.78em;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .player-name { color: #2a6f97; }
  .enemy-name  { color: #c0392b; }

  .bar-wrap { width: 100%; }
  .bar-bg {
    position: relative;
    height: 7px;
    background: #eee;
    border-radius: 4px;
    overflow: hidden;
  }
  .bar-fill {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    border-radius: 4px;
    transition: width 0.3s ease;
  }
  .pfill { background: #2a6f97; }
  .efill { background: #c0392b; }
  .bar-dmg {
    position: absolute;
    top: 0;
    height: 100%;
    background: rgba(255, 165, 0, 0.5);
    transition: left 0.3s ease, width 0.3s ease;
  }

  .hp-text {
    font-size: 0.72em;
    color: #555;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
  .dmg-num {
    color: #e67e22;
    font-weight: bold;
  }
  .dead-tag {
    font-size: 0.85em;
    background: #fdecea;
    color: #c0392b;
    padding: 0.02rem 0.3rem;
    border-radius: 3px;
  }

  .vs {
    font-size: 0.75em;
    color: #aaa;
    flex-shrink: 0;
  }

  /* Auto-advance progress bar */
  .progress-track {
    height: 3px;
    background: #eee;
    border-radius: 2px;
    margin-top: 0.5rem;
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    background: #c0392b;
    transition: width 0.1s linear;
  }
</style>
