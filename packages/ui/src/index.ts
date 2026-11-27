import '@fontsource-variable/inter';
import './styles.css';

export { Button, IconButton, type ButtonProps, type IconButtonProps } from './components/Button';
export { Badge, Tag, Kbd, ConfidenceMeter, type Tone } from './components/Badge';
export { Tooltip, Popover } from './components/Overlay';
export { Table, type TableProps } from './components/Table';
export { SplitPane, SplitPanel, SplitHandle } from './components/SplitPane';
export { Tabs, type TabItem } from './components/Tabs';
export { UiProvider, useToast } from './components/Toast';
export { EmptyState } from './components/EmptyState';
export { DiffText, diffWords } from './components/DiffText';
export { Icon, type IconName } from './components/Icon';
export type { ColumnDef } from '@tanstack/react-table';
export const ROW_HEIGHT = { comfortable: 32, compact: 24 } as const;
