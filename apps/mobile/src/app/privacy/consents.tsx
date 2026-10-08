import { Card, Screen, Text } from '@wellness/ui';
import { useTranslation } from 'react-i18next';

import { consentCategoriesFor } from '@/features/consent/categories';
import { ConsentList } from '@/features/consent/ConsentList';
import { availableTrackers, useProfile } from '@/features/profile';

export default function ConsentsScreen() {
  const { t } = useTranslation();
  const audience = useProfile((s) => s.audience) ?? 'everyone';
  return (
    <Screen edgeTop={false}>
      <Text variant="title1">{t('dataControls.consents')}</Text>
      <Text tone="muted">{t('onboarding.consent.subtitle')}</Text>
      <Card>
        <ConsentList categories={consentCategoriesFor(availableTrackers(audience))} />
      </Card>
    </Screen>
  );
}
