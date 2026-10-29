import React, { useLayoutEffect, useRef, useState } from 'react';
import { Button, type ButtonSize, type ButtonVariant } from '../../atoms/Button';
import { Checkbox, type CheckboxSize } from '../../atoms/Checkbox';
import { SearchBar } from '../../atoms/SearchBar';
import { SegmentControl } from '../../atoms/SegmentControl';
import './Toolbar.css';

export type ToolbarSize = 'lg' | 'md' | 'sm';
export type ToolbarVariant = 'default' | 'filter-bar' | 'plain';

const TOOLBAR_ACTION_SELECTOR = 'button, a[href], [role="button"]';

export interface ToolbarProps {
  size?: ToolbarSize;
  variant?: ToolbarVariant;
  leftActions?: React.ReactNode;
  rightActions?: React.ReactNode;
  /** Opt-in: a lone action spans the bar. Off by default — toolbar buttons hug their content. */
  singleActionFullWidth?: boolean;
  className?: string;
  'aria-label'?: string;
}

function normalizeToolbarControlSizes(
  node: React.ReactNode,
  size: ToolbarSize,
  variant: ToolbarVariant,
): React.ReactNode {
  const normalizedButtonSize: ButtonSize = size === 'sm' ? 'sm' : 'md';
  const normalizedCheckboxSize: CheckboxSize = size === 'sm' ? 'sm' : 'md';

  return React.Children.map(node, (child) => {
    if (!React.isValidElement(child)) return child;

    const normalizedChildren = normalizeToolbarControlSizes(
      (child.props as { children?: React.ReactNode }).children,
      size,
      variant,
    );

    if (child.type === Button) {
      const requestedVariant = (child.props as { variant?: ButtonVariant }).variant;
      const normalizedVariant: ButtonVariant =
        requestedVariant === 'plain' ? 'secondary' : (requestedVariant ?? 'primary');

      return React.cloneElement(child, {
        variant: normalizedVariant,
        size: normalizedButtonSize,
        children: normalizedChildren,
      } as Partial<React.ComponentProps<typeof Button>>);
    }

    if (child.type === Checkbox) {
      return React.cloneElement(child, {
        size: normalizedCheckboxSize,
        children: normalizedChildren,
      } as Partial<React.ComponentProps<typeof Checkbox>>);
    }

    // A toolbar is a single compact row, like a bottom bar — a SearchBar inside it is always
    // the ghost variant (no label or helper row). The dropped label becomes the accessible name.
    if (child.type === SearchBar) {
      const searchProps = child.props as React.ComponentProps<typeof SearchBar>;
      return React.cloneElement(child, {
        variant: 'ghost',
        'aria-label': searchProps['aria-label'] ?? searchProps.label ?? searchProps.placeholder,
      } as Partial<React.ComponentProps<typeof SearchBar>>);
    }

    // Filter bars hold several controls — a SegmentControl there always hugs its content.
    if (child.type === SegmentControl && variant === 'filter-bar') {
      return React.cloneElement(child, {
        fullWidth: false,
      } as Partial<React.ComponentProps<typeof SegmentControl>>);
    }

    return React.cloneElement(child, {
      children: normalizedChildren,
    } as { children?: React.ReactNode });
  });
}

/**
 * Two-sided action row (role="toolbar") that auto-normalizes the size/variant of Button and Checkbox children.
 *
 * @aiSelectWhen Used as the bottom bar of Card, Modal, or Drawer via their bottomBar* props
 * @aiSelectWhen Used standalone on top of a list or section — always variant="filter-bar"
 *
 * @aiAvoid Do not mount a standalone Toolbar inside Card/Modal/Drawer content as a footer — use the organism's bottomBarLeftActions/bottomBarRightActions/bottomBar props instead
 * @aiAvoid Do not use for a single icon-only persistent toggle control — use ToggleButton instead
 * @aiAvoid Do not use for view-switching tabs — use SegmentControl or Tabs instead
 *
 * @aiVariant variant="default" — bottom of a section (Card/Modal/Drawer bottom bar); casts an upward elevation shadow
 * @aiVariant variant="filter-bar" — any toolbar on top of a list or section (search/filter row above DataTable, board, list); looks like a bottom bar (same background, padding, compact single row) minus the elevation shadow
 * @aiVariant variant="plain" — minimal, chrome-light toolbar context
 *
 * @aiCompose A SearchBar inside a Toolbar is always forced to variant="ghost" — never put a labeled field (label/helper row) in a toolbar
 *
 * @aiSpatial Owns internal padding and left/right gap, fills its container width, but does not space itself from siblings — never add padding/margin/gap to a Toolbar instance.
 * @aiSpatial Buttons are never full width by default — a lone action hugs its content; opt in with singleActionFullWidth only when explicitly designed.
 *
 * @aiCompose Never mount Toolbar inside DataTable — place filter bars as a sibling above it
 */
export function Toolbar({
  size = 'lg',
  variant = 'default',
  leftActions,
  rightActions,
  singleActionFullWidth = false,
  className,
  'aria-label': ariaLabel = 'Toolbar',
}: ToolbarProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [singleAction, setSingleAction] = useState(false);
  const rootClass = ['dsn-toolbar', className].filter(Boolean).join(' ');
  const normalizedLeftActions = normalizeToolbarControlSizes(leftActions, size, variant);
  const normalizedRightActions = normalizeToolbarControlSizes(rightActions, size, variant);

  useLayoutEffect(() => {
    if (!singleActionFullWidth) {
      setSingleAction(false);
      return;
    }
    const bar = rootRef.current;
    if (!bar) {
      setSingleAction(false);
      return;
    }
    const update = () =>
      setSingleAction(bar.querySelectorAll(TOOLBAR_ACTION_SELECTOR).length === 1);
    update();
    const observer = new MutationObserver(update);
    observer.observe(bar, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [leftActions, rightActions, singleActionFullWidth]);

  return (
    <div
      ref={rootRef}
      className={rootClass}
      data-size={size}
      data-variant={variant}
      data-single-action={singleAction || undefined}
      role="toolbar"
      aria-label={ariaLabel}
    >
      <div className="dsn-toolbar-side dsn-toolbar-side-left">{normalizedLeftActions}</div>
      <div className="dsn-toolbar-side dsn-toolbar-side-right">{normalizedRightActions}</div>
    </div>
  );
}

export default Toolbar;
