import { useAchievements } from '@/features/achievements/store';
import { useConsent } from '@/features/consent/store';
import { useProfile } from '@/features/profile/store';
import { useRequirements } from '@/features/requirements/store';
import { addDaysKey } from '@/lib/time/days';
import { deviceTimeZone } from '@/lib/time/device';
import { localDateKey } from '@/lib/time/zoned';
import { fireEvent, render, screen } from '@/test-utils';

import { PregnancyScreen } from '..';
import { BagScreen } from '../screens/BagScreen';
import { KicksScreen } from '../screens/KicksScreen';
import { SymptomsScreen } from '../screens/SymptomsScreen';
import { WeightScreen } from '../screens/WeightScreen';
import { usePregnancy } from '../store';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
  Stack: { Screen: () => null },
}));

const today = () => localDateKey(new Date(), deviceTimeZone());

beforeEach(() => {
  usePregnancy.getState().reset();
  useRequirements.getState().reset();
  useAchievements.getState().reset();
  useProfile.getState().chooseAudience('women');
  useConsent.getState().decide('pregnancy', true);
});

describe('PregnancyScreen', () => {
  it('works out a due date from the last period, labelled as an estimate', async () => {
    await render(<PregnancyScreen />);
    expect(screen.getByText(/does not provide medical advice/i)).toBeTruthy();
    const lmp = addDaysKey(today(), -70);
    const [y, m, d] = lmp.split('-');
    const field = screen.getByLabelText(/First day of your last period/);
    // The test region decides the date order, so try the typed date both ways.
    await fireEvent.changeText(field, `${d}/${m}/${y}`);
    if (!screen.queryByText(/Estimated due date:/))
      await fireEvent.changeText(field, `${m}/${d}/${y}`);
    expect(screen.getByText(/This is an estimate/)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Use this due date' }));
    expect(useRequirements.getState().dueDate).toBe(addDaysKey(lmp, 280));
    expect(await screen.findByText('10 weeks, 0 days')).toBeTruthy();
    expect(screen.getByText('Week 10')).toBeTruthy();
    expect(screen.getByText(/Sources: ACOG, NHS/)).toBeTruthy();
  });

  it('always shows the urgent warning signs', async () => {
    useRequirements.getState().setValue('dueDate', addDaysKey(today(), 100));
    await render(<PregnancyScreen />);
    expect(screen.getByText('Get help straight away if you have')).toBeTruthy();
    expect(screen.getByText(/call 112 in India or 911 in the USA/)).toBeTruthy();
  });

  it('stops tracking quietly and can delete the data', async () => {
    useRequirements.getState().setValue('dueDate', addDaysKey(today(), 100));
    await render(<PregnancyScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Stop tracking' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Yes, stop tracking' }));
    expect(usePregnancy.getState().status).toBe('ended');
    expect(await screen.findByText('Pregnancy tracking is off')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Delete pregnancy data' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Delete now' }));
    expect(useRequirements.getState().dueDate).toBeNull();
    expect(usePregnancy.getState().status).toBe('active');
  });
});

describe('pregnancy tools', () => {
  it('shows "get help now" for an urgent symptom', async () => {
    await render(<SymptomsScreen />);
    await fireEvent.press(
      screen.getByRole('checkbox', { name: 'The baby moving less than usual' }),
    );
    expect(screen.getByText('Please get help now')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    expect(usePregnancy.getState().symptoms[0]?.symptoms).toEqual(['fewerMovements']);
  });

  it('shows support lines when a note mentions self-harm', async () => {
    await render(<SymptomsScreen />);
    await fireEvent.changeText(screen.getByLabelText('Note (optional)'), 'I want to end my life');
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByRole('button', { name: 'Call 14416' })).toBeTruthy();
  });

  it('counts kicks in a session and records it', async () => {
    useRequirements.getState().setValue('dueDate', addDaysKey(today(), 70));
    await render(<KicksScreen />);
    expect(screen.getByText(/Don't wait until the next day/)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Start counting' }));
    for (let i = 0; i < 3; i++) {
      await fireEvent.press(screen.getByRole('button', { name: /Add a movement/ }));
    }
    await fireEvent.press(screen.getByRole('button', { name: 'Finish session' }));
    expect(usePregnancy.getState().kicks[0]).toMatchObject({ count: 3 });
    expect(useAchievements.getState().activity.counts.kick_session).toBe(1);
  });

  it('logs weight without any target, and rejects typos', async () => {
    await render(<WeightScreen />);
    expect(screen.getByText(/There are no targets here/)).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText(/Today's weight/), '6');
    await fireEvent.press(screen.getByRole('button', { name: 'Save weight' }));
    expect(usePregnancy.getState().weights).toHaveLength(0);
    await fireEvent.changeText(screen.getByLabelText(/Today's weight/), '150');
    await fireEvent.press(screen.getByRole('button', { name: 'Save weight' }));
    expect(usePregnancy.getState().weights).toHaveLength(1);
    const events = Object.keys(useAchievements.getState().activity.counts);
    expect(events.some((e) => e.includes('weight'))).toBe(false);
  });

  it('marks the hospital bag packed once every item is ticked', async () => {
    await render(<BagScreen />);
    expect(screen.getByText('0 of 15 packed')).toBeTruthy();
    for (const box of screen.getAllByRole('checkbox')) await fireEvent.press(box);
    expect(screen.getByText('15 of 15 packed')).toBeTruthy();
    expect(useAchievements.getState().activity.counts.hospital_bag_packed).toBe(1);
  });
});
