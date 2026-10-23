// One practice tool, opened from the hub. When its server answers, a `frame` experience shows
// inside the page and a `tab` experience gets a button to its own window. When it does not, the
// card says exactly what to run, and checks again on its own every few seconds.

import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Copy, ExternalLink, RefreshCw } from 'lucide-react'
import { practice } from '@/app/routes'
import { serverOf, startCommand, type Experience, type ToolServer } from '@/fixtures/experiences'
import { useAddress, useTools, type RunState, type ToolFiles } from '@/integrations/tools'
import { Btn, Chip, Panel } from '@/shell/ui'

export const RECHECK_MS = 4000

const STATE: Record<RunState, { label: string; tone: 'ok' | 'warn' | 'outline' }> = {
  unknown: { label: 'Not checked', tone: 'outline' },
  checking: { label: 'Checking…', tone: 'outline' },
  up: { label: 'Running', tone: 'ok' },
  down: { label: 'Not running', tone: 'warn' },
}

export function RunChip({ state }: { state: RunState }) {
  return <Chip tone={STATE[state].tone}>{STATE[state].label}</Chip>
}

export function CommandLine({ cmd }: { cmd: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <span className="cmdline">
      <code>{cmd}</code>
      <button
        type="button"
        className="btn btn--ghost btn--sm"
        onClick={() => {
          navigator.clipboard?.writeText(cmd).then(() => setCopied(true), () => setCopied(false))
        }}
        aria-label={`Copy ${cmd}`}
      >
        <Copy /> {copied ? 'Copied' : 'Copy'}
      </button>
    </span>
  )
}

/** What to do when the server does not answer, from what the local server knows about the files. */
function StartIt({ server, files, address }: { server: ToolServer; files: ToolFiles | undefined; address: string }) {
  const custom = address !== `http://localhost:${server.port}`
  return (
    <Panel title={`${server.name} is not running`} className="xframe__start">
      {files?.runFrom === 'missing' ? (
        <p className="small">
          {server.from} is not on this machine. Ask {server.owner} for access to {server.repo}, then clone it into <code>sources/{server.dir}</code> in the hub folder.
        </p>
      ) : (
        <ol className="xframe__steps small">
          {(!files || files.runFrom === 'original') && (
            <li>
              <span>
                Make your own copy, once. It writes {server.writes.join(' and ')}, so it never runs from the read-only original in <code>demo tools</code>.
              </span>
              <CommandLine cmd={`npm run tools -- copy ${server.id}`} />
            </li>
          )}
          <li>
            <span>Start it from the hub folder and leave the terminal open. The first start can take a minute{files && !files.installed ? ', because it installs its dependencies' : ''}.</span>
            <CommandLine cmd={startCommand(server.id)} />
          </li>
          <li>
            <span>This page opens it as soon as it answers at {address}.</span>
          </li>
        </ol>
      )}
      <p className="xs muted">
        Needs: {server.needs.join(' · ')}.{custom ? ' ' : ''}
        {custom && (
          <>
            You changed its address in <Link to={practice.integrations}>Settings › Integrations</Link>.
          </>
        )}
      </p>
    </Panel>
  )
}

export function ExperienceFrame({ e }: { e: Experience }) {
  const server = serverOf(e)
  const address = useAddress(server.id)
  const run = useTools((s) => s.run[server.id])
  const files = useTools((s) => s.files?.[server.id])
  const check = useTools((s) => s.check)
  const loadFiles = useTools((s) => s.loadFiles)
  const url = new URL(e.path, address).toString()

  useEffect(() => {
    void check(server.id)
    void loadFiles()
  }, [server.id, address, check, loadFiles])

  // Keep looking while it is down, so starting it in the terminal is enough.
  useEffect(() => {
    if (run.state !== 'down') return
    const t = window.setInterval(() => void check(server.id), RECHECK_MS)
    return () => window.clearInterval(t)
  }, [run.state, server.id, check])

  return (
    <section className="xframe" data-testid={`xframe-${e.id}`} data-state={run.state}>
      <header className="xframe__bar">
        <div className="xframe__id">
          <strong>{e.name}</strong>
          <span className="xs muted">
            {server.from} · {server.owner} · {server.version}
          </span>
        </div>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <RunChip state={run.state} />
          <Btn variant="ghost" size="sm" onClick={() => void check(server.id)} disabled={run.state === 'checking'}>
            <RefreshCw /> Check again
          </Btn>
          {run.state === 'up' && (
            <a className="btn btn--secondary btn--sm" href={url} target="_blank" rel="noreferrer">
              <ExternalLink /> Open in its own tab
            </a>
          )}
        </div>
      </header>
      {run.state === 'up' && e.mode === 'frame' && <iframe className="xframe__frame" src={url} title={e.name} data-testid="xframe-iframe" />}
      {run.state === 'up' && e.mode === 'tab' && (
        <Panel title="It opens in its own window">
          <p className="small">{server.name} is a full app with its own editor, so it works best in a tab of its own. Come back here when you are done.</p>
          <a className="btn btn--primary" href={url} target="_blank" rel="noreferrer" data-testid="xframe-open">
            <ExternalLink /> Open {server.name}
          </a>
        </Panel>
      )}
      {run.state === 'down' && <StartIt server={server} files={files} address={address} />}
      {(run.state === 'unknown' || run.state === 'checking') && <p className="small muted">Checking whether {server.name} is running at {address}…</p>}
    </section>
  )
}
