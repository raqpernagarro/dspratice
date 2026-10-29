import * as React from 'react'
import { Accordion as BaseAccordion } from '@base-ui/react/accordion'
import { Plus } from '@phosphor-icons/react'

import './accordion.css'
import './accordion.tokens.css'
import './accordion-item.tokens.css'

const cx = (...c: (string | undefined | false)[]) => c.filter(Boolean).join(' ')

function Root({ className, ...props }: Omit<React.ComponentProps<typeof BaseAccordion.Root>, 'className'> & { className?: string }) {
  return <BaseAccordion.Root className={cx('ds-accordion', className)} {...props} />
}

export interface AccordionItemProps extends Omit<React.ComponentProps<typeof BaseAccordion.Item>, 'className' | 'title'> {
  /** The heading. */
  title: React.ReactNode
  className?: string
}

/** One section: heading (trigger with a plus that turns into a cross) and panel. */
function Item({ title, className, children, disabled, ...props }: AccordionItemProps) {
  return (
    <BaseAccordion.Item className={cx('ds-accordion-item', className)} disabled={disabled} {...props}>
      <BaseAccordion.Header className="ds-accordion-item__header">
        <BaseAccordion.Trigger className="ds-accordion-item__trigger">
          <span className="ds-accordion-item__label">{title}</span>
          <span className="ds-accordion-item__icon" aria-hidden>
            <Plus weight="bold" />
          </span>
        </BaseAccordion.Trigger>
      </BaseAccordion.Header>
      <BaseAccordion.Panel className="ds-accordion-item__panel">
        <div className="ds-accordion-item__content">{children}</div>
      </BaseAccordion.Panel>
    </BaseAccordion.Item>
  )
}

/** Styles: accordion.css (layout) + accordion.tokens.css / accordion-item.tokens.css (generated from the specs). */
export const Accordion = { Root, Item }

/** An item drawn statically, with the data attributes Base UI sets (docs, configurator). */
export function AccordionItemPreview({ open = false, state = 'default', title = 'What is Base UI?', children = 'A library of unstyled React components for design systems and web apps.' }: { open?: boolean; state?: 'default' | 'hover' | 'disabled'; title?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="ds-accordion-item" data-open={open ? '' : undefined} style={{ borderTopWidth: 0 }}>
      <h3 className="ds-accordion-item__header">
        <span
          className="ds-accordion-item__trigger"
          data-panel-open={open ? '' : undefined}
          data-disabled={state === 'disabled' ? '' : undefined}
          aria-disabled={state === 'disabled' || undefined}
          data-preview-state={state === 'hover' ? 'hover' : undefined}
        >
          <span className="ds-accordion-item__label">{title}</span>
          <span className="ds-accordion-item__icon" aria-hidden>
            <Plus weight="bold" />
          </span>
        </span>
      </h3>
      {open ? (
        <div className="ds-accordion-item__panel" data-open="">
          <div className="ds-accordion-item__content">{children}</div>
        </div>
      ) : null}
    </div>
  )
}
