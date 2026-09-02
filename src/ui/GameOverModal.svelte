<script lang="ts">
  /**
   * GameOverModal.svelte
   *
   * Modal shown when the game ends. Reports final score and offers Restart.
   */
  interface Props {
    visible: boolean;
    finalScore: number;
    finalLevel: number;
    finalLines: number;
    onRestart?: () => void;
  }

  let { visible, finalScore, finalLevel, finalLines, onRestart }: Props = $props();
</script>

{#if visible}
  <div class="overlay" role="dialog" aria-label="Game over" data-testid="game-over">
    <div class="panel">
      <h2>Game Over</h2>
      <dl>
        <dt>Final Score</dt><dd data-testid="final-score">{finalScore.toLocaleString()}</dd>
        <dt>Final Level</dt><dd data-testid="final-level">{finalLevel}</dd>
        <dt>Final Lines</dt><dd data-testid="final-lines">{finalLines}</dd>
      </dl>
      {#if onRestart}
        <button onclick={onRestart}>Restart</button>
      {/if}
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: absolute; inset: 0;
    background: rgba(0, 0, 0, 0.75);
    display: grid; place-items: center;
    z-index: 20;
  }
  .panel {
    background: #1f2937;
    color: #f3f4f6;
    padding: 24px 32px;
    border-radius: 12px;
    text-align: center;
    font-family: ui-monospace, monospace;
    min-width: 240px;
  }
  h2 { margin: 0 0 12px; color: #ef4444; }
  dl { display: grid; grid-template-columns: max-content 1fr; gap: 4px 12px; text-align: left; margin: 0 0 12px; }
  button { padding: 6px 16px; border-radius: 6px; border: none; background: #5eb3ff; color: #111; cursor: pointer; }
</style>
