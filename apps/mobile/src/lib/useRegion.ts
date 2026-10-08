import { getLocales } from 'expo-localization';

import { regionDefaults } from './region';

/** Regional defaults (units, date order) from the device's region. */
export function useRegion() {
  return regionDefaults(getLocales()[0]?.regionCode);
}
