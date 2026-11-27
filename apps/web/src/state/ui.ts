import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

type Layout = Record<string, number>;

// localStorage can throw (private mode, quota); fall back to a no-op.
const safeStorage: StateStorage = {
  getItem: (k) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  setItem: (k, v) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* ignore */
    }
  },
  removeItem: (k) => {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  },
};

interface UiState {
  theme: 'light' | 'dark';
  density: 'comfortable' | 'compact';
  layouts: Record<string, Layout>;
  paletteOpen: boolean;
  paletteMode: 'all' | 'clauses';
  shortcutsOpen: boolean;
  toggleTheme: () => void;
  toggleDensity: () => void;
  setLayout: (id: string, l: Layout) => void;
  openPalette: (mode?: 'all' | 'clauses') => void;
  closePalette: () => void;
  setShortcuts: (open: boolean) => void;
}

export const useUi = create<UiState>()(
  persist(
    (set) => ({
      theme: 'light',
      density: 'comfortable',
      layouts: {},
      paletteOpen: false,
      paletteMode: 'all',
      shortcutsOpen: false,
      toggleTheme: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
      toggleDensity: () => set((s) => ({ density: s.density === 'comfortable' ? 'compact' : 'comfortable' })),
      setLayout: (id, l) => set((s) => ({ layouts: { ...s.layouts, [id]: l } })),
      openPalette: (mode = 'all') => set({ paletteOpen: true, paletteMode: mode }),
      closePalette: () => set({ paletteOpen: false }),
      setShortcuts: (open) => set({ shortcutsOpen: open }),
    }),
    { name: 'crs-ui', storage: createJSONStorage(() => safeStorage), partialize: (s) => ({ theme: s.theme, density: s.density, layouts: s.layouts }) },
  ),
);

/** Transient workspace selection, shared by the clause list, viewer, findings and the command palette. */
interface WorkspaceState {
  clauseId: string | null;
  editing: boolean;
  /** bumps on every selection so the viewer re-jumps and re-pulses even for the same clause */
  tick: number;
  select: (clauseId: string) => void;
  setEditing: (v: boolean) => void;
  reset: () => void;
}

export const useWorkspace = create<WorkspaceState>((set) => ({
  clauseId: null,
  editing: false,
  tick: 0,
  select: (clauseId) => set((s) => ({ clauseId, editing: false, tick: s.tick + 1 })),
  setEditing: (editing) => set({ editing }),
  reset: () => set({ clauseId: null, editing: false }),
}));
