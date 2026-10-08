/**
 * Regional defaults for the two launch markets. India uses metric units,
 * DD/MM/YYYY and INR; the USA uses imperial units, MM/DD/YYYY and USD.
 * Users can override units later in settings.
 */

export type RegionCode = 'IN' | 'US';
export type UnitSystem = 'metric' | 'imperial';
export type DateOrder = 'DMY' | 'MDY';

export interface RegionDefaults {
  region: RegionCode;
  units: UnitSystem;
  dateOrder: DateOrder;
  currency: 'INR' | 'USD';
}

export const regions: Record<RegionCode, RegionDefaults> = {
  IN: { region: 'IN', units: 'metric', dateOrder: 'DMY', currency: 'INR' },
  US: { region: 'US', units: 'imperial', dateOrder: 'MDY', currency: 'USD' },
};

/** India is the default for any region outside the two launch markets. */
export function regionDefaults(regionCode: string | null | undefined): RegionDefaults {
  return regionCode?.toUpperCase() === 'US' ? regions.US : regions.IN;
}

export function dateFormatPattern(order: DateOrder): string {
  return order === 'MDY' ? 'MM/DD/YYYY' : 'DD/MM/YYYY';
}

/** Formats a calendar date with zero-padded parts, e.g. 08/10/2026 (IN) or 10/08/2026 (US). */
export function formatDate(date: Date, order: DateOrder): string {
  if (Number.isNaN(date.getTime())) {
    throw new RangeError('Invalid date');
  }
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = String(date.getFullYear()).padStart(4, '0');
  return order === 'MDY' ? `${mm}/${dd}/${yyyy}` : `${dd}/${mm}/${yyyy}`;
}

/** Reads a typed date in the region's order ("08/10/2026"). Returns "YYYY-MM-DD" or null. */
export function parseDateInput(text: string, order: DateOrder): string | null {
  const m = /^\s*(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})\s*$/.exec(text);
  if (!m) return null;
  const [a, b, year] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const [day, month] = order === 'MDY' ? [b, a] : [a, b];
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date.toISOString().slice(0, 10);
}

/** Shows a "YYYY-MM-DD" key in the region's order. */
export function formatDateKey(key: string, order: DateOrder): string {
  const [y, m, d] = key.split('-');
  return order === 'MDY' ? `${m}/${d}/${y}` : `${d}/${m}/${y}`;
}

export const ML_PER_FL_OZ = 29.5735;
