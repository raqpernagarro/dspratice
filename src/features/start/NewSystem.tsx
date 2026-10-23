// "Start a new design system" in a project: the DS Starter Pack's own set-up wizard, opened in the
// page, then "Record it in the project", which reads the ds.project.json it saved and keeps what
// the hub can hold. Without the Starter Pack on this machine, the basics are recorded by hand
// (Wizard, /journey/new/1). The other ways to start (DSN) are listed, not recorded.

import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, FileUp, FolderOpen } from 'lucide-react'
import { practice } from '@/app/routes'
import { experience, TOOL_SERVERS } from '@/fixtures/experiences'
import { ExperienceFrame } from '@/features/tools'
import { CommandLine } from '@/features/tools/ExperienceFrame'
import { readStarterProject, IntegrationError } from '@/integrations/api'
import { useTools } from '@/integrations/tools'
import { fromStarterProject, type StarterImport } from '@/library/theme/fromStarterProject'
import { PageHead } from '@/shell/PageHead'
import { Btn, Callout, Chip, Kv, Panel } from '@/shell/ui'
import { act, usePaths, useProject, useSystem } from '@/state/hooks'
import { relTime } from '@/state/selectors'

const STARTER = TOOL_SERVERS.find((s) => s.id === 'starter')!

interface Recorded { from: string; at: number; version: string; kept: string[]; notKept: string[] }

function RecordPanel({ client }: { client: string }) {
  const sys = useSystem()
  const r = usePaths()
  const recorded = sys.journey.new.data.recorded as Recorded | undefined
  const [state, setState] = useState<{ kind: 'idle' } | { kind: 'reading' } | { kind: 'error'; message: string } | { kind: 'preview'; imp: StarterImport; from: string }>({ kind: 'idle' })
  const fileRef = useRef<HTMLInputElement>(null)

  const preview = (text: string, from: string) => {
    try {
      setState({ kind: 'preview', imp: fromStarterProject(text, sys.theme), from })
    } catch (e) {
      setState({ kind: 'error', message: e instanceof Error ? e.message : String(e) })
    }
  }
  const readSaved = async () => {
    setState({ kind: 'reading' })
    try {
      const res = await readStarterProject()
      preview(res.text, res.path)
    } catch (e) {
      const offline = e instanceof IntegrationError && e.code === 'offline'
      setState({ kind: 'error', message: offline ? 'The hub’s local server is not running, so it cannot read the copy. Choose the project file instead.' : e instanceof Error ? e.message : String(e) })
    }
  }
  const choose = async (f: File | undefined) => {
    if (fileRef.current) fileRef.current.value = ''
    if (f) preview(await f.text(), f.name)
  }

  return (
    <Panel title={`Record it in ${client}`} actions={recorded ? <Chip tone="ok">Recorded {relTime(recorded.at)}</Chip> : undefined}>
      <p className="small">
        When you finish <strong>Set up system</strong>, the Starter Pack saves <code>ds.project.json</code> in its copy. Read it here and the project shows the system: its name, brands, modes and main choices. Nothing is sent anywhere.
      </p>
      {recorded && state.kind === 'idle' && (
        <p className="small muted">
          Recorded from <code>{recorded.from}</code>, Starter Pack version {recorded.version}. <Link to={r.home}>Back to the overview</Link>
        </p>
      )}
      {state.kind !== 'preview' && (
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <Btn onClick={() => void readSaved()} loading={state.kind === 'reading'} data-testid="read-starter-project">
            <FolderOpen /> {recorded ? 'Read it again' : 'Read the saved set-up'}
          </Btn>
          <Btn variant="secondary" onClick={() => fileRef.current?.click()}>
            <FileUp /> Choose a project file
          </Btn>
          <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={(e) => void choose(e.target.files?.[0])} data-testid="starter-project-file" />
        </div>
      )}
      {state.kind === 'error' && <Callout tone="warn">{state.message}</Callout>}
      {state.kind === 'preview' && (
        <div className="stack" data-testid="starter-preview">
          <Kv
            rows={[
              ['System', state.imp.patch.name],
              ['Brands', <span key="b" className="row" style={{ gap: 12, flexWrap: 'wrap' }}>{state.imp.patch.brands.map((b) => <span key={b.id} className="row" style={{ gap: 6 }}><span className="swatch" style={{ background: b.main }} />{b.name}</span>)}</span>],
              ['From', <code key="f">{state.from}</code>],
            ]}
          />
          <div className="grid grid--2">
            <div>
              <h4 style={{ margin: '0 0 6px' }}>The hub keeps</h4>
              <ul className="small" style={{ margin: 0, paddingLeft: '1.2em' }}>{state.imp.kept.map((k) => <li key={k}>{k}</li>)}</ul>
            </div>
            <div>
              <h4 style={{ margin: '0 0 6px' }}>Stays in the Starter Pack</h4>
              <ul className="small muted" style={{ margin: 0, paddingLeft: '1.2em' }}>{state.imp.notKept.map((k) => <li key={k}>{k}</li>)}</ul>
            </div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <Btn
              onClick={() => {
                act().recordStarterProject(state.imp, state.from)
                setState({ kind: 'idle' })
              }}
              data-testid="record-starter-project"
            >
              {recorded ? 'Replace the recorded set-up' : `Record it in ${client}`} <ArrowRight />
            </Btn>
            <Btn variant="ghost" onClick={() => setState({ kind: 'idle' })}>
              Cancel
            </Btn>
          </div>
        </div>
      )}
    </Panel>
  )
}

