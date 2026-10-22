// Zero-token requirement extraction from an RFP, questionnaire, brief or meeting notes.
// Numbered and bulleted items, questions and "must/shall/should/provide…" sentences become
// requirements, each tied to its exact span in the original text. Asks the practice must never
// answer from its documents (pricing, references, dates, contracts, outcomes, undocumented
// capabilities) are flagged so the draft turns them into open questions.

import type { Category, Requirement, UnanswerableKind } from './types.ts'

const CATEGORY_WORDS: [Category, RegExp][] = [
  ['assessment', /\b(assess\w*|audit\w*|scan\w*|readiness|maturity|scorecard|baseline|current[- ]state|inventory|health ?check|diagnos\w*)\b/i],
  ['governance', /\b(govern\w*|approv\w*|ownership|owners?|policy|policies|review\w*|versioning|change control|drift|consistency|source of truth|contribution model|operating model|decision rights?)\b/i],
  ['enablement', /\b(training|enabl\w*|coach\w*|workshop\w*|upskill\w*|adoption|onboard\w*|handover|mentor\w*|knowledge transfer|self-sufficien\w*)\b/i],
  ['tooling-ai', /\b(ai|a\.i\.|agents?|agentic|copilot|cursor|claude|mcp|llms?|prompt\w*|automat\w*|generat\w*|machine-readable|ai-native|ai-ready)\b/i],
  ['accessibility', /\b(accessib\w*|wcag|eaa|a11y|contrast|inclusiv\w*|screen reader)\b/i],
  ['delivery-approach', /\b(approach|phas\w*|methodolog\w*|deliverables?|plan|milestones?|workstreams?|roadmap|ways of working)\b/i],
  ['team', /\b(team|roles?|staffing|cvs?|resumes?|profiles?|seniority|consultants?)\b/i],
  ['commercial', /\b(price|pricing|cost\w*|budget|rate card|day rates?|fees?|quot(e|ation)|commercial)\b/i],
  ['legal', /\b(sla|service levels?|liabilit\w*|contract\w*|terms|nda|intellectual property|ip ownership|indemn\w*|warrant\w*|penalt\w*|gdpr|data residency)\b/i],
  ['timeline', /\b(start date|go-live|deadline|timeline|schedule|by q[1-4]|within \d+ (weeks|months)|duration)\b/i],
  ['technical', /\b(angular|vue|react|svelte|stack|frameworks?|integrat\w*|api|repositor\w*|ci\/cd|storybook|tokens?|figma|component librar\w*|web components)\b/i],
]

const UNANSWERABLE: [UnanswerableKind, RegExp, string][] = [
  ['pricing', /\b(price|pricing|cost|costs|rate card|day rates?|budget|fees?|quot(e|ation)|commercial (offer|proposal|terms))\b|[€$£]\s?\d/i, 'Pricing comes from the account team, never from practice documents.'],
  ['credentials', /\b(cvs?|résumés?|resumes?|certif\w*|references?|referenceable|contactable|named (clients?|customers?))\b/i, 'References and CVs are provided by the account team after clearance.'],
  ['availability', /\b(availability|available to start|allocat\w*|headcount|ftes?|named (team|resources|people))\b/i, 'Team availability is confirmed by resourcing, not by this draft.'],
  ['timeline', /\b(start date|earliest start|go-live date|committed (dates?|timeline)|by (q[1-4]|january|february|march|april|may|june|july|august|september|october|november|december)\b)/i, 'Dates are confirmed with the account team; this draft does not commit to them.'],
  ['contract', /\b(sla|service levels?|liabilit\w*|indemn\w*|penalt\w*|warrant\w*|terms and conditions|msa|payment terms|ip ownership)\b/i, 'Contractual terms follow the master agreement and are not drafted here.'],
  ['outcomes', /\b(guarantee\w*|roi|savings|% (improvement|reduction)|results you (have )?achieved|kpis? (achieved|delivered))\b/i, 'We only state outcomes documented in approved sources.'],
  ['undocumented-capability', /\b(angular|vue|svelte|flutter|swiftui|jetpack compose|blazor|\.net maui|qt)\b/i, 'Not documented in the practice sources: a delivery lead must confirm before we claim it.'],
]

const MODAL = /\b(must|shall|should|required?|requires|need(s|ed)? to|expected to|mandatory|is essential)\b/i
const ASK = /\b(describe|provide|explain|outline|detail|demonstrate|confirm|list|include|specify|propose|indicate|state|share|tell us|walk us through)\b/i
const QUESTION_START = /^(how|what|which|when|who|where|why|do|does|can|could|will|would|is|are|have|has)\b/i
const LIST_ITEM = /^\s*((\d+(\.\d+)*)[.)]|[a-z][.)]|q\d+[:.)]|[-*•])\s+/i
const SECTION_HEAD = /(requirement|question|scope|deliverable|evaluation|criteria|what we need|ask|expect)/i

export function categorize(text: string): { categories: Category[]; primary: Category } {
  const scores = CATEGORY_WORDS.map(([c, re]) => [c, (text.match(new RegExp(re.source, 'gi')) ?? []).length] as const).filter(([, n]) => n > 0)
  if (!scores.length) return { categories: ['general'], primary: 'general' }
  const order = CATEGORY_WORDS.map(([c]) => c)
  scores.sort((a, b) => b[1] - a[1] || order.indexOf(a[0]) - order.indexOf(b[0]))
  return { categories: scores.map(([c]) => c), primary: scores[0][0] }
}

