/**
 * core/gameMachine.ts
 *
 * The single source of truth for game state. Reducer-style: a pure function
 * `(state, action) -> state'`. No timers, no DOM, no I/O. All time is fed in
 * via the `tick` action with a `dtMs` payload. All randomness is fed in via
 * the `start` action's `seed`.
 *
 * State machine:
 *
 *   idle ──start──► playing ──pause──► paused ──resume──► playing
 *                       │                                     │
 *                       └──── boardTopOut ──────► gameOver ◄──┘
 *                                                       │
 *                                                       └── restart ──► playing
 *
 * T-Spin detection (3-corner rule):
 *   - Last action that moved the active piece was a `rotate`.
 *   - Piece id is T.
 *   - At least 3 of the 4 diagonal corners of the T's 3x3 bounding box are
 *     blocked by an occupied cell or the side walls.
 *   - "Mini" T-Spin: only the 2 "front" corners (on the side the T points to)
 *     are blocked, and only 3 corners total are blocked.
 *
 * Pure rules:
 *   - input/ handles key repeat (DAS/ARR); the state machine never sees raw
 *     keydowns. Every action is a logical InputAction.
 *   - The 7-bag randomizer is reconstructed from the seed on `start` /
 *     `restart`, so replays are deterministic given the seed.
 *   - The seed lives at the top level of `GameState` (NOT inside PlayingFields)
 *     to keep PlayingFields pure data for the renderer.
 */

import {
  BOARD_WIDTH,
  TOTAL_ROWS,
  VISIBLE_TOP,
  type ActivePiece,
  type Board,
  type CellColor,
  type GameState,
  type InputAction,
  type PieceId,
  type PlayingFields,
  type LineClearResult,
} from './types';
import { cloneBoard, createBoard, getCell, setCell } from './board';
import { pieceCells } from './tetromino';
import { mulberry32, SevenBag } from './randomizer';
import { tryMove, tryRotate, hardDrop, collides } from './collision';
import { clearFullLines } from './lineClear';
import { isGrounded, lockResetsExhausted, lockTimerExpired, consumeLockReset, initialLockResets } from './lock';
import { gravityMs, MAX_LOCK_RESETS, SOFT_DROP_MS } from './gravity';
import { scoreClear, levelFromLines } from './scoring';

const SPAWN_X = BOARD_WIDTH / 2 - 1; // 4 — visible center
const SPAWN_Y = VISIBLE_TOP - 1; // 1 — top of visible area + 1 (so piece is partially in buffer)

// ----------------------------------------------------------------------------
// Internal mutable working state — converted to immutable PlayingFields on exit.
// Note: NOT extending PlayingFields (which is readonly) so we can mutate fields.
// ----------------------------------------------------------------------------

