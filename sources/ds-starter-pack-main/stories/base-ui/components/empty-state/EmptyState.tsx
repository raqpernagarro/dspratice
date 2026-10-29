import * as React from 'react'

import './empty-state.css'
import './empty-state.tokens.css'

export interface EmptyStateProps extends Omit<React.ComponentProps<'div'>, 'className' | 'title'> {
  /** A Phosphor icon element that hints at what belongs here: <FolderSimple weight="fill" />. */
  icon?: React.ReactNode
  title: React.ReactNode
  /** Makes the title a heading of this level (h2–h6). Default: plain text. */
  headingLevel?: 2 | 3 | 4 | 5 | 6
  description?: React.ReactNode
  /** Usually one Button. */
  actions?: React.ReactNode
  className?: string
}

/** Styles: empty-state.css (layout) + empty-state.tokens.css (generated from empty-state.spec.ts). */
export function EmptyState({ icon, title, headingLevel, description, actions, className, ...props }: EmptyStateProps) {
  const Title = headingLevel ? (`h${headingLevel}` as const) : 'div'
  return (
    <div className={['ds-empty-state', className].filter(Boolean).join(' ')} {...props}>
      {icon ? (
        <span className="ds-empty-state__icon" aria-hidden>
          <span className="ds-empty-state__glyph">{icon}</span>
        </span>
      ) : null}
      <div className="ds-empty-state__text">
        <Title className="ds-empty-state__title">{title}</Title>
        {description ? <p className="ds-empty-state__description">{description}</p> : null}
      </div>
      {actions ? <div className="ds-empty-state__actions">{actions}</div> : null}
    </div>
  )
}
