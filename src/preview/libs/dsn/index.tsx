// The DSN frame: DSN's tokens, its own theme engine, and the real components by folder import.

import { Suspense, lazy, useEffect, type ComponentType } from 'react'
import '@dsn-root/tokens.css'
import './preview-base.css'
import { applyDsnTheme, DSN_PROBE_TOKENS } from '@/library/theme/dsn'
import type { ThemeIntents } from '@/library/theme/intents'
import type { FrameParams } from '../../protocol'
import { DSN_RENDERERS, type Renderer } from './renderers'

export const probeTokens = DSN_PROBE_TOKENS

export function applyTheme(doc: Document, theme: ThemeIntents) {
  applyDsnTheme(doc, theme)
}

const cache = new Map<string, ComponentType<{ props: Record<string, unknown>; onEvent: (name: string, detail?: unknown) => void }>>()

function lazyFor(id: string, r: Renderer) {
  let c = cache.get(id)
  if (!c) {
    c = lazy(async () => ({ default: await r.load() }))
    cache.set(id, c)
  }
  return c
}

function Cell({ id, props, onEvent, label }: { id: string; props: Record<string, unknown>; onEvent: (id: string, name: string, detail?: unknown) => void; label: boolean }) {
  const r = DSN_RENDERERS[id]
  const start = performance.now()
  useEffect(() => {
    window.parent?.postMessage({ v: 1, frame: new URLSearchParams(location.search).get('frame') ?? 'frame', type: 'rendered', id, ms: Math.round(performance.now() - start), lazy: Boolean(r?.heavy) }, location.origin)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])
  if (!r) return <div className="pv__error">No renderer for {id}</div>
  const C = lazyFor(id, r)
  return (
    <div className="pv__cell" data-entry={id}>
      {label && <span className="pv__label">{r.name}</span>}
      <div className={r.block ? 'pv__stage pv__stage--block' : 'pv__stage'} style={r.minHeight ? { minHeight: r.minHeight } : undefined}>
        <Suspense fallback={<span className="pv__label">Loading…</span>}>
          <C props={{ ...r.defaults, ...props }} onEvent={(name, detail) => onEvent(id, name, detail)} />
        </Suspense>
      </div>
    </div>
  )
}

export function Root({ params, props, onEvent }: { params: FrameParams; theme: ThemeIntents | undefined; props: Record<string, Record<string, unknown>>; onEvent: (id: string, name: string, detail?: unknown) => void }) {
  const gallery = params.view === 'gallery' || params.ids.length > 1
  return (
    <div className={gallery ? 'pv pv--gallery' : 'pv'}>
      {params.ids.map((id) => (
        <Cell key={id} id={id} props={props[id] ?? {}} onEvent={onEvent} label={gallery} />
      ))}
    </div>
  )
}
