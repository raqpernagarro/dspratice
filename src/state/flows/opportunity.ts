// The opportunity workflow's async steps, each a tracked task with plain-language stages so the
// progress panel can show "Reading the request · Finding evidence · Identifying gaps · Preparing
// the draft". Zero model tokens unless the user explicitly chooses a model action.

import { useStore } from '../store'
import { runTask, taskKey, type TaskOutcome } from '../tasks'
import { knowledgeRegistry, visibleSources } from '@/knowledge/selectors'
import { resolveDocs, resolveText } from '@/knowledge/resolve'
import { buildIndex } from '@/knowledge/retrieve'
import type { EvidenceRef, KnowledgeDocument, KnowledgeSource } from '@/knowledge/types'
import { detectContextHints, extractRequirements } from '@/opportunity/extract'
import { composeResponse, evidenceFor, type ResponseDraft } from '@/opportunity/compose'
import { activeRequirements, opportunitySources } from '@/opportunity/selectors'
import { composePrompt, improvePrompt, budgetSections } from '@/opportunity/prompts'
import { validateDraft, type AllowedSection } from '@/opportunity/validate'
import type { Answer, Citation, DraftSection, Opportunity, Statement } from '@/opportunity/types'
import { generate } from '@/integrations/api'

const S = () => useStore.getState()
export const oppTask = (projectId: string, oppId: string, what: string) => taskKey(projectId, `opp-${oppId}-${what}`)

function getOpp(projectId: string, oppId: string): Opportunity {
  const o = S().projects[projectId]?.opportunities[oppId]
  if (!o) throw new Error('This opportunity no longer exists.')
  return o
}

export async function requestText(o: Opportunity): Promise<string> {
  if (!o.request) return ''
  const v = o.request.versions.find((x) => x.version === o.request!.current)
  return (v && (await resolveText(v.docId))) ?? ''
}

async function readableSources(projectId: string, ids?: string[]): Promise<{ sources: KnowledgeSource[]; docs: Record<string, KnowledgeDocument> }> {
  const reg = visibleSources(knowledgeRegistry(S().practice.knowledge), projectId).filter((s) => s.docId && s.availability === 'available' && (!ids || ids.includes(s.id)))
  const docs = await resolveDocs(reg.map((s) => s.docId!))
  return { sources: reg.filter((s) => docs[s.docId!]), docs }
}

/** Step 4: list the requirements (rules, zero tokens) and offer context hints. */
export function analyzeRequest(projectId: string, oppId: string): Promise<TaskOutcome> {
  let text = ''
  return runTask(oppTask(projectId, oppId, 'analyze'), 'Analyze this request', [
    {
      label: 'Reading the request',
      run: async () => {
        text = await requestText(getOpp(projectId, oppId))
        if (!text.trim()) throw new Error('There is no request text yet. Add it in step 2.')
      },
    },
    {
      label: 'Listing what it asks for',
      run: () => {
        const o = getOpp(projectId, oppId)
        const reqs = extractRequirements(text, o.request!.current)
        if (!reqs.length) throw new Error('No requirements were found. Add them by hand, or check that the request was pasted completely.')
        S().setRequirements(projectId, oppId, reqs, { requestVersion: o.request!.current, at: Date.now(), by: 'rules' })
        const hints = detectContextHints(text)
        for (const h of hints) if (h.field === 'dueDate' && !o.context.dueDate) S().setContext(projectId, oppId, { dueDate: h.value })
      },
    },
  ])
}

/** Step 5: find evidence for every requirement in the sources this client may use. */
export function findEvidence(projectId: string, oppId: string): Promise<TaskOutcome> {
  return runTask(oppTask(projectId, oppId, 'evidence'), 'Find relevant Nagarro material', [
    {
      label: 'Finding evidence in your sources',
      run: async () => {
        const o = getOpp(projectId, oppId)
        const { sources, docs } = await readableSources(projectId)
        const index = buildIndex(sources.map((s) => ({ source: s, doc: docs[s.docId!] })))
        const evidence: Record<string, EvidenceRef[]> = {}
        const hits = new Map<string, number>()
        for (const r of activeRequirements(o)) {
          const ev = r.unanswerable ? [] : evidenceFor(index, r)
          evidence[r.id] = ev
          for (const e of ev) hits.set(e.sourceId, (hits.get(e.sourceId) ?? 0) + e.score)
        }
        const recommended = Array.from(hits.entries()).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([id]) => id)
        S().setEvidence(projectId, oppId, evidence, recommended)
      },
    },
  ])
}

