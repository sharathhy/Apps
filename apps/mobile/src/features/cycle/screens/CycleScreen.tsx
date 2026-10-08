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
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Chip } from '@/components/Chip';
import { MedicalDisclaimer } from '@/components/MedicalDisclaimer';
import { SwitchRow } from '@/components/SwitchRow';
import { saveTextFile } from '@/features/data/export';
import { RequirementPrompt } from '@/features/requirements/components/RequirementPrompt';
import { useRequirements } from '@/features/requirements/store';
import { validateRequirement } from '@/features/requirements/validate';
import { dateFormatPattern, formatDateKey } from '@/lib/region';
import { addDaysKey, daysBetweenKeys } from '@/lib/time/days';
import { deviceTimeZone } from '@/lib/time/device';
import { localDateKey, parseDateKey } from '@/lib/time/zoned';
import { tapFeedback } from '@/lib/haptics';
import { useRegion } from '@/lib/useRegion';

import { clearSetupStart, deletePeriod, logPeriodStart, saveCycleDay } from '../actions';
import { cycleModule } from '../manifest';
import {
  cycleCsv,
  cycleHistory,
  cycleStats,
  cycleSymptoms,
  dayKind,
  flows,
  periodStarts,
  predictCycle,
  type CycleDayLog,
  type CycleSymptom,
  type DayKind,
  type Flow,
} from '../model';
import { useCycle } from '../store';

/** Everything the cards need, derived from the stores in one place. */
function useCycleView() {
  const periods = useCycle((s) => s.periods);
  const logs = useCycle((s) => s.logs);
  const setupStart = useRequirements((s) => s.lastPeriodStart);
  const today = localDateKey(new Date(), deviceTimeZone());
  const starts = periodStarts(periods, setupStart);
  const stats = cycleStats(starts, periods);
  const prediction = predictCycle(starts, stats, today);
  return { periods, logs, setupStart, today, starts, stats, prediction };
}

export function CycleScreen() {
  const { t } = useTranslation();
  const { accents } = useTheme();
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <AccentScope module="cycle">
      <Screen>
        <View className="flex-row items-center gap-3">
          <View className="rounded-lg bg-accent-soft p-2">
            <Icon name={cycleModule.icon} size={28} color={accents.cycle.accent} />
          </View>
          <View className="flex-1">
            <Text variant="title1">{t('modules.cycle.title')}</Text>
            <Text tone="muted">{t('cycle.subtitle')}</Text>
          </View>
        </View>
        <RequirementPrompt module="cycle" />
        <Appear>
          <TodayCard />
        </Appear>
        <Appear index={1}>
          <CalendarCard selected={selected} onSelect={setSelected} />
        </Appear>
        <Appear index={2}>
          <DayLogCard day={selected} />
        </Appear>
        <Appear index={3}>
          <HistoryCard />
        </Appear>
        <Appear index={4}>
          <ReminderCard />
        </Appear>
        <MedicalDisclaimer />
      </Screen>
    </AccentScope>
  );
}

