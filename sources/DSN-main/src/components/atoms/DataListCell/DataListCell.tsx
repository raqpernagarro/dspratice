import React from 'react';
import { Button } from '../Button';
import './DataListCell.css';

export type DataListCellAlignment = 'inline' | 'vertical';
export type DataListCellVariant = 'with-title' | 'just-icon';
export type DataListCellState = 'default' | 'hover';

export interface DataListCellProps {
  alignment?: DataListCellAlignment;
  variant?: DataListCellVariant;
  state?: DataListCellState;
  title?: string;
  description?: string;
  content?: React.ReactNode;
  showIcon?: boolean;
  icon?: React.ReactNode;
  showActions?: boolean;
  actionAriaLabel?: string;
  onActionClick?: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
  'aria-label'?: string;
}

function DataListPlaceholderIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 2.5L13.5 8L8 13.5L2.5 8L8 2.5Z"
        stroke="currentColor"
        strokeWidth="var(--size-border-md)"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M6 6.5H3.5V12.5H9.5V10"
        stroke="currentColor"
        strokeWidth="var(--size-border-md)"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 3.5H12.5V9.5H6.5V3.5Z"
        stroke="currentColor"
        strokeWidth="var(--size-border-md)"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DataListCell({
  alignment = 'inline',
  variant = 'with-title',
  state = 'default',
  title = 'Title',
  description = 'Description',
  content,
  showIcon = true,
  icon,
  showActions = true,
  actionAriaLabel = 'Copy description',
  onActionClick,
  className,
  'aria-label': ariaLabel,
}: DataListCellProps) {
  const showTitle = variant === 'with-title';
  const isInteractive = content != null;
  const rootClass = ['dsn-data-list-cell', className].filter(Boolean).join(' ');

  const valueContent = isInteractive ? (
    <span className="dsn-data-list-cell-interactive-content">{content}</span>
  ) : (
    <p className="dsn-data-list-cell-description">{description}</p>
  );

  return (
    <div
      className={rootClass}
      data-alignment={alignment}
      data-variant={variant}
      data-state={state}
      role="group"
      aria-label={ariaLabel}
    >
      {alignment === 'inline' ? (
        <>
          <div className="dsn-data-list-cell-title-wrapper">
            {showIcon && (
              <span className="dsn-data-list-cell-icon" aria-hidden="true">
                {icon ?? <DataListPlaceholderIcon />}
              </span>
            )}
            {showTitle && <p className="dsn-data-list-cell-title">{title}</p>}
          </div>

          <div className="dsn-data-list-cell-text-block">
            {valueContent}
          </div>

        </>
      ) : (
        <>
          <div className="dsn-data-list-cell-title-description-wrapper">
            <div className="dsn-data-list-cell-title-wrapper">
              {showIcon && (
                <span className="dsn-data-list-cell-icon" aria-hidden="true">
                  {icon ?? <DataListPlaceholderIcon />}
                </span>
              )}
              {showTitle && <p className="dsn-data-list-cell-title">{title}</p>}
            </div>
          </div>

          <div className="dsn-data-list-cell-text-block">
            {valueContent}
          </div>
        </>
      )}
      {showActions && (
        <span className="dsn-data-list-cell-actions">
          <Button
            variant="secondary"
            size="sm"
            showLabel={false}
            showLeadingIcon
            leadingIcon={<CopyIcon />}
            aria-label={actionAriaLabel}
            onClick={(event) => {
              event.stopPropagation();
              onActionClick?.(event);
            }}
          />
        </span>
      )}
    </div>
  );
}

export default DataListCell;
