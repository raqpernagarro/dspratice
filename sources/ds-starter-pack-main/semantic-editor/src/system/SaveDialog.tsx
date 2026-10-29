import { CheckCircle, DownloadSimple, FileText, Warning, X } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'

import { makeProjectFile, versionAfter, type ProjectFile } from '../../../stories/base-ui/tokens/project-file'
import { useApp, useProject } from '../app/AppContext'
import { download } from '../app/download'
import { useSemanticEditor } from '../context/SemanticEditorContext'
import { buildChangeSet } from '../exchange/changeset'
import type { DraftSummary } from './changes'
import { canWriteRepo } from './mode'
import { shipToRepo } from './ship'

/**
 * Turns the draft into a new version: writes ds.project.json through the dev server (then the page
 * reloads on the new file), or, where that isn't possible, downloads it with the steps to apply it.
 */
export function SaveDialog({ open, onClose, summary, saved }: { open: boolean; onClose: () => void; summary: DraftSummary; saved: ProjectFile }) {
  const { doc } = useProject()
  const { notify } = useApp()
  const { theme } = useSemanticEditor()
  const ref = useRef<HTMLDialogElement>(null)
  const [note, setNote] = useState(summary.suggestion)
  const [writable, setWritable] = useState<boolean | null>(null)
  const [state, setState] = useState<'idle' | 'saving' | 'error'>('idle')
  const [error, setError] = useState('')
  const version = versionAfter(saved.versions)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) {
      setNote(summary.suggestion)
      setState('idle')
      canWriteRepo().then(setWritable)
      el.showModal()
    } else if (!open && el.open) el.close()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset on open
  }, [open])

  const file = () =>
    makeProjectFile(doc.info, theme, doc.prototypes, doc.pages, [
      { version, note: note.trim() || summary.suggestion, date: new Date().toISOString() },
      ...saved.versions,
    ])

  const save = async () => {
    setState('saving')
    try {
      await shipToRepo(file(), { version, note: note.trim() || summary.suggestion })
    } catch (e) {
      setState('error')
      setError(e instanceof Error ? e.message : 'The save failed.')
    }
  }

  const downloadFile = () => {
    download('ds.project.json', JSON.stringify(file(), null, 2) + '\n')
    notify('Downloaded ds.project.json. Put it at the root of the repo and commit it.')
  }

  return (
    <dialog ref={ref} className="ui-dialog save-dialog" onClose={onClose} aria-labelledby="save-title">
      <form
        method="dialog"
        onSubmit={(e) => {
          e.preventDefault()
          if (writable) save()
          else downloadFile()
        }}
      >
        <header className="ui-dialog__head">
          <span className="ui-dialog__icon" aria-hidden="true">
            <FileText size={18} weight="fill" />
          </span>
          <div>
            <h2 id="save-title">Save as v{version}</h2>
            <p>The changes become the new version of {doc.info.name}. Commit the file like any other change; the team sees it once it’s merged.</p>
          </div>
          <button type="button" className="ui-icon-btn" onClick={onClose} aria-label="Close">
            <X size={14} weight="bold" />
          </button>
        </header>

        <ul className="save-list">
          {summary.lines.map((l) => (
            <li key={l.label}>
              <span>{l.label}</span>
              <b>{l.detail}</b>
            </li>
          ))}
          {summary.variables ? (
            <li>
              <span>Variables</span>
              <b>{summary.variables} changed</b>
            </li>
          ) : null}
        </ul>

        <label className="ui-label" htmlFor="save-note">
          What changed, in one line
        </label>
        <input id="save-note" className="ui-input ui-input--plain" value={note} onChange={(e) => setNote(e.target.value)} />

        {writable === false ? (
          <p className="save-note">
            <Warning size={14} weight="fill" /> This copy can’t write to the repo (it isn’t the dev server). Download the file, put it at the repo root and run{' '}
            <code>npm run ds:apply-project -- ds.project.json</code>.
          </p>
        ) : (
          <p className="save-note save-note--ok">
            <CheckCircle size={14} weight="fill" /> Writes <code>ds.project.json</code> in this repo.
          </p>
        )}
        {state === 'error' ? <p className="agent-error">{error}</p> : null}

        <footer className="ui-dialog__foot">
          {summary.themeChanged ? (
            <button type="button" className="ui-btn ui-btn--ghost" onClick={() => download(`${doc.info.name.toLowerCase().replace(/[^\w]+/g, '-')}.changes.json`, JSON.stringify(buildChangeSet(theme, version), null, 2))}>
              <DownloadSimple size={14} /> Figma changes
            </button>
          ) : (
            <span />
          )}
          <div className="save-actions">
            <button type="button" className="ui-btn ui-btn--ghost" onClick={onClose}>
              Keep editing
            </button>
            <button type="submit" className="ui-btn ui-btn--primary" disabled={state === 'saving' || writable === null}>
              {writable === false ? (
                <>
                  <DownloadSimple size={14} /> Download ds.project.json
                </>
              ) : state === 'saving' ? (
                'Saving…'
              ) : (
                `Save v${version}`
              )}
            </button>
          </div>
        </footer>
      </form>
    </dialog>
  )
}
