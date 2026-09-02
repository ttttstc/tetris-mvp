/**
 * render/theme.ts
 *
 * Default IThemeProvider implementation. Pure data; the renderer reads these
 * values to pick colors, cell size, ghost opacity, etc.
 *
 * Per the architecture, `render/` only depends on `core/` (the type
 * definitions here are imported from core/types, never any Svelte/canvas code).
 */

import type { CellColor } from '../core/types';
import type { IThemeProvider } from '../extensions/IThemeProvider';

export class DefaultTheme implements IThemeProvider {
  private readonly palette: Record<CellColor, string> = {
    0: '#0a0a0a',
    1: '#5eb3ff', // I — cyan
    2: '#f7d51d', // O — yellow
    3: '#a35bff', // T — purple
    4: '#5ec97a', // S — green
    5: '#ef4444', // Z — red
    6: '#3b82f6', // J — blue
    7: '#fb923c', // L — orange
  };

  getColor(cell: CellColor): string {
    return this.palette[cell] ?? '#000';
  }
  getGhostOpacity(): number { return 0.25; }
  getCellSize(): number { return 30; }
  getGridLineColor(): string { return 'rgba(255,255,255,0.08)'; }
  getBackgroundColor(): string { return '#111'; }
}
