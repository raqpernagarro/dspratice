// The Projects board card (schema v5): derived from what a project already records, then the
// shared board file (src/fixtures/team-board.json) on top. Local edits go through updateCard.

import board from '@/fixtures/team-board.json'
import type { Package, Project, ProjectCard, ProjectStatus, ProjectTag, Stage } from './types'

export interface TeamPerson {
  id: string
  name: string
  role?: string
  /** The practice tool or work they are known for, shown under the name. */
  knownFor?: string
}

/** Work recorded in the shared file that is not a project in this browser. */
export interface SharedEntry {
  id: string
  client: { name: string; sector: string }
  title?: string
  /** Where to open it in the workspace, if anywhere. */
  open?: string
  /** A fictional entry that shows how the board works. */
  sample?: boolean
  card: ProjectCard
}

export const TEAM: TeamPerson[] = board.people
export const SHARED: SharedEntry[] = board.shared as SharedEntry[]
const CARDS = board.cards as Record<string, Partial<ProjectCard>>

/** The practice's default "me" until someone picks themselves. */
export const DEFAULT_ME = 'raquel-pereira'

export function person(id: string): TeamPerson | undefined {
  return TEAM.find((p) => p.id === id)
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('')
}

export function flag(country?: string) {
  if (!country || !/^[A-Za-z]{2}$/.test(country)) return ''
  return String.fromCodePoint(...[...country.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0)))
}

/** Only real addresses become links: sample projects carry placeholders such as "figma.com/design/… · Contoso UI". */
export const isRealLink = (v?: string): v is string => Boolean(v && /^https?:\/\/\S+$/.test(v) && !v.includes('…'))
const realLink = (...values: (string | undefined)[]) => values.find(isRealLink)

const STATUS_BY_STAGE: Record<Stage, ProjectStatus> = { scoping: 'opportunity', assessing: 'in-progress', building: 'in-progress', adapting: 'in-progress', scaling: 'in-progress', supporting: 'delivered' }
const TAGS_BY_PACKAGE: Record<Package, ProjectTag[]> = { '2-week AI audit': ['ai-ready'], 'DS Build': ['design-system'], 'DS Accelerate': ['design-system', 'ai-ready'], 'DS Scale': ['design-system'], Support: ['design-system'] }

/** The card a project gets from its own data and the shared file, before any local edit. */
export function deriveCard(p: Pick<Project, 'id' | 'engagement' | 'draft' | 'opportunities'>): ProjectCard {
  const onlyRequests = Object.keys(p.opportunities ?? {}).length > 0 && p.engagement.stage === 'scoping'
  const connect = p.draft.journey?.connect
  const base: ProjectCard = {
    status: onlyRequests ? 'opportunity' : STATUS_BY_STAGE[p.engagement.stage],
    tags: [...TAGS_BY_PACKAGE[p.engagement.package]],
    brief: p.engagement.notes,
    links: {
      figma: realLink(connect?.figmaUrl, p.draft.theme.figmaUrl),
      code: realLink(connect?.repoUrl, p.draft.theme.repoUrl),
    },
    peopleIds: [],
  }
  const shared = CARDS[p.id] ?? {}
  return { ...base, ...shared, links: { ...base.links, ...shared.links } }
}

export const STATUS_LABEL: Record<ProjectStatus, string> = { opportunity: 'Opportunity', 'in-progress': 'In progress', delivered: 'Delivered', paused: 'Paused' }
export const TAG_LABEL: Record<ProjectTag, string> = { 'product-design': 'Product design', 'design-system': 'Design system', prototype: 'Prototype', 'ai-ready': 'AI-ready' }
