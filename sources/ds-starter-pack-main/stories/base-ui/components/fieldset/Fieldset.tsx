import * as React from 'react'
import { Fieldset as BaseFieldset } from '@base-ui/react/fieldset'

import { ControlSizeContext, type ControlSize } from '../shared/control-size'
import './fieldset.css'
import './fieldset.tokens.css'

export interface FieldsetProps extends Omit<React.ComponentProps<typeof BaseFieldset.Root>, 'className'> {
  legend: React.ReactNode
  /** Size of the legend and of every field inside. */
  size?: ControlSize
  className?: string
}

/** Styles: fieldset.css (layout) + fieldset.tokens.css (generated from fieldset.spec.ts). */
export function Fieldset({ legend, size = 'md', className, children, ...props }: FieldsetProps) {
  return (
    <ControlSizeContext.Provider value={size}>
      <BaseFieldset.Root className={['ds-fieldset', className].filter(Boolean).join(' ')} data-size={size} {...props}>
        <BaseFieldset.Legend className="ds-fieldset__legend">{legend}</BaseFieldset.Legend>
        {children}
      </BaseFieldset.Root>
    </ControlSizeContext.Provider>
  )
}
