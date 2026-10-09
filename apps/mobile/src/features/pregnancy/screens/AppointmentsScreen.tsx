import { Button, Card, Icon, Pressable, Text, TextField } from '@wellness/ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Chip } from '@/components/Chip';
import { SwitchRow } from '@/components/SwitchRow';
import { dateFormatPattern, formatDateKey, parseDateInput } from '@/lib/region';
import { deviceTimeZone } from '@/lib/time/device';
import { clockLabel, shiftClock } from '@/lib/time/format';
import { formatClock, fromLocal, localDateKey, parseDateKey, toLocal } from '@/lib/time/zoned';
import { useRegion } from '@/lib/useRegion';

import { PregnancyPage } from '../components/PregnancyPage';
import { usePregnancy, type Appointment } from '../store';

const SHIFTS = [-60, -15, 15, 60] as const;

export function AppointmentsScreen() {
  const { t } = useTranslation();
  const appointments = usePregnancy((s) => s.appointments);
  const now = new Date().toISOString();
  const upcoming = appointments.filter((a) => a.at >= now);
  const past = appointments.filter((a) => a.at < now).reverse();
  return (
    <PregnancyPage title={t('pregnancy.tools.appointments')}>
      <AppointmentForm />
      <Card className="gap-2">
        <Text variant="title3">{t('pregnancy.appointments.upcoming')}</Text>
        {upcoming.length ? (
          upcoming.map((a) => <AppointmentRow key={a.id} appointment={a} />)
        ) : (
          <Text tone="muted">{t('pregnancy.appointments.none')}</Text>
        )}
      </Card>
      {past.length ? (
        <Card className="gap-2">
          <Text variant="title3">{t('pregnancy.appointments.past')}</Text>
          {past.map((a) => (
            <AppointmentRow key={a.id} appointment={a} />
          ))}
        </Card>
      ) : null}
    </PregnancyPage>
  );
}

function AppointmentForm() {
  const { t, i18n } = useTranslation();
  const { dateOrder } = useRegion();
  const pattern = dateFormatPattern(dateOrder);
  const save = usePregnancy((s) => s.saveAppointment);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [note, setNote] = useState('');
  const [remind, setRemind] = useState(true);
  const [message, setMessage] = useState<{ tone: 'accent' | 'danger'; text: string } | null>(null);

  const submit = () => {
    const tz = deviceTimeZone();
    const key = parseDateInput(date, dateOrder);
    const day = key ? parseDateKey(key) : null;
    if (!title.trim()) {
      setMessage({ tone: 'danger', text: t('pregnancy.appointments.needTitle') });
      return;
    }
    if (!key || !day || key < localDateKey(new Date(), tz)) {
      setMessage({ tone: 'danger', text: t('pregnancy.appointments.needDate', { pattern }) });
      return;
    }
    const [hour, minute] = time.split(':').map(Number) as [number, number];
    const at = fromLocal({ ...day, hour, minute }, tz).toISOString();
    save({ title, at, note, remind });
    setTitle('');
    setDate('');
    setNote('');
    setMessage({ tone: 'accent', text: t('pregnancy.appointments.saved') });
  };

  return (
    <Card className="gap-3">
      <Text variant="title3">{t('pregnancy.appointments.add')}</Text>
      <TextField
        label={t('pregnancy.appointments.title')}
        value={title}
        onChangeText={setTitle}
        maxLength={200}
        placeholder={t('pregnancy.appointments.titlePlaceholder')}
      />
      <TextField
        label={t('pregnancy.appointments.date', { pattern })}
        value={date}
        onChangeText={setDate}
        placeholder={pattern}
        inputMode="numeric"
      />
      <View className="gap-2">
        <View className="flex-row items-center justify-between">
          <Text variant="label" tone="muted">
            {t('pregnancy.appointments.time')}
          </Text>
          <Text variant="title3">{clockLabel(time, i18n.language)}</Text>
        </View>
        <View className="flex-row flex-wrap gap-2">
          {SHIFTS.map((m) => (
            <Chip
              key={m}
              label={
                m < 0
                  ? `−${Math.abs(m) === 60 ? '1 h' : '15 min'}`
                  : `+${m === 60 ? '1 h' : '15 min'}`
              }
              accessibilityLabel={`${t('pregnancy.appointments.time')}: ${t(
                m < 0 ? 'sleep.earlier' : 'sleep.later',
                { minutes: Math.abs(m) },
              )}`}
              onPress={() => setTime(shiftClock(time, m))}
            />
          ))}
        </View>
      </View>
      <TextField
        label={t('pregnancy.appointments.note')}
        value={note}
        onChangeText={setNote}
        multiline
        maxLength={2000}
      />
      <SwitchRow
        title={t('pregnancy.appointments.remind')}
        description={t('pregnancy.appointments.remindDescription')}
        value={remind}
        onChange={setRemind}
      />
      <Button variant="accent" label={t('pregnancy.appointments.save')} onPress={submit} />
      {message ? (
        <Text tone={message.tone} accessibilityLiveRegion="polite">
          {message.text}
        </Text>
      ) : null}
    </Card>
  );
}

function AppointmentRow({ appointment: a }: { appointment: Appointment }) {
  const { t, i18n } = useTranslation();
  const { dateOrder } = useRegion();
  const remove = usePregnancy((s) => s.removeAppointment);
  const tz = deviceTimeZone();
  const local = toLocal(new Date(a.at), tz);
  const when = `${formatDateKey(localDateKey(new Date(a.at), tz), dateOrder)}, ${clockLabel(
    formatClock(local.hour, local.minute),
    i18n.language,
  )}`;
  return (
    <View className="min-h-touch flex-row items-center gap-3">
      <View className="flex-1">
        <Text variant="label">{a.title}</Text>
        <Text variant="footnote" tone="muted">
          {when}
          {a.remind ? ` · ${t('pregnancy.appointments.reminderOn')}` : ''}
        </Text>
        {a.note ? (
          <Text variant="footnote" tone="muted">
            {a.note}
          </Text>
        ) : null}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('pregnancy.appointments.delete', { title: a.title })}
        onPress={() => remove(a.id)}
        className="min-h-touch min-w-touch items-center justify-center"
      >
        <Icon name="trash" size={20} />
      </Pressable>
    </View>
  );
}
