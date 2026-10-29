import { BracketsCurly, PencilSimple, SlidersHorizontal } from '@phosphor-icons/react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { TokenInspectorPopover } from '../components/TokenInspectorPopover'
import { useSemanticEditor } from '../context/SemanticEditorContext'
import { PREVIEW_SECTION_TOKENS } from '../lib/preview-tokens'
import type { Placement, TileMetrics } from './pack'
import type { ShowcaseItem } from './registry'

/** Fired when a tile opens its token list, so the others close theirs. */
const TOKENS_OPEN = 'tile:tokens-open'

/** The narrowest card (a span-1 tile), in px. */
const MIN_CARD = 224

export function Tile({
  item,
  place,
  onMeasure,
}: {
  item: ShowcaseItem
  place?: Placement
  onMeasure: (id: string, metrics: TileMetrics) => void
}) {
  const { section, setSection, openComponent } = useSemanticEditor()
  const tokens = item.tokens ? (PREVIEW_SECTION_TOKENS[item.tokens] ?? []) : []
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [anchor, setAnchor] = useState<DOMRect | null>(null)
  const [scope, setScope] = useState<HTMLElement | null>(null)
  const open = anchor !== null

  // The token list stays put once opened, so it can be read and scrolled: it closes with its ×,
  // Escape, the tokens button, or when another tile opens its own list.
  useEffect(() => {
    if (!open) return
    const close = () => setAnchor(null)
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    const onOther = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== item.id) close()
    }
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', close)
    window.addEventListener(TOKENS_OPEN, onOther)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', close)
      window.removeEventListener(TOKENS_OPEN, onOther)
    }
  }, [open, item.id])

  const toggleTokens = () => {
    const el = triggerRef.current
    if (!el) return
    if (open) return setAnchor(null)
    window.dispatchEvent(new CustomEvent(TOKENS_OPEN, { detail: item.id }))
    setScope(el.closest('.theme-scope') as HTMLElement | null)
    setAnchor(el.getBoundingClientRect())
  }

  const Render = item.render
  const editing = item.edit !== undefined && item.edit === section

  // The canvas packs the tiles (see pack.ts); each tile measures what it needs: the narrowest
  // width its preview fits in (min-content, never below MIN_CARD × item.span) and its height at
  // a few widths from there up to the full canvas.
  const articleRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const el = articleRef.current
    const content = contentRef.current
    const grid = el?.parentElement
    if (!el || !content || !grid) return
    const measure = () => {
      const ts = getComputedStyle(el)
      const chrome = parseFloat(ts.paddingLeft) + parseFloat(ts.paddingRight) + parseFloat(ts.borderLeftWidth) + parseFloat(ts.borderRightWidth)
      // At its real scale, and not shrinking (in centered tiles the preview is a flex item).
      const contentStyle = content.style.cssText
      Object.assign(content.style, { width: 'min-content', maxWidth: 'none', flexShrink: '0', zoom: '1' })
      const fit = Math.ceil(content.getBoundingClientRect().width + chrome)
      const need = Math.max(MIN_CARD * (item.span ?? 1), fit)
      content.style.cssText = contentStyle
      const wide = grid.clientWidth
      const tileStyle = el.style.cssText
      const heightAt = (w: number) => {
        el.style.cssText = `${tileStyle};flex:none;width:${w}px;align-self:flex-start`
        return Math.round(el.getBoundingClientRect().height)
      }
      const narrow = Math.min(need, wide)
      const widths = [...new Set([...[1, 1.25, 1.5, 2, 3].map((f) => Math.min(wide, Math.round(narrow * f))), wide])].sort((a, b) => a - b)
      const probes = widths.map((w): [number, number] => [w, heightAt(w)])
      el.style.cssText = tileStyle
      onMeasure(item.id, { fit, need, chrome, fixed: !!item.component, probes })
    }
    measure()
    // The canvas width changes the full-width probe; the preview's own size can change with the theme.
    const ro = new ResizeObserver(measure)
    ro.observe(grid)
    ro.observe(content)
    return () => ro.disconnect()
  }, [item.id, item.span, item.component, onMeasure])

  return (
    <article
      ref={articleRef}
      style={place ? { flexBasis: place.basis, flexGrow: place.grow } : { flexBasis: MIN_CARD * (item.span ?? 1), flexGrow: 1 }}
      className={[
        'tile',
        item.center ? 'tile--center' : '',
        editing ? 'is-editing' : '',
        item.component ? 'tile--component' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-labelledby={`tile-${item.id}`}
    >
      <header className="tile__head">
        <div className="tile__heading">
          <h3 id={`tile-${item.id}`} className="tile__title">
            {item.title}
          </h3>
          {item.meta ? <span className="tile__meta">{item.meta}</span> : null}
        </div>
        <div className="tile__actions">
          {tokens.length ? (
            <button
              ref={triggerRef}
              type="button"
              className={`tile__action${open ? ' is-active' : ''}`}
              onClick={toggleTokens}
              aria-expanded={open}
              aria-label={`${item.title} tokens`}
              title="Inspect tokens"
            >
              <BracketsCurly size={14} weight="bold" />
              <span>{tokens.length}</span>
            </button>
          ) : null}
          {item.edit ? (
            <button
              type="button"
              className={`tile__action${editing ? ' is-active' : ''}`}
              onClick={() => item.edit && setSection(item.edit)}
              aria-label={`Edit ${item.title}`}
              title="Edit in panel"
            >
              <SlidersHorizontal size={14} weight="bold" />
            </button>
          ) : null}
          {item.component ? (
            <button
              type="button"
              className="tile__action"
              onClick={() => openComponent(item.component!)}
              aria-label={`Edit ${item.title} component`}
              title="Edit component"
            >
              <PencilSimple size={14} weight="bold" />
            </button>
          ) : null}
        </div>
      </header>
      <div className="tile__body">
        {/* Components work right here (open the select, toggle the switch); the pencil edits them.
            Drawings of a single part (an option, a menu item) are pictures only. */}
        <div ref={contentRef} className="tile__content" style={{ zoom: place?.zoom ?? 1 }} inert={item.static ? true : undefined}>
          <Render />
        </div>
      </div>
      {open && anchor
        ? createPortal(
            <TokenInspectorPopover
              ref={popoverRef}
              title={item.title}
              tokens={tokens}
              anchorRect={anchor}
              themeScope={scope}
              pinned
              onClose={() => setAnchor(null)}
              onEdit={item.component ? () => openComponent(item.component!) : undefined}
            />,
            document.body,
          )
        : null}
    </article>
  )
}
