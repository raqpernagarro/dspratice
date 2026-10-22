// Old routes (/panel/*, /demo, /handbook, /nagarro/presenter) land on their new home in the
// workspace the person used last. Presenters are sent to the client demo.

import { Navigate, matchPath, useLocation } from 'react-router'
import { useStore } from '@/state/store'
import { familyFor, practice, type RouteFamily } from '@/app/routes'

type Ctx = { r: RouteFamily; client: boolean; params: Record<string, string | undefined> }

const RULES: [string, (c: Ctx) => string][] = [
  ['/panel', ({ r, client }) => (client ? r.home : practice.home)],
  ['/panel/start', ({ r, client }) => (client ? r.home : r.journeyNew())],
  ['/panel/start/new', ({ r, client }) => (client ? r.home : r.journeyNew())],
  ['/panel/start/new/:step', ({ r, client, params }) => (client ? r.home : r.journeyNew(params.step))],
  ['/panel/start/connect', ({ r, client }) => (client ? r.home : r.journeyImprove('connect'))],
  ['/panel/start/scan', ({ r }) => r.assessment],
  ['/panel/start/readout', ({ r, client }) => (client ? r.report : r.journeyImprove('plan'))],
  ['/panel/start/mapping', ({ r, client }) => (client ? r.home : r.journeyImprove('mapping'))],
  ['/panel/start/drift', ({ r, client }) => (client ? r.changes : r.journeyImprove('findings'))],
  ['/panel/start/handover', ({ r }) => r.handover],
  ['/panel/system', ({ r }) => r.components],
  ['/panel/system/components', ({ r }) => r.components],
  ['/panel/system/components/:id', ({ r, params }) => r.component(params.id!)],
  ['/panel/system/components/:id/guidance', ({ r, params }) => r.guidance(params.id!)],
  ['/panel/system/tokens', ({ r }) => r.tokens],
  ['/panel/system/tokens/:id', ({ r, params }) => r.token(params.id!)],
  ['/panel/system/foundations', ({ r }) => r.foundations],
  ['/panel/changes', ({ r }) => r.changes],
  ['/panel/changes/findings/:id', ({ r, params }) => r.finding(params.id!)],
  ['/panel/changes/:changeId/impact', ({ r, params }) => r.impact(params.changeId!)],
  ['/panel/changes/pr/:n', ({ r, params }) => r.pr(params.n!)],
  ['/panel/changes/pr/:n/figma', ({ r, params }) => r.prFigma(params.n!)],
  ['/panel/changes/figma/:id', ({ r, params }) => r.figma(params.id!)],
  ['/panel/ai', ({ r }) => r.channels],
  ['/panel/ai/channels', ({ r }) => r.channels],
  ['/panel/ai/channels/:id', ({ r, params }) => r.channel(params.id!)],
  ['/panel/ai/evals', ({ r }) => r.evals],
  ['/panel/ai/inbox', ({ r }) => r.inbox],
  ['/panel/ai/prototype', ({ r }) => r.prototype],
  ['/panel/govern', ({ r }) => r.contract],
  ['/panel/govern/contract', ({ r }) => r.contract],
  ['/panel/govern/people', ({ r }) => r.people],
  ['/panel/govern/brands', ({ r }) => r.brands],
  ['/panel/govern/trust', ({ r }) => r.trust],
  ['/panel/govern/audit', ({ r }) => r.audit],
  ['/panel/share', ({ r }) => r.report],
  ['/panel/share/report', ({ r }) => r.report],
  ['/demo', ({ r, client }) => (client ? `${r.home}?guide=meeting` : r.home)],
  ['/demo/outcome', ({ r }) => r.outcome],
  ['/handbook', ({ r }) => r.guides],
  ['/handbook/:slug', ({ r, params }) => r.guide(params.slug!)],
  ['/nagarro/presenter', ({ r }) => r.meeting],
]

export function legacyTarget(pathname: string, search: string, r: RouteFamily): string {
  const client = r.workspace === 'client'
  for (const [pattern, to] of RULES) {
    const m = matchPath(pattern, pathname)
    if (m) {
      const target = to({ r, client, params: m.params as Record<string, string | undefined> })
      return search && !target.includes('?') ? target + search : target
    }
  }
  return client ? r.home : practice.home
}

export function LegacyRedirect() {
  const { pathname, search } = useLocation()
  const presenter = useStore((s) => s.ui.presenter)
  const lastWorkspace = useStore((s) => s.ui.lastWorkspace)
  const selected = useStore((s) => s.selectedProjectId)
  const project = useStore((s) => s.projects[selected])
  const ws = presenter ? 'client' : (lastWorkspace ?? 'nagarro')
  const r = familyFor(ws, project.slug)
  return <Navigate to={legacyTarget(pathname, search, r)} replace />
}
