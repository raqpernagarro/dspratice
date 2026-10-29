import { ArrowRight, BookOpenText, Cube, MagnifyingGlass, PaintBrush, Sparkle, Swatches } from '@phosphor-icons/react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { DOC_PAGES, searchPages, type DocPage } from './catalog'

export interface PaletteAction {
  id: string
  label: string
  hint: string
  run: () => void
}

/** ⌘K: jump to any page of the docs, or run an action (ask the agent, open a step). */
export function CommandPalette({ open, onClose, onPick, actions, pages = DOC_PAGES }: { open: boolean; onClose: () => void; onPick: (page: DocPage) => void; actions: PaletteAction[]; pages?: DocPage[] }) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const ref = useRef<HTMLDialogElement>(null)

  const results = useMemo(() => {
    const found = searchPages(query, pages).map((p) => ({ kind: 'page' as const, page: p }))
    const q = query.trim().toLowerCase()
    const acts = actions.filter((a) => !q || a.label.toLowerCase().includes(q) || a.hint.toLowerCase().includes(q)).map((a) => ({ kind: 'action' as const, action: a }))
    return [...found.slice(0, 9), ...acts]
  }, [query, actions, pages])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) {
      setQuery('')
      setActive(0)
      el.showModal()
    } else if (!open && el.open) el.close()
  }, [open])

  useEffect(() => setActive(0), [query])

  const choose = (i: number) => {
    const r = results[i]
    if (!r) return
    onClose()
    if (r.kind === 'page') onPick(r.page)
    else r.action.run()
  }

  const icon = (p: DocPage) => (p.kind === 'foundation' ? <Swatches size={16} /> : p.kind === 'component' ? <Cube size={16} /> : <BookOpenText size={16} />)

  return (
    <dialog ref={ref} className="palette" onClose={onClose} aria-label="Search the docs">
      <div className="palette__input">
        <MagnifyingGlass size={16} />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search components, foundations, or ask…"
          aria-label="Search"
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-list"
          aria-activedescendant={results[active] ? `palette-${active}` : undefined}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setActive((a) => Math.min(results.length - 1, a + 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setActive((a) => Math.max(0, a - 1))
            } else if (e.key === 'Enter') {
              e.preventDefault()
              choose(active)
            }
          }}
        />
        <kbd>Esc</kbd>
      </div>
      <ul className="palette__list" id="palette-list" role="listbox">
        {results.map((r, i) => (
          <li
            key={r.kind === 'page' ? r.page.id : r.action.id}
            id={`palette-${i}`}
            role="option"
            aria-selected={i === active}
            className={i === active ? 'is-active' : ''}
            onMouseEnter={() => setActive(i)}
            onClick={() => choose(i)}
          >
            {r.kind === 'page' ? (
              <>
                <span className="palette__icon">{icon(r.page)}</span>
                <span className="palette__text">
                  <strong>{r.page.title}</strong>
                  <span>{r.page.summary}</span>
                </span>
                <span className="palette__section">{r.page.section}</span>
              </>
            ) : (
              <>
                <span className="palette__icon">{r.action.id === 'ask' ? <Sparkle size={16} weight="fill" /> : r.action.id === 'configure' ? <PaintBrush size={16} /> : <ArrowRight size={16} />}</span>
                <span className="palette__text">
                  <strong>{r.action.label}</strong>
                  <span>{r.action.hint}</span>
                </span>
              </>
            )}
          </li>
        ))}
        {!results.length ? <li className="palette__empty">No matches. Try “button” or “color”.</li> : null}
      </ul>
    </dialog>
  )
}
