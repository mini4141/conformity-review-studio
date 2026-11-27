import { useParams } from 'react-router-dom';
import { useToast } from '@crs/ui';
import { DecisionPanel } from '../features/decision/DecisionPanel';
import { useClauses, useDecision, usePutDecision } from '../queries';

export function DecisionPage() {
  const { id = '' } = useParams();
  const clauses = useClauses(id);
  const decision = useDecision(id);
  const put = usePutDecision(id);
  const toast = useToast();
  return (
    <div className="page">
      <div className="page-head"><h1>Conformity decision</h1></div>
      <div className="page-scroll">
        {clauses.data && decision.isSuccess ? (
          <DecisionPanel key={decision.data?.signedAt ?? 'new'} fileId={id} rows={clauses.data} decision={decision.data} saving={put.isPending} onSave={(b) => put.mutate(b, { onSuccess: () => toast('Decision recorded', 'ok'), onError: () => toast('Could not save the decision', 'bad') })} />
        ) : (
          <p className="muted pad">Loading…</p>
        )}
      </div>
    </div>
  );
}
