/**
 * Component spec: the single source of truth for one design-system component.
 *
 * A spec says, once, what code and Figma must both agree on:
 * - anatomy: Base UI parts ↔ Figma layers ↔ CSS classes
 * - variant axes: Figma variant property ↔ React prop ↔ CSS selector (data attribute / pseudo-class)
 * - bindings: part × property × variant → semantic token, plus the override token the
 *   configurator may put in its place
 *
 * Generators read specs to emit the component's token CSS, the expected Figma anatomy (bindings per
 * variant, same shape as figma-components.json), the configurator catalog and the docs tables.
 */

/** Variant values by axis id, as code slugs: { type: 'primary', size: 'md', state: 'hover' }. */
export type VariantValues = Record<string, string>

export interface AxisValue {
  /** Code slug (prop value, data-attribute value, token segment): 'md', 'hover'. */
  code: string
  /** Figma variant option: 'Medium', 'Hover'. */
  figma: string
  /**
   * CSS conditions selecting this value, appended to the element they apply to. Alternatives are
   * OR-ed. Empty / omitted = the axis default (no condition).
   * Default for `kind: 'prop'` axes: `[data-<attr>="<code>"]`.
   */
  css?: string[]
}

export interface Axis {
  /** Axis id used in values and token templates: 'size'. */
  id: string
  /** Figma variant property name: 'Size'. */
  figma: string
  /**
   * prop: set by the wrapper as a data attribute on the root (data-size="md").
   * state: interaction or Base UI state (:hover, [data-disabled], [data-checked]); conditions are
   *        written per value in `css`.
   */
  kind: 'prop' | 'state'
  /** Data attribute for `kind: 'prop'` (default: `data-<id>`). */
  attr?: string
  /** React prop for `kind: 'prop'` when it isn't the axis id (Button: Type → `variant`). */
  prop?: string
  /**
   * Part whose element carries this axis' condition (default 'root'). Checkbox: Checked lives on
   * the control (`Checkbox.Root[data-checked]`), not on the label wrapping it.
   */
  on?: string
  /**
   * Placement / content only (Side, Orientation, Value): no token differs between its values, so
   * the configurator doesn't offer it as a kind to edit.
   */
  layout?: boolean
  values: AxisValue[]
}

export interface Part {
  /** Part id: 'root', 'label', 'icon'. */
  id: string
  /** Base UI part this renders, for docs: 'Checkbox.Indicator'. Omit for plain elements. */
  baseUi?: string
  /** Figma layer path(s), names joined by ' › ' ('' = the variant itself). */
  figma: string | string[]
  /** Parent part in the DOM (default 'root'). Decides how conditions on other parts are matched. */
  parent?: string
  /**
   * The part is drawn by another part's element in code (Input: Figma's text layer is the <input>
   * itself). Its bindings are written on that element.
   */
  element?: string
  /**
   * In Figma, the part is an instance of another spec'd component (Field's control is an Input).
   * Its insides belong to that component's spec, so the parity check skips them.
   */
  instanceOf?: string
  /**
   * Portalled parts (popups) aren't inside the root in the DOM: root conditions are matched on the
   * part itself, so the wrapper must forward the axis data attributes to it.
   */
  portal?: boolean
  /**
   * With `element`: the part is that element's pseudo-element in code ('::before'). A popup arrow's
   * diamond is the arrow element's ::before; in Figma it's a layer of its own.
   */
  pseudo?: string
  description?: string
}

/** What a binding sets. Each property knows its CSS declarations and Figma fields. */
export type Property =
  | 'background'
  | 'foreground'
  | 'border-color'
  | 'border-width'
  | 'border-top-width'
  | 'border-left-width'
  | 'border-right-width'
  | 'radius'
  /** The two left corners (a drawer docked to the right edge). */
  | 'radius-left'
  /** The two top corners (a tab's indicator sitting on its panel). */
  | 'radius-top'
  /** The two right corners (a drawer docked to the left edge). */
  | 'radius-right'
  | 'padding-x'
  | 'padding-y'
  | 'gap'
  | 'size'
  | 'width'
  | 'height'
  | 'min-height'
  | 'min-width'
  | 'font-family'
  | 'font-size'
  | 'line-height'
  | 'font-weight'
  | 'opacity'
  | 'shadow'
  /** A Figma text style (font family, size, line height, weight in one): 'Body/MD Strong'. */
  | 'text-style'

/** Which semantic tokens a property may point at (configurator swatches / pickers). */
export type TokenKind =
  | 'radius'
  | 'space'
  | 'dimension'
  | 'border-width'
  | 'font-family'
  | 'font-size'
  | 'font-weight'
  | 'line-height'
  | 'background'
  | 'border'
  | 'foreground'
  | 'opacity'
  | 'shadow'
  | 'text-style'

