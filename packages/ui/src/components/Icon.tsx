import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';

import { useTheme } from '../theme/ThemeProvider';

type SymbolName = ComponentProps<typeof SymbolView>['name'];

/**
 * The app's icon set, mapped to SF Symbols on iOS and Material Symbols on
 * Android and web. Add icons here rather than using raw symbol names.
 */
export const icons = {
  home: { ios: 'house', android: 'home', web: 'home' },
  water: { ios: 'drop', android: 'water_drop', web: 'water_drop' },
  mood: { ios: 'face.smiling', android: 'mood', web: 'mood' },
  cycle: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' },
  pregnancy: {
    ios: 'figure.and.child.holdinghands',
    android: 'pregnant_woman',
    web: 'pregnant_woman',
  },
  nutrition: { ios: 'fork.knife', android: 'restaurant', web: 'restaurant' },
  sleep: { ios: 'moon.zzz', android: 'bedtime', web: 'bedtime' },
  language: { ios: 'globe', android: 'language', web: 'language' },
  darkMode: { ios: 'moon', android: 'dark_mode', web: 'dark_mode' },
  lightMode: { ios: 'sun.max', android: 'light_mode', web: 'light_mode' },
  download: { ios: 'arrow.down.circle', android: 'download', web: 'download' },
  install: { ios: 'iphone', android: 'install_mobile', web: 'install_mobile' },
  women: { ios: 'figure.dress.line.vertical.figure', android: 'woman', web: 'woman' },
  men: { ios: 'figure.stand', android: 'man', web: 'man' },
  settings: { ios: 'gearshape', android: 'settings', web: 'settings' },
  info: { ios: 'info.circle', android: 'info', web: 'info' },
  chevronRight: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  shield: { ios: 'lock.shield', android: 'shield_lock', web: 'shield_lock' },
  cloudOff: { ios: 'icloud.slash', android: 'cloud_off', web: 'cloud_off' },
  error: { ios: 'exclamationmark.triangle', android: 'warning', web: 'warning' },
  sparkles: { ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' },
} as const satisfies Record<string, SymbolName>;

export type IconName = keyof typeof icons;

export interface IconProps {
  name: IconName;
  size?: number;
  /** Defaults to the current text color. */
  color?: string;
  /** Icons are decorative by default; pass a label only when the icon stands alone. */
  accessibilityLabel?: string;
}

export function Icon({ name, size = 24, color, accessibilityLabel }: IconProps) {
  const { colors } = useTheme();
  return (
    <SymbolView
      name={icons[name]}
      size={size}
      tintColor={color ?? colors.text}
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      importantForAccessibility={accessibilityLabel ? 'yes' : 'no-hide-descendants'}
    />
  );
}
