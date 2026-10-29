import { ArrowLeft, CaretDown, Check, Cube, FileArrowUp, GearSix, MagnifyingGlass, Moon, PaintBrush, PencilSimpleLine, RocketLaunch, Sparkle, Sun, X } from '@phosphor-icons/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { currentVersion, versionAfter, type ProjectFile } from '../../../stories/base-ui/tokens/project-file'
import { MODE_NAMES, type ThemeConfig } from '../../../stories/base-ui/tokens/theme-config'
import { AskPanel } from '../agent/AskPanel'
import { AppProvider, ProjectIdProvider, useApp, useProject } from '../app/AppContext'
import { SettingsDialog } from '../app/SettingsDialog'
import { ShellContext } from '../app/ShellContext'
import { projectFromFile, type StepId } from '../app/store'
import { ConfigureView } from '../configure/ConfigureView'
import { SemanticEditorProvider, useSemanticEditor } from '../context/SemanticEditorContext'
import { DOC_PAGES } from '../docs/catalog'
import { CommandPalette, type PaletteAction } from '../docs/CommandPalette'
import { DocsView } from '../docs/DocsView'
import { PrototypeView } from '../proto/PrototypeView'
import { VariablesProvider } from '../variables/VariablesContext'
import { summarizeDraft } from './changes'
import { ImportDialog } from './ImportDialog'
import { clearSystemDraft, isStarter, loadSystemDoc, READONLY, SYSTEM_ID, systemBaseline } from './mode'
import { PageEditor } from './PageEditor'
import { writtenPage } from './pages'
import { SaveDialog } from './SaveDialog'
import { SetupSystem } from './SetupSystem'
import { takeSavedNotice } from './ship'
import { SiteHome } from './SiteHome'
import { SystemSettings } from './SystemSettings'

type Mode = { kind: 'setup' } | { kind: 'theme' } | { kind: 'prototype'; screen?: string } | { kind: 'page'; id: string }

function Notice() {
  const { notice } = useApp()
  return notice ? (
    <div className="app-notice" role="status">
      {notice}
    </div>
  ) : null
}

/**
 * A header menu's open state. Opening moves focus to the first item; arrows, Home and End move
 * between items; Escape closes it and gives focus back to its button; a click outside closes it.
 */
function useMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const items = () => [...(ref.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]') ?? [])]
    const trigger = () => ref.current?.querySelector<HTMLElement>('[aria-haspopup="menu"]')
    requestAnimationFrame(() => (items().find((i) => i.getAttribute('aria-checked') === 'true') ?? items()[0])?.focus())
    const onPointer = (e: Event) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        trigger()?.focus()
        return
      }
      const list = items()
      const at = list.indexOf(document.activeElement as HTMLElement)
      const next = e.key === 'ArrowDown' ? at + 1 : e.key === 'ArrowUp' ? at - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? list.length - 1 : null
      if (next === null || !list.length) return
      e.preventDefault()
      list[(next + list.length) % list.length].focus()
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])
  return { open, setOpen, ref }
}

/** A brand's main color as a swatch; `null` when it keeps the system's default color. */
function brandSwatch(theme: ThemeConfig, i: number): string | undefined {
  const main = i === 0 ? theme.color.main : (theme.brands[i].own?.colors?.color.main ?? theme.color.main)
  return main ? `oklch(${main.l} ${main.c} ${main.h})` : undefined
}

