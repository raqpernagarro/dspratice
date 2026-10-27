// Demos: playlists walk their own chapters in order, "Build a demo" suggests from plain words with
// no model, and every social cut points at real demos, chapters and focus targets.
import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { TOUR_BY_ID, pathFor, pathMinutes } from '@/features/demo/steps'
import { CHAPTER_KEYWORDS, MINI_DEMOS } from '@/fixtures/demos'
import { SOCIAL_CUTS } from '@/fixtures/social-cuts'
import { suggestDemo } from './build'

function focusTargets(dir = join(__dirname, '../..')): Set<string> {
  const out = new Set<string>()
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) focusTargets(p).forEach((t) => out.add(t))
    else if (name.endsWith('.tsx')) for (const m of readFileSync(p, 'utf8').matchAll(/data-demo-focus="([a-z-]+)"/g)) out.add(m[1])
  }
  return out
}

describe('playlists', () => {
  it('walk the chosen chapters in their own order, and fall back to the short path when empty', () => {
    expect(pathFor('custom', ['review', 'inconsistency']).map((s) => s.id)).toEqual(['review', 'inconsistency'])
    expect(pathFor('custom', ['nope'])).toEqual(pathFor('meeting'))
    expect(pathFor('custom', [])).toEqual(pathFor('meeting'))
    expect(pathMinutes('custom', ['ai'])).toBe(2)
    expect(pathMinutes('custom', ['inconsistency', 'impact', 'fix', 'review'])).toBe(6)
  })
})

describe('build a demo', () => {
  it('suggests ready-made demos and a playlist in story order from plain words', () => {
    const s = suggestDemo('Figma and code drift apart')
    expect(s.demos[0].id).toBe('fix-travels')
    expect(s.chapters).toEqual(['challenge', 'inconsistency', 'review'])
    expect(suggestDemo('how AI stays on their design system').demos[0].id).toBe('ai-on-system')
    expect(suggestDemo('a second brand and dark mode').demos[0].id).toBe('retheme')
  })
  it('suggests nothing for unrelated words, and never an internal demo to a client', () => {
    expect(suggestDemo('lunch on friday')).toEqual({ demos: [], chapters: [], matched: [] })
    expect(suggestDemo('workspace journey route').demos.every((d) => d.audience === 'client')).toBe(true)
  })
  it('has keywords for every chapter and real chapters in every playlist demo', () => {
    for (const id of Object.keys(TOUR_BY_ID)) expect(CHAPTER_KEYWORDS[id]?.length).toBeGreaterThan(2)
    for (const d of MINI_DEMOS) for (const c of d.chapters ?? []) expect(TOUR_BY_ID[c], `${d.id} → ${c}`).toBeDefined()
  })
})

describe('social cuts', () => {
  const targets = focusTargets()
  it('point at real demos, chapters and focus targets, keep notes, and fit a short clip', () => {
    for (const c of SOCIAL_CUTS) {
      expect(MINI_DEMOS.some((d) => d.id === c.demo), c.id).toBe(true)
      expect(c.notes.length).toBeGreaterThan(40)
      const total = c.shots.reduce((t, s) => t + s.seconds, 0)
      expect(total, c.id).toBeLessThanOrEqual(30)
      for (const s of c.shots) {
        if (s.chapter) expect(TOUR_BY_ID[s.chapter], `${c.id} → ${s.chapter}`).toBeDefined()
        if (s.focus) expect(targets.has(s.focus), `${c.id} → ${s.focus}`).toBe(true)
        expect(s.caption.length, s.caption).toBeLessThanOrEqual(80)
      }
    }
  })
  it('say so when a cut is sped up or simulated', () => {
    for (const c of SOCIAL_CUTS.filter((x) => x.shots.some((s) => s.action === 'show-me'))) expect(c.notes).toMatch(/sped up/i)
  })
})
