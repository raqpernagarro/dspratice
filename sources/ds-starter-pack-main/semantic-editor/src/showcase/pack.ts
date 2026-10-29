/**
 * Packs the canvas tiles into justified rows: every row fills the canvas edge to edge, every card
 * is at least as wide as its preview needs, and cards that share a row have similar heights (so
 * stretching them to the row's height leaves little empty space).
 *
 * Order sets priority, not exact position: a row takes the next card, then the following cards
 * (looking a few ahead) that fit beside it and keep the row balanced.
 */

/** What a tile reports about itself (Tile measures it). */
export interface TileMetrics {
  /** Narrowest card width without overflow, chrome included… */
  fit: number
  /** …and the width the card asks for: `fit`, but never below its span minimum. */
  need: number
  /** Card padding + border, horizontally. */
  chrome: number
  /** The preview is a fixed-size picture (components): widening the card only adds empty space. */
  fixed: boolean
  /** Card height at a few widths from `need` to the full canvas: [width, height], widest last. */
  probes: [number, number][]
}

/** Where the canvas puts a tile. */
export interface Placement {
  order: number
  /** flex-basis and flex-grow: the row's cards together fill the canvas exactly. */
  basis: number
  grow: number
  /** Preview scale: below 1 only when the preview is wider than the whole canvas. */
  zoom: number
}

/** Cards in a row keep at least this height ratio (shortest / tallest). */
const BALANCE = 0.6
/** Looser ratio, to fill a row that would otherwise stretch a card past twice its width when the
 *  card is fixed-size or short… */
const BALANCE_FILL = 0.4
/** …short meaning lower than this × the canvas width once stretched. */
const SPARSE = 0.35
/** No card gets taller than this × its width, unless it would even at the full canvas width. */
const TALL = 1.4
/** How many cards ahead a row may pull a card from. */
const LOOKAHEAD = 6

/** Height at width w: between the two nearest probes, linearly. */
function heightAt(m: TileMetrics, w: number) {
  const p = m.probes
  if (w <= p[0][0]) return p[0][1]
  for (let i = 1; i < p.length; i++) {
    const [w1, h1] = p[i]
    if (w <= w1) {
      const [w0, h0] = p[i - 1]
      return h0 + ((h1 - h0) * (w - w0)) / (w1 - w0)
    }
  }
  return p[p.length - 1][1]
}

export function pack(ids: string[], metrics: Map<string, TileMetrics>, width: number, gap: number) {
  const out = new Map<string, Placement>()
  const need = (id: string) => Math.min(metrics.get(id)!.need, width)
  const sum = (row: string[]) => row.reduce((s, id) => s + need(id), 0) + gap * (row.length - 1)
  const fits = (row: string[]) => sum(row) <= width
  // Each card grows in proportion to its need, so wide previews stay wide.
  const widths = (row: string[]) => {
    const total = row.reduce((s, id) => s + need(id), 0)
    const free = width - sum(row)
    return row.map((id) => need(id) + (free * need(id)) / total)
  }
  const balance = (row: string[]) => {
    const ws = widths(row)
    const hs = row.map((id, i) => heightAt(metrics.get(id)!, ws[i]))
    return Math.min(...hs) / Math.max(...hs)
  }
  // Content that reflows (swatch grids, lists) gets tall when squeezed: rather give it its own row.
  const tooTall = (row: string[]) =>
    widths(row).some((w, i) => {
      const m = metrics.get(row[i])!
      return heightAt(m, w) > TALL * w && heightAt(m, width) <= TALL * width
    })

  const queue = ids.filter((id) => metrics.has(id))
  const rows: string[][] = []
  while (queue.length) {
    const row = [queue.shift()!]
    const take = (min: number, best: boolean) => {
      let pick = -1
      let score = min
      for (let i = 0; i < Math.min(LOOKAHEAD, queue.length); i++) {
        const next = [...row, queue[i]]
        if (!fits(next) || tooTall(next)) continue
        const b = balance(next)
        if (b < score) continue
        pick = i
        if (!best) break
        score = b
      }
      if (pick < 0) return false
      row.push(queue.splice(pick, 1)[0])
      return true
    }
    while (take(BALANCE, false)) {}
    // A card stretched across the canvas looks empty when it's short or its preview can't reflow;
    // a tall reflowing one reads as a panel.
    const sparse = () => {
      if (sum(row) >= width / 2) return false
      const ws = widths(row)
      return row.some((id, i) => metrics.get(id)!.fixed || heightAt(metrics.get(id)!, ws[i]) < SPARSE * width)
    }
    while (sparse() && take(BALANCE_FILL, true)) {}
    rows.push(row)
  }

  let order = 0
  rows.forEach((row, r) => {
    // The last row isn't stretched when that would blow its cards up.
    const last = r === rows.length - 1 && sum(row) < width * 0.75
    const ws = last ? row.map(need) : widths(row)
    row.forEach((id, i) => {
      const m = metrics.get(id)!
      const zoom = m.fit > width ? Math.floor(((width - m.chrome) / (m.fit - m.chrome)) * 100) / 100 : 1
      // A hair under the exact width, so rounding never wraps the row; grow absorbs the rest.
      out.set(id, { order: order++, basis: Math.max(0, Math.floor(ws[i] * 100) / 100 - 0.1), grow: last ? 0 : 1, zoom })
    })
  })
  // Not measured yet: after the rest, at the narrowest size.
  for (const id of ids) if (!out.has(id)) out.set(id, { order: order++, basis: 0, grow: 1, zoom: 1 })
  return out
}
