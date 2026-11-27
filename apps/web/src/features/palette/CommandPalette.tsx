import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { Kbd } from '@crs/ui';
import { VERDICT_LABEL, effectiveVerdict } from '@crs/shared';
import { useClauses } from '../../queries';
import { useReview } from '../workspace/useReview';
import { useUi, useWorkspace } from '../../state/ui';

export const SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: ['j'], label: 'Next finding' },
  { keys: ['k'], label: 'Previous finding' },
  { keys: ['a'], label: 'Accept finding' },
  { keys: ['r'], label: 'Reject finding' },
  { keys: ['e'], label: 'Edit (correct) finding' },
  { keys: ['g', 'c'], label: 'Go to clause' },
  { keys: ['⌘/Ctrl', 'K'], label: 'Command palette' },
  { keys: ['/'], label: 'Focus filter (queue)' },
  { keys: ['Enter'], label: 'Open file (queue) · edit cell (matrix)' },
  { keys: ['?'], label: 'Shortcut sheet' },
];

export function CommandPalette({ fileId }: { fileId?: string }) {
  const { paletteOpen, paletteMode, closePalette, toggleTheme, toggleDensity, theme, density } = useUi();
  const nav = useNavigate();
  const clauses = useClauses(fileId ?? '');
  const select = useWorkspace((s) => s.select);
  const review = useReview(fileId ?? '');
  const go = (fn: () => void) => () => {
    closePalette();
    fn();
  };
  const all = paletteMode === 'all';
  return (
    <Command.Dialog open={paletteOpen} onOpenChange={(o) => !o && closePalette()} label={all ? 'Command palette' : 'Go to clause'} className="cmdk" overlayClassName="cmdk-overlay" contentClassName="cmdk-content">
      <Command.Input placeholder={all ? 'Type a command or search clauses…' : 'Go to clause: type a number or title…'} />
      <Command.List>
        <Command.Empty>No results.</Command.Empty>
        {all && (
          <>
            <Command.Group heading="Navigate">
              <Command.Item onSelect={go(() => nav('/'))}>Review queue</Command.Item>
              {fileId && <Command.Item onSelect={go(() => nav(`/files/${fileId}`))}>Review workspace</Command.Item>}
              {fileId && <Command.Item onSelect={go(() => nav(`/files/${fileId}/matrix`))}>Requirements matrix</Command.Item>}
              {fileId && <Command.Item onSelect={go(() => nav(`/files/${fileId}/decision`))}>Conformity decision</Command.Item>}
            </Command.Group>
            <Command.Group heading="Preferences">
              <Command.Item onSelect={go(toggleTheme)}>Switch to {theme === 'light' ? 'dark' : 'light'} theme</Command.Item>
              <Command.Item onSelect={go(toggleDensity)}>Switch to {density === 'comfortable' ? 'compact' : 'comfortable'} density</Command.Item>
              <Command.Item onSelect={go(() => useUi.getState().setShortcuts(true))}>Show keyboard shortcuts <Kbd>?</Kbd></Command.Item>
            </Command.Group>
            {review.finding && (
              <Command.Group heading={`Finding ${review.finding.clauseId}`}>
                <Command.Item onSelect={go(review.accept)}>Accept finding <Kbd>a</Kbd></Command.Item>
                <Command.Item onSelect={go(review.reject)}>Reject finding <Kbd>r</Kbd></Command.Item>
                <Command.Item onSelect={go(review.startEdit)}>Edit finding <Kbd>e</Kbd></Command.Item>
              </Command.Group>
            )}
          </>
        )}
        {fileId && (
          <Command.Group heading="Clauses">
            {clauses.data?.map((r) => {
              const v = effectiveVerdict(r);
              return (
                <Command.Item
                  key={r.id}
                  value={`${r.id} ${r.title} ${r.group}`}
                  onSelect={go(() => {
                    nav(`/files/${fileId}`);
                    select(r.id);
                  })}
                >
                  <span className="tnum cmdk-id">{r.id}</span> {r.title}
                  <span className="muted cmdk-right">{v ? VERDICT_LABEL[v] : 'No finding'}</span>
                </Command.Item>
              );
            })}
          </Command.Group>
        )}
      </Command.List>
    </Command.Dialog>
  );
}
