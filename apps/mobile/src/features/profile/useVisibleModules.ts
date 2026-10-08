import { getEnabledModules } from '@/features/registry';

import { filterByTrackers } from './audience';
import { sanitizeTrackers, useProfile } from './store';

/** Modules that are enabled in config, allowed for the user's audience, and switched on. */
export function useVisibleModules() {
  const audience = useProfile((s) => s.audience);
  const trackers = useProfile((s) => s.trackers);
  return filterByTrackers(getEnabledModules(), sanitizeTrackers(audience, trackers));
}
