import { DownloadSimple, GearSix, X } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'

import type { ProjectInfo } from '../../../stories/base-ui/tokens/project-file'
import { APP_TYPES, figmaFileKey, githubRepo } from '../app/appTypes'
import { useApp, useProject } from '../app/AppContext'
import { downloadProjectFile } from '../app/download'
import { useSemanticEditor } from '../context/SemanticEditorContext'

/** What "Set up system" asked, as a plain form. Changes join the draft and are saved with the next version. */
export function SystemSettings({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { doc, update } = useProject()
  const { setSettingsOpen, notify } = useApp()
  const { theme, updateTheme } = useSemanticEditor()
  const ref = useRef<HTMLDialogElement>(null)
  const [info, setInfo] = useState<ProjectInfo>(doc.info)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) {
      setInfo(doc.info)
      el.showModal()
    } else if (!open && el.open) el.close()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset on open
  }, [open])
  const patch = (p: Partial<ProjectInfo>) => setInfo((i) => ({ ...i, ...p }))
  const repo = githubRepo(info.githubUrl)
  const key = figmaFileKey(info.figmaUrl)
  return (
    <dialog ref={ref} className="ui-dialog" onClose={onClose} aria-labelledby="sys-settings-title">
      <form
        method="dialog"
        onSubmit={(e) => {
          e.preventDefault()
          update({ info: { ...info, name: info.name.trim() || doc.info.name } })
          onClose()
        }}
      >
        <header className="ui-dialog__head">
          <span className="ui-dialog__icon" aria-hidden="true">
            <GearSix size={18} weight="fill" />
          </span>
          <div>
            <h2 id="sys-settings-title">System settings</h2>
            <p>Changes are saved with the next version.</p>
          </div>
          <button type="button" className="ui-icon-btn" onClick={onClose} aria-label="Close">
            <X size={14} weight="bold" />
          </button>
        </header>
        <label className="ui-label" htmlFor="sys-name">Name</label>
        <input id="sys-name" className="ui-input ui-input--plain" value={info.name} onChange={(e) => patch({ name: e.target.value })} />
        <label className="ui-label" htmlFor="sys-desc">One line on what it’s for</label>
        <input id="sys-desc" className="ui-input ui-input--plain" value={info.description} onChange={(e) => patch({ description: e.target.value })} placeholder="The design system behind our analytics products" />
        <label className="ui-label" htmlFor="sys-type">Product type</label>
        <select id="sys-type" className="ui-input ui-input--plain" value={info.appType} onChange={(e) => patch({ appType: e.target.value as ProjectInfo['appType'] })}>
          {APP_TYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <label className="ui-label" htmlFor="sys-gh">GitHub repository {repo ? <span className="ui-hint">· {repo}</span> : null}</label>
        <input id="sys-gh" className="ui-input ui-input--plain" value={info.githubUrl} onChange={(e) => patch({ githubUrl: e.target.value })} placeholder="https://github.com/your-team/your-design-system" />
        <label className="ui-label" htmlFor="sys-fig">Figma file {key ? <span className="ui-hint">· file key {key}</span> : null}</label>
        <input id="sys-fig" className="ui-input ui-input--plain" value={info.figmaUrl} onChange={(e) => patch({ figmaUrl: e.target.value })} placeholder="https://www.figma.com/design/…" />
        <label className="ui-label" htmlFor="sys-shades">
          Shades of text and surfaces
        </label>
        <select
          id="sys-shades"
          className="ui-input ui-input--plain"
          value={theme.color.tertiary ? '3' : '2'}
          onChange={(e) => {
            const tertiary = e.target.value === '3'
            updateTheme((prev) => ({ ...prev, color: { ...prev.color, tertiary } }))
          }}
        >
          <option value="2">Two: main and secondary. Simple, enough for most products.</option>
          <option value="3">Three: adds a quieter third level, for dense screens.</option>
        </select>
        <span className="ui-hint sys-shades-hint">How many levels text, icons and surfaces have. Every brand uses the same.</span>
        <div className="sys-links">
          <button type="button" className="agent-link" onClick={() => setSettingsOpen(true)}>
            Agent settings (connection, model)
          </button>
          <button
            type="button"
            className="agent-link"
            onClick={() => {
              downloadProjectFile({ ...doc, info: { ...info, name: info.name.trim() || doc.info.name }, theme })
              notify('Downloaded the project file. Import it in another repo with Edit system.')
            }}
          >
            <DownloadSimple size={12} /> Download project file
          </button>
        </div>
        <footer className="ui-dialog__foot">
          <span />
          <button type="submit" className="ui-btn ui-btn--primary">
            Done
          </button>
        </footer>
      </form>
    </dialog>
  )
}
