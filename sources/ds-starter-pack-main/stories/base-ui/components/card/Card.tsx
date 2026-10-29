import * as React from 'react'

import './card.css'
import './card.tokens.css'
import type { CardType } from './card.spec'

export type { CardType }

export interface CardProps extends Omit<React.ComponentProps<'div'>, 'className' | 'title'> {
  /** Figma's Type: Outline (a border) or Elevated (a shadow). */
  type?: CardType
  title?: React.ReactNode
  /** Makes the title a heading of this level (h2–h6), to fit the page's outline. Default: plain text. */
  headingLevel?: 2 | 3 | 4 | 5 | 6
  description?: React.ReactNode
  /** Actions, right-aligned under the body. */
  footer?: React.ReactNode
  className?: string
}

/** Styles: card.css (layout) + card.tokens.css (generated from card.spec.ts). */
export function Card({ type = 'outline', title, headingLevel, description, footer, children, className, ...props }: CardProps) {
  const Title = headingLevel ? (`h${headingLevel}` as const) : 'div'
  return (
    <div className={['ds-card', className].filter(Boolean).join(' ')} data-type={type} {...props}>
      {title || description ? (
        <div className="ds-card__header">
          {title ? <Title className="ds-card__title">{title}</Title> : null}
          {description ? <p className="ds-card__description">{description}</p> : null}
        </div>
      ) : null}
      {children ? <div className="ds-card__body">{children}</div> : null}
      {footer ? <div className="ds-card__footer">{footer}</div> : null}
    </div>
  )
}
