import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Badge, Button, Popover, ROW_HEIGHT, useToast } from '@crs/ui';
import { VERDICTS, VERDICT_LABEL, effectiveVerdict, type Verdict } from '@crs/shared';
import { GRID_COLUMNS, RequirementsGrid } from '../features/matrix/RequirementsGrid';
import { useClauses, usePatchClause } from '../queries';
import { useUi } from '../state/ui';

const DEFAULT_HIDDEN = ['text', 'source', 'updated'];

export function MatrixPage() {
  const { id = '' } = useParams();
  const { data } = useClauses(id);
  const density = useUi((s) => s.density);
  const patch = usePatchClause(id);
  const toast = useToast();
  const [q, setQ] = useState('');
  const [verdict, setVerdict] = useState<'all' | Verdict | 'none'>('all');
  const [hidden, setHidden] = useState(new Set(DEFAULT_HIDDEN));

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (data ?? []).filter((r) => {
      const v = effectiveVerdict(r);
      if (verdict === 'none' ? v : verdict !== 'all' && v !== verdict) return false;
      return !needle || `${r.id} ${r.title} ${r.group} ${r.status.comment ?? ''}`.toLowerCase().includes(needle);
    });
  }, [data, q, verdict]);

  return (
    <div className="page">
      <div className="page-head">
        <h1>Requirements matrix</h1>
        <span className="muted tnum" aria-live="polite">{rows.length} of {data?.length ?? 0} requirements</span>
        <div className="page-tools">
          <input className="ui-input" type="search" aria-label="Filter requirements" placeholder="Filter requirements" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="ui-input" aria-label="Verdict filter" value={verdict} onChange={(e) => setVerdict(e.target.value as typeof verdict)}>
            <option value="all">All verdicts</option>
            {VERDICTS.map((v) => <option key={v} value={v}>{VERDICT_LABEL[v]}</option>)}
            <option value="none">No finding</option>
          </select>
          <Popover label="Column visibility" trigger={(p) => <Button icon="columns" {...p}>Columns <Badge>{GRID_COLUMNS.length - hidden.size}</Badge></Button>}>
            <fieldset className="col-menu">
              <legend className="muted">Visible columns</legend>
              {GRID_COLUMNS.filter((c) => c.id !== 'id').map((c) => (
                <label key={c.id}>
                  <input type="checkbox" checked={!hidden.has(c.id)} onChange={(e) => setHidden((h) => { const n = new Set(h); if (e.target.checked) n.delete(c.id); else n.add(c.id); return n; })} />
                  {c.label}
                </label>
              ))}
            </fieldset>
          </Popover>
        </div>
      </div>
      <p className="muted hint">Arrow keys move, <kbd className="ui-kbd">Enter</kbd> edits verdict, reviewer or comment, <kbd className="ui-kbd">Esc</kbd> cancels, <kbd className="ui-kbd">Tab</kbd> commits.</p>
      <div className="page-fill">
        <RequirementsGrid rows={rows} rowHeight={ROW_HEIGHT[density]} hidden={hidden} onPatch={(clauseId, p) => patch.mutate({ clauseId, patch: p }, { onSuccess: () => toast(`Saved ${clauseId}`, 'ok'), onError: () => toast('Could not save', 'bad') })} />
      </div>
    </div>
  );
}
