import * as React from 'react'
import { Drawer as BaseDrawer } from '@base-ui/react/drawer'
import { X } from '@phosphor-icons/react'

import { Button, type ButtonProps } from '../button/Button'
import { IconButton } from '../icon-button/IconButton'
import './drawer.css'
import './drawer.tokens.css'
import type { DrawerSide } from './drawer.spec'

export type { DrawerSide }

const cx = (...c: (string | undefined | false)[]) => c.filter(Boolean).join(' ')

type ButtonLook = Pick<ButtonProps, 'variant' | 'size' | 'destructive'>

const SideContext = React.createContext<DrawerSide>('right')
const SWIPE: Record<DrawerSide, 'right' | 'left' | 'down'> = { right: 'right', left: 'left', bottom: 'down' }

export interface DrawerRootProps extends React.ComponentProps<typeof BaseDrawer.Root> {
  /** The screen edge it's docked to (default right); swiping towards it dismisses it. */
  side?: DrawerSide
}

function Root({ side = 'right', ...props }: DrawerRootProps) {
  return (
    <SideContext.Provider value={side}>
      <BaseDrawer.Root swipeDirection={SWIPE[side]} {...props} />
    </SideContext.Provider>
  )
}

function Trigger({ variant = 'secondary', size, destructive, className, ...props }: Omit<React.ComponentProps<typeof BaseDrawer.Trigger>, 'render' | 'className'> & ButtonLook & { className?: string }) {
  return <BaseDrawer.Trigger {...props} render={<Button variant={variant} size={size} destructive={destructive} className={className} />} />
}

export interface DrawerPopupProps extends Omit<React.ComponentProps<typeof BaseDrawer.Popup>, 'className'> {
  className?: string
  /** A cross in the top corner that closes it (Figma: Show close). */
  showClose?: boolean
}

/** Portal + backdrop + viewport + panel (+ close button). */
function Popup({ className, showClose = true, children, ...props }: DrawerPopupProps) {
  const side = React.useContext(SideContext)
  return (
    <BaseDrawer.Portal>
      <BaseDrawer.Backdrop className="ds-drawer__backdrop" />
      <BaseDrawer.Viewport className="ds-drawer__viewport" data-side={side}>
        <BaseDrawer.Popup className={cx('ds-drawer', className)} data-side={side} {...props}>
          <BaseDrawer.Content className="ds-drawer__content">{children}</BaseDrawer.Content>
          {showClose ? <BaseDrawer.Close className="ds-drawer__close" render={<IconButton variant="ghost" size="sm" label="Close" icon={<X weight="bold" />} />} /> : null}
        </BaseDrawer.Popup>
      </BaseDrawer.Viewport>
    </BaseDrawer.Portal>
  )
}

const Header = ({ className, ...props }: React.ComponentProps<'div'>) => <div className={cx('ds-drawer__header', className)} {...props} />
/** Anything between the header and the actions (Figma: Body slot). */
const Body = ({ className, ...props }: React.ComponentProps<'div'>) => <div className={cx('ds-drawer__body', className)} {...props} />
const Actions = ({ className, ...props }: React.ComponentProps<'div'>) => <div className={cx('ds-drawer__actions', className)} {...props} />

function Title({ className, ...props }: Omit<React.ComponentProps<typeof BaseDrawer.Title>, 'className'> & { className?: string }) {
  return <BaseDrawer.Title className={cx('ds-drawer__title', className)} {...props} />
}

function Description({ className, ...props }: Omit<React.ComponentProps<typeof BaseDrawer.Description>, 'className'> & { className?: string }) {
  return <BaseDrawer.Description className={cx('ds-drawer__description', className)} {...props} />
}

function Close({ variant = 'secondary', size, destructive, className, ...props }: Omit<React.ComponentProps<typeof BaseDrawer.Close>, 'render' | 'className'> & ButtonLook & { className?: string }) {
  return <BaseDrawer.Close {...props} render={<Button variant={variant} size={size} destructive={destructive} className={className} />} />
}

/**
 * Styles: drawer.css (layout) + drawer.tokens.css (generated from drawer.spec.ts).
 *   Root (side) › Trigger + Popup › Header (Title, Description) + Body + Actions (Close)
 */
export const Drawer = { Root, Trigger, Popup, Header, Title, Description, Body, Actions, Close }

/** The panel drawn statically, as in Figma (docs, configurator). */
export function DrawerPreview({ side = 'right', showClose = true }: { side?: DrawerSide; showClose?: boolean }) {
  return (
    <div className="ds-drawer" data-side={side} data-preview style={side === 'bottom' ? { width: 420 } : { height: 360 }}>
      <div className="ds-drawer__content">
        <div className="ds-drawer__header">
          <h2 className="ds-drawer__title">Filters</h2>
          <p className="ds-drawer__description">Narrow the list down. Swipe it away or press Escape to close.</p>
        </div>
        <div className="ds-drawer__actions">
          <Button variant="secondary" tabIndex={-1}>
            Close
          </Button>
        </div>
      </div>
      {showClose ? <IconButton className="ds-drawer__close" variant="ghost" size="sm" label="Close" icon={<X weight="bold" />} tabIndex={-1} /> : null}
    </div>
  )
}
