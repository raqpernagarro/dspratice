import { Link, useNavigate } from 'react-router'
import { Play, CheckSquare, Square } from 'lucide-react'
import { useState } from 'react'
import { act, usePaths, useProject, useSystem } from '@/state/hooks'
import type { RouteFamily } from '@/app/routes'
import { PageHead } from '@/shell/PageHead'
import { Btn, Chip, Panel } from '@/shell/ui'
import { TOUR } from '@/features/demo/steps'
import { Reveal, Stagger } from '@/motion'

const PACKAGES = [
  { name: 'AI Audit', dur: '2 weeks', when: 'A system exists but nobody knows how healthy it is, or AI output is generic.', shows: 'Scan, report, one real component, the refusal.', leaves: 'AI-readiness score, baseline, one pilot component made AI-ready.' },
  { name: 'DS Build', dur: '12–20 weeks', when: 'No system, or one too broken to build on.', shows: 'Set-up wizard, Figma export and 3-way review, panel on the same repository.', leaves: 'Repository, Figma library, panel, CI checks, AI files, handover.' },
  { name: 'DS Accelerate', dur: '8–14 weeks', when: 'A system worth keeping that drifted and is not readable by agents.', shows: 'Finding → rule → impact → PR + Figma review; channels; evals.', leaves: 'Contract, adapters, resolved drift, published channels, a named owner.' },
  { name: 'DS Scale', dur: '16–24 weeks', when: 'Many brands, many products, migration ahead.', shows: 'Brands and modes, the configurator, token mapping across grammars.', leaves: 'Token architecture, brand collections, migration plan.' },
  { name: 'Support', dur: 'ongoing', when: 'After handover: keep it from drifting.', shows: 'Checks in CI, release evals, agent trust levels, audit trail.', leaves: 'Panel and adapter upgrades, periodic reviews.' },
]

const READOUT_PREP = [
  'Run the scan on the client’s own profile (React + JSON tokens + Figma variables?) or say what the adapter cannot read.',
  'Pick the three findings to open live: one collision, one parity gap, one guidance gap.',
  'Decide the recommended lead per layer (tokens: Figma; component API: code) and be ready to argue the other way.',
  'Know the owner candidate before the call; the handover depends on it.',
  'Choose the package to propose and the first pull request you would ship in week one.',
  'Have the read-only share link ready for the steering group.',
]

export function PresenterGuide() {
  const navigate = useNavigate()
  const project = useProject()
  const sys = useSystem()
  const r: RouteFamily = usePaths()
  const [done, setDone] = useState<Record<number, boolean>>({})

  const openMeeting = () => {
    const to = act().openClientExperience(project.id)
    if (to) navigate(to + '?guide=meeting')
    else act().pushToast({ kind: 'warn', title: 'Publish first', detail: 'The client experience opens once a version is published.' })
  }

  return (
    <div className="page">
      <PageHead
        title="Presenter guide"
        lead={`How to run the ${project.client.name} meeting live, what to say at each step, which evidence to open, and how to prepare the readout. Internal.`}
        eyebrow={<Chip tone="ink">Internal only</Chip>}
        actions={
          <Btn onClick={openMeeting} title={project.published ? undefined : 'Publish a version first'}>
            <Play /> Open client experience in meeting mode
          </Btn>
        }
      />

      <Reveal>
        <Panel title="The demo script" flush>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Client problem</th>
                  <th>Say</th>
                  <th>Talking points</th>
                  <th>Evidence</th>
                </tr>
              </thead>
              <tbody>
                {TOUR.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <strong>{s.n}</strong>
                      <div className="xs">
                        <Link to={s.route(sys, r)}>{s.title}</Link>
                      </div>
                    </td>
                    <td className="small">{s.problem}</td>
                    <td className="small">{s.say}</td>
                    <td className="small muted">
                      <ul style={{ margin: 0, paddingLeft: 16 }}>
                        {s.talkingPoints.map((t) => (
                          <li key={t}>{t}</li>
                        ))}
                      </ul>
                    </td>
                    <td className="small">
                      {s.evidence.map((e) => (
                        <Link key={e.label} to={e.to(r)} style={{ display: 'block' }}>
                          {e.label}
                        </Link>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </Reveal>

      <div className="grid grid--side">
        <Reveal>
          <Panel title="Which package to propose" flush>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Package</th>
                    <th>When</th>
                    <th>Show</th>
                    <th>Leaves behind</th>
                  </tr>
                </thead>
                <tbody>
                  {PACKAGES.map((p) => (
                    <tr key={p.name}>
                      <td>
                        <strong>{p.name}</strong>
                        <div className="xs muted">{p.dur}</div>
                      </td>
                      <td className="small">{p.when}</td>
                      <td className="small muted">{p.shows}</td>
                      <td className="small muted">{p.leaves}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </Reveal>
        <Reveal index={1}>
          <Panel title="Readout preparation" tight>
            <Stagger className="stack" style={{ gap: 4 }}>
              {READOUT_PREP.map((t, i) => (
                <button key={t} className="row small" style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', padding: '6px 0', color: 'inherit', alignItems: 'flex-start' }} onClick={() => setDone({ ...done, [i]: !done[i] })}>
                  {done[i] ? <CheckSquare style={{ width: 16, color: 'var(--n-ok)', flexShrink: 0 }} /> : <Square style={{ width: 16, color: 'var(--n-fg-subtle)', flexShrink: 0 }} />}
                  <span style={{ textDecoration: done[i] ? 'line-through' : undefined, color: done[i] ? 'var(--n-fg-muted)' : undefined }}>{t}</span>
                </button>
              ))}
            </Stagger>
            <span className="xs muted">Checklist state is local to this page.</span>
          </Panel>
        </Reveal>
      </div>
    </div>
  )
}
