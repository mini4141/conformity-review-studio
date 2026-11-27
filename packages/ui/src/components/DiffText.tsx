type Op = { t: 'same' | 'del' | 'ins'; s: string };

/** Word-level diff via longest common subsequence. */
export function diffWords(before: string, after: string): Op[] {
  const a = before.split(/(\s+)/).filter(Boolean);
  const b = after.split(/(\s+)/).filter(Boolean);
  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) dp[i]![j] = a[i] === b[j] ? dp[i + 1]![j + 1]! + 1 : Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!);
  const out: Op[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      out.push({ t: 'same', s: a[i++]! });
      j++;
    } else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) out.push({ t: 'del', s: a[i++]! });
    else out.push({ t: 'ins', s: b[j++]! });
  }
  while (i < a.length) out.push({ t: 'del', s: a[i++]! });
  while (j < b.length) out.push({ t: 'ins', s: b[j++]! });
  return out;
}

export function DiffText({ before, after }: { before: string; after: string }) {
  return (
    <span className="ui-diff" aria-label={`Changed from "${before}" to "${after}"`}>
      {diffWords(before, after).map((o, k) => (o.t === 'del' ? <del key={k}>{o.s}</del> : o.t === 'ins' ? <ins key={k}>{o.s}</ins> : <span key={k}>{o.s}</span>))}
    </span>
  );
}
