/**
 * core/lineClear.ts
 *
 * Detect full rows and remove them. After removal, rows above the cleared lines
 * fall (gravity-collapse) toward the bottom, maintaining the visible-row count.
 *
 * The algorithm is intentionally simple and operates on the visible region only:
 *   1. Find indices of all fully-filled visible rows.
 *   2. If none, return the board unchanged.
 *   3. Otherwise, build a new board by reading from the source in order,
 *      skipping the cleared rows, and writing back top-aligned.
 *
 * Pure function: returns a NEW Uint8Array(240). The caller decides whether to
 * apply it (state machine) or inspect it (tests).
 */

import { createBoard, findFullRows, cloneBoard } from './board';
import {
  BOARD_WIDTH,
  VISIBLE_TOP,
  VISIBLE_BOTTOM,
  EMPTY,
  type Board,
} from './types';

export interface ClearResult {
  readonly board: Board;
  readonly clearedRows: readonly number[];
  readonly clearedCount: number;
}

/** Apply line clears and return a new board plus the cleared row indices (visible coords). */
export function clearFullLines(board: Board): ClearResult {
  const fullRows = findFullRows(board);
  if (fullRows.length === 0) {
    return { board: cloneBoard(board), clearedRows: [], clearedCount: 0 };
  }

  const newBoard = createBoard();
  const visibleRowCount = VISIBLE_BOTTOM - VISIBLE_TOP;
  const fullSet = new Set(fullRows);
  // Walk visible rows bottom-up, write to the same row in newBoard, skipping full rows.
  let writeRow = visibleRowCount - 1;
  for (let readRow = visibleRowCount - 1; readRow >= 0; readRow--) {
    if (fullSet.has(readRow)) continue;
    const srcStart = (readRow + VISIBLE_TOP) * BOARD_WIDTH;
    const dstStart = (writeRow + VISIBLE_TOP) * BOARD_WIDTH;
    for (let x = 0; x < BOARD_WIDTH; x++) {
      newBoard[dstStart + x] = board[srcStart + x]!;
    }
    writeRow--;
  }
  // Rows above the cleared ones are now empty in the unfilled region (already cleared by createBoard).

  return {
    board: newBoard,
    clearedRows: fullRows.slice().sort((a, b) => a - b),
    clearedCount: fullRows.length,
  };
}

/** True iff there's at least one cell above the topmost visible row. Used by spawn checks. */
export function hasCeilingOccupied(board: Board): boolean {
  for (let y = 0; y < VISIBLE_TOP; y++) {
    const start = y * BOARD_WIDTH;
    for (let x = 0; x < BOARD_WIDTH; x++) {
      if (board[start + x] !== EMPTY) return true;
    }
  }
  return false;
}
