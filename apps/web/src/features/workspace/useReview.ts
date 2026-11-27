import { useToast } from '@crs/ui';
import { useFindingAction, useFindings } from '../../queries';
import { useWorkspace } from '../../state/ui';
import type { EditPayload } from './FindingCard';

/** The selected clause's finding plus the review actions shared by buttons, hotkeys and the palette. */
export function useReview(fileId: string) {
  const clauseId = useWorkspace((s) => s.clauseId);
  const editing = useWorkspace((s) => s.editing);
  const setEditing = useWorkspace((s) => s.setEditing);
  const findings = useFindings(fileId, clauseId);
  const finding = findings.data?.[0];
  const act = useFindingAction(fileId);
  const toast = useToast();

  const run = (body: Parameters<typeof act.mutate>[0]['body'], done: string) => {
    if (!finding) return;
    act.mutate({ id: finding.id, body }, { onSuccess: () => toast(done, 'ok'), onError: () => toast('Could not save, try again', 'bad') });
  };

  return {
    finding,
    loading: findings.isLoading,
    editing,
    accept: () => run({ action: 'accept' }, `Accepted ${finding?.clauseId}`),
    reject: () => run({ action: 'reject' }, `Rejected ${finding?.clauseId}`),
    startEdit: () => finding && setEditing(true),
    cancelEdit: () => setEditing(false),
    saveEdit: (p: EditPayload) => {
      run({ action: 'edit', ...p }, `Correction saved for ${finding?.clauseId}`);
      setEditing(false);
    },
  };
}
