import type { ClauseRow, Finding } from '@crs/shared';

export const sampleFinding: Finding = {
  id: 'f01~8.4.2',
  fileId: 'f01',
  clauseId: '8.4.2',
  confidence: 0.91,
  source: { kind: 'rules', name: 'rules/result-line@1.0' },
  rationale: 'Result line reports PASS on page 233.',
  original: { verdict: 'satisfied', evidence: { page: 233, quote: 'Test report TR-118: patient leakage 42 uA normal / 98 uA single fault, limit 100 uA. Result: PASS.' } },
  current: { verdict: 'satisfied', evidence: { page: 233, quote: 'Test report TR-118: patient leakage 42 uA normal / 98 uA single fault, limit 100 uA. Result: PASS.' }, reason: '' },
  state: 'pending',
  updatedAt: '2026-11-28T00:00:00Z',
};

const row = (id: string, title: string, group: string, verdict?: 'satisfied' | 'partial' | 'not_demonstrated' | 'needs_info', page = 10): ClauseRow => ({
  id,
  section: id.split('.')[0]!,
  sectionTitle: 'Electrical safety',
  group,
  title,
  text: `The manufacturer shall document ${title.toLowerCase()}.`,
  keywords: [],
  status: {},
  finding: verdict
    ? { ...sampleFinding, id: `f01~${id}`, clauseId: id, current: { verdict, evidence: { page, quote: `Quote for ${id}` }, reason: '' }, original: { verdict, evidence: { page, quote: `Quote for ${id}` } } }
    : undefined,
});

export const sampleRows: ClauseRow[] = [
  row('8.1.1', 'Earth continuity', 'Protective earthing', 'satisfied', 220),
  row('8.4.2', 'Patient leakage current', 'Leakage currents', 'satisfied', 233),
  row('8.4.3', 'Touch current', 'Leakage currents', 'not_demonstrated', 234),
  row('8.5.1', 'Battery run time', 'Battery operation', 'partial', 240),
  row('8.5.2', 'Battery charging safety', 'Battery operation'),
];
