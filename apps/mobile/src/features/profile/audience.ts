import { moduleIds, type ModuleId } from '@wellness/design-tokens';

/**
 * Who the user wants the app set up for. It decides which trackers are
 * offered at all, and which are switched on by default.
 */
export type Audience = 'women' | 'men' | 'everyone';

export const audiences: Audience[] = ['women', 'men', 'everyone'];

/** Trackers that only make sense for women. Men's health never shows them. */
const womenOnly: ModuleId[] = ['cycle', 'pregnancy'];

/** Trackers a person in this audience can see and turn on. */
export function availableTrackers(audience: Audience): ModuleId[] {
  return audience === 'men' ? moduleIds.filter((id) => !womenOnly.includes(id)) : [...moduleIds];
}

/** Trackers switched on when the audience is chosen. Everything available starts on. */
export function defaultTrackers(audience: Audience): ModuleId[] {
  return availableTrackers(audience);
}

/** Keeps `ordered` items the user has chosen, preserving the app's configured order. */
export function filterByTrackers<T extends { id: ModuleId }>(
  ordered: T[],
  trackers: ModuleId[],
): T[] {
  const chosen = new Set(trackers);
  return ordered.filter((m) => chosen.has(m.id));
}

/** Turns a tracker on or off. Trackers not available to the audience can never be turned on. */
export function toggleTracker(
  trackers: ModuleId[],
  id: ModuleId,
  audience: Audience = 'everyone',
): ModuleId[] {
  if (trackers.includes(id)) return trackers.filter((t) => t !== id);
  return availableTrackers(audience).includes(id) ? [...trackers, id] : trackers;
}
