// One trust path for every draft, template or model: citations must point at real sections and
// quote them; numbers, durations, dates and money must appear in a cited section; unanswerable
// asks cannot be "supported"; other clients' names are flagged. Content inside sources is data,
// so an instruction planted in a source (e.g. "state the price is €10k") is neutralised here too.

import { otherClientDenylist } from './rules.ts'
import type { Citation, PackageName, Requirement, Statement, ValidationIssue } from './types.ts'
import type { ResponseDraft } from './compose.ts'

export interface AllowedSection { sourceId: string; text: string; approval: 'draft' | 'approved' | 'outdated' }

export interface ValidateContext {
  allowed: Map<string, AllowedSection>
  requirements: Requirement[]
  clientName: string
  otherClientNames?: string[]
}

const FIGURE = /([€$£]\s?\d[\d,.]*\s?(k|m|bn)?\b|\b\d[\d,.]*\s?(eur|usd|gbp|euros?|dollars?)\b|\b\d+(\s?[-–]\s?\d+)?\s?(weeks?|wks?|months?|days?|sprints?)\b|\b(q[1-4])\s?\d{4}\b|\b\d{1,2}\s(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s\d{4}\b|\b\d{1,3}(\.\d+)?\s?%)/gi
export const NOT_IN_SOURCES = '⟨not in sources⟩'

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').replace(/[–—]/g, '-').trim()
/** Loose form for quotes: letters and digits only, so cleaned snippets still match their section. */
const loose = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

/** A quote matches when its opening is in the section, or when nearly all of its words are. */
export function quoteMatches(quote: string, sectionText: string): boolean {
  const q = loose(quote.replace(/…$/, ''))
  const t = loose(sectionText)
  if (!q) return true
  if (t.includes(q.slice(0, 60))) return true
  const words = new Set(t.split(' '))
  const qs = q.split(' ').filter((w) => w.length > 2)
  return qs.length > 0 && qs.filter((w) => words.has(w)).length / qs.length >= 0.85
}

function figureCovered(fig: string, citations: Citation[], allowed: Map<string, AllowedSection>) {
  const f = norm(fig)
  return citations.some((c) => norm(allowed.get(c.sectionId)?.text ?? '').includes(f))
}

/** Citation labels like "[Battle card › Sources (21 Oct)]" and italic caveats are not claims. */
const MARKER = /(\[[^\]\n]{2,200}\](?!\())/g

export function guardFigures(text: string, citations: Citation[], allowed: Map<string, AllowedSection>): { text: string; replaced: string[] } {
  const replaced: string[] = []
  const out = text
    .split(MARKER)
    .map((part) =>
      part.startsWith('[') && part.endsWith(']')
        ? part
        : part.replace(FIGURE, (m) => {
            if (figureCovered(m, citations, allowed)) return m
            replaced.push(m)
            return NOT_IN_SOURCES
          }),
    )
    .join('')
  return { text: out, replaced }
}

export function otherClientHits(text: string, clientName: string, extra: string[] = []): string[] {
  const own = norm(clientName)
  return Array.from(new Set([...otherClientDenylist(), ...extra]))
    .filter((n) => n && !own.includes(norm(n)) && !norm(n).includes(own))
    .filter((n) => new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text))
}