interface MutablePlaying {
  board: Board;
  active: ActivePiece;
  hold: PieceId | null;
  holdUsedThisTurn: boolean;
  next: PieceId[];
  score: number;
  level: number;
  lines: number;
  combo: number;
  backToBack: boolean;
  lockTimerMs: number;
  lockResetsLeft: number;
  gravityMsAccum: number;
  lastActionWasRotation: boolean;
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function pieceColor(id: PieceId): CellColor {
  const map: Record<PieceId, CellColor> = {
    I: 1 as CellColor,
    O: 2 as CellColor,
    T: 3 as CellColor,
    S: 4 as CellColor,
    Z: 5 as CellColor,
    J: 6 as CellColor,
    L: 7 as CellColor,
  };
  return map[id];
}

function emptyMutable(): MutablePlaying {
  return {
    board: createBoard(),
    active: { id: 'I', rotation: 0, x: SPAWN_X, y: SPAWN_Y },
    hold: null,
    holdUsedThisTurn: false,
    next: [],
    score: 0,
    level: 1,
    lines: 0,
    combo: 0,
    backToBack: false,
    lockTimerMs: 0,
    lockResetsLeft: initialLockResets(),
    gravityMsAccum: 0,
    lastActionWasRotation: false,
  };
}

/** Pull the next piece from the bag; refill as needed; cache up to 5 in `next`. */
function drawPiece(bag: SevenBag, m: MutablePlaying): PieceId {
  if (m.next.length === 0) {
    m.next = bag.peek(5).slice();
  }
  const id = (m.next.shift() as PieceId | undefined) ?? bag.next();
  while (m.next.length < 5) {
    m.next.push(bag.next());
  }
  return id;
}

/** Spawn the next piece at the top center. Returns true if spawn was blocked (topout). */
function spawnNext(bag: SevenBag, m: MutablePlaying): boolean {
  const id = drawPiece(bag, m);
  const piece: ActivePiece = { id, rotation: 0, x: SPAWN_X, y: SPAWN_Y };
  m.active = piece;
  m.holdUsedThisTurn = false;
  m.lockTimerMs = 0;
  m.lockResetsLeft = initialLockResets();
  m.gravityMsAccum = 0;
  m.lastActionWasRotation = false;
  return collides(m.board, piece);
}

/**
 * T-Spin detection by 3-corner rule.
 * Source: https://tetris.wiki/wiki/T-Spin
 *
 * Returns { isTSpin, mini }. mini=true means only the 2 front corners were
 * blocked and exactly 3 corners total — the simpler case.
 */
function detectTSpin(board: Board, piece: ActivePiece, lastWasRotation: boolean): { isTSpin: boolean; mini: boolean } {
  if (piece.id !== 'T') return { isTSpin: false, mini: false };
  if (!lastWasRotation) return { isTSpin: false, mini: false };

  // Diagonal corners of the T's 3x3 box, relative to the T's pivot.
  const corners: ReadonlyArray<readonly [number, number]> = [
    [-1, -1], [+1, -1], [-1, +1], [+1, +1],
  ];
  // "Front" corner indices depend on rotation (the side the T points to).
  // Each entry is a pair of indices into `corners`.
  const frontByRot: Readonly<Record<number, readonly [number, number]>> = {
    0: [0, 1], // up — front = TL, TR
    1: [1, 3], // right — front = TR, BR
    2: [3, 2], // down — front = BR, BL
    3: [2, 0], // left — front = BL, TL
  };

  const blocked: boolean[] = corners.map(([dx, dy]) => {
    const x = piece.x + dx;
    const y = piece.y + dy;
    if (x < 0 || x >= BOARD_WIDTH) return true; // wall counts
    if (y < 0) return false; // above top counts as empty
    if (y >= TOTAL_ROWS) return true; // below bottom counts (shouldn't happen)
    return getCell(board, x, y) !== 0;
  });

  const filled = blocked.filter(Boolean).length;
  if (filled < 3) return { isTSpin: false, mini: false };

  const front = frontByRot[piece.rotation]!;
  const frontBothBlocked = Boolean(blocked[front[0]!]) && Boolean(blocked[front[1]!]);
  const mini: boolean = frontBothBlocked && filled === 3;

  return { isTSpin: true, mini };
}

/**
 * Lock the active piece into the board, run line clears, update score/level,
 * spawn the next piece. Returns whether the spawn triggered gameOver.
 */
function lockAndClear(bag: SevenBag, m: MutablePlaying): 'continue' | 'gameOver' {
  const color = pieceColor(m.active.id);
  const cells = pieceCells(m.active);
  for (const c of cells) {
    if (c.dy >= 0 && c.dy < TOTAL_ROWS) {
      setCell(m.board, c.dx, c.dy, color);
    }
  }

  const tSpin = detectTSpin(m.board, m.active, m.lastActionWasRotation);
  const clearResult = clearFullLines(m.board);
  m.board = clearResult.board;

  let kind: LineClearResult['kind'] = 'none';
  if (tSpin.isTSpin) {
    if (tSpin.mini && clearResult.clearedCount === 1) kind = 'tSpinMiniSingle';
    else if (clearResult.clearedCount === 1) kind = 'tSpinSingle';
    else if (clearResult.clearedCount === 2) kind = 'tSpinDouble';
    else if (clearResult.clearedCount === 3) kind = 'tSpinTriple';
  } else {
    if (clearResult.clearedCount === 1) kind = 'single';
    else if (clearResult.clearedCount === 2) kind = 'double';
    else if (clearResult.clearedCount === 3) kind = 'triple';
    else if (clearResult.clearedCount === 4) kind = 'tetris';
  }

  const outcome = scoreClear({
    level: m.level,
    linesCleared: (clearResult.clearedCount as 0 | 1 | 2 | 3 | 4),
    kind,
    wasBackToBack: m.backToBack,
    combo: m.combo,
    softDropCells: 0,
    hardDropCells: 0,
  });
  m.score += outcome.scoreDelta;
  m.lines += outcome.linesAdded;
  m.combo = outcome.nextCombo;
  m.backToBack = outcome.nextBackToBack;
  m.level = levelFromLines(m.lines, m.level);

  const topout = spawnNext(bag, m);
  return topout ? 'gameOver' : 'continue';
}

/** Advance gravity + lock delay by dtMs. Returns the new GameState. */
function advanceTick(m: MutablePlaying, dtMs: number, seed: number): GameState {
  const bag = new SevenBag(mulberry32(seed));
  const interval = gravityMs(m.level);
  m.gravityMsAccum += dtMs;

  let grounded = isGrounded(m.board, m.active);
  if (grounded) {
    m.lockTimerMs += dtMs;
    if (lockResetsExhausted(m.lockResetsLeft) || lockTimerExpired(m.lockTimerMs)) {
      const result = lockAndClear(bag, m);
      if (result === 'gameOver') {
        return gameOver(m.score, m.level, m.lines, seed);
      }
      return playing(m, seed);
    }
  } else {
    m.lockTimerMs = 0;
  }

  while (m.gravityMsAccum >= interval) {
    m.gravityMsAccum -= interval;
    const moved = tryMove(m.board, m.active, 0, 1);
    if (moved) {
      m.active = moved;
    } else {
      m.lockTimerMs += interval;
      if (lockResetsExhausted(m.lockResetsLeft) || lockTimerExpired(m.lockTimerMs)) {
        const result = lockAndClear(bag, m);
        if (result === 'gameOver') {
          return gameOver(m.score, m.level, m.lines, seed);
        }
        return playing(m, seed);
      }
      break;
    }
  }

  // After any movement, re-check grounded (the piece may have settled).
  grounded = isGrounded(m.board, m.active);
  if (grounded) {
    // Lock timer accumulates naturally on subsequent ticks; nothing to do here.
  }
  return playing(m, seed);
}

// ----------------------------------------------------------------------------
// State constructors (centralize the spread so adding fields doesn't drift)
// ----------------------------------------------------------------------------

function playing(m: MutablePlaying, seed: number): GameState {
  return {
    phase: 'playing',
    board: m.board,
    active: m.active,
    hold: m.hold,
    holdUsedThisTurn: m.holdUsedThisTurn,
    next: m.next.slice(),
    score: m.score,
    level: m.level,
    lines: m.lines,
    combo: m.combo,
    backToBack: m.backToBack,
    lockTimerMs: m.lockTimerMs,
    lockResetsLeft: m.lockResetsLeft,
    gravityMsAccum: m.gravityMsAccum,
    lastActionWasRotation: m.lastActionWasRotation,
    seed,
  };
}

function gameOver(score: number, level: number, lines: number, _seed: number): GameState {
  return { phase: 'gameOver', finalScore: score, finalLevel: level, finalLines: lines, seed: _seed };
}

// ----------------------------------------------------------------------------
// Public reducer
// ----------------------------------------------------------------------------

export function gameReducer(state: GameState, action: InputAction): GameState {
  switch (action.type) {
    case 'start': {
      const seed = action.seed ?? 1;
      const bag = new SevenBag(mulberry32(seed));
      const m = emptyMutable();
      const topout = spawnNext(bag, m);
      if (topout) return gameOver(0, 1, 0, seed);
      return playing(m, seed);
    }
    case 'restart': {
      const seed = state.seed ?? (Date.now() & 0xffff);
      const bag = new SevenBag(mulberry32(seed));
      const m = emptyMutable();
      const topout = spawnNext(bag, m);
      if (topout) return gameOver(0, 1, 0, seed);
      return playing(m, seed);
    }
    case 'pause': {
      if (state.phase !== 'playing') return state;
      const snap: PlayingFields = {
        board: state.board,
        active: state.active,
        hold: state.hold,
        holdUsedThisTurn: state.holdUsedThisTurn,
        next: state.next,
        score: state.score,
        level: state.level,
        lines: state.lines,
        combo: state.combo,
        backToBack: state.backToBack,
        lockTimerMs: state.lockTimerMs,
        lockResetsLeft: state.lockResetsLeft,
        gravityMsAccum: state.gravityMsAccum,
        lastActionWasRotation: state.lastActionWasRotation,
      };
      return { phase: 'paused', snapshot: snap, seed: state.seed };
    }
    case 'resume': {
      if (state.phase !== 'paused') return state;
      const s = state.snapshot;
      return {
        phase: 'playing',
        board: s.board,
        active: s.active,
        hold: s.hold,
        holdUsedThisTurn: s.holdUsedThisTurn,
        next: s.next,
        score: s.score,
        level: s.level,
        lines: s.lines,
        combo: s.combo,
        backToBack: s.backToBack,
        lockTimerMs: s.lockTimerMs,
        lockResetsLeft: s.lockResetsLeft,
        gravityMsAccum: s.gravityMsAccum,
        lastActionWasRotation: s.lastActionWasRotation,
        seed: state.seed,
      };
    }
    case 'tick': {
      if (state.phase !== 'playing') return state;
      // Snapshot then mutate. Critical: copy the board array so subsequent
      // ticks don't corrupt prior state references.
      const m: MutablePlaying = {
        board: state.board.slice(),
        active: state.active,
        hold: state.hold,
        holdUsedThisTurn: state.holdUsedThisTurn,
        next: state.next.slice(),
        score: state.score,
        level: state.level,
        lines: state.lines,
        combo: state.combo,
        backToBack: state.backToBack,
        lockTimerMs: state.lockTimerMs,
        lockResetsLeft: state.lockResetsLeft,
        gravityMsAccum: state.gravityMsAccum,
        lastActionWasRotation: state.lastActionWasRotation,
      };
      return advanceTick(m, action.dtMs, state.seed);
    }
    case 'move': {
      if (state.phase !== 'playing') return state;
      const m = cloneForMutation(state);
      const moved = tryMove(m.board, m.active, action.dx, 0);
      if (moved) {
        m.active = moved;
        m.lastActionWasRotation = false;
        if (isGrounded(m.board, m.active) && !lockResetsExhausted(m.lockResetsLeft)) {
          m.lockTimerMs = 0;
          m.lockResetsLeft = consumeLockReset(m.lockResetsLeft);
        }
      }
      return playing(m, state.seed);
    }
    case 'rotate': {
      if (state.phase !== 'playing') return state;
      const m = cloneForMutation(state);
      const result = tryRotate(m.board, m.active, action.dir);
      if (result.ok) {
        m.active = result.piece;
        m.lastActionWasRotation = true;
        if (isGrounded(m.board, m.active) && !lockResetsExhausted(m.lockResetsLeft)) {
          m.lockTimerMs = 0;
          m.lockResetsLeft = consumeLockReset(m.lockResetsLeft);
        }
      }
      return playing(m, state.seed);
    }
    case 'softDrop': {
      if (state.phase !== 'playing') return state;
      const m = cloneForMutation(state);
      const moved = tryMove(m.board, m.active, 0, 1);
      if (moved) {
        m.active = moved;
        m.score += 1;
        m.gravityMsAccum = 0;
      }
      return playing(m, state.seed);
    }
    case 'hardDrop': {
      if (state.phase !== 'playing') return state;
      const m = cloneForMutation(state);
      const before = m.active.y;
      m.active = hardDrop(m.board, m.active);
      const dropped = m.active.y - before;
      m.score += dropped * 2;
      const bag = new SevenBag(mulberry32(state.seed));
      const result = lockAndClear(bag, m);
      if (result === 'gameOver') return gameOver(m.score, m.level, m.lines, state.seed);
      return playing(m, state.seed);
    }
    case 'hold': {
      if (state.phase !== 'playing') return state;
      if (state.holdUsedThisTurn) return state;
      const m = cloneForMutation(state);
      const bag = new SevenBag(mulberry32(state.seed));
      const currentId = m.active.id;
      if (m.hold === null) {
        m.hold = currentId;
        const topout = spawnNext(bag, m);
        if (topout) return gameOver(m.score, m.level, m.lines, state.seed);
      } else {
        const swap = m.hold;
        m.hold = currentId;
        m.active = { id: swap, rotation: 0, x: SPAWN_X, y: SPAWN_Y };
        m.lockTimerMs = 0;
        m.lockResetsLeft = initialLockResets();
        m.gravityMsAccum = 0;
        m.lastActionWasRotation = false;
        if (collides(m.board, m.active)) {
          return gameOver(m.score, m.level, m.lines, state.seed);
        }
      }
      m.holdUsedThisTurn = true;
      return playing(m, state.seed);
    }
  }
}

function cloneForMutation(state: GameState): MutablePlaying {
  if (state.phase !== 'playing') throw new Error('cloneForMutation requires playing state');
  return {
    board: state.board.slice(),
    active: state.active,
    hold: state.hold,
    holdUsedThisTurn: state.holdUsedThisTurn,
    next: state.next.slice(),
    score: state.score,
    level: state.level,
    lines: state.lines,
    combo: state.combo,
    backToBack: state.backToBack,
    lockTimerMs: state.lockTimerMs,
    lockResetsLeft: state.lockResetsLeft,
    gravityMsAccum: state.gravityMsAccum,
    lastActionWasRotation: state.lastActionWasRotation,
  };
}

// ----------------------------------------------------------------------------
// Convenience exports
// ----------------------------------------------------------------------------

/** Public: create initial idle state. */
export function initialState(): GameState {
  return { phase: 'idle', seed: 1 };
}

/** Public: produce a snapshot suitable for E2E or replay tests. */
export function snapshotBoard(state: GameState): Board | null {
  if (state.phase === 'playing') return cloneBoard(state.board);
  if (state.phase === 'paused') return cloneBoard(state.snapshot.board);
  return null;
}

/** Spawn position (visible center, partially above visible area). */
export const SPAWN_POSITION = { x: SPAWN_X, y: SPAWN_Y };

export { SOFT_DROP_MS, MAX_LOCK_RESETS };
