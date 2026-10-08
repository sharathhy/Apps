import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import hi from './locales/hi.json';

export const supportedLanguages = ['en', 'hi'] as const;
export type Language = (typeof supportedLanguages)[number];

export const resources = { en: { translation: en }, hi: { translation: hi } } as const;

/** Picks the first device language we support, falling back to English. */
export function detectLanguage(
  locales: readonly { languageCode: string | null }[] = getLocales(),
): Language {
  for (const locale of locales) {
    const code = locale.languageCode as Language | null;
    if (code && supportedLanguages.includes(code)) return code;
  }
  return 'en';
}

if (!i18n.isInitialized) {
  // eslint-disable-next-line import/no-named-as-default-member -- instance method, not the named export
  void i18n.use(initReactI18next).init({
    resources,
    lng: detectLanguage(),
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    returnNull: false,
  });
}

export default i18n;
