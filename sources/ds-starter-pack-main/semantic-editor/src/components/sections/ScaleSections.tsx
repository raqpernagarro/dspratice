import { radiusScale, shadowScale } from '../../../../stories/base-ui/tokens/theme-generator'
import { useSemanticEditor } from '../../context/SemanticEditorContext'
import { BrandLink, SharedNote } from '../controls/BrandLink'
import { tv, useTokens } from '../../showcase/useThemeVars'
import { FieldGroup, SliderField, SwitchField } from '../controls/Field'

const px = (v: string) => Math.round(parseFloat(v) || 0)

/** One switch for the whole system, shown with spacing and with corners. */
function GridSwitch() {
  const { theme, patchTheme } = useSemanticEditor()
  return (
    <SwitchField
      label="Keep to the 4px grid"
      description="Spacing, sizes and corners land on multiples of 4 (2 below that). Off for any pixel value."
      checked={theme.grid}
      onChange={(grid) => patchTheme({ grid })}
    />
  )
}

/* -------------------------------------------------------------------- Radius */

const RADIUS_PRESETS: [label: string, md: number][] = [
  ['Sharp', 0],
  ['Subtle', 4],
  ['Soft', 8],
  ['Round', 12],
  ['Extra', 20],
]

const RADIUS_STEPS: [step: 'sm' | 'md' | 'lg' | 'full', use: string][] = [
  ['sm', 'Checkboxes, tags'],
  ['md', 'Buttons, inputs'],
  ['lg', 'Cards, popovers'],
  ['full', 'Pills, avatars'],
]

export function RadiusSection() {
  const { modeTheme: theme, patchTheme } = useSemanticEditor()
  const t = useTokens()
  const md = theme.radius ?? px(t('shape/radius/md'))
  const scale = radiusScale(md, theme.grid)

  return (
    <>
      <BrandLink group="shape" />
      <FieldGroup
        title="Corner radius"
        hint="One value drives every corner: small elements get less, containers get more."
        value={`${scale.sm} · ${scale.md} · ${scale.lg}px`}
        customized={theme.radius != null}
        onReset={() => patchTheme({ radius: null })}
      >
        <SliderField
          label="Roundness"
          value={theme.grid ? scale.md : md}
          min={0}
          max={24}
          step={theme.grid ? 4 : 1}
          onChange={(radius) => patchTheme({ radius })}
          formatValue={(v) => `${v}px`}
        />
        <div className="preset-chips">
          {RADIUS_PRESETS.map(([label, value]) => (
            <button key={label} type="button" className={md === value ? 'is-active' : ''} onClick={() => patchTheme({ radius: value })}>
              {label}
            </button>
          ))}
        </div>
        <GridSwitch />
        <ul className="radius-preview">
          {RADIUS_STEPS.map(([step, use]) => (
            <li key={step}>
              <span className="radius-preview__shape" style={{ borderRadius: tv(`shape/radius/${step}`) }} />
              <strong>{step}</strong>
              <code>{step === 'full' ? 'pill' : t(`shape/radius/${step}`)}</code>
              <small>{use}</small>
            </li>
          ))}
        </ul>
      </FieldGroup>
    </>
  )
}

/* ------------------------------------------------------------------- Spacing */

const SPACE = ['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl']
const SIZES: [step: string, use: string][] = [
  ['xs', 'Icons'],
  ['sm', 'Small controls'],
  ['md', 'Compact controls'],
  ['lg', 'Controls'],
  ['xl', 'Large controls'],
]

const densityName = (k: number) => (k < 0.9 ? 'Compact' : k > 1.1 ? 'Comfortable' : 'Default')

export function SpacingSection() {
  const { theme, patchTheme } = useSemanticEditor()
  const t = useTokens()
  const k = theme.density ?? 1
  const max = Math.max(...SPACE.map((s) => px(t(`space/${s}`))), 1)

  return (
    <>
      <SharedNote what="Spacing" />
      <FieldGroup
        title="Density"
        hint="Scales spacing and control sizes together."
        value={`${densityName(k)} · ×${k.toFixed(2)}`}
        customized={theme.density != null}
        onReset={() => patchTheme({ density: null })}
      >
        <SliderField
          label="Density"
          value={k}
          min={0.75}
          max={1.3}
          step={0.05}
          onChange={(density) => patchTheme({ density })}
          formatValue={(v) => `×${v.toFixed(2)}`}
          marks={['Compact', 'Default', 'Comfortable']}
        />
        <GridSwitch />
      </FieldGroup>

      <FieldGroup title="Spacing scale" hint="Gaps and padding.">
        <ul className="space-preview">
          {SPACE.map((s) => {
            const v = px(t(`space/${s}`))
            return (
              <li key={s}>
                <code>{s}</code>
                <span className="space-preview__track">
                  <span style={{ width: `${(v / max) * 100}%` }} />
                </span>
                <code>{v}px</code>
              </li>
            )
          })}
        </ul>
      </FieldGroup>

      <FieldGroup title="Sizes" hint="Heights of controls and icons.">
        <ul className="value-list">
          {SIZES.map(([s, use]) => (
            <li key={s}>
              <span>{use}</span>
              <code>{t(`size/${s}`)}</code>
            </li>
          ))}
        </ul>
      </FieldGroup>
    </>
  )
}

/* ------------------------------------------------------------------- Shadows */

export function ShadowSection() {
  const { modeTheme: theme, patchTheme } = useSemanticEditor()
  const t = useTokens()
  // Without a custom value, place the slider where the current low shadow sits.
  const current = theme.depth ?? Math.min(1, px(t('effect/shadow/elevation/low/blur')) / 8)
  const levels = shadowScale(current)

  return (
    <>
      <BrandLink group="shape" />
      <FieldGroup
        title="Shadow strength"
        hint="How far surfaces lift off the page: cards, dropdowns, dialogs."
        value={current === 0 ? 'Flat' : `${Math.round(current * 100)}%`}
        customized={theme.depth != null}
        onReset={() => patchTheme({ depth: null })}
      >
        <SliderField
          label="Strength"
          value={Math.round(current * 100) / 100}
          min={0}
          max={1}
          step={0.05}
          onChange={(depth) => patchTheme({ depth })}
          formatValue={(v) => (v === 0 ? 'Flat' : `${Math.round(v * 100)}%`)}
          marks={['Flat', 'Subtle', 'Elevated']}
        />
        <ul className="shadow-preview">
          {(['low', 'medium', 'high'] as const).map((level) => (
            <li key={level} style={{ boxShadow: tv(`effect/shadow/elevation/${level}`) }}>
              <strong>{level}</strong>
              <code>
                y {theme.depth != null ? levels[level].y : px(t(`effect/shadow/elevation/${level}/offset-y`))} · blur{' '}
                {theme.depth != null ? levels[level].blur : px(t(`effect/shadow/elevation/${level}/blur`))}
              </code>
            </li>
          ))}
        </ul>
      </FieldGroup>
    </>
  )
}
