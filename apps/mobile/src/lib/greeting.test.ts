import { dayPart } from './greeting';

describe('dayPart', () => {
  it.each([
    [4, 'evening'],
    [5, 'morning'],
    [11, 'morning'],
    [12, 'afternoon'],
    [16, 'afternoon'],
    [17, 'evening'],
    [23, 'evening'],
  ] as const)('%i:00 is %s', (hour, expected) => {
    expect(dayPart(new Date(2026, 9, 8, hour, 30))).toBe(expected);
  });
});
