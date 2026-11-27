import { expect, test } from '@playwright/test';
import { freezeClock } from './helpers';

// The demo story end to end: open file -> select clause -> jump to evidence -> correct a finding -> record decision.
test('review journey: queue, evidence jump, correction that persists, matrix edit, decision and export', async ({ page, request, baseURL }) => {
  await freezeClock(page);

  // Queue: 25 files, "High risk" narrows the list
  await page.goto('/');
  await expect(page.getByText('25 of 25 files')).toBeVisible();
  await page.getByRole('tab', { name: /High risk/ }).click();
  await expect(page.getByText(/^\d+ of 25 files$/)).not.toHaveText('25 of 25 files');
  await page.getByRole('tab', { name: /All files/ }).click();
  await page.getByRole('row', { name: /Aquila IP-200/ }).click();
  await expect(page).toHaveURL(/\/files\/f01/);

  // Go to clause 8.4.2 with the keyboard: the PDF jumps to p. 233 with the passage highlighted
  await page.getByTestId('clause-item').first().waitFor();
  await page.keyboard.press('g');
  await page.keyboard.press('c');
  await page.getByPlaceholder(/Go to clause/).fill('8.4.2');
  await page.keyboard.press('Enter');
  await expect(page.getByText('p. 233 / 412')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('evidence-highlight').first()).toBeVisible();
  await expect(page.getByRole('article', { name: /clause 8.4.2/ })).toContainText('patient leakage 42 uA');

  // j / k move between findings
  await page.keyboard.press('j');
  await expect(page).toHaveURL(/clause=8\.4\.3/);
  await page.keyboard.press('k');
  await expect(page).toHaveURL(/clause=8\.4\.2/);

  // Correct it: e -> verdict + reason
  await page.keyboard.press('e');
  await page.getByLabel('Corrected verdict').selectOption('not_demonstrated');
  await page.getByLabel(/Reason/).fill('Report covers a different sample');
  await page.getByRole('button', { name: /Save correction/ }).click();
  await expect(page.getByRole('region', { name: 'Correction diff' })).toBeVisible();

  // Persisted: after a reload the history shows the correction
  await page.reload();
  await expect(page.getByRole('region', { name: 'Override history' })).toContainText('Report covers a different sample');

  // Matrix: inline edit of a comment with the keyboard persists
  await page.getByRole('tab', { name: 'Matrix' }).click();
  const grid = page.getByRole('grid', { name: 'Requirements matrix' });
  await expect(grid).toBeVisible();
  await grid.getByRole('row').nth(1).getByRole('gridcell').nth(9).click(); // comment column of the first data row
  await page.keyboard.press('Enter');
  await page.getByLabel('comment').fill('Seen in audit');
  await page.keyboard.press('Enter');
  await expect(page.getByText('Saved 4.1.1')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Seen in audit')).toBeVisible();

  // Decision: record and sign off
  await page.getByRole('tab', { name: 'Decision' }).click();
  await page.getByLabel('Conforms with conditions').check();
  await page.getByLabel('Rationale').fill('Open items to close before certification.');
  await page.getByRole('button', { name: /Record decision/ }).click();
  await expect(page.getByRole('status').filter({ hasText: /Signed by/ })).toBeVisible();

  // Export: the report contains the corrected finding
  const res = await request.get(`${baseURL}/api/files/f01/export?format=html`);
  const html = await res.text();
  expect(html).toContain('8.4.2');
  expect(html).toContain('Report covers a different sample');
  expect(html).toContain('Conforms with conditions');
});

test('keyboard affordances: command palette and shortcut sheet', async ({ page }) => {
  await page.goto('/files/f01');
  await page.keyboard.press('Control+k');
  await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.keyboard.press('?');
  await expect(page.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeVisible();
});
