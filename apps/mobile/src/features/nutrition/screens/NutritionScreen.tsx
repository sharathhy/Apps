import {
  AccentScope,
  Appear,
  Button,
  Card,
  Icon,
  Pressable,
  Screen,
  Text,
  useTheme,
} from '@wellness/ui';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { ListRow } from '@/components/ListRow';
import { MedicalDisclaimer } from '@/components/MedicalDisclaimer';
import { SwitchRow } from '@/components/SwitchRow';
import { saveTextFile } from '@/features/data/export';
import { formatDateKey } from '@/lib/region';
import { addDaysKey } from '@/lib/time/days';
import { deviceTimeZone } from '@/lib/time/device';
import { localDateKey } from '@/lib/time/zoned';
import { useRegion } from '@/lib/useRegion';

import { markHomeCooked } from '../actions';
import { amountLabel, formatAmount, itemName } from '../display';
import { nutritionModule } from '../manifest';
import {
  dayTotals,
  mealTypes,
  nutrientKeys,
  nutritionCsv,
  plateForDay,
  type MealType,
} from '../model';
import { useNutrition, type Removed } from '../store';

export function NutritionScreen() {
  const { t } = useTranslation();
  const { accents } = useTheme();
  const today = localDateKey(new Date(), deviceTimeZone());
  const [day, setDay] = useState(today);

  return (
    <AccentScope module="nutrition">
      <Screen>
        <View className="flex-row items-center gap-3">
          <View className="rounded-lg bg-accent-soft p-2">
            <Icon name={nutritionModule.icon} size={28} color={accents.nutrition.accent} />
          </View>
          <View className="flex-1">
            <Text variant="title1">{t('modules.nutrition.title')}</Text>
            <Text tone="muted">{t('nutrition.subtitle')}</Text>
          </View>
        </View>
        <DayNav day={day} today={today} onChange={setDay} />
        <Appear>
          <MealsCard day={day} />
        </Appear>
        <Appear index={1}>
          <PlateCard day={day} />
        </Appear>
        <Appear index={2}>
          <TotalsCard day={day} />
        </Appear>
        <Appear index={3}>
          <MoreCard />
        </Appear>
        <MedicalDisclaimer />
      </Screen>
    </AccentScope>
  );
}

function DayNav({
  day,
  today,
  onChange,
}: {
  day: string;
  today: string;
  onChange: (day: string) => void;
}) {
  const { t } = useTranslation();
  const { dateOrder } = useRegion();
  const label =
    day === today
      ? t('nutrition.today')
      : day === addDaysKey(today, -1)
        ? t('nutrition.yesterday')
        : formatDateKey(day, dateOrder);
  return (
    <View className="flex-row items-center justify-between">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('nutrition.previousDay')}
        onPress={() => onChange(addDaysKey(day, -1))}
        className="min-h-touch min-w-touch items-center justify-center"
      >
        <Icon name="chevronLeft" size={22} />
      </Pressable>
      <Text variant="title3" accessibilityLiveRegion="polite">
        {label}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('nutrition.nextDay')}
        accessibilityState={{ disabled: day >= today }}
        disabled={day >= today}
        onPress={() => onChange(addDaysKey(day, 1))}
        className={`min-h-touch min-w-touch items-center justify-center ${day >= today ? 'opacity-30' : ''}`}
      >
        <Icon name="chevronRight" size={22} />
      </Pressable>
    </View>
  );
}

