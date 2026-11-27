import * as pdfjs from 'pdfjs-dist';
import type { PDFDocumentProxy, PageViewport } from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';
import 'pdfjs-dist/web/pdf_viewer.css';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion } from 'motion/react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { EmptyState, Icon, IconButton } from '@crs/ui';

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href;

export interface PdfTarget {
  page: number;
  quote?: string;
  /** bumps on each jump so the highlight pulses again */
  tick: number;
}

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

const GAP = 14;
const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();

const textCache = new WeakMap<PDFDocumentProxy, Map<number, TextItem[]>>();
async function pageItems(doc: PDFDocumentProxy, n: number): Promise<TextItem[]> {
  const cache = textCache.get(doc) ?? new Map();
  textCache.set(doc, cache);
  if (!cache.has(n)) {
    const tc = await (await doc.getPage(n)).getTextContent();
    cache.set(n, tc.items.filter((i): i is TextItem => 'str' in i && i.str.trim() !== ''));
  }
  return cache.get(n)!;
}

function rectsFor(items: TextItem[], viewport: PageViewport, match: (s: string) => boolean): Rect[] {
  return items
    .filter((i) => match(norm(i.str)))
    .map((i) => {
      const t = pdfjs.Util.transform(viewport.transform, i.transform);
      const h = Math.hypot(t[2]!, t[3]!);
      return { left: t[4]! - 2, top: t[5]! - h * 0.95, width: i.width * viewport.scale + 4, height: h * 1.2 };
    });
}

interface PageProps {
  doc: PDFDocumentProxy;
  n: number;
  scale: number;
  quote?: string;
  pulse?: number;
  search: string;
  onEvidence?: (top: number) => void;
}

function PdfPage({ doc, n, scale, quote, pulse, search, onEvidence }: PageProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const text = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<TextItem[]>([]);
  const [viewport, setViewport] = useState<PageViewport | null>(null);

  useEffect(() => {
    let cancelled = false;
    let task: pdfjs.RenderTask | undefined;
    let layer: pdfjs.TextLayer | undefined;
    (async () => {
      const page = await doc.getPage(n);
      const vp = page.getViewport({ scale });
      const dpr = window.devicePixelRatio || 1;
      const c = canvas.current;
      if (!c || cancelled) return;
      c.width = Math.floor(vp.width * dpr);
      c.height = Math.floor(vp.height * dpr);
      task = page.render({ canvas: c, viewport: page.getViewport({ scale: scale * dpr }) });
      task.promise.catch(() => {}); // cancelled renders reject; the cleanup below owns that
      const tc = await page.getTextContent();
      if (cancelled) return;
      setViewport(vp);
      setItems(await pageItems(doc, n));
      if (text.current) {
        text.current.replaceChildren();
        layer = new pdfjs.TextLayer({ textContentSource: tc, container: text.current, viewport: vp });
        await layer.render();
      }
      await task.promise;
    })().catch(() => {
      /* render cancelled by scroll/zoom */
    });
    return () => {
      cancelled = true;
      task?.cancel();
      layer?.cancel();
    };
  }, [doc, n, scale]);

  const evidence = useMemo(() => {
    if (!quote || !viewport) return [];
    const q = norm(quote);
    return rectsFor(items, viewport, (s) => s.length > 8 && (q.includes(s) || s.includes(q)));
  }, [items, viewport, quote]);
  const hits = useMemo(() => {
    const q = norm(search);
    if (q.length < 2 || !viewport) return [];
    return rectsFor(items, viewport, (s) => s.includes(q));
  }, [items, viewport, search]);

  const evidenceTop = evidence[0]?.top;
  useEffect(() => {
    if (evidenceTop !== undefined) onEvidence?.(evidenceTop);
  }, [evidenceTop, pulse]); // eslint-disable-line react-hooks/exhaustive-deps

  const w = viewport?.width;
  const h = viewport?.height;
  return (
    <div className="pdf-page" data-page={n} style={{ width: w, height: h, ['--scale-factor' as string]: scale, ['--total-scale-factor' as string]: scale }}>
      <canvas ref={canvas} style={{ width: w, height: h }} aria-label={`Page ${n}`} role="img" />
      <div ref={text} className="textLayer" />
      {hits.map((r, i) => (
        <div key={`h${i}`} className="pdf-hit" style={r} />
      ))}
      {evidence.map((r, i) => (
        <motion.div key={`e${i}-${pulse}`} className="pdf-evidence" data-testid="evidence-highlight" style={r} initial={{ opacity: 0.2, scale: 1.06 }} animate={{ opacity: [0.2, 1, 0.55, 1], scale: [1.06, 1, 1.02, 1] }} transition={{ duration: 1.1, ease: 'easeOut' }} />
      ))}
    </div>
  );
}

