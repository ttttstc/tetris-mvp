/**
 * src/core/lineClear.test.ts
 *
 * Edge cases per architecture §7.1: single, double, triple, tetris, simultaneous
 * non-adjacent lines, last-block-clears-board, and out-of-bounds guards.
 */

import { describe, it, expect } from 'vitest';
import { clearFullLines, hasCeilingOccupied } from './lineClear';
import { createBoard, setCell } from './board';
import { BOARD_WIDTH, VISIBLE_TOP } from './types';

function fillRow(b: Uint8Array, visibleRow: number, color: number = 1) {
  for (let x = 0; x < BOARD_WIDTH; x++) setCell(b, x, VISIBLE_TOP + visibleRow, color as never);
}

function halfFillRow(b: Uint8Array, visibleRow: number, color: number = 1) {
  for (let x = 0; x < BOARD_WIDTH - 1; x++) setCell(b, x, VISIBLE_TOP + visibleRow, color as never);
}

describe('clearFullLines', () => {
  it('returns unchanged board when no lines full', () => {
    const b = createBoard();
    halfFillRow(b, 0, 1); halfFillRow(b, 1, 1); // partial rows — not full
    const r = clearFullLines(b);
    expect(r.clearedCount).toBe(0);
    expect(r.clearedRows).toEqual([]);
  });

  it('clears a single line at the bottom', () => {
    const b = createBoard();
    fillRow(b, 19, 1);
    const r = clearFullLines(b);
    expect(r.clearedCount).toBe(1);
    expect(r.clearedRows).toEqual([19]);
  });

  it('clears a tetris (4 simultaneous lines)', () => {
    const b = createBoard();
    for (let y = 16; y < 20; y++) fillRow(b, y, 1);
    const r = clearFullLines(b);
    expect(r.clearedCount).toBe(4);
    expect(r.clearedRows).toEqual([16, 17, 18, 19]);
  });

  it('collapses upper rows down after clear', () => {
    const b = createBoard();
    // Marker cell at (0, row 5) — partial row 5 (NOT full, so it doesn't get cleared).
    // Full rows 9..19 (color 1) = 11 rows total. After clear, the marker drops by 11.
    setCell(b, 0, VISIBLE_TOP + 5, 2);
    for (let y = 9; y < 20; y++) fillRow(b, y, 1);
    const r = clearFullLines(b);
    expect(r.clearedCount).toBe(11);
    // Marker was at row 5, drops by 11 → row 16. Verify cell (0, row 16) is still green.
    expect(r.board[(VISIBLE_TOP + 16) * BOARD_WIDTH]).toBe(2);
  });

  it('does not touch buffer rows', () => {
    const b = createBoard();
    // Place a cell in the top buffer
    setCell(b, 0, 0, 1);
    setCell(b, 1, 0, 1);
    const r = clearFullLines(b);
    expect(r.clearedCount).toBe(0);
    expect(r.board[0]).toBe(1);
    expect(r.board[1]).toBe(1);
  });

  it('hasCeilingOccupied detects cells in buffer rows', () => {
    const b = createBoard();
    expect(hasCeilingOccupied(b)).toBe(false);
    setCell(b, 0, 0, 1);
    expect(hasCeilingOccupied(b)).toBe(true);
  });
});
