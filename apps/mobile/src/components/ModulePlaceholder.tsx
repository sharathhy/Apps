import {
  AccentScope,
  Card,
  EmptyState,
  Icon,
  Screen,
  Skeleton,
  Text,
  useTheme,
} from '@wellness/ui';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { RequirementPrompt } from '@/features/requirements/components/RequirementPrompt';
import type { ModuleManifest } from '@/features/types';

import { MedicalDisclaimer } from './MedicalDisclaimer';

/** Phase 0 shell for a module: accent header, empty state, skeleton preview and disclaimer. */
export function ModulePlaceholder({ module }: { module: ModuleManifest }) {
  const { t } = useTranslation();
  const { accents } = useTheme();
  const title = t(`modules.${module.id}.title`);

  return (
    <AccentScope module={module.id}>
      <Screen>
        <View className="flex-row items-center gap-3">
          <View className="rounded-lg bg-accent-soft p-2">
            <Icon name={module.icon} size={28} color={accents[module.id].accent} />
          </View>
          <View className="flex-1">
            <Text variant="title1">{title}</Text>
            <Text tone="muted">{t(`modules.${module.id}.description`)}</Text>
          </View>
        </View>

        <RequirementPrompt module={module.id} />

        <Card>
          <EmptyState
            icon={module.icon}
            title={t('module.placeholderTitle', { module: title })}
            message={t('module.placeholderMessage', { phase: module.plannedPhase })}
          />
        </Card>

        <Card accessibilityLabel={t('module.loadingPreview')} className="gap-3">
          <Skeleton width="40%" height={20} />
          <Skeleton height={14} />
          <Skeleton width="80%" height={14} />
        </Card>

        <MedicalDisclaimer />
      </Screen>
    </AccentScope>
  );
}
