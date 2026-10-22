import type { Token, Mode } from '@/state/types'

// Demo Brand token set (fictional). Grammar follows the contract roles
// <tier>-<aspect>-<role>[-<prominence>][-<state>] (the DSN/Starter Pack grammar).
// Seeded drift: dark hover equals dark default on interactive/primary (the demo's main finding).

type Row = [
  path: string,
  type: Token['type'],
  light: string,
  dark: string,
  usedBy: string[],
  layers: number,
  extra?: Partial<Token>,
]

const INTERACTIVE_USERS = ['button', 'icon-button', 'tabs', 'link', 'menu-item', 'toggle', 'pagination']

const PRIMITIVES: Row[] = [
  ['primitive.teal.300', 'color', '#7fd6c4', '#7fd6c4', [], 0],
  ['primitive.teal.500', 'color', '#2a9d8a', '#2a9d8a', [], 0],
  ['primitive.teal.600', 'color', '#1f7a6b', '#1f7a6b', [], 0],
  ['primitive.teal.700', 'color', '#175c51', '#175c51', [], 0],
  ['primitive.blue.300', 'color', '#8bb8ff', '#8bb8ff', [], 0],
  ['primitive.blue.400', 'color', '#388bfd', '#388bfd', [], 0],
  ['primitive.blue.500', 'color', '#1f6feb', '#1f6feb', [], 0],
  ['primitive.neutral.0', 'color', '#ffffff', '#ffffff', [], 0],
  ['primitive.neutral.50', 'color', '#f6f7f9', '#f6f7f9', [], 0],
  ['primitive.neutral.100', 'color', '#e9ecf1', '#e9ecf1', [], 0],
  ['primitive.neutral.300', 'color', '#b9c1cc', '#b9c1cc', [], 0],
  ['primitive.neutral.600', 'color', '#5d6676', '#5d6676', [], 0],
  ['primitive.neutral.800', 'color', '#2a3140', '#2a3140', [], 0],
  ['primitive.neutral.900', 'color', '#161b26', '#161b26', [], 0],
  ['primitive.neutral.950', 'color', '#0b0e15', '#0b0e15', [], 0],
  ['primitive.red.500', 'color', '#d9365a', '#d9365a', [], 0],
  ['primitive.amber.500', 'color', '#e0a100', '#e0a100', [], 0],
  ['primitive.green.500', 'color', '#1e9e62', '#1e9e62', [], 0],
]

