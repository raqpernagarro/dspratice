// Checks every slide against Carolina's registry and house rules before it is shown or exported:
// registered template, only schema fields, capacity, dark cover/dividers/closing, no two
// neighbours on the same template, no empty titles, numbers only with a source.
import type { Deck } from './types'
import { templateInfo } from './catalog'
import { quoteMatches } from '../opportunity/validate'

export interface DeckIssue { slideId?: string; n?: number; level: 'error' | 'warning'; text: string }

const FIGURE = /([€$£]\s?\d|\b\d+(\.\d+)?\s?%|\b\d+\s?(weeks?|months?)\b|\b\d+x\b)/i
const arrayFields = ['items', 'cards', 'phases', 'rows', 'steps', 'stats']

/** internalOnly: source id → title for every internal-only source, so a slide that still quotes one
 *  word for word is flagged before a client sees it. */
export function checkDeck(deck: Deck, opts: { internalOnly?: Map<string, string> } = {}): DeckIssue[] {
  const out: DeckIssue[] = []
  deck.slides.forEach((s, i) => {
    const n = i + 1
    const t = templateInfo(s.spec.template)
    if (!t) {
      out.push({ slideId: s.id, n, level: 'error', text: `Slide ${n}: "${s.spec.template}" is not a registered master template.` })
      return
    }
    const allowed = new Set(Object.keys(t.schema ?? {}).concat(['template', 'theme', 'meta', 'footer']))
    for (const k of Object.keys(s.spec)) if (!allowed.has(k)) out.push({ slideId: s.id, n, level: 'error', text: `Slide ${n}: field "${k}" is not in the ${t.name} schema.` })
    for (const f of arrayFields) {
      const v = s.spec[f]
      if (Array.isArray(v) && t.capacity && (v.length < t.capacity.min || v.length > t.capacity.max)) out.push({ slideId: s.id, n, level: 'error', text: `Slide ${n}: ${v.length} ${f} on ${t.name}, which holds ${t.capacity.min}–${t.capacity.max}. Split the slide or pick another template.` })
    }
    if (['cover', 'divider', 'closing'].includes(t.role) && s.spec.theme !== 'dark') out.push({ slideId: s.id, n, level: 'error', text: `Slide ${n}: covers, chapter dividers and the closing are dark.` })
    if (i > 0 && deck.slides[i - 1].spec.template === s.spec.template && t.role !== 'divider') out.push({ slideId: s.id, n, level: 'warning', text: `Slide ${n}: same template as the slide before; vary the rhythm.` })
    if ('title' in (t.schema ?? {}) && !String(s.spec.title ?? '').trim()) out.push({ slideId: s.id, n, level: 'error', text: `Slide ${n}: the title is empty.` })
    const text = JSON.stringify(s.spec)
    if (FIGURE.test(text) && !s.citations.length) out.push({ slideId: s.id, n, level: 'warning', text: `Slide ${n}: a number appears without a source. Numbers need units and a source.` })
    if (/lorem ipsum|name surname|\[client\]/i.test(text)) out.push({ slideId: s.id, n, level: 'error', text: `Slide ${n}: placeholder text is left.` })
    const plain = Object.values(s.spec).map((v) => (typeof v === 'string' ? v : JSON.stringify(v))).join(' ')
    const quoted = new Set(s.citations.filter((c) => c.quote && c.quote.trim().split(/\s+/).length >= 6 && opts.internalOnly?.has(c.sourceId) && quoteMatches(c.quote, plain)).map((c) => opts.internalOnly!.get(c.sourceId)!))
    if (quoted.size) out.push({ slideId: s.id, n, level: 'warning', text: `Slide ${n}: quotes internal-only material (${[...quoted].join(', ')}). Rewrite it in your own words before a client sees it.` })
  })
  return out
}
