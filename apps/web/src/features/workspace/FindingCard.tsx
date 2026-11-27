import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Badge, Button, ConfidenceMeter, DiffText, Kbd } from '@crs/ui';
import { VERDICTS, VERDICT_LABEL, type Clause, type Finding, type Verdict } from '@crs/shared';
import { shortTime } from '../../lib/format';
import { STATE_LABEL, VerdictBadge } from './verdict';

export interface EditPayload {
  verdict: Verdict;
  reason: string;
  evidence: { page: number; quote: string };
}

export interface FindingCardProps {
  finding: Finding;
  clause: Pick<Clause, 'id' | 'title' | 'text'>;
  editing: boolean;
  onAccept: () => void;
  onReject: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (p: EditPayload) => void;
  onJump: (page: number) => void;
}

const STATE_TONE = { pending: 'neutral', accepted: 'ok', rejected: 'bad', corrected: 'accent' } as const;

export function FindingCard({ finding, clause, editing, onAccept, onReject, onStartEdit, onCancelEdit, onSaveEdit, onJump }: FindingCardProps) {
  const { original, current } = finding;
  const changed = finding.state === 'corrected';
  return (
    <motion.article layout className="fc" data-state={finding.state} aria-label={`Finding for clause ${clause.id}`} initial={false} animate={{ borderColor: finding.state === 'accepted' ? 'var(--ok)' : finding.state === 'rejected' ? 'var(--bad)' : finding.state === 'corrected' ? 'var(--accent)' : 'var(--border)' }} transition={{ duration: 0.2 }}>
      <header className="fc-head">
        <div className="fc-title">
          <span className="tnum fc-id">{clause.id}</span>
          <span>{clause.title}</span>
        </div>
        <motion.span key={finding.state} initial={{ scale: 0.7 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 26 }}>
          <Badge tone={STATE_TONE[finding.state]}>{STATE_LABEL[finding.state]}</Badge>
        </motion.span>
      </header>
      <div className="fc-row">
        <VerdictBadge verdict={current.verdict} />
        <ConfidenceMeter value={finding.confidence} />
      </div>
      <blockquote className="fc-quote">
        <p>{current.evidence.quote}</p>
        <button type="button" className="link" onClick={() => onJump(current.evidence.page)}>
          Jump to evidence, p. <span className="tnum">{current.evidence.page}</span>
        </button>
      </blockquote>
      <p className="fc-meta">
        <span title="Rule or model that produced this finding">Source: {finding.source.kind === 'rules' ? 'Rule' : 'Model'} · {finding.source.name}</span>
      </p>
      <p className="fc-why">{finding.rationale}</p>

      {changed && (
        <section className="fc-diff" aria-label="Correction diff">
          <h4>AI proposed → reviewer corrected</h4>
          <p>
            <DiffText before={VERDICT_LABEL[original.verdict]} after={VERDICT_LABEL[current.verdict]} />
          </p>
          {original.evidence.quote !== current.evidence.quote && (
            <p>
              <DiffText before={original.evidence.quote} after={current.evidence.quote} />
            </p>
          )}
          <p className="muted">Reason: {current.reason}</p>
        </section>
      )}

      {editing ? (
        <Editor finding={finding} onCancel={onCancelEdit} onSave={onSaveEdit} />
      ) : (
        <div className="fc-actions">
          <Button variant="primary" kbd="a" onClick={onAccept} icon="check">
            Accept
          </Button>
          <Button kbd="r" onClick={onReject} icon="x">
            Reject
          </Button>
          <Button kbd="e" onClick={onStartEdit} icon="pencil">
            Edit
          </Button>
        </div>
      )}

      {!!finding.history?.length && (
        <section aria-label="Override history" className="fc-history">
          <h4>Override history</h4>
          <ol>
            {finding.history.map((h) => (
              <li key={h.ts}>
                <span className="tnum muted">{shortTime(h.ts)}</span> {h.by} · <b>{h.action === 'edit' ? 'corrected' : `${h.action}ed`}</b> → {VERDICT_LABEL[h.verdict]}
                {h.reason && <span className="muted"> · “{h.reason}”</span>}
              </li>
            ))}
          </ol>
        </section>
      )}
    </motion.article>
  );
}

function Editor({ finding, onCancel, onSave }: { finding: Finding; onCancel: () => void; onSave: (p: EditPayload) => void }) {
  const [verdict, setVerdict] = useState<Verdict>(finding.current.verdict);
  const [reason, setReason] = useState('');
  const [page, setPage] = useState(String(finding.current.evidence.page));
  const [quote, setQuote] = useState(finding.current.evidence.quote);
  const first = useRef<HTMLSelectElement>(null);
  useEffect(() => {
    first.current?.focus();
  }, []);
  const valid = reason.trim().length > 0;
  const save = () => valid && onSave({ verdict, reason: reason.trim(), evidence: { page: Number(page) || finding.current.evidence.page, quote } });
  return (
    <form
      className="fc-edit"
      aria-label="Correct finding"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onCancel();
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save();
      }}
    >
      <label>
        Corrected verdict
        <select ref={first} className="ui-input" value={verdict} onChange={(e) => setVerdict(e.target.value as Verdict)}>
          {VERDICTS.map((v) => (
            <option key={v} value={v}>
              {VERDICT_LABEL[v]}
            </option>
          ))}
        </select>
      </label>
      <label>
        Reason (required)
        <textarea className="ui-input" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is the AI verdict wrong?" />
      </label>
      <div className="fc-edit-ev">
        <label>
          Evidence page
          <input className="ui-input tnum" inputMode="numeric" value={page} onChange={(e) => setPage(e.target.value)} />
        </label>
        <label>
          Evidence quote
          <input className="ui-input" value={quote} onChange={(e) => setQuote(e.target.value)} />
        </label>
      </div>
      <div className="fc-actions">
        <Button variant="primary" type="submit" disabled={!valid}>
          Save correction <Kbd>⌘↵</Kbd>
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel <Kbd>Esc</Kbd>
        </Button>
      </div>
    </form>
  );
}
