import { Card, Screen, Text } from '@wellness/ui';
import { Redirect, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { MedicalDisclaimer } from '@/components/MedicalDisclaimer';
import { trackActivity } from '@/features/achievements/award';
import { legalDocs } from '@/features/legal/content.generated';
import { LegalDocument } from '@/features/legal/LegalDocument';

const titleKeys = {
  privacy: 'settings.privacy',
  terms: 'settings.terms',
  disclaimer: 'settings.disclaimer',
} as const;

type DocId = keyof typeof titleKeys;

/** Pre-renders one static page per document for the web export. */
export function generateStaticParams(): { doc: DocId }[] {
  return (Object.keys(titleKeys) as DocId[]).map((doc) => ({ doc }));
}

/** Legal drafts from docs/legal. They are marked for legal review and shown in English only. */
export default function LegalScreen() {
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (doc === 'privacy') void trackActivity('legal_read');
  }, [doc]);

  if (!doc || !(doc in titleKeys)) return <Redirect href="/settings" />;
  const id = doc as DocId;

  return (
    <Screen edgeTop={false}>
      <Stack.Screen options={{ headerTitle: t(titleKeys[id]) }} />
      {i18n.language !== 'en' ? (
        <Card tone="muted">
          <Text variant="footnote" tone="muted">
            {t('legal.englishOnly')}
          </Text>
        </Card>
      ) : null}
      <LegalDocument source={legalDocs[id]} />
      {id !== 'disclaimer' ? <MedicalDisclaimer /> : null}
    </Screen>
  );
}
