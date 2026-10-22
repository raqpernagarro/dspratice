// Small presentation pieces shared by the hub and the client demo: a mono kicker with a number,
// a highlighted phrase in a headline, and a numbered process strip whose dashed connectors show
// what leads to what. Plain markup and tokens only; no images.

import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Check } from 'lucide-react'
import { cx } from './ui'

export function Kicker({ n, children, className }: { n?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <p className={cx('kicker', className)}>
      {n !== undefined && <span className="kicker__n">{n}</span>}
      <span>{children}</span>
    </p>
  )
}

/** The one phrase in a headline that carries the point. Use once per heading. */
export function Hl({ children }: { children: ReactNode }) {
  return <span className="em-hl">{children}</span>
}

export interface ProcessStep {
  title: ReactNode
  text?: ReactNode
  to?: string
  state?: 'done' | 'current' | 'todo'
  badge?: ReactNode
  onClick?: () => void
}

export function ProcessStrip({ steps, dark, compact, label, numbered = true }: { steps: ProcessStep[]; dark?: boolean; compact?: boolean; label?: string; numbered?: boolean }) {
  return (
    <ol className={cx('process', dark && 'process--dark', compact && 'process--compact')} aria-label={label}>
      {steps.map((s, i) => {
        const inner = (
          <>
            <span className="process__n" aria-hidden="true">
              {s.state === 'done' ? <Check /> : numbered ? String(i + 1).padStart(2, '0') : null}
            </span>
            <span className="process__title">{s.title}</span>
            {s.text && <span className="process__text">{s.text}</span>}
            {s.badge}
          </>
        )
        const cls = cx('process__card', s.state && `is-${s.state}`, (s.to || s.onClick) && 'is-link')
        return (
          <li key={i} className="process__item" aria-current={s.state === 'current' ? 'step' : undefined}>
            {s.to ? (
              <Link to={s.to} className={cls}>
                {inner}
              </Link>
            ) : s.onClick ? (
              <button type="button" className={cls} onClick={s.onClick}>
                {inner}
              </button>
            ) : (
              <div className={cls}>{inner}</div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
