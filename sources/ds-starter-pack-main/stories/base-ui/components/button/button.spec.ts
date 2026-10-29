import { bodyStyle, flag, interactionStates, sizes, type Binding, type ComponentSpec, type VariantValues } from '../../spec/types'

export type ButtonType = 'primary' | 'secondary' | 'ghost' | 'outline'
export type ButtonSize = 'sm' | 'md' | 'lg'
export type ButtonState = 'default' | 'hover' | 'pressed' | 'disabled'
export type ColorRole = 'bg' | 'fg' | 'border'

/* ------------------------------------------------------------------ color */

const SUBTLE = 'color/background/interactive/subtle'
const DANGER_SUBTLE = 'color/background/interactive/danger-subtle'
/** Primitive: the semantic layer has no "transparent" (names describe a job, not a value). */
const TRANSPARENT = 'colors/transparent'

/** Semantic color for one role of a button variant. Shared by Button and Icon Button. */
export function buttonColor(type: ButtonType, destructive: boolean, role: ColorRole, s: ButtonState): string {
  const disabled = s === 'disabled'
  /** Ghost / outline wash: transparent at rest, overlay on hover / press. */
  const wash = (base: string) => (s === 'hover' || s === 'pressed' ? `${base}/${s}` : `${base}/default`)

  if (destructive && type === 'ghost') {
    if (role === 'bg') return wash(DANGER_SUBTLE)
    if (role === 'border') return TRANSPARENT
    return disabled ? 'color/foreground/interactive/disabled' : `color/foreground/interactive/danger/${s}`
  }
  if (destructive && type === 'primary') {
    if (role === 'fg') return disabled ? 'color/foreground/neutral/tertiary' : 'color/foreground/on-danger/primary'
    return disabled ? 'color/background/interactive/disabled' : `color/background/interactive/danger/${s}`
  }
  switch (type) {
    case 'primary':
      if (role === 'fg') return disabled ? 'color/foreground/neutral/tertiary' : 'color/foreground/on-interactive/primary'
      return disabled ? 'color/background/interactive/disabled' : `color/background/interactive/primary/${s}`
    case 'secondary':
      if (role === 'bg') return disabled ? 'color/background/interactive/disabled' : `color/background/interactive/secondary/${s}`
      if (role === 'fg') return disabled ? 'color/foreground/neutral/tertiary' : 'color/foreground/neutral/primary'
      return `color/border/interactive/${s}`
    case 'ghost':
    case 'outline':
      if (role === 'bg') return wash(SUBTLE)
      if (role === 'fg') return disabled ? 'color/foreground/neutral/tertiary' : `color/foreground/interactive/${s}`
      return type === 'outline' ? `color/border/interactive/${s}` : TRANSPARENT
  }
}

const color = (role: ColorRole) => (v: VariantValues) =>
  buttonColor(v.type as ButtonType, v.destructive === 'true', role, v.state as ButtonState)

/* ----------------------------------------------------------------- shared */

export const BUTTON_AXES = [
  {
    id: 'type',
    figma: 'Type',
    kind: 'prop' as const,
    prop: 'variant',
    values: [
      { code: 'primary', figma: 'Primary' },
      { code: 'secondary', figma: 'Secondary' },
      { code: 'ghost', figma: 'Ghost' },
      { code: 'outline', figma: 'Outline' },
    ],
  },
  sizes(),
  interactionStates(),
  flag('destructive', 'Destructive'),
]

/** Destructive exists for Primary and Ghost only. */
export const buttonExists = (v: VariantValues) => v.destructive === 'false' || v.type === 'primary' || v.type === 'ghost'

/** Color tokens are per Type × State; destructive variants count as their own type. */
export const buttonTokenKeys = { type: (v: VariantValues) => `${v.type}${v.destructive === 'true' ? '-destructive' : ''}` }

const COLOR_AXES = ['type', 'destructive', 'state']

