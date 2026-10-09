import { createHash } from 'node:crypto';

import type { Client } from 'pg';

import { as, createTestDatabase } from './db';

const ALICE = '11111111-1111-4111-8111-111111111111';
const BOB = '22222222-2222-4222-8222-222222222222';

// Database tests need a Postgres server. CI always provides one; locally they
// are skipped unless DATABASE_URL is set (see supabase/README.md).
const hasDatabase = !!process.env.DATABASE_URL;
if (!hasDatabase && process.env.CI) {
  throw new Error('DATABASE_URL must be set in CI so Row Level Security is tested.');
}
const describeDb = hasDatabase ? describe : describe.skip;

let client: Client;
let drop: () => Promise<void>;

beforeAll(async () => {
  if (!hasDatabase) return;
  ({ client, drop } = await createTestDatabase());
  await client.query(
    `insert into auth.users (id, email) values ($1, 'alice@example.com'), ($2, 'bob@example.com')`,
    [ALICE, BOB],
  );
});

afterAll(async () => {
  await drop?.();
});

/** Inserts a row as `uid` and commits, returning its id. */
async function insertAs(uid: string, sql: string, params: unknown[] = []): Promise<string> {
  return as(client, uid, async () => (await client.query(sql, params)).rows[0].id, {
    commit: true,
  });
}

describeDb('schema safety net', () => {
  it('has Row Level Security enabled and forced on every public table', async () => {
    const { rows } = await client.query(`
      select c.relname, c.relrowsecurity, c.relforcerowsecurity
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r'`);
    expect(rows.length).toBeGreaterThan(20);
    const unprotected = rows
      .filter((r) => !r.relrowsecurity || !r.relforcerowsecurity)
      .map((r) => r.relname);
    expect(unprotected).toEqual([]);
  });

  it('never lets clients truncate a table (TRUNCATE bypasses RLS)', async () => {
    const { rows } = await client.query(`
      select table_name from information_schema.role_table_grants
      where grantee in ('anon', 'authenticated') and table_schema = 'public' and privilege_type = 'TRUNCATE'`);
    expect(rows).toEqual([]);
  });

  it('gives the anon role no access to any table', async () => {
    const { rows } = await client.query(`
      select table_name, privilege_type from information_schema.role_table_grants
      where grantee = 'anon' and table_schema = 'public'`);
    expect(rows).toEqual([]);
  });

  it('creates a profile and notification preferences for each new user, all notifications off', async () => {
    const profile = await as(
      client,
      ALICE,
      async () => (await client.query('select * from profiles')).rows,
    );
    expect(profile).toHaveLength(1);
    const prefs = await as(
      client,
      ALICE,
      async () => (await client.query('select * from notification_preferences')).rows[0],
    );
    expect(prefs).toMatchObject({
      global_enabled: false,
      daily_limit: 3,
      lock_screen_private: true,
    });
  });
});

