import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: '.',
  testMatch: 'smoke.spec.ts',
  timeout: 45_000,
  retries: 0,
  workers: 2,
  reporter: [['list'], ['html', { outputFolder: 'tests/staging-live/report', open: 'never' }]],
  outputDir: 'tests/staging-live/artifacts',
  use: { ...devices['Desktop Chrome'], screenshot: 'only-on-failure', trace: 'retain-on-failure' },
});
