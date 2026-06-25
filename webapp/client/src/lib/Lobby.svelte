<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { socket, clientId, loadOrCreateName, saveName } from "./socket";
  import {
    DEFAULT_SETTINGS,
    MAX_SEATS,
    type RoomState,
    type RoomSettings,
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

  onMount(() => {
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("room:state", onRoomState);
    connected = socket.connected;
  });

  onDestroy(() => {
    socket.off("connect", onConnect);
    socket.off("disconnect", onDisconnect);
    socket.off("room:state", onRoomState);
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

<div class="wrap">
  <header>
    <h1>Board — Web Sim</h1>
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
        Stage 1: the engine isn't wired up yet — "Start Game" just records the room to
        the server's game history for now.
      </p>
    </section>
  {:else}
    <section class="card">
      <h2>Game started!</h2>
      <p>Room {room.code} is now "in game". The real engine arrives in Stage 2.</p>
    </section>
  {/if}
</div>

<style>
  .wrap {
    max-width: 640px;
    margin: 0 auto;
    padding: 1.5rem;
    font-family: system-ui, sans-serif;
  }
  header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
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
</style>
