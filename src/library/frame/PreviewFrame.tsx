// The app-side half of a preview frame: an iframe that loads one library, themed to the project,
// with auto-height, lazy mounting, a frame budget and the postMessage bridge.

import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react'
import { frameUrl, isFrameMessage, type FrameMessage, type FrameView, type HighlightTarget, type HostMessage, type LibraryId } from '@/preview/protocol'

type Outgoing = HostMessage extends infer M ? (M extends unknown ? Omit<M, 'v' | 'frame'> : never) : never
import type { ThemeIntents } from '@/library/theme/intents'
import { sameIntents } from '@/library/theme/intents'
import { releaseSlot, requestSlot } from './frameBudget'
import { useStore } from '@/state/store'
import { cx } from '@/shell/ui'

export interface PreviewFrameProps {
  library: LibraryId
  ids: string[]
  view?: FrameView
  theme: ThemeIntents
  props?: Record<string, Record<string, unknown>>
  highlight?: HighlightTarget
  height?: { min?: number; max?: number } | { fixed: number }
  lazy?: boolean
  title?: string
  className?: string
  style?: CSSProperties
  onReady?: () => void
  onEvent?: (id: string, name: string, detail?: unknown) => void
  onError?: (message: string) => void
  onTokens?: (values: Record<string, string>) => void
}

export function PreviewFrame({ library, ids, view = ids.length > 1 ? 'gallery' : 'component', theme, props, highlight = null, height, lazy = true, title, className, style, onReady, onEvent, onError, onTokens }: PreviewFrameProps) {
  const frameId = useId().replace(/[^a-zA-Z0-9]/g, '')
  const ref = useRef<HTMLIFrameElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [near, setNear] = useState(!lazy)
  const [slot, setSlot] = useState(false)
  const [ready, setReady] = useState(false)
  const [measured, setMeasured] = useState<number | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const motionPaused = useStore((s) => s.ui.motionPaused)
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const sentTheme = useRef<ThemeIntents | undefined>(undefined)
  const fixed = height && 'fixed' in height ? height.fixed : undefined
  const min = height && 'min' in height ? (height.min ?? 120) : 120
  const max = height && 'max' in height ? height.max : undefined

  // Mount only near the viewport.
  useEffect(() => {
    if (near) return
    const el = wrapRef.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setNear(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true)
          io.disconnect()
        }
      },
      { rootMargin: '400px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [near])

  // Then wait for a slot in the frame budget.
  useEffect(() => {
    if (!near) return
    if (requestSlot(frameId, () => setSlot(true))) setSlot(true)
    return () => releaseSlot(frameId)
  }, [near, frameId])

  const src = useMemo(() => (slot ? frameUrl({ lib: library, view, ids, frame: frameId, theme, paused: motionPaused, reducedMotion: reduced }) : undefined), [slot, library, view, ids.join(','), frameId]) // eslint-disable-line react-hooks/exhaustive-deps

  const send = useCallback(
    (msg: Outgoing) => {
      const w = ref.current?.contentWindow
      if (!w) return
      w.postMessage({ v: 1, frame: frameId, ...msg } as HostMessage, window.location.origin)
    },
    [frameId],
  )

  // Bridge.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return
      const data: unknown = e.data
      if (!isFrameMessage(data) || data.frame !== frameId) return
      const m = data as FrameMessage
      switch (m.type) {
        case 'ready':
          setReady(true)
          sentTheme.current = theme
          send({ type: 'init', theme, props, highlight, paused: motionPaused, reducedMotion: reduced })
          onReady?.()
          break
        case 'height':
          setMeasured(m.height)
          break
        case 'event':
          onEvent?.(m.id, m.name, m.detail)
          break
        case 'error':
          setErrors((prev) => (prev.includes(m.message) ? prev : [...prev, m.message].slice(-3)))
          onError?.(m.message)
          break
        case 'tokens':
          onTokens?.(m.values)
          break
        default:
          break
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameId, send, onReady, onEvent, onError, onTokens, theme, props, highlight])

  // Live updates once ready.
  useEffect(() => {
    if (!ready) return
    if (!sameIntents(sentTheme.current, theme)) {
      sentTheme.current = theme
      send({ type: 'theme', theme })
    }
  }, [ready, theme, send])
  useEffect(() => {
    if (!ready) return
    send({ type: 'highlight', target: highlight })
  }, [ready, highlight, send])
  useEffect(() => {
    if (!ready) return
    send({ type: 'pause', paused: motionPaused })
  }, [ready, motionPaused, send])
  useEffect(() => {
    if (!ready || !props) return
    for (const [id, p] of Object.entries(props)) send({ type: 'props', id, props: p })
  }, [ready, props, send])

  const h = fixed ?? Math.max(min, Math.min(max ?? Infinity, measured ?? min))
  return (
    <div ref={wrapRef} className={cx('pframe', !ready && 'is-loading', className)} style={{ ...style, height: h }} data-library={library} data-frame={frameId}>
      {src && <iframe ref={ref} src={src} title={title ?? `${library} preview`} className="pframe__iframe" loading="lazy" sandbox="allow-scripts allow-same-origin" />}
      {!ready && <div className="pframe__skeleton m-shimmer" aria-hidden="true" />}
      {errors.length > 0 && (
        <div className="pframe__errors" role="status">
          {errors.map((e) => (
            <div key={e}>{e}</div>
          ))}
        </div>
      )}
    </div>
  )
}
