import { useRef, type PointerEvent as ReactPointerEvent } from 'react'

/** Horizontal slider over a painted track (hue, tint, …). `value` is 0–1. */
export function GradientSlider({
  label,
  value,
  track,
  thumb,
  onChange,
  marks,
}: {
  label: string
  value: number
  /** CSS background for the track. */
  track: string
  /** Fill color of the thumb. */
  thumb: string
  onChange: (value: number) => void
  marks?: string[]
}) {
  const ref = useRef<HTMLDivElement>(null)

  const onPointerDown = (e: ReactPointerEvent) => {
    const el = ref.current
    if (!el) return
    el.setPointerCapture(e.pointerId)
    const move = (clientX: number) => {
      const r = el.getBoundingClientRect()
      onChange(Math.min(1, Math.max(0, (clientX - r.left) / r.width)))
    }
    move(e.clientX)
    const onMove = (ev: PointerEvent) => move(ev.clientX)
    const onUp = () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
    }
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
  }

  return (
    <div className="gradient-slider">
      <div
        ref={ref}
        className="gradient-slider__track"
        style={{ background: track }}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value * 100)}
        onPointerDown={onPointerDown}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 0.1 : 0.01
          if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onChange(Math.min(1, value + step))
          if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onChange(Math.max(0, value - step))
        }}
      >
        <span className="gradient-slider__thumb" style={{ left: `${value * 100}%`, background: thumb }} />
      </div>
      {marks ? (
        <div className="gradient-slider__marks" aria-hidden="true">
          {marks.map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>
      ) : null}
    </div>
  )
}

/** Round swatch button showing a color, with an optional caption. */
export function Swatch({
  color,
  label,
  active,
  changed,
  onClick,
}: {
  color: string
  label?: string
  active?: boolean
  changed?: boolean
  onClick: () => void
}) {
  return (
    <button type="button" className={`swatch${active ? ' is-active' : ''}`} onClick={onClick} aria-expanded={active} title={label}>
      <span className="swatch__dot" style={{ background: color }}>
        {changed ? <i className="swatch__changed" /> : null}
      </span>
      {label ? <span className="swatch__label">{label}</span> : null}
    </button>
  )
}
