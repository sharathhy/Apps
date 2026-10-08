import { act, render, screen } from '@/test-utils';

import { RequirementPrompt } from '../components/RequirementPrompt';
import { useRequirements } from '../store';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

beforeEach(() => useRequirements.getState().reset());

describe('RequirementPrompt', () => {
  it('appears while the water goal is missing, explains why, and clears once entered', async () => {
    await render(<RequirementPrompt module="water" />);
    expect(screen.getByText('Set your daily water goal')).toBeTruthy();
    expect(screen.getByText(/lets the Water tracker show your progress/)).toBeTruthy();
    expect(useRequirements.getState().promptSeenAt.waterGoal).toBeDefined();

    await act(async () => useRequirements.getState().setValue('waterGoalMl', 2000));
    expect(screen.queryByText('Set your daily water goal')).toBeNull();
  });

  it('shows nothing for trackers with no requirements', async () => {
    await render(<RequirementPrompt module="mood" />);
    expect(screen.queryByText(/Set your|Add /)).toBeNull();
  });
});
