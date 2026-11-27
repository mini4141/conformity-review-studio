import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, Icon, useToast } from '@crs/ui';
import { DECISION_LABEL, VERDICTS, VERDICT_LABEL, effectiveVerdict, type ClauseRow, type Decision, type DecisionValue } from '@crs/shared';
import { api } from '../../api';
import { shortTime } from '../../lib/format';
import { VERDICT_TONE } from '../workspace/verdict';

export function DecisionPanel({ fileId, rows, decision, onSave, saving }: { fileId: string; rows: ClauseRow[]; decision: Decision | null | undefined; onSave: (d: { decision: DecisionValue; rationale: string }) => void; saving: boolean }) {
  const toast = useToast();
  const [value, setValue] = useState<DecisionValue | ''>(decision?.decision ?? '');
  const [rationale, setRationale] = useState(decision?.rationale ?? '');
  const counts = Object.fromEntries(VERDICTS.map((v) => [v, rows.filter((r) => effectiveVerdict(r) === v).length]));
  const none = rows.filter((r) => !effectiveVerdict(r)).length;
  const unresolved = rows.filter((r) => r.finding?.state === 'pending' && effectiveVerdict(r) !== 'satisfied');
  const ready = value !== '' && rationale.trim().length > 0;

  return (
    <div className="decision">
      <section aria-label="Summary by verdict" className="card">
        <h2>Summary</h2>
        <dl className="sum">
          {VERDICTS.map((v) => (
            <div key={v}>
              <dt><Badge tone={VERDICT_TONE[v]} dot>{VERDICT_LABEL[v]}</Badge></dt>
              <dd className="tnum">{counts[v]}</dd>
            </div>
          ))}
          <div><dt><Badge>No finding</Badge></dt><dd className="tnum">{none}</dd></div>
        </dl>
        <p className="muted tnum">{rows.length} clauses in {rows[0] ? 'TS-60601-SIM' : 'the standard'}.</p>
      </section>

      <section aria-label="Unresolved items" className="card">
        <h2>Unresolved <span className="muted tnum">({unresolved.length})</span></h2>
        <p className="muted">Findings that need attention and have not been reviewed yet.</p>
        <ul className="unres">
          {unresolved.slice(0, 8).map((r) => (
            <li key={r.id}>
              <span className="tnum"><b>{r.id}</b></span> {r.title} <Badge tone={VERDICT_TONE[effectiveVerdict(r)!]}>{VERDICT_LABEL[effectiveVerdict(r)!]}</Badge>
            </li>
          ))}
          {unresolved.length === 0 && <li className="muted">Nothing unresolved.</li>}
        </ul>
        {unresolved.length > 8 && <p className="muted tnum">and {unresolved.length - 8} more. <Link to={`/files/${fileId}/matrix`}>Open the matrix</Link></p>}
      </section>

      <section aria-label="Conformity decision" className="card decision-form">
        <h2>Decision</h2>
        <fieldset>
          <legend className="muted">Outcome</legend>
          {(Object.keys(DECISION_LABEL) as DecisionValue[]).map((d) => (
            <label key={d} className="radio">
              <input type="radio" name="decision" value={d} checked={value === d} onChange={() => setValue(d)} />
              {DECISION_LABEL[d]}
            </label>
          ))}
        </fieldset>
        <label className="stack">
          Rationale
          <textarea className="ui-input" rows={4} value={rationale} onChange={(e) => setRationale(e.target.value)} placeholder="Summarise why this outcome follows from the evidence." />
        </label>
        <div className="row">
          <Button variant="primary" disabled={!ready || saving} onClick={() => value && onSave({ decision: value, rationale: rationale.trim() })}>
            Record decision and sign off
          </Button>
          {decision && <span className="muted tnum" role="status">Signed by {decision.signedBy} · {shortTime(decision.signedAt)}</span>}
        </div>
      </section>

      <section aria-label="Export" className="card">
        <h2>Export</h2>
        <div className="row">
          <a className="ui-btn" href={api.exportUrl(fileId, 'json')} download={`${fileId}-report.json`}><Icon name="file" /> JSON</a>
          <a className="ui-btn" href={api.exportUrl(fileId, 'html')} target="_blank" rel="noreferrer"><Icon name="external" /> Printable report</a>
          <Button variant="ghost" onClick={() => { window.print(); toast('Print dialog opened'); }}>Print this page</Button>
        </div>
        <p className="muted">The report lists corrected findings with the AI&apos;s original verdict, the reviewer&apos;s correction and the reason.</p>
      </section>
    </div>
  );
}
