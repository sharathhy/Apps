import { Text } from '@wellness/ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SwitchRow } from '@/components/SwitchRow';

import { appLockSupported, canUseAppLock, unlock } from './auth';
import { useAppLock } from './store';

/** Settings switch for app lock. Turning it on asks to unlock once, to be sure it works. */
export function AppLockRow() {
  const { t } = useTranslation();
  const enabled = useAppLock((s) => s.enabled);
  const setEnabled = useAppLock((s) => s.setEnabled);
  const [note, setNote] = useState<string | null>(null);
  if (!appLockSupported) return null;

  const change = async (on: boolean) => {
    setNote(null);
    if (!on) return setEnabled(false);
    if (!(await canUseAppLock())) return setNote(t('appLock.unavailable'));
    if (await unlock(t('appLock.prompt'))) setEnabled(true);
  };

  return (
    <>
      <SwitchRow
        icon="lock"
        title={t('appLock.title')}
        description={t('appLock.description')}
        value={enabled}
        onChange={(on) => void change(on)}
      />
      {note ? (
        <Text variant="footnote" tone="danger" accessibilityLiveRegion="polite">
          {note}
        </Text>
      ) : null}
    </>
  );
}
