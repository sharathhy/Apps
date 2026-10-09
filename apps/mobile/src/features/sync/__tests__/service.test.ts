import type { ModuleId } from '@wellness/design-tokens';

import { useConsent } from '@/features/consent/store';
import { useCycle } from '@/features/cycle/store';
import { useMood } from '@/features/mood/store';
import { usePregnancy } from '@/features/pregnancy/store';
import { useRequirements } from '@/features/requirements/store';
import { useSleep } from '@/features/sleep/store';
import { useWater } from '@/features/water/store';

import { syncTables } from '../adapters';
import type { Remote, Row } from '../engine';
import { stableUuid } from '../ids';
import { syncAll } from '../service';
import { useSync } from '../store';

/** An in-memory account: one map per table, stamping times like the database. */
function account() {
  const tables = new Map<string, Map<string, Row>>();
  const table = (name: string) => {
    if (!tables.has(name)) tables.set(name, new Map());
    return tables.get(name)!;
  };
  let clock = Date.parse('2026-10-09T10:00:00Z');
  const calls = { upserts: 0, removes: 0 };
  const remote: Remote = {
    list: async (name) => [...table(name).values()].map((r) => ({ ...r })),
    upsert: async (name, rows) => {
      calls.upserts += rows.length;
      for (const r of rows) {
        clock += 1000;
        table(name).set(r.id, {
          created_at: new Date(clock).toISOString(),
          ...r,
          updated_at: r.updated_at ?? new Date(clock).toISOString(),
        });
      }
    },
    remove: async (name, ids) => {
      calls.removes += ids.length;
      ids.forEach((id) => table(name).delete(id));
    },
  };
  return { remote, table, calls };
}

const NOW = new Date('2026-10-09T12:00:00Z');

/** A new phone: nothing on it but consent. */
function freshDevice(modules: ModuleId[] = ['water', 'mood', 'sleep', 'cycle', 'pregnancy']) {
  for (const store of [
    useWater,
    useMood,
    useSleep,
    useCycle,
    usePregnancy,
    useRequirements,
    useSync,
  ])
    (store.getState() as { reset: () => void }).reset();
  useConsent.getState().reset();
  modules.forEach((m) => useConsent.getState().decide(m, true));
}

function logSomething() {
  useWater.getState().add({ amountMl: 250, drink: 'tea', at: NOW, day: '2026-10-09' });
  useMood.getState().addEntry({ mood: 4, tags: [], note: '', at: NOW, day: '2026-10-09' });
  useCycle.getState().saveLog({ day: '2026-10-08', flow: 'light', symptoms: ['cramps'], note: '' });
  useCycle.getState().addPeriod('2026-10-07');
  useRequirements.getState().setValue('dueDate', '2027-03-01');
  usePregnancy.getState().saveAppointment({
    title: 'Scan',
    at: '2026-10-20T04:30:00.000Z',
    note: '',
    remind: true,
  });
  usePregnancy.getState().toggleBagItem('phoneCharger');
  usePregnancy.getState().saveWeight('2026-10-09', 62.4);
}

