import { ArrowCounterClockwise, Hash, LinkSimple, MagnifyingGlass, Palette, TextT, X } from '@phosphor-icons/react'
import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import {
  brandSlug,
  isAlias,
  variableGraph as graph,
  type ModeContext,
  type RawCollection,
  type RawValue,
  type RawVariable,
  type VariableEdits,
} from '../../../stories/base-ui/tokens/variables-model'
import { Picker } from '../components/controls/ColorPicker'
import { useSemanticEditor } from '../context/SemanticEditorContext'
import { toHex } from '../lib/color'
import { groupOf, useVariablesUi } from './VariablesContext'

const leaf = (name: string) => name.slice(name.lastIndexOf('/') + 1)

interface Cell {
  value: RawValue
  edited: boolean
  /** Brand extensions only: value comes from the base collection (no override). */
  inherited: boolean
}

function cellFor(v: RawVariable, col: RawCollection, modeId: string, edits: VariableEdits): Cell {
  const e = edits[v.id]?.[modeId]
  if (e !== undefined) return { value: e, edited: true, inherited: false }
  if (col.extends) {
    const o = col.overrides?.[v.id]?.[modeId]
    if (o !== undefined) return { value: o, edited: false, inherited: false }
    const parent = col.modes.find((m) => m.id === modeId)?.parent ?? ''
    return { value: edits[v.id]?.[parent] ?? v.values[parent] ?? null, edited: false, inherited: true }
  }
  return { value: v.values[modeId] ?? null, edited: false, inherited: false }
}

function contextFor(col: RawCollection, modeId: string): ModeContext {
  const mode = col.modes.find((m) => m.id === modeId)
  const name = (mode?.name ?? '').toLowerCase()
  return { appearance: name === 'dark' ? 'dark' : 'light', brand: col.extends ? brandSlug(col.name) : null }
}

/** Mode ids an edit should write to: all color modes for linked (sizing) tokens. */
function modesForEdit(v: RawVariable, col: RawCollection, modeId: string) {
  return graph.isLinked(v) ? col.modes.map((m) => m.id) : [modeId]
}

function TypeIcon({ type }: { type: RawVariable['type'] }) {
  if (type === 'COLOR') return <Palette size={13} />
  if (type === 'FLOAT') return <Hash size={13} />
  return <TextT size={13} />
}

