import { spring } from '@wellness/design-tokens';
import { useEffect } from 'react';
import {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

/** Returns a style that gives a small celebratory bounce whenever `trigger` becomes true. */
export function useBounce(trigger: boolean, peak = 1.18) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!trigger) return;
    const config = { ...spring.snappy, reduceMotion: ReduceMotion.System };
    scale.value = withSequence(withSpring(peak, config), withSpring(1, config));
  }, [trigger, peak, scale]);

  return useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
}
