import { Button, Icon, Text, useTheme } from '@wellness/ui';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, View } from 'react-native';

import { appLockSupported, unlock } from './auth';
import { useAppLock } from './store';

/** Re-lock after the app has been in the background this long. */
export const RELOCK_AFTER_MS = 60_000;

/**
 * Covers the app until the person unlocks with their fingerprint, face or
 * device PIN, when app lock is on. Locks again after a minute away.
 */
export function AppLockGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const enabled = useAppLock((s) => s.enabled) && appLockSupported;
  const unlocked = useAppLock((s) => s.unlocked);
  const setUnlocked = useAppLock((s) => s.setUnlocked);
  const [failed, setFailed] = useState(false);
  const backgroundAt = useRef<number | null>(null);
  const prompted = useRef(false);
  const locked = enabled && !unlocked;

  const tryUnlock = useCallback(async () => {
    const ok = await unlock(t('appLock.prompt'));
    setFailed(!ok);
    if (ok) setUnlocked(true);
  }, [t, setUnlocked]);

  useEffect(() => {
    if (!enabled) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') backgroundAt.current = Date.now();
      if (
        state === 'active' &&
        backgroundAt.current &&
        Date.now() - backgroundAt.current > RELOCK_AFTER_MS
      ) {
        prompted.current = false;
        setUnlocked(false);
      }
    });
    return () => sub.remove();
  }, [enabled, setUnlocked]);

  // Show the system prompt once each time the app locks.
  useEffect(() => {
    if (!locked || prompted.current) return;
    prompted.current = true;
    const id = setTimeout(() => void tryUnlock(), 0);
    return () => {
      clearTimeout(id);
      prompted.current = false;
    };
  }, [locked, tryUnlock]);

  return (
    <>
      {children}
      {locked ? (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: colors.background,
          }}
          className="items-center justify-center gap-4 p-6"
          accessibilityViewIsModal
        >
          <Icon name="lock" size={48} color={colors.primary} />
          <Text variant="title2" className="text-center">
            {t('appLock.locked')}
          </Text>
          {failed ? (
            <Text tone="muted" className="text-center" accessibilityLiveRegion="polite">
              {t('appLock.tryAgain')}
            </Text>
          ) : null}
          <Button label={t('appLock.unlock')} onPress={() => void tryUnlock()} />
        </View>
      ) : null}
    </>
  );
}
