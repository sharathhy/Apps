import { radii } from '@wellness/design-tokens';
import { useEffect } from 'react';
import { type DimensionValue } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useMotion } from '../motion/useMotion';
import { useTheme } from '../theme/ThemeProvider';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
}

/** Loading placeholder. Pulses gently; static when reduce-motion is on. */
export function Skeleton({ width = '100%', height = 16 }: SkeletonProps) {
  const motion = useMotion();
  const { colors } = useTheme();
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (motion.reduceMotion) return;
    opacity.value = withRepeat(withTiming(0.5, motion.timing('slow')), -1, true);
    return () => cancelAnimation(opacity);
  }, [motion, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        { width, height, borderRadius: radii.sm, backgroundColor: colors.surfaceMuted },
        style,
      ]}
    />
  );
}
