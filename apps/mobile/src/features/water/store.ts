import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { MAX_ENTRY_ML, type DrinkType, type WaterEntry } from './model';

interface WaterState {
  entries: WaterEntry[];
  /** Smart reminders: spread across waking hours, paused once the day's goal is met. */
  smartReminders: boolean;
  /** Waking window for smart reminders, local "HH:MM". */
  activeStart: string;
  activeEnd: string;
  /** ISO instant a snoozed smart reminder comes back. */
  smartSnoozedUntil: string | null;
  add: (entry: { amountMl: number; drink: DrinkType; at: Date; day: string }) => WaterEntry;
  update: (id: string, patch: Partial<Pick<WaterEntry, 'amountMl' | 'drink'>>, now?: Date) => void;
  remove: (id: string) => WaterEntry | undefined;
  restore: (entry: WaterEntry) => void;
  setSmartReminders: (on: boolean) => void;
  setActiveHours: (start: string, end: string) => void;
  snoozeSmart: (until: Date) => void;
  reset: () => void;
}

const clampAmount = (ml: number) => Math.min(MAX_ENTRY_ML, Math.max(1, Math.round(ml)));

const initial = {
  entries: [] as WaterEntry[],
  smartReminders: false,
  activeStart: '09:00',
  activeEnd: '21:00',
  smartSnoozedUntil: null as string | null,
};

export const useWater = create<WaterState>()(
  persist(
    (set, get) => ({
      ...initial,
      add: ({ amountMl, drink, at, day }) => {
        const entry: WaterEntry = {
          id: randomUUID(),
          at: at.toISOString(),
          day,
          amountMl: clampAmount(amountMl),
          drink,
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({ entries: [entry, ...s.entries] }));
        return entry;
      },
      update: (id, patch, now = new Date()) =>
        set((s) => ({
          entries: s.entries.map((e) =>
            e.id === id
              ? {
                  ...e,
                  ...patch,
                  amountMl: patch.amountMl ? clampAmount(patch.amountMl) : e.amountMl,
                  updatedAt: now.toISOString(),
                }
              : e,
          ),
        })),
      remove: (id) => {
        const entry = get().entries.find((e) => e.id === id);
        set((s) => ({ entries: s.entries.filter((e) => e.id !== id) }));
        return entry;
      },
      restore: (entry) =>
        set((s) =>
          s.entries.some((e) => e.id === entry.id)
            ? s
            : { entries: [entry, ...s.entries].sort((a, b) => (a.at < b.at ? 1 : -1)) },
        ),
      setSmartReminders: (smartReminders) => set({ smartReminders }),
      setActiveHours: (activeStart, activeEnd) => set({ activeStart, activeEnd }),
      snoozeSmart: (until) => set({ smartSnoozedUntil: until.toISOString() }),
      reset: () => set({ ...initial }),
    }),
    {
      name: 'water-v1',
      storage: createJSONStorage(() => AsyncStorage),
      skipHydration: true,
      partialize: ({ entries, smartReminders, activeStart, activeEnd, smartSnoozedUntil }) => ({
        entries,
        smartReminders,
        activeStart,
        activeEnd,
        smartSnoozedUntil,
      }),
    },
  ),
);
