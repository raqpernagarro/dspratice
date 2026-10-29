import { ArrowRight, FileArrowUp, RocketLaunch } from '@phosphor-icons/react'
import { useState } from 'react'

import { Avatar } from '../../../stories/base-ui/components/avatar/Avatar'
import { Badge } from '../../../stories/base-ui/components/badge/Badge'
import { Button } from '../../../stories/base-ui/components/button/Button'
import { Field } from '../../../stories/base-ui/components/field/Field'
import { Input } from '../../../stories/base-ui/components/input/Input'
import { Progress } from '../../../stories/base-ui/components/progress/Progress'
import { Switch } from '../../../stories/base-ui/components/switch/Switch'
import { Tabs } from '../../../stories/base-ui/components/tabs/Tabs'
import { currentVersion } from '../../../stories/base-ui/tokens/project-file'
import { SPECS } from '../../../stories/base-ui/spec'
import { Markdown } from '../agent/Markdown'
import { appType } from '../app/appTypes'
import { useProject } from '../app/AppContext'
import { useSemanticEditor } from '../context/SemanticEditorContext'
import { DOC_PAGES, SECTIONS } from '../docs/catalog'
import { primaryFamily, tv, useTokens } from '../showcase/useThemeVars'
import { fill, writtenPage } from './pages'

const SECTION_BLURB: Record<string, string> = {
  'Get started': 'What is in the system and how to install it.',
  Foundations: 'Color, type, spacing and icons, live in this theme.',
  Tokens: 'How tokens are named, and every value.',
  Components: 'Guidance, live examples and code.',
  Patterns: 'Forms, states and example screens.',
  Content: 'Tone of voice and writing guidelines.',
  'Best practices': 'Accessibility and theming rules.',
}