function TodayCard() {
  const { t } = useTranslation();
  const { dateOrder } = useRegion();
  const { periods, today, stats, prediction } = useCycleView();
  const setPeriodEnd = useCycle((s) => s.setPeriodEnd);
  const [earlier, setEarlier] = useState('');
  const [message, setMessage] = useState<{ tone: 'accent' | 'danger'; text: string } | null>(null);
  const date = (key: string) => formatDateKey(key, dateOrder);
  const pattern = dateFormatPattern(dateOrder);

  const ongoing = periods.find(
    (p) => !p.end && p.start <= today && daysBetweenKeys(p.start, today) < 15,
  );

  const start = async (day: string) => {
    tapFeedback();
    await logPeriodStart(day);
    setMessage({ tone: 'accent', text: t('cycle.today.started', { date: date(day) }) });
  };

  const addEarlier = async () => {
    const result = validateRequirement('lastPeriod', earlier, {
      units: 'metric',
      dateOrder,
      today: parseDateKey(today)!,
    });
    if (!result.ok) {
      setMessage({ tone: 'danger', text: t(`requirements.errors.${result.error}`, { pattern }) });
      return;
    }
    setEarlier('');
    await start(String(result.value));
  };

  return (
    <Card className="gap-3">
      {prediction ? (
        <>
          <Text variant="title2">{t('cycle.today.day', { day: prediction.cycleDay })}</Text>
          <Text>
            {prediction.daysUntil < 0
              ? t('cycle.today.late', { count: -prediction.daysUntil })
              : stats.irregular
                ? t('cycle.today.nextRange', {
                    from: date(prediction.nextRange.from),
                    to: date(prediction.nextRange.to),
                  })
                : t('cycle.today.next', {
                    date: date(prediction.nextStart),
                    count: prediction.daysUntil,
                  })}
          </Text>
          <Text>
            {t('cycle.today.fertile', {
              from: date(prediction.fertile.from),
              to: date(prediction.fertile.to),
            })}
          </Text>
          <Text variant="footnote" tone="muted">
            {stats.cyclesUsed === 0
              ? t('cycle.today.basedOnDefault')
              : t('cycle.today.basedOn', { count: stats.cyclesUsed })}{' '}
            {t('cycle.notContraception')}
          </Text>
        </>
      ) : (
        <Text tone="muted">{t('cycle.today.empty')}</Text>
      )}

      {ongoing ? (
        <Button
          variant="accent"
          label={t('cycle.today.ended')}
          onPress={() => {
            tapFeedback();
            setPeriodEnd(ongoing.id, today);
            setMessage({ tone: 'accent', text: t('cycle.today.endedSaved') });
          }}
        />
      ) : (
        <Button
          variant="accent"
          label={t('cycle.today.startedToday')}
          onPress={() => void start(today)}
        />
      )}
      <TextField
        label={t('cycle.today.earlierLabel', { pattern })}
        value={earlier}
        onChangeText={setEarlier}
        placeholder={pattern}
        inputMode="numeric"
      />
      <Button
        variant="secondary"
        label={t('cycle.today.earlierSave')}
        onPress={() => void addEarlier()}
      />
      {message ? (
        <Text tone={message.tone} accessibilityLiveRegion="polite">
          {message.text}
        </Text>
      ) : null}
    </Card>
  );
}

const kindStyle = (kind: DayKind, accent: string, soft: string, onAccent: string) => {
  switch (kind) {
    case 'period':
      return {
        backgroundColor: accent,
        borderColor: accent,
        color: onAccent,
        borderStyle: 'solid' as const,
      };
    case 'predictedPeriod':
      return {
        backgroundColor: soft,
        borderColor: accent,
        color: undefined,
        borderStyle: 'dashed' as const,
      };
    case 'ovulation':
      return {
        backgroundColor: 'transparent',
        borderColor: accent,
        color: undefined,
        borderStyle: 'solid' as const,
      };
    case 'fertile':
      return {
        backgroundColor: 'transparent',
        borderColor: accent,
        color: undefined,
        borderStyle: 'dotted' as const,
      };
    default:
      return {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        color: undefined,
        borderStyle: 'solid' as const,
      };
  }
};

