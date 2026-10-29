import { PencilSimple } from '@phosphor-icons/react'
import { forwardRef, useLayoutEffect, useRef, useState } from 'react'

import type { PreviewToken } from '../lib/preview-tokens'
import { figmaTokenToCssVar } from '@ds-tokens/figma-css-var'

const KIND_LABEL: Record<PreviewToken['kind'], string> = {
  surface: 'surface',
  stroke: 'stroke',
  label: 'label',
  spacing: 'spacing',
  typography: 'typography',
  other: 'other',
}

function tokenCssVar(path: string) {
  if (path.startsWith('--')) return path
  return figmaTokenToCssVar(path)
}

function TokenSwatch({ path, scope }: { path: string; scope: HTMLElement | null }) {
  const ref = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || !scope) return
    const cssVar = tokenCssVar(path)
    const raw = getComputedStyle(scope).getPropertyValue(cssVar).trim()
    if (!raw) {
      el.style.background = 'linear-gradient(135deg, #3a4252 50%, #2a3140 50%)'
      return
    }
    if (path.startsWith('color/') || path.startsWith('--ds-')) {
      el.style.background = raw
      el.style.border = '1px solid color-mix(in srgb, #fff 12%, transparent)'
    } else {
      el.style.background = '#2a3140'
    }
  }, [path, scope])

  return <span className="token-popover__swatch" ref={ref} aria-hidden />
}

export const TokenInspectorPopover = forwardRef<
  HTMLDivElement,
  {
    title: string
    tokens: PreviewToken[]
    anchorRect: DOMRect
    themeScope: HTMLElement | null
    pinned?: boolean
    onClose?: () => void
    /** Shown as an edit button in the header (components open their editor). */
    onEdit?: () => void
  }
>(function TokenInspectorPopover(
  { title, tokens, anchorRect, themeScope, pinned = false, onClose, onEdit },
  ref,
) {
  const innerRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  useLayoutEffect(() => {
    const pop = innerRef.current
    if (!pop) return
    const margin = 12
    const gap = 8
    const w = pop.offsetWidth
    const h = pop.offsetHeight
    let left = anchorRect.right - w
    let top = anchorRect.bottom + gap
    if (top + h > window.innerHeight - margin) top = anchorRect.top - h - gap
    left = Math.max(margin, Math.min(left, window.innerWidth - w - margin))
    top = Math.max(margin, Math.min(top, window.innerHeight - h - margin))
    setPos({ top, left })
  }, [anchorRect, tokens.length, pinned])

  const setRefs = (node: HTMLDivElement | null) => {
    innerRef.current = node
    if (typeof ref === 'function') ref(node)
    else if (ref) ref.current = node
  }

  return (
    <div
      ref={setRefs}
      className={['token-popover', pinned ? 'token-popover--pinned' : ''].filter(Boolean).join(' ')}
      style={{ top: pos.top, left: pos.left, position: 'fixed' }}
      role={pinned ? 'dialog' : 'tooltip'}
      aria-label={pinned ? `${title} tokens` : undefined}
      onClick={(e) => e.stopPropagation()}
    >
      <header className="token-popover__header">
        <span className="token-popover__glyph" aria-hidden>
          ◫
        </span>
        <span className="token-popover__title">{title}</span>
        <span className="token-popover__count">{tokens.length}</span>
        {pinned && onEdit ? (
          <button type="button" className="token-popover__close" onClick={onEdit} aria-label={`Edit ${title} component`} title="Edit component">
            <PencilSimple size={13} weight="bold" />
          </button>
        ) : null}
        {pinned && onClose ? (
          <button type="button" className="token-popover__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        ) : null}
      </header>
      <ul className="token-popover__list">
        {tokens.map((token) => (
          <li key={token.path} className="token-popover__row">
            <TokenSwatch path={token.path} scope={themeScope} />
            <span className="token-popover__name">{formatTokenPath(token.path)}</span>
            <span className="token-popover__kind">{KIND_LABEL[token.kind]}</span>
          </li>
        ))}
      </ul>
    </div>
  )
})

function formatTokenPath(path: string) {
  if (path.startsWith('--')) return path.slice(2).replace(/-/g, '.')
  return path.replace(/\//g, '.')
}
