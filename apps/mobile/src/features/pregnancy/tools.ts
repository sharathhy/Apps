import type { IconName } from '@wellness/ui';

/** Pregnancy tools, each at /pregnancy-tools/<id>. */
export const pregnancyTools = [
  { id: 'weeks', icon: 'book' },
  { id: 'appointments', icon: 'calendar' },
  { id: 'symptoms', icon: 'stethoscope' },
  { id: 'kicks', icon: 'tap' },
  { id: 'weight', icon: 'scale' },
  { id: 'names', icon: 'baby' },
  { id: 'bag', icon: 'bag' },
  { id: 'partner', icon: 'people' },
] as const satisfies readonly { id: string; icon: IconName }[];

export type PregnancyToolId = (typeof pregnancyTools)[number]['id'];
