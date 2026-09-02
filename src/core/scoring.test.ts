/**
 * src/core/scoring.test.ts
 */
import { describe, it, expect } from 'vitest';
import { scoreClear, levelFromLines, nextLevelFor } from './scoring';

describe('scoreClear', () => {
  it('single at level 1 is 100', () => {
    expect(scoreClear({ level: 1, linesCleared: 1, kind: 'single', wasBackToBack: false, combo: 0, softDropCells: 0, hardDropCells: 0 }).scoreDelta).toBe(100);
  });
  it('tetris at level 2 is 1600', () => {
    expect(scoreClear({ level: 2, linesCleared: 4, kind: 'tetris', wasBackToBack: false, combo: 0, softDropCells: 0, hardDropCells: 0 }).scoreDelta).toBe(1600);
  });
  it('T-Spin Double at level 3 is 3600', () => {
    expect(scoreClear({ level: 3, linesCleared: 2, kind: 'tSpinDouble', wasBackToBack: false, combo: 0, softDropCells: 0, hardDropCells: 0 }).scoreDelta).toBe(3600);
  });
  it('back-to-back tetris at level 1 multiplies by 1.5', () => {
    const r = scoreClear({ level: 1, linesCleared: 4, kind: 'tetris', wasBackToBack: true, combo: 0, softDropCells: 0, hardDropCells: 0 });
    expect(r.scoreDelta).toBe(1200); // 800 * 1.5
    expect(r.nextBackToBack).toBe(true);
  });
  it('combo bonus: 2x combo at level 1 single adds +100', () => {
    const r = scoreClear({ level: 1, linesCleared: 1, kind: 'single', wasBackToBack: false, combo: 2, softDropCells: 0, hardDropCells: 0 });
    expect(r.scoreDelta).toBe(200); // 100 base + 50*2*1 = 200
    expect(r.nextCombo).toBe(3);
  });
  it('soft and hard drop bonuses are added', () => {
    const r = scoreClear({ level: 1, linesCleared: 0, kind: 'none', wasBackToBack: false, combo: 0, softDropCells: 5, hardDropCells: 10 });
    expect(r.scoreDelta).toBe(25); // 5*1 + 10*2 = 25
  });
  it('non-clear resets combo to 0', () => {
    const r = scoreClear({ level: 1, linesCleared: 0, kind: 'none', wasBackToBack: false, combo: 5, softDropCells: 0, hardDropCells: 0 });
    expect(r.nextCombo).toBe(0);
  });
});

describe('levelFromLines', () => {
  it('every 10 lines bumps level', () => {
    expect(levelFromLines(0)).toBe(1);
    expect(levelFromLines(9)).toBe(1);
    expect(levelFromLines(10)).toBe(2);
    expect(levelFromLines(19)).toBe(2);
    expect(levelFromLines(20)).toBe(3);
    expect(levelFromLines(99)).toBe(10);
  });
});

describe('nextLevelFor (per-event)', () => {
  it('bumps level when linesAdded >= 10 in a single event', () => {
    expect(nextLevelFor(1, 4)).toBe(1);
    expect(nextLevelFor(1, 10)).toBe(2);
  });
  it('returns same level for small events', () => {
    expect(nextLevelFor(5, 3)).toBe(5);
  });
});
