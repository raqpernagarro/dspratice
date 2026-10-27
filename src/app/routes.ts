// Every path in the app comes from here. Two route families share the same keys so a page can
// render in either workspace and the switcher can find the equivalent page on the other side.

import { generatePath, matchPath } from 'react-router'
import type { Workspace } from '@/state/types'

export interface RouteFamily {
  workspace: Workspace
  slug: string
  home: string
  components: string
  component: (id: string) => string
  guidance: (id: string) => string
  tokens: string
  token: (id: string) => string
  foundations: string
  changes: string
  changesTab: (tab: 'prs' | 'figma') => string
  finding: (id: string) => string
  impact: (changeId: string) => string
  pr: (n: number | string) => string
  prFigma: (n: number | string) => string
  figma: (id: string) => string
  channels: string
  channel: (id: string) => string
  evals: string
  inbox: string
  prototype: string
  contract: string
  people: string
  brands: string
  trust: string
  audit: string
  report: string
  assessment: string
  handover: string
  outcome: string
  journeyNew: (step?: number | string) => string
  journeyImprove: (step?: ImproveStep) => string
  meeting: string
  guides: string
  guide: (id: string) => string
  presentations: string
  presentationNew: string
  presentation: (id: string) => string
  opportunities: string
  opportunityNew: string
  opportunity: (id: string, step?: OpportunityStep) => string
  proposalSummary: string
  scorecard: string
}

export type OpportunityStep = 'request' | 'context' | 'requirements' | 'sources' | 'response' | 'export'

/** The improve journey, in order. Old numeric steps (1–9) redirect to these. */
export const IMPROVE_STEPS = ['goals', 'connect', 'assess', 'findings', 'plan', 'mapping', 'review', 'handover'] as const
export type ImproveStep = (typeof IMPROVE_STEPS)[number]
/** Old numeric improve steps → their slug (3 · Inventory folded into Connect). */
export const IMPROVE_LEGACY: Record<string, ImproveStep> = { '1': 'goals', '2': 'connect', '3': 'connect', '4': 'assess', '5': 'findings', '6': 'plan', '7': 'mapping', '8': 'review', '9': 'handover' }

/** Practice-wide destinations (no project). */
export const practice = {
  welcome: '/',
  home: '/nagarro',
  /** Projects › Team board: every client and prospect. The path keeps its v3 name. */
  clients: '/nagarro/clients',
  projects: '/nagarro/clients',
  /** Projects › My work: what I left unfinished and the projects I am on. */
  myWork: '/nagarro/work',
  /** "Start a project": asks new or existing system, then goes to `startSystem`. */
  start: '/nagarro/start',
  startSystem: (journey: 'new' | 'improve') => `/nagarro/start?journey=${journey}`,
  guides: '/nagarro/guides',
  guide: (id: string) => `/nagarro/guides/${id}`,
  presentations: '/nagarro/presentations',
  presentationsFor: (slug: string) => `/nagarro/presentations?project=${slug}`,
  deckNew: '/nagarro/presentations/new',
  deck: (id: string) => `/nagarro/presentations/${id}`,
  settings: '/nagarro/settings',
  people: '/nagarro/settings/people',
  rules: '/nagarro/settings/rules',
  setup: '/nagarro/settings/setup',
  about: '/nagarro/settings/about',
  integrations: '/nagarro/settings/integrations',
  clientEntry: '/client',
  /** The sources behind responses and the AI (was the Knowledge library page; now Settings › Sources). */
  knowledge: '/nagarro/settings/sources',
  knowledgeAdd: '/nagarro/settings/sources/add',
  knowledgeSource: (id: string) => `/nagarro/settings/sources/${id}`,
  knowledgeTab: (tab: 'practice' | 'client' | 'attention') => `/nagarro/settings/sources?tab=${tab}`,
  /** Advocating design at Nagarro: posts, social cuts and Marketing Studio. */
  engagement: '/nagarro/engagement',
  /** Retired page (round 7): redirects to Home, whose journeys replaced it. */
  conversations: '/nagarro/conversations',
  tools: '/nagarro/tools',
  /** One practice tool opened in the workspace (src/fixtures/experiences.ts). The /nagarro/tools list itself redirects to Home. */
  tool: (id: string) => `/nagarro/tools/${id}`,
  demos: '/nagarro/demos',
  meetingPrep: (slug?: string) => (slug ? `/nagarro/demos/prepare?project=${slug}` : '/nagarro/demos/prepare'),
  opportunities: '/nagarro/opportunities',
  opportunitiesFor: (slug: string) => `/nagarro/opportunities?project=${slug}`,
  opportunityStart: '/nagarro/opportunities/new',
  opportunity: (id: string, step: OpportunityStep = 'request') => `/nagarro/opportunities/${id}/${step}`,
  opportunityEntry: (id: string) => `/nagarro/opportunities/${id}`,
  scorecard: '/nagarro/scorecard',
  presenterNotes: (slug: string) => `/presenter/${slug}`,
}

