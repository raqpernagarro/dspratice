// Builds SystemStates and Projects from the fixtures. Pure apart from uid()/Date.now() for ids and timestamps.

import type { AppData, Baseline, Finding, HistoryEvent, Journey, Project, ProjectSeed, SystemState, ThemeConfig } from './types'
import { DEMO_TOKENS, BEFORE_STATE } from '@/fixtures/demo-brand/tokens'
import { DEMO_COMPONENTS } from '@/fixtures/demo-brand/components'
import { RULES } from '@/fixtures/demo-brand/rules'
import { SEED_FINDINGS } from '@/fixtures/demo-brand/findings'
import { AGENT_PROPOSALS, CHANNELS, CONTRACT, DEFAULT_THEME, EVALS, PEOPLE, TRUST_DEFAULTS } from '@/fixtures/demo-brand/system'
import { PROJECT_SEEDS } from '@/fixtures/projects'
import { uid } from './sim'
import { applyThemeIntents, fastForwardSystem } from './system-ops'
import { cloneSys } from './scope'
import { emptyKnowledge, internalSeeds } from './internal-seeds'

export const SCHEMA_VERSION = 4

export const DEFAULT_BASELINE: Baseline = {
  totalValues: BEFORE_STATE.totalValues,
  valuesWithoutCodeName: BEFORE_STATE.valuesWithoutCodeName,
  componentsInFigma: BEFORE_STATE.componentsInFigma,
  componentsDiffer: BEFORE_STATE.componentsDiffer,
  contrastFails: BEFORE_STATE.contrastFails,
  parityPct: BEFORE_STATE.parityPct,
  checksTotal: 48,
}

export function emptyProgress() {
  return { currentStep: 1, visited: [] as number[], data: {} as Record<string, unknown> }
}

export function defaultJourney(): Journey {
  return {
    entryPath: null,
    wizardDone: false,
    connect: { repoUrl: 'github.com/demo-brand/web-ui', figmaUrl: 'figma.com/design/… · Demo Brand UI Kit', status: 'idle' },
    scan: { status: 'idle', stageDetails: [] },
    readout: {},
    mapping: { grammar: 'starter', decisions: {} },
    handover: {},
    engagementFastForwarded: false,
    new: emptyProgress(),
    improve: emptyProgress(),
  }
}

function seedHistory(t: number): HistoryEvent[] {
  return [
    { id: uid('h'), ts: t - 19 * 60 * 1000, actor: 'Patrol agent', text: 'Bound 3 loose fills in Chip and Badge to semantic variables (auto-fix, undo available)', entity: { type: 'proposal', id: 'ap-loose-fills' }, simulated: true },
    { id: uid('h'), ts: t - 2 * 24 * 60 * 60 * 1000, actor: 'Publisher agent', text: 'Published 5 of 6 channels after release v1.8.0 (v0 registry failed: schema mismatch)', entity: { type: 'channel', id: 'v0-registry' }, simulated: true },
    { id: uid('h'), ts: t - 2 * 24 * 60 * 60 * 1000, actor: 'CI', text: 'Release eval v1.8.0: 94% on-system (gate 90%)', entity: { type: 'channel', id: 'eval' }, simulated: true },
  ]
}

/** The Demo Brand system exactly as v2 seeded it (the patrol agent already resolved the loose fills). */
export function seedSystem(seed: ProjectSeed, t = Date.now()): SystemState {
  const theme: ThemeConfig = { ...cloneSys(DEFAULT_THEME), ...cloneSys(seed.theme) }
  const components = cloneSys(DEMO_COMPONENTS).filter((c) => seed.componentIds === 'all' || seed.componentIds.includes(c.id))
  const compIds = new Set(components.map((c) => c.id))
  const tokens = cloneSys(DEMO_TOKENS)
  for (const tok of tokens) tok.usedBy = tok.usedBy.filter((id) => compIds.has(id))
  if (seed.id !== 'demo-brand') applyThemeIntents(tokens, theme)
  const findings: Finding[] = cloneSys(SEED_FINDINGS)
    .filter((f) => seed.findingIds === 'all' || seed.findingIds.includes(f.id))
    .map((f) => ({ ...f, status: f.id === 'f-loose-fills' ? ('merged' as const) : f.status, ...(seed.findingOverrides?.[f.id] ?? {}) }))
  const journey: Journey = { ...defaultJourney(), ...cloneSys(seed.journey ?? {}) }
  if (journey.scan.status === 'done' && !journey.before) {
    journey.before = { takenAt: journey.scan.completedAt ?? t, readiness: 2, parityPct: BEFORE_STATE.parityPct, contrastFails: BEFORE_STATE.contrastFails, valuesWithoutCodeName: BEFORE_STATE.valuesWithoutCodeName, totalValues: BEFORE_STATE.totalValues, componentsDiffer: BEFORE_STATE.componentsDiffer, totalComponents: BEFORE_STATE.componentsInFigma, aiReadable: 0, driftItems: 12 }
  }
  const sys: SystemState = {
    components,
    tokens,
    findings,
    changes: [],
    pullRequests: [],
    figmaChangeSets: [],
    channels: CHANNELS(t),
    evals: EVALS(t),
    agentProposals: AGENT_PROPOSALS(t),
    people: cloneSys(PEOPLE),
    contract: { ...cloneSys(CONTRACT), name: `${theme.name} design system`, repo: theme.repoUrl || CONTRACT.repo, rulesEnabled: Object.fromEntries(RULES.map((r) => [r.id, true])) },
    trust: { ...TRUST_DEFAULTS },
    history: seedHistory(t),
    prototypes: [],
    theme,
    journey,
    baseline: { ...DEFAULT_BASELINE },
  }
  if (seed.fastForwarded) fastForwardSystem(sys, t - 100 * 24 * 60 * 60 * 1000)
  return sys
}

export function seedProject(seed: ProjectSeed, t = Date.now()): Project {
  const draft = seedSystem(seed, t)
  const published = seed.publish
    ? { version: 1, publishedAt: t - 24 * 60 * 60 * 1000, publishedBy: 'Seed', note: 'First published version', draftRev: 0, state: cloneSys(draft) }
    : null
  return {
    id: seed.id,
    slug: seed.slug,
    client: seed.client,
    engagement: { ...seed.engagement },
    draft,
    draftRev: 0,
    published,
    versions: [],
    clientExperience: { ...seed.clientExperience, chapters: { ...seed.clientExperience.chapters }, publishedOutputs: [] },
    session: null,
    activity: published ? [{ id: uid('h'), ts: published.publishedAt, actor: 'Seed', text: 'Published v1 of the client experience', entity: { type: 'project', id: seed.id } }] : [],
    opportunities: internalSeeds()?.opportunities(seed.id, t) ?? {},
    decks: {},
  }
}

export function seedState(t = Date.now()): AppData {
  const projects: Record<string, Project> = {}
  for (const seed of PROJECT_SEEDS) projects[seed.id] = seedProject(seed, t)
  return {
    meta: { schemaVersion: SCHEMA_VERSION, seededAt: t },
    practice: { rules: cloneSys(RULES), knowledge: internalSeeds()?.knowledge() ?? emptyKnowledge() },
    projects,
    selectedProjectId: 'demo-brand',
    ui: { lastWorkspace: null, presenter: false, actingAs: 'p-owner', motionPaused: false, previewBrand: 'demo', previewMode: 'light', previewDensity: 'standard', sideOpen: false, cmdkOpen: false, simSpeed: 1 },
    sim: { jobs: {}, toasts: [] },
  }
}