describeDb('row isolation between users', () => {
  let aliceWater: string;

  beforeAll(async () => {
    aliceWater = await insertAs(
      ALICE,
      `insert into water_logs (amount_ml) values (250) returning id`,
    );
    await insertAs(
      ALICE,
      `insert into journal_entries (body) values ('private thoughts') returning id`,
    );
  });

  it('lets a user read their own rows', async () => {
    const rows = await as(
      client,
      ALICE,
      async () => (await client.query('select * from water_logs')).rows,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].user_id).toBe(ALICE);
  });

  it("hides other users' rows", async () => {
    const water = await as(
      client,
      BOB,
      async () => (await client.query('select * from water_logs')).rows,
    );
    const journal = await as(
      client,
      BOB,
      async () => (await client.query('select * from journal_entries')).rows,
    );
    expect(water).toEqual([]);
    expect(journal).toEqual([]);
  });

  it("cannot update or delete other users' rows", async () => {
    const updated = await as(
      client,
      BOB,
      async () =>
        (await client.query('update water_logs set amount_ml = 1 where id = $1', [aliceWater]))
          .rowCount,
    );
    const deleted = await as(
      client,
      BOB,
      async () =>
        (await client.query('delete from water_logs where id = $1', [aliceWater])).rowCount,
    );
    expect(updated).toBe(0);
    expect(deleted).toBe(0);
    const { rows } = await client.query('select amount_ml from water_logs where id = $1', [
      aliceWater,
    ]);
    expect(rows[0].amount_ml).toBe(250);
  });

  it('cannot write rows on behalf of another user', async () => {
    await expect(
      as(client, BOB, () =>
        client.query('insert into water_logs (user_id, amount_ml) values ($1, 100)', [ALICE]),
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it('cannot move their own row to another user', async () => {
    const bobRow = await insertAs(
      BOB,
      `insert into water_logs (amount_ml) values (300) returning id`,
    );
    await expect(
      as(client, BOB, () =>
        client.query('update water_logs set user_id = $1 where id = $2', [ALICE, bobRow]),
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it('blocks signed-out (anon) access entirely', async () => {
    await expect(as(client, null, () => client.query('select * from water_logs'))).rejects.toThrow(
      /permission denied/,
    );
    await expect(as(client, null, () => client.query('select * from profiles'))).rejects.toThrow(
      /permission denied/,
    );
  });

  it("cannot attach a child row to another user's parent record", async () => {
    const aliceMeal = await insertAs(
      ALICE,
      `insert into meals (meal_type) values ('lunch') returning id`,
    );
    await expect(
      as(client, BOB, () =>
        client.query(
          `insert into meal_items (meal_id, food_ref, name, quantity, unit) values ($1, 'in:roti', 'Roti', 2, 'piece')`,
          [aliceMeal],
        ),
      ),
    ).rejects.toThrow(/foreign key/);

    const alicePregnancy = await insertAs(
      ALICE,
      `insert into pregnancies (due_date) values ('2027-04-01') returning id`,
    );
    await expect(
      as(client, BOB, () =>
        client.query(`insert into kick_sessions (pregnancy_id, started_at) values ($1, now())`, [
          alicePregnancy,
        ]),
      ),
    ).rejects.toThrow(/foreign key/);
  });
});

describeDb('consent ledger', () => {
  it('allows adding and reading own consents', async () => {
    await insertAs(
      ALICE,
      `insert into consents (category, granted, policy_version) values ('water', true, '2026-10') returning id`,
    );
    const rows = await as(
      client,
      ALICE,
      async () => (await client.query('select category, granted from consents')).rows,
    );
    expect(rows).toEqual([{ category: 'water', granted: true }]);
    const bobView = await as(
      client,
      BOB,
      async () => (await client.query('select * from consents')).rows,
    );
    expect(bobView).toEqual([]);
  });

  it('cannot be edited or deleted, so the audit trail stays intact', async () => {
    await expect(
      as(client, ALICE, () => client.query('update consents set granted = false')),
    ).rejects.toThrow(/permission denied/);
    await expect(as(client, ALICE, () => client.query('delete from consents'))).rejects.toThrow(
      /permission denied/,
    );
  });
});

describeDb('notification settings and log', () => {
  it('enforces the daily limit range of 1 to 5', async () => {
    await expect(
      as(client, ALICE, () => client.query('update notification_preferences set daily_limit = 6')),
    ).rejects.toThrow(/check constraint/);
    const ok = await as(
      client,
      ALICE,
      async () =>
        (await client.query('update notification_preferences set daily_limit = 5')).rowCount,
    );
    expect(ok).toBe(1);
  });

  it('lets clients write the anonymous delivery log but never read it', async () => {
    await as(client, ALICE, () =>
      client.query(
        `insert into notification_log (type, module, platform, outcome) values ('reminder', 'water', 'android', 'delivered')`,
      ),
    );
    await expect(
      as(client, ALICE, () => client.query('select * from notification_log')),
    ).rejects.toThrow(/permission denied/);
  });
});

describeDb('account deletion', () => {
  it("removes every row that belonged to the user and nobody else's", async () => {
    const carol = '33333333-3333-4333-8333-333333333333';
    await client.query(`insert into auth.users (id, email) values ($1, 'carol@example.com')`, [
      carol,
    ]);
    await insertAs(carol, `insert into water_logs (amount_ml) values (500) returning id`);
    const meal = await insertAs(
      carol,
      `insert into meals (meal_type) values ('dinner') returning id`,
    );
    await insertAs(
      carol,
      `insert into meal_items (meal_id, food_ref, name, quantity, unit) values ($1, 'in:idli', 'Idli', 2, 'piece') returning id`,
      [meal],
    );
    await insertAs(
      carol,
      `insert into reminders (kind, template_key, schedule, timezone) values ('scheduled', 'water.drink', '{"times":["09:00"]}', 'Asia/Kolkata') returning id`,
    );
    await insertAs(
      carol,
      `insert into consents (category, granted, policy_version) values ('nutrition', true, '2026-10') returning id`,
    );

    await client.query('delete from auth.users where id = $1', [carol]);

    const { rows } = await client.query(`
      select table_name from information_schema.columns
      where table_schema = 'public' and column_name in ('user_id', 'id') and table_name <> 'notification_log'
      group by table_name`);
    for (const { table_name } of rows) {
      const column = table_name === 'profiles' ? 'id' : 'user_id';
      const left = await client.query(
        `select count(*)::int as n from public.${table_name} where ${column} = $1`,
        [carol],
      );
      expect([table_name, left.rows[0].n]).toEqual([table_name, 0]);
    }
    const alice = await client.query(
      'select count(*)::int as n from water_logs where user_id = $1',
      [ALICE],
    );
    expect(alice.rows[0].n).toBeGreaterThan(0);
  });
});

describeDb('partner sharing', () => {
  const DAN = '44444444-4444-4444-8444-444444444444'; // partner
  const EVE = '55555555-5555-4555-8555-555555555555'; // someone else
  const OWNER = '66666666-6666-4666-8666-666666666666';
  const code = 'ABCD2345';
  const hash = createHash('sha256').update(code).digest('hex');
  const query = (uid: string, sql: string, params: unknown[] = []) =>
    as(client, uid, async () => (await client.query(sql, params)).rows, { commit: true });
  const consent = (uid: string, granted: boolean) =>
    query(
      uid,
      `insert into consents (category, granted, policy_version) values ('partner_sharing', $1, '2026-10')`,
      [granted],
    );

  beforeAll(async () => {
    await client.query(
      `insert into auth.users (id, email) values ($1, 'dan@example.com'), ($2, 'eve@example.com'), ($3, 'owner@example.com')`,
      [DAN, EVE, OWNER],
    );
  });

  it('needs partner sharing consent before an invite can be made', async () => {
    await expect(
      query(OWNER, `insert into partner_invites (code_hash, scopes) values ($1, '{week}')`, [hash]),
    ).rejects.toThrow(/row-level security/);
    await consent(OWNER, true);
    await query(
      OWNER,
      `insert into partner_invites (code_hash, scopes) values ($1, '{week,appointments}')`,
      [hash],
    );
    await query(
      OWNER,
      `insert into partner_snapshots (scope, data) values ('week', '{"dueDate":"2026-12-01"}'), ('appointments', '[]'), ('kicks', '[]')`,
    );
  });

  it('never shows invites or snapshots to anyone else before a link exists', async () => {
    expect(await query(DAN, 'select * from partner_invites')).toEqual([]);
    expect(await query(DAN, 'select * from partner_snapshots')).toEqual([]);
  });

  it('lets the partner accept the code once, then read only the shared scopes', async () => {
    await expect(query(OWNER, `select accept_partner_invite($1)`, [code])).rejects.toThrow(
      /own invite/,
    );
    await query(DAN, `select accept_partner_invite($1)`, [code.toLowerCase()]);
    await expect(query(EVE, `select accept_partner_invite($1)`, [code])).rejects.toThrow(
      /invalid or expired/,
    );
    const shared = await query(DAN, 'select scope from partner_snapshots order by scope');
    expect(shared.map((r) => r.scope)).toEqual(['week', 'appointments']);
    expect(await query(EVE, 'select * from partner_snapshots')).toEqual([]);
    expect(await query(DAN, 'select * from water_logs')).toEqual([]);
  });

  it('does not let a partner write the shared copy, create links or widen scopes', async () => {
    await expect(
      query(DAN, `update partner_snapshots set data = '{}' where user_id = $1`, [OWNER]),
    ).resolves.toEqual([]);
    await expect(
      query(
        DAN,
        `insert into partner_links (user_id, partner_id, scopes) values ($1, $2, '{kicks}')`,
        [OWNER, EVE],
      ),
    ).rejects.toThrow(/permission denied/);
    expect(
      await query(
        DAN,
        `update partner_links set scopes = '{week,appointments,kicks}' returning id`,
      ),
    ).toEqual([]);
    expect(await query(DAN, `select scope from partner_snapshots where scope = 'kicks'`)).toEqual(
      [],
    );
  });

  it('removes access and the shared copy as soon as the owner revokes', async () => {
    await query(OWNER, `delete from partner_links where partner_id = $1`, [DAN]);
    expect(await query(DAN, 'select * from partner_snapshots')).toEqual([]);
    const left = await client.query(
      'select count(*)::int as n from partner_snapshots where user_id = $1',
      [OWNER],
    );
    expect(left.rows[0].n).toBe(0);
  });

  it('ends every link when the owner withdraws consent', async () => {
    const again = 'WXYZ6789';
    await query(OWNER, `insert into partner_invites (code_hash, scopes) values ($1, '{kicks}')`, [
      createHash('sha256').update(again).digest('hex'),
    ]);
    await query(DAN, `select accept_partner_invite($1)`, [again]);
    await query(OWNER, `insert into partner_snapshots (scope, data) values ('kicks', '[]')`);
    expect(await query(DAN, 'select scope from partner_snapshots')).toHaveLength(1);
    await consent(OWNER, false);
    expect(await query(DAN, 'select * from partner_links')).toEqual([]);
    expect(await query(DAN, 'select * from partner_snapshots')).toEqual([]);
    await expect(
      query(OWNER, `insert into partner_snapshots (scope, data) values ('week', '{}')`),
    ).rejects.toThrow(/row-level security/);
  });
});
