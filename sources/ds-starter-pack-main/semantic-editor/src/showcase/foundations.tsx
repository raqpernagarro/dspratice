import {
  Bell,
  ChartLineUp,
  Gear,
  Heart,
  House,
  Lightning,
  MagnifyingGlass,
  Star,
  User,
  type Icon,
} from '@phosphor-icons/react'

import { useSemanticEditor } from '../context/SemanticEditorContext'
import { contrastRatio, toHex } from '../lib/color'
import { primaryFamily, tv, useTokens } from './useThemeVars'

/* --------------------------------------------------------------------- Color */

type Swatch = [label: string, path: string]

const COLOR_GROUPS: { label: string; items: Swatch[] }[] = [
  {
    label: 'Surfaces',
    items: [
      ['Page', 'color/background/neutral/primary'],
      ['Recessed', 'color/background/neutral/secondary'],
      ['Recessed 3', 'color/background/neutral/tertiary'],
      ['Surface low', 'color/background/surface/low'],
      ['Surface medium', 'color/background/surface/medium'],
      ['Surface high', 'color/background/surface/high'],
      ['Inverted', 'color/background/inverted/primary'],
    ],
  },
  {
    label: 'Content',
    items: [
      ['Text', 'color/foreground/neutral/primary'],
      ['Text 2', 'color/foreground/neutral/secondary'],
      ['Text 3', 'color/foreground/neutral/tertiary'],
      ['Accent', 'color/foreground/accent'],
      ['Link', 'color/foreground/interactive/default'],
    ],
  },
  {
    label: 'Actions',
    items: [
      ['Primary', 'color/background/interactive/primary/default'],
      ['Secondary', 'color/background/interactive/secondary/default'],
      ['Subtle hover', 'color/background/interactive/subtle/hover'],
      ['Accent fill', 'color/background/accent/default'],
      ['Danger', 'color/background/interactive/danger/default'],
      ['Disabled', 'color/background/interactive/disabled'],
    ],
  },
  {
    label: 'Borders',
    items: [
      ['Subtle', 'color/border/neutral/subtle'],
      ['Regular', 'color/border/neutral/regular'],
      ['Strong', 'color/border/neutral/strong'],
      ['Control', 'color/border/interactive/default'],
      ['Selected', 'color/border/interactive/selected'],
    ],
  },
]

