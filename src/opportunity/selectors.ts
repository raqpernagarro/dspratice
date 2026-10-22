// Read-only views over an opportunity: which sources it may use, coverage per requirement,
// whether a response, published output or deck is behind its inputs, and what blocks publishing.

import { hashJson } from '../knowledge/hash.ts'
import type { KnowledgeSource, RecordedSource } from '../knowledge/types.ts'
import { otherClientHits, quoteMatches } from './validate.ts'
import type { Opportunity, Requirement, ResponseVersion, StatementKind } from './types.ts'

export function activeRequirements(opp: Pick<Opportunity, 'requirements'>): Requirement[] {
  return opp.requirements.filter((r) => r.status !== 'removed').sort((a, b) => a.order - b.order)
}

export function requirementsHash(opp: Pick<Opportunity, 'requirements'>): string {
  return hashJson(activeRequirements(opp).map((r) => [r.id, r.text, r.primary, r.mustAnswer]))
}

export function currentResponse(opp: Pick<Opportunity, 'responses'>): ResponseVersion | undefined {
  return opp.responses[0]
}

export function responseHash(r: ResponseVersion): string {
  return hashJson(r.draft.map((d) => [d.heading, d.body, d.kind]))
}

/** The only sources retrieval and drafting may receive: visible to this client, included, not excluded. */
export function opportunitySources(registry: KnowledgeSource[], projectId: string, opp: Pick<Opportunity, 'sourceSelection'>): KnowledgeSource[] {
  const excluded = new Set(opp.sourceSelection.excluded.map((e) => e.sourceId))
  const included = new Set(opp.sourceSelection.included)
  return registry.filter((s) => (s.scope.kind === 'practice' || s.scope.projectId === projectId || s.scope.reusable) && included.has(s.id) && !excluded.has(s.id))
}

export type CoverageState = 'full' | 'partial' | 'none'
export interface CoverageRow { requirementId: string; state: CoverageState; kind: StatementKind | 'gap'; evidence: number; mustAnswer: boolean }

export function coverage(opp: Pick<Opportunity, 'requirements' | 'responses'>): CoverageRow[] {
  const r = currentResponse(opp)
  return activeRequirements(opp).map((req) => {
    const a = r?.answers.find((x) => x.requirementId === req.id)
    const kind = a?.status ?? 'gap'
    const state: CoverageState = kind === 'supported' ? 'full' : kind === 'recommendation' ? 'partial' : 'none'
    return { requirementId: req.id, state, kind, evidence: req.evidence.length, mustAnswer: req.mustAnswer }
  })
}

export function coverageSummary(rows: CoverageRow[]) {
  return { full: rows.filter((r) => r.state === 'full').length, partial: rows.filter((r) => r.state === 'partial').length, none: rows.filter((r) => r.state === 'none').length, mustAnswerOpen: rows.filter((r) => r.mustAnswer && r.state === 'none').length }
}

export interface OutdatedReason { kind: 'request' | 'requirements' | 'response' | 'source-refreshed' | 'source-approval' | 'source-missing'; detail: string; sourceId?: string }

export function sourcesChanged(recorded: RecordedSource[], registry: KnowledgeSource[]): OutdatedReason[] {
  const by = new Map(registry.map((s) => [s.id, s]))
  const out: OutdatedReason[] = []
  for (const r of recorded) {
    const s = by.get(r.sourceId)
    if (!s) out.push({ kind: 'source-missing', sourceId: r.sourceId, detail: `"${r.title}" was removed from the library.` })
    else if (r.sourceHash && s.sourceHash && r.sourceHash !== s.sourceHash) out.push({ kind: 'source-refreshed', sourceId: s.id, detail: `"${s.title}" changed since it was used.` })
    else if (r.approval === 'approved' && s.approval !== 'approved') out.push({ kind: 'source-approval', sourceId: s.id, detail: `"${s.title}" is now ${s.approval}.` })
  }
  return out
}

export function responseOutdated(opp: Opportunity, registry: KnowledgeSource[]): OutdatedReason[] {
  const r = currentResponse(opp)
  if (!r || !opp.request) return []
  const out: OutdatedReason[] = []
  const cur = opp.request.versions.find((v) => v.version === opp.request!.current)
  if (cur && cur.hash !== r.inputs.requestHash) out.push({ kind: 'request', detail: `The request changed (now v${cur.version}).` })
  if (requirementsHash(opp) !== r.inputs.requirementsHash) out.push({ kind: 'requirements', detail: 'The requirements were edited after this draft.' })
  return [...out, ...sourcesChanged(r.inputs.sources, registry)]
}

export type PublishRefusal = { sectionId?: string; reason: string }

/** What blocks sharing these sections with the client. Internal citations are stripped, not refused. */
export function publishRefusals(opp: Opportunity, sectionIds: string[], registry: KnowledgeSource[], clientName: string): PublishRefusal[] {
  const r = currentResponse(opp)
  if (!r) return [{ reason: 'There is no draft to publish yet.' }]
  if (!sectionIds.length) return [{ reason: 'Tick at least one section.' }]
  const by = new Map(registry.map((s) => [s.id, s]))
  const out: PublishRefusal[] = []
  for (const id of sectionIds) {
    const d = r.draft.find((x) => x.id === id)
    if (!d) continue
    if (d.citations.some((c) => by.get(c.sourceId)?.approval === 'outdated')) out.push({ sectionId: id, reason: `"${d.heading}" cites an outdated source. Re-approve the source or untick the section.` })
    if (d.body.includes('⟨not in sources⟩')) out.push({ sectionId: id, reason: `"${d.heading}" still contains a figure that is not in any source. Edit it first.` })
    const hits = otherClientHits(`${d.heading}\n${d.body}`, clientName)
    if (hits.length) out.push({ sectionId: id, reason: `"${d.heading}" mentions another client (${hits.join(', ')}).` })
    const quoted = internalQuotes(d, by)
    if (quoted.length) out.push({ sectionId: id, reason: `"${d.heading}" still quotes internal-only material (${quoted.join(', ')}). Rewrite it in your own words first.` })
  }
  return out
}

/** Titles of internal-only sources whose quoted words are still in the section: removing the
 *  citation is not enough, the text itself would reach the client. */
export function internalQuotes(d: { body: string; citations: { sourceId: string; quote?: string }[] }, by: Map<string, KnowledgeSource>): string[] {
  const titles = d.citations
    .filter((c) => c.quote && c.quote.trim().split(/\s+/).length >= 6)
    .map((c) => ({ c, src: by.get(c.sourceId) }))
    .filter(({ c, src }) => (!src || src.audience === 'internal') && quoteMatches(c.quote!, d.body))
    .map(({ c, src }) => src?.title ?? c.sourceId)
  return Array.from(new Set(titles))
}

/** The client-safe copy: internal-only and unknown sources are dropped from the citations. */
export function clientSafeSections(r: ResponseVersion, sectionIds: string[], registry: KnowledgeSource[]) {
  const by = new Map(registry.map((s) => [s.id, s]))
  return r.draft
    .filter((d) => sectionIds.includes(d.id))
    .map((d) => ({
      heading: d.heading,
      body: d.body.replace(/\s?\[[^\]\n]{2,200}\](?!\()/g, '').replace(/\n_[^\n]*(cleared|draft|outdated|approved)[^\n]*_\n?/gi, '\n').trim(),
      kind: d.kind,
      sources: Array.from(new Set(d.citations.map((c) => by.get(c.sourceId)).filter((s) => s && s.audience !== 'internal').map((s) => s!.title))),
    }))
}
