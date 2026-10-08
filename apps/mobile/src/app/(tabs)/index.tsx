import { breakpoints } from '@wellness/design-tokens';
import {
  AccentScope,
  Card,
  EmptyState,
  Icon,
  Pressable,
  Screen,
  Text,
  useTheme,
} from '@wellness/ui';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useWindowDimensions, View } from 'react-native';

import { MedicalDisclaimer } from '@/components/MedicalDisclaimer';
import { useVisibleModules } from '@/features/profile';
import type { ModuleManifest } from '@/features/types';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const modules = useVisibleModules();
  const twoColumns = width >= breakpoints.tablet;

  return (
    <Screen>
      <View className="gap-1">
        <Text variant="display">{t('home.greeting')}</Text>
        <Text variant="bodyLarge" tone="muted">
          {t('app.tagline')}
        </Text>
      </View>

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
          {modules.map((module) => (
            <View key={module.id} style={{ width: twoColumns ? '48.9%' : '100%' }}>
              <ModuleCard module={module} />
            </View>
          ))}
        </View>
      )}

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
