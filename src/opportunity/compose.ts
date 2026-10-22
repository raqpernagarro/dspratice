// The template composer: a complete, traceable first draft with zero model tokens.
//
// Per requirement: evidence from APPROVED sources → "supported" statements quoting the source;
// evidence only from draft or outdated sources → a "recommendation" with a caveat; asks we never
// answer from documents (pricing, references, dates, contracts, outcomes, undocumented
// capabilities) → an "open question" with fixed honest wording; nothing found → a gap plus an
// assumption. The draft is grouped for the task (RFP answers, proposal, approach, governance,
// discovery questions, executive summary, meeting narrative).

import { buildIndex, search, type RetrievalIndex } from '../knowledge/retrieve.ts'
import type { EvidenceRef, KnowledgeConflict, KnowledgeDocument, KnowledgeSource } from '../knowledge/types.ts'
import { detectConflicts } from '../knowledge/conflicts.ts'
import { recommendPackage } from './rules.ts'
import type { Answer, Category, Citation, DraftSection, Opportunity, PackageName, Requirement, ResponseVersion, Statement, StatementKind, UnanswerableKind } from './types.ts'

export type ResponseDraft = Omit<ResponseVersion, 'version' | 'triggeredBy' | 'inputs'>

export interface ComposeInput {
  opportunity: Pick<Opportunity, 'title' | 'task' | 'context'>
  requirements: Requirement[]
  client: { name: string; sector: string }
  engagementPackage?: PackageName
  /** Already filtered to visible ∩ included (see opportunitySources). */
  sources: KnowledgeSource[]
  docs: Record<string, KnowledgeDocument>
  conflicts: KnowledgeConflict[]
  requestText: string
  now: number
}

/** Client-readable names for the asks we never answer from documents (the draft may be shared). */
const OPEN_KIND_WORD: Record<string, string> = {
  pricing: 'pricing',
  timeline: 'timelines',
  availability: 'start date and team availability',
  credentials: 'references and CVs',
  outcomes: 'client results',
  contract: 'contract terms',
  'undocumented-capability': 'a technical confirmation',
}

export const TEMPLATE_LABEL = 'Template draft (no model)'

export const UNANSWERABLE_TEXT: Record<UnanswerableKind, string> = {
  pricing: 'Pricing is not part of this draft. Commercial terms are prepared by the account team and are never derived from practice documents.',
  credentials: 'References and CVs are shared by the account team once each client has cleared them; case-study material is used only after clearance.',
  availability: 'Team availability is confirmed by resourcing. This draft does not name people or commit capacity.',
  timeline: 'Start dates and committed timelines are agreed with the account team. This draft does not commit to dates.',
  contract: 'Service levels, liability and other contractual terms follow the Nagarro master agreement and are not drafted here.',
  outcomes: 'We only state results that are documented in approved sources; this one needs evidence before we claim it.',
  'undocumented-capability': 'This is not documented in our practice sources. A delivery lead must confirm it before we claim it as a capability.',
}

const CATEGORY_TITLE: Record<Category, string> = {
  assessment: 'Assessing where your system stands',
  governance: 'Governance of design-system and AI-proposed changes',
  enablement: 'Team enablement',
  'tooling-ai': 'AI tooling that stays on-system',
  accessibility: 'Accessibility',
  'delivery-approach': 'How we would run the work',
  team: 'Team',
  commercial: 'Commercial',
  legal: 'Contractual terms',
  timeline: 'Timeline',
  technical: 'Technology',
  general: 'Other requirements',
}

const upperFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function firstSentence(snippet: string) {
  const s = snippet.replace(/^…/, '').replace(/\s+/g, ' ').trim()
  return s.length > 220 ? s.slice(0, 217).replace(/\s+\S*$/, '') + '…' : s
}

function lowerFirst(s: string) {
  return /^[A-Z](?![A-Z0-9])/.test(s) && !/^(I|Figma|Nagarro|React|Storybook|GitHub|Claude|Copilot|Cursor|Base UI|DSN|DS)\b/.test(s) ? s[0].toLowerCase() + s.slice(1) : s
}

