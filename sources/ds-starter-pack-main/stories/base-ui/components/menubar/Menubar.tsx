import * as React from 'react'
import { Menubar as BaseMenubar } from '@base-ui/react/menubar'
import { Menu as BaseMenu } from '@base-ui/react/menu'

import './menubar.css'
import './menubar.tokens.css'
import './menubar-item.tokens.css'

const cx = (...c: (string | undefined | false)[]) => c.filter(Boolean).join(' ')

function Root({ className, ...props }: Omit<React.ComponentProps<typeof BaseMenubar>, 'className'> & { className?: string }) {
  return <BaseMenubar className={cx('ds-menubar', className)} {...props} />
}

/** A Menubar Item: the trigger of one Menu (inside Menu.Root). */
function Trigger({ className, ...props }: Omit<React.ComponentProps<typeof BaseMenu.Trigger>, 'className'> & { className?: string }) {
  return <BaseMenu.Trigger className={cx('ds-menubar-item', className)} {...props} />
}

/**
 * Styles: menubar.css (layout) + menubar.tokens.css / menubar-item.tokens.css (generated from the
 * specs). The menus are ordinary Menus: Menubar.Root › Menu.Root › Menubar.Trigger + Menu.Popup.
 */
export const Menubar = { Root, Trigger }

/** A menubar item drawn statically (docs, configurator). */
export function MenubarItemPreview({ state = 'default', children = 'File' }: { state?: 'default' | 'hover' | 'open' | 'disabled'; children?: React.ReactNode }) {
  return (
    <span
      className="ds-menubar-item"
      data-preview-state={state === 'hover' ? 'hover' : undefined}
      data-popup-open={state === 'open' ? '' : undefined}
      data-disabled={state === 'disabled' ? '' : undefined}
      aria-disabled={state === 'disabled' || undefined}
    >
      {children}
    </span>
  )
}

/** The bar drawn statically, as in Figma. */
export function MenubarPreview() {
  return (
    <div className="ds-menubar">
      <MenubarItemPreview state="open">File</MenubarItemPreview>
      <MenubarItemPreview>Edit</MenubarItemPreview>
      <MenubarItemPreview>View</MenubarItemPreview>
      <MenubarItemPreview>Help</MenubarItemPreview>
    </div>
  )
}
