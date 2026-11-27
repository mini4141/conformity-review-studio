import { Hono } from 'hono';
import { REVIEWER, VERDICTS, type ClauseRow, type Correction, type Decision, type FileMeta, type Finding } from '@crs/shared';
import { repo } from './ddb/repo.js';
import { docs, pdfKey } from './docs/store.js';
import { getProvider } from './providers/index.js';
import { renderReportHtml } from './export.js';
import { standard } from './standard.js';
import { log } from './log.js';

const api = new Hono();

async function clauseRows(fileId: string): Promise<ClauseRow[]> {
  const [status, findings] = await Promise.all([repo.listClauseStatus(fileId), repo.listFindings(fileId)]);
  const byClause = new Map(findings.map((f) => [f.clauseId, f]));
  return standard.clauses.map((c) => ({ ...c, status: status[c.id] ?? {}, finding: byClause.get(c.id) }));
}

api.get('/files', async (c) => c.json(await repo.listFiles()));

api.get('/files/:id', async (c) => {
  const file = await repo.getFile(c.req.param('id'));
  return file ? c.json(file) : c.json({ error: 'not found' }, 404);
});

api.get('/files/:id/pdf', async (c) => {
  const file = await repo.getFile(c.req.param('id'));
  if (!file?.hasDocument) return c.json({ error: 'no document' }, 404);
  const loc = await docs.locate(pdfKey(file.id));
  if (loc.kind === 'url') return c.redirect(loc.url, 302);
  return new Response(loc.bytes as BodyInit, { headers: { 'content-type': 'application/pdf', 'cache-control': 'private, max-age=300' } });
});

api.get('/files/:id/clauses', async (c) => c.json(await clauseRows(c.req.param('id'))));

api.get('/files/:id/findings', async (c) => {
  const id = c.req.param('id');
  const clause = c.req.query('clause');
  const findings = (await repo.listFindings(id)).filter((f) => !clause || f.clauseId === clause);
  if (!clause) return c.json(findings);
  return c.json(await Promise.all(findings.map(async (f): Promise<Finding> => ({ ...f, history: await repo.listCorrections(f.id) }))));
});

api.post('/findings/:id/actions', async (c) => {
  const body = await c.req.json<{ action: 'accept' | 'reject' | 'edit'; verdict?: string; reason?: string; evidence?: { page: number; quote: string } }>();
  const finding = await repo.getFinding(c.req.param('id'));
  if (!finding) return c.json({ error: 'not found' }, 404);
  if (!['accept', 'reject', 'edit'].includes(body.action)) return c.json({ error: 'bad action' }, 400);
  if (body.verdict && !(VERDICTS as readonly string[]).includes(body.verdict)) return c.json({ error: 'bad verdict' }, 400);
  const now = new Date().toISOString();
  const verdict = (body.action === 'edit' ? body.verdict : undefined) ?? finding.current.verdict;
  const evidence = (body.action === 'edit' ? body.evidence : undefined) ?? finding.current.evidence;
  const reason = body.reason ?? '';
  const next: Finding = {
    ...finding,
    state: { accept: 'accepted', reject: 'rejected', edit: 'corrected' }[body.action] as Finding['state'],
    current: body.action === 'edit' ? { verdict: verdict as Finding['current']['verdict'], evidence, reason } : { ...finding.current, reason: reason || finding.current.reason },
    updatedAt: now,
  };
  const corr: Correction = { ts: now, by: REVIEWER, action: body.action, verdict: next.current.verdict, reason, evidence: next.current.evidence };
  await Promise.all([repo.putFinding(next), repo.addCorrection(finding.id, corr)]);
  return c.json({ ...next, history: await repo.listCorrections(finding.id) });
});

api.patch('/files/:id/clauses/:cid', async (c) => {
  const body = await c.req.json<{ verdict?: string; comment?: string; reviewer?: string }>();
  if (body.verdict && !(VERDICTS as readonly string[]).includes(body.verdict)) return c.json({ error: 'bad verdict' }, 400);
  const patch = { verdict: body.verdict as never, comment: body.comment, reviewer: body.reviewer ?? REVIEWER, updatedAt: new Date().toISOString() };
  return c.json(await repo.patchClauseStatus(c.req.param('id'), c.req.param('cid'), patch));
});

api.get('/files/:id/decision', async (c) => c.json((await repo.getDecision(c.req.param('id'))) ?? null));

api.put('/files/:id/decision', async (c) => {
  const b = await c.req.json<Pick<Decision, 'decision' | 'rationale'>>();
  if (!['conforms', 'conforms_with_conditions', 'does_not_conform'].includes(b.decision)) return c.json({ error: 'bad decision' }, 400);
  const d: Decision = { decision: b.decision, rationale: b.rationale ?? '', signedBy: REVIEWER, signedAt: new Date().toISOString() };
  await repo.putDecision(c.req.param('id'), d);
  const file = await repo.getFile(c.req.param('id'));
  if (file) await repo.putFile({ ...file, status: 'Closed' });
  return c.json(d);
});

api.get('/files/:id/export', async (c) => {
  const id = c.req.param('id');
  const file = await repo.getFile(id);
  if (!file) return c.json({ error: 'not found' }, 404);
  const [rows, decision] = await Promise.all([clauseRows(id), repo.getDecision(id)]);
  const findings = await Promise.all(
    rows.filter((r) => r.finding && r.finding.state !== 'pending').map(async (r) => ({ ...r.finding!, history: await repo.listCorrections(r.finding!.id) })),
  );
  const report = { standard: standard.id, file, decision: decision ?? null, generatedAt: new Date().toISOString(), rows, reviewedFindings: findings };
  if (c.req.query('format') === 'html') return c.html(renderReportHtml(report));
  return c.json(report, 200, { 'content-disposition': `attachment; filename="${id}-report.json"` });
});

api.post('/files', async (c) => {
  const form = await c.req.parseBody();
  const upload = form.file;
  if (!(upload instanceof File)) return c.json({ error: 'file required' }, 400);
  const bytes = new Uint8Array(await upload.arrayBuffer());
  const id = `u${Date.now().toString(36)}`;
  // loaded on demand: keeps the PDF engine out of the Lambda cold start of every other route
  const { analysePages, extractPages } = await import('./doc-intel/pipeline.js');
  const pages = await extractPages(bytes);
  const result = await analysePages(id, standard.clauses, pages, getProvider());
  await docs.put(pdfKey(id), bytes);
  const file: FileMeta = {
    id,
    title: String(form.title || upload.name.replace(/\.pdf$/i, '')),
    deviceClass: 'IIb',
    manufacturer: String(form.manufacturer || 'Uploaded'),
    pages: result.pageCount,
    due: new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10),
    status: 'New',
    risk: 'medium',
    assignee: REVIEWER,
    aiCoverage: result.coverage,
    hasDocument: true,
  };
  await repo.putFile(file);
  await repo.putFindings(result.findings);
  return c.json(file, 201);
});

export const app = new Hono();
app.use('*', async (c, next) => {
  const t = Date.now();
  await next();
  if (c.req.path !== '/healthz') log('info', 'request', { method: c.req.method, path: c.req.path, status: c.res.status, ms: Date.now() - t });
});
app.get('/healthz', (c) => c.json({ ok: true }));
app.get('/api/healthz', (c) => c.json({ ok: true }));
app.route('/api', api);
app.onError((e, c) => {
  log('error', 'unhandled', { error: e.message });
  return c.json({ error: 'internal error' }, 500);
});
