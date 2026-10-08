import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ModuleId } from '@wellness/design-tokens';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { ActivityEvent } from './catalog';
import { emptySummary, type ActivitySummary } from './engine';

export interface EarnedAchievement {
  id: string;
  earnedAt: string;
  /** Set once a notification has been sent, so each achievement notifies at most once. */
  notifiedAt: string | null;
}

/** How many days of history to keep for streaks and day counts. */
const KEEP_DAYS = 120;

interface AchievementsState {
  activity: ActivitySummary;
  earned: EarnedAchievement[];
  record: (event: ActivityEvent, day: string, module?: ModuleId | null) => void;
  markEarned: (ids: string[], now?: Date) => void;
  markNotified: (id: string, now?: Date) => void;
  /** Merges achievements restored from the account. */
  mergeEarned: (items: EarnedAchievement[]) => void;
  reset: () => void;
}

/** Events that count as "logging something" for streaks and the explorer badge. */
const loggingEvents = new Set<ActivityEvent>([
  'log_entry',
  'water_goal_met',
  'mood_check_in',
  'journal_entry',
  'breathing_session',
  'sleep_logged',
  'period_logged',
  'kick_session',
  'meal_logged',
]);

const keepRecent = (days: string[]) => [...new Set(days)].sort().slice(-KEEP_DAYS);

export function recordActivity(
  summary: ActivitySummary,
  event: ActivityEvent,
  day: string,
  module?: ModuleId | null,
): ActivitySummary {
  const logging = loggingEvents.has(event);
  return {
    counts: { ...summary.counts, [event]: (summary.counts[event] ?? 0) + 1 },
    eventDays: {
      ...summary.eventDays,
      [event]: keepRecent([...(summary.eventDays[event] ?? []), day]),
    },
    logDays: logging ? keepRecent([...summary.logDays, day]) : summary.logDays,
    modulesUsed:
      logging && module && !summary.modulesUsed.includes(module)
        ? [...summary.modulesUsed, module]
        : summary.modulesUsed,
  };
}

export const useAchievements = create<AchievementsState>()(
  persist(
    (set) => ({
      activity: emptySummary,
      earned: [],
      record: (event, day, module) =>
        set((s) => ({ activity: recordActivity(s.activity, event, day, module) })),
      markEarned: (ids, now = new Date()) =>
        set((s) => {
          const have = new Set(s.earned.map((e) => e.id));
          const fresh = ids
            .filter((id) => !have.has(id))
            .map((id) => ({ id, earnedAt: now.toISOString(), notifiedAt: null }));
          return { earned: [...s.earned, ...fresh] };
        }),
      markNotified: (id, now = new Date()) =>
        set((s) => ({
          earned: s.earned.map((e) =>
            e.id === id && !e.notifiedAt ? { ...e, notifiedAt: now.toISOString() } : e,
          ),
        })),
      mergeEarned: (items) =>
        set((s) => {
          const byId = new Map(s.earned.map((e) => [e.id, e]));
          for (const item of items) if (!byId.has(item.id)) byId.set(item.id, item);
          return { earned: [...byId.values()] };
        }),
      reset: () => set({ activity: emptySummary, earned: [] }),
    }),
    {
      name: 'achievements-v1',
      storage: createJSONStorage(() => AsyncStorage),
      skipHydration: true,
      partialize: ({ activity, earned }) => ({ activity, earned }),
    },
  ),
);
