import { dateFormatPattern, formatDate, regionDefaults } from './region';

describe('regionDefaults', () => {
  it('uses US conventions for the US', () => {
    expect(regionDefaults('US')).toMatchObject({
      units: 'imperial',
      dateOrder: 'MDY',
      currency: 'USD',
    });
    expect(regionDefaults('us').region).toBe('US');
  });

  it('uses Indian conventions for India and as the fallback', () => {
    for (const code of ['IN', 'in', 'GB', '', null, undefined]) {
      expect(regionDefaults(code)).toMatchObject({
        units: 'metric',
        dateOrder: 'DMY',
        currency: 'INR',
      });
    }
  });
});

describe('formatDate', () => {
  const date = new Date(2026, 9, 8); // 8 October 2026, local time

  it('formats DD/MM/YYYY for India', () => {
    expect(formatDate(date, 'DMY')).toBe('08/10/2026');
  });

  it('formats MM/DD/YYYY for the USA', () => {
    expect(formatDate(date, 'MDY')).toBe('10/08/2026');
  });

  it('handles leap days and year boundaries', () => {
    expect(formatDate(new Date(2028, 1, 29), 'DMY')).toBe('29/02/2028');
    expect(formatDate(new Date(2026, 11, 31), 'MDY')).toBe('12/31/2026');
    expect(formatDate(new Date(2027, 0, 1), 'DMY')).toBe('01/01/2027');
  });

  it('rejects invalid dates', () => {
    expect(() => formatDate(new Date('not a date'), 'DMY')).toThrow(RangeError);
  });

  it('describes the pattern', () => {
    expect(dateFormatPattern('DMY')).toBe('DD/MM/YYYY');
    expect(dateFormatPattern('MDY')).toBe('MM/DD/YYYY');
  });
});
