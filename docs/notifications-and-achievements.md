# Notifications and achievements reference

Every notification type, trigger, wording and default, and every achievement. The source of truth is the code; this page must be updated with it:

- Planner and rules: `apps/mobile/src/features/notifications/planner.ts`
- Wording: `apps/mobile/src/i18n/locales/{en,hi}.json` (`notificationText`, `notificationTypes`, `achievements`)
- Achievements: `apps/mobile/src/features/achievements/catalog.ts`
- Requirements: `apps/mobile/src/features/requirements/definitions.ts`

## Defaults

| Setting                    | Default                                     | Range or notes                                          |
| -------------------------- | ------------------------------------------- | ------------------------------------------------------- |
| All notifications (master) | **Off**                                     | Turned on only by the person, in onboarding or Settings |
| Each type                  | **Off**                                     | Switched separately                                     |
| Each tracker               | On (once the master switch and type are on) | Switched separately                                     |
| Quiet hours                | 22:00 to 07:00                              | 30-minute steps; may wrap past midnight                 |
| Daily limit                | 3                                           | 1 to 5                                                  |
| Lock-screen privacy        | **On**                                      | Hides all detail; see Wording                           |
| System notices             | Always on                                   | Shown in the notification center; cannot be turned off  |

The OS permission is requested only after the person has turned notifications on and has seen the list of types (onboarding step 4 or Settings → Notifications). Android 13+ shows the runtime prompt after the notification channel is created; iOS asks for alerts and sounds. If permission is denied, Settings explains this and links to the device settings. The web app has no OS notifications; everything appears in the notification center.

## Types

| Type        | Trigger                                                                                                     | Delivery                                           | Priority under the daily limit |
| ----------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------ |
| Scheduled   | A reminder at times the person chose, on chosen weekdays                                                    | Local notification, planned 7 days ahead           | 1 (kept first)                 |
| Requirement | A tracker is missing a detail it needs, after the in-app prompt has been seen                               | Local, 10:00 local time, at most once every 7 days | 2                              |
| Smart       | Water reminders spread across waking hours, held for an hour after a drink and stopped once the goal is met | Local                                              | 3                              |
| Insight     | Reserved for the weekly summary (opt-in)                                                                    | Local                                              | 4                              |
| Achievement | An achievement is earned                                                                                    | Shown immediately, **once per achievement**        | 5                              |
| System      | Account and security messages                                                                               | Notification center only                           | Not limited                    |

Two one-off scheduled reminders are planned from tracker data, under the same rules:

- **Period reminder** (Cycle, off until turned on): 09:00 local, two days before the earliest estimated start.
- **Appointment reminder** (Pregnancy, per appointment): 18:00 the evening before, or two hours before when that has passed.

Stopping pregnancy tracking removes every pregnancy notification at the next rebuild.

Push notifications are used only for server events: a partner gets "You have a new update in Wellness" when the person who invited them shares a change (at most once an hour, sent by the `notify-partners` function through the free Expo push service, only after the partner turns it on). Everything else is local.

### Rules applied to every notification

1. Nothing is sent unless the master switch, the type and the tracker are all on, and the person has consented to that tracker's data category.
2. Times inside quiet hours are skipped. A snoozed reminder that would end inside quiet hours is moved to the end of quiet hours.
3. At most the daily limit per local day, counting notifications already shown that day. When there are more, the higher-priority and then earlier ones are kept.
4. At most 48 notifications are scheduled at once (iOS allows 64).
5. Each reminder notification has snooze buttons: **10 minutes**, **1 hour** and **Tomorrow** (same wall-clock time the next day). Snoozing drops the regular times until the snooze ends.

### Time zones, DST and re-registration

Reminder times are local wall-clock times. The schedule is rebuilt from the stored reminders on every app start, every return to the foreground (which catches time zone changes, a new day and a device restart), after any change to reminders or settings, and after a restore from the account on reinstall. The rebuild only adds and cancels what changed.

- A time in the hour skipped when clocks go forward moves forward by the gap (02:30 becomes 03:30).
- A time in the hour repeated when clocks go back fires once, at the first occurrence.
- Reminders are stored in the `reminders` table when signed in, so a reinstall or a new phone gets them back.

These cases are covered by `src/lib/time/__tests__/zoned.test.ts`, `src/features/notifications/__tests__/planner.test.ts` and `service.test.ts`.

## Wording

All wording is neutral. No guilt, streak-loss warnings, countdowns or pressure.

