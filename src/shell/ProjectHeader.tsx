// The header of every project page: where you are (Projects › client), which project, whether the
// client demo shows the latest draft, and the project's own sections. The sidebar keeps "Projects"
// selected underneath it, so the parent never changes on detail pages.

import { Link, useLocation, useNavigate } from 'react-router'
import { useStore } from '@/state/store'
import { act, usePaths, useProject } from '@/state/hooks'
import { nagarro, practice, type RouteFamily } from '@/app/routes'
import { hasUnpublishedChanges } from '@/state/scope'
import type { Project } from '@/state/types'
import { Breadcrumbs } from './nav'
import { cx } from './ui'

export function projectTabs(r: RouteFamily) {
  const b = r.home
  return [
    { label: 'Overview', to: r.home, match: [b, `${b}/journey`, `${b}/ai`] },
    { label: 'Design system', to: r.components, match: [`${b}/system`] },
    { label: 'Changes', to: r.changes, match: [`${b}/changes`] },
    { label: 'Report', to: r.report, match: [`${b}/report`] },
    { label: 'Settings', to: r.contract, match: [`${b}/settings`] },
  ]
}

/** Which project tab owns a path: the longest match wins, and Overview owns the project root and its journeys. */
export function activeProjectTab(r: RouteFamily, pathname: string) {
  let best: string | undefined
  let len = -1
  for (const t of projectTabs(r)) {
    for (const m of t.match) {
      const hit = m === r.home ? pathname === m : pathname === m || pathname.startsWith(m + '/')
      if (hit && m.length > len) {
        best = t.label
        len = m.length
      }
    }
  }
  return best
}

export function demoVersionLabel(p: Project) {
  if (!p.published) return 'No client demo version yet'
  return hasUnpublishedChanges(p) ? `Client demo shows v${p.published.version} · draft has changes` : `Client demo shows v${p.published.version} · up to date`
}

export function ProjectHeader() {
  const project = useProject()
  const projects = useStore((s) => s.projects)
  const r = usePaths()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const active = activeProjectTab(r, pathname)
  const onOverview = pathname === r.home

  return (
    <div className="page project-head">
      <Breadcrumbs items={[{ label: 'Projects', to: practice.myWork }, { label: project.client.name, to: onOverview ? undefined : r.home }]} />
      <div className="project-head__row">
        <div className="project-head__id">
          <select
            className="select project-head__select"
            value={project.id}
            aria-label="Project"
            onChange={(e) => {
              const next = projects[e.target.value]
              if (!next) return
              act().selectProject(next.id)
              navigate(nagarro(next.slug).home)
            }}
          >
            {Object.values(projects).map((p) => (
              <option key={p.id} value={p.id}>
                {p.client.name}
                {p.client.fictional ? ' (sample)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>
      <nav className="project-tabs" aria-label="Project sections">
        {projectTabs(r).map((t) => (
          <Link key={t.label} to={t.to} className={cx('project-tabs__tab', active === t.label && 'is-active')} aria-current={active === t.label ? 'page' : undefined}>
            {t.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
