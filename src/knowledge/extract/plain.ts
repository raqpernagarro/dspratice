// Plain text (pasted or .txt) → blocks separated by blank lines, merged to about 1,500 characters;
// a short first line becomes the heading.

import { buildDocument, type DocContext, type RawSection } from './sections.ts'
import type { KnowledgeDocument } from '../types.ts'

export function extractPlain(text: string, ctx: DocContext & { label: string }): KnowledgeDocument {
  const blocks = text.replace(/\r\n?/g, '\n').split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean)
  const raws: RawSection[] = []
  let buf: string[] = []
  const flush = () => {
    if (!buf.length) return
    const first = buf[0].split('\n')[0]
    const heading = first.length <= 80 ? first.replace(/[:.]$/, '') : `${ctx.label} · part ${raws.length + 1}`
    const body = first.length <= 80 ? buf.join('\n\n').slice(first.length).trim() || buf.join('\n\n') : buf.join('\n\n')
    raws.push({ canonical: `${ctx.label}#block:${raws.length + 1}`, heading, text: body, ref: { path: ctx.label }, kind: 'block' })
    buf = []
  }
  for (const b of blocks) {
    if (buf.join('\n\n').length + b.length > 1500) flush()
    buf.push(b)
  }
  flush()
  return buildDocument(ctx, raws)
}
