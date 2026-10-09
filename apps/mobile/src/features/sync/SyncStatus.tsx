import { Button, Text } from '@wellness/ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useSession } from '@/features/account/session';
import { formatDate } from '@/lib/region';
import { isBackendConfigured } from '@/lib/supabase';
import { useRegion } from '@/lib/useRegion';

import { startFreshOnDevice, syncNow } from './service';
import { useSync } from './store';

/** Where the person's entries are: on this device only, waiting to sync, or synced. */
export function SyncStatus() {
  const { t, i18n } = useTranslation();
  const { dateOrder } = useRegion();
  const session = useSession((s) => s.session);
  const { status, pending, lastSyncAt } = useSync();
  const [confirm, setConfirm] = useState(false);

  if (!isBackendConfigured) return null;
  if (!session) {
    return (
      <Text variant="footnote" tone="muted">
        {t('sync.signedOut')}
      </Text>
    );
  }
  if (status === 'otherAccount') {
    return (
      <View className="gap-2">
        <Text>{t('sync.otherAccount')}</Text>
        {confirm ? (
          <>
            <Text variant="footnote" tone="muted">
              {t('sync.startFreshConfirm')}
            </Text>
            <Button variant="danger" label={t('sync.startFreshYes')} onPress={startFreshOnDevice} />
            <Button
              variant="secondary"
              label={t('dataControls.cancel')}
              onPress={() => setConfirm(false)}
            />
          </>
        ) : (
          <Button
            variant="secondary"
            label={t('sync.startFresh')}
            onPress={() => setConfirm(true)}
          />
        )}
      </View>
    );
  }

  const last = lastSyncAt ? new Date(lastSyncAt) : null;
  const when = last
    ? `${formatDate(last, dateOrder)}, ${last.toLocaleTimeString(i18n.language, { hour: 'numeric', minute: '2-digit' })}`
    : null;
  const message =
    status === 'syncing'
      ? t('sync.syncing')
      : pending > 0
        ? t(status === 'waiting' ? 'sync.waiting' : 'sync.pending', { count: pending })
        : when
          ? t('sync.synced', { time: when })
          : t('sync.never');

  return (
    <View className="gap-2">
      <Text accessibilityLiveRegion="polite">{message}</Text>
      <Text variant="footnote" tone="muted">
        {t('sync.consentNote')}
      </Text>
      <Button
        variant="secondary"
        label={t('sync.now')}
        disabled={status === 'syncing'}
        onPress={syncNow}
      />
    </View>
  );
}
