import { addDaysKey, daysBetweenKeys } from '@/lib/time/days';

/**
 * Pregnancy dates. Every value is an estimate; a dating scan or a doctor
 * confirms the due date.
 *
 * Sources:
 * - ACOG Committee Opinion 700, "Methods for Estimating the Due Date" (2017,
 *   reaffirmed): the due date is 280 days after the first day of the last
 *   period, for a 28-day cycle; ultrasound in the first trimester is the
 *   most accurate way to confirm it.
 * - ACOG Committee Opinion 579, "Definition of Term Pregnancy": early term
 *   37+0 to 38+6, full term 39+0 to 40+6, late term 41+0 to 41+6, post-term
 *   from 42+0.
 * - ACOG FAQ "How Your Fetus Grows During Pregnancy": trimesters run to
 *   13+6, 14+0 to 27+6 and 28+0 onward.
 * - NHS, "Your due date": conception is usually about 2 weeks after the
 *   period starts, so 266 days from conception.
 */
export const PREGNANCY_DAYS = 280;
export const CONCEPTION_TO_DUE_DAYS = 266;
const TYPICAL_CYCLE = 28;

/** Due date from the first day of the last period (Naegele's rule), adjusted for longer or shorter cycles. */
export function dueFromLastPeriod(lastPeriodStart: string, cycleLength = TYPICAL_CYCLE): string {
  const adjust = Math.max(-7, Math.min(14, cycleLength - TYPICAL_CYCLE));
  return addDaysKey(lastPeriodStart, PREGNANCY_DAYS + adjust);
}

export function dueFromConception(conception: string): string {
  return addDaysKey(conception, CONCEPTION_TO_DUE_DAYS);
}

export type Trimester = 1 | 2 | 3;
export type TermLabel = 'preterm' | 'earlyTerm' | 'fullTerm' | 'lateTerm' | 'postTerm';

export interface GestationalAge {
  /** Completed weeks, e.g. 12 for "12 weeks and 3 days". */
  weeks: number;
  days: number;
  totalDays: number;
  trimester: Trimester;
  term: TermLabel;
  /** Days until the due date (negative once it has passed). */
  daysToGo: number;
}

/** How far along a pregnancy is on `today`, from the due date. Null before conception. */
export function gestationalAge(dueDate: string, today: string): GestationalAge | null {
  const daysToGo = daysBetweenKeys(today, dueDate);
  const totalDays = PREGNANCY_DAYS - daysToGo;
  if (totalDays < 0) return null;
  const weeks = Math.floor(totalDays / 7);
  return {
    weeks,
    days: totalDays % 7,
    totalDays,
    trimester: weeks < 14 ? 1 : weeks < 28 ? 2 : 3,
    term:
      weeks < 37
        ? 'preterm'
        : weeks < 39
          ? 'earlyTerm'
          : weeks < 41
            ? 'fullTerm'
            : weeks < 42
              ? 'lateTerm'
              : 'postTerm',
    daysToGo,
  };
}

/** Week-by-week content covers weeks 4 to 42. */
export const FIRST_CONTENT_WEEK = 4;
export const LAST_CONTENT_WEEK = 42;
export const contentWeek = (weeks: number) =>
  Math.max(FIRST_CONTENT_WEEK, Math.min(LAST_CONTENT_WEEK, weeks));

/** Kick counting is suggested from 28 weeks (ACOG FAQ "Special Tests for Monitoring Fetal Well-Being"). */
export const KICKS_FROM_WEEK = 28;
export const KICK_TARGET = 10;

export const pregnancySymptoms = [
  'nausea',
  'vomiting',
  'heartburn',
  'tired',
  'backPain',
  'headache',
  'constipation',
  'legCramps',
  'swelling',
  'troubleSleeping',
  'dizziness',
  'bleeding',
  'severeHeadache',
  'visionChanges',
  'suddenSwelling',
  'severePain',
  'fluidLeak',
  'fewerMovements',
] as const;
export type PregnancySymptom = (typeof pregnancySymptoms)[number];

/**
 * Symptoms the NHS ("Signs of pre-eclampsia", "Vaginal bleeding in
 * pregnancy", "Your baby's movements") and ACOG ("Urgent Maternal Warning
 * Signs") say to get help for straight away. Logging one shows a
 * "contact your doctor or maternity unit now" card.
 */
export const urgentSymptoms: readonly PregnancySymptom[] = [
  'bleeding',
  'severeHeadache',
  'visionChanges',
  'suddenSwelling',
  'severePain',
  'fluidLeak',
  'fewerMovements',
];

export const isUrgent = (symptoms: readonly PregnancySymptom[]) =>
  symptoms.some((s) => urgentSymptoms.includes(s));

/**
 * IOM 2009 total weight gain ranges for a single pregnancy, by BMI before
 * pregnancy, in kg (endorsed by ACOG Committee Opinion 548). Shown only as
 * reference text, never as a goal or a target.
 */
export const iomGainRangesKg = [
  { bmi: 'under18_5', min: 12.5, max: 18 },
  { bmi: '18_5to24_9', min: 11.5, max: 16 },
  { bmi: '25to29_9', min: 7, max: 11.5 },
  { bmi: '30plus', min: 5, max: 9 },
] as const;

export interface KickSession {
  id: string;
  startedAt: string;
  endedAt: string | null;
  count: number;
}

/** Minutes from the start of a session to its last kick (or now, while it runs). */
export function sessionMinutes(session: KickSession, now = new Date()): number {
  const end = session.endedAt ? new Date(session.endedAt) : now;
  return Math.max(0, Math.round((end.getTime() - new Date(session.startedAt).getTime()) / 60_000));
}

/** Hospital bag starter list, based on the NHS "Pack your bag for labour" page. */
export const hospitalBagStarter = [
  'notes',
  'birthPlan',
  'comfyClothes',
  'nightwear',
  'slippers',
  'maternityPads',
  'underwear',
  'nursingBras',
  'toiletries',
  'snacksDrinks',
  'phoneCharger',
  'babyClothes',
  'nappies',
  'babyBlanket',
  'carSeat',
] as const;
