<script lang="ts">
  /**
   * HoldPiece.svelte
   *
   * Renders the held piece (if any). Empty slot shows "—".
   */
  import { cellsFor } from '../core/tetromino';
  import type { PieceId } from '../core/types';

  interface Props {
    hold: PieceId | null;
    colorFor: (id: PieceId) => string;
  }

  let { hold, colorFor }: Props = $props();
</script>

<aside class="hold">
  <h3>Hold</h3>
  {#if hold === null}
    <div class="empty" data-testid="hold-empty">—</div>
  {:else}
    <svg viewBox="-2 -2 8 4" width="56" height="32" aria-label={`Held piece ${hold}`} data-testid="hold-piece">
      {#each cellsFor(hold, 0) as c, i (i)}
        <rect
          x={c.dx}
          y={c.dy}
          width="1"
          height="1"
          fill={colorFor(hold)}
        />
      {/each}
    </svg>
  {/if}
</aside>

<style>
  .hold {
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.04);
    border-radius: 8px;
    min-height: 60px;
  }
  h3 { margin: 0 0 8px; font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; }
  .empty { color: #4b5563; font-family: ui-monospace, monospace; }
</style>