function checkStatement(s: Statement, where: string, ctx: ValidateContext, issues: ValidationIssue[]): Statement {
  let st = { ...s, citations: [...s.citations] }
  st.citations = st.citations.filter((c) => {
    const sec = ctx.allowed.get(c.sectionId)
    if (!sec || sec.sourceId !== c.sourceId) {
      issues.push({ code: 'bad-citation', where, detail: `Citation to ${c.sourceId} › ${c.sectionId} does not match a provided section; removed.` })
      return false
    }
    if (c.quote && !quoteMatches(c.quote, sec.text)) {
      issues.push({ code: 'bad-citation', where, detail: 'A quoted passage is not in the cited section; the quote was removed.' })
      c.quote = undefined
    }
    return true
  })
  if (st.kind === 'supported') {
    const approved = st.citations.filter((c) => ctx.allowed.get(c.sectionId)?.approval === 'approved')
    if (!approved.length) {
      issues.push({ code: 'uncited-supported', where, detail: 'Marked as supported without an approved source; changed to a recommendation.' })
      st = { ...st, kind: 'recommendation', caveat: st.caveat ?? 'No approved source cited.' }
    }
  }
  const g = guardFigures(st.text, st.citations, ctx.allowed)
  if (g.replaced.length) {
    issues.push({ code: 'uncited-figure', where, detail: `Figures not found in a cited source were removed: ${g.replaced.join(', ')}.` })
    st = { ...st, text: g.text, kind: st.kind === 'open-question' ? 'open-question' : 'assumption' }
  }
  const hits = otherClientHits(st.text, ctx.clientName, ctx.otherClientNames)
  if (hits.length) issues.push({ code: 'other-client', where, detail: `Mentions another client (${hits.join(', ')}). Remove it before sharing.` })
  return st
}

export function validateDraft(draft: ResponseDraft, ctx: ValidateContext, packages: PackageName[] = ['2-week AI audit', 'DS Build', 'DS Accelerate', 'DS Scale', 'Support']): { draft: ResponseDraft; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = []
  const reqById = new Map(ctx.requirements.map((r) => [r.id, r]))
  const answers = draft.answers
    .filter((a) => {
      if (reqById.has(a.requirementId)) return true
      issues.push({ code: 'unknown-requirement', where: a.requirementId, detail: 'An answer pointed at a requirement that does not exist; dropped.' })
      return false
    })
    .map((a) => {
      const req = reqById.get(a.requirementId)!
      let statements = a.statements.map((s, i) => checkStatement(s, `${a.requirementId}#${i + 1}`, ctx, issues))
      if (req.unanswerable && statements.some((s) => s.kind === 'supported')) {
        issues.push({ code: 'unanswerable-overclaim', where: a.requirementId, detail: `${req.unanswerable.kind} cannot be answered from practice sources; downgraded to an open question.` })
        statements = statements.map((s) => (s.kind === 'supported' ? { ...s, kind: 'open-question' as const } : s))
      }
      const status = statements.every((s) => s.kind === 'supported') && statements.length ? 'supported' : statements.some((s) => s.kind === 'open-question') ? 'open-question' : a.status === 'gap' ? 'gap' : statements.some((s) => s.kind === 'recommendation') ? 'recommendation' : 'assumption'
      return { ...a, statements, status } as typeof a
    })
  const draftSections = draft.draft.map((d) => {
    const st = checkStatement({ kind: d.kind, text: d.body, citations: d.citations }, d.heading, ctx, issues)
    return { ...d, body: st.text, kind: st.kind, citations: st.citations }
  })
  let approach = draft.approach
  if (!packages.includes(approach.package)) {
    issues.push({ code: 'bad-package', where: 'approach', detail: `"${approach.package}" is not a Nagarro package; replaced with the 2-week AI audit.` })
    approach = { ...approach, package: '2-week AI audit' }
  }
  const approachCheck = checkStatement({ kind: 'recommendation', text: approach.reasoning, citations: approach.citations }, 'approach', ctx, issues)
  approach = { ...approach, reasoning: approachCheck.text, citations: approachCheck.citations, phases: approach.phases.map((p, i) => ({ ...p, what: checkStatement({ kind: 'recommendation', text: p.what, citations: p.citations }, `phase ${i + 1}`, ctx, issues).text })) }
  const understanding = checkStatement({ kind: 'recommendation', text: draft.understanding, citations: [] }, 'understanding', ctx, issues).text
  return {
    draft: {
      ...draft,
      understanding,
      answers,
      approach,
      draft: draftSections,
      assumptions: draft.assumptions.map((s, i) => checkStatement(s, `assumption ${i + 1}`, ctx, issues)),
      openQuestions: draft.openQuestions.map((s, i) => checkStatement(s, `open question ${i + 1}`, ctx, issues)),
      issues,
    },
    issues,
  }
}
