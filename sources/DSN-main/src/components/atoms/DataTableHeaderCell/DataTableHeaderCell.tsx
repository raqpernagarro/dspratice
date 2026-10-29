import React from 'react';
import { ArrowDown, ArrowUp, MoreVertical } from 'lucide-react';
import { Button } from '../Button/Button';
import { Checkbox } from '../Checkbox';
import { MenuCell } from '../MenuCell';
import { PopoverWrapper, isPointerInsideAnchoredPopover } from '../../molecules/PopoverWrapper';
import type { DataTableSortDirection } from '../../../types/common';
import './DataTableHeaderCell.css';

export type DataTableHeaderCellVariant = 'title' | 'checkbox';
export type DataTableHeaderCellState = 'default' | 'hover';
export type DataTableHeaderReorderDirection = 'left' | 'right';
export type DataTableHeaderResizeDirection = 'decrease' | 'increase';

export interface DataTableHeaderCellProps {
  variant?: DataTableHeaderCellVariant;
  state?: DataTableHeaderCellState;
  label?: string;
  width?: number;
  sortable?: boolean;
  sortDirection?: DataTableSortDirection;
  reorderable?: boolean;
  resizable?: boolean;
  checkboxChecked?: boolean;
  checkboxIndeterminate?: boolean;
  onCheckboxChange?: (checked: boolean) => void;
  onSortChange?: (next: DataTableSortDirection) => void;
  onReorderCommand?: (direction: DataTableHeaderReorderDirection) => void;
  canMoveReorderLeft?: boolean;
  canMoveReorderRight?: boolean;
  onResizeCommand?: (direction: DataTableHeaderResizeDirection) => void;
  onResizePointerDown?: React.PointerEventHandler<HTMLButtonElement>;
  onMoreClick?: React.MouseEventHandler<HTMLButtonElement>;
  onReorderDragStart?: React.DragEventHandler<HTMLElement>;
  onReorderDragEnd?: React.DragEventHandler<HTMLElement>;
  leadingAccessory?: React.ReactNode;
  className?: string;
  'aria-label'?: string;
  /** When true, omits role="columnheader" and aria-sort from the root div.
   *  Use when the div is already inside a <th scope="col"> that carries those attributes. */
  noRole?: boolean;
}

function nextSortDirection(current: DataTableSortDirection): DataTableSortDirection {
  if (current === 'none') return 'desc';
  if (current === 'desc') return 'asc';
  return 'desc';
}

function ariaSortFromDirection(sortDirection: DataTableSortDirection): React.AriaAttributes['aria-sort'] {
  if (sortDirection === 'asc') return 'ascending';
  if (sortDirection === 'desc') return 'descending';
  return 'none';
}

/**
 * DataTable column header: sortable, reorderable, resizable title with column options, or a select-all checkbox.
 *
 * @aiSelectWhen Only for static previews — DataTable renders header cells for every column
 *
 * @aiAvoid Do not build custom table headers — use DataTable instead
 * @aiAvoid Do not use as a section title — use SectionHeader instead
 *
 * @aiVariant variant="title" — data column header
 * @aiVariant variant="checkbox" — selection column select-all
 * @aiVariant state="hover" — static previews only; real tables use "default"
 *
 * @aiSpatial Fills its table column; width sets the column width; resize handle sits on the right edge.
 *
 * @aiCompose Header cells have no filter input — filter above the table with Toolbar
 */
