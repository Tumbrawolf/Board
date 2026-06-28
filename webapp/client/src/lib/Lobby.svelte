<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { socket, clientId, loadOrCreateName, saveName } from "./socket";
  import BoardView from "./BoardView.svelte";
  import PlanningPanel from "./PlanningPanel.svelte";
  import BattlefieldCardPanel from "./BattlefieldCardPanel.svelte";
  import CommandersCallPanel from "./CommandersCallPanel.svelte";
  import VoteOfNoConfidencePanel from "./VoteOfNoConfidencePanel.svelte";
  import EventChoicePanel from "./EventChoicePanel.svelte";
  import TacticianActivePanel from "./TacticianActivePanel.svelte";
  import GearDiscardPanel from "./GearDiscardPanel.svelte";
  import LaneAssignmentPanel from "./LaneAssignmentPanel.svelte";
  import LeadershipCrisisPanel from "./LeadershipCrisisPanel.svelte";
  import PerfectInfoPanel from "./PerfectInfoPanel.svelte";
  import RulesPage from "./RulesPage.svelte";
  import FirstUseTip from "./FirstUseTip.svelte";

  let showRules = $state(false);
  import {
    DEFAULT_SETTINGS,
    MAX_SEATS,
    type RoomState,
    type RoomSettings,
    type GameStateSnapshot,
    type PrivateStateSnapshot,
  } from "./types";

  let name = $state(loadOrCreateName());
  let joinCode = $state("");
  let room = $state<RoomState | null>(null);
  let error = $state<string | null>(null);
  let connected = $state(false);

  const mySeat = $derived(
    room ? room.seats.find((s) => s?.clientId === clientId) ?? null : null
  );
  const isHost = $derived(mySeat?.isHost ?? false);
  const settingsDraft = $state<RoomSettings>(structuredClone(DEFAULT_SETTINGS));

  // Keep the local settings draft in sync with the server whenever room state arrives,
  // but only the host actually edits it (others just see it reflected).
  $effect(() => {
    if (room) {
      settingsDraft.difficulty = room.settings.difficulty;
      settingsDraft.antagonistMix = room.settings.antagonistMix;
      settingsDraft.optionalRules.tieredMissionDraw = room.settings.optionalRules.tieredMissionDraw;
      settingsDraft.optionalRules.voteOfNoConfidence = room.settings.optionalRules.voteOfNoConfidence;
      settingsDraft.optionalRules.commandersCall = room.settings.optionalRules.commandersCall;
    }
  });

  function onConnect() {
    connected = true;
  }
  function onDisconnect() {
    connected = false;
  }
  function onRoomState(state: RoomState) {
    room = state;
  }

  let gameLog = $state<string[]>([]);
  let gameSnapshot = $state<GameStateSnapshot | null>(null);
  let privateState = $state<PrivateStateSnapshot | null>(null);
  let gameOver = $state<{ status: string; round: number } | null>(null);
  let logEl: HTMLDivElement | undefined = $state();

  function onGameLog({ text }: { text: string }) {
    gameLog.push(text);
    if (gameLog.length > 500) gameLog = gameLog.slice(-500);
    queueMicrotask(() => {
      if (logEl) logEl.scrollTop = logEl.scrollHeight;
    });
  }
  function onGameState(snapshot: GameStateSnapshot) {
    gameSnapshot = snapshot;
  }
  function onPrivateState(snapshot: PrivateStateSnapshot) {
    privateState = snapshot;
  }
  function onGameOver(payload: { status: string; round: number }) {
    gameOver = payload;
  }

  interface PlacementPrompt {
    requestId: string;
    locations: string[];
    placedSoFar: Record<string, { seatIndex: number; name: string }[]>;
  }
  let placementPrompt = $state<PlacementPrompt | null>(null);

  function onPlacementPrompt(payload: PlacementPrompt) {
    placementPrompt = payload;
  }
  function choosePlacement(location: string) {
    if (!placementPrompt) return;
    socket.emit("placement:choose", { requestId: placementPrompt.requestId, location });
    placementPrompt = null;
  }

  onMount(() => {
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("room:state", onRoomState);
    socket.on("game:log", onGameLog);
    socket.on("game:state", onGameState);
    socket.on("game:privateState", onPrivateState);
    socket.on("game:over", onGameOver);
    socket.on("placement:prompt", onPlacementPrompt);
    connected = socket.connected;
  });

  onDestroy(() => {
    socket.off("connect", onConnect);
    socket.off("disconnect", onDisconnect);
    socket.off("room:state", onRoomState);
    socket.off("game:log", onGameLog);
    socket.off("game:state", onGameState);
    socket.off("game:privateState", onPrivateState);
    socket.off("game:over", onGameOver);
    socket.off("placement:prompt", onPlacementPrompt);
  });

  function persistName() {
    saveName(name);
  }

  function createRoom() {
    error = null;
    persistName();
    socket.emit(
      "room:create",
      { clientId, name },
      (res: { ok: boolean; roomCode?: string; error?: string }) => {
        if (!res.ok) error = res.error ?? "Could not create room";
      }
    );
  }

  function joinRoom() {
    error = null;
    persistName();
    socket.emit(
      "room:join",
      { clientId, name, roomCode: joinCode.trim().toUpperCase() },
      (res: { ok: boolean; error?: string }) => {
        if (!res.ok) error = res.error ?? "Could not join room";
      }
    );
  }

  function toggleReady() {
    socket.emit("room:toggleReady", { ready: !mySeat?.ready });
  }

  function toggleBot(seatIndex: number) {
    socket.emit("room:toggleBot", { seatIndex }, (res: { ok: boolean; error?: string }) => {
      if (!res.ok) error = res.error ?? "Could not toggle bot seat";
    });
  }

  function removeSeat(seatIndex: number) {
    socket.emit("room:removeSeat", { seatIndex }, (res: { ok: boolean; error?: string }) => {
      if (!res.ok) error = res.error ?? "Could not remove seat";
    });
  }

  function saveSettings() {
    socket.emit(
      "room:updateSettings",
      { settings: structuredClone(settingsDraft) },
      (res: { ok: boolean; error?: string }) => {
        if (!res.ok) error = res.error ?? "Could not update settings";
      }
    );
  }

  function startGame() {
    socket.emit("room:start", {}, (res: { ok: boolean; error?: string }) => {
      if (!res.ok) error = res.error ?? "Could not start game";
    });
  }

  const allReady = $derived(
    room ? room.seats.filter((s) => s).every((s) => s!.isBot || s!.ready) : false
  );
