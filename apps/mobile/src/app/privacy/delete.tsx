import { Button, Card, Icon, Screen, Text, useTheme } from '@wellness/ui';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { deleteAllData } from '@/features/data/deleteAll';

export default function DeleteDataScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const confirm = async () => {
    setBusy(true);
    setError(false);
    try {
      await deleteAllData();
      router.dismissAll();
      router.replace('/onboarding');
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen edgeTop={false}>
      <View className="items-center gap-3">
        <View className="rounded-full bg-danger-soft p-4">
          <Icon name="error" size={32} color={colors.danger} />
        </View>
        <Text variant="title1" className="text-center">
          {t('dataControls.deleteTitle')}
        </Text>
      </View>
      <Card className="gap-3">
        <Text>{t('dataControls.deleteMessage')}</Text>
        <Text tone="muted">{t('dataControls.deleteExportFirst')}</Text>
      </Card>
      {error ? (
        <Text tone="danger" accessibilityRole="alert">
          {t('dataControls.deleteFailed')}
        </Text>
      ) : null}
      <Button
        label={busy ? t('dataControls.deleting') : t('dataControls.deleteConfirm')}
        loading={busy}
        variant="danger"
        onPress={() => void confirm()}
      />
      <Button label={t('dataControls.cancel')} variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}
