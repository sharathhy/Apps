import { Card, Screen, Text } from '@wellness/ui';
import { Redirect, Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { MedicalDisclaimer } from '@/components/MedicalDisclaimer';

const docs = {
  privacy: { titleKey: 'settings.privacy', bodyKey: 'legal.privacyIntro' },
  terms: { titleKey: 'settings.terms', bodyKey: 'legal.termsIntro' },
  disclaimer: { titleKey: 'settings.disclaimer', bodyKey: 'disclaimer.text' },
} as const;

type DocId = keyof typeof docs;

/** Placeholder legal screens. Final drafts (marked for legal review) arrive in Phase 1. */
export default function LegalScreen() {
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const { t } = useTranslation();

  if (!doc || !(doc in docs)) return <Redirect href="/settings" />;
  const { titleKey, bodyKey } = docs[doc as DocId];

  return (
    <Screen edgeTop={false}>
      <Stack.Screen options={{ headerTitle: t(titleKey) }} />
      <Text variant="title1">{t(titleKey)}</Text>
      <Card tone="muted">
        <Text variant="footnote" tone="muted">
          {t('legal.draftNotice')}
        </Text>
      </Card>
      <Text variant="bodyLarge">{t(bodyKey)}</Text>
      {doc !== 'disclaimer' ? <MedicalDisclaimer /> : null}
    </Screen>
  );
}
