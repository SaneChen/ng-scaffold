/**
 * Production-build browser validation using the machine's existing Chrome installation.
 * How this file was built: Playwright defineConfig; Angular CLI has no built-in e2e generator.
 * Why: test Pages base paths and real rendering without downloading a browser or CDN assets.
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  outputDir: '../test-results',
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  workers: 2,
  timeout: 45000,
  expect: { timeout: 10000 },
  reporter: [['list'], ['html', { outputFolder: '../playwright-report', open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173/ng-scaffold/',
    locale: 'en-US',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    channel: 'chrome',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'], defaultBrowserType: 'chromium' } },
  ],
  webServer: {
    command:
      'yarn -s ng build --base-href /ng-scaffold/ && node tools/prepare-pages.mjs && node tools/preview-server.mjs',
    cwd: '..',
    url: 'http://127.0.0.1:4173/ng-scaffold/',
    reuseExistingServer: false,
    timeout: 120000,
    env: { NG_CLI_ANALYTICS: 'false' },
  },
});
