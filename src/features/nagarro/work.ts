// What is in progress, for Projects › My work and the project's Requests & decks tab: every client
// request and deck (one list across projects or for one), and the set-up journeys started and not
// finished, each with where to continue.

import { useStore } from '@/state/store'
import { nagarro, practice } from '@/app/routes'
import { journeySummary, improveSlug } from '@/state/journeyProgress'
import { opportunityProgress } from '@/opportunity/progress'
import { stepMeta } from '@/features/opportunity/steps'
import type { Project } from '@/state/types'

export interface ConversationItem {
  key: string
  kind: 'Client request' | 'Presentation'
  title: string
  client: string
  status: string
  to: string
  at: number
  /** A response with every step done, or a downloaded deck. */
  done: boolean
}

export function conversationItems(projects: Record<string, Project>): ConversationItem[] {
  const items: ConversationItem[] = []
  for (const p of Object.values(projects)) {
    for (const o of Object.values(p.opportunities ?? {})) {
      const prog = opportunityProgress(o)
      items.push({
        key: `o-${o.id}`,
        kind: 'Client request',
        title: o.title,
        client: p.client.name,
        status: prog.next ? `${prog.done} of ${prog.total} steps done · Next: ${stepMeta(prog.next).next.toLowerCase()}` : 'Response ready',
        to: practice.opportunity(o.id, prog.next ?? 'export'),
        at: o.updatedAt,
        done: !prog.next,
      })
    }
    for (const d of Object.values(p.decks ?? {})) {
      const exported = d.stage === 'exported'
      items.push({
        key: `d-${d.id}`,
        kind: 'Presentation',
        title: d.title,
        client: p.client.name,
        status: `${d.slides.length} slides · ${exported ? 'Downloaded' : 'Next: present it, or edit it in Presentation Studio'}`,
        to: practice.deck(d.id),
        at: d.exportedAt ?? d.builtAt,
        done: exported,
      })
    }
  }
  return items.sort((a, b) => b.at - a.at)
}

export interface WorkItem {
  key: string
  kind: string
  title: string
  client: string
  projectId: string
  status: string
  to: string
  /** 0 when unknown (sample set-ups have no start date). */
  at: number
}

/** Unfinished requests and decks plus started set-up journeys, newest first. */
export function inProgress(projects: Record<string, Project>): WorkItem[] {
  const items: WorkItem[] = []
  for (const p of Object.values(projects)) {
    for (const i of conversationItems({ [p.id]: p })) if (!i.done) items.push({ ...i, projectId: p.id })
    for (const kind of ['new', 'improve'] as const) {
      const j = journeySummary(p.draft, kind)
      if (!j.started || j.complete) continue
      const r = nagarro(p.slug)
      items.push({
        key: `j-${p.id}-${kind}`,
        kind: kind === 'new' ? 'New design system' : 'Improve a system',
        title: `${p.client.name} set-up`,
        client: p.client.name,
        projectId: p.id,
        status: `${j.done} of ${j.total} steps done · Resume: ${j.resumeLabel.toLowerCase()}`,
        to: kind === 'new' ? r.journeyNew() : r.journeyImprove(improveSlug(j.resume)),
        at: p.draft.journey[kind].startedAt ?? 0,
      })
    }
  }
  return items.sort((a, b) => b.at - a.at)
}

export function useInProgress() {
  return inProgress(useStore((s) => s.projects))
}
