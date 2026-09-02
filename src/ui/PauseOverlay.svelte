<script lang="ts">
  /**
   * PauseOverlay.svelte
   *
   * Semi-transparent overlay shown when the game is paused.
   */
  interface Props {
    visible: boolean;
    onResume?: () => void;
  }

  let { visible, onResume }: Props = $props();
</script>

{#if visible}
  <div class="overlay" role="dialog" aria-label="Game paused" data-testid="pause-overlay">
    <div class="panel">
      <h2>Paused</h2>
      <p>Press <kbd>P</kbd> or <kbd>Esc</kbd> to resume.</p>
      {#if onResume}
        <button onclick={onResume}>Resume</button>
      {/if}
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: absolute; inset: 0;
    background: rgba(0, 0, 0, 0.65);
    display: grid; place-items: center;
    z-index: 10;
  }
  .panel {
    background: #1f2937;
    color: #f3f4f6;
    padding: 24px 32px;
    border-radius: 12px;
    text-align: center;
    font-family: ui-monospace, monospace;
  }
  h2 { margin: 0 0 8px; }
  button { margin-top: 8px; padding: 6px 16px; border-radius: 6px; border: none; background: #5eb3ff; color: #111; cursor: pointer; }
  kbd { background: #374151; padding: 2px 6px; border-radius: 4px; }
</style>
