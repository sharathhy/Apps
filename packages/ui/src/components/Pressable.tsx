import { pressScale } from '@wellness/design-tokens';
import { cssInterop } from 'nativewind';
import { forwardRef } from 'react';
import {
  Pressable as RNPressable,
  type GestureResponderEvent,
  type PressableProps as RNPressableProps,
  type View,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { useMotion } from '../motion/useMotion';

const AnimatedPressable = Animated.createAnimatedComponent(RNPressable);
cssInterop(AnimatedPressable, { className: 'style' });

export interface PressableProps extends RNPressableProps {
  className?: string;
  /** Disable the press-in scale micro-interaction. */
  noScale?: boolean;
}

/**
 * Base pressable: enforces the 44pt minimum touch target and adds a subtle
 * press-in scale that is skipped when reduce-motion is on.
 */
export const Pressable = forwardRef<View, PressableProps>(function Pressable(
  { className = '', noScale, onPressIn, onPressOut, style, hitSlop = 4, ...rest },
  ref,
) {
  const motion = useMotion();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const animate = !noScale && !motion.reduceMotion;

  return (
    <AnimatedPressable
      ref={ref}
      hitSlop={hitSlop}
      className={`min-h-touch min-w-touch ${className}`}
      onPressIn={(e: GestureResponderEvent) => {
        if (animate) scale.value = withSpring(pressScale, motion.spring('snappy'));
        onPressIn?.(e);
      }}
      onPressOut={(e: GestureResponderEvent) => {
        if (animate) scale.value = withSpring(1, motion.spring('snappy'));
        onPressOut?.(e);
      }}
      style={[animatedStyle, style as object]}
      {...rest}
    />
  );
});
