// Supabase Edge Function: permanently deletes the calling user's account.
//
// 1. Verifies the caller's access token.
// 2. Removes every file the user stored (bucket "user-files", folder <user id>/).
// 3. Deletes the auth user. Every table row cascades from auth.users, so the
//    database keeps nothing that belonged to them.
// Scheduled notifications live on the device; the app cancels them before
// calling this function.
//
// Deploy: supabase functions deploy delete-account
import { createClient } from 'npm:@supabase/supabase-js@2';

const BUCKET = 'user-files';
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'unauthorized' }, 401);

  const url = Deno.env.get('SUPABASE_URL')!;
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return json({ error: 'unauthorized' }, 401);
  const userId = data.user.id;

  // Remove stored files in pages of 100 until the folder is empty.
  for (;;) {
    const { data: files, error: listError } = await admin.storage
      .from(BUCKET)
      .list(userId, { limit: 100 });
    if (listError) {
      if (/not found/i.test(listError.message)) break;
      return json({ error: 'storage_list_failed' }, 500);
    }
    if (!files?.length) break;
    const { error: removeError } = await admin.storage
      .from(BUCKET)
      .remove(files.map((f) => `${userId}/${f.name}`));
    if (removeError) return json({ error: 'storage_remove_failed' }, 500);
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) return json({ error: 'delete_failed' }, 500);

  return json({ deleted: true });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}
