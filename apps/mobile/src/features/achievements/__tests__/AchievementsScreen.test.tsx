import { useConsent } from '@/features/consent/store';
import { useProfile } from '@/features/profile/store';
import { render, screen } from '@/test-utils';

import { AchievementsScreen } from '../screens/AchievementsScreen';
import { useAchievements } from '../store';

jest.mock('expo-router', () => ({ Stack: { Screen: () => null } }));

beforeEach(() => {
  useAchievements.getState().reset();
  useConsent.getState().reset();
  useProfile.getState().chooseAudience('men');
});

describe('AchievementsScreen', () => {
  it('shows earned achievements with their date and hides women-only ones for men', async () => {
    useAchievements.getState().markEarned(['welcome'], new Date('2026-10-08T10:00:00Z'));
    await render(<AchievementsScreen />);
    expect(screen.getByText('Welcome aboard')).toBeTruthy();
    expect(screen.getByText(/Earned/)).toBeTruthy();
    expect(screen.getAllByText('Not earned yet').length).toBeGreaterThan(0);
    expect(screen.queryByText('Cycle insight')).toBeNull();
    expect(screen.queryByText('First count')).toBeNull();
  });

  it('uses no countdown or pressure wording', async () => {
    await render(<AchievementsScreen />);
    const text = JSON.stringify(screen.toJSON());
    expect(text).not.toMatch(/only \d+ (more|left)|don't lose|hurry|last chance|you missed/i);
  });
});
