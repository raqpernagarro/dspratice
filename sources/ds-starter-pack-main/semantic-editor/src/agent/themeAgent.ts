import type { BetaTool } from '@anthropic-ai/sdk/resources/beta/messages/messages'

import { isSeparate, withModeIntents, writeIntents, type Oklch3, type StatusKind, type ThemeConfig, type WebFont } from '../../../stories/base-ui/tokens/theme-config'
import { webFontFor } from '../components/controls/FontPicker'
import catalog from '../data/google-fonts.json'
import { describeExtras, readExtras, sanitizeExtras, stripLegacyExtras, type StyleExtras } from './styleExtras'

type Row = [family: string, category: string, weights: number[], variable: boolean]
const FONTS = catalog as Row[]
/** The catalog is ordered by popularity; the agent picks from the first few hundred. */
const FONT_CHOICES = FONTS.slice(0, 300).map((r) => r[0])

export const THEME_STAGES = [
  { id: 'understand', label: 'Reading your brief' },
  { id: 'color', label: 'Choosing colors' },
  { id: 'type', label: 'Picking typefaces' },
  { id: 'shape', label: 'Shaping corners' },
  { id: 'space', label: 'Setting density' },
  { id: 'depth', label: 'Adding depth' },
  { id: 'check', label: 'Checking contrast and balance' },
] as const
export type StageId = (typeof THEME_STAGES)[number]['id']

/** What the agent returns: every theme intent, null meaning "system default". */
export interface ThemeProposal {
  summary: string
  appearance: 'light' | 'dark'
  main: Oklch3 | null
  accent: string | null
  neutralTint: number | null
  rampContrast: number | null
  status: Record<StatusKind, string | null>
  bodyFont: string | null
  headingFont: string | null
  baseSize: number | null
  scale: number | null
  radius: number | null
  density: number | null
  depth: number | null
  /** Character beyond the sliders: borders, shadow style, button shape, heading weight. */
  extras: StyleExtras
}

const nullable = (schema: Record<string, unknown>) => ({ anyOf: [schema, { type: 'null' }] })
const hex = { type: 'string', description: 'Hex color, #rrggbb.' }

export const THEME_TOOLS: BetaTool[] = [
  {
    name: 'report_progress',
    description:
      'Tell the user what you are deciding, one stage at a time and in order. Call it once per stage before apply_theme. The message is shown live in the app.',
    strict: true,
    input_schema: {
      type: 'object',
      properties: {
        stage: { type: 'string', enum: THEME_STAGES.map((s) => s.id) },
        message: { type: 'string', description: 'One or two short, plain sentences: what you chose and why. No jargon.' },
      },
      required: ['stage', 'message'],
      additionalProperties: false,
    },
  },
  {
    name: 'apply_theme',
    description: 'Apply the finished theme. Call it exactly once, after reporting every stage. Use null to keep the system default for a value.',
    strict: true,
    input_schema: {
      type: 'object',
      properties: {
        summary: { type: 'string', description: 'One sentence describing the result for the user.' },
        appearance: { type: 'string', enum: ['light', 'dark'] },
        main: nullable({
          type: 'object',
          description: 'Brand color in OKLCH.',
          properties: {
            h: { type: 'number', description: 'Hue 0–360.' },
            c: { type: 'number', description: 'Chroma 0–0.3.' },
            l: { type: 'number', description: 'Lightness 0.3–0.9.' },
          },
          required: ['h', 'c', 'l'],
          additionalProperties: false,
        }),
        accent: nullable(hex),
        neutralTint: nullable({ type: 'number', description: '0 pure grey … 1 greys tinted strongly toward the brand hue.' }),
        rampContrast: nullable({ type: 'number', description: '0.7 soft … 1.3 punchy palettes. 1 is default.' }),
        status: {
          type: 'object',
          properties: { info: nullable(hex), success: nullable(hex), warning: nullable(hex), error: nullable(hex) },
          required: ['info', 'success', 'warning', 'error'],
          additionalProperties: false,
        },
        bodyFont: nullable({ type: 'string', description: 'Google Fonts family from the allowed list.' }),
        headingFont: nullable({ type: 'string', description: 'Google Fonts family from the allowed list, or null to use the body font.' }),
        baseSize: nullable({ type: 'number', description: 'Body text size in px, 12–20. Default 16.' }),
        scale: nullable({ type: 'number', description: 'Type scale ratio, 1.05–1.333. Default about 1.2.' }),
        radius: nullable({ type: 'number', description: 'Medium corner radius in px, 0–24. Default 8.' }),
        density: nullable({ type: 'number', description: 'Spacing multiplier, 0.75 (compact) … 1.3 (airy). Default 1.' }),
        depth: nullable({ type: 'number', description: 'Shadow strength, 0 flat … 1 strongly elevated. Default about 0.4. Ignored for hard and glow shadows.' }),
        extras: {
          type: 'object',
          description: 'Character the sliders cannot reach. Use defaults unless the look calls for it.',
          properties: {
            borderWidth: { type: 'integer', enum: [1, 2, 3], description: 'Stroke width in px. 1 is default; 2–3 for bold, graphic, cartoon or brutalist looks.' },
            borderColor: { type: 'string', enum: ['default', 'ink', 'brand'], description: 'ink = near-black outlines (comic, brutalist); brand = outlines in the brand color (neon, techy).' },
            shadow: { type: 'string', enum: ['default', 'none', 'hard', 'glow'], description: 'default = soft (depth applies); none = flat; hard = offset sticker shadow with no blur (cartoon, brutalist); glow = brand-colored halo (neon, dark).' },
            buttonShape: { type: 'string', enum: ['default', 'pill'], description: 'pill = fully rounded buttons.' },
            headingWeight: { type: 'integer', enum: [400, 500, 600, 700, 800, 900], description: '700 is default. Lighter for elegant serif headlines, heavier for loud looks. The heading font must have that weight.' },
          },
          required: ['borderWidth', 'borderColor', 'shadow', 'buttonShape', 'headingWeight'],
          additionalProperties: false,
        },
      },
      required: ['summary', 'appearance', 'main', 'accent', 'neutralTint', 'rampContrast', 'status', 'bodyFont', 'headingFont', 'baseSize', 'scale', 'radius', 'density', 'depth', 'extras'],
      additionalProperties: false,
    },
  },
]

