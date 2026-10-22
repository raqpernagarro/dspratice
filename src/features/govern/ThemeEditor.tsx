import { useStore } from '@/state/store'
import { useSys } from '@/state/hooks'
import { Field, Segmented } from '@/shell/ui'

const FONTS = ['Outfit', 'Figtree', 'Inter', 'Space Grotesk', 'Nunito', 'Fredoka', 'Playfair Display', 'Source Serif 4', 'Orbitron']

/** The single theme configurator (Starter Pack intents + DSN presets). Every field is an intent, never a token. */
export function ThemeEditor() {
  const theme = useSys((s) => s.theme)
  const update = useStore((s) => s.updateTheme)
  return (
    <div className="stack">
      <div className="grid grid--2">
        <Field label="Brand colour" hint="Drives interactive/primary across light and dark.">
          <div className="row">
            <input type="color" value={theme.color.main} onChange={(e) => update({ color: { ...theme.color, main: e.target.value }, presetId: undefined })} aria-label="Brand colour" style={{ width: 44, height: 36, border: 'none', background: 'none' }} />
            <code>{theme.color.main}</code>
          </div>
        </Field>
        <Field label="Accent" hint="Focus rings and highlights.">
          <div className="row">
            <input type="color" value={theme.color.accent} onChange={(e) => update({ color: { ...theme.color, accent: e.target.value }, presetId: undefined })} aria-label="Accent colour" style={{ width: 44, height: 36, border: 'none', background: 'none' }} />
            <code>{theme.color.accent}</code>
          </div>
        </Field>
      </div>
      <div className="grid grid--2">
        <Field label="Heading font">
          <select className="select" value={theme.type.heading} onChange={(e) => update({ type: { ...theme.type, heading: e.target.value }, presetId: undefined })}>
            {FONTS.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </Field>
        <Field label="Body font">
          <select className="select" value={theme.type.body} onChange={(e) => update({ type: { ...theme.type, body: e.target.value }, presetId: undefined })}>
            {FONTS.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label={`Radius · ${theme.radius}px`}>
        <input type="range" min={0} max={20} step={1} value={theme.radius} onChange={(e) => update({ radius: Number(e.target.value), presetId: undefined })} />
      </Field>
      <Field label={`Density · ${theme.density.toFixed(2)}`} hint="Continuous 0.75–1.3, snapped to a 4px grid in the token build (the Starter Pack model). Labelled Compact below 0.9 and Comfortable above 1.1.">
        <input type="range" min={0.75} max={1.3} step={0.05} value={theme.density} onChange={(e) => update({ density: Number(e.target.value), presetId: undefined })} />
      </Field>
      <Field label={`Depth · ${theme.depth.toFixed(2)}`} hint="0 is flat; shadows scale with it.">
        <input type="range" min={0} max={1} step={0.05} value={theme.depth} onChange={(e) => update({ depth: Number(e.target.value), presetId: undefined })} />
      </Field>
      <div className="grid grid--2">
        <Field label="Button shape">
          <Segmented
            value={theme.buttonShape}
            options={[
              { id: 'default', label: 'Default' },
              { id: 'pill', label: 'Pill' },
            ]}
            onChange={(v) => update({ buttonShape: v, presetId: undefined })}
          />
        </Field>
        <Field label="Heading weight">
          <Segmented
            value={String(theme.type.headingWeight) as '500' | '600' | '700'}
            options={[
              { id: '500', label: 'Medium' },
              { id: '600', label: 'Semibold' },
              { id: '700', label: 'Bold' },
            ]}
            onChange={(v) => update({ type: { ...theme.type, headingWeight: Number(v) }, presetId: undefined })}
          />
        </Field>
      </div>
    </div>
  )
}