function MealsCard({ day }: { day: string }) {
  const { t, i18n } = useTranslation();
  const meals = useNutrition((s) => s.meals);
  const items = useNutrition((s) => s.items);
  const showEnergy = useNutrition((s) => s.showEnergy);
  const { removeItem, restore } = useNutrition.getState();
  const [undo, setUndo] = useState<Removed | null>(null);

  const add = (meal: MealType) =>
    router.push({ pathname: '/nutrition-tools/[tool]', params: { tool: 'add', meal, day } });

  return (
    <Card className="gap-4">
      {mealTypes.map((type) => {
        const meal = meals.find((m) => m.day === day && m.type === type);
        const mealItems = meal ? items.filter((i) => i.mealId === meal.id) : [];
        return (
          <View key={type} className="gap-2 border-b border-border pb-3">
            <View className="flex-row items-center justify-between gap-2">
              <Text variant="title3">{t(`nutrition.meals.${type}`)}</Text>
              <Button
                variant="secondary"
                label={t('nutrition.add')}
                accessibilityLabel={t('nutrition.addTo', { meal: t(`nutrition.meals.${type}`) })}
                onPress={() => add(type)}
              />
            </View>
            {mealItems.map((item) => (
              <View key={item.id} className="min-h-touch flex-row items-center gap-3">
                <View className="flex-1">
                  <Text>{itemName(item, i18n.language)}</Text>
                  <Text variant="footnote" tone="muted">
                    {amountLabel(t, item.quantity, item.unit)}
                    {showEnergy && item.nutrients?.kcal != null
                      ? ` · ${t('nutrition.kcal', { value: formatAmount(item.nutrients.kcal, i18n.language) })}`
                      : ''}
                  </Text>
                </View>
                <Button
                  variant="ghost"
                  label={t('nutrition.remove')}
                  accessibilityLabel={t('nutrition.removeItem', {
                    food: itemName(item, i18n.language),
                  })}
                  onPress={() => {
                    const removed = removeItem(item.id);
                    if (removed) setUndo(removed);
                  }}
                />
              </View>
            ))}
            {meal ? (
              <SwitchRow
                title={t('nutrition.homeCooked')}
                value={meal.homeCooked}
                onChange={(on) => void markHomeCooked(meal.id, on)}
              />
            ) : null}
          </View>
        );
      })}
      {undo ? (
        <View className="flex-row items-center justify-between rounded-md bg-surface-muted px-3 py-2">
          <Text accessibilityLiveRegion="polite">{t('nutrition.removed')}</Text>
          <Button
            variant="ghost"
            label={t('nutrition.undo')}
            onPress={() => {
              restore(undo);
              setUndo(null);
            }}
          />
        </View>
      ) : null}
    </Card>
  );
}

function PlateCard({ day }: { day: string }) {
  const { t } = useTranslation();
  const { region } = useRegion();
  const meals = useNutrition((s) => s.meals).filter((m) => m.day === day);
  const items = useNutrition((s) => s.items);
  const sections = plateForDay(meals, items, region);
  const had = sections.filter((s) => s.meals > 0);
  const ideas = sections.filter((s) => s.meals === 0);

  return (
    <Card className="gap-3">
      <Text variant="title3">{t('nutrition.plate.title')}</Text>
      <Text tone="muted">{t(`nutrition.plate.guide.${region}`)}</Text>
      <View className="flex-row flex-wrap gap-2">
        {sections.map((s) => (
          <View
            key={s.id}
            className={`rounded-full px-3 py-1 ${s.meals > 0 ? 'bg-accent' : 'border border-border'}`}
            accessibilityLabel={
              s.meals > 0
                ? t('nutrition.plate.hadA11y', {
                    group: t(`nutrition.plate.sections.${s.id}`),
                    count: s.meals,
                  })
                : t(`nutrition.plate.sections.${s.id}`)
            }
          >
            <Text variant="footnote" tone={s.meals > 0 ? 'onAccent' : 'muted'}>
              {t(`nutrition.plate.sections.${s.id}`)}
            </Text>
          </View>
        ))}
      </View>
      {meals.length === 0 ? (
        <Text tone="muted">{t('nutrition.plate.empty')}</Text>
      ) : (
        <>
          {had.map((s) => (
            <Text key={s.id}>
              {t('nutrition.plate.had', {
                group: t(`nutrition.plate.sections.${s.id}`),
                count: s.meals,
              })}
            </Text>
          ))}
          {ideas.length ? (
            <Text tone="muted">
              {t('nutrition.plate.ideas', {
                groups: ideas.map((s) => t(`nutrition.plate.sections.${s.id}`)).join(', '),
              })}
            </Text>
          ) : null}
        </>
      )}
      <Text variant="footnote" tone="muted">
        {t(`nutrition.plate.source.${region}`)}
      </Text>
    </Card>
  );
}

