import { layoutForWidth } from './useLayout';

describe('layoutForWidth', () => {
  it.each([
    [320, 'phone'],
    [767, 'phone'],
    [768, 'tablet'],
    [1023, 'tablet'],
    [1024, 'desktop'],
    [1920, 'desktop'],
  ] as const)('%i px is %s', (width, expected) => {
    expect(layoutForWidth(width)).toBe(expected);
  });
});
