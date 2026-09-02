/**
 * extensions/IHighScoreStorage.ts
 *
 * Extension point: persistence for top-N scores. MVP implementation will be a
 * LocalStorage adapter; future extensions can be a REST API or IndexedDB.
 *
 * Pure interface — no runtime code here.
 */

export interface HighScoreEntry {
  readonly score: number;
  readonly lines: number;
  readonly level: number;
  readonly timestamp: number;
}

export interface IHighScoreStorage {
  getTop(n: number): Promise<readonly HighScoreEntry[]>;
  submit(entry: HighScoreEntry): Promise<void>;
}
