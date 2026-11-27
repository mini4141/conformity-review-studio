import { Badge, type Tone } from '@crs/ui';
import { VERDICT_LABEL, type ReviewState, type Verdict } from '@crs/shared';

export const VERDICT_TONE: Record<Verdict, Tone> = { satisfied: 'ok', partial: 'warn', not_demonstrated: 'bad', needs_info: 'info' };
export const STATE_LABEL: Record<ReviewState, string> = { pending: 'Pending', accepted: 'Accepted', rejected: 'Rejected', corrected: 'Corrected' };

/** Colour is for meaning only: the verdict is always also spelled out. */
export function VerdictBadge({ verdict }: { verdict?: Verdict }) {
  if (!verdict) return <Badge>No finding</Badge>;
  return (
    <Badge tone={VERDICT_TONE[verdict]} dot>
      {VERDICT_LABEL[verdict]}
    </Badge>
  );
}
