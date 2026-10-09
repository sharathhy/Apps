import AsyncStorage from '@react-native-async-storage/async-storage';

import { useConsent } from '@/features/consent/store';
import { useNotificationPrefs } from '@/features/notifications/prefsStore';
import { useProfile } from '@/features/profile/store';

import { deleteAllData } from '../deleteAll';
import { buildExport, collectDeviceData, exportFileName } from '../export';

jest.mock('expo-notifications', () => ({
  cancelAllScheduledNotificationsAsync: jest.fn(async () => undefined),
  dismissAllNotificationsAsync: jest.fn(async () => undefined),
}));

jest.mock('@/features/account/api', () => ({
  deleteServerAccount: jest.fn(async () => undefined),
}));

beforeEach(() => {
  useProfile.getState().reset();
  useConsent.getState().reset();
  useNotificationPrefs.getState().reset();
});

describe('data export', () => {
  it('includes every on-device store as plain data', () => {
    useProfile.getState().chooseAudience('women');
    useConsent.getState().decide('cycle', true, new Date('2026-10-08T10:00:00Z'));
    const device = collectDeviceData();

    expect(Object.keys(device).sort()).toEqual([
      'achievements',
      'appLock',
      'consent',
      'cycle',
      'mood',
      'notificationCenter',
      'notificationPreferences',
      'partner',
      'pregnancy',
      'profile',
      'reminders',
      'setupDetails',
      'sleep',
      'sync',
      'water',
    ]);
    expect(device.profile).toMatchObject({ audience: 'women' });
    expect(device.consent).toMatchObject({ records: { cycle: { granted: true } } });
    expect(JSON.stringify(device)).not.toContain('function');
  });

  it('wraps device and account data with format details', () => {
    const now = new Date('2026-10-08T10:00:00Z');
    const data = buildExport(collectDeviceData(), { water_logs: [{ amount_ml: 250 }] }, now);
    expect(data).toMatchObject({
      format: 'wellness-export',
      formatVersion: 1,
      exportedAt: '2026-10-08T10:00:00.000Z',
      account: { water_logs: [{ amount_ml: 250 }] },
    });
    expect(exportFileName(now)).toBe('wellness-export-2026-10-08.json');
  });
});

describe('deleteAllData', () => {
  it('deletes the server account, cancels notifications and wipes the device', async () => {
    const { deleteServerAccount } = jest.requireMock('@/features/account/api');
    const Notifications = jest.requireMock('expo-notifications');
    useProfile.getState().chooseAudience('men');
    useConsent.getState().decide('water', true);
    useNotificationPrefs.getState().setEnabled(true);
    await AsyncStorage.setItem('profile-v1', '{"state":{"audience":"men"}}');

    await deleteAllData();

    expect(deleteServerAccount).toHaveBeenCalled();
    expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    expect(await AsyncStorage.getItem('profile-v1')).toBeNull();
    expect(useProfile.getState().audience).toBeNull();
    expect(useConsent.getState().records).toEqual({});
    expect(useNotificationPrefs.getState().enabled).toBe(false);
  });

  it('keeps device data when server deletion fails, so the person can retry', async () => {
    const { deleteServerAccount } = jest.requireMock('@/features/account/api');
    deleteServerAccount.mockRejectedValueOnce(new Error('offline'));
    useProfile.getState().chooseAudience('women');

    await expect(deleteAllData()).rejects.toThrow('offline');
    expect(useProfile.getState().audience).toBe('women');
  });
});
