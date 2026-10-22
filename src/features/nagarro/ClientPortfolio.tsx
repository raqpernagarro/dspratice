import { Link, useNavigate } from 'react-router'
import { ArrowRight, Play } from 'lucide-react'
import { useStore } from '@/state/store'
import { act, usePaths } from '@/state/hooks'
import { nagarro, practice } from '@/app/routes'
import { PageHead } from '@/shell/PageHead'
import { Btn, Callout, Chip, DemoData, Panel, Stat } from '@/shell/ui'
import { driftItems, health } from '@/state/selectors'
import { Reveal, Stagger } from '@/motion'
import type { Project } from '@/state/types'

export function ClientPortfolio() {
  const navigate = useNavigate()
  const projects = useStore((s) => s.projects)
  const selectedId = useStore((s) => s.selectedProjectId)
  const r = usePaths()
  const list = Object.values(projects)
  const needs = list.filter((p) => p.engagement.needsSpecialist)
  const adapters = Array.from(new Set(list.map((p) => p.engagement.adapterVersion)))

  const openClientExperience = (p: Project) => {
    const to = act().openClientExperience(p.id)
    if (to) navigate(to)
    else act().pushToast({ kind: 'warn', title: 'Publish first', detail: 'The client experience opens once a version is published.' })
  }

  return (
    <div className="page">
      <PageHead
        screen="nagarro"
        title="Client systems"
        lead="Every engagement the practice runs: package, stage, health of the internal draft, what is published to the client, and whether a demo session is running. Clients are fictional."
        eyebrow={
          <>
            <Chip tone="ink">Internal only</Chip>
            <DemoData>Demo data · clients are fictional</DemoData>
          </>
        }
      />

      <Stagger className="grid grid--3">
        <Panel tight>
          <Stat label="Client systems" value={list.length} small />
        </Panel>
        <Panel tight>
          <Stat label="Need a specialist" value={needs.length} small tone={needs.length ? 'warn' : 'ok'} />
        </Panel>
        <Panel tight>
          <Stat label="Adapter versions in use" value={adapters.length} small hint={adapters.join(' · ')} />
        </Panel>
      </Stagger>

      <Reveal>
        <Panel flush>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Package</th>
                  <th>Stage</th>
                  <th>Health</th>
                  <th>Drift</th>
                  <th>Published</th>
                  <th>Client experience</th>
                  <th>Session</th>
                  <th>Next review</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {list.map((p) => {
                  const ph = health(p.draft)
                  const selected = p.id === selectedId
                  return (
                    <tr key={p.id} aria-current={selected ? 'true' : undefined}>
                      <td>
                        <strong>{p.client.name}</strong>
                        <div className="xs muted">{p.client.sector}</div>
                      </td>
                      <td>
                        <Chip tone="outline">{p.engagement.package}</Chip>
                      </td>
                      <td className="small">{p.engagement.stage}</td>
                      <td>
                        <strong style={{ color: ph >= 90 ? 'var(--n-ok)' : ph >= 80 ? 'var(--n-fg)' : 'var(--n-err)' }}>{ph}%</strong>
                      </td>
                      <td className="num">{driftItems(p.draft)}</td>
                      <td className="small">{p.published ? <Chip tone="ok">v{p.published.version}</Chip> : <Chip tone="dashed">not published</Chip>}</td>
                      <td className="small">{p.clientExperience.enabled ? <Chip tone="mint">enabled</Chip> : <span className="muted">off</span>}</td>
                      <td className="small">{p.session ? <Chip tone="info">running · v{p.session.baseVersion}</Chip> : <span className="muted">none</span>}</td>
                      <td>{p.engagement.nextReview === 'Now' ? <Chip tone="err">Now</Chip> : p.engagement.nextReview}</td>
                      <td className="num">
                        <span className="row" style={{ justifyContent: 'flex-end', gap: 6 }}>
                          <Link to={nagarro(p.slug).home} className="btn btn--sm btn--secondary" onClick={() => act().selectProject(p.id)}>
                            Open engagement <ArrowRight />
                          </Link>
                          <Btn size="sm" variant="ghost" disabled={!p.published} title={p.published ? undefined : 'Publish a version first'} onClick={() => openClientExperience(p)}>
                            <Play /> Open client experience
                          </Btn>
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      </Reveal>

      {needs.map((p) => (
        <Callout key={p.id} tone="warn">
          <strong>{p.client.name}</strong> · {p.engagement.needsSpecialist}
        </Callout>
      ))}

      <Panel title="What this view is for" tight>
        <p className="small muted">The panel ships inside each client’s repository; Nagarro owns the panel source and the adapters, versioned and installed per client. This view only reads: the practice sees health and drift, schedules readouts, and ships adapter upgrades. It is never shared with clients.</p>
        <div className="row">
          <Link to={practice.guide('which-path')} className="small">
            Which path fits a client →
          </Link>
          <Link to={r.meeting} className="small">
            Presenter guide →
          </Link>
        </div>
      </Panel>
    </div>
  )
}