function shortReq(text: string) {
  const t = text
    .replace(/^(please\s+)?(describe|explain|outline|provide|detail|tell us|share|state|confirm|list|specify|propose|indicate)\s+(how\s+(you\s+(would|will|do|can)\s+)?|what\s+|that\s+|your\s+|the\s+)?/i, '')
    .replace(/^(our|your)\s+/i, '')
    .replace(/[.?!]+$/, '')
  const c = t.charAt(0).toUpperCase() + t.slice(1)
  return c.length > 70 ? c.slice(0, 67).replace(/\s+\S*$/, '') + '…' : c
}

const CATEGORY_WORD: Record<Category, string> = {
  assessment: 'assessment', governance: 'governance', enablement: 'enablement', 'tooling-ai': 'AI tooling', accessibility: 'accessibility', 'delivery-approach': 'delivery approach', team: 'team', commercial: 'commercial terms', legal: 'contract terms', timeline: 'timing', technical: 'technology', general: 'other topics',
}

function cite(e: EvidenceRef): Citation {
  return { sourceId: e.sourceId, sectionId: e.sectionId, quote: firstSentence(e.snippet).replace(/…$/, '').slice(0, 200) }
}

export function evidenceFor(index: RetrievalIndex, req: Requirement, k = 4): EvidenceRef[] {
  return search(index, `${req.text} ${req.primary === 'general' ? '' : req.primary}`, { k })
}

function answerFor(req: Requirement, evidence: EvidenceRef[], sources: Map<string, KnowledgeSource>, i: number): Answer {
  if (req.unanswerable) {
    return { requirementId: req.id, status: 'open-question', statements: [{ kind: 'open-question', text: UNANSWERABLE_TEXT[req.unanswerable.kind], citations: [], caveat: req.unanswerable.reason }] }
  }
  const approved = evidence.filter((e) => sources.get(e.sourceId)?.approval === 'approved')
  // drafts before outdated material, keeping the retrieval order otherwise
  const other = evidence.filter((e) => sources.get(e.sourceId)?.approval === 'draft').concat(evidence.filter((e) => sources.get(e.sourceId)?.approval === 'outdated'))
  if (approved.length) {
    const strong = approved.filter((e, j) => j === 0 || e.score >= approved[0].score * 0.6)
    const statements: Statement[] = strong.slice(0, 2).map((e) => {
      const src = sources.get(e.sourceId)!
      const quote = firstSentence(e.snippet)
      void i
      const text = upperFirst(quote)
      return { kind: 'supported', text: text.replace(/\s+/g, ' '), citations: [cite(e)], caveat: src.kind === 'case-study' ? 'Case study: usable with this client only once cleared.' : undefined }
    })
    return { requirementId: req.id, status: 'supported', statements }
  }
  if (other.length) {
    const e = other[0]
    const src = sources.get(e.sourceId)!
    const why = src.approval === 'outdated' ? `${src.title} is marked outdated; confirm before sending` : `${src.title} is still a draft; an owner has not approved it yet`
    return { requirementId: req.id, status: 'recommendation', statements: [{ kind: 'recommendation', text: `We recommend this, based on our working material: ${lowerFirst(firstSentence(e.snippet))}`, citations: [cite(e)], caveat: why }] }
  }
  return {
    requirementId: req.id,
    status: 'gap',
    statements: [{ kind: 'assumption', text: `None of the selected sources covers "${shortReq(req.text)}". We assume this is in scope and needs an answer from a practice expert.`, citations: [] }],
  }
}

function joinStatements(statements: Statement[], sources: Map<string, KnowledgeSource>, docs: Record<string, KnowledgeDocument>) {
  return statements
    .map((s) => {
      const refs = s.citations
        .map((c) => {
          const src = sources.get(c.sourceId)
          const sec = src?.docId ? docs[src.docId]?.sections.find((x) => x.id === c.sectionId) : undefined
          return src ? `[${src.title}${sec ? ` › ${sec.heading}` : ''}]` : ''
        })
        .filter(Boolean)
        .join(' ')
      return `${s.text}${refs ? ` ${refs}` : ''}${s.caveat ? `\n\n_${s.caveat}_` : ''}`
    })
    .join('\n\n')
}

