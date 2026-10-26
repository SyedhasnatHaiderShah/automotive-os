import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: '.',
  testMatch: ['audit.spec.ts'],
  timeout: 45000,
  retries: 0,
  workers: 2,
  reporter: [['list'],['html',{open:'never',outputFolder:'test-results/stitch-html'}]],
  use:{...devices['Desktop Chrome'], trace:'retain-on-failure', screenshot:'only-on-failure'},
  outputDir:'test-results/stitch-parity'
});
