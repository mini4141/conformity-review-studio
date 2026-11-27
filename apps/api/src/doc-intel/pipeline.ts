import { getDocumentProxy } from 'unpdf';
import type { Clause, Finding } from '@crs/shared';
import type { FindingProvider, Passage } from '../providers/types.js';

export type PageLines = string[];

/** Extract text per page, grouping pdf.js text items into visual lines by baseline. */
export async function extractPages(bytes: Uint8Array): Promise<PageLines[]> {
  const pdf = await getDocumentProxy(new Uint8Array(bytes));
  const pages: PageLines[] = [];
  for (let n = 1; n <= pdf.numPages; n++) {
    const page = await pdf.getPage(n);
    const content = await page.getTextContent();
    const rows = new Map<number, { x: number; s: string }[]>();
    for (const it of content.items) {
      if (!('str' in it) || !it.str.trim()) continue;
      const y = Math.round(it.transform[5] as number);
      const row = rows.get(y) ?? [];
      row.push({ x: it.transform[4] as number, s: it.str });
      rows.set(y, row);
    }
    pages.push([...rows.entries()].sort((a, b) => b[0] - a[0]).map(([, r]) => r.sort((a, b) => a.x - b.x).map((i) => i.s).join(' ').trim()));
  }
  return pages;
}

export interface Heading {
  clauseId: string;
  page: number;
}

/** Segment headings of the form "Clause 8.4.2 - Title" into clause -> page. */
export function segmentHeadings(pages: PageLines[]): Heading[] {
  const out: Heading[] = [];
  pages.forEach((lines, i) => {
    for (const l of lines) {
      const m = /^Clause (\d+(?:\.\d+)+)\b/.exec(l);
      if (m) out.push({ clauseId: m[1]!, page: i + 1 });
    }
  });
  return out;
}

const hits = (clause: Clause, text: string) => {
  const t = text.toLowerCase();
  return clause.keywords.filter((k) => t.includes(k)).length;
}

/** Candidate passages for a clause: its heading page first, else the best keyword-scored pages. */
export function candidatesFor(clause: Clause, pages: PageLines[], headings: Heading[]): Passage[] {
  const direct = headings.filter((h) => h.clauseId === clause.id).map((h): Passage => ({ page: h.page, lines: pages[h.page - 1]!, explicit: true }));
  if (direct.length) return direct;
  const need = Math.min(3, clause.keywords.length);
  return pages
    .map((lines, i): Passage & { score: number } => ({ page: i + 1, lines, explicit: false, score: hits(clause, lines.join(' ')) }))
    .filter((p) => p.score >= need)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);
}

export interface AnalyseResult {
  findings: Finding[];
  coverage: number;
  pageCount: number;
}

export async function analysePages(fileId: string, clauses: Clause[], pages: PageLines[], provider: FindingProvider): Promise<AnalyseResult> {
  const headings = segmentHeadings(pages);
  const now = new Date().toISOString();
  const findings: Finding[] = [];
  for (const clause of clauses) {
    const passages = candidatesFor(clause, pages, headings);
    if (!passages.length) continue;
    const p = await provider.propose(clause, passages);
    if (!p) continue;
    findings.push({
      id: `${fileId}~${clause.id}`,
      fileId,
      clauseId: clause.id,
      confidence: p.confidence,
      source: p.source,
      rationale: p.rationale,
      original: { verdict: p.verdict, evidence: p.evidence },
      current: { verdict: p.verdict, evidence: p.evidence, reason: '' },
      state: 'pending',
      updatedAt: now,
    });
  }
  return { findings, coverage: Math.round((findings.length / clauses.length) * 100), pageCount: pages.length };
}
