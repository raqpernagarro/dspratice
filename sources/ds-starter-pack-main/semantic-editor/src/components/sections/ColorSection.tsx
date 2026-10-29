import { useRef, useState } from 'react'

import { toOklch } from '../../../../stories/base-ui/tokens/color-math'
import { isSeparate, linkMode, MODE_NAMES, separateMode, type Appearance, type Oklch3, type StatusKind } from '../../../../stories/base-ui/tokens/theme-config'
import { mainHex, neutralHue, PAGE_LIGHTNESS } from '../../../../stories/base-ui/tokens/theme-generator'
import { useSemanticEditor } from '../../context/SemanticEditorContext'
import { contrastRatio, toHex } from '../../lib/color'
import { hueDistance, logoColors, type LogoColor } from '../../lib/logo-colors'
import { useTokens } from '../../showcase/useThemeVars'
import { Picker } from '../controls/ColorPicker'
import { GradientSlider, Swatch } from '../controls/ColorSliders'
import { BrandLink } from '../controls/BrandLink'
import { FieldGroup, Segmented, SliderField } from '../controls/Field'
import { HexField } from '../controls/HexField'

const hueTrack = (c: number, l: number) => `linear-gradient(90deg, ${Array.from({ length: 13 }, (_, i) => `oklch(${l} ${c} ${i * 30})`).join(', ')})`

const TINT_NAMES: [max: number, name: string][] = [
  [0.05, 'Pure'],
  [0.3, 'Subtle'],
  [0.7, 'Tinted'],
  [Infinity, 'Vivid'],
]
const tintName = (v: number) => TINT_NAMES.find(([max]) => v < max)?.[1] ?? ''

type SwatchId = StatusKind | 'accent' | 'main'

const STATES: { id: StatusKind; label: string }[] = [
  { id: 'error', label: 'Error' },
  { id: 'warning', label: 'Warning' },
  { id: 'success', label: 'Success' },
  { id: 'info', label: 'Info' },
]

const CONTRAST_PAIRS: [label: string, fg: string, bg: string][] = [
  ['Text', 'color/foreground/neutral/primary', 'color/background/neutral/primary'],
  ['Secondary text', 'color/foreground/neutral/secondary', 'color/background/neutral/primary'],
  ['Primary button', 'color/foreground/on-interactive/primary', 'color/background/interactive/primary/default'],
  ['Accent fill', 'color/foreground/on-accent/primary', 'color/background/accent/default'],
  ['Link', 'color/foreground/interactive/default', 'color/background/neutral/primary'],
  ['Danger button', 'color/foreground/on-danger/primary', 'color/background/interactive/danger/default'],
  ['Error text', 'color/foreground/error', 'color/background/neutral/primary'],
  ['Inverted', 'color/foreground/inverted/primary', 'color/background/inverted/primary'],
]

/** Ready-made page colors, per mode. `null` is the system's own page. */
const PAGES: Record<Appearance, { id: string; label: string; page: Oklch3 | null }[]> = {
  light: [
    { id: 'default', label: 'White', page: null },
    { id: 'off-white', label: 'Off-white', page: { l: 0.985, c: 0.004, h: 90 } },
    { id: 'cream', label: 'Cream', page: { l: 0.965, c: 0.025, h: 85 } },
    { id: 'cool', label: 'Cool grey', page: { l: 0.972, c: 0.008, h: 255 } },
  ],
  dark: [
    { id: 'default', label: 'Default', page: null },
    { id: 'black', label: 'Black', page: { l: 0.14, c: 0, h: 0 } },
    { id: 'charcoal', label: 'Charcoal', page: { l: 0.22, c: 0.005, h: 255 } },
    { id: 'navy', label: 'Navy', page: { l: 0.2, c: 0.045, h: 265 } },
    { id: 'warm', label: 'Warm dark', page: { l: 0.21, c: 0.012, h: 60 } },
  ],
}

const samePage = (a: Oklch3 | null, b: Oklch3 | null) =>
  a === b || (a !== null && b !== null && Math.abs(a.l - b.l) < 0.002 && Math.abs(a.c - b.c) < 0.002 && (a.c < 0.002 || Math.abs(a.h - b.h) < 1))

