import { useEffect, useState } from 'react'
import { onDocChange } from './docStore'
import { resolveDoc } from './resolve'
import type { StoredDoc } from './docStore'

/** Loads a document body (seed chunk or IndexedDB) and reloads when it changes. */
export function useDoc(docId: string | undefined): { doc: StoredDoc | null; loading: boolean; error?: string } {
  const [state, setState] = useState<{ doc: StoredDoc | null; loading: boolean; error?: string }>({ doc: null, loading: Boolean(docId) })
  const [rev, setRev] = useState(0)
  useEffect(() => (docId ? onDocChange((id) => id === docId && setRev((r) => r + 1)) : undefined), [docId])
  useEffect(() => {
    let live = true
    if (!docId) {
      setState({ doc: null, loading: false })
      return
    }
    setState((s) => ({ ...s, loading: true }))
    resolveDoc(docId)
      .then((doc) => live && setState({ doc, loading: false }))
      .catch((e: unknown) => live && setState({ doc: null, loading: false, error: e instanceof Error ? e.message : String(e) }))
    return () => {
      live = false
    }
  }, [docId, rev])
  return state
}