export interface Override {
  /** Stable id within the component: 'space-x', 'label-size', 'background'. */
  id: string
  label: string
  group: 'Container' | 'Label' | 'Icon' | 'Color' | string
  /** Component token name with {axis} placeholders: 'button/space-x/{size}'. */
  token: string
}

export interface Binding {
  part: string
  property: Property
  /** Axes the value varies by (and the override token is split by). [] = one value. */
  by: string[]
  /** Semantic token path (or 'colors/transparent'), possibly per variant. */
  value: string | ((v: VariantValues) => string)
  /** Figma layers when they differ from the part's (e.g. root color → label text + icon vectors). */
  figmaLayers?: string[]
  /** Where the binding exists. Default both. */
  on?: 'both' | 'code' | 'figma'
  /**
   * Code only: an extra condition on the part itself, for a state Figma doesn't draw as a variant
   * (Number Field's − / + segments on hover: ':hover:not([data-disabled])'). Implies on: 'code'.
   */
  when?: string
  /** Lets the configurator replace this binding with a component token. */
  override?: Override
  /**
   * Variants (of the `by` axes) the binding exists in. A drawer on the right binds its left corners,
   * one on the left its right corners. Default: all.
   */
  exists?: (v: VariantValues) => boolean
}

/**
 * Figma component properties the build creates, so designers can adapt an instance without
 * detaching it. `code` names the equivalent in code (a prop, or children).
 *
 * - slot: a drop zone for any content (Figma slot); `layer` is the slot layer, `preferred` the
 *   components Figma suggests for it. The parity check ignores what's inside a slot.
 * - boolean: shows / hides layers.
 * - text: edits the characters of text layers.
 * - expose: shows a nested instance's own properties on the parent.
 */
export type FigmaProp =
  | { kind: 'slot'; name: string; layer: string; preferred?: string[]; code?: string; description?: string }
  | { kind: 'boolean'; name: string; layers: string[]; default: boolean; code?: string }
  | { kind: 'text'; name: string; layers: string[]; default: string; code?: string }
  | { kind: 'expose'; name: string; layer: string; code?: string }

export interface DocSpec {
  summary: string
  /** Base UI docs page. */
  baseUi: string
  usage?: string[]
  dont?: string[]
  accessibility?: string[]
}

export interface ComponentSpec {
  /** Figma component set name: 'Button', 'Icon Button'. */
  name: string
  /** Token / CSS prefix: 'button' → .ds-button, button/… tokens. */
  slug: string
  /** Folder under stories/base-ui/components when it isn't the slug (Menu Item lives in menu/). */
  dir?: string
  axes: Axis[]
  /** Which variant combinations exist (Figma variants, code matrix). Default: all. */
  exists?: (v: VariantValues) => boolean
  /**
   * Token segment per placeholder when it isn't the raw axis value
   * (Button: {type} = 'primary-destructive' when destructive).
   */
  tokenKeys?: Record<string, (v: VariantValues) => string>
  parts: Part[]
  bindings: Binding[]
  /** Figma component properties (slots, booleans, text, exposed instances). */
  figmaProps?: FigmaProp[]
  docs: DocSpec
}

/* ----------------------------------------------------------- property map */

const RADII = ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']
const STROKE_WEIGHTS = ['strokeTopWeight', 'strokeRightWeight', 'strokeBottomWeight', 'strokeLeftWeight']

export interface PropertyInfo {
  css: string[]
  figma: string[]
  kind: TokenKind
}

