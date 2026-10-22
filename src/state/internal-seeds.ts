// Internal-only seed data (the knowledge library's registry and the sample opportunities) is
// registered from src/internal/register.ts. The client-safe demo build never imports that module,
// so none of it reaches the public bundle; the store then starts with an empty library.

import type { KnowledgeSource, KnowledgeState } from '@/knowledge/types'
import type { Opportunity } from '@/opportunity/types'

export interface InternalSeeds {
  /** The bundled seed registry (metadata merged with the generated document index). */
  sources: KnowledgeSource[]
  knowledge: () => KnowledgeState
  opportunities: (projectId: string, t: number) => Record<string, Opportunity>
}

let seeds: InternalSeeds | null = null

export function registerInternalSeeds(s: InternalSeeds) {
  seeds = s
}

export function internalSeeds(): InternalSeeds | null {
  return seeds
}

export function emptyKnowledge(): KnowledgeState {
  return { overrides: {}, custom: {}, hidden: [], conflicts: {}, activity: [] }
}
