import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Search, Box, Palette, ScrollText, AlertCircle, Sparkles } from 'lucide-react'
import { useStore } from '@/state/store'
import { HERO_TOKEN_ID } from '@/fixtures/demo-brand/tokens'
import { usePaths, useSys } from '@/state/hooks'

interface Hit {
  group: string
  label: string
  meta?: string
  to: string
  icon: React.ReactNode
}

export function CommandPalette() {
  const open = useStore((s) => s.ui.cmdkOpen)
  const setOpen = useStore((s) => s.setCmdkOpen)
  const components = useSys((s) => s.components)
  const tokens = useSys((s) => s.tokens)
  const rules = useStore((s) => s.practice.rules)
  const findings = useSys((s) => s.findings)
  const prs = useSys((s) => s.pullRequests)
  const r = usePaths()
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(!open)
      }
      if (e.key === 'Escape' && open) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  useEffect(() => {
    if (open) {
      setQ('')
      setActive(0)
      setTimeout(() => inputRef.current?.focus(), 10)
    }
  }, [open])

  const hits = useMemo<Hit[]>(() => {
    const needle = q.trim().toLowerCase()
    const words = needle.split(/\s+/).filter(Boolean)
    const match = (text: string) => words.every((w) => text.toLowerCase().includes(w))
    const out: Hit[] = []
    if (!needle) {
      out.push({ group: 'Go to', label: 'Home', to: r.home, icon: <Search /> })
      out.push({ group: 'Go to', label: 'Guided walkthrough', to: r.meeting, icon: <Sparkles /> })
      out.push({ group: 'Go to', label: 'Components', to: r.components, icon: <Box /> })
      out.push({ group: 'Go to', label: 'Tokens', to: r.tokens, icon: <Palette /> })
      out.push({ group: 'Go to', label: 'Changes', to: r.changes, icon: <AlertCircle /> })
      out.push({ group: 'Go to', label: 'AI channels', to: r.channels, icon: <Sparkles /> })
      return out
    }
    for (const c of components) if (match(c.name + ' ' + c.description)) out.push({ group: 'Components', label: c.name, meta: `${c.usedIn} places`, to: r.component(c.id), icon: <Box /> })
    for (const t of tokens) if (match(t.path + ' ' + t.cssName + ' ' + t.figmaName)) out.push({ group: 'Tokens', label: t.figmaName, meta: t.tier, to: r.token(t.id), icon: <Palette /> })
    for (const rule of rules) if (match(rule.title + ' ' + rule.description + ' ' + rule.category)) out.push({ group: 'Rules', label: rule.title, meta: rule.source, to: `${r.contract}#${rule.id}`, icon: <ScrollText /> })
    for (const f of findings) if (match(f.title + ' ' + f.summary)) out.push({ group: 'Findings', label: f.title, meta: f.status, to: r.finding(f.id), icon: <AlertCircle /> })
    for (const p of prs) if (match(`#${p.number} ${p.title}`)) out.push({ group: 'Pull requests', label: `#${p.number} ${p.title}`, meta: p.status, to: r.pr(p.number), icon: <AlertCircle /> })
    return out.slice(0, 14)
  }, [q, components, tokens, rules, findings, prs, r])

  const answer = useMemo(() => {
    const n = q.toLowerCase()
    if (!n) return null
    if (/hover/.test(n) && /dark/.test(n)) {
      const t = tokens.find((x) => x.id === HERO_TOKEN_ID)
      const pr = prs.find((p) => p.findingIds.includes('f-hover-dark'))
      if (!t) return null
      const merged = pr?.status === 'merged'
      return `In dark mode, hover is ${t.values.dark.toUpperCase()}${merged ? ` since #${pr!.number} merged` : ' (same as default: an open finding)'}. Source: ${merged ? `pull request #${pr!.number} and ` : ''}the token file (${t.cssName}).`
    }
    if (/who (can|may) merge|owner/.test(n)) return 'Only the design system owner (Lena Hartmann) can merge. Contributors propose pull requests; agents suggest and make mechanical fixes only.'
    if (/stale|registry/.test(n)) return 'The v0 / shadcn registry is 3 days stale: 2 merges since its last publish. Publish from the Agent channels screen.'
    if (/contrast/.test(n)) return 'One open contrast warning: Toast warning text on the inverse surface reads 3.9:1 in light mode. The rule is WCAG AA (4.5:1 for text).'
    return null
  }, [q, tokens, prs])

  if (!open) return null

  const go = (h: Hit) => {
    setOpen(false)
    navigate(h.to)
  }

  const groups = Array.from(new Set(hits.map((h) => h.group)))

  return (
    <div className="cmdk" onClick={() => setOpen(false)} role="presentation">
      <div className="cmdk__box" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Search">
        <div className="cmdk__input">
          <Search style={{ width: 18, height: 18, color: 'var(--n-fg-muted)' }} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setActive(0)
            }}
            placeholder="Search components, tokens, rules, findings… or ask “hover token dark”"
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') setActive((a) => Math.min(hits.length - 1, a + 1))
              if (e.key === 'ArrowUp') setActive((a) => Math.max(0, a - 1))
              if (e.key === 'Enter' && hits[active]) go(hits[active])
            }}
          />
          <kbd style={{ borderColor: 'var(--n-line-strong)', color: 'var(--n-fg-muted)' }}>esc</kbd>
        </div>
        <div className="cmdk__list">
          {answer && (
            <div className="cmdk__answer">
              <strong>Answer</strong> · {answer}
              <div className="xs muted" style={{ marginTop: 4 }}>
                Rule-based answer from local state, not a model.
              </div>
            </div>
          )}
          {groups.map((g) => (
            <div key={g}>
              <div className="cmdk__group">{g}</div>
              {hits
                .filter((h) => h.group === g)
                .map((h) => {
                  const idx = hits.indexOf(h)
                  return (
                    <button key={h.to + h.label} className={`cmdk__item ${idx === active ? 'is-active' : ''}`} onClick={() => go(h)} onMouseEnter={() => setActive(idx)}>
                      <span style={{ width: 16, height: 16, color: 'var(--n-fg-muted)', display: 'inline-flex' }}>{h.icon}</span>
                      <span style={{ flex: 1 }}>{h.label}</span>
                      {h.meta && <span className="xs muted">{h.meta}</span>}
                    </button>
                  )
                })}
            </div>
          ))}
          {!hits.length && !answer && <div className="empty">Nothing matches “{q}”.</div>}
        </div>
      </div>
    </div>
  )
}
