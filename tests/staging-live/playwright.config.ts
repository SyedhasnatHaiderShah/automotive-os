import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: '.',
  testMatch: 'smoke.spec.ts',
  timeout: 45_000,
  retries: 0,
  workers: 2,
  reporter: [['list'], ['html', { outputFolder: 'report', open: 'never' }]],
  outputDir: 'artifacts',
  use: { ...devices['Desktop Chrome'], screenshot: 'only-on-failure', trace: 'retain-on-failure' },
});
