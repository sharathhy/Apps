import {
  AccentScope,
  Appear,
  Button,
  Card,
  Icon,
  ProgressRing,
  Screen,
  Text,
  TextField,
  useTheme,
} from '@wellness/ui';
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Chip } from '@/components/Chip';
import { ListRow } from '@/components/ListRow';
import { MedicalDisclaimer } from '@/components/MedicalDisclaimer';
import { RequirementPrompt } from '@/features/requirements/components/RequirementPrompt';
import type { Language } from '@/i18n';
import { dateFormatPattern, formatDateKey, parseDateInput } from '@/lib/region';
import { daysBetweenKeys } from '@/lib/time/days';
import { useRegion } from '@/lib/useRegion';

import { deletePregnancyData, endPregnancyTracking, setDueDate } from '../actions';
import { pregnancyModule } from '../manifest';
import {
  contentWeek,
  dueFromConception,
  dueFromLastPeriod,
  PREGNANCY_DAYS,
  urgentSymptoms,
} from '../model';
import { usePregnancy } from '../store';
import { pregnancyTools } from '../tools';
import { usePregnancyView } from '../usePregnancyView';
import { weekContent } from '../weeks';

export function PregnancyScreen() {
  const { t } = useTranslation();
  const { accents } = useTheme();
  const { dueDate, status, age } = usePregnancyView();

  return (
    <AccentScope module="pregnancy">
      <Screen>
        <View className="flex-row items-center gap-3">
          <View className="rounded-lg bg-accent-soft p-2">
            <Icon name={pregnancyModule.icon} size={28} color={accents.pregnancy.accent} />
          </View>
          <View className="flex-1">
            <Text variant="title1">{t('modules.pregnancy.title')}</Text>
            <Text tone="muted">{t('pregnancy.subtitle')}</Text>
          </View>
        </View>

        {status === 'ended' ? (
          <EndedCard />
        ) : (
          <>
            <RequirementPrompt module="pregnancy" />
            {!dueDate ? <DueDateCalculator /> : null}
            {age ? (
              <>
                <Appear>
                  <WeekCard />
                </Appear>
                <Appear index={1}>
                  <ThisWeekCard week={contentWeek(age.weeks)} />
                </Appear>
              </>
            ) : null}
            <Appear index={2}>
              <UrgentCard />
            </Appear>
            <Appear index={3}>
              <Card className="gap-1">
                {pregnancyTools.map((tool) => (
                  <ListRow
                    key={tool.id}
                    icon={tool.icon}
                    label={t(`pregnancy.tools.${tool.id}`)}
                    onPress={() => router.push(`/pregnancy-tools/${tool.id}` as Href)}
                  />
                ))}
              </Card>
            </Appear>
            <StopCard />
          </>
        )}
        <MedicalDisclaimer />
      </Screen>
    </AccentScope>
  );
}

function WeekCard() {
  const { t } = useTranslation();
  const { dateOrder } = useRegion();
  const { accents } = useTheme();
  const { dueDate, age } = usePregnancyView();
  if (!age || !dueDate) return null;
  return (
    <Card className="flex-row items-center gap-4">
      <ProgressRing
        progress={Math.min(1, age.totalDays / PREGNANCY_DAYS)}
        size={88}
        color={accents.pregnancy.accent}
        accessibilityLabel={t('pregnancy.week.progress', { weeks: age.weeks })}
      >
        <Text variant="title2">{age.weeks}</Text>
      </ProgressRing>
      <View className="flex-1 gap-1">
        <Text variant="title3">
          {t('pregnancy.week.weeksDays', { weeks: age.weeks, days: age.days })}
        </Text>
        <Text tone="muted">
          {t('pregnancy.week.trimester', { n: age.trimester })}
          {age.term !== 'preterm' ? ` · ${t(`pregnancy.week.term.${age.term}`)}` : ''}
        </Text>
        <Text>
          {age.daysToGo >= 0
            ? t('pregnancy.week.due', {
                date: formatDateKey(dueDate, dateOrder),
                count: age.daysToGo,
              })
            : t('pregnancy.week.past', { date: formatDateKey(dueDate, dateOrder) })}
        </Text>
        <Button
          variant="ghost"
          label={t('pregnancy.week.change')}
          onPress={() =>
            router.push({ pathname: '/setup/[requirement]', params: { requirement: 'dueDate' } })
          }
        />
      </View>
    </Card>
  );
}

