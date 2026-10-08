import { useProfile } from '@/features/profile/store';
import { fakeState } from '@/test/fakeNotifications';
import { fireEvent, render, screen } from '@/test-utils';

import { useNotificationPrefs } from '../prefsStore';
import { NotificationSettingsScreen } from '../screens/NotificationSettingsScreen';

// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('expo-notifications', () => require('@/test/fakeNotifications').fake);
jest.mock('expo-router', () => ({ router: { push: jest.fn() }, Stack: { Screen: () => null } }));

beforeEach(() => {
  useNotificationPrefs.getState().reset();
  useProfile.getState().chooseAudience('women');
  fakeState.setPermission(true);
});

describe('NotificationSettingsScreen', () => {
  it('starts with everything off and the types disabled', async () => {
    await render(<NotificationSettingsScreen />);
    const master = screen.getByLabelText('Allow notifications');
    expect(master.props.value).toBe(false);
    expect(screen.getByLabelText('Reminders').props.disabled).toBe(true);
  });

  it('turns on, then each type separately; system notices stay on', async () => {
    await render(<NotificationSettingsScreen />);
    await fireEvent(screen.getByLabelText('Allow notifications'), 'valueChange', true);
    expect(useNotificationPrefs.getState().enabled).toBe(true);
    await fireEvent(screen.getByLabelText('Reminders'), 'valueChange', true);
    expect(useNotificationPrefs.getState().types.scheduled).toBe(true);
    expect(useNotificationPrefs.getState().types.insight).toBe(false);
    expect(screen.getByLabelText('System notices').props.disabled).toBe(true);
  });

  it('keeps the daily limit between 1 and 5', async () => {
    await render(<NotificationSettingsScreen />);
    for (let i = 0; i < 4; i++) await fireEvent.press(screen.getByLabelText('More'));
    expect(useNotificationPrefs.getState().dailyLimit).toBe(5);
    expect(screen.getByLabelText('More').props.accessibilityState.disabled).toBe(true);
  });
});
