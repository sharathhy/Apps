import { Button, Card, Text, TextField } from '@wellness/ui';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Chip } from '@/components/Chip';

import { NutritionPage } from '../components/NutritionPage';
import {
  NUTRIENT_LIMITS,
  emptyNutrients,
  foodGroups,
  parseAmount,
  type FoodGroup,
  type Nutrients,
} from '../model';
import { OFF_ATTRIBUTION, useFoodDraft } from '../openFoodFacts';
import { useNutrition } from '../store';

const fields = ['protein', 'carbs', 'fat', 'fiber', 'kcal'] as const;

const text = (v: number | null | undefined) => (v === null || v === undefined ? '' : String(v));

/** Create or edit one of the person's own foods. Every field says why it is asked for. */
export function FoodFormScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ id?: string; name?: string; draft?: string }>();
  const existing = useNutrition((s) => s.customFoods.find((f) => f.id === params.id));
  const showEnergy = useNutrition((s) => s.showEnergy);
  const [draft] = useState(() => (params.draft ? useFoodDraft.getState().draft : null));
  const start = existing ?? draft ?? {};

  const [name, setName] = useState(start.name ?? params.name ?? '');
  const [group, setGroup] = useState<FoodGroup | null>(
    start.group && start.group !== 'other' ? start.group : null,
  );
  const [serving, setServing] = useState(start.servingUnit ?? '');
  const [grams, setGrams] = useState(text(start.servingGrams));
  const [values, setValues] = useState<Record<(typeof fields)[number], string>>(() => {
    const n = start.nutrients ?? emptyNutrients;
    return {
      protein: text(n.protein),
      carbs: text(n.carbs),
      fat: text(n.fat),
      fiber: text(n.fiber),
      kcal: text(n.kcal),
    };
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const source = start.source ?? 'manual';

  const save = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = t('nutrition.food.errors.name');
    if (!group) next.group = t('nutrition.food.errors.group');
    const gramsValue = parseAmount(grams, 5000);
    if (gramsValue === 'invalid' || gramsValue === 0)
      next.grams = t('nutrition.food.errors.number');
    const nutrients = { ...emptyNutrients };
    for (const f of fields) {
      const v = parseAmount(values[f], NUTRIENT_LIMITS[f]);
      if (v === 'invalid') next[f] = t('nutrition.food.errors.range', { max: NUTRIENT_LIMITS[f] });
      else nutrients[f as keyof Nutrients] = v;
    }
    setErrors(next);
    if (Object.keys(next).length) return;
    useNutrition.getState().saveCustomFood({
      id: existing?.id,
      name,
      group: group!,
      servingUnit: serving,
      servingGrams: gramsValue === 'invalid' ? null : gramsValue,
      nutrients,
      barcode: start.barcode ?? null,
      source,
    });
    useFoodDraft.setState({ draft: null });
    router.back();
  };

  return (
    <NutritionPage title={existing ? t('nutrition.food.edit') : t('nutrition.food.new')}>
      <Card className="gap-4">
        <Text tone="muted">{t('nutrition.food.intro')}</Text>
        {source === 'openFoodFacts' ? (
          <Text variant="footnote" tone="muted">
            {t('nutrition.food.fromOff', { source: OFF_ATTRIBUTION })}
          </Text>
        ) : null}
        <TextField
          label={t('nutrition.food.name')}
          hint={t('nutrition.food.why.name')}
          value={name}
          onChangeText={setName}
          maxLength={200}
          error={errors.name}
        />
        <View className="gap-2">
          <Text variant="label">{t('nutrition.food.group')}</Text>
          <Text variant="footnote" tone="muted">
            {t('nutrition.food.why.group')}
          </Text>
          <View className="flex-row flex-wrap gap-2" accessibilityRole="radiogroup">
            {foodGroups.map((g) => (
              <Chip
                key={g}
                role="radio"
                selected={group === g}
                label={t(`nutrition.groups.${g}`)}
                onPress={() => setGroup(g)}
              />
            ))}
          </View>
          {errors.group ? <Text tone="danger">{errors.group}</Text> : null}
        </View>
        <TextField
          label={t('nutrition.food.serving')}
          hint={t('nutrition.food.why.serving')}
          placeholder={t('nutrition.food.servingPlaceholder')}
          value={serving}
          onChangeText={setServing}
          maxLength={60}
        />
        <TextField
          label={t('nutrition.food.grams')}
          hint={t('nutrition.food.why.optional')}
          value={grams}
          onChangeText={setGrams}
          keyboardType="decimal-pad"
          error={errors.grams}
        />
        <View className="gap-2">
          <Text variant="label">{t('nutrition.food.perServing')}</Text>
          <Text variant="footnote" tone="muted">
            {t('nutrition.food.why.nutrients')}
          </Text>
          {fields
            .filter((f) => f !== 'kcal' || showEnergy)
            .map((f) => (
              <TextField
                key={f}
                label={
                  f === 'kcal'
                    ? t('nutrition.food.kcalLabel')
                    : t('nutrition.food.gramsOf', { nutrient: t(`nutrition.nutrients.${f}`) })
                }
                value={values[f]}
                onChangeText={(v) => setValues((s) => ({ ...s, [f]: v }))}
                keyboardType="decimal-pad"
                error={errors[f]}
              />
            ))}
        </View>
        {start.barcode ? (
          <Text variant="footnote" tone="muted">
            {t('nutrition.food.barcode', { code: start.barcode })}
          </Text>
        ) : null}
        <Button variant="accent" label={t('nutrition.food.save')} onPress={save} />
        {existing ? (
          <Button
            variant="ghost"
            label={t('nutrition.food.delete')}
            onPress={() => {
              useNutrition.getState().removeCustomFood(existing.id);
              router.back();
            }}
          />
        ) : null}
      </Card>
    </NutritionPage>
  );
}
