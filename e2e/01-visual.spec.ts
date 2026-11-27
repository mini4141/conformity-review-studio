import { expect, test, type Page } from '@playwright/test';
import { freezeClock, setPrefs } from './helpers';

// Visual baselines: the four key screens in light and dark. Update with `pnpm exec playwright test --update-snapshots`
// in the same commit as any intentional visual change.

async function settle(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
}

const SCREENS: { name: string; path: string; ready: (p: Page) => Promise<void> }[] = [
  { name: 'queue', path: '/', ready: (p) => expect(p.getByRole('row', { name: /Aquila IP-200/ })).toBeVisible() },
  {
    name: 'workspace',
    path: '/files/f01?clause=8.4.2',
    ready: async (p) => {
      await expect(p.getByTestId('evidence-highlight').first()).toBeVisible({ timeout: 20_000 });
      await expect(p.getByText('p. 233 / 412')).toBeVisible();
    },
  },
  { name: 'matrix', path: '/files/f01/matrix', ready: (p) => expect(p.getByText('Quality policy').first()).toBeVisible() },
  { name: 'decision', path: '/files/f01/decision', ready: (p) => expect(p.getByRole('heading', { name: 'Summary' })).toBeVisible() },
];

for (const theme of ['light', 'dark'] as const) {
  for (const s of SCREENS) {
    test(`visual: ${s.name} (${theme})`, async ({ page }) => {
      await freezeClock(page);
      await setPrefs(page, theme);
      await page.goto(s.path);
      await s.ready(page);
      await settle(page);
      await expect(page).toHaveScreenshot(`${s.name}-${theme}.png`);
    });
  }
}