export function themeSystemPrompt(): string[] {
  return [
    `You are the styling agent inside the DS Configurator, a tool that sets up design systems for people who may be new to them.
The user describes a look ("like Cartoon Network", "calm healthcare app", "make it darker"). You turn it into the configurator's theme intents. You never write CSS or tokens: the configurator generates every token from your intents, for light and dark.

Work in this order and call report_progress once per stage, before deciding the next one:
${THEME_STAGES.map((s, i) => `${i + 1}. ${s.id}: ${s.label}`).join('\n')}
Then call apply_theme once with the complete result.

How the intents work:
- main: the brand color in OKLCH. It drives buttons, links, selected states and focus. Keep l between 0.45 and 0.7 so text on it and around it stays readable.
- accent: an optional second color for highlights. null follows main.
- neutralTint: how much greys lean toward the brand hue. Playful brands 0.2–0.5, corporate 0–0.15.
- rampContrast: palette punch. Bold looks 1.1–1.3, calm looks 0.8–0.95.
- status colors: null keeps accessible defaults. Only change them when the brief asks for it.
- fonts: pick only from the allowed list below. A heading font is optional.
- radius, density, depth: corner roundness, spacing, shadow strength.
- extras: commit to the character of the look. A cartoon look wants thick ink borders, hard offset shadows and pill buttons; neon wants brand-colored borders and glow; an elegant editorial look wants hairlines, no shadows and lighter serif headlines. Calm or corporate looks keep the defaults.

Rules:
- Reference brands are inspiration, not copies: capture the mood (color energy, roundness, weight), never logos or trademarks.
- Prefer accessible choices. In the check stage, say plainly if a requested color needed adjusting for contrast.
- If the user asks for a change to the current theme, keep everything else as it is.
- Progress messages are for a non-expert: short, warm, concrete. Example: "Cartoon Network feels bold and graphic, so I’m going with a saturated cyan and punchy contrast."

Allowed fonts: ${FONT_CHOICES.join(', ')}.`,
  ]
}

export function themeUserPrompt(brief: string, theme: ThemeConfig, projectLine: string): string {
  // The choices in the mode being styled (a separate mode has its own colors and depth).
  const current = withModeIntents(theme)
  const intents = {
    appearance: current.appearance,
    main: current.color.main,
    accent: current.color.accent,
    neutralTint: current.color.neutralTint,
    rampContrast: current.color.rampContrast,
    status: current.color.status,
    bodyFont: current.type.body?.family ?? null,
    headingFont: current.type.heading?.family ?? null,
    baseSize: current.type.baseSize,
    scale: current.type.scale,
    radius: current.radius,
    density: current.density,
    depth: current.depth,
    extras: readExtras(current),
  }
  return `${projectLine}

Current theme intents (null = system default):
${JSON.stringify(intents, null, 2)}

The user's request:
${brief}`
}

/* -------------------------------------------------------------- validation */

const clamp = (v: unknown, min: number, max: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : null)
const hexOrNull = (v: unknown) => (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v.trim()) ? v.trim().toLowerCase() : null)

export function fontFor(family: unknown): WebFont | null {
  if (typeof family !== 'string') return null
  const row = FONTS.find((r) => r[0].toLowerCase() === family.trim().toLowerCase())
  return row ? webFontFor(row) : null
}

