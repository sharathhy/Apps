import { Text } from '@wellness/ui';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { fetchServerData } from '@/features/account/api';
import { buildExport, collectDeviceData, saveExport } from '@/features/data/export';

import { ListRow } from './ListRow';

/** Settings rows for consent management, data export and deletion. */
export function DataControls() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<'idle' | 'busy' | 'done' | 'failed'>('idle');

  const exportData = async () => {
    setStatus('busy');
    try {
      const account = await fetchServerData();
      await saveExport(buildExport(collectDeviceData(), account));
      setStatus('done');
    } catch {
      setStatus('failed');
    }
  };

  return (
    <>
      <ListRow
        icon="shield"
        label={t('dataControls.consents')}
        onPress={() => router.push('/privacy/consents')}
      />
      <ListRow
        icon="download"
        label={status === 'busy' ? t('dataControls.exporting') : t('dataControls.export')}
        onPress={() => void exportData()}
      />
      {status === 'done' || status === 'failed' ? (
        <Text
          variant="footnote"
          tone={status === 'done' ? 'primary' : 'danger'}
          accessibilityLiveRegion="polite"
        >
          {status === 'done' ? t('dataControls.exported') : t('dataControls.exportFailed')}
        </Text>
      ) : null}
      <ListRow
        icon="error"
        label={t('dataControls.delete')}
        onPress={() => router.push('/privacy/delete')}
      />
    </>
  );
}
