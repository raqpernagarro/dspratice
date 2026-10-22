import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useStore } from './store'
import { driftItems, health, openPRs, readiness, staleChannels, valuesWithCodeName, aiReadableCount } from './selectors'
import { HERO_FIX_VALUE, HERO_TOKEN_ID } from '@/fixtures/demo-brand/tokens'
import { cancelAllJobs, settleJobs } from './sim'
import { activeScope, hasUnpublishedChanges, resolveView, setActiveScope } from './scope'

const S = () => useStore.getState()
const draft = (id = 'demo-brand') => resolveView(S(), id, 'draft')!
const session = (id = 'demo-brand') => S().projects[id].session?.state
const published = (id = 'demo-brand') => S().projects[id].published?.state

beforeEach(() => {
  vi.useFakeTimers()
  cancelAllJobs()
  S().resetAll()
  setActiveScope({ projectId: 'demo-brand', layer: 'draft' })
})

describe('seed numbers match the wireframes', () => {
  it('health 92, drift 9 live (12 before the patrol fix), no open PRs, readiness 2/5', () => {
    const sys = draft()
    expect(health(sys)).toBe(92)
    expect(driftItems(sys)).toBe(9)
    expect(openPRs(sys).length).toBe(0)
    expect(readiness(sys)).toBe(2)
    expect(staleChannels(sys).map((c) => c.id)).toEqual(['v0-registry'])
    expect(valuesWithCodeName(sys)).toEqual({ named: 174, total: 212 })
    expect(sys.components.length).toBe(56)
  })

  it('seeds four projects with their own publication state', () => {
    expect(Object.keys(S().projects).sort()).toEqual(['contoso', 'demo-brand', 'fabrikam', 'northwind'])
    expect(S().projects['demo-brand'].published?.version).toBe(1)
    expect(S().projects.northwind.published).toBeNull()
    expect(S().projects.contoso.draft.theme.brands.length).toBe(3)
    expect(driftItems(S().projects.fabrikam.draft)).toBe(0)
    expect(S().projects.northwind.draft.tokens.find((t) => t.id === 'color-background-interactive-primary-default')!.values.light).toBe('#c2410c')
  })
})

describe('the demo cascade: finding → fix → PR → Figma → merge → channels', () => {
  it('runs end to end and keeps every screen consistent', () => {
    const changeId = S().proposeFix('f-hover-dark')!
    expect(draft().findings.find((f) => f.id === 'f-hover-dark')!.status).toBe('proposed')
    const change = draft().changes.find((c) => c.id === changeId)!
    expect(change.impact.componentIds.length).toBe(7)
    expect(change.impact.figmaLayers).toBe(34)
    expect(change.impact.channels).toBe(6)

    const n = S().createPR(changeId)!
    expect(n).toBe(128)
    expect(draft().pullRequests[0].branch).toBe('ds/button-hover-in-dark-mode')
    expect(openPRs(draft()).length).toBe(1)
    expect(draft().findings.find((f) => f.id === 'f-hover-dark')!.status).toBe('in_pr')

    vi.runAllTimers()
    const pr = () => draft().pullRequests.find((p) => p.number === n)!
    expect(pr().status).toBe('changes_requested')
    expect(pr().checks.find((c) => c.id === 'parity')!.status).toBe('fail')
    expect(pr().checks.find((c) => c.id === 'eval')!.score).toBe(96)
    expect(S().mergePR(n)).toBe(false)

    const cs = draft().figmaChangeSets.find((c) => c.id === pr().figmaChangeSetId)!
    expect(cs.rows[0].figmaNow).toBe('#1f6feb')
    expect(cs.rows[0].system).toBe(HERO_FIX_VALUE)
    S().applyFigmaChangeSet(cs.id)
    vi.runAllTimers()
    expect(draft().figmaChangeSets[0].status).toBe('applied')
    expect(draft().figmaChangeSets[0].layersRebound).toBe(34)
    expect(pr().status).toBe('waiting_review')
    expect(pr().checks.every((c) => c.status === 'pass')).toBe(true)

    S().setActingAs('p-contributors')
    expect(S().mergePR(n)).toBe(false)
    S().setActingAs('p-owner')
    expect(S().mergePR(n)).toBe(true)

    expect(draft().tokens.find((t) => t.id === HERO_TOKEN_ID)!.values.dark).toBe(HERO_FIX_VALUE)
    expect(draft().findings.find((f) => f.id === 'f-hover-dark')!.status).toBe('merged')
    expect(driftItems(draft())).toBe(6)
    expect(staleChannels(draft()).length).toBe(6)
    expect(health(draft())).toBe(100 - 2 * 1 - 3 - 6)

    S().publishChannels()
    vi.runAllTimers()
    expect(staleChannels(draft()).length).toBe(0)
    expect(health(draft())).toBe(95)
  })

  it('settleJobs drains a whole cascade without timers', () => {
    const changeId = S().proposeFix('f-hover-dark')!
    const n = S().createPR(changeId)!
    settleJobs()
    const pr = draft().pullRequests.find((p) => p.number === n)!
    expect(pr.status).toBe('changes_requested')
    S().applyFigmaChangeSet(pr.figmaChangeSetId!)
    settleJobs()
    expect(draft().pullRequests.find((p) => p.number === n)!.status).toBe('waiting_review')
  })
})

