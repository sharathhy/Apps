import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface AppLockState {
  enabled: boolean;
  /** Unlocked for this run of the app. Never stored, so every cold start locks. */
  unlocked: boolean;
  setUnlocked: (unlocked: boolean) => void;
  setEnabled: (enabled: boolean) => void;
  reset: () => void;
}

export const useAppLock = create<AppLockState>()(
  persist(
    (set) => ({
      enabled: false,
      unlocked: false,
      setUnlocked: (unlocked) => set({ unlocked }),
      // Turning the lock on already asked for an unlock, so stay unlocked.
      setEnabled: (enabled) => set({ enabled, unlocked: enabled }),
      reset: () => set({ enabled: false }),
    }),
    {
      name: 'app-lock-v1',
      storage: createJSONStorage(() => AsyncStorage),
      skipHydration: true,
      partialize: ({ enabled }) => ({ enabled }),
    },
  ),
);
