import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { getPermission, requestPermission, type PermissionState } from './device';

/** The OS notification permission, refreshed when the app returns from device settings. */
export function usePermission() {
  const [state, setState] = useState<PermissionState>('undetermined');
  useEffect(() => {
    void getPermission().then(setState);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') void getPermission().then(setState);
    });
    return () => sub.remove();
  }, []);
  const request = useCallback(async () => {
    const next = await requestPermission();
    setState(next);
    return next;
  }, []);
  return { state, request };
}
