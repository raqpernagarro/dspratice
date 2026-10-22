// Shared helpers for every extractor: stable section ids, boilerplate removal, size caps and the
// final document. Pure; relative imports only (Node scripts import this file directly).

import { hashText, shortHash, normalizeText } from '../hash.ts'
import type { KnowledgeDocument, KnowledgeSection, ReadBy, SectionRef } from '../types.ts'

export const SECTION_CAP = 6000
export const DOC_SECTION_CAP = 400
export const DOC_CHAR_CAP = 400_000

export interface DocContext {
  sourceId: string
  docId: string
  readBy: ReadBy
  readAt: number
}

export function sectionId(sourceId: string, canonical: string) {
  return `s-${shortHash(`${sourceId}|${canonical}`)}`
}

export interface RawSection {
  canonical: string
  heading: string
  text: string
  ref: SectionRef
  kind: KnowledgeSection['kind']
}

/** Splits an over-long section into continuation parts with the same heading. */
export function splitLong(raw: RawSection): RawSection[] {
  if (raw.text.length <= SECTION_CAP) return [raw]
  const parts: RawSection[] = []
  let rest = raw.text
  let n = 1
  while (rest.length) {
    let cut = rest.length <= SECTION_CAP ? rest.length : rest.lastIndexOf('\n', SECTION_CAP)
    if (cut < SECTION_CAP / 2) cut = rest.lastIndexOf('. ', SECTION_CAP) + 1 || SECTION_CAP
    parts.push({ ...raw, canonical: n === 1 ? raw.canonical : `${raw.canonical}#p${n}`, heading: n === 1 ? raw.heading : `${raw.heading} (continued)`, text: rest.slice(0, cut).trim() })
    rest = rest.slice(cut).trim()
    n++
  }
  return parts
}

const ALWAYS = [/^©\s?\d{4}/i, /^prepared for\b/i, /^confidential\b/i, /^\d{1,3}$/, /^nagarro$/i, /^page \d+$/i]

/**
 * Removes recurring lines (footers, deck names, "Prepared for <client>") from slide-like sections.
 * A short line found in at least 60 % of sections (min 3) is boilerplate. The warning never repeats
 * the removed text, so a client name in a footer does not leak into the knowledge base.
 */
export function dedupeBoilerplate(sections: RawSection[]): { sections: RawSection[]; removed: number } {
  const counts = new Map<string, number>()
  for (const s of sections) for (const line of new Set(s.text.split('\n').map((l) => l.trim()).filter(Boolean))) if (line.length <= 80) counts.set(line, (counts.get(line) ?? 0) + 1)
  const threshold = Math.max(3, Math.ceil(sections.length * 0.6))
  const recurring = new Set(Array.from(counts.entries()).filter(([, c]) => sections.length >= 3 && c >= threshold).map(([l]) => l))
  let removed = 0
  const out = sections.map((s) => {
    const lines = s.text.split('\n').filter((l) => {
      const t = l.trim()
      const drop = recurring.has(t) || ALWAYS.some((re) => re.test(t))
      if (drop) removed++
      return !drop
    })
    return { ...s, text: lines.join('\n').trim() }
  })
  return { sections: out, removed }
}

export function buildDocument(ctx: DocContext, raws: RawSection[], extra: { missing?: KnowledgeDocument['missing']; warnings?: string[] } = {}): KnowledgeDocument {
  const missing = [...(extra.missing ?? [])]
  const warnings = [...(extra.warnings ?? [])]
  let all = raws.flatMap(splitLong).filter((r) => r.text.trim() || r.heading.trim())
  let truncated = false
  let chars = 0
  const kept: RawSection[] = []
  for (const r of all) {
    if (kept.length >= DOC_SECTION_CAP || chars + r.text.length > DOC_CHAR_CAP) {
      truncated = true
      break
    }
    kept.push(r)
    chars += r.text.length
  }
  if (truncated) missing.push({ what: `${all.length - kept.length} sections after section ${kept.length}`, why: 'size cap (400 sections / 400,000 characters)' })
  all = kept
  const seen = new Map<string, number>()
  const sections: KnowledgeSection[] = all.map((r, order) => {
    let canonical = r.canonical
    const n = (seen.get(canonical) ?? 0) + 1
    seen.set(canonical, n)
    if (n > 1) canonical = `${canonical}#${n}`
    const text = normalizeText(r.text)
    return { id: sectionId(ctx.sourceId, canonical), heading: r.heading.trim() || 'Untitled', text, ref: r.ref, order, kind: r.kind, hash: hashText(text), chars: text.length }
  })
  const body = sections.map((s) => `${s.heading}\n${s.text}`).join('\n\n')
  return {
    schema: 'knowledge-doc@1',
    docId: ctx.docId,
    sourceId: ctx.sourceId,
    readAt: ctx.readAt,
    readBy: ctx.readBy,
    sourceHash: hashText(body),
    sections,
    missing,
    warnings,
    stats: { sections: sections.length, chars: body.length, truncated },
  }
}

export function slugify(s: string) {
  return s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').slice(0, 60)
}
