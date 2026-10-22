// Opportunity responses, per client project. Everything here is internal: it is never versioned
// with the system, never cloned into a client session, and only reaches the client demo
// through publishOutput(), which stores a frozen, client-safe copy.

import type { OpportunityActions } from '../actions'
import type { Ctx } from '../ctx'
import type { DraftSection, EvidenceRef, Opportunity, Requirement, ResponseVersion } from '../types'
import { hashJson, hashText } from '@/knowledge/hash'
import { putDoc, deleteDocsWithPrefix } from '@/knowledge/docStore'
import { knowledgeRegistry, recordSources } from '@/knowledge/selectors'
import { clientSafeSections, currentResponse, publishRefusals, requirementsHash, responseHash } from '@/opportunity/selectors'
import { uid } from '../sim'

const RESPONSES_CAP = 5
const REQUEST_VERSIONS_CAP = 5

export function opportunitySlice(ctx: Ctx): OpportunityActions {
  const { set, get, toast } = ctx
  const opp = (projectId: string, id: string) => get().projects[projectId]?.opportunities[id]
  const mutate = (projectId: string, id: string, fn: (o: Opportunity) => void) =>
    set((s) => {
      const o = s.projects[projectId]?.opportunities[id]
      if (!o) return
      fn(o)
      o.updatedAt = ctx.now()
    })
  const log = (projectId: string, id: string, text: string, actor?: string) => ctx.activity(projectId, text, { type: 'opportunity', id }, actor)

  return {
    createOpportunity: (projectId, input) => {
      const p = get().projects[projectId]
      if (!p) return ''
      const id = `opp-${uid('o').slice(2)}`
      const o: Opportunity = {
        id,
        projectId,
        title: input.title.trim() || 'Untitled opportunity',
        task: input.task,
        requestKind: input.requestKind ?? (input.task === 'rfp' ? 'rfp' : 'brief'),
        status: 'draft',
        step: 'request',
        createdAt: ctx.now(),
        updatedAt: ctx.now(),
        createdBy: ctx.actorName(),
        request: null,
        context: { client: p.client.name, audience: '', objective: '', deliverable: '', ...(input.context ?? {}) },
        requirements: [],
        sourceSelection: { included: [], excluded: [], recommended: [] },
        responses: [],
        aiUsage: { inputTokens: 0, outputTokens: 0, calls: 0 },
        publishedOutputIds: [],
        deckIds: [],
      }
      set((s) => {
        s.projects[projectId].opportunities[id] = o
      })
      log(projectId, id, `Created the opportunity "${o.title}"`)
      return id
    },
    updateOpportunity: (projectId, id, patch) => mutate(projectId, id, (o) => Object.assign(o, patch)),
    setRequirementChecked: (projectId, id, requirementId, checked) =>
      mutate(projectId, id, (o) => {
        const version = o.responses[0]?.version ?? 0
        o.checked ??= {}
        if (checked) o.checked[requirementId] = { at: ctx.now(), by: ctx.actorName(), version }
        else delete o.checked[requirementId]
      }),
    setRequest: async (projectId, id, input) => {
      const o = opp(projectId, id)
      if (!o) return 0
      const hash = hashText(input.text)
      const cur = o.request?.versions.find((v) => v.version === o.request?.current)
      if (cur && cur.hash === hash) return cur.version
      const version = (o.request?.versions.reduce((m, v) => Math.max(m, v.version), 0) ?? 0) + 1
      const docId = `doc.${projectId}.req.${id}.v${version}`
      await putDoc(docId, { id: docId, hash, text: input.text, storedAt: ctx.now() })
      const rv = { version, docId, hash, charCount: input.text.length, excerpt: input.text.slice(0, 400), filename: input.filename, format: input.format, importedAt: ctx.now(), importedBy: ctx.actorName() }
      mutate(projectId, id, (o2) => {
        if (!o2.request) o2.request = { original: rv, versions: [rv], current: version }
        else {
          o2.request.versions.push(rv)
          // the original is never dropped; older intermediate versions are
          while (o2.request.versions.length > REQUEST_VERSIONS_CAP) o2.request.versions.splice(1, 1)
          o2.request.current = version
        }
      })
      log(projectId, id, `Imported the request v${version}${input.filename ? ` (${input.filename})` : ''}, ${input.text.length.toLocaleString()} characters`)
      return version
    },
    setContext: (projectId, id, patch) => mutate(projectId, id, (o) => Object.assign(o.context, patch)),
    confirmContext: (projectId, id) => {
      mutate(projectId, id, (o) => {
        o.context.confirmedAt = ctx.now()
        o.context.confirmedBy = ctx.actorName()
      })
      log(projectId, id, 'Confirmed the client context')
    },
    setRequirements: (projectId, id, reqs, from) => {
      mutate(projectId, id, (o) => {
        const added = o.requirements.filter((r) => r.status === 'added')
        const edited = new Map(o.requirements.filter((r) => r.status === 'edited' || r.status === 'removed').map((r) => [r.originalText ?? r.text, r]))
        const merged: Requirement[] = reqs.map((r) => {
          const prev = edited.get(r.text)
          return prev ? { ...r, text: prev.text, status: prev.status, originalText: prev.originalText ?? r.text, mustAnswer: prev.mustAnswer, primary: prev.primary } : r
        })
        o.requirements = [...merged, ...added.map((a, i) => ({ ...a, order: merged.length + i }))]
        o.extractedFrom = from
      })
      log(projectId, id, `Listed ${reqs.length} requirements from the request (${from.by === 'model' ? 'model' : 'rules, no model'})`)
    },
    editRequirement: (projectId, id, reqId, patch) =>
      mutate(projectId, id, (o) => {
        const r = o.requirements.find((x) => x.id === reqId)
        if (!r) return
        if (patch.text !== undefined && patch.text !== r.text && r.status !== 'added') {
          r.originalText = r.originalText ?? r.text
          r.status = 'edited'
        }
        Object.assign(r, patch)
      }),
    addRequirement: (projectId, id, input) => {
      const rid = `r-${uid('a').slice(2, 7)}`
      mutate(projectId, id, (o) => {
        o.requirements.push({ id: rid, text: input.text, categories: [input.category], primary: input.category, status: 'added', mustAnswer: input.mustAnswer ?? true, evidence: [], order: o.requirements.length })
      })
      return rid
    },
    removeRequirement: (projectId, id, reqId) =>
      mutate(projectId, id, (o) => {
        const r = o.requirements.find((x) => x.id === reqId)
        if (r) {
          if (r.status === 'added') o.requirements = o.requirements.filter((x) => x.id !== reqId)
          else {
            r.originalText = r.originalText ?? r.text
            r.status = 'removed'
          }
        }
      }),
    restoreRequirement: (projectId, id, reqId) =>
      mutate(projectId, id, (o) => {
        const r = o.requirements.find((x) => x.id === reqId)
        if (!r) return
        if (r.originalText) r.text = r.originalText
        r.originalText = undefined
        r.status = 'extracted'
      }),
    setEvidence: (projectId, id, evidence: Record<string, EvidenceRef[]>, recommended) =>
      mutate(projectId, id, (o) => {
        for (const r of o.requirements) r.evidence = evidence[r.id] ?? []
        o.sourceSelection.recommended = recommended
        if (!o.sourceSelection.included.length) o.sourceSelection.included = recommended.filter((s) => !o.sourceSelection.excluded.some((e) => e.sourceId === s))
        o.sourceSelection.updatedAt = ctx.now()
      }),
    setSourceSelection: (projectId, id, selection) =>
      mutate(projectId, id, (o) => {
        o.sourceSelection.included = selection.included
        o.sourceSelection.excluded = selection.excluded
        o.sourceSelection.updatedAt = ctx.now()
      }),
    addResponse: (projectId, id, draft, keepEdited) => {
      const o = opp(projectId, id)
      if (!o || !o.request) return 0
      const registry = knowledgeRegistry(get().practice.knowledge)
      const cur = o.request.versions.find((v) => v.version === o.request!.current)!
      const prev = currentResponse(o)
      const version = (prev?.version ?? 0) + 1
      let sections = draft.draft
      if (prev && keepEdited !== 'none') {
        const keep = prev.draft.filter((d) => d.edited && (keepEdited === 'edited' || (Array.isArray(keepEdited) && keepEdited.includes(d.id))))
        sections = sections.map((d) => {
          const k = keep.find((x) => x.heading === d.heading)
          return k ? { ...k, keptFrom: prev.version } : d
        })
        for (const k of keep) if (!sections.some((d) => d.heading === k.heading)) sections.push({ ...k, keptFrom: prev.version })
      }
      const rv: ResponseVersion = { ...draft, draft: sections, version, triggeredBy: ctx.actorName(), inputs: { requestVersion: cur.version, requestHash: cur.hash, requirementsHash: requirementsHash(o), sources: recordSources(registry, o.sourceSelection.included.filter((s) => !o.sourceSelection.excluded.some((e) => e.sourceId === s))) } }
      mutate(projectId, id, (o2) => {
        o2.responses.unshift(rv)
        if (o2.responses.length > RESPONSES_CAP) o2.responses.length = RESPONSES_CAP
        if (o2.status === 'draft') o2.status = 'in-review'
        if (draft.generatedBy.usage) {
          o2.aiUsage.inputTokens += draft.generatedBy.usage.inputTokens
          o2.aiUsage.outputTokens += draft.generatedBy.usage.outputTokens
          o2.aiUsage.calls += 1
        }
      })
      log(projectId, id, `Drafted response v${version} (${draft.generatedBy.label}${draft.generatedBy.model ? `, ${draft.generatedBy.model}` : ''})`, draft.generatedBy.mode === 'model' ? `Model (${draft.generatedBy.model})` : 'Template composer')
      return version
    },
    editSection: (projectId, id, sectionId, patch) =>
      mutate(projectId, id, (o) => {
        const d = o.responses[0]?.draft.find((x) => x.id === sectionId)
        if (d) Object.assign(d, patch, { edited: true })
      }),
    addSection: (projectId, id, afterId) => {
      const sid = `d-${uid('s').slice(2, 7)}`
      mutate(projectId, id, (o) => {
        const r = o.responses[0]
        if (!r) return
        const at = afterId ? r.draft.findIndex((d) => d.id === afterId) + 1 : r.draft.length
        const s: DraftSection = { id: sid, heading: 'New section', body: '', kind: 'recommendation', citations: [], requirementIds: [], edited: true }
        r.draft.splice(at, 0, s)
      })
      return sid
    },
    removeSection: (projectId, id, sectionId) =>
      mutate(projectId, id, (o) => {
        const r = o.responses[0]
        if (r) r.draft = r.draft.filter((d) => d.id !== sectionId)
      }),
    moveSection: (projectId, id, sectionId, dir) =>
      mutate(projectId, id, (o) => {
        const r = o.responses[0]
        if (!r) return
        const i = r.draft.findIndex((d) => d.id === sectionId)
        const j = i + dir
        if (i < 0 || j < 0 || j >= r.draft.length) return
        ;[r.draft[i], r.draft[j]] = [r.draft[j], r.draft[i]]
      }),
    applyImprovedSection: (projectId, id, sectionId, out, usage, model) => {
      mutate(projectId, id, (o) => {
        const d = o.responses[0]?.draft.find((x) => x.id === sectionId)
        if (d) Object.assign(d, { heading: out.heading, body: out.body, kind: out.kind, citations: out.citations, edited: true, aiRevised: { model, at: ctx.now() } })
        o.aiUsage.inputTokens += usage.inputTokens
        o.aiUsage.outputTokens += usage.outputTokens
        o.aiUsage.calls += 1
      })
      log(projectId, id, `Improved one section with ${model} (${usage.inputTokens.toLocaleString()} in / ${usage.outputTokens.toLocaleString()} out tokens)`, `Model (${model})`)
    },
    setModelConsent: (projectId, id) => mutate(projectId, id, (o) => void (o.modelConsentAt = ctx.now())),
    publishOutput: (projectId, id, input) => {
      const p = get().projects[projectId]
      const o = opp(projectId, id)
      const r = o && currentResponse(o)
      if (!p || !o || !r || !o.request) return { refused: [{ reason: 'Nothing to publish.' }] }
      const registry = knowledgeRegistry(get().practice.knowledge)
      const refused = publishRefusals(o, input.sectionIds, registry, p.client.name)
      if (refused.length) return { refused }
      const outId = `out-${uid('p').slice(2)}`
      const cur = o.request.versions.find((v) => v.version === o.request!.current)!
      set((s) => {
        const pp = s.projects[projectId]
        pp.clientExperience.publishedOutputs.unshift({
          id: outId,
          opportunityId: id,
          title: input.title,
          responseVersion: r.version,
          sections: clientSafeSections(r, input.sectionIds, registry),
          generatedByMode: r.generatedBy.mode,
          publishedAt: ctx.now(),
          publishedBy: ctx.actorName(),
          recorded: { requestVersion: cur.version, requestHash: cur.hash, responseHash: responseHash(r), sourcesHash: hashJson(r.inputs.sources.map((x) => [x.sourceId, x.sourceHash ?? ''])), sourceCount: r.inputs.sources.length },
        })
        const oo = pp.opportunities[id]
        oo.publishedOutputIds.unshift(outId)
        oo.status = 'responded'
      })
      log(projectId, id, `Added "${input.title}" (${input.sectionIds.length} sections of response v${r.version}) to the client demo`)
      toast({ kind: 'ok', title: 'Added to the client demo', detail: p.published ? 'It appears in the last chapter, as a proposal summary.' : `${p.client.name} has no client demo version yet; the summary appears once you update the client demo.` })
      return { id: outId }
    },
    retractOutput: (projectId, outputId) => {
      set((s) => {
        const out = s.projects[projectId]?.clientExperience.publishedOutputs.find((x) => x.id === outputId)
        if (out) out.retractedAt = ctx.now()
      })
      ctx.activity(projectId, 'Removed a proposal summary from the client demo', { type: 'publishedOutput', id: outputId })
    },
    deleteOpportunity: async (projectId, id) => {
      const p = get().projects[projectId]
      const o = opp(projectId, id)
      if (!p || !o) return false
      if (p.clientExperience.publishedOutputs.some((x) => x.opportunityId === id && !x.retractedAt)) {
        toast({ kind: 'warn', title: 'Remove its summary from the client demo first', detail: 'This request has a summary in the client demo.' })
        return false
      }
      set((s) => {
        const pp = s.projects[projectId]
        delete pp.opportunities[id]
        for (const [did, d] of Object.entries(pp.decks)) if (d.opportunityId === id) delete pp.decks[did]
      })
      await deleteDocsWithPrefix(`doc.${projectId}.req.${id}.`).catch(() => 0)
      ctx.activity(projectId, `Deleted the opportunity "${o.title}"`)
      return true
    },
  }
}
