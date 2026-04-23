/**
 * Sprite sheet configuration and animation definitions
 *
 * All character sprite sheets follow the same layout:
 * - 5 rows × 3 frames per row
 * - Row 0: Idle (3 frames)
 * - Row 1: Walking (3 frames)
 * - Row 2: Basic Attack (3 frames)
 * - Row 3: Special Attack (3 frames)
 * - Row 4: Hit Reaction (3 frames)
 */

export const SPRITE_ROWS = {
  IDLE: 0,
  WALK: 1,
  ATTACK: 2,
  SPECIAL: 3,
  HIT: 4,
} as const;

export const ANIMATION_FRAMES = {
  IDLE: { row: 0, startCol: 0, endCol: 2, frameCount: 3 },
  WALK: { row: 1, startCol: 0, endCol: 2, frameCount: 3 },
  ATTACK: { row: 2, startCol: 0, endCol: 2, frameCount: 3 },
  SPECIAL: { row: 3, startCol: 0, endCol: 2, frameCount: 3 },
  HIT: { row: 4, startCol: 0, endCol: 2, frameCount: 3 },
  KO: { row: 4, startCol: 0, endCol: 2, frameCount: 3 }, // Use same as HIT for now
} as const;

export type AnimationState = keyof typeof ANIMATION_FRAMES;

export interface AnimationConfig {
  row: number;
  startCol: number;
  endCol: number;
  frameCount: number;
}

export type AnimationLoopType = 'loop' | 'once' | 'hold-last';

export const ANIMATION_LOOP_TYPES: Record<AnimationState, AnimationLoopType> = {
  IDLE: 'loop',
  WALK: 'loop',
  ATTACK: 'once',
  SPECIAL: 'once',
  HIT: 'once',
  KO: 'hold-last',
};

/**
 * Default frame durations in milliseconds
 * These can be overridden by visual_effects.csv
 */
export const DEFAULT_FRAME_DURATIONS: Record<AnimationState, number> = {
  IDLE: 250,      // 750ms total (3 frames)
  WALK: 150,      // 450ms total (3 frames)
  ATTACK: 80,     // 240ms total (3 frames)
  SPECIAL: 100,   // 300ms total (3 frames)
  HIT: 80,        // 240ms total (3 frames)
  KO: 200,        // 600ms total (3 frames)
};
