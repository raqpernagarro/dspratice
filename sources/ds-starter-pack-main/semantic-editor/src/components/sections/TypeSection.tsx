import { BrandLink } from '../controls/BrandLink'
import { useSemanticEditor } from '../../context/SemanticEditorContext'
import { primaryFamily, useTokens } from '../../showcase/useThemeVars'
import { FieldGroup, SliderField } from '../controls/Field'
import { FontPicker } from '../controls/FontPicker'

const SCALE_NAMES: [max: number, name: string][] = [
  [1.09, 'Subtle'],
  [1.16, 'Balanced'],
  [1.225, 'Expressive'],
  [Infinity, 'Dramatic'],
]
const scaleName = (r: number) => SCALE_NAMES.find(([max]) => r < max)?.[1] ?? ''

const PREVIEW: [label: string, path: string][] = [
  ['Heading XL', 'heading/xl'],
  ['Heading LG', 'heading/lg'],
  ['Heading MD', 'heading/md'],
  ['Heading SM', 'heading/sm'],
  ['Body LG', 'body/lg'],
  ['Body', 'body/md'],
  ['Body SM', 'body/sm'],
  ['Caption', 'caption/sm'],
]

export function TypeSection() {
  const { modeTheme: theme, patchNested } = useSemanticEditor()
  const t = useTokens()
  const { type } = theme
  const bodySize = parseFloat(t('font/size/body/md')) || 14
  const ratio = parseFloat(t('font/size/body/lg')) / bodySize || 1.125
  const bodyFamily = primaryFamily(t('font/family/primary'))
  const headingFamily = primaryFamily(t('font/family/secondary'))

  return (
    <>
      <BrandLink group="fonts" />
      <FieldGroup title="Fonts" hint="Any Google font. Headings can use a different family.">
        <FontPicker
          label="Body"
          description="Paragraphs, labels and controls"
          value={bodyFamily}
          customized={Boolean(type.body)}
          onChange={(body) => patchNested('type', { body })}
          onReset={() => patchNested('type', { body: null })}
        />
        <FontPicker
          label="Headings"
          description={type.heading ? 'Titles and display text' : 'Titles and display text · same as body'}
          value={headingFamily}
          customized={Boolean(type.heading)}
          onChange={(heading) => patchNested('type', { heading })}
          onReset={() => patchNested('type', { heading: null })}
          resetLabel="Same as body"
        />
      </FieldGroup>

      <FieldGroup
        title="Size"
        hint="Body text size. Every other size scales from it."
        value={`${bodySize}px`}
        customized={type.baseSize != null}
        onReset={() => patchNested('type', { baseSize: null })}
      >
        <SliderField
          label="Body text"
          value={type.baseSize ?? bodySize}
          min={12}
          max={20}
          onChange={(baseSize) => patchNested('type', { baseSize })}
          formatValue={(v) => `${v}px`}
          marks={['12', '14', '16', '18', '20']}
        />
      </FieldGroup>

      <FieldGroup
        title="Contrast between sizes"
        hint="How much bigger each step gets, from captions up to headings."
        value={`${scaleName(ratio)} · ×${ratio.toFixed(3)}`}
        customized={type.scale != null}
        onReset={() => patchNested('type', { scale: null })}
      >
        <SliderField
          label="Scale"
          value={type.scale ?? Math.round(ratio * 1000) / 1000}
          min={1.05}
          max={1.333}
          step={0.005}
          onChange={(scale) => patchNested('type', { scale })}
          formatValue={(v) => `×${v.toFixed(3)}`}
          marks={['Subtle', 'Balanced', 'Expressive', 'Dramatic']}
        />
        <ul className="value-list">
          {PREVIEW.map(([label, path]) => (
            <li key={path}>
              <span>{label}</span>
              <code>
                {t(`font/size/${path}`)} / {t(`font/line-height/${path}`)}
              </code>
            </li>
          ))}
        </ul>
      </FieldGroup>
    </>
  )
}
