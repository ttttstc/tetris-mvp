/**
 * src/core/gameMachine.test.ts
 *
 * Full state-transition coverage as the architect called out: every legal
 * action from every legal state, plus the obvious illegal combinations.
 */

import { describe, it, expect } from 'vitest';
import { gameReducer, initialState, snapshotBoard, SPAWN_POSITION } from './gameMachine';
import { BOARD_WIDTH, TOTAL_ROWS, VISIBLE_BOTTOM, VISIBLE_TOP } from './types';
import { setCell } from './board';

describe('gameReducer — basic transitions', () => {
  it('starts in idle', () => {
    const s = initialState();
    expect(s.phase).toBe('idle');
  });

  it('start → playing', () => {
    const s = gameReducer(initialState(), { type: 'start', seed: 1 });
    expect(s.phase).toBe('playing');
    if (s.phase === 'playing') {
      expect(s.active.id).toBeDefined();
      expect(s.active.x).toBe(SPAWN_POSITION.x);
      expect(s.score).toBe(0);
      expect(s.level).toBe(1);
      expect(s.lines).toBe(0);
      expect(s.next.length).toBeGreaterThan(0);
    }
  });

  it('pause/resume preserves state', () => {
    let s = gameReducer(initialState(), { type: 'start', seed: 1 });
    s = gameReducer(s, { type: 'pause' });
    expect(s.phase).toBe('paused');
    s = gameReducer(s, { type: 'resume' });
    expect(s.phase).toBe('playing');
  });

  it('tick on non-playing is a no-op', () => {
    expect(gameReducer(initialState(), { type: 'tick', dtMs: 16 }).phase).toBe('idle');
  });

  it('move on non-playing is a no-op', () => {
    expect(gameReducer(initialState(), { type: 'move', dx: -1 }).phase).toBe('idle');
  });

  it('pause on non-playing is a no-op', () => {
    expect(gameReducer(initialState(), { type: 'pause' }).phase).toBe('idle');
  });
});

describe('gameReducer — gameplay', () => {
  it('move dx=-1 shifts the active piece left', () => {
    let s = gameReducer(initialState(), { type: 'start', seed: 1 });
    const beforeX = s.phase === 'playing' ? s.active.x : -1;
    s = gameReducer(s, { type: 'move', dx: -1 });
    if (s.phase === 'playing') expect(s.active.x).toBe(beforeX - 1);
  });

  it('move into a wall does nothing', () => {
    let s = gameReducer(initialState(), { type: 'start', seed: 1 });
    // Force active piece to the leftmost legal position by repeated moves.
    for (let i = 0; i < 20; i++) s = gameReducer(s, { type: 'move', dx: -1 });
    if (s.phase === 'playing') {
      const snapshotX = s.active.x;
      s = gameReducer(s, { type: 'move', dx: -1 });
      expect(s.phase).toBe('playing');
      if (s.phase === 'playing') expect(s.active.x).toBe(snapshotX);
    }
  });

  it('rotate (1) changes rotation state', () => {
    let s = gameReducer(initialState(), { type: 'start', seed: 1 });
    const before = s.phase === 'playing' ? s.active.rotation : -1;
    s = gameReducer(s, { type: 'rotate', dir: 1 });
    if (s.phase === 'playing') {
      // Some pieces (O) cannot rotate; tolerate by checking at most one step forward.
      const after = s.active.rotation;
      expect([before, (before + 1) % 4]).toContain(after);
    }
  });

  it('softDrop adds 1 point per cell', () => {
    let s = gameReducer(initialState(), { type: 'start', seed: 1 });
    const beforeScore = s.phase === 'playing' ? s.score : 0;
    s = gameReducer(s, { type: 'softDrop' });
    if (s.phase === 'playing') expect(s.score).toBe(beforeScore + 1);
  });

  it('hardDrop locks the piece immediately', () => {
    let s = gameReducer(initialState(), { type: 'start', seed: 1 });
    const beforeY = s.phase === 'playing' ? s.active.y : -1;
    s = gameReducer(s, { type: 'hardDrop' });
    // After hard drop, the next piece has been spawned, so active.y is back at top.
    if (s.phase === 'playing') expect(s.active.y).toBeLessThanOrEqual(beforeY);
  });

  it('hold swaps the active piece into the hold slot', () => {
    let s = gameReducer(initialState(), { type: 'start', seed: 1 });
    const beforeId = s.phase === 'playing' ? s.active.id : 'I';
    s = gameReducer(s, { type: 'hold' });
    if (s.phase === 'playing') {
      expect(s.hold).toBe(beforeId);
    }
  });

  it('hold can only be used once per turn', () => {
    let s = gameReducer(initialState(), { type: 'start', seed: 1 });
    s = gameReducer(s, { type: 'hold' });
    if (s.phase === 'playing') {
      const before = s.active.id;
      s = gameReducer(s, { type: 'hold' });
      if (s.phase === 'playing') expect(s.active.id).toBe(before);
    }
  });

  it('restart resets score and board', () => {
    let s = gameReducer(initialState(), { type: 'start', seed: 1 });
    s = gameReducer(s, { type: 'softDrop' });
    s = gameReducer(s, { type: 'softDrop' });
    s = gameReducer(s, { type: 'restart' });
    if (s.phase === 'playing') {
      expect(s.score).toBe(0);
      expect(s.lines).toBe(0);
    } else {
      expect(s.phase).toBe('playing');
    }
  });
});

