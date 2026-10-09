import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { hospitalBagStarter, type KickSession, type PregnancySymptom } from './model';

export interface Appointment {
  id: string;
  title: string;
  /** ISO instant. */
  at: string;
  note: string;
  /** A private reminder the evening before (18:00 local). */
  remind: boolean;
}

export interface SymptomEntry {
  id: string;
  at: string;
  day: string;
  symptoms: PregnancySymptom[];
  note: string;
}

export interface WeightEntry {
  id: string;
  day: string;
  kg: number;
}

export interface BabyName {
  id: string;
  name: string;
  favorite: boolean;
}

export interface BagItem {
  id: string;
  /** Starter items are translated by key; items the person adds keep their own label. */
  key: (typeof hospitalBagStarter)[number] | null;
  label: string;
  done: boolean;
}

const starterBag = (): BagItem[] =>
  hospitalBagStarter.map((key) => ({ id: key, key, label: '', done: false }));

interface PregnancyState {
  /** "ended" hides pregnancy content and reminders until the person starts again. */
  status: 'active' | 'ended';
  appointments: Appointment[];
  symptoms: SymptomEntry[];
  weights: WeightEntry[];
  kicks: KickSession[];
  names: BabyName[];
  bag: BagItem[];
  setStatus: (status: 'active' | 'ended') => void;
  saveAppointment: (a: Omit<Appointment, 'id'> & { id?: string }) => void;
  removeAppointment: (id: string) => void;
  addSymptoms: (e: Omit<SymptomEntry, 'id'>) => SymptomEntry;
  removeSymptoms: (id: string) => void;
  saveWeight: (day: string, kg: number) => void;
  removeWeight: (id: string) => void;
  startKicks: (now?: Date) => KickSession;
  kick: (id: string) => void;
  endKicks: (id: string, now?: Date) => void;
  removeKicks: (id: string) => void;
  addName: (name: string) => void;
  toggleFavorite: (id: string) => void;
  removeName: (id: string) => void;
  addBagItem: (label: string) => void;
  toggleBagItem: (id: string) => void;
  removeBagItem: (id: string) => void;
  reset: () => void;
}

const initial = () => ({
  status: 'active' as const,
  appointments: [] as Appointment[],
  symptoms: [] as SymptomEntry[],
  weights: [] as WeightEntry[],
  kicks: [] as KickSession[],
  names: [] as BabyName[],
  bag: starterBag(),
});

const byAt = (a: { at: string }, b: { at: string }) => (a.at < b.at ? -1 : 1);

export const usePregnancy = create<PregnancyState>()(
  persist(
    (set) => ({
      ...initial(),
      setStatus: (status) => set({ status }),
      saveAppointment: ({ id, ...a }) =>
        set((s) => {
          const item: Appointment = {
            ...a,
            id: id ?? randomUUID(),
            title: a.title.trim().slice(0, 200),
            note: a.note.trim().slice(0, 2000),
          };
          return {
            appointments: [...s.appointments.filter((x) => x.id !== item.id), item].sort(byAt),
          };
        }),
      removeAppointment: (id) =>
        set((s) => ({ appointments: s.appointments.filter((a) => a.id !== id) })),
      addSymptoms: (e) => {
        const entry = { ...e, note: e.note.trim().slice(0, 2000), id: randomUUID() };
        set((s) => ({ symptoms: [entry, ...s.symptoms] }));
        return entry;
      },
      removeSymptoms: (id) => set((s) => ({ symptoms: s.symptoms.filter((e) => e.id !== id) })),
      saveWeight: (day, kg) =>
        set((s) => ({
          weights: [
            ...s.weights.filter((w) => w.day !== day),
            { id: randomUUID(), day, kg: Math.round(kg * 100) / 100 },
          ].sort((a, b) => (a.day < b.day ? -1 : 1)),
        })),
      removeWeight: (id) => set((s) => ({ weights: s.weights.filter((w) => w.id !== id) })),
      startKicks: (now = new Date()) => {
        const session: KickSession = {
          id: randomUUID(),
          startedAt: now.toISOString(),
          endedAt: null,
          count: 0,
        };
        set((s) => ({
          kicks: [session, ...s.kicks.filter((k) => k.endedAt || k.count > 0)],
        }));
        return session;
      },
      kick: (id) =>
        set((s) => ({
          kicks: s.kicks.map((k) =>
            k.id === id && !k.endedAt ? { ...k, count: Math.min(500, k.count + 1) } : k,
          ),
        })),
      endKicks: (id, now = new Date()) =>
        set((s) => ({
          kicks: s.kicks
            .map((k) => (k.id === id && !k.endedAt ? { ...k, endedAt: now.toISOString() } : k))
            .filter((k) => k.count > 0 || !k.endedAt),
        })),
      removeKicks: (id) => set((s) => ({ kicks: s.kicks.filter((k) => k.id !== id) })),
      addName: (name) =>
        set((s) => {
          const clean = name.trim().slice(0, 100);
          if (!clean || s.names.some((n) => n.name.toLowerCase() === clean.toLowerCase())) return s;
          return { names: [{ id: randomUUID(), name: clean, favorite: false }, ...s.names] };
        }),
      toggleFavorite: (id) =>
        set((s) => ({
          names: s.names.map((n) => (n.id === id ? { ...n, favorite: !n.favorite } : n)),
        })),
      removeName: (id) => set((s) => ({ names: s.names.filter((n) => n.id !== id) })),
      addBagItem: (label) =>
        set((s) => {
          const clean = label.trim().slice(0, 200);
          if (!clean) return s;
          return { bag: [...s.bag, { id: randomUUID(), key: null, label: clean, done: false }] };
        }),
      toggleBagItem: (id) =>
        set((s) => ({ bag: s.bag.map((b) => (b.id === id ? { ...b, done: !b.done } : b)) })),
      removeBagItem: (id) => set((s) => ({ bag: s.bag.filter((b) => b.id !== id) })),
      reset: () => set(initial()),
    }),
    {
      name: 'pregnancy-v1',
      storage: createJSONStorage(() => AsyncStorage),
      skipHydration: true,
      partialize: ({ status, appointments, symptoms, weights, kicks, names, bag }) => ({
        status,
        appointments,
        symptoms,
        weights,
        kicks,
        names,
        bag,
      }),
    },
  ),
);
