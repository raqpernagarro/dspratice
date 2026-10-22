// Reading a source: local files through the local server, Figma through REST (when a token is
// set) or the shared text JSON (plugin, figma-cli, MCP capture), uploads in the browser.
// Every read is real; nothing here is simulated. Sources we cannot read say so.

import { useStore } from '../store'
import { runTask, taskKey, type TaskOutcome } from '../tasks'
import { knowledgeRegistry } from '@/knowledge/selectors'
import { extractMarkdown } from '@/knowledge/extract/markdown'
import { extractPlain } from '@/knowledge/extract/plain'
import { htmlToMarkdown } from '@/knowledge/extract/html'
import { extractFigmaText, framesFromRest } from '@/knowledge/extract/figmaText'
import { readUpload } from '@/knowledge/extract/upload'
import type { KnowledgeSource } from '@/knowledge/types'
import { IntegrationError, figmaFile, figmaNodes, readLocal } from '@/integrations/api'
import { integrations } from '@/integrations/status'

const S = () => useStore.getState()
export const readTaskId = (sourceId: string) => taskKey('practice', `read-${sourceId}`)

function src(id: string): KnowledgeSource {
  const s = knowledgeRegistry(S().practice.knowledge).find((x) => x.id === id)
  if (!s) throw new Error('This source is no longer in the library.')
  return s
}

export function canReadAgain(s: KnowledgeSource): { ok: boolean; why?: string } {
  const st = integrations()
  switch (s.location.type) {
    case 'local':
      return st.offline ? { ok: false, why: 'Needs the local server (npm run dev).' } : { ok: true }
    case 'figma':
      return st.figma.configured ? { ok: true } : { ok: false, why: 'Figma REST is not configured. Read it with the Figma knowledge plugin or figma-cli and upload the JSON (Replace), or add FIGMA_TOKEN.' }
    case 'figjam':
      return { ok: false, why: 'FigJam boards are read with the plugin or the Claude Code runbook (docs/figma-reading.md), then uploaded.' }
    case 'url':
      return { ok: false, why: 'Links are registered, not read.' }
    case 'repo':
      return { ok: false, why: 'Private repositories are not read from here.' }
    case 'figma-folder':
      return st.figma.configured ? { ok: true } : { ok: false, why: 'Listing a Figma folder needs FIGMA_TOKEN (scope projects:read or folders:read).' }
    case 'upload':
      return { ok: false, why: 'Uploaded sources are updated with Replace.' }
  }
}

export function readSource(sourceId: string): Promise<TaskOutcome> {
  return runTask(readTaskId(sourceId), 'Read the source', [
    {
      label: 'Reading the source',
      run: async (signal) => {
        const s = src(sourceId)
        const docId = `pending.${sourceId}`
        try {
          if (s.location.type === 'local') {
            const r = await readLocal(s.location.path, signal)
            const ctx = { sourceId, docId, readBy: 'local-read' as const, readAt: Date.now() }
            const path = s.location.path
            const doc = /\.mdx?$/i.test(path) ? extractMarkdown(r.text, { ...ctx, path }) : /\.html?$/i.test(path) ? extractMarkdown(htmlToMarkdown(r.text), { ...ctx, path }) : extractPlain(r.text, { ...ctx, label: path })
            await S().applyBody(sourceId, doc, { readBy: 'local-read', sourceUpdatedAt: r.mtime })
            return
          }
          if (s.location.type === 'figma') {
            const loc = s.location
            const info = await figmaFile(loc.fileKey, signal)
            const page = info.pages.find((p) => p.name === loc.page || p.id === loc.page) ?? info.pages.find((p) => p.frames.some((f) => loc.nodeIds.includes(f.id))) ?? info.pages[0]
            const ids = loc.nodeIds.length ? loc.nodeIds : page.frames.map((f) => f.id)
            const frames = []
            for (let i = 0; i < ids.length; i += 20) {
              const r = await figmaNodes(loc.fileKey, ids.slice(i, i + 20), signal)
              for (const id of ids.slice(i, i + 20)) if (r.nodes[id]) frames.push(r.nodes[id]!)
            }
            const capture = framesFromRest(loc.fileKey, { id: page.id, name: page.name }, frames, info.name)
            const doc = extractFigmaText(capture, { sourceId, docId, readAt: Date.now() })
            await S().applyBody(sourceId, doc, { readBy: 'figma-rest', sourceUpdatedAt: Date.parse(info.lastModified) })
            return
          }
          throw new Error(canReadAgain(s).why ?? 'This source cannot be read from here.')
        } catch (e) {
          if (e instanceof IntegrationError) {
            if (['not-found', 'figma-not-found', 'figma-forbidden', 'not-allowed', 'forbidden'].includes(e.code)) S().setAvailability(sourceId, 'inaccessible', e.message)
            throw e
          }
          throw e
        }
      },
    },
  ])
}

export function uploadToSource(sourceId: string, file: File): Promise<TaskOutcome> {
  return runTask(readTaskId(sourceId), 'Read the upload', [
    {
      label: 'Reading the document',
      run: async () => {
        const { doc } = await readUpload(file, { sourceId, docId: `pending.${sourceId}`, readBy: 'upload', readAt: Date.now() })
        await S().applyBody(sourceId, doc, { readBy: doc.readBy === 'upload' ? 'upload' : doc.readBy })
      },
    },
  ])
}

export async function pasteToSource(sourceId: string, text: string, label: string) {
  const doc = extractPlain(text, { sourceId, docId: `pending.${sourceId}`, readBy: 'paste', readAt: Date.now(), label })
  return S().applyBody(sourceId, doc, { readBy: 'paste' })
}
