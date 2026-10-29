import React from 'react';
import './ButtonGroupVertical.css';

export type ButtonGroupVerticalSize = 'md' | 'sm';

export interface ButtonGroupVerticalProps {
  size?: ButtonGroupVerticalSize;
  /**
   * Adds standard spacing between vertically stacked buttons.
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
 * Vertical role="group" wrapper that stacks Button children glued or spaced.
 *
 * @aiSelectWhen Two or more related Buttons should be stacked as a single vertical cluster
 *
 * @aiAvoid Do not use for a horizontally laid-out group — use ButtonGroup instead
 * @aiAvoid Do not use for stacked icon+label buttons — use VerticalButton for each item instead
 * @aiAvoid Do not use when only one option can ever be selected — use SegmentControl instead
 *
 * @aiVariant spaceBetween=false — default, glued edge-to-edge with shared top/bottom corner radius
 * @aiVariant spaceBetween=true — spaced apart, each button keeps its own corner radius
 *
 * @aiSpatial No internal padding; only applies gap between children (or removes it when glued). Column layout; children stretch to the widest button so all share one width
 *
 * @aiCompose Never mix Button sizes within one group — glued-mode corner radius assumes uniform size
 */
export function ButtonGroupVertical({
  size = 'md',
  spaceBetween = false,
  children,
  className,
  'aria-label': ariaLabel = 'Button group vertical',
}: ButtonGroupVerticalProps) {
  const rootClass = ['dsn-button-group-vertical', className].filter(Boolean).join(' ');

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

export default ButtonGroupVertical;
