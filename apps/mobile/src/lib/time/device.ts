import { getCalendars } from 'expo-localization';

import { isValidTimeZone } from './zoned';

/** The device's current IANA time zone, falling back to UTC if it is unknown. */
export function deviceTimeZone(): string {
  const candidates = [
    getCalendars()[0]?.timeZone,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  ];
  return candidates.find((tz): tz is string => !!tz && isValidTimeZone(tz)) ?? 'UTC';
}
