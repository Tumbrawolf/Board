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
  import CombatPanel from "./CombatPanel.svelte";
  import ChessmasterReassignPanel from "./ChessmasterReassignPanel.svelte";
  import ChessmasterConsentPanel from "./ChessmasterConsentPanel.svelte";
  import MissionTargetPanel from "./MissionTargetPanel.svelte";
  import MissionResourceSplitPanel from "./MissionResourceSplitPanel.svelte";
  import GearOfferConsentPanel from "./GearOfferConsentPanel.svelte";
  import RulesPage from "./RulesPage.svelte";
  import FirstUseTip from "./FirstUseTip.svelte";
  import LandingPage from "./LandingPage.svelte";
  import LobbySelectPage from "./LobbySelectPage.svelte";
  import {
    DEFAULT_SETTINGS,
    MAX_SEATS,
    type RoomState,
    type RoomSettings,
    type GameStateSnapshot,
    type PrivateStateSnapshot,
    type LobbyEntry,
  } from "./types";

  // ── Page routing ────────────────────────────────────────────────
  type Page = "landing" | "select" | "room";
  let page = $state<Page>("landing");
  let showRules = $state(false);
  let showHostModal = $state(false);

  // ── Player identity ─────────────────────────────────────────────
  let name = $state(loadOrCreateName());

  function updateName(n: string) {
    name = n;
    saveName(n);
  }

  // ── Socket / room state ─────────────────────────────────────────
  let room = $state<RoomState | null>(null);
  let error = $state<string | null>(null);
  let connected = $state(false);
  let lobbyList = $state<LobbyEntry[]>([]);

  const mySeat = $derived(
    room ? room.seats.find((s) => s?.clientId === clientId) ?? null : null
  );
  const isHost = $derived(mySeat?.isHost ?? false);
  const settingsDraft = $state<RoomSettings>(structuredClone(DEFAULT_SETTINGS));

  // Keep settings draft in sync with room when we receive state (host edits, others read)
  $effect(() => {
    if (room) {
      settingsDraft.difficulty = room.settings.difficulty;
      settingsDraft.antagonistMix = room.settings.antagonistMix;
      settingsDraft.optionalRules.tieredMissionDraw = room.settings.optionalRules.tieredMissionDraw;
      settingsDraft.optionalRules.voteOfNoConfidence = room.settings.optionalRules.voteOfNoConfidence;
      settingsDraft.optionalRules.commandersCall = room.settings.optionalRules.commandersCall;
    }
  });

  function onConnect() { connected = true; }
  function onDisconnect() { connected = false; }
  function onRoomState(state: RoomState) { room = state; }
  function onLobbyList(list: LobbyEntry[]) { lobbyList = list; }

  // ── Game state ──────────────────────────────────────────────────
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
  function onGameState(snapshot: GameStateSnapshot) { gameSnapshot = snapshot; }
  function onPrivateState(snapshot: PrivateStateSnapshot) { privateState = snapshot; }
  function onGameOver(payload: { status: string; round: number }) { gameOver = payload; }

  interface PlacementPrompt {
    requestId: string;
    locations: string[];
    placedSoFar: Record<string, { seatIndex: number; name: string }[]>;
  }
  let placementPrompt = $state<PlacementPrompt | null>(null);

  function onPlacementPrompt(payload: PlacementPrompt) { placementPrompt = payload; }
  function choosePlacement(location: string) {
    if (!placementPrompt) return;
    socket.emit("placement:choose", { requestId: placementPrompt.requestId, location });
    placementPrompt = null;
  }

  onMount(() => {
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("room:state", onRoomState);
    socket.on("lobby:list", onLobbyList);
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
    socket.off("lobby:list", onLobbyList);
    socket.off("game:log", onGameLog);
    socket.off("game:state", onGameState);
    socket.off("game:privateState", onPrivateState);
    socket.off("game:over", onGameOver);
    socket.off("placement:prompt", onPlacementPrompt);
  });

  // ── Actions ─────────────────────────────────────────────────────
  function createRoom(useName: string) {
    error = null;
    updateName(useName);
    socket.emit(
      "room:create",
      { clientId, name: useName },
      (res: { ok: boolean; roomCode?: string; error?: string }) => {
        if (!res.ok) {
          error = res.error ?? "Could not create room";
        } else {
          showHostModal = false;
          page = "room";
        }
      }
    );
  }

  function joinRoom(code: string) {
    error = null;
    saveName(name);
    socket.emit(
      "room:join",
      { clientId, name, roomCode: code.trim().toUpperCase() },
      (res: { ok: boolean; error?: string }) => {
        if (!res.ok) {
          error = res.error ?? "Could not join room";
        } else {
          page = "room";
        }
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

  // ── Sidebar nav helpers ─────────────────────────────────────────
  function goToSelect() { page = "select"; showHostModal = false; }
  function goToHost() { page = "select"; showHostModal = true; }
  function goToLanding() { page = "landing"; }
</script>

<div class="app-shell">

  <!-- ── Top bar ── -->
  <header class="topbar">
    <div class="topbar-left">
      <span class="brand">Board</span>
    </div>
    <div class="topbar-right">
      <span class="conn-dot" class:online={connected} class:offline={!connected}
        title={connected ? "Connected" : "Disconnected"}></span>
      <span class="conn-label" class:online={connected} class:offline={!connected}>
        {connected ? "connected" : "disconnected"}
      </span>
      <button
        class="rules-topbar-btn"
        class:active={showRules}
        onclick={() => (showRules = !showRules)}
        title="Rules & How to Play"
      >
        &#x1F4D6; Rules
      </button>
    </div>
  </header>

  <!-- ── Body row: sidebar + content ── -->
  <div class="body-row">

    <!-- Left sidebar -->
    <nav class="sidebar">
      <div class="sidebar-logo">
        <span class="sidebar-title">Board</span>
        <span class="sidebar-sub">Web Sim</span>
      </div>

      <div class="sidebar-section">
        <span class="sidebar-section-label">Navigate</span>
        <button
          class="nav-btn"
          class:active={page === "landing" && !room}
          onclick={goToLanding}
        >
          &#x1F3E0; Main Menu
        </button>
        <button
          class="nav-btn"
          class:active={page === "select"}
          onclick={goToSelect}
        >
          &#x1F4CB; Lobby List
        </button>
      </div>

      <div class="sidebar-section">
        <span class="sidebar-section-label">Game</span>
        <button class="nav-btn" onclick={goToHost} disabled={!connected}>
          &#x2795; Host a Game
        </button>
      </div>

      {#if room !== null && page !== "room"}
        <div class="sidebar-section">
          <button class="nav-btn back-to-game" onclick={() => (page = "room")}>
            &#x1F3AE; Back to Game
          </button>
        </div>
      {/if}
    </nav>

    <!-- Main content -->
    <main class="main-content" class:wide={page === "room" && room?.status === "started"}>

      {#if error && page !== "select"}
        <p class="top-error">{error}</p>
      {/if}

      {#if page === "landing"}
        <LandingPage
          {name}
          onNameChange={updateName}
          onBrowse={goToSelect}
          onHost={goToHost}
        />

      {:else if page === "select"}
        <LobbySelectPage
          {lobbyList}
          {name}
          {connected}
          {error}
          {showHostModal}
          onCreateRoom={createRoom}
          onJoin={joinRoom}
          onOpenHostModal={() => (showHostModal = true)}
          onCloseHostModal={() => (showHostModal = false)}
        />

      {:else}
        <!-- Room view: lobby settings or in-game -->
        <div class="room-wrap">
          {#if room?.status === "lobby"}
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
                  <button class="btn-primary" onclick={startGame} disabled={!allReady}>
                    Start Game
                  </button>
                {/if}
              </div>
              <p class="hint">
                Human players control worker placement, shopping, gear equipping, Command Cards, and
                all mid-round prompts (missions, gear offers, Chessmaster, etc.).
              </p>
            </section>

          {:else if room}
            <!-- In-game -->
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

              <CombatPanel />
              <CommandersCallPanel />
              <VoteOfNoConfidencePanel />
              <LeadershipCrisisPanel />
              <EventChoicePanel />
              <TacticianActivePanel />
              <GearDiscardPanel />
              <LaneAssignmentPanel />
              <PerfectInfoPanel />
              <ChessmasterReassignPanel />
              <ChessmasterConsentPanel />
              <MissionTargetPanel />
              <MissionResourceSplitPanel />
              <GearOfferConsentPanel />

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

    </main>
  </div>
</div>

{#if showRules}
  <RulesPage onClose={() => (showRules = false)} />
{/if}

<style>
  /* ── Shell ─────────────────────────────────────────────────────── */
  .app-shell {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  /* ── Top bar ────────────────────────────────────────────────────── */
  .topbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 52px;
    background: #1a1a2e;
    color: #e8e8f0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1.25rem;
    z-index: 200;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
    flex-shrink: 0;
  }
  .topbar-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .brand {
    font-size: 1.15em;
    font-weight: 700;
    letter-spacing: 0.05em;
    color: #fff;
  }
  .topbar-right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .conn-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #aaa;
    flex-shrink: 0;
  }
  .conn-dot.online { background: #4caf82; }
  .conn-dot.offline { background: #e05252; }
  .conn-label {
    font-size: 0.78em;
    color: #aaa;
  }
  .conn-label.online { color: #4caf82; }
  .conn-label.offline { color: #e05252; }
  .rules-topbar-btn {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #e8e8f0;
    font-size: 0.85em;
    padding: 0.3rem 0.75rem;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.15s;
  }
  .rules-topbar-btn:hover {
    background: rgba(255, 255, 255, 0.18);
    border-color: rgba(255, 255, 255, 0.35);
  }
  .rules-topbar-btn.active {
    background: #2a6f97;
    border-color: #2a6f97;
    color: #fff;
  }

  /* ── Body row ───────────────────────────────────────────────────── */
  .body-row {
    display: flex;
    flex: 1;
    padding-top: 52px; /* topbar height */
    min-height: 100vh;
  }

  /* ── Sidebar ────────────────────────────────────────────────────── */
  .sidebar {
    position: fixed;
    left: 0;
    top: 52px;
    width: 195px;
    height: calc(100vh - 52px);
    background: #f4f5f7;
    border-right: 1px solid #dde0e6;
    overflow-y: auto;
    z-index: 150;
    display: flex;
    flex-direction: column;
    gap: 0;
    padding-bottom: 1.5rem;
  }
  .sidebar-logo {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 1.25rem 1.1rem 1rem;
    border-bottom: 1px solid #dde0e6;
    margin-bottom: 0.5rem;
  }
  .sidebar-title {
    font-size: 1.1em;
    font-weight: 800;
    color: #1a1a2e;
    letter-spacing: 0.03em;
    line-height: 1;
  }
  .sidebar-sub {
    font-size: 0.7em;
    color: #999;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-top: 0.2rem;
  }
  .sidebar-section {
    padding: 0.25rem 0.6rem 0.5rem;
  }
  .sidebar-section-label {
    display: block;
    font-size: 0.67em;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #aaa;
    padding: 0.4rem 0.5rem 0.35rem;
  }
  .nav-btn {
    display: block;
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    border-radius: 6px;
    padding: 0.5rem 0.75rem;
    font-size: 0.88em;
    color: #333;
    cursor: pointer;
    transition: background 0.12s;
    margin-bottom: 0.15rem;
  }
  .nav-btn:hover:not(:disabled) {
    background: #e4e6eb;
    color: #111;
  }
  .nav-btn.active {
    background: #ddeaf5;
    color: #1a5276;
    font-weight: 600;
  }
  .nav-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .back-to-game {
    color: #2a6f97;
    font-weight: 600;
    border: 1px solid #c0d8ec;
    background: #eef6fb;
  }
  .back-to-game:hover {
    background: #ddeaf5;
  }

  /* ── Main content ───────────────────────────────────────────────── */
  .main-content {
    margin-left: 195px;
    flex: 1;
    min-height: calc(100vh - 52px);
    background: #fafafa;
    transition: none;
  }

  /* ── Room view ──────────────────────────────────────────────────── */
  .room-wrap {
    max-width: 660px;
    margin: 0 auto;
    padding: 2rem 1.5rem 4rem;
  }
  .main-content.wide .room-wrap {
    max-width: 1100px;
  }
  .card {
    border: 1px solid #ddd;
    border-radius: 10px;
    padding: 1.25rem;
    background: #fff;
    margin-top: 0;
  }
  .row {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.75rem;
    align-items: center;
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
    display: inline;
  }
  .code {
    font-family: monospace;
    font-size: 1.3rem;
    letter-spacing: 0.15em;
  }
  .seats {
    list-style: none;
    padding: 0;
    margin: 0 0 0.75rem;
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
  .btn-primary {
    background: #2a6f97;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9em;
    font-weight: 600;
  }
  .btn-primary:hover:not(:disabled) {
    background: #215a7d;
  }
  .btn-primary:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  fieldset {
    margin-top: 1rem;
    border: 1px solid #eee;
    border-radius: 6px;
  }
  .top-error {
    color: #c0392b;
    font-weight: bold;
    padding: 0.75rem 2rem;
    margin: 0;
  }
  .hint {
    color: #888;
    font-size: 0.85em;
    margin-top: 0.75rem;
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
  .result.won { background: #d8f3dc; color: #1b4332; }
  .result.lost { background: #ffd6d6; color: #7a1f1f; }
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
  .log-line { line-height: 1.4; }
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
