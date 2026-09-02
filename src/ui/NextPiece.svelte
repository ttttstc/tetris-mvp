<script lang="ts">
  /**
   * NextPiece.svelte
   *
   * Renders the upcoming pieces. Renders up to 5 mini-pieces stacked vertically.
   */
  import { cellsFor } from '../core/tetromino';
  import type { PieceId } from '../core/types';

  interface Props {
    next: readonly PieceId[];
    colorFor: (id: PieceId) => string;
  }

  let { next, colorFor }: Props = $props();
</script>

<aside class="next">
  <h3>Next</h3>
  <ol data-testid="next-list">
    {#each next.slice(0, 5) as id, idx (idx + '-' + id)}
      <li>
        <svg viewBox="-2 -2 8 4" width="56" height="32" aria-label={`Next piece ${id}`}>
          {#each cellsFor(id, 0) as c, i (i)}
            <rect
              x={c.dx}
              y={c.dy}
              width="1"
              height="1"
              fill={colorFor(id)}
            />
          {/each}
        </svg>
      </li>
    {/each}
  </ol>
</aside>

<style>
  .next {
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.04);
    border-radius: 8px;
  }
  h3 { margin: 0 0 8px; font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; }
  ol { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 4px; }
</style>
