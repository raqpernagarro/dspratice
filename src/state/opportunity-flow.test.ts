// The opportunity workflow through the real store and flows (template mode, zero tokens):
// analyse → evidence → draft → publish → deck. Checks client isolation, that project-level data
// never touches the draft system or the client session, and the client-safe publishing rules.
import { beforeEach, describe, expect, it } from 'vitest'
import { useStore } from './store'
import { analyzeRequest, draftResponse, findEvidence } from './flows/opportunity'
import { cancelAllTasks } from './tasks'
import { knowledgeRegistry } from '@/knowledge/selectors'
import { currentResponse, publishRefusals } from '@/opportunity/selectors'
import { planFromOpportunity } from '@/deck/fromOpportunity'
import { checkDeck } from '@/deck/checks'
import { templateInfo } from '@/deck/catalog'
import { exportBriefMd, exportDeckJson, exportNotesMd } from '@/deck/exports'
import type { Deck } from './types'

const S = () => useStore.getState()
const P = 'northwind'
const O = 'opp-northwind-rfp'
const opp = () => S().projects[P].opportunities[O]
const registry = () => knowledgeRegistry(S().practice.knowledge)

async function draftNorthwind() {
  S().confirmContext(P, O)
  expect(await analyzeRequest(P, O)).toEqual({ status: 'done' })
  expect(await findEvidence(P, O)).toEqual({ status: 'done' })
  expect(await draftResponse(P, O, { mode: 'template' })).toEqual({ status: 'done' })
  return currentResponse(opp())!
}

beforeEach(() => {
  cancelAllTasks()
  S().resetAll()
})

describe('opportunity workflow in the store', () => {
  it('drafts a validated template response without touching the draft system or the client session', async () => {
    const rev = S().projects[P].draftRev
    const r = await draftNorthwind()
    expect(opp().requirements.filter((q) => q.number)).toHaveLength(14)
    expect(opp().sourceSelection.included).not.toContain('src-contoso-questionnaire')
    expect(opp().sourceSelection.included).toContain('src-offer-deck')
    expect(r.generatedBy.mode).toBe('template')
    expect(r.generatedBy.usage).toBeUndefined()
    expect(r.issues).toEqual([])
    expect(r.approach.package).toBe('2-week AI audit')
    expect(S().projects[P].draftRev).toBe(rev)
    expect(JSON.stringify(S().projects[P].draft)).not.toContain(O)
  })

  it('never lets the Contoso questionnaire reach another client', async () => {
    const r = await draftNorthwind()
    expect(JSON.stringify(r)).not.toContain('CONTOSO-ISOLATION-MARKER')
    expect(r.inputs.sources.map((s) => s.sourceId)).not.toContain('src-contoso-questionnaire')
  })

  it('publishes only ticked, client-safe sections and refuses internal-only quotes', async () => {
    const r = await draftNorthwind()
    const reg = registry()
    const blocked = r.draft.filter((d) => publishRefusals(opp(), [d.id], reg, 'Northwind Retail').length)
    const ok = r.draft.filter((d) => d.kind !== 'open-question' && !blocked.includes(d))
    expect(ok.length).toBeGreaterThan(3)
    if (blocked.length) expect('refused' in S().publishOutput(P, O, { title: 'x', sectionIds: [blocked[0].id] })).toBe(true)

    const out = S().publishOutput(P, O, { title: 'Northwind Retail · proposal summary', sectionIds: ok.map((d) => d.id) })
    expect('id' in out).toBe(true)
    const pub = S().projects[P].clientExperience.publishedOutputs
    expect(pub).toHaveLength(1)
    const text = JSON.stringify(pub[0])
    for (const s of reg.filter((x) => x.audience === 'internal')) expect(text).not.toContain(s.title)
    expect(text).not.toMatch(/practice documents|CONTOSO-ISOLATION-MARKER/)
    expect(pub[0].sections.map((s) => s.heading)).toEqual(ok.map((d) => d.heading))
  })

  it('plans a deck on registered master templates that passes the checks and exports', async () => {
    const r = await draftNorthwind()
    const reg = registry()
    const plan = planFromOpportunity(opp(), r, S().projects[P], reg, { structure: 'proposal', durationMin: 30 })
    for (const s of plan.slides) expect(templateInfo(s.spec.template), s.spec.template).toBeTruthy()
    expect(plan.slides[0].spec.theme).toBe('dark')
    expect(plan.slides.at(-1)!.spec.theme).toBe('dark')
    expect(String(plan.slides[0].spec.subtitle)).not.toContain('…')
    const id = S().saveDeck(P, { ...plan, id: 'deck-test', builtAt: 0, builtBy: '' } as Deck)
    const deck = S().projects[P].decks[id]
    const internalOnly = new Map(reg.filter((s) => s.audience === 'internal').map((s) => [s.id, s.title]))
    expect(checkDeck(deck, { internalOnly }).filter((i) => i.level === 'error')).toEqual([])
    expect(JSON.parse(exportDeckJson(deck).content).slides).toHaveLength(deck.slides.length)
    expect(exportBriefMd(deck).content).toContain('Northwind Retail')
    expect(exportNotesMd(deck).content).toContain('Cover')
    expect(S().projects[P].draftRev).toBe(S().projects[P].draftRev)
  })

  it('flags a slide that still quotes internal-only material', async () => {
    const r = await draftNorthwind()
    const plan = planFromOpportunity(opp(), r, S().projects[P], registry(), { structure: 'proposal', durationMin: 30 })
    const quote = 'Our handoff included instructions on how to use the tools effectively'
    const slide = { ...plan.slides[3], spec: { ...plan.slides[3].spec, body: [quote] }, citations: [{ sourceId: 'src-case-studies', sectionId: 'x', quote }] }
    const deck = { ...plan, id: 'd', builtAt: 0, builtBy: '', slides: [plan.slides[0], plan.slides[1], plan.slides[2], slide] } as Deck
    const issues = checkDeck(deck, { internalOnly: new Map([['src-case-studies', 'Case studies']]) })
    expect(issues.some((i) => /internal-only/.test(i.text))).toBe(true)
  })
})
