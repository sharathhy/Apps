import { Card, Screen, Text, useTheme, type ThemePreference } from '@wellness/ui';
import Constants from 'expo-constants';
import { getLocales } from 'expo-localization';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { AccountSection } from '@/components/AccountSection';
import { DataControls } from '@/components/DataControls';
import { InstallCard } from '@/components/InstallCard';
import { ListRow } from '@/components/ListRow';
import { audiences, useProfile, type Audience } from '@/features/profile';
import { TrackerToggles } from '@/features/profile/components/TrackerToggles';
import { MedicalDisclaimer } from '@/components/MedicalDisclaimer';
import { SegmentedControl } from '@/components/SegmentedControl';
import { supportedLanguages, type Language } from '@/i18n';
import { dateFormatPattern, regionDefaults } from '@/lib/region';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { preference, setPreference } = useTheme();
  const region = regionDefaults(getLocales()[0]?.regionCode);
  const audience = useProfile((s) => s.audience) ?? 'everyone';
  const chooseAudience = useProfile((s) => s.chooseAudience);
  const setLanguage = useProfile((s) => s.setLanguage);
  const language = useProfile((s) => s.language);

  return (
    <Screen>
      <Text variant="title1">{t('settings.title')}</Text>

      <InstallCard />

      <Section title={t('myTrackers.title')}>
        <Text variant="footnote" tone="muted">
          {t('myTrackers.setupFor')}
        </Text>
        <SegmentedControl<Audience>
          label={t('myTrackers.setupFor')}
          value={audience}
          onChange={chooseAudience}
          options={audiences.map((value) => ({
            value,
            label: t(`setup.audience.${value}.short`),
          }))}
        />
        <TrackerToggles />
      </Section>

      <Section title={t('settings.appearance')}>
        <SegmentedControl<ThemePreference>
          label={t('settings.appearance')}
          value={preference}
          onChange={setPreference}
          options={(['system', 'light', 'dark'] as const).map((value) => ({
            value,
            label: t(`settings.theme.${value}`),
          }))}
        />
      </Section>

      <Section title={t('settings.language')}>
        <SegmentedControl<Language>
          label={t('settings.language')}
          value={language ?? (i18n.resolvedLanguage as Language) ?? 'en'}
          onChange={setLanguage}
          options={supportedLanguages.map((value) => ({
            value,
            label: t(`settings.languages.${value}`),
          }))}
        />
      </Section>

      <Section title={t('settings.region')}>
        <Text>
          {t('settings.regionValue', {
            region: region.region,
            units: t(`settings.units.${region.units}`),
            dateFormat: dateFormatPattern(region.dateOrder),
          })}
        </Text>
      </Section>

      <Section title={t('account.title')}>
        <AccountSection />
      </Section>

      <Section title={t('dataControls.title')}>
        <DataControls />
      </Section>

      <Section title={t('settings.legal')}>
        <ListRow
          icon="shield"
          label={t('settings.privacy')}
          onPress={() => router.push('/legal/privacy')}
        />
        <ListRow
          icon="info"
          label={t('settings.terms')}
          onPress={() => router.push('/legal/terms')}
        />
        <ListRow
          icon="info"
          label={t('settings.disclaimer')}
          onPress={() => router.push('/legal/disclaimer')}
        />
      </Section>

      <MedicalDisclaimer />
      <Text variant="footnote" tone="muted" className="text-center">
        {t('settings.version', { version: Constants.expoConfig?.version ?? '0.0.0' })}
      </Text>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      <Text variant="label" tone="muted" accessibilityRole="header">
        {title}
      </Text>
      <Card className="gap-1">{children}</Card>
    </View>
  );
}
