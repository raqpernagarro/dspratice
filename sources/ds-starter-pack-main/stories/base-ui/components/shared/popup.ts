/**
 * What every popup shares (Menu, Popover, Tooltip, Preview Card, Listbox, Dialog, …): a surface
 * with a border, radius and elevation, and optionally an arrow pointing at the trigger.
 */
import type { Axis, Binding, Part } from '../../spec/types'

export interface SurfaceOptions {
  /** Padding X / Y and gap tokens; null leaves the property out. */
  spaceX?: string | null
  spaceY?: string | null
  gap?: string | null
  radius?: string
  background?: string
  shadow?: string
  /** Part carrying the surface (default root). */
  part?: string
  /** Token prefix for the overrides (default the slug): 'navigation-menu/popup'. */
  prefix?: string
}

/** The surface's bindings, with overrides named <prefix>/space-x, <prefix>/background, … */
export function surface(slug: string, o: SurfaceOptions = {}): Binding[] {
  const part = o.part ?? 'root'
  const t = o.prefix ?? slug
  const out: Binding[] = []
  if (o.spaceX !== null) out.push({ part, property: 'padding-x', by: [], value: o.spaceX ?? 'space/md', override: { id: 'space-x', label: 'Padding X', group: 'Container', token: `${t}/space-x` } })
  if (o.spaceY !== null) out.push({ part, property: 'padding-y', by: [], value: o.spaceY ?? 'space/md', override: { id: 'space-y', label: 'Padding Y', group: 'Container', token: `${t}/space-y` } })
  if (o.gap) out.push({ part, property: 'gap', by: [], value: o.gap, override: { id: 'gap', label: 'Gap', group: 'Container', token: `${t}/gap` } })
  out.push(
    { part, property: 'radius', by: [], value: o.radius ?? 'shape/radius/lg', override: { id: 'radius', label: 'Radius', group: 'Container', token: `${t}/radius` } },
    { part, property: 'border-width', by: [], value: 'size/border/regular', override: { id: 'border-width', label: 'Border width', group: 'Container', token: `${t}/border-width` } },
    { part, property: 'background', by: [], value: o.background ?? 'color/background/surface/medium', override: { id: 'background', label: 'Background', group: 'Color', token: `${t}/background` } },
    { part, property: 'border-color', by: [], value: 'color/border/neutral/subtle', override: { id: 'border-color', label: 'Border', group: 'Color', token: `${t}/border-color` } },
    { part, property: 'shadow', by: [], value: o.shadow ?? 'effect/shadow/elevation/medium' },
  )
  return out
}

/**
 * The arrow: a 12 × 6 box showing the top half of a bordered diamond (its ::before in code, the
 * `shape` layer in Figma). `parent` is the popup part it sits in.
 */
export function arrowParts(baseUi: string, parent = 'root'): Part[] {
  return [
    { id: 'arrow', baseUi, parent, figma: parent === 'root' ? 'arrow' : `${parent} › arrow`, description: 'Points at the trigger. Placed by Base UI on the side facing it.' },
    {
      id: 'arrow-shape',
      parent: 'arrow',
      element: 'arrow',
      pseudo: '::before',
      figma: parent === 'root' ? 'arrow › shape' : `${parent} › arrow › shape`,
      description: 'The arrow’s diamond (::before in code): the surface’s fill and border, half hidden so only the tip shows.',
    },
  ]
}

/** The diamond takes the surface's colors and border: same override tokens, so they change together. */
export function arrowBindings(slug: string, o: Pick<SurfaceOptions, 'background' | 'prefix'> = {}): Binding[] {
  const t = o.prefix ?? slug
  return [
    { part: 'arrow-shape', property: 'border-width', by: [], value: 'size/border/regular', override: { id: 'border-width', label: 'Border width', group: 'Container', token: `${t}/border-width` } },
    { part: 'arrow-shape', property: 'background', by: [], value: o.background ?? 'color/background/surface/medium', override: { id: 'background', label: 'Background', group: 'Color', token: `${t}/background` } },
    { part: 'arrow-shape', property: 'border-color', by: [], value: 'color/border/neutral/subtle', override: { id: 'border-color', label: 'Border', group: 'Color', token: `${t}/border-color` } },
  ]
}

/**
 * Where the popup sits relative to its trigger (Base UI's data-side on the popup). In Figma it
 * places the arrow on the facing edge; no token differs between sides.
 */
export const sideAxis: Axis = {
  id: 'side',
  figma: 'Side',
  kind: 'state',
  layout: true,
  values: [
    { code: 'bottom', figma: 'Bottom', css: ['[data-side="bottom"]'] },
    { code: 'top', figma: 'Top', css: ['[data-side="top"]'] },
    { code: 'left', figma: 'Left', css: ['[data-side="left"]'] },
    { code: 'right', figma: 'Right', css: ['[data-side="right"]'] },
  ],
}

export type PopupSide = 'bottom' | 'top' | 'left' | 'right'
