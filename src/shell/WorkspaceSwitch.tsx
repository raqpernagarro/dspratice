import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate } from 'react-router'
import { Building2, ChevronDown, Users } from 'lucide-react'
import { equivalentRoute, practice } from '@/app/routes'
import { act, useProject, useSystem } from '@/state/hooks'
import type { Workspace } from '@/state/types'
import { cx } from './ui'

/** The workspace switcher. The menu is portaled to <body> so no ancestor can clip it. */
export function WorkspaceSwitch({ workspace }: { workspace: Workspace }) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 56, left: 0 })
  const navigate = useNavigate()
  const location = useLocation()
  const project = useProject()
  const sys = useSystem()
  const client = workspace === 'client'

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!open) return
    const rect = btnRef.current?.getBoundingClientRect()
    if (rect) setPos({ top: rect.bottom + 8, left: rect.left })
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
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const switchTo = (target: Workspace) => {
    setOpen(false)
    if (target === workspace) return
    const exists = (kind: string, id: string) => {
      if (kind === 'pr' || kind === 'prFigma') return sys.pullRequests.some((p) => String(p.number) === id)
      if (kind === 'figma') return sys.figmaChangeSets.some((c) => c.id === id)
      if (kind === 'impact') return sys.changes.some((c) => c.id === id)
      return true
    }
    if (target === 'client' && !project.published) {
      act().pushToast({ kind: 'warn', title: 'Nothing published yet', detail: `${project.client.name} opens in the client workspace once a version is published.` })
      return
    }
    act().setLastWorkspace(target)
    navigate(equivalentRoute(location.pathname, target, project.slug, exists))
  }

  const menu = (
    <div ref={menuRef} className="ws-switch__menu ws-switch__menu--portal" role="menu" style={{ top: pos.top, left: pos.left }}>
      <div className="ws-switch__label">Workspace</div>
      <button role="menuitem" className={cx('ws-switch__item', !client && 'is-active')} onClick={() => switchTo('nagarro')}>
        <Building2 style={{ width: 14 }} />
        <span>
          <strong>Nagarro workspace</strong>
          <small>Prepare and manage engagements, library, guides</small>
        </span>
      </button>
      <button role="menuitem" className={cx('ws-switch__item', client && 'is-active')} onClick={() => switchTo('client')}>
        <Users style={{ width: 14 }} />
        <span>
          <strong>Client workspace</strong>
          <small>{project.client.name} · the explorable showcase</small>
        </span>
      </button>
      <div className="ws-switch__foot">
        <Link to={practice.welcome} onClick={() => setOpen(false)}>
          Choose a workspace…
        </Link>
      </div>
    </div>
  )

  return (
    <div className="ws-switch">
      <button ref={btnRef} className="ws-switch__btn" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} data-testid="workspace-switch">
        {client ? <Users style={{ width: 14 }} /> : <Building2 style={{ width: 14 }} />}
        <span className="hide-sm">{client ? 'Client workspace' : 'Nagarro workspace'}</span>
        <ChevronDown style={{ width: 12 }} />
      </button>
      {open && createPortal(menu, document.body)}
    </div>
  )
}
