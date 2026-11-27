import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { freezeClock, setPrefs } from './helpers';

// Proof screenshots, captured by scripts/capture-proof.sh (never by hand). Skipped in normal test runs.
const PHASE = process.env.CAPTURE; // phase1 | phase2
const OUT = process.env.PROOF_SHOTS_DIR ?? '../proof/phase1-local/screenshots';
const STORYBOOK = process.env.STORYBOOK_URL ?? 'http://127.0.0.1:6007';

test.skip(!PHASE, 'set CAPTURE=phase1|phase2 (use scripts/capture-proof.sh)');
test.beforeAll(() => mkdirSync(OUT, { recursive: true }));

const shot = (page: Page, name: string) => page.screenshot({ path: `${OUT}/${name}.png` });
const evidence = (page: Page) => expect(page.getByTestId('evidence-highlight').first()).toBeVisible({ timeout: 30_000 });

test.describe('phase1 local', () => {
  test.skip(PHASE !== 'phase1');

  test('captures the eleven required screens', async ({ page }) => {
    test.setTimeout(180_000);
    await freezeClock(page);
    await page.goto('/');
    await expect(page.getByRole('row', { name: /Aquila IP-200/ })).toBeVisible();
    await page.waitForLoadState('networkidle');
    await shot(page, '01-queue');

    await page.goto('/files/f01');
    await expect(page.getByTestId('clause-item').first()).toBeVisible();
    await page.waitForLoadState('networkidle');
    await shot(page, '02-workspace');

    await page.goto('/files/f01?clause=8.4.2');
    await evidence(page);
    await expect(page.getByText('p. 233 / 412')).toBeVisible();
    await shot(page, '03-evidence-highlight');

    await page.keyboard.press('e');
    await page.getByLabel('Corrected verdict').selectOption('not_demonstrated');
    await page.getByLabel(/Reason/).fill('Report covers a different sample');
    await page.getByRole('button', { name: /Save correction/ }).click();
    await expect(page.getByRole('region', { name: 'Correction diff' })).toBeVisible();
    await page.waitForTimeout(400);
    await shot(page, '04-finding-correction-diff');

    await setPrefs(page, 'light', 'compact');
    await page.goto('/files/f01/matrix');
    await expect(page.getByText('Quality policy').first()).toBeVisible();
    await shot(page, '05-matrix-compact');
    await setPrefs(page, 'light', 'comfortable');
    await page.goto('/files/f01/matrix');
    await expect(page.getByText('Quality policy').first()).toBeVisible();
    await shot(page, '06-matrix-comfortable');

    await page.goto('/files/f01?clause=8.4.2');
    await evidence(page);
    await page.keyboard.press('Control+k');
    await page.getByPlaceholder(/Type a command/).fill('leak');
    await expect(page.getByRole('option', { name: /Patient leakage current/ })).toBeVisible();
    await shot(page, '07-command-palette');
    await page.keyboard.press('Escape');

    await page.goto('/files/f01/decision');
    await page.getByLabel('Conforms with conditions').check();
    await page.getByLabel('Rationale').fill('Open items to close before certification: 4.3.3, 8.3.3.');
    await page.getByRole('button', { name: /Record decision/ }).click();
    await expect(page.getByRole('status').filter({ hasText: /Signed by/ })).toBeVisible();
    await page.waitForTimeout(500);
    await shot(page, '08-decision');

    await setPrefs(page, 'dark');
    await page.goto('/files/f01?clause=8.4.2');
    await evidence(page);
    await shot(page, '09-dark-workspace');

    await page.goto(`${STORYBOOK}/?path=/story/foundations-tokens--overview`);
    await page.frameLocator('#storybook-preview-iframe').getByRole('heading', { name: 'Colour' }).waitFor();
    await shot(page, '10-storybook-tokens');
    await page.goto(`${STORYBOOK}/?path=/story/review-findingcard--corrected-with-diff-and-history`);
    await page.frameLocator('#storybook-preview-iframe').getByRole('region', { name: 'Correction diff' }).waitFor();
    await shot(page, '11-storybook-findingcard');
  });
});

test.describe('phase2 cloud', () => {
  test.skip(PHASE !== 'phase2');

  test('captures the cloud screens', async ({ page, baseURL }) => {
    test.setTimeout(180_000);
    await page.goto('/files/f01?clause=8.4.2');
    await evidence(page);
    await expect(page.getByText('p. 233 / 412')).toBeVisible();
    await shot(page, '01-cf-workspace');

    // Findings with the producing rule or model shown as the source
    await page.goto('/files/f01?clause=4.1.1');
    await expect(page.getByText(/Source:/)).toBeVisible();
    await shot(page, '02-cf-bedrock-findings');

    await page.goto(`${baseURL}/storybook/?path=/story/review-findingcard--pending`);
    await page.frameLocator('#storybook-preview-iframe').getByRole('article').waitFor({ timeout: 30_000 });
    await shot(page, '03-cf-storybook');
  });
});
