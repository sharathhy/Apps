import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests against the static web export (run `pnpm build:web`
 * first). Native flows for Android and iOS are in `.maestro/` and run on
 * device builds.
 */
export default defineConfig({
  testDir: './e2e/web',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:8091',
    ...devices['Pixel 7'],
    // India: metric units and DD/MM/YYYY. The US test overrides this.
    locale: 'en-IN',
  },
  webServer: {
    command: 'npx expo serve dist --port 8091',
    url: 'http://localhost:8091/onboarding',
    reuseExistingServer: !process.env.CI,
    env: { EXPO_OFFLINE: '1' },
  },
});
