import type { BrandId, Component, Finding, SystemState, Token } from './types'

// Every number on every screen is derived here from a SystemState. Nothing is stored twice.

export const OPEN: Finding['status'][] = ['open', 'proposed', 'in_pr']

export const isOpen = (f: Finding) => OPEN.includes(f.status)

export function openFindings(s: SystemState) {
  return s.findings.filter(isOpen)
}

export function driftItems(s: SystemState) {
  return openFindings(s)
    .filter((f) => f.ruleId !== 'code-syntax' && f.ruleId !== 'guidance-complete')
    .reduce((n, f) => n + (f.count ?? 1), 0)
}

export function openPRs(s: SystemState) {
  return s.pullRequests.filter((p) => p.status !== 'merged' && p.status !== 'closed')
}

export function staleChannels(s: SystemState) {
  return s.channels.filter((c) => c.status === 'stale')
}

export function lastEval(s: SystemState) {
  return s.evals[0]
}

export function health(s: SystemState) {
  const open = openFindings(s)
  const errors = open.filter((f) => f.severity === 'error').length
  const warns = open.filter((f) => f.severity === 'warn').length
  const stale = staleChannels(s).length
  const ev = lastEval(s)
  const evalPenalty = ev && ev.onSystem < ev.gate ? 10 : 0
  return Math.max(0, Math.min(100, 100 - 2 * errors - warns - stale - evalPenalty))
}

export function componentFindings(s: SystemState, componentId: string) {
  return s.findings.filter((f) => f.componentIds.includes(componentId))
}

export function openComponentFindings(s: SystemState, componentId: string) {
  return componentFindings(s, componentId).filter(isOpen)
}

export function guidancePct(c: Component) {
  const fields = [c.guidance.whenToUse, c.guidance.whenNotToUse, c.guidance.antiPatterns.length ? 'x' : '', c.guidance.a11y]
  const filled = fields.filter((f) => f && f.trim().length > 0).length
  return Math.round((filled / 4) * 100)
}

export function aiReadable(c: Component) {
  return Boolean(c.guidance.whenToUse && c.guidance.whenNotToUse && c.codeConnect)
}

export function componentsInFigma(s: SystemState) {
  return s.components.filter((c) => c.figmaNodeId)
}

export function aiReadableCount(s: SystemState) {
  return componentsInFigma(s).filter(aiReadable).length
}

export function componentsWithoutGuidance(s: SystemState) {
  return s.components.filter((c) => !c.guidance.whenNotToUse)
}

export function componentsWithDrift(s: SystemState) {
  const ids = new Set(openFindings(s).flatMap((f) => f.componentIds))
  return s.components.filter((c) => ids.has(c.id))
}

export function valuesWithCodeName(s: SystemState) {
  // The scan found N values without a code name. They are fixed when the code-names finding is merged.
  const f = s.findings.find((x) => x.id === 'f-code-names')
  const total = s.baseline.totalValues
  const missing = f && isOpen(f) ? s.baseline.valuesWithoutCodeName : 0
  return { named: total - missing, total }
}

export function componentsDiffer(s: SystemState) {
  const parityFindings = openFindings(s).filter((f) => ['variant-parity', 'value-naming', 'token-collision', 'dark-coverage'].includes(f.ruleId))
  const ids = new Set(parityFindings.flatMap((f) => f.componentIds))
  // The seed scan reported more mismatches than the open findings cover; the rest resolve in the engagement.
  const extra = s.journey.engagementFastForwarded ? 0 : Math.max(0, s.baseline.componentsDiffer - 7)
  return { differ: ids.size + extra, total: s.baseline.componentsInFigma }
}

export function parityPct(s: SystemState) {
  const { differ, total } = componentsDiffer(s)
  const base = Math.round(((total - differ) / total) * 100)
  return s.journey.engagementFastForwarded ? 100 : Math.min(99, Math.max(s.baseline.parityPct, base))
}

export function contrastFails(s: SystemState) {
  const f = s.findings.find((x) => x.id === 'f-toast-contrast')
  const base = s.journey.engagementFastForwarded ? 0 : s.baseline.contrastFails - 1
  return base + (f && isOpen(f) ? 1 : 0)
}

