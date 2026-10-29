import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '../../atoms/Button';
import './Breadcrumbs.css';

/**
 * Breadcrumb size.
 * - `sm` — compact trail for in-content sub-section hierarchy.
 * - `lg` — prominent page-level trail, used inside `Navbar` in place of the page title.
 */
export type BreadcrumbsSize = 'sm' | 'lg';

export type BreadcrumbItemVariant = 'previous' | 'current' | 'ellipsis';

export interface BreadcrumbItem {
  id?: string;
  label?: React.ReactNode;
  href?: string;
  /** Overrides the position-based default (last item = `current`, others = `previous`). */
  variant?: BreadcrumbItemVariant;
  disabled?: boolean;
  /** Shows a chevron for items that open a dropdown of sibling pages. `size="lg"` only. Default false. */
  showDisclosure?: boolean;
  ariaLabel?: string;
  onClick?: (
    event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>,
    item: BreadcrumbItem,
    index: number,
  ) => void;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  /** @default 'sm' */
  size?: BreadcrumbsSize;
  maxVisibleItems?: number;
  showEllipsis?: boolean;
  ellipsisLabel?: string;
  ellipsisAriaLabel?: string;
  separator?: React.ReactNode;
  className?: string;
  'aria-label'?: string;
  onItemClick?: (
    event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>,
    item: BreadcrumbItem,
    index: number,
  ) => void;
}

type EllipsisMarker = { type: 'ellipsis' };
type VisibleEntry = { type: 'item'; item: BreadcrumbItem; index: number } | EllipsisMarker;

function isCollapsible(itemsCount: number, maxVisibleItems: number, showEllipsis: boolean): boolean {
  if (!showEllipsis) return false;
  if (maxVisibleItems < 3) return false;
  return itemsCount > maxVisibleItems;
}

function resolveVariant(item: BreadcrumbItem, index: number, total: number): BreadcrumbItemVariant {
  if (item.variant) return item.variant;
  return index === total - 1 ? 'current' : 'previous';
}

/**
 * Hierarchical wayfinding trail. One component, two sizes.
 *
 * @aiSelectWhen Hierarchy of at least three levels where users move between levels
 * @aiSelectWhen `size="lg"` — page-level trail inside Navbar, replacing the page title on detail views
 * @aiSelectWhen `size="sm"` — sub-section hierarchy inside page content
 *
 * @aiAvoid Do not use `size="lg"` inside page content, or `size="sm"` for main navigation
 * @aiAvoid Do not use for a flat, two-level hierarchy — breadcrumbs are not warranted
 * @aiAvoid Do not use inside Card, Modal, or Drawer — breadcrumbs are a page-level pattern
 *
 * @aiSpatial Owns its own padding; collapses middle levels via ellipsis rather than wrapping
 *
 * @aiCompose `size="lg"` is rendered by Navbar `variant="breadcrumbs"`. Never make the current (last) item a clickable link
 */
