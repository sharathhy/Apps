import { consentCategoriesFor, isGranted, POLICY_VERSION } from '../categories';
import { useConsent } from '../store';

beforeEach(() => useConsent.getState().reset());

describe('consent', () => {
  it('asks about each chosen tracker plus anonymous analytics', () => {
    expect(consentCategoriesFor(['water', 'cycle'])).toEqual([
      'water',
      'cycle',
      'anonymous_analytics',
    ]);
  });

  it('is not granted until the person decides', () => {
    expect(useConsent.getState().isGranted('water')).toBe(false);
  });

  it('records each decision with a timestamp and queues it for the server ledger', () => {
    const at = new Date('2026-10-08T09:00:00Z');
    useConsent.getState().decide('water', true, at);
    useConsent.getState().decide('water', false, at);
    expect(useConsent.getState().isGranted('water')).toBe(false);
    expect(useConsent.getState().pending).toHaveLength(2);
    useConsent.getState().markSynced(2);
    expect(useConsent.getState().pending).toEqual([]);
  });

  it('treats consent given under an older policy as not granted', () => {
    expect(isGranted({ granted: true, at: '2026-01-01', policyVersion: 'old' })).toBe(false);
    expect(isGranted({ granted: true, at: '2026-01-01', policyVersion: POLICY_VERSION })).toBe(
      true,
    );
  });
});
