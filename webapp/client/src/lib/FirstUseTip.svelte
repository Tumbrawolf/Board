<script lang="ts">
  let { tipId, text }: { tipId: string; text: string } = $props();

  const storageKey = $derived(`board-webapp-tipSeen:${tipId}`);
  let dismissed = $state(false);

  $effect(() => {
    dismissed = localStorage.getItem(storageKey) === "1";
  });

  function dismiss() {
    localStorage.setItem(storageKey, "1");
    dismissed = true;
  }
</script>

{#if !dismissed}
  <div class="tip">
    <span class="tip-icon">tip</span>
    <span class="tip-text">{text}</span>
    <button class="tip-dismiss" onclick={dismiss} aria-label="Dismiss tip">Got it</button>
  </div>
{/if}

<style>
  .tip {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: #fff8e1;
    border: 1px solid #e0c46c;
    border-radius: 6px;
    padding: 0.4rem 0.6rem;
    margin-bottom: 0.5rem;
    font-size: 0.82em;
    color: #6b5512;
  }
  .tip-icon {
    text-transform: uppercase;
    font-size: 0.7em;
    font-weight: bold;
    background: #e0c46c;
    color: #6b5512;
    border-radius: 3px;
    padding: 0.1rem 0.4rem;
    flex-shrink: 0;
  }
  .tip-text {
    flex: 1;
  }
  .tip-dismiss {
    background: none;
    border: 1px solid #e0c46c;
    border-radius: 4px;
    padding: 0.15rem 0.5rem;
    cursor: pointer;
    color: #6b5512;
    font-size: 0.9em;
    flex-shrink: 0;
  }
</style>
