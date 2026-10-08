import { useAchievements } from '@/features/achievements/store';
import { useConsent } from '@/features/consent/store';
import { useProfile } from '@/features/profile/store';
import { useRequirements } from '@/features/requirements/store';
import { fireEvent, render, screen } from '@/test-utils';

import { WaterScreen } from '..';
import { useWater } from '../store';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/lib/useRegion', () => ({
  useRegion: () => ({ region: 'IN', units: 'metric', dateOrder: 'DMY', currency: 'INR' }),
}));

beforeEach(() => {
  useWater.getState().reset();
  useRequirements.getState().reset();
  useAchievements.getState().reset();
  useProfile.getState().chooseAudience('men');
  useConsent.getState().decide('water', true);
});

describe('WaterScreen', () => {
  it('asks for a goal first and shows the disclaimer', async () => {
    await render(<WaterScreen />);
    expect(screen.getByText('Set your daily water goal')).toBeTruthy();
    expect(screen.getByText(/does not provide medical advice/i)).toBeTruthy();
  });

  it('quick-adds a drink, reaches the goal and earns achievements', async () => {
    useRequirements.getState().setValue('waterGoalMl', 1000);
    await render(<WaterScreen />);
    await fireEvent.press(screen.getByLabelText('Add 500 ml of Water'));
    await fireEvent.press(screen.getByRole('radio', { name: 'Tea' }));
    await fireEvent.press(screen.getByLabelText('Add 500 ml of Tea'));
    expect(useWater.getState().entries.map((e) => e.drink)).toEqual(['tea', 'water']);
    expect(await screen.findByText('You reached your goal today')).toBeTruthy();
    const counts = useAchievements.getState().activity.counts;
    expect(counts.water_goal_met).toBe(1);
    expect(useAchievements.getState().earned.map((e) => e.id)).toContain('first_entry');
  });

  it('deletes an entry and can undo it', async () => {
    await render(<WaterScreen />);
    await fireEvent.press(screen.getByLabelText('Add 250 ml of Water'));
    await fireEvent.press(await screen.findByLabelText('Delete 250 ml of Water'));
    expect(useWater.getState().entries).toHaveLength(0);
    await fireEvent.press(screen.getByRole('button', { name: 'Undo' }));
    expect(useWater.getState().entries).toHaveLength(1);
  });

  it('rejects unrealistic custom amounts', async () => {
    await render(<WaterScreen />);
    await fireEvent.changeText(screen.getByLabelText('Other amount (ml)'), '9000');
    // The goal prompt also has an "Add" button; the custom amount one comes last.
    await fireEvent.press(screen.getAllByRole('button', { name: 'Add' }).at(-1)!);
    expect(screen.getByText('Enter an amount up to 5 litres')).toBeTruthy();
    expect(useWater.getState().entries).toHaveLength(0);
  });
});
