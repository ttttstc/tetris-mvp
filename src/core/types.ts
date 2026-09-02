/**
 * core/types.ts
 *
 * Foundation types for the Tetris core. Zero external dependencies.
 *
 * Coordinate system: (x, y)
 *   - x ∈ [0, BOARD_WIDTH)  (left → right)
 *   - y ∈ [0, TOTAL_ROWS)   (top → bottom)
 *   - Visible board rows: y ∈ [BUFFER_ROWS, BUFFER_ROWS + VISIBLE_ROWS) = [2, 22)
 *   - Buffer rows at top (y ∈ [0, 2)) and bottom (y ∈ [22, 24)) are reserved for
 *     SRS rotations that briefly push the piece out of the visible area.
 *   - Storage index: idx = y * BOARD_WIDTH + x (Uint8Array(240))
 *
 * Per architecture §5.1, board uses Uint8Array with 2 buffer rows at the top and 2 at
 * the bottom. Buffer rows exist solely to keep SRS rotations from going out of bounds;
 * they are never rendered and never spawn pieces.
 */

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;          // visible rows
export const BUFFER_ROWS = 2;            // buffer rows on top AND bottom
export const VISIBLE_TOP = BUFFER_ROWS;  // 2 — first visible row index
export const VISIBLE_BOTTOM = BUFFER_ROWS + BOARD_HEIGHT; // 22 — one past last visible row
export const TOTAL_ROWS = BOARD_HEIGHT + BUFFER_ROWS * 2; // 24
export const BOARD_CELLS = BOARD_WIDTH * TOTAL_ROWS; // 240

/**
 * Cell color encoding. 0 = empty; 1-7 correspond to I/O/T/S/Z/J/L.
 *
 * The order is deliberate: it matches the standard Tetris Guideline palette and
 * the typical renderer table (cyan/yellow/purple/green/red/blue/orange).
 */
export type CellColor = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const EMPTY: CellColor = 0;

export const PIECE_COLORS: Record<PieceId, CellColor> = {
  I: 1, O: 2, T: 3, S: 4, Z: 5, J: 6, L: 7,
};

export type PieceId = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export const ALL_PIECE_IDS: readonly PieceId[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

export type RotationState = 0 | 1 | 2 | 3;

/**
 * SRS rotation pivot offsets relative to spawn pivot (always centered above visible rows).
 *
 * SRS conventions:
 *   - Pieces spawn centered horizontally on columns [3, 6] (visible).
 *   - I and O use a fixed pivot; J/L/S/T/Z use the center of their 3×3 box.
 *
 * Cells are stored as (dx, dy) offsets from the piece's `x, y` pivot.
 */
export interface CellOffset {
  readonly dx: number;
  readonly dy: number;
}

export interface KickOffset {
  readonly dx: number;
  readonly dy: number;
}

export type Board = Uint8Array;

/**
 * Active piece: currently falling or being held by the player.
 * x, y is the pivot position in board coordinates (including buffer rows).
 */
export interface ActivePiece {
  readonly id: PieceId;
  readonly rotation: RotationState;
  readonly x: number;
  readonly y: number;
}

export interface SpawnResult {
  readonly piece: ActivePiece;
  /** True if the spawn position is already blocked → triggers boardTopOut → gameOver. */
  readonly boardTopOut: boolean;
}

/** Snapshot of the active piece at the moment of lock, for line-clear / scoring. */
export interface LockedSnapshot {
  readonly id: PieceId;
  /** Absolute board coordinates of the locked cells. */
  readonly cells: readonly CellOffset[];
  readonly color: CellColor;
  /** Whether the lock was triggered by a rotation (used for T-Spin detection). */
  readonly lastMoveWasRotation: boolean;
  /** Index of the mini-corner pattern at lock time (for T-Spin scoring rules). */
  readonly tSpinMini: boolean;
}

// ---- Game state machine states ---------------------------------------------

export type GamePhase = 'idle' | 'playing' | 'paused' | 'gameOver';

/** Seed for the deterministic 7-bag randomizer. Persists across pause/resume. */
export interface SeedCarrier { readonly seed: number; }

export interface PlayingFields {
  readonly board: Board;
  readonly active: ActivePiece;
  readonly hold: PieceId | null;
  readonly holdUsedThisTurn: boolean;
  readonly next: readonly PieceId[];
  readonly score: number;
  readonly level: number;
  readonly lines: number;
  readonly combo: number;
  readonly backToBack: boolean;
  readonly lockTimerMs: number;
  readonly lockResetsLeft: number;
  readonly gravityMsAccum: number;
  /** Last move that moved the active piece (rotation vs. translate). For T-Spin detection. */
  readonly lastActionWasRotation: boolean;
}

export type GameState =
  | ({ readonly phase: 'idle' } & SeedCarrier)
  | ({ readonly phase: 'playing' } & PlayingFields & SeedCarrier)
  | { readonly phase: 'paused'; readonly snapshot: PlayingFields } & SeedCarrier
  | { readonly phase: 'gameOver'; readonly finalScore: number; readonly finalLevel: number; readonly finalLines: number } & SeedCarrier;

// ---- Input actions --------------------------------------------------------

export type InputAction =
  | { readonly type: 'start'; readonly seed?: number }
  | { readonly type: 'tick'; readonly dtMs: number }
  | { readonly type: 'pause' }
  | { readonly type: 'resume' }
  | { readonly type: 'move'; readonly dx: -1 | 0 | 1 }
  | { readonly type: 'rotate'; readonly dir: 1 | -1 }
  | { readonly type: 'softDrop' }
  | { readonly type: 'hardDrop' }
  | { readonly type: 'hold' }
  | { readonly type: 'restart' };

// ---- Line clear result ----------------------------------------------------

export interface LineClearResult {
  readonly cleared: readonly number[]; // row indices (visible coords, top = 0) that were cleared
  readonly count: 0 | 1 | 2 | 3 | 4;
  readonly kind: 'none' | 'single' | 'double' | 'triple' | 'tetris' | 'tSpinSingle' | 'tSpinDouble' | 'tSpinTriple' | 'tSpinMiniSingle';
  readonly scoreDelta: number;
}
