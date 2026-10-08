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
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { BarChart } from '@/components/BarChart';
import { Chip } from '@/components/Chip';
import { MedicalDisclaimer } from '@/components/MedicalDisclaimer';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Stepper } from '@/components/Stepper';
import { SwitchRow } from '@/components/SwitchRow';
import { useNotificationPrefs } from '@/features/notifications/prefsStore';
import { RequirementPrompt } from '@/features/requirements/components/RequirementPrompt';
import { useRequirements } from '@/features/requirements/store';
import { ML_PER_FL_OZ } from '@/lib/region';
import { deviceTimeZone } from '@/lib/time/device';
import { clockLabel, shiftClock } from '@/lib/time/format';
import { localDateKey } from '@/lib/time/zoned';
import { useRegion } from '@/lib/useRegion';

import { logDrink } from '../actions';
import { waterModule } from '../manifest';
import {
  averageOfLoggedDays,
  dailyTotals,
  drinkTypes,
  formatVolume,
  quickAddSizes,
  totalForDay,
  type DrinkType,
  type WaterEntry,
} from '../model';
import { useWater } from '../store';

export function WaterScreen() {
  const { t } = useTranslation();
  const { accents } = useTheme();
  return (
    <AccentScope module="water">
      <Screen>
        <View className="flex-row items-center gap-3">
          <View className="rounded-lg bg-accent-soft p-2">
            <Icon name={waterModule.icon} size={28} color={accents.water.accent} />
          </View>
          <View className="flex-1">
            <Text variant="title1">{t('modules.water.title')}</Text>
            <Text tone="muted">{t('water.subtitle')}</Text>
          </View>
        </View>
        <RequirementPrompt module="water" />
        <Appear>
          <TodayCard />
        </Appear>
        <Appear index={1}>
          <HistoryCard />
        </Appear>
        <Appear index={2}>
          <SmartRemindersCard />
        </Appear>
        <MedicalDisclaimer />
      </Screen>
    </AccentScope>
  );
}

