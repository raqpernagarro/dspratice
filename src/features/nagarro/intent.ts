// "What do you need to do?" without a model: score the words someone typed against each journey's
// keywords (src/fixtures/journeys.ts) and return the best few, with the words that matched.
// Phrases count more than single words; a word in the title counts a little. Zero tokens.

import { JOURNEYS, type JourneyDef } from '@/fixtures/journeys'

export interface IntentMatch {
  journey: JourneyDef
  score: number
  /** The keywords that matched, for the "Because you wrote…" line. */
  matched: string[]
}

/** Words every journey shares; they never earn the title bonus. */
const GENERIC = new Set(['design', 'system', 'ai', 'ready'])

const STOP = new Set(['a', 'an', 'the', 'to', 'for', 'of', 'and', 'or', 'on', 'in', 'with', 'i', 'we', 'my', 'our', 'need', 'needs', 'want', 'have', 'has', 'do', 'make', 'get', 'some', 'it', 'is', 'are', 'this', 'that', 'help', 'me', 'us', 'can', 'how', 'what', 'please', 'client', 'clients'])

/** Lower case, hyphens and punctuation to spaces, light stemming of plurals and -ing. */
export function normalise(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9.]+/g, ' ')
    .split(' ')
    .map((w) => w.replace(/\.+$/, ''))
    .filter(Boolean)
    .map(stem)
}

function stem(w: string): string {
  if (w.length > 5 && w.endsWith('ing')) return w.slice(0, -3)
  if (w.length > 4 && w.endsWith('ies')) return w.slice(0, -3) + 'y'
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1)
  return w
}

function containsPhrase(words: string[], phrase: string[]): boolean {
  outer: for (let i = 0; i + phrase.length <= words.length; i++) {
    for (let j = 0; j < phrase.length; j++) if (words[i + j] !== phrase[j]) continue outer
    return true
  }
  return false
}

export function matchJourneys(text: string, limit = 3, journeys: JourneyDef[] = JOURNEYS): IntentMatch[] {
  const words = normalise(text)
  if (!words.length) return []
  const content = new Set(words.filter((w) => !STOP.has(w)))
  const out: IntentMatch[] = []
  for (const j of journeys) {
    let score = 0
    const matched: string[] = []
    for (const k of j.keywords) {
      const phrase = normalise(k)
      if (!phrase.length) continue
      if (phrase.length === 1 ? content.has(phrase[0]) : containsPhrase(words, phrase)) {
        score += phrase.length === 1 ? 1 : 1 + phrase.length
        matched.push(k)
      }
    }
    for (const w of new Set(normalise(j.title))) if (!STOP.has(w) && !GENERIC.has(w) && content.has(w) && !matched.some((m) => normalise(m).includes(w))) score += 0.5
    if (score > 0) out.push({ journey: j, score, matched })
  }
  return out.sort((a, b) => b.score - a.score || (a.journey.featured === b.journey.featured ? 0 : a.journey.featured ? -1 : 1)).slice(0, limit)
}