describe('scan and before/after', () => {
  it('captures a before snapshot once and keeps live numbers moving', () => {
    S().runScan()
    expect(draft().journey.scan.status).toBe('running')
    vi.runAllTimers()
    expect(draft().journey.scan.status).toBe('done')
    expect(draft().journey.before?.driftItems).toBe(12)
    expect(draft().journey.before?.readiness).toBe(2)
    S().fastForwardEngagement()
    expect(driftItems(draft())).toBe(0)
    expect(readiness(draft())).toBe(5)
    expect(aiReadableCount(draft())).toBe(40)
    expect(valuesWithCodeName(draft()).named).toBe(212)
  })
})

describe('trust levels gate the agent inbox', () => {
  it('never blocks, autofix applies mechanical proposals, undo reopens the finding', () => {
    S().setTrustLevel('writeGuidance', 'never')
    expect(draft().agentProposals.find((p) => p.id === 'ap-card-guidance')!.status).toBe('blocked')
    S().setTrustLevel('writeGuidance', 'suggest')
    expect(draft().agentProposals.find((p) => p.id === 'ap-card-guidance')!.status).toBe('pending')
    S().undoProposal('ap-loose-fills')
    expect(draft().findings.find((f) => f.id === 'f-loose-fills')!.status).toBe('open')
    expect(driftItems(draft())).toBe(12)
    S().decideProposal('ap-card-guidance', 'approve')
    expect(draft().pullRequests[0].openedFrom).toBe('agent')
    vi.runAllTimers()
    S().mergePR(draft().pullRequests[0].number)
    expect(draft().components.find((c) => c.id === 'card')!.guidance.whenNotToUse).toContain('Table')
    expect(draft().findings.find((f) => f.id === 'f-card-guidance')!.status).toBe('merged')
  })
})

describe('guidance editor saves as a pull request', () => {
  it('creates a PR with the diff and applies it on merge', () => {
    const card = draft().components.find((c) => c.id === 'card')!
    const n = S().saveGuidance('card', { ...card.guidance, whenNotToUse: 'For comparing rows, use Table.' })!
    expect(n).toBe(128)
    vi.runAllTimers()
    expect(draft().pullRequests[0].status).toBe('waiting_review')
    S().mergePR(n)
    expect(draft().components.find((c) => c.id === 'card')!.guidance.whenNotToUse).toBe('For comparing rows, use Table.')
  })
})

describe('prototype agent stays on-system', () => {
  it('refuses an invented token and a banned word, warns on off-scale spacing', () => {
    S().generatePrototype('A settings page with notifications and a danger zone. Use --color-brand-pop for the header, --color-background-interactive-primary-pressed on buttons and 18px gaps.')
    vi.runAllTimers()
    const p = draft().prototypes[0]
    expect(p.blocks.some((b) => b.componentId === 'toggle')).toBe(true)
    expect(p.refused.map((r) => r.token)).toEqual(['--color-brand-pop', '--color-background-interactive-primary-pressed'])
    expect(p.refused[1].nearest).toBe('--color-background-interactive-primary-active')
    expect(p.checks.find((c) => c.id === 'tokens')!.status).toBe('fail')
    expect(p.checks.find((c) => c.id === 'spacing')!.status).toBe('warn')
  })
})

