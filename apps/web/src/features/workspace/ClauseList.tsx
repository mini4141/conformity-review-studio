import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Icon, Tooltip } from '@crs/ui';
import { VERDICT_LABEL, effectiveVerdict, type ClauseRow } from '@crs/shared';
import { VERDICT_TONE } from './verdict';

type StatusFilter = 'all' | 'pending' | 'attention' | 'nofinding';
const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'To review' },
  { id: 'attention', label: 'Attention' },
  { id: 'nofinding', label: 'No finding' },
];

const matches = (r: ClauseRow, f: StatusFilter) => {
  if (f === 'pending') return r.finding?.state === 'pending';
  if (f === 'attention') return !!r.finding && effectiveVerdict(r) !== 'satisfied';
  if (f === 'nofinding') return !r.finding;
  return true;
};

export function ClauseList({ rows, selectedId, onSelect }: { rows: ClauseRow[]; selectedId: string | null; onSelect: (id: string) => void }) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [closed, setClosed] = useState<Set<string>>(new Set());
  const selRef = useRef<HTMLButtonElement>(null);
  const searching = q.trim() !== '' || filter !== 'all';

  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const out = new Map<string, { title: string; rows: ClauseRow[] }>();
    for (const r of rows) {
      if (!matches(r, filter)) continue;
      if (needle && !`${r.id} ${r.title} ${r.group}`.toLowerCase().includes(needle)) continue;
      const g = out.get(r.section) ?? { title: r.sectionTitle, rows: [] };
      g.rows.push(r);
      out.set(r.section, g);
    }
    return [...out];
  }, [rows, q, filter]);

  useEffect(() => {
    selRef.current?.scrollIntoView({ block: 'nearest' });
  }, [selectedId]);
  const total = groups.reduce((n, [, g]) => n + g.rows.length, 0);

  return (
    <div className="cl">
      <div className="cl-tools">
        <label className="cl-search">
          <Icon name="search" />
          <input type="search" className="ui-input" placeholder="Filter clauses" aria-label="Filter clauses" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <div className="cl-chips" role="group" aria-label="Status filter">
          {FILTERS.map((f) => (
            <button key={f.id} type="button" className="chip" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="muted cl-count tnum" aria-live="polite">
          {total} of {rows.length} clauses
        </div>
      </div>
      <nav className="cl-scroll" aria-label="Clause checklist">
        {groups.map(([section, g]) => {
          const open = searching || !closed.has(section);
          return (
            <section key={section}>
              <button
                type="button"
                className="cl-group"
                aria-expanded={open}
                onClick={() => setClosed((s) => {
                  const n = new Set(s);
                  if (n.has(section)) n.delete(section);
                  else n.add(section);
                  return n;
                })}
              >
                <span className="cl-chev" data-open={open}><Icon name="chevron" /></span>
                <span className="tnum">{section}</span> {g.title}
                <span className="muted tnum cl-n">{g.rows.length}</span>
              </button>
              {open &&
                g.rows.map((r) => {
                  const v = effectiveVerdict(r);
                  const sel = r.id === selectedId;
                  return (
                    <button key={r.id} ref={sel ? selRef : undefined} type="button" data-testid="clause-item" aria-current={sel ? 'true' : undefined} className="cl-item" onClick={() => onSelect(r.id)}>
                      <span className="tnum cl-id">{r.id}</span>
                      <span className="cl-title">{r.title}</span>
                      <span className="cl-status">
                        {r.finding && r.finding.state !== 'pending' && (
                          <Tooltip label={`Reviewer: ${r.finding.state}`}>
                            <span className="cl-done"><Icon name="check" size={12} /></span>
                          </Tooltip>
                        )}
                        {v ? <Badge tone={VERDICT_TONE[v]} dot>{VERDICT_LABEL[v]}</Badge> : <span className="muted cl-none">none</span>}
                      </span>
                    </button>
                  );
                })}
            </section>
          );
        })}
        {total === 0 && <p className="muted cl-empty">No clauses match.</p>}
      </nav>
    </div>
  );
}
