import * as React from 'react'
import { ToggleGroup as BaseToggleGroup } from '@base-ui/react/toggle-group'

import { ControlSizeContext, type ControlSize } from '../shared/control-size'
import './toggle-group.css'
import './toggle-group.tokens.css'

export interface ToggleGroupProps extends Omit<React.ComponentProps<typeof BaseToggleGroup>, 'className'> {
  /** Size of every toggle inside. */
  size?: ControlSize
  className?: string
}

/** Styles: toggle-group.css (layout) + toggle-group.tokens.css (generated from toggle-group.spec.ts). */
export function ToggleGroup({ size = 'md', className, ...props }: ToggleGroupProps) {
  return (
    <ControlSizeContext.Provider value={size}>
      <BaseToggleGroup className={['ds-toggle-group', className].filter(Boolean).join(' ')} data-size={size} {...props} />
    </ControlSizeContext.Provider>
  )
}
