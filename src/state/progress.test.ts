// Progress means work done: opening a step never ticks it, set-up journeys never make the client
// demo look out of date, and a drafted response is not "done" until a person checks the answers.
import { beforeEach, describe, expect, it } from 'vitest'
import { useStore } from './store'
import { hasUnpublishedChanges, resolveView, setActiveScope } from './scope'
import { cancelAllJobs, settleJobs } from './sim'
import { improveStepStates, journeySummary, newStepStates } from './journeyProgress'
import { analyzeRequest, draftResponse, findEvidence } from './flows/opportunity'
import { cancelAllTasks } from './tasks'
import { opportunityProgress, stepStatus, uncheckedRequirements } from '@/opportunity/progress'
import { activeRequirements } from '@/opportunity/selectors'
import { READOUT_DECISIONS } from '@/fixtures/demo-brand/system'
import { planFromEngagement } from '@/deck/fromOpportunity'
import { checkDeck } from '@/deck/checks'
import type { Deck } from './types'

const S = () => useStore.getState()
const draft = (id = 'demo-brand') => resolveView(S(), id, 'draft')!

beforeEach(() => {
  cancelAllJobs()
  cancelAllTasks()
  S().resetAll()
  setActiveScope({ projectId: 'demo-brand', layer: 'draft' })
})

describe('set-up journeys', () => {
  it('opening or resuming a step never makes the client demo look out of date', () => {
    const p = () => S().projects['demo-brand']
    expect(hasUnpublishedChanges(p())).toBe(false)
    S().chooseEntryPath('new')
    S().setJourneyProgress('new', { currentStep: 3 })
    S().setJourneyProgress('improve', { currentStep: 5 })
    S().setJourneyData('improve', 'goals', ['ai'])
    S().markJourneyStep('improve', 1)
    expect(hasUnpublishedChanges(p())).toBe(false)
    // Real content still counts.
    S().updateTheme({ radius: 3 })
    expect(hasUnpublishedChanges(p())).toBe(true)
  })

  it('ticks a new-system step only when its work is marked done', () => {
    S().setJourneyProgress('new', { currentStep: 3 })
    expect(newStepStates(draft()).slice(0, 3)).toEqual(['todo', 'todo', 'todo'])
    S().markJourneyStep('new', 1)
    expect(newStepStates(draft())[0]).toBe('done')
    expect(journeySummary(draft(), 'new')).toMatchObject({ done: 1, resume: 2, started: true, complete: false })
  })

  it('ticks improve steps from what happened: connection, assessment, the four decisions', () => {
    expect(journeySummary(draft(), 'improve').started).toBe(false)
    S().connectSystem('github.com/acme/web', 'figma.com/design/acme')
    S().runScan()
    settleJobs()
    for (const d of READOUT_DECISIONS) S().setReadout(d.id, d.recommended)
    const states = improveStepStates(draft())
    expect(states).toMatchObject({ goals: 'todo', connect: 'done', assess: 'done', findings: 'todo', plan: 'done' })
    expect(journeySummary(draft(), 'improve')).toMatchObject({ done: 3, resume: 1, resumeLabel: 'Goals' })
  })
})

describe('response progress', () => {
  const P = 'northwind'
  const O = 'opp-northwind-rfp'
  const opp = () => S().projects[P].opportunities[O]

  it('is not done until every answer is checked against the current draft', async () => {
    S().confirmContext(P, O)
    await analyzeRequest(P, O)
    await findEvidence(P, O)
    await draftResponse(P, O, { mode: 'template' })
    expect(stepStatus(opp(), 'response')).toBe('started')
    const reqs = activeRequirements(opp())
    expect(uncheckedRequirements(opp())).toHaveLength(reqs.length)
    for (const r of reqs) S().setRequirementChecked(P, O, r.id, true)
    expect(stepStatus(opp(), 'response')).toBe('done')
    // A redraft asks for a re-check.
    await draftResponse(P, O, { mode: 'template', keep: 'none' })
    expect(stepStatus(opp(), 'response')).toBe('started')
    expect(opportunityProgress(opp()).next).toBe('response')
  })

  it('viewing a later step does not tick earlier ones', () => {
    S().updateOpportunity(P, O, { step: 'export' })
    const prog = opportunityProgress(opp())
    expect(prog.statuses.requirements).not.toBe('done')
    expect(prog.statuses.response).toBe('todo')
  })
})

describe('decks from a project, no request needed', () => {
  it.each(['readout', 'update'] as const)('the %s plan uses registered layouts within capacity', (structure) => {
    const plan = planFromEngagement(S().projects['demo-brand'], { durationMin: 30, structure })
    const deck = { ...plan, id: 'd', builtAt: 0, builtBy: '' } as Deck
    expect(deck.structure).toBe(structure)
    expect(deck.slides.some((s) => s.demoLink?.chapter)).toBe(true)
    const errors = checkDeck(deck, { internalOnly: new Map() }).filter((i) => i.level === 'error')
    expect(errors).toEqual([])
  })
})
