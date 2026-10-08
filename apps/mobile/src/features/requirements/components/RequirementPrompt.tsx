import type { ModuleId } from '@wellness/design-tokens';
import { Button, Card, Icon, Text } from '@wellness/ui';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { requirements } from '../definitions';
import { useRequirements } from '../store';

/**
 * The in-app prompt for a missing detail. Shown at the top of the tracker
 * until the detail is filled in. Seeing it is what allows a (weekly, opt-in)
 * notification later.
 */
export function RequirementPrompt({ module }: { module: ModuleId }) {
  const { t } = useTranslation();
  const values = useRequirements();
  const missing = requirements.filter((r) => r.module === module && values[r.field] === null);
  const markPromptSeen = useRequirements((s) => s.markPromptSeen);
  const ids = missing.map((r) => r.id).join(',');

  useEffect(() => {
    for (const id of ids ? ids.split(',') : []) markPromptSeen(id);
  }, [ids, markPromptSeen]);

  if (!missing.length) return null;
  return (
    <View className="gap-3">
      {missing.map((r) => (
        <Card key={r.id} tone="accent" className="gap-2" accessibilityRole="summary">
          <View className="flex-row items-center gap-2">
            <Icon name="info" />
            <Text variant="title3" className="flex-1">
              {t(`requirements.${r.id}.title`)}
            </Text>
          </View>
          <Text>{t(`requirements.${r.id}.why`)}</Text>
          <Button
            variant="accent"
            label={t('requirements.add')}
            accessibilityHint={t(`requirements.${r.id}.title`)}
            onPress={() =>
              router.push({ pathname: '/setup/[requirement]', params: { requirement: r.id } })
            }
          />
        </Card>
      ))}
    </View>
  );
}
