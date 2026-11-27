import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Table, type ColumnDef } from '@crs/ui';
import { VERDICTS, VERDICT_LABEL, effectiveVerdict, type ClauseRow, type ClauseStatus, type Verdict } from '@crs/shared';
import { ConfidenceMeter } from '@crs/ui';
import { shortTime } from '../../lib/format';
import { STATE_LABEL, VerdictBadge } from '../workspace/verdict';

export type EditableKey = 'verdict' | 'reviewer' | 'comment';
interface GridMeta {
  editing: { row: number; col: number } | null;
  commit: (row: number, key: EditableKey, value: string) => void;
  cancel: () => void;
}

const EDITABLE: Partial<Record<string, EditableKey>> = { verdict: 'verdict', reviewer: 'reviewer', comment: 'comment' };

function CellEditor({ kind, value, onCommit: commitOnce, onCancel }: { kind: EditableKey; value: string; onCommit: (v: string) => void; onCancel: () => void }) {
  const done = useRef(false);
  const onCommit = (v: string) => {
    if (done.current) return;
    done.current = true;
    commitOnce(v);
  };
  const stop = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onCancel();
    }
  };
  if (kind === 'verdict') {
    return (
      <select className="ui-input cell-edit" autoFocus aria-label="Verdict" defaultValue={value} onKeyDown={stop} onChange={(e) => onCommit(e.target.value)} onBlur={onCancel}>
        {VERDICTS.map((v) => (
          <option key={v} value={v}>
            {VERDICT_LABEL[v]}
          </option>
        ))}
      </select>
    );
  }
  return (
    <input
      className="ui-input cell-edit"
      autoFocus
      aria-label={kind}
      defaultValue={value}
      onKeyDown={(e) => {
        stop(e);
        if (e.key === 'Enter' || e.key === 'Tab') {
          e.stopPropagation();
          onCommit(e.currentTarget.value);
        }
      }}
      onBlur={(e) => onCommit(e.currentTarget.value)}
    />
  );
}

export type GridColumnId = 'id' | 'group' | 'title' | 'text' | 'page' | 'quote' | 'verdict' | 'confidence' | 'source' | 'state' | 'reviewer' | 'comment' | 'updated';
export const GRID_COLUMNS: { id: GridColumnId; label: string }[] = [
  { id: 'id', label: 'Clause' },
  { id: 'group', label: 'Group' },
  { id: 'title', label: 'Requirement' },
  { id: 'text', label: 'Requirement text' },
  { id: 'page', label: 'Evidence page' },
  { id: 'quote', label: 'Evidence quote' },
  { id: 'verdict', label: 'Verdict' },
  { id: 'confidence', label: 'Confidence' },
  { id: 'source', label: 'Source' },
  { id: 'state', label: 'Review state' },
  { id: 'reviewer', label: 'Reviewer' },
  { id: 'comment', label: 'Comment' },
  { id: 'updated', label: 'Last change' },
];

const text = (c: { getValue: () => unknown }) => <span>{String(c.getValue() ?? '')}</span>;

