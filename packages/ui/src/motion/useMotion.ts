import { duration as durations, easing, spring } from '@wellness/design-tokens';
import { useMemo } from 'react';
import { Easing, ReduceMotion, useReducedMotion } from 'react-native-reanimated';

type DurationToken = keyof typeof durations;
type EasingToken = keyof typeof easing;

/**
 * Motion helpers that honour the OS "reduce motion" setting. When it is on,
 * durations collapse to 0 and springs become instant, so every animation
 * built from these helpers degrades to a simple state change.
 */
export function useMotion() {
  const reduceMotion = useReducedMotion();

  return useMemo(
    () => ({
      reduceMotion,
      duration: (token: DurationToken) => (reduceMotion ? 0 : durations[token]),
      timing: (token: DurationToken, curve: EasingToken = 'standard') => {
        const [x1, y1, x2, y2] = easing[curve];
        return {
          duration: reduceMotion ? 0 : durations[token],
          easing: Easing.bezier(x1, y1, x2, y2),
          reduceMotion: ReduceMotion.System,
        };
      },
      spring: (token: keyof typeof spring) => ({
        ...spring[token],
        reduceMotion: ReduceMotion.System,
      }),
    }),
    [reduceMotion],
  );
}
