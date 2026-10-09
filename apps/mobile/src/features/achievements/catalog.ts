import type { ModuleId } from '@wellness/design-tokens';
import type { IconName } from '@wellness/ui';

/**
 * Every achievement. Rules for adding one:
 * - reward showing up and looking after yourself, never restriction, extreme
 *   goals, eating less or weight change;
 * - no countdowns, guilt or pressure in the name or description;
 * - streaks always allow a grace day (see streakWithGrace).
 * Names and descriptions live in the locale files under achievements.items.
 */
export type AchievementCategory = 'gettingStarted' | 'consistency' | 'wellness' | 'learning';

export const activityEvents = [
  'onboarding_complete',
  'reminder_created',
  'legal_read',
  'article_read',
  'log_entry',
  'water_goal_met',
  'mood_check_in',
  'journal_entry',
  'breathing_session',
  'sleep_logged',
  'period_logged',
  'kick_session',
  'hospital_bag_packed',
  'meal_logged',
  'colourful_day',
  'home_cooked_meal',
] as const;
export type ActivityEvent = (typeof activityEvents)[number];

export type Criterion =
  /** The event happened at least `min` times (default 1). */
  | { kind: 'count'; event: ActivityEvent; min?: number }
  /** The event happened on at least `min` different local days. */
  | { kind: 'days'; event: ActivityEvent; min: number }
  /** Something was logged on `days` days in a row, allowing a grace day. */
  | { kind: 'streak'; days: number }
  /** Logged something in at least `min` different trackers. */
  | { kind: 'modules'; min: number };

export interface AchievementDefinition {
  id: string;
  category: AchievementCategory;
  icon: IconName;
  criterion: Criterion;
  /** Only shown to people who use this tracker. */
  module?: ModuleId;
}

export const achievementCategories: AchievementCategory[] = [
  'gettingStarted',
  'consistency',
  'wellness',
  'learning',
];

export const achievements: AchievementDefinition[] = [
  // Getting started
  {
    id: 'welcome',
    category: 'gettingStarted',
    icon: 'sparkles',
    criterion: { kind: 'count', event: 'onboarding_complete' },
  },
  {
    id: 'first_entry',
    category: 'gettingStarted',
    icon: 'home',
    criterion: { kind: 'count', event: 'log_entry' },
  },
  {
    id: 'first_reminder',
    category: 'gettingStarted',
    icon: 'bell',
    criterion: { kind: 'count', event: 'reminder_created' },
  },
  {
    id: 'explorer',
    category: 'gettingStarted',
    icon: 'compass',
    criterion: { kind: 'modules', min: 3 },
  },
  // Consistency
  {
    id: 'streak_7',
    category: 'consistency',
    icon: 'flame',
    criterion: { kind: 'streak', days: 7 },
  },
  {
    id: 'streak_30',
    category: 'consistency',
    icon: 'calendar',
    criterion: { kind: 'streak', days: 30 },
  },
  // Wellness
  {
    id: 'hydrated_5',
    category: 'wellness',
    icon: 'water',
    module: 'water',
    criterion: { kind: 'days', event: 'water_goal_met', min: 5 },
  },
  {
    id: 'mood_14',
    category: 'wellness',
    icon: 'mood',
    module: 'mood',
    criterion: { kind: 'count', event: 'mood_check_in', min: 14 },
  },
  {
    id: 'breath_first',
    category: 'wellness',
    icon: 'wind',
    module: 'mood',
    criterion: { kind: 'count', event: 'breathing_session' },
  },
  {
    id: 'breath_10',
    category: 'wellness',
    icon: 'wind',
    module: 'mood',
    criterion: { kind: 'count', event: 'breathing_session', min: 10 },
  },
  {
    id: 'journal_5',
    category: 'wellness',
    icon: 'book',
    module: 'mood',
    criterion: { kind: 'count', event: 'journal_entry', min: 5 },
  },
  {
    id: 'sleep_7',
    category: 'wellness',
    icon: 'sleep',
    module: 'sleep',
    criterion: { kind: 'days', event: 'sleep_logged', min: 7 },
  },
  {
    id: 'cycle_first',
    category: 'wellness',
    icon: 'cycle',
    module: 'cycle',
    criterion: { kind: 'count', event: 'period_logged' },
  },
  {
    id: 'kicks_first',
    category: 'wellness',
    icon: 'pregnancy',
    module: 'pregnancy',
    criterion: { kind: 'count', event: 'kick_session' },
  },
  {
    id: 'bag_ready',
    category: 'wellness',
    icon: 'checklist',
    module: 'pregnancy',
    criterion: { kind: 'count', event: 'hospital_bag_packed' },
  },
  {
    id: 'meals_7',
    category: 'wellness',
    icon: 'nutrition',
    module: 'nutrition',
    criterion: { kind: 'days', event: 'meal_logged', min: 7 },
  },
  {
    id: 'colourful_plate',
    category: 'wellness',
    icon: 'nutrition',
    module: 'nutrition',
    criterion: { kind: 'days', event: 'colourful_day', min: 5 },
  },
  {
    id: 'home_cooking',
    category: 'wellness',
    icon: 'home',
    module: 'nutrition',
    criterion: { kind: 'days', event: 'home_cooked_meal', min: 5 },
  },
  // Learning
  {
    id: 'privacy_pro',
    category: 'learning',
    icon: 'shield',
    criterion: { kind: 'count', event: 'legal_read' },
  },
  {
    id: 'curious',
    category: 'learning',
    icon: 'book',
    criterion: { kind: 'count', event: 'article_read' },
  },
  {
    id: 'well_read',
    category: 'learning',
    icon: 'book',
    criterion: { kind: 'count', event: 'article_read', min: 10 },
  },
];

export function visibleAchievements(modules: readonly ModuleId[]): AchievementDefinition[] {
  return achievements.filter((a) => !a.module || modules.includes(a.module));
}
