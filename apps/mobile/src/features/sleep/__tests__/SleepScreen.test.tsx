import { useAchievements } from '@/features/achievements/store';
import { useConsent } from '@/features/consent/store';
import { useProfile } from '@/features/profile/store';
import { fireEvent, render, screen } from '@/test-utils';

import { SleepScreen } from '..';
import { durationMinutes } from '../model';
import { useSleep } from '../store';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

beforeEach(() => {
  useSleep.getState().reset();
  useAchievements.getState().reset();
  useProfile.getState().chooseAudience('men');
  useConsent.getState().decide('sleep', true);
});

describe('SleepScreen', () => {
  it('logs last night with the default times and quality', async () => {
    await render(<SleepScreen />);
    expect(screen.getByText(/does not provide medical advice/i)).toBeTruthy();
    expect(screen.getByText('About 8 h 0 min in bed')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Went to bed: 15 minutes later'));
    await fireEvent.press(screen.getByRole('radio', { name: 'Rested' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Save night' }));
    const [night] = useSleep.getState().entries;
    expect(durationMinutes(night!)).toBe(465);
    expect(night!.quality).toBe(4);
    expect(await screen.findByText('Night saved.')).toBeTruthy();
    expect(useAchievements.getState().activity.counts.sleep_logged).toBe(1);
  });

  it('replaces a night logged twice for the same morning', async () => {
    await render(<SleepScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Save night' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Save night' }));
    expect(useSleep.getState().entries).toHaveLength(1);
  });
});
