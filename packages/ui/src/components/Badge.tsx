import type { ReactNode } from 'react';

export type Tone = 'neutral' | 'ok' | 'warn' | 'bad' | 'info' | 'accent';

export function Badge({ tone = 'neutral', dot, children }: { tone?: Tone; dot?: boolean; children: ReactNode }) {
  return (
    <span className="ui-badge" data-tone={tone}>
      {dot && <i aria-hidden="true" />}
      {children}
    </span>
  );
}

export function Tag({ children, onRemove }: { children: ReactNode; onRemove?: () => void }) {
  return (
    <span className="ui-tag">
      {children}
      {onRemove && (
        <button type="button" aria-label="Remove" onClick={onRemove}>
          ×
        </button>
      )}
    </span>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="ui-kbd">{children}</kbd>;
}

/** Five-step meter, coloured by level, with a tabular percentage. */
export function ConfidenceMeter({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const on = Math.max(1, Math.round(value * 5));
  const level = value >= 0.75 ? 'high' : value >= 0.5 ? 'mid' : 'low';
  return (
    <span className="ui-meter" data-level={level} role="meter" aria-label="Confidence" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-valuetext={`${pct}% confidence`}>
      <span className="ui-meter-bar" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} data-on={i < on ? '' : undefined} />
        ))}
      </span>
      <span className="tnum">{pct}%</span>
    </span>
  );
}
