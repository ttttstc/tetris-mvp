<script lang="ts">
  /**
   * Hud.svelte
   *
   * Score / level / lines / combo readout. Pure presentational; the
   * composition root passes the current snapshot in.
   */
  interface Props {
    score: number;
    level: number;
    lines: number;
    combo: number;
    backToBack: boolean;
  }

  let { score, level, lines, combo, backToBack }: Props = $props();
</script>

<aside class="hud">
  <dl>
    <dt>Score</dt>
    <dd data-testid="hud-score">{score.toLocaleString()}</dd>

    <dt>Level</dt>
    <dd data-testid="hud-level">{level}</dd>

    <dt>Lines</dt>
    <dd data-testid="hud-lines">{lines}</dd>

    {#if combo > 0}
      <dt>Combo</dt>
      <dd data-testid="hud-combo">×{combo}</dd>
    {/if}

    {#if backToBack}
      <dt class="b2b">B2B</dt>
      <dd class="b2b" data-testid="hud-b2b">★</dd>
    {/if}
  </dl>
</aside>

<style>
  .hud {
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.04);
    border-radius: 8px;
    font-family: ui-monospace, monospace;
  }
  dl { display: grid; grid-template-columns: max-content 1fr; gap: 4px 12px; margin: 0; }
  dt { color: #9ca3af; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
  dd { margin: 0; font-variant-numeric: tabular-nums; }
  .b2b { color: #fbbf24; }
</style>