const SEMANTIC: Row[] = [
  // interactive / primary — the demo's hero token family
  ['color.background.interactive.primary.default', 'color', '#1f7a6b', '#1f6feb', INTERACTIVE_USERS, 34],
  [
    'color.background.interactive.primary.hover',
    'color',
    '#175c51',
    '#1f6feb',
    INTERACTIVE_USERS,
    34,
    { description: 'Hover state of the primary interactive background.' },
  ],
  ['color.background.interactive.primary.active', 'color', '#124a41', '#8bb8ff', INTERACTIVE_USERS, 21],
  ['color.background.interactive.primary.selected', 'color', '#1f7a6b', '#388bfd', ['tabs', 'pagination', 'menu-item'], 12],
  ['color.background.interactive.primary.disabled', 'color', '#b9c1cc', '#2a3140', INTERACTIVE_USERS, 18],
  ['color.foreground.interactive.primary.default', 'color', '#ffffff', '#0b0e15', INTERACTIVE_USERS, 34],
  ['color.foreground.interactive.primary.hover', 'color', '#ffffff', '#0b0e15', INTERACTIVE_USERS, 34],
  ['color.background.interactive.secondary.default', 'color', '#ffffff', '#161b26', ['button', 'icon-button', 'chip'], 22],
  ['color.background.interactive.secondary.hover', 'color', '#f6f7f9', '#2a3140', ['button', 'icon-button', 'chip'], 22],
  ['color.border.interactive.default', 'color', '#b9c1cc', '#5d6676', ['button', 'input', 'select', 'checkbox'], 40],
  ['color.border.interactive.focus', 'color', '#1f6feb', '#8bb8ff', ['button', 'input', 'select', 'checkbox', 'toggle', 'link'], 58],
  // surface / neutral
  ['color.background.surface.default', 'color', '#ffffff', '#0b0e15', ['card', 'modal', 'table', 'toast'], 96],
  ['color.background.surface.raised', 'color', '#ffffff', '#161b26', ['card', 'modal', 'dropdown-menu'], 44],
  ['color.background.surface.sunken', 'color', '#f6f7f9', '#161b26', ['table', 'page-header'], 19],
  ['color.foreground.neutral.default', 'color', '#161b26', '#f6f7f9', ['card', 'table', 'input', 'modal', 'badge', 'avatar'], 210],
  ['color.foreground.neutral.muted', 'color', '#5d6676', '#b9c1cc', ['card', 'table', 'input', 'badge'], 120],
  ['color.foreground.neutral.subtle', 'color', '#b9c1cc', '#5d6676', ['input', 'table'], 31],
  ['color.border.neutral.default', 'color', '#e9ecf1', '#2a3140', ['card', 'table', 'modal', 'divider'], 140],
  ['color.background.inverse.default', 'color', '#161b26', '#ffffff', ['toast', 'tooltip'], 14],
  ['color.foreground.inverse.default', 'color', '#ffffff', '#161b26', ['toast', 'tooltip'], 14],
  // status
  ['color.background.status.error.soft', 'color', '#fbe7ec', '#3a1620', ['toast', 'alert', 'badge'], 16],
  ['color.foreground.status.error.default', 'color', '#b3223f', '#ff7d97', ['toast', 'alert', 'badge', 'input'], 22],
  ['color.background.status.success.soft', 'color', '#e1f5ea', '#10311f', ['toast', 'alert', 'badge'], 16],
  ['color.foreground.status.success.default', 'color', '#157a4b', '#5fd49a', ['toast', 'alert', 'badge'], 22],
  ['color.background.status.warning.soft', 'color', '#fdf3d6', '#3a2c08', ['toast', 'alert', 'badge'], 12],
  ['color.foreground.status.warning.default', 'color', '#8a6300', '#f2c94c', ['toast', 'alert', 'badge'], 12, { figmaDrift: { dark: '#e0a100' } }],
  ['color.foreground.status.warning.onInverse', 'color', '#f2c94c', '#f2c94c', ['toast'], 3],
  // non-colour
  ['font.family.body', 'font', "'Figtree Variable', Figtree, system-ui, sans-serif", "'Figtree Variable', Figtree, system-ui, sans-serif", ['button', 'input', 'card', 'table'], 0],
  ['font.family.heading', 'font', "'Outfit Variable', Outfit, system-ui, sans-serif", "'Outfit Variable', Outfit, system-ui, sans-serif", ['card', 'modal', 'page-header'], 0],
  ['font.size.sm', 'dimension', '13px', '13px', ['badge', 'table', 'input'], 0],
  ['font.size.md', 'dimension', '15px', '15px', ['button', 'input', 'card'], 0],
  ['font.size.lg', 'dimension', '18px', '18px', ['card', 'modal'], 0],
  ['space.xs', 'dimension', '4px', '4px', ['badge', 'chip'], 0],
  ['space.sm', 'dimension', '8px', '8px', ['button', 'input', 'tabs'], 0],
  ['space.md', 'dimension', '12px', '12px', ['button', 'card', 'table'], 0],
  ['space.lg', 'dimension', '16px', '16px', ['card', 'modal'], 0],
  ['space.xl', 'dimension', '24px', '24px', ['modal', 'page-header'], 0],
  ['size.control.sm', 'dimension', '32px', '32px', ['button', 'icon-button', 'input'], 0],
  ['size.control.md', 'dimension', '40px', '40px', ['button', 'icon-button', 'input', 'select'], 0],
  ['shape.radius.sm', 'dimension', '6px', '6px', ['badge', 'chip', 'input'], 0],
  ['shape.radius.control', 'dimension', '8px', '8px', ['button', 'icon-button', 'input', 'select'], 0],
  ['shape.radius.md', 'dimension', '12px', '12px', ['card', 'toast'], 0],
  ['shape.radius.lg', 'dimension', '20px', '20px', ['modal'], 0],
  ['effect.shadow.md', 'shadow', '0 8px 24px rgba(22,27,38,0.10)', '0 8px 24px rgba(0,0,0,0.5)', ['card', 'modal', 'dropdown-menu'], 0],
  ['motion.duration.fast', 'number', '120ms', '120ms', ['button', 'toggle'], 0],
]

