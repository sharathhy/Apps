import { sanitizeTrackers, useProfile } from '../store';

describe('profile store', () => {
  beforeEach(() => useProfile.getState().reset());

  it('starts with no audience so setup is shown', () => {
    expect(useProfile.getState().audience).toBeNull();
    expect(useProfile.getState().trackers).toEqual([]);
  });

  it('applies men defaults and never allows cycle for men', () => {
    useProfile.getState().chooseAudience('men');
    expect(useProfile.getState().trackers).toEqual([
      'water',
      'mood',
      'sleep',
      'activity',
      'nutrition',
    ]);
    useProfile.getState().toggleTracker('cycle');
    expect(useProfile.getState().trackers).not.toContain('cycle');
    useProfile.getState().toggleTracker('sleep');
    expect(useProfile.getState().trackers).not.toContain('sleep');
  });

  it('resets defaults when switching audience', () => {
    useProfile.getState().chooseAudience('men');
    useProfile.getState().chooseAudience('women');
    expect(useProfile.getState().trackers).toContain('pregnancy');
  });
});

describe('sanitizeTrackers', () => {
  it('removes women-only trackers from a stored men profile', () => {
    expect(sanitizeTrackers('men', ['water', 'cycle', 'pregnancy', 'sleep'])).toEqual([
      'water',
      'sleep',
    ]);
    expect(sanitizeTrackers(null, ['water'])).toEqual([]);
  });
});
