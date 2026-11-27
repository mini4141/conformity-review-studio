import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, EmptyState, ROW_HEIGHT, Table, Tabs, type ColumnDef, type Tone } from '@crs/ui';
import { REVIEWER, type FileMeta, type Risk } from '@crs/shared';
import { absDue, daysUntil, relDue } from '../lib/format';
import { useFiles } from '../queries';
import { useHotkeys } from '../state/hotkeys';
import { useUi } from '../state/ui';

const RISK_TONE: Record<Risk, Tone> = { low: 'neutral', medium: 'warn', high: 'bad' };
const VIEWS = [
  { id: 'all', label: 'All files', test: () => true },
  { id: 'mine', label: 'My files', test: (f: FileMeta) => f.assignee === REVIEWER },
  { id: 'week', label: 'Due this week', test: (f: FileMeta) => daysUntil(f.due) <= 7 && f.status !== 'Closed' },
  { id: 'high', label: 'High risk', test: (f: FileMeta) => f.risk === 'high' },
];

const columns: ColumnDef<FileMeta>[] = [
  { accessorKey: 'title', header: 'File', size: 420 },
  { accessorKey: 'deviceClass', header: 'Class', size: 64 },
  { accessorKey: 'manufacturer', header: 'Manufacturer', size: 190 },
  { accessorKey: 'pages', header: 'Pages', size: 72, cell: (c) => <span className="tnum">{c.getValue<number>()}</span> },
  {
    accessorKey: 'due',
    header: 'Due',
    size: 150,
    cell: (c) => (
      <span className="tnum" title={c.getValue<string>()}>
        {relDue(c.getValue<string>())} <span className="muted">· {absDue(c.getValue<string>())}</span>
      </span>
    ),
  },
  { accessorKey: 'status', header: 'Status', size: 140, cell: (c) => <Badge tone={c.getValue() === 'Closed' ? 'ok' : c.getValue() === 'Awaiting info' ? 'warn' : 'accent'}>{c.getValue<string>()}</Badge> },
  { accessorKey: 'risk', header: 'Risk', size: 90, cell: (c) => <Badge tone={RISK_TONE[c.getValue<Risk>()]} dot>{c.getValue<string>()}</Badge> },
  { accessorKey: 'assignee', header: 'Assignee', size: 140 },
  { accessorKey: 'aiCoverage', header: 'AI coverage', size: 110, cell: (c) => <span className="tnum">{c.getValue<number>() ? `${c.getValue<number>()}%` : '–'}</span> },
];

export function QueuePage() {
  const { data, isLoading, isError } = useFiles();
  const nav = useNavigate();
  const density = useUi((s) => s.density);
  const [view, setView] = useState('all');
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const search = useRef<HTMLInputElement>(null);

  const counts = useMemo(() => Object.fromEntries(VIEWS.map((v) => [v.id, data?.filter(v.test).length ?? 0])), [data]);
  const rows = useMemo(() => {
    const test = VIEWS.find((v) => v.id === view)!.test;
    const needle = q.trim().toLowerCase();
    return (data ?? []).filter((f) => test(f) && (!needle || `${f.title} ${f.manufacturer} ${f.assignee}`.toLowerCase().includes(needle)));
  }, [data, view, q]);

  useEffect(() => {
    setActive(0);
  }, [view, q]);
  const open = (f?: FileMeta) => f && nav(`/files/${f.id}`);
  useHotkeys({
    j: () => setActive((i) => Math.min(rows.length - 1, i + 1)),
    k: () => setActive((i) => Math.max(0, i - 1)),
    Enter: () => open(rows[active]),
    '/': () => search.current?.focus(),
  });

  if (isError) return <EmptyState icon="alert" title="Could not load the queue">Check that the API is running.</EmptyState>;
  return (
    <div className="page">
      <div className="page-head">
        <h1>Review queue</h1>
        <span className="muted tnum">{rows.length} of {data?.length ?? 0} files</span>
        <label className="page-filter">
          <input ref={search} className="ui-input" type="search" aria-label="Filter files" placeholder="Filter files   /" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </div>
      <Tabs label="Saved views" value={view} onChange={setView} items={VIEWS.map((v) => ({ id: v.id, label: <>{v.label} <span className="muted tnum">{counts[v.id]}</span></> }))} />
      <div className="page-fill">
        {isLoading ? <p className="muted pad">Loading files…</p> : <Table data={rows} columns={columns} getRowId={(f) => f.id} rowHeight={ROW_HEIGHT[density]} ariaLabel="Files to review" pinFirst activeIndex={active} onRowClick={(f, i) => { setActive(i); open(f); }} testId="queue-table" />}
      </div>
    </div>
  );
}