/** Background, border and foreground bindings for a button-like component. */
export function buttonColorBindings(slug: string, foregroundLayers: string[]): Binding[] {
  return [
    { part: 'root', property: 'background', by: COLOR_AXES, value: color('bg'), override: { id: 'background', label: 'Background', group: 'Color', token: `${slug}/background/{type}/{state}` } },
    { part: 'root', property: 'border-color', by: COLOR_AXES, value: color('border'), override: { id: 'border-color', label: 'Border', group: 'Color', token: `${slug}/border-color/{type}/{state}` } },
    { part: 'root', property: 'foreground', by: COLOR_AXES, value: color('fg'), figmaLayers: foregroundLayers, override: { id: 'foreground', label: 'Foreground', group: 'Color', token: `${slug}/foreground/{type}/{state}` } },
  ]
}

const bySize = (sm: string, md: string, lg: string) => (v: VariantValues) => ({ sm, md, lg })[v.size as ButtonSize]

/* ------------------------------------------------------------------- spec */

export const buttonSpec: ComponentSpec = {
  name: 'Button',
  slug: 'button',
  axes: BUTTON_AXES,
  exists: buttonExists,
  tokenKeys: buttonTokenKeys,
  parts: [
    { id: 'root', baseUi: 'Button', figma: '', description: 'The button. Holds the background, border and padding.' },
    { id: 'label', figma: 'labelWrapper', description: 'Wraps the text, with its own horizontal padding.' },
    { id: 'icon', figma: ['leadIcon', 'trailIcon'], description: 'Optional icons before and after the label.' },
  ],
  bindings: [
    ...buttonColorBindings('button', ['labelWrapper › label', 'leadIcon › Vector', 'trailIcon › Vector']),
    { part: 'root', property: 'border-width', by: [], value: 'size/border/regular' },
    { part: 'root', property: 'radius', by: ['size'], value: 'shape/radius/sm', override: { id: 'radius', label: 'Radius', group: 'Container', token: 'button/radius/{size}' } },
    // Fixed heights on the shared control scale, so Button lines up with Input, Select, … of the same size.
    { part: 'root', property: 'height', by: ['size'], value: bySize('space/2xl', 'size/lg', 'size/xl'), override: { id: 'height', label: 'Height', group: 'Container', token: 'button/height/{size}' } },
    { part: 'root', property: 'padding-x', by: ['size'], value: bySize('space/xs', 'space/sm', 'space/md'), override: { id: 'space-x', label: 'Padding X', group: 'Container', token: 'button/space-x/{size}' } },
    { part: 'root', property: 'gap', by: ['size'], value: bySize('space/2xs', 'space/2xs', 'space/xs'), override: { id: 'gap', label: 'Gap', group: 'Container', token: 'button/gap/{size}' } },
    { part: 'label', property: 'padding-x', by: ['size'], value: (v) => `button/label/space-x/${v.size}`, override: { id: 'label-space-x', label: 'Label padding', group: 'Label', token: 'button/label/space-x/{size}' } },
    { part: 'label', property: 'text-style', by: ['size'], value: (v) => bodyStyle(v.size, true), figmaLayers: ['labelWrapper › label'], override: { id: 'label-style', label: 'Text style', group: 'Label', token: 'button/label/text-style/{size}' } },
    { part: 'icon', property: 'size', by: ['size'], value: bySize('size/2xs', 'size/xs', 'size/sm'), override: { id: 'icon-size', label: 'Icon size', group: 'Icon', token: 'button/icon/size/{size}' } },
  ],
  docs: {
    summary: 'Triggers an action. Four types set its emphasis; destructive marks actions that delete or can’t be undone.',
    baseUi: 'https://base-ui.com/react/components/button',
    usage: [
      'Use one Primary button per view for the main action.',
      'Use Secondary or Outline for alternatives next to it, Ghost for low-emphasis actions in toolbars and lists.',
      'Use Destructive (Primary or Ghost) only for actions that delete data or can’t be undone.',
    ],
    dont: ['Don’t use a button for navigation; use a link.', 'Don’t put more than one Primary button side by side.'],
    accessibility: [
      'Renders a native <button>; Enter and Space activate it.',
      'Keep the label: an icon-only action should use Icon Button, which requires an accessible label.',
      'Disabled buttons are skipped by keyboard focus. Use focusableWhenDisabled for buttons that become disabled while focused (e.g. while submitting).',
    ],
  },
}
