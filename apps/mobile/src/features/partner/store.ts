import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { ShareScope } from './model';

interface PartnerState {
  /** What the owner chose to share with new invites. */
  scopes: ShareScope[];
  /** Hash of the last summary uploaded, so unchanged data isn't sent again. */
  lastPublished: string | null;
  /** The partner side: get a notification when an update is shared. */
  notifyMe: boolean;
  setScopes: (scopes: ShareScope[]) => void;
  setLastPublished: (hash: string | null) => void;
  setNotifyMe: (on: boolean) => void;
  reset: () => void;
}

export const usePartner = create<PartnerState>()(
  persist(
    (set) => ({
      scopes: ['week', 'appointments'],
      lastPublished: null,
      notifyMe: false,
      setScopes: (scopes) => set({ scopes }),
      setLastPublished: (lastPublished) => set({ lastPublished }),
      setNotifyMe: (notifyMe) => set({ notifyMe }),
      reset: () => set({ scopes: ['week', 'appointments'], lastPublished: null, notifyMe: false }),
    }),
    {
      name: 'partner-v1',
      storage: createJSONStorage(() => AsyncStorage),
      skipHydration: true,
      partialize: ({ scopes, lastPublished, notifyMe }) => ({ scopes, lastPublished, notifyMe }),
    },
  ),
);