export function ColorFoundation() {
  const { theme } = useSemanticEditor()
  const t = useTokens()
  const groups = COLOR_GROUPS.map((g) => ({
    ...g,
    items: theme.color.tertiary ? g.items : g.items.filter(([, p]) => !p.endsWith('/tertiary')),
  }))

  return (
    <div className="sc-color">
      {groups.map((group) => (
        <section key={group.label} className="sc-color__group">
          <h4 className="sc-label">{group.label}</h4>
          <ul className="sc-color__swatches">
            {group.items.map(([name, path]) => (
              <li key={path} className="sc-swatch" title={path}>
                <span className="sc-swatch__chip" style={{ background: tv(path) }} />
                <span className="sc-swatch__name">{name}</span>
                <code className="sc-swatch__value">{toHex(t(path) || 'transparent')}</code>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <footer className="sc-color__contrast">
        <ContrastPill label="Text on page" fg={t('color/foreground/neutral/primary')} bg={t('color/background/neutral/primary')} />
        <ContrastPill
          label="Label on primary"
          fg={t('color/foreground/on-interactive/primary')}
          bg={t('color/background/interactive/primary/default')}
        />
        <ContrastPill label="Label on accent" fg={t('color/foreground/on-accent/primary')} bg={t('color/background/accent/default')} />
      </footer>
    </div>
  )
}

function ContrastPill({ label, fg, bg }: { label: string; fg: string; bg: string }) {
  if (!fg || !bg) return null
  const ratio = contrastRatio(fg, bg)
  const grade = ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : ratio >= 3 ? 'AA large' : 'Fail'
  return (
    <span className={`sc-pill${grade === 'Fail' ? ' sc-pill--bad' : ''}`}>
      {label}
      <strong>{ratio.toFixed(2)}:1</strong>
      <span>{grade}</span>
    </span>
  )
}

/* ---------------------------------------------------------------- Typography */

const TYPE_ROWS: { name: string; size: string; lh: string; weight: string; text: string }[] = [
  { name: 'Heading XL', size: 'heading/xl', lh: 'heading/xl', weight: 'heading/strong', text: 'Design at token speed' },
  { name: 'Heading LG', size: 'heading/lg', lh: 'heading/lg', weight: 'heading/strong', text: 'One semantic layer' },
  { name: 'Heading MD', size: 'heading/md', lh: 'heading/md', weight: 'heading/strong', text: 'Every surface and label' },
  { name: 'Body LG', size: 'body/lg', lh: 'body/lg', weight: 'body/regular', text: 'Readable, consistent paragraphs for longer content.' },
  { name: 'Body MD', size: 'body/md', lh: 'body/md', weight: 'body/regular', text: 'Default text for interfaces, forms and descriptions.' },
  { name: 'Caption', size: 'caption/md', lh: 'caption/md', weight: 'body/regular', text: 'Captions, helper text and metadata' },
]

export function TypographyFoundation() {
  const t = useTokens()
  return (
    <div className="sc-type">
      <ul className="sc-type__rows">
        {TYPE_ROWS.map((row) => (
          <li key={row.name} className="sc-type__row">
            <span className="sc-type__meta">
              <span className="sc-label">{row.name}</span>
              <code>
                {t(`font/size/${row.size}`)} / {t(`font/line-height/${row.lh}`)}
              </code>
            </span>
            <span
              className="sc-type__sample"
              style={{
                fontFamily: tv(row.name.startsWith('Heading') ? 'font/family/secondary' : 'font/family/primary'),
                fontSize: tv(`font/size/${row.size}`),
                lineHeight: tv(`font/line-height/${row.lh}`),
                fontWeight: tv(`font/weight/${row.weight}`) as unknown as number,
              }}
            >
              {row.text}
            </span>
          </li>
        ))}
      </ul>
      <footer className="sc-type__foot">
        <span className="sc-chip">{primaryFamily(t('font/family/primary'))}</span>
        <span className="sc-chip">Regular {t('font/weight/body/regular')}</span>
        <span className="sc-chip">Strong {t('font/weight/heading/strong')}</span>
      </footer>
    </div>
  )
}

/* ------------------------------------------------------------------- Spacing */

const SPACE_STEPS = ['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl']

export function SpacingFoundation() {
  const t = useTokens()
  const max = Math.max(...SPACE_STEPS.map((s) => parseFloat(t(`space/${s}`)) || 0), 1)
  return (
    <ul className="sc-space">
      {SPACE_STEPS.map((s) => {
        const value = parseFloat(t(`space/${s}`)) || 0
        return (
          <li key={s} className="sc-space__row">
            <code className="sc-space__name">space/{s}</code>
            <span className="sc-space__track">
              <span className="sc-space__bar" style={{ width: `${(value / max) * 100}%` }} />
            </span>
            <code className="sc-space__value">{value}px</code>
          </li>
        )
      })}
    </ul>
  )
}

/* -------------------------------------------------------------------- Radius */

export function RadiusFoundation() {
  const t = useTokens()
  return (
    <ul className="sc-radius">
      {(['sm', 'md', 'lg', 'full'] as const).map((step) => (
        <li key={step}>
          <span className="sc-radius__shape" style={{ borderRadius: tv(`shape/radius/${step}`) }} />
          <span className="sc-label">{step}</span>
          <code>{t(`shape/radius/${step}`)}</code>
        </li>
      ))}
    </ul>
  )
}

/* ----------------------------------------------------------------- Elevation */

export function ElevationFoundation() {
  const t = useTokens()
  return (
    <ul className="sc-elevation">
      {(['low', 'medium', 'high'] as const).map((level) => (
        <li key={level} style={{ boxShadow: tv(`effect/shadow/elevation/${level}`), background: tv(`color/background/surface/${level}`) }}>
          <span className="sc-label">{level}</span>
          <code>
            y {t(`effect/shadow/elevation/${level}/offset-y`)} · blur {t(`effect/shadow/elevation/${level}/blur`)}
          </code>
        </li>
      ))}
    </ul>
  )
}

/* --------------------------------------------------------------------- Icons */

const ICON_SET: Icon[] = [House, MagnifyingGlass, Bell, User, Gear, Heart, Star, Lightning, ChartLineUp]

export function IconsFoundation() {
  const t = useTokens()
  const sizes = ['xs', 'sm', 'md'] as const
  return (
    <div className="sc-icons">
      <ul className="sc-icons__grid">
        {ICON_SET.map((IconCmp, i) => (
          <li key={i}>
            <IconCmp style={{ width: tv('size/sm'), height: tv('size/sm') }} />
          </li>
        ))}
      </ul>
      <ul className="sc-icons__sizes">
        {sizes.map((s) => (
          <li key={s}>
            <Star style={{ width: tv(`size/${s}`), height: tv(`size/${s}`) }} />
            <span className="sc-label">size/{s}</span>
            <code>{t(`size/${s}`)}</code>
          </li>
        ))}
      </ul>
    </div>
  )
}
