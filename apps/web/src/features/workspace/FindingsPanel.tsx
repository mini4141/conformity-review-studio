import { EmptyState } from '@crs/ui';
import type { ClauseRow } from '@crs/shared';
import { useWorkspace } from '../../state/ui';
import { FindingCard } from './FindingCard';
import { useReview } from './useReview';

export function FindingsPanel({ fileId, clause, reviewed, total }: { fileId: string; clause?: ClauseRow; reviewed: number; total: number }) {
  const r = useReview(fileId);
  const select = useWorkspace((s) => s.select);
  return (
    <div className="fp">
      <div className="fp-head">
        <h2>Findings</h2>
        <span className="muted tnum" title="Findings accepted, rejected or corrected">
          {reviewed} / {total} reviewed
        </span>
        <progress className="fp-progress" max={total || 1} value={reviewed} aria-label="Review progress" />
      </div>
      <div className="fp-body">
        {!clause && <EmptyState icon="list" title="Select a clause">Choose a clause in the checklist, or press <kbd className="ui-kbd">j</kbd> to start with the first finding.</EmptyState>}
        {clause && (
          <>
            <p className="fp-clause">{clause.text}</p>
            {r.finding ? (
              <FindingCard
                finding={r.finding}
                clause={clause}
                editing={r.editing}
                onAccept={r.accept}
                onReject={r.reject}
                onStartEdit={r.startEdit}
                onCancelEdit={r.cancelEdit}
                onSaveEdit={r.saveEdit}
                onJump={() => select(clause.id)}
              />
            ) : (
              !r.loading && <EmptyState icon="search" title="No finding for this clause">The analysis found no evidence for clause {clause.id}. Record this in the matrix.</EmptyState>
            )}
          </>
        )}
      </div>
    </div>
  );
}
