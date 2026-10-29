import {
  ArrowLeft, ArrowRight, Bell, Book, Calendar, Camera, ChartBar, ChatCircle, Check, Clock, CreditCard, DownloadSimple, Envelope, Eye, File,
  Folder, FunnelSimple, Gear, Globe, Heart, House, Info, Lightning, Lock, MagnifyingGlass, Package, PencilSimple, Play, Plus, Question,
  RocketLaunch, ShieldCheck, ShoppingCart, Sparkle, Star, Tag, Trash, Truck, UploadSimple, User, Users, Warning, X, type Icon,
} from '@phosphor-icons/react'
import { Fragment, type CSSProperties, type ReactNode } from 'react'

import { Avatar } from '../../../stories/base-ui/components/avatar/Avatar'
import { Badge, type BadgeType } from '../../../stories/base-ui/components/badge/Badge'
import { Breadcrumb } from '../../../stories/base-ui/components/breadcrumb/Breadcrumb'
import { Button, type ButtonSize, type ButtonType } from '../../../stories/base-ui/components/button/Button'
import { Card } from '../../../stories/base-ui/components/card/Card'
import { Checkbox } from '../../../stories/base-ui/components/checkbox/Checkbox'
import { EmptyState } from '../../../stories/base-ui/components/empty-state/EmptyState'
import { Field } from '../../../stories/base-ui/components/field/Field'
import { IconButton } from '../../../stories/base-ui/components/icon-button/IconButton'
import { Input } from '../../../stories/base-ui/components/input/Input'
import { Meter } from '../../../stories/base-ui/components/meter/Meter'
import { Pagination } from '../../../stories/base-ui/components/pagination/Pagination'
import { Progress } from '../../../stories/base-ui/components/progress/Progress'
import { Radio } from '../../../stories/base-ui/components/radio/Radio'
import { RadioGroup } from '../../../stories/base-ui/components/radio-group/RadioGroup'
import { Select } from '../../../stories/base-ui/components/select/Select'
import { Separator } from '../../../stories/base-ui/components/separator/Separator'
import { Skeleton, type SkeletonShape } from '../../../stories/base-ui/components/skeleton/Skeleton'
import { Switch } from '../../../stories/base-ui/components/switch/Switch'
import { Tabs } from '../../../stories/base-ui/components/tabs/Tabs'
import { isNode, type Child, type UiNode } from './schema'

export const ICONS: Record<string, Icon> = {
  house: House, chart: ChartBar, users: Users, user: User, gear: Gear, bell: Bell, search: MagnifyingGlass, plus: Plus, check: Check, x: X,
  'arrow-right': ArrowRight, 'arrow-left': ArrowLeft, calendar: Calendar, file: File, folder: Folder, cart: ShoppingCart, tag: Tag, heart: Heart,
  star: Star, chat: ChatCircle, mail: Envelope, lock: Lock, download: DownloadSimple, upload: UploadSimple, filter: FunnelSimple, trash: Trash,
  pencil: PencilSimple, eye: Eye, globe: Globe, lightning: Lightning, clock: Clock, 'credit-card': CreditCard, package: Package, truck: Truck,
  book: Book, question: Question, info: Info, warning: Warning, sparkle: Sparkle, shield: ShieldCheck, rocket: RocketLaunch, camera: Camera, play: Play,
}

/** A Phosphor icon by name; bold for the four glyphs the rules ask for, fill for the rest. */
function icon(name: unknown): ReactNode {
  const Cmp = typeof name === 'string' ? ICONS[name] : undefined
  if (!Cmp) return null
  return <Cmp weight={['check', 'x', 'plus'].includes(name as string) ? 'bold' : 'fill'} />
}

const s = (v: unknown, fallback = '') => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : fallback)
const n = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback)
const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : [])
const oneOf = <T extends string>(v: unknown, list: readonly T[], fallback: T): T => (list.includes(v as T) ? (v as T) : fallback)

