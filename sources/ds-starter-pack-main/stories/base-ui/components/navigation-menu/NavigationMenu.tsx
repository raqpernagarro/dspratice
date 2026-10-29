import * as React from 'react'
import { NavigationMenu as BaseNavigationMenu } from '@base-ui/react/navigation-menu'
import { CaretDown, type Icon } from '@phosphor-icons/react'

import '../shared/popup.css'
import './navigation-menu.css'
import './navigation-menu.tokens.css'
import './navigation-menu-item.tokens.css'
import './navigation-menu-link.tokens.css'
import type { NavigationMenuItemType } from './navigation-menu-item.spec'

export type { NavigationMenuItemType }

const cx = (...c: (string | undefined | false)[]) => c.filter(Boolean).join(' ')

/** Both weights render; the stylesheet shows the line one while inactive and the filled one while active. */
function ItemIcon({ icon: IconCmp }: { icon: Icon }) {
  return (
    <>
      <span className="ds-navigation-menu-item__icon ds-navigation-menu-item__icon--off" aria-hidden>
        <IconCmp weight="regular" />
      </span>
      <span className="ds-navigation-menu-item__icon ds-navigation-menu-item__icon--on" aria-hidden>
        <IconCmp weight="fill" />
      </span>
    </>
  )
}

function Root({ className, ...props }: Omit<React.ComponentProps<typeof BaseNavigationMenu.Root>, 'className'> & { className?: string }) {
  return <BaseNavigationMenu.Root className={cx('ds-navigation-menu', className)} {...props} />
}

function List({ className, ...props }: Omit<React.ComponentProps<typeof BaseNavigationMenu.List>, 'className'> & { className?: string }) {
  return <BaseNavigationMenu.List className={cx('ds-navigation-menu__list', className)} {...props} />
}

export interface NavigationMenuTriggerProps extends Omit<React.ComponentProps<typeof BaseNavigationMenu.Trigger>, 'className'> {
  /** A Phosphor icon: line while closed, filled while its panel is open. */
  icon?: Icon
  className?: string
}

/** Opens its item's panel (NavigationMenu.Content). */
function Trigger({ icon, className, children, ...props }: NavigationMenuTriggerProps) {
  return (
    <BaseNavigationMenu.Trigger className={cx('ds-navigation-menu-item', className)} data-type="trigger" {...props}>
      {icon ? <ItemIcon icon={icon} /> : null}
      <span className="ds-navigation-menu-item__label">{children}</span>
      <BaseNavigationMenu.Icon className="ds-navigation-menu-item__caret">
        <CaretDown weight="fill" />
      </BaseNavigationMenu.Icon>
    </BaseNavigationMenu.Trigger>
  )
}

export interface NavigationMenuLinkProps extends Omit<React.ComponentProps<typeof BaseNavigationMenu.Link>, 'className'> {
  /** A Phosphor icon: line while inactive, filled on the current page (active). */
  icon?: Icon
  className?: string
}

/** A link in the bar. Set `active` on the current page's link. */
function Link({ icon, className, children, ...props }: NavigationMenuLinkProps) {
  return (
    <BaseNavigationMenu.Link className={cx('ds-navigation-menu-item', className)} data-type="link" {...props}>
      {icon ? <ItemIcon icon={icon} /> : null}
      <span className="ds-navigation-menu-item__label">{children}</span>
    </BaseNavigationMenu.Link>
  )
}

function Content({ className, ...props }: Omit<React.ComponentProps<typeof BaseNavigationMenu.Content>, 'className'> & { className?: string }) {
  return <BaseNavigationMenu.Content className={cx('ds-navigation-menu__content', className)} {...props} />
}

export interface NavigationMenuCardProps extends Omit<React.ComponentProps<typeof BaseNavigationMenu.Link>, 'className' | 'title'> {
  title: React.ReactNode
  description?: React.ReactNode
  className?: string
}