export const PROPERTIES: Record<Property, PropertyInfo> = {
  background: { css: ['background-color'], figma: ['fills'], kind: 'background' },
  foreground: { css: ['color'], figma: ['fills'], kind: 'foreground' },
  'border-color': { css: ['border-color'], figma: ['strokes'], kind: 'border' },
  'border-width': { css: ['border-width'], figma: STROKE_WEIGHTS, kind: 'border-width' },
  'border-top-width': { css: ['border-top-width'], figma: ['strokeTopWeight'], kind: 'border-width' },
  'border-left-width': { css: ['border-left-width'], figma: ['strokeLeftWeight'], kind: 'border-width' },
  'border-right-width': { css: ['border-right-width'], figma: ['strokeRightWeight'], kind: 'border-width' },
  radius: { css: ['border-radius'], figma: RADII, kind: 'radius' },
  'radius-top': { css: ['border-top-left-radius', 'border-top-right-radius'], figma: ['topLeftRadius', 'topRightRadius'], kind: 'radius' },
  'radius-right': { css: ['border-top-right-radius', 'border-bottom-right-radius'], figma: ['topRightRadius', 'bottomRightRadius'], kind: 'radius' },
  'radius-left': { css: ['border-top-left-radius', 'border-bottom-left-radius'], figma: ['topLeftRadius', 'bottomLeftRadius'], kind: 'radius' },
  'padding-x': { css: ['padding-inline'], figma: ['paddingLeft', 'paddingRight'], kind: 'space' },
  'padding-y': { css: ['padding-block'], figma: ['paddingTop', 'paddingBottom'], kind: 'space' },
  gap: { css: ['gap'], figma: ['itemSpacing'], kind: 'space' },
  size: { css: ['width', 'height'], figma: ['width', 'height'], kind: 'dimension' },
  width: { css: ['width'], figma: ['width'], kind: 'dimension' },
  height: { css: ['height'], figma: ['height'], kind: 'dimension' },
  'min-height': { css: ['min-height'], figma: ['minHeight'], kind: 'dimension' },
  'min-width': { css: ['min-width'], figma: ['minWidth'], kind: 'dimension' },
  'font-family': { css: ['font-family'], figma: ['fontFamily'], kind: 'font-family' },
  'font-size': { css: ['font-size'], figma: ['fontSize'], kind: 'font-size' },
  'line-height': { css: ['line-height'], figma: ['lineHeight'], kind: 'line-height' },
  'font-weight': { css: ['font-weight'], figma: ['fontWeight'], kind: 'font-weight' },
  opacity: { css: ['opacity'], figma: ['opacity'], kind: 'opacity' },
  /** Effect style in Figma (Shadow/Focus Ring/Primary ↔ effect/shadow/focus-ring/primary); 'none' = no style. */
  shadow: { css: ['box-shadow'], figma: ['effectStyle'], kind: 'shadow' },
  /** Text style in Figma; in code the four font tokens the style is bound to (see TEXT_STYLE_FIELDS). */
  'text-style': { css: ['font-family', 'font-size', 'line-height', 'font-weight'], figma: ['textStyle'], kind: 'text-style' },
}

/** A Figma text style and the font tokens it is bound to (figma-text-styles.json, from the scan). */
export interface TextStyle {
  name: string
  fontFamily: string
  fontSize: string
  lineHeight: string
  fontWeight: string
}

/** CSS property ↔ text style field. */
export const TEXT_STYLE_FIELDS = [
  ['font-family', 'fontFamily'],
  ['font-size', 'fontSize'],
  ['line-height', 'lineHeight'],
  ['font-weight', 'fontWeight'],
] as const

/** Figma effect style name → token path: 'Shadow/Focus Ring/Primary' → 'effect/shadow/focus-ring/primary'. */
export const effectStyleToken = (styleName: string) => `effect/${styleName.trim().toLowerCase().replace(/\s+/g, '-')}`

/* --------------------------------------------------------- shared states */

const ENABLED = ':not(:disabled):not([data-disabled])'

/**
 * The interaction-state axis shared by pressable components. `data-preview-state` renders hover /
 * pressed statically (docs, configurator).
 */
export function interactionStates(figma = 'State'): Axis {
  return {
    id: 'state',
    figma,
    kind: 'state',
    values: [
      { code: 'default', figma: 'Default' },
      { code: 'hover', figma: 'Hover', css: [`:hover${ENABLED}`, '[data-preview-state="hover"]'] },
      { code: 'pressed', figma: 'Pressed', css: [`:active${ENABLED}`, '[data-preview-state="pressed"]'] },
      { code: 'disabled', figma: 'Disabled', css: [':disabled', '[data-disabled]'] },
    ],
  }
}

/**
 * Interaction states for a control wrapped in a <label> (Checkbox, Radio, Switch): hovering the
 * text highlights the control; disabled comes from the control (Base UI sets data-disabled there,
 * also when a Field disables it).
 */
export function labelledControlStates(slug: string): Axis {
  const disabled = `:has(> .ds-${slug}__control[data-disabled])`
  return {
    id: 'state',
    figma: 'State',
    kind: 'state',
    values: [
      { code: 'default', figma: 'Default' },
      { code: 'hover', figma: 'Hover', css: [`:hover:not(${disabled})`, '[data-preview-state="hover"]'] },
      { code: 'pressed', figma: 'Pressed', css: [`:active:not(${disabled})`, '[data-preview-state="pressed"]'] },
      { code: 'disabled', figma: 'Disabled', css: [disabled] },
    ],
  }
}

/** sm / md / lg, the size scale every inline control shares with Button. */
export function sizes(): Axis {
  return {
    id: 'size',
    figma: 'Size',
    kind: 'prop',
    values: [
      { code: 'sm', figma: 'Small' },
      { code: 'md', figma: 'Medium' },
      { code: 'lg', figma: 'Large' },
    ],
  }
}

/** Body text style per size: 'Body/SM', 'Body/MD Strong', … */
export const bodyStyle = (size: string, strong = false) => `Body/${size.toUpperCase()}${strong ? ' Strong' : ''}`

/** A true / false prop axis (Figma 'True' / 'False'). */
export function flag(id: string, figma: string): Axis {
  return {
    id,
    figma,
    kind: 'prop',
    values: [
      { code: 'false', figma: 'False' },
      { code: 'true', figma: 'True' },
    ],
  }
}
