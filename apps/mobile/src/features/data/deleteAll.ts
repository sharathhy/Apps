import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { deleteServerAccount } from '@/features/account/api';

import { persistedStores } from './stores';

/**
 * Permanently removes everything: the account and its rows and files on the
 * server (when signed in), every scheduled notification, and all on-device
 * data. Server deletion runs first so a failure leaves the device intact and
 * the person can try again.
 */
export async function deleteAllData(): Promise<void> {
  await deleteServerAccount();

  if (Platform.OS !== 'web') {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.dismissAllNotificationsAsync();
  }

  // Reset in memory first (which persists empty defaults), then remove the
  // stored copies so nothing at all is left on the device.
  for (const store of Object.values(persistedStores)) {
    (store.getState() as { reset: () => void }).reset();
  }
  const keys = Object.values(persistedStores).map((store) => store.persist.getOptions().name);
  await AsyncStorage.multiRemove(keys.filter((k): k is string => !!k));
}
