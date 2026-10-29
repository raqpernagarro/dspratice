// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=8512-21029
// source=src/components/molecules/EmptyState/EmptyState.tsx
// component=EmptyState
import figma from 'figma'
const instance = figma.selectedInstance
const swap = (prop: string) => {
  const node = instance.getInstanceSwap(prop)
  return node && node.type === 'INSTANCE' ? node.executeTemplate().example : undefined
}
const q = (value: string) => (value.includes('"') ? `{${JSON.stringify(value)}}` : `"${value}"`)
const str = (name: string, value: string | undefined) => (value ? `\n  ${name}=${q(value)}` : '')
const bool = (name: string, value: boolean | undefined) => (value ? `\n  ${name}` : '')
const hasIcon = instance.getBoolean('Has icon')
const icon = hasIcon ? swap('Icon') : undefined
const hasTitle = instance.getBoolean('Has title')
const hasSubtitle = instance.getBoolean('Has subtitle')
const hasActions = instance.getBoolean('Has Actions')

export default {
  example: figma.code`<EmptyState${icon ? figma.code`
  hasIcon
  icon={${icon}}` : ''}${hasTitle ? `\n  hasTitle${str('title', instance.getString('Title'))}` : ''}${hasSubtitle ? `\n  hasSubtitle${str('subtitle', instance.getString('Subtitle'))}` : ''}${hasActions ? `\n  hasActions${bool('showMainCta', instance.getBoolean('Main CTA'))}${bool('showSecondaryOption', instance.getBoolean('Secondary option'))}${bool('showTertiaryOption', instance.getBoolean('Tertiary option'))}${bool('showLink', instance.getBoolean('Link'))}${instance.getBoolean('Help text') ? '' : '\n  showHelpText={false}'}` : ''}
/>`,
  imports: [
    "import { EmptyState } from 'ds-ngr'",
  ],
  id: 'empty-state',
  metadata: { nestable: true, props: {} },
}
