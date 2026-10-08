export type DayPart = 'morning' | 'afternoon' | 'evening';

/** Morning before 12:00, afternoon until 17:00, evening otherwise. */
export function dayPart(date: Date): DayPart {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  return 'evening';
}
