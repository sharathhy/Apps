/**
 * An in-memory stand-in for expo-notifications, so tests can check exactly
 * what would be scheduled with the OS. Use with:
 *   jest.mock('expo-notifications', () => require('@/test/fakeNotifications').fake);
 */
type Request = { identifier: string; content: Record<string, unknown>; trigger: unknown };

const scheduled = new Map<string, Request>();
const presented: unknown[] = [];
let permission = { granted: true, canAskAgain: true, status: 'granted' };

export const fake = {
  SchedulableTriggerInputTypes: { DATE: 'date' },
  IosAuthorizationStatus: { PROVISIONAL: 3 },
  AndroidImportance: { DEFAULT: 3 },
  AndroidNotificationVisibility: { PRIVATE: 0 },
  getPermissionsAsync: jest.fn(async () => permission),
  requestPermissionsAsync: jest.fn(async () => permission),
  setNotificationChannelAsync: jest.fn(async () => null),
  setNotificationCategoryAsync: jest.fn(async () => null),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  getLastNotificationResponse: jest.fn(() => null),
  clearLastNotificationResponse: jest.fn(),
  getPresentedNotificationsAsync: jest.fn(async () => presented),
  getAllScheduledNotificationsAsync: jest.fn(async () => [...scheduled.values()]),
  scheduleNotificationAsync: jest.fn(async (request: Request) => {
    const identifier = request.identifier ?? `now-${scheduled.size}`;
    if (request.trigger && typeof request.trigger === 'object' && 'date' in request.trigger) {
      scheduled.set(identifier, { ...request, identifier });
    } else {
      presented.push({ request: { ...request, identifier }, date: Date.now() });
    }
    return identifier;
  }),
  cancelScheduledNotificationAsync: jest.fn(async (id: string) => {
    scheduled.delete(id);
  }),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => scheduled.clear()),
  dismissAllNotificationsAsync: jest.fn(async () => {
    presented.length = 0;
  }),
};

export const fakeState = {
  scheduled,
  presented,
  setPermission(granted: boolean) {
    permission = { granted, canAskAgain: !granted, status: granted ? 'granted' : 'denied' };
  },
  /** What a reinstall does to the OS: every scheduled notification is gone. */
  wipe() {
    scheduled.clear();
    presented.length = 0;
  },
};
