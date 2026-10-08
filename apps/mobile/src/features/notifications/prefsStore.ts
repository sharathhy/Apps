import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ModuleId } from '@wellness/design-tokens';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  clampDailyLimit,
  defaultNotificationPreferences,
  type NotificationPreferences,
  type notificationTypes,
} from './types';

type ToggleableType = (typeof notificationTypes)[number];

interface PrefsState extends NotificationPreferences {
  setEnabled: (enabled: boolean) => void;
  setType: (type: ToggleableType, on: boolean) => void;
  setModule: (module: ModuleId, on: boolean) => void;
  setQuietHours: (start: string, end: string) => void;
  setDailyLimit: (limit: number) => void;
  setLockScreenPrivate: (on: boolean) => void;
  reset: () => void;
}

export const useNotificationPrefs = create<PrefsState>()(
  persist(
    (set) => ({
      ...defaultNotificationPreferences,
      setEnabled: (enabled) => set({ enabled }),
      setType: (type, on) => set((s) => ({ types: { ...s.types, [type]: on } })),
      setModule: (module, on) => set((s) => ({ modules: { ...s.modules, [module]: on } })),
      setQuietHours: (quietStart, quietEnd) => set({ quietStart, quietEnd }),
      setDailyLimit: (limit) => set({ dailyLimit: clampDailyLimit(limit) }),
      setLockScreenPrivate: (lockScreenPrivate) => set({ lockScreenPrivate }),
      reset: () => set({ ...defaultNotificationPreferences }),
    }),
    {
      name: 'notification-prefs-v1',
      storage: createJSONStorage(() => AsyncStorage),
      skipHydration: true,
      partialize: (s) => ({
        enabled: s.enabled,
        types: s.types,
        modules: s.modules,
        quietStart: s.quietStart,
        quietEnd: s.quietEnd,
        dailyLimit: s.dailyLimit,
        lockScreenPrivate: s.lockScreenPrivate,
      }),
    },
  ),
);
