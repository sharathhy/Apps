import * as LocalAuthentication from 'expo-local-authentication';
import { Text } from 'react-native';

import { fireEvent, render, screen, waitFor } from '@/test-utils';

import { AppLockGate } from '../AppLockGate';
import { useAppLock } from '../store';

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(async () => true),
  isEnrolledAsync: jest.fn(async () => true),
  getEnrolledLevelAsync: jest.fn(async () => 2),
  authenticateAsync: jest.fn(async () => ({ success: true })),
}));

const authenticate = LocalAuthentication.authenticateAsync as jest.Mock;

beforeEach(() => {
  authenticate.mockClear();
  useAppLock.setState({ enabled: false, unlocked: false });
});

it('shows the app without a prompt when app lock is off', async () => {
  await render(
    <AppLockGate>
      <Text>Home</Text>
    </AppLockGate>,
  );
  expect(screen.getByText('Home')).toBeTruthy();
  expect(screen.queryByText('Unlock')).toBeNull();
  expect(authenticate).not.toHaveBeenCalled();
});

it('covers the app and asks once to unlock when app lock is on', async () => {
  authenticate.mockResolvedValueOnce({ success: false });
  useAppLock.setState({ enabled: true, unlocked: false });
  await render(
    <AppLockGate>
      <Text>Home</Text>
    </AppLockGate>,
  );
  await waitFor(() => expect(authenticate).toHaveBeenCalledTimes(1));
  expect(await screen.findByText(/try again/i)).toBeTruthy();

  await fireEvent.press(screen.getByText('Unlock'));
  await waitFor(() => expect(screen.queryByText('Unlock')).toBeNull());
  expect(useAppLock.getState().unlocked).toBe(true);
});

it('stays unlocked right after the person turns app lock on', () => {
  useAppLock.getState().setEnabled(true);
  expect(useAppLock.getState().unlocked).toBe(true);
});
