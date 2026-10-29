import * as React from 'react'
import { Toolbar as BaseToolbar } from '@base-ui/react/toolbar'
import { ToggleGroup as BaseToggleGroup } from '@base-ui/react/toggle-group'

import { ControlSizeContext } from '../shared/control-size'
import '../separator/separator.css'
import '../separator/separator.tokens.css'
import './toolbar.css'
import './toolbar.tokens.css'

const cx = (...c: (string | undefined | false)[]) => c.filter(Boolean).join(' ')

/** The strip. Its controls are md-sized Toggles and Icon Buttons. */
function Root({ className, ...props }: Omit<React.ComponentProps<typeof BaseToolbar.Root>, 'className'> & { className?: string }) {
  return (
    <ControlSizeContext.Provider value="md">
      <BaseToolbar.Root className={cx('ds-toolbar', className)} {...props} />
    </ControlSizeContext.Provider>
  )
}

function Group({ className, ...props }: Omit<React.ComponentProps<typeof BaseToolbar.Group>, 'className'> & { className?: string }) {
  return <BaseToolbar.Group className={cx('ds-toolbar__group', className)} {...props} />
}

/** Exclusive (or multiple) toggles: a Toggle Group without its own frame. */
function ToggleGroup({ className, ...props }: Omit<React.ComponentProps<typeof BaseToggleGroup>, 'className'> & { className?: string }) {
  return <BaseToggleGroup className={cx('ds-toolbar__group', className)} {...props} />
}

/** A vertical Separator between groups (Base UI sets its orientation across the toolbar). */
function Separator({ className, ...props }: Omit<React.ComponentProps<typeof BaseToolbar.Separator>, 'className'> & { className?: string }) {
  return <BaseToolbar.Separator className={cx('ds-separator', className)} {...props} />
}

/**
 * Styles: toolbar.css (layout) + toolbar.tokens.css (generated from toolbar.spec.ts).
 * Controls: <Toolbar.Button render={<Toggle … />} /> or render={<IconButton variant="ghost" … />}.
 */
export const Toolbar = { Root, Group, ToggleGroup, Separator, Button: BaseToolbar.Button }
