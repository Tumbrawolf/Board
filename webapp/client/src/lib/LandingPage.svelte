<script lang="ts">
  let { name, onNameChange, onBrowse, onHost }: {
    name: string;
    onNameChange: (n: string) => void;
    onBrowse: () => void;
    onHost: () => void;
  } = $props();
</script>

<div class="landing">
  <div class="hero">
    <h1 class="game-title">Board</h1>
    <p class="tagline">Cooperative tactical defense — hold the line together.</p>
    <p class="description">
      Your team deploys units, manages resources, and fights back waves of escalating enemies
      across multiple combat lanes. Every player holds a secret agenda — some may be working
      against the group. Coordinate, adapt, and survive.
    </p>

    <div class="name-row">
      <label for="landing-name">Your name</label>
      <input
        id="landing-name"
        type="text"
        value={name}
        oninput={(e) => onNameChange((e.target as HTMLInputElement).value)}
        placeholder="e.g. Reese"
        maxlength="20"
        autocomplete="off"
      />
    </div>

    <div class="cta-row">
      <button class="cta-primary" onclick={onBrowse} disabled={!name.trim()}>
        Browse Open Lobbies
      </button>
      <button class="cta-secondary" onclick={onHost} disabled={!name.trim()}>
        Host a Game
      </button>
    </div>
  </div>

  <div class="features">
    <div class="feature">
      <h3>Worker Placement</h3>
      <p>
        Deploy workers to six locations each round — Barracks, Armory, Medical Bay,
        Containment Block, Command, and Battlefield — each generating different resources
        for your team.
      </p>
    </div>
    <div class="feature">
      <h3>Cooperative Combat</h3>
      <p>
        Units fight in lanes, resources are shared, and missions reward the whole team.
        Coordinate who defends which lane and when to reinforce before enemies break through.
      </p>
    </div>
    <div class="feature">
      <h3>Hidden Agendas</h3>
      <p>
        Every player holds Secret Objectives. Allied players win together — but Saboteurs
        and Chaos agents have their own goals. Trust carefully.
      </p>
    </div>
  </div>
</div>

<style>
  .landing {
    max-width: 820px;
    margin: 0 auto;
    padding: 3.5rem 2rem 5rem;
  }
  .hero {
    text-align: center;
    padding-bottom: 3rem;
    border-bottom: 1px solid #ececec;
  }
  .game-title {
    font-size: 4rem;
    font-weight: 800;
    margin: 0 0 0.25rem;
    letter-spacing: -0.03em;
    color: #111;
  }
  .tagline {
    font-size: 1.15rem;
    color: #666;
    margin: 0 0 1.1rem;
  }
  .description {
    max-width: 540px;
    margin: 0 auto 2rem;
    color: #444;
    line-height: 1.65;
    font-size: 0.97em;
  }
  .name-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }
  .name-row label {
    color: #555;
    font-size: 0.95em;
    white-space: nowrap;
  }
  .name-row input {
    padding: 0.55rem 0.8rem;
    border: 1px solid #ccc;
    border-radius: 6px;
    font-size: 1em;
    width: 190px;
    background: #fff;
  }
  .name-row input:focus {
    outline: 2px solid #2a6f97;
    outline-offset: 1px;
    border-color: #2a6f97;
  }
  .cta-row {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }
  .cta-primary {
    background: #2a6f97;
    color: #fff;
    border: none;
    padding: 0.75rem 2.25rem;
    border-radius: 8px;
    font-size: 1.05em;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
  }
  .cta-primary:hover:not(:disabled) {
    background: #215a7d;
  }
  .cta-primary:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .cta-secondary {
    background: #fff;
    color: #2a6f97;
    border: 2px solid #2a6f97;
    padding: 0.75rem 2.25rem;
    border-radius: 8px;
    font-size: 1.05em;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }
  .cta-secondary:hover:not(:disabled) {
    background: #eef6fb;
  }
  .cta-secondary:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
    gap: 1.5rem;
    margin-top: 2.75rem;
  }
  .feature {
    padding: 1.25rem 1.5rem;
    border: 1px solid #e8e8e8;
    border-radius: 10px;
    background: #fff;
  }
  .feature h3 {
    margin: 0 0 0.5rem;
    font-size: 0.97em;
    color: #2a6f97;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .feature p {
    margin: 0;
    font-size: 0.9em;
    color: #555;
    line-height: 1.55;
  }
</style>
