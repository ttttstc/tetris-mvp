/**
 * src/core/board.test.ts
 */
import { describe, it, expect } from 'vitest';
import { createBoard, inBounds, isOccupied, setCell, getCell, isVisible, isRowFull, findFullRows, toIndex, cloneBoard } from './board';
import { BOARD_WIDTH, TOTAL_ROWS, VISIBLE_TOP, EMPTY } from './types';

describe('board', () => {
  it('createBoard returns Uint8Array of 240 with all zeros', () => {
    const b = createBoard();
    expect(b).toBeInstanceOf(Uint8Array);
    expect(b.length).toBe(BOARD_WIDTH * TOTAL_ROWS);
    expect(b.every((v) => v === 0)).toBe(true);
  });

  it('toIndex maps (x, y) → y * 10 + x', () => {
    expect(toIndex(0, 0)).toBe(0);
    expect(toIndex(9, 0)).toBe(9);
    expect(toIndex(0, 1)).toBe(BOARD_WIDTH);
    expect(toIndex(3, 5)).toBe(5 * BOARD_WIDTH + 3);
  });

  it('toIndex returns -1 for out-of-bounds', () => {
    expect(toIndex(-1, 0)).toBe(-1);
    expect(toIndex(0, -1)).toBe(-1);
    expect(toIndex(BOARD_WIDTH, 0)).toBe(-1);
    expect(toIndex(0, TOTAL_ROWS)).toBe(-1);
  });

  it('inBounds is true for [0..W) × [0..H+B*2)', () => {
    expect(inBounds(0, 0)).toBe(true);
    expect(inBounds(9, TOTAL_ROWS - 1)).toBe(true);
    expect(inBounds(-1, 0)).toBe(false);
    expect(inBounds(0, TOTAL_ROWS)).toBe(false);
  });

  it('isOccupied treats walls as occupied and empty cells as free', () => {
    const b = createBoard();
    expect(isOccupied(b, -1, 0)).toBe(true);
    expect(isOccupied(b, 0, 0)).toBe(false);
    setCell(b, 3, 5, 4);
    expect(isOccupied(b, 3, 5)).toBe(true);
  });

  it('isVisible only inside visible rows', () => {
    expect(isVisible(0, 0)).toBe(false); // buffer top
    expect(isVisible(0, VISIBLE_TOP - 1)).toBe(false);
    expect(isVisible(0, VISIBLE_TOP)).toBe(true);
    expect(isVisible(9, VISIBLE_TOP + 19)).toBe(true);
    expect(isVisible(0, VISIBLE_TOP + 20)).toBe(false);
  });

  it('isRowFull and findFullRows identify full lines', () => {
    const b = createBoard();
    for (let x = 0; x < BOARD_WIDTH; x++) setCell(b, x, VISIBLE_TOP + 5, 1);
    expect(isRowFull(b, 5)).toBe(true);
    expect(isRowFull(b, 0)).toBe(false);
    expect(findFullRows(b)).toEqual([5]);

    for (let x = 0; x < BOARD_WIDTH - 1; x++) setCell(b, x, VISIBLE_TOP + 10, 2);
    expect(isRowFull(b, 10)).toBe(false);
    expect(findFullRows(b)).toEqual([5]);
  });

  it('cloneBoard is a deep copy', () => {
    const b = createBoard();
    setCell(b, 0, 0, 1);
    const c = cloneBoard(b);
    c[0] = 7;
    expect(b[0]).toBe(1);
    expect(c[0]).toBe(7);
  });

  it('getCell returns EMPTY for out-of-bounds', () => {
    const b = createBoard();
    expect(getCell(b, -1, 0)).toBe(EMPTY);
    expect(getCell(b, 0, 0)).toBe(EMPTY);
  });

  it('setCell throws on out-of-bounds', () => {
    const b = createBoard();
    expect(() => setCell(b, -1, 0, 1)).toThrow();
    expect(() => setCell(b, 0, TOTAL_ROWS, 1)).toThrow();
  });
});
