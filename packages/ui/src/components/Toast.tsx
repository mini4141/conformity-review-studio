import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface ToastItem {
  id: number;
  text: string;
  tone: 'ok' | 'bad' | 'neutral';
}
const Ctx = createContext<(text: string, tone?: ToastItem['tone']) => void>(() => {});
export const useToast = () => useContext(Ctx);

let seq = 0;

/** Root provider: toasts + Motion config that honours prefers-reduced-motion. */
export function UiProvider({ children, reducedMotion = 'user' }: { children: ReactNode; reducedMotion?: 'user' | 'always' | 'never' }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((text: string, tone: ToastItem['tone'] = 'neutral') => {
    const id = ++seq;
    setItems((l) => [...l, { id, text, tone }]);
    setTimeout(() => setItems((l) => l.filter((t) => t.id !== id)), 3500);
  }, []);
  const value = useMemo(() => push, [push]);
  return (
    <MotionConfig reducedMotion={reducedMotion}>
      <Ctx.Provider value={value}>
        {children}
        <div className="ui-toasts" role="status" aria-live="polite">
          <AnimatePresence>
            {items.map((t) => (
              <motion.div key={t.id} className="ui-toast" data-tone={t.tone} initial={{ y: 12 }} animate={{ y: 0 }} exit={{ x: 24, opacity: 0 }} transition={{ duration: 0.16 }}>
                {t.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </Ctx.Provider>
    </MotionConfig>
  );
}
