import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * The few details some trackers need before they can work. Each tracker
 * moves its own value into its module store when it is built; until then
 * they live here.
 */
export interface SetupValues {
  /** Daily water goal in millilitres. */
  waterGoalMl: number | null;
  /** First day of the last period, "YYYY-MM-DD". */
  lastPeriodStart: string | null;
  /** Estimated due date, "YYYY-MM-DD". */
  dueDate: string | null;
}

interface RequirementsState extends SetupValues {
  /** When each in-app prompt was first shown. A notification is only ever sent after this. */
  promptSeenAt: Record<string, string>;
  /** Fire time of the last requirement notification, so there is at most one a week. */
  lastNoticeAt: string | null;
  setValue: <K extends keyof SetupValues>(key: K, value: SetupValues[K]) => void;
  markPromptSeen: (id: string, now?: Date) => void;
  setLastNoticeAt: (iso: string | null) => void;
  reset: () => void;
}

const initial = {
  waterGoalMl: null,
  lastPeriodStart: null,
  dueDate: null,
  promptSeenAt: {},
  lastNoticeAt: null,
};

export const useRequirements = create<RequirementsState>()(
  persist(
    (set) => ({
      ...initial,
      setValue: (key, value) => set({ [key]: value } as Partial<SetupValues>),
      markPromptSeen: (id, now = new Date()) =>
        set((s) =>
          s.promptSeenAt[id] ? s : { promptSeenAt: { ...s.promptSeenAt, [id]: now.toISOString() } },
        ),
      setLastNoticeAt: (lastNoticeAt) => set({ lastNoticeAt }),
      reset: () => set({ ...initial }),
    }),
    {
      name: 'requirements-v1',
      storage: createJSONStorage(() => AsyncStorage),
      skipHydration: true,
      partialize: ({ waterGoalMl, lastPeriodStart, dueDate, promptSeenAt, lastNoticeAt }) => ({
        waterGoalMl,
        lastPeriodStart,
        dueDate,
        promptSeenAt,
        lastNoticeAt,
      }),
    },
  ),
);
