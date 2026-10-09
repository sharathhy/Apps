import * as Notifications from 'expo-notifications';
import { router, type Href } from 'expo-router';
import { AppState, Platform } from 'react-native';

import { useAchievements } from '@/features/achievements/store';
import { useConsent } from '@/features/consent/store';
import { cycleStats, periodStarts, predictCycle } from '@/features/cycle/model';
import { useCycle } from '@/features/cycle/store';
import { usePregnancy } from '@/features/pregnancy/store';
import { activeModules } from '@/features/profile/activeModules';
import { useProfile } from '@/features/profile/store';
import { missingRequirements, nextRequirementNotice } from '@/features/requirements/definitions';
import { useRequirements } from '@/features/requirements/store';
import { totalForDay } from '@/features/water/model';
import { useWater } from '@/features/water/store';
import i18n from '@/i18n';
import { supabase } from '@/lib/supabase';
import { deviceTimeZone } from '@/lib/time/device';
import { addDaysKey } from '@/lib/time/days';
import { fromLocal, localDateKey, parseDateKey } from '@/lib/time/zoned';

import { pushNotificationData, restoreNotificationData } from './accountSync';
import { notificationContent } from './content';
import {
  applySchedule,
  configureForegroundPresentation,
  ensureChannel,
  getPermission,
  registerCategories,
  SCHEDULE_PREFIX,
  supportsDeviceNotifications,
  type NotificationData,
} from './device';
import { useInbox } from './inboxStore';
import { planNotifications, type Plan, type PlanInput } from './planner';
import { useNotificationPrefs } from './prefsStore';
import type { Reminder, ReminderKind } from './reminders';
import { useReminders } from './remindersStore';
import { endOfLocalDay, spreadTimes } from './smart';
import { snoozeOptions, snoozeUntil, type SnoozeOption } from './snooze';

const REQUIREMENT_REMINDER_ID = 'requirement';
export const WATER_SMART_ID = 'water-smart';
/** Smart water reminders wait this long after a drink is logged. */
const SMART_GAP_MS = 60 * 60_000;
const SMART_COUNT = 5;

/** Smart water reminders and when they should hold back (recent drink or goal met). */
function waterSmart(now: Date, timeZone: string) {
  const water = useWater.getState();
  if (!water.smartReminders) return { reminders: [] as Reminder[], hold: undefined };
  const reminder: Reminder = {
    id: WATER_SMART_ID,
    module: 'water',
    kind: 'smart',
    templateKey: 'water.drink',
    times: spreadTimes(water.activeStart, water.activeEnd, SMART_COUNT),
    weekdays: [],
    timezone: timeZone,
    enabled: true,
    snoozedUntil: water.smartSnoozedUntil,
    updatedAt: now.toISOString(),
  };
  const today = localDateKey(now, timeZone);
  const goal = useRequirements.getState().waterGoalMl;
  const last = water.entries[0] ? new Date(water.entries[0].at).getTime() + SMART_GAP_MS : 0;
  const goalMet = goal !== null && totalForDay(water.entries, today) >= goal;
  const holdMs = Math.max(last, goalMet ? endOfLocalDay(now, timeZone).getTime() : 0);
  return { reminders: [reminder], hold: holdMs > now.getTime() ? new Date(holdMs) : undefined };
}

type OneOff = NonNullable<PlanInput['oneOffs']>[number];

export const PERIOD_SOON_ID = 'cycle-period-soon';
/** The period reminder goes out this many days before the earliest estimated start, at 09:00. */
const PERIOD_SOON_DAYS = 2;

/** One-off reminder before the estimated next period, when turned on. */
function periodSoon(now: Date, timeZone: string, modules: readonly string[]): OneOff[] {
  const cycle = useCycle.getState();
  if (!cycle.periodReminder || !modules.includes('cycle')) return [];
  const today = localDateKey(now, timeZone);
  const starts = periodStarts(cycle.periods, useRequirements.getState().lastPeriodStart);
  const prediction = predictCycle(starts, cycleStats(starts, cycle.periods), today);
  if (!prediction) return [];
  const day = parseDateKey(addDaysKey(prediction.nextRange.from, -PERIOD_SOON_DAYS))!;
  const fireAt = fromLocal({ ...day, hour: 9, minute: 0 }, timeZone);
  if (fireAt <= now) return [];
  return [
    {
      reminderId: PERIOD_SOON_ID,
      module: 'cycle',
      kind: 'scheduled',
      templateKey: 'cycle.periodSoon',
      fireAt,
    },
  ];
}

