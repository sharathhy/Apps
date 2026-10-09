import { useAchievements } from '@/features/achievements/store';
import { useConsent } from '@/features/consent/store';
import { useProfile } from '@/features/profile/store';
import { deviceTimeZone } from '@/lib/time/device';
import { localDateKey } from '@/lib/time/zoned';
import { fireEvent, render, screen } from '@/test-utils';

import { NutritionScreen } from '..';
import { logFood } from '../actions';
import { AddFoodScreen } from '../screens/AddFoodScreen';
import { FoodFormScreen } from '../screens/FoodFormScreen';
import { useNutrition } from '../store';

const mockParams: Record<string, string> = {};
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: () => mockBack(), replace: jest.fn() },
  Stack: { Screen: () => null },
  useLocalSearchParams: () => mockParams,
}));
jest.mock('@/lib/useRegion', () => ({
  useRegion: () => ({ region: 'IN', units: 'metric', dateOrder: 'DMY', currency: 'INR' }),
}));

const today = () => localDateKey(new Date(), deviceTimeZone());

beforeEach(() => {
  useNutrition.getState().reset();
  useAchievements.getState().reset();
  useProfile.getState().chooseAudience('everyone');
  useConsent.getState().decide('nutrition', true);
  Object.keys(mockParams).forEach((k) => delete mockParams[k]);
  mockBack.mockClear();
});

describe('NutritionScreen', () => {
  it('shows the meals, the plate guidance and the disclaimer', async () => {
    await render(<NutritionScreen />);
    expect(screen.getByText('Breakfast')).toBeTruthy();
    expect(screen.getByText(/My Plate for the Day/)).toBeTruthy();
    expect(screen.getByText('Log a meal to see how your day comes together.')).toBeTruthy();
    expect(screen.getByText(/does not provide medical advice/i)).toBeTruthy();
  });

  it('shows what the day covered, with positive wording and no targets', async () => {
    await logFood('lunch', today(), {
      foodRef: 'in:palak',
      name: 'Palak or saag',
      quantity: 1,
      unit: 'katori',
      group: 'vegetables',
      nutrients: null,
    });
    await render(<NutritionScreen />);
    expect(screen.getByText('Palak or saag')).toBeTruthy();
    expect(screen.getByText('Vegetables at 1 meal.')).toBeTruthy();
    expect(screen.getByText(/Ideas for variety another time/)).toBeTruthy();
    expect(screen.queryByText(/goal|target to|remaining|left today/i)).toBeNull();
    expect(useAchievements.getState().activity.counts.colourful_day).toBe(1);
  });

  it('hides energy until the person turns it on', async () => {
    await logFood('snack', today(), {
      foodRef: 'custom:bar',
      name: 'Oat bar',
      quantity: 1,
      unit: '1 bar',
      group: 'grains',
      nutrients: { kcal: 160, protein: 4, carbs: 24, fat: 5, fiber: 2 },
    });
    await render(<NutritionScreen />);
    expect(screen.queryByText(/160/)).toBeNull();
    expect(screen.getByText('4 g')).toBeTruthy();
    await fireEvent(screen.getByRole('switch', { name: /Show energy/ }), 'valueChange', true);
    expect((await screen.findAllByText(/160 kcal/)).length).toBeGreaterThan(0);
  });

  it('removes a food with undo, and records home cooking', async () => {
    await logFood('dinner', today(), {
      foodRef: 'in:dal',
      name: 'Dal',
      quantity: 1,
      unit: 'katori',
      group: 'pulses',
      nutrients: null,
    });
    await render(<NutritionScreen />);
    await fireEvent(screen.getByRole('switch', { name: /Home-cooked/ }), 'valueChange', true);
    expect(useNutrition.getState().meals[0]?.homeCooked).toBe(true);
    expect(useAchievements.getState().activity.counts.home_cooked_meal).toBe(1);
    await fireEvent.press(screen.getByLabelText('Remove Dal'));
    expect(useNutrition.getState().items).toHaveLength(0);
    expect(useNutrition.getState().meals).toHaveLength(0);
    await fireEvent.press(screen.getByRole('button', { name: 'Undo' }));
    expect(useNutrition.getState().items).toHaveLength(1);
    expect(useNutrition.getState().meals[0]?.homeCooked).toBe(true);
  });
});

describe('AddFoodScreen', () => {
  it('finds roti by another name and logs it to the chosen meal', async () => {
    mockParams.meal = 'breakfast';
    mockParams.day = today();
    await render(<AddFoodScreen />);
    await fireEvent.changeText(screen.getByLabelText('Search foods'), 'chapati');
    await fireEvent.press(screen.getByLabelText('Roti, Grains and millets'));
    await fireEvent.press(screen.getByLabelText('More'));
    await fireEvent.press(screen.getByRole('button', { name: 'Add' }));
    const { meals, items } = useNutrition.getState();
    expect(meals[0]).toMatchObject({ type: 'breakfast', day: today() });
    expect(items[0]).toMatchObject({
      foodRef: 'in:roti',
      quantity: 1.5,
      unit: 'piece',
      nutrients: null,
    });
    expect(mockBack).toHaveBeenCalled();
  });
});

describe('FoodFormScreen', () => {
  it('explains each field and saves a food with only a name and group', async () => {
    await render(<FoodFormScreen />);
    expect(screen.getByText('Used for your balanced plate view.')).toBeTruthy();
    expect(screen.queryByLabelText('Energy (kcal)')).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Save food' }));
    expect(screen.getByText('Please enter a name.')).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Name'), 'Thepla');
    await fireEvent.press(screen.getByRole('radio', { name: 'Grains and millets' }));
    await fireEvent.changeText(screen.getByLabelText('Protein (g)'), '999');
    await fireEvent.press(screen.getByRole('button', { name: 'Save food' }));
    expect(screen.getByText(/from 0 to 400/)).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Protein (g)'), '3.5');
    await fireEvent.press(screen.getByRole('button', { name: 'Save food' }));
    expect(useNutrition.getState().customFoods[0]).toMatchObject({
      name: 'Thepla',
      group: 'grains',
      servingUnit: '1 serving',
      nutrients: { protein: 3.5, kcal: null },
    });
  });
});
