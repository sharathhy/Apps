import { Screen } from '@wellness/ui';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { MedicalDisclaimer } from '@/components/MedicalDisclaimer';
import { SupportCard } from '@/features/mood/components/SupportCard';

/** Support lines, reachable at any time, for everyone. */
export default function SupportScreen() {
  const { t } = useTranslation();
  return (
    <Screen edgeTop={false}>
      <Stack.Screen options={{ headerTitle: t('support.title') }} />
      <SupportCard prominent />
      <MedicalDisclaimer />
    </Screen>
  );
}
