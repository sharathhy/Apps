import { mentionsSelfHarm } from '../crisis';
import {
  breathingStep,
  daysOfMonth,
  monthInsights,
  moodByDay,
  promptForDay,
  type MoodEntry,
} from '../model';

const entry = (
  day: string,
  mood: MoodEntry['mood'],
  tags: MoodEntry['tags'] = [],
  hour = 8,
): MoodEntry => ({
  id: `${day}-${hour}`,
  at: `${day}T${String(hour).padStart(2, '0')}:00:00Z`,
  day,
  mood,
  tags,
  note: '',
  updatedAt: '',
});

describe('mood model', () => {
  it('keeps the latest mood of each day', () => {
    const map = moodByDay([entry('2026-10-01', 2, [], 8), entry('2026-10-01', 4, [], 20)]);
    expect(map.get('2026-10-01')).toBe(4);
  });

  it('summarises a month and finds tags on brighter days', () => {
    const entries = [
      entry('2026-10-01', 5, ['outdoors']),
      entry('2026-10-02', 4, ['outdoors', 'work']),
      entry('2026-10-03', 4, ['outdoors', 'work']),
      entry('2026-10-04', 2, ['work']),
      entry('2026-09-30', 1, ['outdoors']),
    ];
    const insights = monthInsights(entries, '2026-10');
    expect(insights.distribution).toEqual({ 1: 0, 2: 1, 3: 0, 4: 2, 5: 1 });
    expect(insights.daysCheckedIn).toBe(4);
    expect(insights.brighterDayTags).toEqual(['outdoors', 'work']);
  });

  it('lists the days of a month, including leap February', () => {
    expect(daysOfMonth('2028-02')).toHaveLength(29);
    expect(daysOfMonth('2026-02')).toHaveLength(28);
    expect(daysOfMonth('2026-10').at(-1)).toBe('2026-10-31');
  });

  it('steps through breathing patterns and skips empty holds', () => {
    expect(breathingStep('box', 0)).toEqual({ phase: 'inhale', remaining: 4, cycle: 0 });
    expect(breathingStep('box', 5)).toEqual({ phase: 'holdIn', remaining: 3, cycle: 0 });
    expect(breathingStep('relax478', 11)).toEqual({ phase: 'exhale', remaining: 8, cycle: 0 });
    expect(breathingStep('calm', 5)).toEqual({ phase: 'exhale', remaining: 5, cycle: 0 });
    expect(breathingStep('calm', 10)).toEqual({ phase: 'inhale', remaining: 5, cycle: 1 });
  });

  it('picks the same prompt all day', () => {
    expect(promptForDay('2026-10-08')).toBe(promptForDay('2026-10-08'));
    expect(promptForDay('2026-10-08')).not.toBe(promptForDay('2026-10-09'));
  });
});

describe('mentionsSelfHarm', () => {
  it.each([
    'I want to die',
    'thinking about suicide',
    'I might hurt myself',
    'everyone would be better off without me',
    'मैं आत्महत्या के बारे में सोच रही हूँ',
    'मुझे जीना नहीं चाहिए',
    'khudkushi',
  ])('notices "%s"', (text) => expect(mentionsSelfHarm(text)).toBe(true));

  it.each([
    'I died laughing at that film',
    'work was killing me today',
    'a calm, happy day',
    'cut the vegetables',
  ])('ignores "%s"', (text) => expect(mentionsSelfHarm(text)).toBe(false));
});