| Situation                | Lock-screen privacy on (default)             | Privacy off: title / body                               |
| ------------------------ | -------------------------------------------- | ------------------------------------------------------- |
| Water reminder           | Wellness / Time for your check-in            | Water / Time for a glass of water                       |
| Mood reminder            | Wellness / Time for your check-in            | Mood / A quick mood check-in is ready when you are      |
| Sleep reminder           | Wellness / Time for your check-in            | Sleep / Time to start winding down                      |
| Cycle reminder           | Wellness / Time for your check-in            | Cycle / Time for your check-in                          |
| Pregnancy reminder       | Wellness / Time for your check-in            | Pregnancy / Time for your check-in                      |
| Nutrition reminder       | Wellness / Time for your check-in            | Nutrition / Time to note your meal                      |
| Period reminder          | Wellness / Time for your check-in            | Cycle / A quick note: your cycle estimate has an update |
| Appointment reminder     | Wellness / Time for your check-in            | Pregnancy / You have an appointment coming up           |
| Partner update (push)    | Wellness / You have a new update in Wellness | Same (never shows details)                              |
| Requirement: water goal  | Wellness / You have a new update in Wellness | Water / Add your water goal whenever you're ready       |
| Requirement: last period | Wellness / You have a new update in Wellness | Cycle / Add your last period date whenever you're ready |
| Requirement: due date    | Wellness / You have a new update in Wellness | Pregnancy / Add your due date whenever you're ready     |
| Achievement              | Wellness / You have a new update in Wellness | New badge / _achievement name_                          |

On Android the channel is also set to private lock-screen visibility. Hindi wording is in `hi.json` and needs native-speaker review.

## Requirement reminders

| Tracker   | Detail needed                | Why (shown on the prompt and the form)                 | Validation                         |
| --------- | ---------------------------- | ------------------------------------------------------ | ---------------------------------- |
| Water     | Daily water goal             | Shows progress and spreads reminders through the day   | 500–5000 ml (17–169 fl oz)         |
| Cycle     | First day of the last period | Cycle estimates start from this date                   | Not in the future; within a year   |
| Pregnancy | Estimated due date           | Sets week-by-week content and the appointment timeline | From 2 weeks ago to 42 weeks ahead |

The in-app prompt appears at the top of the tracker first. A notification follows only if requirement notifications are on, at most once a week, and stops as soon as the detail is entered.

## Achievements

Rules: never reward restriction, extreme goals, eating less or weight change; no countdowns or pressure; streaks allow one rest day per seven logged days, and two missed days in a row end a streak. Locked achievements show only their description, with no progress bars. Achievements for trackers a person does not use (for example Cycle for men) are hidden. Notifications for achievements are off by default and sent at most once each.

| Category        | Name            | Earned when                               | Tracker   |
| --------------- | --------------- | ----------------------------------------- | --------- |
| Getting started | Welcome aboard  | Onboarding finished                       | —         |
| Getting started | First step      | First entry in any tracker                | —         |
| Getting started | Right on time   | First reminder created                    | —         |
| Getting started | Explorer        | Logged in three different trackers        | —         |
| Consistency     | A good week     | Logged on 7 days (grace day allowed)      | —         |
| Consistency     | A month of care | Logged on 30 days (a grace day each week) | —         |
| Wellness        | Well hydrated   | Reached your own water goal on 5 days     | Water     |
| Wellness        | Know your moods | 14 mood check-ins                         | Mood      |
| Wellness        | Deep breath     | First breathing exercise                  | Mood      |
| Wellness        | Calm habit      | 10 breathing exercises                    | Mood      |
| Wellness        | Reflective      | 5 journal entries                         | Mood      |
| Wellness        | Rested week     | Sleep logged on 7 nights                  | Sleep     |
| Wellness        | Cycle insight   | First period logged                       | Cycle     |
| Wellness        | First count     | First kick count finished                 | Pregnancy |
| Wellness        | Bag packed      | Hospital bag checklist finished           | Pregnancy |
| Wellness        | Mindful plate   | Meals noted on 7 days                     | Nutrition |
| Wellness        | Colourful plate | Vegetables or fruit on 5 days             | Nutrition |
| Wellness        | Home cooking    | A home-cooked meal on 5 days              | Nutrition |
| Learning        | Privacy pro     | Opened the privacy policy                 | —         |
| Learning        | Curious mind    | First health article read                 | —         |
| Learning        | Well read       | 10 health articles read                   | —         |

Earned achievements are stored on the device and in `achievements_earned` when signed in, with the date earned and when (if ever) a notification was sent.

## Delivery log

When the person has allowed anonymous statistics and is signed in, each delivered notification writes one row to `notification_log`: type, tracker, platform and outcome. It has no user id and no message text.
