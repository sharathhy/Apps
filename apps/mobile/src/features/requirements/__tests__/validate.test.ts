import { validateRequirement } from '../validate';

const india = {
  units: 'metric',
  dateOrder: 'DMY',
  today: { year: 2026, month: 10, day: 8 },
} as const;
const usa = { ...india, units: 'imperial', dateOrder: 'MDY' } as const;

describe('validateRequirement', () => {
  it('keeps water goals within sensible bounds and converts ounces', () => {
    expect(validateRequirement('waterGoal', '2000', india)).toEqual({ ok: true, value: 2000 });
    expect(validateRequirement('waterGoal', '100', india)).toEqual({ ok: false, error: 'range' });
    expect(validateRequirement('waterGoal', '9000', india)).toEqual({ ok: false, error: 'range' });
    expect(validateRequirement('waterGoal', '64', usa)).toEqual({ ok: true, value: 1893 });
  });

  it('checks the last period date', () => {
    expect(validateRequirement('lastPeriod', '01/10/2026', india)).toEqual({
      ok: true,
      value: '2026-10-01',
    });
    expect(validateRequirement('lastPeriod', '10/01/2026', usa)).toEqual({
      ok: true,
      value: '2026-10-01',
    });
    expect(validateRequirement('lastPeriod', '09/10/2026', india)).toEqual({
      ok: false,
      error: 'future',
    });
    expect(validateRequirement('lastPeriod', '01/01/2025', india)).toEqual({
      ok: false,
      error: 'tooOld',
    });
    expect(validateRequirement('lastPeriod', '31/02/2026', india)).toEqual({
      ok: false,
      error: 'invalidDate',
    });
  });

  it('checks the due date range', () => {
    expect(validateRequirement('dueDate', '01/05/2027', india)).toEqual({
      ok: true,
      value: '2027-05-01',
    });
    expect(validateRequirement('dueDate', '01/12/2027', india)).toEqual({
      ok: false,
      error: 'dueRange',
    });
  });
});
