import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ArrowRight, Github, Figma, Lock, AlertTriangle } from 'lucide-react'
import { useStore } from '@/state/store'
import { usePaths, useSys } from '@/state/hooks'
import { PageHead } from '@/shell/PageHead'
import { Btn, Callout, Chip, Field, Panel, SimBadge } from '@/shell/ui'
import { BEFORE_STATE } from '@/fixtures/demo-brand/tokens'

export function Connect() {
  const navigate = useNavigate()
  const r = usePaths()
  const journey = useSys((s) => s.journey)
  const connect = useStore((s) => s.connectSystem)
  const choose = useStore((s) => s.chooseEntryPath)
  const [repo, setRepo] = useState(journey.connect.repoUrl)
  const [figma, setFigma] = useState(journey.connect.figmaUrl)
  const status = journey.connect.status

  return (
    <div className="page">
      <PageHead screen="connect" title="Connect your system" lead="Read-only. We write nothing until you approve a pull request. The scan reads your repository, your tokens and your Figma file, and tells you what it can and cannot read." />

      <div className="grid grid--side">
        <Panel>
          <Field label="Repository" id="c-repo" hint="GitHub, GitLab or a local path. Try a URL containing “flutter” to see the unsupported-stack state.">
            <div className="row">
              <Github style={{ width: 18, color: 'var(--n-fg-muted)' }} />
              <input id="c-repo" className="input" value={repo} onChange={(e) => setRepo(e.target.value)} style={{ flex: 1 }} />
            </div>
          </Field>
          <Field label="Figma file" id="c-figma" hint="View access is enough. Try a URL containing “private” to see the access-denied state.">
            <div className="row">
              <Figma style={{ width: 18, color: 'var(--n-fg-muted)' }} />
              <input id="c-figma" className="input" value={figma} onChange={(e) => setFigma(e.target.value)} style={{ flex: 1 }} />
            </div>
          </Field>
          <div className="row">
            <Btn
              onClick={() => {
                choose('bring')
                connect(repo, figma)
              }}
            >
              Connect read-only <Lock />
            </Btn>
            <SimBadge detail="Detection reads fixtures that describe a fictional messy system. Your URLs are stored locally and never requested." />
          </div>

          {status === 'unsupported' && (
            <Callout tone="warn">
              <strong>Unsupported stack.</strong> {journey.connect.message} You can still scan tokens and rules, and the readout plans the component work as a service.
            </Callout>
          )}
          {status === 'denied' && (
            <Callout tone="err">
              <strong>Figma access denied.</strong> {journey.connect.message}
            </Callout>
          )}

          {(status === 'detected' || status === 'unsupported' || status === 'denied') && (
            <div className="stack">
              <div className="panel__title">What we found</div>
              <table className="table">
                <tbody>
                  <tr>
                    <td>Components</td>
                    <td>{status === 'unsupported' ? 'Not readable (non-React stack)' : `${BEFORE_STATE.react} components in src/components`}</td>
                    <td className="num">{status === 'unsupported' ? <Chip tone="warn">service</Chip> : <Chip tone="ok">readable</Chip>}</td>
                  </tr>
                  <tr>
                    <td>Storybook</td>
                    <td>{BEFORE_STATE.storybook}: upgrade to 10 to read its component manifest</td>
                    <td className="num">
                      <Chip tone="warn">partial</Chip>
                    </td>
                  </tr>
                  <tr>
                    <td>Tokens</td>
                    <td>
                      {BEFORE_STATE.tokenSource}, {BEFORE_STATE.totalValues} values
                    </td>
                    <td className="num">
                      <Chip tone="ok">readable</Chip>
                    </td>
                  </tr>
                  <tr>
                    <td>Figma</td>
                    <td>{status === 'denied' ? 'No access' : `${BEFORE_STATE.figmaCollections} variable collections, ${BEFORE_STATE.figmaComponentSets} component sets`}</td>
                    <td className="num">{status === 'denied' ? <Chip tone="err">denied</Chip> : <Chip tone="ok">readable</Chip>}</td>
                  </tr>
                </tbody>
              </table>
              <div className="row row--between">
                <span className="small muted">
                  Supported profile: <strong>React + JSON tokens + Figma variables</strong>
                </span>
                <Btn onClick={() => navigate(r.assessment)} disabled={status === 'denied'}>
                  Run the scan <ArrowRight />
                </Btn>
              </div>
              {status === 'denied' && (
                <span className="small muted row">
                  <AlertTriangle style={{ width: 14 }} /> Fix Figma access first, or scan the repository only (tokens and rules).
                  <Btn variant="ghost" size="sm" onClick={() => navigate(r.assessment)}>
                    Scan the repository only
                  </Btn>
                </span>
              )}
            </div>
          )}
        </Panel>

        <div className="stack">
          <Panel tight title="What the scan reads">
            <ul className="small muted" style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li>Token files (DTCG, Style Dictionary, CSS variables)</li>
              <li>React components and their props; Storybook 10 manifest when present</li>
              <li>Figma variables, collections, modes and component sets</li>
              <li>Docs and guidance (MDX, Markdown, Figma descriptions)</li>
              <li>Existing AI files (llms.txt, AGENTS.md, DESIGN.md)</li>
            </ul>
          </Panel>
          <Panel tight title="What it cannot do yet">
            <ul className="small muted" style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li>Read Flutter, Angular, Vue, SwiftUI or .NET components</li>
              <li>Import Tokens Studio or zeroheight directly</li>
              <li>Resolve drift on its own: people decide per item in the readout</li>
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  )
}
