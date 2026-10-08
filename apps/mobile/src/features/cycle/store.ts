import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { CycleDayLog, Period } from './model';

interface CycleState {
  /** Newest first. */
  periods: Period[];
  /** Daily logs by "YYYY-MM-DD". */
  logs: Record<string, CycleDayLog>;
  /** A neutral reminder two days before the estimated start. Off until turned on. */
  periodReminder: boolean;
  addPeriod: (start: string, now?: Date) => Period;
  setPeriodEnd: (id: string, end: string | null, now?: Date) => void;
  removePeriod: (id: string) => void;
  saveLog: (log: Omit<CycleDayLog, 'updatedAt'>, now?: Date) => void;
  setPeriodReminder: (on: boolean) => void;
  reset: () => void;
}

const sortPeriods = (periods: Period[]) =>
  [...periods].sort((a, b) => (a.start < b.start ? 1 : -1));

export const useCycle = create<CycleState>()(
  persist(
    (set) => ({
      periods: [],
      logs: {},
      periodReminder: false,
      addPeriod: (start, now = new Date()) => {
        const period: Period = { id: randomUUID(), start, end: null, updatedAt: now.toISOString() };
        set((s) => ({
          periods: sortPeriods([period, ...s.periods.filter((p) => p.start !== start)]),
        }));
        return period;
      },
      setPeriodEnd: (id, end, now = new Date()) =>
        set((s) => ({
          periods: s.periods.map((p) =>
            p.id === id && (end === null || end >= p.start)
              ? { ...p, end, updatedAt: now.toISOString() }
              : p,
          ),
        })),
      removePeriod: (id) => set((s) => ({ periods: s.periods.filter((p) => p.id !== id) })),
      saveLog: (log, now = new Date()) =>
        set((s) => {
          const logs = { ...s.logs };
          const empty = !log.flow && log.symptoms.length === 0 && !log.note.trim();
          if (empty) delete logs[log.day];
          else
            logs[log.day] = {
              ...log,
              note: log.note.trim().slice(0, 2000),
              updatedAt: now.toISOString(),
            };
          return { logs };
        }),
      setPeriodReminder: (periodReminder) => set({ periodReminder }),
      reset: () => set({ periods: [], logs: {}, periodReminder: false }),
    }),
    {
      name: 'cycle-v1',
      storage: createJSONStorage(() => AsyncStorage),
      skipHydration: true,
      partialize: ({ periods, logs, periodReminder }) => ({ periods, logs, periodReminder }),
    },
  ),
);
