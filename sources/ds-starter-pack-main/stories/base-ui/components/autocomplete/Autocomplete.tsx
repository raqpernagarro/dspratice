import * as React from 'react'
import { Autocomplete as BaseAutocomplete } from '@base-ui/react/autocomplete'
import { MagnifyingGlass } from '@phosphor-icons/react'

import '../input/input.css'
import '../input/input.tokens.css'
import { LISTBOX_CLASS, OPTION_CLASS } from '../listbox/Listbox'
import { useControlSize } from '../shared/control-size'
import type { InputSize } from '../input/input.spec'

const cx = (...c: (string | undefined | false)[]) => c.filter(Boolean).join(' ')

export interface AutocompleteInputProps extends Omit<React.ComponentProps<typeof BaseAutocomplete.Input>, 'className' | 'size'> {
  /** Defaults to the enclosing Field's size, else md. */
  size?: InputSize
  /** Leading icon (decorative). Defaults to a magnifying glass, like Input. */
  icon?: React.ReactNode
  showIcon?: boolean
  className?: string
}

/** An Input (same box, icon and tokens) whose value element is Autocomplete.Input. */
function Input({ size, icon = <MagnifyingGlass weight="fill" />, showIcon = true, className, ...props }: AutocompleteInputProps) {
  const contextSize = useControlSize()
  return (
    <label className={cx('ds-input', className)} data-size={size ?? contextSize ?? 'md'}>
      {showIcon && icon ? (
        <span className="ds-input__icon" aria-hidden>
          {icon}
        </span>
      ) : null}
      <BaseAutocomplete.Input className="ds-input__value" {...props} />
    </label>
  )
}

/** Portal + positioner + Listbox. Put Autocomplete.Empty and Autocomplete.List inside. */
function Popup({ className, ...props }: Omit<React.ComponentProps<typeof BaseAutocomplete.Popup>, 'className'> & { className?: string }) {
  return (
    <BaseAutocomplete.Portal>
      <BaseAutocomplete.Positioner className="ds-listbox__positioner" sideOffset={4}>
        <BaseAutocomplete.Popup className={cx(LISTBOX_CLASS, className)} {...props} />
      </BaseAutocomplete.Positioner>
    </BaseAutocomplete.Portal>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <BaseAutocomplete.Empty>
      <div className="ds-listbox__empty">{children}</div>
    </BaseAutocomplete.Empty>
  )
}

function List({ className, ...props }: Omit<React.ComponentProps<typeof BaseAutocomplete.List>, 'className'> & { className?: string }) {
  return <BaseAutocomplete.List className={cx('ds-listbox__list', className)} {...props} />
}

/** An Option without indicator: a suggestion fills the input, nothing stays selected. */
function Item({ className, children, ...props }: Omit<React.ComponentProps<typeof BaseAutocomplete.Item>, 'className'> & { className?: string }) {
  return (
    <BaseAutocomplete.Item className={cx(OPTION_CLASS, className)} {...props}>
      <span className="ds-option__label">{children}</span>
    </BaseAutocomplete.Item>
  )
}

/** Styles: Input's (input/) for the field, Listbox and Option (listbox/) for the suggestions. */
export const Autocomplete = { Root: BaseAutocomplete.Root, Input, Popup, Empty, List, Item }
