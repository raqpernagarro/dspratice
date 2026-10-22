// The merged registry (bundled seed entries + the user's overrides + custom sources) and the
// visibility rule that keeps one client's material out of another client's opportunity.

import type { KnowledgeSource, KnowledgeState, RecordedSource } from './types'
import { internalSeeds } from '@/state/internal-seeds'

let memo: { key: unknown[]; value: KnowledgeSource[] } | null = null

export function knowledgeRegistry(k: KnowledgeState, seeds: KnowledgeSource[] = internalSeeds()?.sources ?? []): KnowledgeSource[] {
  const key = [k.overrides, k.custom, k.hidden, seeds]
  if (memo && memo.key.every((v, i) => v === key[i])) return memo.value
  const hidden = new Set(k.hidden)
  const merged = seeds
    .filter((s) => !hidden.has(s.id))
    .map((s) => {
      const o = k.overrides[s.id]
      return o ? ({ ...s, ...o, seed: true } as KnowledgeSource) : s
    })
  const value = [...merged, ...Object.values(k.custom)]
  memo = { key, value }
  return value
}

export function sourceById(k: KnowledgeState, id: string): KnowledgeSource | undefined {
  return knowledgeRegistry(k).find((s) => s.id === id)
}

/** Practice sources, this client's own sources, and other clients' sources only when approved for reuse. */
export function isVisibleTo(source: KnowledgeSource, projectId: string): boolean {
  if (source.scope.kind === 'practice') return true
  return source.scope.projectId === projectId || source.scope.reusable === true
}

export function visibleSources(registry: KnowledgeSource[], projectId: string): KnowledgeSource[] {
  return registry.filter((s) => isVisibleTo(s, projectId))
}

export function recordSources(registry: KnowledgeSource[], ids: string[]): RecordedSource[] {
  const by = new Map(registry.map((s) => [s.id, s]))
  return ids.flatMap((id) => {
    const s = by.get(id)
    return s ? [{ sourceId: s.id, title: s.title, readAt: s.readAt, sourceHash: s.sourceHash, approval: s.approval }] : []
  })
}

export function needsAttention(s: KnowledgeSource): boolean {
  return s.approval === 'outdated' || s.availability === 'inaccessible' || s.availability === 'not-read'
}
