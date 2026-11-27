import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable, type ColumnDef, type Row, type SortingState, type VisibilityState } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { memo, useEffect, useRef, useState, type KeyboardEvent } from 'react';

export interface TableProps<T> {
  data: T[];
  columns: ColumnDef<T, any>[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  getRowId: (row: T) => string;
  /** Row height in px: pass the value matching the active density token. */
  rowHeight: number;
  ariaLabel: string;
  /** Keep the first column visible while scrolling horizontally. */
  pinFirst?: boolean;
  columnVisibility?: VisibilityState;
  activeIndex?: number;
  activeCol?: number;
  onRowClick?: (row: T, index: number) => void;
  onCellClick?: (rowIndex: number, colIndex: number) => void;
  onCellDoubleClick?: (rowIndex: number, colIndex: number) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLDivElement>) => void;
  /** Free-form state for cell renderers, readable as table.options.meta. */
  meta?: unknown;
  testId?: string;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
}


interface RowProps {
  row: Row<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  index: number;
  y: number;
  template: string;
  width: number;
  active: boolean;
  activeCol?: number;
  pinFirst?: boolean;
  /** changes when anything a cell reads from table meta changes */
  metaKey: unknown;
  onRowClick?: (row: any, index: number) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  onCellClick?: (rowIndex: number, colIndex: number) => void;
  onCellDoubleClick?: (rowIndex: number, colIndex: number) => void;
}

/** One virtual row. Memoised: scrolling only mounts new rows, it never re-renders the visible ones. */
const TableRow = memo(function TableRow({ row, index, y, template, width, active, activeCol, pinFirst, onRowClick, onCellClick, onCellDoubleClick }: RowProps) {
  return (
    <div role="row" aria-rowindex={index + 2} aria-selected={active} data-active={active ? '' : undefined} className="ui-trow" style={{ gridTemplateColumns: template, width, transform: `translateY(${y}px)` }} onClick={() => onRowClick?.(row.original, index)}>
      {row.getVisibleCells().map((cell, i) => {
        const value = cell.getValue();
        return (
          <div key={cell.id} role="gridcell" data-active-cell={active && activeCol === i ? '' : undefined} onClick={() => onCellClick?.(index, i)} onDoubleClick={() => onCellDoubleClick?.(index, i)} className={`ui-td ${pinFirst && i === 0 ? 'ui-pinned' : ''}`} title={typeof value === 'string' && value.length > 18 ? value : undefined}>
            <div className="ui-cell">{flexRender(cell.column.columnDef.cell, cell.getContext())}</div>
          </div>
        );
      })}
    </div>
  );
});

/** Virtualized, sticky-header grid built on TanStack Table + Virtual. Used by the queue and the matrix. */
export function Table<T>({ data, columns, getRowId, rowHeight, ariaLabel, pinFirst, columnVisibility, activeIndex, activeCol, onRowClick, onCellClick, onCellDoubleClick, onKeyDown, meta, testId, scrollRef }: TableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const own = useRef<HTMLDivElement>(null);
  const el = scrollRef ?? own;
  const table = useReactTable({
    data,
    columns,
    getRowId,
    state: { sorting, columnVisibility },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    meta: meta as never,
  });
  const rows = table.getRowModel().rows;
  const virt = useVirtualizer({ count: rows.length, getScrollElement: () => el.current, estimateSize: () => rowHeight, overscan: 2, initialRect: { width: 1200, height: 800 }, useFlushSync: false });
  useEffect(() => {
    virt.measure();
  }, [rowHeight]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (activeIndex !== undefined && activeIndex >= 0) virt.scrollToIndex(activeIndex, { align: 'auto' });
  }, [activeIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const cols = table.getVisibleLeafColumns();
  const template = cols.map((c) => `${c.getSize()}px`).join(' ');
  const width = cols.reduce((n, c) => n + c.getSize(), 0);

  return (
    <div ref={el} className="ui-table" role="grid" aria-label={ariaLabel} aria-rowcount={rows.length + 1} aria-colcount={cols.length} tabIndex={0} data-testid={testId} onKeyDown={onKeyDown}>
      <div className="ui-table-inner" style={{ width, height: virt.getTotalSize() + rowHeight }}>
        <div className="ui-thead" role="row" style={{ gridTemplateColumns: template, width }}>
          {table.getHeaderGroups()[0]!.headers.map((h, i) => {
            const sorted = h.column.getIsSorted();
            return (
              <div key={h.id} role="columnheader" aria-sort={sorted ? (sorted === 'asc' ? 'ascending' : 'descending') : 'none'} className={`ui-th ${pinFirst && i === 0 ? 'ui-pinned' : ''}`} onClick={h.column.getToggleSortingHandler()}>
                {flexRender(h.column.columnDef.header, h.getContext())}
                {sorted && <span aria-hidden="true">{sorted === 'asc' ? '▲' : '▼'}</span>}
              </div>
            );
          })}
        </div>
        {virt.getVirtualItems().map((v) => (
          <TableRow key={rows[v.index]!.id} row={rows[v.index]!} index={v.index} y={v.start + rowHeight} template={template} width={width} active={v.index === activeIndex} activeCol={v.index === activeIndex ? activeCol : undefined} pinFirst={pinFirst} metaKey={meta} onRowClick={onRowClick} onCellClick={onCellClick} onCellDoubleClick={onCellDoubleClick} />
        ))}
      </div>
    </div>
  );
}
