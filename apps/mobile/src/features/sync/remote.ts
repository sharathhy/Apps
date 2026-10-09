import type { SupabaseClient } from '@supabase/supabase-js';

import type { Remote, Row } from './engine';

const PAGE = 1000;
const UPSERT_CHUNK = 500;
const DELETE_CHUNK = 200;

/** The account's tables through Supabase. Row Level Security limits every call to the signed-in person. */
export function supabaseRemote(client: SupabaseClient): Remote {
  return {
    list: async (table) => {
      const rows: Row[] = [];
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await client
          .from(table)
          .select('*')
          .order('id')
          .range(from, from + PAGE - 1);
        if (error) throw new Error(`${table}: ${error.message}`);
        rows.push(...((data ?? []) as Row[]));
        if (!data || data.length < PAGE) return rows;
      }
    },
    upsert: async (table, rows) => {
      for (let i = 0; i < rows.length; i += UPSERT_CHUNK) {
        const { error } = await client.from(table).upsert(rows.slice(i, i + UPSERT_CHUNK));
        if (error) throw new Error(`${table}: ${error.message}`);
      }
    },
    remove: async (table, ids) => {
      for (let i = 0; i < ids.length; i += DELETE_CHUNK) {
        const { error } = await client
          .from(table)
          .delete()
          .in('id', ids.slice(i, i + DELETE_CHUNK));
        if (error) throw new Error(`${table}: ${error.message}`);
      }
    },
  };
}
