/**
 * core/board.ts
 *
 * 10×24 board with 2 buffer rows top and 2 bottom. Storage is Uint8Array(240).
 * Zero external dependencies.
 */

import {
  BOARD_WIDTH,
  TOTAL_ROWS,
  BOARD_CELLS,
  VISIBLE_TOP,
  VISIBLE_BOTTOM,
  EMPTY,
  type Board,
  type CellColor,
} from './types';

/** Allocate a fresh, empty board (all cells set to 0). */
export function createBoard(): Board {
  const b = new Uint8Array(BOARD_CELLS);
  // new Uint8Array already zeros memory, but be explicit for clarity.
  b.fill(EMPTY);
  return b;
}

/** Convert (x, y) to linear index. Returns -1 when out of [0, TOTAL_ROWS). */
export function toIndex(x: number, y: number): number {
  if (x < 0 || x >= BOARD_WIDTH || y < 0 || y >= TOTAL_ROWS) return -1;
  return y * BOARD_WIDTH + x;
}

/** True iff (x, y) is in board bounds (includes buffer rows). */
export function inBounds(x: number, y: number): boolean {
  return x >= 0 && x < BOARD_WIDTH && y >= 0 && y < TOTAL_ROWS;
}

/** True iff cell at (x, y) is set to a non-zero color. Out-of-bounds returns true (acts as wall). */
export function isOccupied(board: Board, x: number, y: number): boolean {
  const idx = toIndex(x, y);
  if (idx === -1) return true; // walls count as occupied
  return board[idx] !== EMPTY;
}

/** True iff cell is in the visible (rendered) area. */
export function isVisible(x: number, y: number): boolean {
  return x >= 0 && x < BOARD_WIDTH && y >= VISIBLE_TOP && y < VISIBLE_BOTTOM;
}

/** Set cell at (x, y). Caller must ensure inBounds first. */
export function setCell(board: Board, x: number, y: number, color: CellColor): void {
  const idx = toIndex(x, y);
  if (idx === -1) throw new RangeError(`setCell out of bounds: (${x}, ${y})`);
  board[idx] = color;
}

/** Get cell at (x, y). Returns EMPTY for out-of-bounds (treat walls as empty for queries). */
export function getCell(board: Board, x: number, y: number): CellColor {
  const idx = toIndex(x, y);
  if (idx === -1) return EMPTY;
  return board[idx] as CellColor;
}

/**
 * Deep-clone a board. Used when the game state machine snapshots for pause or
 * for replay-style tests.
 */
export function cloneBoard(board: Board): Board {
  return new Uint8Array(board);
}

/**
 * Check whether the visible row (y ∈ [0, BOARD_HEIGHT)) is fully filled.
 * The visible-row index `visibleRow` is the row in the rendered area, top=0.
 */
export function isRowFull(board: Board, visibleRow: number): boolean {
  const y = visibleRow + VISIBLE_TOP;
  if (visibleRow < 0 || visibleRow >= VISIBLE_BOTTOM - VISIBLE_TOP) return false;
  const start = y * BOARD_WIDTH;
  for (let x = 0; x < BOARD_WIDTH; x++) {
    if (board[start + x] === EMPTY) return false;
  }
  return true;
}

/**
 * Return indices (in visible-row coords, top=0) of all currently full visible rows.
 * This is a pure read used by lineClear.ts; it does not modify the board.
 */
export function findFullRows(board: Board): readonly number[] {
  const full: number[] = [];
  for (let r = 0; r < VISIBLE_BOTTOM - VISIBLE_TOP; r++) {
    if (isRowFull(board, r)) full.push(r);
  }
  return full;
}
