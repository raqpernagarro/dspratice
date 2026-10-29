// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=1218-10394
// source=src/components/atoms/SearchBar/SearchBar.tsx
// component=SearchBar
import figma from 'figma'
const instance = figma.selectedInstance
const flag = (prop: string) => instance.getEnum(prop, { True: true, False: false }) === true
const q = (value: string) => (value.includes('"') ? `{${JSON.stringify(value)}}` : `"${value}"`)
const str = (name: string, value: string | undefined) => (value ? `\n  ${name}=${q(value)}` : '')
const bool = (name: string, value: boolean | undefined) => (value ? `\n  ${name}` : '')
const state = instance.getEnum('State', { Empty: 'empty', Hover: 'empty', Filled: 'filled', Error: 'error', 'Unfilled Focused': 'empty', Typing: 'filled' })
const value = instance.getString('Value')
// Trailing icon / actions have no SearchBar equivalent.

export default {
  example: figma.code`<SearchBar
  variant="ghost"
  aria-label="Search"${state === 'error' ? '\n  error' : ''}${bool('disabled', flag('Disabled'))}${state === 'empty' ? str('placeholder', value) : str('defaultValue', value)}
/>`,
  imports: [
    "import { SearchBar } from 'ds-ngr'",
  ],
  id: 'search-bar-ghost',
  metadata: { nestable: true, props: {} },
}
