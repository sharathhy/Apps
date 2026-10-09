import { AppState, Platform } from 'react-native';

import { useSession } from '@/features/account/session';
import { useConsent } from '@/features/consent/store';
import { useCycle } from '@/features/cycle/store';
import { useMood } from '@/features/mood/store';
import { useNutrition } from '@/features/nutrition/store';
import { usePregnancy } from '@/features/pregnancy/store';
import { useRequirements } from '@/features/requirements/store';
import { useSleep } from '@/features/sleep/store';
import { useWater } from '@/features/water/store';
import { supabase } from '@/lib/supabase';

import { syncTables, type SyncTableDef } from './adapters';
import { backoffMs, pendingCount, syncTable, type Remote } from './engine';
import { supabaseRemote } from './remote';
import { useSync } from './store';

/** Stores whose changes are synced. Changes are batched for a few seconds. */
const watchedStores = [
  useWater,
  useMood,
  useSleep,
  useCycle,
  usePregnancy,
  useNutrition,
  useRequirements,
];
const DEBOUNCE_MS = 3000;

/** Runs a sync straight away (the Settings "Sync now" button). Set while the service runs. */
let trigger: (() => void) | null = null;
export const syncNow = () => trigger?.();

/** True while sync itself writes to the stores, so its own writes don't start another run. */
let applying = false;

const activeTables = (userId: string): SyncTableDef[] => {
  const consent = useConsent.getState();
  return syncTables(userId).filter((t) => consent.isGranted(t.module) && (t.ready?.() ?? true));
};

/** Recounts changes not yet on the account. */
export function refreshPending(userId: string | null): void {
  const { synced, ownerId } = useSync.getState();
  if (!userId || (ownerId && ownerId !== userId)) {
    useSync.setState({ pending: 0 });
    return;
  }
  const pending = activeTables(userId).reduce(
    (sum, t) => sum + pendingCount(t, userId, synced[t.table] ?? {}),
    0,
  );
  useSync.setState({ pending });
}

/**
 * Syncs every table the person has agreed to keep on their account. Stops at
 * the first failure; tables already done keep their progress.
 */
export async function syncAll(remote: Remote, userId: string, now = new Date()): Promise<void> {
  const state = useSync.getState();
  if (state.ownerId && state.ownerId !== userId) {
    useSync.setState({ status: 'otherAccount', pending: 0 });
    return;
  }
  if (!state.ownerId) useSync.setState({ ownerId: userId });
  useSync.setState({ status: 'syncing' });
  // Re-check readiness per table: the pregnancy row may arrive just before its appointments.
  for (const table of syncTables(userId)) {
    if (!useConsent.getState().isGranted(table.module) || !(table.ready?.() ?? true)) continue;
    const quiet: SyncTableDef = {
      ...table,
      replace: (records) => {
        applying = true;
        try {
          table.replace(records);
        } finally {
          applying = false;
        }
      },
    };
    const before = useSync.getState().synced[table.table] ?? {};
    const { synced } = await syncTable(quiet, remote, userId, before, now);
    useSync.getState().setTable(table.table, synced);
  }
  useSync.setState({ status: 'idle', attempt: 0, lastSyncAt: now.toISOString() });
  refreshPending(userId);
}

/**
 * For a device holding another account's data: removes the synced trackers'
 * entries from this device only (the other account keeps its copy), so the
 * signed-in account can sync here.
 */
export function startFreshOnDevice(): void {
  for (const store of watchedStores) (store.getState() as { reset: () => void }).reset();
  useSync.getState().reset();
  syncNow();
}

/**
 * Keeps the account in step while the app runs: at start, after sign-in,
 * when the app comes back to the foreground or the connection returns, and a
 * few seconds after any change. Failures retry with backoff. Returns a stop
 * function.
 */
export function startSync(): () => void {
  if (!supabase) return () => undefined;
  const remote = supabaseRemote(supabase);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running = false;
  let again = false;
  let stopped = false;

  const userId = () => useSession.getState().session?.user.id ?? null;

  const run = async () => {
    const id = userId();
    if (stopped || !id) return;
    if (running) {
      again = true;
      return;
    }
    running = true;
    clearTimeout(timer);
    try {
      await syncAll(remote, id);
    } catch {
      const attempt = useSync.getState().attempt + 1;
      useSync.setState({ status: 'waiting', attempt });
      refreshPending(id);
      timer = setTimeout(() => void run(), backoffMs(attempt));
    } finally {
      running = false;
    }
    if (again) {
      again = false;
      schedule(0);
    }
  };

  const schedule = (delay = DEBOUNCE_MS) => {
    clearTimeout(timer);
    timer = setTimeout(() => void run(), delay);
  };

  const onLocalChange = () => {
    if (applying) return;
    refreshPending(userId());
    if (running) again = true;
    else schedule();
  };

  const unsubscribers = watchedStores.map((store) =>
    (store as { subscribe: (fn: () => void) => () => void }).subscribe(onLocalChange),
  );
  unsubscribers.push(
    useConsent.subscribe(onLocalChange),
    useSession.subscribe((s, prev) => {
      if (s.session?.user.id !== prev.session?.user.id) schedule(0);
    }),
  );
  const appState = AppState.addEventListener('change', (next) => {
    if (next === 'active') schedule(0);
  });
  const onOnline = () => schedule(0);
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.addEventListener('online', onOnline);
  }

  refreshPending(userId());
  schedule(0);
  trigger = () => schedule(0);

  return () => {
    stopped = true;
    trigger = null;
    clearTimeout(timer);
    unsubscribers.forEach((u) => u());
    appState.remove();
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.removeEventListener('online', onOnline);
    }
  };
}