const COMPONENT_TOKENS: Row[] = [
  ['button.background.primary.default', 'color', '{color.background.interactive.primary.default}', '{color.background.interactive.primary.default}', ['button'], 0],
  ['button.radius', 'dimension', '{shape.radius.control}', '{shape.radius.control}', ['button'], 0],
  ['toast.background.default', 'color', '{color.background.inverse.default}', '{color.background.inverse.default}', ['toast'], 0],
  ['toast.foreground.warning', 'color', '{color.foreground.status.warning.onInverse}', '{color.foreground.status.warning.onInverse}', ['toast'], 0],
  ['card.radius', 'dimension', '{shape.radius.md}', '{shape.radius.md}', ['card'], 0],
  ['input.height', 'dimension', '{size.control.md}', '{size.control.md}', ['input', 'select'], 0],
]

function build(rows: Row[], tier: Token['tier']): Token[] {
  return rows.map(([path, type, light, dark, usedBy, layers, extra]) => {
    const id = path.replace(/\./g, '-')
    const figmaPrefix = tier === 'primitive' ? 'primitive' : tier === 'component' ? 'component' : 'semantic'
    return {
      id,
      path,
      tier,
      type,
      figmaName: `${figmaPrefix}/${path.replace(/\./g, '/')}`,
      cssName: `--${id}`,
      values: { light, dark } as Record<Mode, string>,
      usedBy,
      figmaLayerCount: layers,
      hasCodeName: true,
      ...extra,
    }
  })
}

export const DEMO_TOKENS: Token[] = [
  ...build(PRIMITIVES, 'primitive'),
  ...build(SEMANTIC, 'semantic').map((t) =>
    t.id.startsWith('color-background-interactive-primary') || t.id.startsWith('color-foreground-interactive-primary')
      ? {
          ...t,
          brandOverrides: {
            gold: { light: goldFor(t.id, 'light'), dark: goldFor(t.id, 'dark') },
            violet: { light: violetFor(t.id, 'light'), dark: violetFor(t.id, 'dark') },
          },
        }
      : t,
  ),
  ...build(COMPONENT_TOKENS, 'component'),
]

function goldFor(id: string, mode: Mode): string {
  if (id.includes('foreground')) return mode === 'light' ? '#1b1405' : '#1b1405'
  if (id.endsWith('hover')) return mode === 'light' ? '#a87d0b' : '#f0c04b'
  if (id.endsWith('active')) return mode === 'light' ? '#8c6708' : '#ffd36e'
  if (id.endsWith('disabled')) return mode === 'light' ? '#e4d5a8' : '#3a2f12'
  return mode === 'light' ? '#c3921a' : '#e3b23c'
}

function violetFor(id: string, mode: Mode): string {
  if (id.includes('foreground')) return '#ffffff'
  if (id.endsWith('hover')) return mode === 'light' ? '#5b47d6' : '#a897ff'
  if (id.endsWith('active')) return mode === 'light' ? '#4a38b8' : '#c2b6ff'
  if (id.endsWith('disabled')) return mode === 'light' ? '#d7d1f5' : '#2c2550'
  return mode === 'light' ? '#6b4ff5' : '#9583ff'
}

/** The "messy" before-state used by the scan: how many values lacked a code name, etc. */
export const BEFORE_STATE = {
  totalValues: 212,
  valuesWithoutCodeName: 38,
  figmaCollections: 3,
  figmaComponentSets: 41,
  componentsInFigma: 40,
  componentsDiffer: 12,
  contrastFails: 8,
  parityPct: 62,
  tokenSource: 'Style Dictionary JSON',
  storybook: 'Storybook 8',
  react: 'React 18',
}

export const HERO_TOKEN_ID = 'color-background-interactive-primary-hover'
export const HERO_FIX_VALUE = '#388bfd'