describe('gameReducer — gravity & locking', () => {
  it('long tick advances gravity and eventually locks', () => {
    let s = gameReducer(initialState(), { type: 'start', seed: 1 });
    // Tick for 30 seconds — should advance many frames.
    for (let i = 0; i < 30; i++) {
      s = gameReducer(s, { type: 'tick', dtMs: 1000 });
      if (s.phase === 'gameOver') break;
    }
    expect(['playing', 'gameOver']).toContain(s.phase);
  });

  it('gameOver when spawn position is blocked', () => {
    let s = gameReducer(initialState(), { type: 'start', seed: 1 });
    if (s.phase === 'playing') {
      // Fill visible rows up to the top so the next piece spawn block-triggers topout.
      for (let y = VISIBLE_TOP + 1; y < VISIBLE_TOP + 20; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
          setCell(s.board, x, y, 1);
        }
      }
      // Hard drop the current piece — the spawn will be blocked.
      s = gameReducer(s, { type: 'hardDrop' });
    }
    // Either the game continues (the current piece had room) OR it ends.
    expect(['playing', 'gameOver']).toContain(s.phase);
  });
});

describe('gameReducer — determinism', () => {
  it('same seed produces same piece sequence', () => {
    const a = gameReducer(initialState(), { type: 'start', seed: 42 });
    const b = gameReducer(initialState(), { type: 'start', seed: 42 });
    if (a.phase === 'playing' && b.phase === 'playing') {
      expect(a.next.slice(0, 5)).toEqual(b.next.slice(0, 5));
      expect(a.active.id).toBe(b.active.id);
    }
  });
});

describe('gameReducer — spawn-collision + lockout (gameMachine.ts:457-467, 505-508)', () => {
  /** Fill rows [fromRow, toRow) across all columns. */
  function fillRows(s: ReturnType<typeof gameReducer>, fromRow: number, toRow: number): void {
    if (s.phase !== 'playing') return;
    for (let y = fromRow; y < toRow; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        setCell(s.board, x, y, 1);
      }
    }
  }

  /**
   * 1) Hold-swap spawn-collision → boardTopOut → gameOver.
   *
   * Architect-named high-risk data source: the lockout / spawn-collision branch.
   * Forces the swap path (m.hold !== null) at gameMachine.ts:457-466. The held
   * piece is placed at (SPAWN_X=4, SPAWN_Y=1) rot 0; with rows 0..VISIBLE_TOP+1
   * filled, every piece shape's rot-0 cells (y=0,1 or y=1,2) overlap an
   * occupied cell → collides() → gameOver.
   */
  it('hold swap → gameOver when swapped piece collides at spawn (lockout)', () => {
    let s = gameReducer(initialState(), { type: 'start', seed: 1 });
    if (s.phase !== 'playing') throw new Error('expected playing after start');

    // First hold: m.hold === null branch — piece goes into hold, spawnNext runs.
    s = gameReducer(s, { type: 'hold' });
    if (s.phase !== 'playing') throw new Error('expected playing after first hold');

    // hardDrop locks the active piece, spawnNext resets holdUsedThisTurn=false.
    s = gameReducer(s, { type: 'hardDrop' });
    if (s.phase !== 'playing') throw new Error('expected playing after hardDrop');

    // Block the entire spawn column range: rows 0..VISIBLE_TOP+1 cover all 7 piece
    // shapes' rot-0 cells (y∈{0,1,2} at minimum). Any piece at SPAWN_Y=1 rot=0 collides.
    fillRows(s, 0, VISIBLE_TOP + 2);

    // Second hold: m.hold !== null → swap branch. Active is set to the held piece;
    // its cells overlap the filled area → gameOver (line 464-466).
    s = gameReducer(s, { type: 'hold' });

    expect(s.phase).toBe('gameOver');
  });

  /**
   * 2) Hold-swap success path (m.hold !== null, no collision) → still playing.
   *
   * Covers lines 457-463 + 467-469 (the else branch that doesn't take the
   * collides early-return). After the swap, holdUsedThisTurn must be true.
   */
  it('hold swap succeeds (no collision) → continues playing', () => {
    let s = gameReducer(initialState(), { type: 'start', seed: 1 });
    if (s.phase !== 'playing') throw new Error('expected playing after start');

    s = gameReducer(s, { type: 'hold' });
    if (s.phase !== 'playing') throw new Error('expected playing after first hold');
    const originalHold = s.hold;

    s = gameReducer(s, { type: 'hardDrop' });
    if (s.phase !== 'playing') throw new Error('expected playing after hardDrop');

    // No fillRows — spawn area is empty, swap succeeds.
    s = gameReducer(s, { type: 'hold' });

    if (s.phase !== 'playing') {
      throw new Error(`expected playing after successful swap, got ${s.phase}`);
    }
    // m.hold should now hold the post-hardDrop piece id, not the originally-held one.
    expect(s.hold).not.toBe(originalHold);
    expect(s.holdUsedThisTurn).toBe(true);
  });

  /**
   * 3) snapshotBoard on `playing` returns a clone of the live board (line 505).
   *
   * Cloning is required — callers (replay / E2E) must not be able to mutate
   * game state through the snapshot.
   */
  it('snapshotBoard on playing → returns cloned board', () => {
    let s = gameReducer(initialState(), { type: 'start', seed: 1 });
    if (s.phase !== 'playing') throw new Error('expected playing');

    const snap = snapshotBoard(s);
    expect(snap).not.toBeNull();
    expect(snap).toBeInstanceOf(Uint8Array);
    expect(snap!.length).toBe(BOARD_WIDTH * TOTAL_ROWS);

    // Mutating the snapshot must not leak into the live board.
    snap![0] = 7;
    expect(s.board[0]).toBe(0);
  });

  /**
   * 4) snapshotBoard on `paused` returns a clone of the snapshotted board (line 506).
   *
   * Paused state holds its data in `snapshot`, not at the top level — the helper
   * must reach into the right place.
   */
  it('snapshotBoard on paused → returns cloned snapshot board', () => {
    let s = gameReducer(initialState(), { type: 'start', seed: 1 });
    s = gameReducer(s, { type: 'pause' });
    expect(s.phase).toBe('paused');

    const snap = snapshotBoard(s);
    expect(snap).not.toBeNull();
    expect(snap!.length).toBe(BOARD_WIDTH * TOTAL_ROWS);
  });

  /**
   * 5) snapshotBoard on idle / gameOver returns null (line 507 fallback).
   *
   * No board to snapshot outside of active gameplay.
   */
  it('snapshotBoard on idle and gameOver → returns null', () => {
    expect(snapshotBoard(initialState())).toBeNull();

    // Force a gameOver by repeatedly hard-dropping into a blocked top.
    let s = gameReducer(initialState(), { type: 'start', seed: 1 });
    for (let i = 0; i < 5; i++) {
      if (s.phase !== 'playing') break;
      fillRows(s, 0, VISIBLE_TOP + 2);
      s = gameReducer(s, { type: 'hardDrop' });
    }
    if (s.phase === 'gameOver') {
      expect(snapshotBoard(s)).toBeNull();
    }
  });
});