export function nagarro(slug: string): RouteFamily {
  const b = `/nagarro/clients/${slug}`
  return {
    workspace: 'nagarro',
    slug,
    home: b,
    components: `${b}/system/components`,
    component: (id) => `${b}/system/components/${id}`,
    guidance: (id) => `${b}/system/components/${id}/guidance`,
    tokens: `${b}/system/tokens`,
    token: (id) => `${b}/system/tokens/${id}`,
    foundations: `${b}/system/foundations`,
    changes: `${b}/changes`,
    changesTab: (tab) => `${b}/changes?tab=${tab}`,
    finding: (id) => `${b}/changes/findings/${id}`,
    impact: (changeId) => `${b}/changes/${changeId}/impact`,
    pr: (n) => `${b}/changes/pr/${n}`,
    prFigma: (n) => `${b}/changes/pr/${n}/figma`,
    figma: (id) => `${b}/changes/figma/${id}`,
    channels: `${b}/ai/channels`,
    channel: (id) => `${b}/ai/channels/${id}`,
    evals: `${b}/ai/evals`,
    inbox: `${b}/ai/inbox`,
    prototype: `${b}/ai/prototype`,
    contract: `${b}/settings/contract`,
    people: `${b}/settings/people`,
    brands: `${b}/settings/brands`,
    trust: `${b}/settings/trust`,
    audit: `${b}/settings/audit`,
    report: `${b}/report`,
    assessment: `${b}/journey/improve/assess`,
    handover: `${b}/journey/improve/handover`,
    outcome: `${b}/report`,
    /** No step: the set-up in the DS Starter Pack. A step: the basics recorded by hand (Wizard). */
    journeyNew: (step) => (step == null ? `${b}/journey/new` : `${b}/journey/new/${step}`),
    journeyImprove: (step = 'goals') => `${b}/journey/improve/${step}`,
    meeting: practice.meetingPrep(slug),
    guides: practice.guides,
    guide: practice.guide,
    // Requests and decks are listed practice-wide, filtered by project; their pages live there too.
    presentations: practice.presentationsFor(slug),
    presentationNew: `${practice.deckNew}?project=${slug}`,
    presentation: practice.deck,
    opportunities: practice.opportunitiesFor(slug),
    opportunityNew: `${practice.opportunityStart}?project=${slug}`,
    opportunity: practice.opportunity,
    proposalSummary: practice.opportunitiesFor(slug),
    scorecard: practice.scorecard,
  }
}

export function client(slug: string): RouteFamily {
  const b = `/client/${slug}`
  return {
    workspace: 'client',
    slug,
    home: b,
    components: `${b}/explore/components`,
    component: (id) => `${b}/explore/components/${id}`,
    guidance: (id) => `${b}/explore/components/${id}`,
    tokens: `${b}/explore/tokens`,
    token: (id) => `${b}/explore/tokens/${id}`,
    foundations: `${b}/explore/foundations`,
    changes: `${b}/improve`,
    changesTab: (tab) => `${b}/improve?tab=${tab}`,
    finding: (id) => `${b}/improve/findings/${id}`,
    impact: (changeId) => `${b}/improve/${changeId}/impact`,
    pr: (n) => `${b}/improve/pr/${n}`,
    prFigma: (n) => `${b}/improve/pr/${n}/figma`,
    figma: (id) => `${b}/improve/figma/${id}`,
    channels: `${b}/ai/channels`,
    channel: (id) => `${b}/ai/channels/${id}`,
    evals: `${b}/ai/evals`,
    inbox: `${b}/ai`,
    prototype: `${b}/ai`,
    contract: `${b}/evidence`,
    people: `${b}/evidence`,
    brands: `${b}/explore/foundations`,
    trust: `${b}/evidence`,
    audit: `${b}/evidence`,
    report: `${b}/evidence`,
    assessment: `${b}/evidence/assessment`,
    handover: `${b}/evidence/handover`,
    outcome: `${b}/evidence/outcome`,
    journeyNew: () => b,
    journeyImprove: () => b,
    meeting: `${b}?guide=meeting`,
    guides: `${b}/evidence/method`,
    guide: (id) => `${b}/evidence/method/${id}`,
    presentations: b,
    presentationNew: b,
    presentation: () => b,
    opportunities: `${b}/evidence/proposal`,
    opportunityNew: `${b}/evidence/proposal`,
    opportunity: () => `${b}/evidence/proposal`,
    proposalSummary: `${b}/evidence/proposal`,
    scorecard: `${b}/scorecard`,
  }
}

