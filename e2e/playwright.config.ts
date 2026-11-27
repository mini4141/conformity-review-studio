import { defineConfig, devices } from '@playwright/test';

const remote = process.env.BASE_URL; // set for the cloud run: no local servers, no reseed
const outDir = process.env.PROOF_TESTS_DIR ?? '../proof/phase1-local/tests';

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.05 } },
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}-{projectName}{ext}',
  reporter: [['list'], ['junit', { outputFile: `${outDir}/playwright-junit.xml` }], ['html', { outputFolder: `${outDir}/playwright-report`, open: 'never' }]],
  globalSetup: remote ? undefined : './global-setup.ts',
  use: {
    baseURL: remote ?? 'http://localhost:4173',
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
    timezoneId: 'UTC',
    locale: 'en-GB',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } }],
  webServer: remote
    ? undefined
    : [
        { command: 'pnpm --filter @crs/api start', url: 'http://localhost:8787/healthz', reuseExistingServer: true, cwd: '..', timeout: 60_000 },
        // production build: perf and visual baselines are measured on what ships
        { command: 'pnpm --filter @crs/web build && pnpm --filter @crs/web preview', url: 'http://localhost:4173', reuseExistingServer: true, cwd: '..', timeout: 180_000 },
      ],
});