describe('sync service', () => {
  it('backs up every tracker and brings a new device up to date', async () => {
    const { remote, table } = account();
    freshDevice();
    logSomething();
    await syncAll(remote, 'u1', NOW);

    expect(table('water_logs').size).toBe(1);
    expect(table('cycle_day_logs').get(stableUuid('u1:cycle-day:2026-10-08'))).toBeTruthy();
    expect(table('pregnancies').get(stableUuid('u1:pregnancy'))?.due_date).toBe('2027-03-01');
    expect(table('pregnancy_appointments').size).toBe(1);
    expect(useSync.getState().pending).toBe(0);

    const before = {
      water: useWater.getState().entries,
      logs: useCycle.getState().logs,
      periods: useCycle.getState().periods,
      appointments: usePregnancy.getState().appointments,
      weights: usePregnancy.getState().weights,
    };

    freshDevice();
    await syncAll(remote, 'u1', NOW);
    expect(useWater.getState().entries).toEqual(before.water);
    expect(useCycle.getState().logs).toEqual(
      Object.fromEntries(
        Object.entries(before.logs).map(([k, v]) => [k, { ...v, updatedAt: expect.any(String) }]),
      ),
    );
    expect(useCycle.getState().periods.map((p) => p.start)).toEqual(
      before.periods.map((p) => p.start),
    );
    expect(useRequirements.getState().dueDate).toBe('2027-03-01');
    expect(usePregnancy.getState().appointments).toEqual(before.appointments);
    expect(usePregnancy.getState().weights).toEqual(before.weights);
    // The starter checklist on the new phone takes the account's ticks.
    expect(usePregnancy.getState().bag.find((b) => b.key === 'phoneCharger')?.done).toBe(true);
  });

  it('sends nothing when nothing changed', async () => {
    const { remote, calls } = account();
    freshDevice();
    logSomething();
    await syncAll(remote, 'u1', NOW);
    const sent = calls.upserts;
    await syncAll(remote, 'u1', NOW);
    expect(calls.upserts).toBe(sent);
    expect(calls.removes).toBe(0);
  });

  it('removes a deleted entry from the account', async () => {
    const { remote, table } = account();
    freshDevice();
    logSomething();
    await syncAll(remote, 'u1', NOW);
    useWater.getState().remove(useWater.getState().entries[0]!.id);
    await syncAll(remote, 'u1', NOW);
    expect(table('water_logs').size).toBe(0);
  });

  it('only syncs trackers the person allowed', async () => {
    const { remote, table } = account();
    freshDevice(['water']);
    logSomething();
    await syncAll(remote, 'u1', NOW);
    expect(table('water_logs').size).toBe(1);
    expect(table('mood_entries').size).toBe(0);
    expect(table('pregnancies').size).toBe(0);
  });

  it("never adds this device's entries to a different account", async () => {
    const { remote, calls } = account();
    freshDevice();
    logSomething();
    await syncAll(remote, 'u1', NOW);
    const sent = calls.upserts;
    await syncAll(remote, 'u2', NOW);
    expect(calls.upserts).toBe(sent);
    expect(useSync.getState().status).toBe('otherAccount');
  });

  it('waits for the due date before syncing appointments', async () => {
    const { remote, table } = account();
    freshDevice();
    usePregnancy
      .getState()
      .saveAppointment({ title: 'GP', at: NOW.toISOString(), note: '', remind: false });
    await syncAll(remote, 'u1', NOW);
    expect(table('pregnancy_appointments').size).toBe(0);
    expect(usePregnancy.getState().appointments).toHaveLength(1);
  });

  it('keeps every row the same after a round trip through the account', () => {
    freshDevice();
    logSomething();
    useSleep.getState().save({
      bedAt: '2026-10-08T17:00:00.000Z',
      wakeAt: '2026-10-09T01:00:00.000Z',
      day: '2026-10-09',
      quality: 4,
      note: 'ok',
    });
    useMood.getState().saveJournal({ body: 'Hello', promptKey: null, at: NOW, day: '2026-10-09' });
    useMood.getState().addBreathing('box', 120, NOW);
    usePregnancy
      .getState()
      .addSymptoms({ at: NOW.toISOString(), day: '2026-10-09', symptoms: ['nausea'], note: '' });
    usePregnancy.getState().addName('Asha');
    usePregnancy.getState().addBagItem('Socks');
    for (const t of syncTables('u1')) {
      for (const record of t.list()) {
        const row = { ...t.toRow(record, 'u1'), updated_at: NOW.toISOString() };
        expect(t.id(record)).toBe(row.id);
        expect(t.toRow(t.fromRow(row)!, 'u1')).toEqual(t.toRow(record, 'u1'));
      }
    }
  });
});
