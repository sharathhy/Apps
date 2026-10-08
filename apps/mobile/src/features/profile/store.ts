import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ModuleId } from '@wellness/design-tokens';
import type { ThemePreference } from '@wellness/ui';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Language } from '@/i18n';

import { availableTrackers, defaultTrackers, toggleTracker, type Audience } from './audience';

interface ProfileState {
  /** `null` until the user finishes the setup screen. */
  audience: Audience | null;
  trackers: ModuleId[];
  /** `null` means follow the device language. */
  language: Language | null;
  theme: ThemePreference;
  hydrated: boolean;
  chooseAudience: (audience: Audience) => void;
  toggleTracker: (id: ModuleId) => void;
  setLanguage: (language: Language) => void;
  setTheme: (theme: ThemePreference) => void;
  reset: () => void;
}

/** Drops trackers the audience may not use (e.g. cycle for men), whatever was stored. */
export function sanitizeTrackers(audience: Audience | null, trackers: ModuleId[]): ModuleId[] {
  if (!audience) return [];
  const allowed = new Set(availableTrackers(audience));
  return trackers.filter((id) => allowed.has(id));
}

/**
 * The user's setup choices. Stored only on this device (AsyncStorage,
 * which is localStorage on web) and never sent anywhere.
 */
export const useProfile = create<ProfileState>()(
  persist(
    (set) => ({
      audience: null,
      trackers: [],
      language: null,
      theme: 'system',
      hydrated: false,
      chooseAudience: (audience) => set({ audience, trackers: defaultTrackers(audience) }),
      toggleTracker: (id) =>
        set((s) => ({ trackers: toggleTracker(s.trackers, id, s.audience ?? 'everyone') })),
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
      reset: () => set({ audience: null, trackers: [], language: null, theme: 'system' }),
    }),
    {
      name: 'profile-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ audience, trackers, language, theme }) => ({
        audience,
        trackers,
        language,
        theme,
      }),
      merge: (persisted, current) => {
        const stored = (persisted ?? {}) as Partial<ProfileState>;
        const merged = { ...current, ...stored };
        return { ...merged, trackers: sanitizeTrackers(merged.audience, merged.trackers) };
      },
      // Rehydrated from the root layout so static web rendering never touches storage.
      skipHydration: true,
      onRehydrateStorage: () => () => useProfile.setState({ hydrated: true }),
    },
  ),
);