/** Checks and clamps whatever the model sent. Unknown or invalid values fall back to "default". */
export function sanitizeProposal(input: Record<string, unknown>): ThemeProposal {
  const main = input.main && typeof input.main === 'object' ? (input.main as Record<string, unknown>) : null
  const status = (input.status && typeof input.status === 'object' ? input.status : {}) as Record<string, unknown>
  const h = clamp(main?.h, 0, 360)
  const c = clamp(main?.c, 0, 0.3)
  const l = clamp(main?.l, 0.3, 0.9)
  return {
    summary: typeof input.summary === 'string' ? input.summary : 'Theme applied.',
    appearance: input.appearance === 'dark' ? 'dark' : 'light',
    main: h !== null && c !== null && l !== null ? { h, c, l } : null,
    accent: hexOrNull(input.accent),
    neutralTint: clamp(input.neutralTint, 0, 1),
    rampContrast: clamp(input.rampContrast, 0.7, 1.3),
    status: { info: hexOrNull(status.info), success: hexOrNull(status.success), warning: hexOrNull(status.warning), error: hexOrNull(status.error) },
    bodyFont: fontFor(input.bodyFont)?.family ?? null,
    headingFont: fontFor(input.headingFont)?.family ?? null,
    baseSize: clamp(input.baseSize, 12, 20),
    scale: clamp(input.scale, 1.05, 1.333),
    radius: clamp(input.radius, 0, 24),
    density: clamp(input.density, 0.75, 1.3),
    depth: clamp(input.depth, 0, 1),
    extras: sanitizeExtras(input.extras),
  }
}

/** The proposal applied on top of the current theme (variable edits and component overrides are kept). */
export function applyProposal(theme: ThemeConfig, p: ThemeProposal): ThemeConfig {
  // The proposal styles what is being previewed: its brand, and in a mode set up separately that
  // mode's colors and depth. Density stays system-wide.
  const now = withModeIntents(theme)
  const color = { ...now.color, main: p.main, accent: p.accent, neutralTint: p.neutralTint, rampContrast: p.rampContrast, status: p.status }
  const type = { ...now.type, body: fontFor(p.bodyFont), heading: fontFor(p.headingFont), baseSize: p.baseSize, scale: p.scale }
  const next = writeIntents({ ...stripLegacyExtras(theme), density: p.density }, { color, type, radius: p.radius, depth: p.depth, extras: p.extras })
  // Preview the proposal's mode when the system ships it, unless the current mode is styled on its own.
  const appearance = !isSeparate(theme, theme.appearance) && theme.modes.includes(p.appearance) ? p.appearance : theme.appearance
  return { ...next, appearance }
}

/* -------------------------------------------------------------------- diff */

export interface Change {
  label: string
  before: string
  after: string
  swatch?: [string | null, string | null]
}

const oklchCss = (o: Oklch3 | null) => (o ? `oklch(${o.l.toFixed(2)} ${o.c.toFixed(3)} ${Math.round(o.h)})` : null)
const show = (v: string | number | null | undefined, unit = '') => (v === null || v === undefined ? 'Default' : `${typeof v === 'number' ? +v.toFixed(2) : v}${unit}`)

/** Plain-language list of what changed, for the summary card. */
export function describeChanges(before: ThemeConfig, after: ThemeConfig, extras?: StyleExtras): Change[] {
  const out: Change[] = []
  const add = (label: string, a: string, b: string, swatch?: [string | null, string | null]) => {
    if (a !== b) out.push({ label, before: a, after: b, swatch })
  }
  add('Appearance', before.appearance === 'dark' ? 'Dark' : 'Light', after.appearance === 'dark' ? 'Dark' : 'Light')
  add('Brand color', oklchCss(before.color.main) ?? 'Default', oklchCss(after.color.main) ?? 'Default', [oklchCss(before.color.main), oklchCss(after.color.main)])
  add('Accent', before.color.accent ?? 'Follows brand', after.color.accent ?? 'Follows brand', [before.color.accent, after.color.accent])
  add('Grey tint', show(before.color.neutralTint), show(after.color.neutralTint))
  add('Palette contrast', show(before.color.rampContrast), show(after.color.rampContrast))
  for (const k of ['info', 'success', 'warning', 'error'] as const) {
    add(`${k[0].toUpperCase()}${k.slice(1)} color`, before.color.status[k] ?? 'Default', after.color.status[k] ?? 'Default', [before.color.status[k], after.color.status[k]])
  }
  add('Body font', before.type.body?.family ?? 'Default', after.type.body?.family ?? 'Default')
  add('Heading font', before.type.heading?.family ?? 'Same as body', after.type.heading?.family ?? 'Same as body')
  add('Text size', show(before.type.baseSize, 'px'), show(after.type.baseSize, 'px'))
  add('Type scale', show(before.type.scale), show(after.type.scale))
  add('Corner radius', show(before.radius, 'px'), show(after.radius, 'px'))
  add('Density', show(before.density, '×'), show(after.density, '×'))
  add('Depth', show(before.depth), show(after.depth))
  for (const e of extras ? describeExtras(extras) : []) out.push({ label: e.label, before: '', after: e.value })
  return out
}
