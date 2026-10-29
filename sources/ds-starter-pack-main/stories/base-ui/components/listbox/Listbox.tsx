import * as React from 'react'
import { Check } from '@phosphor-icons/react'

import '../shared/popup.css'
import './listbox.css'
import './listbox.tokens.css'
import './option.tokens.css'

/*
 * The popup and rows shared by Select, Combobox and Autocomplete. Each of them renders its own Base
 * UI parts (Select.Item, Combobox.Item, …) with these classes; this file holds the shared markup.
 */

export const LISTBOX_CLASS = 'ds-popup ds-listbox'
export const OPTION_CLASS = 'ds-option'

/** The check glyph inside an option's indicator. */
export const OptionCheck = () => <Check weight="bold" />

export interface OptionPreviewProps {
  state?: 'default' | 'highlighted' | 'disabled'
  selected?: boolean
  /** Show the indicator slot (Figma: Show indicator). Default true. */
  indicator?: boolean
  children?: React.ReactNode
}

/** An option drawn statically, with the data attributes Base UI sets (docs, configurator). */
export function OptionPreview({ state = 'default', selected = false, indicator = true, children = 'Option' }: OptionPreviewProps) {
  return (
    <div
      className={OPTION_CLASS}
      data-highlighted={state === 'highlighted' ? '' : undefined}
      data-disabled={state === 'disabled' ? '' : undefined}
      aria-disabled={state === 'disabled' || undefined}
      data-selected={selected ? '' : undefined}
    >
      {indicator ? (
        <span className="ds-option__indicator">
          {selected ? (
            <span className="ds-option__icon">
              <OptionCheck />
            </span>
          ) : null}
        </span>
      ) : null}
      <span className="ds-option__label">{children}</span>
    </div>
  )
}

/** The list drawn statically, as in Figma: a few options, one selected and one highlighted. */
export function ListboxPreview({ indicator = true, empty }: { indicator?: boolean; empty?: React.ReactNode }) {
  return (
    <div className={LISTBOX_CLASS} data-preview style={{ width: 220 }}>
      {empty ? (
        <div className="ds-listbox__empty">{empty}</div>
      ) : (
        <>
          <OptionPreview indicator={indicator}>Gala</OptionPreview>
          <OptionPreview indicator={indicator} selected={indicator}>
            Fuji
          </OptionPreview>
          <OptionPreview indicator={indicator} state="highlighted">
            Honeycrisp
          </OptionPreview>
          <OptionPreview indicator={indicator}>Granny Smith</OptionPreview>
        </>
      )}
    </div>
  )
}
