/**
 * extensions/IReplayRecorder.ts
 *
 * Extension point: capture every input action with a frame timestamp so the
 * entire game can be replayed later. The MVP does NOT implement this; the
 * interface is reserved per the architecture §8 contract.
 *
 * Pure interface — no runtime code here.
 */

import type { ActivePiece, Board, InputAction } from '../core/types';

export interface ReplayFrame {
  readonly tMs: number;
  readonly action: InputAction;
}

export interface IReplayRecorder {
  start(seed: number): void;
  record(frame: ReplayFrame): void;
  /** Produce a serializable view of the recorded session. */
  serialize(): ReplayBlob;
}

/** Companion factory (interfaces can't have static members in TS). */
export interface IReplayRecorderStatic {
  deserialize(bytes: Uint8Array): IReplayRecorder;
}

export interface ReplayBlob {
  readonly seed: number;
  readonly frames: readonly ReplayFrame[];
  readonly initialBoard: Board;
  readonly initialActive: ActivePiece;
}