</script>

{#if showRules}
  <RulesPage onBack={() => (showRules = false)} />
{:else}
<div class="wrap" class:wide={room?.status === "started"}>
  <header>
    <h1>Board — Web Sim</h1>
    <button class="rules-link" onclick={() => (showRules = true)}>Rules &amp; How to Play</button>
    <span class="status" class:online={connected} class:offline={!connected}>
      {connected ? "connected" : "disconnected"}
    </span>
  </header>

  {#if error}
    <p class="error">{error}</p>
  {/if}

  {#if !room}
    <section class="card">
      <label>
        Your name
        <input bind:value={name} placeholder="e.g. Reese" maxlength="20" />
      </label>

      <div class="row">
        <button onclick={createRoom} disabled={!connected || !name.trim()}>
          Host a new lobby
        </button>
      </div>

      <div class="row join">
        <input
          bind:value={joinCode}
          placeholder="Room code"
          maxlength="4"
          style="text-transform:uppercase"
        />
        <button onclick={joinRoom} disabled={!connected || !name.trim() || !joinCode.trim()}>
          Join
        </button>
      </div>
    </section>
  {:else if room.status === "lobby"}
    <section class="card">
      <h2>
        Room <span class="code">{room.code}</span>
        <button class="ghost" onclick={() => navigator.clipboard.writeText(room!.code)}>
          copy
        </button>
      </h2>

      <ul class="seats">
        {#each Array(MAX_SEATS) as _, i}
          {@const seat = room.seats[i]}
          <li class:empty={!seat}>
            {#if seat}
              <span class="seat-name">
                {seat.name}
                {#if seat.isHost}<em>(host)</em>{/if}
                {#if seat.isBot}<em>(bot)</em>{/if}
              </span>
              <span class="seat-status">
                {#if seat.isBot}
                  ready
                {:else if !seat.connected}
                  disconnected
                {:else if seat.ready}
                  ready
                {:else}
                  not ready
                {/if}
              </span>
              {#if isHost}
                <button class="ghost" onclick={() => removeSeat(i)}>remove</button>
              {/if}
            {:else}
              <span class="seat-name muted">empty seat</span>
              {#if isHost}
                <button class="ghost" onclick={() => toggleBot(i)}>add bot</button>
              {/if}
            {/if}
          </li>
        {/each}
      </ul>

      <fieldset disabled={!isHost}>
        <legend>Settings {isHost ? "" : "(host only)"}</legend>
        <label>
          Difficulty
          <select bind:value={settingsDraft.difficulty} onchange={saveSettings}>
            <option value="Easy">Easy</option>
            <option value="Normal">Normal</option>
            <option value="Hard">Hard</option>
          </select>
        </label>
        <label>
          Secret Objective mix
          <select bind:value={settingsDraft.antagonistMix} onchange={saveSettings}>
            <option value="full">Full (Allied/Neutral/Saboteur/Chaos)</option>
            <option value="none">No antagonist (Allied/Neutral only)</option>
            <option value="guaranteedSaboteur">Guaranteed Saboteur</option>
            <option value="guaranteedChaos">Guaranteed Chaos</option>
          </select>
        </label>
        <label class="checkbox">
          <input
            type="checkbox"
            bind:checked={settingsDraft.optionalRules.tieredMissionDraw}
            onchange={saveSettings}
          />
          Tiered Mission Draw (optional rule)
        </label>
        <label class="checkbox">
          <input
            type="checkbox"
            bind:checked={settingsDraft.optionalRules.voteOfNoConfidence}
            onchange={saveSettings}
          />
          Vote of No Confidence (optional rule)
        </label>
        <label class="checkbox">
          <input
            type="checkbox"
            bind:checked={settingsDraft.optionalRules.commandersCall}
            onchange={saveSettings}
          />
          Commander's Call (optional rule)
        </label>
      </fieldset>

      <div class="row">
        {#if !mySeat?.isBot}
          <button onclick={toggleReady}>
            {mySeat?.ready ? "Unready" : "Ready up"}
          </button>
        {/if}
        {#if isHost}
          <button class="primary" onclick={startGame} disabled={!allReady}>
            Start Game
          </button>
        {/if}
      </div>
      <p class="hint">
        Stage 3: when it's your turn to place a worker, you'll get to pick the location
        yourself. Everything else (shopping, equipping, Command Cards) still plays itself.
      </p>
    </section>
  {:else}
    <section class="card">
      <h2>
        Room <span class="code">{room.code}</span> — in game
        {#if gameOver}
          <span class="result" class:won={gameOver.status === "won"} class:lost={gameOver.status === "lost"}>
            {gameOver.status === "won" ? "WON" : "LOST"} (Round {gameOver.round})
          </span>
        {/if}
      </h2>

      {#if placementPrompt}
        {@const disabledLoc = gameSnapshot?.disabledLocation ?? null}
        <div class="placement-prompt">
          <FirstUseTip
            tipId="placement"
            text="Each round you place workers one at a time, in turn order. Locations give different income -- check the Rules page for what each one does. Whoever places first at Command becomes next round's commander."
          />
          {#if disabledLoc}
            <p class="disabled-location-warning">{disabledLoc} is disabled this round — workers there earn no income.</p>
          {/if}
          <p>Your turn — place a worker:</p>
          <div class="placement-options">
            {#each placementPrompt.locations as loc}
              {@const count = placementPrompt.placedSoFar[loc]?.length ?? 0}
              <button onclick={() => choosePlacement(loc)} class:disabled-loc={loc === disabledLoc}>
                {loc}
                {#if loc === disabledLoc}<span class="disabled-tag"> [disabled]</span>{/if}
                {#if count}<span class="muted"> ({count} placed)</span>{/if}
              </button>
            {/each}
          </div>
        </div>
      {/if}

      <CommandersCallPanel />
      <VoteOfNoConfidencePanel />
      <LeadershipCrisisPanel />
      <EventChoicePanel />
      <TacticianActivePanel />
      <GearDiscardPanel />
      <LaneAssignmentPanel />
      <PerfectInfoPanel />

      {#if gameSnapshot}
        <div class="trackers">
          <span>Round {gameSnapshot.roundNum}</span>
          <span>Player Progress {gameSnapshot.playerProgress}/10</span>
          <span>Enemy Progress {gameSnapshot.enemyProgress}/10</span>
          <span>Overrun {gameSnapshot.overrunTracker}/{gameSnapshot.overrunTrackerMax}</span>
        </div>
        <FirstUseTip
          tipId="board"
          text="This is the board: everyone's resources, active/reserve units, and lane enemies. You win at Player Progress 10, you lose if Overrun hits 0 -- Enemy Progress just controls how tough new enemies are."
        />
        <BoardView snapshot={gameSnapshot} mySeatIndex={mySeat?.seatIndex ?? null} />
        <PlanningPanel snapshot={gameSnapshot} mySeatIndex={mySeat?.seatIndex ?? null} />
        <BattlefieldCardPanel />
      {/if}

      <div class="log" bind:this={logEl}>
        {#each gameLog as line}
          <div class="log-line">{line}</div>
        {/each}
      </div>
    </section>
  {/if}
</div>
{/if}

<style>
  .wrap {
    max-width: 640px;
    margin: 0 auto;
    padding: 1.5rem;
    font-family: system-ui, sans-serif;
    transition: max-width 0.2s ease;
  }
  .wrap.wide {
    /* The Board/Planning/Battlefield panels are multi-column and need real room -- the lobby's
       narrow centered-card width (good for a join/settings form) would crush them otherwise. */
    max-width: 1100px;
  }
  header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
  }
  .rules-link {
    background: none;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 0.25rem 0.6rem;
    cursor: pointer;
    font-size: 0.85em;
  }
  .status.online {
    color: #2a8f4e;
  }
  .status.offline {
    color: #c0392b;
  }
  .card {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 1.25rem;
    margin-top: 1rem;
  }
  .row {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.75rem;
    align-items: center;
  }
  .join input {
    text-transform: uppercase;
  }
  label {
    display: block;
    margin-bottom: 0.5rem;
  }
  input,
  select {
    display: block;
    margin-top: 0.25rem;
    padding: 0.4rem;
  }
  .checkbox {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  .checkbox input {
    margin: 0;
  }
  .code {
    font-family: monospace;
    font-size: 1.3rem;
    letter-spacing: 0.15em;
  }
  .seats {
    list-style: none;
    padding: 0;
  }
  .seats li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0;
    border-bottom: 1px solid #eee;
  }
  .seats li.empty .seat-name {
    color: #999;
  }
  .seat-name {
    flex: 1;
  }
  .seat-status {
    color: #666;
    font-size: 0.9em;
  }
  .ghost {
    background: none;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 0.8em;
    padding: 0.2rem 0.5rem;
    cursor: pointer;
  }
  button.primary {
    background: #2a6f97;
    color: white;
    border: none;
  }
  fieldset {
    margin-top: 1rem;
    border: 1px solid #eee;
    border-radius: 6px;
  }
  .error {
    color: #c0392b;
    font-weight: bold;
  }
  .hint {
    color: #888;
    font-size: 0.85em;
  }
  .muted {
    color: #aaa;
  }
  .result {
    font-size: 0.7em;
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
    margin-left: 0.5rem;
    vertical-align: middle;
  }
  .result.won {
    background: #d8f3dc;
    color: #1b4332;
  }
  .result.lost {
    background: #ffd6d6;
    color: #7a1f1f;
  }
  .trackers {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    font-size: 0.9em;
    color: #444;
    margin: 0.5rem 0;
  }
  .log {
    margin-top: 0.75rem;
    height: 320px;
    overflow-y: auto;
    background: #111;
    color: #ddd;
    font-family: ui-monospace, Consolas, monospace;
    font-size: 0.78em;
    padding: 0.6rem;
    border-radius: 6px;
    white-space: pre-wrap;
  }
  .log-line {
    line-height: 1.4;
  }
  .placement-prompt {
    margin-top: 0.75rem;
    padding: 0.75rem;
    border: 2px solid #2a6f97;
    border-radius: 6px;
    background: #eef6fb;
  }
  .placement-prompt p {
    margin: 0 0 0.5rem;
    font-weight: bold;
  }
  .placement-options {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .disabled-location-warning {
    color: #b03a2e;
    font-weight: bold;
    font-size: 0.9em;
    margin: 0 0 0.4rem;
    padding: 0.3rem 0.5rem;
    background: #fdecea;
    border-radius: 4px;
  }
  .placement-options button.disabled-loc {
    opacity: 0.55;
    border-color: #c0392b;
    color: #7a1f1f;
  }
  .disabled-tag {
    font-size: 0.8em;
    color: #c0392b;
  }
</style>
