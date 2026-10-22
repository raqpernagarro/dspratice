// The client demo's meeting story: every chapter can be entered directly from a fresh demo, pausing
// holds simulated timers, and presenter notes stay out of the client-facing chapter definitions.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { useStore } from '@/state/store'
import { cancelAllJobs, isSimPaused, pauseSim, resumeSim, runJob, settleJobs } from '@/state/sim'
import { resolveView, setActiveScope } from '@/state/scope'
import { client } from '@/app/routes'
import { HERO, TOUR, TOUR_BY_ID, pathFor } from './steps'
import { prepareChapter, runChapterAction } from './prepare'
import { PRESENTER_NOTES } from '@/internal/presenterNotes'

const S = () => useStore.getState()
const session = () => resolveView(S(), 'demo-brand', 'session')!

beforeEach(() => {
  vi.useFakeTimers()
  cancelAllJobs()
  resumeSim()
  S().resetAll()
  S().startDemoSession('demo-brand', 'meeting')
  S().resetDemoSession('demo-brand')
  setActiveScope({ projectId: 'demo-brand', layer: 'session' })
})

describe('the meeting story', () => {
  it('has eight chapters in the agreed order, and a short path of six', () => {
    expect(TOUR.map((s) => s.id)).toEqual(['challenge', 'example', 'inconsistency', 'impact', 'fix', 'review', 'ai', 'outcome'])
    expect(pathFor('meeting').map((s) => s.id)).toEqual(['challenge', 'inconsistency', 'impact', 'fix', 'ai', 'outcome'])
    expect(pathFor('full')).toHaveLength(8)
  })

  it.each(TOUR.map((s) => s.id))('chapter "%s" can be entered directly and its action completes', (id) => {
    const step = TOUR_BY_ID[id]
    prepareChapter(id)
    // Every chapter it depends on has happened.
    for (const need of step.needs) {
      const dep = TOUR_BY_ID[need]
      if (dep.expect) expect(dep.expect(session())).toBe(true)
    }
    // Its own screen resolves to a real page, not a fallback list.
    const route = step.route(session(), client('demo-brand'))
    if (id === 'fix') expect(route).toMatch(/\/improve\/.+\/impact$/)
    if (id === 'review') expect(route).toMatch(/\/improve\/pr\/\d+$/)
    // "Show me" completes the chapter in one go.
    runChapterAction(step, true)
    settleJobs()
    if (step.expect) expect(step.expect(session())).toBe(true)
  })

  it('merging in chapter 6 gives the presenter their own role back', () => {
    S().setPresenter(true)
    S().setActingAs('p-contributors')
    prepareChapter('review')
    runChapterAction(TOUR_BY_ID.review)
    expect(session().pullRequests.find((p) => p.findingIds.includes(HERO))?.status).toBe('merged')
    expect(S().ui.actingAs).toBe('p-contributors')
  })

  it('resetting the demo clears what happened in the meeting but never the preparation', () => {
    prepareChapter('review')
    runChapterAction(TOUR_BY_ID.review)
    const draftRev = S().projects['demo-brand'].draftRev
    S().resetDemoSession('demo-brand')
    expect(session().pullRequests.some((p) => p.findingIds.includes(HERO))).toBe(false)
    expect(S().projects['demo-brand'].draftRev).toBe(draftRev)
    expect(resolveView(S(), 'demo-brand', 'draft')!.pullRequests.some((p) => p.findingIds.includes(HERO))).toBe(false)
  })
})

describe('pause holds the simulation on a state', () => {
  it('keeps a running job where it is until resumed', () => {
    const done = vi.fn()
    runJob('demo-brand:session:test', 'Test', [{ label: 'a', ms: 1000 }, { label: 'b', ms: 1000 }], done)
    vi.advanceTimersByTime(600)
    pauseSim()
    expect(isSimPaused()).toBe(true)
    vi.advanceTimersByTime(10_000)
    expect(done).not.toHaveBeenCalled()
    resumeSim()
    vi.advanceTimersByTime(400)
    expect(done).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1000)
    expect(done).toHaveBeenCalledOnce()
  })
})

describe('presenter notes stay off the shared screen', () => {
  it('has a note for every chapter, kept in the internal module only', () => {
    for (const s of TOUR) expect(PRESENTER_NOTES[s.id]?.say).toBeTruthy()
    const steps = readFileSync(join(__dirname, 'steps.ts'), 'utf8')
    const bar = readFileSync(join(__dirname, '..', '..', 'shell', 'DemoBar.tsx'), 'utf8')
    for (const text of [steps, bar]) {
      expect(text).not.toMatch(/from '@\/internal\/presenterNotes'|PRESENTER_NOTES|talkingPoints/)
    }
  })
})
