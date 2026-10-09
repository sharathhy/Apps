import { builtInFoods, foodByRef, searchFoods } from '../foods';
import {
  dayTotals,
  foodGroups,
  isColourfulDay,
  nutritionCsv,
  parseAmount,
  plateForDay,
  scaleNutrients,
  units,
  type Meal,
  type MealItem,
} from '../model';
import { cleanBarcode, draftFromProduct, lookupBarcode } from '../openFoodFacts';

const meal = (id: string, type: Meal['type'] = 'lunch'): Meal => ({
  id,
  type,
  at: '2026-10-09T07:00:00.000Z',
  day: '2026-10-09',
  homeCooked: false,
  updatedAt: '2026-10-09T07:00:00.000Z',
});

const item = (
  mealId: string,
  group: MealItem['group'],
  nutrients: MealItem['nutrients'] = null,
): MealItem => ({
  id: `${mealId}-${group}`,
  mealId,
  foodRef: 'custom:x',
  name: group,
  quantity: 1,
  unit: 'katori',
  group,
  nutrients,
  updatedAt: '2026-10-09T07:00:00.000Z',
});

describe('nutrition calculations', () => {
  it('scales per-serving values and keeps unknown values unknown', () => {
    expect(
      scaleNutrients({ kcal: 120.5, protein: 3.333, carbs: null, fat: 1, fiber: 0 }, 1.5),
    ).toEqual({ kcal: 180.75, protein: 5, carbs: null, fat: 1.5, fiber: 0 });
  });

  it('totals only foods with values and says how many that is', () => {
    const totals = dayTotals([
      item('a', 'grains', { kcal: 100, protein: 3, carbs: 20, fat: 1, fiber: 2 }),
      item('a', 'dairy', { kcal: 60, protein: 3.5, carbs: null, fat: 3, fiber: null }),
      item('a', 'vegetables'),
    ]);
    expect(totals.nutrients).toEqual({ kcal: 160, protein: 6.5, carbs: 20, fat: 4, fiber: 2 });
    expect(totals.itemsWithValues).toBe(2);
    expect(totals.items).toBe(3);
  });

  it('builds the plate from food groups, per guide', () => {
    const meals = [meal('b', 'breakfast'), meal('l')];
    const items = [
      item('b', 'fruits'),
      item('b', 'grains'),
      item('l', 'vegetables'),
      item('l', 'pulses'),
      item('l', 'grains'),
      item('l', 'mixed'),
    ];
    const india = Object.fromEntries(plateForDay(meals, items, 'IN').map((s) => [s.id, s.meals]));
    expect(india).toEqual({
      vegetables: 1,
      fruits: 1,
      grains: 2,
      pulsesProtein: 1,
      dairy: 0,
      nutsSeeds: 0,
    });
    const usa = Object.fromEntries(plateForDay(meals, items, 'US').map((s) => [s.id, s.meals]));
    expect(usa).toEqual({ vegetables: 1, fruits: 1, grains: 2, protein: 1, dairy: 0 });
    expect(isColourfulDay(items)).toBe(true);
    expect(isColourfulDay([item('l', 'grains')])).toBe(false);
  });

  it('reads typed amounts, treating blank as unknown', () => {
    expect(parseAmount('', 100)).toBeNull();
    expect(parseAmount(' 2,5 ', 100)).toBe(2.5);
    expect(parseAmount('-1', 100)).toBe('invalid');
    expect(parseAmount('101', 100)).toBe('invalid');
    expect(parseAmount('abc', 100)).toBe('invalid');
  });

  it('exports a CSV with quoting', () => {
    const csv = nutritionCsv([meal('l')], [{ ...item('l', 'mixed'), name: 'Dal, rice' }]);
    expect(csv.split('\n')).toEqual([
      'day,meal,home_cooked,food,quantity,unit,food_group,energy_kcal,protein_g,carbs_g,fat_g,fiber_g',
      '2026-10-09,lunch,no,"Dal, rice",1,katori,mixed,,,,,',
    ]);
  });
});

describe('food list', () => {
  it('has unique ids, real groups and real measures, and no typed-in nutrient values', () => {
    expect(new Set(builtInFoods.map((f) => f.ref)).size).toBe(builtInFoods.length);
    for (const f of builtInFoods) {
      expect(foodGroups).toContain(f.group);
      f.units.forEach((u) => expect(units).toContain(u));
      expect(f.nutrients).toBeUndefined();
    }
  });

  it('finds foods by other names and in Hindi, preferring the person’s region', () => {
    expect(searchFoods(builtInFoods, 'chapati', 'IN')[0]?.ref).toBe('in:roti');
    expect(searchFoods(builtInFoods, 'दाल', 'IN')[0]?.ref).toBe('in:dal');
    expect(searchFoods(builtInFoods, 'apple', 'IN')[0]?.ref).toBe('in:apple');
    expect(searchFoods(builtInFoods, 'apple', 'US')[0]?.ref).toBe('us:usApple');
    expect(searchFoods(builtInFoods, 'zzzz', 'US')).toEqual([]);
    expect(foodByRef.get('in:idli')?.hi).toBe('इडली');
  });
});

describe('barcode lookup', () => {
  it('accepts 8 to 14 digit barcodes only', () => {
    expect(cleanBarcode('8901058 000290')).toBe('8901058000290');
    expect(cleanBarcode('1234567')).toBeNull();
    expect(cleanBarcode('12345678901234567')).toBeNull();
    expect(cleanBarcode('abc12345678')).toBeNull();
  });

  it('uses per-serving values when the packet gives a serving', () => {
    const draft = draftFromProduct('123456789012', {
      product_name: 'Oat bar',
      brands: 'Acme',
      serving_size: '1 bar (40 g)',
      serving_quantity: 40,
      nutriments: {
        'energy-kcal_serving': 160,
        proteins_serving: 4,
        carbohydrates_serving: '24',
        fat_serving: 5.5,
        'energy-kcal_100g': 400,
      },
    });
    expect(draft).toMatchObject({
      name: 'Oat bar · Acme',
      barcode: '123456789012',
      servingUnit: '1 bar (40 g)',
      servingGrams: 40,
      nutrients: { kcal: 160, protein: 4, carbs: 24, fat: 5.5, fiber: null },
      source: 'openFoodFacts',
    });
  });

  it('falls back to per 100 g and drops impossible values', () => {
    const draft = draftFromProduct('12345678', {
      product_name: 'Juice',
      nutriments: { 'energy-kcal_100g': 45, proteins_100g: 99999, fiber_100g: -1 },
    });
    expect(draft.servingUnit).toBe('100 g');
    expect(draft.servingGrams).toBe(100);
    expect(draft.nutrients).toEqual({
      kcal: 45,
      protein: null,
      carbs: null,
      fat: null,
      fiber: null,
    });
  });

  it('returns nothing for unknown products', async () => {
    const fake = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ status: 0 }),
    })) as unknown as typeof fetch;
    expect(await lookupBarcode('12345678', fake)).toBeNull();
    expect((fake as jest.Mock).mock.calls[0][0]).toContain('/api/v2/product/12345678.json');
  });
});
