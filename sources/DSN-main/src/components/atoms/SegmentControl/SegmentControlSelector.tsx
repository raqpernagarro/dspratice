import React from 'react';

interface SegmentControlSelectorProps {
  id: string;
  label: string;
  active: boolean;
  disabled: boolean;
  tabIndex: number;
  showLeadingIcon?: boolean;
  leadingIcon?: React.ReactNode;
  showTrailingIcon?: boolean;
  trailingIcon?: React.ReactNode;
  onSelect: () => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
  onFocus: () => void;
  buttonRef: (node: HTMLButtonElement | null) => void;
  ariaLabel?: string;
}

/**
 * Internal role="radio" pill rendered by SegmentControl for each option — never mount directly.
 *
 * @aiAvoid Do not mount standalone or outside a SegmentControl group — use SegmentControl with an options array instead
 * @aiAvoid Do not use to build a custom multi-select pill list — use Chip instead
 *
 * @aiSpatial Owns its own label padding; equal-width sizing and spacing between selectors is computed by the parent SegmentControl
 *
 * @aiCompose Always a child of SegmentControl — active, tabIndex, and keyboard handling are supplied by the parent group
 */
export function SegmentControlSelector({
  id,
  label,
  active,
  disabled,
  tabIndex,
  showLeadingIcon = false,
  leadingIcon,
  showTrailingIcon = false,
  trailingIcon,
  onSelect,
  onKeyDown,
  onFocus,
  buttonRef,
  ariaLabel,
}: SegmentControlSelectorProps) {
  return (
    <button
      ref={buttonRef}
      id={id}
      type="button"
      className="dsn-segment-control-selector"
      role="radio"
      aria-checked={active}
      aria-disabled={disabled || undefined}
      aria-label={ariaLabel}
      data-active={active || undefined}
      disabled={disabled}
      tabIndex={tabIndex}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
    >
      {showLeadingIcon && leadingIcon && (
        <span className="dsn-segment-control-selector-icon" aria-hidden="true">
          {leadingIcon}
        </span>
      )}
      <span className="dsn-segment-control-selector-label-wrap">
        <span className="dsn-segment-control-selector-label">{label}</span>
      </span>
      {showTrailingIcon && trailingIcon && (
        <span className="dsn-segment-control-selector-icon" aria-hidden="true">
          {trailingIcon}
        </span>
      )}
    </button>
  );
}
