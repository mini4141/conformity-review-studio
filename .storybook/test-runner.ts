import type { TestRunnerConfig } from '@storybook/test-runner';
import AxeBuilder from '@axe-core/playwright';
import { appendFileSync, mkdirSync } from 'node:fs';

// Every story is checked with axe-core; results are appended as JSON lines and summarised by scripts/test-all.sh.
const OUT = process.env.AXE_LOG ?? 'proof/phase1-local/logs/axe-stories.jsonl';

const config: TestRunnerConfig = {
  async postVisit(page, ctx) {
    const res = await new AxeBuilder({ page }).include('#storybook-root').analyze();
    const serious = res.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    mkdirSync('proof/phase1-local/logs', { recursive: true });
    appendFileSync(OUT, JSON.stringify({ story: ctx.id, violations: res.violations.length, serious: serious.length, ids: serious.map((v) => v.id) }) + '\n');
    if (serious.length) throw new Error(`axe: ${serious.length} serious violation(s) in ${ctx.id}: ${serious.map((v) => v.id).join(', ')}`);
  },
};
export default config;
