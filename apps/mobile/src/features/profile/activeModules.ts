import type { ModuleId } from '@wellness/design-tokens';

import { useConsent } from '@/features/consent/store';
import { getEnabledModules } from '@/features/registry';

import { filterByTrackers } from './audience';
import { sanitizeTrackers, useProfile } from './store';

/**
 * Trackers that are switched on and whose data category the person has
 * allowed. Reminders, notices and achievements only ever involve these.
 */
export function activeModules(): ModuleId[] {
  const { audience, trackers } = useProfile.getState();
  const consent = useConsent.getState();
  return filterByTrackers(getEnabledModules(), sanitizeTrackers(audience, trackers))
    .map((m) => m.id)
    .filter((id) => consent.isGranted(id));
}