function Thumb({ doc, n, active, marked, onClick }: { doc: PDFDocumentProxy; n: number; active: boolean; marked: boolean; onClick: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let task: pdfjs.RenderTask | undefined;
    let dead = false;
    void doc.getPage(n).then((p) => {
      if (dead || !ref.current) return;
      const vp = p.getViewport({ scale: 0.17 });
      ref.current.width = vp.width;
      ref.current.height = vp.height;
      task = p.render({ canvas: ref.current, viewport: vp });
      task.promise.catch(() => {});
    });
    return () => {
      dead = true;
      task?.cancel();
    };
  }, [doc, n]);
  return (
    <button type="button" className="thumb" aria-current={active} aria-label={`Go to page ${n}`} onClick={onClick}>
      <canvas ref={ref} />
      <span className="tnum">{n}</span>
      {marked && <i className="thumb-dot" aria-hidden="true" />}
    </button>
  );
}

export function PdfViewer({ url, target, markers }: { url: string; target: PdfTarget | null; markers: Set<number> }) {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState(false);
  const [size, setSize] = useState({ w: 595, h: 842 });
  const [zoom, setZoom] = useState(1);
  const [width, setWidth] = useState(0);
  const [thumbs, setThumbs] = useState(false);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [hitPages, setHitPages] = useState<number[]>([]);
  const [hitIdx, setHitIdx] = useState(0);
  const [searching, setSearching] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const thumbScroller = useRef<HTMLDivElement>(null);
  const focused = useRef(0);

  useEffect(() => {
    // own worker per load: StrictMode remounts must not race the shared worker's async teardown
    const worker = new pdfjs.PDFWorker();
    const task = pdfjs.getDocument({ url, worker });
    let cancelled = false;
    task.promise.then(async (d) => {
      const vp = (await d.getPage(1)).getViewport({ scale: 1 });
      if (cancelled) return;
      setSize({ w: vp.width, h: vp.height });
      setDoc(d);
    }, (e) => {
      if (cancelled) return;
      console.error('pdf load failed', e);
      setError(true);
    });
    return () => {
      cancelled = true;
      setDoc(null);
      void task.destroy().then(() => worker.destroy());
    };
  }, [url]);

  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, [doc]);

  const scale = Math.max(0.3, ((width || 600) - 32) / size.w) * zoom;
  const pageH = size.h * scale + GAP;
  const count = doc?.numPages ?? 0;
  const virt = useVirtualizer({ count, getScrollElement: () => scroller.current, estimateSize: () => pageH, overscan: 2 });
  const tvirt = useVirtualizer({ count, getScrollElement: () => thumbScroller.current, estimateSize: () => 156, overscan: 4 });
  useEffect(() => {
    virt.measure();
  }, [pageH]); // eslint-disable-line react-hooks/exhaustive-deps

  const jump = useCallback((page: number) => virt.scrollToIndex(Math.max(0, page - 1), { align: 'start' }), [virt]);
  useEffect(() => {
    if (doc && target) jump(target.page);
  }, [doc, target?.tick, target?.page]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Once the highlight is located, centre it in the upper third of the viewport. */
  const onEvidence = useCallback((page: number, top: number) => {
    const el = scroller.current;
    if (!el || !target || focused.current === target.tick) return;
    focused.current = target.tick;
    el.scrollTo({ top: (page - 1) * pageH + 8 + top - el.clientHeight / 3 });
  }, [pageH, target]);

  const runSearch = async (q: string) => {
    if (!doc || q.trim().length < 2) {
      setSearch('');
      setHitPages([]);
      return;
    }
    setSearching(true);
    setSearch(q);
    const found: number[] = [];
    for (let n = 1; n <= doc.numPages; n++) {
      if ((await pageItems(doc, n)).some((i) => norm(i.str).includes(norm(q)))) found.push(n);
    }
    setHitPages(found);
    setHitIdx(0);
    setSearching(false);
    if (found[0]) jump(found[0]);
  };
  const stepHit = (d: number) => {
    if (!hitPages.length) return;
    const i = (hitIdx + d + hitPages.length) % hitPages.length;
    setHitIdx(i);
    jump(hitPages[i]!);
  };

  if (error) return <EmptyState icon="file" title="Document unavailable">The PDF could not be loaded.</EmptyState>;
  const current = Math.min(count, Math.max(1, Math.floor(((virt.scrollOffset ?? 0) + (scroller.current?.clientHeight ?? 0) / 3) / pageH) + 1));

  return (
    <div className="pdf" aria-label="Document viewer">
      <div className="pdf-bar" role="toolbar" aria-label="Viewer controls">
        <IconButton icon="columns" label="Page thumbnails" pressed={thumbs} onClick={() => setThumbs((v) => !v)} />
        <span className="tnum pdf-page-ind" aria-live="polite">
          p. {current} / {count || '…'}
        </span>
        <IconButton icon="minus" label="Zoom out" onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.15).toFixed(2)))} />
        <span className="tnum muted">{Math.round(zoom * 100)}%</span>
        <IconButton icon="plus" label="Zoom in" onClick={() => setZoom((z) => Math.min(2.2, +(z + 0.15).toFixed(2)))} />
        <form className="pdf-search" role="search" onSubmit={(e) => { e.preventDefault(); if (query === search && hitPages.length) stepHit(1); else void runSearch(query); }}>
          <Icon name="search" />
          <input className="ui-input" type="search" aria-label="Search document" placeholder="Search document" value={query} onChange={(e) => setQuery(e.target.value)} />
          <span className="muted tnum pdf-hits" aria-live="polite">{searching ? 'Searching…' : search ? `${hitPages.length ? hitIdx + 1 : 0}/${hitPages.length}` : ''}</span>
        </form>
      </div>
      <div className="pdf-body">
        {thumbs && doc && (
          <div ref={thumbScroller} className="pdf-thumbs" aria-label="Page thumbnails">
            <div style={{ height: tvirt.getTotalSize(), position: 'relative' }}>
              {tvirt.getVirtualItems().map((v) => (
                <div key={v.key} style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${v.start}px)` }}>
                  <Thumb doc={doc} n={v.index + 1} active={v.index + 1 === current} marked={markers.has(v.index + 1)} onClick={() => jump(v.index + 1)} />
                </div>
              ))}
            </div>
          </div>
        )}
        <div ref={scroller} className="pdf-scroll" data-testid="pdf-scroll" tabIndex={0}>
          {!doc && <p className="muted pdf-loading">Loading document…</p>}
          {doc && (
            <div style={{ height: virt.getTotalSize(), position: 'relative' }}>
              {virt.getVirtualItems().map((v) => {
                const n = v.index + 1;
                const isTarget = target?.page === n;
                return (
                  <div key={v.key} className="pdf-slot" style={{ top: 0, height: pageH, transform: `translateY(${v.start}px)` }}>
                    <PdfPage doc={doc} n={n} scale={scale} quote={isTarget ? target.quote : undefined} pulse={isTarget ? target.tick : undefined} search={search} onEvidence={isTarget ? (t) => onEvidence(n, t) : undefined} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