export function classifyUnanswerable(text: string): Requirement['unanswerable'] {
  for (const [kind, re, reason] of UNANSWERABLE) if (re.test(text)) return { kind, reason }
  return undefined
}

interface Piece { text: string; start: number; end: number; number?: string; listContext: boolean; item?: boolean }

function splitSentences(piece: Piece): Piece[] {
  const parts: Piece[] = []
  const re = /[^.?!]+[.?!]?/g
  let m: RegExpExecArray | null
  while ((m = re.exec(piece.text))) {
    const raw = m[0]
    const lead = raw.length - raw.trimStart().length
    const t = raw.trim()
    if (t.length < 8) continue
    const start = piece.start + m.index + lead
    parts.push({ text: t, start, end: start + t.length, listContext: piece.listContext })
  }
  return parts
}

export function isRequirement(p: Piece): boolean {
  const t = p.text
  return /\?\s*$/.test(t) || QUESTION_START.test(t) || MODAL.test(t) || ASK.test(t) || (p.listContext && t.length > 12)
}

/** Splits a request into requirements with offsets into `text` (requestVersion stamps the span). */
export function extractRequirements(text: string, requestVersion = 1): Requirement[] {
  const src = text.replace(/\r\n?/g, '\n')
  const lines = src.split('\n')
  const pieces: Piece[] = []
  let offset = 0
  let listContext = false
  let cur: Piece | null = null
  const flush = () => {
    if (cur && cur.text.trim()) pieces.push(cur)
    cur = null
  }
  for (const line of lines) {
    const start = offset
    offset += line.length + 1
    const trimmed = line.trim()
    if (!trimmed) {
      flush()
      continue
    }
    const isHeading = /^#{1,6}\s/.test(trimmed) || (/:$/.test(trimmed) && trimmed.length < 90) || (trimmed.length < 70 && !/[.?!]$/.test(trimmed) && !LIST_ITEM.test(trimmed) && /^[A-Z0-9]/.test(trimmed) && trimmed.split(' ').length <= 8)
    if (isHeading) {
      flush()
      listContext = SECTION_HEAD.test(trimmed)
      continue
    }
    const item = LIST_ITEM.exec(line)
    if (item) {
      flush()
      const lead = item[0].length
      const num = item[2] ?? (/^[a-z]$/i.test(item[1].replace(/[.)]/, '')) ? item[1].replace(/[.)]/, '') : undefined) ?? (/^q\d+/i.test(item[1]) ? item[1].replace(/[:.)]/, '') : undefined)
      cur = { text: line.slice(lead), start: start + lead, end: start + line.length, number: num, listContext: true, item: true }
      continue
    }
    if (cur && (cur.item ? /^\s{2,}/.test(line) : true)) {
      // continuation of a list item (indented) or of a prose paragraph (consecutive lines)
      cur.text += (cur.item ? '\n' : ' ') + trimmed
      cur.end = start + line.length
      continue
    }
    flush()
    cur = { text: line.trim(), start: start + (line.length - line.trimStart().length), end: start + line.length, listContext }
  }
  flush()

  const reqs: Requirement[] = []
  for (const p of pieces) {
    const candidates = p.item && (p.text.match(/\?/g) ?? []).length < 2 && p.text.length <= 400 ? [p] : p.item || p.text.length > 160 || !p.listContext ? splitSentences(p).map((s, i) => ({ ...s, number: p.number ? (i ? `${p.number}.${String.fromCharCode(97 + i)}` : p.number) : undefined })) : [p]
    for (const c of candidates) {
      const textClean = c.text.replace(/\s+/g, ' ').trim()
      if (textClean.length < 8 || !isRequirement(c)) continue
      const { categories, primary } = categorize(textClean)
      const question = /\?\s*$/.test(textClean) || QUESTION_START.test(textClean)
      reqs.push({
        id: `r-${reqs.length + 1}`,
        number: c.number,
        text: textClean,
        span: { requestVersion, start: c.start, end: c.end },
        categories,
        primary,
        status: 'extracted',
        mustAnswer: question || ASK.test(textClean) || c.listContext,
        unanswerable: classifyUnanswerable(textClean),
        evidence: [],
        order: reqs.length,
      })
    }
  }
  return reqs
}

/** Context hints for step 3: deadline-like phrases, named teams, deliverable words. */
export function detectContextHints(text: string): { label: string; value: string; field: 'objective' | 'deliverable' | 'audience' | 'dueDate' }[] {
  const hints: { label: string; value: string; field: 'objective' | 'deliverable' | 'audience' | 'dueDate' }[] = []
  const due = /\b(by|before|no later than|deadline[:\s]+)\s+(\d{1,2}\s+\w+\s+\d{4}|\w+\s+\d{1,2},?\s+\d{4}|\d{4}-\d{2}-\d{2})/i.exec(text)
  if (due) hints.push({ label: 'Response deadline', value: due[2], field: 'dueDate' })
  const deliv = /\b(written response|proposal document|presentation|questionnaire answers?|executive summary|statement of work)\b/i.exec(text)
  if (deliv) hints.push({ label: 'Requested deliverable', value: deliv[0], field: 'deliverable' })
  const aud = /\b(head of design|design leadership|cto|cpo|procurement|engineering leadership|product leadership|design system team)\b/i.exec(text)
  if (aud) hints.push({ label: 'Mentioned audience', value: aud[0], field: 'audience' })
  const obj = /\b(we (want|aim|are looking|need) to [^.]{10,160}\.)/i.exec(text)
  if (obj) hints.push({ label: 'Stated goal', value: obj[1], field: 'objective' })
  return hints
}
