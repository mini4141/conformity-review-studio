import { useEffect } from 'react';
import { Link, Outlet, useLocation, useMatch, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Icon, IconButton, Kbd, Tabs } from '@crs/ui';
import { CommandPalette, SHORTCUTS } from '../features/palette/CommandPalette';
import { useFile } from '../queries';
import { useHotkeys } from '../state/hotkeys';
import { useUi } from '../state/ui';

function ShortcutSheet() {
  const { shortcutsOpen, setShortcuts } = useUi();
  useEffect(() => {
    if (!shortcutsOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setShortcuts(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [shortcutsOpen, setShortcuts]);
  if (!shortcutsOpen) return null;
  return (
    <div className="sheet-overlay" onClick={() => setShortcuts(false)}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts" onClick={(e) => e.stopPropagation()}>
        <h2>Keyboard shortcuts</h2>
        <dl>
          {SHORTCUTS.map((s) => (
            <div key={s.label}>
              <dt>{s.keys.map((k, i) => <span key={k}>{i > 0 && ' then '}<Kbd>{k}</Kbd></span>)}</dt>
              <dd>{s.label}</dd>
            </div>
          ))}
        </dl>
        <p className="muted">Press <Kbd>Esc</Kbd> to close.</p>
      </div>
    </div>
  );
}

export function Shell() {
  const { theme, density, toggleTheme, toggleDensity, openPalette, setShortcuts } = useUi();
  const match = useMatch('/files/:id/*');
  const fileId = match?.params.id;
  const file = useFile(fileId ?? '');
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.density = density;
  }, [theme, density]);

  useHotkeys({
    'mod+k': () => openPalette('all'),
    'g c': () => fileId && openPalette('clauses'),
    '?': () => setShortcuts(true),
  });

  const section = loc.pathname.endsWith('/matrix') ? 'matrix' : loc.pathname.endsWith('/decision') ? 'decision' : 'workspace';
  return (
    <div className="app">
      <a className="skip" href="#main">Skip to content</a>
      <header className="topbar">
        <Link to="/" className="brand" aria-label="Conformity Review Studio, review queue">
          <span className="brand-mark"><Icon name="check" size={13} /></span> Conformity Review Studio
        </Link>
        {fileId && (
          <>
            <span className="crumb muted" aria-hidden="true">/</span>
            <span className="crumb-file" title={file.data?.title}>{file.data?.title ?? fileId}</span>
            <Tabs
              label="File sections"
              value={section}
              onChange={(s) => nav(s === 'workspace' ? `/files/${fileId}` : `/files/${fileId}/${s}`)}
              items={[{ id: 'workspace', label: 'Workspace' }, { id: 'matrix', label: 'Matrix' }, { id: 'decision', label: 'Decision' }]}
            />
          </>
        )}
        <div className="topbar-right">
          <button type="button" className="ui-btn" data-variant="ghost" onClick={() => openPalette('all')}>
            <Icon name="search" /> Search or run <Kbd>⌘K</Kbd>
          </button>
          <IconButton icon="density" label={`Density: ${density}. Switch to ${density === 'compact' ? 'comfortable' : 'compact'}`} pressed={density === 'compact'} onClick={toggleDensity} />
          <IconButton icon={theme === 'light' ? 'moon' : 'sun'} label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`} onClick={toggleTheme} />
          <IconButton icon="keyboard" label="Keyboard shortcuts (?)" onClick={() => setShortcuts(true)} />
        </div>
      </header>
      <main id="main" className="main">
        <motion.div key={loc.pathname} className="route" initial={{ y: 6 }} animate={{ y: 0 }} transition={{ duration: 0.14 }}>
          <Outlet />
        </motion.div>
      </main>
      <CommandPalette fileId={fileId} />
      <ShortcutSheet />
    </div>
  );
}
