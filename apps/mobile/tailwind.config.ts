import tokens from '@wellness/design-tokens/tailwind';
import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- nativewind/preset ships CommonJS without module types
  presets: [require('nativewind/preset'), tokens],
} satisfies Config;
