import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ClauseRow, ClauseStatus, DecisionValue, Finding } from '@crs/shared';
import { api, type ActionBody } from './api';

export const useFiles = () => useQuery({ queryKey: ['files'], queryFn: api.files });
export const useFile = (id: string) => useQuery({ queryKey: ['file', id], queryFn: () => api.file(id) });
export const useClauses = (id: string) => useQuery({ queryKey: ['clauses', id], queryFn: () => api.clauses(id) });
export const useFindings = (id: string, clause: string | null) => useQuery({ queryKey: ['findings', id, clause], queryFn: () => api.findings(id, clause!), enabled: !!clause });
export const useDecision = (id: string) => useQuery({ queryKey: ['decision', id], queryFn: () => api.decision(id) });

/** Accept / reject / edit a finding; updates the cached finding and the clause row immediately. */
export function useFindingAction(fileId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: ActionBody }) => api.act(id, body),
    onSuccess: (finding) => {
      qc.setQueryData<Finding[]>(['findings', fileId, finding.clauseId], [finding]);
      const { history: _h, ...summary } = finding;
      qc.setQueryData<ClauseRow[]>(['clauses', fileId], (rows) => rows?.map((r) => (r.id === finding.clauseId ? { ...r, finding: summary } : r)));
    },
  });
}

export function usePatchClause(fileId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ clauseId, patch }: { clauseId: string; patch: Partial<ClauseStatus> }) => api.patchClause(fileId, clauseId, patch),
    onSuccess: (status, { clauseId }) => qc.setQueryData<ClauseRow[]>(['clauses', fileId], (rows) => rows?.map((r) => (r.id === clauseId ? { ...r, status } : r))),
  });
}

export function usePutDecision(fileId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: { decision: DecisionValue; rationale: string }) => api.putDecision(fileId, b),
    onSuccess: (d) => {
      qc.setQueryData(['decision', fileId], d);
      void qc.invalidateQueries({ queryKey: ['files'] });
    },
  });
}
