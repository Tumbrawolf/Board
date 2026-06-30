<script lang="ts">
  import type { LobbyEntry } from "./types";

  let { lobbyList, name, connected, error, showHostModal, onCreateRoom, onJoin, onOpenHostModal, onCloseHostModal }: {
    lobbyList: LobbyEntry[];
    name: string;
    connected: boolean;
    error: string | null;
    showHostModal: boolean;
    onCreateRoom: (name: string) => void;
    onJoin: (code: string) => void;
    onOpenHostModal: () => void;
    onCloseHostModal: () => void;
  } = $props();

  let joinCode = $state("");
  let modalName = $state(name);

  $effect(() => { modalName = name; });

  function submitJoinCode() {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    onJoin(code);
  }
</script>

<!-- Host modal -->
{#if showHostModal}
  <div class="modal-backdrop" onclick={onCloseHostModal} role="presentation"></div>
  <div class="modal" role="dialog" aria-modal="true" aria-label="Host a Game">
    <div class="modal-header">
      <h2>Host a Game</h2>
      <button class="close-x" onclick={onCloseHostModal} aria-label="Close">&#x2715;</button>
    </div>
    <label>
      Your name
      <input bind:value={modalName} maxlength="20" placeholder="e.g. Reese" autocomplete="off" />
    </label>
    {#if error}
      <p class="error">{error}</p>
    {/if}
    <div class="modal-footer">
      <button class="ghost" onclick={onCloseHostModal}>Cancel</button>
      <button class="btn-primary" onclick={() => onCreateRoom(modalName)} disabled={!connected || !modalName.trim()}>
        Create Lobby
      </button>
    </div>
  </div>
{/if}

<!-- Page content -->
<div class="page">
  <div class="page-header">
    <h2>Open Lobbies</h2>
    <button class="btn-primary" onclick={onOpenHostModal} disabled={!connected || !name.trim()}>
      + Host a Game
    </button>
  </div>

  {#if error && !showHostModal}
    <p class="error">{error}</p>
  {/if}

  {#if lobbyList.length === 0}
    <div class="empty-state">
      <p>No open lobbies right now.</p>
      <p class="hint">Be the first — host a game and share the room code!</p>
    </div>
  {:else}
    <ul class="lobby-entries">
      {#each lobbyList as entry}
        <li>
          <span class="lobby-code">{entry.code}</span>
          <span class="lobby-players">{entry.playerCount}/{entry.maxSeats} players</span>
          <button
            class="ghost join-btn"
            onclick={() => onJoin(entry.code)}
            disabled={!connected || !name.trim()}
          >Join</button>
        </li>
      {/each}
    </ul>
  {/if}

  <div class="manual-join">
    <span class="manual-label">Join by code</span>
    <input
      bind:value={joinCode}
      placeholder="XXXX"
      maxlength="4"
      style="text-transform: uppercase"
      onkeydown={(e) => e.key === "Enter" && submitJoinCode()}
    />
    <button class="ghost" onclick={submitJoinCode} disabled={!connected || !name.trim() || !joinCode.trim()}>
      Join
    </button>
  </div>
</div>

<style>
  .page {
    max-width: 660px;
    margin: 0 auto;
    padding: 2.5rem 2rem 4rem;
  }
  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
  }
  .page-header h2 {
    margin: 0;
    font-size: 1.4rem;
  }
  .btn-primary {
    background: #2a6f97;
    color: #fff;
    border: none;
    padding: 0.45rem 1.1rem;
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
  .ghost {
    background: none;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 0.3rem 0.75rem;
    font-size: 0.85em;
    cursor: pointer;
  }
  .ghost:hover:not(:disabled) {
    border-color: #2a6f97;
    color: #2a6f97;
  }
  .ghost:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .error {
    color: #c0392b;
    font-size: 0.9em;
    margin: 0.5rem 0 1rem;
  }
  .empty-state {
    text-align: center;
    padding: 3.5rem 2rem;
    color: #666;
    border: 1px dashed #ddd;
    border-radius: 10px;
    background: #fafafa;
  }
  .empty-state p {
    margin: 0 0 0.4rem;
    font-size: 1em;
  }
  .hint {
    font-size: 0.88em;
    color: #aaa;
  }
  .lobby-entries {
    list-style: none;
    padding: 0;
    margin: 0 0 1.5rem;
    border: 1px solid #e4e4e4;
    border-radius: 10px;
    overflow: hidden;
  }
  .lobby-entries li {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.9rem 1.25rem;
    border-bottom: 1px solid #f0f0f0;
    transition: background 0.1s;
  }
  .lobby-entries li:last-child {
    border-bottom: none;
  }
  .lobby-entries li:hover {
    background: #f8fafd;
  }
  .lobby-code {
    font-family: monospace;
    font-size: 1.15em;
    letter-spacing: 0.12em;
    font-weight: 700;
    flex: 1;
    color: #111;
  }
  .lobby-players {
    font-size: 0.85em;
    color: #888;
  }
  .join-btn {
    padding: 0.3rem 1rem;
  }
  .manual-join {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-top: 1.25rem;
    padding-top: 1.25rem;
    border-top: 1px solid #ececec;
  }
  .manual-label {
    font-size: 0.88em;
    color: #777;
    white-space: nowrap;
  }
  .manual-join input {
    padding: 0.35rem 0.6rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 0.9em;
    width: 70px;
    font-family: monospace;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  /* Host modal */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 400;
  }
  .modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #fff;
    border-radius: 12px;
    padding: 1.75rem 2rem 1.5rem;
    width: min(380px, calc(100vw - 2rem));
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
    z-index: 401;
  }
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.25rem;
  }
  .modal-header h2 {
    margin: 0;
    font-size: 1.1em;
  }
  .close-x {
    background: none;
    border: none;
    font-size: 1.1rem;
    cursor: pointer;
    padding: 0.2rem 0.4rem;
    color: #777;
    border-radius: 4px;
    line-height: 1;
  }
  .close-x:hover {
    background: #f0f0f0;
    color: #111;
  }
  .modal label {
    display: block;
    font-size: 0.9em;
    color: #555;
    margin-bottom: 1rem;
  }
  .modal input {
    display: block;
    width: 100%;
    margin-top: 0.35rem;
    padding: 0.5rem 0.65rem;
    border: 1px solid #ccc;
    border-radius: 6px;
    font-size: 1em;
    box-sizing: border-box;
  }
  .modal-footer {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    margin-top: 1.5rem;
  }
</style>
