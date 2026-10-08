import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ModuleId } from '@wellness/design-tokens';
import { randomUUID } from 'expo-crypto';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { defaultReminderTimes, reminderTemplates, type Reminder } from './reminders';

export type ReminderDraft = Pick<Reminder, 'module' | 'times' | 'weekdays'> &
  Partial<Pick<Reminder, 'kind' | 'templateKey' | 'enabled'>>;

interface RemindersState {
  reminders: Reminder[];
  add: (draft: ReminderDraft, timezone: string, now?: Date) => Reminder;
  update: (id: string, patch: Partial<Omit<Reminder, 'id'>>, now?: Date) => void;
  remove: (id: string) => void;
  snooze: (id: string, until: Date, now?: Date) => void;
  /** Replaces everything, e.g. after restoring from the account on a new install. */
  replaceAll: (reminders: Reminder[]) => void;
  reset: () => void;
}

export function newReminder(draft: ReminderDraft, timezone: string, now = new Date()): Reminder {
  return {
    id: randomUUID(),
    kind: draft.kind ?? 'scheduled',
    templateKey: draft.templateKey ?? (draft.module ? reminderTemplates[draft.module] : 'general'),
    module: draft.module,
    times: [...new Set(draft.times)].sort(),
    weekdays: [...new Set(draft.weekdays)].sort(),
    timezone,
    enabled: draft.enabled ?? true,
    snoozedUntil: null,
    updatedAt: now.toISOString(),
  };
}

export function suggestedReminder(module: ModuleId): ReminderDraft {
  return { module, times: defaultReminderTimes[module], weekdays: [] };
}

export const useReminders = create<RemindersState>()(
  persist(
    (set) => ({
      reminders: [],
      add: (draft, timezone, now) => {
        const reminder = newReminder(draft, timezone, now);
        set((s) => ({ reminders: [...s.reminders, reminder] }));
        return reminder;
      },
      update: (id, patch, now = new Date()) =>
        set((s) => ({
          reminders: s.reminders.map((r) =>
            r.id === id
              ? {
                  ...r,
                  ...patch,
                  times: patch.times ? [...new Set(patch.times)].sort() : r.times,
                  weekdays: patch.weekdays ? [...new Set(patch.weekdays)].sort() : r.weekdays,
                  updatedAt: now.toISOString(),
                }
              : r,
          ),
        })),
      remove: (id) => set((s) => ({ reminders: s.reminders.filter((r) => r.id !== id) })),
      snooze: (id, until, now = new Date()) =>
        set((s) => ({
          reminders: s.reminders.map((r) =>
            r.id === id
              ? { ...r, snoozedUntil: until.toISOString(), updatedAt: now.toISOString() }
              : r,
          ),
        })),
      replaceAll: (reminders) => set({ reminders }),
      reset: () => set({ reminders: [] }),
    }),
    {
      name: 'reminders-v1',
      storage: createJSONStorage(() => AsyncStorage),
      skipHydration: true,
      partialize: ({ reminders }) => ({ reminders }),
    },
  ),
);