function kindOf(statements: Statement[]): StatementKind {
  if (!statements.length) return 'assumption'
  if (statements.every((s) => s.kind === 'supported')) return 'supported'
  if (statements.some((s) => s.kind === 'open-question')) return 'open-question'
  if (statements.some((s) => s.kind === 'recommendation' || s.kind === 'supported')) return 'recommendation'
  return 'assumption'
}

const naturalList = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`)

const PHRASE: Partial<Record<Category, string>> = {
  assessment: 'an assessment of where its design system stands',
  governance: 'a governance model for changes, including those proposed by AI tools',
  enablement: 'enablement so its teams can run the system themselves',
  'tooling-ai': 'AI tooling that produces on-brand, on-system UI',
  accessibility: 'accessibility built into the system',
  'delivery-approach': 'a clear delivery approach',
  technical: 'a fit with its technology stack',
}

export function composeResponse(input: ComposeInput): ResponseDraft {
  const { requirements, client, sources, docs } = input
  const active = requirements.filter((r) => r.status !== 'removed')
  const srcMap = new Map(sources.map((s) => [s.id, s]))
  const entries = sources.filter((s) => s.docId && docs[s.docId]).map((s) => ({ source: s, doc: docs[s.docId!] }))
  const index = buildIndex(entries)

  const evidenceByReq = new Map<string, EvidenceRef[]>()
  for (const r of active) evidenceByReq.set(r.id, r.evidence.length ? r.evidence.filter((e) => srcMap.has(e.sourceId)) : evidenceFor(index, r))
  const answers = active.map((r, i) => answerFor(r, evidenceByReq.get(r.id) ?? [], srcMap, i))

  // categories, ordered by how many requirements touch them
  const catCount = new Map<Category, number>()
  for (const r of active) if (!r.unanswerable) catCount.set(r.primary, (catCount.get(r.primary) ?? 0) + 1)
  const topCats = Array.from(catCount.entries()).sort((a, b) => b[1] - a[1]).map(([c]) => c)
  const unanswerable = active.filter((r) => r.unanswerable)

  const wants = topCats.map((c) => PHRASE[c]).filter(Boolean).slice(0, 3) as string[]
  const understanding = [
    `${client.name}${client.sector && !client.name.toLowerCase().includes(client.sector.toLowerCase()) ? ` (${client.sector})` : ''} is looking for ${wants.length ? naturalList(wants) : 'support with its design system'}.`,
    input.opportunity.context.objective ? `In its own words: ${input.opportunity.context.objective.replace(/\s+/g, ' ').trim().replace(/[^.]$/, (m) => m + '.')}` : '',
    `The request has ${active.length} requirement${active.length === 1 ? '' : 's'}${topCats.length ? `, most of them about ${naturalList(topCats.slice(0, 3).map((c) => CATEGORY_WORD[c]))}` : ''}.`,
    unanswerable.length ? `${unanswerable.length} of them (${naturalList(Array.from(new Set(unanswerable.map((r) => OPEN_KIND_WORD[r.unanswerable!.kind]))))}) need input from our account or delivery team, so we list them as open points to settle together.` : '',
  ].filter(Boolean).join(' ')

  // approach
  const rule = recommendPackage({ text: `${input.requestText}\n${input.opportunity.context.objective}`, categories: new Set(active.flatMap((r) => r.categories)), engagementPackage: input.engagementPackage })
  const approachEvidence = search(index, rule.query, { k: 3 }).filter((e) => srcMap.get(e.sourceId)?.approval !== 'outdated')
  const phaseDefs: { name: string; query: string; what: string; when: boolean }[] = [
    { name: 'Assess', query: 'assessment scan inventory scorecard readout baseline', what: 'Read the current Figma libraries and code, measure drift and AI-readiness, and agree the priorities in a readout.', when: true },
    { name: 'Govern', query: 'governance ownership approval trust levels agents propose people decide', what: 'Set who owns which decisions, how changes (including AI-proposed ones) are reviewed, and which checks run on every change.', when: catCount.has('governance') || catCount.has('tooling-ai') },
    { name: 'Make it AI-ready', query: 'contract tokens metadata machine-readable guidance checks ci', what: 'Turn tokens, components and guidance into one contract that AI tools and people both read, with checks that keep output on-system.', when: rule.package !== 'Support' },
    { name: 'Enable', query: 'enablement training coaching handover owner', what: "Coach the client's team to run the system, and hand over with a named owner.", when: catCount.has('enablement') || true },
  ]
  const phases = phaseDefs.filter((p) => p.when).map((p) => {
    const ev = search(index, p.query, { k: 2 }).filter((e) => srcMap.get(e.sourceId)?.approval === 'approved')
    return { name: p.name, what: p.what, citations: ev.slice(0, 1).map(cite) }
  })
  const approach = { package: rule.package, alternatives: rule.alternatives, reasoning: rule.reasoning, phases, citations: approachEvidence.slice(0, 2).map(cite) }

  // assumptions, open questions, gaps
  const gaps = answers.filter((a) => a.status === 'gap').map((a) => {
    const r = active.find((x) => x.id === a.requirementId)!
    return { what: shortReq(r.text), why: 'No selected source covers it.', expert: r.primary === 'technical' ? 'Delivery or tech lead' : r.primary === 'enablement' ? 'Practice lead (enablement)' : 'Practice lead' }
  })
  const assumptions: Statement[] = [
    { kind: 'assumption', text: `${client.name} can give read access to its Figma libraries and code repositories for the assessment.`, citations: [] },
    { kind: 'assumption', text: 'A named person on the client side will own the design system after handover.', citations: [] },
    ...answers.filter((a) => a.status === 'gap').flatMap((a) => a.statements),
  ]
  const openQuestions: Statement[] = answers.filter((a) => a.status === 'open-question').flatMap((a) => a.statements.map((s) => ({ ...s, text: `${shortReq(active.find((r) => r.id === a.requirementId)!.text)}: ${s.text}` })))

  // conflicts among the evidence actually used
  const usedSections = Array.from(evidenceByReq.values()).flat().concat(approachEvidence)
  const sectionTexts = usedSections.flatMap((e) => {
    const src = srcMap.get(e.sourceId)
    const sec = src?.docId ? docs[src.docId]?.sections.find((s) => s.id === e.sectionId) : undefined
    return sec ? [{ sourceId: e.sourceId, sectionId: e.sectionId, text: sec.text }] : []
  })
  const conflicts = detectConflicts(sectionTexts, input.conflicts, `${input.requestText} ${approach.package} ${approach.alternatives.join(' ')}`)

  // draft sections for the task
  const draft: DraftSection[] = []
  let n = 0
  const add = (heading: string, body: string, kind: StatementKind, citations: Citation[], requirementIds: string[]) => draft.push({ id: `d-${++n}`, heading, body, kind, citations, requirementIds })
  const reqIds = active.map((r) => r.id)
  const approachBody = [
    `**Recommended: ${approach.package}.** ${approach.reasoning}`,
    ...phases.map((p, i) => `${i + 1}. **${p.name}.** ${p.what}`),
  ].join('\n\n')
  const task = input.opportunity.task
  if (task !== 'discovery') add('Our understanding', understanding, 'recommendation', [], reqIds)
  if (task === 'summary') {
    add('Recommended approach', approachBody, 'recommendation', approach.citations, reqIds)
  } else if (task === 'discovery') {
    const qs = [
      ...gaps.map((g) => `- ${g.what}: what does good look like for you here?`),
      '- Who owns the design system today, and who approves changes to shared components?',
      '- Which teams build UI, and how many of them already use AI tools to do it?',
      '- Do Figma and code agree today? Who decides when they do not?',
      '- What would you want to see after two weeks to decide on the next step?',
    ]
    add('Questions to ask before we scope', qs.join('\n'), 'open-question', [], reqIds)
  } else {
    if (task === 'rfp') {
      for (const a of answers) {
        const r = active.find((x) => x.id === a.requirementId)!
        add(`${r.number ? `${r.number} · ` : ''}${shortReq(r.text)}`, joinStatements(a.statements, srcMap, docs), kindOf(a.statements), a.statements.flatMap((s) => s.citations), [r.id])
      }
    } else {
      const order: Category[] = task === 'governance' ? ['governance', 'tooling-ai', 'enablement', 'assessment'] : topCats
      for (const c of order) {
        const group = answers.filter((a) => !active.find((r) => r.id === a.requirementId)!.unanswerable && active.find((r) => r.id === a.requirementId)!.primary === c)
        if (!group.length) continue
        const statements = group.flatMap((a) => a.statements)
        add(CATEGORY_TITLE[c], joinStatements(statements, srcMap, docs), kindOf(statements), statements.flatMap((s) => s.citations), group.map((g) => g.requirementId))
      }
    }
    add('Recommended approach', approachBody, approach.citations.length ? 'recommendation' : 'recommendation', approach.citations, reqIds)
  }
  if (assumptions.length) add('Assumptions to confirm with you', assumptions.map((s) => `- ${s.text}`).join('\n'), 'assumption', [], answers.filter((a) => a.status === 'gap').map((a) => a.requirementId))
  if (openQuestions.length) add('Open points', openQuestions.map((s) => `- ${s.text}`).join('\n'), 'open-question', [], answers.filter((a) => a.status === 'open-question').map((a) => a.requirementId))

  const nextSteps = [
    `A 30-minute readout with ${client.name} to confirm the understanding and the open points.`,
    'Confirm scope, commercial terms and dates with the account team.',
    unanswerable.length ? `Resolve ${unanswerable.length} open point${unanswerable.length > 1 ? 's' : ''} that only the account team or a delivery lead can answer.` : '',
    gaps.length ? `Ask a practice expert to cover ${gaps.length} requirement${gaps.length > 1 ? 's' : ''} our sources do not answer.` : '',
    'Clear any case study we would like to show for this client.',
  ].filter(Boolean)

  const presentationStructure = [
    { title: 'Cover', purpose: `${input.opportunity.title} for ${client.name}` },
    { title: 'Our understanding', purpose: 'What we heard, in their words' },
    { title: 'What you asked for', purpose: `${active.length} requirements, grouped by theme` },
    { title: 'Recommended approach', purpose: `${approach.package}, phase by phase` },
    ...(catCount.has('governance') ? [{ title: 'Governance', purpose: 'Who decides, how AI-proposed changes are reviewed' }] : []),
    ...(catCount.has('enablement') ? [{ title: 'Enablement', purpose: 'How their team runs the system after handover' }] : []),
    { title: 'See it live', purpose: 'Switch to the live system demo' },
    { title: 'Assumptions and open points', purpose: 'What we need to confirm together' },
    { title: 'Next steps', purpose: 'Readout, scope, dates' },
  ]

  const warnings = [
    gaps.length ? `${gaps.length} requirement${gaps.length > 1 ? 's have' : ' has'} no evidence in the selected sources.` : '',
    !sources.some((s) => s.approval === 'approved') ? 'No approved source is selected, so nothing can be marked "supported by a source". Approve sources in the knowledge library.' : '',
    entries.length < sources.length ? `${sources.length - entries.length} selected source${sources.length - entries.length > 1 ? 's have' : ' has'} no readable text and was skipped.` : '',
  ].filter(Boolean)

  return {
    generatedBy: { mode: 'template', label: TEMPLATE_LABEL, at: input.now },
    understanding,
    answers,
    approach,
    assumptions,
    openQuestions,
    gaps,
    conflicts,
    draft,
    nextSteps,
    presentationStructure,
    warnings,
    issues: [],
  }
}
