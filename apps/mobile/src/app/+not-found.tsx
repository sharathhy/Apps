import { Button, Card, EmptyState, Screen } from '@wellness/ui';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function NotFoundScreen() {
  const { t } = useTranslation();
  return (
    <Screen>
      <Card>
        <EmptyState icon="error" title={t('notFound.title')} />
        <Button label={t('notFound.back')} onPress={() => router.replace('/')} />
      </Card>
    </Screen>
  );
}
