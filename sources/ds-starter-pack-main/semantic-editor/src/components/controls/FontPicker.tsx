import { CaretDown, MagnifyingGlass } from '@phosphor-icons/react'
import { useEffect, useMemo, useRef, useState } from 'react'

import type { GenericFamily, WebFont } from '../../../../stories/base-ui/tokens/theme-config'
import catalog from '../../data/google-fonts.json'

type Row = [family: string, category: string, weights: number[], variable: boolean]
const FONTS = catalog as Row[]
const CATEGORIES = ['All', 'Sans Serif', 'Serif', 'Display', 'Monospace', 'Handwriting'] as const
const UI_WEIGHTS = [400, 500, 600, 700]

/** css2 weight spec covering the weights the system uses (or the variable range). */
const GENERIC: Record<string, GenericFamily> = { Serif: 'serif', Monospace: 'monospace', Handwriting: 'cursive' }

export function webFontFor(row: Row): WebFont {
  const [family, category, weights, variable] = row
  const fallback = GENERIC[category] ?? 'sans-serif'
  if (variable && weights.length > 1) return { family, weights: `${weights[0]}..${weights[weights.length - 1]}`, fallback }
  const wanted = weights.filter((w) => UI_WEIGHTS.includes(w))
  return { family, weights: (wanted.length ? wanted : weights).join(';'), fallback }
}

const previewed = new Set<string>()

/**
 * The family name previews are registered under. Never the real name: a preview holds only a few
 * glyphs at weight 400, and under the real name the browser would pick it for regular-weight text
 * in the theme, so every other letter fell back to the default serif.
 */
export const previewFamily = (family: string) => `DS Preview ${family}`

/** Loads only the glyphs needed to draw the family's name and "Aa": cheap list previews. */
function loadPreview(family: string) {
  if (previewed.has(family)) return
  previewed.add(family)
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}&text=${encodeURIComponent(`${family}Aa`)}&display=swap`
  fetch(url)
    .then((res) => (res.ok ? res.text() : ''))
    .then((css) => {
      if (!css) return
      const style = document.createElement('style')
      style.dataset.fontPreview = family
      style.textContent = css.replace(/font-family:\s*(['"])[^'"]*\1/g, `font-family: '${previewFamily(family)}'`)
      document.head.appendChild(style)
    })
    .catch(() => {
      // Offline or blocked: the list shows the name in the UI font.
    })
}

function FontOption({ row, selected, onPick }: { row: Row; selected: boolean; onPick: (row: Row) => void }) {
  const ref = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        loadPreview(row[0])
        io.disconnect()
      }
    })
    io.observe(el)
    return () => io.disconnect()
  }, [row])

  return (
    <button
      ref={ref}
      type="button"
      role="option"
      aria-selected={selected}
      className={`font-option${selected ? ' is-active' : ''}`}
      onClick={() => onPick(row)}
    >
      <span className="font-option__name" style={{ fontFamily: `'${previewFamily(row[0])}', var(--ui-font)` }}>
        {row[0]}
      </span>
      <span className="font-option__meta">{row[1]}</span>
    </button>
  )
}

/** Searchable picker over the full Google Fonts catalog. */
export function FontPicker({
  label,
  description,
  value,
  customized,
  onChange,
  onReset,
  resetLabel = 'Reset',
}: {
  label: string
  description: string
  /** Family currently in use. */
  value: string
  customized: boolean
  onChange: (font: WebFont) => void
  onReset: () => void
  resetLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('All')

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return FONTS.filter((f) => (category === 'All' || f[1] === category) && (!q || f[0].toLowerCase().includes(q))).slice(0, 80)
  }, [query, category])

  useEffect(() => {
    if (value) loadPreview(value)
  }, [value])

  return (
    <div className={`font-picker${open ? ' is-open' : ''}`}>
      <button type="button" className="font-picker__row" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="font-picker__aa" style={{ fontFamily: `'${previewFamily(value)}', var(--ui-font)` }}>
          Aa
        </span>
        <span className="color-editor__text">
          <span className="color-editor__label">
            {label}
            {customized ? <i className="color-editor__dot" title="Changed" /> : null}
          </span>
          <span className="color-editor__desc">{description}</span>
        </span>
        <span className="font-picker__value">{value}</span>
        <CaretDown size={12} weight="bold" className="color-editor__caret" />
      </button>
      {open ? (
        <div className="font-picker__panel">
          <label className="font-picker__search">
            <MagnifyingGlass size={13} weight="bold" aria-hidden />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${FONTS.length.toLocaleString()} Google fonts`}
              aria-label="Search fonts"
            />
          </label>
          <div className="font-picker__cats">
            {CATEGORIES.map((c) => (
              <button key={c} type="button" className={c === category ? 'is-active' : ''} onClick={() => setCategory(c)}>
                {c === 'Sans Serif' ? 'Sans' : c === 'Monospace' ? 'Mono' : c}
              </button>
            ))}
          </div>
          <div className="font-picker__list" role="listbox" aria-label={`${label} font`}>
            {results.map((row) => (
              <FontOption
                key={row[0]}
                row={row}
                selected={row[0] === value}
                onPick={(r) => {
                  onChange(webFontFor(r))
                  setOpen(false)
                }}
              />
            ))}
            {!results.length ? <p className="font-picker__empty">No fonts match “{query}”.</p> : null}
          </div>
          {customized ? (
            <button type="button" className="picker__reset font-picker__reset" onClick={onReset}>
              {resetLabel}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
