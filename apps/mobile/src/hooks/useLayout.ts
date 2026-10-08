import { breakpoints } from '@wellness/design-tokens';
import { useWindowDimensions } from 'react-native';

export type LayoutSize = 'phone' | 'tablet' | 'desktop';

export function layoutForWidth(width: number): LayoutSize {
  if (width >= breakpoints.desktop) return 'desktop';
  if (width >= breakpoints.tablet) return 'tablet';
  return 'phone';
}

/** Current layout class from the window width (updates on rotation and resize). */
export function useLayout(): LayoutSize {
  const { width } = useWindowDimensions();
  return layoutForWidth(width);
}
