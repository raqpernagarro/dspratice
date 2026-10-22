import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { AlertTriangle, Plus, Search } from 'lucide-react'
import { usePaths, useSystem } from '@/state/hooks'
import { PageHead } from '@/shell/PageHead'
import { Btn, Chip, DemoData, Meter, Panel, Segmented, Sheet } from '@/shell/ui'
import { componentsWithDrift, componentsWithoutGuidance, guidancePct, openComponentFindings } from '@/state/selectors'
import { DemoScope } from '@/demo-system/DemoScope'
import { ComponentPreview } from '@/demo-system/components'

type Filter = 'all' | 'drift' | 'noguidance' | 'rendered'

export function ComponentsIndex() {
  const navigate = useNavigate()
  const sys = useSystem()
  const r = usePaths()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [newSheet, setNewSheet] = useState(false)
  const drift = componentsWithDrift(sys)
  const noGuidance = componentsWithoutGuidance(sys)

  const rows = useMemo(() => {
    let list = sys.components
    if (filter === 'drift') list = drift
    if (filter === 'noguidance') list = noGuidance
    if (filter === 'rendered') list = list.filter((c) => c.rendered)
    const needle = q.trim().toLowerCase()
    if (needle) list = list.filter((c) => (c.name + ' ' + c.description + ' ' + c.category).toLowerCase().includes(needle))
    return list
  }, [sys.components, filter, q, drift, noGuidance])

  return (
    <div className="page">
      <PageHead
        screen="components"
        title="Components"
        lead={`${sys.components.length} components from the contract: the real React components, their guidance coverage, where they are used and what the checks say.`}
        actions={
          <Btn variant="secondary" onClick={() => setNewSheet(true)}>
            <Plus /> New component
          </Btn>
        }
      />

      <div className="row row--between">
        <div className="row" style={{ flex: 1, minWidth: 220 }}>
          <Search style={{ width: 16, color: 'var(--n-fg-muted)' }} />
          <input className="input" placeholder={`Search ${sys.components.length} components`} value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 360 }} />
        </div>
        <Segmented
          value={filter}
          options={[
            { id: 'all', label: `All ${sys.components.length}` },
            { id: 'drift', label: `Drift ${drift.length}` },
            { id: 'noguidance', label: `No guidance ${noGuidance.length}` },
            { id: 'rendered', label: 'Rendered 16' },
          ]}
          onChange={setFilter}
        />
      </div>

      <Panel flush>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Component</th>
                <th>Preview</th>
                <th>Guidance</th>
                <th className="num">Used in</th>
                <th>Figma</th>
                <th>Checks</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const open = openComponentFindings(sys, c.id)
                return (
                  <tr key={c.id} className="is-clickable" onClick={() => navigate(r.component(c.id))}>
                    <td>
                      <div className="stack" style={{ gap: 2 }}>
                        <strong>{c.name}</strong>
                        <span className="xs muted">
                          {c.category} · {c.description}
                        </span>
                      </div>
                    </td>
                    <td style={{ width: 180 }}>
                      {c.rendered ? (
                        <DemoScope style={{ padding: 8, borderRadius: 8, display: 'inline-block', maxWidth: 170, overflow: 'hidden', zoom: 0.8 }}>
                          <ComponentPreview id={c.id} label={c.id === 'button' ? 'Save' : undefined} />
                        </DemoScope>
                      ) : (
                        <span className="xs muted">data entry</span>
                      )}
                    </td>
                    <td style={{ width: 150 }}>
                      <Meter value={guidancePct(c)} />
                    </td>
                    <td className="num">{c.usedIn} places</td>
                    <td>{c.figmaNodeId ? <Chip tone={c.codeConnect ? 'ok' : 'warn'}>{c.codeConnect ? 'Code Connect' : 'not mapped'}</Chip> : <Chip tone="outline">code only</Chip>}</td>
                    <td>
                      {open.length ? (
                        <Chip tone={open.some((f) => f.severity === 'error') ? 'err' : 'warn'} icon={<AlertTriangle />}>
                          {open.length} issue{open.length > 1 ? 's' : ''}
                        </Chip>
                      ) : (
                        <Chip tone="ok">pass</Chip>
                      )}
                    </td>
                  </tr>
                )
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="empty">No component matches.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
      <div className="row">
        <DemoData>Demo data · 56 is the Starter Pack count; usage numbers are illustrative</DemoData>
      </div>

      {newSheet && (
        <Sheet title="New component" onClose={() => setNewSheet(false)}>
          <p className="small">
            Adding or removing components is set to <strong>Never</strong> for agents and goes through a pull request for people: a spec file (one spec per component), a story, a Figma component set and Code Connect. In this demo the trust level blocks the agent path and the human path is a ticket.
          </p>
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <Btn variant="secondary" onClick={() => setNewSheet(false)}>
              Close
            </Btn>
            <Btn onClick={() => navigate(r.trust)}>See trust levels</Btn>
          </div>
        </Sheet>
      )}
    </div>
  )
}
