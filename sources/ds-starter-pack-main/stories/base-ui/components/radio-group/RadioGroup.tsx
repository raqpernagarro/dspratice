import * as React from 'react'
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group'

import { ControlSizeContext, type ControlSize } from '../shared/control-size'
import './radio-group.css'
import './radio-group.tokens.css'

export interface RadioGroupProps extends Omit<React.ComponentProps<typeof BaseRadioGroup>, 'className'> {
  /** Visible name of the group (linked with aria-labelledby). */
  label?: React.ReactNode
  /** Size of the group's label and of every option inside. */
  size?: ControlSize
  className?: string
}

/** Styles: radio-group.css (layout) + radio-group.tokens.css (generated from radio-group.spec.ts). */
export function RadioGroup({ label, size = 'md', className, children, ...props }: RadioGroupProps) {
  const labelId = React.useId()
  return (
    <ControlSizeContext.Provider value={size}>
      <BaseRadioGroup className={['ds-radio-group', className].filter(Boolean).join(' ')} data-size={size} aria-labelledby={label ? labelId : undefined} {...props}>
        {label ? (
          <div className="ds-radio-group__label" id={labelId}>
            {label}
          </div>
        ) : null}
        {children}
      </BaseRadioGroup>
    </ControlSizeContext.Provider>
  )
}
