import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { freezeClock, setPrefs } from './helpers';

const OUT = process.env.PROOF_LOGS_DIR ?? '../proof/phase1-local/logs';
const SCREENS = [
  ['queue', '/', 'Aquila IP-200'],
  ['workspace', '/files/f01?clause=8.4.2', 'Findings'],
  ['matrix', '/files/f01/matrix', 'Requirements matrix'],
  ['decision', '/files/f01/decision', 'Summary'],
] as const;

mkdirSync(OUT, { recursive: true });
test.beforeAll(() => writeFileSync(`${OUT}/axe-app.jsonl`, ''));

for (const theme of ['light', 'dark'] as const) {
  for (const [name, path, ready] of SCREENS) {
    test(`axe: ${name} (${theme}) has no serious or critical violations`, async ({ page }) => {
      await freezeClock(page);
      await setPrefs(page, theme);
      await page.goto(path);
      await expect(page.getByText(ready).first()).toBeVisible({ timeout: 20_000 });
      await page.waitForLoadState('networkidle');
      const res = await new AxeBuilder({ page }).analyze();
      const serious = res.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      appendFileSync(`${OUT}/axe-app.jsonl`, JSON.stringify({ screen: name, theme, violations: res.violations.length, serious: serious.length, ids: res.violations.map((v) => `${v.id}:${v.impact}`) }) + '\n');
      expect(serious.map((v) => `${v.id}: ${v.nodes[0]?.html}`)).toEqual([]);
    });
  }
}
