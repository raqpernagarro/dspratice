// Frame side of the protocol: reports size and errors, applies highlight/pause/motion.

import type { FrameMessage, HighlightTarget, HostMessage } from './protocol'
import { isHostMessage } from './protocol'

type Outgoing = FrameMessage extends infer M ? (M extends unknown ? Omit<M, 'v' | 'frame'> : never) : never

export function post(frame: string, msg: Outgoing) {
  const payload = { v: 1, frame, ...msg } as FrameMessage
  window.parent?.postMessage(payload, window.location.origin)
}

export function reportHeight(frame: string) {
  let raf = 0
  let last = -1
  const measure = () => {
    raf = 0
    const h = Math.ceil(document.documentElement.scrollHeight)
    if (h !== last) {
      last = h
      post(frame, { type: 'height', height: h })
    }
  }
  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(measure)
  }
  const ro = new ResizeObserver(schedule)
  ro.observe(document.body)
  window.addEventListener('load', schedule)
  schedule()
  return { measure: schedule }
}

export function captureErrors(frame: string) {
  window.addEventListener('error', (e) => post(frame, { type: 'error', message: String(e.message), stack: e.error?.stack }))
  window.addEventListener('unhandledrejection', (e) => post(frame, { type: 'error', message: `Unhandled rejection: ${String(e.reason)}` }))
  const orig = console.error
  console.error = (...args: unknown[]) => {
    orig(...args)
    const text = args.map((a) => (a instanceof Error ? a.message : typeof a === 'string' ? a : JSON.stringify(a))).join(' ')
    if (!/Download the React DevTools|act\(\)/.test(text)) post(frame, { type: 'error', message: text.slice(0, 400) })
  }
}

let pingTimer: ReturnType<typeof setTimeout> | undefined

export function applyHighlight(target: HighlightTarget) {
  const html = document.documentElement
  for (const el of document.querySelectorAll('.is-highlighted')) el.classList.remove('is-highlighted')
  delete html.dataset.highlight
  if (!target) return
  if (target.kind === 'entry') {
    const cell = document.querySelector(`[data-entry="${CSS.escape(target.id)}"]`)
    if (cell) {
      html.dataset.highlight = 'entry'
      cell.classList.add('is-highlighted')
      cell.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
    return
  }
  if (target.kind === 'part') {
    for (const el of document.querySelectorAll(target.selector)) el.classList.add('is-highlighted')
    html.dataset.highlight = 'part'
    return
  }
  // token ping: flash the custom property on <html>, which shows every consumer at once
  if (pingTimer) clearTimeout(pingTimer)
  const prev = html.style.getPropertyValue(target.name)
  html.style.setProperty(target.name, '#46d6ac')
  pingTimer = setTimeout(() => {
    if (prev) html.style.setProperty(target.name, prev)
    else html.style.removeProperty(target.name)
  }, 700)
}

export function applyPause(paused: boolean) {
  if (paused) document.documentElement.dataset.motion = 'paused'
  else delete document.documentElement.dataset.motion
}

export function applyReducedMotion(reduced: boolean) {
  if (reduced) document.documentElement.dataset.reducedMotion = '1'
  else delete document.documentElement.dataset.reducedMotion
}

export function readTokens(names: string[]): Record<string, string> {
  const cs = getComputedStyle(document.documentElement)
  return Object.fromEntries(names.map((n) => [n, cs.getPropertyValue(n).trim()]))
}

export function listen(frame: string, handler: (msg: HostMessage) => void) {
  window.addEventListener('message', (e) => {
    if (e.origin !== window.location.origin) return
    if (!isHostMessage(e.data) || e.data.frame !== frame) return
    handler(e.data)
  })
}
