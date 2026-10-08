import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { isGranted, POLICY_VERSION, type ConsentCategory, type ConsentRecord } from './categories';

interface ConsentState {
  records: Partial<Record<ConsentCategory, ConsentRecord>>;
  /** Decisions not yet written to the server consent ledger. */
  pending: { category: ConsentCategory; record: ConsentRecord }[];
  decide: (category: ConsentCategory, granted: boolean, now?: Date) => void;
  isGranted: (category: ConsentCategory) => boolean;
  markSynced: (count: number) => void;
  reset: () => void;
}

/** Per-category consent, stored on device and mirrored to the server ledger when signed in. */
export const useConsent = create<ConsentState>()(
  persist(
    (set, get) => ({
      records: {},
      pending: [],
      decide: (category, granted, now = new Date()) => {
        const record = { granted, at: now.toISOString(), policyVersion: POLICY_VERSION };
        set((s) => ({
          records: { ...s.records, [category]: record },
          pending: [...s.pending, { category, record }],
        }));
      },
      isGranted: (category) => isGranted(get().records[category]),
      markSynced: (count) => set((s) => ({ pending: s.pending.slice(count) })),
      reset: () => set({ records: {}, pending: [] }),
    }),
    {
      name: 'consent-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ records, pending }) => ({ records, pending }),
      skipHydration: true,
    },
  ),
);
