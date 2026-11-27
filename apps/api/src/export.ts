import { DECISION_LABEL, VERDICT_LABEL, effectiveVerdict, type ClauseRow, type Decision, type FileMeta, type Finding } from '@crs/shared';

interface Report {
  standard: string;
  file: FileMeta;
  decision: Decision | null;
  generatedAt: string;
  rows: ClauseRow[];
  reviewedFindings: Finding[];
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export function renderReportHtml(r: Report): string {
  const counts = new Map<string, number>();
  for (const row of r.rows) {
    const v = effectiveVerdict(row);
    const k = v ? VERDICT_LABEL[v] : 'No finding';
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const corrected = r.reviewedFindings.filter((f) => f.state === 'corrected');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Conformity report ${esc(r.file.id)}</title>
<style>
body{font:13px/1.45 system-ui,sans-serif;max-width:860px;margin:24px auto;color:#16181d}
h1{font-size:20px;margin:0 0 4px}h2{font-size:15px;margin:24px 0 8px;border-bottom:1px solid #ccd}
table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #e3e5ea;padding:4px 6px;text-align:left;vertical-align:top;font-variant-numeric:tabular-nums}
.muted{color:#5d6370}del{color:#a1262a}ins{color:#1b6b3a;text-decoration:none;font-weight:600}
@media print{body{margin:0}h2{break-after:avoid}tr{break-inside:avoid}}
</style></head><body>
<h1>${esc(r.file.title)}</h1>
<p class="muted">Assessed against ${esc(r.standard)} · generated ${esc(r.generatedAt)}</p>
<h2>Decision</h2>
${r.decision ? `<p><b>${esc(DECISION_LABEL[r.decision.decision])}</b> · signed by ${esc(r.decision.signedBy)} on ${esc(r.decision.signedAt)}</p><p>${esc(r.decision.rationale)}</p>` : '<p class="muted">No decision recorded.</p>'}
<h2>Summary</h2>
<table>${[...counts].map(([k, n]) => `<tr><td>${esc(k)}</td><td>${n}</td></tr>`).join('')}</table>
<h2>Corrected findings (${corrected.length})</h2>
<table><tr><th>Clause</th><th>AI proposed</th><th>Reviewer corrected</th><th>Reason</th></tr>
${corrected.map((f) => `<tr><td>${esc(f.clauseId)}</td><td><del>${esc(VERDICT_LABEL[f.original.verdict])}</del></td><td><ins>${esc(VERDICT_LABEL[f.current.verdict])}</ins> (p. ${f.current.evidence.page})</td><td>${esc(f.current.reason)}</td></tr>`).join('') || '<tr><td colspan="4" class="muted">None</td></tr>'}
</table>
<h2>All reviewed findings (${r.reviewedFindings.length})</h2>
<table><tr><th>Clause</th><th>State</th><th>Verdict</th><th>Evidence</th></tr>
${r.reviewedFindings.map((f) => `<tr><td>${esc(f.clauseId)}</td><td>${esc(f.state)}</td><td>${esc(VERDICT_LABEL[f.current.verdict])}</td><td>p. ${f.current.evidence.page}: ${esc(f.current.evidence.quote)}</td></tr>`).join('')}
</table></body></html>`;
}
