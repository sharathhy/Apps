/**
 * Motion tokens. Every animation reads from here and must go through the
 * app's reduce-motion check, which swaps durations for 0 and springs for
 * instant transitions.
 */

export const duration = {
  instant: 100,
  fast: 160,
  base: 240,
  slow: 400,
  /** Progress rings and chart reveals. */
  reveal: 700,
} as const;

/** Cubic-bezier control points, usable with Reanimated `Easing.bezier(...)` and CSS. */
export const easing = {
  standard: [0.2, 0, 0, 1],
  emphasized: [0.3, 0, 0, 1],
  decelerate: [0, 0, 0, 1],
  accelerate: [0.3, 0, 1, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>;

export const spring = {
  /** Calm settle for cards and sheets. */
  gentle: { damping: 20, stiffness: 180, mass: 1 },
  /** Quick, tactile response for logging buttons. */
  snappy: { damping: 15, stiffness: 320, mass: 0.8 },
} as const;

/** Scale applied to pressable surfaces while pressed. */
export const pressScale = 0.97;
