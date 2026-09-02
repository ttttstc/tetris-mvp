// 棋盘工厂：返回空棋盘 / 预填充棋盘，方便 rotation/collision/lineClear 单元测直接喂数据。
// 架构约定：Board = Uint8Array(240)，BUFFER_ROWS=2 上下各 2 行。
// ponrail: 不写灵活构造器，只给 empty() 与 fillRow()/fillCols() 两个原子操作。

import type { Board, CellColor } from '@core/types';

export function emptyBoard(): Board {
  return new Uint8Array(240) as Board;
}

export function fillRow(board: Board, row: number, color: CellColor = 1): void {
  for (let x = 0; x < 10; x++) board[row * 10 + x] = color;
}

export function setCell(board: Board, x: number, y: number, color: CellColor): void {
  board[y * 10 + x] = color;
}