function TotalsCard({ day }: { day: string }) {
  const { t, i18n } = useTranslation();
  const showEnergy = useNutrition((s) => s.showEnergy);
  const mealIds = new Set(
    useNutrition((s) => s.meals)
      .filter((m) => m.day === day)
      .map((m) => m.id),
  );
  const items = useNutrition((s) => s.items).filter((i) => mealIds.has(i.mealId));
  const totals = dayTotals(items);
  if (!items.length) return null;

  return (
    <Card className="gap-3">
      <Text variant="title3">{t('nutrition.totals.title')}</Text>
      {totals.itemsWithValues === 0 ? (
        <Text tone="muted">{t('nutrition.totals.none')}</Text>
      ) : (
        <>
          <View className="flex-row flex-wrap gap-3">
            {nutrientKeys.map((k) => (
              <View key={k} className="min-w-[72px] gap-0.5 rounded-md bg-surface-muted px-3 py-2">
                <Text variant="footnote" tone="muted">
                  {t(`nutrition.nutrients.${k}`)}
                </Text>
                <Text variant="label">
                  {t('nutrition.grams', {
                    value: formatAmount(totals.nutrients[k], i18n.language),
                  })}
                </Text>
              </View>
            ))}
            {showEnergy ? (
              <View className="min-w-[72px] gap-0.5 rounded-md bg-surface-muted px-3 py-2">
                <Text variant="footnote" tone="muted">
                  {t('nutrition.nutrients.kcal')}
                </Text>
                <Text variant="label">
                  {t('nutrition.kcal', {
                    value: formatAmount(totals.nutrients.kcal, i18n.language),
                  })}
                </Text>
              </View>
            ) : null}
          </View>
          {totals.itemsWithValues < totals.items ? (
            <Text variant="footnote" tone="muted">
              {t('nutrition.totals.partial', {
                count: totals.itemsWithValues,
                total: totals.items,
              })}
            </Text>
          ) : null}
        </>
      )}
      <Text variant="footnote" tone="muted">
        {t('nutrition.totals.noTargets')}
      </Text>
    </Card>
  );
}

function MoreCard() {
  const { t } = useTranslation();
  const showEnergy = useNutrition((s) => s.showEnergy);
  const setShowEnergy = useNutrition((s) => s.setShowEnergy);
  const [message, setMessage] = useState<string | null>(null);
  return (
    <Card className="gap-1">
      <SwitchRow
        title={t('nutrition.showEnergy.title')}
        description={t('nutrition.showEnergy.description')}
        value={showEnergy}
        onChange={setShowEnergy}
      />
      <ListRow
        icon="nutrition"
        label={t('nutrition.myFoods')}
        onPress={() =>
          router.push({ pathname: '/nutrition-tools/[tool]', params: { tool: 'foods' } })
        }
      />
      <ListRow
        icon="barcode"
        label={t('nutrition.scan.title')}
        onPress={() =>
          router.push({ pathname: '/nutrition-tools/[tool]', params: { tool: 'scan' } })
        }
      />
      <ListRow
        icon="download"
        label={t('nutrition.export')}
        onPress={() => {
          const { meals, items } = useNutrition.getState();
          saveTextFile('nutrition.csv', nutritionCsv(meals, items), 'text/csv')
            .then(() => setMessage(null))
            .catch(() => setMessage(t('dataControls.exportFailed')));
        }}
      />
      {message ? <Text tone="danger">{message}</Text> : null}
    </Card>
  );
}
