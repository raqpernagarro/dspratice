import type { ReactNode, ButtonHTMLAttributes, AnchorHTMLAttributes, CSSProperties } from 'react'
import { Link } from 'react-router'
import { AlertTriangle, CheckCircle2, Info, Sparkles, XCircle, FlaskConical, X, Loader2 } from 'lucide-react'
import type { ScreenStatus } from '@/state/types'

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ')
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'mint' | 'danger' | 'on-dark' | 'on-dark-ghost'
  size?: 'sm' | 'md' | 'lg'
  block?: boolean
  loading?: boolean
}

export function Btn({ variant = 'primary', size = 'md', block, loading, className, children, ...rest }: BtnProps) {
  return (
    <button
      className={cx('btn', variant !== 'primary' && `btn--${variant}`, size !== 'md' && `btn--${size}`, block && 'btn--block', className)}
      {...rest}
      disabled={rest.disabled || loading}
    >
      {loading && <Loader2 className="spin" />}
      {children}
    </button>
  )
}

type LinkBtnProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  to: string
  variant?: BtnProps['variant']
  size?: BtnProps['size']
  block?: boolean
}

export function LinkBtn({ to, variant = 'primary', size = 'md', block, className, children, ...rest }: LinkBtnProps) {
  return (
    <Link to={to} className={cx('btn', variant !== 'primary' && `btn--${variant}`, size !== 'md' && `btn--${size}`, block && 'btn--block', className)} {...rest}>
      {children}
    </Link>
  )
}

export function Chip({ tone = 'default', children, className, icon, title }: { tone?: 'default' | 'ok' | 'warn' | 'err' | 'info' | 'ai' | 'ink' | 'outline' | 'dashed' | 'mint'; children: ReactNode; className?: string; icon?: ReactNode; title?: string }) {
  return (
    <span className={cx('chip', tone !== 'default' && `chip--${tone}`, className)} title={title}>
      {icon}
      {children}
    </span>
  )
}

const STATUS_LABEL: Record<ScreenStatus, string> = { works: 'Works today', partly: 'Partly works', proposed: 'Proposed' }
const STATUS_TITLE: Record<ScreenStatus, string> = {
  works: 'The board marks this screen as working today in one of the three source projects.',
  partly: 'Pieces of this exist in the source projects; the connected version is new.',
  proposed: 'Proposed on the board; nothing in the source projects does this yet.',
}

export function StatusChip({ status }: { status: ScreenStatus }) {
  return (
    <span className={cx('chip', `chip--status-${status}`)} title={STATUS_TITLE[status]}>
      {STATUS_LABEL[status]}
    </span>
  )
}

export function SimBadge({ what = 'Local simulation', detail }: { what?: string; detail?: string }) {
  return (
    <span className="chip chip--status-sim" title={detail ?? 'This action runs locally on fixtures. Nothing is sent to GitHub, Figma or a model.'}>
      <FlaskConical />
      {what}
    </span>
  )
}

export function DemoData({ children = 'Demo data' }: { children?: ReactNode }) {
  return (
    <span className="chip chip--dashed" title="Illustrative values from fixtures, not measurements.">
      {children}
    </span>
  )
}

export function Panel({ title, actions, children, className, flush, tight, ink, foot, style }: { title?: ReactNode; actions?: ReactNode; children?: ReactNode; className?: string; flush?: boolean; tight?: boolean; ink?: boolean; foot?: ReactNode; style?: CSSProperties }) {
  return (
    <section className={cx('panel', flush && 'panel--flush', tight && 'panel--tight', ink && 'panel--ink', className)} style={style}>
      {(title || actions) && (
        <header className="panel__head" style={flush ? { padding: 'var(--n-space-4) var(--n-space-5) 0' } : undefined}>
          {title && <div className="panel__title">{title}</div>}
          {actions && <div className="row">{actions}</div>}
        </header>
      )}
      {children}
      {foot && <footer className="panel__foot">{foot}</footer>}
    </section>
  )
}

export function Stat({ label, value, hint, small, tone }: { label: string; value: ReactNode; hint?: ReactNode; small?: boolean; tone?: 'ok' | 'warn' | 'err' }) {
  return (
    <div className="stat">
      <span className="stat__label">{label}</span>
      <span className={cx('stat__value', small && 'stat__value--sm')} style={tone ? { color: `var(--n-${tone})` } : undefined}>
        {value}
      </span>
      {hint && <span className="stat__hint">{hint}</span>}
    </div>
  )
}

export function Field({ label, hint, children, id }: { label: string; hint?: ReactNode; children: ReactNode; id?: string }) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      {children}
      {hint && <span className="field__hint">{hint}</span>}
    </div>
  )
}

