import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  MAX_JOURNAL_LENGTH,
  MAX_NOTE_LENGTH,
  type BreathingPatternId,
  type BreathingSession,
  type JournalEntry,
  type MoodEntry,
  type MoodLevel,
  type MoodTag,
} from './model';

interface MoodState {
  entries: MoodEntry[];
  journal: JournalEntry[];
  breathing: BreathingSession[];
  addEntry: (e: {
    mood: MoodLevel;
    tags: MoodTag[];
    note: string;
    at: Date;
    day: string;
  }) => MoodEntry;
  removeEntry: (id: string) => void;
  saveJournal: (e: {
    id?: string;
    body: string;
    promptKey: string | null;
    at: Date;
    day: string;
  }) => JournalEntry;
  removeJournal: (id: string) => void;
  addBreathing: (
    pattern: BreathingPatternId,
    durationSeconds: number,
    at: Date,
  ) => BreathingSession;
  reset: () => void;
}

const initial = {
  entries: [] as MoodEntry[],
  journal: [] as JournalEntry[],
  breathing: [] as BreathingSession[],
};

export const useMood = create<MoodState>()(
  persist(
    (set, get) => ({
      ...initial,
      addEntry: ({ mood, tags, note, at, day }) => {
        const entry: MoodEntry = {
          id: randomUUID(),
          at: at.toISOString(),
          day,
          mood,
          tags: [...new Set(tags)],
          note: note.trim().slice(0, MAX_NOTE_LENGTH),
          updatedAt: at.toISOString(),
        };
        set((s) => ({ entries: [entry, ...s.entries] }));
        return entry;
      },
      removeEntry: (id) => set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),
      saveJournal: ({ id, body, promptKey, at, day }) => {
        const text = body.slice(0, MAX_JOURNAL_LENGTH);
        const existing = id ? get().journal.find((j) => j.id === id) : undefined;
        if (existing) {
          const updated = { ...existing, body: text, updatedAt: at.toISOString() };
          set((s) => ({ journal: s.journal.map((j) => (j.id === id ? updated : j)) }));
          return updated;
        }
        const entry: JournalEntry = {
          id: randomUUID(),
          createdAt: at.toISOString(),
          day,
          promptKey,
          body: text,
          updatedAt: at.toISOString(),
        };
        set((s) => ({ journal: [entry, ...s.journal] }));
        return entry;
      },
      removeJournal: (id) => set((s) => ({ journal: s.journal.filter((j) => j.id !== id) })),
      addBreathing: (pattern, durationSeconds, at) => {
        const session: BreathingSession = {
          id: randomUUID(),
          completedAt: at.toISOString(),
          pattern,
          durationSeconds: Math.round(durationSeconds),
        };
        set((s) => ({ breathing: [session, ...s.breathing] }));
        return session;
      },
      reset: () => set({ ...initial }),
    }),
    {
      name: 'mood-v1',
      storage: createJSONStorage(() => AsyncStorage),
      skipHydration: true,
      partialize: ({ entries, journal, breathing }) => ({ entries, journal, breathing }),
    },
  ),
);
