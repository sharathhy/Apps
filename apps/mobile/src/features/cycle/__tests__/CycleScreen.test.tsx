import { useAchievements } from '@/features/achievements/store';
import { useConsent } from '@/features/consent/store';
import { useProfile } from '@/features/profile/store';
import { useRequirements } from '@/features/requirements/store';
import { getLocales } from 'expo-localization';

import { formatDateKey, regionDefaults } from '@/lib/region';
import { addDaysKey } from '@/lib/time/days';
import { deviceTimeZone } from '@/lib/time/device';
import { localDateKey } from '@/lib/time/zoned';
import { fireEvent, render, screen } from '@/test-utils';

import { CycleScreen } from '..';
import { useCycle } from '../store';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

const today = () => localDateKey(new Date(), deviceTimeZone());

beforeEach(() => {
  useCycle.getState().reset();
  useRequirements.getState().reset();
  useAchievements.getState().reset();
  useProfile.getState().chooseAudience('women');
  useConsent.getState().decide('cycle', true);
});

describe('CycleScreen', () => {
  it('asks for the last period first and shows the disclaimer', async () => {
    await render(<CycleScreen />);
    expect(screen.getByText(/does not provide medical advice/i)).toBeTruthy();
    expect(screen.getByText(/log the first day of a period/i)).toBeTruthy();
  });

  it('shows estimates labelled as estimates and never as contraception', async () => {
    useRequirements.getState().setValue('lastPeriodStart', addDaysKey(today(), -9));
    await render(<CycleScreen />);
    expect(screen.getByText('Day 10 of your cycle')).toBeTruthy();
    expect(screen.getByText(/Next period estimated around .*, in 19 days\./)).toBeTruthy();
    expect(screen.getByText(/Estimated fertile window/)).toBeTruthy();
    expect(screen.getByText(/Not a form of contraception/)).toBeTruthy();
  });

  it('logs a period start and end, and a day with flow and symptoms', async () => {
    await render(<CycleScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'My period started today' }));
    expect(useCycle.getState().periods[0]?.start).toBe(today());
    expect(useRequirements.getState().lastPeriodStart).toBe(today());
    expect(useAchievements.getState().activity.counts.period_logged).toBe(1);
    expect(await screen.findByText('Day 1 of your cycle')).toBeTruthy();

    await fireEvent.press(screen.getByRole('radio', { name: 'Heavy' }));
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Cramps' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Save day' }));
    expect(useCycle.getState().logs[today()]).toMatchObject({
      flow: 'heavy',
      symptoms: ['cramps'],
    });
    expect(await screen.findByText('Day saved.')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'My period ended today' }));
    expect(useCycle.getState().periods[0]?.end).toBe(today());
  });

  it('adds an earlier start typed in the regional format and rejects future dates', async () => {
    await render(<CycleScreen />);
    const field = screen.getByLabelText(/Add an earlier period start/);
    const future = addDaysKey(today(), 3);
    const { dateOrder } = regionDefaults(getLocales()[0]?.regionCode);
    await fireEvent.changeText(field, formatDateKey(future, dateOrder));
    await fireEvent.press(screen.getByRole('button', { name: 'Add start date' }));
    expect(await screen.findByText("This date can't be in the future")).toBeTruthy();
    expect(useCycle.getState().periods).toHaveLength(0);
  });

  it('deletes a period and clears the setup date with it', async () => {
    useRequirements.getState().setValue('lastPeriodStart', addDaysKey(today(), -3));
    await render(<CycleScreen />);
    await fireEvent.press(screen.getByRole('button', { name: /Delete the period that started/ }));
    expect(useRequirements.getState().lastPeriodStart).toBeNull();
  });
});