function OtherWays() {
  const r = usePaths()
  return (
    <details className="panel other-ways" data-testid="other-ways">
      <summary>
        <strong>Other ways to start</strong> <span className="small muted">· not recorded in the project yet</span>
      </summary>
      <ul className="other-ways__list">
        <li>
          <strong>Build a brand theme in DSN</strong>
          <span className="small muted">Brand-first, with a contrast check on every pair, a share link and a starter app. Its tokens use DSN’s names (tiers), not the Starter Pack’s (modes), so pick one system per client.</span>
          <Link className="btn btn--secondary btn--sm" to={practice.tool('dsn-brands')}>
            Open DSN Brands <ArrowRight />
          </Link>
        </li>
        <li>
          <strong>Start an app with DSN’s command line</strong>
          <span className="small muted">A React app with DSN installed, plus AGENTS.md and CLAUDE.md for AI coding tools. The Brands page’s “Copy CLI command” adds your theme. Needs the DSN site running.</span>
          <CommandLine cmd="npx http://localhost:3100/cli/ds-ngr-cli.tgz create my-app" />
        </li>
        <li>
          <strong>Record the basics by hand</strong>
          <span className="small muted">Name, brands, product and modes only, when you cannot run the Starter Pack. The look, the repository and Figma wait until you can.</span>
          <Link className="btn btn--ghost btn--sm" to={r.journeyNew(1)} data-testid="basics-by-hand">
            Record the basics <ArrowRight />
          </Link>
        </li>
      </ul>
    </details>
  )
}

function MissingStarter() {
  const r = usePaths()
  return (
    <Panel title="The DS Starter Pack is not on this machine" className="xframe__start">
      <p className="small">The set-up happens in the Starter Pack’s own wizard, which needs the private repository.</p>
      <Kv rows={[['Ask', `${STARTER.owner}, for access to ${STARTER.repo}`], ['Then', <CommandLine key="c" cmd="npm run setup -- --clone-sources" />]]} />
      <p className="small">Until then, record the basics by hand: name, brands, product and modes.</p>
      <Link className="btn btn--primary btn--sm" to={r.journeyNew(1)} data-testid="basics-by-hand">
        Record the basics <ArrowRight />
      </Link>
    </Panel>
  )
}

export function NewSystem() {
  const project = useProject()
  const files = useTools((s) => s.files)
  const loadFiles = useTools((s) => s.loadFiles)
  useEffect(() => {
    void loadFiles()
  }, [loadFiles])
  // Opening the page only marks the journey as started; nothing is ticked until it is recorded.
  useEffect(() => {
    act().chooseEntryPath('new')
    act().setJourneyProgress('new', { currentStep: 1 })
  }, [])
  const missing = files?.starter?.runFrom === 'missing'

  return (
    <div className="page page--tool">
      <PageHead noTabs title="Start a new design system" lead={`Set it up in the DS Starter Pack’s own wizard, then record it here so ${project.client.name} shows the system. You need the client’s brand colour, the kind of product and, later, the repository and Figma file links.`} />
      {missing ? (
        <MissingStarter />
      ) : (
        <>
          <section className="stack" aria-labelledby="setup-title">
            <h2 id="setup-title" className="section-title">
              1 · Set it up in the Starter Pack
            </h2>
            <p className="small muted" style={{ margin: 0 }}>
              Choose <strong>Set up system</strong> in it. You get a configured system on real components, <code>ds.project.json</code> in the copy, and a change file for the Figma plugin.
            </p>
            <ExperienceFrame e={experience('starter-setup')!} />
          </section>
          <section className="stack" aria-labelledby="record-title">
            <h2 id="record-title" className="section-title">
              2 · Record it in the project
            </h2>
            <RecordPanel client={project.client.name} />
          </section>
        </>
      )}
      <OtherWays />
    </div>
  )
}
