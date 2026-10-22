// The Starter Pack frame: its generated semantic tokens, its configurator engine, Base UI providers
// and the real wrappers.

import { Suspense, lazy, type ComponentType } from 'react'
import '@starter/tokens/figma-semantic.css'
import '@fontsource/hanken-grotesk/400.css'
import '@fontsource/hanken-grotesk/500.css'
import '@fontsource/hanken-grotesk/600.css'
import '@fontsource/hanken-grotesk/700.css'
import './preview-base.css'
import { applyStarterTheme, STARTER_PROBE_TOKENS } from '@/library/theme/starter'
import type { ThemeIntents } from '@/library/theme/intents'
import type { FrameParams } from '../../protocol'
import { STARTER_RENDERERS, type Renderer } from './renderers'

export const probeTokens = STARTER_PROBE_TOKENS

export function applyTheme(doc: Document, theme: ThemeIntents) {
  applyStarterTheme(doc.documentElement, theme)
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
  const r = STARTER_RENDERERS[id]
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
