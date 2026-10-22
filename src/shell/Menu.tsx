import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router'
import { cx } from './ui'

/** A small header menu. Portaled to <body> so the header's overflow never clips it; Esc and outside clicks close it. */
export function MenuButton({ label, icon, children, align = 'right', className, testid }: { label: ReactNode; icon?: ReactNode; children: (close: () => void) => ReactNode; align?: 'left' | 'right'; className?: string; testid?: string }) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top?: number | 'auto'; bottom?: number | 'auto'; left?: number | 'auto'; right?: number | 'auto'; maxHeight?: number }>({ top: 56 })
  const location = useLocation()

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!open) return
    const rect = btnRef.current?.getBoundingClientRect()
    if (rect) {
      // Open upwards when the button sits low on the screen (the demo guide bar is at the bottom).
      const up = rect.bottom > window.innerHeight * 0.6
      const v = up ? { top: 'auto' as const, bottom: window.innerHeight - rect.top + 8, maxHeight: rect.top - 16 } : { top: rect.bottom + 8, bottom: 'auto' as const, maxHeight: window.innerHeight - rect.bottom - 16 }
      setPos(align === 'right' ? { ...v, left: 'auto', right: Math.max(8, window.innerWidth - rect.right) } : { ...v, left: rect.left, right: 'auto' })
    }
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node) || btnRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        btnRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    queueMicrotask(() => menuRef.current?.querySelector<HTMLElement>('button, a, select')?.focus())
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, align])

  const close = () => setOpen(false)
  return (
    <>
      <button ref={btnRef} className={cx('btn btn--on-dark-ghost btn--sm', className)} onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} data-testid={testid}>
        {icon}
        {label}
      </button>
      {open &&
        createPortal(
          <div ref={menuRef} className="ws-switch__menu ws-switch__menu--portal hdr-menu" role="menu" style={{ ...pos, overflowY: 'auto' }}>
            {children(close)}
          </div>,
          document.body,
        )}
    </>
  )
}

export function MenuItem({ icon, title, detail, onClick, danger }: { icon?: ReactNode; title: ReactNode; detail?: ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button role="menuitem" className={cx('ws-switch__item', danger && 'is-danger')} onClick={onClick}>
      {icon}
      <span>
        <strong>{title}</strong>
        {detail && <small>{detail}</small>}
      </span>
    </button>
  )
}