export function RequirementsGrid({ rows, rowHeight, hidden, onPatch, scrollRef }: { rows: ClauseRow[]; rowHeight: number; hidden: Set<string>; onPatch: (clauseId: string, patch: Partial<ClauseStatus>) => void; scrollRef?: React.RefObject<HTMLDivElement | null> }) {
  const [pos, setPos] = useState({ row: 0, col: 0 });
  const [editing, setEditing] = useState<{ row: number; col: number } | null>(null);
  const holder = useRef<HTMLDivElement>(null);

  const columns = useMemo<ColumnDef<ClauseRow>[]>(() => {
    const meta = (ctx: { table: { options: { meta?: unknown } } }) => ctx.table.options.meta as GridMeta;
    const editable = (key: EditableKey, view: (r: ClauseRow) => React.ReactNode, read: (r: ClauseRow) => string): ColumnDef<ClauseRow> => ({
      id: key,
      header: GRID_COLUMNS.find((c) => c.id === key)!.label,
      size: key === 'comment' ? 240 : key === 'verdict' ? 150 : 130,
      accessorFn: read,
      cell: (c) => {
        const m = meta(c);
        const colIndex = c.table.getVisibleLeafColumns().findIndex((x) => x.id === key);
        if (m.editing?.row === c.row.index && m.editing.col === colIndex) return <CellEditor kind={key} value={read(c.row.original)} onCommit={(v) => m.commit(c.row.index, key, v)} onCancel={m.cancel} />;
        return view(c.row.original);
      },
    });
    return [
      { id: 'id', accessorFn: (r) => r.id, header: 'Clause', size: 84, cell: (c) => <b className="tnum">{c.getValue<string>()}</b> },
      { id: 'group', accessorFn: (r) => `${r.sectionTitle} / ${r.group}`, header: 'Group', size: 220, cell: text },
      { id: 'title', accessorFn: (r) => r.title, header: 'Requirement', size: 220, cell: text },
      { id: 'text', accessorFn: (r) => r.text, header: 'Requirement text', size: 340, cell: text },
      { id: 'page', accessorFn: (r) => r.finding?.current.evidence.page ?? 0, header: 'Evidence page', size: 100, cell: (c) => <span className="tnum">{c.getValue<number>() || '–'}</span> },
      { id: 'quote', accessorFn: (r) => r.finding?.current.evidence.quote ?? '', header: 'Evidence quote', size: 320, cell: text },
      editable('verdict', (r) => <VerdictBadge verdict={effectiveVerdict(r)} />, (r) => effectiveVerdict(r) ?? 'needs_info'),
      { id: 'confidence', accessorFn: (r) => r.finding?.confidence ?? 0, header: 'Confidence', size: 120, cell: (c) => (c.getValue<number>() ? <ConfidenceMeter value={c.getValue<number>()} /> : <span className="muted">–</span>) },
      { id: 'source', accessorFn: (r) => r.finding?.source.name ?? '', header: 'Source', size: 160, cell: text },
      { id: 'state', accessorFn: (r) => (r.finding ? STATE_LABEL[r.finding.state] : ''), header: 'Review state', size: 110, cell: text },
      editable('reviewer', (r) => <span>{r.status.reviewer ?? ''}</span>, (r) => r.status.reviewer ?? ''),
      editable('comment', (r) => <span>{r.status.comment ?? ''}</span>, (r) => r.status.comment ?? ''),
      { id: 'updated', accessorFn: (r) => r.status.updatedAt ?? r.finding?.updatedAt ?? '', header: 'Last change', size: 130, cell: (c) => <span className="tnum">{c.getValue<string>() ? shortTime(c.getValue<string>()) : ''}</span> },
    ];
  }, []);

  const visibleIds = columns.map((c) => c.id!).filter((id) => !hidden.has(id));
  const visibility = Object.fromEntries(columns.map((c) => [c.id!, !hidden.has(c.id!)]));

  const commit = (row: number, key: EditableKey, value: string) => {
    setEditing(null);
    holder.current?.focus();
    const r = rows[row];
    if (!r) return;
    const prev = key === 'verdict' ? effectiveVerdict(r) : (r.status[key] ?? '');
    if (value !== prev) onPatch(r.id, { [key]: value } as Partial<ClauseStatus>);
  };
  const meta: GridMeta = { editing, commit, cancel: () => { setEditing(null); holder.current?.focus(); } };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (editing) return;
    const last = visibleIds.length - 1;
    const move = (dr: number, dc: number) => {
      e.preventDefault();
      setPos((p) => ({ row: Math.min(rows.length - 1, Math.max(0, p.row + dr)), col: Math.min(last, Math.max(0, p.col + dc)) }));
    };
    if (e.key === 'ArrowDown') move(1, 0);
    else if (e.key === 'ArrowUp') move(-1, 0);
    else if (e.key === 'ArrowRight') move(0, 1);
    else if (e.key === 'ArrowLeft') move(0, -1);
    else if (e.key === 'Enter' && EDITABLE[visibleIds[pos.col]!]) {
      e.preventDefault();
      setEditing({ ...pos });
    }
  };

  return (
    <div ref={holder} className="grid-holder" tabIndex={-1}>
      <Table
        data={rows}
        columns={columns}
        getRowId={(r) => r.id}
        rowHeight={rowHeight}
        ariaLabel="Requirements matrix"
        pinFirst
        columnVisibility={visibility}
        activeIndex={pos.row}
        activeCol={pos.col}
        meta={meta}
        onKeyDown={onKeyDown}
        onCellClick={(row, col) => setPos({ row, col })}
        onCellDoubleClick={(row, col) => EDITABLE[visibleIds[col]!] && setEditing({ row, col })}
        testId="matrix-scroll"
        scrollRef={scrollRef}
      />
    </div>
  );
}

export type { Verdict };
