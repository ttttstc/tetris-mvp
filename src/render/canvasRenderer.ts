/**
 * render/canvasRenderer.ts
 *
 * Stateless renderer for the play field. Accepts the current playing snapshot
 * (board + active piece + next queue + hold piece) and draws to a 2D canvas.
 *
 * The renderer is pure in the sense that it does NOT own game state; the
 * composition root (app/main.ts) calls draw() every frame with the latest
 * GameState.
 */

import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  VISIBLE_TOP,
  VISIBLE_BOTTOM,
  EMPTY,
  type Board,
  type CellColor,
  type PieceId,
} from '../core/types';
import type { ActivePiece } from '../core/types';
import { pieceCells } from '../core/tetromino';
import { ghostPosition } from '../core/collision';
import type { IThemeProvider } from '../extensions/IThemeProvider';

/** Minimum surface for the render method. Any object satisfying this shape works. */
export interface RenderTarget {
  readonly board: Board;
  readonly active: ActivePiece;
  readonly next: readonly PieceId[];
  readonly hold: PieceId | null;
}

export class CanvasRenderer {
  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly theme: IThemeProvider,
  ) {}

  /** Convenience: draw everything (board + active + ghost + overlays). */
  draw(target: RenderTarget): void {
    const cell = this.theme.getCellSize();
    const w = BOARD_WIDTH * cell;
    const h = BOARD_HEIGHT * cell;

    this.ctx.fillStyle = this.theme.getBackgroundColor();
    this.ctx.fillRect(0, 0, w, h);

    this.drawGridLines(cell);
    this.drawLockedCells(target.board, cell);
    this.drawGhost(target, cell);
    this.drawActive(target.active, cell);
  }

  /** Public helper for tests: extract the piece color index (1..7) from piece id. */
  static colorFor(id: PieceId): CellColor {
    return ({ I: 1, O: 2, T: 3, S: 4, Z: 5, J: 6, L: 7 } as const)[id] as CellColor;
  }

  private drawGridLines(cell: number): void {
    const ctx = this.ctx;
    ctx.strokeStyle = this.theme.getGridLineColor();
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 1; x < BOARD_WIDTH; x++) {
      ctx.moveTo(x * cell + 0.5, 0);
      ctx.lineTo(x * cell + 0.5, BOARD_HEIGHT * cell);
    }
    for (let y = 1; y < BOARD_HEIGHT; y++) {
      ctx.moveTo(0, y * cell + 0.5);
      ctx.lineTo(BOARD_WIDTH * cell, y * cell + 0.5);
    }
    ctx.stroke();
  }

  private drawLockedCells(board: Board, cell: number): void {
    for (let y = VISIBLE_TOP; y < VISIBLE_BOTTOM; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        const v = board[y * BOARD_WIDTH + x] as number;
        if (v === EMPTY) continue;
        this.fillCell(x, y - VISIBLE_TOP, cell, this.theme.getColor(v as CellColor));
      }
    }
  }

  private drawGhost(target: RenderTarget, cell: number): void {
    const ghost = ghostPosition(target.board, target.active);
    const ghostColor = this.theme.getColor(CanvasRenderer.colorFor(ghost.id));
    this.ctx.save();
    this.ctx.globalAlpha = this.theme.getGhostOpacity();
    for (const c of pieceCells(ghost)) {
      if (c.dy < VISIBLE_TOP) continue;
      this.fillCell(c.dx, c.dy - VISIBLE_TOP, cell, ghostColor);
    }
    this.ctx.restore();
  }

  private drawActive(piece: ActivePiece, cell: number): void {
    const color = this.theme.getColor(CanvasRenderer.colorFor(piece.id));
    for (const c of pieceCells(piece)) {
      if (c.dy < VISIBLE_TOP) continue;
      this.fillCell(c.dx, c.dy - VISIBLE_TOP, cell, color);
    }
  }

  private fillCell(x: number, y: number, cell: number, color: string): void {
    const pad = 1;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x * cell + pad, y * cell + pad, cell - pad * 2, cell - pad * 2);
  }
}
