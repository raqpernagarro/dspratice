import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { ArrowRight, Check } from 'lucide-react'
import { useStore } from '@/state/store'
import { act, usePaths, useSys } from '@/state/hooks'
import { PageHead } from '@/shell/PageHead'
import { Btn, Callout, Chip, Panel, Segmented, Stat } from '@/shell/ui'
import { GRAMMARS, mapGrammar, summarise, type GrammarId } from '@/contract/adapters'
import { DSN_SAMPLE, KIT_SAMPLE, STARTER_SAMPLE } from '@/fixtures/reference/grammars'

const SAMPLES: Record<GrammarId, string[]> = { dsn: DSN_SAMPLE, starter: STARTER_SAMPLE, kit: KIT_SAMPLE }

export function Mapping() {
  const navigate = useNavigate()
  const r = usePaths()
  const mapping = useSys((s) => s.journey.mapping)
  const setGrammar = useStore((s) => s.setMappingGrammar)
  const setDecision = useStore((s) => s.setMappingDecision)
  const results = useMemo(() => mapGrammar(mapping.grammar, SAMPLES[mapping.grammar]), [mapping.grammar])
  const sum = summarise(results)
  const info = GRAMMARS.find((g) => g.id === mapping.grammar)!
  const pending = results.filter((r) => r.status === 'needs-decision' && !mapping.decisions[r.source])
  const decided = Object.keys(mapping.decisions).length

  return (
    <div className="page">
      <PageHead
        screen="connect"
        title="Token mapping"
        lead="Three grammars, one set of roles. The adapter maps names to contract roles; it never renames your tokens. What it cannot decide, you decide here. Names below are real samples from the three practice systems."
      />

      <div className="row row--between">
        <Segmented value={mapping.grammar} options={GRAMMARS.map((g) => ({ id: g.id, label: g.name }))} onChange={setGrammar} ariaLabel="Source grammar" />
        <Chip tone="outline">{info.model}</Chip>
      </div>

      <div className="grid grid--4">
        <Panel tight>
          <Stat label="Sampled" value={sum.total} small hint={info.modes} />
        </Panel>
        <Panel tight>
          <Stat label="Mapped" value={sum.mapped} small tone="ok" hint="by name, no rename" />
        </Panel>
        <Panel tight>
          <Stat label="Needs a decision" value={sum.needsDecision} small tone="warn" hint={`${pending.length} still open`} />
        </Panel>
        <Panel tight>
          <Stat label="Stays system-specific" value={sum.unmapped} small hint="kept, not mapped" />
        </Panel>
      </div>

      {mapping.grammar !== 'dsn' && (
        <Callout tone="info">
          Example: <code>{info.example}</code>. {mapping.grammar === 'starter' ? '"pressed" is a banned word in the closed vocabulary (→ "active"). Map it, or allow it as a synonym for this system.' : 'The kit has two radius names for one role and a 4xl space step the contract ladder does not have. Those are decisions, not errors.'}
        </Callout>
      )}

      <Panel flush>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Source name</th>
                <th>Contract role</th>
                <th>Status</th>
                <th>Decision</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.source}>
                  <td>
                    <code>{r.source}</code>
                  </td>
                  <td>{r.contractPath ? <code>{r.contractPath}</code> : <span className="muted">—</span>}</td>
                  <td>
                    <Chip tone={r.status === 'mapped' ? 'ok' : r.status === 'needs-decision' ? 'warn' : 'outline'}>{r.status === 'needs-decision' ? 'needs decision' : r.status}</Chip>
                    {r.note && <div className="xs muted" style={{ marginTop: 4, maxWidth: 360 }}>{r.note}</div>}
                  </td>
                  <td>
                    {r.status === 'needs-decision' ? (
                      <Segmented
                        value={mapping.decisions[r.source] ?? ('' as 'accept')}
                        options={[
                          { id: 'accept', label: 'Map it' },
                          { id: 'alias', label: 'Allow as alias' },
                          { id: 'skip', label: 'Keep separate' },
                        ]}
                        onChange={(d) => setDecision(r.source, d)}
                      />
                    ) : (
                      <span className="xs muted">{r.status === 'mapped' ? 'automatic' : 'kept'}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="row row--between">
        <span className="small muted">{pending.length === 0 ? 'All decisions made for this grammar.' : `${pending.length} decision${pending.length > 1 ? 's' : ''} open (partial mapping is allowed; open ones stay listed in the contract).`}</span>
        <span className="row">
          <Btn
            variant="secondary"
            disabled={decided === 0}
            title={decided === 0 ? 'Decide at least one mapping first' : undefined}
            onClick={() => {
              const n = act().applyMappingDecisions()
              act().pushToast({ kind: 'ok', title: `${n} decision${n === 1 ? '' : 's'} applied to the contract`, detail: 'The semantic layer now reads through the adapter. Skipped names stay system-specific.' })
            }}
          >
            <Check /> Apply decisions to the contract
          </Btn>
          <Btn onClick={() => navigate(r.journeyImprove(5))}>
            Review the drift list <ArrowRight />
          </Btn>
        </span>
      </div>
    </div>
  )
}
