import { breakpoints } from '@wellness/design-tokens';
import {
  AccentScope,
  Appear,
  Card,
  EmptyState,
  Icon,
  Pressable,
  ProgressRing,
  Screen,
  Text,
  useTheme,
} from '@wellness/ui';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useWindowDimensions, View } from 'react-native';

import { InstallCard } from '@/components/InstallCard';
import { MedicalDisclaimer } from '@/components/MedicalDisclaimer';
import { NotificationBell } from '@/components/NotificationBell';
import { visibleAchievements } from '@/features/achievements/catalog';
import { useAchievements } from '@/features/achievements/store';
import { QuickToggles } from '@/components/QuickToggles';
import { availableTrackers, useProfile, useVisibleModules } from '@/features/profile';
import { getEnabledModules } from '@/features/registry';
import type { ModuleManifest } from '@/features/types';
import { dayPart } from '@/lib/greeting';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const modules = useVisibleModules();
  const audience = useProfile((s) => s.audience) ?? 'everyone';
  const total = getEnabledModules().filter((m) =>
    availableTrackers(audience).includes(m.id),
  ).length;
  const twoColumns = width >= breakpoints.tablet;

  return (
    <Screen>
      <Appear>
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 gap-1">
            <Text variant="display">{t(`home.${dayPart(new Date())}`)}</Text>
            <Text variant="bodyLarge" tone="muted">
              {t('app.tagline')}
            </Text>
          </View>
          <View className="items-end gap-2">
            <QuickToggles />
            <NotificationBell />
          </View>
        </View>
      </Appear>

      <Appear index={1}>
        <Card className="flex-row items-center gap-4">
          <ProgressRing
            progress={total ? modules.length / total : 0}
            size={72}
            strokeWidth={8}
            accessibilityLabel={t('home.activeTrackers', { count: modules.length, total })}
          >
            <Text variant="title3">{modules.length}</Text>
          </ProgressRing>
          <View className="flex-1 gap-1">
            <Text variant="title3">
              {t('home.activeTrackers', { count: modules.length, total })}
            </Text>
            <Pressable
              accessibilityRole="link"
              onPress={() => router.navigate('/settings')}
              noScale
              className="justify-center"
            >
              <Text variant="footnote" tone="primary">
                {t('home.activeTrackersHint')}
              </Text>
            </Pressable>
          </View>
          <Icon name="sparkles" size={22} color={colors.primary} />
        </Card>
      </Appear>

      <Appear index={2}>
        <AchievementsCard />
      </Appear>

      <Text variant="title3" className="mt-2">
        {t('home.subtitle')}
      </Text>

      {modules.length === 0 ? (
        <Card>
          <EmptyState
            icon="sparkles"
            title={t('myTrackers.empty')}
            message={t('myTrackers.emptyMessage')}
            actionLabel={t('myTrackers.openSettings')}
            onAction={() => router.navigate('/settings')}
          />
        </Card>
      ) : (
        <View className="flex-row flex-wrap gap-3">
          {modules.map((module, i) => (
            <Appear key={module.id} index={i + 2} style={{ width: twoColumns ? '48.9%' : '100%' }}>
              <ModuleCard module={module} />
            </Appear>
          ))}
        </View>
      )}

      <InstallCard />
      <MedicalDisclaimer />
    </Screen>
  );
}

function ModuleCard({ module }: { module: ModuleManifest }) {
  const { t } = useTranslation();
  const { accents } = useTheme();
  const title = t(`modules.${module.id}.title`);

  return (
    <AccentScope module={module.id}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('home.open', { module: title })}
        accessibilityHint={t(`modules.${module.id}.description`)}
        onPress={() => router.navigate(module.href)}
      >
        <Card tone="accent" className="flex-row items-center gap-4">
          <View className="rounded-lg bg-surface p-3">
            <Icon name={module.icon} size={28} color={accents[module.id].accent} />
          </View>
          <View className="flex-1 gap-1">
            <Text variant="title3">{title}</Text>
            <Text variant="footnote">{t(`modules.${module.id}.description`)}</Text>
            <Text variant="caption" tone="accent">
              {t('home.comingSoon', { phase: module.plannedPhase })}
            </Text>
          </View>
          <Icon name="chevronRight" size={18} />
        </Card>
      </Pressable>
    </AccentScope>
  );
}

function AchievementsCard() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const modules = useVisibleModules().map((m) => m.id);
  const earned = useAchievements((s) => s.earned);
  const list = visibleAchievements(modules);
  const count = list.filter((a) => earned.some((e) => e.id === a.id)).length;
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${t('achievements.title')}: ${t('achievements.summary', { earned: count, total: list.length })}`}
      onPress={() => router.push('/achievements')}
    >
      <Card className="flex-row items-center gap-3">
        <View className="rounded-lg bg-primary-soft p-2">
          <Icon name="trophy" color={colors.primary} />
        </View>
        <View className="flex-1">
          <Text variant="label">{t('achievements.title')}</Text>
          <Text variant="footnote" tone="muted">
            {t('achievements.summary', { earned: count, total: list.length })}
          </Text>
        </View>
        <Icon name="chevronRight" size={18} />
      </Card>
    </Pressable>
  );
}
