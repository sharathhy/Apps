import { spring } from '@wellness/design-tokens';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeInDown, ReduceMotion } from 'react-native-reanimated';

interface AppearProps {
  children: ReactNode;
  /** Position in a list; each step adds a short stagger. */
  index?: number;
  style?: StyleProp<ViewStyle>;
}

const STAGGER_MS = 60;

/** Fades and lifts content in on mount. Skipped automatically when reduce-motion is on. */
export function Appear({ children, index = 0, style }: AppearProps) {
  return (
    <Animated.View
      style={style}
      entering={FadeInDown.delay(index * STAGGER_MS)
        .springify()
        .damping(spring.gentle.damping)
        .stiffness(spring.gentle.stiffness)
        .reduceMotion(ReduceMotion.System)}
    >
      {children}
    </Animated.View>
  );
}
