import { useSemanticEditor } from '../context/SemanticEditorContext'

const TAB_LABELS = { theme: 'Theme', variables: 'Variables' } as const

/** Theme / Variables switch at the top of the left panel. */
export function PanelTabs() {
  const { view, setView } = useSemanticEditor()
  return (
    <div className="semantic-panel__tabs" role="tablist" aria-label="Panel mode">
      {(['theme', 'variables'] as const).map((id) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={view === id}
          className={view === id ? 'is-active' : ''}
          onClick={() => setView(id)}
        >
          {TAB_LABELS[id]}
        </button>
      ))}
    </div>
  )
}
