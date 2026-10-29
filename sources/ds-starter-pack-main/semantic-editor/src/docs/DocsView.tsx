import { ArrowSquareOut, PencilSimple, Sparkle } from '@phosphor-icons/react'
import { useEffect, useMemo, useState } from 'react'

import { SPECIMENS } from '../../../stories/base-ui/components/specimens'
import { tokensUsed, type ComponentSpec, type VariantValues } from '../../../stories/base-ui/spec'
import { figmaTokenToCssVar } from '../../../stories/base-ui/tokens/figma-css-var'
import { componentDocs } from '../agent/docsContext'
import { Markdown } from '../agent/Markdown'
import { appType } from '../app/appTypes'
import { useProject } from '../app/AppContext'
import { useShell } from '../app/ShellContext'
import { ThemeScope } from '../context/SemanticEditorContext'
import { DOC_PAGES, SECTIONS, type DocPage } from './catalog'
import { Changelog, FigmaSync, IconGrid, Installation, Naming, Screens, TokenReference } from './generated'
import { fill, writtenPage } from '../system/pages'
import { READONLY } from '../system/mode'

/* ----------------------------------------------------------- component page */

function defaults(spec: ComponentSpec): VariantValues {
  const v: VariantValues = {}
  for (const a of spec.axes) {
    const codes = a.values.map((x) => x.code)
    v[a.id] = codes.includes('md') ? 'md' : codes.includes('default') ? 'default' : codes.includes('false') ? 'false' : codes[0]
  }
  return v
}

