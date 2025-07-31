import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: /(.+\.)?(test|spec)\.[jt]s/,
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Global setup */
  globalSetup: './tests/playwright.setup.ts',
  use: {
    baseURL: 'http://localhost:4173'
  },
});
