import React from 'react';
import { DataTableCell } from '../../atoms/DataTableCell';
import { Checkbox } from '../../atoms/Checkbox';
import {
  DataTableHeaderCell,
  type DataTableHeaderReorderDirection,
  type DataTableHeaderResizeDirection,
} from '../../atoms/DataTableHeaderCell';
import { Pagination } from '../../atoms/Pagination';
import { EmptyState } from '../../molecules/EmptyState';
import type {
  DataTableCellAction,
  DataTableColumnDef,
  DataTableRow,
  DataTableSortDirection,
} from '../../../types/common';
import './DataTable.css';

export interface DataTableSortState {
  columnId: string;
  direction: DataTableSortDirection;
}

export interface DataTablePaginationState {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export interface DataTableProps {
  columns: DataTableColumnDef[];
  rows: DataTableRow[];
  columnOrder?: string[];
  onColumnOrderChange?: (nextOrder: string[]) => void;
  selectedRowIds?: string[];
  onSelectedRowIdsChange?: (nextSelectedRowIds: string[]) => void;
  sortState?: DataTableSortState | null;
  onSortStateChange?: (nextState: DataTableSortState | null) => void;
  /** @deprecated Has no effect — DataTable renders no per-column filter inputs. Filter rows before passing them and put filter controls in a Toolbar above the table. */
  filterState?: Record<string, string>;
  /** @deprecated Never called — see `filterState`. */
  onFilterStateChange?: (next: Record<string, string>) => void;
  pagination?: DataTablePaginationState;
  /**
   * Handles cell hover actions (copy, edit, delete, menu…) and the `expand` toggle.
   * When provided, each cell reveals its Figma hover actions on pointer hover / keyboard focus.
   * Call `event.preventDefault()` to replace the built-in copy / open-link / mailto / tel behaviour.
   */
  onCellAction?: (
    detail: { rowId: string; columnId: string; action: DataTableCellAction; value: unknown },
    event: React.MouseEvent<HTMLElement>,
  ) => void;
  /**
   * Accessible name for a row's selection checkbox. Defaults to `Select row ${row.id}`.
   * The checked state is conveyed by the checkbox itself — do not put it in the label.
   */
  rowLabel?: (row: DataTableRow) => string;
  /** Rendered in a single full-width row when `rows` is empty. Defaults to a small "No results" EmptyState. */
  emptyState?: React.ReactNode;
  className?: string;
  'aria-label'?: string;
}

/** Resolved px width of a column: user resize, then measured hug width, then declared width. */
function resolveColumnWidth(
  column: DataTableColumnDef,
  widthOverrides: Record<string, number>,
  hugWidths: Record<string, number>,
  fallback = 160,
): number {
  return (
    widthOverrides[column.id] ??
    (column.widthMode === 'hug' ? hugWidths[column.id] : undefined) ??
    column.width ??
    fallback
  );
}

function clamp(value: number, min?: number, max?: number): number {
  let next = value;
  if (typeof min === 'number') next = Math.max(next, min);
  if (typeof max === 'number') next = Math.min(next, max);
  return next;
}

function getMovableColumnIds(
  displayColumnIds: string[],
  lockedColumnIds: string[],
  columnsById: Map<string, DataTableColumnDef>,
): string[] {
  return displayColumnIds.filter(
    (id) => !lockedColumnIds.includes(id) && columnsById.get(id)?.reorderable !== false,
  );
}

function moveMovableColumn(
  movableIds: string[],
  columnId: string,
  direction: DataTableHeaderReorderDirection,
): string[] | null {
  const index = movableIds.indexOf(columnId);
  if (index === -1) return null;
  const nextIndex = direction === 'left' ? index - 1 : index + 1;
  if (nextIndex < 0 || nextIndex >= movableIds.length) return null;
  const next = [...movableIds];
  const [moved] = next.splice(index, 1);
  next.splice(nextIndex, 0, moved);
  return next;
}

function rebuildDisplayOrder(
  displayColumnIds: string[],
  movableIds: string[],
  reorderedMovableIds: string[],
): string[] {
  const movableSet = new Set(movableIds);
  const queue = [...reorderedMovableIds];
  return displayColumnIds.map((id) => (movableSet.has(id) ? queue.shift() ?? id : id));
}

/**
 * Full-width data grid with controlled sort, column reorder/resize, row selection, and pagination.
 *
 * @aiSelectWhen Data is row/column shaped (lists, directories, records)
 * @aiSelectWhen Dataset needs sorting, column filtering, reordering, resizing, selection, or pagination
 * @aiSelectWhen Cells need typed rendering (tag, user, boolean, date, url, checkbox) or a custom render function
 *
 * @aiAvoid Do not use for a single-column metadata list — use DataListCell instead
 * @aiAvoid Do not use for a card grid or Kanban board — use Card columns instead
 * @aiAvoid Do not use for static non-interactive content grids — use plain semantic HTML instead
 *
 * @aiVariant fieldType="tags-multi" — status/category values rendered as tags (legacy alias "tag")
 * @aiVariant fieldType="single-user" — person/owner values rendered with avatar + name (legacy alias "user")
 * @aiVariant fieldType="checkbox" — reserved for the row-selection column, pair with headerVariant="checkbox"
 * @aiAvoid fieldType="contacts-list" as a column — description-list rows only; use fieldType="contacts" in tables
 * @aiVariant fieldType="expand" — row-expand toggle column; use widthMode="fixed" width={32} and handle onCellAction action="expand"
 * @aiVariant widthMode="stretch" — last column absorbing remaining table width
 *
 * @aiSpatial Renders at width 100% with its own padding/row-height tokens; expects a full-width container, not a narrow column; does not add margin to siblings.
 *
 * @aiCompose Never place inside Card — DataTable manages its own surface and full-width layout
 * @aiCompose Never substitute hand-built <table> markup — always pass columns/rows
 * @aiCompose Render Pagination via the pagination prop, never as a separate element above the table
 */
export function DataTable({
  columns,
  rows,
  columnOrder,
  onColumnOrderChange,
  selectedRowIds = [],
  onSelectedRowIdsChange,
  sortState = null,
  onSortStateChange,
  pagination,
  onCellAction,
  rowLabel,
  emptyState,
  className,
  'aria-label': ariaLabel = 'Data table',
}: DataTableProps) {
  const rootClass = ['dsn-data-table', className].filter(Boolean).join(' ');
  const [dragColumnId, setDragColumnId] = React.useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = React.useState<string | null>(null);
  const [widthOverrides, setWidthOverrides] = React.useState<Record<string, number>>({});
  const [hugWidths, setHugWidths] = React.useState<Record<string, number>>({});
  const tableRef = React.useRef<HTMLTableElement>(null);
  const [activeResizeColumnId, setActiveResizeColumnId] = React.useState<string | null>(null);
  const [activePointerId, setActivePointerId] = React.useState<number | null>(null);
  const [reorderAnnouncement, setReorderAnnouncement] = React.useState('');
  const resizeSessionRef = React.useRef<{
    columnId: string;
    startX: number;
    startWidth: number;
    minWidth?: number;
    maxWidth?: number;
  } | null>(null);

  const columnsById = React.useMemo(
    () => new Map(columns.map((column) => [column.id, column])),
    [columns],
  );

  const defaultOrder = React.useMemo(() => columns.map((column) => column.id), [columns]);

  const requestedOrder = React.useMemo(() => {
    if (!columnOrder?.length) return defaultOrder;
    const valid = columnOrder.filter((id) => columnsById.has(id));
    const missing = defaultOrder.filter((id) => !valid.includes(id));
    return [...valid, ...missing];
  }, [columnOrder, defaultOrder, columnsById]);

  const frozenColumnId = React.useMemo(() => {
    const explicitFrozen = columns.find((column) => column.frozen)?.id;
    return explicitFrozen ?? defaultOrder[0];
  }, [columns, defaultOrder]);

  const orderedColumnIds = React.useMemo(() => {
    const withoutFrozen = requestedOrder.filter((id) => id !== frozenColumnId);
    return [frozenColumnId, ...withoutFrozen];
  }, [requestedOrder, frozenColumnId]);

  const orderedColumns = orderedColumnIds
    .map((id) => columnsById.get(id))
    .filter((column): column is DataTableColumnDef => Boolean(column));

  const selectionColumn = React.useMemo(
    () => orderedColumns.find((column) => column.fieldType === 'checkbox' || column.headerVariant === 'checkbox'),
    [orderedColumns],
  );

  const displayColumns = React.useMemo(
    () => (selectionColumn ? orderedColumns.filter((column) => column.id !== selectionColumn.id) : orderedColumns),
    [orderedColumns, selectionColumn],
  );

  const displayColumnIds = React.useMemo(
    () => displayColumns.map((column) => column.id),
    [displayColumns],
  );

  const lockedColumnIds = React.useMemo(
    () => displayColumnIds.slice(0, 1),
    [displayColumnIds],
  );

  const hugColumnIds = displayColumns
    .filter((column) => column.widthMode === 'hug')
    .map((column) => column.id)
    .join('|');

  // table-layout: fixed never sizes columns from content, so 'hug' columns are
  // measured: each cell is briefly laid out at max-content and the widest wins.
  const measureHugColumns = React.useCallback(() => {
    const table = tableRef.current;
    if (!table || !hugColumnIds) {
      setHugWidths((current) => (Object.keys(current).length ? {} : current));
      return;
    }
    const ids = hugColumnIds.split('|');
    const cells = Array.from(
      table.querySelectorAll<HTMLElement>('th[data-column-id], td[data-column-id]'),
    ).filter((cell) => ids.includes(cell.dataset.columnId!));
    const contents = cells.map((cell) => cell.firstElementChild as HTMLElement | null);
    const previous = contents.map((content) => content?.style.width ?? '');
    contents.forEach((content) => content?.style.setProperty('width', 'max-content'));
    const next: Record<string, number> = {};
    cells.forEach((cell, index) => {
      const content = contents[index];
      if (!content) return;
      const border = cell.offsetWidth - cell.clientWidth;
      const width = Math.ceil(content.getBoundingClientRect().width + Math.max(border, 0));
      const id = cell.dataset.columnId!;
      if (width > (next[id] ?? 0)) next[id] = width;
    });
    contents.forEach((content, index) => {
      if (content) content.style.width = previous[index] ?? '';
    });
    for (const id of ids) {
      const column = columnsById.get(id);
      if (next[id] == null || !column) continue;
      next[id] = clamp(next[id], column.minWidth, column.maxWidth);
    }
    setHugWidths((current) => {
      const currentKeys = Object.keys(current);
      const nextKeys = Object.keys(next);
      const same =
        currentKeys.length === nextKeys.length && nextKeys.every((id) => current[id] === next[id]);
      return same ? current : next;
    });
  }, [columnsById, hugColumnIds]);

  React.useLayoutEffect(() => {
    measureHugColumns();
  }, [measureHugColumns, rows]);

  React.useEffect(() => {
    if (!hugColumnIds || typeof document === 'undefined' || !document.fonts) return;
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (!cancelled) measureHugColumns();
    });
    return () => {
      cancelled = true;
    };
  }, [hugColumnIds, measureHugColumns]);

  const totalTableWidth = React.useMemo(() => {
    if (displayColumns.length === 0) return 0;
    const fixedCount = displayColumns.length - 1;
    let sum = 0;
    for (let i = 0; i < fixedCount; i++) {
      const col = displayColumns[i];
      if (col) sum += resolveColumnWidth(col, widthOverrides, hugWidths);
    }
    const lastCol = displayColumns[displayColumns.length - 1];
    if (lastCol) {
      sum += resolveColumnWidth(lastCol, widthOverrides, hugWidths, lastCol.minWidth ?? lastCol.width ?? 96);
    }
    return sum;
  }, [displayColumns, hugWidths, widthOverrides]);

  const stickyLeftOffsets = React.useMemo(() => {
    const offsets: Record<string, number> = {};
    let accumulated = 0;
    for (let i = 0; i < lockedColumnIds.length; i++) {
      const col = displayColumns[i];
      if (!col) break;
      offsets[col.id] = accumulated;
      accumulated += resolveColumnWidth(col, widthOverrides, hugWidths);
    }
    return offsets;
  }, [displayColumns, hugWidths, lockedColumnIds, widthOverrides]);

  const toggleRowSelection = (rowId: string, checked: boolean) => {
    const selected = new Set(selectedRowIds);
    if (checked) {
      selected.add(rowId);
    } else {
      selected.delete(rowId);
    }
    onSelectedRowIdsChange?.(Array.from(selected));
  };

  const toggleAllRows = (checked: boolean) => {
    onSelectedRowIdsChange?.(checked ? rows.map((row) => row.id) : []);
  };

  const announceColumnMove = React.useCallback(
    (columnId: string, displayOrder: string[]) => {
      const column = columnsById.get(columnId);
      if (!column) return;
      const position = displayOrder.indexOf(columnId) + 1;
      const total = displayOrder.length;
      setReorderAnnouncement(`${column.header} moved to position ${position} of ${total}`);
    },
    [columnsById],
  );

  const applyColumnReorder = React.useCallback(
    (columnId: string, direction: DataTableHeaderReorderDirection) => {
      if (lockedColumnIds.includes(columnId)) return;
      if (columnsById.get(columnId)?.reorderable === false) return;

      const movableIds = getMovableColumnIds(displayColumnIds, lockedColumnIds, columnsById);
      const reorderedMovableIds = moveMovableColumn(movableIds, columnId, direction);
      if (!reorderedMovableIds) return;

      const rebuilt = rebuildDisplayOrder(displayColumnIds, movableIds, reorderedMovableIds);
      onColumnOrderChange?.(selectionColumn ? [selectionColumn.id, ...rebuilt] : rebuilt);
      announceColumnMove(columnId, rebuilt);
    },
    [
      announceColumnMove,
      columnsById,
      displayColumnIds,
      lockedColumnIds,
      onColumnOrderChange,
      selectionColumn,
    ],
  );

  const reorderColumns = (sourceId: string, targetId: string) => {
    if (lockedColumnIds.includes(sourceId) || lockedColumnIds.includes(targetId)) return;
    if (sourceId === targetId) return;
    const order = [...displayColumnIds];
    const sourceIndex = order.indexOf(sourceId);
    const targetIndex = order.indexOf(targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;
    const [moved] = order.splice(sourceIndex, 1);
    order.splice(targetIndex, 0, moved);
    onColumnOrderChange?.(selectionColumn ? [selectionColumn.id, ...order] : order);
    announceColumnMove(sourceId, order);
  };

  const resizeByKeyboard = (column: DataTableColumnDef, direction: DataTableHeaderResizeDirection) => {
    const step = 16;
    const baseline = resolveColumnWidth(column, widthOverrides, hugWidths);
    const delta = direction === 'increase' ? step : -step;
    const next = clamp(baseline + delta, column.minWidth ?? 96, column.maxWidth);
    setWidthOverrides((current) => ({ ...current, [column.id]: next }));
  };

  const startPointerResize = (event: React.PointerEvent<HTMLButtonElement>, column: DataTableColumnDef) => {
    const baseline = resolveColumnWidth(column, widthOverrides, hugWidths);
    resizeSessionRef.current = {
      columnId: column.id,
      startX: event.clientX,
      startWidth: baseline,
      minWidth: column.minWidth ?? 96,
      maxWidth: column.maxWidth,
    };
    setActiveResizeColumnId(column.id);
    setActivePointerId(event.pointerId);
    event.currentTarget.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  };

  React.useEffect(() => {
    if (!activeResizeColumnId) {
      return;
    }

    const applyResize = (clientX: number) => {
      if (!resizeSessionRef.current) return;

      const {
        columnId,
        startX,
        startWidth,
        minWidth,
        maxWidth,
      } = resizeSessionRef.current;

      const delta = clientX - startX;
      const next = clamp(startWidth + delta, minWidth, maxWidth);
      setWidthOverrides((current) => ({ ...current, [columnId]: next }));
    };

    const handlePointerMove = (event: PointerEvent) => {
      applyResize(event.clientX);
    };

    const handleMouseMove = (event: MouseEvent) => {
      applyResize(event.clientX);
    };

    const stopResize = () => {
      resizeSessionRef.current = null;
      setActiveResizeColumnId(null);
      setActivePointerId(null);
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (activePointerId != null && event.pointerId !== activePointerId) return;
      stopResize();
    };

    const handlePointerCancel = (event: PointerEvent) => {
      if (activePointerId != null && event.pointerId !== activePointerId) return;
      stopResize();
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerCancel);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopResize);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerCancel);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopResize);
    };
  }, [activePointerId, activeResizeColumnId]);

  const handleSortChange = (columnId: string, direction: DataTableSortDirection) => {
    if (direction === 'none') {
      onSortStateChange?.(null);
      return;
    }
    onSortStateChange?.({ columnId, direction });
  };

  const selectedCount = rows.filter((row) => selectedRowIds.includes(row.id)).length;
  const allSelected = rows.length > 0 && selectedCount === rows.length;
  const someSelected = selectedCount > 0 && selectedCount < rows.length;

  const movableColumnIds = React.useMemo(
    () => getMovableColumnIds(displayColumnIds, lockedColumnIds, columnsById),
    [columnsById, displayColumnIds, lockedColumnIds],
  );

  return (
    <div className={rootClass} data-resizing={activeResizeColumnId ? '' : undefined}>
      <div
        className="dsn-data-table-reorder-status"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        aria-label="Column reorder status"
      >
        {reorderAnnouncement}
      </div>
      <table ref={tableRef} className="dsn-data-table-table" role="table" aria-label={ariaLabel} style={{ width: '100%', minWidth: `${totalTableWidth}px` }}>
        <colgroup>
          {displayColumns.map((column, index) => {
            const isLastColumn = index === displayColumns.length - 1;
            const hasOverride = widthOverrides[column.id] != null;
            const width = widthOverrides[column.id] ?? column.width;
            const style: React.CSSProperties = {};
            if (column.widthMode === 'hug') {
              const hugWidth = widthOverrides[column.id] ?? hugWidths[column.id];
              style.width = hugWidth != null ? `${hugWidth}px` : '1%';
            } else if (isLastColumn && !hasOverride) {
              style.width = '1%';
              style.minWidth = `${column.minWidth ?? column.width ?? 96}px`;
            } else if (column.widthMode === 'fixed' && typeof width === 'number') {
              style.width = `${width}px`;
              style.minWidth = `${width}px`;
              style.maxWidth = `${width}px`;
            }
            return <col key={column.id} style={style} />;
          })}
        </colgroup>

        <thead>
          <tr>
            {displayColumns.map((column, index) => {
              const isSticky = index < lockedColumnIds.length;
              const cellSortDirection =
                sortState?.columnId === column.id ? sortState.direction : 'none';
              const stickyStyle = isSticky
                ? ({
                    left: `${stickyLeftOffsets[column.id] ?? 0}px`,
                  } as React.CSSProperties)
                : undefined;

              const ariaSortValue: React.AriaAttributes['aria-sort'] | undefined = column.sortable
                ? cellSortDirection === 'asc' ? 'ascending'
                : cellSortDirection === 'desc' ? 'descending'
                : 'none'
                : undefined;
              const movableIndex = movableColumnIds.indexOf(column.id);
              const columnReorderable = !isSticky && column.reorderable !== false;

              return (
                <th
                  key={column.id}
                  scope="col"
                  data-column-id={column.id}
                  aria-sort={ariaSortValue}
                  className={isSticky ? 'dsn-data-table-sticky-column' : undefined}
                  data-first-column={index === 0 || undefined}
                  style={stickyStyle}
                  data-drag-over={dragOverColumnId === column.id ? '' : undefined}
                  onDragOver={(event) => {
                    if (!dragColumnId) return;
                    if (lockedColumnIds.includes(column.id)) return;
                    if (column.id === dragColumnId) return;
                    event.preventDefault();
                    setDragOverColumnId(column.id);
                  }}
                  onDragLeave={() => {
                    if (dragOverColumnId === column.id) {
                      setDragOverColumnId(null);
                    }
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (!dragColumnId) return;
                    reorderColumns(dragColumnId, column.id);
                    setDragColumnId(null);
                    setDragOverColumnId(null);
                  }}
                >
                  <DataTableHeaderCell
                    variant="title"
                    noRole
                    label={column.header}
                    sortable={Boolean(column.sortable)}
                    sortDirection={cellSortDirection}
                    reorderable={columnReorderable}
                    resizable
                    canMoveReorderLeft={columnReorderable && movableIndex > 0}
                    canMoveReorderRight={
                      columnReorderable && movableIndex >= 0 && movableIndex < movableColumnIds.length - 1
                    }
                    checkboxChecked={allSelected}
                    checkboxIndeterminate={someSelected}
                    onCheckboxChange={toggleAllRows}
                    leadingAccessory={
                      selectionColumn && index === 0 ? (
                        <Checkbox
                          size="sm"
                          checked={allSelected}
                          indeterminate={someSelected}
                          showContent={false}
                          aria-label="Select all rows"
                          onCheckedChange={toggleAllRows}
                        />
                      ) : undefined
                    }
                    onSortChange={(direction) => handleSortChange(column.id, direction)}
                    onReorderCommand={(direction) => applyColumnReorder(column.id, direction)}
                    onResizeCommand={(direction) => resizeByKeyboard(column, direction)}
                    onResizePointerDown={(event) => startPointerResize(event, column)}
                    onReorderDragStart={(event) => {
                      event.stopPropagation();
                      if (lockedColumnIds.includes(column.id) || column.reorderable === false) {
                        event.preventDefault();
                        return;
                      }
                      event.dataTransfer.effectAllowed = 'move';
                      event.dataTransfer.setData('text/plain', column.id);
                      setDragColumnId(column.id);
                    }}
                    onReorderDragEnd={() => {
                      setDragColumnId(null);
                      setDragOverColumnId(null);
                    }}
                  />
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 && (
            <tr className="dsn-data-table-empty-row">
              <td colSpan={Math.max(displayColumns.length, 1)} className="dsn-data-table-empty-cell">
                {emptyState ?? (
                  <EmptyState
                    size="small"
                    title="No results"
                    subtitle="There is no data to display."
                    hasActions={false}
                  />
                )}
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={row.id}>
              {displayColumns.map((column, index) => {
                const isSticky = index < lockedColumnIds.length;
                const stickyStyle = isSticky
                  ? ({
                      left: `${stickyLeftOffsets[column.id] ?? 0}px`,
                    } as React.CSSProperties)
                  : undefined;
                const value = row.cells[column.id];
                const checked = selectedRowIds.includes(row.id);

                return (
                  <td
                    key={`${row.id}-${column.id}`}
                    data-column-id={column.id}
                    className={isSticky ? 'dsn-data-table-sticky-column dsn-data-table-sticky-cell' : undefined}
                    data-first-column={index === 0 || undefined}
                    style={stickyStyle}
                  >
                    <DataTableCell
                      fieldType={column.fieldType}
                      value={value}
                      render={column.render}
                      row={row.cells}
                      leadingAccessory={
                        selectionColumn && index === 0 ? (
                          <Checkbox
                            size="sm"
                            checked={checked}
                            showContent={false}
                            aria-label={rowLabel ? rowLabel(row) : `Select row ${row.id}`}
                            onCheckedChange={(next) => toggleRowSelection(row.id, next)}
                          />
                        ) : undefined
                      }
                      align={column.align}
                      revealActionsOnHover={Boolean(onCellAction)}
                      onAction={
                        onCellAction
                          ? (action, cellValue, event) =>
                              onCellAction({ rowId: row.id, columnId: column.id, action, value: cellValue }, event)
                          : undefined
                      }
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {pagination && (
        <Pagination
          page={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={pagination.onPageChange}
        />
      )}
    </div>
  );
}

export default DataTable;
