// Where document bodies live: refreshed sources, uploads and request texts. IndexedDB in the
// browser (roomy, per record, never in localStorage); an in-memory map in tests and when IndexedDB
// is unavailable (private windows). Bundled seed bodies are never written here (see resolve.ts).

import type { KnowledgeDocument } from './types'

export interface StoredText { id: string; hash: string; text: string; storedAt: number }
export type StoredDoc = KnowledgeDocument | StoredText

export interface DocStore {
  kind: 'indexeddb' | 'memory'
  getDoc(id: string): Promise<StoredDoc | null>
  putDoc(id: string, doc: StoredDoc): Promise<void>
  deleteDoc(id: string): Promise<void>
  listDocIds(prefix?: string): Promise<string[]>
  clear(): Promise<void>
}

export const DB_NAME = 'unified-ds-tool-knowledge'
const STORE = 'docs'

export function createMemoryDocStore(): DocStore {
  const map = new Map<string, StoredDoc>()
  return {
    kind: 'memory',
    getDoc: async (id) => map.get(id) ?? null,
    putDoc: async (id, doc) => void map.set(id, JSON.parse(JSON.stringify(doc))),
    deleteDoc: async (id) => void map.delete(id),
    listDocIds: async (prefix) => Array.from(map.keys()).filter((k) => !prefix || k.startsWith(prefix)),
    clear: async () => map.clear(),
  }
}

function req<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result)
    r.onerror = () => reject(r.error)
  })
}

export function createIdbDocStore(): DocStore {
  let dbp: Promise<IDBDatabase> | null = null
  const db = () =>
    (dbp ??= new Promise<IDBDatabase>((resolve, reject) => {
      const open = indexedDB.open(DB_NAME, 1)
      open.onupgradeneeded = () => {
        if (!open.result.objectStoreNames.contains(STORE)) open.result.createObjectStore(STORE)
      }
      open.onsuccess = () => resolve(open.result)
      open.onerror = () => reject(open.error)
    }))
  const tx = async (mode: IDBTransactionMode) => (await db()).transaction(STORE, mode).objectStore(STORE)
  return {
    kind: 'indexeddb',
    getDoc: async (id) => ((await req((await tx('readonly')).get(id))) as StoredDoc | undefined) ?? null,
    putDoc: async (id, doc) => void (await req((await tx('readwrite')).put(doc, id))),
    deleteDoc: async (id) => void (await req((await tx('readwrite')).delete(id))),
    listDocIds: async (prefix) => ((await req((await tx('readonly')).getAllKeys())) as string[]).filter((k) => !prefix || k.startsWith(prefix)),
    clear: async () => void (await req((await tx('readwrite')).clear())),
  }
}

/** IndexedDB when it opens, memory otherwise (falls back once, with a console note). */
function createDefaultStore(): DocStore {
  if (typeof indexedDB === 'undefined') return createMemoryDocStore()
  const idb = createIdbDocStore()
  let fallback: DocStore | null = null
  const use = async <T>(fn: (s: DocStore) => Promise<T>): Promise<T> => {
    if (fallback) return fn(fallback)
    try {
      return await fn(idb)
    } catch (e) {
      console.warn('IndexedDB unavailable; keeping documents in memory for this session.', e)
      fallback = createMemoryDocStore()
      return fn(fallback)
    }
  }
  return {
    get kind() {
      return fallback ? 'memory' : 'indexeddb'
    },
    getDoc: (id) => use((s) => s.getDoc(id)),
    putDoc: (id, doc) => use((s) => s.putDoc(id, doc)),
    deleteDoc: (id) => use((s) => s.deleteDoc(id)),
    listDocIds: (prefix) => use((s) => s.listDocIds(prefix)),
    clear: () => use((s) => s.clear()),
  } as DocStore
}

let store: DocStore = createDefaultStore()
const listeners = new Set<(id: string) => void>()

export function docStore(): DocStore {
  return store
}

/** Tests only. */
export function __setDocStore(s: DocStore) {
  store = s
}

export function onDocChange(fn: (id: string) => void) {
  listeners.add(fn)
  return () => void listeners.delete(fn)
}

export async function putDoc(id: string, doc: StoredDoc) {
  if (id.startsWith('seed.')) throw new Error(`Seed documents are bundled and read-only: ${id}`)
  await store.putDoc(id, doc)
  listeners.forEach((l) => l(id))
}

export async function deleteDoc(id: string) {
  await store.deleteDoc(id)
  listeners.forEach((l) => l(id))
}

export async function deleteDocsWithPrefix(prefix: string) {
  const ids = await store.listDocIds(prefix)
  for (const id of ids) await deleteDoc(id)
  return ids.length
}

export async function clearStoredDocs() {
  await store.clear()
}
