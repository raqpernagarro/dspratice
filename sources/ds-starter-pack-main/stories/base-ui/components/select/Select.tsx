import * as React from 'react'
import { Select as BaseSelect } from '@base-ui/react/select'
import { CaretUpDown } from '@phosphor-icons/react'

import { LISTBOX_CLASS, OPTION_CLASS, OptionCheck } from '../listbox/Listbox'
import { useControlSize } from '../shared/control-size'
import './select.css'
import './select.tokens.css'
import type { SelectSize } from './select.spec'

export type { SelectSize }

const cx = (...c: (string | undefined | false)[]) => c.filter(Boolean).join(' ')

export interface SelectTriggerProps extends Omit<React.ComponentProps<typeof BaseSelect.Trigger>, 'className' | 'children'> {
  /** Defaults to the enclosing Field's size, else md. */
  size?: SelectSize
  placeholder?: React.ReactNode
  className?: string
  /** Static state preview (docs, configurator). */
  'data-preview-state'?: 'hover' | 'focused'
}

/** The field box: the value (or placeholder) and a caret. */
function Trigger({ size, placeholder, className, ...props }: SelectTriggerProps) {
  const contextSize = useControlSize()
  return (
    <BaseSelect.Trigger className={cx('ds-select', className)} data-size={size ?? contextSize ?? 'md'} {...props}>
      <BaseSelect.Value className="ds-select__value" placeholder={placeholder} />
      <BaseSelect.Icon className="ds-select__icon">
        <CaretUpDown weight="fill" />
      </BaseSelect.Icon>
    </BaseSelect.Trigger>
  )
}

export interface SelectPopupProps extends Omit<React.ComponentProps<typeof BaseSelect.Popup>, 'className'> {
  className?: string
  /** Open over the trigger with the selected option aligned to it (Base UI default), or below it. */
  alignItemWithTrigger?: boolean
}

/** Portal + positioner + Listbox. */
function Popup({ className, alignItemWithTrigger, children, ...props }: SelectPopupProps) {
  return (
    <BaseSelect.Portal>
      <BaseSelect.Positioner className="ds-listbox__positioner" sideOffset={4} alignItemWithTrigger={alignItemWithTrigger}>
        <BaseSelect.Popup className={cx(LISTBOX_CLASS, className)} {...props}>
          <BaseSelect.List className="ds-listbox__list">{children}</BaseSelect.List>
        </BaseSelect.Popup>
      </BaseSelect.Positioner>
    </BaseSelect.Portal>
  )
}

/** An Option: check indicator + label. */
function Item({ className, children, ...props }: Omit<React.ComponentProps<typeof BaseSelect.Item>, 'className'> & { className?: string }) {
  return (
    <BaseSelect.Item className={cx(OPTION_CLASS, className)} {...props}>
      <span className="ds-option__indicator">
        <BaseSelect.ItemIndicator className="ds-option__icon">
          <OptionCheck />
        </BaseSelect.ItemIndicator>
      </span>
      <BaseSelect.ItemText className="ds-option__label">{children}</BaseSelect.ItemText>
    </BaseSelect.Item>
  )
}

/**
 * Styles: select.css (layout) + select.tokens.css (generated from select.spec.ts); the popup is a
 * Listbox of Options (listbox/).
 */
export const Select = { Root: BaseSelect.Root, Trigger, Popup, Item, Group: BaseSelect.Group }

export interface SelectTriggerPreviewProps {
  size?: SelectSize
  state?: 'default' | 'hover' | 'focused' | 'disabled'
  filled?: boolean
  invalid?: boolean
}

/** The trigger drawn statically, with the data attributes Base UI sets (docs, configurator). */
export function SelectTriggerPreview({ size = 'md', state = 'default', filled = false, invalid = false }: SelectTriggerPreviewProps) {
  return (
    <div
      className="ds-select"
      data-size={size}
      data-preview-state={state === 'hover' || state === 'focused' ? state : undefined}
      data-disabled={state === 'disabled' ? '' : undefined}
      aria-disabled={state === 'disabled' || undefined}
      data-invalid={invalid ? '' : undefined}
    >
      <span className="ds-select__value" data-placeholder={filled ? undefined : ''}>
        {filled ? 'Honeycrisp' : 'Select apple'}
      </span>
      <span className="ds-select__icon" aria-hidden>
        <CaretUpDown weight="fill" />
      </span>
    </div>
  )
}
