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
  icon: 'home' | 'clients' | 'library' | 'changes' | 'ai' | 'presentations' | 'guides' | 'settings' | 'explore' | 'improve' | 'evidence' | 'knowledge' | 'opportunities' | 'demos' | 'tools' | 'scorecard' | 'engagement'
  /** Sidebar group heading (Nagarro workspace): Win work · Deliver · Practice. */
  group?: string
}

export function navFor(ws: Workspace, r: RouteFamily): NavItem[] {
  if (ws === 'client') {
    const b = r.home
    return [
      { to: r.home, label: 'Overview', match: [b], icon: 'home' },
      { to: r.components, label: 'The system', match: [`${b}/explore`], icon: 'explore' },
      { to: r.changes, label: 'Improve it', match: [`${b}/improve`], icon: 'improve' },
      { to: r.prototype, label: 'AI on the system', match: [`${b}/ai`], icon: 'ai' },
      { to: r.outcome, label: 'Outcome and next step', match: [`${b}/evidence`, `${b}/scorecard`], icon: 'evidence' },
    ]
  }
  // One stable, practice-wide list of five. Home asks what you need to do; client requests and
  // decks belong to an item on Projects; the client demo and its social cuts live in Demos;
  // posts and Marketing Studio in Engagement. Tools open from journeys, sources sit in Settings.
  return [
    { to: practice.home, label: 'Home', match: [practice.home, practice.conversations, practice.tools], icon: 'home' },
    { to: practice.projects, label: 'Projects', match: [practice.projects, '/nagarro/start', practice.opportunities, practice.presentations], icon: 'clients' },
    { to: practice.demos, label: 'Demos', match: [practice.demos, practice.scorecard], icon: 'demos' },
    { to: practice.engagement, label: 'Engagement', match: [practice.engagement], icon: 'engagement' },
    { to: practice.settings, label: 'Settings', match: [practice.settings, practice.guides], icon: 'settings', group: 'foot' },
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
  /** Other paths that keep this tab active (a page reached from it, outside its own path). */
  also?: string[]
}

/** Secondary tabs inside an area (shown in the page header). Project sections are tabs in the project header. */
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
      { label: 'Figma changes', to: r.changesTab('figma') },
    ]
  }
  if (under('ai')) {
    return client
      ? [
          { label: 'Build a screen', to: r.prototype, match: r.prototype },
          { label: 'AI tools', to: r.channels },
          { label: 'Release check', to: r.evals },
        ]
      : [
          { label: 'AI tools', to: r.channels },
          { label: 'Release check', to: r.evals },
          { label: 'Agent suggestions', to: r.inbox },
          { label: 'Build a screen', to: r.prototype },
        ]
  }
  if (!client && under('settings')) {
    return [
      { label: 'System contract', to: r.contract },
      { label: 'People and roles', to: r.people },
      { label: 'Brands and modes', to: r.brands },
      { label: 'What agents may do', to: r.trust },
      { label: 'Audit trail', to: r.audit },
    ]
  }
  if (client && (under('evidence') || under('scorecard'))) {
    return [
      { label: 'Outcome and next step', to: r.outcome },
      { label: 'Assessment report', to: r.report, match: r.report },
      { label: 'Run the assessment', to: r.assessment },
      { label: 'Example handover', to: r.handover },
      { label: 'How we work', to: r.guides },
      { label: 'Scorecard', to: r.scorecard },
      ...(opts?.proposalPublished ? [{ label: 'Proposal summary', to: r.proposalSummary }] : []),
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
  if (!client && [practice.projects, practice.opportunities, practice.presentations].includes(pathname)) {
    return [
      { label: 'Projects', to: practice.projects, match: practice.projects },
      { label: 'Client requests', to: practice.opportunities },
      { label: 'Presentations', to: practice.presentations },
    ]
  }
  if (!client && [practice.demos, practice.meetingPrep(), practice.scorecard].includes(pathname)) {
    return [
      { label: 'Client demo', to: practice.demos, match: practice.demos },
      { label: 'Prepare a meeting', to: practice.meetingPrep() },
      { label: 'Scorecard', to: practice.scorecard },
    ]
  }
  if (!client && pathname.startsWith(practice.settings)) {
    return [
      { label: 'About this tool', to: practice.about },
      { label: 'People', to: practice.people },
      { label: 'Sources', to: practice.knowledge },
      { label: 'Integrations and AI usage', to: practice.integrations },
      { label: 'Sample data', to: practice.setup },
    ]
  }
  return null
}