/** A link card in a panel: title and one line of description. */
function Card({ title, description, className, ...props }: NavigationMenuCardProps) {
  return (
    <BaseNavigationMenu.Link className={cx('ds-navigation-menu-link', className)} {...props}>
      <span className="ds-navigation-menu-link__title">{title}</span>
      {description ? <span className="ds-navigation-menu-link__description">{description}</span> : null}
    </BaseNavigationMenu.Link>
  )
}

/** The panel: portal + positioner + popup (+ arrow) + viewport. Render it once, after the List. */
function Popup({ className, arrow = true }: { className?: string; arrow?: boolean }) {
  return (
    <BaseNavigationMenu.Portal>
      <BaseNavigationMenu.Positioner className="ds-navigation-menu__positioner" sideOffset={10} collisionPadding={{ top: 5, bottom: 5, left: 20, right: 20 }}>
        <BaseNavigationMenu.Popup className={cx('ds-popup ds-navigation-menu__popup', className)}>
          {arrow ? <BaseNavigationMenu.Arrow className="ds-arrow ds-navigation-menu__arrow" /> : null}
          <BaseNavigationMenu.Viewport className="ds-navigation-menu__viewport" />
        </BaseNavigationMenu.Popup>
      </BaseNavigationMenu.Positioner>
    </BaseNavigationMenu.Portal>
  )
}

/**
 * Styles: navigation-menu.css (layout) + navigation-menu.tokens.css / navigation-menu-item.tokens.css
 * (generated from the specs).
 *
 *   Root › List › Item › (Trigger + Content › Card…) | Link
 *   Root › Popup (once)
 */
export const NavigationMenu = { Root, List, Item: BaseNavigationMenu.Item, Trigger, Link, Content, Card, Popup }

/* --------------------------------------------------------------- previews */

export interface NavigationMenuItemPreviewProps {
  type?: NavigationMenuItemType
  state?: 'default' | 'hover'
  active?: boolean
  icon?: Icon
  children?: React.ReactNode
}

/** An item drawn statically, with the data attributes Base UI sets (docs, configurator). */
export function NavigationMenuItemPreview({ type = 'link', state = 'default', active = false, icon, children = 'Overview' }: NavigationMenuItemPreviewProps) {
  return (
    <span
      className="ds-navigation-menu-item"
      data-type={type}
      data-preview-state={state === 'hover' ? 'hover' : undefined}
      data-active={type === 'link' && active ? '' : undefined}
      data-popup-open={type === 'trigger' && active ? '' : undefined}
    >
      {icon ? <ItemIcon icon={icon} /> : null}
      <span className="ds-navigation-menu-item__label">{children}</span>
      {type === 'trigger' ? (
        <span className="ds-navigation-menu-item__caret" data-popup-open={active ? '' : undefined} aria-hidden>
          <CaretDown weight="fill" />
        </span>
      ) : null}
    </span>
  )
}

/** The bar with an open panel, as in Figma. */
export function NavigationMenuPreview({ icons }: { icons: [Icon, Icon, Icon] }) {
  const links = [
    ['Quick start', 'Install and assemble your first component.'],
    ['Accessibility', 'Learn how we build accessible components.'],
    ['Releases', 'See what’s new in the latest versions.'],
  ]
  return (
    <div className="ds-navigation-menu" style={{ display: 'flex', flexDirection: 'column', alignItems: 'start', gap: 10 }}>
      <div className="ds-navigation-menu__list">
        <NavigationMenuItemPreview type="link" active icon={icons[0]}>
          Home
        </NavigationMenuItemPreview>
        <NavigationMenuItemPreview type="trigger" active icon={icons[1]}>
          Overview
        </NavigationMenuItemPreview>
        <NavigationMenuItemPreview type="link" icon={icons[2]}>
          Handbook
        </NavigationMenuItemPreview>
      </div>
      <div className="ds-popup ds-navigation-menu__popup" data-preview style={{ marginLeft: 60 }}>
        <div className="ds-arrow ds-navigation-menu__arrow" data-side="bottom" data-preview />
        <div className="ds-navigation-menu__content">
          {links.map(([title, description]) => (
            <span key={title} className="ds-navigation-menu-link">
              <span className="ds-navigation-menu-link__title">{title}</span>
              <span className="ds-navigation-menu-link__description">{description}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