export function Segmented<T extends string>({ value, options, onChange, ariaLabel }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void; ariaLabel?: string }) {
  return (
    <div className="segmented" role="group" aria-label={ariaLabel}>
      {options.map((o) => (
        <button key={o.id} type="button" className={cx(value === o.id && 'is-active')} onClick={() => onChange(o.id)} aria-pressed={value === o.id}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Tabs<T extends string>({ value, tabs, onChange }: { value: T; tabs: { id: T; label: string; badge?: ReactNode }[]; onChange: (v: T) => void }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t.id} role="tab" aria-selected={value === t.id} className={cx(value === t.id && 'is-active')} onClick={() => onChange(t.id)}>
          {t.label}
          {t.badge}
        </button>
      ))}
    </div>
  )
}

export function Callout({ tone = 'default', children, icon }: { tone?: 'default' | 'warn' | 'err' | 'ok' | 'ai' | 'info'; children: ReactNode; icon?: ReactNode }) {
  const defaultIcon = tone === 'warn' ? <AlertTriangle /> : tone === 'err' ? <XCircle /> : tone === 'ok' ? <CheckCircle2 /> : tone === 'ai' ? <Sparkles /> : <Info />
  return (
    <div className={cx('callout', tone !== 'default' && `callout--${tone}`)}>
      {icon ?? defaultIcon}
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  )
}

export function Progress({ value, mint }: { value: number; mint?: boolean }) {
  return (
    <div className={cx('progress', mint && 'progress--mint')} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}

export function Meter({ value, label }: { value: number; label?: string }) {
  return (
    <div className="meter">
      <Progress value={value} />
      <span>{label ?? `${value}%`}</span>
    </div>
  )
}

export function Swatch({ color, lg, title }: { color: string; lg?: boolean; title?: string }) {
  return <span className={cx('swatch', lg && 'swatch--lg')} style={{ background: color }} title={title ?? color} aria-label={title ?? color} />
}

export function Sheet({ title, onClose, children, wide, actions }: { title: ReactNode; onClose: () => void; children: ReactNode; wide?: boolean; actions?: ReactNode }) {
  return (
    <div className="sheet-scrim" onClick={onClose} role="presentation">
      <div className={cx('sheet', wide && 'sheet--wide')} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="row row--between">
          <h4>{title}</h4>
          <button className="icon-btn" onClick={onClose} aria-label="Close" style={{ color: 'var(--n-fg)' }}>
            <X />
          </button>
        </div>
        {children}
        {actions && <div className="row" style={{ justifyContent: 'flex-end' }}>{actions}</div>}
      </div>
    </div>
  )
}

export function Kv({ rows }: { rows: [ReactNode, ReactNode][] }) {
  return (
    <dl className="kv">
      {rows.map(([k, v], i) => (
        <div key={i} style={{ display: 'contents' }}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>
}

export function Code({ children, light, className }: { children: string; light?: boolean; className?: string }) {
  return <pre className={cx('code', light && 'code--light', className)}>{children}</pre>
}

export function CheckIcon({ status }: { status: 'pass' | 'fail' | 'warn' | 'running' | 'queued' | 'info' }) {
  const style = { width: 16, height: 16 }
  if (status === 'pass') return <CheckCircle2 style={{ ...style, color: 'var(--n-ok)' }} />
  if (status === 'fail') return <XCircle style={{ ...style, color: 'var(--n-err)' }} />
  if (status === 'warn') return <AlertTriangle style={{ ...style, color: 'var(--n-warn)' }} />
  if (status === 'running') return <Loader2 className="spin" style={{ ...style, color: 'var(--n-info)' }} />
  if (status === 'info') return <Info style={{ ...style, color: 'var(--n-info)' }} />
  return <span className="dot" style={{ color: 'var(--n-fg-subtle)', width: 10, height: 10, margin: 3 }} />
}

export function SeverityChip({ severity }: { severity: 'error' | 'warn' | 'info' }) {
  return <Chip tone={severity === 'error' ? 'err' : severity === 'warn' ? 'warn' : 'info'}>{severity === 'error' ? 'Error' : severity === 'warn' ? 'Warning' : 'Info'}</Chip>
}

export function FindingStatusChip({ status }: { status: 'open' | 'proposed' | 'in_pr' | 'merged' | 'dismissed' }) {
  const map = {
    open: ['Open', 'warn'],
    proposed: ['Fix proposed', 'info'],
    in_pr: ['In pull request', 'ai'],
    merged: ['Resolved', 'ok'],
    dismissed: ['Dismissed', 'outline'],
  } as const
  const [label, tone] = map[status]
  return <Chip tone={tone}>{label}</Chip>
}
