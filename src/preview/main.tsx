// The preview document. One library per frame; the theme is applied to <html> before first paint,
// then the library's renderer mounts the requested entries.

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { parseFrameParams, type FrameParams, type HostMessage } from './protocol'
import { applyHighlight, applyPause, applyReducedMotion, captureErrors, listen, post, readTokens, reportHeight } from './bridge'
import type { ThemeIntents } from '@/library/theme/intents'
import './frame.css'

export interface LibraryModule {
  applyTheme: (doc: Document, theme: ThemeIntents) => void
  probeTokens: string[]
  Root: (props: { params: FrameParams; theme: ThemeIntents | undefined; props: Record<string, Record<string, unknown>>; onEvent: (id: string, name: string, detail?: unknown) => void }) => React.ReactElement
}

const DEFAULT_THEME: ThemeIntents = { v: 1, brand: { id: 'demo', name: 'Demo Brand', main: '#1f7a6b', accent: '#1f6feb' }, neutralTint: 0.04, type: { heading: 'Outfit', body: 'Figtree', baseSize: 15, headingWeight: 600 }, radius: 8, buttonShape: 'default', density: 1, depth: 0.3, mode: 'light' }

async function boot() {
  const params = parseFrameParams(window.location.search)
  const root = document.getElementById('root')!
  if (!params) {
    root.innerHTML = '<p class="pv__error">Missing or unknown library. Use /preview.html?lib=dsn|starter&amp;view=component&amp;ids=…</p>'
    return
  }
  captureErrors(params.frame)
  applyPause(Boolean(params.paused))
  applyReducedMotion(Boolean(params.reducedMotion))
  const lib: LibraryModule = params.lib === 'dsn' ? await import('./libs/dsn') : await import('./libs/starter')
  let theme = params.theme ?? DEFAULT_THEME
  lib.applyTheme(document, theme)

  let propsById: Record<string, Record<string, unknown>> = {}
  const reactRoot = createRoot(root)
  const render = () =>
    reactRoot.render(
      <StrictMode>
        <lib.Root params={params} theme={theme} props={propsById} onEvent={(id, name, detail) => post(params.frame, { type: 'event', id, name, detail })} />
      </StrictMode>,
    )
  render()
  const sizer = reportHeight(params.frame)

  listen(params.frame, (msg: HostMessage) => {
    switch (msg.type) {
      case 'init':
        theme = msg.theme
        lib.applyTheme(document, theme)
        if (msg.props) propsById = msg.props
        if (msg.highlight !== undefined) applyHighlight(msg.highlight)
        if (msg.paused !== undefined) applyPause(msg.paused)
        if (msg.reducedMotion !== undefined) applyReducedMotion(msg.reducedMotion)
        render()
        sizer.measure()
        post(params.frame, { type: 'tokens', values: readTokens(lib.probeTokens) })
        break
      case 'theme':
        theme = msg.theme
        lib.applyTheme(document, theme)
        render()
        sizer.measure()
        post(params.frame, { type: 'tokens', values: readTokens(lib.probeTokens) })
        break
      case 'props':
        propsById = { ...propsById, [msg.id]: msg.props }
        render()
        break
      case 'highlight':
        applyHighlight(msg.target)
        break
      case 'pause':
        applyPause(msg.paused)
        break
      case 'motion':
        applyReducedMotion(msg.reduced)
        break
      case 'measure':
        sizer.measure()
        break
      case 'tokens':
        post(params.frame, { type: 'tokens', values: readTokens(msg.names) })
        break
    }
  })
  post(params.frame, { type: 'ready', lib: params.lib, ids: params.ids })
}

void boot()