/** Splits the Principles page into "### Title + paragraph" cards. */
function principleCards(md: string): { title: string; text: string }[] {
  return md
    .split(/\n(?=###\s)/)
    .filter((b) => b.startsWith('### '))
    .map((b) => {
      const [head, ...rest] = b.split('\n')
      return { title: head.replace(/^###\s+/, ''), text: rest.join(' ').trim() }
    })
}

export interface Welcome {
  onSetUp: () => void
  onImport: () => void
}

/** Shown while the repo still runs the starter system: the way to make it this team's own. */
function WelcomeCard({ onSetUp, onImport }: Welcome) {
  return (
    <section className="site-welcome" aria-labelledby="welcome-title">
      <div>
        <p className="site-welcome__eyebrow">Welcome</p>
        <h2 id="welcome-title">This is the starter system. Set it up as yours.</h2>
        <p>
          Name it, say who it’s for and pick a starting look. Then ship it: this site becomes your system’s docs. Already have one, from the configurator or in Figma? Import its file.
        </p>
      </div>
      <div className="site-welcome__actions">
        <button type="button" className="site-welcome__btn" onClick={onSetUp}>
          <RocketLaunch size={16} weight="bold" /> Set up system
        </button>
        <button type="button" className="site-welcome__btn site-welcome__btn--ghost" onClick={onImport}>
          <FileArrowUp size={16} weight="bold" /> Import a file
        </button>
      </div>
    </section>
  )
}

const SWATCHES = [
  { token: 'color/background/interactive/primary/default', name: 'Primary' },
  { token: 'color/foreground/interactive/default', name: 'Accent' },
  { token: 'color/background/inverted/primary', name: 'Ink' },
  { token: 'color/background/neutral/tertiary', name: 'Surface' },
]
const STATUS = ['success', 'warning', 'error', 'info'] as const

/** The hero's picture of the system: its components, type and colors, together and live. */
function SystemBoard() {
  const t = useTokens()
  const [digest, setDigest] = useState(true)
  const [tab, setTab] = useState('profile')
  const heading = primaryFamily(t('font/family/secondary') || t('font/family/primary'))
  const body = primaryFamily(t('font/family/primary'))
  return (
    <div className="site-board" aria-label="This system at a glance">
      <div className="board-card board-ui">
        <div className="board-ui__person">
          <Avatar initials="LT" alt="" />
          <div>
            <strong>Lena Torres</strong>
            <span>Designer</span>
          </div>
          <Badge type="success" size="sm">
            Active
          </Badge>
        </div>
        <Tabs.Root size="sm" value={tab} onValueChange={(v) => setTab(String(v))}>
          <Tabs.List>
            <Tabs.Tab value="profile">Profile</Tabs.Tab>
            <Tabs.Tab value="alerts">Notifications</Tabs.Tab>
          </Tabs.List>
        </Tabs.Root>
        <Field label="Display name">
          <Input defaultValue="Lena Torres" showIcon={false} />
        </Field>
        <Switch checked={digest} onCheckedChange={setDigest}>
          Weekly digest
        </Switch>
        <Progress label="Profile complete" value={72} />
        <div className="board-ui__actions">
          <Button size="sm" variant="ghost">
            Cancel
          </Button>
          <Button size="sm">Save changes</Button>
        </div>
      </div>
      <div className="board-card board-type">
        <span className="board-label">Type</span>
        <strong className="board-type__aa" aria-hidden="true">
          Aa
        </strong>
        <dl>
          <div>
            <dt>Headings</dt>
            <dd>{heading}</dd>
          </div>
          {body !== heading ? (
            <div>
              <dt>Text</dt>
              <dd>{body}</dd>
            </div>
          ) : null}
        </dl>
      </div>
      <div className="board-card board-color">
        <span className="board-label">Color</span>
        <div className="board-color__main">
          {SWATCHES.map((s) => (
            <span key={s.name} title={s.name} style={{ background: tv(s.token) }} />
          ))}
        </div>
        <div className="board-color__status">
          {STATUS.map((k) => (
            <span key={k} title={k} style={{ background: tv(`color/foreground/${k}`) }} />
          ))}
        </div>
      </div>
    </div>
  )
}

/** The system's front page: what it is, live components, principles, where to go next. */
export function SiteHome({ onOpenDoc, onOpenComponents, welcome }: { onOpenDoc: (id: string) => void; onOpenComponents: () => void; welcome?: Welcome }) {
  const { doc } = useProject()
  const { theme } = useSemanticEditor()
  // In a multi-brand system, Home speaks for the brand being viewed.
  const brand = theme.brands.length ? (theme.brands.find((b) => b.id === theme.brand) ?? theme.brands[0]) : null
  const t = appType((brand?.appType ?? doc.info.appType) as typeof doc.info.appType)
  const description = brand?.description || doc.info.description
  const ctx = { name: doc.info.name, product: t.name.toLowerCase(), description }
  const principles = principleCards(doc.pages.principles ?? fill(writtenPage('principles')!.sample(ctx), ctx))
  const version = currentVersion(doc.versions)
  const latest = doc.versions[0]

  return (
    <div className="site-home">
      {welcome ? <WelcomeCard {...welcome} /> : null}
      <section className="site-hero">
        <div className="site-hero__text">
          <span className="site-pill">
            {t.name} design system · {doc.versions.length ? `v${version}` : 'starter'}
          </span>
          <h1>{doc.info.name}</h1>
          {brand ? <p className="site-hero__brand">{brand.name}</p> : null}
          <p>{description || `The design system behind our ${t.name.toLowerCase()}: ${SPECS.length} components, the tokens that style them, and the guidance that keeps every screen consistent.`}</p>
          <div className="site-hero__actions">
            <Button size="lg" onClick={() => onOpenDoc('introduction')} trailIcon={<ArrowRight weight="bold" />}>
              Read the docs
            </Button>
            <Button size="lg" variant="secondary" onClick={() => onOpenDoc('installation')}>
              Install
            </Button>
          </div>
        </div>
        <SystemBoard />
      </section>

      {principles.length ? (
        <section className="site-section">
          <header>
            <h2>Principles</h2>
            <button type="button" className="doc-link" onClick={() => onOpenDoc('principles')}>
              Read more
            </button>
          </header>
          <div className="site-principles">
            {principles.map((p) => (
              <div key={p.title}>
                <h3>{p.title}</h3>
                <Markdown text={p.text} />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="site-section">
        <header>
          <h2>Explore the system</h2>
        </header>
        <div className="site-tiles">
          {SECTIONS.map((section) => {
            const first = DOC_PAGES.find((p) => p.section === section)
            const count = DOC_PAGES.filter((p) => p.section === section).length
            return first ? (
              <button key={section} type="button" className="site-tile" onClick={() => (first.kind === 'component' ? onOpenComponents() : onOpenDoc(first.id))}>
                <small>{count} page{count === 1 ? '' : 's'}</small>
                <strong>{section}</strong>
                <span>{SECTION_BLURB[section]}</span>
              </button>
            ) : null
          })}
        </div>
      </section>

      {latest ? (
        <section className="site-section site-latest">
          <div>
            <small>Latest version</small>
            <strong>v{latest.version}</strong>
            <span>{latest.note}</span>
          </div>
          <button type="button" className="doc-link" onClick={() => onOpenDoc('changelog')}>
            See all versions
          </button>
        </section>
      ) : null}
    </div>
  )
}
