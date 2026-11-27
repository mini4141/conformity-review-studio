import type { ClauseRow, ClauseStatus, Correction, Decision, DecisionValue, FileMeta, Finding, Verdict } from '@crs/shared';

const BASE = import.meta.env.VITE_API_BASE ?? '/api';

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { ...init, headers: { 'content-type': 'application/json', ...init?.headers } });
  if (!res.ok) throw new Error(`${init?.method ?? 'GET'} ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export interface ActionBody {
  action: 'accept' | 'reject' | 'edit';
  verdict?: Verdict;
  reason?: string;
  evidence?: { page: number; quote: string };
}

export const api = {
  files: () => req<FileMeta[]>('/files'),
  file: (id: string) => req<FileMeta>(`/files/${id}`),
  clauses: (id: string) => req<ClauseRow[]>(`/files/${id}/clauses`),
  findings: (id: string, clause: string) => req<Finding[]>(`/files/${id}/findings?clause=${encodeURIComponent(clause)}`),
  act: (findingId: string, body: ActionBody) => req<Finding & { history: Correction[] }>(`/findings/${encodeURIComponent(findingId)}/actions`, { method: 'POST', body: JSON.stringify(body) }),
  patchClause: (id: string, cid: string, patch: Partial<ClauseStatus>) => req<ClauseStatus>(`/files/${id}/clauses/${cid}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  decision: (id: string) => req<Decision | null>(`/files/${id}/decision`),
  putDecision: (id: string, body: { decision: DecisionValue; rationale: string }) => req<Decision>(`/files/${id}/decision`, { method: 'PUT', body: JSON.stringify(body) }),
  pdfUrl: (id: string) => `${BASE}/files/${id}/pdf`,
  exportUrl: (id: string, format: 'json' | 'html') => `${BASE}/files/${id}/export?format=${format}`,
};
