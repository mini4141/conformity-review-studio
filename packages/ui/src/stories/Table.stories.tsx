import type { Meta, StoryObj } from '@storybook/react-vite';
import { Table, type TableProps } from '../components/Table';

interface Row {
  id: string;
  clause: string;
  title: string;
  page: number;
  verdict: string;
}
const data: Row[] = Array.from({ length: 2000 }, (_, i) => ({
  id: String(i),
  clause: `${4 + (i % 12)}.${1 + (i % 5)}.${1 + (i % 3)}`,
  title: `Requirement number ${i + 1} with a deliberately long title that must truncate`,
  page: 12 + i,
  verdict: ['Satisfied', 'Partially', 'Not demonstrated', 'Needs info'][i % 4]!,
}));

function RowTable(props: TableProps<Row>) {
  return (
    <div style={{ height: 360, border: '1px solid var(--border)' }}>
      <Table {...props} />
    </div>
  );
}

const meta = {
  title: 'Components/Table',
  component: RowTable,
  parameters: { docs: { description: { component: 'Virtualized (TanStack Virtual), sticky header, pinned first column, density-aware row height, truncation with native tooltips, sortable headers.' } } },
  args: {
    data,
    getRowId: (r: Row) => r.id,
    rowHeight: 32,
    ariaLabel: 'Demo table',
    pinFirst: true,
    columns: [
      { accessorKey: 'clause', header: 'Clause', size: 90 },
      { accessorKey: 'title', header: 'Requirement', size: 280 },
      { accessorKey: 'page', header: 'Page', size: 80 },
      { accessorKey: 'verdict', header: 'Verdict', size: 160 },
      { accessorFn: (r: Row) => r.title, id: 'long', header: 'Requirement (long)', size: 700 },
    ],
  },
} satisfies Meta<typeof RowTable>;
export default meta;
export const TwoThousandRows: StoryObj<typeof meta> = {};
export const Compact: StoryObj<typeof meta> = { args: { rowHeight: 24 } };
