<script lang="ts">
  /**
   * Board.svelte
   *
   * The <canvas> wrapper. Owns the CanvasRenderer instance and re-draws on
   * prop changes.
   */
  import { CanvasRenderer } from '../render/canvasRenderer';
  import { DefaultTheme } from '../render/theme';
  import type { RenderTarget } from '../render/canvasRenderer';
  import type { PieceId } from '../core/types';

  interface Props {
    target: RenderTarget | null;
    cellSize?: number;
  }

  let { target, cellSize = 30 }: Props = $props();

  let canvas: HTMLCanvasElement | undefined = $state();
  let renderer: CanvasRenderer | undefined = $state();

  $effect(() => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    renderer = new CanvasRenderer(ctx, new DefaultTheme());
  });

  $effect(() => {
    if (!renderer || !target) return;
    // The renderer's theme reads cellSize; we apply it via the theme instance
    // before drawing so the canvas can be sized correctly.
    renderer.draw({
      board: target.board,
      active: target.active,
      next: target.next,
      hold: target.hold,
    });
  });
</script>

<canvas
  bind:this={canvas}
  width={10 * cellSize}
  height={20 * cellSize}
  data-testid="play-canvas"
></canvas>

<style>
  canvas {
    display: block;
    border: 2px solid #374151;
    border-radius: 6px;
    background: #111;
  }
</style>
