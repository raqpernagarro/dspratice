// Markdown → one section per heading (# to ###). Text before the first heading is "Introduction".
// Tables become "cell · cell" rows, links keep their label, front matter and HTML comments go.

import { buildDocument, slugify, type DocContext, type RawSection } from './sections.ts'
import type { KnowledgeDocument } from '../types.ts'

export function cleanMarkdownLine(line: string): string {
  if (/^\s*\|?\s*:?-{2,}/.test(line) && /^[\s|:-]+$/.test(line)) return ''
  let l = line
  if (/^\s*\|.*\|\s*$/.test(l)) l = l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim()).filter(Boolean).join(' · ')
  l = l.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/<\/?[a-z][^>]*>/gi, '')
  l = l.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/__([^_]+)__/g, '$1').replace(/`([^`]+)`/g, '$1')
  return l.replace(/\{%\s*(end)?raw\s*%\}/g, '')
}

export function extractMarkdown(text: string, ctx: DocContext & { path: string }): KnowledgeDocument {
  let src = text.replace(/\r\n?/g, '\n')
  src = src.replace(/^---\n[\s\S]*?\n---\n/, '').replace(/<!--[\s\S]*?-->/g, '')
  const lines = src.split('\n')
  const raws: RawSection[] = []
  const trail: string[] = []
  let cur: RawSection = { canonical: `${ctx.path}#introduction`, heading: 'Introduction', text: '', ref: { path: ctx.path, line: 1 }, kind: 'heading' }
  let inFence = false
  const flush = () => {
    if (cur.text.trim()) raws.push({ ...cur, text: cur.text.trim() })
  }
  lines.forEach((raw, i) => {
    if (/^\s*```/.test(raw)) inFence = !inFence
    const m = !inFence && /^(#{1,3})\s+(.+?)\s*#*\s*$/.exec(raw)
    if (m) {
      flush()
      const level = m[1].length
      const heading = cleanMarkdownLine(m[2]).trim()
      trail.length = level - 1
      trail[level - 1] = slugify(heading)
      cur = { canonical: `${ctx.path}#${trail.filter(Boolean).join('/')}`, heading, text: '', ref: { path: ctx.path, line: i + 1 }, kind: 'heading' }
      return
    }
    const cleaned = inFence ? raw : cleanMarkdownLine(raw)
    if (cleaned.trim() || cur.text) cur.text += cleaned + '\n'
  })
  flush()
  return buildDocument(ctx, raws)
}
