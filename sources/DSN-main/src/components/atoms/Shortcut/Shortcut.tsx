import './Shortcut.css';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Controls text colour (and the tint derived from it) so the badge stays
 * legible on any background it sits on.
 *
 * Maps to Figma "Content Color" property.
 * - `'default'`  → primary text on a faint tint. Use on light surfaces
 *                  (secondary buttons, menu cells, help text).
 * - `'inverted'` → inverted-primary text on a faint tint. Use on filled/dark surfaces
 *                  (primary button, dark tooltips, inverted panels).
 */
export type ShortcutContentColor = 'default' | 'inverted';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ShortcutProps {
  /**
   * The keyboard shortcut string displayed inside the badge.
   * Use platform-standard notation:
   * - Mac:           `⌘K`, `⌥⇧P`, `⌃⇧Z`
   * - Windows/Linux: `Ctrl+K`, `Alt+Shift+P`
   *
   * Keep to key characters only — no descriptive text inside the badge.
   *
   * Maps to Figma "Label" property.
   * @default '⌘ ↵'
   */
  label?: string;

  /**
   * Screen-reader equivalent of `label`.
   * Required because symbol characters (⌘, ⇧, ⌥, ⌃) are not reliably
   * announced by assistive technologies.
   *
   * Write out the key names in plain English:
   * e.g. `"Command K"`, `"Option Shift P"`, `"Control Shift Z"`
   */
  'aria-label': string;

  /**
   * Colour treatment of the badge content.
   * Maps to Figma "Content Color" property.
   * - `'default'`  — for light surfaces (secondary buttons, menus, help text).
   * - `'inverted'` — for filled/dark surfaces (primary button, dark tooltips).
   *
   * @default 'default'
   */
  contentColor?: ShortcutContentColor;

  /** Extra CSS class names merged onto the root element. */
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * **Shortcut** — a non-interactive display badge for keyboard shortcuts.
 *
 * Used inline within tooltips, menus, button labels, and help text to surface
 * available keyboard shortcuts. Never interactive — display element only.
 *
 * Styles live in `Shortcut.css` alongside this file. All CSS values reference
 * `tokens.css` via `var()`.
 *
 * ### Usage
 * ```tsx
 * // Default — on light surfaces (secondary buttons, menus)
 * <Shortcut label="⌘K" aria-label="Command K" />
 *
 * // Inverted — sitting on a Primary button or dark surface
 * <Shortcut label="⌘K" aria-label="Command K" contentColor="inverted" />
 * ```
 *
 * ### Accessibility
 * Always supply `aria-label` with plain-English key names — symbol characters
 * (⌘, ⇧, ⌥, ⌃) are not reliably announced by screen readers.
 *
 * @aiSelectWhen Surfacing an available keyboard shortcut inline in a button label, tooltip, menu, or help text
 * @aiSelectWhen The primary submit CTA — always include a Shortcut showing ⌘↵
 *
 * @aiAvoid Do not use for an interactive/clickable control — Shortcut is display-only
 * @aiAvoid Do not use to show descriptive text — key characters only, not phrases
 *
 * @aiVariant contentColor="default" — light surfaces (secondary buttons, menus, help text)
 * @aiVariant contentColor="inverted" — filled/dark surfaces (primary buttons, dark tooltips)
 *
 * @aiSpatial Sized intrinsically to its label content; no external margin
 *
 * @aiCompose Always required on the primary submit CTA per AGENTS.md
 */
export function Shortcut({
  label = '⌘ ↵',
  'aria-label': ariaLabel,
  contentColor = 'default',
  className,
}: ShortcutProps) {
  return (
    <span
      className={`dsn-shortcut${className ? ` ${className}` : ''}`}
      data-color={contentColor}
      aria-label={ariaLabel}
      role="img"
    >
      {/* Suppress <kbd> from the a11y tree — the aria-label on the
          wrapper already provides the full accessible description. */}
      <kbd
        className="dsn-shortcut-content"
        data-color={contentColor}
        aria-hidden="true"
      >
        {label}
      </kbd>
    </span>
  );
}

export default Shortcut;
