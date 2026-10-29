import * as React from 'react'
import { Tabs as BaseTabs } from '@base-ui/react/tabs'

import { ControlSizeContext, useControlSize, type ControlSize } from '../shared/control-size'
import './tabs.css'
import './tabs.tokens.css'
import './tab.tokens.css'
import type { TabsSize } from './tab.spec'

export type { TabsSize }

const cx = (...c: (string | undefined | false)[]) => c.filter(Boolean).join(' ')

export interface TabsRootProps extends Omit<React.ComponentProps<typeof BaseTabs.Root>, 'className'> {
  /** Size of every tab. */
  size?: ControlSize
  className?: string
}

function Root({ size = 'md', className, ...props }: TabsRootProps) {
  return (
    <ControlSizeContext.Provider value={size}>
      <BaseTabs.Root className={cx('ds-tabs', className)} data-size={size} {...props} />
    </ControlSizeContext.Provider>
  )
}

/** The row of tabs, with the indicator behind the selected one. */
function List({ className, children, ...props }: Omit<React.ComponentProps<typeof BaseTabs.List>, 'className'> & { className?: string }) {
  return (
    <BaseTabs.List className={cx('ds-tabs__list', className)} {...props}>
      {children}
      <BaseTabs.Indicator className="ds-tabs__indicator" />
    </BaseTabs.List>
  )
}

function Tab({ className, ...props }: Omit<React.ComponentProps<typeof BaseTabs.Tab>, 'className'> & { className?: string }) {
  const size = useControlSize() ?? 'md'
  return <BaseTabs.Tab className={cx('ds-tab', className)} data-size={size} {...props} />
}

function Panel({ className, ...props }: Omit<React.ComponentProps<typeof BaseTabs.Panel>, 'className'> & { className?: string }) {
  return <BaseTabs.Panel className={cx('ds-tabs__panel', className)} {...props} />
}

/**
 * Styles: tabs.css (layout) + tabs.tokens.css / tab.tokens.css (generated from tabs.spec.ts and
 * tab.spec.ts).   Root › List › Tab… + Panel…
 */
export const Tabs = { Root, List, Tab, Panel }

/** A tab drawn statically, with the data attributes Base UI sets (docs, configurator). */
export function TabPreview({ size = 'md', selected = false, state = 'default', children = 'Overview' }: { size?: TabsSize; selected?: boolean; state?: 'default' | 'hover' | 'disabled'; children?: React.ReactNode }) {
  return (
    <span
      className="ds-tab"
      data-size={size}
      data-active={selected ? '' : undefined}
      data-disabled={state === 'disabled' ? '' : undefined}
      aria-disabled={state === 'disabled' || undefined}
      data-preview-state={state === 'hover' ? 'hover' : undefined}
    >
      {children}
    </span>
  )
}
