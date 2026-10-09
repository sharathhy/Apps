import { Button, Card, Pressable, Text, TextField } from '@wellness/ui';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Chip } from '@/components/Chip';
import { Stepper } from '@/components/Stepper';
import { deviceTimeZone } from '@/lib/time/device';
import { localDateKey } from '@/lib/time/zoned';
import { useRegion } from '@/lib/useRegion';

import { logFood } from '../actions';
import { NutritionPage } from '../components/NutritionPage';
import { amountLabel, formatAmount } from '../display';
import { builtInFoods, foodName, searchFoods } from '../foods';
import {
  MAX_QUANTITY,
  mealTypes,
  scaleNutrients,
  type CustomFood,
  type FoodGroup,
  type MealType,
  type Nutrients,
} from '../model';
import { useNutrition } from '../store';

/** Something that can be logged: a built-in food or one of the person's own. */
interface Choice {
  ref: string;
  name: string;
  /** Stored name (English for built-in foods). */
  savedName: string;
  group: FoodGroup;
  units: string[];
  perUnit: { unit: string; values: Nutrients } | null;
  mine: boolean;
}

const fromCustom = (f: CustomFood): Choice => ({
  ref: `custom:${f.id}`,
  name: f.name,
  savedName: f.name,
  group: f.group,
  units: [f.servingUnit],
  perUnit: { unit: f.servingUnit, values: f.nutrients },
  mine: true,
});

export function AddFoodScreen() {
  const { t, i18n } = useTranslation();
  const { region } = useRegion();
  const params = useLocalSearchParams<{ meal?: string; day?: string }>();
  const meal: MealType = mealTypes.includes(params.meal as MealType)
    ? (params.meal as MealType)
    : 'snack';
  const day = params.day ?? localDateKey(new Date(), deviceTimeZone());
  const customFoods = useNutrition((s) => s.customFoods);
  const items = useNutrition((s) => s.items);
  const [query, setQuery] = useState('');
  const [chosen, setChosen] = useState<Choice | null>(null);

  const choices = useMemo(() => {
    const language = i18n.language;
    const builtIn = searchFoods(builtInFoods, query, region).map<Choice>((f) => ({
      ref: f.ref,
      name: foodName(f, language),
      savedName: f.name,
      group: f.group,
      units: f.units,
      perUnit: f.nutrients ? { unit: f.nutrients.per, values: f.nutrients.values } : null,
      mine: false,
    }));
    const q = query.trim().toLowerCase();
    const mine = customFoods.filter((f) => !q || f.name.toLowerCase().includes(q)).map(fromCustom);
    if (q) return [...mine, ...builtIn].slice(0, 40);
    // Nothing typed: recent foods first, then the person's own, then the list.
    const recentRefs = [...new Set([...items].reverse().map((i) => i.foodRef))].slice(0, 8);
    const all = [...mine, ...builtIn];
    const recent = recentRefs
      .map((ref) => all.find((c) => c.ref === ref))
      .filter((c): c is Choice => !!c);
    return [...recent, ...all.filter((c) => !recentRefs.includes(c.ref))].slice(0, 40);
  }, [query, region, customFoods, items, i18n.language]);

  if (chosen) {
    return (
      <NutritionPage title={t('nutrition.addTo', { meal: t(`nutrition.meals.${meal}`) })}>
        <AmountCard
          choice={chosen}
          onCancel={() => setChosen(null)}
          onAdd={(quantity, unit) => {
            const nutrients =
              chosen.perUnit && chosen.perUnit.unit === unit
                ? scaleNutrients(chosen.perUnit.values, quantity)
                : null;
            void logFood(meal, day, {
              foodRef: chosen.ref,
              name: chosen.savedName,
              quantity,
              unit,
              group: chosen.group,
              nutrients,
            });
            router.back();
          }}
        />
      </NutritionPage>
    );
  }

  return (
    <NutritionPage title={t('nutrition.addTo', { meal: t(`nutrition.meals.${meal}`) })}>
      <TextField
        label={t('nutrition.search.label')}
        hint={t('nutrition.search.hint')}
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
        returnKeyType="search"
      />
      <View className="flex-row flex-wrap gap-2">
        <Button
          variant="secondary"
          label={t('nutrition.scan.title')}
          onPress={() =>
            router.push({ pathname: '/nutrition-tools/[tool]', params: { tool: 'scan' } })
          }
        />
        <Button
          variant="secondary"
          label={t('nutrition.food.new')}
          onPress={() =>
            router.push({
              pathname: '/nutrition-tools/[tool]',
              params: { tool: 'food', name: query.trim() },
            })
          }
        />
      </View>
      <Card className="gap-0">
        {choices.length === 0 ? (
          <Text tone="muted">{t('nutrition.search.none')}</Text>
        ) : (
          choices.map((c) => (
            <Pressable
              key={c.ref}
              accessibilityRole="button"
              accessibilityLabel={`${c.name}, ${t(`nutrition.groups.${c.group}`)}`}
              onPress={() => setChosen(c)}
              noScale
              className="min-h-touch flex-row items-center gap-3 border-b border-border py-2"
            >
              <View className="flex-1">
                <Text>{c.name}</Text>
                <Text variant="footnote" tone="muted">
                  {t(`nutrition.groups.${c.group}`)}
                  {c.mine ? ` · ${t('nutrition.mine')}` : ''}
                </Text>
              </View>
            </Pressable>
          ))
        )}
      </Card>
    </NutritionPage>
  );
}

