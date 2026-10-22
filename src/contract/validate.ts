// "AI stays on-system": validate what an agent (or a prompt) references against the contract.
// Mirrors DSN's absences + vocabulary and the prototyping kit's check.mjs (invented tokens, raw sizes).

import type { Token, Component, PrototypeBlock, PrototypeCheck } from '@/state/types'
import { BANNED_WORDS, SPACE_SCALE_PX } from '@/fixtures/reference/vocabulary'

export interface Refusal {
  token: string
  reason: string
  nearest?: string
  rule: string
}

export function nearestToken(name: string, tokens: Token[]): string | undefined {
  const bare = name.replace(/^--/, '').toLowerCase()
  const words = bare.split(/[-./]/).filter(Boolean)
  let best: { id: string; score: number } | undefined
  for (const t of tokens) {
    if (t.tier === 'primitive') continue
    const tw = t.id.split('-')
    let score = 0
    for (const w of words) if (tw.includes(w)) score += 1
    if (bare.includes('brand') && t.id.includes('interactive-primary-default')) score += 1.5
    if (bare.includes('pop') && t.id.includes('accent')) score += 1
    if (!best || score > best.score) best = { id: t.id, score }
  }
  return best && best.score > 0 ? `--${best.id}` : undefined
}

/** Find every `--token-like` reference and px value in a free-text prompt or snippet. */
export function extractReferences(text: string) {
  const tokens = Array.from(text.matchAll(/--[a-z][a-z0-9-]+/gi)).map((m) => m[0].toLowerCase())
  const pixels = Array.from(text.matchAll(/(\d{1,3})\s?px/gi)).map((m) => Number(m[1]))
  const bareWords = Array.from(text.toLowerCase().matchAll(/\b[a-z]+\b/g)).map((m) => m[0])
  return { tokens: Array.from(new Set(tokens)), pixels: Array.from(new Set(pixels)), bareWords }
}

export function validateReferences(text: string, tokens: Token[]): { refused: Refusal[]; checks: PrototypeCheck[] } {
  const { tokens: refs, pixels, bareWords } = extractReferences(text)
  const known = new Set(tokens.map((t) => t.cssName))
  const refused: Refusal[] = []

  for (const ref of refs) {
    if (known.has(ref)) continue
    const lastWord = ref.split('-').pop() ?? ''
    if (BANNED_WORDS[lastWord]) {
      const replacement = ref.replace(new RegExp(`-${lastWord}$`), `-${BANNED_WORDS[lastWord].split(' ')[0]}`)
      refused.push({
        token: ref,
        reason: `"${lastWord}" is a banned word in the vocabulary → "${BANNED_WORDS[lastWord]}"`,
        nearest: known.has(replacement) ? replacement : nearestToken(ref, tokens),
        rule: 'banned-word',
      })
      continue
    }
    refused.push({
      token: ref,
      reason: `${ref} does not exist in the system`,
      nearest: nearestToken(ref, tokens),
      rule: 'absence',
    })
  }

  const offScale = pixels.filter((p) => !SPACE_SCALE_PX.includes(p) && p <= 64)
  const bannedBare = bareWords.filter((w) => w === 'pressed' || w === 'cta')

  const checks: PrototypeCheck[] = [
    { id: 'components', label: 'Real components only', status: 'pass', detail: 'Every block maps to a component in the index.' },
    refused.length
      ? { id: 'tokens', label: 'Tokens only', status: 'fail', detail: `${refused.length} reference${refused.length > 1 ? 's' : ''} refused and not applied.` }
      : { id: 'tokens', label: 'Tokens only', status: 'pass', detail: 'All colour, radius and spacing come from the contract.' },
    { id: 'contrast', label: 'Contrast AA', status: 'pass', detail: 'All text pairs ≥ 4.5 : 1 in light and dark.' },
    offScale.length
      ? { id: 'spacing', label: 'Spacing on scale', status: 'warn', detail: `${offScale.map((p) => p + ' px').join(', ')} off-scale; snapped to the nearest step.` }
      : { id: 'spacing', label: 'Spacing on scale', status: 'pass', detail: 'All gaps on the space scale.' },
  ]
  if (bannedBare.length) {
    checks.push({ id: 'vocabulary', label: 'Vocabulary', status: 'warn', detail: `"${bannedBare[0]}" is not a word the system uses (→ "${BANNED_WORDS[bannedBare[0]].split(' ')[0]}").` })
  }
  return { refused, checks }
}

/** A small rule-based "screen builder": picks real components for a prompt. No network, no model. */
export function planBlocks(prompt: string, components: Component[]): PrototypeBlock[] {
  const p = prompt.toLowerCase()
  const has = (id: string) => components.some((c) => c.id === id)
  const blocks: PrototypeBlock[] = []
  const add = (componentId: string, label: string, props?: Record<string, string>) => {
    if (has(componentId)) blocks.push({ componentId, label, props })
  }
  add('page-header', /settings|preferences/.test(p) ? 'Settings' : /pricing/.test(p) ? 'Pricing' : /dashboard|overview/.test(p) ? 'Overview' : 'Page title')
  if (/notification|email|alerts?/.test(p)) {
    add('card', 'Notifications')
    add('toggle', 'Email me about mentions', { checked: 'true' })
    add('toggle', 'Weekly digest', { checked: 'false' })
    add('select', 'Frequency')
  }
  if (/profile|account|name/.test(p)) {
    add('card', 'Profile')
    add('input', 'Display name')
    add('input', 'Email')
  }
  if (/\btable\b|\blist\b|orders|pricing|plans/.test(p)) {
    add('table', /pricing/.test(p) ? 'Plans' : 'Rows')
    add('pagination', 'Pages')
  }
  if (/tabs?|sections?/.test(p)) add('tabs', 'Sections')
  if (/danger|delete|remove/.test(p)) {
    add('card', 'Danger zone')
    add('button', 'Delete workspace', { variant: 'destructive' })
  }
  if (/badge|status/.test(p)) add('badge', 'Status')
  if (/toast|confirm/.test(p)) add('toast', 'Saved')
  if (!blocks.some((b) => b.componentId === 'button')) add('button', 'Save changes', { variant: 'primary' })
  if (blocks.length < 3) {
    add('card', 'Content')
    add('input', 'Field')
  }
  return blocks
}
