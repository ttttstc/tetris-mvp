<script lang="ts">
  /**
   * App.svelte
   *
   * Root component: orchestrates the layout (Board + HUD + Next + Hold),
   * owns the game state via a Svelte 5 rune, and dispatches keyboard actions
   * to the gameMachine reducer.
   */
  import { onMount, onDestroy } from 'svelte';
  import { gameReducer, initialState } from '../core/gameMachine';
  import type { GameState } from '../core/types';
  import { attachKeyboard, DEFAULT_KEYMAP } from '../input/keyboard';
  import Board from './Board.svelte';
  import Hud from './Hud.svelte';
  import NextPiece from './NextPiece.svelte';
  import HoldPiece from './HoldPiece.svelte';
  import PauseOverlay from './PauseOverlay.svelte';
  import GameOverModal from './GameOverModal.svelte';
  import { CanvasRenderer } from '../render/canvasRenderer';
  import { DefaultTheme } from '../render/theme';
  import type { PieceId } from '../core/types';

  let state: GameState = $state(initialState());

  const theme = new DefaultTheme();
  function colorFor(id: PieceId): string {
    return theme.getColor(CanvasRenderer.colorFor(id));
  }

  function dispatch(action: Parameters<typeof gameReducer>[1]): void {
    state = gameReducer(state, action);
  }

  let listener: { dispose(): void } | undefined;

  onMount(() => {
    listener = attachKeyboard(dispatch, DEFAULT_KEYMAP);
  });

  onDestroy(() => listener?.dispose());

  // Tick loop — drives gravity / lock delay at 60fps. Uses real time deltas.
  let lastFrame = 0;
  let rafId = 0;
  function frame(now: number) {
    if (lastFrame === 0) lastFrame = now;
    const dt = Math.min(100, now - lastFrame); // cap at 100ms to prevent giant jumps
    lastFrame = now;
    if (state.phase === 'playing') {
      dispatch({ type: 'tick', dtMs: dt });
    }
    rafId = requestAnimationFrame(frame);
  }
  $effect(() => {
    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  });

  function handleResume() { dispatch({ type: 'resume' }); }
  function handleRestart() { dispatch({ type: 'restart' }); }

  const renderTarget = $derived(
    state.phase === 'playing'
      ? { board: state.board, active: state.active, next: state.next, hold: state.hold }
      : state.phase === 'paused'
      ? { board: state.snapshot.board, active: state.snapshot.active, next: state.snapshot.next, hold: state.snapshot.hold }
      : null
  );
</script>

<main class="layout">
  <div class="canvas-wrap">
    <Board target={renderTarget} cellSize={theme.getCellSize()} />
    <PauseOverlay visible={state.phase === 'paused'} onResume={handleResume} />
    <GameOverModal
      visible={state.phase === 'gameOver'}
      finalScore={state.phase === 'gameOver' ? state.finalScore : 0}
      finalLevel={state.phase === 'gameOver' ? state.finalLevel : 1}
      finalLines={state.phase === 'gameOver' ? state.finalLines : 0}
      onRestart={handleRestart}
    />
    {#if state.phase === 'idle'}
      <div class="overlay idle" data-testid="idle-overlay">
        <div class="panel">
          <h1>Tetris</h1>
          <p>Press <kbd>Enter</kbd> to start</p>
          <p class="help">Arrows: move / rotate · Space: hard drop · C/Shift: hold · P/Esc: pause · R: restart</p>
        </div>
      </div>
    {/if}
  </div>

  <div class="side">
    {#if state.phase === 'playing' || state.phase === 'paused'}
      <Hud
        score={(state.phase === 'playing' ? state.score : state.snapshot.score)}
        level={(state.phase === 'playing' ? state.level : state.snapshot.level)}
        lines={(state.phase === 'playing' ? state.lines : state.snapshot.lines)}
        combo={(state.phase === 'playing' ? state.combo : state.snapshot.combo)}
        backToBack={(state.phase === 'playing' ? state.backToBack : state.snapshot.backToBack)}
      />
      <NextPiece
        next={(state.phase === 'playing' ? state.next : state.snapshot.next)}
        {colorFor}
      />
      <HoldPiece
        hold={(state.phase === 'playing' ? state.hold : state.snapshot.hold)}
        {colorFor}
      />
    {/if}
  </div>
</main>

<style>
  :global(html, body) {
    margin: 0;
    background: #0a0a0a;
    color: #f3f4f6;
    font-family: ui-sans-serif, system-ui, sans-serif;
    height: 100%;
  }
  .layout {
    display: grid;
    grid-template-columns: auto 240px;
    gap: 24px;
    padding: 24px;
    align-items: start;
  }
  .canvas-wrap {
    position: relative;
    width: 10 * 30px;
  }
  .side {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .overlay {
    position: absolute; inset: 0;
    background: rgba(0, 0, 0, 0.75);
    display: grid; place-items: center;
  }
  .panel {
    background: #1f2937;
    color: #f3f4f6;
    padding: 24px 32px;
    border-radius: 12px;
    text-align: center;
    font-family: ui-monospace, monospace;
  }
  .help { font-size: 11px; color: #9ca3af; }
  h1 { margin: 0 0 12px; }
  kbd { background: #374151; padding: 2px 6px; border-radius: 4px; font-family: ui-monospace, monospace; }
</style>
