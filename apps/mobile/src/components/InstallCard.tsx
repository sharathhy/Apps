import { Button, Card, Icon, Text, useTheme } from '@wellness/ui';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useInstallPrompt } from '@/hooks/useInstallPrompt';

/** Web only: offers to install the app (PWA). Renders nothing on Android and iOS apps. */
export function InstallCard() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { state, install } = useInstallPrompt();
  if (state === 'unavailable') return null;

  return (
    <Card className="gap-3">
      <View className="flex-row items-center gap-3">
        <View className="rounded-lg bg-primary-soft p-2">
          <Icon
            name={state === 'installed' ? 'install' : 'download'}
            size={24}
            color={colors.primary}
          />
        </View>
        <View className="flex-1">
          <Text variant="title3">{t('install.title')}</Text>
          <Text variant="footnote" tone="muted">
            {state === 'installed' ? t('install.installed') : t('install.description')}
          </Text>
        </View>
      </View>
      {state === 'prompt' ? (
        <Button label={t('install.button')} onPress={() => void install()} />
      ) : null}
      {state === 'ios' ? <Text variant="footnote">{t('install.ios')}</Text> : null}
    </Card>
  );
}
