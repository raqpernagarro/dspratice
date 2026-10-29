import { CaretDown, FigmaLogo, Moon, Sun, X } from '@phosphor-icons/react'
import { useContext, useEffect, useRef, useState } from 'react'

import { VARIABLES_FORMAT, type VariablesExport } from '../../../stories/base-ui/tokens/exchange-format'
import { MODE_NAMES } from '../../../stories/base-ui/tokens/theme-config'
import { exportTheme, themeToCss } from '../../../stories/base-ui/tokens/theme-export'
import { PRODUCT } from '../config/product'
import { ShellContext } from '../app/ShellContext'
import { useSemanticEditor } from '../context/SemanticEditorContext'
import { readJsonFile } from '../app/readFile'
import { buildChangeSet, changeSetSummary } from '../exchange/changeset'

function download(name: string, text: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** `compact`: inside Edit theme, where the site's bar already shows the product. */
export function TopBar({ compact = false }: { compact?: boolean }) {
  const { theme, patchTheme, resetTheme, source, importVariables, resetToRepoVariables } = useSemanticEditor()
  // Inside the site, "Import a file" is one dialog for both kinds of file.
  const shell = useContext(ShellContext)
  const fileRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!menuOpen) return
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', close)
    }
  }, [menuOpen])

  const slug = (theme.name || 'theme')
    .trim()
    .toLowerCase()
    .replace(/[^\w]+/g, '-')

  const flash = (text: string) => {
    setNotice(text)
    setTimeout(() => setNotice(null), 4000)
  }

  const onImport = async (file: File) => {
    try {
      const data = (await readJsonFile(file)) as VariablesExport
      if (data.format !== VARIABLES_FORMAT || !data.meta?.variables) {
        flash('That file is not a DS Configurator variables export (use the Figma plugin’s Export).')
        return
      }
      const edits = Object.keys(theme.variables).length
      if (edits && !window.confirm(`Importing replaces the variables. Your ${edits} variable edit(s) will be cleared. Continue?`)) return
      importVariables(data)
      flash(`Imported ${Object.keys(data.meta.variables).length} variables from “${data.fileName}”.`)
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Could not read that file.')
    }
  }

  const onExport = () => {
    const cs = buildChangeSet(theme)
    download(`${slug}.changes.json`, JSON.stringify(cs, null, 2))
    flash(`${changeSetSummary(cs)} Open the DS Configurator plugin in Figma → Import changes.`)
  }

  /** The whole theme, every mode it ships, for code: CSS custom properties or token JSON. */
  const onExportForCode = (as: 'css' | 'json') => {
    const data = exportTheme(theme)
    if (as === 'css') download(`${slug}.tokens.css`, themeToCss(data), 'text/css')
    else download(`${slug}.tokens.json`, JSON.stringify(data, null, 2))
    const first = data.modes[data.modeOrder[0]] ?? {}
    flash(`Exported ${Object.keys(first).length} tokens (${data.modeOrder.map((m) => MODE_NAMES[m]).join(' and ')}) as ${as.toUpperCase()}.`)
  }

  const pick = (action: () => void) => () => {
    setMenuOpen(false)
    action()
  }

  return (
    <header className={`topbar${compact ? ' topbar--compact' : ''}`}>
      <div className="topbar__brand">
        {compact ? (
          <span className="topbar__label">Theme</span>
        ) : (
          <>
            <span className="topbar__mark" aria-hidden="true">
              {PRODUCT.mark}
            </span>
            <span className="topbar__product">{PRODUCT.name}</span>
            <span className="topbar__slash" aria-hidden="true">
              /
            </span>
          </>
        )}
        <input
          className="topbar__theme-name"
          value={theme.name}
          onChange={(e) => patchTheme({ name: e.target.value })}
          aria-label="Theme name"
          spellCheck={false}
          size={Math.max(theme.name.length, 6)}
        />
        <span
          className={`topbar__source${source ? ' is-imported' : ''}`}
          title={source ? `Imported ${new Date(source.exportedAt).toLocaleString()}` : 'Variables synced into this repo'}
        >
          <FigmaLogo size={12} weight="bold" />
          {source ? source.fileName : 'Repo variables'}
          {source ? (
            <button type="button" onClick={resetToRepoVariables} aria-label="Use the repo variables instead">
              <X size={10} weight="bold" />
            </button>
          ) : null}
        </span>
      </div>

      {notice ? (
        <div className="topbar__notice" role="status">
          {notice}
        </div>
      ) : null}

      <div className="topbar__actions">
        {theme.brands.length > 1 ? (
          <label className="chrome-select" title="The brand you're viewing and editing">
            <span>Brand</span>
            <select value={theme.brand ?? ''} onChange={(e) => patchTheme({ brand: e.target.value || null })}>
              {theme.brands.map((b, i) => (
                <option key={b.id} value={i === 0 ? '' : b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {theme.modes.length > 1 ? (
          <div className="chrome-segmented" role="group" aria-label="Mode">
            {theme.modes.map((mode) => (
              <button
                key={mode}
                type="button"
                className={theme.appearance === mode ? 'is-active' : ''}
                aria-pressed={theme.appearance === mode}
                onClick={() => patchTheme({ appearance: mode })}
              >
                {mode === 'light' ? <Sun size={14} weight="bold" /> : <Moon size={14} weight="bold" />}
                {MODE_NAMES[mode]}
              </button>
            ))}
          </div>
        ) : null}
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onImport(f)
            e.target.value = ''
          }}
        />
        <div className="chrome-menu" ref={menuRef}>
          <button type="button" className="chrome-btn" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
            More
            <CaretDown size={12} weight="bold" />
          </button>
          {menuOpen ? (
            <div className="chrome-menu__list" role="menu">
              <button type="button" role="menuitem" onClick={pick(onExport)}>
                <strong>Export Figma changes</strong>
                <span>.changes.json, for the Figma plugin’s Import changes</span>
              </button>
              <button type="button" role="menuitem" onClick={pick(() => onExportForCode('css'))}>
                <strong>Export CSS variables</strong>
                <span>.tokens.css, the whole theme in every mode</span>
              </button>
              <button type="button" role="menuitem" onClick={pick(() => onExportForCode('json'))}>
                <strong>Export token JSON</strong>
                <span>.tokens.json, Figma token paths and their values</span>
              </button>
              <button type="button" role="menuitem" onClick={pick(() => (shell?.openImport ? shell.openImport() : fileRef.current?.click()))}>
                <strong>Import a file</strong>
                <span>A configurator project, or variables exported by the Figma plugin</span>
              </button>
              <button type="button" role="menuitem" onClick={pick(resetTheme)}>
                <strong>Reset the theme</strong>
                <span>Back to the system’s defaults{theme.brand ? ' for this brand' : ''}</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