function Playground({ spec }: { spec: ComponentSpec }) {
  const [values, setValues] = useState<VariantValues>(() => defaults(spec))
  const render = SPECIMENS[spec.slug]
  const exists = spec.exists ? spec.exists(values) : true
  if (!render) return null
  return (
    <div className="doc-play">
      <div className="doc-play__stage">{exists ? render(values) : <p className="doc-muted">This combination doesn’t exist in the system.</p>}</div>
      {spec.axes.length ? (
        <div className="doc-play__controls" aria-label="Variant">
          {spec.axes.map((a) => (
            <label key={a.id}>
              <span>{a.figma}</span>
              <select value={values[a.id]} onChange={(e) => setValues((v) => ({ ...v, [a.id]: e.target.value }))}>
                {a.values.map((x) => (
                  <option key={x.code} value={x.code}>
                    {x.figma}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function codeSnippet(name: string): string | null {
  const md = componentDocs(name)
  const m = md.match(/\*\*Code\*\*\s*```tsx\n([\s\S]*?)```/)
  return m ? m[1].trim() : null
}

function ComponentPage({ page }: { page: DocPage }) {
  const spec = page.spec!
  const { setAgentOpen } = useShell()
  const tokens = useMemo(() => tokensUsed(spec), [spec])
  const code = codeSnippet(spec.name)
  const Demo = page.demo
  const d = spec.docs
  return (
    <article className="doc-page">
      <header className="doc-hero">
        <p className="doc-eyebrow">{page.section}</p>
        <h1>{spec.name}</h1>
        <p className="doc-lede">{d?.summary}</p>
        <div className="doc-hero__actions">
          <button type="button" className="doc-ask" onClick={() => setAgentOpen(true)}>
            <Sparkle size={14} weight="fill" /> Ask about {spec.name}
          </button>
          {d?.baseUi ? (
            <a className="doc-link" href={d.baseUi} target="_blank" rel="noreferrer">
              Base UI reference <ArrowSquareOut size={12} />
            </a>
          ) : null}
        </div>
      </header>

      <section className="doc-section">
        <h2>Playground</h2>
        <Playground key={spec.slug} spec={spec} />
      </section>

      {Demo ? (
        <section className="doc-section">
          <h2>In use</h2>
          <div className="doc-demo">
            <Demo />
          </div>
        </section>
      ) : null}

      {d?.usage?.length || d?.dont?.length ? (
        <section className="doc-section">
          <h2>Usage</h2>
          <div className="doc-dodont">
            {d?.usage?.length ? (
              <div className="doc-do">
                <h3>Do</h3>
                <ul>
                  {d.usage.map((u) => (
                    <li key={u}>{u}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {d?.dont?.length ? (
              <div className="doc-dont">
                <h3>Don’t</h3>
                <ul>
                  {d.dont.map((u) => (
                    <li key={u}>{u}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {d?.accessibility?.length ? (
        <section className="doc-section">
          <h2>Accessibility</h2>
          <ul className="doc-list">
            {d.accessibility.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {code ? (
        <section className="doc-section">
          <h2>Code</h2>
          <Markdown text={'```\n' + code + '\n```'} />
        </section>
      ) : null}

      <section className="doc-section">
        <h2>Anatomy</h2>
        <table className="doc-table">
          <thead>
            <tr>
              <th scope="col">Part</th>
              <th scope="col">Base UI</th>
              <th scope="col">What it is</th>
            </tr>
          </thead>
          <tbody>
            {spec.parts.map((p) => (
              <tr key={p.id}>
                <td>
                  <code>{p.id}</code>
                </td>
                <td>{p.baseUi ?? '—'}</td>
                <td>{(p as { description?: string }).description ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {tokens.length ? (
        <section className="doc-section">
          <h2>Tokens</h2>
          <p className="doc-muted">The semantic tokens this component uses. Change them in Edit theme and every component that shares them follows.</p>
          <ul className="doc-tokens">
            {tokens.map((t) => {
              const css = figmaTokenToCssVar(t)
              return (
                <li key={t}>
                  {t.startsWith('color/') ? <i style={{ background: `var(${css})` }} aria-hidden="true" /> : null}
                  <code>{t}</code>
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}
    </article>
  )
}

/* ------------------------------------------------------------ other pages */

function FoundationPage({ page }: { page: DocPage }) {
  const { go } = useShell()
  return (
    <article className="doc-page">
      <header className="doc-hero">
        <p className="doc-eyebrow">Foundations</p>
        <h1>{page.title}</h1>
        <p className="doc-lede">{page.summary}</p>
        <div className="doc-hero__actions">
          <button type="button" className="doc-link" onClick={() => go('configure')}>
            Change it in Edit theme
          </button>
        </div>
      </header>
      {(page.tiles ?? []).map((t) => (
        <section key={t.title} className="doc-section">
          <h2>{t.title}</h2>
          <div className="doc-demo doc-demo--wide">
            <t.render />
          </div>
        </section>
      ))}
    </article>
  )
}

function WrittenPageView({ page }: { page: DocPage }) {
  const { doc } = useProject()
  const { editPage, setAgentOpen } = useShell()
  const w = writtenPage(page.id)!
  const custom = doc.pages[page.id]
  const t = appType(doc.info.appType)
  const ctx = { name: doc.info.name, product: t.name.toLowerCase(), description: doc.info.description }
  return (
    <article className="doc-page">
      <header className="doc-hero">
        <p className="doc-eyebrow">{page.section}</p>
        <h1>{page.title}</h1>
        <p className="doc-lede">{fill(w.summary, ctx)}</p>
        <div className="doc-byline">
          <span>
            {custom ? 'Written by' : 'Sample text · owned by'} <b>{w.owner}</b>
          </span>
          {editPage && !READONLY ? (
            <button type="button" className="doc-link" onClick={() => editPage(page.id)}>
              <PencilSimple size={13} /> Edit page
            </button>
          ) : null}
          <button type="button" className="doc-link" onClick={() => setAgentOpen(true)}>
            <Sparkle size={13} weight="fill" /> Ask about this
          </button>
        </div>
      </header>
      <div className="doc-prose">
        <Markdown text={custom ?? fill(w.sample(ctx), ctx)} />
      </div>
      {page.id === 'iconography' ? (
        <section className="doc-section">
          <h2>The icons in use</h2>
          <IconGrid />
        </section>
      ) : null}
    </article>
  )
}

const GENERATED_SOURCE: Record<string, string> = {
  installation: 'the repository settings',
  changelog: 'saved versions',
  naming: 'the token specification',
  reference: 'the theme',
  screens: 'saved prototypes',
  figma: 'the theme and saved screens',
}

function GeneratedPage({ page }: { page: DocPage }) {
  const body = { installation: <Installation />, figma: <FigmaSync />, changelog: <Changelog />, naming: <Naming />, reference: <TokenReference />, screens: <Screens /> }[page.id]
  return (
    <article className="doc-page">
      <header className="doc-hero">
        <p className="doc-eyebrow">{page.section}</p>
        <h1>{page.title}</h1>
        <p className="doc-lede">{page.summary}</p>
        <div className="doc-byline">
          <span>Generated from {GENERATED_SOURCE[page.id] ?? 'the system'}. It updates itself.</span>
        </div>
      </header>
      <div className="doc-prose">{body}</div>
    </article>
  )
}

/* ------------------------------------------------------------------- view */

interface DocsViewProps {
  /** "docs" holds guidance, foundations and tokens; "components" has every component, with an overview grid. */
  space: 'docs' | 'components'
  /** The page shown; in the Components space `null` is the overview. */
  page: string | null
  onPage: (id: string | null) => void
}

/** A component's default variant, live, as the picture on its overview card. */
function ComponentCard({ page, onOpen }: { page: DocPage; onOpen: () => void }) {
  const spec = page.spec!
  const render = SPECIMENS[spec.slug]
  const values = useMemo(() => defaults(spec), [spec])
  return (
    <div className="comp-card">
      {/* The specimen is a picture here: the whole card is one link to the page. */}
      <div className="comp-card__stage" inert>
        {render ? render(values) : <span className="comp-card__none">{spec.name}</span>}
      </div>
      <button type="button" className="comp-card__link" onClick={onOpen}>
        <strong>{spec.name}</strong>
        <span>{page.summary}</span>
      </button>
    </div>
  )
}

const groupSlug = (group: string) => group.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

function ComponentsOverview({ groups, onOpen }: { groups: [string, DocPage[]][]; onOpen: (id: string) => void }) {
  const count = groups.reduce((n, [, list]) => n + list.length, 0)
  return (
    <article className="comp-index">
      <header className="doc-hero">
        <p className="doc-eyebrow">Components</p>
        <h1>The component library</h1>
        <p className="doc-lede">{count} components, live in this theme. Each one has a playground, guidance, the tokens it uses and code.</p>
      </header>
      {groups.map(([group, list]) => (
        // Ids can't hold spaces ("Button & Actions"): a slug labels the section.
        <section key={group} className="comp-index__group" aria-labelledby={`comp-${groupSlug(group)}`}>
          <h2 id={`comp-${groupSlug(group)}`}>{group}</h2>
          <div className="comp-grid">
            {list.map((p) => (
              <ComponentCard key={p.id} page={p} onOpen={() => onOpen(p.id)} />
            ))}
          </div>
        </section>
      ))}
    </article>
  )
}

export function DocsView({ space, page: pageId, onPage }: DocsViewProps) {
  const { setTopicComponent } = useShell()
  const components = space === 'components'
  const pages = useMemo(() => DOC_PAGES.filter((p) => (p.kind === 'component') === components), [components])
  // An unknown page (a stale link, a renamed page) opens the space's start: the overview, or the first doc.
  const start = components ? null : pages[0]
  const page = pageId ? (pages.find((p) => p.id === pageId) ?? start) : start

  useEffect(() => {
    setTopicComponent(page?.kind === 'component' ? page.title : null)
    document.querySelector('.docs__main')?.scrollTo({ top: 0 })
  }, [page, setTopicComponent])
  useEffect(() => () => setTopicComponent(null), [setTopicComponent])

  const tree = useMemo(
    () =>
      SECTIONS.map((section) => {
        const inSection = pages.filter((p) => p.section === section)
        const groups = new Map<string, DocPage[]>()
        for (const p of inSection) groups.set(p.group ?? '', [...(groups.get(p.group ?? '') ?? []), p])
        return { section, groups: [...groups.entries()] }
      }).filter((s) => s.groups.length),
    [pages],
  )
  const overview = useMemo(() => {
    const groups = new Map<string, DocPage[]>()
    for (const p of pages) groups.set(p.group ?? '', [...(groups.get(p.group ?? '') ?? []), p])
    return [...groups.entries()]
  }, [pages])

  return (
    <div className={`docs docs--site${components ? ' docs--components' : ''}`}>
      <nav className="docs__side" aria-label={components ? 'Components' : 'Docs'}>
        <div className="docs__tree">
          {components ? (
            <button type="button" className={`docs__item docs__item--top${page ? '' : ' is-active'}`} aria-current={page ? undefined : 'page'} onClick={() => onPage(null)}>
              Overview
            </button>
          ) : null}
          {tree.map(({ section, groups }) => (
            <div key={section} className="docs__group">
              {/* In the Components space the section is the space itself; its categories head the list. */}
              {components ? null : <p className="docs__group-title">{section}</p>}
              {groups.map(([group, list]) => (
                <div key={group} className="docs__subgroup">
                  {group ? <p className={components ? 'docs__group-title' : 'docs__subgroup-title'}>{group}</p> : null}
                  {list.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={`docs__item${p.id === page?.id ? ' is-active' : ''}`}
                      aria-current={p.id === page?.id ? 'page' : undefined}
                      onClick={() => onPage(p.id)}
                    >
                      {p.title}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </nav>
      <div className="docs__main">
        <ThemeScope>
          <div className={`doc-paper${page ? '' : ' doc-paper--wide'}`}>
            {!page ? (
              <ComponentsOverview groups={overview} onOpen={onPage} />
            ) : page.kind === 'foundation' ? (
              <FoundationPage page={page} />
            ) : page.kind === 'written' ? (
              <WrittenPageView key={page.id} page={page} />
            ) : page.kind === 'generated' ? (
              <GeneratedPage key={page.id} page={page} />
            ) : (
              <ComponentPage key={page.id} page={page} />
            )}
          </div>
        </ThemeScope>
      </div>
    </div>
  )
}
