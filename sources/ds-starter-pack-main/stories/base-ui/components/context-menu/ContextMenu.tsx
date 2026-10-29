import * as React from 'react'
import { ContextMenu as BaseContextMenu } from '@base-ui/react/context-menu'

import { Menu } from '../menu/Menu'
import '../menu/menu.css'
import '../menu/menu.tokens.css'
import './context-menu.css'

const cx = (...c: (string | undefined | false)[]) => c.filter(Boolean).join(' ')

/** The area that opens the menu on right-click or long-press. Unstyled: it wraps your content. */
function Trigger({ className, ...props }: Omit<React.ComponentProps<typeof BaseContextMenu.Trigger>, 'className'> & { className?: string }) {
  return <BaseContextMenu.Trigger className={cx('ds-context-menu__trigger', className)} {...props} />
}

/** Portal + positioner (at the pointer) + Menu's popup. */
function Popup({ className, ...props }: Omit<React.ComponentProps<typeof BaseContextMenu.Popup>, 'className'> & { className?: string }) {
  return (
    <BaseContextMenu.Portal>
      <BaseContextMenu.Positioner className="ds-menu__positioner">
        <BaseContextMenu.Popup className={cx('ds-menu', className)} {...props} />
      </BaseContextMenu.Positioner>
    </BaseContextMenu.Portal>
  )
}

/**
 * Menu, opened at the pointer: the popup and items are Menu's (same Figma components and tokens).
 * Base UI's ContextMenu parts are Menu's, so Menu.Item & co. work inside it.
 */
export const ContextMenu = {
  Root: BaseContextMenu.Root,
  Trigger,
  Popup,
  Item: Menu.Item,
  CheckboxItem: Menu.CheckboxItem,
  RadioGroup: Menu.RadioGroup,
  RadioItem: Menu.RadioItem,
  Group: Menu.Group,
  GroupLabel: Menu.GroupLabel,
  Separator: Menu.Separator,
  SubmenuRoot: Menu.SubmenuRoot,
  SubmenuTrigger: Menu.SubmenuTrigger,
}
