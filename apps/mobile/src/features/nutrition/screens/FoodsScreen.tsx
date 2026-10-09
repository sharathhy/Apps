import { Button, Card, Pressable, Text } from '@wellness/ui';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { NutritionPage } from '../components/NutritionPage';
import { useNutrition } from '../store';

/** The person's own foods, to edit or delete. */
export function FoodsScreen() {
  const { t } = useTranslation();
  const foods = useNutrition((s) => s.customFoods);
  return (
    <NutritionPage title={t('nutrition.myFoods')}>
      <Button
        variant="accent"
        label={t('nutrition.food.new')}
        onPress={() =>
          router.push({ pathname: '/nutrition-tools/[tool]', params: { tool: 'food' } })
        }
      />
      <Card className="gap-0">
        {foods.length === 0 ? (
          <Text tone="muted">{t('nutrition.food.none')}</Text>
        ) : (
          foods.map((f) => (
            <Pressable
              key={f.id}
              accessibilityRole="button"
              accessibilityLabel={t('nutrition.food.editNamed', { name: f.name })}
              noScale
              onPress={() =>
                router.push({
                  pathname: '/nutrition-tools/[tool]',
                  params: { tool: 'food', id: f.id },
                })
              }
              className="min-h-touch flex-row items-center gap-3 border-b border-border py-2"
            >
              <View className="flex-1">
                <Text>{f.name}</Text>
                <Text variant="footnote" tone="muted">
                  {t(`nutrition.groups.${f.group}`)} · {f.servingUnit}
                </Text>
              </View>
            </Pressable>
          ))
        )}
      </Card>
    </NutritionPage>
  );
}
