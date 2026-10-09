// Supabase Edge Function: tells the caller's partners that a shared update
// is ready, with a push notification through the free Expo push service.
//
// - Only for partners linked to the caller (partner_links), and only when
//   the caller has partner sharing consent.
// - At most one notification per partner per hour.
// - The wording never mentions pregnancy or health: "You have a new update
//   in Wellness". Tapping it opens the partner screen.
// - Sends nothing else: no names, dates or content.
//
// Deploy: supabase functions deploy notify-partners
import { createClient } from 'npm:@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const MIN_GAP_MS = 60 * 60_000;
const wording: Record<string, string> = {
  en: 'You have a new update in Wellness',
  hi: 'Wellness में आपके लिए एक नई सूचना है',
};
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
  const { data: auth, error } = await admin.auth.getUser(token);
  if (error || !auth.user) return json({ error: 'unauthorized' }, 401);
  const owner = auth.user.id;

  const { data: consent } = await admin
    .from('consents')
    .select('granted')
    .eq('user_id', owner)
    .eq('category', 'partner_sharing')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!consent?.granted) return json({ sent: 0 });

  const now = Date.now();
  const { data: links } = await admin
    .from('partner_links')
    .select('id, partner_id, notified_at')
    .eq('user_id', owner);
  const due = (links ?? []).filter(
    (l) => !l.notified_at || now - new Date(l.notified_at).getTime() >= MIN_GAP_MS,
  );
  if (!due.length) return json({ sent: 0 });

  const { data: tokens } = await admin
    .from('push_tokens')
    .select('token, user_id, language')
    .in(
      'user_id',
      due.map((l) => l.partner_id),
    );
  const messages = (tokens ?? []).map((t) => ({
    to: t.token,
    title: 'Wellness',
    body: wording[t.language] ?? wording.en,
    data: { href: '/partner', kind: 'system' },
    sound: 'default',
    channelId: 'reminders',
  }));

  if (messages.length) {
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(messages),
    });
    if (!response.ok) return json({ error: 'push_failed' }, 502);
  }
  await admin
    .from('partner_links')
    .update({ notified_at: new Date(now).toISOString() })
    .in(
      'id',
      due.map((l) => l.id),
    );
  return json({ sent: messages.length });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}
