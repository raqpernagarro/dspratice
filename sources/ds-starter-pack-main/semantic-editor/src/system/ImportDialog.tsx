import { FigmaLogo, FileArrowUp, FileText, Warning, X } from '@phosphor-icons/react'
import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react'

import { VARIABLES_FORMAT, type VariablesExport } from '../../../stories/base-ui/tokens/exchange-format'
import { parseProjectFile, type ProjectFile } from '../../../stories/base-ui/tokens/project-file'
import type { ThemeConfig } from '../../../stories/base-ui/tokens/theme-config'
import { appType } from '../app/appTypes'
import { FileReadError, readJsonFile } from '../app/readFile'
import { useApp, useProject } from '../app/AppContext'
import { useSemanticEditor } from '../context/SemanticEditorContext'
import { recordFigmaChanges, reviewFigmaFile } from '../exchange/figmaSync'
import { FigmaReview } from './FigmaReview'

/**
 * "Import a file" takes either kind of file:
 *  - a project file (.dsproject.json) from the configurator: it replaces the system's theme,
 *    details, screens and written pages as unsaved changes, saved as the next version;
 *  - a variables file exported by the Figma plugin: the editor builds on that Figma file's
 *    variables instead of the repo's own (kept in this browser), with the theme on top.
 */
type Picked = { name: string; kind: 'project'; data: ProjectFile } | { name: string; kind: 'variables'; data: VariablesExport }

