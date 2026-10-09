import { buildSnapshots, CODE_LENGTH, generateCode, hashCode, normalizeCode } from '../model';

describe('partner sharing model', () => {
  it('shares only a summary: no notes, and only upcoming appointments and finished sessions', () => {
    const now = new Date('2026-10-09T10:00:00Z');
    const snapshots = buildSnapshots(
      {
        dueDate: '2027-01-20',
        appointments: [
          { id: '1', title: 'Old scan', at: '2026-10-01T05:00:00Z', note: 'private', remind: true },
          { id: '2', title: 'Checkup', at: '2026-10-20T05:00:00Z', note: 'private', remind: true },
        ],
        kicks: [
          {
            id: 'a',
            startedAt: '2026-10-08T10:00:00Z',
            endedAt: '2026-10-08T10:20:00Z',
            count: 10,
          },
          { id: 'b', startedAt: '2026-10-09T09:00:00Z', endedAt: null, count: 2 },
        ],
      },
      now,
    );
    expect(snapshots).toEqual({
      week: { dueDate: '2027-01-20' },
      appointments: [{ title: 'Checkup', at: '2026-10-20T05:00:00Z' }],
      kicks: [{ startedAt: '2026-10-08T10:00:00Z', count: 10, minutes: 20 }],
    });
    expect(JSON.stringify(snapshots)).not.toContain('private');
  });

  it('makes unambiguous one-time codes and hashes them the same way the server does', async () => {
    const codes = new Set(Array.from({ length: 200 }, generateCode));
    expect(codes.size).toBe(200);
    for (const code of codes) expect(code).toMatch(new RegExp(`^[A-HJKMNP-Z2-9]{${CODE_LENGTH}}$`));
    expect(normalizeCode(' abcd-2345 ')).toBe('ABCD2345');
    // Matches encode(digest(upper(trim(code)), 'sha256'), 'hex') in accept_partner_invite.
    expect(await hashCode('abcd-2345')).toBe(
      'a00d76646eba91b057841554d5c8334f498dc592ed744bce404f21fe271cd36e',
    );
  });
});