export const APPOINTMENT_PREFIX = 'appointment:';
/** Appointment reminders go out the evening before, or two hours before when that has passed. */
const APPOINTMENT_EVENING_HOUR = 18;
const APPOINTMENT_LEAD_MS = 2 * 60 * 60_000;

function appointmentReminders(now: Date, timeZone: string, modules: readonly string[]): OneOff[] {
  const pregnancy = usePregnancy.getState();
  if (!modules.includes('pregnancy')) return [];
  return pregnancy.appointments.flatMap((a) => {
    const at = new Date(a.at);
    if (!a.remind || at <= now) return [];
    const dayBefore = parseDateKey(addDaysKey(localDateKey(at, timeZone), -1))!;
    let fireAt = fromLocal({ ...dayBefore, hour: APPOINTMENT_EVENING_HOUR, minute: 0 }, timeZone);
    if (fireAt <= now) fireAt = new Date(at.getTime() - APPOINTMENT_LEAD_MS);
    if (fireAt <= now) return [];
    return [
      {
        reminderId: `${APPOINTMENT_PREFIX}${a.id}`,
        module: 'pregnancy' as const,
        kind: 'scheduled' as const,
        templateKey: 'pregnancy.appointment',
        fireAt,
      },
    ];
  });
}

/**
 * Re-plans every local notification and hands the result to the OS. Safe to
 * call often: unchanged notifications are left alone. Runs on start, on
 * return to the foreground (which covers time zone changes, a device
 * restart and a new day), after a reinstall restore, and on any change to
 * reminders or settings.
 */
export async function syncSchedule(now = new Date()): Promise<Plan> {
  const timeZone = deviceTimeZone();
  const prefs = useNotificationPrefs.getState();
  // Ending pregnancy tracking quietly stops every pregnancy notification.
  const modules = activeModules().filter(
    (m) => m !== 'pregnancy' || usePregnancy.getState().status === 'active',
  );
  const req = useRequirements.getState();

  const notice = nextRequirementNotice({
    missing: missingRequirements(req, modules),
    promptSeenAt: req.promptSeenAt,
    lastNoticeAt: req.lastNoticeAt,
    now,
    timeZone,
  });

  const smart = waterSmart(now, timeZone);
  const plan = planNotifications({
    reminders: [...useReminders.getState().reminders, ...smart.reminders],
    smartHoldUntil: smart.hold ? { water: smart.hold } : undefined,
    prefs,
    now,
    timeZone,
    visibleModules: modules,
    shownPerDay: useInbox.getState().shownPerDay,
    oneOffs: [
      ...(notice
        ? [
            {
              reminderId: REQUIREMENT_REMINDER_ID,
              module: notice.requirement.module,
              kind: 'requirement' as const,
              templateKey: `requirement.${notice.requirement.id}`,
              fireAt: notice.fireAt,
            },
          ]
        : []),
      ...periodSoon(now, timeZone, modules),
      ...appointmentReminders(now, timeZone, modules),
    ],
  });

  const planned = plan.planned.find((p) => p.reminderId === REQUIREMENT_REMINDER_ID);
  if (planned && req.lastNoticeAt !== planned.fireAt.toISOString()) {
    req.setLastNoticeAt(planned.fireAt.toISOString());
  }

  if (supportsDeviceNotifications) {
    const permission = await getPermission();
    const allowed = permission === 'granted' || permission === 'provisional';
    await applySchedule(allowed ? plan.planned : [], (item) =>
      notificationContent(item, prefs.lockScreenPrivate, i18n.t),
    );
  }
  return plan;
}

export function snoozeReminder(reminderId: string, option: SnoozeOption, now = new Date()) {
  if (reminderId === WATER_SMART_ID) {
    useWater.getState().snoozeSmart(snoozeUntil(option, now, deviceTimeZone()));
    return;
  }
  const reminders = useReminders.getState();
  if (!reminders.reminders.some((r) => r.id === reminderId)) return;
  reminders.snooze(reminderId, snoozeUntil(option, now, deviceTimeZone()), now);
}

function hrefFor(data: NotificationData): Href {
  if (data.href) return data.href as Href;
  if (data.module) return `/${data.module}` as Href;
  return '/notifications';
}

