import { defineConfig } from '@playwright/test';

if (process.env.TEST_ENV !== 'uat' && process.env.TEST_ENV !== 'dev') {
  console.log('Invalid TEST_ENV environment var specified. Valid values are: uat, dev');
}
const local = process.env.TEST_ENV !== 'uat'

export default defineConfig({
  testDir: './tests',
  testMatch: /(.+\.)?(test|spec)\.[jt]s/,
  /* Run tests in files in parallel */
  fullyParallel: local,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Global setup */
  globalSetup: local ? './tests/playwright.setup.ts' : undefined,
  use: {
    baseURL: local ? 'http://localhost:4173' : 'https://langam-uat-en.onrender.com'
  },
});
