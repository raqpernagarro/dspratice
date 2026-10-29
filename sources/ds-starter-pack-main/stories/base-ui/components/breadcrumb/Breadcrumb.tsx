import * as React from 'react'
import { CaretRight } from '@phosphor-icons/react'

import './breadcrumb.css'
import './breadcrumb.tokens.css'
import './breadcrumb-item.tokens.css'

export interface BreadcrumbRootProps extends Omit<React.ComponentProps<'nav'>, 'className'> {
  className?: string
}

/** A nav landmark around an ordered list of Breadcrumb.Item. */
function Root({ className, children, 'aria-label': label = 'Breadcrumb', ...props }: BreadcrumbRootProps) {
  return (
    <nav className={['ds-breadcrumb', className].filter(Boolean).join(' ')} aria-label={label} {...props}>
      <ol className="ds-breadcrumb__list">{children}</ol>
    </nav>
  )
}

export interface BreadcrumbItemProps extends Omit<React.ComponentProps<'a'>, 'className'> {
  /** The page you're on: plain text with aria-current="page", and no separator after it. */
  current?: boolean
  className?: string
  /** Static state preview (docs, configurator). */
  'data-preview-state'?: 'hover'
}

function Item({ current = false, href, className, children, 'data-preview-state': previewState, ...props }: BreadcrumbItemProps) {
  return (
    <li className={['ds-breadcrumb-item', className].filter(Boolean).join(' ')}>
      <a className="ds-breadcrumb-item__link" href={current ? undefined : href} aria-current={current ? 'page' : undefined} data-preview-state={previewState} {...props}>
        {children}
      </a>
      {current ? null : (
        <span className="ds-breadcrumb-item__separator" aria-hidden>
          <CaretRight weight="fill" />
        </span>
      )}
    </li>
  )
}

/** Styles: breadcrumb.css (layout) + breadcrumb(-item).tokens.css (generated from their specs). */
export const Breadcrumb = { Root, Item }
