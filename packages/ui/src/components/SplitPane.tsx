import type { ReactNode } from 'react';
import { Group, Panel, Separator, type Layout } from 'react-resizable-panels';

export interface SplitPaneProps {
  id: string;
  orientation?: 'horizontal' | 'vertical';
  /** Persisted sizes (percent per panel id). */
  layout?: Layout;
  onLayoutChanged?: (layout: Layout) => void;
  children: ReactNode;
}

/** Resizable panes (react-resizable-panels) with keyboard-operable handles. */
export function SplitPane({ id, orientation = 'horizontal', layout, onLayoutChanged, children }: SplitPaneProps) {
  return (
    <Group id={id} orientation={orientation} className="ui-split" defaultLayout={layout} onLayoutChanged={onLayoutChanged}>
      {children}
    </Group>
  );
}

export function SplitPanel({ id, defaultSize, minSize, children, label }: { id: string; defaultSize: string; minSize: string; children: ReactNode; label: string }) {
  return (
    <Panel id={id} defaultSize={defaultSize} minSize={minSize} style={{ overflow: 'hidden' }}>
      <section aria-label={label} style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {children}
      </section>
    </Panel>
  );
}

export function SplitHandle() {
  return <Separator className="ui-handle" />;
}
