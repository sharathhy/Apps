import { useAchievements } from '@/features/achievements/store';
import { trackActivity } from '@/features/achievements/award';
import { useConsent } from '@/features/consent/store';
import { useProfile } from '@/features/profile/store';
import { useRequirements } from '@/features/requirements/store';
import { fakeState } from '@/test/fakeNotifications';

import { reminderToRow, restoreNotificationData } from '../accountSync';
import { useInbox } from '../inboxStore';
import { useNotificationPrefs } from '../prefsStore';
import { useReminders } from '../remindersStore';
import { snoozeReminder, syncSchedule } from '../service';

// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('expo-notifications', () => require('@/test/fakeNotifications').fake);
jest.mock('@/lib/time/device', () => ({ deviceTimeZone: () => 'Asia/Kolkata' }));

const serverRows: Record<string, unknown[]> = { reminders: [], achievements_earned: [] };
jest.mock('@/lib/supabase', () => ({
  get supabase() {
    const query = (table: string) => ({
      select: () => ({
        then: (resolve: (v: unknown) => void) =>
          resolve({ data: serverRows[table] ?? [], error: null }),
        maybeSingle: async () => ({ data: null, error: null }),
      }),
      upsert: async () => ({ error: null }),
      insert: async () => ({ error: null }),
      delete: () => ({ eq: async () => ({ error: null }) }),
    });
    return {
      auth: { getSession: async () => ({ data: { session: { user: { id: 'user-1' } } } }) },
      from: query,
    };
  },
  isBackendConfigured: true,
}));

const now = new Date('2026-10-08T00:00:00Z'); // 05:30 in India

function setUp() {
  fakeState.wipe();
  fakeState.setPermission(true);
  for (const store of [
    useProfile,
    useConsent,
    useNotificationPrefs,
    useReminders,
    useInbox,
    useAchievements,
    useRequirements,
  ]) {
    (store.getState() as { reset: () => void }).reset();
  }
  useProfile.getState().chooseAudience('women');
  useConsent.getState().decide('water', true);
  useConsent.getState().decide('mood', true);
  const prefs = useNotificationPrefs.getState();
  prefs.setEnabled(true);
  prefs.setType('scheduled', true);
  prefs.setType('requirement', true);
  prefs.setType('achievement', true);
}

const scheduledTimes = () =>
  [...fakeState.scheduled.values()]
    .map((r) => (r.trigger as { date: Date }).date.toISOString())
    .sort();

beforeEach(setUp);

describe('notification service', () => {
  it('schedules, edits and deletes a reminder', async () => {
    const r = useReminders
      .getState()
      .add({ module: 'water', times: ['08:00'], weekdays: [] }, 'Asia/Kolkata', now);
    await syncSchedule(now);
    expect(scheduledTimes()).toHaveLength(8); // today plus the next 7 days
    expect(scheduledTimes()[0]).toBe('2026-10-08T02:30:00.000Z');

    useReminders.getState().update(r.id, { times: ['09:00'] }, now);
    await syncSchedule(now);
    expect(scheduledTimes()[0]).toBe('2026-10-08T03:30:00.000Z');
    expect(scheduledTimes()).toHaveLength(8);

    useReminders.getState().remove(r.id);
    await syncSchedule(now);
    expect(fakeState.scheduled.size).toBe(0);
  });

  it('uses neutral, private wording by default', async () => {
    useReminders
      .getState()
      .add({ module: 'water', times: ['08:00'], weekdays: [] }, 'Asia/Kolkata', now);
    await syncSchedule(now);
    const [first] = [...fakeState.scheduled.values()];
    expect(first!.content).toMatchObject({ title: 'Wellness', body: 'Time for your check-in' });

    useNotificationPrefs.getState().setLockScreenPrivate(false);
    await syncSchedule(now);
    const bodies = new Set([...fakeState.scheduled.values()].map((r) => r.content.body));
    expect([...bodies]).toEqual(['Time for a glass of water']);
  });

  it('snoozes a reminder', async () => {
    const r = useReminders
      .getState()
      .add({ module: 'water', times: ['08:00'], weekdays: [] }, 'Asia/Kolkata', now);
    const at = new Date('2026-10-08T02:30:00Z');
    snoozeReminder(r.id, '10m', at);
    await syncSchedule(at);
    expect(scheduledTimes()[0]).toBe('2026-10-08T02:40:00.000Z');
  });

  it('schedules nothing without OS permission or when switched off', async () => {
    useReminders
      .getState()
      .add({ module: 'water', times: ['08:00'], weekdays: [] }, 'Asia/Kolkata', now);
    fakeState.setPermission(false);
    await syncSchedule(now);
    expect(fakeState.scheduled.size).toBe(0);

    fakeState.setPermission(true);
    useNotificationPrefs.getState().setEnabled(false);
    await syncSchedule(now);
    expect(fakeState.scheduled.size).toBe(0);
  });

  it('never schedules reminders for trackers without consent', async () => {
    useReminders
      .getState()
      .add({ module: 'cycle', times: ['08:00'], weekdays: [] }, 'Asia/Kolkata', now);
    await syncSchedule(now);
    expect(fakeState.scheduled.size).toBe(0);
  });

  it('restores reminders after a reinstall', async () => {
    const r = useReminders
      .getState()
      .add({ module: 'mood', times: ['20:00'], weekdays: [1, 3, 5] }, 'Asia/Kolkata', now);
    await syncSchedule(now);
    const before = scheduledTimes();
    serverRows.reminders = [{ ...reminderToRow(r), user_id: 'user-1' }];

    // Reinstall: the OS schedule and every local store are empty.
    fakeState.wipe();
    useReminders.getState().reset();
    expect(await restoreNotificationData()).toEqual({ reminders: 1 });
    await syncSchedule(now);
    expect(scheduledTimes()).toEqual(before);
    expect(useReminders.getState().reminders[0]).toMatchObject({ id: r.id, weekdays: [1, 3, 5] });
  });

  it('sends a weekly requirement notice only after the in-app prompt, and clears it', async () => {
    await syncSchedule(now);
    expect(fakeState.scheduled.size).toBe(0); // prompt not seen yet

    useRequirements.getState().markPromptSeen('waterGoal', now);
    await syncSchedule(now);
    expect(scheduledTimes()).toEqual(['2026-10-08T04:30:00.000Z']); // 10:00 IST

    useRequirements.getState().setValue('waterGoalMl', 2000);
    await syncSchedule(now);
    expect(fakeState.scheduled.size).toBe(0);
  });
});

describe('achievements', () => {
  it('earns an achievement once, adds it to the center and notifies once', async () => {
    const at = new Date('2026-10-08T06:00:00Z'); // 11:30 IST, outside quiet hours
    expect(await trackActivity('onboarding_complete', null, at)).toEqual(['welcome']);
    expect(await trackActivity('onboarding_complete', null, at)).toEqual([]);
    expect(useAchievements.getState().earned).toEqual([
      { id: 'welcome', earnedAt: at.toISOString(), notifiedAt: at.toISOString() },
    ]);
    expect(useInbox.getState().items).toHaveLength(1);
    expect(fakeState.presented).toHaveLength(1);
  });

  it('does not notify when achievement notifications are off', async () => {
    useNotificationPrefs.getState().setType('achievement', false);
    await trackActivity('onboarding_complete', null, new Date('2026-10-08T06:00:00Z'));
    expect(useAchievements.getState().earned[0]?.notifiedAt).toBeNull();
    expect(useInbox.getState().items).toHaveLength(1);
    expect(fakeState.presented).toHaveLength(0);
  });
});
