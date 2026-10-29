/**
 * A screen is a tree of nodes. Each node is a design-system component or a layout primitive.
 * The agent writes this tree (never code); the renderer draws it with the real components and
 * semantic tokens. Unknown node types render as a visible placeholder instead of breaking.
 */

export type Child = UiNode | string

export interface UiNode {
  type: string
  props?: Record<string, unknown>
  children?: Child[]
}

export interface NodeDoc {
  type: string
  group: 'Layout' | 'Text' | 'Components' | 'Patterns'
  props: string
  children?: string
}

/** The vocabulary, also sent to the agent as its reference. */
export const NODE_DOCS: NodeDoc[] = [
  { type: 'stack', group: 'Layout', props: 'direction: "row"|"column" (column), gap: "2xs"|"xs"|"sm"|"md"|"lg"|"xl"|"2xl" (md), align: "start"|"center"|"end"|"stretch", justify: "start"|"center"|"end"|"between", wrap: boolean, grow: boolean', children: 'any' },
  { type: 'grid', group: 'Layout', props: 'columns: 1–6 (2), gap (md), minWidth: px for auto-fit columns', children: 'any' },
  { type: 'box', group: 'Layout', props: 'padding: gap step (md), surface: "primary"|"secondary"|"tertiary"|"inverted" (none), border: boolean, radius: "sm"|"md"|"lg", grow: boolean, maxWidth: px', children: 'any' },
  { type: 'appShell', group: 'Layout', props: 'brand: string, nav: [{label, icon, active}], user: initials string', children: 'the main area' },
  { type: 'mobileShell', group: 'Layout', props: 'title: string, tabs: [{label, icon, active}]', children: 'the screen content' },
  { type: 'topNav', group: 'Layout', props: 'brand: string, links: string[], cta: string', children: 'none' },
  { type: 'pageHeader', group: 'Layout', props: 'title, subtitle, eyebrow', children: 'actions (buttons) on the right' },
  { type: 'section', group: 'Layout', props: 'title, subtitle', children: 'content below the heading' },
  { type: 'heading', group: 'Text', props: 'text, level: 1|2|3|4 (2)' },
  { type: 'text', group: 'Text', props: 'text, tone: "primary"|"secondary"|"tertiary" (secondary), size: "sm"|"md"|"lg" (md), strong: boolean, align: "start"|"center"' },
  { type: 'link', group: 'Text', props: 'text' },
  { type: 'icon', group: 'Text', props: 'name (see icon list), tone: "primary"|"secondary"|"accent"|"success"|"warning"|"error"' },
  { type: 'button', group: 'Components', props: 'label, variant: "primary"|"secondary"|"outline"|"ghost" (primary), size: "sm"|"md"|"lg" (md), destructive: boolean, icon: icon name, trailIcon: icon name' },
  { type: 'iconButton', group: 'Components', props: 'label (required, for screen readers), icon, variant (ghost), size' },
  { type: 'input', group: 'Components', props: 'label (omit for a bare search box), placeholder, description, type: "text"|"email"|"password"|"search", search: boolean (shows the search icon)' },
  { type: 'select', group: 'Components', props: 'label, placeholder, options: string[], value' },
  { type: 'checkbox', group: 'Components', props: 'label, checked: boolean' },
  { type: 'switch', group: 'Components', props: 'label, checked: boolean' },
  { type: 'radioGroup', group: 'Components', props: 'label, options: string[], value' },
  { type: 'badge', group: 'Components', props: 'label, tone: "neutral"|"info"|"success"|"warning"|"error"' },
  { type: 'avatar', group: 'Components', props: 'initials, size: "sm"|"md"|"lg"' },
  { type: 'card', group: 'Components', props: 'title, description, elevated: boolean', children: 'card body; put buttons in a final stack' },
  { type: 'tabs', group: 'Components', props: 'items: string[], value', children: 'content of the selected tab' },
  { type: 'progress', group: 'Components', props: 'label, value: 0–100' },
  { type: 'meter', group: 'Components', props: 'label, value: 0–100' },
  { type: 'separator', group: 'Components', props: '' },
  { type: 'breadcrumb', group: 'Components', props: 'items: string[] (last = current page)' },
  { type: 'pagination', group: 'Components', props: 'pageCount, page' },
  { type: 'emptyState', group: 'Components', props: 'title, description, icon', children: 'actions' },
  { type: 'skeleton', group: 'Components', props: 'shape: "text"|"circle"|"block", width, height' },
  { type: 'alert', group: 'Patterns', props: 'tone: "info"|"success"|"warning"|"error", title, text' },
  { type: 'stat', group: 'Patterns', props: 'label, value, delta (e.g. "+12%"), trend: "up"|"down"' },
  { type: 'table', group: 'Patterns', props: 'columns: string[], rows: cell[][] where a cell is a string or {badge, tone} or {avatar, text}' },
  { type: 'chart', group: 'Patterns', props: 'kind: "bar"|"line", values: number[], labels: string[], height: px (160)' },
  { type: 'list', group: 'Patterns', props: 'items: [{title, subtitle, meta, initials}]' },
  { type: 'image', group: 'Patterns', props: 'label (what the picture shows), ratio: "16:9"|"4:3"|"1:1"|"3:4"' },
]

export const ICON_NAMES = [
  'house', 'chart', 'users', 'user', 'gear', 'bell', 'search', 'plus', 'check', 'x', 'arrow-right', 'arrow-left', 'calendar', 'file', 'folder',
  'cart', 'tag', 'heart', 'star', 'chat', 'mail', 'lock', 'download', 'upload', 'filter', 'trash', 'pencil', 'eye', 'globe', 'lightning',
  'clock', 'credit-card', 'package', 'truck', 'book', 'question', 'info', 'warning', 'sparkle', 'shield', 'rocket', 'camera', 'play',
]

export function isNode(v: unknown): v is UiNode {
  return !!v && typeof v === 'object' && typeof (v as UiNode).type === 'string'
}

/** Keeps only well-formed nodes and strings; caps depth and size so a bad tree can't hang the page. */
export function sanitizeTree(v: unknown, depth = 0, budget = { n: 0 }): UiNode | null {
  if (!isNode(v) || depth > 14 || budget.n > 800) return null
  budget.n++
  const children = Array.isArray(v.children)
    ? v.children
        .map((c) => (typeof c === 'string' ? c : sanitizeTree(c, depth + 1, budget)))
        .filter((c): c is Child => c !== null)
    : undefined
  return { type: v.type, props: v.props && typeof v.props === 'object' ? v.props : {}, children }
}

export function vocabulary(): string {
  const groups = ['Layout', 'Text', 'Components', 'Patterns'] as const
  return groups
    .map((g) => `${g}:\n${NODE_DOCS.filter((d) => d.group === g).map((d) => `- ${d.type}: ${d.props}${d.children ? `. children: ${d.children}` : ''}`).join('\n')}`)
    .join('\n\n') + `\n\nIcons: ${ICON_NAMES.join(', ')}`
}
