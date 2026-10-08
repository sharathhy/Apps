import { Appear, Card, Icon, ProgressRing, Screen, Text, useTheme } from '@wellness/ui';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useVisibleModules } from '@/features/profile/useVisibleModules';

import { achievementCategories, visibleAchievements } from '../catalog';
import { useAchievements } from '../store';

/**
 * Earned and not-yet-earned achievements, by category. Locked ones show
 * only what they are for: no progress bars, countdowns or pressure.
 */
export function AchievementsScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const earned = useAchievements((s) => s.earned);
  const modules = useVisibleModules().map((m) => m.id);
  const list = visibleAchievements(modules);
  const earnedById = new Map(earned.map((e) => [e.id, e]));
  const earnedCount = list.filter((a) => earnedById.has(a.id)).length;

  return (
    <Screen edgeTop={false}>
      <Stack.Screen options={{ headerTitle: t('achievements.title') }} />
      <Card className="flex-row items-center gap-4">
        <ProgressRing
          progress={list.length ? earnedCount / list.length : 0}
          size={64}
          accessibilityLabel={t('achievements.summary', {
            earned: earnedCount,
            total: list.length,
          })}
        >
          <Icon name="trophy" />
        </ProgressRing>
        <View className="flex-1 gap-1">
          <Text variant="title3">
            {t('achievements.summary', { earned: earnedCount, total: list.length })}
          </Text>
          <Text variant="footnote" tone="muted">
            {t('achievements.graceNote')}
          </Text>
        </View>
      </Card>

      {achievementCategories.map((category) => {
        const items = list.filter((a) => a.category === category);
        if (!items.length) return null;
        return (
          <View key={category} className="gap-2">
            <Text variant="label" tone="muted" accessibilityRole="header">
              {t(`achievements.categories.${category}`)}
            </Text>
            {items.map((a, index) => {
              const got = earnedById.get(a.id);
              const name = t(
                `achievements.items.${a.id}.name` as 'achievements.items.welcome.name',
              );
              const description = t(
                `achievements.items.${a.id}.description` as 'achievements.items.welcome.description',
              );
              const status = got
                ? t('achievements.earnedOn', {
                    date: new Date(got.earnedAt).toLocaleDateString(i18n.language, {
                      dateStyle: 'medium',
                    }),
                  })
                : t('achievements.notYet');
              return (
                <Appear key={a.id} index={index}>
                  <Card
                    tone={got ? 'surface' : 'muted'}
                    className={`flex-row items-center gap-3 ${got ? '' : 'opacity-70'}`}
                    accessible
                    accessibilityLabel={`${name}. ${description}. ${status}`}
                  >
                    <View
                      className={`h-12 w-12 items-center justify-center rounded-full ${got ? 'bg-primary-soft' : 'bg-surface'}`}
                    >
                      <Icon
                        name={got ? a.icon : 'lock'}
                        color={got ? colors.primary : colors.textMuted}
                      />
                    </View>
                    <View className="flex-1 gap-0.5">
                      <Text variant="label">{name}</Text>
                      <Text variant="footnote" tone="muted">
                        {description}
                      </Text>
                      <Text variant="caption" tone={got ? 'primary' : 'muted'}>
                        {status}
                      </Text>
                    </View>
                  </Card>
                </Appear>
              );
            })}
          </View>
        );
      })}
    </Screen>
  );
}
