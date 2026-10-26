// Every client request and deck across projects, as one list: what it is, whose, where it stands
// and where to continue. Home shows the unfinished ones; Prepare a client conversation shows all.

import { practice } from '@/app/routes'
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
