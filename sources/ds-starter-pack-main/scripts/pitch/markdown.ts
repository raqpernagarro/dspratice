/**
 * Reads pitch/story.md and pitch/roadmap.md. Only the small Markdown subset the deck uses:
 * `# ` title, `## ` subtitle, paragraphs, `- ` bullets, `1. ` steps, inline marks left as-is.
 */
import type { Block, RoadmapItem, RoadmapStatus } from './slides'

/** A generated slide body: `{{facts}}`, `{{gallery: a, b}}`, `{{configurator}}`, `{{roadmap: done}}`. */
export type Directive =
  | { name: 'facts' }
  | { name: 'gallery'; ids: string[] }
  | { name: 'configurator' }
  | { name: 'roadmap'; which: 'done' | 'next' }

export interface StorySlide {
  layout?: 'title' | 'statement'
  title: string
  subtitle?: string
  blocks: Block[]
  directive?: Directive
}

const LAYOUT = /<!--\s*layout:\s*(\w+)\s*-->/

export function parseStory(source: string): StorySlide[] {
  return source
    .split(/^---\s*$/m)
    .map((chunk) => {
      const layout = chunk.match(LAYOUT)?.[1]
      if (layout && layout !== 'title' && layout !== 'statement') throw new Error(`story.md: unknown layout "${layout}"`)
      const lines = chunk.replace(/<!--[\s\S]*?-->/g, '').split('\n')
      const title = lines.find((l) => l.startsWith('# '))?.slice(2).trim()
      const subtitle = lines.find((l) => l.startsWith('## '))?.slice(3).trim()
      const body = lines.filter((l) => !l.startsWith('# ') && !l.startsWith('## '))
      return { layout, title, subtitle, body }
    })
    .filter((s) => s.title || s.body.some((l) => l.trim()))
    .map(({ layout, title, subtitle, body }, i) => {
      if (!title) throw new Error(`story.md: slide ${i + 1} has no "# " title`)
      const text = body.join('\n').trim()
      const directive = parseDirective(text)
      return { layout: layout as StorySlide['layout'], title, subtitle, blocks: directive ? [] : parseBlocks(body), directive }
    })
}

function parseDirective(text: string): Directive | undefined {
  const m = text.match(/^\{\{\s*(\w+)\s*(?::\s*([^}]*))?\}\}$/)
  if (!m) return undefined
  const [, name, arg = ''] = m
  const args = arg.split(',').map((a) => a.trim()).filter(Boolean)
  if (name === 'facts') return { name }
  if (name === 'configurator') return { name }
  if (name === 'gallery') return { name, ids: args }
  if (name === 'roadmap' && (args[0] === 'done' || args[0] === 'next')) return { name, which: args[0] }
  return undefined // a plain fact, e.g. {{parity}} on its own: left for interpolation
}

function parseBlocks(lines: string[]): Block[] {
  const blocks: Block[] = []
  let para: string[] = []
  const flush = () => {
    if (para.length) blocks.push({ type: 'paragraph', text: para.join(' ') })
    para = []
  }
  for (const raw of lines) {
    const line = raw.trim()
    const bullet = line.match(/^[-*]\s+(.*)$/)
    const step = line.match(/^\d+\.\s+(.*)$/)
    if (bullet || step) {
      flush()
      const type = bullet ? 'bullets' : 'steps'
      const last = blocks[blocks.length - 1]
      const item = (bullet ?? step)![1]
      if (last?.type === type) last.items.push(item)
      else blocks.push({ type, items: [item] })
    } else if (!line) {
      flush()
    } else {
      para.push(line)
    }
  }
  flush()
  return blocks
}

const SECTIONS: Record<string, RoadmapStatus> = { done: 'done', 'in progress': 'in-progress', ideas: 'idea' }

/** `## Done` / `## In progress` / `## Ideas`, each with `- **Title**: text` lines. */
export function parseRoadmap(source: string): RoadmapItem[] {
  const items: RoadmapItem[] = []
  let status: RoadmapStatus | undefined
  for (const raw of source.replace(/<!--[\s\S]*?-->/g, '').split('\n')) {
    const line = raw.trim()
    const heading = line.match(/^##\s+(.*)$/)
    if (heading) {
      status = SECTIONS[heading[1].trim().toLowerCase()]
      if (!status) throw new Error(`roadmap.md: unknown section "${heading[1]}" (use Done, In progress, Ideas)`)
      continue
    }
    const item = line.match(/^[-*]\s+\*\*(.+?)\*\*:?\s*(.*)$/)
    if (item && status) items.push({ title: item[1], text: item[2].charAt(0).toUpperCase() + item[2].slice(1), status })
  }
  return items
}