function allowedFrom(sources: KnowledgeSource[], docs: Record<string, KnowledgeDocument>, only?: Set<string>): Map<string, AllowedSection> {
  const m = new Map<string, AllowedSection>()
  for (const s of sources) for (const sec of docs[s.docId!]?.sections ?? []) if (!only || only.has(`${s.id}|${sec.id}`)) m.set(sec.id, { sourceId: s.id, text: sec.text, approval: s.approval })
  return m
}

const fixCitations = (cs: { sourceId: string; sectionId: string; quote: string }[]): Citation[] => cs.map((c) => ({ sourceId: c.sourceId, sectionId: c.sectionId, quote: c.quote || undefined }))
const fixStatement = (s: { kind: Statement['kind']; text: string; citations: { sourceId: string; sectionId: string; quote: string }[]; caveat: string }): Statement => ({ kind: s.kind, text: s.text, citations: fixCitations(s.citations), caveat: s.caveat || undefined })

interface ComposeOut {
  understanding: string
  answers: { requirementId: string; statements: Parameters<typeof fixStatement>[0][] }[]
  approach: { package: ResponseDraft['approach']['package']; alternatives: ResponseDraft['approach']['package'][]; reasoning: string; phases: { name: string; what: string; citations: { sourceId: string; sectionId: string; quote: string }[] }[]; citations: { sourceId: string; sectionId: string; quote: string }[] }
  assumptions: Parameters<typeof fixStatement>[0][]
  openQuestions: Parameters<typeof fixStatement>[0][]
  gaps: { what: string; why: string; expert: string }[]
  draft: { heading: string; body: string; kind: DraftSection['kind']; citations: { sourceId: string; sectionId: string; quote: string }[]; requirementIds: string[] }[]
  nextSteps: string[]
}

export function modelToDraft(out: ComposeOut, template: ResponseDraft, model: string, usage: ResponseDraft['generatedBy']['usage']): ResponseDraft {
  const answers: Answer[] = out.answers.map((a) => {
    const statements = a.statements.map(fixStatement)
    const status: Answer['status'] = statements.length && statements.every((s) => s.kind === 'supported') ? 'supported' : statements.some((s) => s.kind === 'open-question') ? 'open-question' : statements.some((s) => s.kind === 'recommendation' || s.kind === 'supported') ? 'recommendation' : 'gap'
    return { requirementId: a.requirementId, status, statements }
  })
  return {
    ...template,
    generatedBy: { mode: 'model', model, label: `Model draft · ${model}`, at: Date.now(), usage },
    understanding: out.understanding,
    answers,
    approach: { package: out.approach.package, alternatives: out.approach.alternatives, reasoning: out.approach.reasoning, phases: out.approach.phases.map((p) => ({ name: p.name, what: p.what, citations: fixCitations(p.citations) })), citations: fixCitations(out.approach.citations) },
    assumptions: out.assumptions.map(fixStatement),
    openQuestions: out.openQuestions.map(fixStatement),
    gaps: out.gaps.map((g) => ({ what: g.what, why: g.why, expert: g.expert || undefined })),
    draft: out.draft.map((d, i) => ({ id: `d-${i + 1}`, heading: d.heading, body: d.body, kind: d.kind, citations: fixCitations(d.citations), requirementIds: d.requirementIds })),
    nextSteps: out.nextSteps,
  }
}

