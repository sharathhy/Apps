import { useCallback, useEffect, useState } from 'react';

import { useSession } from '@/features/account/session';

import { listLinks, type PartnerLink } from './api';

/** Partner links for the signed-in person, with a way to reload after a change. */
export function useLinks() {
  const session = useSession((s) => s.session);
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<{
    mine: PartnerLink[];
    withMe: PartnerLink[];
    loading: boolean;
    error: string | null;
  }>({ mine: [], withMe: [], loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    if (!session) return;
    listLinks().then(
      (links) => {
        if (!cancelled) setState({ ...links, loading: false, error: null });
      },
      (error: Error) => {
        if (!cancelled) setState((s) => ({ ...s, loading: false, error: error.message }));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [session, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { ...state, loading: !!session && state.loading, reload };
}
