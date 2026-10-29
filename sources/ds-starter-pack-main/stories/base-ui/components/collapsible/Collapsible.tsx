import * as React from 'react'
import { Collapsible as BaseCollapsible } from '@base-ui/react/collapsible'
import { CaretRight } from '@phosphor-icons/react'

import './collapsible.css'
import './collapsible.tokens.css'

export interface CollapsibleProps extends Omit<React.ComponentProps<typeof BaseCollapsible.Root>, 'className'> {
  /** The trigger's text. */
  label: React.ReactNode
  /** Disables the trigger. */
  disabled?: boolean
  className?: string
}

/** Styles: collapsible.css (layout) + collapsible.tokens.css (generated from collapsible.spec.ts). */
export function Collapsible({ label, disabled, className, children, ...props }: CollapsibleProps) {
  return (
    <BaseCollapsible.Root className={['ds-collapsible', className].filter(Boolean).join(' ')} {...props}>
      <BaseCollapsible.Trigger className="ds-collapsible__trigger" disabled={disabled}>
        <span className="ds-collapsible__label">{label}</span>
        <span className="ds-collapsible__icon" aria-hidden>
          <CaretRight weight="fill" />
        </span>
      </BaseCollapsible.Trigger>
      <BaseCollapsible.Panel className="ds-collapsible__panel">
        <div className="ds-collapsible__content">{children}</div>
      </BaseCollapsible.Panel>
    </BaseCollapsible.Root>
  )
}

/** Drawn statically, with the data attributes Base UI sets (docs, configurator). */
export function CollapsiblePreview({ open = false, state = 'default' }: { open?: boolean; state?: 'default' | 'hover' | 'pressed' | 'disabled' }) {
  return (
    <div className="ds-collapsible">
      <button
        type="button"
        className="ds-collapsible__trigger"
        tabIndex={-1}
        disabled={state === 'disabled'}
        data-panel-open={open ? '' : undefined}
        data-preview-state={state === 'hover' || state === 'pressed' ? state : undefined}
      >
        <span className="ds-collapsible__label">Recovery keys</span>
        <span className="ds-collapsible__icon" aria-hidden>
          <CaretRight weight="fill" />
        </span>
      </button>
      {open ? (
        <div className="ds-collapsible__panel">
          <div className="ds-collapsible__content">
            <div>alien-bean-pasta</div>
            <div>wild-irish-burrito</div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
