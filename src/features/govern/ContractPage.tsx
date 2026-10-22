import { useState } from 'react'
import { GitPullRequest } from 'lucide-react'
import { useStore } from '@/state/store'
import { act, useScope, useSystem } from '@/state/hooks'
import { effectiveActingAs } from '@/state/scope'
import { roleOf } from '@/state/selectors'
import { PageHead } from '@/shell/PageHead'
import { Btn, Callout, Chip, Code, Kv, Panel, Sheet, SimBadge } from '@/shell/ui'
import { GRAMMARS } from '@/contract/adapters'
import type { ContractLayer } from '@/state/types'

export function ContractPage() {
  const sys = useSystem()
  const rules = useStore((x) => x.practice.rules)
  const ui = useStore((x) => x.ui)
  const scope = useScope()
  const [editing, setEditing] = useState<ContractLayer | null>(null)
  const [choice, setChoice] = useState('')
  const layer = sys.contract.layers.find((l) => l.layer === editing)
  const role = roleOf(sys, effectiveActingAs({ ui }, scope))

  const json = {
    $schema: 'ds.contract/v0',
    version: sys.contract.version,
    name: sys.contract.name,
    sources: Object.fromEntries(sys.contract.layers.map((l) => [l.layer, { leads: l.leads, readThrough: l.readThrough }])),
    tokens: { format: 'DTCG 2025.10', grammar: '<tier>-<aspect>-<role>[-<prominence>][-<state>]', adapters: ['dsn', 'starter', 'kit'] },
    components: { discovery: 'react + storybook manifest', metadata: 'guidance JSON per component' },
    rules: Object.entries(sys.contract.rulesEnabled).filter(([, v]) => v).map(([k]) => k),
    figma: { file: sys.contract.figmaFile, plugin: 'ds-configurator-sync', review: 'three-way' },
    ci: sys.contract.ci,
    channels: sys.channels.map((c) => c.id),
  }

  return (
    <div className="page">
      <PageHead
        screen="contract"
        title={`ds.contract.json · version ${sys.contract.version}`}
        lead="One small file in the repository describes the system and which source leads for each layer. Changed only through pull requests. Every tool reads from it."
        eyebrow={<Chip tone="outline">Supported profile: {sys.contract.supportedProfile}</Chip>}
      />

      <div className="grid grid--side">
        <div className="stack">
          <Panel title="Sources of truth" flush>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Layer</th>
                    <th>Leads</th>
                    <th>Read through</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {sys.contract.layers.map((l) => (
                    <tr key={l.layer}>
                      <td>
                        <strong>{l.label}</strong>
                      </td>
                      <td>{l.leads}</td>
                      <td className="small muted">{l.readThrough}</td>
                      <td className="num">
                        <Btn
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditing(l.layer)
                            setChoice(l.leads)
                          }}
                          disabled={role !== 'owner'}
                          title={role !== 'owner' ? 'Only the owner proposes contract changes' : undefined}
                        >
                          Propose a change
                        </Btn>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '0 20px 16px' }} className="xs muted">
              Neither Figma nor code is universally authoritative. Decided per layer in the readout. Default practice rule: Figma leads tokens; code leads the component API.
            </div>
          </Panel>

          <Panel title="Rules in force" tight>
            <div className="stack" style={{ gap: 6 }}>
              {rules.map((r) => {
                const on = sys.contract.rulesEnabled[r.id] !== false
                return (
                  <div key={r.id} id={r.id} className="row row--between" style={{ padding: '6px 0', borderBottom: 'var(--n-hairline) solid var(--n-line)' }}>
                    <div className="stack" style={{ gap: 0 }}>
                      <span className="small">
                        <strong>{r.title}</strong>
                      </span>
                      <span className="xs muted">
                        {r.source} · {r.sourceDetail}
                      </span>
                    </div>
                    <label className="toggle">
                      <input type="checkbox" checked={on} onChange={() => act().toggleRule(r.id)} disabled={role !== 'owner'} /> {on ? 'on' : 'off'}
                    </label>
                  </div>
                )
              })}
            </div>
            <span className="xs muted">Switching a rule off keeps its findings in the report, marked as accepted. Only the owner can switch rules.</span>
          </Panel>
        </div>

        <div className="stack">
          <Panel title="Connected" tight>
            <Kv rows={[['Repository', sys.contract.repo], ['Figma', sys.contract.figmaFile], ['CI', sys.contract.ci], ['Channels', `${sys.channels.length} published from the contract`]]} />
          </Panel>
          <Panel title="Token grammars mapped" tight>
            {GRAMMARS.map((g) => (
              <div key={g.id} className="stack" style={{ gap: 0 }}>
                <span className="small">
                  <strong>{g.name}</strong>
                </span>
                <code className="xs muted">{g.example}</code>
              </div>
            ))}
            <span className="xs muted">Mapped, never renamed. Decisions live in Start → Token mapping.</span>
          </Panel>
          <Panel title="The file" tight>
            <Code>{JSON.stringify(json, null, 2)}</Code>
          </Panel>
        </div>
      </div>

      {editing && layer && (
        <Sheet
          title={`Which source leads for ${layer.label.toLowerCase()}?`}
          onClose={() => setEditing(null)}
          actions={
            <>
              <Btn variant="secondary" onClick={() => setEditing(null)}>
                Cancel
              </Btn>
              <Btn
                onClick={() => {
                  act().setContractLead(layer.layer, choice)
                  setEditing(null)
                }}
                disabled={choice === layer.leads}
              >
                <GitPullRequest /> Propose as pull request
              </Btn>
            </>
          }
        >
          <div className="stack">
            {layer.options.map((o) => (
              <button key={o} className={`choice ${choice === o ? 'is-selected' : ''}`} onClick={() => setChoice(o)}>
                <div className="choice__body">
                  <span className="choice__title">{o}</span>
                </div>
              </button>
            ))}
          </div>
          <Callout tone="info">
            <SimBadge /> Contract changes ship as a pull request; here the lead changes immediately in local state and is logged.
          </Callout>
        </Sheet>
      )}
    </div>
  )
}
