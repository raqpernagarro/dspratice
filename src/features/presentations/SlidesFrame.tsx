// Hosts the slide frame (slides.html) and sends it the deck to render with Carolina's engine.
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Deck } from '@/state/types'
import { deckInput } from '@/deck/exports'

let n = 0

export function SlidesFrame({ deck, mode = 'list', index = 0, onIndex, onExit, height }: { deck: Deck; mode?: 'list' | 'present' | 'single'; index?: number; onIndex?: (i: number) => void; onExit?: () => void; height?: number }) {
  const ref = useRef<HTMLIFrameElement>(null)
  const frame = useMemo(() => `slides-${++n}`, [])
  const [h, setH] = useState(height ?? 600)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const payload = useMemo(() => ({ v: 1, type: 'render', frame, deck: deckInput(deck), slides: deck.slides.map((s) => s.spec), mode, index }), [deck, frame, mode, index])
  useEffect(() => {
    const on = (e: MessageEvent) => {
      if (e.origin !== location.origin || e.data?.frame !== frame) return
      if (e.data.type === 'ready') setReady(true)
      if (e.data.type === 'height' && !height && mode === 'list') setH(e.data.h)
      if (e.data.type === 'error') setError(e.data.message)
      if (e.data.type === 'rendered') setError(null)
      if (e.data.type === 'index') onIndex?.(e.data.index)
      if (e.data.type === 'exit') onExit?.()
    }
    window.addEventListener('message', on)
    return () => window.removeEventListener('message', on)
  }, [frame, height, mode, onIndex, onExit])
  useEffect(() => {
    if (ready) ref.current?.contentWindow?.postMessage(payload, location.origin)
  }, [payload, ready])
  return (
    <div className="slides-frame">
      {error && <div className="callout callout--err">{error}</div>}
      <iframe ref={ref} title={`${deck.title} slides`} src={`/slides.html?frame=${frame}`} style={{ width: '100%', height: mode === 'present' ? '100%' : h, border: 0, display: 'block' }} onLoad={() => ref.current?.contentWindow?.postMessage(payload, location.origin)} data-testid="slides-frame" />
    </div>
  )
}
