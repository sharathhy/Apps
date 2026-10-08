import { useConsent } from '@/features/consent/store';
import { userTables, type UserTable } from '@/features/data/tables';
import { useProfile } from '@/features/profile/store';
import { supabase } from '@/lib/supabase';

export type AuthResult = { ok: true; needsConfirmation?: boolean } | { ok: false; error: string };

function requireClient() {
  if (!supabase) throw new Error('Accounts are not configured for this build.');
  return supabase;
}

export async function signUp(
  email: string,
  password: string,
  redirectTo?: string,
): Promise<AuthResult> {
  const { data, error } = await requireClient().auth.signUp({
    email: email.trim(),
    password,
    options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, needsConfirmation: !data.session };
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const { error } = await requireClient().auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) return { ok: false, error: error.message };
  await syncAfterSignIn();
  return { ok: true };
}

export async function sendPasswordReset(email: string, redirectTo?: string): Promise<AuthResult> {
  const { error } = await requireClient().auth.resetPasswordForEmail(email.trim(), { redirectTo });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function updatePassword(password: string): Promise<AuthResult> {
  const { error } = await requireClient().auth.updateUser({ password });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function signOut(): Promise<void> {
  await supabase?.auth.signOut();
}

/** Copies on-device settings to the account and writes pending consent decisions to the ledger. */
export async function syncAfterSignIn(): Promise<void> {
  if (!supabase) return;
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return;

  const profile = useProfile.getState();
  await supabase.from('profiles').upsert({
    id: user.id,
    audience: profile.audience,
    language: profile.language ?? 'en',
    theme: profile.theme,
    enabled_modules: profile.trackers,
  });

  const { pending, markSynced } = useConsent.getState();
  if (pending.length) {
    const { error } = await supabase.from('consents').insert(
      pending.map(({ category, record }) => ({
        user_id: user.id,
        category,
        granted: record.granted,
        policy_version: record.policyVersion,
        created_at: record.at,
      })),
    );
    if (!error) markSynced(pending.length);
  }
}

/** Every row the signed-in person owns on the server. Row Level Security limits each query to them. */
export async function fetchServerData(): Promise<Partial<Record<UserTable, unknown[]>> | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  if (!data.session) return null;
  const result: Partial<Record<UserTable, unknown[]>> = {};
  for (const table of userTables) {
    const { data: rows, error } = await supabase.from(table).select('*');
    if (error) throw new Error(`Could not export ${table}: ${error.message}`);
    result[table] = rows ?? [];
  }
  return result;
}

/** Deletes the account on the server (database rows and stored files). */
export async function deleteServerAccount(): Promise<void> {
  if (!supabase) return;
  const { data } = await supabase.auth.getSession();
  if (!data.session) return;
  const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
  if (error) throw new Error(`Account deletion failed: ${error.message}`);
  await supabase.auth.signOut({ scope: 'local' });
}
