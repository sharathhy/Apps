/**
 * Offline-first sync between the on-device stores and the account.
 *
 * Every tracker writes to its local store first, so logging always works
 * offline. When signed in, sync compares each table with what was last
 * synced and sends or applies only the differences:
 *
 * - local change only  → upload (the "retry queue" is simply every change
 *   not yet confirmed by the server; failed runs retry with backoff)
 * - remote change only → apply locally
 * - both changed       → the newer change wins (by its updated time)
 * - deleted on one side, unchanged on the other → delete on both
 * - deleted on one side, changed on the other    → the change wins
 *
 * The engine knows nothing about Supabase; it talks to a `Remote`.
 */

import { stableUuid } from './ids';

export type Row = Record<string, unknown> & { id: string; updated_at?: string };

export interface SyncAdapter<T> {
  /** Server table name. */
  table: string;
  /** Local records, read fresh each run. */
  list: () => T[];
  id: (record: T) => string;
  /** When the record last changed on this device (ISO). Records without one count as "now". */
  updatedAt: (record: T) => string | null;
  toRow: (record: T, userId: string) => Row;
  /** Null when a server row cannot be shown on this device (it is left alone). */
  fromRow: (row: Row) => T | null;
  /** Replaces the local records with `records` (already merged). */
  replace: (records: T[]) => void;
}

export interface Remote {
  list: (table: string) => Promise<Row[]>;
  upsert: (table: string, rows: Row[]) => Promise<void>;
  remove: (table: string, ids: string[]) => Promise<void>;
}

/** What each table looked like at the last successful sync, per record id. */
export type SyncedState = Record<string, Record<string, { hash: string; remoteAt: string | null }>>;

export interface TableResult {
  uploaded: number;
  downloaded: number;
  deletedRemote: number;
  deletedLocal: number;
}

/**
 * A short fingerprint of a row, without the timestamps the server sets.
 * Only the fingerprint is kept between syncs, never a copy of the data.
 */
export function rowHash(row: Row): string {
  const { updated_at: _u, created_at: _c, user_id: _user, ...rest } = row;
  return stableUuid(
    JSON.stringify(
      Object.keys(rest)
        .sort()
        .map((k) => [k, normalise(rest[k])]),
    ),
  );
}

function normalise(value: unknown): unknown {
  if (typeof value === 'number') return Math.round(value * 1000) / 1000;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const t = Date.parse(value);
    return Number.isNaN(t) ? value : new Date(t).toISOString();
  }
  if (Array.isArray(value)) return value.map(normalise);
  return value ?? null;
}

const later = (a: string | null | undefined, b: string | null | undefined) =>
  (a ? Date.parse(a) : 0) > (b ? Date.parse(b) : 0);

