import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ModuleId } from '@wellness/design-tokens';
import { randomUUID } from 'expo-crypto';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { NotificationType } from './types';

/** One entry in the notification center. Text is stored as i18n keys so it follows the language. */
export interface InboxItem {
  id: string;
  type: NotificationType;
  module: ModuleId | null;
  titleKey: string;
  bodyKey: string;
  params?: Record<string, string | number>;
  /** Where tapping the item goes, e.g. "/water". */
  href?: string;
  reminderId?: string;
  /** OS notification id, so a delivered notification is added only once. */
  sourceId?: string;
  createdAt: string;
  readAt: string | null;
}

export const INBOX_LIMIT = 100;

interface InboxState {
  items: InboxItem[];
  /** Notifications shown per local date, for the daily limit. Pruned to the last two weeks. */
  shownPerDay: Record<string, number>;
  add: (item: Omit<InboxItem, 'id' | 'createdAt' | 'readAt'>, now?: Date) => InboxItem;
  markRead: (id: string, now?: Date) => void;
  markAllRead: (now?: Date) => void;
  remove: (id: string) => void;
  countShown: (day: string) => void;
  reset: () => void;
}

export const useInbox = create<InboxState>()(
  persist(
    (set, get) => ({
      items: [],
      shownPerDay: {},
      add: (item, now = new Date()) => {
        const duplicate = item.sourceId && get().items.find((i) => i.sourceId === item.sourceId);
        if (duplicate) return duplicate;
        const entry: InboxItem = {
          ...item,
          id: randomUUID(),
          createdAt: now.toISOString(),
          readAt: null,
        };
        set((s) => ({ items: [entry, ...s.items].slice(0, INBOX_LIMIT) }));
        return entry;
      },
      markRead: (id, now = new Date()) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id && !i.readAt ? { ...i, readAt: now.toISOString() } : i,
          ),
        })),
      markAllRead: (now = new Date()) =>
        set((s) => ({
          items: s.items.map((i) => (i.readAt ? i : { ...i, readAt: now.toISOString() })),
        })),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      countShown: (day) =>
        set((s) => {
          const recent = Object.entries(s.shownPerDay)
            .sort(([a], [b]) => (a < b ? 1 : -1))
            .slice(0, 13);
          const next = Object.fromEntries(recent);
          next[day] = (s.shownPerDay[day] ?? 0) + 1;
          return { shownPerDay: next };
        }),
      reset: () => set({ items: [], shownPerDay: {} }),
    }),
    {
      name: 'notification-inbox-v1',
      storage: createJSONStorage(() => AsyncStorage),
      skipHydration: true,
      partialize: ({ items, shownPerDay }) => ({ items, shownPerDay }),
    },
  ),
);

export const unreadCount = (items: InboxItem[]) => items.filter((i) => !i.readAt).length;
