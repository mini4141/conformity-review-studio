import { cloneElement, useEffect, useId, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/** Tooltip portalled to <body> so table cells with overflow:hidden never clip it. */
export function Tooltip({ label, children }: { label: string; children: ReactElement<Record<string, unknown>> }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const id = useId();
  const show = (e: { currentTarget: Element }) => {
    const r = e.currentTarget.getBoundingClientRect();
    setPos({ x: r.left + r.width / 2, y: r.top - 6 });
  };
  const hide = () => setPos(null);
  const child = cloneElement(children, {
    onMouseEnter: show,
    onFocus: show,
    onMouseLeave: hide,
    onBlur: hide,
    'aria-describedby': pos ? id : undefined,
  });
  return (
    <>
      {child}
      {pos &&
        createPortal(
          <div role="tooltip" id={id} className="ui-tip" style={{ left: pos.x, top: pos.y }}>
            {label}
          </div>,
          document.body,
        )}
    </>
  );
}

/** Click-to-open popover: closes on Escape or outside click. */
export function Popover({ trigger, children, label }: { trigger: (p: { onClick: () => void; 'aria-expanded': boolean; 'aria-haspopup': 'dialog' }) => ReactNode; children: ReactNode; label: string }) {
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const wrap = useRef<HTMLSpanElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!anchor) return;
    const onDown = (e: MouseEvent) => {
      if (!panel.current?.contains(e.target as Node) && !wrap.current?.contains(e.target as Node)) setAnchor(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setAnchor(null);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [anchor]);
  return (
    <span ref={wrap}>
      {trigger({ onClick: () => setAnchor(anchor ? null : wrap.current!.getBoundingClientRect()), 'aria-expanded': !!anchor, 'aria-haspopup': 'dialog' })}
      {anchor &&
        createPortal(
          <div ref={panel} role="dialog" aria-label={label} className="ui-pop" style={{ top: anchor.bottom + 4, left: Math.max(8, Math.min(anchor.left, window.innerWidth - 230)) }}>
            {children}
          </div>,
          document.body,
        )}
    </span>
  );
}
