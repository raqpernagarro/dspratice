import React from 'react';
import './SectionHeader.css';

export type SectionHeaderSize = 'large' | 'medium' | 'small' | 'xsmall';

export interface SectionHeaderProps {
  title: string;
  description?: string;
  size?: SectionHeaderSize;
  /** Removes horizontal padding so the title aligns with flush sibling content (e.g. accordion bodies, full-bleed lists). */
  flush?: boolean;
  leadingControl?: React.ReactNode;
  trailingControl?: React.ReactNode;
  className?: string;
}

function sanitizeControlNode(node: React.ReactNode): React.ReactNode {
  if (node == null || typeof node === 'boolean') return null;
  if (typeof node === 'string' || typeof node === 'number') return node;
  if (Array.isArray(node)) {
    const sanitized = node
      .map((item) => sanitizeControlNode(item))
      .filter((item): item is Exclude<React.ReactNode, null> => item !== null);
    return sanitized.length > 0 ? sanitized : null;
  }
  return React.isValidElement(node) ? node : null;
}

/**
 * **SectionHeader** — edge-to-edge title block with optional description and leading/trailing controls.
 *
 * @aiSelectWhen Labeling a top-level page section or a Card header (size="large")
 * @aiSelectWhen Labeling a subsection inside a page-section wrapper (size="medium")
 *
 * @aiAvoid Do not use for a bounded card surface around the title — use Card's title prop instead, only for content inside that card
 * @aiAvoid Do not use for a page-level title in nav chrome — use Navbar title or breadcrumbs instead
 * @aiAvoid Do not use a raw h2/h3 to divide content sections — use SectionHeader instead
 *
 * @aiVariant size="large" — top-level page sections or standard Card headers
 * @aiVariant size="medium" — subsections inside a page-section wrapper, or denser Card/drawer headers
 * @aiVariant size="small" — drawer or panel section labels needing a compact header
 * @aiVariant size="xsmall" — most compact section label density
 * @aiVariant flush — no horizontal padding; use when body content below is also flush (accordion rows, full-bleed lists/tables inside a padded page-section)
 *
 * @aiSpatial Edge-to-edge — owns its own padding-inline by default; set flush when sibling body content has no horizontal inset; never wrap in a padded container or add padding/margin/minWidth/width to its parent; vertical rhythm to body content belongs on the surrounding page-section wrapper, not the header
 *
 * @aiCompose Never place inside DataTable cells
 * @aiCompose Never use a Card title/showHeader as a substitute for SectionHeader-in-page-section for main-content page titles
 */
export function SectionHeader({
  title,
  description,
  size = 'medium',
  flush = false,
  leadingControl,
  trailingControl,
  className,
}: SectionHeaderProps) {
  const rootClass = ['dsn-section-header', className].filter(Boolean).join(' ');
  const safeLeadingControl = sanitizeControlNode(leadingControl);
  const safeTrailingControl = sanitizeControlNode(trailingControl);

  return (
    <div
      className={rootClass}
      data-size={size}
      data-flush={flush || undefined}
      data-has-description={Boolean(description) || undefined}
      data-has-leading-control={Boolean(safeLeadingControl) || undefined}
      data-has-trailing-control={Boolean(safeTrailingControl) || undefined}
    >
      {safeLeadingControl && <div className="dsn-section-header-control">{safeLeadingControl}</div>}
      <div className="dsn-section-header-title-wrapper">
        <div className="dsn-section-header-text">
          <p className="dsn-section-header-title">{title}</p>
          {description && <p className="dsn-section-header-description">{description}</p>}
        </div>
      </div>
      {safeTrailingControl && <div className="dsn-section-header-control">{safeTrailingControl}</div>}
    </div>
  );
}

export default SectionHeader;
