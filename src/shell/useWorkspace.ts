// Navigation model per workspace. The workspace itself is derived from the route (see
// src/app/routes.ts); nothing here reads persisted state.

import { practice, type RouteFamily } from '@/app/routes'
import type { Workspace } from '@/state/types'

export { homeFor } from '@/app/routes'
export { useIsClient } from '@/state/hooks'

export interface NavItem {
  to: string
  label: string
  match: string[]
  icon: 'home' | 'clients' | 'library' | 'changes' | 'ai' | 'presentations' | 'guides' | 'settings' | 'explore' | 'improve' | 'evidence' | 'knowledge' | 'opportunities' | 'demos' | 'tools' | 'scorecard'
  /** Sidebar group heading (Nagarro workspace): Win work · Deliver · Practice. */
  group?: string
}

export function navFor(ws: Workspace, r: RouteFamily): NavItem[] {
  if (ws === 'client') {
    const b = r.home
    return [
      { to: r.home, label: 'Overview', match: [b], icon: 'home' },
      { to: r.components, label: 'Explore the system', match: [`${b}/explore`], icon: 'explore' },
      { to: r.changes, label: 'See the improvement', match: [`${b}/improve`], icon: 'improve' },
      { to: r.prototype, label: 'Build with AI', match: [`${b}/ai`], icon: 'ai' },
      { to: r.report, label: 'Evidence and next steps', match: [`${b}/evidence`], icon: 'evidence' },
    ]
  }
  const p = r.home
  return [
    { to: practice.home, label: 'Home', match: [practice.home], icon: 'home' },
    { to: practice.opportunities, label: 'Opportunities', match: [practice.opportunities, `${p}/opportunities`], icon: 'opportunities', group: 'Win work' },
    { to: practice.demos, label: 'Demos', match: [practice.demos, practice.scorecard], icon: 'demos', group: 'Win work' },
    { to: practice.presentations, label: 'Presentations', match: [practice.presentations, `${p}/presentations`], icon: 'presentations', group: 'Win work' },
    { to: practice.clients, label: 'Clients and engagements', match: [practice.clients, `${p}`, `${p}/journey`, `${p}/meeting`, `${p}/report`], icon: 'clients', group: 'Deliver' },
    { to: practice.library, label: 'System library', match: [practice.library, `${p}/system`], icon: 'library', group: 'Deliver' },
    { to: r.changes, label: 'Changes and checks', match: [`${p}/changes`], icon: 'changes', group: 'Deliver' },
    { to: r.channels, label: 'AI setup', match: [`${p}/ai`], icon: 'ai', group: 'Deliver' },
    { to: practice.knowledge, label: 'Knowledge library', match: [practice.knowledge], icon: 'knowledge', group: 'Practice' },
    { to: practice.tools, label: 'Tools', match: [practice.tools], icon: 'tools', group: 'Practice' },
    { to: practice.guides, label: 'Guides and templates', match: [practice.guides], icon: 'guides', group: 'Practice' },
    { to: practice.settings, label: 'Settings', match: [practice.settings, `${p}/settings`], icon: 'settings', group: 'Practice' },
  ]
}

/** Which top-level nav item is active for a pathname (longest prefix wins). */
export function activeNav(items: NavItem[], pathname: string) {
  let best: NavItem | undefined
  let bestLen = -1
  for (const it of items) {
    for (const m of it.match) {
      const hit = pathname === m || pathname.startsWith(m + '/')
      if (hit && m.length > bestLen) {
        best = it
        bestLen = m.length
      }
    }
  }
  return best
}

export interface AreaTab {
  label: string
  to: string
  match?: string
}

/** Secondary tabs per area (shown in the page header). */
export function areaTabsFor(pathname: string, r: RouteFamily, opts?: { proposalPublished?: boolean }): AreaTab[] | null {
  const b = r.home
  const client = r.workspace === 'client'
  const under = (seg: string) => pathname === `${b}/${seg}` || pathname.startsWith(`${b}/${seg}/`) || pathname.startsWith(`${b}/${seg}?`)
  if (under(client ? 'explore' : 'system')) {
    return [
      { label: 'Components', to: r.components },
      { label: 'Tokens', to: r.tokens },
      { label: 'Foundations', to: r.foundations },
    ]
  }
  if (under(client ? 'improve' : 'changes')) {
    return [
      { label: 'Findings', to: r.changes, match: r.changes },
      { label: 'Pull requests', to: r.changesTab('prs') },
      { label: 'Figma change sets', to: r.changesTab('figma') },
    ]
  }
  if (under('ai')) {
    return client
      ? [
          { label: 'Prototype', to: r.prototype, match: r.prototype },
          { label: 'AI channels', to: r.channels },
          { label: 'Release eval', to: r.evals },
        ]
      : [
          { label: 'Channels', to: r.channels },
          { label: 'Release eval', to: r.evals },
          { label: 'Agent inbox', to: r.inbox },
          { label: 'Prototype', to: r.prototype },
        ]
  }
  if (!client && under('settings')) {
    return [
      { label: 'Contract', to: r.contract },
      { label: 'People and roles', to: r.people },
      { label: 'Brands and modes', to: r.brands },
      { label: 'Trust levels', to: r.trust },
      { label: 'Audit trail', to: r.audit },
    ]
  }
  if (!client && under('journey/improve')) {
    return [
      { label: '2 · Connect', to: r.journeyImprove(2) },
      { label: '4 · Scan', to: r.journeyImprove(4) },
      { label: '5 · Drift', to: r.journeyImprove(5) },
      { label: '6 · Readout', to: r.journeyImprove(6) },
      { label: '7 · Mapping', to: r.journeyImprove(7) },
      { label: '9 · Handover', to: r.journeyImprove(9) },
    ]
  }
  if (client && under('evidence')) {
    return [
      { label: 'Report', to: r.report, match: r.report },
      { label: 'Assessment', to: r.assessment },
      { label: 'Handover', to: r.handover },
      { label: 'How it works', to: r.guides },
      ...(opts?.proposalPublished ? [{ label: 'Proposal summary', to: r.proposalSummary }] : []),
    ]
  }
  // engagement level: one set of tabs for the client's home, opportunities, decks, meeting and report
  if (!client && (pathname === b || under('opportunities') || under('presentations') || under('meeting') || under('report'))) {
    return [
      { label: 'Overview', to: r.home, match: r.home },
      { label: 'Opportunities', to: r.opportunities },
      { label: 'Presentations', to: r.presentations },
      { label: 'Meeting prep', to: r.meeting },
      { label: 'Report', to: r.report },
    ]
  }
  if (!client && pathname === practice.knowledge) {
    return [
      { label: 'All sources', to: practice.knowledge, match: practice.knowledge },
      { label: 'Practice', to: practice.knowledgeTab('practice') },
      { label: 'Client-scoped', to: practice.knowledgeTab('client') },
      { label: 'Needs attention', to: practice.knowledgeTab('attention') },
    ]
  }
  if (!client && (pathname === practice.demos || pathname === practice.scorecard)) {
    return [
      { label: 'Demo catalogue', to: practice.demos, match: practice.demos },
      { label: 'AI-readiness scorecard', to: practice.scorecard },
    ]
  }
  if (!client && pathname.startsWith(practice.settings)) {
    return [
      { label: 'People', to: practice.people },
      { label: 'Setup', to: practice.setup },
      { label: 'Integrations and AI usage', to: practice.integrations },
      { label: 'Project settings', to: r.contract, match: `${b}/settings` },
    ]
  }
  return null
}