function ThisWeekCard({ week }: { week: number }) {
  const { t, i18n } = useTranslation();
  const content = weekContent(week, i18n.language as Language);
  if (!content) return null;
  return (
    <Card tone="accent" className="gap-3">
      <Text variant="label" tone="accent">
        {t('pregnancy.weeks.week', { week })}
      </Text>
      <Text variant="label">{t('pregnancy.weeks.baby')}</Text>
      <Text>{content.baby}</Text>
      <Text variant="label">{t('pregnancy.weeks.you')}</Text>
      <Text>{content.you}</Text>
      <Text variant="footnote" tone="muted">
        {t('pregnancy.weeks.sources', { sources: content.sources.join(', ') })}
      </Text>
      <Button
        variant="secondary"
        label={t('pregnancy.weeks.all')}
        onPress={() => router.push('/pregnancy-tools/weeks' as Href)}
      />
    </Card>
  );
}

/** Warning signs that need help straight away. Always visible. */
export function UrgentCard() {
  const { t } = useTranslation();
  return (
    <Card tone="muted" className="gap-2">
      <Text variant="title3">{t('pregnancy.urgent.title')}</Text>
      {urgentSymptoms.map((s) => (
        <Text key={s}>• {t(`pregnancy.symptoms.${s}`)}</Text>
      ))}
      <Text variant="label">{t('pregnancy.urgent.action')}</Text>
      <Text variant="footnote" tone="muted">
        {t('pregnancy.urgent.source')}
      </Text>
    </Card>
  );
}

function DueDateCalculator() {
  const { t } = useTranslation();
  const { dateOrder } = useRegion();
  const pattern = dateFormatPattern(dateOrder);
  const { today } = usePregnancyView();
  const [method, setMethod] = useState<'lastPeriod' | 'conception'>('lastPeriod');
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const key = parseDateInput(text, dateOrder);
  const valid = key && key <= today && daysBetweenKeys(key, today) <= PREGNANCY_DAYS + 14;
  const due = valid
    ? method === 'lastPeriod'
      ? dueFromLastPeriod(key)
      : dueFromConception(key)
    : null;

  return (
    <Card className="gap-3">
      <Text variant="title3">{t('pregnancy.calculator.title')}</Text>
      <View className="flex-row flex-wrap gap-2" accessibilityRole="radiogroup">
        {(['lastPeriod', 'conception'] as const).map((m) => (
          <Chip
            key={m}
            role="radio"
            selected={method === m}
            label={t(`pregnancy.calculator.${m}`)}
            onPress={() => setMethod(m)}
          />
        ))}
      </View>
      <TextField
        label={t(`pregnancy.calculator.${method}Label`, { pattern })}
        value={text}
        onChangeText={(v) => {
          setText(v);
          setError(null);
        }}
        placeholder={pattern}
        inputMode="numeric"
      />
      {due ? (
        <Text accessibilityLiveRegion="polite">
          {t('pregnancy.calculator.result', { date: formatDateKey(due, dateOrder) })}
        </Text>
      ) : null}
      <Button
        variant="accent"
        label={t('pregnancy.calculator.save')}
        onPress={() => {
          if (!due) {
            setError(
              key
                ? t('pregnancy.calculator.outOfRange')
                : t('requirements.errors.invalidDate', { pattern }),
            );
            return;
          }
          setDueDate(due);
        }}
      />
      {error ? (
        <Text tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      <Text variant="footnote" tone="muted">
        {t('pregnancy.calculator.note')}
      </Text>
    </Card>
  );
}

function StopCard() {
  const { t } = useTranslation();
  const [confirming, setConfirming] = useState(false);
  return (
    <Card className="gap-2">
      <Text variant="label">{t('pregnancy.stop.title')}</Text>
      <Text variant="footnote" tone="muted">
        {t('pregnancy.stop.description')}
      </Text>
      {confirming ? (
        <View className="flex-row flex-wrap gap-2">
          <Button
            variant="secondary"
            label={t('pregnancy.stop.confirm')}
            onPress={endPregnancyTracking}
          />
          <Button
            variant="ghost"
            label={t('pregnancy.stop.cancel')}
            onPress={() => setConfirming(false)}
          />
        </View>
      ) : (
        <Button
          variant="secondary"
          label={t('pregnancy.stop.button')}
          onPress={() => setConfirming(true)}
        />
      )}
    </Card>
  );
}

function EndedCard() {
  const { t } = useTranslation();
  const setStatus = usePregnancy((s) => s.setStatus);
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <Card className="gap-3">
      <Text variant="title3">{t('pregnancy.ended.title')}</Text>
      <Text>{t('pregnancy.ended.message')}</Text>
      <Button
        variant="accent"
        label={t('pregnancy.ended.restart')}
        onPress={() => setStatus('active')}
      />
      {confirmDelete ? (
        <>
          <Text tone="muted">{t('pregnancy.ended.deleteConfirm')}</Text>
          <Button
            variant="danger"
            label={t('pregnancy.ended.deleteNow')}
            onPress={deletePregnancyData}
          />
        </>
      ) : (
        <Button
          variant="secondary"
          label={t('pregnancy.ended.delete')}
          onPress={() => setConfirmDelete(true)}
        />
      )}
    </Card>
  );
}
