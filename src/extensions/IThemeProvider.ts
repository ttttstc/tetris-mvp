/**
 * extensions/IThemeProvider.ts
 *
 * Extension point: pluggable visual themes (color palette, cell size, ghost
 * opacity). The MVP ships with DefaultTheme; future themes (retro, dark, custom
 * upload) just implement this interface.
 *
 * Pure interface — no runtime code here.
 */

import type { CellColor } from '../core/types';

export interface IThemeProvider {
  getColor(cell: CellColor): string;     // CSS color string (e.g. "#5eb3ff")
  getGhostOpacity(): number;             // 0..1
  getCellSize(): number;                 // pixels per cell
  getGridLineColor(): string;            // CSS color
  getBackgroundColor(): string;          // CSS color
}