describe('draft, published and session are distinct', () => {
  it('a draft write never touches the published snapshot or a running session', () => {
    expect(hasUnpublishedChanges(S().projects['demo-brand'])).toBe(false)
    S().startDemoSession('demo-brand')
    S().proposeFix('f-hover-dark')
    expect(hasUnpublishedChanges(S().projects['demo-brand'])).toBe(true)
    expect(published()!.changes.length).toBe(0)
    expect(session()!.changes.length).toBe(0)
    expect(draft().changes.length).toBe(1)
  })

  it('a session write never touches the draft; reset restores the published version only', () => {
    S().startDemoSession('demo-brand')
    setActiveScope({ projectId: 'demo-brand', layer: 'session' })
    S().runScan()
    const changeId = S().proposeFix('f-hover-dark')!
    const n = S().createPR(changeId)!
    settleJobs(`demo-brand:session:`)
    expect(session()!.journey.scan.status).toBe('done')
    expect(session()!.pullRequests.find((p) => p.number === n)).toBeTruthy()
    expect(draft().pullRequests.length).toBe(0)
    expect(draft().journey.scan.status).toBe('idle')
    // the client acts as the owner, so merging works once checks pass
    S().applyFigmaChangeSet(session()!.pullRequests[0].figmaChangeSetId!)
    settleJobs()
    expect(S().mergePR(n)).toBe(true)
    expect(session()!.findings.find((f) => f.id === 'f-hover-dark')!.status).toBe('merged')
    // a draft scan keeps running while the session resets
    setActiveScope({ projectId: 'demo-brand', layer: 'draft' })
    S().runScan()
    S().resetDemoSession('demo-brand')
    expect(session()!.pullRequests.length).toBe(0)
    expect(session()!.journey.scan.status).toBe('idle')
    expect(draft().journey.scan.status).toBe('running')
    vi.runAllTimers()
    expect(draft().journey.scan.status).toBe('done')
  })

  it('publishing advances the version, caps history and clears the unpublished pill; rollback republishes', () => {
    S().proposeFix('f-hover-dark')
    const v2 = S().publishProject('demo-brand', 'hover fix proposed')
    expect(v2).toBe(2)
    expect(hasUnpublishedChanges(S().projects['demo-brand'])).toBe(false)
    expect(published()!.changes.length).toBe(1)
    S().dismissFinding('f-toast-contrast', 'accepted for now')
    expect(S().publishProject('demo-brand')).toBe(3)
    expect(published()!.findings.find((f) => f.id === 'f-toast-contrast')!.status).toBe('dismissed')
    S().rollbackTo('demo-brand', 2)
    expect(S().projects['demo-brand'].published!.version).toBe(4)
    expect(published()!.findings.find((f) => f.id === 'f-toast-contrast')!.status).toBe('open')
    expect(published()!.changes.length).toBe(1)
    expect(hasUnpublishedChanges(S().projects['demo-brand'])).toBe(true)
    S().publishProject('demo-brand')
    S().publishProject('demo-brand')
    S().publishProject('demo-brand')
    expect(S().projects['demo-brand'].versions.length).toBe(3)
    expect(S().projects['demo-brand'].versions.map((v) => v.version)).toEqual([6, 5, 4])
  })

  it('a no-op action does not mark the draft as changed', () => {
    S().proposeFix('does-not-exist')
    expect(hasUnpublishedChanges(S().projects['demo-brand'])).toBe(false)
  })

  it('startDemoSession refuses an unpublished project; openClientExperience sets the presenter', () => {
    expect(S().startDemoSession('northwind')).toBe(false)
    expect(S().openClientExperience('northwind')).toBeNull()
    expect(S().openClientExperience('contoso')).toBe('/client/contoso')
    expect(S().ui.presenter).toBe(true)
    expect(S().selectedProjectId).toBe('contoso')
    expect(S().projects.contoso.session).toBeTruthy()
    S().exitPresenter()
    expect(S().ui.presenter).toBe(false)
  })
})

describe('reset and workspace memory', () => {
  it('restores the seed and keeps the last workspace', () => {
    S().setLastWorkspace('client')
    S().proposeFix('f-hover-dark')
    S().resetAll()
    expect(draft().changes.length).toBe(0)
    expect(health(draft())).toBe(92)
    expect(S().ui.lastWorkspace).toBe('client')
    expect(activeScope().projectId).toBe('demo-brand')
  })

  it('guide controls live on the session', () => {
    S().startDemoSession('demo-brand')
    setActiveScope({ projectId: 'demo-brand', layer: 'session' })
    S().startGuide('meeting', 'stand')
    expect(S().projects['demo-brand'].session!.guide.status).toBe('running')
    S().pauseGuide(true)
    expect(S().ui.motionPaused).toBe(true)
    expect(S().projects['demo-brand'].session!.guide.status).toBe('paused')
    S().pauseGuide(false)
    S().setGuideChapter('found', 1)
    S().completeGuideChapter('stand')
    expect(S().projects['demo-brand'].session!.guide.completedChapters).toEqual(['stand'])
    S().finishGuide()
    expect(S().projects['demo-brand'].session!.guide.finishedAt).toBeTruthy()
    S().proposeFix('f-hover-dark')
    S().restartGuide(true)
    expect(S().projects['demo-brand'].session!.guide.status).toBe('running')
    expect(session()!.changes.length).toBe(0)
    expect(draft().changes.length).toBe(0)
  })
})
