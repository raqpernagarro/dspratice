// Lazy route pages: the hub's newer areas (knowledge, opportunities, decks, scorecard) load on
// first visit, so the main bundle and the client demo stay small.
import { Suspense, lazy, type ComponentType } from 'react'

export function lazyPage<T extends Record<string, unknown>>(load: () => Promise<T>, name: keyof T) {
  const C = lazy(async () => ({ default: (await load())[name] as unknown as ComponentType }))
  return (
    <Suspense fallback={<div className="page"><p className="muted">Loading…</p></div>}>
      <C />
    </Suspense>
  )
}
