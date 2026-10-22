import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useStore } from '@/state/store'
import { act, useSystem } from '@/state/hooks'
import { PageHead } from '@/shell/PageHead'
import { Btn, Callout, Chip, Panel, Segmented, Sheet, Swatch, Field } from '@/shell/ui'
import { ThemeEditor } from './ThemeEditor'
import { LivePreview } from './LivePreview'
import { PRESETS } from '@/fixtures/reference/presets'

export function BrandsPage() {
  const sys = useSystem()
  const previewDensity = useStore((x) => x.ui.previewDensity)
  const [addSheet, setAddSheet] = useState(false)
  const [name, setName] = useState('')
  const [main, setMain] = useState('#2a8aa8')

  return (
    <div className="page">
      <PageHead
        screen="brands"
        title="Brands and modes"
        lead="The one theme configurator (the Starter Pack editor and DSN’s brand presets, merged). Brands extend the semantic collection with overrides; modes are light/dark and density. Shared demo builds use demo brands only; client brands stay in the client’s workspace."
        actions={
          <Btn variant="secondary" onClick={() => setAddSheet(true)}>
            <Plus /> Add a brand
          </Btn>
        }
      />

      <div className="grid grid--3">
        <Panel title="Brands" tight>
          <div className="stack" style={{ gap: 6 }}>
            {sys.theme.brands.map((b) => (
              <button key={b.id} className={`choice ${sys.theme.activeBrand === b.id ? 'is-selected' : ''}`} onClick={() => act().updateTheme({ activeBrand: b.id, color: { ...sys.theme.color, main: b.main, accent: b.accent } })} style={{ padding: 10 }}>
                <Swatch color={b.main} />
                <div className="choice__body">
                  <span className="choice__title" style={{ fontSize: 13 }}>
                    {b.name} {b.isDefault && <Chip tone="outline">default</Chip>}
                  </span>
                  <span className="choice__desc" style={{ fontSize: 12 }}>
                    {b.main} · accent {b.accent}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </Panel>
        <Panel title="Modes" tight>
          <Field label="Theme">
            <Segmented
              value={sys.theme.appearance}
              options={[
                { id: 'both', label: 'Light · Dark' },
                { id: 'light', label: 'Light' },
                { id: 'dark', label: 'Dark' },
              ]}
              onChange={(v) => act().updateTheme({ appearance: v })}
            />
          </Field>
          <Field label="Density">
            <Segmented
              value={previewDensity}
              options={[
                { id: 'compact', label: 'Compact' },
                { id: 'standard', label: 'Standard' },
                { id: 'comfortable', label: 'Comfortable' },
              ]}
              onChange={(v) => act().setPreview({ previewDensity: v })}
            />
          </Field>
          <span className="xs muted">In Figma: a theme collection (light/dark) and a density collection. In code: a continuous multiplier snapped to a 4px grid.</span>
        </Panel>
        <Panel title="Presets" tight>
          <div className="stack" style={{ gap: 4 }}>
            {PRESETS.map((p) => (
              <button key={p.id} className={`choice ${sys.theme.presetId === p.id ? 'is-selected' : ''}`} onClick={() => act().applyPreset(p.id)} style={{ padding: 8 }}>
                <Swatch color={`linear-gradient(135deg, ${p.main}, ${p.accent})`} />
                <div className="choice__body">
                  <span className="choice__title" style={{ fontSize: 13 }}>
                    {p.name} <span className="xs muted">· {p.origin}</span>
                  </span>
                </div>
              </button>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid grid--2">
        <Panel title={`Edit ${sys.theme.brands.find((b) => b.id === sys.theme.activeBrand)?.name ?? 'brand'}`}>
          <ThemeEditor />
          <Callout tone="info">Edits preview live. Saving a theme to the system goes through the wizard’s export (a Figma change set) and a pull request; token values in the panel change on merge.</Callout>
        </Panel>
        <div className="stack">
          <LivePreview />
        </div>
      </div>

      {addSheet && (
        <Sheet
          title="Add a brand"
          onClose={() => setAddSheet(false)}
          actions={
            <>
              <Btn variant="secondary" onClick={() => setAddSheet(false)}>
                Cancel
              </Btn>
              <Btn
                disabled={!name.trim()}
                onClick={() => {
                  act().addBrand(name.trim(), main)
                  setAddSheet(false)
                  setName('')
                }}
              >
                Add
              </Btn>
            </>
          }
        >
          <Field label="Brand name" id="b-name">
            <input id="b-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Coral" />
          </Field>
          <Field label="Brand colour">
            <div className="row">
              <input type="color" value={main} onChange={(e) => setMain(e.target.value)} aria-label="Brand colour" style={{ width: 44, height: 36, border: 'none', background: 'none' }} />
              <code>{main}</code>
            </div>
          </Field>
          <Callout tone="warn">Check the Figma plan’s mode limit before adding brands: each brand is a collection that extends the semantic one.</Callout>
        </Sheet>
      )}
    </div>
  )
}
