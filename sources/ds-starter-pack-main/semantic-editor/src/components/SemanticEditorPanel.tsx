import type { ComponentType } from 'react'

import { useSemanticEditor, type EditorSection } from '../context/SemanticEditorContext'
import { useVariablesUi } from '../variables/VariablesContext'
import { PanelTabs } from './PanelTabs'
import { ColorSection } from './sections/ColorSection'
import { RadiusSection, ShadowSection, SpacingSection } from './sections/ScaleSections'
import { TypeSection } from './sections/TypeSection'

const SECTIONS: Record<EditorSection, { label: string; hint: string; render: ComponentType }> = {
  color: { label: 'Color', hint: 'Brand, neutral and feedback colors. Each one builds a full palette of tokens.', render: ColorSection },
  type: { label: 'Typography', hint: 'Fonts and the size scale.', render: TypeSection },
  radius: { label: 'Radius', hint: 'How round corners are, from checkboxes to dialogs.', render: RadiusSection },
  spacing: { label: 'Spacing', hint: 'How much room things get: padding, gaps and control sizes.', render: SpacingSection },
  shadow: { label: 'Shadows', hint: 'Depth of cards, menus and dialogs.', render: ShadowSection },
}

export function SemanticEditorPanel() {
  const { section, setView } = useSemanticEditor()
  const { changes, setChangedOnly } = useVariablesUi()
  const { label, hint, render: Content } = SECTIONS[section]
  const changed = changes.count

  return (
    <aside className="semantic-panel" aria-label="Theme editor">
      <PanelTabs />
      <div className="semantic-panel__header">
        <h2>{label}</h2>
        <p>{hint}</p>
      </div>
      <div className="semantic-panel__content" role="tabpanel">
        <Content />
      </div>
      <footer className="semantic-panel__footer">
        <span className="saved-indicator">Saved locally</span>
        {changed ? (
          <button
            type="button"
            className="semantic-panel__footnote semantic-panel__footnote--link"
            onClick={() => {
              setView('variables')
              setChangedOnly(true)
            }}
            title="See every changed variable in the Variables tab"
          >
            {changed} variables changed →
          </button>
        ) : (
          <span className="semantic-panel__footnote">No changes yet</span>
        )}
      </footer>
    </aside>
  )
}
