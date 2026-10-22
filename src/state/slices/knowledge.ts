// The knowledge library's actions. Seed entries are bundled; edits to them live in
// practice.knowledge.overrides, user sources in practice.knowledge.custom. Bodies go to the doc
// store (IndexedDB), never into this persisted state.

import type { KnowledgeActions, NewSourceInput } from '../actions'
import type { Ctx } from '../ctx'
import type { Approval, Availability, KnowledgeDocument, KnowledgeSource, ReadBy } from '../types'
import { knowledgeRegistry } from '@/knowledge/selectors'
import { deleteDoc, deleteDocsWithPrefix, putDoc } from '@/knowledge/docStore'
import { isSeedDoc } from '@/knowledge/resolve'
import { uid } from '../sim'

export function knowledgeSlice(ctx: Ctx): KnowledgeActions {
  const { set, get, toast, practiceLog } = ctx
  const current = (id: string) => knowledgeRegistry(get().practice.knowledge).find((s) => s.id === id)
  const patchSource = (id: string, patch: Partial<KnowledgeSource>) =>
    set((s) => {
      const k = s.practice.knowledge
      if (k.custom[id]) Object.assign(k.custom[id], patch)
      else k.overrides[id] = { ...(k.overrides[id] ?? {}), ...patch }
    })

  return {
    registerSource: (input: NewSourceInput) => {
      const id = `src-${uid('k').slice(2)}`
      const source: KnowledgeSource = {
        ...input,
        id,
        approval: input.approval ?? 'draft',
        availability: input.availability ?? (input.location.type === 'url' ? 'not-read' : 'not-read'),
        bodyHistory: [],
        outline: [],
        tags: input.tags ?? [],
        registeredAt: ctx.now(),
        registeredBy: ctx.actorName(),
      }
      set((s) => {
        s.practice.knowledge.custom[id] = source
      })
      practiceLog(`Registered "${source.title}" (${source.location.type}${source.scope.kind === 'client' ? `, ${get().projects[source.scope.projectId]?.client.name ?? 'client'} only` : ''})`, id)
      if (source.scope.kind === 'client') ctx.activity(source.scope.projectId, `Added the client source "${source.title}"`, { type: 'knowledge', id })
      return id
    },
    updateSource: (id, patch) => {
      patchSource(id, patch)
      practiceLog(`Updated "${current(id)?.title ?? id}"`, id)
    },
    setApproval: (id, approval: Approval, note) => {
      const by = ctx.actorName()
      patchSource(id, { approval, approvalNote: note, ...(approval === 'approved' ? { approvedBy: by, approvedAt: ctx.now() } : {}) })
      practiceLog(`${approval === 'approved' ? 'Approved' : approval === 'outdated' ? 'Marked outdated' : 'Moved back to draft'}: "${current(id)?.title ?? id}"${note ? ` · ${note}` : ''}`, id, by)
    },
    setAvailability: (id, availability: Availability, message) => {
      patchSource(id, { availability, availabilityMessage: message })
      if (availability !== 'available') practiceLog(`"${current(id)?.title ?? id}" is ${availability}${message ? `: ${message}` : ''}`, id)
    },
    setReusable: (id, reusable) => {
      const src = current(id)
      if (!src || src.scope.kind !== 'client') return
      patchSource(id, { scope: { ...src.scope, reusable, ...(reusable ? { reuseApprovedBy: ctx.actorName(), reuseApprovedAt: ctx.now() } : { reuseApprovedBy: undefined, reuseApprovedAt: undefined }) } })
      practiceLog(`${reusable ? 'Approved for reuse with other clients' : 'Withdrew reuse'}: "${src.title}"`, id)
    },
    applyBody: async (id, doc: KnowledgeDocument, meta: { readBy: ReadBy; sourceUpdatedAt?: number }) => {
      const src = current(id)
      if (!src) return 'unchanged'
      const unchanged = src.sourceHash === doc.sourceHash
      if (unchanged) {
        patchSource(id, { readAt: doc.readAt, readBy: meta.readBy, availability: 'available', availabilityMessage: undefined, ...(meta.sourceUpdatedAt ? { sourceUpdatedAt: meta.sourceUpdatedAt } : {}) })
        practiceLog(`Read "${src.title}" again: unchanged`, id)
        return 'unchanged'
      }
      const docId = `doc.${src.scope.kind === 'client' ? src.scope.projectId : 'practice'}.src.${id}.${doc.sourceHash.slice(0, 8)}`
      await putDoc(docId, { ...doc, docId })
      const history = src.docId ? [{ docId: src.docId, hash: src.sourceHash ?? '', readAt: src.readAt ?? 0 }, ...src.bodyHistory].slice(0, 3) : src.bodyHistory
      const evicted = src.docId ? [src.docId, ...src.bodyHistory.map((h) => h.docId)].slice(3) : []
      for (const old of evicted) if (!isSeedDoc(old)) await deleteDoc(old).catch(() => undefined)
      const demote = src.approval === 'approved' && Boolean(src.sourceHash)
      patchSource(id, {
        docId,
        sourceHash: doc.sourceHash,
        readAt: doc.readAt,
        readBy: meta.readBy,
        sourceUpdatedAt: meta.sourceUpdatedAt ?? src.sourceUpdatedAt,
        availability: 'available',
        availabilityMessage: undefined,
        outline: doc.sections.slice(0, 60).map((s) => ({ id: s.id, heading: s.heading })),
        excerpt: doc.sections[0]?.text.slice(0, 280),
        charCount: doc.stats.chars,
        bodyHistory: history,
        ...(demote ? { approval: 'outdated' as const, approvalNote: 'The text changed when it was read again. Review and approve it again.' } : {}),
      })
      practiceLog(`Read "${src.title}": ${doc.stats.sections} sections${demote ? ' · changed, so it needs approval again' : ''}`, id)
      if (demote) toast({ kind: 'warn', title: `"${src.title}" changed`, detail: 'It was approved before; it is now marked outdated until someone reviews it again.' })
      return 'changed'
    },
    removeSource: async (id) => {
      const k = get().practice.knowledge
      const src = current(id)
      if (k.custom[id]) {
        set((s) => {
          delete s.practice.knowledge.custom[id]
        })
        await deleteDocsWithPrefix(`doc.${src?.scope.kind === 'client' ? src.scope.projectId : 'practice'}.src.${id}.`).catch(() => 0)
      } else {
        set((s) => {
          if (!s.practice.knowledge.hidden.includes(id)) s.practice.knowledge.hidden.push(id)
        })
      }
      practiceLog(`Removed "${src?.title ?? id}" from the library`, id)
    },
    restoreSource: (id) =>
      set((s) => {
        s.practice.knowledge.hidden = s.practice.knowledge.hidden.filter((x) => x !== id)
      }),
    resolveConflict: (id, note) => {
      set((s) => {
        const c = s.practice.knowledge.conflicts[id]
        if (c) {
          c.status = 'resolved'
          c.resolution = { note, decidedBy: ctx.actorName(), decidedAt: ctx.now() }
        }
      })
      practiceLog(`Resolved the conflict "${get().practice.knowledge.conflicts[id]?.topic ?? id}": ${note}`)
    },
    reopenConflict: (id) =>
      set((s) => {
        const c = s.practice.knowledge.conflicts[id]
        if (c) {
          c.status = 'open'
          c.resolution = undefined
        }
      }),
  }
}
