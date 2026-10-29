import React from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '../../Button/Button';
import type { ButtonSize } from '../../Button/Button';
import './SplitButton.css';

export type SplitButtonSize = ButtonSize; // 'sm' | 'md'

/** Visual hierarchy variant applied to both button segments. */
export type SplitButtonVariant = 'primary' | 'secondary';

export interface SplitButtonProps {
  /** 'md' = 32 px (default). 'sm' = 24 px for dense layouts. */
  size?: SplitButtonSize;
  /** Visual hierarchy variant. Applied to both button segments. @default 'secondary' */
  variant?: SplitButtonVariant;
  /** Label text for the main action button. */
  children?: React.ReactNode;
  /** Optional leading icon for the main action button. */
  leadingIcon?: React.ReactNode;
  /** Disables both button segments. */
  disabled?: boolean;
  /** Loading state on the main button; trigger is also disabled while loading. */
  loading?: boolean;
  /**
   * Icon displayed in the trigger (dropdown) button.
   * Defaults to a built-in ChevronDown if omitted.
   */
  triggerIcon?: React.ReactNode;
  /** Click handler for the main action button. */
  onMainClick?: React.MouseEventHandler<HTMLButtonElement>;
  /** Click handler for the trigger (dropdown) button. */
  onDropdownClick?: React.MouseEventHandler<HTMLButtonElement>;
  /**
   * Whether the menu opened by the trigger is currently open. Sets `aria-expanded`
   * on the trigger; pass it whenever you render the menu from `onDropdownClick`.
   */
  open?: boolean;
  /** Accessible label for the trigger button. Defaults to "More options". */
  dropdownAriaLabel?: string;
  className?: string;
}

/**
 * Two joined segments: a labelled main action and an icon-only trigger that opens related alternatives.
 *
 * @aiSelectWhen One action is the default and a small set of related alternatives exists
 *
 * @aiAvoid Do not use when there is no default action — use Button with a trailing chevron and PopoverMenu instead
 * @aiAvoid Do not use for several independent actions — use ButtonGroup instead
 * @aiAvoid Do not use for persistent single selection — use SegmentControl instead
 *
 * @aiVariant variant="secondary" — supporting actions (default)
 * @aiVariant variant="primary" — the page's one primary CTA in Navbar rightActions
 *
 * @aiSpatial Sizes to content; the wrapper owns the shared corners and shadow.
 *
 * @aiCompose onDropdownClick must open a PopoverMenu anchored to the SplitButton — it renders no menu itself
 * @aiCompose Pass open with the menu's open state so the trigger announces aria-expanded
 */
// TODO(DSN-POPOVER): when SplitButton renders a menu directly, wire it through
// PopoverWrapper anchored positioning (below-first, flip fallback, viewport clamping).
export function SplitButton({
  size = 'md',
  variant = 'secondary',
  children,
  leadingIcon,
  disabled = false,
  loading = false,
  triggerIcon,
  onMainClick,
  onDropdownClick,
  open,
  dropdownAriaLabel = 'More options',
  className,
}: SplitButtonProps) {
  const resolvedTriggerIcon = (
    triggerIcon ?? <ChevronDown size={16} strokeWidth={1.5} aria-hidden="true" />
  );

  return (
    <div
      className={`dsn-split-button${className ? ` ${className}` : ''}`}
      data-size={size}
      role="group"
    >
      {/* Main action button */}
      <Button
        variant={variant}
        size={size}
        showLeadingIcon={leadingIcon != null}
        leadingIcon={leadingIcon}
        disabled={disabled}
        loading={loading}
        onClick={onMainClick}
      >
        {children}
      </Button>

      {/* Trigger / dropdown button — icon only */}
      <Button
        variant={variant}
        size={size}
        showLabel={false}
        showLeadingIcon={true}
        leadingIcon={resolvedTriggerIcon}
        disabled={disabled || loading}
        aria-label={dropdownAriaLabel}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={onDropdownClick}
      />
    </div>
  );
}

export default SplitButton;
