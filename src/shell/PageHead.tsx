import type { ReactNode } from 'react'
import { SCREENS } from '@/app/screens'
import { SimBadge, StatusChip } from './ui'
import { AreaTabs, Breadcrumbs, type Crumb } from './nav'
import { useIsClient } from '@/state/hooks'

export function PageHead({ screen, title, lead, actions, eyebrow, crumbs, noTabs }: { screen?: keyof typeof SCREENS; title: ReactNode; lead?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode; crumbs?: Crumb[]; noTabs?: boolean }) {
  const meta = screen ? SCREENS[screen] : undefined
  const client = useIsClient()
  return (
    <div className="page__top">
      {!noTabs && <AreaTabs />}
      {crumbs && crumbs.length > 0 && <Breadcrumbs items={crumbs} />}
      <header className="page__head">
        <div className="page__title">
          <div className="page__eyebrow">
            {meta && !client && import.meta.env.VITE_TARGET !== 'demo' && (
              <>
                <span>
                  {meta.area} · screen {meta.n}
                </span>
                <StatusChip status={meta.status} />
              </>
            )}
            {meta?.simulated && <SimBadge detail={meta.simulated} />}
            {eyebrow}
          </div>
          <h1>{title}</h1>
          {lead && <p className="page__lead">{lead}</p>}
        </div>
        {actions && <div className="page__actions">{actions}</div>}
      </header>
    </div>
  )
}
