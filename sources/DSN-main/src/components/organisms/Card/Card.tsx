import React from 'react';
import { SectionHeader, type SectionHeaderSize } from '../../atoms/SectionHeader';
import { SkeletonLoading } from '../../atoms/SkeletonLoading';
import { Toolbar, type ToolbarSize } from '../../molecules/Toolbar';
import './Card.css';

export interface CardProps {
  showHeader?: boolean;
  title?: string;
  description?: string;
  headerSize?: SectionHeaderSize;
  headerLeadingControl?: React.ReactNode;
  headerTrailingControl?: React.ReactNode;
  header?: React.ReactNode;
  children?: React.ReactNode;
  /** When true, header, content, and bottom bar are replaced by a card-shaped skeleton. */
  loading?: boolean;
  showBottomBar?: boolean;
  bottomBarSize?: ToolbarSize;
  bottomBarLeftActions?: React.ReactNode;
  bottomBarRightActions?: React.ReactNode;
  bottomBar?: React.ReactNode;
  className?: string;
  'aria-label'?: string;
}

/**
 * **Card** — bounded surface with optional header, content area, and bottom bar.
 *
 * @aiSelectWhen Content is a distinct, self-contained unit (form block, summary panel, board column)
 * @aiSelectWhen Building the documented KPI/stat card dashboard pattern
 *
 * @aiAvoid Do not use when content should flow continuously with the page — use SectionHeader + flat content instead
 * @aiAvoid Do not use as a page-section title for main-content lists/details — use SectionHeader inside a page-section wrapper instead
 * @aiAvoid Do not wrap a full-width data table — DataTable is never wrapped in a Card
 * @aiAvoid Do not use for a plain visual box with no header semantics — use the documented empty-state or board patterns instead
 *
 * @aiSpatial Owns its own inset padding via .dsn-card-content (varies with data-has-header/data-has-bottom-bar) — never add padding/margin/gap directly on the Card root; gap between multiple cards must come from the parent (--space-md)
 *
 * @aiCompose Never place a DataTable inside a Card — DataTable is always full-width
 * @aiCompose Never put a standalone primary CTA Button inside a Card — primary CTAs belong in Navbar rightActions
 * @aiCompose Always set showHeader+title together when there is body content; always set showBottomBar={false} explicitly when there is no footer
 */
export function Card({
  showHeader = true,
  title = 'Title',
  description,
  headerSize = 'medium',
  headerLeadingControl,
  headerTrailingControl,
  header,
  children,
  loading = false,
  showBottomBar = true,
  bottomBarSize = 'lg',
  bottomBarLeftActions,
  bottomBarRightActions,
  bottomBar,
  className,
  'aria-label': ariaLabel = 'Card',
}: CardProps) {
  const rootClass = ['dsn-card', className].filter(Boolean).join(' ');
  const resolvedHeader = header ?? (
    <SectionHeader
      title={title}
      description={description}
      size={headerSize}
      className="dsn-section-header--card"
      leadingControl={headerLeadingControl}
      trailingControl={headerTrailingControl}
    />
  );
  const resolvedBottomBar = bottomBar ?? (
    <Toolbar
      size={bottomBarSize}
      variant="plain"
      leftActions={bottomBarLeftActions}
      rightActions={bottomBarRightActions}
      aria-label="Card actions"
    />
  );

  const hasHeader = Boolean(!loading && showHeader && resolvedHeader);
  const hasBottomBar = Boolean(!loading && showBottomBar);

  return (
    <section
      className={rootClass}
      aria-label={loading ? `${ariaLabel}, loading` : ariaLabel}
      aria-busy={loading || undefined}
      data-has-header={hasHeader || undefined}
      data-has-bottom-bar={hasBottomBar || undefined}
      data-loading={loading || undefined}
    >
      {loading ? (
        <div className="dsn-card-loading-skeleton">
          <SkeletonLoading type="card" />
        </div>
      ) : (
        <>
          {hasHeader ? <div className="dsn-card-header">{resolvedHeader}</div> : null}
          <div className="dsn-card-content">{children}</div>
          {hasBottomBar ? <div className="dsn-card-bottom-bar">{resolvedBottomBar}</div> : null}
        </>
      )}
    </section>
  );
}

export default Card;
