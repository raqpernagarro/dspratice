import type { Axis, ComponentSpec, VariantValues } from '../../spec/types'

export type SkeletonShape = 'text' | 'circle' | 'block'

const shape: Axis = {
  id: 'shape',
  figma: 'Shape',
  kind: 'prop',
  values: [
    { code: 'text', figma: 'Text' },
    { code: 'circle', figma: 'Circle' },
    { code: 'block', figma: 'Block' },
  ],
}

const RADIUS: Record<SkeletonShape, string> = { text: 'shape/radius/sm', circle: 'shape/radius/full', block: 'shape/radius/md' }
const is = (s: SkeletonShape) => (v: VariantValues) => v.shape === s

/** A placeholder in the shape of content that is still loading. Not part of Base UI. */
export const skeletonSpec: ComponentSpec = {
  name: 'Skeleton',
  slug: 'skeleton',
  axes: [shape],
  parts: [{ id: 'root', figma: '', description: 'The placeholder. Text is one line high and fills the width; Circle is an avatar; Block takes the size you give it.' }],
  bindings: [
    { part: 'root', property: 'background', by: [], value: 'color/background/neutral/tertiary', override: { id: 'background', label: 'Background', group: 'Color', token: 'skeleton/background' } },
    { part: 'root', property: 'radius', by: ['shape'], value: (v) => RADIUS[v.shape as SkeletonShape], override: { id: 'radius', label: 'Radius', group: 'Container', token: 'skeleton/radius/{shape}' } },
    { part: 'root', property: 'height', by: ['shape'], value: 'size/2xs', exists: is('text'), override: { id: 'line-height', label: 'Line height', group: 'Container', token: 'skeleton/line-height' } },
    { part: 'root', property: 'size', by: ['shape'], value: 'size/lg', exists: is('circle'), override: { id: 'circle-size', label: 'Circle size', group: 'Container', token: 'skeleton/circle-size' } },
  ],
  docs: {
    summary: 'A placeholder in the shape of content that is still loading, so the page doesn’t jump when it arrives.',
    baseUi: '',
    usage: ['Match the shape of what will load: lines for text, a circle for an avatar, a block for an image or card.', 'Show it only for waits longer than about 300 ms.'],
    dont: ['Don’t use it for actions in progress (saving, sending); use a Button’s loading state or Progress.'],
    accessibility: [
      'Skeletons are hidden from screen readers (aria-hidden). Mark the region that is loading as a status with aria-busy="true" and a label (role="status" aria-label="Loading contacts"), and announce when it’s ready.',
      'The pulse stops when the user asks for reduced motion.',
    ],
  },
}
