import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { Client } from 'pg';

/**
 * Creates a throwaway database, applies the Supabase stub and every migration
 * in order, and returns a connected superuser client.
 *
 * DATABASE_URL must point at a Postgres server where we may create databases,
 * e.g. postgres://postgres@localhost:5432/postgres (CI starts one).
 */
export async function createTestDatabase(): Promise<{ client: Client; drop: () => Promise<void> }> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('Set DATABASE_URL to run the database tests.');

  const admin = new Client({ connectionString: url });
  await admin.connect();
  const name = `wellness_test_${process.pid}_${Date.now()}`;
  await admin.query(`create database ${name}`);

  const testUrl = new URL(url);
  testUrl.pathname = `/${name}`;
  const client = new Client({ connectionString: testUrl.toString() });
  await client.connect();

  const root = join(__dirname, '..');
  await client.query(readFileSync(join(root, 'tests/supabase-stub.sql'), 'utf8'));
  const migrations = readdirSync(join(root, 'migrations'))
    .filter((f) => f.endsWith('.sql'))
    .sort();
  for (const file of migrations) {
    await client.query(readFileSync(join(root, 'migrations', file), 'utf8'));
  }

  return {
    client,
    drop: async () => {
      await client.end();
      await admin.query(`drop database ${name} with (force)`);
      await admin.end();
    },
  };
}

/** Runs `fn` inside a transaction as a signed-in user (or anon when uid is null), then rolls back. */
export async function as<T>(
  client: Client,
  uid: string | null,
  fn: () => Promise<T>,
  { commit = false } = {},
): Promise<T> {
  await client.query('begin');
  try {
    await client.query(`set local role ${uid ? 'authenticated' : 'anon'}`);
    await client.query(`select set_config('request.jwt.claim.sub', $1, true)`, [uid ?? '']);
    const result = await fn();
    await client.query(commit ? 'commit' : 'rollback');
    return result;
  } catch (error) {
    await client.query('rollback');
    throw error;
  }
}