function CalendarCard({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (day: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const { accents, colors } = useTheme();
  const { dateOrder } = useRegion();
  const { periods, logs, today, stats, prediction } = useCycleView();
  const [monthOffset, setMonthOffset] = useState(0);
  const { accent, soft, onAccent } = accents.cycle;

  const base = parseDateKey(today)!;
  const first = new Date(Date.UTC(base.year, base.month - 1 + monthOffset, 1));
  const firstKey = first.toISOString().slice(0, 10);
  const daysInMonth = new Date(
    Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0),
  ).getUTCDate();
  // Weeks start on Sunday in the US and Monday in India.
  const weekStart = dateOrder === 'MDY' ? 0 : 1;
  const lead = (first.getUTCDay() - weekStart + 7) % 7;
  const cells: (string | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => addDaysKey(firstKey, i)),
  ];
  while (cells.length % 7) cells.push(null);
  const weekdayNames = Array.from({ length: 7 }, (_, i) =>
    new Date(Date.UTC(2024, 0, 7 + weekStart + i)).toLocaleDateString(i18n.language, {
      weekday: 'narrow',
      timeZone: 'UTC',
    }),
  );
  const monthName = first.toLocaleDateString(i18n.language, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

  return (
    <Card className="gap-3">
      <View className="flex-row items-center justify-between">
        <Button
          variant="ghost"
          label="‹"
          accessibilityLabel={t('cycle.calendar.previous')}
          onPress={() => setMonthOffset((m) => m - 1)}
        />
        <Text variant="title3" accessibilityRole="header" accessibilityLiveRegion="polite">
          {monthName}
        </Text>
        <Button
          variant="ghost"
          label="›"
          accessibilityLabel={t('cycle.calendar.next')}
          disabled={monthOffset >= 3}
          onPress={() => setMonthOffset((m) => m + 1)}
        />
      </View>
      <View className="flex-row">
        {weekdayNames.map((name, i) => (
          <Text
            key={i}
            variant="footnote"
            tone="muted"
            className="text-center"
            style={{ width: '14.2857%' }}
          >
            {name}
          </Text>
        ))}
      </View>
      <View className="flex-row flex-wrap">
        {cells.map((day, i) => {
          if (!day)
            return <View key={`empty-${i}`} style={{ width: '14.2857%', aspectRatio: 1 }} />;
          const kind = dayKind(day, periods, logs, prediction, stats, today);
          const style = kindStyle(kind, accent, soft, onAccent);
          const isSelected = (selected ?? today) === day;
          const label = [
            formatDateKey(day, dateOrder),
            day === today ? t('cycle.calendar.today') : null,
            kind ? t(`cycle.calendar.kinds.${kind}`) : null,
            logs[day] ? t('cycle.calendar.logged') : null,
          ]
            .filter(Boolean)
            .join(', ');
          return (
            <Pressable
              key={day}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected: isSelected }}
              onPress={() => onSelect(day)}
              style={{ width: '14.2857%', aspectRatio: 1, padding: 2 }}
            >
              <View
                style={{
                  flex: 1,
                  borderRadius: 999,
                  borderWidth: kind ? 2 : 0,
                  borderStyle: style.borderStyle,
                  borderColor: style.borderColor,
                  backgroundColor: style.backgroundColor,
                  alignItems: 'center',
                  justifyContent: 'center',
                  outlineWidth: isSelected ? 2 : 0,
                  outlineColor: colors.text,
                  outlineStyle: 'solid',
                }}
              >
                <Text
                  variant="footnote"
                  style={{
                    color: style.color,
                    fontWeight: day === today ? '700' : undefined,
                    textDecorationLine: day === today ? 'underline' : 'none',
                  }}
                >
                  {Number(day.slice(8))}
                </Text>
                {logs[day] ? (
                  <View
                    style={{
                      position: 'absolute',
                      bottom: 3,
                      width: 4,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: kind === 'period' ? onAccent : accent,
                    }}
                  />
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
      <View className="flex-row flex-wrap gap-x-4 gap-y-2" accessible accessibilityRole="text">
        {(['period', 'predictedPeriod', 'fertile', 'ovulation'] as const).map((kind) => {
          const style = kindStyle(kind, accent, soft, onAccent);
          return (
            <View key={kind} className="flex-row items-center gap-2">
              <View
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  borderWidth: 2,
                  borderStyle: style.borderStyle,
                  borderColor: style.borderColor,
                  backgroundColor: style.backgroundColor,
                }}
              />
              <Text variant="footnote">{t(`cycle.calendar.kinds.${kind}`)}</Text>
            </View>
          );
        })}
      </View>
      <Text variant="footnote" tone="muted">
        {t('cycle.calendar.estimateNote')}
      </Text>
    </Card>
  );
}

function DayLogCard({ day: selectedDay }: { day: string | null }) {
  const { logs, today } = useCycleView();
  const day = selectedDay && selectedDay <= today ? selectedDay : today;
  // Re-mount the form when the day changes so it starts from that day's log.
  return <DayLogForm key={day} day={day} existing={logs[day]} today={today} />;
}

function DayLogForm({
  day,
  existing,
  today,
}: {
  day: string;
  existing: CycleDayLog | undefined;
  today: string;
}) {
  const { t } = useTranslation();
  const { dateOrder } = useRegion();
  const [flow, setFlow] = useState<Flow | null>(existing?.flow ?? null);
  const [symptoms, setSymptoms] = useState<CycleSymptom[]>(existing?.symptoms ?? []);
  const [note, setNote] = useState(existing?.note ?? '');
  const [saved, setSaved] = useState(false);

  const toggle = (s: CycleSymptom) => {
    tapFeedback();
    setSaved(false);
    setSymptoms((all) => (all.includes(s) ? all.filter((x) => x !== s) : [...all, s]));
  };

  return (
    <Card className="gap-3">
      <Text variant="title3">
        {day === today
          ? t('cycle.log.titleToday')
          : t('cycle.log.titleDay', { date: formatDateKey(day, dateOrder) })}
      </Text>
      <Text variant="label" tone="muted">
        {t('cycle.log.flow')}
      </Text>
      <View className="flex-row flex-wrap gap-2" accessibilityRole="radiogroup">
        {flows.map((f) => (
          <Chip
            key={f}
            role="radio"
            selected={flow === f}
            label={t(`cycle.flow.${f}`)}
            onPress={() => {
              tapFeedback();
              setSaved(false);
              setFlow(flow === f ? null : f);
            }}
          />
        ))}
      </View>
      <Text variant="label" tone="muted">
        {t('cycle.log.symptoms')}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {cycleSymptoms.map((s) => (
          <Chip
            key={s}
            role="checkbox"
            selected={symptoms.includes(s)}
            label={t(`cycle.symptoms.${s}`)}
            onPress={() => toggle(s)}
          />
        ))}
      </View>
      <TextField
        label={t('cycle.log.note')}
        value={note}
        onChangeText={(v) => {
          setSaved(false);
          setNote(v);
        }}
        multiline
        maxLength={2000}
      />
      <Button
        variant="accent"
        label={t('cycle.log.save')}
        onPress={() => void saveCycleDay({ day, flow, symptoms, note }).then(() => setSaved(true))}
      />
      {saved ? (
        <Text tone="accent" accessibilityLiveRegion="polite">
          {t('cycle.log.saved')}
        </Text>
      ) : null}
    </Card>
  );
}

function HistoryCard() {
  const { t } = useTranslation();
  const { dateOrder } = useRegion();
  const { periods, logs, starts, stats, setupStart } = useCycleView();
  const rows = cycleHistory(starts, periods);
  if (!rows.length) return null;

  const remove = (start: string) => {
    const period = periods.find((p) => p.start === start);
    if (period) deletePeriod(period.id);
    else if (start === setupStart) clearSetupStart();
  };

  return (
    <Card className="gap-3">
      <Text variant="title3">{t('cycle.history.title')}</Text>
      {stats.cyclesUsed > 0 ? (
        <Text>
          {t('cycle.history.average', {
            cycle: stats.averageCycle,
            period: stats.averagePeriod,
            count: stats.cyclesUsed,
          })}
        </Text>
      ) : (
        <Text tone="muted">{t('cycle.history.needMore')}</Text>
      )}
      {stats.irregular ? (
        <Text tone="muted">
          {t('cycle.history.irregular', { shortest: stats.shortest, longest: stats.longest })}
        </Text>
      ) : null}
      {stats.outsideCommonRange ? (
        <Text tone="muted">{t('cycle.history.outsideRange')}</Text>
      ) : null}
      {rows.slice(0, 6).map((r) => (
        <View key={r.start} className="min-h-touch flex-row items-center gap-3">
          <View className="flex-1">
            <Text variant="label">{formatDateKey(r.start, dateOrder)}</Text>
            <Text variant="footnote" tone="muted">
              {r.length === null
                ? t('cycle.history.current')
                : t('cycle.history.length', { count: r.length })}
              {r.periodDays ? ` · ${t('cycle.history.periodDays', { count: r.periodDays })}` : ''}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('cycle.history.delete', {
              date: formatDateKey(r.start, dateOrder),
            })}
            onPress={() => remove(r.start)}
            className="min-h-touch min-w-touch items-center justify-center"
          >
            <Icon name="trash" size={20} />
          </Pressable>
        </View>
      ))}
      <Button
        variant="secondary"
        label={t('cycle.history.export')}
        onPress={() =>
          void saveTextFile(
            `cycle-${new Date().toISOString().slice(0, 10)}.csv`,
            cycleCsv(rows, Object.values(logs)),
            'text/csv',
          )
        }
      />
      <Text variant="footnote" tone="muted">
        {t('cycle.history.sources')}
      </Text>
    </Card>
  );
}

function ReminderCard() {
  const { t } = useTranslation();
  const on = useCycle((s) => s.periodReminder);
  const setOn = useCycle((s) => s.setPeriodReminder);
  return (
    <Card className="gap-1">
      <SwitchRow
        icon="bell"
        title={t('cycle.reminder.title')}
        description={t('cycle.reminder.description')}
        value={on}
        onChange={setOn}
      />
    </Card>
  );
}