export async function syncTable<T>(
  adapter: SyncAdapter<T>,
  remote: Remote,
  userId: string,
  synced: Record<string, { hash: string; remoteAt: string | null }>,
  now: Date,
): Promise<{
  result: TableResult;
  synced: Record<string, { hash: string; remoteAt: string | null }>;
}> {
  const result: TableResult = { uploaded: 0, downloaded: 0, deletedRemote: 0, deletedLocal: 0 };
  const localRecords = adapter.list();
  const local = new Map(localRecords.map((r) => [adapter.id(r), r]));
  const remoteRows = await remote.list(adapter.table);
  const remoteById = new Map(remoteRows.map((r) => [r.id, r]));

  const merged = new Map<string, T>(local);
  const toUpload: Row[] = [];
  const toDelete: string[] = [];
  const nextSynced: Record<string, { hash: string; remoteAt: string | null }> = {};

  const upload = (id: string, row: Row, hash: string, at: string) => {
    toUpload.push({ ...row, updated_at: at });
    nextSynced[id] = { hash, remoteAt: at };
    result.uploaded++;
  };
  const download = (id: string, row: Row, hash: string) => {
    const record = adapter.fromRow(row);
    if (!record) return;
    merged.set(id, record);
    nextSynced[id] = { hash, remoteAt: row.updated_at ?? null };
    result.downloaded++;
  };

  const ids = new Set([...local.keys(), ...remoteById.keys(), ...Object.keys(synced)]);
  for (const id of ids) {
    const before = synced[id];
    const mine = local.get(id);
    const theirs = remoteById.get(id);
    const mineRow = mine ? adapter.toRow(mine, userId) : null;
    const mineHash = mineRow ? rowHash(mineRow) : null;
    // Compare the server row as this device would write it, so columns the
    // device doesn't use (defaults, created_at) never look like a change.
    const theirRecord = theirs ? adapter.fromRow(theirs) : null;
    const theirHash = theirs
      ? rowHash(theirRecord ? adapter.toRow(theirRecord, userId) : theirs)
      : null;
    const mineStamp = mine ? adapter.updatedAt(mine) : null;
    const mineAt = mineStamp ?? now.toISOString();

    if (mineHash !== null && mineHash === theirHash) {
      nextSynced[id] = { hash: mineHash, remoteAt: theirs!.updated_at ?? null };
      continue;
    }
    const localChanged = before ? mineHash !== before.hash : mine !== undefined;
    const remoteChanged = before ? theirHash !== before.hash : theirs !== undefined;

    if (localChanged && !remoteChanged) {
      if (mine) upload(id, mineRow!, mineHash!, mineAt);
      else if (theirs) {
        toDelete.push(id);
        result.deletedRemote++;
      }
    } else if (remoteChanged && !localChanged) {
      if (theirs) download(id, theirs, theirHash!);
      else if (mine) {
        merged.delete(id);
        result.deletedLocal++;
      }
    } else if (localChanged && remoteChanged) {
      // Both sides changed. An edit beats a deletion; between two edits the newer wins.
      if (mine && theirs) {
        // A record with no change time that was never synced is a default
        // made on this device (like the starter checklist on a new phone),
        // so the account's copy wins.
        const mineWins = mineStamp || before ? later(mineAt, theirs.updated_at) : false;
        if (mineWins) upload(id, mineRow!, mineHash!, mineAt);
        else download(id, theirs, theirHash!);
      } else if (mine) upload(id, mineRow!, mineHash!, mineAt);
      else if (theirs) download(id, theirs, theirHash!);
    } else if (mine && before) {
      nextSynced[id] = before;
    }
  }

  if (toUpload.length) await remote.upsert(adapter.table, toUpload);
  if (toDelete.length) await remote.remove(adapter.table, toDelete);

  // Only touch the local store if something came from the server.
  if (result.downloaded || result.deletedLocal) {
    const order = localRecords.map((r) => adapter.id(r));
    const fresh = [...merged.keys()].filter((id) => !local.has(id));
    adapter.replace(
      [...order.filter((id) => merged.has(id)), ...fresh].map((id) => merged.get(id)!),
    );
  }
  return { result, synced: nextSynced };
}

/** Delay before retry `attempt` (1, 2, …): 5 s doubling to at most 10 minutes, with jitter. */
export function backoffMs(attempt: number, random = Math.random): number {
  const base = Math.min(10 * 60_000, 5_000 * 2 ** Math.max(0, attempt - 1));
  return Math.round(base * (0.8 + 0.4 * random()));
}

/** Number of local records not yet confirmed by the server, for the sync status. */
export function pendingCount<T>(
  adapter: SyncAdapter<T>,
  userId: string,
  synced: Record<string, { hash: string; remoteAt: string | null }>,
): number {
  const local = adapter.list();
  const ids = new Set(local.map(adapter.id));
  const changed = local.filter(
    (r) => synced[adapter.id(r)]?.hash !== rowHash(adapter.toRow(r, userId)),
  );
  const deleted = Object.keys(synced).filter((id) => !ids.has(id));
  return changed.length + deleted.length;
}