export function readiness(s: SystemState) {
  const ai = aiReadableCount(s) / Math.max(1, componentsInFigma(s).length)
  const parity = parityPct(s) / 100
  const contrast = 1 - Math.min(1, contrastFails(s) / Math.max(1, s.baseline.contrastFails))
  const names = valuesWithCodeName(s).named / valuesWithCodeName(s).total
  const mean = (ai + parity + contrast + names) / 4
  if (mean >= 0.97) return 5
  if (mean >= 0.85) return 4
  if (mean >= 0.7) return 3
  if (mean >= 0.5) return 2
  return 1
}

export function checksPassing(s: SystemState) {
  const fails = openFindings(s).filter((f) => f.severity === 'error').length
  return { passing: s.baseline.checksTotal - fails, total: s.baseline.checksTotal }
}

export interface AttentionLinks {
  changes: string
  pr: (n: number) => string
  channel: (id: string) => string
  finding: (id: string) => string
  inbox: string
}

export function forYouToday(s: SystemState, r: AttentionLinks) {
  const items: { id: string; text: string; to: string; kind: 'suggest' | 'pr' | 'channel' | 'warn' }[] = []
  const suggestions = s.findings.filter((f) => f.status === 'open' && f.suggestedFix)
  if (suggestions.length) items.push({ id: 'sugg', text: `${suggestions.length} suggestion${suggestions.length > 1 ? 's' : ''} to review`, to: r.changes, kind: 'suggest' })
  const waiting = s.pullRequests.filter((p) => p.status === 'waiting_review')
  if (waiting.length) items.push({ id: 'prs', text: `${waiting.length} pull request${waiting.length > 1 ? 's' : ''} waiting for you`, to: r.pr(waiting[0].number), kind: 'pr' })
  for (const c of staleChannels(s)) items.push({ id: c.id, text: `${c.name} is ${staleAge(c.lastPublished)} stale`, to: r.channel(c.id), kind: 'channel' })
  const toast = s.findings.find((f) => f.id === 'f-toast-contrast')
  if (toast && isOpen(toast)) items.push({ id: 'toast', text: 'Contrast warning on Toast', to: r.finding('f-toast-contrast'), kind: 'warn' })
  const pending = s.agentProposals.filter((p) => p.status === 'pending')
  if (pending.length) items.push({ id: 'agents', text: `${pending.length} agent proposal${pending.length > 1 ? 's' : ''} need review`, to: r.inbox, kind: 'suggest' })
  return items
}

export function staleAge(ts: number) {
  const d = Math.round((Date.now() - ts) / (24 * 60 * 60 * 1000))
  if (d >= 1) return `${d} day${d > 1 ? 's' : ''}`
  const h = Math.round((Date.now() - ts) / (60 * 60 * 1000))
  if (h >= 1) return `${h} hour${h > 1 ? 's' : ''}`
  const m = Math.max(1, Math.round((Date.now() - ts) / 60000))
  return `${m} min`
}

export function relTime(ts: number) {
  const s = Math.round((Date.now() - ts) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.round(s / 60)} min ago`
  if (s < 86400) return `${Math.round(s / 3600)} h ago`
  const d = Math.round(s / 86400)
  return d === 1 ? 'yesterday' : `${d} days ago`
}

export function tokenValue(t: Token, brand: BrandId, mode: 'light' | 'dark') {
  return (brand !== 'demo' && t.brandOverrides?.[brand]?.[mode]) || t.values[mode]
}

export function tokenInSync(t: Token) {
  return !(t.figmaDrift && Object.keys(t.figmaDrift).length)
}

export function agentJson(c: Component, tokens: Token[]) {
  return {
    component: c.name,
    source: `${c.source}:${c.sourceId}`,
    useWhen: c.guidance.whenToUse ? [c.guidance.whenToUse] : [],
    avoidWhen: c.guidance.whenNotToUse ? [c.guidance.whenNotToUse] : [],
    antiPatterns: c.guidance.antiPatterns,
    tokens: c.tokenRefs.map((id) => tokens.find((t) => t.id === id)?.cssName ?? `--${id}`),
    a11y: c.guidance.a11y ?? '',
    props: (c.props ?? []).map((p) => ({ name: p.name, type: p.type, values: p.values })),
    figma: c.figmaNodeId ? { nodeId: c.figmaNodeId, codeConnect: c.codeConnect } : null,
  }
}

export function roleOf(s: SystemState, personId: string) {
  return s.people.find((p) => p.id === personId)?.role ?? 'viewer'
}
