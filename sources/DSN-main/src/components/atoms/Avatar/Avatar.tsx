import React, { useRef } from 'react';
import { User, Building2, Plus } from 'lucide-react';
import { Button } from '../Button/Button';
import { renderIcon, type IconSource } from '../../../types/icon';
import './Avatar.css';

const AVATAR_GROUP_ITEM_SELECTOR = ':scope > .dsn-avatar, :scope > .dsn-avatar-group-overflow';

/** Distance-falloff hover — coefficients from the transitions.dev avatar-group-hover recipe. */
const AVATAR_GROUP_HOVER_FALLOFF = 0.45;
const AVATAR_GROUP_HOVER_SCALE = 1.05;
const AVATAR_GROUP_EASE_IN = 'cubic-bezier(0.22, 1, 0.36, 1)';
const AVATAR_GROUP_EASE_OUT = 'cubic-bezier(0.34, 3.85, 0.64, 1)';

function applyAvatarGroupHover(
  root: HTMLElement,
  activeIdx: number | null,
  phase: 'in' | 'out',
) {
  const items = Array.from(root.querySelectorAll<HTMLElement>(AVATAR_GROUP_ITEM_SELECTOR));
  const liftPx = parseFloat(getComputedStyle(root).getPropertyValue('--space-2xs')) || 4;
  const lift = -liftPx;
  const timingFunction = phase === 'out' ? AVATAR_GROUP_EASE_OUT : AVATAR_GROUP_EASE_IN;

  items.forEach((el, i) => {
    // Timing function must be set before --dsn-avatar-* so the new transition
    // picks up ease-in on hover and the spring overshoot on leave.
    el.style.transitionTimingFunction = timingFunction;
    const baseZ = String(i + 1);
    if (activeIdx == null) {
      el.style.setProperty('--dsn-avatar-shift', '0px');
      el.style.setProperty('--dsn-avatar-scale', '1');
      el.style.zIndex = baseZ;
      return;
    }
    const distance = Math.abs(i - activeIdx);
    el.style.setProperty(
      '--dsn-avatar-shift',
      `${(lift * Math.pow(AVATAR_GROUP_HOVER_FALLOFF, distance)).toFixed(3)}px`,
    );
    el.style.setProperty(
      '--dsn-avatar-scale',
      i === activeIdx ? String(AVATAR_GROUP_HOVER_SCALE) : '1',
    );
    el.style.zIndex = i === activeIdx ? String(items.length + 2) : baseZ;
  });
}

// =============================================================================
// Types
// =============================================================================

export type AvatarSize    = 'xxs' | 'xs' | 'sm' | 'lg' | 'xl' | 'xxl';
export type AvatarVariant = 'profile' | 'organization';
export type AvatarFill    = 'picture' | 'initials' | 'icon';

export interface AvatarProps {
  /** Visual size of the avatar. Default: `'sm'` (32×32px). */
  size?: AvatarSize;
  /** Shape: circle for a person, rounded square for an org. Default: `'profile'`. */
  variant?: AvatarVariant;
  /** Content fill type. Priority: picture → initials → icon. Default: `'initials'`. */
  fill?: AvatarFill;
  /** Image URL — used when `fill='picture'`. */
  src?: string;
  /**
   * 1–2 character string shown when `fill='initials'`.
   * Will be trimmed to 2 chars and uppercased automatically.
   */
  initials?: string;
  /**
   * Lucide icon rendered when `fill='icon'`.
   * Accepts a component (`icon={Star}`) or an element (`icon={<Star />}`).
   * Falls back to `User` (profile) or `Building2` (organization) when omitted.
   * Swap the default any time by changing the import at the top of Avatar.tsx.
   */
  icon?: IconSource;
  /** Entity name — sets `aria-label`. Required for meaningful avatars. */
  name?: string;
  /** Alt text for the image when `fill='picture'`. Defaults to `name`. */
  alt?: string;
  /** Additional CSS class names forwarded to the root element. */
  className?: string;
  /** Optional inline styles for host contexts (e.g. AvatarGroup stacking order). */
  style?: React.CSSProperties;
}

