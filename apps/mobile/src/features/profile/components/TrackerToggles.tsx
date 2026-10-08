import { Icon, Text, useTheme } from '@wellness/ui';
import { useTranslation } from 'react-i18next';
import { Switch, View } from 'react-native';

import { getEnabledModules } from '@/features/registry';

import { useProfile } from '../store';

/** One switch per tracker enabled in config; reflects and edits the user's choices. */
export function TrackerToggles() {
  const { t } = useTranslation();
  const { colors, accents } = useTheme();
  const trackers = useProfile((s) => s.trackers);
  const toggle = useProfile((s) => s.toggleTracker);

  return (
    <View className="gap-1">
      {getEnabledModules().map((module) => {
        const title = t(`modules.${module.id}.title`);
        const on = trackers.includes(module.id);
        return (
          <View key={module.id} className="min-h-touch flex-row items-center gap-3 py-1">
            <Icon name={module.icon} size={22} color={accents[module.id].accent} />
            <View className="flex-1">
              <Text variant="label">{title}</Text>
              <Text variant="footnote" tone="muted">
                {t(`modules.${module.id}.description`)}
              </Text>
            </View>
            <Switch
              accessibilityLabel={t('myTrackers.show', { module: title })}
              value={on}
              onValueChange={() => toggle(module.id)}
              trackColor={{ false: colors.borderStrong, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>
        );
      })}
    </View>
  );
}