export function ImportDialog({ open, onClose, nextVersion }: { open: boolean; onClose: () => void; nextVersion: string }) {
  const { update } = useProject()
  const { notify } = useApp()
  const { theme, replaceTheme, patchTheme } = useSemanticEditor()
  const ref = useRef<HTMLDialogElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<Picked | null>(null)
  const [error, setError] = useState('')
  const [over, setOver] = useState(false)
  const vars = file?.kind === 'variables' ? file.data : null
  // Reviewed against the theme as it was when the file was picked (recording changes it).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const review = useMemo(() => (vars ? reviewFigmaFile(vars, theme) : null), [vars])
  const [keep, setKeep] = useState<Set<string>>(new Set())
  useEffect(() => setKeep(new Set(review?.items.filter((i) => i.keep).map((i) => i.id))), [review])
  const onKeep = (ids: string[], on: boolean) =>
    setKeep((prev) => {
      const next = new Set(prev)
      for (const id of ids) if (on) next.add(id)
      else next.delete(id)
      return next
    })
  const kept = review ? review.items.filter((i) => !i.blocked && keep.has(i.id)) : []

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) {
      setFile(null)
      setError('')
      el.showModal()
    } else if (!open && el.open) el.close()
  }, [open])

  const read = async (f: File | undefined) => {
    if (!f) return
    setError('')
    try {
      const json = (await readJsonFile(f)) as { format?: string; meta?: { variables?: unknown } }
      if (json?.format === VARIABLES_FORMAT && json.meta?.variables) setFile({ name: f.name, kind: 'variables', data: json as VariablesExport })
      else setFile({ name: f.name, kind: 'project', data: parseProjectFile(json) })
    } catch (e) {
      setFile(null)
      setError(
        e instanceof FileReadError
          ? e.message
          : `${e instanceof Error && e.message ? `${e.message.replace(/\.?$/, '.')} ` : ''}Use a project file from the configurator (.dsproject.json) or a variables file exported by the Figma plugin (.variables.json).`,
      )
    }
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setOver(false)
    read(e.dataTransfer.files[0])
  }

  const apply = () => {
    if (!file) return
    if (file.kind === 'variables') {
      onClose()
      if (!kept.length) return
      const rec = recordFigmaChanges(file.data, theme, kept)
      patchTheme(rec.theme)
      const failed = rec.failed.length ? ` ${rec.failed.length} couldn’t be recorded.` : ''
      notify(`Recorded ${rec.recorded} change${rec.recorded === 1 ? '' : 's'} from Figma. Save them as v${nextVersion}; Figma keeps them, and gets the rest of the system with the next changes file.${failed}`)
      return
    }
    const { data } = file
    replaceTheme(data.theme as ThemeConfig)
    update({ info: data.project, theme: data.theme, prototypes: data.prototypes, pages: data.pages, setupDone: true, pendingPrompt: null })
    onClose()
    notify(`Imported “${data.project.name}”. Review it, then save it as v${nextVersion}.`)
  }

  const d = file?.kind === 'project' ? file.data : null
  const pages = d ? Object.keys(d.pages).length : 0

  return (
    <dialog ref={ref} className="ui-dialog import-dialog" onClose={onClose} aria-labelledby="import-title">
      <form
        method="dialog"
        onSubmit={(e) => {
          e.preventDefault()
          apply()
        }}
      >
        <header className="ui-dialog__head">
          <span className="ui-dialog__icon" aria-hidden="true">
            <FileArrowUp size={18} weight="fill" />
          </span>
          <div>
            <h2 id="import-title">Import a file</h2>
            <p>A project file from the configurator (.dsproject.json), or a variables file exported by the Figma plugin (.variables.json).</p>
          </div>
          <button type="button" className="ui-icon-btn" onClick={onClose} aria-label="Close">
            <X size={14} weight="bold" />
          </button>
        </header>

        {file ? (
          <div className="import-file">
            <span className="import-file__icon" aria-hidden="true">
              {vars ? <FigmaLogo size={22} weight="fill" /> : <FileText size={22} weight="fill" />}
            </span>
            <div>
              <strong>{d ? d.project.name : `Figma variables · ${vars!.fileName}`}</strong>
              <span>{file.name}</span>
            </div>
            <button type="button" className="ui-btn ui-btn--ghost" onClick={() => setFile(null)}>
              Choose another
            </button>
          </div>
        ) : (
          <div
            className={`import-drop${over ? ' is-over' : ''}`}
            onDragOver={(e) => {
              e.preventDefault()
              setOver(true)
            }}
            onDragLeave={() => setOver(false)}
            onDrop={onDrop}
          >
            <FileArrowUp size={28} />
            <p>Drop the file here</p>
            <button type="button" className="ui-btn ui-btn--ghost" onClick={() => input.current?.click()}>
              Choose a file
            </button>
            <input ref={input} type="file" accept=".json,application/json" hidden onChange={(e) => {
                // Cleared, so choosing the same file again (after a failed read) reads it again.
                const picked = e.target.files?.[0]
                e.target.value = ''
                read(picked)
              }}
            />
          </div>
        )}

        {error ? (
          <p className="agent-error">
            <Warning size={14} weight="fill" /> {error}
          </p>
        ) : null}

        {review ? <FigmaReview review={review} keep={keep} onKeep={onKeep} /> : null}

        {d ? (
          <ul className="save-list">
            <li>
              <span>Details</span>
              <b>
                {d.project.name} · {appType(d.project.appType).name}
              </b>
            </li>
            <li>
              <span>Theme</span>
              <b>Colors, type, shape and components</b>
            </li>
            <li>
              <span>Screens</span>
              <b>{d.prototypes.length ? `${d.prototypes.length} saved` : 'None'}</b>
            </li>
            <li>
              <span>Written pages</span>
              <b>{pages ? `${pages} edited` : 'Sample text'}</b>
            </li>
          </ul>
        ) : null}

        <footer className="ui-dialog__foot">
          <span className="agent-muted">
            {d
              ? `It replaces what’s there now, as unsaved changes to save as v${nextVersion}. Discard brings the saved version back.`
              : ''}
          </span>
          <div className="save-actions">
            <button type="button" className="ui-btn ui-btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="ui-btn ui-btn--primary" disabled={!file}>
              {vars ? (kept.length ? `Record ${kept.length} change${kept.length === 1 ? '' : 's'}` : 'Done') : 'Use this file'}
            </button>
          </div>
        </footer>
      </form>
    </dialog>
  )
}
