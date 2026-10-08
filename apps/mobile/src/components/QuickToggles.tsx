import { Icon, Pressable, Text, useBounce, useTheme } from '@wellness/ui';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useProfile } from '@/features/profile';
import type { Language } from '@/i18n';
import { tapFeedback } from '@/lib/haptics';

/** Compact language and light/dark switches for the home header and setup screen. */
export function QuickToggles() {
  const { t, i18n } = useTranslation();
  const { scheme, colors } = useTheme();
  const setTheme = useProfile((s) => s.setTheme);
  const setLanguage = useProfile((s) => s.setLanguage);
  const isDark = scheme === 'dark';
  const bounce = useBounce(isDark);
  const current = (i18n.resolvedLanguage ?? 'en') as Language;
  const next: Language = current === 'en' ? 'hi' : 'en';

  return (
    <View className="flex-row gap-2">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('home.language')}
        accessibilityHint={t(`settings.languages.${next}`)}
        onPress={() => {
          tapFeedback();
          setLanguage(next);
        }}
        className="flex-row items-center justify-center gap-1 rounded-full bg-surface-muted px-3"
      >
        <Icon name="language" size={20} color={colors.text} />
        <Text variant="label">{current === 'en' ? 'EN' : 'हिं'}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isDark ? t('home.themeToLight') : t('home.themeToDark')}
        onPress={() => {
          tapFeedback();
          setTheme(isDark ? 'light' : 'dark');
        }}
        className="items-center justify-center rounded-full bg-surface-muted"
      >
        <Animated.View style={bounce}>
          <Icon name={isDark ? 'lightMode' : 'darkMode'} size={22} color={colors.text} />
        </Animated.View>
      </Pressable>
    </View>
  );
}