export type AvatarGroupSize = 'xxs' | 'xs' | 'sm';

export interface AvatarItem {
  src?:      string;
  initials?: string;
  /** Required — used to build the accessible `aria-label` for the group. */
  name:      string;
  variant?:  AvatarVariant;
  fill?:     AvatarFill;
}

export interface AvatarGroupProps {
  /** Size of each avatar in the group. Limited to xxs/xs/sm per design spec. Default: `'sm'`. */
  size?: AvatarGroupSize;
  /** Ordered list of avatar data to render. */
  avatars: AvatarItem[];
  /** Maximum number of avatars to show before the "+N" overflow counter. Default: `5`. */
  maxVisible?: number;
  /** Text shown after the stack (e.g. "12 members"). Figma: `Label`. Rendered when `showLabel` is true. */
  label?: string;
  /** Render `label` after the stack. Figma: `Show label`. Default: `false`. */
  showLabel?: boolean;
  /** Render an icon-only "add" button after the stack. Figma: `Show button`. Default: `false`. */
  showButton?: boolean;
  /** Accessible name for the add button. Default: `'Add person'`. */
  buttonAriaLabel?: string;
  /** Called when the add button is clicked. */
  onButtonClick?: React.MouseEventHandler<HTMLButtonElement>;
  /** Additional CSS class names forwarded to the group container. */
  className?: string;
  /**
   * Accessible label for the group.
   * Auto-generated from names when omitted: "Ana Costa, João Silva, and 2 others".
   */
  'aria-label'?: string;
}


// =============================================================================
// Avatar
// =============================================================================

/**
 * role="img" visual identity marker for a person or organization — picture, initials, or icon fallback.
 *
 * @aiSelectWhen Representing a specific person or organization where visual identity aids recognition
 *
 * @aiAvoid Do not use for a generic system process or automated action — use an icon instead
 * @aiAvoid Do not use when the context is purely textual and a visual cue adds no value — use plain text instead
 *
 * @aiVariant variant="profile" — a specific human user (default)
 * @aiVariant variant="organization" — a company, team, or non-human entity
 * @aiVariant fill="picture" — preferred whenever a photo/logo is available
 * @aiVariant fill="initials" — default; used when no picture is available
 * @aiVariant fill="icon" — only when neither picture nor name/initials are available
 * @aiVariant size="sm" — default; standard list items, comment threads, member rows (there is no "md" size)
 *
 * @aiSpatial Fixed-shape glyph with no internal padding and no self-margin; size is entirely controlled by the size prop.
 *
 * @aiCompose Never mix Avatar sizes within the same group or list
 */
export function Avatar({
  size     = 'sm',
  variant  = 'profile',
  fill     = 'initials',
  src,
  initials,
  icon,
  name,
  alt,
  className,
  style,
}: AvatarProps) {
  const rootClass = ['dsn-avatar', className].filter(Boolean).join(' ');

  // Accessible label: meaningful avatars need a name; purely decorative ones get aria-hidden
  const ariaLabel   = name ?? undefined;
  const ariaHidden  = name ? undefined : (true as const);

  // Initials: max 2 chars, always uppercase
  const displayInitials = initials
    ? initials.trim().slice(0, 2).toUpperCase()
    : undefined;

  return (
    <div
      className={rootClass}
      data-size={size}
      data-variant={variant}
      data-fill={fill}
      role="img"
      aria-label={ariaLabel}
      aria-hidden={ariaHidden}
      style={style}
    >
      {fill === 'picture' && src && (
        <img
          className="dsn-avatar-image"
          src={src}
          alt={alt ?? name ?? ''}
        />
      )}

      {fill === 'initials' && displayInitials}

      {fill === 'icon' && (
        <span className="dsn-avatar-icon" aria-hidden="true">
          {/* Render the Lucide icon component — default: User (profile) or Building2 (organization) */}
          {renderIcon(icon ?? (variant === 'organization' ? Building2 : User))}
        </span>
      )}
    </div>
  );
}


