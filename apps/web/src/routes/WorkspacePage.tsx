import { useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { EmptyState, SplitHandle, SplitPane, SplitPanel } from '@crs/ui';
import { api } from '../api';
import { ClauseList } from '../features/workspace/ClauseList';
import { FindingsPanel } from '../features/workspace/FindingsPanel';
import { PdfViewer } from '../features/workspace/PdfViewer';
import { useReview } from '../features/workspace/useReview';
import { useClauses, useFile } from '../queries';
import { useHotkeys } from '../state/hotkeys';
import { useUi, useWorkspace } from '../state/ui';

export function WorkspacePage() {
  const { id = '' } = useParams();
  const file = useFile(id);
  const clauses = useClauses(id);
  const { clauseId, tick, select, reset } = useWorkspace();
  const layout = useUi((s) => s.layouts.workspace);
  const setLayout = useUi((s) => s.setLayout);
  const review = useReview(id);
  const rows = clauses.data;
  const [sp, setSp] = useSearchParams();

  const withFinding = useMemo(() => rows?.filter((r) => r.finding) ?? [], [rows]);
  const markers = useMemo(() => new Set(withFinding.map((r) => r.finding!.current.evidence.page)), [withFinding]);
  const reviewed = withFinding.filter((r) => r.finding!.state !== 'pending').length;
  const clause = rows?.find((r) => r.id === clauseId);

  useEffect(() => reset, [id, reset]);
  // the selected clause lives in the URL (?clause=8.4.2): reload-safe and shareable
  useEffect(() => {
    if (clauseId || !rows) return;
    const wanted = rows.find((r) => r.id === sp.get('clause'))?.id ?? withFinding[0]?.id;
    if (wanted) select(wanted);
  }, [clauseId, rows, withFinding, select, sp]);
  useEffect(() => {
    if (clauseId && sp.get('clause') !== clauseId) setSp({ clause: clauseId }, { replace: true });
  }, [clauseId, sp, setSp]);

  const step = (d: number) => {
    if (!withFinding.length) return;
    const i = withFinding.findIndex((r) => r.id === clauseId);
    select(withFinding[Math.min(withFinding.length - 1, Math.max(0, i + d))]!.id);
  };
  useHotkeys({ j: () => step(1), k: () => step(-1), a: review.accept, r: review.reject, e: review.startEdit });

  if (file.data && !file.data.hasDocument) {
    return <EmptyState icon="file" title="No document uploaded">This file has no technical-file PDF yet. Open the Aquila IP-200 file from the queue to see the full workspace.</EmptyState>;
  }
  const ev = clause?.finding?.current.evidence;
  return (
    <>
  <h1 className="sr-only">Review workspace</h1>
    <SplitPane id="workspace" layout={layout} onLayoutChanged={(l) => setLayout('workspace', l)}>
      <SplitPanel id="clauses" label="Clause checklist" defaultSize="23%" minSize="15%">
        {rows ? <ClauseList rows={rows} selectedId={clauseId} onSelect={select} /> : <p className="muted pad">Loading clauses…</p>}
      </SplitPanel>
      <SplitHandle />
      <SplitPanel id="viewer" label="Document" defaultSize="45%" minSize="25%">
        <PdfViewer url={api.pdfUrl(id)} target={ev ? { page: ev.page, quote: ev.quote, tick } : null} markers={markers} />
      </SplitPanel>
      <SplitHandle />
      <SplitPanel id="findings" label="Findings" defaultSize="32%" minSize="20%">
        <FindingsPanel fileId={id} clause={clause} reviewed={reviewed} total={withFinding.length} />
      </SplitPanel>
    </SplitPane>
    </>
  );
}
