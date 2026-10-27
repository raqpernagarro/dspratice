import { describe, expect, it } from 'vitest'
import { migrateV2toV3, migrateV3toV4, migrateV4toV5, type V3State, type V4State } from './migrate'
import { seedState } from './seed'
import { health } from './selectors'

function v2Fixture() {
  // The v2 persisted shape: one system at the top level, four client rows, a tour.
  const fresh = seedState(1000).projects['demo-brand'].draft
  return {
    meta: { schemaVersion: 2, seededAt: 500 },
    components: fresh.components.map(({ source, sourceId, ...c }) => {
      void source
      void sourceId
      return c
    }),
    tokens: fresh.tokens,
    rules: [],
    findings: fresh.findings,
    changes: [{ id: 'ch-1', kind: 'token', title: 'Button hover in dark mode', tokenChanges: [], guidanceChanges: [], impact: { componentIds: [], figmaLayers: 0, figmaFiles: 0, docsPages: [], channels: 6 }, status: 'in_pr', createdAt: 1, author: 'Lena', prNumber: 128 }],
    pullRequests: [{ number: 128, title: 'x', branch: 'ds/x', base: 'main', changeId: 'ch-1', findingIds: [], checks: [], reviewers: [], status: 'merged', createdAt: 1, openedFrom: 'panel' }],
    figmaChangeSets: [],
    channels: fresh.channels,
    evals: fresh.evals,
    agentProposals: fresh.agentProposals,
    people: fresh.people,
    contract: fresh.contract,
    trust: fresh.trust,
    clients: [{ id: 'c-demo' }],
    history: [],
    prototypes: [],
    theme: { ...fresh.theme, name: 'Demo Brand' },
    journey: { entryPath: 'bring', wizardStep: 4, wizardDone: false, connect: { repoUrl: 'a', figmaUrl: 'b', status: 'detected' }, scan: { status: 'done', stageDetails: [] }, readout: {}, mapping: { grammar: 'dsn', decisions: {} }, handover: {}, engagementFastForwarded: false },
    tour: { active: false, step: 3, completed: [0, 1, 2], started: true },
    ui: { workspace: 'client', workspaceSwitches: 2, actingAs: 'p-contributors', simSpeed: 3 },
  }
}

describe('migration v2 → v3', () => {
  it('wraps the single-tenant state into Demo Brand, publishes v1 and seeds the other projects', () => {
    const v3 = migrateV2toV3(v2Fixture() as never, 2000)
    const demo = v3.projects['demo-brand']
    expect(demo.draft.pullRequests[0].number).toBe(128)
    expect(demo.draft.journey.entryPath).toBe('bring')
    expect('wizardStep' in demo.draft.journey).toBe(false)
    expect(demo.draft.journey.new.currentStep).toBe(1)
    expect(demo.draft.components.every((c) => c.source === 'starter' && c.sourceId === c.id)).toBe(true)
    expect(demo.published?.version).toBe(1)
    expect(demo.published?.state.pullRequests[0].number).toBe(128)
    expect(demo.published?.draftRev).toBe(demo.draftRev)
    expect(health(demo.draft)).toBe(health(demo.published!.state))
    expect(Object.keys(v3.projects).length).toBe(4)
    expect(v3.projects.northwind.published).toBeNull()
    expect(v3.selectedProjectId).toBe('demo-brand')
    expect(v3.ui.lastWorkspace).toBe('client')
    expect(v3.ui.presenter).toBe(false)
    expect(v3.ui.actingAs).toBe('p-contributors')
    expect(v3.ui.simSpeed).toBe(3)
    expect(v3.meta.migratedFrom).toBe(2)
    expect(v3.meta.seededAt).toBe(500)
  })

  it('stays under the storage budget after seeding and three publishes', () => {
    const data = seedState()
    const bytes = JSON.stringify(data).length
    expect(bytes).toBeLessThan(2.5 * 1024 * 1024)
  })
})

describe('migration v3 → v4', () => {
  it('adds the knowledge library, opportunities, decks and published outputs, and is idempotent', () => {
    const v3 = migrateV2toV3(v2Fixture() as never, 1000) as unknown as V3State
    const v3bare = JSON.parse(JSON.stringify(v3)) as V3State
    delete (v3bare.practice as { knowledge?: unknown }).knowledge
    delete (v3bare.meta as { migratedFrom?: unknown }).migratedFrom
    for (const p of Object.values(v3bare.projects)) {
      delete (p as { opportunities?: unknown }).opportunities
      delete (p as { decks?: unknown }).decks
      delete (p.clientExperience as { publishedOutputs?: unknown }).publishedOutputs
    }
    const v4 = migrateV3toV4(v3bare, 1000)
    expect(v4.meta.schemaVersion).toBe(4)
    expect(v4.meta.migratedFrom).toBe(3)
    expect(v4.practice.knowledge.conflicts).toBeTruthy()
    expect(Object.keys(v4.projects.northwind.opportunities)).toContain('opp-northwind-rfp')
    expect(v4.projects['demo-brand'].clientExperience.publishedOutputs).toEqual([])
    const again = migrateV3toV4(v4 as unknown as V3State, 2000)
    expect(JSON.stringify(again.projects)).toBe(JSON.stringify(v4.projects))
    expect(JSON.stringify(v4).length).toBeLessThan(2_500_000)
  })
})

describe('migration v4 → v5', () => {
  it('gives every project a board card from its own data and the shared file, sets "me", and is idempotent', () => {
    const v5 = seedState(1000)
    const v4 = structuredClone(v5) as unknown as V4State
    for (const p of Object.values(v4.projects)) delete p.card
    delete v4.ui.me
    v4.meta.schemaVersion = 4
    const out = migrateV4toV5(v4)
    expect(out.meta.schemaVersion).toBe(5)
    expect(out.ui.me).toBe('raquel-pereira')
    expect(out.projects.fabrikam.card.status).toBe('delivered')
    expect(out.projects.northwind.card).toMatchObject({ status: 'in-progress', tags: ['design-system'], country: 'GB' })
    // placeholder addresses in sample data never become links; real ones do
    expect(out.projects.contoso.card.links).toEqual({ figma: undefined, code: undefined })
    const real = structuredClone(v4)
    real.projects.northwind.draft.journey.connect.repoUrl = 'https://github.com/acme/ui'
    expect(migrateV4toV5(real).projects.northwind.card.links.code).toBe('https://github.com/acme/ui')
    expect(out.projects['demo-brand'].card.peopleIds).toContain('nuno-almeida')
    // drafts and published versions are untouched
    expect(out.projects['demo-brand'].draft).toEqual(v5.projects['demo-brand'].draft)
    // a card someone edited survives a second run
    out.projects.northwind.card.status = 'paused'
    expect(migrateV4toV5(out as unknown as V4State).projects.northwind.card.status).toBe('paused')
  })
})
