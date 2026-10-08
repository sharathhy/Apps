import { addDays, dateKey, parseDateKey } from '@/lib/time/zoned';

export const moodLevels = [1, 2, 3, 4, 5] as const;
export type MoodLevel = (typeof moodLevels)[number];

/** Shown with a text label everywhere, never as the only cue. */
export const moodEmoji: Record<MoodLevel, string> = { 1: '😞', 2: '🙁', 3: '😐', 4: '🙂', 5: '😄' };

export const feelingTags = [
  'calm',
  'happy',
  'grateful',
  'tired',
  'anxious',
  'stressed',
  'sad',
  'irritable',
] as const;
export const activityTags = [
  'family',
  'friends',
  'work',
  'study',
  'outdoors',
  'rest',
  'creative',
  'meditation',
] as const;
export type MoodTag = (typeof feelingTags)[number] | (typeof activityTags)[number];

export interface MoodEntry {
  id: string;
  at: string;
  /** Local date ("YYYY-MM-DD") fixed when logged. */
  day: string;
  mood: MoodLevel;
  tags: MoodTag[];
  note: string;
  updatedAt: string;
}

export interface JournalEntry {
  id: string;
  createdAt: string;
  day: string;
  promptKey: string | null;
  body: string;
  updatedAt: string;
}

export interface BreathingSession {
  id: string;
  completedAt: string;
  pattern: BreathingPatternId;
  durationSeconds: number;
}

export const MAX_NOTE_LENGTH = 2000;
export const MAX_JOURNAL_LENGTH = 20000;

/** Breathing patterns as seconds for inhale, hold, exhale, hold. No workout content. */
export const breathingPatterns = {
  box: [4, 4, 4, 4],
  relax478: [4, 7, 8, 0],
  calm: [5, 0, 5, 0],
} as const;
export type BreathingPatternId = keyof typeof breathingPatterns;
export const breathingPhases = ['inhale', 'holdIn', 'exhale', 'holdOut'] as const;
export type BreathingPhase = (typeof breathingPhases)[number];

/** Phase and seconds left at `elapsed` seconds into a session, skipping zero-length holds. */
export function breathingStep(
  pattern: BreathingPatternId,
  elapsed: number,
): { phase: BreathingPhase; remaining: number; cycle: number } {
  const lengths: readonly number[] = breathingPatterns[pattern];
  const cycleLength = lengths.reduce((a, b) => a + b, 0);
  const cycle = Math.floor(elapsed / cycleLength);
  let t = elapsed % cycleLength;
  for (let i = 0; i < lengths.length; i++) {
    const len = lengths[i]!;
    if (t < len) return { phase: breathingPhases[i]!, remaining: len - t, cycle };
    t -= len;
  }
  return { phase: 'inhale', remaining: lengths[0]!, cycle: cycle + 1 };
}

/** Journal prompts rotate by day so the same day always shows the same prompt. */
export const journalPrompts = [
  'goodThing',
  'grateful',
  'onYourMind',
  'kindness',
  'energy',
  'tomorrow',
  'proud',
  'rest',
] as const;

export function promptForDay(day: string): (typeof journalPrompts)[number] {
  const date = parseDateKey(day);
  const index = date ? Math.floor(Date.UTC(date.year, date.month - 1, date.day) / 86_400_000) : 0;
  return journalPrompts[
    ((index % journalPrompts.length) + journalPrompts.length) % journalPrompts.length
  ]!;
}

/** The latest mood logged on each day. */
export function moodByDay(entries: MoodEntry[]): Map<string, MoodLevel> {
  const result = new Map<string, MoodLevel>();
  for (const e of [...entries].sort((a, b) => (a.at < b.at ? -1 : 1))) result.set(e.day, e.mood);
  return result;
}

export interface MonthInsights {
  /** Check-ins per mood level this month. */
  distribution: Record<MoodLevel, number>;
  daysCheckedIn: number;
  /** Tags that show up most on days rated 4 or 5, with at least 3 uses. Patterns, not causes. */
  brighterDayTags: MoodTag[];
}

export function monthInsights(entries: MoodEntry[], month: string): MonthInsights {
  const inMonth = entries.filter((e) => e.day.startsWith(month));
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<MoodLevel, number>;
  const tagUses = new Map<MoodTag, { total: number; bright: number }>();
  for (const e of inMonth) {
    distribution[e.mood]++;
    for (const tag of e.tags) {
      const u = tagUses.get(tag) ?? { total: 0, bright: 0 };
      u.total++;
      if (e.mood >= 4) u.bright++;
      tagUses.set(tag, u);
    }
  }
  const brighterDayTags = [...tagUses.entries()]
    .filter(([, u]) => u.total >= 3 && u.bright / u.total >= 0.6)
    .sort((a, b) => b[1].bright / b[1].total - a[1].bright / a[1].total || b[1].total - a[1].total)
    .slice(0, 3)
    .map(([tag]) => tag);
  return { distribution, daysCheckedIn: new Set(inMonth.map((e) => e.day)).size, brighterDayTags };
}

/** Every day of the month as "YYYY-MM-DD", for the calendar. */
export function daysOfMonth(month: string): string[] {
  const first = parseDateKey(`${month}-01`);
  if (!first) return [];
  const out: string[] = [];
  for (let d = first; d.month === first.month; d = addDays(d, 1)) out.push(dateKey(d));
  return out;
}
