import { CaretDown, Copy, DotsThree, FigmaLogo, FolderSimple, GithubLogo, Link, Lock, Star } from '@phosphor-icons/react'
import type { ReactNode } from 'react'

import type { AppTypeId } from '../../../stories/base-ui/tokens/project-file'

/**
 * Drawn "screenshots" for the "Set up system" steps. They are stylised on purpose: they show where to click
 * without going stale when GitHub or Figma change their UI, and they work offline.
 */

function Callout({ n, children, className = '' }: { n: number; children: ReactNode; className?: string }) {
  return (
    <span className={`ill-callout ${className}`}>
      <b>{n}</b>
      <span>{children}</span>
    </span>
  )
}

/** Wireframe thumbnail of a product type. */
export function AppTypeThumb({ id, large = false }: { id: AppTypeId; large?: boolean }) {
  const w = 160
  const h = 100
  const L = 'var(--ill-line)'
  const F = 'var(--ill-fill)'
  const A = 'var(--ill-accent)'
  const box = (x: number, y: number, bw: number, bh: number, fill = F, r = 3, key?: number) => <rect key={key} x={x} y={y} width={bw} height={bh} rx={r} fill={fill} />
  const bars = (x: number, y: number, n: number, bw: number, maxH: number) =>
    Array.from({ length: n }, (_, i) => {
      const bh = maxH * (0.35 + ((i * 37) % 60) / 100)
      return <rect key={i} x={x + i * (bw + 3)} y={y + maxH - bh} width={bw} height={bh} rx={1.5} fill={i === n - 2 ? A : L} />
    })
  const shapes: Record<AppTypeId, ReactNode> = {
    dashboard: (
      <>
        {box(0, 0, 30, h, L, 0)}
        {box(38, 8, 34, 18)}
        {box(78, 8, 34, 18)}
        {box(118, 8, 34, 18)}
        {box(38, 32, 114, 40)}
        {bars(46, 38, 12, 6, 28)}
        {box(38, 78, 114, 14)}
      </>
    ),
    admin: (
      <>
        {box(0, 0, 30, h, L, 0)}
        {box(38, 8, 60, 8)}
        {box(124, 6, 28, 12, A)}
        {Array.from({ length: 6 }, (_, i) => (
          <g key={i}>
            {box(38, 24 + i * 12, 114, 9, i === 0 ? L : F, 2)}
            <circle cx={44} cy={28.5 + i * 12} r={2.5} fill={i ? L : F} />
          </g>
        ))}
      </>
    ),
    marketing: (
      <>
        {box(8, 6, 144, 8, F, 2)}
        {box(30, 24, 100, 10, L)}
        {box(45, 38, 70, 5, F)}
        {box(62, 48, 36, 10, A, 5)}
        {box(8, 66, 44, 28)}
        {box(58, 66, 44, 28)}
        {box(108, 66, 44, 28)}
      </>
    ),
    ecommerce: (
      <>
        {box(8, 6, 144, 8, F, 2)}
        {box(8, 20, 30, 74, F)}
        {[0, 1, 2].map((c) =>
          [0, 1].map((r) => (
            <g key={`${c}${r}`}>
              {box(44 + c * 37, 20 + r * 38, 33, 24, L)}
              {box(44 + c * 37, 46 + r * 38, 20, 4, F)}
              {box(68 + c * 37, 46 + r * 38, 9, 4, A, 2)}
            </g>
          )),
        )}
      </>
    ),
    'internal-tool': (
      <>
        {box(8, 6, 144, 8, F, 2)}
        {box(30, 22, 100, 72, F)}
        {[0, 1, 2].map((i) => (
          <g key={i}>
            {box(38, 30 + i * 17, 30, 3, L)}
            {box(38, 35 + i * 17, 84, 8, L)}
          </g>
        ))}
        {box(92, 82, 30, 8, A, 4)}
      </>
    ),
    content: (
      <>
        {box(8, 6, 144, 8, F, 2)}
        {box(8, 22, 30, 72, F)}
        {box(46, 22, 70, 9, L)}
        {Array.from({ length: 7 }, (_, i) => box(46, 36 + i * 8, i === 6 ? 50 : 70, 3, F, 1.5, i))}
        {box(122, 22, 30, 40, F)}
      </>
    ),
    mobile: (
      <>
        <rect x={52} y={2} width={56} height={96} rx={9} fill={F} />
        {box(58, 10, 44, 6, L)}
        {box(58, 22, 44, 26, L)}
        {box(58, 52, 44, 26, L)}
        {box(52, 84, 56, 14, L, 0)}
        <circle cx={68} cy={91} r={2.5} fill={A} />
        <circle cx={80} cy={91} r={2.5} fill={F} />
        <circle cx={92} cy={91} r={2.5} fill={F} />
      </>
    ),
  }
  return (
    <svg className={`ill-thumb${large ? ' ill-thumb--large' : ''}`} viewBox={`0 0 ${w} ${h}`} role="img" aria-hidden="true">
      {shapes[id]}
    </svg>
  )
}

