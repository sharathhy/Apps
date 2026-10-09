import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { SyncedState } from './engine';

export type SyncStatus = 'idle' | 'syncing' | 'waiting' | 'otherAccount';

interface SyncState {
  /** The account this device's data belongs to. Another account's sign-in never receives it. */
  ownerId: string | null;
  /** Fingerprints of what each table looked like at the last sync (no copies of the data). */
  synced: SyncedState;
  lastSyncAt: string | null;
  // Not persisted:
  status: SyncStatus;
  /** Failed runs in a row; the next retry backs off by this much. */
  attempt: number;
  /** Changes saved on this device and not yet on the account. */
  pending: number;
  setTable: (table: string, synced: SyncedState[string]) => void;
  reset: () => void;
}

const initial = {
  ownerId: null as string | null,
  synced: {} as SyncedState,
  lastSyncAt: null as string | null,
  status: 'idle' as SyncStatus,
  attempt: 0,
  pending: 0,
};

export const useSync = create<SyncState>()(
  persist(
    (set) => ({
      ...initial,
      setTable: (table, synced) => set((s) => ({ synced: { ...s.synced, [table]: synced } })),
      reset: () => set({ ...initial }),
    }),
    {
      name: 'sync-v1',
      storage: createJSONStorage(() => AsyncStorage),
      skipHydration: true,
      partialize: ({ ownerId, synced, lastSyncAt }) => ({ ownerId, synced, lastSyncAt }),
    },
  ),
);
