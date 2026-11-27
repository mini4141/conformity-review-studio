import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { analysePages, extractPages } from './doc-intel/pipeline.js';
import { rulesProvider } from './providers/rules.js';
import { standard } from './standard.js';

describe('document intelligence (rules provider)', () => {
  it('yields findings for at least 80% of clauses and finds 8.4.2 on page 233', async () => {
    const bytes = new Uint8Array(await readFile(new URL('../../../data/samples/aquila-ip200-tech-file-v3.pdf', import.meta.url)));
    const result = await analysePages('t', standard.clauses, await extractPages(bytes), rulesProvider);
    expect(result.pageCount).toBe(412);
    expect(result.coverage).toBeGreaterThanOrEqual(80);
    const f = result.findings.find((x) => x.clauseId === '8.4.2')!;
    expect(f.original.evidence.page).toBe(233);
    expect(f.original.verdict).toBe('satisfied');
  }, 60_000);
});
