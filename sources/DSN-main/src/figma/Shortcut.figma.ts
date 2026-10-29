// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=8508-59670
// source=src/components/atoms/Shortcut/Shortcut.tsx
// component=Shortcut
import figma from 'figma'
const instance = figma.selectedInstance
const q = (value: string) => (value.includes('"') ? `{${JSON.stringify(value)}}` : `"${value}"`)
const label = instance.getString('Label')
const contentColor = instance.getEnum('Appearance', { Default: 'default', Inverted: 'inverted' })
const KEY_NAMES: Record<string, string> = { '⌘': 'Command', '⇧': 'Shift', '⌥': 'Option', '⌃': 'Control', '↵': 'Enter', '⌫': 'Delete', '⎋': 'Escape' }
const spoken = label
  .split(/\s+/)
  .map((key) => KEY_NAMES[key] ?? key)
  .join(' ')

export default {
  example: figma.code`<Shortcut label=${q(label)} aria-label=${q(spoken)}${contentColor === 'inverted' ? ' contentColor="inverted"' : ''} />`,
  imports: [
    "import { Shortcut } from 'ds-ngr'",
  ],
  id: 'shortcut',
  metadata: { nestable: true, props: { label } },
}
