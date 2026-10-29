import { sizes, type Axis, type ComponentSpec, type VariantValues } from '../../spec/types'

export type OtpSize = 'sm' | 'md' | 'lg'
type State = 'default' | 'hover' | 'focused' | 'disabled'

/** OTPField.Input sets data-filled / data-focused / data-invalid / data-disabled. */
const flag = (id: string, figma: string, attr: string): Axis => ({
  id,
  figma,
  kind: 'state',
  values: [
    { code: 'false', figma: 'False', css: [`:not([${attr}])`] },
    { code: 'true', figma: 'True', css: [`[${attr}]`] },
  ],
})

const state: Axis = {
  id: 'state',
  figma: 'State',
  kind: 'state',
  values: [
    { code: 'default', figma: 'Default' },
    { code: 'hover', figma: 'Hover', css: [':hover:not([data-disabled]):not([data-focused])', '[data-preview-state="hover"]'] },
    { code: 'focused', figma: 'Focused', css: ['[data-focused]', '[data-preview-state="focused"]'] },
    { code: 'disabled', figma: 'Disabled', css: ['[data-disabled]'] },
  ],
}

const bySize = (sm: string, md: string, lg: string) => (v: VariantValues) => ({ sm, md, lg })[v.size as OtpSize]

function border(v: VariantValues) {
  const s = v.state as State
  if (s === 'disabled') return 'color/border/interactive/disabled'
  if (v.invalid === 'true') return 'color/border/error'
  return s === 'focused' ? 'color/border/interactive/selected' : `color/border/interactive/${s}`
}

export const otpSlotSpec: ComponentSpec = {
  name: 'OTP Slot',
  slug: 'otp-slot',
  dir: 'otp-field',
  axes: [sizes(), state, flag('filled', 'Filled', 'data-filled'), flag('invalid', 'Invalid', 'data-invalid')],
  exists: (v) => !(v.state === 'disabled' && v.invalid === 'true'),
  tokenKeys: { invalid: (v) => (v.invalid === 'true' ? 'invalid' : 'valid'), filled: (v) => (v.filled === 'true' ? 'filled' : 'empty') },
  parts: [
    { id: 'root', baseUi: 'OTPField.Input', figma: '', description: 'One character: a square box like Input’s.' },
    { id: 'value', figma: 'value', element: 'root', description: 'The character, centered (in code, the input itself).' },
  ],
  bindings: [
    { part: 'root', property: 'size', by: ['size'], value: bySize('space/2xl', 'size/lg', 'size/xl'), override: { id: 'size', label: 'Size', group: 'Container', token: 'otp-slot/size/{size}' } },
    { part: 'root', property: 'radius', by: ['size'], value: 'shape/radius/md', override: { id: 'radius', label: 'Radius', group: 'Container', token: 'otp-slot/radius/{size}' } },
    { part: 'root', property: 'border-width', by: [], value: 'size/border/regular', override: { id: 'border-width', label: 'Border width', group: 'Container', token: 'otp-slot/border-width' } },
    { part: 'root', property: 'background', by: ['state'], value: (v) => (v.state === 'disabled' ? 'color/background/interactive/disabled' : 'color/background/neutral/primary'), override: { id: 'background', label: 'Background', group: 'Color', token: 'otp-slot/background/{state}' } },
    { part: 'root', property: 'border-color', by: ['invalid', 'state'], value: border, override: { id: 'border-color', label: 'Border', group: 'Color', token: 'otp-slot/border-color/{invalid}/{state}' } },
    { part: 'root', property: 'shadow', by: ['invalid', 'state'], value: (v) => (v.state !== 'focused' ? 'none' : v.invalid === 'true' ? 'effect/shadow/focus-ring/error' : 'effect/shadow/focus-ring/primary') },
    { part: 'value', property: 'foreground', by: ['state'], value: (v) => (v.state === 'disabled' ? 'color/foreground/interactive/disabled' : 'color/foreground/neutral/primary'), override: { id: 'foreground', label: 'Character', group: 'Color', token: 'otp-slot/foreground/{state}' } },
    { part: 'value', property: 'text-style', by: ['size'], value: bySize('Body/MD', 'Body/LG', 'Heading/SM Regular'), override: { id: 'text-style', label: 'Text style', group: 'Text', token: 'otp-slot/text-style/{size}' } },
  ],
  docs: {
    summary: 'One character box of an OTP Field.',
    baseUi: 'https://base-ui.com/react/components/otp-field',
    usage: ['Only used inside OTP Field.'],
  },
}
