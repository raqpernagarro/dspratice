import { Link, useLocation } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { areaTabsFor } from './useWorkspace'
import { useProject } from '@/state/hooks'
import { usePaths } from '@/state/hooks'
import { cx } from './ui'

export interface Crumb {
  label: string
  to?: string
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  if (!items.length) return null
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      {items.map((c, i) => (
        <span key={i} className="crumbs__item">
          {c.to && i < items.length - 1 ? <Link to={c.to}>{c.label}</Link> : <span aria-current={i === items.length - 1 ? 'page' : undefined}>{c.label}</span>}
          {i < items.length - 1 && <ChevronRight className="crumbs__sep" aria-hidden="true" />}
        </span>
      ))}
    </nav>
  )
}

/** Secondary navigation for the current area, rendered in the page header. Stable per area. */
export function AreaTabs() {
  const { pathname, search } = useLocation()
  const r = usePaths()
  const project = useProject()
  const tabs = areaTabsFor(pathname, r, { proposalPublished: (project.clientExperience.publishedOutputs ?? []).some((o) => !o.retractedAt) })
  if (!tabs) return null
  const current = pathname + search
  return (
    <nav className="area-tabs" aria-label="Section">
      {tabs.map((t) => {
        const base = t.match ?? t.to.split('?')[0]
        const exactQuery = t.to.includes('?')
        // A tab is active on its own path and on deeper paths, unless a sibling tab sits deeper on that path.
        const deeperSibling = tabs.some((o) => {
          if (o === t || o.to.includes('?')) return false
          const ob = o.match ?? o.to.split('?')[0]
          return ob.length > base.length && (pathname === ob || pathname.startsWith(ob + '/'))
        })
        let active: boolean
        if (exactQuery) active = current === t.to
        else if (t.match) active = (pathname === base || (pathname.startsWith(base + '/') && !deeperSibling)) && !search.includes('tab=')
        else active = pathname === base || (pathname.startsWith(base + '/') && !deeperSibling)
        return (
          <Link key={t.to} to={t.to} className={cx('area-tabs__tab', active && 'is-active')} aria-current={active ? 'page' : undefined}>
            {t.label}
          </Link>
        )
      })}
    </nav>
  )
}