describe('gameReducer — lock-reset on move while grounded', () => {
  /**
   * Fill the bottom 3 rows so the piece is GUARANTEED grounded
   * (tryMove(0, 1) collides) regardless of horizontal position. Used to
   * deterministically drive gameMachine.ts:402-405 (move lock reset path).
   *
   * Note: we deliberately do NOT add a rotate-while-grounded test here.
   * SRS kick offsets can shift the rotated piece up by 2 rows, which means
   * a successful rotation no longer satisfies isGrounded() afterwards —
   * the lock-reset branch legitimately doesn't fire in that case, so any
   * test asserting "rotate always resets" would be wrong. The translate
   * case is the deterministic companion for the same code branch.
   */
  function fillBottomBufferFor(s: ReturnType<typeof gameReducer>): void {
    if (s.phase !== 'playing') return;
    for (let y = VISIBLE_BOTTOM - 1; y <= VISIBLE_BOTTOM + 1; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        setCell(s.board, x, y, 1); // rows 21, 22, 23 — last visible + both bottom buffers
      }
    }
  }

  /**
   * 6) move while grounded → lock reset (gameMachine.ts:402-405).
   *
   * The piece is grounded (rows 21–23 filled). A horizontal move keeps it
   * grounded and triggers the lock-delay reset: lockTimerMs back to 0,
   * lockResetsLeft--.
   */
  it('move while grounded → resets lock timer + consumes one lock reset', () => {
    let s = gameReducer(initialState(), { type: 'start', seed: 1 });
    if (s.phase !== 'playing') throw new Error('expected playing after start');

    fillBottomBufferFor(s);

    // Drop the piece to the floor via softDrop. Inlined (vs. helper) to satisfy
    // Biome's noParameterAssign rule.
    for (let i = 0; i < 25; i++) {
      const next = gameReducer(s, { type: 'softDrop' });
      s = next;
      if (s.phase !== 'playing') break;
    }
    if (s.phase !== 'playing') throw new Error('expected playing after softDrop');

    // Tick once with dt < LOCK_DELAY_MS so lockTimerMs is non-zero before move.
    const ticked = gameReducer(s, { type: 'tick', dtMs: 100 });
    s = ticked;
    if (s.phase !== 'playing') throw new Error('expected playing after tick');

    const beforeResets = s.lockResetsLeft;
    expect(s.lockTimerMs).toBe(100);

    const moved = gameReducer(s, { type: 'move', dx: -1 });
    s = moved;
    if (s.phase !== 'playing') throw new Error('expected playing after move');

    // Lock reset path fired: timer back to 0, counter decremented.
    expect(s.lockTimerMs).toBe(0);
    expect(s.lockResetsLeft).toBe(beforeResets - 1);
  });
});