import { CheckCircle, Info, Warning, XCircle } from '@phosphor-icons/react'

import { Button } from '../../../stories/base-ui/components/button/Button'

/** Cards composed only from semantic tokens + existing components. */
export function CardPattern() {
  return (
    <div className="sc-cards">
      <article className="ds-card">
        <div className="ds-card__body">
          <p className="ds-card__eyebrow">Project</p>
          <h4 className="ds-card__title">Atlas redesign</h4>
          <p className="ds-card__text">Unify the onboarding flow across web and mobile using the new component set.</p>
        </div>
        <footer className="ds-card__footer">
          <Button variant="secondary" size="sm">
            Details
          </Button>
          <Button variant="primary" size="sm">
            Open
          </Button>
        </footer>
      </article>

      <article className="ds-card">
        <div className="ds-card__body">
          <p className="ds-card__eyebrow">Monthly active users</p>
          <p className="ds-card__metric">24,318</p>
          <p className="ds-card__text">
            <span className="ds-card__delta">+12.4%</span> from last month
          </p>
        </div>
      </article>
    </div>
  )
}

const STATUS_MESSAGES = [
  { kind: 'info', icon: Info, title: 'New version available', body: 'Refresh to get the latest components.' },
  { kind: 'success', icon: CheckCircle, title: 'Theme published', body: 'Your changes are live for the team.' },
  { kind: 'warning', icon: Warning, title: 'Low contrast', body: 'Two text pairs are below AA.' },
  { kind: 'error', icon: XCircle, title: 'Sync failed', body: 'The server could not be reached.' },
] as const

/** Status colors: tinted alerts (subtle + border + text) and a solid toast (strong + on-*). */
export function StatusPattern() {
  return (
    <div className="sc-status">
      <ul className="sc-status__alerts">
        {STATUS_MESSAGES.map(({ kind, icon: IconCmp, title, body }) => (
          <li key={kind} className="sc-alert" data-kind={kind}>
            <IconCmp weight="fill" className="sc-alert__icon" />
            <span>
              <strong>{title}</strong>
              <span>{body}</span>
            </span>
          </li>
        ))}
      </ul>
      <div className="sc-status__toasts">
        {STATUS_MESSAGES.map(({ kind, icon: IconCmp, title }) => (
          <div key={kind} className="sc-toast" data-kind={kind}>
            <IconCmp weight="fill" />
            {title}
          </div>
        ))}
      </div>
    </div>
  )
}
