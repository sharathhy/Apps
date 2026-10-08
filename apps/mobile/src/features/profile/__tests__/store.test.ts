import { useProfile } from '../store';

describe('profile store', () => {
  beforeEach(() => useProfile.getState().reset());

  it('starts with no audience so setup is shown', () => {
    expect(useProfile.getState().audience).toBeNull();
    expect(useProfile.getState().trackers).toEqual([]);
  });

  it('applies defaults when an audience is chosen and allows changes', () => {
    useProfile.getState().chooseAudience('men');
    expect(useProfile.getState().trackers).toEqual(['water', 'mood', 'nutrition']);
    useProfile.getState().toggleTracker('cycle');
    expect(useProfile.getState().trackers).toContain('cycle');
  });

  it('resets defaults when switching audience', () => {
    useProfile.getState().chooseAudience('men');
    useProfile.getState().chooseAudience('women');
    expect(useProfile.getState().trackers).toContain('pregnancy');
  });
});