/** Which brand the site shows. Each brand is a Figma collection; the docs follow the one picked. */
function BrandMenu() {
  const { theme, patchTheme } = useSemanticEditor()
  const { open, setOpen, ref } = useMenu()
  const current = Math.max(0, theme.brands.findIndex((b) => b.id === theme.brand))
  const pick = (i: number) => {
    setOpen(false)
    patchTheme({ brand: i === 0 ? null : theme.brands[i].id })
  }
  return (
    <div className="site-menu" ref={ref}>
      <button type="button" className="site-brand" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} title="Brand">
        <i className="site-brand__dot" style={{ background: brandSwatch(theme, current) }} aria-hidden="true" />
        <span className="sr-only">Brand: </span>
        {theme.brands[current].name}
        <CaretDown size={11} weight="bold" />
      </button>
      {open ? (
        <div className="site-menu__pop site-brand__menu" role="menu" aria-label="Brand">
          <p className="site-menu__label">Brand</p>
          {theme.brands.map((b, i) => (
            <button key={b.id} type="button" role="menuitemradio" aria-checked={i === current} onClick={() => pick(i)}>
              <i className="site-brand__dot" style={{ background: brandSwatch(theme, i) }} aria-hidden="true" />
              <span>{b.name}</span>
              {i === 0 ? <small>Main</small> : null}
              {i === current ? <Check size={13} weight="bold" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

/** "Edit system": the way into the dedicated editing modes. */
function EditMenu({ onPick, onImport, pageId }: { onPick: (m: Mode) => void; onImport: () => void; pageId: string | null }) {
  const { open, setOpen, ref } = useMenu()
  const pick = (m: Mode) => {
    setOpen(false)
    onPick(m)
  }
  const page = pageId ? writtenPage(pageId) : null
  return (
    <div className="site-menu site-edit" ref={ref}>
      <button type="button" className="site-edit__btn" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <PencilSimpleLine size={15} weight="bold" /> Edit system <CaretDown size={12} weight="bold" />
      </button>
      {open ? (
        <div className="site-menu__pop site-edit__menu" role="menu">
          <button type="button" role="menuitem" onClick={() => pick({ kind: 'theme' })}>
            <span className="site-edit__icon">
              <PaintBrush size={16} weight="fill" />
            </span>
            <span>
              <strong>Edit theme</strong>
              <span>Color, type, shape and components, with the styling agent.</span>
            </span>
          </button>
          <button type="button" role="menuitem" onClick={() => pick({ kind: 'prototype' })}>
            <span className="site-edit__icon">
              <Cube size={16} weight="fill" />
            </span>
            <span>
              <strong>Prototype a screen</strong>
              <span>Describe a screen; it’s built from your components.</span>
            </span>
          </button>
          {page ? (
            <button type="button" role="menuitem" onClick={() => pick({ kind: 'page', id: page.id })}>
              <span className="site-edit__icon">
                <PencilSimpleLine size={16} weight="fill" />
              </span>
              <span>
                <strong>Edit “{page.title}”</strong>
                <span>Written pages are Markdown, saved with the system.</span>
              </span>
            </button>
          ) : null}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onImport()
            }}
          >
            <span className="site-edit__icon">
              <FileArrowUp size={16} weight="fill" />
            </span>
            <span>
              <strong>Import a file</strong>
              <span>A configurator project, or variables exported by the Figma plugin.</span>
            </span>
          </button>
          {/* Setup reshapes the whole system, so it sits apart from the everyday edits. */}
          <hr className="site-edit__sep" />
          <button type="button" role="menuitem" onClick={() => pick({ kind: 'setup' })}>
            <span className="site-edit__icon">
              <RocketLaunch size={16} weight="fill" />
            </span>
            <span>
              <strong>Set up system</strong>
              <span>What it’s for and how it starts. Ends by shipping a new version.</span>
            </span>
          </button>
        </div>
      ) : null}
    </div>
  )
}

function Site({ saved }: { saved: ProjectFile }) {
  const { doc, update } = useProject()
  const { theme, replaceTheme, patchTheme } = useSemanticEditor()
  const [news, setNews] = useState(takeSavedNotice)
  // After shipping a setup the site opens on its docs, styled as the new system.
  const [view, setView] = useState<'home' | 'docs' | 'components'>(() => (news?.view === 'docs' ? 'docs' : 'home'))
  const [docPage, setDocPage] = useState('introduction')
  // The Components space opens on its overview grid (null) or on one component's page.
  const [componentPage, setComponentPage] = useState<string | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [mode, setMode] = useState<Mode | null>(null)
  const [agentOpen, setAgentOpen] = useState(false)
  const [topicComponent, setTopicComponent] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [saveOpen, setSaveOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const starter = isStarter() && !READONLY
  const draft = useMemo(() => summarizeDraft({ ...doc, theme }, saved), [doc, theme, saved])
  // The starter system can be saved as it is: the first save is what makes it this repo's system.
  const summary = useMemo(() => (starter ? { ...draft, suggestion: `First version of ${doc.info.name}` } : draft), [draft, starter, doc.info.name])
  const canSave = summary.dirty || starter
  const version = saved.versions.length ? currentVersion(saved.versions) : null
  const next = versionAfter(saved.versions)

  // Component pages live in their own space; every other page is in the docs.
  const openDoc = useCallback((id: string) => {
    if (DOC_PAGES.find((p) => p.id === id)?.kind === 'component') {
      setComponentPage(id)
      setView('components')
    } else {
      setDocPage(id)
      setView('docs')
    }
    document.querySelector('.site-scroll')?.scrollTo({ top: 0 })
  }, [])
  const openComponents = useCallback(() => {
    setComponentPage(null)
    setView('components')
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Not over an open dialog (Import, Save, Settings…): those keep the keyboard.
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k' && !mode && !document.querySelector('dialog[open]')) {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mode])

  const go = useCallback((step: StepId) => {
    if (step === 'configure') setMode({ kind: 'theme' })
    else if (step === 'prototype') setMode({ kind: 'prototype' })
    else if (step === 'docs') {
      setMode(null)
      setView('docs')
    }
  }, [])

  const shell = useMemo(
    () => ({
      agentOpen,
      setAgentOpen,
      topicComponent,
      setTopicComponent,
      go,
      editPage: READONLY ? undefined : (id: string) => setMode({ kind: 'page', id }),
      openPrototype: READONLY ? undefined : (screen?: string) => setMode({ kind: 'prototype', screen }),
      openImport: READONLY ? undefined : () => setImportOpen(true),
      openSearch: () => setSearchOpen(true),
    }),
    [agentOpen, topicComponent, go]
  )

  const searchActions: PaletteAction[] = [{ id: 'ask', label: 'Ask the agent', hint: 'Questions about this system', run: () => setAgentOpen(true) }]
  if (!READONLY) {
    searchActions.push({ id: 'configure', label: 'Change the theme', hint: 'Edit theme', run: () => go('configure') })
    searchActions.push({ id: 'prototype', label: 'Build a screen', hint: 'Prototype a screen', run: () => go('prototype') })
  }
  const nextMode = theme.modes[(theme.modes.indexOf(theme.appearance) + 1) % theme.modes.length]

  const discardAll = () => {
    replaceTheme(saved.theme as ThemeConfig)
    update({
      info: saved.project,
      prototypes: saved.prototypes,
      pages: saved.pages,
      theme: saved.theme,
    })
    clearSystemDraft()
  }

  const modeTitle =
    mode?.kind === 'setup'
      ? 'Setting up the system'
      : mode?.kind === 'theme'
      ? 'Editing theme'
      : mode?.kind === 'prototype'
      ? 'Prototyping'
      : mode?.kind === 'page'
      ? `Editing “${writtenPage(mode.id)?.title}”`
      : ''
  const writtenOpen = view === 'docs' && writtenPage(docPage) ? docPage : null

  return (
    <ShellContext.Provider value={shell}>
      <div className="site canvas-scope">
        <header className="site-head">
          <div className="site-head__start">
            <button type="button" className="site-logo" onClick={() => setView('home')} aria-label={`${doc.info.name} home`}>
              {/* The system's colors as its mark: it changes with the brand and theme. */}
              <i className="site-logo__mark" aria-hidden="true" />
              <strong>{doc.info.name}</strong>
            </button>
            <button type="button" className="site-version" onClick={() => openDoc('changelog')} title="What changed">
              {version ? `v${version}` : 'Starter'}
            </button>
            <nav className="site-links" aria-label="Site">
              {(['home', 'docs', 'components'] as const).map((v) => (
                <button key={v} type="button" aria-current={view === v ? 'page' : undefined} onClick={() => (v === 'components' ? openComponents() : setView(v))}>
                  {v === 'home' ? 'Home' : v === 'docs' ? 'Docs' : 'Components'}
                </button>
              ))}
            </nav>
          </div>
          <button type="button" className="site-search" aria-label="Search docs and components" aria-keyshortcuts="Meta+K Control+K" onClick={() => setSearchOpen(true)}>
            <MagnifyingGlass size={15} />
            <span>Search docs and components</span>
            <kbd>⌘K</kbd>
          </button>
          <div className="site-head__end">
            {theme.brands.length > 1 ? <BrandMenu /> : null}
            {theme.modes.length > 1 ? (
              <button
                type="button"
                className="site-icon"
                onClick={() => patchTheme({ appearance: nextMode })}
                aria-label={`Show ${MODE_NAMES[nextMode]} mode`}
                title={`Show ${MODE_NAMES[nextMode]} mode`}
              >
                {theme.appearance === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
              </button>
            ) : null}
            <button type="button" className={`site-icon${agentOpen ? ' is-on' : ''}`} aria-pressed={agentOpen} onClick={() => setAgentOpen(!agentOpen)} aria-label="Ask the agent" title="Ask the agent">
              <Sparkle size={17} weight={agentOpen ? 'fill' : 'regular'} />
            </button>
            {READONLY ? null : (
              <>
                <button type="button" className="site-icon" onClick={() => setSettingsOpen(true)} aria-label="System settings" title="System settings">
                  <GearSix size={17} />
                </button>
                <EditMenu onPick={setMode} onImport={() => setImportOpen(true)} pageId={writtenOpen} />
              </>
            )}
          </div>
        </header>

        {!READONLY && summary.dirty ? (
          <div className="site-draft" role="status">
            <span className="site-draft__dot" aria-hidden="true" />
            <span className="site-draft__text">
              <b>Unsaved changes</b> · {summary.lines.map((l) => l.label).join(', ')}. Only you see them until you save.
            </span>
            <button type="button" className="site-draft__btn" onClick={discardAll}>
              Discard
            </button>
            <button type="button" className="site-draft__btn site-draft__btn--primary" onClick={() => setSaveOpen(true)}>
              Save as v{next}
            </button>
          </div>
        ) : null}
        {news ? (
          <div className="site-news" role="status">
            <b>New in v{news.version}:</b> {news.note}
            <button type="button" onClick={() => openDoc('changelog')}>
              See what changed
            </button>
            <button type="button" className="site-news__x" onClick={() => setNews(null)} aria-label="Dismiss">
              <X size={12} weight="bold" />
            </button>
          </div>
        ) : null}

        <div className="site-body">
          <div className="site-scroll">
            {view === 'home' ? (
              <SiteHome
                onOpenDoc={openDoc}
                onOpenComponents={openComponents}
                welcome={
                  starter
                    ? {
                        onSetUp: () => setMode({ kind: 'setup' }),
                        onImport: () => setImportOpen(true),
                      }
                    : undefined
                }
              />
            ) : view === 'docs' ? (
              <DocsView key="docs" space="docs" page={docPage} onPage={(id) => id && setDocPage(id)} />
            ) : (
              <DocsView key="components" space="components" page={componentPage} onPage={setComponentPage} />
            )}
          </div>
          {agentOpen && !mode ? (
            <AskPanel
              key={topicComponent ?? 'site'}
              topic={{
                component: view === 'home' ? null : topicComponent,
                place: 'Docs',
              }}
              onClose={() => setAgentOpen(false)}
            />
          ) : null}
        </div>
      </div>

      {mode ? (
        <div className="edit-mode" role="dialog" aria-modal="true" aria-label={modeTitle}>
          <div className="edit-mode__bar">
            <button
              type="button"
              className="ui-btn ui-btn--ghost"
              onClick={() => {
                setMode(null)
                setAgentOpen(false)
              }}
            >
              <ArrowLeft size={14} weight="bold" /> Back to the site
            </button>
            <span className="edit-mode__badge">
              <i aria-hidden="true" />
              {modeTitle}
            </span>
            <p className="edit-mode__hint">
              {summary.dirty ? (
                <span className="edit-mode__count">
                  {summary.variables ? `${summary.variables} variables changed` : 'Unsaved changes'} · nothing changes for anyone until you save
                </span>
              ) : (
                `Editing ${doc.info.name}${version ? ` v${version}` : ''}. Nothing changes for anyone until you save.`
              )}
            </p>
            {mode.kind === 'theme' ? (
              <button type="button" className={`ask-btn${agentOpen ? ' is-on' : ''}`} aria-pressed={agentOpen} onClick={() => setAgentOpen(!agentOpen)}>
                <Sparkle size={14} weight="fill" /> Style with agent
              </button>
            ) : null}
            {/* Setup saves at its last step; its own buttons move you through it. */}
            {mode.kind === 'setup' ? null : (
              <>
                <button type="button" className="ui-btn ui-btn--ghost" disabled={!summary.dirty} onClick={discardAll}>
                  Discard
                </button>
                <button type="button" className="ui-btn ui-btn--primary" disabled={!canSave} onClick={() => setSaveOpen(true)}>
                  Save as v{next}
                </button>
              </>
            )}
          </div>
          <div className="edit-mode__body">
            {mode.kind === 'setup' ? (
              <SetupSystem saved={saved} onCannotShip={() => setSaveOpen(true)} />
            ) : mode.kind === 'theme' ? (
              <ConfigureView />
            ) : mode.kind === 'prototype' ? (
              <PrototypeView initialId={mode.screen} />
            ) : (
              <PageEditor id={mode.id} onDone={() => setMode(null)} />
            )}
          </div>
        </div>
      ) : null}

      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} onPick={(p) => openDoc(p.id)} actions={searchActions} />
      <SaveDialog open={saveOpen} onClose={() => setSaveOpen(false)} summary={summary} saved={saved} />
      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} nextVersion={next} />
      <SystemSettings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </ShellContext.Provider>
  )
}

function SystemProject({ saved }: { saved: ProjectFile }) {
  const { project, updateProject } = useApp()
  const doc = project(SYSTEM_ID)!
  const onThemeChange = useCallback((theme: ThemeConfig) => updateProject(SYSTEM_ID, { theme }, { silent: true }), [updateProject])
  return (
    <ProjectIdProvider value={SYSTEM_ID}>
      <SemanticEditorProvider initialTheme={doc.theme} onThemeChange={onThemeChange}>
        <VariablesProvider>
          <Site saved={saved} />
        </VariablesProvider>
      </SemanticEditorProvider>
    </ProjectIdProvider>
  )
}

/** System mode: this repo's design system as its own site, with editing behind "Edit system". */
export function SystemApp() {
  const saved = useMemo(systemBaseline, [])
  // The read-only site shows the saved file as is and never writes to storage.
  const doc = useMemo(() => (READONLY ? { ...projectFromFile(saved), id: SYSTEM_ID, setupDone: true } : loadSystemDoc(saved)), [saved])
  return (
    <AppProvider system={doc} readOnly={READONLY}>
      <SystemProject saved={saved} />
      <SettingsDialog />
      <Notice />
    </AppProvider>
  )
}

/** A read-only site never shows a draft. */
