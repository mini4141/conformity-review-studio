// Summarises axe results (Storybook stories + app screens) into <dir>/axe-summary.json.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const dir = process.argv[2] ?? 'proof/phase1-local/logs';
const read = (f) => (existsSync(`${dir}/${f}`) ? readFileSync(`${dir}/${f}`, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);
const stories = read('axe-stories.jsonl');
const app = read('axe-app.jsonl');
const sum = (rows) => ({ checked: rows.length, withViolations: rows.filter((r) => r.violations > 0).length, serious: rows.reduce((n, r) => n + r.serious, 0) });
const out = { engine: 'axe-core', stories: sum(stories), appScreens: sum(app), detail: { stories, app } };
writeFileSync(`${dir}/axe-summary.json`, JSON.stringify(out, null, 2));
console.log(JSON.stringify({ stories: out.stories, appScreens: out.appScreens }));
if (out.stories.serious + out.appScreens.serious > 0) process.exit(1);
