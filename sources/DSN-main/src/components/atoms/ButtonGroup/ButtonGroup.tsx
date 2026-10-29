import React from 'react';
import './ButtonGroup.css';

export type ButtonGroupSize = 'md' | 'sm';

export interface ButtonGroupProps {
  size?: ButtonGroupSize;
  /**
   * Adds standard spacing between adjacent buttons.
   * When false, buttons are glued edge-to-edge.
   * Mirrors the Figma variant `Space between=True`.
   * @default false
   */
  spaceBetween?: boolean;
  children: React.ReactNode;
  className?: string;
  'aria-label'?: string;
}

/**
 * Horizontal role="group" wrapper that lays out Button children glued or spaced.
 *
 * @aiSelectWhen Two or more related Buttons should read as a single control cluster
 *
 * @aiAvoid Do not use to fake a primary/secondary CTA pair next to EmptyState — use EmptyState's showMainCta/showSecondaryOption instead
 * @aiAvoid Do not use for a vertically stacked group — use ButtonGroupVertical instead
 * @aiAvoid Do not use when only one option can ever be selected — use SegmentControl instead
 *
 * @aiVariant spaceBetween=false — default, glued edge-to-edge with shared outer corner radius
 * @aiVariant spaceBetween=true — spaced apart, each button keeps its own corner radius
 *
 * @aiSpatial No internal padding; only applies gap between children (or removes it when glued). Sized to its children's combined intrinsic width
 *
 * @aiCompose Never mix Button sizes within one group — glued-mode corner radius assumes uniform size
 */
export function ButtonGroup({
  size = 'md',
  spaceBetween = false,
  children,
  className,
  'aria-label': ariaLabel = 'Button group',
}: ButtonGroupProps) {
  const rootClass = ['dsn-button-group', className].filter(Boolean).join(' ');

  return (
    <div
      className={rootClass}
      data-size={size}
      data-space-between={spaceBetween || undefined}
      role="group"
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
}

export default ButtonGroup;
