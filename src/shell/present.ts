// Moving between preparation (the hub) and the client demo. Opening the demo remembers where the
// presenter came from, so "Back to preparation" always lands on the same page (or slide).

import { useLocation, useNavigate } from 'react-router'
import { client } from '@/app/routes'
import { act } from '@/state/hooks'
import { useStore } from '@/state/store'
import type { Project } from '@/state/types'
import { HERO } from '@/features/demo/steps'

/** The guided story follows one finding; a project whose demo version lacks it can be explored, not narrated. */
export function storyFits(p: Project | undefined) {
  return Boolean(p?.published?.state.findings.some((f) => f.id === HERO))
}

/** The project the demo opens on: the one asked for when it has a published version, else Demo Brand. */
export function demoScenario(projects: Record<string, Project>, wanted?: string): Project | undefined {
  const p = wanted ? projects[wanted] : undefined
  if (p?.published) return p
  return projects['demo-brand'] ?? Object.values(projects).find((x) => x.published)
}

export interface PresentOptions {
  /** Start the guided story (meeting = short path, full = every chapter). */
  guide?: 'meeting' | 'full'
  /** Enter at this chapter; earlier steps the chapter needs are set up first. */
  chapter?: string
  /** A client-demo path to open instead of the demo's overview. */
  path?: string
  /** Where "Back to preparation" returns. Defaults to the current page. */
  returnTo?: string
}

export function usePresentDemo() {
  const navigate = useNavigate()
  const location = useLocation()
  return (projectId?: string, opts: PresentOptions = {}) => {
    const s = useStore.getState()
    let target = demoScenario(s.projects, projectId ?? s.selectedProjectId)
    if (target && opts.guide && !storyFits(target) && storyFits(s.projects['demo-brand'])) {
      act().pushToast({ kind: 'info', title: 'The story runs on Demo Brand', detail: `The guided story follows one example that ${target.client.name}’s demo version does not include. You can still explore ${target.client.name} freely.` })
      target = s.projects['demo-brand']
      projectId = target.id
    }
    if (!target) {
      act().pushToast({ kind: 'warn', title: 'No client demo version yet', detail: 'Update the client demo from a project’s Overview first. Demo Brand always has one after “Reset sample data”.' })
      return
    }
    if (projectId && target.id !== projectId) {
      act().pushToast({ kind: 'info', title: `Showing Demo Brand`, detail: `${s.projects[projectId]?.client.name ?? 'This project'} has no client demo version yet. Update the client demo from its Overview to show it instead.` })
    }
    act().setReturnTo(opts.returnTo ?? location.pathname + location.search)
    act().openClientExperience(target.id)
    const base = opts.path ?? client(target.slug).home
    const q = new URLSearchParams()
    if (opts.guide) q.set('guide', opts.guide)
    if (opts.chapter) q.set('chapter', opts.chapter)
    const qs = q.toString()
    navigate(qs ? `${base}${base.includes('?') ? '&' : '?'}${qs}` : base)
  }
}
