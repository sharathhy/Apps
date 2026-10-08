/** 4-point spacing scale. Keys match Tailwind spacing keys (`p-4` = 16). */
export const spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
} as const;

export const radii = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

/** Cross-platform `boxShadow` values (supported by React Native's new architecture and web). */
export const shadows = {
  none: 'none',
  sm: '0px 1px 2px rgba(27, 25, 22, 0.06), 0px 1px 3px rgba(27, 25, 22, 0.08)',
  md: '0px 4px 12px rgba(27, 25, 22, 0.08), 0px 2px 4px rgba(27, 25, 22, 0.05)',
  lg: '0px 12px 32px rgba(27, 25, 22, 0.12), 0px 4px 8px rgba(27, 25, 22, 0.06)',
} as const;

/** Accessibility minimum for any pressable element (Apple HIG 44pt, Material 48dp). */
export const touchTarget = { min: 44, comfortable: 48 } as const;

/** Window widths at which the layout changes. */
export const breakpoints = {
  /** Tablets in portrait and small laptops. Navigation moves to a side rail. */
  tablet: 768,
  /** Desktop web. Wider rail with labels. */
  desktop: 1024,
} as const;

/** Readable maximum width for content columns on large screens. */
export const contentMaxWidth = 720;