export function DataTableHeaderCell({
  variant = 'title',
  state = 'default',
  label = 'Label',
  width,
  sortable = false,
  sortDirection = 'none',
  reorderable = true,
  resizable = true,
  checkboxChecked = false,
  checkboxIndeterminate = false,
  onCheckboxChange,
  onSortChange,
  onReorderCommand,
  canMoveReorderLeft = false,
  canMoveReorderRight = false,
  onResizeCommand,
  onResizePointerDown,
  onMoreClick,
  onReorderDragStart,
  onReorderDragEnd,
  leadingAccessory,
  className,
  'aria-label': ariaLabel,
  noRole = false,
}: DataTableHeaderCellProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const optionsWrapRef = React.useRef<HTMLSpanElement>(null);
  const menuId = React.useId();
  const rootClass = ['dsn-data-table-header-cell', className].filter(Boolean).join(' ');
  const isTitle = variant === 'title';
  const canToggleSort = isTitle && sortable;
  const showReorderMenu = isTitle && reorderable && Boolean(onReorderCommand);

  const setMenuOpen = React.useCallback((nextOpen: boolean) => {
    setIsMenuOpen(nextOpen);
  }, []);

  React.useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current) {
        return;
      }
      if (!isPointerInsideAnchoredPopover(event, rootRef.current, menuId)) {
        setMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        optionsWrapRef.current?.querySelector('button')?.focus();
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen, menuId, setMenuOpen]);

  const handleReorderMenuSelect = (direction: DataTableHeaderReorderDirection) => {
    onReorderCommand?.(direction);
    setMenuOpen(false);
    optionsWrapRef.current?.querySelector('button')?.focus();
  };

  const handleOptionsClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (showReorderMenu) {
      setMenuOpen(!isMenuOpen);
      return;
    }
    onMoreClick?.(event);
  };

  const handleSortToggle = () => {
    if (!canToggleSort) return;
    onSortChange?.(nextSortDirection(sortDirection));
  };

  const handleHeaderKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (reorderable && onReorderCommand && (event.ctrlKey || event.metaKey)) {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        onReorderCommand('left');
        return;
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        onReorderCommand('right');
        return;
      }
    }

    if (!canToggleSort) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleSortToggle();
    }
  };

  const style =
    isTitle && typeof width === 'number'
      ? ({ width: `${width}px` } as React.CSSProperties)
      : undefined;

  return (
    <div
      ref={rootRef}
      className={rootClass}
      data-variant={variant}
      data-state={state}
      data-dragging={isDragging ? '' : undefined}
      role={noRole ? undefined : 'columnheader'}
      aria-sort={!noRole && isTitle && sortable ? ariaSortFromDirection(sortDirection) : undefined}
      aria-label={ariaLabel}
      aria-keyshortcuts={reorderable && onReorderCommand ? 'Control+ArrowLeft Control+ArrowRight' : undefined}
      style={style}
      tabIndex={canToggleSort || reorderable ? 0 : -1}
      draggable={reorderable || undefined}
      onClick={handleSortToggle}
      onKeyDown={handleHeaderKeyDown}
      onDragStart={
        reorderable
          ? (e) => {
              setIsDragging(true);
              onReorderDragStart?.(e);
            }
          : undefined
      }
      onDragEnd={
        reorderable
          ? (e) => {
              setIsDragging(false);
              onReorderDragEnd?.(e);
            }
          : undefined
      }
    >
      {isTitle ? (
        <>
          {/* Drag affordance — 4 dots at top-center, visible on hover */}
          {reorderable && (
            <div className="dsn-data-table-header-drag-indicator" aria-hidden="true">
              <span /><span /><span /><span />
            </div>
          )}

          <div className="dsn-data-table-header-cell-main">
            {leadingAccessory && (
              <span className="dsn-data-table-header-cell-leading-accessory" onClick={(event) => event.stopPropagation()}>
                {leadingAccessory}
              </span>
            )}
            <div className="dsn-data-table-header-cell-title">
              <span className="dsn-data-table-header-cell-label">{label}</span>
              {sortable && (
                <span className="dsn-data-table-header-cell-sort" data-direction={sortDirection} aria-hidden="true">
                  {sortDirection === 'asc'
                    ? <ArrowUp size={14} strokeWidth={1.5} />
                    : <ArrowDown size={14} strokeWidth={1.5} />}
                </span>
              )}
            </div>
          </div>

          {/* Controls — Column options (reorder menu when reorderable) */}
          <div className="dsn-data-table-header-cell-controls">
            <span ref={optionsWrapRef} className="dsn-data-table-header-cell-options-wrap">
              <Button
                variant="ghost"
                size="sm"
                showLeadingIcon
                leadingIcon={<MoreVertical size={14} strokeWidth={1.5} aria-hidden="true" />}
                showLabel={false}
                onClick={handleOptionsClick}
                aria-label="Column options"
                aria-expanded={showReorderMenu ? isMenuOpen : undefined}
                aria-haspopup={showReorderMenu ? 'menu' : undefined}
                aria-controls={showReorderMenu && isMenuOpen ? menuId : undefined}
              />
            </span>
            {showReorderMenu && isMenuOpen && (
              <PopoverWrapper
                id={menuId}
                role="menu"
                aria-label={`${label} column options`}
                className="dsn-data-table-header-cell-menu"
                contentClassName="dsn-data-table-header-cell-menu-stack"
                contentPadding="small"
                anchorRef={optionsWrapRef}
                content={
                  <div role="presentation">
                    <MenuCell
                      label="Move left"
                      showLeadingIcon={false}
                      showTrailingIcon={false}
                      disabled={!canMoveReorderLeft}
                      onClick={() => handleReorderMenuSelect('left')}
                    />
                    <MenuCell
                      label="Move right"
                      showLeadingIcon={false}
                      showTrailingIcon={false}
                      disabled={!canMoveReorderRight}
                      onClick={() => handleReorderMenuSelect('right')}
                    />
                  </div>
                }
              />
            )}
          </div>

          {/* Resizer — absolute right-edge handle */}
          {resizable && (
            <button
              type="button"
              className="dsn-data-table-header-resizer"
              aria-label="Resize column"
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => {
                event.stopPropagation();
                onResizePointerDown?.(event);
              }}
              onKeyDown={(event) => {
                event.stopPropagation();
                if (event.key === 'ArrowLeft') {
                  event.preventDefault();
                  onResizeCommand?.('decrease');
                } else if (event.key === 'ArrowRight') {
                  event.preventDefault();
                  onResizeCommand?.('increase');
                }
              }}
            />
          )}
        </>
      ) : (
        <div className="dsn-data-table-header-cell-checkbox-wrap" onClick={(event) => event.stopPropagation()}>
          <Checkbox
            size="sm"
            checked={checkboxChecked}
            indeterminate={checkboxIndeterminate}
            showContent={false}
            aria-label={ariaLabel ?? 'Select all rows'}
            onCheckedChange={onCheckboxChange}
          />
        </div>
      )}
    </div>
  );
}

export default DataTableHeaderCell;
