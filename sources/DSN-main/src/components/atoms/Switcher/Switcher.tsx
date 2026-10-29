import { renderIcon, type IconSource } from '../../../types/icon';
import './Switcher.css';

// ─── Types ───────────────────────────────────────────────────────────────────

export type SwitcherSize = 'md' | 'sm';

export interface SwitcherProps {
  /**
   * Whether the switcher is currently on (true) or off (false).
   * This is a **controlled** prop — the consumer must update it in `onChange`.
   */
  checked: boolean;

  /**
   * Called when the user toggles the switcher. Receives the new value.
   * ```tsx
   * <Switcher checked={on} onChange={setOn} />
   * ```
   */
  onChange?: (checked: boolean) => void;

  /**
   * When true, the switcher is non-interactive and removed from tab order.
   * @default false
   */
  disabled?: boolean;

  /**
   * Visual size.
   * - `md` — default (48 × 32 px); use in standard settings panels
   * - `sm` — compact layouts (36 × 24 px)
   * @default 'md'
   */
  size?: SwitcherSize;

  /**
   * Native `id` forwarded to the root `<button>`, allowing a visible `<label>`
   * to associate via `htmlFor`. Prefer `aria-labelledby` when the label is a
   * sibling rendered by the same component.
   */
  id?: string;

  /**
   * Accessible label used when there is **no visible label element**.
   * When a visible label exists, use `aria-labelledby` instead.
   */
  'aria-label'?: string;

  /**
   * Points to the `id` of the visible label element. Preferred over
   * `aria-label` when a visible text label is present.
   */
  'aria-labelledby'?: string;

  /**
   * Short text rendered inside the track (e.g. "On"/"Off"). Visual only —
   * the accessible name still comes from `aria-label` / `aria-labelledby`.
   * Figma: `Label`. Shown when `showLabel` is true.
   */
  label?: string;

  /** Render `label` inside the track. Figma: `Show label`. @default false */
  showLabel?: boolean;

  /**
   * Icon rendered inside the track. Figma: `Icon`. Shown when `showIcon` is true.
   * Accepts a Lucide component (`Moon`) or an element (`<Moon />`).
   */
  icon?: IconSource;

  /** Render `icon` inside the track. Figma: `Show icon`. @default false */
  showIcon?: boolean;

  /** Additional CSS class names merged onto the root `<button>`. */
  className?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function Switcher({
  checked,
  onChange,
  disabled   = false,
  size       = 'md',
  label,
  showLabel  = false,
  icon,
  showIcon   = false,
  id,
  className,
  'aria-label':       ariaLabel,
  'aria-labelledby':  ariaLabelledby,
}: SwitcherProps) {
  const rootClass = ['dsn-switcher', className].filter(Boolean).join(' ');
  const hasIcon = showIcon && Boolean(icon);
  const hasLabel = showLabel && Boolean(label);
  const hasContent = hasIcon || hasLabel;

  function handleClick() {
    onChange?.(!checked);
  }

  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-disabled={disabled ? true : undefined}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      className={rootClass}
      data-size={size}
      data-checked={checked}
      data-has-content={hasContent || undefined}
      onClick={handleClick}
    >
      {/* Track — the visual pill */}
      <span className="dsn-switcher-track" aria-hidden="true">
        {/* Thumb — the sliding circle */}
        <span className="dsn-switcher-thumb" />
        {hasContent && (
          <span className="dsn-switcher-content">
            {hasIcon && <span className="dsn-switcher-icon">{renderIcon(icon, 16)}</span>}
            {hasLabel && <span className="dsn-switcher-label">{label}</span>}
          </span>
        )}
      </span>
    </button>
  );
}
