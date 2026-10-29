import React from 'react';
import { X } from 'lucide-react';
import { AvatarGroup, type AvatarItem } from '../Avatar';
import { renderIcon, type IconSource } from '../../../types/icon';
import './Chip.css';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ChipSize = 'md' | 'sm';

export interface ChipProps {
  /**
   * The text label displayed inside the chip.
   * Keep to 1–3 words. Use sentence case ("In progress", not "In Progress").
   */
  label: string;

  /**
   * Whether the chip is in its active/on state — a filter is applied, an option
   * is chosen, etc. Clicking a selected chip deselects it.
   * @default false
   */
  selected?: boolean;

  /**
   * When true, the chip is non-interactive. Uses `aria-disabled` rather than
   * the native `disabled` attribute so the chip remains in the tab/reading order.
   * @default false
   */
  disabled?: boolean;

  /**
   * Visual size.
   * - `md` — default; use in standard filter bars and option sets (32px height)
   * - `sm` — compact layouts, dense filter panels (24px height)
   * @default 'md'
   */
  size?: ChipSize;

  /**
   * Replaces the default CSS diamond in the **leading** position with any Lucide
   * icon. Accepts a component (`Star`) or an element (`<Star />`).
   */
  leadingIcon?: IconSource;
  /**
   * Whether the leading icon slot is rendered.
   * @default true
   */
  showLeadingIcon?: boolean;

  /**
   * Replaces the default CSS diamond in the **trailing** position with any
   * Lucide icon. Ignored when `onDismiss` is provided (the dismiss × takes
   * the trailing slot instead). Accepts a component or an element.
   */
  trailingIcon?: IconSource;
  /**
   * Whether the trailing icon slot is rendered.
   * Ignored when `onDismiss` is provided.
   * @default true
   */
  showTrailingIcon?: boolean;

  /**
   * Whether the visible label is rendered. When false, `label` is still used
   * as the accessible name. Figma: `Show label`.
   * @default true
   */
  showLabel?: boolean;

  /**
   * Whether to render an extra-extra-small AvatarGroup before the label.
   * Figma: `Show avatar`. Requires `avatars`.
   * @default false
   */
  showAvatar?: boolean;

  /** People shown when `showAvatar` is true. */
  avatars?: AvatarItem[];

  /**
   * When provided, renders a dismiss (×) button in the trailing position.
   * The dismiss button has `aria-label="Remove {label}"` automatically.
   * Calling `onDismiss` removes the chip value; it does NOT toggle selection.
   */
  onDismiss?: () => void;

  /**
   * Ref to focus when this chip is dismissed and there are no adjacent chips
   * to move focus to — e.g. the search input in a combobox chip stack.
   * When omitted, focus moves to the nearest sibling dismiss button if one
   * exists; otherwise focus is left unmanaged.
   */
  dismissFocusFallback?: React.RefObject<HTMLElement | null>;

  /**
   * Click / keyboard handler invoked when the user toggles the chip.
   * The consumer is responsible for updating `selected` in response.
   */
  onClick?: () => void;

  /** Additional CSS class names merged onto the root element. */
  className?: string;

  /**
   * Accessible label for the chip. Falls back to the visible `label` text.
   * Useful when the visual label alone is ambiguous in context.
   */
  'aria-label'?: string;
}

export interface ChipGroupProps {
  /**
   * Accessible label for the group, announced by screen readers.
   * Describe the set: "Filter by status", "Select categories".
   */
  label: string;

  /** One or more Chip elements. */
  children: React.ReactNode;

  /** Additional CSS class names merged onto the group element. */
  className?: string;
}

// ─── Chip ────────────────────────────────────────────────────────────────────

