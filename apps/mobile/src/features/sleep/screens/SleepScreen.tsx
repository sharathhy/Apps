import {
  AccentScope,
  Appear,
  Button,
  Card,
  Icon,
  Pressable,
  Screen,
  Text,
  TextField,
  useTheme,
} from '@wellness/ui';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { BarChart } from '@/components/BarChart';
import { Chip } from '@/components/Chip';
import { MedicalDisclaimer } from '@/components/MedicalDisclaimer';
import { formatDateKey } from '@/lib/region';
import { deviceTimeZone } from '@/lib/time/device';
import { clockLabel, shiftClock } from '@/lib/time/format';
import {
  addDays,
  dateKey,
  formatClock,
  localDateKey,
  parseDateKey,
  toLocal,
} from '@/lib/time/zoned';
import { tapFeedback } from '@/lib/haptics';
import { useRegion } from '@/lib/useRegion';

import { logSleep } from '../actions';
import { sleepModule } from '../manifest';
import {
  bedtimeSpread,
  durationMinutes,
  formatDuration,
  nightToInstants,
  type SleepEntry,
} from '../model';
import { useSleep } from '../store';

const qualities = [1, 2, 3, 4, 5] as const;

export function SleepScreen() {
  const { t } = useTranslation();
  const { accents } = useTheme();
  return (
    <AccentScope module="sleep">
      <Screen>
        <View className="flex-row items-center gap-3">
          <View className="rounded-lg bg-accent-soft p-2">
            <Icon name={sleepModule.icon} size={28} color={accents.sleep.accent} />
          </View>
          <View className="flex-1">
            <Text variant="title1">{t('modules.sleep.title')}</Text>
            <Text tone="muted">{t('sleep.subtitle')}</Text>
          </View>
        </View>
        <Appear>
          <LogCard />
        </Appear>
        <Appear index={1}>
          <WeekCard />
        </Appear>
        <Appear index={2}>
          <Card className="gap-2">
            <Text variant="title3">{t('sleep.windDown.title')}</Text>
            <Text tone="muted">{t('sleep.windDown.message')}</Text>
            <Button
              variant="secondary"
              label={t('sleep.windDown.set')}
              onPress={() =>
                router.push({ pathname: '/notifications/reminder', params: { module: 'sleep' } })
              }
            />
          </Card>
        </Appear>
        <MedicalDisclaimer />
      </Screen>
    </AccentScope>
  );
}

function useDuration() {
  const { t } = useTranslation();
  return (minutes: number) => {
    const d = formatDuration(minutes);
    return t('sleep.duration', { hours: d.hours, minutes: d.minutes });
  };
}

