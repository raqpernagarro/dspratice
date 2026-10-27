// "Build a demo" with no model: the words someone types point at ready-made mini-demos and at the
// story's chapters (src/fixtures/demos.ts). The suggestion is a playlist in story order, which the
// presenter can then edit.

import { MINI_DEMOS, CHAPTER_KEYWORDS, type MiniDemo } from '@/fixtures/demos'
import { TOUR } from '@/features/demo/steps'
import { keywordScore, normalise } from '@/features/nagarro/intent'

export interface DemoSuggestion {
  demos: MiniDemo[]
  /** Chapter ids in story order. Empty when nothing matched. */
  chapters: string[]
  matched: string[]
}

export function suggestDemo(text: string, audience: MiniDemo['audience'] = 'client'): DemoSuggestion {
  const words = normalise(text)
  if (!words.length) return { demos: [], chapters: [], matched: [] }
  const demos = MINI_DEMOS.filter((d) => d.audience === audience)
    .map((d) => ({ d, ...keywordScore(words, d.keywords) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
  const hits = TOUR.map((s) => ({ id: s.id, ...keywordScore(words, CHAPTER_KEYWORDS[s.id] ?? []) })).filter((x) => x.score > 0)
  const chapters = hits.map((h) => h.id)
  // A playlist that opens cold is hard to follow: start on the challenge when more than one chapter matched.
  if (chapters.length > 1 && !chapters.includes('challenge')) chapters.unshift('challenge')
  const matched = [...new Set([...demos.flatMap((x) => x.matched), ...hits.flatMap((h) => h.matched)])]
  return { demos: demos.slice(0, 3).map((x) => x.d), chapters, matched }
}
