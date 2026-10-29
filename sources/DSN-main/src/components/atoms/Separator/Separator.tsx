import './Separator.css';

// ─── Types ───────────────────────────────────────────────────────────────────

export type SeparatorDirection = 'horizontal' | 'vertical';

export interface SeparatorProps {
  /**
   * Orientation of the separator line.
   * - `horizontal` — spans the full width of its container (default)
   * - `vertical`   — spans the full height of its container
   * @default 'horizontal'
   */
  direction?: SeparatorDirection;

  /**
   * When `true`, marks the separator as purely decorative (`aria-hidden="true"`).
   * Use this when the separator has no semantic meaning and is just visual rhythm.
   * When `false` (default), the separator is exposed to assistive technology.
   * @default false
   */
  decorative?: boolean;

  /** Additional CSS class names merged onto the root element. */
  className?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function Separator({
  direction  = 'horizontal',
  decorative = false,
  className,
}: SeparatorProps) {
  const rootClass = ['dsn-separator', className].filter(Boolean).join(' ');

  if (direction === 'horizontal') {
    return (
      <hr
        className={rootClass}
        data-direction="horizontal"
        aria-hidden={decorative ? true : undefined}
      />
    );
  }

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      className={rootClass}
      data-direction="vertical"
      aria-hidden={decorative ? true : undefined}
    />
  );
}