function LogCard() {
  const { t, i18n } = useTranslation();
  const { dateOrder } = useRegion();
  const showDuration = useDuration();
  const tz = deviceTimeZone();
  const today = localDateKey(new Date(), tz);
  const [day, setDay] = useState(today);
  const [bed, setBed] = useState('23:00');
  const [wake, setWake] = useState('07:00');
  const [quality, setQuality] = useState<SleepEntry['quality']>(null);
  const [note, setNote] = useState('');
  const [message, setMessage] = useState<{ tone: 'accent' | 'danger'; text: string } | null>(null);

  const night = nightToInstants(day, bed, wake, tz);
  const minutes = night ? Math.round((night.wakeAt.getTime() - night.bedAt.getTime()) / 60_000) : 0;
  const date = parseDateKey(day)!;
  const canGoForward = day < today;

  const save = async () => {
    if (!night) {
      setMessage({ tone: 'danger', text: t('sleep.invalid') });
      return;
    }
    await logSleep({
      day,
      bedAt: night.bedAt.toISOString(),
      wakeAt: night.wakeAt.toISOString(),
      quality,
      note,
    });
    setMessage({ tone: 'accent', text: t('sleep.saved') });
    setNote('');
  };

  const shiftRow = (value: string, set: (v: string) => void, label: string) => (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <Text variant="label" tone="muted">
          {label}
        </Text>
        <Text variant="title3">{clockLabel(value, i18n.language)}</Text>
      </View>
      <View className="flex-row flex-wrap gap-2">
        {([-60, -15, 15, 60] as const).map((m) => (
          <Chip
            key={m}
            label={
              m < 0
                ? `−${Math.abs(m) === 60 ? '1 h' : '15 min'}`
                : `+${m === 60 ? '1 h' : '15 min'}`
            }
            accessibilityLabel={`${label}: ${t(m < 0 ? 'sleep.earlier' : 'sleep.later', { minutes: Math.abs(m) })}`}
            onPress={() => {
              set(shiftClock(value, m));
              setMessage(null);
            }}
          />
        ))}
      </View>
    </View>
  );

  return (
    <Card className="gap-4">
      <Text variant="title3">{t('sleep.log.title')}</Text>
      <View className="flex-row items-center justify-between">
        <Button
          variant="ghost"
          label="‹"
          accessibilityLabel={t('sleep.log.earlierNight')}
          onPress={() => setDay(dateKey(addDays(date, -1)))}
        />
        <Text variant="label" accessibilityLiveRegion="polite">
          {day === today
            ? t('sleep.log.lastNight')
            : t('sleep.log.morningOf', { date: formatDateKey(day, dateOrder) })}
        </Text>
        <Button
          variant="ghost"
          label="›"
          accessibilityLabel={t('sleep.log.laterNight')}
          disabled={!canGoForward}
          onPress={() => setDay(dateKey(addDays(date, 1)))}
        />
      </View>
      {shiftRow(bed, setBed, t('sleep.log.bed'))}
      {shiftRow(wake, setWake, t('sleep.log.wake'))}
      <Text tone="muted">
        {night ? t('sleep.log.total', { duration: showDuration(minutes) }) : t('sleep.invalid')}
      </Text>
      <View className="gap-2">
        <Text variant="label" tone="muted">
          {t('sleep.log.quality')}
        </Text>
        <View className="flex-row flex-wrap gap-2" accessibilityRole="radiogroup">
          {qualities.map((q) => (
            <Chip
              key={q}
              role="radio"
              selected={quality === q}
              label={t(`sleep.quality.${q}`)}
              onPress={() => {
                tapFeedback();
                setQuality(quality === q ? null : q);
              }}
            />
          ))}
        </View>
      </View>
      <TextField
        label={t('sleep.log.note')}
        value={note}
        onChangeText={setNote}
        multiline
        maxLength={2000}
      />
      <Button variant="accent" label={t('sleep.log.save')} onPress={() => void save()} />
      {message ? (
        <Text tone={message.tone} accessibilityLiveRegion="polite">
          {message.text}
        </Text>
      ) : null}
    </Card>
  );
}

function WeekCard() {
  const { t, i18n } = useTranslation();
  const { accents } = useTheme();
  const showDuration = useDuration();
  const entries = useSleep((s) => s.entries);
  const remove = useSleep((s) => s.remove);
  const tz = deviceTimeZone();
  const today = parseDateKey(localDateKey(new Date(), tz))!;
  const week = Array.from({ length: 7 }, (_, i) => dateKey(addDays(today, i - 6)));
  const byDay = new Map(entries.map((e) => [e.day, e]));
  const data = week.map((day) => {
    const e = byDay.get(day);
    return {
      key: day,
      value: e ? durationMinutes(e) / 60 : 0,
      label: new Date(`${day}T12:00:00Z`).toLocaleDateString(i18n.language, {
        weekday: 'narrow',
        timeZone: 'UTC',
      }),
    };
  });
  const logged = week.map((d) => byDay.get(d)).filter((e): e is SleepEntry => !!e);
  const average = logged.length
    ? Math.round(logged.reduce((s, e) => s + durationMinutes(e), 0) / logged.length)
    : 0;
  const spread = bedtimeSpread(
    logged.map((e) => {
      const l = toLocal(new Date(e.bedAt), tz);
      return formatClock(l.hour, l.minute);
    }),
  );
  const summary = logged.length
    ? t('sleep.week.summary', { count: logged.length, average: showDuration(average) })
    : t('sleep.week.empty');

  return (
    <Card className="gap-3">
      <Text variant="title3">{t('sleep.week.title')}</Text>
      <BarChart data={data} color={accents.sleep.accent} summary={summary} />
      <Text tone="muted">{summary}</Text>
      {spread !== null ? (
        <Text tone="muted">{t('sleep.week.spread', { minutes: spread })}</Text>
      ) : null}
      {entries.slice(0, 5).map((e) => (
        <View key={e.id} className="min-h-touch flex-row items-center gap-3">
          <View className="flex-1">
            <Text variant="label">{showDuration(durationMinutes(e))}</Text>
            <Text variant="footnote" tone="muted">
              {new Date(`${e.day}T12:00:00Z`).toLocaleDateString(i18n.language, {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                timeZone: 'UTC',
              })}
              {e.quality ? ` · ${t(`sleep.quality.${e.quality}`)}` : ''}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('sleep.deleteNight', {
              duration: showDuration(durationMinutes(e)),
            })}
            onPress={() => remove(e.id)}
            className="min-h-touch min-w-touch items-center justify-center"
          >
            <Icon name="trash" size={20} />
          </Pressable>
        </View>
      ))}
    </Card>
  );
}