// =============================================================================
// AvatarGroup
// =============================================================================

/**
 * AvatarGroup — overlapping stack of avatars with an optional overflow counter.
 *
 * Only supports the three smallest sizes (xxs, xs, sm) per design specification.
 * Provide `aria-label` or ensure each `AvatarItem` has a `name` — the group
 * builds an accessible summary label from names automatically.
 * Hover lifts the active avatar and neighbors with a distance falloff.
 */
export function AvatarGroup({
  size       = 'sm',
  avatars,
  maxVisible = 5,
  label,
  showLabel  = false,
  showButton = false,
  buttonAriaLabel = 'Add person',
  onButtonClick,
  className,
  'aria-label': ariaLabel,
}: AvatarGroupProps) {
  const rootRef   = useRef<HTMLDivElement>(null);
  const activeRef = useRef<number | null>(null);
  const visible   = avatars.slice(0, maxVisible);
  const overflow  = avatars.length - visible.length;

  // Auto-build aria-label from names when not provided
  const builtAriaLabel = ariaLabel ?? (() => {
    const names = avatars.map((a) => a.name);
    if (names.length <= maxVisible) return names.join(', ');
    const shown = names.slice(0, maxVisible).join(', ');
    return `${shown}, and ${overflow} ${overflow === 1 ? 'other' : 'others'}`;
  })();

  const rootClass = ['dsn-avatar-group', className].filter(Boolean).join(' ');

  function handleMouseOver(event: React.MouseEvent<HTMLDivElement>) {
    const root = rootRef.current;
    if (!root) return;
    const item = (event.target as HTMLElement).closest<HTMLElement>(
      '.dsn-avatar, .dsn-avatar-group-overflow',
    );
    if (!item || item.parentElement !== root) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>(AVATAR_GROUP_ITEM_SELECTOR));
    const index = items.indexOf(item);
    if (index === -1 || activeRef.current === index) return;
    activeRef.current = index;
    applyAvatarGroupHover(root, index, 'in');
  }

  function handleMouseLeave() {
    const root = rootRef.current;
    if (!root || activeRef.current == null) return;
    activeRef.current = null;
    applyAvatarGroupHover(root, null, 'out');
  }

  return (
    <div
      ref={rootRef}
      className={rootClass}
      data-size={size}
      role="group"
      aria-label={builtAriaLabel}
      onMouseOver={handleMouseOver}
      onMouseLeave={handleMouseLeave}
    >
      {visible.map((item, index) => (
        <Avatar
          key={index}
          size={size}
          variant={item.variant ?? 'profile'}
          fill={item.fill ?? (item.src ? 'picture' : item.initials ? 'initials' : 'icon')}
          src={item.src}
          initials={item.initials}
          name={item.name}
          style={{ zIndex: index + 1 }}
        />
      ))}

      {overflow > 0 && (
        <span
          className="dsn-avatar-group-overflow"
          aria-hidden="true"  /* overflow count is conveyed via the group aria-label */
          style={{ zIndex: visible.length + 1 }}
        >
          +{overflow}
        </span>
      )}

      {showButton && (
        <Button
          className="dsn-avatar-group-button"
          variant="secondary"
          size={size === 'sm' ? 'md' : 'sm'}
          showLabel={false}
          showLeadingIcon
          leadingIcon={<Plus size={16} aria-hidden="true" />}
          aria-label={buttonAriaLabel}
          onClick={onButtonClick}
        />
      )}

      {showLabel && label && <span className="dsn-avatar-group-label">{label}</span>}
    </div>
  );
}
