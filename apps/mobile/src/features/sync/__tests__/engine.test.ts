import {
  backoffMs,
  pendingCount,
  syncTable,
  type Remote,
  type Row,
  type SyncAdapter,
  type SyncedState,
} from '../engine';

interface Note {
  id: string;
  text: string;
  updatedAt: string;
}

/** A device: its own store plus what it last synced. */
function device() {
  let notes: Note[] = [];
  let synced: SyncedState[string] = {};
  const adapter: SyncAdapter<Note> = {
    table: 'notes',
    list: () => notes,
    id: (n) => n.id,
    updatedAt: (n) => n.updatedAt,
    toRow: (n, userId) => ({ id: n.id, user_id: userId, text: n.text }),
    fromRow: (r) => ({ id: r.id, text: r.text as string, updatedAt: r.updated_at as string }),
    replace: (next) => {
      notes = next;
    },
  };
  return {
    adapter,
    get notes() {
      return notes;
    },
    set notes(next: Note[]) {
      notes = next;
    },
    async sync(remote: Remote, now = new Date('2026-10-09T12:00:00Z')) {
      const out = await syncTable(adapter, remote, 'user-1', synced, now);
      synced = out.synced;
      return out.result;
    },
    pending: () => pendingCount(adapter, 'user-1', synced),
  };
}

/** An in-memory server table that stamps updated_at like the database does when none is sent. */
function server(fail = { on: false }) {
  const rows = new Map<string, Row>();
  const remote: Remote = {
    list: async () => {
      if (fail.on) throw new Error('offline');
      return [...rows.values()].map((r) => ({ ...r, created_at: '2026-01-01T00:00:00Z' }));
    },
    upsert: async (_t, list) => {
      if (fail.on) throw new Error('offline');
      for (const r of list)
        rows.set(r.id, { ...r, updated_at: r.updated_at ?? new Date().toISOString() });
    },
    remove: async (_t, ids) => {
      if (fail.on) throw new Error('offline');
      ids.forEach((id) => rows.delete(id));
    },
  };
  return { rows, remote, fail };
}

const at = (minute: number) => `2026-10-09T10:${String(minute).padStart(2, '0')}:00.000Z`;

describe('sync engine', () => {
  it('uploads offline changes, then has nothing left to send', async () => {
    const s = server();
    const phone = device();
    phone.notes = [{ id: 'a', text: 'water 250', updatedAt: at(1) }];
    expect(phone.pending()).toBe(1);
    expect(await phone.sync(s.remote)).toMatchObject({ uploaded: 1 });
    expect(s.rows.get('a')).toMatchObject({ text: 'water 250', updated_at: at(1) });
    expect(phone.pending()).toBe(0);
    expect(await phone.sync(s.remote)).toEqual({
      uploaded: 0,
      downloaded: 0,
      deletedRemote: 0,
      deletedLocal: 0,
    });
  });

  it('keeps changes queued while offline and sends them when back online', async () => {
    const s = server();
    const phone = device();
    phone.notes = [{ id: 'a', text: 'mood 4', updatedAt: at(1) }];
    s.fail.on = true;
    await expect(phone.sync(s.remote)).rejects.toThrow('offline');
    expect(phone.pending()).toBe(1);
    s.fail.on = false;
    await phone.sync(s.remote);
    expect(phone.pending()).toBe(0);
    expect(s.rows.size).toBe(1);
  });

  it('brings a second device up to date, including deletions', async () => {
    const s = server();
    const phone = device();
    const tablet = device();
    phone.notes = [
      { id: 'a', text: 'one', updatedAt: at(1) },
      { id: 'b', text: 'two', updatedAt: at(2) },
    ];
    await phone.sync(s.remote);
    expect(await tablet.sync(s.remote)).toMatchObject({ downloaded: 2 });
    expect(tablet.notes.map((n) => n.id).sort()).toEqual(['a', 'b']);

    phone.notes = phone.notes.filter((n) => n.id !== 'a');
    expect(await phone.sync(s.remote)).toMatchObject({ deletedRemote: 1 });
    expect(await tablet.sync(s.remote)).toMatchObject({ deletedLocal: 1 });
    expect(tablet.notes.map((n) => n.id)).toEqual(['b']);
  });

  it('lets the newer edit win when two devices change the same entry', async () => {
    const s = server();
    const phone = device();
    const tablet = device();
    phone.notes = [{ id: 'a', text: 'first', updatedAt: at(1) }];
    await phone.sync(s.remote);
    await tablet.sync(s.remote);

    phone.notes = [{ id: 'a', text: 'phone edit', updatedAt: at(5) }];
    tablet.notes = [{ id: 'a', text: 'tablet edit', updatedAt: at(9) }];
    await phone.sync(s.remote);
    expect(await tablet.sync(s.remote)).toMatchObject({ uploaded: 1 });
    await phone.sync(s.remote);
    expect(phone.notes[0]!.text).toBe('tablet edit');
    expect(s.rows.get('a')!.text).toBe('tablet edit');
  });

  it('keeps an edit over a deletion made elsewhere', async () => {
    const s = server();
    const phone = device();
    const tablet = device();
    phone.notes = [{ id: 'a', text: 'first', updatedAt: at(1) }];
    await phone.sync(s.remote);
    await tablet.sync(s.remote);

    tablet.notes = [];
    await tablet.sync(s.remote);
    phone.notes = [{ id: 'a', text: 'edited offline', updatedAt: at(7) }];
    expect(await phone.sync(s.remote)).toMatchObject({ uploaded: 1 });
    await tablet.sync(s.remote);
    expect(tablet.notes[0]!.text).toBe('edited offline');
  });

  it('ignores server-only columns, so nothing bounces back and forth', async () => {
    const s = server();
    const phone = device();
    phone.notes = [{ id: 'a', text: 'x', updatedAt: at(1) }];
    await phone.sync(s.remote);
    s.rows.set('a', { ...s.rows.get('a')!, extra_default: 'server value' });
    expect(await phone.sync(s.remote)).toEqual({
      uploaded: 0,
      downloaded: 0,
      deletedRemote: 0,
      deletedLocal: 0,
    });
  });

  it('backs off from 5 seconds to at most 10 minutes', () => {
    expect(backoffMs(1, () => 0.5)).toBe(5_000);
    expect(backoffMs(2, () => 0.5)).toBe(10_000);
    expect(backoffMs(20, () => 0.5)).toBe(600_000);
    expect(backoffMs(3, () => 0)).toBe(16_000);
  });
});
