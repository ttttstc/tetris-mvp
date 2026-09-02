/**
 * input/keyboard.ts
 *
 * Maps raw keyboard events to logical InputAction values with classic Tetris
 * DAS / ARR handling.
 *
 * DAS (Delayed Auto Shift): the delay before a held direction key starts auto-
 * repeating. Default 170 ms.
 * ARR (Auto Repeat Rate): the rate at which a held direction key fires once
 * DAS has elapsed. Default 50 ms.
 *
 * Soft drop has its own (faster) repeat rate — gravity.ts defines SOFT_DROP_MS.
 *
 * The keyboard layer is the ONLY place that knows about KeyboardEvent. The
 * core state machine only ever sees InputAction objects.
 */

import type { InputAction } from '../core/types';

const DAS_MS = 170;
const ARR_MS = 50;

export interface KeymapEntry {
  /** Logical action emitted on the initial keydown. */
  readonly onDown: InputAction['type'] | null;
  /** Logical action emitted on every repeat / auto-repeat tick. null = no repeat. */
  readonly repeat?: InputAction['type'] | null;
  /** Whether this entry participates in DAS/ARR (held-direction behavior). */
  readonly das?: boolean;
  /** Optional explicit payload for the action. */
  readonly payload?: InputAction extends infer A ? A extends { type: infer T } ? T extends 'move' ? { dx: -1 | 0 | 1 } : T extends 'rotate' ? { dir: 1 | -1 } : Record<string, never> : never : never;
}

/** Default keybindings. Players can override in app/main.ts. */
export const DEFAULT_KEYMAP: Readonly<Record<string, KeymapEntry>> = {
  ArrowLeft:  { onDown: 'move', repeat: 'move', das: true, payload: { dx: -1 } },
  ArrowRight: { onDown: 'move', repeat: 'move', das: true, payload: { dx: +1 } },
  ArrowDown:  { onDown: 'softDrop', repeat: 'softDrop', das: false, payload: {} },
  ArrowUp:    { onDown: 'rotate', repeat: null, payload: { dir: 1 } },
  ' ':        { onDown: 'hardDrop', repeat: null, payload: {} },
  z:          { onDown: 'rotate', repeat: null, payload: { dir: -1 } },
  x:          { onDown: 'rotate', repeat: null, payload: { dir: 1 } },
  Shift:      { onDown: 'hold', repeat: null, payload: {} },
  c:          { onDown: 'hold', repeat: null, payload: {} },
  p:          { onDown: 'pause', repeat: null, payload: {} },
  Escape:     { onDown: 'pause', repeat: null, payload: {} },
  Enter:      { onDown: 'start', repeat: null, payload: {} },
  r:          { onDown: 'restart', repeat: null, payload: {} },
};

export interface KeyboardListener {
  /** Push a freshly produced InputAction to the consumer. */
  readonly onAction: (action: InputAction) => void;
  /** Returns the current action stream's unsubscribe handle. */
  dispose(): void;
}

/**
 * Attach a keyboard listener to the document. Returns a handle that detaches
 * the listener and stops all auto-repeat timers.
 */
export function attachKeyboard(
  onAction: (a: InputAction) => void,
  keymap: Readonly<Record<string, KeymapEntry>> = DEFAULT_KEYMAP,
): KeyboardListener {
  const held = new Map<string, { entry: KeymapEntry; downAt: number; lastRepeat: number; timer: ReturnType<typeof setTimeout> | null }>();

  function buildAction(type: InputAction['type'], entry: KeymapEntry): InputAction | null {
    switch (type) {
      case 'move': {
        const dx = (entry.payload as { dx: -1 | 0 | 1 }).dx;
        return { type: 'move', dx };
      }
      case 'rotate':
        return { type: 'rotate', dir: (entry.payload as { dir: 1 | -1 }).dir };
      case 'softDrop': return { type: 'softDrop' };
      case 'hardDrop': return { type: 'hardDrop' };
      case 'hold': return { type: 'hold' };
      case 'pause': return { type: 'pause' };
      case 'resume': return { type: 'resume' };
      case 'start': return { type: 'start' };
      case 'restart': return { type: 'restart' };
      case 'tick': return null; // tick is internal; never produced by keyboard
    }
  }

  function fireInitial(_key: string, entry: KeymapEntry) {
    if (entry.onDown === null) return;
    const a = buildAction(entry.onDown, entry);
    if (a) onAction(a);
  }

  function scheduleRepeat(key: string, entry: KeymapEntry) {
    const rec = held.get(key);
    if (!rec) return;
    if (!entry.das || !entry.repeat) return;
    const elapsed = performance.now() - rec.downAt;
    const afterDas = Math.max(0, elapsed - DAS_MS);
    const nextTick = afterDas === 0 ? DAS_MS : ARR_MS - (afterDas % ARR_MS);
    rec.timer = setTimeout(() => {
      const a = buildAction(entry.repeat!, entry);
      if (a) onAction(a);
      scheduleRepeat(key, entry);
    }, nextTick);
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.repeat) return; // browser repeats are ignored — we manage our own
    const entry = keymap[e.key];
    if (!entry) return;
    e.preventDefault();
    if (held.has(e.key)) return;
    held.set(e.key, { entry, downAt: performance.now(), lastRepeat: 0, timer: null });
    fireInitial(e.key, entry);
    scheduleRepeat(e.key, entry);
  }

  function onKeyUp(e: KeyboardEvent) {
    const rec = held.get(e.key);
    if (!rec) return;
    if (rec.timer !== null) clearTimeout(rec.timer);
    held.delete(e.key);
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  return {
    onAction,
    dispose() {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      for (const rec of held.values()) if (rec.timer !== null) clearTimeout(rec.timer);
      held.clear();
    },
  };
}
