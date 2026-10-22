import { useEffect, type ReactNode } from 'react'
import { AreaTabs, Breadcrumbs, type Crumb } from './nav'
import { useIsClient } from '@/state/hooks'

/**
 * Every page's header: section tabs, breadcrumbs, title, one-line lead and the page's actions.
 * `eyebrow` is for a short, meaningful label (e.g. "Sample data"); build details never go here.
 */
export function PageHead({ title, lead, actions, eyebrow, crumbs, noTabs }: { title: ReactNode; lead?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode; crumbs?: Crumb[]; noTabs?: boolean }) {
  const client = useIsClient()
  useEffect(() => {
    if (typeof title === 'string') document.title = `${title} · ${client ? 'Client demo' : 'Design systems hub'} · Nagarro`
  }, [title, client])
  return (
    <div className="page__top">
      {!noTabs && <AreaTabs />}
      {crumbs && crumbs.length > 0 && <Breadcrumbs items={crumbs} />}
      <header className="page__head">
        <div className="page__title">
          {eyebrow && <div className="page__eyebrow">{eyebrow}</div>}
          <h1>{title}</h1>
          {lead && <p className="page__lead">{lead}</p>}
        </div>
        {actions && <div className="page__actions">{actions}</div>}
      </header>
    </div>
  )
}
