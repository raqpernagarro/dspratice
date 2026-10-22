// Reads a document by id: bundled seed bodies first (lazy chunks, one per document), then the doc
// store (IndexedDB). Seed ids are "seed.<slug>" and map to src/fixtures/knowledge/docs/<slug>.doc.json.

import type { KnowledgeDocument } from './types'
import { docStore, type StoredDoc, type StoredText } from './docStore'

const FIXTURES = import.meta.glob<KnowledgeDocument>('../fixtures/knowledge/docs/*.doc.json', { import: 'default' })

export function fixturePath(docId: string) {
  return `../fixtures/knowledge/docs/${docId.replace(/^seed\./, '')}.doc.json`
}

export function isSeedDoc(docId: string) {
  return docId.startsWith('seed.')
}

export async function resolveDoc(docId: string): Promise<StoredDoc | null> {
  if (isSeedDoc(docId)) {
    const load = FIXTURES[fixturePath(docId)]
    return load ? await load() : null
  }
  return docStore().getDoc(docId)
}

export async function resolveKnowledgeDoc(docId: string | undefined): Promise<KnowledgeDocument | null> {
  if (!docId) return null
  const d = await resolveDoc(docId)
  return d && 'sections' in d ? d : null
}

export async function resolveText(docId: string): Promise<string | null> {
  const d = await resolveDoc(docId)
  if (!d) return null
  return 'sections' in d ? d.sections.map((s) => `${s.heading}\n${s.text}`).join('\n\n') : (d as StoredText).text
}

export async function resolveDocs(docIds: string[]): Promise<Record<string, KnowledgeDocument>> {
  const out: Record<string, KnowledgeDocument> = {}
  await Promise.all(
    docIds.map(async (id) => {
      const d = await resolveKnowledgeDoc(id)
      if (d) out[id] = d
    }),
  )
  return out
}
