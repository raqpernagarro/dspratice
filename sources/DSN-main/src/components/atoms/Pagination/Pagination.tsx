import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from '../Button';
import { MenuCell } from '../MenuCell';
import { PopoverWrapper, isPointerInsideAnchoredPopover } from '../../molecules/PopoverWrapper';
import { PageSelector } from './PageSelector';
import './Pagination.css';

// ─── Types ────────────────────────────────────────────────────────────────────

type PageItem = number | 'ellipsis-start' | 'ellipsis-end';

// ─── Windowing algorithm ──────────────────────────────────────────────────────

/**
 * Builds the ordered list of page items to render.
 *
 * Rules (from spec):
 * - Always show page 1 and the last page.
 * - Always show current page and its direct neighbours (±1).
 * - Collapse with an ellipsis when the gap between visible pages > 1.
 * - If the gap is exactly 2, insert the single missing page instead of an ellipsis.
 */
function buildPageItems(current: number, total: number): PageItem[] {
  if (total <= 0) return [];

  const shown = new Set<number>([1, total]);
  for (let p = Math.max(1, current - 1); p <= Math.min(total, current + 1); p++) {
    shown.add(p);
  }

  const sorted = Array.from(shown).sort((a, b) => a - b);
  const items: PageItem[] = [];
  let ellipsisCount = 0;

  for (let i = 0; i < sorted.length; i++) {
    if (i > 0) {
      const gap = sorted[i] - sorted[i - 1];
      if (gap === 2) {
        // Single missing page — show it directly instead of an ellipsis
        items.push(sorted[i - 1] + 1);
      } else if (gap > 2) {
        items.push(ellipsisCount === 0 ? 'ellipsis-start' : 'ellipsis-end');
        ellipsisCount++;
      }
    }
    items.push(sorted[i]);
  }

  return items;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface PaginationProps {
  /** Current page number (1-based). */
  page: number;
  /** Total number of pages. */
  totalPages: number;
  /** Called when the user navigates to a different page. */
  onPageChange: (page: number) => void;

  /**
   * Total number of records. Used together with `pageSize` to render the
   * "X–Y of Z records" summary string.
   */
  totalRecords?: number;
  /**
   * Number of records per page. Used together with `totalRecords` to compute
   * the visible range.
   */
  pageSize?: number;

  /**
   * Currently selected rows-per-page value. When provided, a rows-per-page
   * selector is shown on the left side of the bar.
   */
  rowsPerPage?: number;
  /** Available rows-per-page options. Defaults to [10, 25, 50, 100]. */
  rowsPerPageOptions?: number[];
  /** Called when the user selects a different rows-per-page value. */
  onRowsPerPageChange?: (rows: number) => void;

  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Pagination({
  page,
  totalPages,
  onPageChange,
  totalRecords,
  pageSize,
  rowsPerPage,
  rowsPerPageOptions = [10, 25, 50, 100],
  onRowsPerPageChange,
  className,
}: PaginationProps) {
  const pageItems = buildPageItems(page, totalPages);
  const rowsMenuId = useId();
  const [isRowsMenuOpen, setIsRowsMenuOpen] = useState(false);
  const rowsTriggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isRowsMenuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!isPointerInsideAnchoredPopover(event, rowsTriggerRef.current, rowsMenuId)) {
        setIsRowsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [isRowsMenuOpen]);

  // "X–Y of Z records" summary
  let summary: string | null = null;
  if (totalRecords !== undefined && pageSize !== undefined) {
    const from = (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, totalRecords);
    summary = `${from}–${to} of ${totalRecords}`;
  }

  return (
    <nav
      className={`dsn-pagination${className ? ` ${className}` : ''}`}
      aria-label="Pagination"
    >
      {/* ── Left: rows-per-page ─────────────────────────────────────── */}
      {rowsPerPage !== undefined && (
        <div className="dsn-pagination-meta">
          <div className="dsn-pagination-rows">
            <div ref={rowsTriggerRef} className="dsn-pagination-rows-trigger">
              <Button
                variant="ghost"
                size="sm"
                showTrailingIcon
                trailingIcon={<ChevronDown size={16} strokeWidth={1.5} />}
                aria-label="Rows per page"
                aria-haspopup="menu"
                aria-expanded={isRowsMenuOpen}
                onClick={() => setIsRowsMenuOpen((open) => !open)}
              >
                {rowsPerPage}
              </Button>
              {isRowsMenuOpen && (
                <PopoverWrapper
                  id={rowsMenuId}
                  role="menu"
                  aria-label="Rows per page options"
                  anchorRef={rowsTriggerRef}
                  offset={4}
                  viewportMargin={16}
                  contentPadding="small"
                  content={
                    <div>
                      {rowsPerPageOptions.map((option) => (
                        <MenuCell
                          key={option}
                          label={String(option)}
                          fullWidth
                          showLeadingIcon={false}
                          showTrailingIcon={rowsPerPage === option}
                          selected={rowsPerPage === option}
                          aria-label={String(option)}
                          onClick={() => {
                            onRowsPerPageChange?.(option);
                            setIsRowsMenuOpen(false);
                          }}
                        />
                      ))}
                    </div>
                  }
                />
              )}
            </div>
            <span className="dsn-pagination-rows-label">Rows per page</span>
          </div>
        </div>
      )}

      {/* ── Right: summary + prev / pages / next ────────────────────── */}
      <div className="dsn-pagination-controls">
        {/* Record count summary */}
        {summary && (
          <span className="dsn-pagination-summary" aria-live="polite" aria-atomic="true">
            {summary}
          </span>
        )}

        {/* Previous */}
        <Button
          variant="ghost"
          size="md"
          showLeadingIcon
          leadingIcon={<ChevronLeft size={16} strokeWidth={1.5} />}
          showLabel={false}
          disabled={page <= 1}
          aria-label="Go to previous page"
          aria-disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        />

        {/* Page selectors + ellipsis */}
        <div className="dsn-pagination-pages" role="group" aria-label="Pages">
          {pageItems.map((item) => {
            if (item === 'ellipsis-start' || item === 'ellipsis-end') {
              return (
                <Button
                  key={item}
                  variant="ghost"
                  size="md"
                  showLeadingIcon
                  leadingIcon={<MoreHorizontal size={16} strokeWidth={1.5} />}
                  showLabel={false}
                  aria-label="More pages"
                  className="dsn-pagination-ellipsis"
                />
              );
            }
            return (
              <PageSelector
                key={item}
                page={item}
                selected={item === page}
                onClick={() => onPageChange(item)}
              />
            );
          })}
        </div>

        {/* Next */}
        <Button
          variant="ghost"
          size="md"
          showLeadingIcon
          leadingIcon={<ChevronRight size={16} strokeWidth={1.5} />}
          showLabel={false}
          disabled={page >= totalPages}
          aria-label="Go to next page"
          aria-disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        />
      </div>
    </nav>
  );
}

export default Pagination;