/** Adds a delivered OS notification to the notification center (once) and counts it for the daily limit. */
function recordDelivered(notification: Notifications.Notification) {
  const { identifier, content } = notification.request;
  if (!identifier.startsWith(SCHEDULE_PREFIX)) return;
  const data = (content.data ?? {}) as NotificationData;
  const inbox = useInbox.getState();
  if (inbox.items.some((i) => i.sourceId === identifier)) return;
  const kind = (data.kind as ReminderKind) ?? 'scheduled';
  const module = (data.module as never) ?? null;
  inbox.add(
    {
      type: kind,
      module,
      titleKey: module ? `modules.${module}.title` : 'app.name',
      bodyKey:
        kind === 'requirement' ? 'notificationText.requirementInbox' : 'notificationText.private',
      href: data.module ? `/${data.module}` : undefined,
      reminderId: data.reminderId,
      sourceId: identifier,
    },
    new Date(notification.date),
  );
  inbox.countShown(localDateKey(new Date(notification.date), deviceTimeZone()));
  void logDelivery(kind, module);
}

/**
 * Anonymous delivery log: type, tracker, platform and outcome only. No user
 * id and no message text. Only written with the analytics consent.
 */
async function logDelivery(type: string, module: string | null) {
  if (!supabase || !useConsent.getState().isGranted('anonymous_analytics')) return;
  const { data } = await supabase.auth.getSession();
  if (!data.session) return;
  await supabase
    .from('notification_log')
    .insert({ type, module, platform: Platform.OS, outcome: 'delivered' });
}

async function collectPresented() {
  if (!supportsDeviceNotifications) return;
  for (const n of await Notifications.getPresentedNotificationsAsync()) recordDelivered(n);
}

function handleResponse(response: Notifications.NotificationResponse) {
  const data = (response.notification.request.content.data ?? {}) as NotificationData;
  recordDelivered(response.notification);
  const action = response.actionIdentifier;
  if (action.startsWith('snooze:') && data.reminderId) {
    const option = action.slice('snooze:'.length) as SnoozeOption;
    if (snoozeOptions.includes(option)) snoozeReminder(data.reminderId, option);
    return;
  }
  router.push(hrefFor(data));
}

/**
 * Starts everything notification-related. Call once, after the stores have
 * loaded. Returns a cleanup function.
 */
export function startNotificationService(): () => void {
  const cleanups: (() => void)[] = [];
  let timer: ReturnType<typeof setTimeout> | undefined;
  const scheduleSync = () => {
    clearTimeout(timer);
    timer = setTimeout(() => void syncSchedule().catch(() => undefined), 300);
  };

  if (supportsDeviceNotifications) {
    configureForegroundPresentation();
    void ensureChannel();
    void registerCategories({
      '10m': i18n.t('notifications.snooze.10m'),
      '1h': i18n.t('notifications.snooze.1h'),
      tomorrow: i18n.t('notifications.snooze.tomorrow'),
    });
    const received = Notifications.addNotificationReceivedListener(recordDelivered);
    const responded = Notifications.addNotificationResponseReceivedListener(handleResponse);
    cleanups.push(
      () => received.remove(),
      () => responded.remove(),
    );
    // A tap that launched the app from a closed state.
    const last = Notifications.getLastNotificationResponse();
    if (last) {
      Notifications.clearLastNotificationResponse();
      // Let the navigator mount before following the tap.
      setTimeout(() => handleResponse(last), 0);
    }
  }

  // Restore from the account first (a reinstall has empty local data), then plan.
  void restoreNotificationData()
    .catch(() => undefined)
    .finally(() => {
      void collectPresented();
      scheduleSync();
    });

  const appState = AppState.addEventListener('change', (state) => {
    if (state !== 'active') return;
    void collectPresented();
    scheduleSync();
  });
  cleanups.push(() => appState.remove());

  let pushTimer: ReturnType<typeof setTimeout> | undefined;
  const onDataChange = () => {
    scheduleSync();
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => void pushNotificationData().catch(() => undefined), 2000);
  };
  for (const store of [useReminders, useNotificationPrefs, useAchievements]) {
    cleanups.push(store.subscribe(onDataChange));
  }
  for (const store of [useProfile, useConsent, useRequirements, useWater, useCycle, usePregnancy]) {
    cleanups.push(store.subscribe(scheduleSync));
  }

  return () => {
    clearTimeout(timer);
    clearTimeout(pushTimer);
    cleanups.forEach((c) => c());
  };
}
