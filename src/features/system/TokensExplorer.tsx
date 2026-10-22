import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { usePaths, useSystem } from '@/state/hooks'
import { PageHead } from '@/shell/PageHead'
import { Chip, Kv, Panel, Segmented, Swatch } from '@/shell/ui'
import { tokenInSync, tokenValue } from '@/state/selectors'
import { DemoScope } from '@/demo-system/DemoScope'
import { ComponentPreview } from '@/demo-system/components'
import type { BrandId, Mode, Tier, Token } from '@/state/types'

interface Node {
  key: string
  label: string
  children: Map<string, Node>
  token?: Token
}

function buildTree(tokens: Token[]): Node {
  const root: Node = { key: '', label: '', children: new Map() }
  for (const t of tokens) {
    const parts = t.path.split('.')
    let cur = root
    parts.forEach((p, i) => {
      const key = parts.slice(0, i + 1).join('.')
      if (!cur.children.has(key)) cur.children.set(key, { key, label: p, children: new Map() })
      cur = cur.children.get(key)!
      if (i === parts.length - 1) cur.token = t
    })
  }
  return root
}

export function TokensExplorer() {
  const { id } = useParams()
  const navigate = useNavigate()
  const sys = useSystem()
  const r = usePaths()
  const [tier, setTier] = useState<Tier>('semantic')
  const [brand, setBrand] = useState<BrandId>('demo')
  const [density, setDensity] = useState<'compact' | 'standard' | 'comfortable'>('standard')
  const [open, setOpen] = useState<Set<string>>(new Set(['color', 'color.background', 'color.background.interactive', 'color.background.interactive.primary']))
  const selected = sys.tokens.find((t) => t.id === id) ?? sys.tokens.find((t) => t.id === 'color-background-interactive-primary-hover')!
  const tokens = useMemo(() => sys.tokens.filter((t) => t.tier === tier), [sys.tokens, tier])
  const tree = useMemo(() => buildTree(tokens), [tokens])

  const toggle = (k: string) =>
    setOpen((prev) => {
      const n = new Set(prev)
      if (n.has(k)) n.delete(k)
      else n.add(k)
      return n
    })

  const renderNode = (n: Node, depth = 0) => {
    const kids = Array.from(n.children.values())
    const isOpen = open.has(n.key)
    if (n.token) {
      const t = n.token
      return (
        <button key={n.key} className={`tree__node ${selected.id === t.id ? 'is-active' : ''}`} onClick={() => navigate(r.token(t.id))}>
          {t.type === 'color' && <Swatch color={tokenValue(t, brand, 'light')} />}
          <span style={{ flex: 1 }}>{n.label}</span>
          {!tokenInSync(t) && <span className="dot" style={{ color: 'var(--n-warn)' }} />}
        </button>
      )
    }
    return (
      <div key={n.key}>
        <button className="tree__node" onClick={() => toggle(n.key)}>
          {isOpen ? <ChevronDown style={{ width: 14 }} /> : <ChevronRight style={{ width: 14 }} />}
          <span style={{ flex: 1 }}>{n.label}</span>
          <span className="xs muted">{countTokens(n)}</span>
        </button>
        {isOpen && <div className="tree__children">{kids.map((k) => renderNode(k, depth + 1))}</div>}
      </div>
    )
  }

  const usedBy = selected.usedBy.map((cid) => sys.components.find((c) => c.id === cid)).filter(Boolean)
  const findings = sys.findings.filter((f) => f.tokenIds.includes(selected.id))

  return (
    <div className="page">
      <PageHead
       
        title="Tokens"
        lead={`${sys.tokens.length} tokens in three layers: raw values, what they mean (semantic), and component-specific ones. Each shows its Figma variable, its code name, its value in every brand and mode, and where it is used.`}
        actions={
          <>
            <Segmented
              value={tier}
              options={[
                { id: 'primitive', label: 'Primitive' },
                { id: 'semantic', label: 'Semantic' },
                { id: 'component', label: 'Component' },
              ]}
              onChange={(v) => setTier(v)}
            />
            <Segmented value={brand} options={sys.theme.brands.map((b) => ({ id: b.id, label: `Brand: ${b.name}` }))} onChange={setBrand} />
            <Segmented
              value={density}
              options={[
                { id: 'compact', label: 'Compact' },
                { id: 'standard', label: 'Standard' },
                { id: 'comfortable', label: 'Comfortable' },
              ]}
              onChange={setDensity}
            />
          </>
        }
      />

      <div className="grid" style={{ gridTemplateColumns: 'minmax(220px, 300px) minmax(0, 1fr)' }}>
        <Panel tight style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <div className="tree">{Array.from(tree.children.values()).map((n) => renderNode(n))}</div>
        </Panel>

        <div className="stack">
          <Panel title={selected.path} actions={<Chip tone="outline">{selected.tier}</Chip>}>
            <table className="table">
              <thead>
                <tr>
                  <th>Mode</th>
                  <th>Value · {sys.theme.brands.find((b) => b.id === brand)?.name}</th>
                  <th>Figma holds</th>
                </tr>
              </thead>
              <tbody>
                {(['light', 'dark'] as Mode[]).map((m) => {
                  const v = tokenValue(selected, brand, m)
                  const drift = selected.figmaDrift?.[m]
                  return (
                    <tr key={m}>
                      <td style={{ textTransform: 'capitalize' }}>{m}</td>
                      <td>
                        <span className="row">
                          {selected.type === 'color' && <Swatch color={v} />}
                          <code>{v}</code>
                        </span>
                      </td>
                      <td>{drift ? <Chip tone="warn">{drift} · out of sync</Chip> : <Chip tone="ok">same</Chip>}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <Kv
              rows={[
                ['Figma variable', <code>{selected.figmaName}</code>],
                ['CSS', <code>{selected.cssName}</code>],
                ['Type', selected.type],
                ['Used by', `${usedBy.length} component${usedBy.length === 1 ? '' : 's'} and ${selected.figmaLayerCount} Figma layers`],
                ...(selected.description ? ([['Description', selected.description]] as [React.ReactNode, React.ReactNode][]) : []),
              ]}
            />
            {findings.length > 0 && (
              <div className="row">
                {findings.map((f) => (
                  <Link key={f.id} to={r.finding(f.id)} className="chip chip--warn">
                    {f.title}
                  </Link>
                ))}
              </div>
            )}
          </Panel>

          {usedBy.length > 0 && (
            <Panel title="Used by" tight>
              <DemoScope brand={brand} density={density} style={{ padding: 16, borderRadius: 12, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                {usedBy.slice(0, 6).map((c) => (
                  <Link key={c!.id} to={r.component(c!.id)} style={{ textDecoration: 'none', color: 'inherit' }} title={c!.name}>
                    <ComponentPreview id={c!.id} label={c!.name} />
                  </Link>
                ))}
              </DemoScope>
              <div className="row">
                {usedBy.map((c) => (
                  <Link key={c!.id} to={r.component(c!.id)} className="chip chip--outline">
                    {c!.name}
                  </Link>
                ))}
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  )
}

function countTokens(n: Node): number {
  if (n.token) return 1
  let c = 0
  for (const k of n.children.values()) c += countTokens(k)
  return c
}