/** Step 6: the draft. mode 'template' spends zero tokens; 'model' sends the budgeted packet to the local server. */
export function draftResponse(projectId: string, oppId: string, opts: { mode: 'template' | 'model'; keep?: 'edited' | 'none' | string[] }): Promise<TaskOutcome> {
  let text = ''
  let ctxData: { sources: KnowledgeSource[]; docs: Record<string, KnowledgeDocument> } = { sources: [], docs: {} }
  let template: ResponseDraft | null = null
  return runTask(oppTask(projectId, oppId, 'draft'), opts.mode === 'model' ? 'Draft responses with a model' : 'Draft responses', [
    {
      label: 'Reading the request',
      run: async () => {
        text = await requestText(getOpp(projectId, oppId))
      },
    },
    {
      label: 'Finding evidence in your sources',
      run: async () => {
        const o = getOpp(projectId, oppId)
        if (!activeRequirements(o).length) throw new Error('There are no requirements yet. Run the analysis in step 4 first.')
        const reg = knowledgeRegistry(S().practice.knowledge)
        const selected = opportunitySources(reg, projectId, o).filter((s) => s.docId)
        const docs = await resolveDocs(selected.map((s) => s.docId!))
        ctxData = { sources: selected.filter((s) => docs[s.docId!]), docs }
        if (!ctxData.sources.length) throw new Error('No readable source is selected. Pick at least one in step 5.')
      },
    },
    {
      label: 'Identifying gaps',
      run: () => {
        const o = getOpp(projectId, oppId)
        const p = S().projects[projectId]
        template = composeResponse({ opportunity: o, requirements: activeRequirements(o), client: p.client, engagementPackage: p.engagement.package, sources: ctxData.sources, docs: ctxData.docs, conflicts: Object.values(S().practice.knowledge.conflicts), requestText: text, now: Date.now() })
      },
    },
    {
      label: 'Preparing the draft',
      run: async (signal) => {
        const o = getOpp(projectId, oppId)
        const p = S().projects[projectId]
        const others = Object.values(S().projects).filter((x) => x.id !== projectId).map((x) => x.client.name)
        let draft = template!
        let allowed = allowedFrom(ctxData.sources, ctxData.docs)
        if (opts.mode === 'model') {
          const payload = composePrompt(o, p.client.name, text, ctxData.sources, ctxData.docs)
          const only = new Set(budgetSections(o, ctxData.sources, ctxData.docs).blocks.map((b) => `${b.sourceId}|${b.sectionId}`))
          allowed = allowedFrom(ctxData.sources, ctxData.docs, only)
          const res = await generate<ComposeOut>({ kind: 'compose', system: payload.system, user: payload.user }, signal)
          draft = modelToDraft(res.data, template!, res.model, res.usage)
          if (payload.truncated) draft.warnings = [...draft.warnings, 'Sources were trimmed to the most relevant sections to keep the model call small.']
        }
        const v = validateDraft(draft, { allowed, requirements: activeRequirements(o), clientName: p.client.name, otherClientNames: others })
        S().addResponse(projectId, oppId, v.draft, opts.keep ?? 'edited')
      },
    },
  ])
}

/** "Improve with AI" for one section: a small, cheap call (one section and its evidence). */
export function improveSection(projectId: string, oppId: string, sectionId: string): Promise<TaskOutcome> {
  return runTask(oppTask(projectId, oppId, `improve-${sectionId}`), 'Improve this section with AI', [
    {
      label: 'Rewriting with the cited sources',
      run: async (signal) => {
        const o = getOpp(projectId, oppId)
        const p = S().projects[projectId]
        const section = o.responses[0]?.draft.find((d) => d.id === sectionId)
        if (!section) throw new Error('That section no longer exists.')
        const reg = knowledgeRegistry(S().practice.knowledge)
        const selected = opportunitySources(reg, projectId, o).filter((s) => s.docId)
        const docs = await resolveDocs(selected.map((s) => s.docId!))
        const sources = selected.filter((s) => docs[s.docId!])
        const payload = improvePrompt(o, p.client.name, section, sources, docs)
        const res = await generate<{ heading: string; body: string; kind: DraftSection['kind']; citations: { sourceId: string; sectionId: string; quote: string }[] }>({ kind: 'improve', system: payload.system, user: payload.user }, signal)
        const others = Object.values(S().projects).filter((x) => x.id !== projectId).map((x) => x.client.name)
        const mini: ResponseDraft = { ...(o.responses[0] as ResponseDraft), answers: [], draft: [{ ...section, heading: res.data.heading, body: res.data.body, kind: res.data.kind, citations: fixCitations(res.data.citations) }] }
        const v = validateDraft(mini, { allowed: allowedFrom(sources, docs), requirements: o.requirements, clientName: p.client.name, otherClientNames: others })
        const out = v.draft.draft[0]
        S().applyImprovedSection(projectId, oppId, sectionId, { heading: out.heading, body: out.body, kind: out.kind, citations: out.citations }, res.usage, res.model)
      },
    },
  ])
}

export function estimateComposeTokens(o: Opportunity, clientName: string, text: string, sources: KnowledgeSource[], docs: Record<string, KnowledgeDocument>) {
  const p = composePrompt(o, clientName, text, sources, docs)
  return { input: p.approxInputTokens, output: 6000 }
}
