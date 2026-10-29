import * as React from 'react'
import { Combobox as BaseCombobox } from '@base-ui/react/combobox'
import { CaretDown, X } from '@phosphor-icons/react'

import { LISTBOX_CLASS, OPTION_CLASS, OptionCheck } from '../listbox/Listbox'
import { useControlSize } from '../shared/control-size'
import './combobox.css'
import './combobox.tokens.css'
import type { ComboboxSize } from './combobox.spec'

export type { ComboboxSize }

const cx = (...c: (string | undefined | false)[]) => c.filter(Boolean).join(' ')

export interface ComboboxInputProps extends Omit<React.ComponentProps<typeof BaseCombobox.Input>, 'className' | 'size'> {
  /** Defaults to the enclosing Field's size, else md. */
  size?: ComboboxSize
  className?: string
  /** Static state preview (docs, configurator). */
  'data-preview-state'?: 'hover' | 'focused'
}

/** The field box: text input, clear button (while there's a value) and trigger. */
function Input({ size, className, 'data-preview-state': previewState, ...props }: ComboboxInputProps) {
  const contextSize = useControlSize()
  return (
    <BaseCombobox.InputGroup className={cx('ds-combobox', className)} data-size={size ?? contextSize ?? 'md'} data-preview-state={previewState}>
      <BaseCombobox.Input className="ds-combobox__value" {...props} />
      <BaseCombobox.Clear className="ds-combobox__clear" aria-label="Clear selection">
        <X weight="bold" />
      </BaseCombobox.Clear>
      <BaseCombobox.Trigger className="ds-combobox__trigger" aria-label="Open list">
        <CaretDown weight="fill" />
      </BaseCombobox.Trigger>
    </BaseCombobox.InputGroup>
  )
}

/** Portal + positioner + Listbox. Put Combobox.Empty and Combobox.List inside. */
function Popup({ className, ...props }: Omit<React.ComponentProps<typeof BaseCombobox.Popup>, 'className'> & { className?: string }) {
  return (
    <BaseCombobox.Portal>
      <BaseCombobox.Positioner className="ds-listbox__positioner" sideOffset={4}>
        <BaseCombobox.Popup className={cx(LISTBOX_CLASS, className)} {...props} />
      </BaseCombobox.Positioner>
    </BaseCombobox.Portal>
  )
}

/** Shown when the search matches nothing. */
function Empty({ children }: { children: React.ReactNode }) {
  return (
    <BaseCombobox.Empty>
      <div className="ds-listbox__empty">{children}</div>
    </BaseCombobox.Empty>
  )
}

function List({ className, ...props }: Omit<React.ComponentProps<typeof BaseCombobox.List>, 'className'> & { className?: string }) {
  return <BaseCombobox.List className={cx('ds-listbox__list', className)} {...props} />
}

/** An Option: check indicator + label. */
function Item({ className, children, ...props }: Omit<React.ComponentProps<typeof BaseCombobox.Item>, 'className'> & { className?: string }) {
  return (
    <BaseCombobox.Item className={cx(OPTION_CLASS, className)} {...props}>
      <span className="ds-option__indicator">
        <BaseCombobox.ItemIndicator className="ds-option__icon">
          <OptionCheck />
        </BaseCombobox.ItemIndicator>
      </span>
      <span className="ds-option__label">{children}</span>
    </BaseCombobox.Item>
  )
}

/**
 * Styles: combobox.css (layout) + combobox.tokens.css (generated from combobox.spec.ts); the popup
 * is a Listbox of Options (listbox/).
 */
export const Combobox = { Root: BaseCombobox.Root, Input, Popup, Empty, List, Item }

/** The field drawn statically, with the data attributes Base UI sets (docs, configurator). Clear only shows while there's a value. */
export function ComboboxFieldPreview({
  size = 'md',
  filled = false,
  invalid = false,
  disabled = false,
  previewState,
}: {
  size?: ComboboxSize
  filled?: boolean
  invalid?: boolean
  disabled?: boolean
  previewState?: 'hover' | 'focused'
}) {
  return (
    <div className="ds-combobox" data-size={size} data-preview-state={previewState}>
      <input
        className="ds-combobox__value"
        placeholder="e.g. Apple"
        defaultValue={filled ? 'Apple' : undefined}
        data-invalid={invalid ? '' : undefined}
        data-disabled={disabled ? '' : undefined}
        disabled={disabled}
        tabIndex={-1}
        readOnly
      />
      {filled ? (
        <span className="ds-combobox__clear" aria-hidden>
          <X weight="bold" />
        </span>
      ) : null}
      <span className="ds-combobox__trigger" aria-hidden>
        <CaretDown weight="fill" />
      </span>
    </div>
  )
}
