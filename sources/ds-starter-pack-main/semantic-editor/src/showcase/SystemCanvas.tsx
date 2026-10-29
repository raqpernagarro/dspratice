import { MagnifyingGlass, X } from '@phosphor-icons/react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import { pack, type TileMetrics } from './pack'

import { SHOWCASE_GROUPS, SHOWCASE_ITEMS, type ShowcaseGroup } from './registry'
import { Tile } from './Tile'

type Filter = 'all' | ShowcaseGroup

export function SystemCanvas() {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [filter])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return SHOWCASE_ITEMS.filter(
      (item) =>
        (filter === 'all' || item.group === filter) &&
        (!q || item.title.toLowerCase().includes(q) || item.group.includes(q)),
    )
  }, [filter, query])

  // Tiles report their sizes; the canvas packs them into justified rows of similar heights.
  const gridRef = useRef<HTMLDivElement>(null)
  const metrics = useRef(new Map<string, TileMetrics>())
  const [measured, setMeasured] = useState(0)
  const [grid, setGrid] = useState({ width: 0, gap: 0 })
  const onMeasure = useCallback((id: string, m: TileMetrics) => {
    const prev = metrics.current.get(id)
    if (prev && JSON.stringify(prev) === JSON.stringify(m)) return
    metrics.current.set(id, m)
    setMeasured((n) => n + 1)
  }, [])
  useLayoutEffect(() => {
    const el = gridRef.current
    if (!el) return
    const read = () => {
      const width = el.clientWidth
      const gap = parseFloat(getComputedStyle(el).columnGap) || 0
      setGrid((g) => (g.width === width && g.gap === gap ? g : { width, gap }))
    }
    read()
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const layout = useMemo(
    () => pack(visible.map((i) => i.id), metrics.current, grid.width, grid.gap),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `measured` stands for the metrics map
    [visible, grid, measured],
  )
  // In packed order in the DOM too, so reading and tab order follow what's on screen.
  const ordered = useMemo(
    () => [...visible].sort((a, b) => layout.get(a.id)!.order - layout.get(b.id)!.order),
    [visible, layout],
  )

  const filters: { id: Filter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: SHOWCASE_ITEMS.length },
    ...SHOWCASE_GROUPS.map((g) => ({
      id: g.id,
      label: g.label,
      count: SHOWCASE_ITEMS.filter((i) => i.group === g.id).length,
    })),
  ]

  return (
    <section className="canvas" aria-label="System preview">
      <div className="canvas__bar">
        <div className="chrome-chips" role="tablist" aria-label="Filter">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              className={filter === f.id ? 'is-active' : ''}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
              <span>{f.count}</span>
            </button>
          ))}
        </div>
        <label className="chrome-search">
          <MagnifyingGlass size={14} weight="bold" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find in system"
            aria-label="Find in system"
          />
          {query ? (
            <button type="button" onClick={() => setQuery('')} aria-label="Clear search">
              <X size={12} weight="bold" />
            </button>
          ) : null}
        </label>
      </div>

      <div className="canvas__scroll" ref={scrollRef}>
        <div className="masonry" ref={gridRef}>
          {ordered.map((item) => (
            <Tile key={item.id} item={item} place={layout.get(item.id)} onMeasure={onMeasure} />
          ))}
        </div>
        {!visible.length ? <p className="canvas__empty">Nothing matches “{query}”.</p> : null}
      </div>
    </section>
  )
}