/** The site's header and hero, live with the name and line being typed. */
export function SitePreview({ name, description }: { name: string; description: string }) {
  const title = name.trim() || 'Your design system'
  const initials = title
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return (
    <div className="ill-window">
      <div className="ill-site-head">
        <i>{initials}</i>
        <strong>{title}</strong>
        <span>Home</span>
        <span>Docs</span>
      </div>
      <div className="ill-window__body ill-site-hero">
        <strong>{title}</strong>
        <span>{description.trim() || 'Components, tokens and guidance in one place.'}</span>
        <div>
          <em>Read the docs</em>
          <em className="is-ghost">Install</em>
        </div>
      </div>
    </div>
  )
}

/** The system's brands as stacked cards, the main one in front. */
export function BrandsPreview({ names, note = 'Own colors, fonts and shape' }: { names: string[]; note?: string }) {
  return (
    <div className="ill-brands">
      {names.map((n, i) => (
        <div key={i} className="ill-brand" style={{ ['--i' as string]: i, ['--hue' as string]: (250 + i * 70) % 360 }}>
          <i />
          <strong>{n}</strong>
          <span>{i === 0 ? (names.length > 1 ? 'Main brand' : 'One brand') : note}</span>
        </div>
      ))}
    </div>
  )
}

/** The system's modes side by side, the base one marked. */
export function ModesPreview({ modes, secondSeparate = false }: { modes: ('light' | 'dark')[]; secondSeparate?: boolean }) {
  return (
    <div className="ill-modes">
      {modes.map((m, i) => (
        <div key={m} className={`ill-mode ill-mode--${m}`}>
          <div className="ill-mode__bar">
            <i />
            <span>{m === 'light' ? 'Light' : 'Dark'}</span>
            {modes.length > 1 ? <em>{i === 0 ? 'Designed first' : secondSeparate ? 'Own colors' : 'Follows automatically'}</em> : null}
          </div>
          <div className="ill-mode__body">
            <b />
            <span />
            <span />
            <div>
              <u />
              <u />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/** GitHub: the template repo → "Use this template" → create → copy the URL. */
export function GitHubIllustration() {
  return (
    <div className="ill-stack">
      <div className="ill-window">
        <div className="ill-bar">
          <GithubLogo size={14} weight="fill" /> github.com/nagarro-dv/ds-starter-pack
        </div>
        <div className="ill-window__body">
          <div className="ill-gh-head">
            <span className="ill-gh-repo">
              <FolderSimple size={14} /> nagarro-dv / <b>ds-starter-pack</b>
              <span className="ill-pill">Template</span>
            </span>
            <span className="ill-gh-actions">
              <span className="ill-btn">
                <Star size={11} /> Star
              </span>
              <span className="ill-btn ill-btn--green is-target">
                Use this template <CaretDown size={10} weight="bold" />
              </span>
            </span>
          </div>
          <div className="ill-lines">
            <i />
            <i />
            <i />
          </div>
          <Callout n={1} className="ill-callout--tr">
            Click <b>Use this template</b>, then <b>Create a new repository</b>
          </Callout>
        </div>
      </div>
      <div className="ill-window ill-window--offset">
        <div className="ill-window__body">
          <p className="ill-title">Create a new repository</p>
          <div className="ill-form">
            <span className="ill-field">
              <small>Owner</small>
              your-team <CaretDown size={10} />
            </span>
            <span className="ill-field is-target">
              <small>Repository name</small>
              acme-design-system
            </span>
          </div>
          <span className="ill-radio">
            <Lock size={11} weight="fill" /> Private
          </span>
          <span className="ill-btn ill-btn--green">Create repository</span>
          <Callout n={2} className="ill-callout--r">
            Name it after your product. Private is fine.
          </Callout>
        </div>
      </div>
      <div className="ill-window ill-window--offset2">
        <div className="ill-bar is-target">
          <Link size={12} /> github.com/your-team/acme-design-system
          <Copy size={12} />
        </div>
        <Callout n={3} className="ill-callout--b">
          Copy the address from the browser bar and paste it here
        </Callout>
      </div>
    </div>
  )
}

/** Figma: duplicate the starter file → move it to your team → copy link. */
export function FigmaIllustration() {
  return (
    <div className="ill-stack">
      <div className="ill-window">
        <div className="ill-bar">
          <FigmaLogo size={14} weight="fill" /> Figma · Drafts
        </div>
        <div className="ill-window__body ill-figma">
          <div className="ill-file">
            <div className="ill-file__thumb" />
            <span>
              DS Starter Pack <DotsThree size={14} weight="bold" />
            </span>
          </div>
          <div className="ill-menu">
            <span>Open in new tab</span>
            <span className="is-target">Duplicate</span>
            <span>Move to project…</span>
            <span>Copy link</span>
          </div>
          <Callout n={1} className="ill-callout--tr">
            Right-click the starter file and choose <b>Duplicate</b>
          </Callout>
        </div>
      </div>
      <div className="ill-window ill-window--offset">
        <div className="ill-window__body ill-figma">
          <div className="ill-file">
            <div className="ill-file__thumb ill-file__thumb--new" />
            <span>Acme design system</span>
          </div>
          <div className="ill-menu">
            <span>Rename</span>
            <span className="is-target">Move to project…</span>
          </div>
          <Callout n={2} className="ill-callout--r">
            Rename the copy and move it to your team’s project
          </Callout>
        </div>
      </div>
      <div className="ill-window ill-window--offset2">
        <div className="ill-window__body ill-share">
          <span className="ill-btn ill-btn--blue">Share</span>
          <span className="ill-btn is-target">
            <Link size={11} /> Copy link
          </span>
        </div>
        <Callout n={3} className="ill-callout--b">
          Open the file, click <b>Share</b>, then <b>Copy link</b>
        </Callout>
      </div>
    </div>
  )
}

/** The DS Configurator plugin in Figma: where the downloaded changes go. */
export function PluginIllustration({ fileName }: { fileName: string }) {
  return (
    <div className="ill-stack">
      <div className="ill-window">
        <div className="ill-bar">
          <FigmaLogo size={14} weight="fill" /> Figma · {fileName}
        </div>
        <div className="ill-window__body ill-figma">
          <div className="ill-menu">
            <span>Plugins</span>
            <span>Development ›</span>
            <span className="is-target">DS Configurator</span>
          </div>
          <Callout n={1} className="ill-callout--tr">
            In your Figma file, open <b>Plugins → Development → DS Configurator</b>
          </Callout>
        </div>
      </div>
      <div className="ill-window ill-window--offset">
        <div className="ill-window__body ill-figma">
          <div className="ill-menu">
            <span>Export variables</span>
            <span className="is-target">Import changes</span>
          </div>
          <Callout n={2} className="ill-callout--r">
            Choose <b>Import changes</b> and drop in the file you downloaded
          </Callout>
        </div>
      </div>
      <div className="ill-window ill-window--offset2">
        <div className="ill-window__body ill-share">
          <span className="ill-btn">Review</span>
          <span className="ill-btn ill-btn--blue is-target">Apply</span>
        </div>
        <Callout n={3} className="ill-callout--b">
          Check the list of changes, then <b>Apply</b>
        </Callout>
      </div>
    </div>
  )
}
