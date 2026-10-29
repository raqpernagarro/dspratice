import * as React from 'react'
import { CheckboxGroup as BaseCheckboxGroup } from '@base-ui/react/checkbox-group'

import { ControlSizeContext, type ControlSize } from '../shared/control-size'
import './checkbox-group.css'
import './checkbox-group.tokens.css'

export interface CheckboxGroupProps extends Omit<React.ComponentProps<typeof BaseCheckboxGroup>, 'className'> {
  /** Visible name of the group (linked with aria-labelledby). */
  label?: React.ReactNode
  /** Size of the group's label and of every option inside. */
  size?: ControlSize
  className?: string
}

/** Styles: checkbox-group.css (layout) + checkbox-group.tokens.css (generated from checkbox-group.spec.ts). */
export function CheckboxGroup({ label, size = 'md', className, children, ...props }: CheckboxGroupProps) {
  const labelId = React.useId()
  return (
    <ControlSizeContext.Provider value={size}>
      <BaseCheckboxGroup className={['ds-checkbox-group', className].filter(Boolean).join(' ')} data-size={size} aria-labelledby={label ? labelId : undefined} {...props}>
        {label ? (
          <div className="ds-checkbox-group__label" id={labelId}>
            {label}
          </div>
        ) : null}
        {children}
      </BaseCheckboxGroup>
    </ControlSizeContext.Provider>
  )
}
