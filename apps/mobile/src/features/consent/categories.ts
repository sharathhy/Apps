import type { ModuleId } from '@wellness/design-tokens';

/** Bump when the privacy policy changes in a way that needs fresh consent. */
export const POLICY_VERSION = '2026-10';

export type ConsentCategory = ModuleId | 'anonymous_analytics';

/** Categories asked about during onboarding, given the trackers a person chose. */
export function consentCategoriesFor(trackers: ModuleId[]): ConsentCategory[] {
  return [...trackers, 'anonymous_analytics'];
}

export interface ConsentRecord {
  granted: boolean;
  /** ISO timestamp of the decision. */
  at: string;
  policyVersion: string;
}

/** A category counts as consented only for the current policy version. */
export function isGranted(record: ConsentRecord | undefined): boolean {
  return !!record && record.granted && record.policyVersion === POLICY_VERSION;
}