export function familyFor(workspace: Workspace, slug: string): RouteFamily {
  return workspace === 'client' ? client(slug) : nagarro(slug)
}

export type WorkspaceRoute = { workspace: Workspace | 'preview' | null; slug?: string }

export function workspaceFromPath(pathname: string): WorkspaceRoute {
  if (pathname === '/nagarro' || pathname.startsWith('/nagarro/')) {
    const m = matchPath('/nagarro/clients/:slug/*', pathname) ?? matchPath('/nagarro/clients/:slug', pathname)
    return { workspace: 'nagarro', slug: m?.params.slug }
  }
  if (pathname === '/client' || pathname.startsWith('/client/')) {
    const m = matchPath('/client/:slug/*', pathname) ?? matchPath('/client/:slug', pathname)
    return { workspace: 'client', slug: m?.params.slug }
  }
  if (pathname.startsWith('/preview')) return { workspace: 'preview' }
  return { workspace: null }
}

export function homeFor(workspace: Workspace | null, slug = 'demo-brand') {
  return workspace === 'client' ? client(slug).home : workspace === 'nagarro' ? practice.home : practice.welcome
}

// ---- mirrored keys: the switcher maps a page to its equivalent on the other side ----

type Keyed = Exclude<keyof RouteFamily, 'workspace' | 'slug'>
const PH = '__slug__'

type MirrorRow = { key: Keyed; args: string[] }
const MIRROR: MirrorRow[] = [
  { key: 'component', args: [':id'] },
  { key: 'guidance', args: [':id'] },
  { key: 'token', args: [':id'] },
  { key: 'finding', args: [':id'] },
  { key: 'impact', args: [':changeId'] },
  { key: 'prFigma', args: [':n'] },
  { key: 'pr', args: [':n'] },
  { key: 'figma', args: [':id'] },
  { key: 'channel', args: [':id'] },
  { key: 'guide', args: [':id'] },
  { key: 'components', args: [] },
  { key: 'tokens', args: [] },
  { key: 'foundations', args: [] },
  { key: 'changes', args: [] },
  { key: 'channels', args: [] },
  { key: 'evals', args: [] },
  { key: 'prototype', args: [] },
  { key: 'report', args: [] },
  { key: 'assessment', args: [] },
  { key: 'handover', args: [] },
  { key: 'outcome', args: [] },
  { key: 'guides', args: [] },
  // the list first: every client key resolves to the same proposal page
  { key: 'opportunities', args: [] },
  { key: 'opportunityNew', args: [] },
  { key: 'opportunity', args: [':id', ':step'] },
  { key: 'scorecard', args: [] },
  { key: 'home', args: [] },
]

function pattern(f: RouteFamily, row: MirrorRow): string {
  const v = f[row.key] as unknown
  const p = typeof v === 'function' ? (v as (...a: string[]) => string)(...row.args) : (v as string)
  return p.split('?')[0].replace(PH, ':slug')
}

export interface EntityExists {
  (kind: Keyed, id: string): boolean
}

/** The same page in the other workspace; falls back to the parent list, then the home. */
export function equivalentRoute(pathname: string, target: Workspace, slug: string, exists?: EntityExists): string {
  const from = target === 'client' ? nagarro(PH) : client(PH)
  const to = familyFor(target, slug)
  for (const row of MIRROR) {
    const m = matchPath(pattern(from, row), pathname)
    if (!m) continue
    const params: Record<string, string | undefined> = { ...m.params, slug }
    const ids = row.args.map((a) => params[a.slice(1)] ?? '')
    if (exists && ids.length && !exists(row.key, ids[0])) {
      const parent: Keyed = row.key === 'component' || row.key === 'guidance' ? 'components' : row.key === 'token' ? 'tokens' : row.key === 'channel' ? 'channels' : row.key === 'guide' ? 'guides' : row.key === 'opportunity' ? 'opportunities' : 'changes'
      return to[parent] as string
    }
    const v = to[row.key] as unknown
    return typeof v === 'function' ? (v as (...a: string[]) => string)(...ids) : (v as string)
  }
  if (target === 'nagarro' && (pathname === '/client' || workspaceFromPath(pathname).workspace === 'client')) return practice.home
  return to.home
}

export { generatePath }