const GAPS = ['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const
const gap = (v: unknown, fallback: (typeof GAPS)[number] = 'md') => `var(--space-${oneOf(v, GAPS, fallback)})`

function kids(node: UiNode, path: string): ReactNode {
  return (node.children ?? []).map((c, i) => <Node key={i} node={c} path={`${path}.${i}`} />)
}

/** Deterministic bars or a line for the chart pattern (drawn with tokens, no chart library). */
function Chart({ kind, values, labels, height }: { kind: 'bar' | 'line'; values: number[]; labels: string[]; height: number }) {
  const vals = values.length ? values : [12, 18, 15, 22, 28, 24, 31, 35, 30, 38, 42, 40]
  const max = Math.max(...vals, 1)
  const w = 100 / vals.length
  return (
    <figure className="pr-chart" style={{ height }}>
      <svg viewBox={`0 0 100 100`} preserveAspectRatio="none" role="img" aria-label={`${kind} chart`}>
        {[25, 50, 75].map((y) => (
          <line key={y} x1="0" x2="100" y1={y} y2={y} className="pr-chart__grid" vectorEffect="non-scaling-stroke" />
        ))}
        {kind === 'bar'
          ? vals.map((v, i) => <rect key={i} x={i * w + w * 0.18} width={w * 0.64} y={100 - (v / max) * 92} height={(v / max) * 92} className="pr-chart__bar" rx="0.6" />)
          : (
            <>
              <polygon className="pr-chart__area" points={`0,100 ${vals.map((v, i) => `${(i / (vals.length - 1)) * 100},${100 - (v / max) * 90}`).join(' ')} 100,100`} />
              <polyline className="pr-chart__line" vectorEffect="non-scaling-stroke" points={vals.map((v, i) => `${(i / (vals.length - 1)) * 100},${100 - (v / max) * 90}`).join(' ')} />
            </>
          )}
      </svg>
      {labels.length ? (
        <figcaption className="pr-chart__labels">
          {labels.map((l, i) => (
            <span key={i}>{l}</span>
          ))}
        </figcaption>
      ) : null}
    </figure>
  )
}

function Cell({ cell }: { cell: unknown }) {
  if (cell && typeof cell === 'object') {
    const c = cell as Record<string, unknown>
    if (c.badge) return <Badge type={oneOf<BadgeType>(c.tone, ['neutral', 'info', 'success', 'warning', 'error'], 'neutral')} size="sm">{s(c.badge)}</Badge>
    if (c.avatar)
      return (
        <span className="pr-cell-avatar">
          <Avatar size="sm" initials={s(c.avatar).slice(0, 2)} />
          {s(c.text)}
        </span>
      )
    return <>{s(c.text)}</>
  }
  return <>{s(cell)}</>
}

function Node({ node, path }: { node: Child; path: string }): ReactNode {
  if (typeof node === 'string') return node
  if (!isNode(node)) return null
  const p = node.props ?? {}
  switch (node.type) {
    /* ----------------------------------------------------------- layout */
    case 'stack': {
      const style: CSSProperties = {
        flexDirection: p.direction === 'row' ? 'row' : 'column',
        gap: gap(p.gap),
        alignItems: { start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch' }[s(p.align)] as CSSProperties['alignItems'],
        justifyContent: { start: 'flex-start', center: 'center', end: 'flex-end', between: 'space-between' }[s(p.justify)] as CSSProperties['justifyContent'],
        flexWrap: p.wrap ? 'wrap' : undefined,
        flexGrow: p.grow ? 1 : undefined,
      }
      return <div className="pr-stack" style={style}>{kids(node, path)}</div>
    }
    case 'grid': {
      const min = n(p.minWidth, 0)
      const cols = Math.min(6, Math.max(1, n(p.columns, 2)))
      return (
        <div className="pr-grid" style={{ gap: gap(p.gap), gridTemplateColumns: min ? `repeat(auto-fit, minmax(min(${min}px, 100%), 1fr))` : `repeat(${cols}, minmax(0, 1fr))` }}>
          {kids(node, path)}
        </div>
      )
    }
    case 'box':
      return (
        <div
          className="pr-box"
          data-surface={oneOf(p.surface, ['primary', 'secondary', 'tertiary', 'inverted', 'none'] as const, 'none')}
          data-border={p.border ? 'true' : undefined}
          data-radius={oneOf(p.radius, ['sm', 'md', 'lg'] as const, 'md')}
          style={{ padding: gap(p.padding), flexGrow: p.grow ? 1 : undefined, maxWidth: p.maxWidth ? n(p.maxWidth, 0) : undefined, marginInline: p.maxWidth ? 'auto' : undefined, width: p.maxWidth ? '100%' : undefined }}
        >
          {kids(node, path)}
        </div>
      )
    case 'appShell':
      return (
        <div className="pr-app">
          <aside className="pr-app__side">
            <p className="pr-app__brand">{s(p.brand, 'Acme')}</p>
            <nav aria-label="Main">
              {arr<Record<string, unknown>>(p.nav).map((item, i) => (
                <a key={i} href="#" onClick={(e) => e.preventDefault()} className="pr-app__nav" aria-current={item.active ? 'page' : undefined}>
                  {icon(item.icon)}
                  {s(item.label)}
                </a>
              ))}
            </nav>
            {p.user ? (
              <div className="pr-app__user">
                <Avatar size="sm" initials={s(p.user).slice(0, 2)} />
              </div>
            ) : null}
          </aside>
          <main className="pr-app__main">{kids(node, path)}</main>
        </div>
      )
    case 'mobileShell':
      return (
        <div className="pr-mobile">
          <header className="pr-mobile__bar">
            <strong>{s(p.title)}</strong>
          </header>
          <div className="pr-mobile__body">{kids(node, path)}</div>
          <nav className="pr-mobile__tabs" aria-label="Tabs">
            {arr<Record<string, unknown>>(p.tabs).map((t, i) => (
              <a key={i} href="#" onClick={(e) => e.preventDefault()} aria-current={t.active ? 'page' : undefined}>
                {icon(t.icon)}
                <span>{s(t.label)}</span>
              </a>
            ))}
          </nav>
        </div>
      )
    case 'topNav':
      return (
        <header className="pr-topnav">
          <strong className="pr-topnav__brand">{s(p.brand, 'Acme')}</strong>
          <nav aria-label="Site">
            {arr<string>(p.links).map((l, i) => (
              <a key={i} href="#" onClick={(e) => e.preventDefault()}>
                {s(l)}
              </a>
            ))}
          </nav>
          {p.cta ? <Button size="sm">{s(p.cta)}</Button> : <span />}
        </header>
      )
    case 'pageHeader':
      return (
        <header className="pr-pagehead">
          <div>
            {p.eyebrow ? <p className="pr-eyebrow">{s(p.eyebrow)}</p> : null}
            <h1 className="pr-h pr-h--1">{s(p.title)}</h1>
            {p.subtitle ? <p className="pr-text">{s(p.subtitle)}</p> : null}
          </div>
          {node.children?.length ? <div className="pr-pagehead__actions">{kids(node, path)}</div> : null}
        </header>
      )
    case 'section':
      return (
        <section className="pr-section">
          {p.title ? <h2 className="pr-h pr-h--3">{s(p.title)}</h2> : null}
          {p.subtitle ? <p className="pr-text">{s(p.subtitle)}</p> : null}
          {kids(node, path)}
        </section>
      )
    /* ------------------------------------------------------------- text */
    case 'heading': {
      const level = Math.min(4, Math.max(1, n(p.level, 2)))
      const Tag = `h${level}` as 'h1'
      return <Tag className={`pr-h pr-h--${level}`}>{s(p.text) || kids(node, path)}</Tag>
    }
    case 'text':
      return (
        <p className="pr-text" data-tone={oneOf(p.tone, ['primary', 'secondary', 'tertiary'] as const, 'secondary')} data-size={oneOf(p.size, ['sm', 'md', 'lg'] as const, 'md')} data-strong={p.strong ? 'true' : undefined} style={{ textAlign: p.align === 'center' ? 'center' : undefined }}>
          {s(p.text) || kids(node, path)}
        </p>
      )
    case 'link':
      return (
        <a className="pr-link" href="#" onClick={(e) => e.preventDefault()}>
          {s(p.text)}
        </a>
      )
    case 'icon':
      return <span className="pr-icon" data-tone={oneOf(p.tone, ['primary', 'secondary', 'accent', 'success', 'warning', 'error'] as const, 'secondary')}>{icon(p.name)}</span>
    /* ------------------------------------------------------- components */
    case 'button':
      return (
        <Button
          variant={oneOf<ButtonType>(p.variant, ['primary', 'secondary', 'outline', 'ghost'], 'primary')}
          size={oneOf<ButtonSize>(p.size, ['sm', 'md', 'lg'], 'md')}
          destructive={Boolean(p.destructive)}
          leadIcon={icon(p.icon) ?? undefined}
          trailIcon={icon(p.trailIcon) ?? undefined}
        >
          {s(p.label, 'Button')}
        </Button>
      )
    case 'iconButton':
      return <IconButton label={s(p.label, s(p.icon, 'Action'))} icon={icon(p.icon) ?? icon('sparkle')} variant={oneOf<ButtonType>(p.variant, ['primary', 'secondary', 'outline', 'ghost'], 'ghost')} size={oneOf<ButtonSize>(p.size, ['sm', 'md', 'lg'], 'md')} />
    case 'input': {
      const control = <Input placeholder={s(p.placeholder)} type={oneOf(p.type, ['text', 'email', 'password', 'search'] as const, 'text')} showIcon={Boolean(p.search) || p.type === 'search'} aria-label={p.label ? undefined : s(p.placeholder, 'Search')} />
      return p.label ? (
        <Field label={s(p.label)} description={p.description ? s(p.description) : undefined}>
          {control}
        </Field>
      ) : (
        <div className="pr-bare">{control}</div>
      )
    }
    case 'select': {
      const options = arr<unknown>(p.options).map((o) => s(o)).filter(Boolean)
      return (
        <Field label={s(p.label, 'Choose')}>
          <Select.Root defaultValue={p.value ? s(p.value) : undefined}>
            <Select.Trigger placeholder={s(p.placeholder, 'Select…')} />
            <Select.Popup>
              {options.map((o) => (
                <Select.Item key={o} value={o}>
                  {o}
                </Select.Item>
              ))}
            </Select.Popup>
          </Select.Root>
        </Field>
      )
    }
    case 'checkbox':
      return <Checkbox defaultChecked={Boolean(p.checked)}>{s(p.label)}</Checkbox>
    case 'switch':
      return <Switch defaultChecked={Boolean(p.checked)}>{s(p.label)}</Switch>
    case 'radioGroup': {
      const options = arr<unknown>(p.options).map((o) => s(o)).filter(Boolean)
      return (
        <RadioGroup label={s(p.label, 'Options')} defaultValue={s(p.value, options[0])}>
          {options.map((o) => (
            <Radio key={o} value={o}>
              {o}
            </Radio>
          ))}
        </RadioGroup>
      )
    }
    case 'badge':
      return <Badge type={oneOf<BadgeType>(p.tone, ['neutral', 'info', 'success', 'warning', 'error'], 'neutral')}>{s(p.label)}</Badge>
    case 'avatar':
      return <Avatar size={oneOf(p.size, ['sm', 'md', 'lg'] as const, 'md')} initials={s(p.initials, 'AB').slice(0, 2)} />
    case 'card':
      return (
        <Card type={p.elevated ? 'elevated' : 'outline'} title={p.title ? s(p.title) : undefined} description={p.description ? s(p.description) : undefined} headingLevel={3}>
          {node.children?.length ? <div className="pr-card-body">{kids(node, path)}</div> : null}
        </Card>
      )
    case 'tabs': {
      const items = arr<unknown>(p.items).map((o) => s(o)).filter(Boolean)
      const value = s(p.value, items[0])
      return (
        <Tabs.Root defaultValue={value}>
          <Tabs.List>
            {items.map((it) => (
              <Tabs.Tab key={it} value={it}>
                {it}
              </Tabs.Tab>
            ))}
          </Tabs.List>
          {items.map((it) => (
            <Tabs.Panel key={it} value={it}>
              {it === value ? <div className="pr-tabpanel">{kids(node, path)}</div> : <p className="pr-text">{it}</p>}
            </Tabs.Panel>
          ))}
        </Tabs.Root>
      )
    }
    case 'progress':
      return <Progress label={s(p.label)} value={Math.min(100, Math.max(0, n(p.value, 50)))} />
    case 'meter':
      return <Meter label={s(p.label)} value={Math.min(100, Math.max(0, n(p.value, 50)))} />
    case 'separator':
      return <Separator />
    case 'breadcrumb': {
      const items = arr<unknown>(p.items).map((o) => s(o))
      return (
        <Breadcrumb.Root>
          {items.map((it, i) => (
            <Breadcrumb.Item key={i} href="#" current={i === items.length - 1} onClick={(e) => e.preventDefault()}>
              {it}
            </Breadcrumb.Item>
          ))}
        </Breadcrumb.Root>
      )
    }
    case 'pagination':
      return <Pagination pageCount={Math.max(1, n(p.pageCount, 5))} defaultPage={Math.max(1, n(p.page, 1))} />
    case 'emptyState':
      return <EmptyState icon={icon(p.icon) ?? icon('folder')} title={s(p.title, 'Nothing here yet')} description={p.description ? s(p.description) : undefined} actions={node.children?.length ? <>{kids(node, path)}</> : undefined} />
    case 'skeleton':
      return <Skeleton shape={oneOf<SkeletonShape>(p.shape, ['text', 'circle', 'block'], 'text')} width={p.width as CSSProperties['width']} height={p.height as CSSProperties['height']} />
    /* --------------------------------------------------------- patterns */
    case 'alert':
      return (
        <div className="pr-alert" data-tone={oneOf(p.tone, ['info', 'success', 'warning', 'error'] as const, 'info')} role="status">
          {icon({ info: 'info', success: 'check', warning: 'warning', error: 'warning' }[oneOf(p.tone, ['info', 'success', 'warning', 'error'] as const, 'info')])}
          <span>
            {p.title ? <strong>{s(p.title)}</strong> : null}
            {p.text ? <span>{s(p.text)}</span> : null}
          </span>
        </div>
      )
    case 'stat':
      return (
        <div className="pr-stat">
          <p className="pr-stat__label">{s(p.label)}</p>
          <p className="pr-stat__value">{s(p.value)}</p>
          {p.delta ? (
            <p className="pr-stat__delta" data-trend={p.trend === 'down' ? 'down' : 'up'}>
              {s(p.delta)}
            </p>
          ) : null}
        </div>
      )
    case 'table': {
      const cols = arr<unknown>(p.columns).map((c) => s(c))
      return (
        <div className="pr-table-wrap">
          <table className="pr-table">
            <thead>
              <tr>
                {cols.map((c, i) => (
                  <th key={i} scope="col">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {arr<unknown[]>(p.rows).map((row, r) => (
                <tr key={r}>
                  {arr<unknown>(row).map((cell, c) => (
                    <td key={c}>
                      <Cell cell={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }
    case 'chart':
      return <Chart kind={p.kind === 'line' ? 'line' : 'bar'} values={arr<number>(p.values).filter((v) => typeof v === 'number')} labels={arr<unknown>(p.labels).map((l) => s(l))} height={Math.min(360, Math.max(80, n(p.height, 160)))} />
    case 'list':
      return (
        <ul className="pr-list">
          {arr<Record<string, unknown>>(p.items).map((it, i) => (
            <li key={i}>
              {it.initials ? <Avatar size="sm" initials={s(it.initials).slice(0, 2)} /> : null}
              <span className="pr-list__text">
                <strong>{s(it.title)}</strong>
                {it.subtitle ? <span>{s(it.subtitle)}</span> : null}
              </span>
              {it.meta ? <span className="pr-list__meta">{s(it.meta)}</span> : null}
            </li>
          ))}
        </ul>
      )
    case 'image':
      return (
        <div className="pr-image" style={{ aspectRatio: s(p.ratio, '16:9').replace(':', ' / ') }} role="img" aria-label={s(p.label, 'Image')}>
          {icon('camera')}
          <span>{s(p.label)}</span>
        </div>
      )
    default:
      return (
        <div className="pr-unknown">
          Unknown block “{node.type}”
          {node.children?.length ? <Fragment>{kids(node, path)}</Fragment> : null}
        </div>
      )
  }
}

/** Renders a screen tree inside the themed canvas. */
export function ScreenRenderer({ tree }: { tree: UiNode | null }) {
  if (!tree) return null
  return (
    <div className="pr-screen">
      <Node node={tree} path="0" />
    </div>
  )
}
