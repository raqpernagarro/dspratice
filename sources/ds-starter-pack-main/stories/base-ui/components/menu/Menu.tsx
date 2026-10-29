import * as React from 'react'
import { Menu as BaseMenu } from '@base-ui/react/menu'
import { CaretDown, CaretRight, Check, Circle } from '@phosphor-icons/react'

import { Button, type ButtonProps } from '../button/Button'
import './menu.css'
import './menu.tokens.css'
import './menu-item.tokens.css'
import './menu-group-label.tokens.css'
import './menu-separator.tokens.css'
import type { MenuItemType } from './menu-item.spec'

export type { MenuItemType }

const cx = (...c: (string | undefined | false)[]) => c.filter(Boolean).join(' ')

/* ---------------------------------------------------------------- trigger */

export interface MenuTriggerProps extends Omit<React.ComponentProps<typeof BaseMenu.Trigger>, 'render' | 'className'> {
  /** Button look of the trigger (default secondary). */
  variant?: ButtonProps['variant']
  size?: ButtonProps['size']
  className?: string
}

/** Opens the menu: a Button with a caret. */
function Trigger({ variant = 'secondary', size = 'md', className, children, ...props }: MenuTriggerProps) {
  return (
    <BaseMenu.Trigger
      {...props}
      render={<Button variant={variant} size={size} className={className} trailIcon={<CaretDown weight="fill" />} />}
    >
      {children}
    </BaseMenu.Trigger>
  )
}

/* ------------------------------------------------------------------ popup */

export interface MenuPopupProps extends Omit<React.ComponentProps<typeof BaseMenu.Popup>, 'className'> {
  className?: string
  /** Positioner options. */
  side?: React.ComponentProps<typeof BaseMenu.Positioner>['side']
  align?: React.ComponentProps<typeof BaseMenu.Positioner>['align']
  sideOffset?: number
}

/** Portal + positioner + popup, so a menu is Root › Trigger + Popup › items. */
function Popup({ className, side, align = 'start', sideOffset = 8, ...props }: MenuPopupProps) {
  return (
    <BaseMenu.Portal>
      <BaseMenu.Positioner className="ds-menu__positioner" side={side} align={align} sideOffset={sideOffset}>
        <BaseMenu.Popup className={cx('ds-menu', className)} {...props} />
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  )
}

/* ------------------------------------------------------------------ items */

type ItemBase = { className?: string }

function Label({ children }: { children: React.ReactNode }) {
  return <span className="ds-menu-item__label">{children}</span>
}

function Item({ className, children, ...props }: Omit<React.ComponentProps<typeof BaseMenu.Item>, 'className'> & ItemBase) {
  return (
    <BaseMenu.Item className={cx('ds-menu-item', className)} data-type="default" {...props}>
      <Label>{children}</Label>
    </BaseMenu.Item>
  )
}

function CheckboxItem({ className, children, ...props }: Omit<React.ComponentProps<typeof BaseMenu.CheckboxItem>, 'className'> & ItemBase) {
  return (
    <BaseMenu.CheckboxItem className={cx('ds-menu-item', className)} data-type="checkbox" {...props}>
      <span className="ds-menu-item__indicator">
        <BaseMenu.CheckboxItemIndicator className="ds-menu-item__icon">
          <Check weight="bold" />
        </BaseMenu.CheckboxItemIndicator>
      </span>
      <Label>{children}</Label>
    </BaseMenu.CheckboxItem>
  )
}

function RadioItem({ className, children, ...props }: Omit<React.ComponentProps<typeof BaseMenu.RadioItem>, 'className'> & ItemBase) {
  return (
    <BaseMenu.RadioItem className={cx('ds-menu-item', className)} data-type="radio" {...props}>
      <span className="ds-menu-item__indicator">
        <BaseMenu.RadioItemIndicator className="ds-menu-item__icon">
          <Circle weight="fill" />
        </BaseMenu.RadioItemIndicator>
      </span>
      <Label>{children}</Label>
    </BaseMenu.RadioItem>
  )
}

function SubmenuTrigger({ className, children, ...props }: Omit<React.ComponentProps<typeof BaseMenu.SubmenuTrigger>, 'className'> & ItemBase) {
  return (
    <BaseMenu.SubmenuTrigger className={cx('ds-menu-item', className)} data-type="submenu" {...props}>
      <Label>{children}</Label>
      <span className="ds-menu-item__caret" aria-hidden>
        <CaretRight weight="fill" />
      </span>
    </BaseMenu.SubmenuTrigger>
  )
}

function GroupLabel({ className, ...props }: Omit<React.ComponentProps<typeof BaseMenu.GroupLabel>, 'className'> & ItemBase) {
  return <BaseMenu.GroupLabel className={cx('ds-menu-group-label', className)} {...props} />
}

function Separator({ className, ...props }: Omit<React.ComponentProps<typeof BaseMenu.Separator>, 'className'> & ItemBase) {
  return <BaseMenu.Separator className={cx('ds-menu-separator', className)} {...props} />
}

/**
 * Styles: menu.css (layout) + menu.tokens.css / menu-item.tokens.css (generated from menu.spec.ts
 * and menu-item.spec.ts).
 */
export const Menu = {
  Root: BaseMenu.Root,
  Trigger,
  Popup,
  Item,
  CheckboxItem,
  RadioGroup: BaseMenu.RadioGroup,
  RadioItem,
  Group: BaseMenu.Group,
  GroupLabel,
  Separator,
  SubmenuRoot: BaseMenu.SubmenuRoot,
  SubmenuTrigger,
}

/* --------------------------------------------------------------- previews */

export interface MenuItemPreviewProps {
  type?: MenuItemType
  state?: 'default' | 'highlighted' | 'disabled'
  checked?: boolean
  children?: React.ReactNode
}

/**
 * A menu item drawn statically, with the same classes and data attributes Base UI sets (docs
 * matrices, configurator). Not interactive; use Menu.* in product code.
 */
export function MenuItemPreview({ type = 'default', state = 'default', checked = false, children = 'Menu item' }: MenuItemPreviewProps) {
  const indicator = type === 'checkbox' || type === 'radio'
  return (
    <div
      className="ds-menu-item"
      data-type={type}
      data-highlighted={state === 'highlighted' ? '' : undefined}
      data-disabled={state === 'disabled' ? '' : undefined}
      aria-disabled={state === 'disabled' || undefined}
      data-checked={indicator && checked ? '' : undefined}
    >
      {indicator ? (
        <span className="ds-menu-item__indicator">
          {checked ? <span className="ds-menu-item__icon">{type === 'radio' ? <Circle weight="fill" /> : <Check weight="bold" />}</span> : null}
        </span>
      ) : null}
      <Label>{children}</Label>
      {type === 'submenu' ? (
        <span className="ds-menu-item__caret" aria-hidden>
          <CaretRight weight="fill" />
        </span>
      ) : null}
    </div>
  )
}

/** The popup drawn statically: a group label, items, a separator (docs, configurator). */
export function MenuPreview() {
  return (
    <div className="ds-menu" style={{ width: 220 }}>
      <div className="ds-menu-group-label">Library</div>
      <MenuItemPreview>Add to Library</MenuItemPreview>
      <MenuItemPreview state="highlighted">Add to Playlist</MenuItemPreview>
      <MenuItemPreview type="submenu">Share</MenuItemPreview>
      <div className="ds-menu-separator" />
      <MenuItemPreview type="checkbox" checked>
        Shuffle
      </MenuItemPreview>
      <MenuItemPreview type="checkbox">Repeat</MenuItemPreview>
    </div>
  )
}
