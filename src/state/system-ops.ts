// Pure operations on a SystemState. Shared by the seeds, the journeys and the demo shortcuts.

import type { SystemState, ThemeConfig, Token } from './types'
import { uid } from './sim'

export function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
}

export function hexShift(hex: string, amount: number): string {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(amount >= 0 ? c + (255 - c) * amount : c * (1 + amount))))
  return '#' + [f(r), f(g), f(b)].map((c) => c.toString(16).padStart(2, '0')).join('')
}

/** Light-mode interactive tokens follow the brand colour; focus follows the accent; the control radius follows the theme. */
export function applyThemeIntents(tokens: Token[], theme: ThemeConfig) {
  const main = theme.color.main
  const map: Record<string, number> = {
    'color-background-interactive-primary-default': 0,
    'color-background-interactive-primary-hover': -0.18,
    'color-background-interactive-primary-active': -0.3,
    'color-background-interactive-primary-selected': 0,
  }
  for (const [id, shift] of Object.entries(map)) {
    const t = tokens.find((x) => x.id === id)
    if (t) t.values.light = shift === 0 ? main : hexShift(main, shift)
  }
  const focus = tokens.find((x) => x.id === 'color-border-interactive-focus')
  if (focus) focus.values.light = theme.color.accent
  const radius = tokens.find((x) => x.id === 'shape-radius-control')
  if (radius) radius.values = { light: `${theme.radius}px`, dark: `${theme.radius}px` }
}

/** Demo shortcut: every open finding resolved, channels republished, release v2.0.0 evaluated. */
export function fastForwardSystem(sys: SystemState, now: number) {
  for (const f of sys.findings) if (['open', 'proposed', 'in_pr'].includes(f.status)) f.status = 'merged'
  for (const t of sys.tokens) delete t.figmaDrift
  for (const p of sys.agentProposals) if (p.status === 'pending') p.status = 'approved'
  for (const c of sys.channels) {
    c.status = 'fresh'
    c.lastPublished = now
    delete c.staleReason
  }
  const card = sys.components.find((c) => c.id === 'card')
  if (card && !card.guidance.whenNotToUse) card.guidance.whenNotToUse = 'When content needs comparing in columns, use Table. When it is one item with one action, use a List row.'
  for (const c of sys.components) {
    if (!c.guidance.whenNotToUse) c.guidance.whenNotToUse = `When the job is not "${(c.guidance.whenToUse ?? '').toLowerCase().replace(/\.$/, '')}", pick the component whose guidance matches.`
    c.codeConnect = true
  }
  sys.journey.engagementFastForwarded = true
  sys.evals.unshift({
    id: uid('eval'),
    version: 'v2.0.0',
    onSystem: 97,
    gate: 90,
    prompts: 20,
    date: now,
    perTool: [
      { tool: 'Claude Code + Storybook MCP', model: 'Claude Sonnet 5.5', score: 99 },
      { tool: 'Claude Design', model: 'Claude Opus 5.5', score: 98 },
      { tool: 'Figma Make', model: 'Figma agent', score: 96 },
      { tool: 'v0 with the registry', model: 'v0', score: 95 },
    ],
    failures: [],
  })
}
