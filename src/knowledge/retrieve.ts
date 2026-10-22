// Zero-token retrieval: a small BM25 index over document sections with heading and topic boosts
// and a design-systems synonym map, so "ownership" finds the governance sections. Every hit says
// why it matched. Only the sources passed in are searched (the caller applies scope rules).

import type { EvidenceRef, KnowledgeDocument, KnowledgeSource } from './types.ts'

const STOP = new Set('a an and are as at be been by can could do does for from has have how i if in into is it its may must of on or our should so such that the their them then there these they this to us was we were what when which who will with would you your shall please provide describe explain outline detail include including also any each other than more most very about over per via within'.split(' '))

export function stemLite(w: string): string {
  if (w.length <= 3) return w
  if (w.endsWith("'s")) w = w.slice(0, -2)
  if (w.endsWith('ies') && w.length > 4) return w.slice(0, -3) + 'y'
  if (w.endsWith('sses')) return w.slice(0, -2)
  if (w.endsWith('ation') && w.length > 7) return w.slice(0, -5) + 'ate'
  if (w.endsWith('ing') && w.length > 5) return w.slice(0, -3)
  if (w.endsWith('ed') && w.length > 4) return w.slice(0, -2)
  if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3) return w.slice(0, -1)
  return w
}

/** Words too common to explain a match, shown to people only (scoring is unaffected). */
const QUIET = new Set('make sure after before want need time work way new one two get use all just like'.split(' '))

/** The heading's own words (not their stems) that matched, for the "why" line. */
function headingWords(heading: string, stems: string[]): string[] {
  const want = new Set(stems)
  const out: string[] = []
  for (const raw of heading.toLowerCase().split(/[^a-z0-9-]+/)) {
    if (raw.length < 2 || QUIET.has(raw) || out.includes(raw)) continue
    if (want.has(stemLite(raw))) out.push(raw)
  }
  return out
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((w) => w && w.length > 1 && !STOP.has(w))
    .map(stemLite)
}

/** canonical group → words that mean the same thing in a design-systems request. */
export const SYNONYMS: Record<string, string[]> = {
  governance: ['governance', 'govern', 'ownership', 'owner', 'approval', 'approve', 'trust', 'versioning', 'version', 'review', 'gate', 'policy', 'steward', 'change control', 'decision', 'operating model', 'contribution'],
  enablement: ['enablement', 'enable', 'training', 'train', 'coaching', 'coach', 'workshop', 'upskilling', 'upskill', 'onboarding', 'playbook', 'adoption', 'handover', 'learning', 'mentoring'],
  assessment: ['assessment', 'assess', 'audit', 'scan', 'readiness', 'maturity', 'scorecard', 'diagnostic', 'baseline', 'inventory', 'readout', 'health', 'current state', 'evaluate'],
  tokens: ['token', 'variable', 'primitive', 'semantic', 'theme', 'theming', 'foundation'],
  drift: ['drift', 'mismatch', 'parity', 'divergence', 'out of sync', 'inconsistency', 'consistency', 'inconsistent'],
  ai: ['ai', 'agent', 'copilot', 'cursor', 'claude', 'mcp', 'llm', 'prompt', 'model', 'ai-ready', 'ai-native', 'automation', 'generative', 'vibe'],
  accessibility: ['accessibility', 'accessible', 'a11y', 'wcag', 'eaa', 'contrast', 'screen reader', 'inclusive'],
  components: ['component', 'library', 'kit', 'storybook', 'pattern'],
  documentation: ['documentation', 'docs', 'guidance', 'guideline', 'handbook', 'spec', 'rule', 'metadata', 'machine-readable'],
  multibrand: ['multibrand', 'multi-brand', 'brand', 'white-label', 'several system', 'multiple system', 'portfolio'],
  offering: ['package', 'offering', 'offer', 'service', 'engagement', 'programme', 'program', 'accelerate', 'scale', 'build'],
  figma: ['figma', 'design file', 'plugin', 'code connect', 'variables'],
  code: ['code', 'react', 'repo', 'repository', 'github', 'pull request', 'ci', 'pipeline', 'frontend', 'front-end'],
  commercial: ['pricing', 'price', 'cost', 'budget', 'rate', 'fee', 'commercial'],
}

const GROUP_OF = new Map<string, string>()
for (const [g, words] of Object.entries(SYNONYMS)) for (const w of words) for (const t of tokenize(w)) GROUP_OF.set(t, g)

export function expand(tokens: string[]): string[] {
  const out = [...tokens]
  for (const t of tokens) {
    const g = GROUP_OF.get(t)
    if (g) out.push(`~${g}`)
  }
  return out
}

interface Doc { sourceId: string; sectionId: string; tf: Map<string, number>; len: number; heading: string; text: string; tokens: string[]; penalty: number }

export interface RetrievalIndex { docs: Doc[]; df: Map<string, number>; avgLen: number; sources: Map<string, KnowledgeSource> }

const HEADING_WEIGHT = 2.5
const TOPIC_WEIGHT = 2

