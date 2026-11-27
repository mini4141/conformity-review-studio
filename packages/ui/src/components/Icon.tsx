const PATHS = {
  check: 'M3 8.5l3.2 3.2L13 4.8',
  x: 'M4 4l8 8M12 4l-8 8',
  pencil: 'M3 13l.6-3L10.5 3l2.5 2.5L6 12.4 3 13z',
  search: 'M7 12A5 5 0 107 2a5 5 0 000 10zM11 11l3 3',
  sun: 'M8 11a3 3 0 100-6 3 3 0 000 6zM8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.4 1.4M11.6 11.6L13 13M3 13l1.4-1.4M11.6 4.4L13 3',
  moon: 'M13 9.5A5.5 5.5 0 116.5 3a4.5 4.5 0 006.5 6.5z',
  density: 'M2 4h12M2 8h12M2 12h12',
  command: 'M5 2a2 2 0 100 4h6a2 2 0 100-4 2 2 0 00-2 2v8a2 2 0 102-2H5a2 2 0 102 2V4a2 2 0 00-2-2z',
  chevron: 'M5 6l3 3 3-3',
  file: 'M4 2h5l3 3v9H4V2zM9 2v3h3',
  keyboard: 'M2 4h12v8H2V4zM5 7h1M8 7h1M11 7h1M5 10h6',
  external: 'M9 3h4v4M13 3L7 9M6 4H3v9h9v-3',
  columns: 'M2 3h12v10H2V3zM6 3v10M10 3v10',
  minus: 'M3 8h10',
  plus: 'M8 3v10M3 8h10',
  alert: 'M8 2l6.5 11.5h-13L8 2zM8 6.5v3M8 11.5v.5',
  list: 'M5 4h9M5 8h9M5 12h9M2 4h.5M2 8h.5M2 12h.5',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 14 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={PATHS[name]} />
    </svg>
  );
}
