import { Button, Card, Screen, Text } from '@wellness/ui';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useProfile, type Audience } from '@/features/profile';
import { AudiencePicker } from '@/features/profile/components/AudiencePicker';
import { TrackerToggles } from '@/features/profile/components/TrackerToggles';

/** First-run setup: choose women's, men's or all trackers, then fine-tune. */
export default function WelcomeScreen() {
  const { t } = useTranslation();
  const audience = useProfile((s) => s.audience);
  const trackers = useProfile((s) => s.trackers);
  const chooseAudience = useProfile((s) => s.chooseAudience);

  const finish = () => router.replace('/');
  const choose = (a: Audience) => chooseAudience(a);

  return (
    <Screen>
      <View className="gap-2">
        <Text variant="display">{t('setup.title')}</Text>
        <Text variant="bodyLarge" tone="muted">
          {t('setup.subtitle')}
        </Text>
      </View>

      <AudiencePicker value={audience} onChange={choose} />

      {audience ? (
        <View className="gap-2">
          <Text variant="label" tone="muted" accessibilityRole="header">
            {t('setup.trackersTitle')}
          </Text>
          <Card>
            <TrackerToggles />
          </Card>
        </View>
      ) : null}

      <Text variant="footnote" tone="muted">
        {t('setup.privacy')}
      </Text>

      <Button
        label={audience && trackers.length === 0 ? t('setup.noneSelected') : t('setup.continue')}
        disabled={!audience || trackers.length === 0}
        onPress={finish}
      />
      <Button
        label={t('setup.skip')}
        variant="ghost"
        onPress={() => {
          chooseAudience('everyone');
          finish();
        }}
      />
    </Screen>
  );
}