function TodayCard() {
  const { t, i18n } = useTranslation();
  const { accents } = useTheme();
  const { units } = useRegion();
  const entries = useWater((s) => s.entries);
  const { remove, restore } = useWater.getState();
  const goal = useRequirements((s) => s.waterGoalMl);
  const [drink, setDrink] = useState<DrinkType>('water');
  const [custom, setCustom] = useState('');
  const [customError, setCustomError] = useState<string | null>(null);
  const [undo, setUndo] = useState<WaterEntry | null>(null);

  const today = localDateKey(new Date(), deviceTimeZone());
  const total = totalForDay(entries, today);
  const todays = entries.filter((e) => e.day === today);
  const progress = goal ? total / goal : 0;

  const addCustom = () => {
    const n = Number(custom.replace(',', '.'));
    const ml = units === 'imperial' ? n * ML_PER_FL_OZ : n;
    if (!Number.isFinite(n) || ml < 10 || ml > 5000) {
      setCustomError(t('water.customError'));
      return;
    }
    void logDrink(ml, drink);
    setCustom('');
    setCustomError(null);
  };

  return (
    <Card className="gap-4">
      <View className="flex-row items-center gap-4">
        <ProgressRing
          progress={progress}
          size={96}
          strokeWidth={10}
          color={accents.water.accent}
          accessibilityLabel={
            goal
              ? t('water.progress', {
                  total: formatVolume(total, units),
                  goal: formatVolume(goal, units),
                })
              : t('water.totalToday', { total: formatVolume(total, units) })
          }
        >
          <Icon name="water" size={28} color={accents.water.accent} />
        </ProgressRing>
        <View className="flex-1 gap-1">
          <Text variant="title2">{formatVolume(total, units)}</Text>
          <Text tone="muted">
            {goal ? t('water.ofGoal', { goal: formatVolume(goal, units) }) : t('water.noGoal')}
          </Text>
          {goal && total >= goal ? (
            <Text tone="accent" variant="label">
              {t('water.goalReached')}
            </Text>
          ) : null}
        </View>
      </View>

      <View className="gap-2">
        <Text variant="label" tone="muted">
          {t('water.drinkType')}
        </Text>
        <View className="flex-row flex-wrap gap-2" accessibilityRole="radiogroup">
          {drinkTypes.map((d) => (
            <Chip
              key={d}
              role="radio"
              selected={drink === d}
              label={t(`water.drinks.${d}`)}
              onPress={() => setDrink(d)}
            />
          ))}
        </View>
      </View>

      <View className="gap-2">
        <Text variant="label" tone="muted">
          {t('water.quickAdd')}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {quickAddSizes(units).map((size) => (
            <Button
              key={size.label}
              variant="accent"
              label={`+ ${size.label}`}
              accessibilityLabel={t('water.addAmount', {
                amount: size.label,
                drink: t(`water.drinks.${drink}`),
              })}
              onPress={() => void logDrink(size.ml, drink)}
            />
          ))}
        </View>
        <View className="flex-row items-end gap-2">
          <View className="flex-1">
            <TextField
              label={t('water.customAmount', { unit: units === 'imperial' ? 'fl oz' : 'ml' })}
              value={custom}
              onChangeText={setCustom}
              keyboardType="decimal-pad"
              error={customError}
              onSubmitEditing={addCustom}
            />
          </View>
          <Button variant="secondary" label={t('water.add')} onPress={addCustom} />
        </View>
      </View>

      {undo ? (
        <View className="flex-row items-center justify-between rounded-md bg-surface-muted px-3 py-2">
          <Text accessibilityLiveRegion="polite">{t('water.removed')}</Text>
          <Button
            variant="ghost"
            label={t('water.undo')}
            onPress={() => {
              restore(undo);
              setUndo(null);
            }}
          />
        </View>
      ) : null}

      {todays.length ? (
        <View className="gap-1">
          <Text variant="label" tone="muted">
            {t('water.today')}
          </Text>
          {todays.map((e) => (
            <View key={e.id} className="min-h-touch flex-row items-center gap-3">
              <Text variant="footnote" tone="muted" className="w-16">
                {new Date(e.at).toLocaleTimeString(i18n.language, {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </Text>
              <Text className="flex-1">{t(`water.drinks.${e.drink}`)}</Text>
              <Text variant="label">{formatVolume(e.amountMl, units)}</Text>
              <Button
                variant="ghost"
                label={t('water.delete')}
                accessibilityLabel={t('water.deleteEntry', {
                  amount: formatVolume(e.amountMl, units),
                  drink: t(`water.drinks.${e.drink}`),
                })}
                onPress={() => {
                  const removed = remove(e.id);
                  if (removed) setUndo(removed);
                }}
              />
            </View>
          ))}
        </View>
      ) : null}

      <Button
        variant="ghost"
        label={goal ? t('water.changeGoal') : t('water.setGoal')}
        onPress={() =>
          router.push({ pathname: '/setup/[requirement]', params: { requirement: 'waterGoal' } })
        }
      />
    </Card>
  );
}

function HistoryCard() {
  const { t, i18n } = useTranslation();
  const { accents } = useTheme();
  const { units } = useRegion();
  const entries = useWater((s) => s.entries);
  const goal = useRequirements((s) => s.waterGoalMl);
  const [range, setRange] = useState<'week' | 'month'>('week');
  const days = range === 'week' ? 7 : 30;
  const today = localDateKey(new Date(), deviceTimeZone());
  const series = dailyTotals(entries, today, days);
  const average = averageOfLoggedDays(series);
  const data = series.map((d, i) => ({
    key: d.day,
    value: d.ml,
    label:
      range === 'week'
        ? new Date(`${d.day}T12:00:00Z`).toLocaleDateString(i18n.language, {
            weekday: 'narrow',
            timeZone: 'UTC',
          })
        : i % 7 === 6
          ? String(Number(d.day.slice(8)))
          : undefined,
  }));
  const summary = t('water.chartSummary', {
    days,
    average: formatVolume(average, units),
    logged: series.filter((d) => d.ml > 0).length,
  });

  return (
    <Card className="gap-3">
      <View className="flex-row items-center justify-between gap-2">
        <Text variant="title3">{t('water.history')}</Text>
      </View>
      <SegmentedControl<'week' | 'month'>
        label={t('water.history')}
        value={range}
        onChange={setRange}
        options={[
          { value: 'week', label: t('water.week') },
          { value: 'month', label: t('water.month') },
        ]}
      />
      <BarChart data={data} reference={goal} color={accents.water.accent} summary={summary} />
      <Text tone="muted">{summary}</Text>
    </Card>
  );
}

function SmartRemindersCard() {
  const { t, i18n } = useTranslation();
  const water = useWater();
  const prefs = useNotificationPrefs();
  const ready = prefs.enabled && prefs.types.smart && prefs.modules.water !== false;
  return (
    <Card className="gap-2">
      <SwitchRow
        icon="bell"
        title={t('water.smart.title')}
        description={t('water.smart.description')}
        value={water.smartReminders}
        onChange={water.setSmartReminders}
      />
      {water.smartReminders ? (
        <>
          <Stepper
            label={t('water.smart.from')}
            value={clockLabel(water.activeStart, i18n.language)}
            decreaseLabel={t('notifications.prefs.earlier')}
            increaseLabel={t('notifications.prefs.later')}
            onDecrease={() =>
              water.setActiveHours(shiftClock(water.activeStart, -30), water.activeEnd)
            }
            onIncrease={() =>
              water.setActiveHours(shiftClock(water.activeStart, 30), water.activeEnd)
            }
          />
          <Stepper
            label={t('water.smart.until')}
            value={clockLabel(water.activeEnd, i18n.language)}
            decreaseLabel={t('notifications.prefs.earlier')}
            increaseLabel={t('notifications.prefs.later')}
            onDecrease={() =>
              water.setActiveHours(water.activeStart, shiftClock(water.activeEnd, -30))
            }
            onIncrease={() =>
              water.setActiveHours(water.activeStart, shiftClock(water.activeEnd, 30))
            }
          />
          {!ready ? (
            <View className="gap-2">
              <Text variant="footnote" tone="muted">
                {t('water.smart.needsPermission')}
              </Text>
              <Button
                variant="secondary"
                label={t('notifications.settings')}
                onPress={() => router.push('/notifications/settings')}
              />
            </View>
          ) : null}
        </>
      ) : null}
    </Card>
  );
}
