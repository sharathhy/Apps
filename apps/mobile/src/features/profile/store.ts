import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ModuleId } from '@wellness/design-tokens';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { defaultTrackers, toggleTracker, type Audience } from './audience';

interface ProfileState {
  /** `null` until the user finishes the setup screen. */
  audience: Audience | null;
  trackers: ModuleId[];
  hydrated: boolean;
  chooseAudience: (audience: Audience) => void;
  toggleTracker: (id: ModuleId) => void;
  setTrackers: (trackers: ModuleId[]) => void;
  reset: () => void;
}

/**
 * The user's tracker choices. Stored only on this device (AsyncStorage,
 * which is localStorage on web) and never sent anywhere.
 */
export const useProfile = create<ProfileState>()(
  persist(
    (set) => ({
      audience: null,
      trackers: [],
      hydrated: false,
      chooseAudience: (audience) => set({ audience, trackers: defaultTrackers(audience) }),
      toggleTracker: (id) => set((s) => ({ trackers: toggleTracker(s.trackers, id) })),
      setTrackers: (trackers) => set({ trackers }),
      reset: () => set({ audience: null, trackers: [] }),
    }),
    {
      name: 'profile-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ audience, trackers }) => ({ audience, trackers }),
      // Rehydrated from the root layout so static web rendering never touches storage.
      skipHydration: true,
      onRehydrateStorage: () => () => useProfile.setState({ hydrated: true }),
    },
  ),
);
