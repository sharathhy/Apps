import { getEnabledModules } from '@/features/registry';

import { filterByTrackers } from './audience';
import { useProfile } from './store';

/** Modules that are both enabled in config and chosen by this user. */
export function useVisibleModules() {
  const trackers = useProfile((s) => s.trackers);
  return filterByTrackers(getEnabledModules(), trackers);
}