function ValueChip({ v, value, ctx, edits }: { v: RawVariable; value: RawValue; ctx: ModeContext; edits: VariableEdits }) {
  const resolved = graph.resolveValue(value, ctx, edits)
  const swatch = v.type === 'COLOR' && typeof resolved === 'string' ? resolved : null
  if (isAlias(value)) {
    const target = graph.vars.get(value.a)
    const opacity = value.o === undefined ? null : typeof value.o === 'number' ? value.o : graph.resolveValue({ a: value.o }, ctx, edits)
    return (
      <span className="vchip vchip--alias" title={target?.name}>
        {swatch ? <span className="vchip__swatch" style={{ background: swatch }} /> : null}
        <span className="vchip__text">{target ? target.name.replace(/^colors?\//, '') : 'missing'}</span>
        {opacity != null ? <span className="vchip__extra">{Number(opacity) > 1 ? opacity : Math.round(Number(opacity) * 100)}%</span> : null}
      </span>
    )
  }
  if (swatch) {
    return (
      <span className="vchip">
        <span className="vchip__swatch" style={{ background: swatch }} />
        <span className="vchip__text">{toHex(swatch)}</span>
      </span>
    )
  }
  return (
    <span className="vchip">
      <span className="vchip__text">{value === null ? '—' : String(value)}</span>
    </span>
  )
}

/** "colors/neutral/950", "#06041F" or "16" for a tooltip. */
function describeValue(value: RawValue): string {
  if (isAlias(value)) return graph.vars.get(value.a)?.name ?? 'an alias'
  return value === null ? 'empty' : String(value)
}

const SOURCE_LABEL = { theme: 'Changed by the theme', override: 'Component override', edit: 'Edited in this table' } as const

/* ------------------------------------------------------------------ editor */

interface EditTarget {
  v: RawVariable
  col: RawCollection
  modeId: string
  rect: DOMRect
}

function CellEditor({ target, onClose }: { target: EditTarget; onClose: () => void }) {
  const { theme, setVariableEdit } = useSemanticEditor()
  const { v, col, modeId, rect } = target
  const cell = cellFor(v, col, modeId, theme.variables)
  const ctx = contextFor(col, modeId)
  const [tab, setTab] = useState<'value' | 'alias'>(isAlias(cell.value) ? 'alias' : 'value')
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: rect.bottom + 6, left: rect.left })
  const modes = modesForEdit(v, col, modeId)
  const set = (value: RawValue | undefined) => setVariableEdit(v.id, modes, value)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const h = el.offsetHeight
    const w = el.offsetWidth
    const top = rect.bottom + 6 + h > window.innerHeight - 12 ? Math.max(12, rect.top - h - 6) : rect.bottom + 6
    setPos({ top, left: Math.min(rect.left, window.innerWidth - w - 12) })
  }, [rect, tab])

  useEffect(() => {
    const down = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose()
    }
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('pointerdown', down)
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('pointerdown', down)
      document.removeEventListener('keydown', key)
    }
  }, [onClose])

  const candidates = useMemo(() => {
    const q = search.trim().toLowerCase()
    const allowed = new Set([...graph.collections.filter((c) => c.name === 'primitives').map((c) => c.id), graph.semantic.id])
    return [...graph.vars.values()]
      .filter((c) => c.type === v.type && c.id !== v.id && allowed.has(c.collection))
      .filter((c) => !q || c.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 120)
  }, [search, v])

  const resolved = graph.resolveValue(cell.value, ctx, theme.variables)
  const modeName = col.modes.find((m) => m.id === modeId)?.name

  return createPortal(
    <div ref={ref} className="vedit" style={{ top: pos.top, left: pos.left }} role="dialog" aria-label={`Edit ${v.name}`}>
      <header className="vedit__head">
        <span>
          <strong>{leaf(v.name)}</strong>
          <small>
            {groupOf(v.name)} · {graph.isLinked(v) ? 'all modes (linked)' : modeName}
          </small>
        </span>
        <button type="button" className="vedit__close" onClick={onClose} aria-label="Close">
          <X size={12} weight="bold" />
        </button>
      </header>
      {v.description ? <p className="vedit__desc">{v.description}</p> : null}
      <div className="vedit__tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'value'} className={tab === 'value' ? 'is-active' : ''} onClick={() => setTab('value')}>
          Value
        </button>
        <button type="button" role="tab" aria-selected={tab === 'alias'} className={tab === 'alias' ? 'is-active' : ''} onClick={() => setTab('alias')}>
          <LinkSimple size={12} /> Alias
        </button>
      </div>

      {tab === 'value' ? (
        <div className="vedit__body">
          {v.type === 'COLOR' ? (
            <Picker hex={toHex(typeof resolved === 'string' ? resolved : '#000000').slice(0, 7)} onChange={(hex) => set(hex)} />
          ) : v.type === 'FLOAT' ? (
            <input
              className="vedit__input"
              type="number"
              value={typeof resolved === 'number' ? resolved : ''}
              onChange={(e) => e.target.value !== '' && set(Number(e.target.value))}
              autoFocus
            />
          ) : (
            <input className="vedit__input" value={resolved == null ? '' : String(resolved)} onChange={(e) => set(e.target.value)} autoFocus />
          )}
        </div>
      ) : (
        <div className="vedit__body">
          <label className="vedit__search">
            <MagnifyingGlass size={12} weight="bold" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search variables" autoFocus />
          </label>
          <ul className="vedit__list">
            {candidates.map((c) => {
              const active = isAlias(cell.value) && cell.value.a === c.id
              return (
                <li key={c.id}>
                  <button type="button" className={active ? 'is-active' : ''} onClick={() => set({ a: c.id })}>
                    <ValueChip v={c} value={{ a: c.id }} ctx={ctx} edits={theme.variables} />
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <footer className="vedit__foot">
        {cell.edited ? (
          <button type="button" className="picker__reset" onClick={() => set(undefined)}>
            <ArrowCounterClockwise size={12} weight="bold" /> Reset
          </button>
        ) : (
          <span className="vedit__hint">{cell.inherited ? 'Inherited from semantic — editing adds an override' : 'Changes apply live'}</span>
        )}
        <button type="button" className="chrome-btn chrome-btn--accent" onClick={onClose}>
          Done
        </button>
      </footer>
    </div>,
    document.body,
  )
}

/* ------------------------------------------------------------------- table */

/** Figma-style variables table on the canvas. */
export function VariablesView() {
  const { theme, clearVariableEdits } = useSemanticEditor()
  const { collectionId, group, inCollection, query, setQuery, loading, changes, changedOnly, setChangedOnly } = useVariablesUi()
  const [editing, setEditing] = useState<EditTarget | null>(null)
  const col = graph.collection(collectionId) ?? graph.semantic
  const rows = inCollection.filter((v) => !group || v.name.startsWith(`${group}/`))
  const editedCount = Object.keys(theme.variables).length
  const grid = { gridTemplateColumns: `minmax(220px, 1.4fr) repeat(${col.modes.length}, minmax(160px, 1fr))` }

  return (
    <section className="vview" aria-label="Variables">
      <div className="canvas__bar">
        <div className="vview__title">
          <strong>{changedOnly ? `Changed in ${col.name}` : col.name}</strong>
          <span>
            {group ?? 'All groups'} · {rows.length} variables
          </span>
        </div>
        <div className="vview__actions">
          <span className="vlegend" aria-label="Legend">
            <span className="vlegend__item is-theme">Theme</span>
            <span className="vlegend__item is-edited">Your edits</span>
            <span className="vlegend__item is-override">Overrides</span>
          </span>
          <button type="button" className={`chrome-btn${changedOnly ? ' chrome-btn--accent' : ''}`} aria-pressed={changedOnly} onClick={() => setChangedOnly(!changedOnly)}>
            {changes.count} changed
          </button>
          {editedCount ? (
            <button type="button" className="chrome-btn" onClick={clearVariableEdits} title="Removes your edits in this table. Theme changes stay: change them in the Theme tab.">
              <ArrowCounterClockwise size={14} weight="bold" /> Reset {editedCount} edit{editedCount === 1 ? '' : 's'}
            </button>
          ) : null}
          <label className="chrome-search">
            <MagnifyingGlass size={14} weight="bold" aria-hidden />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find variables" aria-label="Find variables" />
          </label>
        </div>
      </div>

      <div className="vview__scroll">
        <div className="vtable" role="table" aria-label={`${col.name} variables`}>
          <div className="vtable__head" role="row" style={grid}>
            <span role="columnheader">Name</span>
            {col.modes.map((m) => (
              <span
                key={m.id}
                role="columnheader"
                title={m.filled ? `Your Figma file has no ${m.name} mode yet. These are the starter system's values; Export to Figma adds the mode with them.` : undefined}
              >
                {m.name}
                {m.filled ? <em className="vtable__filled">from starter</em> : null}
              </span>
            ))}
          </div>
          {loading ? <p className="vtable__empty">Loading components…</p> : null}
          {!loading && !rows.length ? <p className="vtable__empty">{changedOnly ? 'Nothing changed in this collection.' : 'No variables match.'}</p> : null}
          {rows.map((v, i) => {
            const g = groupOf(v.name)
            const showGroup = i === 0 || groupOf(rows[i - 1].name) !== g
            const linked = graph.isLinked(v) && col.modes.length > 1
            const change = changes.byName.get(v.name)
            return (
              <Fragment key={v.id}>
                {showGroup ? (
                  <div className="vtable__group" role="row">
                    {g || '—'}
                  </div>
                ) : null}
                <div className={`vtable__row${change ? ` is-changed is-${change.source}` : ''}`} role="row" style={grid}>
                  <span className="vtable__name" role="cell" title={change ? `${SOURCE_LABEL[change.source]} · ${v.name}` : (v.description ?? v.name)}>
                    {change ? <i className="vtable__mark" aria-label={SOURCE_LABEL[change.source]} /> : null}
                    <TypeIcon type={v.type} />
                    <span>{leaf(v.name)}</span>
                    {linked ? <LinkSimple size={12} className="vtable__linked" aria-label="Same value in all modes" /> : null}
                  </span>
                  {col.modes.map((m) => {
                    const cell = cellFor(v, col, m.id, theme.variables)
                    const ctx = contextFor(col, m.id)
                    const active = editing?.v.id === v.id && editing.modeId === m.id
                    const themed = !cell.edited && change && change.source !== 'edit' ? change.values[ctx.appearance] : undefined
                    const shown = themed !== undefined ? themed : cell.value
                    return (
                      <button
                        key={m.id}
                        type="button"
                        role="cell"
                        className={[
                          'vtable__cell',
                          cell.edited ? 'is-edited' : '',
                          themed !== undefined ? `is-${change!.source}` : '',
                          cell.inherited ? 'is-inherited' : '',
                          active ? 'is-active' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        title={themed !== undefined ? `${SOURCE_LABEL[change!.source]} · was ${describeValue(cell.value)}` : undefined}
                        onClick={(e) => setEditing({ v, col, modeId: m.id, rect: e.currentTarget.getBoundingClientRect() })}
                      >
                        <ValueChip v={v} value={shown} ctx={ctx} edits={theme.variables} />
                      </button>
                    )
                  })}
                </div>
              </Fragment>
            )
          })}
        </div>
      </div>
      {editing ? <CellEditor key={`${editing.v.id}:${editing.modeId}`} target={editing} onClose={() => setEditing(null)} /> : null}
    </section>
  )
}
