import { cloneElement, isValidElement, type ReactElement } from 'react';
import type { LucideIcon, LucideProps } from 'lucide-react';

/**
 * An icon slot value. Accepts either a Lucide component reference (`Star`)
 * or a rendered element (`<Star />`), so every icon prop in the library takes
 * the same shape as Button's `leadingIcon` and Figma Code Connect snippets
 * stay valid whichever form they emit.
 */
export type IconSource = LucideIcon | ReactElement;

/**
 * Renders an IconSource with the slot's default Lucide props (size, strokeWidth…).
 * Props already set on a rendered element win over the defaults.
 * A bare number is shorthand for `{ size }`.
 */
export function renderIcon(
  icon: IconSource | undefined | null,
  defaults?: number | LucideProps,
): ReactElement | null {
  if (!icon) return null;
  const base: LucideProps = typeof defaults === 'number' ? { size: defaults } : { ...defaults };
  if (isValidElement<LucideProps>(icon)) {
    const own = Object.fromEntries(
      Object.entries(icon.props).filter(([, value]) => value !== undefined),
    );
    return cloneElement(icon, { ...base, ...own, 'aria-hidden': true });
  }
  const Icon = icon as LucideIcon;
  return <Icon {...base} aria-hidden="true" />;
}
