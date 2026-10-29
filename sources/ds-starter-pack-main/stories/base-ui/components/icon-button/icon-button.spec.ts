import type { ComponentSpec, VariantValues } from '../../spec/types'
import { BUTTON_AXES, buttonColorBindings, buttonExists, buttonTokenKeys, type ButtonSize } from '../button/button.spec'

const bySize = (sm: string, md: string, lg: string) => (v: VariantValues) => ({ sm, md, lg })[v.size as ButtonSize]

export const iconButtonSpec: ComponentSpec = {
  name: 'Icon Button',
  slug: 'icon-button',
  axes: BUTTON_AXES,
  exists: buttonExists,
  tokenKeys: buttonTokenKeys,
  parts: [
    { id: 'root', baseUi: 'Button', figma: '', description: 'A square button.' },
    { id: 'icon', figma: 'Icon', description: 'The icon. Its color follows the button’s foreground.' },
  ],
  bindings: [
    ...buttonColorBindings('icon-button', ['Icon › Vector']),
    { part: 'root', property: 'size', by: ['size'], value: bySize('space/2xl', 'size/lg', 'size/xl'), override: { id: 'size', label: 'Size', group: 'Container', token: 'icon-button/size/{size}' } },
    { part: 'root', property: 'radius', by: ['size'], value: 'shape/radius/sm', override: { id: 'radius', label: 'Radius', group: 'Container', token: 'icon-button/radius/{size}' } },
    { part: 'root', property: 'border-width', by: [], value: 'size/border/regular', override: { id: 'border-width', label: 'Border width', group: 'Container', token: 'icon-button/border-width' } },
    { part: 'icon', property: 'size', by: ['size'], value: bySize('size/2xs', 'size/xs', 'size/sm'), override: { id: 'icon-size', label: 'Icon size', group: 'Icon', token: 'icon-button/icon/size/{size}' } },
  ],
  docs: {
    summary: 'A button that shows only an icon. Same types, sizes and states as Button.',
    baseUi: 'https://base-ui.com/react/components/button',
    usage: ['Use for compact, well-known actions (close, more, add) in toolbars, headers and table rows.'],
    dont: ['Don’t use an icon whose meaning isn’t obvious; use Button with a label instead.'],
    accessibility: ['`label` is required: it becomes the aria-label, the only name screen readers announce.'],
  },
}
