import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { syncAfterSignIn } from '@/features/account/api';
import { useConsent } from '@/features/consent/store';
import { usePregnancy } from '@/features/pregnancy/store';
import { useRequirements } from '@/features/requirements/store';
import i18n from '@/i18n';
import { supabase } from '@/lib/supabase';

import {
  buildSnapshots,
  generateCode,
  hashCode,
  normalizeCode,
  shareScopes,
  type ShareScope,
  type Snapshots,
} from './model';
import { usePartner } from './store';

export interface PartnerLink {
  id: string;
  user_id: string;
  partner_id: string;
  scopes: ShareScope[];
  label: string | null;
  created_at: string;
}

async function currentUser() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
}

function client() {
  if (!supabase) throw new Error('Accounts are not configured for this build.');
  return supabase;
}

/** Records consent (on the device and in the server ledger) before anything is shared. */
export async function grantSharingConsent() {
  useConsent.getState().decide('partner_sharing', true);
  await syncAfterSignIn();
}

/**
 * Withdraws consent. The server then ends every link and deletes the shared
 * copy (see end_sharing_on_withdrawal).
 */
export async function withdrawSharingConsent() {
  useConsent.getState().decide('partner_sharing', false);
  await syncAfterSignIn();
  usePartner.getState().setLastPublished(null);
}

/** A one-time code, valid for 7 days. Only its hash is stored on the server. */
export async function createInvite(
  scopes: ShareScope[],
  label: string,
): Promise<{ code: string; expiresAt: string }> {
  const code = generateCode();
  const { data, error } = await client()
    .from('partner_invites')
    .insert({ code_hash: await hashCode(code), scopes, label: label.trim().slice(0, 60) || null })
    .select('expires_at')
    .single();
  if (error) throw new Error(error.message);
  await publishSnapshots({ force: true });
  return { code, expiresAt: data.expires_at as string };
}

export async function acceptInvite(code: string): Promise<void> {
  const { error } = await client().rpc('accept_partner_invite', { p_code: normalizeCode(code) });
  if (error) throw new Error(error.message);
}

/** Links where I share (as owner) and where someone shares with me. */
export async function listLinks(): Promise<{ mine: PartnerLink[]; withMe: PartnerLink[] }> {
  const user = await currentUser();
  if (!user) return { mine: [], withMe: [] };
  const { data, error } = await client().from('partner_links').select('*').order('created_at');
  if (error) throw new Error(error.message);
  const links = (data ?? []) as PartnerLink[];
  return {
    mine: links.filter((l) => l.user_id === user.id),
    withMe: links.filter((l) => l.partner_id === user.id),
  };
}

/** Ends a link from either side. The server deletes the shared copy when no links remain. */
export async function endLink(id: string): Promise<void> {
  const { error } = await client().from('partner_links').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/** The summaries shared with me by one owner, limited by the server to the link's scopes. */
export async function fetchShared(ownerId: string): Promise<Partial<Snapshots>> {
  const { data, error } = await client()
    .from('partner_snapshots')
    .select('scope, data')
    .eq('user_id', ownerId);
  if (error) throw new Error(error.message);
  const result: Partial<Snapshots> = {};
  for (const row of data ?? []) {
    (result as Record<string, unknown>)[row.scope as string] = row.data;
  }
  return result;
}

const hashOf = (value: unknown) => JSON.stringify(value);

/**
 * Uploads the shared summary when it changed, then asks the server to let
 * partners know (at most once an hour). Does nothing without consent, a
 * session and at least one link.
 */
export async function publishSnapshots({ force = false } = {}): Promise<void> {
  const user = await currentUser();
  if (!user || !useConsent.getState().isGranted('partner_sharing')) return;
  const { mine } = await listLinks();
  if (!mine.length && !force) return;

  const shared = new Set(mine.flatMap((l) => l.scopes));
  for (const scope of usePartner.getState().scopes) shared.add(scope);
  const pregnancy = usePregnancy.getState();
  const snapshots =
    pregnancy.status === 'active'
      ? buildSnapshots(
          {
            dueDate: useRequirements.getState().dueDate,
            appointments: pregnancy.appointments,
            kicks: pregnancy.kicks,
          },
          new Date(),
        )
      : { week: null, appointments: [], kicks: [] };
  const rows = shareScopes
    .filter((scope) => shared.has(scope) && snapshots[scope] !== null)
    .map((scope) => ({ user_id: user.id, scope, data: snapshots[scope] }));

  const hash = hashOf(rows);
  if (!force && hash === usePartner.getState().lastPublished) return;

  const db = client();
  const unshared = shareScopes.filter((s) => !rows.some((r) => r.scope === s));
  if (unshared.length) {
    await db.from('partner_snapshots').delete().eq('user_id', user.id).in('scope', unshared);
  }
  if (rows.length) {
    const { error } = await db.from('partner_snapshots').upsert(rows);
    if (error) throw new Error(error.message);
  }
  const first = usePartner.getState().lastPublished === null;
  usePartner.getState().setLastPublished(hash);
  if (mine.length && !first) {
    await db.functions.invoke('notify-partners', { method: 'POST' });
  }
}

/**
 * The partner side: saves this device's push token so shared updates can
 * arrive as a notification. Needs notification permission and a store
 * build with an EAS project id; otherwise updates appear when the app opens.
 */
export async function registerForPartnerUpdates(): Promise<'ok' | 'unsupported' | 'denied'> {
  const user = await currentUser();
  if (!user || Platform.OS === 'web') return 'unsupported';
  const projectId =
    (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ??
    Constants.easConfig?.projectId;
  if (!projectId) return 'unsupported';
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return 'denied';
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  const { error } = await client()
    .from('push_tokens')
    .upsert(
      {
        user_id: user.id,
        token,
        platform: Platform.OS,
        language: i18n.language === 'hi' ? 'hi' : 'en',
      },
      { onConflict: 'user_id,token' },
    );
  if (error) throw new Error(error.message);
  return 'ok';
}

export async function unregisterPartnerUpdates(): Promise<void> {
  const user = await currentUser();
  if (!user) return;
  await client().from('push_tokens').delete().eq('user_id', user.id);
}
