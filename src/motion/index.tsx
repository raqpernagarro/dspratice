import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useLocation } from 'react-router'

/** True when the user prefers reduced motion. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mq) return
    const on = () => setReduced(mq.matches)
    mq.addEventListener?.('change', on)
    return () => mq.removeEventListener?.('change', on)
  }, [])
  return reduced
}

/** Scroll-based reveal. Content is always in the DOM; only the entrance animates. */
export function Reveal({ children, index = 0, as: Tag = 'div', className = '', style, once = true }: { children: ReactNode; index?: number; as?: 'div' | 'section' | 'li' | 'article'; className?: string; style?: CSSProperties; once?: boolean }) {
  const ref = useRef<HTMLElement | null>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!('IntersectionObserver' in window)) {
      setInView(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setInView(true)
            if (once) io.disconnect()
          } else if (!once) setInView(false)
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
    )
    io.observe(el)
    // Safety: never leave content hidden if the observer does not fire (throttled or odd viewports).
    const fallback = window.setTimeout(() => setInView(true), 300)
    return () => {
      io.disconnect()
      window.clearTimeout(fallback)
    }
  }, [once])
  const T = Tag as 'div'
  return (
    <T ref={ref as React.RefObject<HTMLDivElement>} className={`m-reveal ${inView ? 'is-in' : ''} ${className}`} style={{ ...style, ['--i' as string]: index }}>
      {children}
    </T>
  )
}

/** Staggers the entrance of its direct children. */
export function Stagger({ children, className = '', style, as: Tag = 'div' }: { children: ReactNode; className?: string; style?: CSSProperties; as?: 'div' | 'ul' | 'ol' | 'tbody' }) {
  const T = Tag as 'div'
  const items = Array.isArray(children) ? children : [children]
  return (
    <T className={`m-stagger ${className}`} style={style}>
      {items.map((child, i) =>
        child && typeof child === 'object' && 'props' in (child as object) ? (
          <div key={(child as { key?: string }).key ?? i} style={{ ['--i' as string]: i, display: 'contents' }}>
            {child}
          </div>
        ) : (
          child
        ),
      )}
    </T>
  )
}

/** Count-up number; flashes when the value changes. Renders the final value immediately under reduced motion. */
export function AnimatedNumber({ value, suffix = '', prefix = '', duration = 700, format }: { value: number; suffix?: string; prefix?: string; duration?: number; format?: (n: number) => string }) {
  const reduced = useReducedMotion()
  const [shown, setShown] = useState(value)
  const [changed, setChanged] = useState(false)
  const prev = useRef(value)
  const mounted = useRef(false)
  useEffect(() => {
    const from = mounted.current ? prev.current : 0
    const to = value
    prev.current = value
    if (mounted.current && from !== to) {
      setChanged(true)
      const t = setTimeout(() => setChanged(false), 800)
      if (reduced) {
        setShown(to)
        return () => clearTimeout(t)
      }
    }
    mounted.current = true
    if (reduced || from === to) {
      setShown(to)
      return
    }
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setShown(Math.round(from + (to - from) * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduced])
  return (
    <span className={`m-number ${changed ? 'is-changed' : ''}`}>
      {prefix}
      {format ? format(shown) : shown}
      {suffix}
    </span>
  )
}

/** Smooth expand/collapse without measuring heights. Content stays in the DOM. */
export function Collapse({ open, children, className = '' }: { open: boolean; children: ReactNode; className?: string }) {
  return (
    <div className={`m-collapse ${open ? 'is-open' : ''} ${className}`} aria-hidden={!open}>
      <div>{children}</div>
    </div>
  )
}

/** Expandable "Technical details" block used in client views. */
export function Details({ summary, children, defaultOpen = false, id }: { summary: ReactNode; children: ReactNode; defaultOpen?: boolean; id?: string }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="details" id={id}>
      <button className="details__summary" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className={`details__chev ${open ? 'is-open' : ''}`} aria-hidden="true">
          ›
        </span>
        {summary}
      </button>
      <Collapse open={open}>
        <div className="details__body">{children}</div>
      </Collapse>
    </div>
  )
}

/** Re-animates the content area when the route changes. */
export function PageTransition({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  return (
    <div key={pathname} className="m-page">
      {children}
    </div>
  )
}

/** Iridescent wipe shown once when the workspace switches. */
export function WorkspaceWipe({ token }: { token: number }) {
  const [show, setShow] = useState(false)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    setShow(true)
    const t = setTimeout(() => setShow(false), 800)
    return () => clearTimeout(t)
  }, [token])
  if (!show) return null
  return <div className="m-wipe" aria-hidden="true" />
}

/** Scrolls to and highlights the element with data-demo-focus={id}. */
export function focusDemoTarget(id: string | undefined) {
  if (!id) return
  const el = document.querySelector<HTMLElement>(`[data-demo-focus="${id}"]`)
  if (!el) return
  el.scrollIntoView({ behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' })
  el.classList.remove('m-focus')
  // restart the animation
  void el.offsetWidth
  el.classList.add('m-focus')
  window.setTimeout(() => el.classList.remove('m-focus'), 3600)
}
