import { useEffect, useRef } from 'react';

export type HotkeyMap = Record<string, (e: KeyboardEvent) => void>;

const typing = (t: EventTarget | null) => {
  const el = t as HTMLElement | null;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
};

/**
 * Keyboard-first shortcuts. Keys: "j", "mod+k", "?", and two-key sequences like "g c".
 * Plain keys are ignored while typing; "mod+k" always fires.
 */
export function useHotkeys(map: HotkeyMap, enabled = true) {
  const ref = useRef(map);
  ref.current = map;
  useEffect(() => {
    if (!enabled) return;
    let prefix: string | null = null;
    let timer: ReturnType<typeof setTimeout>;
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'k') {
        const fn = ref.current['mod+k'];
        if (fn) {
          e.preventDefault();
          fn(e);
        }
        return;
      }
      if (mod || e.altKey || typing(e.target)) return;
      const key = e.key;
      if (prefix) {
        const fn = ref.current[`${prefix} ${key}`];
        prefix = null;
        clearTimeout(timer);
        if (fn) {
          e.preventDefault();
          fn(e);
          return;
        }
      }
      if (Object.keys(ref.current).some((k) => k.startsWith(`${key} `))) {
        prefix = key;
        timer = setTimeout(() => (prefix = null), 900);
        return;
      }
      const fn = ref.current[key];
      if (fn) {
        e.preventDefault();
        fn(e);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      clearTimeout(timer);
    };
  }, [enabled]);
}