function AmountCard({
  choice,
  onAdd,
  onCancel,
}: {
  choice: Choice;
  onAdd: (quantity: number, unit: string) => void;
  onCancel: () => void;
}) {
  const { t, i18n } = useTranslation();
  const showEnergy = useNutrition((s) => s.showEnergy);
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState(choice.units[0]!);
  const values =
    choice.perUnit && choice.perUnit.unit === unit
      ? scaleNutrients(choice.perUnit.values, quantity)
      : null;
  const step = quantity < 1 ? 0.25 : 0.5;

  return (
    <Card className="gap-4">
      <Text variant="title2">{choice.name}</Text>
      <Text tone="muted">{t(`nutrition.groups.${choice.group}`)}</Text>
      {choice.units.length > 1 ? (
        <View className="flex-row flex-wrap gap-2" accessibilityRole="radiogroup">
          {choice.units.map((u) => (
            <Chip
              key={u}
              role="radio"
              selected={u === unit}
              label={amountLabel(t, 1, u)}
              onPress={() => setUnit(u)}
            />
          ))}
        </View>
      ) : null}
      <Stepper
        label={t('nutrition.amount')}
        value={amountLabel(t, quantity, unit)}
        decreaseLabel={t('nutrition.less')}
        increaseLabel={t('nutrition.more')}
        canDecrease={quantity > 0.25}
        canIncrease={quantity < MAX_QUANTITY}
        onDecrease={() => setQuantity((q) => Math.max(0.25, q - (q <= 1 ? 0.25 : 0.5)))}
        onIncrease={() => setQuantity((q) => Math.min(MAX_QUANTITY, q + step))}
      />
      {values ? (
        <Text tone="muted">
          {[
            t('nutrition.nutrientLine', {
              protein: formatAmount(values.protein ?? 0, i18n.language),
              carbs: formatAmount(values.carbs ?? 0, i18n.language),
              fat: formatAmount(values.fat ?? 0, i18n.language),
              fiber: formatAmount(values.fiber ?? 0, i18n.language),
            }),
            showEnergy && values.kcal !== null
              ? t('nutrition.kcal', { value: formatAmount(values.kcal, i18n.language) })
              : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      ) : (
        <Text variant="footnote" tone="muted">
          {t('nutrition.groupOnly')}
        </Text>
      )}
      <Button variant="accent" label={t('nutrition.add')} onPress={() => onAdd(quantity, unit)} />
      <Button variant="ghost" label={t('nutrition.back')} onPress={onCancel} />
    </Card>
  );
}
