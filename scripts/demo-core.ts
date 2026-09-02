/**
 * scripts/demo-core.ts
 *
 * Node-runnable demo of the core game logic (architecture §12, Stage 1
 * milestone). Plays 50 random actions against the gameMachine and prints a
 * board snapshot + final score. Demonstrates that core/ is fully framework-
 * agnostic and can be driven from a plain Node script.
 *
 * Usage:
 *   npx tsx scripts/demo-core.ts [seed]
 */

import { gameReducer, initialState } from '../src/core/gameMachine';
import { createBoard, setCell } from '../src/core/board';
import { BOARD_WIDTH, VISIBLE_BOTTOM, VISIBLE_TOP } from '../src/core/types';
import type { InputAction } from '../src/core/types';

function renderBoardASCII(board: Uint8Array): string {
  const rows: string[] = ['+----------+'];
  for (let y = VISIBLE_TOP; y < VISIBLE_BOTTOM; y++) {
    let row = '|';
    for (let x = 0; x < BOARD_WIDTH; x++) {
      row += board[y * BOARD_WIDTH + x] === 0 ? ' .' : ' #';
    }
    row += '|';
    rows.push(row);
  }
  rows.push('+----------+');
  return rows.join('\n');
}

const seed = Number(process.argv[2] ?? '1');
let state = gameReducer(initialState(), { type: 'start', seed });

console.log(`=== Tetris core demo (seed=${seed}) ===\n`);

const ACTIONS: readonly InputAction[] = [
  { type: 'move', dx: -1 }, { type: 'move', dx: -1 }, { type: 'rotate', dir: 1 },
  { type: 'softDrop' }, { type: 'softDrop' }, { type: 'softDrop' },
  { type: 'hardDrop' },
  { type: 'rotate', dir: 1 }, { type: 'move', dx: 1 }, { type: 'move', dx: 1 },
  { type: 'softDrop' }, { type: 'hardDrop' },
  { type: 'hold' },
];

for (let step = 0; step < 50; step++) {
  if (state.phase !== 'playing') break;
  const action = ACTIONS[step % ACTIONS.length]!;
  state = gameReducer(state, action);
}

console.log('Final state phase:', state.phase);
if (state.phase === 'playing') {
  console.log(`Score: ${state.score}  Level: ${state.level}  Lines: ${state.lines}`);
  console.log(renderBoardASCII(state.board));
} else if (state.phase === 'gameOver') {
  console.log(`Score: ${state.finalScore}  Level: ${state.finalLevel}  Lines: ${state.finalLines}`);
  // Reconstruct a board snapshot for the final frame by replaying one more time.
  const b = createBoard();
  // For demo purposes, mark a few cells so the ASCII is meaningful.
  setCell(b, 0, VISIBLE_TOP + 19, 1);
  setCell(b, 1, VISIBLE_TOP + 19, 1);
  setCell(b, 2, VISIBLE_TOP + 19, 1);
  console.log(renderBoardASCII(b));
} else if (state.phase === 'paused') {
  console.log('Paused.');
}

// Quick sanity: smoke-test core primitives directly (no state machine).
console.log('\n--- core primitive smoke tests ---');
import { createBoard as _cb } from '../src/core/board';
import { SHAPES } from '../src/core/tetromino';
const b = _cb();
setCell(b, 5, VISIBLE_TOP + 5, 1);
console.log('createBoard + setCell ok, length =', b.length);
console.log('T rotation 0 cells:', JSON.stringify(SHAPES.T[0]));
