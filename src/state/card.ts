// A project's card (schema v5): derived from what the project already records, then the sample cards
// in src/fixtures/project-cards.json on top. Local edits go through updateCard. Projects are not shared
// between people (NDA): there is no team board.

import cards from '@/fixtures/project-cards.json'
import type { Package, Project, ProjectCard, ProjectStatus, ProjectTag, Stage } from './types'

const CARDS = cards.cards as Record<string, Partial<ProjectCard>>

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
  const sample = CARDS[p.id] ?? {}
  return { ...base, ...sample, links: { ...base.links, ...sample.links } }
}

export const STATUS_LABEL: Record<ProjectStatus, string> = { opportunity: 'Opportunity', 'in-progress': 'In progress', delivered: 'Delivered', paused: 'Paused' }
export const TAG_LABEL: Record<ProjectTag, string> = { 'product-design': 'Product design', 'design-system': 'Design system', prototype: 'Prototype', 'ai-ready': 'AI-ready' }