export function Chip({
  label,
  selected   = false,
  disabled   = false,
  size       = 'md',
  leadingIcon,
  trailingIcon,
  showLeadingIcon = true,
  showTrailingIcon = true,
  showLabel = true,
  showAvatar = false,
  avatars,
  onDismiss,
  onClick,
  className,
  'aria-label': ariaLabel,
  dismissFocusFallback,
}: ChipProps) {
  const rootClass = ['dsn-chip', className].filter(Boolean).join(' ');

  // When only a dismiss handler is provided (token/tag mode) the chip itself
  // is a non-interactive visual container — the dismiss <button> is the sole
  // interactive element, avoiding a nested-interactive ARIA violation.
  const isDismissToken = Boolean(onDismiss) && !onClick;

  // Space / Enter toggles the chip; Delete / Backspace dismisses it.
  // Only attached when the chip root is interactive (toggle mode).
  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.key === ' ' || e.key === 'Enter') && !disabled) {
      e.preventDefault();
      onClick?.();
      return;
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') && onDismiss && !disabled) {
      e.preventDefault();
      onDismiss();
    }
  }

  const content = (
    <>
      {/* Leading icon — CSS diamond (default) or custom Lucide icon */}
      {showLeadingIcon && (
        <span
          className="dsn-chip-leading"
          aria-hidden="true"
          data-icon={leadingIcon ? 'custom' : undefined}
        >
          {renderIcon(leadingIcon, 12)}
        </span>
      )}

      {showAvatar && avatars && avatars.length > 0 && (
        <AvatarGroup className="dsn-chip-avatar" size="xxs" avatars={avatars} maxVisible={3} />
      )}

      {/* Label — visually hidden (still the accessible name) when showLabel is false */}
      {showLabel && <span className="dsn-chip-label">{label}</span>}

      {/* Trailing slot — dismiss button OR custom/default icon */}
      {onDismiss ? (
        <button
          type="button"
          className="dsn-chip-dismiss"
          aria-label={`Remove ${label}`}
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            // Shift focus to the adjacent sibling dismiss button before this
            // chip unmounts, so keyboard users keep their place in the list.
            // Falls back to dismissFocusFallback (e.g. a combobox input) when
            // no sibling dismiss button exists.
            const btn = e.currentTarget;
            const groupEl = btn.closest('[role="list"],[role="group"]')
              ?? btn.parentElement?.parentElement;
            if (groupEl) {
              const allButtons = Array.from(
                groupEl.querySelectorAll<HTMLElement>('button.dsn-chip-dismiss'),
              );
              const idx = allButtons.indexOf(btn);
              const nextFocus = allButtons[idx + 1] ?? allButtons[idx - 1] ?? null;
              if (nextFocus) {
                nextFocus.focus();
              } else {
                dismissFocusFallback?.current?.focus();
              }
            } else {
              dismissFocusFallback?.current?.focus();
            }
            onDismiss();
          }}
          onKeyDown={(e) => {
            // In token mode the chip root is not focusable, so Delete/Backspace
            // must be handled on the dismiss button itself.
            if (isDismissToken && (e.key === 'Delete' || e.key === 'Backspace') && !disabled) {
              e.preventDefault();
              onDismiss();
            }
          }}
        >
          <X size={12} aria-hidden="true" />
        </button>
      ) : showTrailingIcon ? (
        <span
          className="dsn-chip-trailing"
          aria-hidden="true"
          data-icon={trailingIcon ? 'custom' : undefined}
        >
          {renderIcon(trailingIcon, 12)}
        </span>
      ) : null}
    </>
  );

  // Token mode — non-interactive container, dismiss button is the only focusable element.
  if (isDismissToken) {
    return (
      <div
        className={rootClass}
        data-size={size}
        data-selected={selected}
        aria-disabled={disabled ? true : undefined}
      >
        {content}
      </div>
    );
  }

  // Toggle mode — the chip root carries role="checkbox" and is the interactive element.
  return (
    <div
      role="checkbox"
      aria-checked={selected}
      aria-disabled={disabled ? true : undefined}
      tabIndex={disabled ? -1 : 0}
      className={rootClass}
      data-size={size}
      data-selected={selected}
      onClick={!disabled ? onClick : undefined}
      onKeyDown={handleKeyDown}
      aria-label={ariaLabel ?? (showLabel ? undefined : label)}
    >
      {content}
    </div>
  );
}

// ─── ChipGroup ────────────────────────────────────────────────────────────────

export function ChipGroup({ label, children, className }: ChipGroupProps) {
  const rootClass = ['dsn-chip-group', className].filter(Boolean).join(' ');

  return (
    // role="list" with <li> wrappers: announces count to screen readers and
    // satisfies aria-required-children. Each chip carries its own ARIA role
    // (checkbox for toggle chips, or the dismiss button for token chips).
    <ul role="list" aria-label={label} className={rootClass}>
      {React.Children.map(children, (child) =>
        child == null ? null : <li className="dsn-chip-group-item">{child}</li>,
      )}
    </ul>
  );
}
