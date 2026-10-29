import React from 'react';
import './Button.css';
import { Shortcut } from '../Shortcut';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Visual hierarchy variant.
 *
 * - `'primary'`   — filled CTA. Highest visual weight. One per view.
 * - `'secondary'` — outlined surface. Supports the primary action.
 * - `'ghost'`     — transparent background. Utility / low-emphasis actions.
 * - `'plain'`     — text-only, no container. Lowest weight. `sm` size only.
 *
 * Maps to Figma "Variant" property.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'plain';

/**
 * Size of the button.
 *
 * - `'md'` — 32 px tall (`control/button/inset/standard` = 8 px padding).
 * - `'sm'` — 24 px tall (`control/button/inset/small` = 4 px padding).
 *
 * `plain` variant is available in `sm` only.
 *
 * Maps to Figma "Size" property (Medium → `md`, Small → `sm`).
 */
export type ButtonSize = 'sm' | 'md';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ButtonProps {
  /**
   * Visual hierarchy variant.
   * @default 'primary'
   */
  variant?: ButtonVariant;

  /**
   * Size of the button.
   * Controls padding (`control/button/inset/*`) and border-radius (`control/radius/*`).
   * Height is derived: padding × 2 + 16 px icon/text line-height.
   * @default 'md'
   */
  size?: ButtonSize;

  /**
   * Prevents all interaction. Maps to the native `disabled` attribute.
   * @default false
   */
  disabled?: boolean;

  /**
   * Processing state. Replaces the leading icon with a spinner, disables
   * interaction, and sets `aria-busy="true"`.
   * @default false
   */
  loading?: boolean;

  /**
   * Whether to render the leading icon slot.
   * Provide `leadingIcon` with the actual icon element.
   * Replaced by the spinner when `loading` is `true`.
   * @default false
   */
  showLeadingIcon?: boolean;

  /**
   * Icon element rendered in the leading position.
   * Use any 16 × 16 SVG icon component.
   */
  leadingIcon?: React.ReactNode;

  /**
   * Whether to show the label / `children`.
   * Set to `false` for icon-only buttons — always supply `aria-label`.
   * @default true
   */
  showLabel?: boolean;

  /** The button label text (or any inline ReactNode). */
  children?: React.ReactNode;

  /**
   * Whether to render the trailing icon slot.
   * Provide `trailingIcon` with the actual icon element.
   * Hidden when `loading` is `true`.
   * @default false
   */
  showTrailingIcon?: boolean;

  /**
   * Icon element rendered in the trailing position.
   * Use any 16 × 16 SVG icon component.
   */
  trailingIcon?: React.ReactNode;

  /**
   * Whether to render an inline keyboard shortcut badge.
   * Also supply `shortcutAriaLabel` (required by `<Shortcut>`).
   * Hidden when `loading` is `true`.
   * @default false
   */
  shortcut?: boolean;

  /**
   * Key string displayed inside the shortcut badge.
   * e.g. `'⌘K'`, `'⌘ ⇧ P'`, `'Ctrl K'`.
   * @default '⌘K'
   */
  shortcutLabel?: string;

  /**
   * Plain-English screen-reader label for the shortcut badge.
   * Required when `shortcut` is `true`. e.g. `'Command K'`.
   */
  shortcutAriaLabel?: string;

  /**
   * Applies danger/red colour treatment — signals an irreversible or harmful action.
   * Shares the same variants, sizes, and layout as the Main button.
   * Use sparingly; reserve for actions that cannot be undone or carry significant
   * consequences (e.g. "Delete record", "Remove member").
   * @default false
   */
  destructive?: boolean;

  /**
   * HTML `type` attribute on the underlying `<button>`.
   * @default 'button'
   */
  type?: 'button' | 'submit' | 'reset';

  /** Click handler. Not called when `disabled` or `loading`. */
  onClick?: React.MouseEventHandler<HTMLButtonElement>;

  /**
   * Accessible label. Required for icon-only buttons (when `showLabel={false}`).
   */
  'aria-label'?: string;

  /**
   * Indicates the button opens a popup (menu, listbox, dialog, etc.).
   * Use `"true"` or `"menu"` for dropdown triggers. Omit for regular buttons.
   */
  'aria-haspopup'?: boolean | 'false' | 'true' | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';

  /** Popup triggers only: whether the controlled popup is open. Pair with `aria-haspopup`. */
  'aria-expanded'?: boolean;

  /** Popup triggers only: id of the popup this button controls while it is open. */
  'aria-controls'?: string;

  /**
   * Stretch to the full width of the parent (auth forms, stacked CTAs).
   * @default false
   */
  fullWidth?: boolean;

  /** Additional CSS class names. */
  className?: string;

  /**
   * Overrides the default tab order. Use `-1` to remove the button from
   * sequential keyboard navigation while keeping it accessible to AT browse mode.
   */
  tabIndex?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * **Button** — triggers an action.
 *
 * Implements the DS-Ngr Main button specification with four variants,
 * two sizes, icon slots, keyboard shortcut badge, and loading state.
 *
 * Styles live in `Button.css` alongside this file. All CSS values reference
 * `tokens.css` via `var()` — adjust a token there to update all states at once.
 *
 * ### Layout
 * Height is controlled by padding alone (no explicit height):
 * - `md` — 8 px padding (all sides) + 16 px content = **32 px**
 * - `sm` — 4 px padding (all sides) + 16 px content = **24 px**
 *
 * ### Usage
 * ```tsx
 * // Primary
 * <Button onClick={save}>Save changes</Button>
 *
 * // Secondary with leading icon
 * <Button variant="secondary" showLeadingIcon leadingIcon={<DownloadIcon />}>
 *   Export
 * </Button>
 *
 * // Icon-only — aria-label is required
 * <Button variant="ghost" showLabel={false}
 *   showLeadingIcon leadingIcon={<MoreIcon />} aria-label="More options" />
 *
 * // Loading
 * <Button loading>Saving…</Button>
 * ```
 *
 * @aiSelectWhen User needs to trigger a one-off action (submit, confirm, open, execute)
 * @aiSelectWhen Action has a clear verb-led label ("Save changes", "Delete record")
 *
 * @aiAvoid Do not use for page navigation with no side effect — use a link instead
 * @aiAvoid Do not use to toggle a setting on/off — use Switcher instead
 * @aiAvoid Do not use to select one of a mutually exclusive set — use SegmentControl or Tab instead
 * @aiAvoid Do not use for a persistent active/inactive icon control — use ToggleButton instead
 * @aiAvoid Do not use for a stacked icon+label toolbar control — use VerticalButton instead
 *
 * @aiVariant variant="primary" — single highest-priority action, max one per view
 * @aiVariant variant="secondary" — supports primary or equal-weight alternative
 * @aiVariant variant="ghost" — low-emphasis utility action (filter, sort, copy)
 * @aiVariant variant="plain" — dismissive/space-constrained, size="sm" only
 *
 * @aiSpatial Owns its own padding (derived from size); has no external margin — spacing between buttons must come from the parent layout
 *
 * @aiCompose Never apply position: fixed/absolute — use Navbar rightActions for a fixed CTA instead
 * @aiCompose Never combine two variant="primary" buttons in the same group
 * @aiCompose Never mount standalone next to EmptyState — use EmptyState's showMainCta/showSecondaryOption instead
 */
export function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  destructive = false,
  showLeadingIcon = false,
  leadingIcon,
  showLabel = true,
  children,
  showTrailingIcon = false,
  trailingIcon,
  shortcut = false,
  shortcutLabel = '⌘K',
  shortcutAriaLabel,
  type = 'button',
  onClick,
  'aria-label': ariaLabel,
  'aria-haspopup': ariaHasPopup,
  'aria-expanded': ariaExpanded,
  'aria-controls': ariaControls,
  fullWidth = false,
  className,
  tabIndex,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  // Shortcut badge silently omitted when aria-label is missing (inaccessible)
  const showShortcutBadge = shortcut && !loading && Boolean(shortcutAriaLabel);

  // Shortcut uses inverted colour treatment on filled (primary) surfaces
  const shortcutContentColor = variant === 'primary' ? 'inverted' : 'default';

  return (
    <button
      type={type}
      className={[
        'dsn-button',
        fullWidth ? 'dsn-button--block' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      data-variant={variant}
      data-size={size}
      data-destructive={destructive || undefined}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      aria-label={ariaLabel}
      aria-haspopup={ariaHasPopup}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      tabIndex={tabIndex}
      onClick={onClick}
    >
      {/* Loading spinner replaces the leading icon slot */}
      {loading ? (
        <span className="dsn-button-spinner" aria-hidden="true" />
      ) : (
        showLeadingIcon &&
        leadingIcon != null && (
          <span className="dsn-button-icon" aria-hidden="true">{leadingIcon}</span>
        )
      )}

      {/* Label with optical alignment wrapper */}
      {showLabel && (
        <span className="dsn-button-label">{children}</span>
      )}

      {/* Trailing icon — hidden while loading */}
      {!loading && showTrailingIcon && trailingIcon != null && (
        <span className="dsn-button-icon" aria-hidden="true">{trailingIcon}</span>
      )}

      {/* Keyboard shortcut badge — hidden while loading */}
      {showShortcutBadge && (
        <Shortcut
          label={shortcutLabel}
          aria-label={shortcutAriaLabel as string}
          contentColor={shortcutContentColor}
        />
      )}
    </button>
  );
}

export default Button;
