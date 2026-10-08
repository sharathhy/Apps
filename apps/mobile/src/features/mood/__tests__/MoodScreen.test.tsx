import { useAchievements } from '@/features/achievements/store';
import { useConsent } from '@/features/consent/store';
import { useProfile } from '@/features/profile/store';
import { fireEvent, render, screen } from '@/test-utils';

import { MoodScreen } from '..';
import { finishBreathing } from '../actions';
import { JournalEntryScreen } from '../screens/JournalEntryScreen';
import { useMood } from '../store';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
  Stack: { Screen: () => null },
  useLocalSearchParams: () => ({ id: 'new' }),
}));

beforeEach(() => {
  useMood.getState().reset();
  useAchievements.getState().reset();
  useProfile.getState().chooseAudience('everyone');
  useConsent.getState().decide('mood', true);
});

describe('MoodScreen', () => {
  it('saves a check-in with tags and a note', async () => {
    await render(<MoodScreen />);
    expect(screen.getByText(/does not provide medical advice/i)).toBeTruthy();
    await fireEvent.press(screen.getByRole('radio', { name: 'Good' }));
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Grateful' }));
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Outdoors' }));
    await fireEvent.changeText(screen.getByLabelText('Note (optional)'), 'A walk in the park');
    await fireEvent.press(screen.getByRole('button', { name: 'Save check-in' }));
    const [entry] = useMood.getState().entries;
    expect(entry).toMatchObject({
      mood: 4,
      tags: ['grateful', 'outdoors'],
      note: 'A walk in the park',
    });
    expect(await screen.findByText('Check-in saved.')).toBeTruthy();
    expect(useAchievements.getState().activity.counts.mood_check_in).toBe(1);
    expect(screen.queryByText('Support is available')).toBeNull();
  });

  it('shows Tele-MANAS and 988 when a note mentions self-harm', async () => {
    await render(<MoodScreen />);
    await fireEvent.press(screen.getByRole('radio', { name: 'Very low' }));
    await fireEvent.changeText(screen.getByLabelText('Note (optional)'), 'I want to die');
    await fireEvent.press(screen.getByRole('button', { name: 'Save check-in' }));
    expect(await screen.findByText('Support is available')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Call 14416' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Call 988' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Text 988' })).toBeTruthy();
  });
});

describe('Journal', () => {
  it('shows support lines while writing about self-harm, and saves the entry', async () => {
    await render(<JournalEntryScreen />);
    const field = screen.getByLabelText(/\?$/); // labelled with today's prompt
    await fireEvent.changeText(field, 'Today I thought about hurting myself');
    expect(screen.getByText('Support is available')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    expect(useMood.getState().journal).toHaveLength(1);
    expect(useAchievements.getState().activity.counts.journal_entry).toBe(1);
  });
});

describe('breathing sessions', () => {
  it('only counts sessions of at least a minute', async () => {
    expect(await finishBreathing('box', 30)).toBeNull();
    expect(await finishBreathing('box', 180)).toMatchObject({
      pattern: 'box',
      durationSeconds: 180,
    });
    expect(useMood.getState().breathing).toHaveLength(1);
    expect(useAchievements.getState().earned.map((e) => e.id)).toContain('breath_first');
  });
});
