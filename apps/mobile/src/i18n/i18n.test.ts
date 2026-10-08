import en from './locales/en.json';
import hi from './locales/hi.json';
import { detectLanguage } from '.';

function keys(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

describe('translations', () => {
  it('Hindi has exactly the same keys as English', () => {
    expect(keys(hi).sort()).toEqual(keys(en).sort());
  });

  it('keeps interpolation placeholders in every Hindi string', () => {
    const placeholders = (s: string) => (s.match(/{{\w+}}/g) ?? []).sort();
    const flat = (obj: object): Record<string, string> =>
      Object.fromEntries(keys(obj).map((k) => [k, k.split('.').reduce<any>((o, p) => o[p], obj)]));
    const enFlat = flat(en);
    const hiFlat = flat(hi);
    for (const key of Object.keys(enFlat)) {
      expect([key, placeholders(hiFlat[key]!)]).toEqual([key, placeholders(enFlat[key]!)]);
    }
  });

  it('includes the required medical disclaimer wording', () => {
    expect(en.disclaimer.text).toBe(
      'This app does not provide medical advice, diagnosis, or treatment. Consult a qualified healthcare professional.',
    );
  });
});

describe('detectLanguage', () => {
  it('picks the first supported language', () => {
    expect(detectLanguage([{ languageCode: 'fr' }, { languageCode: 'hi' }])).toBe('hi');
    expect(detectLanguage([{ languageCode: 'en' }])).toBe('en');
  });

  it('falls back to English', () => {
    expect(detectLanguage([{ languageCode: 'ta' }, { languageCode: null }])).toBe('en');
    expect(detectLanguage([])).toBe('en');
  });
});
