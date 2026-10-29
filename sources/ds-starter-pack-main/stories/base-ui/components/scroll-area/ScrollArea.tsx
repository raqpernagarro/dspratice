import * as React from 'react'
import { ScrollArea as BaseScrollArea } from '@base-ui/react/scroll-area'

import './scroll-area.css'
import './scroll-area.tokens.css'

export interface ScrollAreaProps extends Omit<React.ComponentProps<typeof BaseScrollArea.Root>, 'className'> {
  className?: string
}

/** Styles: scroll-area.css (layout) + scroll-area.tokens.css (generated from scroll-area.spec.ts). Size it with className / style. */
export function ScrollArea({ className, children, ...props }: ScrollAreaProps) {
  return (
    <BaseScrollArea.Root className={['ds-scroll-area', className].filter(Boolean).join(' ')} {...props}>
      <BaseScrollArea.Viewport className="ds-scroll-area__viewport">
        <BaseScrollArea.Content className="ds-scroll-area__content">{children}</BaseScrollArea.Content>
      </BaseScrollArea.Viewport>
      <BaseScrollArea.Scrollbar className="ds-scroll-area__scrollbar">
        <BaseScrollArea.Thumb className="ds-scroll-area__thumb" />
      </BaseScrollArea.Scrollbar>
    </BaseScrollArea.Root>
  )
}