export function Breadcrumbs({
  items,
  size = 'sm',
  maxVisibleItems = 4,
  showEllipsis = true,
  ellipsisLabel = '...',
  ellipsisAriaLabel = 'Show more breadcrumbs',
  separator,
  className,
  'aria-label': ariaLabel = 'Breadcrumb',
  onItemClick,
}: BreadcrumbsProps) {
  const [expanded, setExpanded] = useState(false);

  const isLarge = size === 'lg';
  const separatorNode = separator ?? <ChevronRight size={16} aria-hidden="true" />;
  const rootClass = ['dsn-breadcrumbs', isLarge && 'dsn-breadcrumbs-large', className]
    .filter(Boolean)
    .join(' ');

  const visibleEntries = useMemo<VisibleEntry[]>(() => {
    const baseEntries = items.map((item, index) => ({ type: 'item' as const, item, index }));
    const collapsible = isCollapsible(items.length, maxVisibleItems, showEllipsis);
    if (!collapsible || expanded) return baseEntries;

    const root = baseEntries[0];
    const trailingCount = Math.max(1, maxVisibleItems - 2);
    const tail = baseEntries.slice(-trailingCount);
    return [root, { type: 'ellipsis' }, ...tail];
  }, [expanded, items, maxVisibleItems, showEllipsis]);

  function handleItemClick(
    event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>,
    item: BreadcrumbItem,
    index: number,
  ) {
    item.onClick?.(event, item, index);
    onItemClick?.(event, item, index);
  }

  function renderSeparator(isLastVisible: boolean) {
    if (isLastVisible) return null;
    return (
      <span className="dsn-breadcrumbs-separator" aria-hidden="true">
        {separatorNode}
      </span>
    );
  }

  function renderEllipsis() {
    if (isLarge) {
      return (
        <button
          type="button"
          className="dsn-breadcrumbs-large-trigger dsn-breadcrumbs-large-trigger-ellipsis"
          aria-label={ellipsisAriaLabel}
          onClick={() => setExpanded(true)}
        >
          <span className="dsn-breadcrumbs-large-label">{ellipsisLabel}</span>
        </button>
      );
    }
    return (
      <Button variant="plain" size="sm" aria-label={ellipsisAriaLabel} onClick={() => setExpanded(true)}>
        {ellipsisLabel}
      </Button>
    );
  }

  function renderLargeItem(item: BreadcrumbItem, index: number, label: React.ReactNode, isCurrent: boolean) {
    const content = (
      <>
        <span className="dsn-breadcrumbs-large-label">{label}</span>
        {item.showDisclosure ? (
          <span className="dsn-breadcrumbs-large-disclosure" aria-hidden="true">
            <ChevronDown size={16} />
          </span>
        ) : null}
      </>
    );

    if (isCurrent) {
      return (
        <span className="dsn-breadcrumbs-large-current" aria-current="page">
          {content}
        </span>
      );
    }
    if (item.href && !item.disabled) {
      return (
        <a
          className="dsn-breadcrumbs-large-trigger"
          href={item.href}
          aria-label={item.ariaLabel}
          onClick={(event) => handleItemClick(event, item, index)}
        >
          {content}
        </a>
      );
    }
    return (
      <button
        type="button"
        className="dsn-breadcrumbs-large-trigger"
        disabled={item.disabled}
        aria-label={item.ariaLabel}
        onClick={(event) => handleItemClick(event, item, index)}
      >
        {content}
      </button>
    );
  }

  function renderSmallItem(item: BreadcrumbItem, index: number, label: React.ReactNode, isCurrent: boolean) {
    if (isCurrent) {
      return (
        <span className="dsn-breadcrumbs-current" aria-current="page">
          {label}
        </span>
      );
    }
    if (item.href && !item.disabled) {
      return (
        <a
          className="dsn-breadcrumbs-link"
          href={item.href}
          aria-label={item.ariaLabel}
          onClick={(event) => handleItemClick(event, item, index)}
        >
          {label}
        </a>
      );
    }
    return (
      <Button
        variant="plain"
        size="sm"
        disabled={item.disabled}
        aria-label={item.ariaLabel}
        onClick={(event) => handleItemClick(event, item, index)}
      >
        {label}
      </Button>
    );
  }

  return (
    <nav className={rootClass} aria-label={ariaLabel}>
      <ol className="dsn-breadcrumbs-list">
        {visibleEntries.map((entry, visibleIndex) => {
          const isLastVisible = visibleIndex === visibleEntries.length - 1;

          if (entry.type === 'ellipsis') {
            return (
              <li className="dsn-breadcrumbs-item" key={`ellipsis-${visibleIndex}`}>
                {renderEllipsis()}
                {renderSeparator(isLastVisible)}
              </li>
            );
          }

          const { item, index } = entry;
          const variant = resolveVariant(item, index, items.length);
          const label = variant === 'ellipsis' ? ellipsisLabel : item.label;
          const isCurrent = variant === 'current';

          return (
            <li className="dsn-breadcrumbs-item" key={item.id ?? `${index}-${String(label)}`}>
              {isLarge
                ? renderLargeItem(item, index, label, isCurrent)
                : renderSmallItem(item, index, label, isCurrent)}
              {renderSeparator(isLastVisible)}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumbs;
