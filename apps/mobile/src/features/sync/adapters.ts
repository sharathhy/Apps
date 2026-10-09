import type { ModuleId } from '@wellness/design-tokens';

import type { CycleDayLog, CycleSymptom, Flow, Period } from '@/features/cycle/model';
import { useCycle } from '@/features/cycle/store';
import type {
  BreathingPatternId,
  BreathingSession,
  JournalEntry,
  MoodEntry,
  MoodLevel,
  MoodTag,
} from '@/features/mood/model';
import { useMood } from '@/features/mood/store';
import {
  foodGroups,
  type CustomFood,
  type FoodGroup,
  type Meal,
  type MealItem,
  type MealType,
  type Nutrients,
} from '@/features/nutrition/model';
import { useNutrition } from '@/features/nutrition/store';
import type { KickSession, PregnancySymptom } from '@/features/pregnancy/model';
import {
  usePregnancy,
  type Appointment,
  type BabyName,
  type BagItem,
  type SymptomEntry,
  type WeightEntry,
} from '@/features/pregnancy/store';
import { useRequirements } from '@/features/requirements/store';
import type { SleepEntry } from '@/features/sleep/model';
import { useSleep } from '@/features/sleep/store';
import type { DrinkType, WaterEntry } from '@/features/water/model';
import { useWater } from '@/features/water/store';

import type { Row, SyncAdapter } from './engine';
import { stableUuid } from './ids';

/** A synced table: which module's consent covers it, and whether it can sync right now. */
export interface SyncTableDef<T = unknown> extends SyncAdapter<T> {
  module: ModuleId;
  /** False while the table cannot sync yet (for example, no pregnancy to attach to). Skipped, never emptied. */
  ready?: () => boolean;
}

const def = <T>(d: SyncTableDef<T>) => d as unknown as SyncTableDef;

const str = (v: unknown) => (typeof v === 'string' ? v : '');
const strOrNull = (v: unknown) => (typeof v === 'string' ? v : null);
const num = (v: unknown) => (typeof v === 'number' ? v : Number(v));
const iso = (v: unknown) => new Date(str(v)).toISOString();
const day = (v: unknown) => str(v).slice(0, 10);
const arr = <T>(v: unknown) => (Array.isArray(v) ? (v as T[]) : []);

/** Keeps the first record for each key (the records arrive newest-first where it matters). */
function uniqueBy<T>(records: T[], key: (r: T) => string, newer?: (a: T, b: T) => boolean): T[] {
  const out = new Map<string, T>();
  for (const r of records) {
    const k = key(r);
    const seen = out.get(k);
    if (!seen || (newer && newer(r, seen))) out.set(k, r);
  }
  return records.filter((r) => out.get(key(r)) === r);
}

const numOrNull = (v: unknown) => (v === null || v === undefined ? null : num(v));
const group = (v: unknown): FoodGroup =>
  (foodGroups as readonly string[]).includes(str(v)) ? (str(v) as FoodGroup) : 'other';
const nutrientColumns = (n: Nutrients | null) => ({
  energy_kcal: n?.kcal ?? null,
  protein_g: n?.protein ?? null,
  carbs_g: n?.carbs ?? null,
  fat_g: n?.fat ?? null,
  fiber_g: n?.fiber ?? null,
});
const nutrientsFrom = (r: Row): Nutrients => ({
  kcal: numOrNull(r.energy_kcal),
  protein: numOrNull(r.protein_g),
  carbs: numOrNull(r.carbs_g),
  fat: numOrNull(r.fat_g),
  fiber: numOrNull(r.fiber_g),
});

const pregnancyId = (userId: string) => stableUuid(`${userId}:pregnancy`);
const hasPregnancy = () => useRequirements.getState().dueDate !== null;

interface PregnancyRecord {
  id: string;
  dueDate: string;
  status: 'active' | 'ended';
}

/**
 * Every synced table, parents before children (a pregnancy before its
 * appointments), so uploads never break a foreign key.
 */
