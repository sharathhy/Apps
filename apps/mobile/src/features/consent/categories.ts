import type { ModuleId } from '@wellness/design-tokens';

/** Bump when the privacy policy changes in a way that needs fresh consent. */
export const POLICY_VERSION = '2026-10';

/** Categories shown in onboarding and on the data permissions screen. */
export type ListedConsentCategory = ModuleId | 'anonymous_analytics';
/** Partner sharing is asked for on its own screen, just before anything is shared. */
export type ConsentCategory = ListedConsentCategory | 'partner_sharing';

/** Categories asked about during onboarding, given the trackers a person chose. */
export function consentCategoriesFor(trackers: ModuleId[]): ListedConsentCategory[] {
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
