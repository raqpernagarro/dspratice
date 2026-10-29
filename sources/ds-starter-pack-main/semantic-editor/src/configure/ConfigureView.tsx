import { SquaresFour, Browser } from '@phosphor-icons/react'
import { useLayoutEffect, useRef, useState } from 'react'

import type { AppTypeId } from '../../../stories/base-ui/tokens/project-file'
import { ThemeAgentPanel } from '../agent/ThemeAgentPanel'
import { APP_TYPES } from '../app/appTypes'
import { useProject } from '../app/AppContext'
import { useShell } from '../app/ShellContext'
import { ComponentsPanel } from '../components/ComponentsPanel'
import { SemanticEditorPanel } from '../components/SemanticEditorPanel'
import { TopBar } from '../components/TopBar'
import { ComponentNav, SemanticNav } from '../components/nav/SemanticNav'
import { ThemeScope, useSemanticEditor } from '../context/SemanticEditorContext'
import { EXAMPLE_SCREENS } from '../proto/screens'
import { ScreenRenderer } from '../proto/Renderer'
import { ComponentCanvas } from '../showcase/ComponentCanvas'
import { SystemCanvas } from '../showcase/SystemCanvas'
import { VariablesPanel } from '../variables/VariablesPanel'
import { VariablesView } from '../variables/VariablesView'

const SCREEN_WIDTH = 1280

/** The example screen for the project's product type, restyled live by the theme. */
function ScreenCanvas() {
  const { doc } = useProject()
  const [type, setType] = useState<AppTypeId>(doc.info.appType)
  const screen = EXAMPLE_SCREENS[type]
  // Desktop screens are designed at 1280px; they scale down to fit the canvas instead of being cut off.
  const scrollRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const mobile = type === 'mobile'
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const measure = () => {
      const style = getComputedStyle(el)
      const inner = el.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
      setZoom(Math.min(1, inner / SCREEN_WIDTH))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <section className="canvas" aria-label="Example screen">
      <div className="canvas__bar">
        <div className="chrome-chips" role="tablist" aria-label="Product type">
          {APP_TYPES.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={type === t.id} className={type === t.id ? 'is-active' : ''} onClick={() => setType(t.id)}>
              {t.name}
            </button>
          ))}
        </div>
      </div>
      <div className="canvas__scroll" ref={scrollRef}>
        <div className="screen-frame" style={mobile ? undefined : { width: SCREEN_WIDTH, zoom }}>
          <div className="screen-frame__chrome" aria-hidden="true">
            <i />
            <i />
            <i />
            <span>{screen.title}</span>
          </div>
          <ScreenRenderer tree={screen.tree} />
        </div>
      </div>
    </section>
  )
}

/** `toolbar` off: inside Set up system, where each step picks the brand and mode and export is its own step. */
export function ConfigureView({ toolbar = true }: { toolbar?: boolean } = {}) {
  const { view, editingComponent } = useSemanticEditor()
  const { agentOpen, setAgentOpen } = useShell()
  const [preview, setPreview] = useState<'system' | 'screen'>('system')

  let body
  if (editingComponent) {
    body = (
      <>
        <ComponentNav />
        <ComponentsPanel />
        <ThemeScope>
          <ComponentCanvas />
        </ThemeScope>
      </>
    )
  } else if (view === 'variables') {
    body = (
      <>
        <SemanticNav />
        <VariablesPanel />
        <ThemeScope>
          <VariablesView />
        </ThemeScope>
      </>
    )
  } else {
    body = (
      <>
        <SemanticNav />
        <SemanticEditorPanel />
        <div className="configure__canvas">
          <div className="preview-switch" role="group" aria-label="Preview">
            <button type="button" aria-pressed={preview === 'system'} onClick={() => setPreview('system')}>
              <SquaresFour size={14} weight={preview === 'system' ? 'fill' : 'regular'} /> System
            </button>
            <button type="button" aria-pressed={preview === 'screen'} onClick={() => setPreview('screen')}>
              <Browser size={14} weight={preview === 'screen' ? 'fill' : 'regular'} /> Example screen
            </button>
          </div>
          <ThemeScope>{preview === 'system' ? <SystemCanvas /> : <ScreenCanvas />}</ThemeScope>
        </div>
      </>
    )
  }

  return (
    <div className="configure">
      {toolbar ? <TopBar compact /> : null}
      <div className="app__body">
        {body}
        {agentOpen ? <ThemeAgentPanel onClose={() => setAgentOpen(false)} /> : null}
      </div>
    </div>
  )
}
