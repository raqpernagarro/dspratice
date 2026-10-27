// Schema migrations. v4 → v5 adds the Projects board card. v3 → v4 adds the knowledge library, opportunities, decks and published
// outputs without touching any draft, published version or session. v2 was single-tenant: one system at the top level, four client rows as
// metadata, a tour. v3 wraps that system into the Demo Brand project, publishes it as v1 and seeds
// the three lighter engagements.

import type { AppData, Journey, Project, SystemState } from './types'
import { DEFAULT_BASELINE, defaultJourney, seedProject, seedState } from './seed'
import { emptyKnowledge, internalSeeds } from './internal-seeds'
import { PROJECT_SEEDS } from '@/fixtures/projects'
import { deriveCard } from './card'
import { cloneSys } from './scope'
import { uid } from './sim'

export type V2State = Record<string, unknown> & {
  meta?: { schemaVersion?: number; seededAt?: number }
  ui?: { workspace?: 'nagarro' | 'client' | null; actingAs?: string; simSpeed?: 1 | 3; previewBrand?: string; previewMode?: string; previewDensity?: string }
  journey?: Partial<Journey> & { wizardStep?: number }
  tour?: { started?: boolean }
  rules?: AppData['practice']['rules']
}

const SYSTEM_KEYS = ['components', 'tokens', 'findings', 'changes', 'pullRequests', 'figmaChangeSets', 'channels', 'evals', 'agentProposals', 'people', 'contract', 'trust', 'history', 'prototypes', 'theme'] as const

export function migrateV2toV3(v2: V2State, now = Date.now()): AppData {
  const fresh = seedState(now)
  const base = fresh.projects['demo-brand'].draft
  const sys = cloneSys(base) as SystemState
  for (const key of SYSTEM_KEYS) {
    if (v2[key] !== undefined) (sys as unknown as Record<string, unknown>)[key] = cloneSys(v2[key])
  }
  for (const c of sys.components) {
    if (!c.source) {
      c.source = 'starter'
      c.sourceId = c.id
    }
  }
  const oldJourney = (v2.journey ?? {}) as Partial<Journey> & { wizardStep?: number }
  const { wizardStep, ...rest } = oldJourney
  void wizardStep
  sys.journey = { ...defaultJourney(), ...cloneSys(rest) }
  if (!sys.journey.new) sys.journey.new = { currentStep: 1, visited: [], data: {} }
  if (!sys.journey.improve) sys.journey.improve = { currentStep: 1, visited: [], data: {} }
  sys.baseline = { ...DEFAULT_BASELINE }

  const demoSeed = PROJECT_SEEDS.find((p) => p.id === 'demo-brand')!
  const demo: Project = {
    ...seedProject(demoSeed, now),
    draft: sys,
    draftRev: 0,
    published: { version: 1, publishedAt: now, publishedBy: 'Migration', note: 'First published version (migrated from the single-tenant demo)', draftRev: 0, state: cloneSys(sys) },
    versions: [],
    session: null,
    activity: [{ id: uid('h'), ts: now, actor: 'Migration', text: 'Published v1 from the migrated demo state', entity: { type: 'project', id: 'demo-brand' } }],
  }
  const projects = { ...fresh.projects, 'demo-brand': demo }
  return {
    meta: { schemaVersion: 3, seededAt: v2.meta?.seededAt ?? now, migratedFrom: 2 },
    practice: { rules: v2.rules ? cloneSys(v2.rules) : fresh.practice.rules, knowledge: fresh.practice.knowledge },
    projects,
    selectedProjectId: 'demo-brand',
    ui: {
      ...fresh.ui,
      lastWorkspace: v2.ui?.workspace ?? null,
      actingAs: v2.ui?.actingAs ?? 'p-owner',
      simSpeed: v2.ui?.simSpeed ?? 1,
    },
    sim: { jobs: {}, toasts: [] },
  }
}

/** A v3 store as persisted: everything v4 has, minus the new fields. */
export type V3State = Omit<AppData, 'practice' | 'projects'> & {
  practice: { rules: AppData['practice']['rules']; knowledge?: AppData['practice']['knowledge'] }
  projects: Record<string, Omit<Project, 'opportunities' | 'decks' | 'clientExperience' | 'client'> & {
    client: { name: string; sector: string; fictional?: boolean }
    opportunities?: Project['opportunities']
    decks?: Project['decks']
    clientExperience: Omit<Project['clientExperience'], 'publishedOutputs'> & { publishedOutputs?: Project['clientExperience']['publishedOutputs'] }
  }>
}

/** Idempotent: adds what v4 needs and leaves drafts, published versions and sessions untouched. */
export function migrateV3toV4(v3: V3State, now = Date.now()): AppData {
  const seeds = internalSeeds()
  const projects: Record<string, Project> = {}
  for (const [id, p] of Object.entries(v3.projects)) {
    projects[id] = {
      ...p,
      client: { ...p.client, fictional: p.client.fictional ?? true },
      clientExperience: { ...p.clientExperience, publishedOutputs: p.clientExperience.publishedOutputs ?? [] },
      opportunities: p.opportunities ?? seeds?.opportunities(id, now) ?? {},
      decks: p.decks ?? {},
    } as Project
  }
  const from = v3.meta.migratedFrom ?? (v3.practice.knowledge ? undefined : 3)
  return {
    ...(v3 as unknown as AppData),
    meta: { ...v3.meta, schemaVersion: 4, ...(from ? { migratedFrom: from } : {}) },
    practice: { rules: v3.practice.rules, knowledge: v3.practice.knowledge ?? seeds?.knowledge() ?? emptyKnowledge() },
    projects,
  }
}

/** A v4 store as persisted: everything v5 has except the Projects board card and "me". */
export type V4State = Omit<AppData, 'projects'> & { projects: Record<string, Omit<Project, 'card'> & { card?: Project['card'] }> }

/** Idempotent: gives every project its board card (derived, plus the shared file) and sets "me". Nothing else changes. */
export function migrateV4toV5(v4: V4State): AppData {
  const projects: Record<string, Project> = {}
  for (const [id, p] of Object.entries(v4.projects)) projects[id] = { ...p, card: p.card ?? deriveCard(p) } as Project
  return { ...(v4 as unknown as AppData), meta: { ...v4.meta, schemaVersion: 5 }, projects, ui: { ...v4.ui } }
}
