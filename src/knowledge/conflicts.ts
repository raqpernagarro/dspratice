// Where our own material disagrees. Seeded conflicts (from the practice's audit) fire when a
// retrieved section matches one of their patterns, or when the request talks about the topic.
// A small heuristic adds numeric disagreements ("49 components" vs "56 components") found across
// two different sources in the evidence.

import type { KnowledgeConflict } from './types.ts'
import { tokenize } from './retrieve.ts'

export interface SectionText { sourceId: string; sectionId: string; text: string }

export function detectConflicts(sections: SectionText[], seeds: KnowledgeConflict[], queryText = ''): KnowledgeConflict[] {
  const q = new Set(tokenize(queryText))
  const fired: KnowledgeConflict[] = []
  for (const c of seeds) {
    if (c.status === 'resolved') continue
    const positions = new Map<string, { sourceId: string; sectionId: string; says: string }>()
    for (const p of c.patterns) {
      const re = new RegExp(p, 'i')
      for (const s of sections) {
        const m = re.exec(s.text)
        if (m && !positions.has(`${s.sourceId}|${p}`)) {
          const at = Math.max(0, m.index - 60)
          positions.set(`${s.sourceId}|${p}`, { sourceId: s.sourceId, sectionId: s.sectionId, says: `…${s.text.slice(at, m.index + m[0].length + 60).replace(/\s+/g, ' ').trim()}…` })
        }
      }
    }
    const triggered = c.triggers.some((t) => tokenize(t).every((w) => q.has(w)))
    if (positions.size >= 1 || triggered) fired.push({ ...c, positions: positions.size ? Array.from(positions.values()) : c.positions })
  }
  // numeric heuristic: same noun, different numbers, different sources
  const NUM = /\b(\d{1,4})\s+(components|pillars|tokens|variables|skills|checks|templates|tools|specs)\b/gi
  const byNoun = new Map<string, Map<string, { sourceId: string; sectionId: string; says: string }>>()
  for (const s of sections) {
    for (const m of s.text.matchAll(NUM)) {
      const noun = m[2].toLowerCase()
      const map = byNoun.get(noun) ?? new Map()
      const key = `${m[1]}|${s.sourceId}`
      if (!map.has(key)) map.set(key, { sourceId: s.sourceId, sectionId: s.sectionId, says: m[0] })
      byNoun.set(noun, map)
    }
  }
  for (const [noun, map] of byNoun) {
    const values = new Set(Array.from(map.keys()).map((k) => k.split('|')[0]))
    const sources = new Set(Array.from(map.values()).map((v) => v.sourceId))
    if (values.size > 1 && sources.size > 1 && !fired.some((f) => f.topic.toLowerCase().includes(noun.replace(/s$/, '')))) {
      fired.push({ id: `numeric-${noun}`, topic: `How many ${noun}`, summary: `Sources give different numbers of ${noun}: ${Array.from(values).join(' vs ')}. Check which is current before quoting one.`, positions: Array.from(map.values()), triggers: [], patterns: [], status: 'open' })
    }
  }
  return fired
}
