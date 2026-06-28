<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { socket } from "./socket";

  type LaneEnemy = { name: string; hp: number; armor: number; idx: number };
  type LaneDef = { seatIndex: number; playerName: string; enemies: LaneEnemy[] };

  interface Prompt {
    requestId: string;
    timeoutMs: number;
    prompt: {
      tacticianName: string;
      kind: string;
      laneEnemies?: LaneDef[];
      gearOptions?: { unitId: string; unitName: string; gearName: string; gearType: string; equippedIdx: number }[];
      playerOptions?: { seatIndex: number; name: string; rank: number }[];
      cardName?: string;
      cardActiveEffect?: string;
      cardBuildEffect?: string;
      canActivate?: boolean;
      canBuild?: boolean;
      shopOptions?: { name: string; rank: string; idx: number }[];
      recycleOptions?: { name: string; rankName: string; idx: number }[];
    };
  }

  let data = $state<Prompt | null>(null);
  let secondsLeft = $state(0);
  let timerHandle: ReturnType<typeof setInterval> | undefined;

  // swap_enemies selection state
  let swapA = $state<{ seatIndex: number; enemyIdx: number } | null>(null);
  let swapB = $state<{ seatIndex: number; enemyIdx: number } | null>(null);

  function onPrompt(payload: Prompt) {
    data = payload;
    swapA = null;
    swapB = null;
    secondsLeft = Math.round(payload.timeoutMs / 1000);
    clearInterval(timerHandle);
    timerHandle = setInterval(() => {
      secondsLeft = Math.max(0, secondsLeft - 1);
      if (secondsLeft <= 0) clearInterval(timerHandle);
    }, 1000);
  }

  onMount(() => socket.on("tactician:active:prompt", onPrompt));
  onDestroy(() => {
    socket.off("tactician:active:prompt", onPrompt);
    clearInterval(timerHandle);
  });

  function respond(response: object) {
    if (!data) return;
    socket.emit("tactician:active:response", { requestId: data.requestId, response });
    data = null;
    clearInterval(timerHandle);
  }

  function pickEnemy(seatIndex: number, enemyIdx: number) {
    respond({ seatIndex, enemyIdx });
  }

  function pickGear(gearOptIdx: number) {
    respond({ gearOptIdx });
  }

  function pickPlayer(targetSeat: number) {
    respond({ targetSeat });
  }

  function cardAction(action: "activate" | "build" | "keep") {
    respond({ cardAction: action });
  }

  function pickOption(optionIdx: number) {
    respond({ optionIdx });
  }

  function toggleSwap(seatIndex: number, enemyIdx: number) {
    const isA = swapA?.seatIndex === seatIndex && swapA?.enemyIdx === enemyIdx;
    const isB = swapB?.seatIndex === seatIndex && swapB?.enemyIdx === enemyIdx;
    if (isA) { swapA = null; return; }
    if (isB) { swapB = null; return; }
    if (!swapA) { swapA = { seatIndex, enemyIdx }; return; }
    if (!swapB) { swapB = { seatIndex, enemyIdx }; }
  }

  function confirmSwap() {
    if (!swapA || !swapB || swapA.seatIndex === swapB.seatIndex) return;
    respond({ enemyA: swapA, enemyB: swapB });
  }

  function swapSelected(si: number, ei: number) {
    return (swapA?.seatIndex === si && swapA?.enemyIdx === ei) ||
           (swapB?.seatIndex === si && swapB?.enemyIdx === ei);
  }
</script>

