// The generated registry of every source component (scripts/build-registry.mjs), plus the lookups
// the app needs. Regenerate with `node scripts/build-registry.mjs`.

import dsn from './generated/dsn.json'
import starter from './generated/starter.json'
import manifest from './generated/manifest.json'
import type { RegistryEntry, RegistrySource } from './generated/registry.types'
import type { Component } from '@/state/types'

export type { RegistryEntry, RegistrySource } from './generated/registry.types'

export const REGISTRY: RegistryEntry[] = [...(dsn as unknown as RegistryEntry[]), ...(starter as unknown as RegistryEntry[])]
export const REGISTRY_MANIFEST = manifest as { generatedAt: string; counts?: Record<string, unknown> }

const byId = new Map(REGISTRY.map((e) => [e.id, e]))

export function registryEntry(id: string): RegistryEntry | undefined {
  return byId.get(id)
}

export function registryIdFor(c: Pick<Component, 'source' | 'sourceId'>) {
  return `${c.source}:${c.sourceId}`
}

/** The registry entry behind a project component, when its source really exists. */
export function entryForComponent(c: Pick<Component, 'source' | 'sourceId'>): RegistryEntry | undefined {
  return byId.get(registryIdFor(c))
}

export function entriesFor(source: RegistrySource) {
  return REGISTRY.filter((e) => e.source === source)
}

/** Entries that render on their own in a preview frame (sub-parts render inside their parent). */
export function renderable(e: RegistryEntry) {
  return e.status !== 'preserved' && !e.parent
}

export const SOURCE_LABEL: Record<RegistrySource, string> = { dsn: 'DSN (ds-ngr)', starter: 'DS Starter Pack' }

export const REGISTRY_CATEGORIES = Array.from(new Set(REGISTRY.map((e) => e.category))).sort()