export function buildIndex(entries: { source: KnowledgeSource; doc: KnowledgeDocument }[]): RetrievalIndex {
  const docs: Doc[] = []
  const df = new Map<string, number>()
  for (const { source, doc } of entries) {
    const topics = expand(tokenize(source.tags.join(' ')))
    for (const s of doc.sections) {
      const body = expand(tokenize(s.text))
      const head = expand(tokenize(s.heading))
      const tf = new Map<string, number>()
      for (const t of body) tf.set(t, (tf.get(t) ?? 0) + 1)
      for (const t of head) tf.set(t, (tf.get(t) ?? 0) + HEADING_WEIGHT)
      for (const t of topics) tf.set(t, (tf.get(t) ?? 0) + TOPIC_WEIGHT * 0.5)
      for (const t of tf.keys()) df.set(t, (df.get(t) ?? 0) + 1)
      // link lists, source lists and changelogs are rarely an answer
      const urlChars = (s.text.match(/https?:\/\/\S+/g) ?? []).join('').length
      const penalty = (/\b(sources|references|links|appendix|release notes|changelog|footnotes|table of contents|index)\b/i.test(s.heading) ? 0.3 : 1) * (urlChars / Math.max(1, s.text.length) > 0.15 ? 0.4 : 1)
      docs.push({ sourceId: source.id, sectionId: s.id, tf, len: body.length + head.length, heading: s.heading, text: s.text, tokens: tokenize(s.text), penalty })
    }
  }
  const avgLen = docs.reduce((a, d) => a + d.len, 0) / Math.max(1, docs.length)
  return { docs, df, avgLen, sources: new Map(entries.map((e) => [e.source.id, e.source])) }
}

function snippetFor(text: string, terms: Set<string>): string {
  // Slide text arrives as separate text boxes: a line starting lower-case continues the previous one.
  const lines = text.split('\n').map((l) => l.replace(/^\s*([-*•]|\d+[.)])\s+/, '').replace(/https?:\/\/\S+/g, '').trim()).filter(Boolean)
  let clean = ''
  for (const l of lines) clean += !clean ? l : /^[a-z(]/.test(l) || /[,;:–-]$/.test(clean) ? ` ${l}` : /[.!?]$/.test(clean) ? ` ${l}` : `. ${l}`
  const sentences = clean.split(/(?<=[.!?])\s+/).filter((x) => x.length > 2)
  let best = ''
  let bestScore = -1
  sentences.forEach((s0, i) => {
    let s1 = s0
    if (s1.length < 50 && sentences[i + 1]) s1 = `${s1} ${sentences[i + 1]}`
    const hits = tokenize(s1).filter((t) => terms.has(t)).length
    const score = hits + Math.min(s1.length, 200) / 400
    if (score > bestScore) {
      best = s1
      bestScore = score
    }
  })
  return best.length > 240 ? best.slice(0, 237).replace(/\s+\S*$/, '') + '…' : best
}

export interface SearchOptions { k?: number; minScore?: number; relative?: number }

export function search(index: RetrievalIndex, query: string, opts: SearchOptions = {}): EvidenceRef[] {
  const k = opts.k ?? 6
  const qTokens = tokenize(query)
  const q = expand(qTokens)
  if (!q.length || !index.docs.length) return []
  const N = index.docs.length
  const k1 = 1.2
  const b = 0.75
  const scored = index.docs.map((d) => {
    let score = 0
    const matched: string[] = []
    for (const t of new Set(q)) {
      const f = d.tf.get(t)
      if (!f) continue
      const n = index.df.get(t) ?? 0
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5))
      const w = t.startsWith('~') ? 0.6 : 1
      score += w * idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * d.len) / index.avgLen)))
      matched.push(t)
    }
    for (let i = 0; i < qTokens.length - 1; i++) {
      const idx = d.tokens.indexOf(qTokens[i])
      if (idx >= 0 && d.tokens[idx + 1] === qTokens[i + 1]) score += 0.5
    }
    return { d, score: score * d.penalty, matched }
  })
  const best = Math.max(...scored.map((s) => s.score))
  const floor = Math.max(opts.minScore ?? 1.5, (opts.relative ?? 0.3) * best)
  return scored
    .filter((s) => s.score >= floor && s.score > 0)
    .sort((a, b2) => b2.score - a.score)
    .slice(0, k)
    .map(({ d, score, matched }) => {
      const words = matched.filter((m) => !m.startsWith('~'))
      const groups = matched.filter((m) => m.startsWith('~')).map((m) => m.slice(1))
      const inHeading = headingWords(d.heading, words)
      const why = [inHeading.length ? `heading matches "${inHeading.slice(0, 3).join('", "')}"` : '', words.length ? `${words.length} matching term${words.length > 1 ? 's' : ''}` : '', groups.length ? `related topic${groups.length > 1 ? 's' : ''}: ${groups.slice(0, 3).join(', ')}` : ''].filter(Boolean).join(' · ')
      return { sourceId: d.sourceId, sectionId: d.sectionId, score: Math.round(score * 100) / 100, matched: words, why, snippet: snippetFor(d.text, new Set(words)) }
    })
}