{#if data}
  {@const p = data.prompt}
  <div class="tac-panel">
    <div class="header">
      <strong>{p.tacticianName} — Active Ability</strong>
      <span class="timer">{secondsLeft}s</span>
    </div>

    {#if p.kind === "enemy_pick"}
      <p class="instruction">Select an enemy to target:</p>
      {#each p.laneEnemies ?? [] as lane}
        <div class="lane-block">
          <div class="lane-label">{lane.playerName}'s lane</div>
          {#each lane.enemies as e}
            <button class="enemy-btn" onclick={() => pickEnemy(lane.seatIndex, e.idx)}>
              {e.name} (HP {e.hp}, Armor {e.armor})
            </button>
          {/each}
        </div>
      {/each}

    {:else if p.kind === "gear_pick"}
      <p class="instruction">Select gear to target:</p>
      {#each p.gearOptions ?? [] as g, i}
        <button class="item-btn" onclick={() => pickGear(i)}>
          {g.gearName} [{g.gearType}] on {g.unitName}
        </button>
      {/each}

    {:else if p.kind === "player_pick"}
      <p class="instruction">Select a player:</p>
      {#each p.playerOptions ?? [] as opt}
        <button class="item-btn" onclick={() => pickPlayer(opt.seatIndex)}>
          {opt.name} (Rank {opt.rank})
        </button>
      {/each}

    {:else if p.kind === "card_action"}
      <p class="instruction">You drew <strong>{p.cardName}</strong>. What do you want to do?</p>
      <div class="card-info">
        {#if p.cardActiveEffect}<div><strong>Active:</strong> {p.cardActiveEffect}</div>{/if}
        {#if p.cardBuildEffect}<div><strong>Build:</strong> {p.cardBuildEffect}</div>{/if}
      </div>
      <div class="card-actions">
        {#if p.canActivate}<button onclick={() => cardAction("activate")}>Activate (free)</button>{/if}
        {#if p.canBuild}<button onclick={() => cardAction("build")}>Build (free)</button>{/if}
        <button onclick={() => cardAction("keep")}>Keep in hand</button>
      </div>

    {:else if p.kind === "shop_pick"}
      <p class="instruction">Select a unit:</p>
      {#each p.shopOptions ?? [] as opt}
        <button class="item-btn" onclick={() => pickOption(opt.idx)}>
          {opt.name} (Rank {opt.rank})
        </button>
      {/each}

    {:else if p.kind === "recycle_pick"}
      <p class="instruction">Select a card to recover:</p>
      {#each p.recycleOptions ?? [] as opt}
        <button class="item-btn" onclick={() => pickOption(opt.idx)}>
          {opt.name} [{opt.rankName}]
        </button>
      {/each}

    {:else if p.kind === "swap_enemies"}
      <p class="instruction">Select one enemy from two different lanes to swap (select 2, then confirm):</p>
      {#each p.laneEnemies ?? [] as lane}
        <div class="lane-block">
          <div class="lane-label">{lane.playerName}'s lane</div>
          {#each lane.enemies as e}
            <button
              class="enemy-btn"
              class:selected={swapSelected(lane.seatIndex, e.idx)}
              onclick={() => toggleSwap(lane.seatIndex, e.idx)}
            >
              {e.name} (HP {e.hp})
            </button>
          {/each}
        </div>
      {/each}
      {#if swapA && swapB && swapA.seatIndex !== swapB.seatIndex}
        <button class="confirm-btn" onclick={confirmSwap}>Confirm Swap</button>
      {:else}
        <p class="hint">Pick one from each of two different lanes.</p>
      {/if}

    {:else if p.kind === "combat_stims_passive"}
      <p class="instruction">Choose a contained enemy to trigger its Reveal ability (once per round):</p>
      {#each p.shopOptions ?? [] as opt}
        <button class="item-btn" onclick={() => pickOption(opt.idx)}>
          {opt.name}
        </button>
      {/each}
      <button class="skip-btn" onclick={() => respond({})}>Skip</button>

    {:else if p.kind === "combat_stims_active"}
      <p class="instruction">Deal self-damage to boost your active unit's attack (double the amount dealt):</p>
      {#each p.shopOptions ?? [] as opt}
        <button class="item-btn" onclick={() => pickOption(opt.idx)}>
          {opt.name}
        </button>
      {/each}
    {/if}
  </div>
{/if}

<style>
  .tac-panel {
    border: 2px solid #7b4ea6;
    border-radius: 8px;
    padding: 0.6rem 0.8rem;
    margin: 0.5rem 0;
    background: #faf4ff;
  }
  .header {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    margin-bottom: 0.4rem;
    font-size: 0.9em;
  }
  .timer {
    color: #888;
    font-size: 0.85em;
    margin-left: auto;
  }
  .instruction {
    font-size: 0.85em;
    margin: 0.2rem 0 0.4rem;
  }
  .lane-block {
    margin-bottom: 0.4rem;
  }
  .lane-label {
    font-size: 0.75em;
    color: #555;
    margin-bottom: 0.2rem;
  }
  .enemy-btn, .item-btn {
    display: block;
    width: 100%;
    text-align: left;
    margin: 0.15rem 0;
    padding: 0.25rem 0.5rem;
    background: white;
    border: 1px solid #c9a8e8;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8em;
  }
  .enemy-btn:hover, .item-btn:hover {
    background: #f0e4ff;
  }
  .enemy-btn.selected {
    background: #d9b8f5;
    border-color: #7b4ea6;
    font-weight: bold;
  }
  .card-info {
    font-size: 0.8em;
    color: #444;
    margin-bottom: 0.4rem;
  }
  .card-actions {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
  }
  .card-actions button {
    background: #7b4ea6;
    color: white;
    border: none;
    padding: 0.25rem 0.6rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8em;
  }
  .card-actions button:hover {
    background: #5e3a82;
  }
  .confirm-btn {
    margin-top: 0.4rem;
    background: #7b4ea6;
    color: white;
    border: none;
    padding: 0.3rem 0.8rem;
    border-radius: 4px;
    cursor: pointer;
  }
  .confirm-btn:hover {
    background: #5e3a82;
  }
  .skip-btn {
    margin-top: 0.4rem;
    background: #888;
    color: white;
    border: none;
    padding: 0.25rem 0.6rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8em;
  }
  .skip-btn:hover {
    background: #666;
  }
  .hint {
    font-size: 0.78em;
    color: #888;
    margin: 0.3rem 0 0;
  }
</style>
