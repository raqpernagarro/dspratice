import { describe, expect, it } from 'vitest'
import { client, equivalentRoute, nagarro, practice, workspaceFromPath } from './routes'
import { legacyTarget } from './LegacyRedirect'
import { activeNav, navFor } from '@/shell/useWorkspace'

const N = nagarro('demo-brand')
const C = client('demo-brand')

describe('workspaceFromPath', () => {
  it('derives the workspace and slug from the route', () => {
    expect(workspaceFromPath('/')).toEqual({ workspace: null })
    expect(workspaceFromPath('/nagarro')).toEqual({ workspace: 'nagarro', slug: undefined })
    expect(workspaceFromPath('/nagarro/clients/demo-brand/changes/pr/128')).toEqual({ workspace: 'nagarro', slug: 'demo-brand' })
    expect(workspaceFromPath('/client/contoso')).toEqual({ workspace: 'client', slug: 'contoso' })
    expect(workspaceFromPath('/client/contoso/explore/components/button')).toEqual({ workspace: 'client', slug: 'contoso' })
    expect(workspaceFromPath('/preview.html')).toEqual({ workspace: 'preview' })
  })
})

describe('equivalentRoute maps a page to the other workspace', () => {
  const cases: [string, string][] = [
    [N.home, C.home],
    [N.components, C.components],
    [N.component('button'), C.component('button')],
    [N.guidance('button'), C.component('button')],
    [N.token('x'), C.token('x')],
    [N.foundations, C.foundations],
    [N.changes, C.changes],
    [N.finding('f-hover-dark'), C.finding('f-hover-dark')],
    [N.impact('ch-1'), C.impact('ch-1')],
    [N.pr(128), C.pr(128)],
    [N.prFigma(128), C.prFigma(128)],
    [N.figma('cs-1'), C.figma('cs-1')],
    [N.channels, C.channels],
    [N.channel('v0-registry'), C.channel('v0-registry')],
    [N.prototype, C.prototype],
    [N.report, C.report],
    [N.assessment, C.assessment],
    [N.handover, C.handover],
  ]
  it.each(cases)('%s ⇄ %s', (n, c) => {
    expect(equivalentRoute(n, 'client', 'demo-brand')).toBe(c)
  })
  it('client → nagarro for mirrored pages', () => {
    expect(equivalentRoute(C.component('button'), 'nagarro', 'demo-brand')).toBe(N.component('button'))
    expect(equivalentRoute(C.pr(128), 'nagarro', 'demo-brand')).toBe(N.pr(128))
    expect(equivalentRoute(C.home, 'nagarro', 'demo-brand')).toBe(N.home)
  })
  it('falls back to the parent list when the entity is missing on the other side, and to the home when unmapped', () => {
    expect(equivalentRoute(N.pr(999), 'client', 'demo-brand', (kind, id) => !(kind === 'pr' && id === '999'))).toBe(C.changes)
    expect(equivalentRoute(N.trust, 'client', 'demo-brand')).toBe(C.home)
    expect(equivalentRoute(practice.guides, 'client', 'demo-brand')).toBe(C.guides)
    expect(equivalentRoute(practice.presentations, 'client', 'demo-brand')).toBe(C.home)
    expect(equivalentRoute('/client', 'nagarro', 'demo-brand')).toBe(practice.home)
  })
})

describe('legacy redirects', () => {
  it('sends every old route to its new home in both workspaces', () => {
    expect(legacyTarget('/panel/start/scan', '', N)).toBe(N.assessment)
    expect(legacyTarget('/panel/start/scan', '', C)).toBe(C.assessment)
    expect(legacyTarget('/panel/system/components/button', '', C)).toBe(C.component('button'))
    expect(legacyTarget('/panel/changes/pr/128/figma', '', N)).toBe(N.prFigma(128))
    expect(legacyTarget('/panel/ai/prototype', '?demo=1', C)).toBe(`${C.prototype}?demo=1`)
    expect(legacyTarget('/demo', '', C)).toBe(`${C.home}?guide=meeting`)
    expect(legacyTarget('/demo', '', N)).toBe(N.home)
    expect(legacyTarget('/demo/outcome', '', C)).toBe(C.outcome)
    expect(legacyTarget('/handbook/why', '', N)).toBe(practice.guide('why'))
    expect(legacyTarget('/nagarro/presenter', '', N)).toBe(N.meeting)
    expect(legacyTarget('/panel/govern/trust', '', N)).toBe(N.trust)
    expect(legacyTarget('/something/unknown', '', N)).toBe(practice.home)
  })
})

describe('navigation keeps the parent selected on detail routes', () => {
  it('nagarro', () => {
    const nav = navFor('nagarro', N)
    expect(activeNav(nav, N.pr(128))?.label).toBe('Changes and checks')
    expect(activeNav(nav, N.component('button'))?.label).toBe('System library')
    expect(activeNav(nav, N.journeyNew(3))?.label).toBe('Clients and engagements')
    expect(activeNav(nav, practice.clients)?.label).toBe('Clients and engagements')
    expect(activeNav(nav, practice.home)?.label).toBe('Home')
    expect(activeNav(nav, N.trust)?.label).toBe('Settings')
  })
  it('client', () => {
    const nav = navFor('client', C)
    expect(activeNav(nav, C.prFigma(128))?.label).toBe('See the improvement')
    expect(activeNav(nav, C.token('x'))?.label).toBe('Explore the system')
    expect(activeNav(nav, C.handover)?.label).toBe('Evidence and next steps')
    expect(activeNav(nav, C.home)?.label).toBe('Overview')
  })
})