export function syncTables(userId: string): SyncTableDef[] {
  const pid = pregnancyId(userId);
  return [
    def<WaterEntry>({
      table: 'water_logs',
      module: 'water',
      list: () => useWater.getState().entries,
      id: (e) => e.id,
      updatedAt: (e) => e.updatedAt,
      toRow: (e, user_id) => ({
        id: e.id,
        user_id,
        amount_ml: e.amountMl,
        drink: e.drink,
        logged_at: e.at,
        local_day: e.day,
      }),
      fromRow: (r) => ({
        id: r.id,
        amountMl: num(r.amount_ml),
        drink: str(r.drink) as DrinkType,
        at: iso(r.logged_at),
        day: day(r.local_day ?? r.logged_at),
        updatedAt: iso(r.updated_at),
      }),
      replace: (entries) => useWater.setState({ entries }),
    }),
    def<MoodEntry>({
      table: 'mood_entries',
      module: 'mood',
      list: () => useMood.getState().entries,
      id: (e) => e.id,
      updatedAt: (e) => e.updatedAt,
      toRow: (e, user_id) => ({
        id: e.id,
        user_id,
        mood: e.mood,
        tags: e.tags,
        note: e.note || null,
        logged_at: e.at,
        local_day: e.day,
      }),
      fromRow: (r) => ({
        id: r.id,
        mood: num(r.mood) as MoodLevel,
        tags: arr<MoodTag>(r.tags),
        note: str(r.note),
        at: iso(r.logged_at),
        day: day(r.local_day ?? r.logged_at),
        updatedAt: iso(r.updated_at),
      }),
      replace: (entries) => useMood.setState({ entries }),
    }),
    def<JournalEntry>({
      table: 'journal_entries',
      module: 'mood',
      list: () => useMood.getState().journal,
      id: (e) => e.id,
      updatedAt: (e) => e.updatedAt,
      toRow: (e, user_id) => ({
        id: e.id,
        user_id,
        prompt_key: e.promptKey,
        body: e.body,
        local_day: e.day,
        created_at: e.createdAt,
      }),
      fromRow: (r) => ({
        id: r.id,
        promptKey: strOrNull(r.prompt_key),
        body: str(r.body),
        createdAt: iso(r.created_at),
        day: day(r.local_day ?? r.created_at),
        updatedAt: iso(r.updated_at),
      }),
      replace: (journal) => useMood.setState({ journal }),
    }),
    def<BreathingSession>({
      table: 'breathing_sessions',
      module: 'mood',
      list: () => useMood.getState().breathing,
      id: (e) => e.id,
      updatedAt: () => null,
      toRow: (e, user_id) => ({
        id: e.id,
        user_id,
        pattern: e.pattern,
        duration_seconds: e.durationSeconds,
        completed_at: e.completedAt,
      }),
      fromRow: (r) => ({
        id: r.id,
        pattern: str(r.pattern) as BreathingPatternId,
        durationSeconds: num(r.duration_seconds),
        completedAt: iso(r.completed_at),
      }),
      replace: (breathing) => useMood.setState({ breathing }),
    }),
    def<SleepEntry>({
      table: 'sleep_logs',
      module: 'sleep',
      list: () => useSleep.getState().entries,
      id: (e) => e.id,
      updatedAt: (e) => e.updatedAt,
      toRow: (e, user_id) => ({
        id: e.id,
        user_id,
        bed_at: e.bedAt,
        wake_at: e.wakeAt,
        quality: e.quality,
        note: e.note || null,
        local_day: e.day,
      }),
      fromRow: (r) => ({
        id: r.id,
        bedAt: iso(r.bed_at),
        wakeAt: iso(r.wake_at),
        day: day(r.local_day ?? r.wake_at),
        quality: r.quality === null ? null : (num(r.quality) as SleepEntry['quality']),
        note: str(r.note),
        updatedAt: iso(r.updated_at),
      }),
      // One night per morning: if two devices logged the same morning, the newer stays.
      replace: (entries) =>
        useSleep.setState({
          entries: uniqueBy(
            entries,
            (e) => e.day,
            (a, b) => a.updatedAt > b.updatedAt,
          ).sort((a, b) => (a.day < b.day ? 1 : -1)),
        }),
    }),
    def<Period>({
      table: 'cycle_periods',
      module: 'cycle',
      list: () => useCycle.getState().periods,
      id: (p) => p.id,
      updatedAt: (p) => p.updatedAt,
      toRow: (p, user_id) => ({ id: p.id, user_id, start_date: p.start, end_date: p.end }),
      fromRow: (r) => ({
        id: r.id,
        start: day(r.start_date),
        end: r.end_date ? day(r.end_date) : null,
        updatedAt: iso(r.updated_at),
      }),
      replace: (periods) =>
        useCycle.setState({
          periods: uniqueBy(
            periods,
            (p) => p.start,
            (a, b) => a.updatedAt > b.updatedAt,
          ).sort((a, b) => (a.start < b.start ? 1 : -1)),
        }),
    }),
    def<CycleDayLog>({
      table: 'cycle_day_logs',
      module: 'cycle',
      list: () => Object.values(useCycle.getState().logs),
      // One log per day, so both devices write the same row.
      id: (l) => stableUuid(`${userId}:cycle-day:${l.day}`),
      updatedAt: (l) => l.updatedAt,
      toRow: (l, user_id) => ({
        id: stableUuid(`${user_id}:cycle-day:${l.day}`),
        user_id,
        day: l.day,
        flow: l.flow,
        symptoms: l.symptoms,
        note: l.note || null,
      }),
      fromRow: (r) => ({
        day: day(r.day),
        flow: strOrNull(r.flow) as Flow | null,
        symptoms: arr<CycleSymptom>(r.symptoms),
        note: str(r.note),
        updatedAt: iso(r.updated_at),
      }),
      replace: (logs) =>
        useCycle.setState({ logs: Object.fromEntries(logs.map((l) => [l.day, l])) }),
    }),
    def<PregnancyRecord>({
      table: 'pregnancies',
      module: 'pregnancy',
      list: () => {
        const dueDate = useRequirements.getState().dueDate;
        return dueDate ? [{ id: pid, dueDate, status: usePregnancy.getState().status }] : [];
      },
      id: (p) => p.id,
      updatedAt: () => null,
      toRow: (p, user_id) => ({ id: p.id, user_id, due_date: p.dueDate, status: p.status }),
      fromRow: (r) =>
        r.id === pid
          ? { id: pid, dueDate: day(r.due_date), status: r.status === 'ended' ? 'ended' : 'active' }
          : null,
      replace: (records) => {
        const p = records[0];
        if (p) {
          useRequirements.getState().setValue('dueDate', p.dueDate);
          usePregnancy.setState({ status: p.status });
        } else {
          // Deleted on another device; its appointments and kick sessions went with it.
          useRequirements.getState().setValue('dueDate', null);
          usePregnancy.setState({ appointments: [], kicks: [] });
        }
      },
    }),
    def<Appointment>({
      table: 'pregnancy_appointments',
      module: 'pregnancy',
      ready: hasPregnancy,
      list: () => usePregnancy.getState().appointments,
      id: (a) => a.id,
      updatedAt: () => null,
      toRow: (a, user_id) => ({
        id: a.id,
        user_id,
        pregnancy_id: pid,
        title: a.title,
        scheduled_at: a.at,
        note: a.note || null,
        remind: a.remind,
      }),
      fromRow: (r) => ({
        id: r.id,
        title: str(r.title),
        at: iso(r.scheduled_at),
        note: str(r.note),
        remind: r.remind !== false,
      }),
      replace: (appointments) =>
        usePregnancy.setState({
          appointments: [...appointments].sort((a, b) => (a.at < b.at ? -1 : 1)),
        }),
    }),
    def<KickSession>({
      table: 'kick_sessions',
      module: 'pregnancy',
      ready: hasPregnancy,
      // A session still running stays on this device until it ends.
      list: () => usePregnancy.getState().kicks.filter((k) => k.endedAt),
      id: (k) => k.id,
      updatedAt: () => null,
      toRow: (k, user_id) => ({
        id: k.id,
        user_id,
        pregnancy_id: pid,
        started_at: k.startedAt,
        ended_at: k.endedAt,
        kick_count: k.count,
      }),
      fromRow: (r) => ({
        id: r.id,
        startedAt: iso(r.started_at),
        endedAt: r.ended_at ? iso(r.ended_at) : null,
        count: num(r.kick_count),
      }),
      replace: (ended) =>
        usePregnancy.setState((s) => ({
          kicks: [...s.kicks.filter((k) => !k.endedAt), ...ended].sort((a, b) =>
            a.startedAt < b.startedAt ? 1 : -1,
          ),
        })),
    }),
    def<WeightEntry>({
      table: 'weight_logs',
      module: 'pregnancy',
      list: () => usePregnancy.getState().weights,
      id: (w) => w.id,
      updatedAt: () => null,
      toRow: (w, user_id) => ({
        id: w.id,
        user_id,
        weight_kg: w.kg,
        context: 'pregnancy',
        local_day: w.day,
        logged_at: `${w.day}T12:00:00.000Z`,
      }),
      fromRow: (r) =>
        r.context === 'pregnancy'
          ? { id: r.id, day: day(r.local_day ?? r.logged_at), kg: num(r.weight_kg) }
          : null,
      replace: (weights) =>
        usePregnancy.setState({
          weights: uniqueBy(weights, (w) => w.day).sort((a, b) => (a.day < b.day ? -1 : 1)),
        }),
    }),
    def<SymptomEntry>({
      table: 'symptom_logs',
      module: 'pregnancy',
      list: () => usePregnancy.getState().symptoms,
      id: (e) => e.id,
      updatedAt: () => null,
      toRow: (e, user_id) => ({
        id: e.id,
        user_id,
        module: 'pregnancy',
        symptoms: e.symptoms,
        note: e.note || null,
        logged_at: e.at,
        local_day: e.day,
      }),
      fromRow: (r) =>
        r.module === 'pregnancy'
          ? {
              id: r.id,
              at: iso(r.logged_at),
              day: day(r.local_day ?? r.logged_at),
              symptoms: arr<PregnancySymptom>(r.symptoms),
              note: str(r.note),
            }
          : null,
      replace: (symptoms) =>
        usePregnancy.setState({ symptoms: [...symptoms].sort((a, b) => (a.at < b.at ? 1 : -1)) }),
    }),
    def<BabyName>({
      table: 'baby_names',
      module: 'pregnancy',
      list: () => usePregnancy.getState().names,
      id: (n) => n.id,
      updatedAt: () => null,
      toRow: (n, user_id) => ({ id: n.id, user_id, name: n.name, favorite: n.favorite }),
      fromRow: (r) => ({ id: r.id, name: str(r.name), favorite: r.favorite === true }),
      replace: (names) =>
        usePregnancy.setState({ names: uniqueBy(names, (n) => n.name.toLowerCase()) }),
    }),
    def<BagItem>({
      table: 'checklist_items',
      module: 'pregnancy',
      list: () => usePregnancy.getState().bag,
      // Starter items use their key as the local id; on the server they get a stable UUID.
      id: (b) => (b.key ? stableUuid(`${userId}:bag:${b.key}`) : b.id),
      updatedAt: () => null,
      toRow: (b, user_id) => ({
        id: b.key ? stableUuid(`${user_id}:bag:${b.key}`) : b.id,
        user_id,
        list: 'hospital_bag',
        item_key: b.key,
        label: b.label,
        done: b.done,
      }),
      fromRow: (r) => {
        if (r.list !== 'hospital_bag') return null;
        const key = strOrNull(r.item_key) as BagItem['key'];
        return { id: key ?? r.id, key, label: str(r.label), done: r.done === true };
      },
      replace: (bag) => usePregnancy.setState({ bag }),
    }),
    def<CustomFood>({
      table: 'custom_foods',
      module: 'nutrition',
      list: () => useNutrition.getState().customFoods,
      id: (f) => f.id,
      updatedAt: (f) => f.updatedAt,
      toRow: (f, user_id) => ({
        id: f.id,
        user_id,
        name: f.name,
        barcode: f.barcode,
        serving_unit: f.servingUnit,
        serving_grams: f.servingGrams,
        food_group: f.group,
        source: f.source,
        ...nutrientColumns(f.nutrients),
      }),
      fromRow: (r) => ({
        id: r.id,
        name: str(r.name),
        barcode: strOrNull(r.barcode),
        servingUnit: str(r.serving_unit),
        servingGrams: numOrNull(r.serving_grams),
        group: group(r.food_group),
        source: r.source === 'openFoodFacts' ? 'openFoodFacts' : 'manual',
        nutrients: nutrientsFrom(r),
        updatedAt: iso(r.updated_at),
      }),
      replace: (customFoods) => useNutrition.setState({ customFoods }),
    }),
    def<Meal>({
      table: 'meals',
      module: 'nutrition',
      list: () => useNutrition.getState().meals,
      id: (m) => m.id,
      updatedAt: (m) => m.updatedAt,
      toRow: (m, user_id) => ({
        id: m.id,
        user_id,
        meal_type: m.type,
        eaten_at: m.at,
        local_day: m.day,
        home_cooked: m.homeCooked,
      }),
      fromRow: (r) => ({
        id: r.id,
        type: str(r.meal_type) as MealType,
        at: iso(r.eaten_at),
        day: day(r.local_day ?? r.eaten_at),
        homeCooked: r.home_cooked === true,
        updatedAt: iso(r.updated_at),
      }),
      // A meal deleted elsewhere took its items with it on the server.
      replace: (meals) =>
        useNutrition.setState((s) => {
          const ids = new Set(meals.map((m) => m.id));
          return { meals, items: s.items.filter((i) => ids.has(i.mealId)) };
        }),
    }),
    def<MealItem>({
      table: 'meal_items',
      module: 'nutrition',
      list: () => {
        const { meals, items } = useNutrition.getState();
        const ids = new Set(meals.map((m) => m.id));
        return items.filter((i) => ids.has(i.mealId));
      },
      id: (i) => i.id,
      updatedAt: (i) => i.updatedAt,
      toRow: (i, user_id) => ({
        id: i.id,
        user_id,
        meal_id: i.mealId,
        food_ref: i.foodRef,
        name: i.name,
        quantity: i.quantity,
        unit: i.unit,
        food_group: i.group,
        ...nutrientColumns(i.nutrients),
      }),
      fromRow: (r) => {
        const nutrients = nutrientsFrom(r);
        return {
          id: r.id,
          mealId: str(r.meal_id),
          foodRef: str(r.food_ref),
          name: str(r.name),
          quantity: num(r.quantity),
          unit: str(r.unit),
          group: group(r.food_group),
          nutrients: Object.values(nutrients).some((v) => v !== null) ? nutrients : null,
          updatedAt: iso(r.updated_at),
        };
      },
      replace: (items) => useNutrition.setState({ items }),
    }),
  ];
}
