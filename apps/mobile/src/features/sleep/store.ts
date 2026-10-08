import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { SleepEntry } from './model';

interface SleepState {
  entries: SleepEntry[];
  /** Adds a night, replacing any entry already logged for the same morning. */
  save: (e: Omit<SleepEntry, 'id' | 'updatedAt'>, now?: Date) => SleepEntry;
  remove: (id: string) => void;
  reset: () => void;
}

export const useSleep = create<SleepState>()(
  persist(
    (set) => ({
      entries: [],
      save: (e, now = new Date()) => {
        const entry: SleepEntry = {
          ...e,
          note: e.note.trim().slice(0, 2000),
          id: randomUUID(),
          updatedAt: now.toISOString(),
        };
        set((s) => ({
          entries: [entry, ...s.entries.filter((x) => x.day !== e.day)].sort((a, b) =>
            a.day < b.day ? 1 : -1,
          ),
        }));
        return entry;
      },
      remove: (id) => set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),
      reset: () => set({ entries: [] }),
    }),
    {
      name: 'sleep-v1',
      storage: createJSONStorage(() => AsyncStorage),
      skipHydration: true,
      partialize: ({ entries }) => ({ entries }),
    },
  ),
);