export function ColorSection() {
  const { modeTheme: theme, patchNested, updateTheme } = useSemanticEditor()
  const { color } = theme
  const separate = isSeparate(theme, theme.appearance)
  const t = useTokens()
  const [editing, setEditing] = useState<SwatchId | 'background' | null>(null)
  const [grid, setGrid] = useState(false)
  const setColor = (patch: Partial<typeof color>) => patchNested('color', patch)
  const logoRef = useRef<HTMLInputElement>(null)
  const [logo, setLogo] = useState<{ name: string; colors: LogoColor[] } | null>(null)

  /** The logo's strongest color becomes the brand; a clearly different second one, the second color. */
  const fromLogo = async (file: File) => {
    const colors = await logoColors(file).catch(() => [])
    setLogo({ name: file.name, colors })
    const [first, ...rest] = colors
    if (!first) return
    const second = rest.find((c) => hueDistance(c.oklch.h, first.oklch.h) >= 40)
    setColor({ main: first.oklch, accent: second?.hex ?? null })
  }

  // The main color as it currently renders; greys/white get a sensible starting chroma.
  const primaryNow = toOklch(t('color/background/interactive/primary/default') || '#000')
  const main: Oklch3 = color.main ?? (primaryNow && primaryNow.c > 0.03 ? { h: primaryNow.h, c: primaryNow.c, l: primaryNow.l } : { h: neutralHue(theme), c: 0.16, l: 0.58 })
  const mainNow = toHex(t('color/background/interactive/primary/default') || '#000').slice(0, 7)
  const setMain = (patch: Partial<Oklch3>) => setColor({ main: { ...main, ...patch } })
  const setMainHex = (hex: string) => {
    const o = toOklch(hex)
    if (o) setColor({ main: { h: o.h, c: o.c, l: o.l } })
  }
  const secondNow = toHex(t('color/foreground/accent') || '#000').slice(0, 7)

  const tint = color.neutralTint ?? 0
  // The page color belongs to the base mode, or to a mode set up separately; a mode that follows
  // takes its hue from the base mode's page.
  const mode = theme.appearance
  const ownsPage = mode === theme.modes[0] || separate
  const pageNow = toHex(t('color/background/neutral/primary') || '#fff').slice(0, 7)
  const pageChoice = PAGES[mode].find((p) => samePage(p.page, color.background))?.id ?? 'custom'
  const setPage = (hex: string) => {
    const o = toOklch(hex)
    if (!o) return
    const [min, max] = PAGE_LIGHTNESS[mode]
    setColor({ background: { h: o.h, c: o.c, l: Math.min(max, Math.max(min, o.l)) } })
  }
  const toggle = (id: SwatchId | 'background') => setEditing((cur) => (cur === id ? null : id))

  return (
    <>
      <BrandLink group="colors" />
      {theme.appearance !== theme.modes[0] ? (
        <FieldGroup
          title={`How ${MODE_NAMES[theme.appearance].toLowerCase()} is made`}
          hint={
            separate
              ? `${MODE_NAMES[theme.appearance]} has its own colors and shadows. Type, shape and spacing stay shared.`
              : `${MODE_NAMES[theme.appearance]} follows ${MODE_NAMES[theme.modes[0]].toLowerCase()} automatically. Color edits here change both modes.`
          }
        >
          <Segmented
            label={`How ${MODE_NAMES[theme.appearance].toLowerCase()} is made`}
            value={separate ? 'separate' : 'linked'}
            options={[
              { value: 'linked', label: `Follows ${MODE_NAMES[theme.modes[0]]}` },
              { value: 'separate', label: 'Own colors' },
            ]}
            onChange={(v) => updateTheme((prev) => (v === 'separate' ? separateMode(prev, prev.appearance) : linkMode(prev, prev.appearance)))}
          />
        </FieldGroup>
      ) : null}

      <FieldGroup
        title="Brand color"
        hint="Buttons, selected states and focus. Type your exact color, pick it, or read it from a logo."
        value={mainNow.toUpperCase()}
        customized={color.main != null}
        onReset={() => setColor({ main: null })}
      >
        <div className="color-row color-row--hex">
          <Swatch color={mainNow} active={editing === 'main'} onClick={() => toggle('main')} />
          <HexField value={mainNow} onChange={setMainHex} label="Brand color" />
          <GradientSlider
            label="Brand hue"
            value={main.h / 360}
            // Paint the track at a readable lightness, whatever the current color's brightness.
            track={hueTrack(Math.max(main.c, 0.12), Math.min(0.75, Math.max(0.55, main.l)))}
            thumb={mainHex(main)}
            onChange={(v) => setMain({ h: v * 360 })}
          />
        </div>
        {editing === 'main' ? <Picker hex={mainNow} onChange={setMainHex} /> : null}
        <div className="logo-colors">
          <input
            ref={logoRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) fromLogo(f)
              e.target.value = ''
            }}
          />
          <button
            type="button"
            className="chrome-btn logo-colors__pick"
            onClick={() => logoRef.current?.click()}
            title="Read the brand colors from a logo image. The file stays in your browser."
          >
            From a logo…
          </button>
          {logo ? (
            logo.colors.length ? (
              <span className="logo-colors__found" aria-label={`Colors found in ${logo.name}`}>
                {logo.colors.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    className="logo-colors__swatch"
                    style={{ background: c.hex }}
                    title={`${c.hex.toUpperCase()} · ${Math.round(c.share * 100)}% of the logo. Click to use as the brand color.`}
                    aria-label={`Use ${c.hex.toUpperCase()} as the brand color`}
                    onClick={() => setColor({ main: c.oklch })}
                  />
                ))}
              </span>
            ) : (
              <small className="logo-colors__none">No brand color found: the logo is only black, white or grey.</small>
            )
          ) : null}
        </div>
      </FieldGroup>

      <FieldGroup
        title="Accent"
        hint="Checked and selected states: checkboxes, radios, switches, slider and progress fills, and the field you're typing in."
        value={secondNow.toUpperCase()}
        customized={color.accent != null}
        onReset={() => setColor({ accent: null })}
      >
        <Segmented
          label="Accent"
          value={color.accent ? 'own' : 'brand'}
          options={[
            { value: 'brand', label: 'Same as brand' },
            { value: 'own', label: 'Own accent' },
          ]}
          onChange={(v) => {
            setColor({ accent: v === 'own' ? color.accent ?? secondNow : null })
            if (v === 'own') setEditing('accent')
          }}
        />
        {color.accent ? (
          <>
            <div className="color-row color-row--hex">
              <Swatch color={secondNow} active={editing === 'accent'} onClick={() => toggle('accent')} />
              <HexField value={secondNow} onChange={(hex) => setColor({ accent: hex })} label="Accent" />
            </div>
            {editing === 'accent' ? <Picker hex={secondNow} onChange={(hex) => setColor({ accent: hex })} /> : null}
          </>
        ) : null}
      </FieldGroup>

      <FieldGroup
        title="Background"
        hint={
          ownsPage
            ? `The page color${
                theme.modes.length > 1 ? ` in ${MODE_NAMES[mode].toLowerCase()}` : ''
              }. Cards, surfaces and subtle borders are worked out from it; text stays readable.`
            : `${MODE_NAMES[mode]} follows ${MODE_NAMES[theme.modes[0]].toLowerCase()}: it takes the hue of the ${MODE_NAMES[
                theme.modes[0]
              ].toLowerCase()} page. To give ${MODE_NAMES[mode].toLowerCase()} its own page color, choose "Own colors" above.`
        }
        value={pageNow.toUpperCase()}
        customized={color.background != null || color.neutralTint != null}
        onReset={() => setColor({ background: null, neutralTint: null })}
      >
        {ownsPage ? (
          <>
            <div className="bg-choices" role="radiogroup" aria-label="Background">
              {PAGES[mode].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={pageChoice === p.id}
                  className={`bg-choice${pageChoice === p.id ? ' is-active' : ''}`}
                  onClick={() => {
                    setColor({ background: p.page })
                    setEditing(null)
                  }}
                >
                  <i style={{ background: p.page ? `oklch(${p.page.l} ${p.page.c} ${p.page.h})` : t('color/background/neutral/primary') }} aria-hidden="true" />
                  {p.label}
                </button>
              ))}
              <button
                type="button"
                role="radio"
                aria-checked={pageChoice === 'custom'}
                className={`bg-choice${pageChoice === 'custom' ? ' is-active' : ''}`}
                onClick={() => toggle('background')}
              >
                <i style={{ background: pageNow }} aria-hidden="true" />
                Your color
              </button>
            </div>
            {editing === 'background' || pageChoice === 'custom' ? (
              <div className="color-row color-row--hex">
                <Swatch color={pageNow} active={editing === 'background'} onClick={() => toggle('background')} />
                <HexField value={pageNow} onChange={setPage} label="Background" />
              </div>
            ) : null}
            {editing === 'background' ? (
              <>
                <p className="field-group__hint">
                  {mode === 'light' ? 'Light pages stay light, so text keeps its contrast.' : 'Dark pages stay dark, so text keeps its contrast.'}
                </p>
                <Picker hex={pageNow} onChange={setPage} />
              </>
            ) : null}
          </>
        ) : null}
        <SliderField
          label="Grey tint"
          value={Math.round(tint * 100) / 100}
          min={0}
          max={1}
          step={0.05}
          onChange={(neutralTint) => setColor({ neutralTint })}
          formatValue={(v) => `${tintName(v)} · ${Math.round(v * 100)}%`}
          marks={['Pure', 'Tinted', 'Vivid']}
        />
        <p className="field-group__hint">How much text, borders and grey surfaces lean toward the brand's hue.</p>
      </FieldGroup>

      <FieldGroup
        title="States"
        hint="Error, warning, success and info: messages, alerts, badges and validation. Error also colors destructive actions."
        customized={Object.values(color.status).some(Boolean)}
        onReset={() => setColor({ status: { info: null, success: null, warning: null, error: null } })}
      >
        <div className="swatch-row">
          {STATES.map(({ id, label }) => (
            <Swatch key={id} label={label} color={t(`color/foreground/${id}`)} active={editing === id} changed={Boolean(color.status[id])} onClick={() => toggle(id)} />
          ))}
        </div>
        {editing && editing !== 'main' && editing !== 'accent' && editing !== 'background' ? (
          <div className="swatch-editor">
            <div className="color-row color-row--hex">
              <Swatch color={toHex(t(`color/foreground/${editing}`) || '#000').slice(0, 7)} onClick={() => setEditing(null)} />
              <HexField
                value={toHex(t(`color/foreground/${editing}`) || '#000').slice(0, 7)}
                onChange={(hex) => setColor({ status: { ...color.status, [editing]: hex } })}
                label={`${editing} color`}
              />
            </div>
            <Picker
              hex={toHex(t(`color/foreground/${editing}`) || '#000').slice(0, 7)}
              onChange={(hex) => setColor({ status: { ...color.status, [editing]: hex } })}
              onReset={color.status[editing] ? () => setColor({ status: { ...color.status, [editing]: null } }) : undefined}
            />
          </div>
        ) : null}
      </FieldGroup>

      <FieldGroup
        title="Color steps"
        hint="How strong hover, pressed and soft tinted fills are, for brand, accent and state colors."
        value={(color.rampContrast ?? 1) === 1 ? 'Default' : `×${(color.rampContrast ?? 1).toFixed(2)}`}
        customized={color.rampContrast != null}
        onReset={() => setColor({ rampContrast: null })}
      >
        <SliderField
          label="Color steps"
          value={color.rampContrast ?? 1}
          min={0.7}
          max={1.3}
          step={0.05}
          onChange={(rampContrast) => setColor({ rampContrast })}
          formatValue={(v) => (v === 1 ? 'Default' : `×${v.toFixed(2)}`)}
          marks={['Soft', 'Default', 'Strong']}
        />
      </FieldGroup>

      <section className="disclosure">
        <header>
          <span>
            <strong>Contrast check</strong>
            <small>Text and fills checked against WCAG</small>
          </span>
          <button type="button" onClick={() => setGrid((v) => !v)} aria-expanded={grid}>
            {grid ? 'Hide' : 'Show'}
          </button>
        </header>
        {grid ? (
          <ul className="contrast-grid">
            {CONTRAST_PAIRS.map(([label, fg, bg]) => {
              const f = t(fg)
              const b = t(bg)
              const ratio = f && b ? contrastRatio(f, b) : 0
              const grade = ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : ratio >= 3 ? 'AA+' : 'Fail'
              return (
                <li key={label}>
                  <span className="contrast-grid__sample" style={{ color: f, background: b }}>
                    Aa
                  </span>
                  <span>{label}</span>
                  <code>{ratio.toFixed(1)}</code>
                  <em className={grade === 'Fail' ? 'is-bad' : ''}>{grade}</em>
                </li>
              )
            })}
          </ul>
        ) : null}
      </section>
    </>
  )
}
