const DAY = 864e5;
const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

export function daysUntil(iso: string, now = Date.now()): number {
  const today = new Date(now);
  const start = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((Date.parse(iso) - start) / DAY);
}

export const relDue = (iso: string) => rtf.format(daysUntil(iso), 'day');
export const absDue = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' });
export const shortTime = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
