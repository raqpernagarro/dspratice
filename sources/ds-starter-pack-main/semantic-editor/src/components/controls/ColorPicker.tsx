import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

import { hexToHsv, hsvToHex, type Hsv } from '../../lib/color'

const PRESETS = [
  '#e11d48', '#f97316', '#f59e0b', '#84cc16', '#16a34a', '#0d9488',
  '#0891b2', '#2563eb', '#4f46e5', '#7c3aed', '#c026d3', '#475569',
]

/** Full color picker: saturation/brightness area, hue, hex field and presets. */
export function Picker({ hex, onChange, onReset }: { hex: string; onChange: (hex: string) => void; onReset?: () => void }) {
  const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(hex))
  const [draft, setDraft] = useState(hex)
  const lastEmitted = useRef(hex)

  // Follow external changes (reset, brand switch) without fighting the user's drag.
  useEffect(() => {
    if (hex.toLowerCase() !== lastEmitted.current.toLowerCase()) {
      setHsv(hexToHsv(hex))
      lastEmitted.current = hex
    }
    setDraft(hex)
  }, [hex])

  const emit = (next: Hsv) => {
    setHsv(next)
    const out = hsvToHex(next)
    lastEmitted.current = out
    onChange(out)
  }

  const drag = (el: HTMLElement, fn: (x: number, y: number) => void) => (e: ReactPointerEvent) => {
    const move = (ev: PointerEvent | ReactPointerEvent) => {
      const r = el.getBoundingClientRect()
      fn(Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (ev.clientY - r.top) / r.height)))
    }
    move(e)
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const areaRef = useRef<HTMLDivElement>(null)
  const hueRef = useRef<HTMLDivElement>(null)
  const hueColor = hsvToHex({ h: hsv.h, s: 1, v: 1 })

  return (
    <div className="picker">
      <div
        ref={areaRef}
        className="picker__area"
        style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hueColor})` }}
        onPointerDown={(e) => areaRef.current && drag(areaRef.current, (x, y) => emit({ ...hsv, s: x, v: 1 - y }))(e)}
      >
        <span className="picker__thumb" style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: hsvToHex(hsv) }} />
      </div>
      <div
        ref={hueRef}
        className="picker__hue"
        onPointerDown={(e) => hueRef.current && drag(hueRef.current, (x) => emit({ ...hsv, h: x * 359.9 }))(e)}
      >
        <span className="picker__thumb picker__thumb--hue" style={{ left: `${(hsv.h / 360) * 100}%`, background: hueColor }} />
      </div>
      <div className="picker__row">
        <input
          className="picker__hex"
          value={draft}
          spellCheck={false}
          aria-label="Hex color"
          onChange={(e) => {
            setDraft(e.target.value)
            const v = e.target.value.trim()
            if (/^#?[0-9a-f]{6}$/i.test(v)) {
              const next = v.startsWith('#') ? v : `#${v}`
              lastEmitted.current = next
              setHsv(hexToHsv(next))
              onChange(next)
            }
          }}
        />
        {onReset ? (
          <button type="button" className="picker__reset" onClick={onReset}>
            Reset
          </button>
        ) : null}
      </div>
      <div className="picker__presets">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            style={{ background: p }}
            aria-label={p}
            className={p === hex.toLowerCase() ? 'is-active' : ''}
            onClick={() => {
              lastEmitted.current = p
              setHsv(hexToHsv(p))
              onChange(p)
            }}
          />
        ))}
      </div>
    </div>
  )
}
