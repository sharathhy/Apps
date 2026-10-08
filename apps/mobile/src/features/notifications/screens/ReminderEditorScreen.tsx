import type { ModuleId } from '@wellness/design-tokens';
import { Button, Card, Screen, Text } from '@wellness/ui';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Chip } from '@/components/Chip';
import { trackActivity } from '@/features/achievements/award';
import { useVisibleModules } from '@/features/profile/useVisibleModules';
import { deviceTimeZone } from '@/lib/time/device';
import { clockLabel, shiftClock } from '@/lib/time/format';
import { clockMinutes } from '@/lib/time/zoned';
import { tapFeedback } from '@/lib/haptics';

import { deleteRemoteReminder } from '../accountSync';
import { inQuietHours } from '../planner';
import { defaultReminderTimes } from '../reminders';
import { useNotificationPrefs } from '../prefsStore';
import { useReminders } from '../remindersStore';

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;
const MAX_TIMES = 6;

const SHIFTS = [
  { minutes: -60, label: '−1 h', a11y: 'notifications.reminders.hourDown' },
  { minutes: -15, label: '−15 min', a11y: 'notifications.reminders.minuteDown' },
  { minutes: 15, label: '+15 min', a11y: 'notifications.reminders.minuteUp' },
  { minutes: 60, label: '+1 h', a11y: 'notifications.reminders.hourUp' },
] as const;

/** Create or edit a reminder: tracker, times and days. */
export function ReminderEditorScreen() {
  const { t, i18n } = useTranslation();
  const { id, module: requested } = useLocalSearchParams<{ id?: string; module?: ModuleId }>();
  const existing = useReminders((s) => s.reminders.find((r) => r.id === id));
  const { add, update, remove } = useReminders.getState();
  const prefs = useNotificationPrefs();
  const modules = useVisibleModules();

  const [module, setModule] = useState<ModuleId | null>(
    existing?.module ??
      (requested && modules.some((m) => m.id === requested) ? requested : modules[0]?.id) ??
      null,
  );
  const [times, setTimes] = useState<string[]>(
    existing?.times ?? (module ? defaultReminderTimes[module] : ['09:00']),
  );
  const [weekdays, setWeekdays] = useState<number[]>(existing?.weekdays ?? []);
  const [error, setError] = useState<string | null>(null);

  const setTime = (index: number, value: string) =>
    setTimes((all) => all.map((v, i) => (i === index ? value : v)));

  const toggleDay = (day: number) => {
    tapFeedback();
    setWeekdays((days) => {
      // An empty list means every day, so start from all seven.
      const current = days.length ? days : [...WEEKDAYS];
      const next = current.includes(day) ? current.filter((d) => d !== day) : [...current, day];
      return next.length === WEEKDAYS.length || next.length === 0 ? [] : next;
    });
  };

  const save = () => {
    if (times.length === 0) {
      setError(t('notifications.reminders.needsTime'));
      return;
    }
    if (existing) {
      update(existing.id, { module, times, weekdays });
    } else {
      add({ module, times, weekdays }, deviceTimeZone());
      void trackActivity('reminder_created', module);
    }
    router.back();
  };

  const destroy = () => {
    if (!existing) return;
    remove(existing.id);
    void deleteRemoteReminder(existing.id);
    router.back();
  };

  const quiet = times.filter((time) =>
    inQuietHours(clockMinutes(time), prefs.quietStart, prefs.quietEnd),
  );

  return (
    <Screen edgeTop={false}>
      <Stack.Screen
        options={{
          headerTitle: existing
            ? t('notifications.reminders.edit')
            : t('notifications.reminders.new'),
        }}
      />

      {modules.length > 0 ? (
        <View className="gap-2">
          <Text variant="label" tone="muted">
            {t('notifications.reminders.tracker')}
          </Text>
          <View className="flex-row flex-wrap gap-2" accessibilityRole="radiogroup">
            {modules.map((m) => (
              <Chip
                key={m.id}
                role="radio"
                selected={module === m.id}
                label={t(`modules.${m.id}.title`)}
                onPress={() => {
                  setModule(m.id);
                  if (!existing) setTimes(defaultReminderTimes[m.id]);
                }}
              />
            ))}
          </View>
        </View>
      ) : null}

      <Card className="gap-2">
        <Text variant="label" tone="muted">
          {t('notifications.reminders.times')}
        </Text>
        {times.map((time, index) => (
          <View key={index} className="gap-2 border-b border-border pb-3">
            <View className="flex-row items-center justify-between">
              <Text variant="title3">{clockLabel(time, i18n.language)}</Text>
              <Chip
                label={t('notifications.reminders.remove')}
                accessibilityLabel={t('notifications.reminders.removeTime', {
                  time: clockLabel(time, i18n.language),
                })}
                onPress={() => setTimes((all) => all.filter((_, i) => i !== index))}
              />
            </View>
            <View
              className="flex-row flex-wrap gap-2"
              accessibilityLabel={t('notifications.reminders.timeN', { n: index + 1 })}
            >
              {SHIFTS.map(({ minutes, label, a11y }) => (
                <Chip
                  key={minutes}
                  label={label}
                  accessibilityLabel={`${t(a11y)}: ${clockLabel(time, i18n.language)}`}
                  onPress={() => setTime(index, shiftClock(time, minutes))}
                />
              ))}
            </View>
          </View>
        ))}
        {times.length < MAX_TIMES ? (
          <Button
            variant="secondary"
            label={t('notifications.reminders.addTime')}
            onPress={() => {
              setError(null);
              setTimes((all) => [...all, shiftClock(all[all.length - 1] ?? '08:00', 120)]);
            }}
          />
        ) : null}
        {quiet.map((time) => (
          <Text key={time} variant="footnote" tone="muted">
            {t('notifications.reminders.insideQuiet', { time: clockLabel(time, i18n.language) })}
          </Text>
        ))}
        {error ? (
          <Text variant="footnote" tone="danger" accessibilityRole="alert">
            {error}
          </Text>
        ) : null}
      </Card>

      <Card className="gap-2">
        <Text variant="label" tone="muted">
          {t('notifications.reminders.days')}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {WEEKDAYS.map((day) => (
            <Chip
              key={day}
              role="checkbox"
              selected={weekdays.length === 0 || weekdays.includes(day)}
              label={t(`notifications.reminders.weekdays.${day}`)}
              onPress={() => toggleDay(day)}
            />
          ))}
        </View>
        <Text variant="footnote" tone="muted">
          {weekdays.length === 0 ? t('notifications.reminders.everyDay') : ''}
        </Text>
      </Card>

      <Button label={t('notifications.reminders.save')} onPress={save} />
      {existing ? (
        <Button variant="danger" label={t('notifications.reminders.delete')} onPress={destroy} />
      ) : null}
    </Screen>
  );
}
