// The two workspace layouts. They derive the workspace from the route, keep the active scope in
// sync, read one-shot URL parameters and render the shell.

import { useEffect, useLayoutEffect } from 'react'
import { Navigate, Outlet, useParams, useSearchParams } from 'react-router'
import { AppShell } from './AppShell'
import { useStore } from '@/state/store'
import { act } from '@/state/hooks'
import { setActiveScope } from '@/state/scope'
import { client, practice } from '@/app/routes'
import { PublishedRequired } from '@/features/client/PublishedRequired'
import { ProjectHeader } from './ProjectHeader'
import { prepareChapter } from '@/features/demo/prepare'

export function NagarroLayout() {
  const selected = useStore((s) => s.selectedProjectId)
  useLayoutEffect(() => {
    setActiveScope({ projectId: selected, layer: 'draft' })
  }, [selected])
  useEffect(() => {
    act().setLastWorkspace('nagarro')
  }, [])
  return <AppShell workspace="nagarro" />
}

/** `/nagarro/clients/:slug/*`: the selected project follows the URL. */
export function ProjectRouteSync() {
  const { slug } = useParams()
  const projects = useStore((s) => s.projects)
  const project = Object.values(projects).find((p) => p.slug === slug)
  useLayoutEffect(() => {
    if (project) {
      act().selectProject(project.id)
      setActiveScope({ projectId: project.id, layer: 'draft' })
    }
  }, [project?.id])
  if (!project) return <Navigate to={practice.clients} replace />
  return (
    <>
      <ProjectHeader />
      <Outlet />
    </>
  )
}

/**
 * Opportunity and deck pages live under their practice-wide lists (`/nagarro/opportunities/:id`,
 * `/nagarro/presentations/:id`), so the sidebar parent never changes. The project that owns the
 * item becomes the selected project before the page renders.
 */
export function OwnerRouteSync({ kind }: { kind: 'opportunity' | 'deck' }) {
  const { id } = useParams()
  const ownerId = useStore((s) => Object.values(s.projects).find((p) => (kind === 'opportunity' ? p.opportunities?.[id ?? ''] : p.decks?.[id ?? '']))?.id)
  const selected = useStore((s) => s.selectedProjectId)
  useLayoutEffect(() => {
    if (ownerId) {
      act().selectProject(ownerId)
      setActiveScope({ projectId: ownerId, layer: 'draft' })
    }
  }, [ownerId])
  if (!ownerId) return <Navigate to={kind === 'opportunity' ? practice.opportunities : practice.presentations} replace />
  if (selected !== ownerId) return null
  return <Outlet />
}

export function ClientLayout() {
  const { slug } = useParams()
  const [params, setParams] = useSearchParams()
  const projects = useStore((s) => s.projects)
  const presenter = useStore((s) => s.ui.presenter)
  const lastWorkspace = useStore((s) => s.ui.lastWorkspace)
  const project = Object.values(projects).find((p) => p.slug === slug)

  useLayoutEffect(() => {
    if (project) {
      act().selectProject(project.id)
      setActiveScope({ projectId: project.id, layer: 'session' })
    }
  }, [project?.id])

  // One-shot parameters: ?presenter=1 flags the presenter.
  useEffect(() => {
    if (!project) return
    const wantsPresenter = params.get('presenter') === '1'
    const guide = params.get('guide')
    let changed = false
    if (wantsPresenter) {
      act().setPresenter(true)
      changed = true
    }
    // ?guide=meeting|full starts the story at chapter 1, or at ?chapter=<id> with its set-up done first.
    if (guide === 'meeting' || guide === 'full') {
      if (project.published) {
        act().startDemoSession(project.id, guide)
        const chapter = params.get('chapter')
        if (chapter) prepareChapter(chapter)
        act().startGuide(guide, chapter ?? undefined)
      }
      changed = true
    }
    act().setLastWorkspace('client')
    if (changed) {
      const next = new URLSearchParams(params)
      next.delete('presenter')
      next.delete('guide')
      next.delete('chapter')
      setParams(next, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id, params.get('presenter'), params.get('guide')])

  if (!project) return <Navigate to={practice.welcome} replace />
  const internal = presenter || lastWorkspace === 'nagarro'
  if (!project.published) {
    return (
      <AppShell workspace="client" bare>
        <PublishedRequired project={project} internal={internal} />
      </AppShell>
    )
  }
  if (!project.clientExperience.enabled && !presenter) {
    return (
      <AppShell workspace="client" bare>
        <PublishedRequired project={project} internal={internal} disabled />
      </AppShell>
    )
  }
  return <AppShell workspace="client" />
}

/** `/client` without a slug: the selected project if it can be shown, else the first that can. */
export function ClientEntry() {
  const projects = useStore((s) => s.projects)
  const selected = useStore((s) => s.selectedProjectId)
  const presenter = useStore((s) => s.ui.presenter)
  const can = (id: string) => {
    const p = projects[id]
    return Boolean(p?.published && (p.clientExperience.enabled || presenter))
  }
  const id = can(selected) ? selected : Object.keys(projects).find(can)
  if (!id) return <Navigate to={practice.welcome} replace />
  return <Navigate to={client(projects[id].slug).home} replace />
}
