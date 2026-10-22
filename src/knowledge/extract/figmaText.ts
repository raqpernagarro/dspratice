// The one Figma text format every runner produces: our Figma plugin, figma-cli (`eval`), the Figma
// MCP (`use_figma`) and the REST proxy (via framesFromRest). One section per top-level frame
// (slide); the largest text becomes the heading; recurring footer text is removed; frames the
// capture excluded are listed in `missing` with the reason.

import { buildDocument, dedupeBoilerplate, type DocContext, type RawSection } from './sections.ts'
import type { KnowledgeDocument, ReadBy } from '../types.ts'

export interface FigmaTextItem { text: string; fontSize?: number; x?: number; y?: number }
export interface FigmaFrameText { nodeId: string; name: string; type?: string; texts: FigmaTextItem[] }
export interface FigmaTextCapture {
  schema: 'figma-text@1'
  fileKey: string
  fileName?: string
  editorType?: 'figma' | 'figjam' | 'slides'
  page: { id: string; name: string }
  capturedAt: string
  capturedBy: Extract<ReadBy, 'figma-plugin' | 'figma-cli' | 'figma-mcp' | 'figma-rest'>
  frames: FigmaFrameText[]
  excluded?: { nodeId: string; name: string; reason: string }[]
}

export function frameUrl(fileKey: string, nodeId: string, board = false) {
  return `https://www.figma.com/${board ? 'board' : 'design'}/${fileKey}/?node-id=${nodeId.replace(':', '-')}`
}

const cleanName = (name: string) => {
  const base = name.split('/').pop() ?? name
  return base.replace(/[-_]+/g, ' ').replace(/\b(\d+)\b/g, '').replace(/\s+/g, ' ').trim().replace(/^./, (c) => c.toUpperCase()) || name
}

/** Reading order: rows (12 px tolerance) top to bottom, then left to right. Keeps given order when positions are absent. */
export function readingOrder(items: FigmaTextItem[]): FigmaTextItem[] {
  if (items.some((i) => i.y === undefined)) return items
  return [...items].sort((a, b) => (Math.abs((a.y ?? 0) - (b.y ?? 0)) <= 12 ? (a.x ?? 0) - (b.x ?? 0) : (a.y ?? 0) - (b.y ?? 0)))
}

export function extractFigmaText(capture: FigmaTextCapture, ctx: Omit<DocContext, 'readBy' | 'readAt'> & { readAt?: number }): KnowledgeDocument {
  const board = capture.editorType === 'figjam'
  let raws: RawSection[] = capture.frames.map((f) => {
    const items = readingOrder(f.texts.map((t) => ({ ...t, text: t.text.replace(/\u2028/g, '\n').trim() })).filter((t) => t.text))
    const biggest = items.reduce<FigmaTextItem | null>((best, t) => ((t.fontSize ?? 0) > (best?.fontSize ?? 0) ? t : best), null)
    const useBig = biggest && (biggest.fontSize ?? 0) >= 20 && biggest.text.length <= 120
    const heading = useBig ? biggest!.text.replace(/\s+/g, ' ') : cleanName(f.name)
    const body = items.filter((t) => !(useBig && t === biggest)).map((t) => t.text).join('\n')
    return { canonical: f.nodeId, heading, text: body, ref: { page: capture.page.name, frame: f.name, nodeId: f.nodeId, url: frameUrl(capture.fileKey, f.nodeId, board) }, kind: board ? 'sticky' : 'slide' }
  })
  const deduped = dedupeBoilerplate(raws)
  raws = deduped.sections
  const missing = [
    ...(capture.excluded ?? []).map((e) => ({ what: `Frame "${e.name}" (${e.nodeId})`, why: e.reason })),
    ...capture.frames.filter((f) => !f.texts.some((t) => t.text.trim())).map((f) => ({ what: `Frame "${f.name}" (${f.nodeId})`, why: 'image-only: no text to read' })),
  ]
  const warnings = deduped.removed ? [`Removed ${deduped.removed} recurring footer and header lines (deck name, client name, ©, page numbers).`] : []
  return buildDocument({ ...ctx, readBy: capture.capturedBy, readAt: ctx.readAt ?? Date.parse(capture.capturedAt) }, raws, { missing, warnings })
}

/** Figma REST nodes response (slimmed by the proxy) → the shared capture format. */
export interface RestNode { id: string; name: string; type: string; characters?: string; style?: { fontSize?: number }; absoluteBoundingBox?: { x: number; y: number }; children?: RestNode[] }
export function framesFromRest(fileKey: string, page: { id: string; name: string }, frames: RestNode[], fileName?: string): FigmaTextCapture {
  const collect = (n: RestNode, out: FigmaTextItem[]) => {
    if (n.type === 'TEXT' && n.characters) out.push({ text: n.characters, fontSize: n.style?.fontSize, x: n.absoluteBoundingBox?.x, y: n.absoluteBoundingBox?.y })
    for (const c of n.children ?? []) collect(c, out)
    return out
  }
  return {
    schema: 'figma-text@1',
    fileKey,
    fileName,
    page,
    capturedAt: new Date().toISOString(),
    capturedBy: 'figma-rest',
    frames: frames.map((f) => ({ nodeId: f.id, name: f.name, type: f.type, texts: collect(f, []) })),
  }
}
