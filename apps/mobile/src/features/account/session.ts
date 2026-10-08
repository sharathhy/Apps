import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import { supabase } from '@/lib/supabase';

interface SessionState {
  session: Session | null;
  ready: boolean;
}

/** Current Supabase session (never persisted by us; supabase-js stores it). */
export const useSession = create<SessionState>(() => ({ session: null, ready: !supabase }));

/** Starts listening for sign-in and sign-out. Returns an unsubscribe function. */
export function watchSession(): () => void {
  if (!supabase) return () => undefined;
  void supabase.auth.getSession().then(({ data }) => {
    useSession.setState({ session: data.session, ready: true });
  });
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    useSession.setState({ session, ready: true });
  });
  return () => data.subscription.unsubscribe();
}
