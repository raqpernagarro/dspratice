import { bodyStyle, sizes, type Axis, type ComponentSpec, type VariantValues } from '../../spec/types'

export type AvatarSize = 'sm' | 'md' | 'lg'
export type AvatarType = 'image' | 'initials'

const type: Axis = {
  id: 'type',
  figma: 'Type',
  kind: 'prop',
  values: [
    { code: 'image', figma: 'Image' },
    { code: 'initials', figma: 'Initials' },
  ],
}

const bySize = (sm: string, md: string, lg: string) => (v: VariantValues) => ({ sm, md, lg })[v.size as AvatarSize]

export const avatarSpec: ComponentSpec = {
  name: 'Avatar',
  slug: 'avatar',
  axes: [sizes(), type],
  parts: [
    { id: 'root', baseUi: 'Avatar.Root', figma: '', description: 'The circle. Its background shows behind the initials (and while the image loads).' },
    { id: 'image', baseUi: 'Avatar.Image', figma: 'image', description: 'The picture (Type = Image), cropped to the circle.' },
    { id: 'fallback', baseUi: 'Avatar.Fallback', figma: 'fallback', description: 'Initials (Type = Initials), also shown when the image fails to load.' },
  ],
  bindings: [
    { part: 'root', property: 'size', by: ['size'], value: bySize('space/2xl', 'size/lg', 'size/xl'), override: { id: 'size', label: 'Size', group: 'Container', token: 'avatar/size/{size}' } },
    { part: 'root', property: 'radius', by: [], value: 'shape/radius/full', override: { id: 'radius', label: 'Radius', group: 'Container', token: 'avatar/radius' } },
    { part: 'root', property: 'background', by: [], value: 'color/background/accent/selected', override: { id: 'background', label: 'Background', group: 'Color', token: 'avatar/background' } },
    { part: 'fallback', property: 'foreground', by: [], value: 'color/foreground/on-accent/primary', override: { id: 'foreground', label: 'Initials', group: 'Color', token: 'avatar/foreground' } },
    { part: 'fallback', property: 'text-style', by: ['size'], value: (v) => (v.size === 'sm' ? 'Caption/MD' : bodyStyle(v.size === 'md' ? 'sm' : 'md', true)), override: { id: 'text-style', label: 'Initials style', group: 'Text', token: 'avatar/text-style/{size}' } },
  ],
  docs: {
    summary: 'A person’s picture, or their initials when there is no picture.',
    baseUi: 'https://base-ui.com/react/components/avatar',
    usage: ['Always pass initials as the fallback: images fail, and slow ones show the initials first.', 'Match the size to the text next to it.'],
    dont: ['Don’t use it for logos or icons.'],
    accessibility: ['Give the image alt text with the person’s name, or empty alt when the name is shown next to it.'],
  },
}
