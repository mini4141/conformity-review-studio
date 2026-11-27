import type { Verdict } from '@crs/shared';
import type { FindingProvider, Proposal } from './types.js';

const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const conf = (id: string, lo: number, hi: number) => Math.round((lo + ((hash(id) % 100) / 100) * (hi - lo)) * 100) / 100;

const RULE = 'rules/result-line@1.0';

/** Deterministic rules engine: reads the "Result:" line of the evidence summary, falls back to keyword hits. */
export const rulesProvider: FindingProvider = {
  name: 'rules',
  async propose(clause, passages): Promise<Proposal | null> {
    const best = passages[0];
    if (!best) return null;
    const resultLine = best.lines.find((l) => /Result:/i.test(l));
    if (best.explicit && resultLine) {
      const r = /Result:\s*([A-Z ]+)\.?$/i.exec(resultLine)?.[1]?.trim().toUpperCase() ?? '';
      const map: [RegExp, Verdict, number, number, string][] = [
        [/^PASS WITH OBSERVATIONS/, 'partial', 0.55, 0.72, 'Result line reports observations'],
        [/^PASS/, 'satisfied', 0.78, 0.96, 'Result line reports PASS'],
        [/^FAIL/, 'not_demonstrated', 0.62, 0.82, 'Result line reports FAIL'],
      ];
      for (const [re, verdict, lo, hi, why] of map) {
        if (re.test(r)) {
          return { verdict, confidence: conf(clause.id, lo, hi), evidence: { page: best.page, quote: resultLine }, rationale: `${why} on page ${best.page}.`, source: { kind: 'rules', name: RULE } };
        }
      }
      return { verdict: 'needs_info', confidence: conf(clause.id, 0.4, 0.55), evidence: { page: best.page, quote: resultLine }, rationale: `Result line on page ${best.page} is inconclusive.`, source: { kind: 'rules', name: RULE } };
    }
    const kw = clause.keywords;
    const line = best.lines.map((l) => ({ l, n: kw.filter((k) => l.toLowerCase().includes(k)).length })).sort((a, b) => b.n - a.n)[0];
    if (!line || line.n === 0) return null;
    return { verdict: 'needs_info', confidence: conf(clause.id, 0.3, 0.42), evidence: { page: best.page, quote: line.l }, rationale: 'Keyword match only; no explicit clause reference.', source: { kind: 'rules', name: 'rules/keyword@1.0' } };
  },
};
