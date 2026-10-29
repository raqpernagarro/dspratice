import * as React from 'react'
import { Toggle as BaseToggle } from '@base-ui/react/toggle'
import type { Icon } from '@phosphor-icons/react'

import { useControlSize } from '../shared/control-size'
import './toggle.css'
import './toggle.tokens.css'
import type { ToggleSize } from './toggle.spec'

export type { ToggleSize }

export interface ToggleProps extends Omit<React.ComponentProps<typeof BaseToggle>, 'className' | 'children'> {
  /** A Phosphor icon: drawn as a line while off and filled while on. */
  icon: Icon
  /** Accessible name (aria-label). */
  label: string
  /** Defaults to the enclosing Toggle Group's size, else md. */
  size?: ToggleSize
  className?: string
  /** Static state preview (docs, configurator). */
  'data-preview-state'?: 'hover' | 'pressed'
}

/** Styles: toggle.css (layout) + toggle.tokens.css (generated from toggle.spec.ts). */
export function Toggle({ icon: IconCmp, label, size: sizeProp, className, ...props }: ToggleProps) {
  const contextSize = useControlSize()
  const size = sizeProp ?? contextSize ?? 'md'
  return (
    <BaseToggle className={['ds-toggle', className].filter(Boolean).join(' ')} aria-label={label} data-size={size} {...props}>
      {/* Both weights render; the stylesheet shows the one matching the state. */}
      <span className="ds-toggle__icon ds-toggle__icon--off" aria-hidden>
        <IconCmp weight="regular" />
      </span>
      <span className="ds-toggle__icon ds-toggle__icon--on" aria-hidden>
        <IconCmp weight="fill" />
      </span>
    </BaseToggle>
  )
}
