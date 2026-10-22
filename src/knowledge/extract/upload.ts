// Browser-side reading of an uploaded or pasted document. Markdown, text and the shared Figma text
// JSON are read natively; .docx (mammoth) and .pdf (pdf.js) load their parser only on first use.
// Formats we cannot read are reported as unsupported, never guessed.

import { extractMarkdown } from './markdown.ts'
import { extractPlain } from './plain.ts'
import { extractFigmaText, type FigmaTextCapture } from './figmaText.ts'
import { buildDocument, type DocContext, type RawSection } from './sections.ts'
import type { KnowledgeDocument } from '../types.ts'

export type UploadFormat = 'markdown' | 'text' | 'figma-json' | 'docx' | 'pdf'
export const UPLOAD_LIMITS: Record<UploadFormat, number> = { markdown: 2e6, text: 2e6, 'figma-json': 5e6, docx: 5e6, pdf: 15e6 }

export class UnsupportedFormatError extends Error {}

export function formatOf(filename: string): UploadFormat | null {
  const ext = filename.toLowerCase().split('.').pop() ?? ''
  if (ext === 'md' || ext === 'mdx' || ext === 'markdown') return 'markdown'
  if (ext === 'txt') return 'text'
  if (ext === 'json') return 'figma-json'
  if (ext === 'docx') return 'docx'
  if (ext === 'pdf') return 'pdf'
  return null
}

export function unsupportedReason(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop() ?? ''
  if (ext === 'pptx' || ext === 'key') return 'Slides files are not read. Export the deck to PDF, or read it from Figma with the knowledge plugin.'
  if (ext === 'doc') return 'Old Word files are not read. Save as .docx or PDF.'
  if (ext === 'xlsx' || ext === 'csv') return 'Spreadsheets are not read yet. Paste the questions as text.'
  return `.${ext} files are not read. Supported: .md, .txt, .docx, .pdf, and Figma text JSON from the knowledge plugin.`
}

export function sectionsFromHtml(html: string, label: string): RawSection[] {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const raws: RawSection[] = []
  let cur: RawSection = { canonical: `${label}#introduction`, heading: 'Introduction', text: '', ref: { path: label }, kind: 'heading' }
  let n = 0
  for (const el of Array.from(doc.body.children)) {
    if (/^H[1-3]$/.test(el.tagName)) {
      if (cur.text.trim()) raws.push(cur)
      n++
      cur = { canonical: `${label}#h${n}:${(el.textContent ?? '').trim().slice(0, 40)}`, heading: (el.textContent ?? '').trim(), text: '', ref: { path: label }, kind: 'heading' }
    } else {
      const t = el.tagName === 'TABLE' ? Array.from(el.querySelectorAll('tr')).map((tr) => Array.from(tr.children).map((c) => (c.textContent ?? '').trim()).filter(Boolean).join(' · ')).join('\n') : (el.textContent ?? '').trim()
      if (t) cur.text += t + '\n'
    }
  }
  if (cur.text.trim()) raws.push(cur)
  return raws
}

export function sectionsFromPages(pages: string[], label: string): RawSection[] {
  return pages.map((p, i) => {
    const first = p.split('\n').find((l) => l.trim())?.trim() ?? ''
    const heading = first && first.length < 80 ? first : `Page ${i + 1}`
    return { canonical: `${label}#page:${i + 1}`, heading, text: p.trim(), ref: { path: label, pageNumber: i + 1 }, kind: 'page' as const }
  })
}

async function readDocx(buf: ArrayBuffer, ctx: DocContext, label: string) {
  const mammoth = await import('mammoth')
  const res = await mammoth.convertToHtml({ arrayBuffer: buf })
  const raws = sectionsFromHtml(res.value, label)
  const warnings = res.messages.filter((m) => m.type === 'warning').slice(0, 5).map((m) => m.message)
  const text = raws.map((r) => `${r.heading}\n${r.text}`).join('\n\n')
  return { doc: buildDocument(ctx, raws.length ? raws : [{ canonical: `${label}#all`, heading: label, text, ref: { path: label }, kind: 'block' }], { warnings }), text }
}

async function readPdf(buf: ArrayBuffer, ctx: DocContext, label: string) {
  const pdfjs = await import('pdfjs-dist')
  const worker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
  pdfjs.GlobalWorkerOptions.workerSrc = worker
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise
  const pages: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const content = await (await pdf.getPage(i)).getTextContent()
    const rows = new Map<number, string[]>()
    for (const item of content.items as { str?: string; transform?: number[] }[]) {
      if (!item.str) continue
      const y = Math.round((item.transform?.[5] ?? 0) / 3)
      rows.set(y, [...(rows.get(y) ?? []), item.str])
    }
    pages.push(Array.from(rows.entries()).sort((a, b) => b[0] - a[0]).map(([, parts]) => parts.join(' ').replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n'))
  }
  const text = pages.join('\n\n')
  const missing = text.replace(/\s/g, '').length < 50 ? [{ what: 'text', why: 'no text layer (a scanned PDF). Run OCR first or paste the text.' }] : []
  return { doc: buildDocument(ctx, sectionsFromPages(pages, label), { missing }), text }
}

/** Reads a File into a KnowledgeDocument plus its plain text (for requests). */
export async function readUpload(file: File, ctx: DocContext): Promise<{ doc: KnowledgeDocument; text: string; format: UploadFormat }> {
  const format = formatOf(file.name)
  if (!format) throw new UnsupportedFormatError(unsupportedReason(file.name))
  if (file.size > UPLOAD_LIMITS[format]) throw new UnsupportedFormatError(`${file.name} is ${(file.size / 1e6).toFixed(1)} MB; the limit for this format is ${UPLOAD_LIMITS[format] / 1e6} MB.`)
  if (format === 'docx') return { ...(await readDocx(await file.arrayBuffer(), ctx, file.name)), format }
  if (format === 'pdf') return { ...(await readPdf(await file.arrayBuffer(), ctx, file.name)), format }
  const text = await file.text()
  if (format === 'figma-json') {
    let capture: FigmaTextCapture
    try {
      capture = JSON.parse(text)
    } catch {
      throw new UnsupportedFormatError('This JSON file could not be parsed.')
    }
    if (capture?.schema !== 'figma-text@1') throw new UnsupportedFormatError('Only Figma text JSON from the knowledge plugin, figma-cli or the MCP capture is read (schema figma-text@1).')
    const doc = extractFigmaText(capture, { sourceId: ctx.sourceId, docId: ctx.docId, readAt: ctx.readAt })
    return { doc, text: doc.sections.map((s) => `${s.heading}\n${s.text}`).join('\n\n'), format }
  }
  const doc = format === 'markdown' ? extractMarkdown(text, { ...ctx, path: file.name }) : extractPlain(text, { ...ctx, label: file.name })
  return { doc, text, format }
}
