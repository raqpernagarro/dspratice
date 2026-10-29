import React from 'react';
import { ChevronDown, X } from 'lucide-react';
import { Button } from '../../atoms/Button/Button';
import { ButtonGroup } from '../../atoms/ButtonGroup/ButtonGroup';
import './BulkActionBar.css';

export interface BulkAction {
  /** Button label text. Build count-aware labels in the consumer (e.g. "Delete 4"). */
  label: string;
  /** Leading icon — 16×16 Lucide element. */
  icon?: React.ReactNode;
  /** Click handler. */
  onClick: () => void;
  /** When true, shows a ChevronDown trailing icon and sets aria-haspopup="menu". */
  hasDropdown?: boolean;
  /** Applies destructive (red) color treatment. */
  destructive?: boolean;
  /** Disables this specific action. */
  disabled?: boolean;
  /** Required when `icon` is provided and `label` is ambiguous for screen readers. */
  'aria-label'?: string;
}

export interface BulkActionBarProps {
  /** Number of currently selected items. */
  selectedCount: number;
  /**
   * Called when the count/selection button is clicked.
   * Use to open a selection summary, filter, or context menu.
   */
  onCountClick?: React.MouseEventHandler<HTMLButtonElement>;
  /** Called when the × dismiss button is clicked — should clear the selection. */
  onDismiss: React.MouseEventHandler<HTMLButtonElement>;
  /** Contextual action buttons rendered in the right section. */
  actions: BulkAction[];
  /** Additional CSS class on the root element. */
  className?: string;
}

/**
 * Floating toolbar showing the selected-item count, bulk actions for the selection, and a clear button.
 *
 * @aiSelectWhen Rows are selected in a multi-select DataTable or list and actions apply to all of them
 *
 * @aiAvoid Do not use for page-level actions — use Navbar rightActions instead
 * @aiAvoid Do not use for filter and view controls — use Toolbar instead
 * @aiAvoid Do not use for single-row actions — use row-level ghost Button instead
 *
 * @aiSpatial Sizes to content and never positions itself — position an absolute wrapper inside a relative container around the DataTable.
 *
 * @aiCompose Render only when selectedCount > 0; action labels are count-aware ("Delete 3")
 * @aiCompose onDismiss must clear the entire selection
 */
export function BulkActionBar({
  selectedCount,
  onCountClick,
  onDismiss,
  actions,
  className,
}: BulkActionBarProps) {
  const itemLabel = selectedCount === 1 ? 'item' : 'items';

  return (
    <div
      className={`dsn-bulk-action-bar${className ? ` ${className}` : ''}`}
      role="toolbar"
      aria-label={`${selectedCount} ${itemLabel} selected`}
    >
      <div className="dsn-bulk-action-bar-container">

        {/* Left: isolated count button with chevron */}
        <Button
          variant="ghost"
          size="md"
          showLabel
          showTrailingIcon
          trailingIcon={<ChevronDown size={16} strokeWidth={1.5} aria-hidden="true" />}
          onClick={onCountClick}
          aria-label={`${selectedCount} selected, click to view selection options`}
        >
          {selectedCount} selected
        </Button>

        {/* Right: contextual actions + dismiss (X) icon button */}
        <ButtonGroup size="md" spaceBetween aria-label="Bulk actions">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="secondary"
              size="md"
              showLeadingIcon={action.icon != null}
              leadingIcon={action.icon}
              showLabel
              showTrailingIcon={action.hasDropdown}
              trailingIcon={
                action.hasDropdown
                  ? <ChevronDown size={16} strokeWidth={1.5} aria-hidden="true" />
                  : undefined
              }
              destructive={action.destructive}
              disabled={action.disabled}
              onClick={action.onClick}
              aria-haspopup={action.hasDropdown ? 'menu' : undefined}
              aria-label={action['aria-label']}
            >
              {action.label}
            </Button>
          ))}
          <Button
            variant="ghost"
            size="md"
            showLabel={false}
            showLeadingIcon
            leadingIcon={<X size={16} strokeWidth={1.5} aria-hidden="true" />}
            onClick={onDismiss}
            aria-label="Clear selection"
          />
        </ButtonGroup>

      </div>
    </div>
  );
}

export default BulkActionBar;
