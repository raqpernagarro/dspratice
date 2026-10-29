/**
 * Keeps the last imported plugin export across reloads (IndexedDB: exports with the
 * components collection are a few MB, too big for localStorage).
 */
import type { VariablesExport } from '../../../stories/base-ui/tokens/exchange-format'

const DB = 'ds-configurator'
const STORE = 'imports'
const KEY = 'current'

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open()
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE))
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function loadImport(): Promise<VariablesExport | null> {
  try {
    return ((await run('readonly', (s) => s.get(KEY))) as VariablesExport | undefined) ?? null
  } catch {
    return null
  }
}

export async function saveImport(data: VariablesExport) {
  try {
    await run('readwrite', (s) => s.put(data, KEY))
  } catch {
    // Storage unavailable: the import still works for this session.
  }
}

export async function clearImport() {
  try {
    await run('readwrite', (s) => s.delete(KEY))
  } catch {
    // ignore
  }
}
