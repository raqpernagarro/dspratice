import type { MouseEventHandler, ReactNode } from 'react';
import { type ButtonSize, type ButtonVariant } from './Button';
import './ToggleButton.css';

export type ToggleButtonSize = ButtonSize;
export type ToggleButtonVariant = Exclude<ButtonVariant, 'plain'>;

export interface ToggleButtonProps {
  size?: ToggleButtonSize;
  variant?: ToggleButtonVariant;
  selected?: boolean;
  disabled?: boolean;
  /** Icon shown before the label. Figma: `Leading icon`. */
  leadingIcon?: ReactNode;
  /** Render the leading icon. Figma: `Show leading icon`. @default true */
  showLeadingIcon?: boolean;
  /** @deprecated Use `leadingIcon`. */
  icon?: ReactNode;
  /** Visible text label. Figma: `Label`. Rendered when `showLabel` is true. */
  label?: string;
  /** Render `label` next to the icon. Figma: `Show label`. @default false */
  showLabel?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  onSelectedChange?: (selected: boolean) => void;
  className?: string;
  /** Required when no visible label is shown (icon-only). */
  'aria-label'?: string;
}

/**
 * Icon-only button with a persistent selected/pressed state (aria-pressed).
 *
 * @aiSelectWhen Persistent active/inactive icon control in a toolbar (bold, italic, view mode)
 * @aiSelectWhen A boolean state the user can re-toggle, communicated by icon alone
 *
 * @aiAvoid Do not use for a one-off action with no persistent state — use Button instead
 * @aiAvoid Do not use for a stacked icon+label control — use VerticalButton instead
 * @aiAvoid Do not use for one of several mutually exclusive options — use SegmentControl or Tab instead
 *
 * @aiVariant variant="ghost" — default, standard toolbar toggle
 * @aiVariant variant="secondary" — more visual weight, standalone toggle
 * @aiVariant variant="primary" — rare, toggle is the primary interactive element
 *
 * @aiSpatial Icon-only by default (optional visible label via showLabel); sized to its content. Spacing between adjacent ToggleButtons must come from the parent (ButtonGroup gap or flex gap)
 *
 * @aiCompose Commonly used inside ButtonGroup or Toolbar for grouped toggle controls
 */
export function ToggleButton({
  size = 'md',
  variant = 'ghost',
  selected = false,
  disabled = false,
  leadingIcon,
  showLeadingIcon = true,
  icon,
  label,
  showLabel = false,
  onClick,
  onSelectedChange,
  className,
  'aria-label': ariaLabel,
}: ToggleButtonProps) {
  const iconNode = leadingIcon ?? icon;
  const hasLabel = showLabel && Boolean(label);
  return (
    <button
      type="button"
      className={['dsn-toggle-button', className].filter(Boolean).join(' ')}
      data-size={size}
      data-variant={variant}
      data-selected={selected || undefined}
      disabled={disabled}
      aria-label={ariaLabel ?? (hasLabel ? undefined : label)}
      aria-pressed={selected}
      onClick={(event) => {
        if (disabled) {
          return;
        }
        onSelectedChange?.(!selected);
        onClick?.(event);
      }}
    >
      {showLeadingIcon && iconNode && (
        <span className="dsn-toggle-button-icon" aria-hidden="true">
          {iconNode}
        </span>
      )}
      {hasLabel && <span className="dsn-toggle-button-label">{label}</span>}
    </button>
  );
}

export default ToggleButton;
