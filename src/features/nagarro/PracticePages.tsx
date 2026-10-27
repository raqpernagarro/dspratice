// Practice-wide settings pages: what the tool can and cannot do on this machine, and the sample data.

import { useState } from 'react'
import { Link } from 'react-router'
import { PageHead } from '@/shell/PageHead'
import { Chip, Panel, Segmented, Sheet } from '@/shell/ui'
import { FontStatus } from '@/shell/FontStatus'
import { act } from '@/state/hooks'
import { useStore } from '@/state/store'
import { useIntegrations } from '@/integrations/status'
import { practice, nagarro } from '@/app/routes'
import { SCHEMA_VERSION } from '@/state/store'
import { ENGINE } from '@/deck/catalog'

function Group({ title, tone, items }: { title: string; tone: 'ok' | 'info' | 'ai' | 'warn' | 'outline'; items: [string, string][] }) {
  return (
    <Panel title={<span className="row" style={{ gap: 8 }}><Chip tone={tone}>{title}</Chip></span>}>
      <ul className="about-list">
        {items.map(([what, detail]) => (
          <li key={what}>
            <strong>{what}</strong>
            <span>{detail}</span>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

/** One honest place for capability and build details, so task pages do not need to repeat them. */
export function AboutPage() {
  const status = useIntegrations()
  const projects = useStore((s) => s.projects)
  const demo = projects['demo-brand']
  return (
    <div className="page">
      <PageHead
        title="About this tool"
        lead="Nagarro Design Workspace is where Nagarro sellers and designers start any design-systems job: respond to a client, present or demo, start, improve or prototype on a system, and share the work. Home asks what you need to do and takes you to the journey. This page lists what works on this machine, what needs a key or a running tool, and what the client demo only simulates."
      />
      <div className="grid grid--2">
        <Group
          title="Works on this machine, no AI needed"
          tone="ok"
          items={[
            ['Home and its journeys', 'Fourteen journeys described once as data (src/fixtures/journeys.ts). The prompt matches what you type to them by keywords, with no model call; guides without a tool of their own say so.'],
            ['Projects', 'My work (what you left unfinished, the projects you are on) and the team board: status, kind of work, people, links. Shared through src/fixtures/team-board.json; tasks stay in Jira.'],
            ['Demos', 'Ready-made demos, a playlist built for one meeting from a sentence, saved per project, and social cuts: captioned 4:5 clips of the demos, filmed as video with npm run clips.'],
            ['Engagement', 'Nuno Almeida’s Starter Pack posts (a FigJam snapshot), drafts made from social cuts, and the commands that hand a post to Hugo França’s Marketing Studio.'],
            ['Sources (Settings)', 'Search, read, approve and add sources: Figma text exports, Markdown, Word, PDF with text, links.'],
            ['Responses to client requests', 'Requirements, matching passages from approved sources, a first draft, checks against invented figures and other clients’ names, downloads.'],
            ['Presentations', 'Decks built in one click from a reviewed response or a project’s data, on Carolina Baptista’s Nagarro Master Slides: checked slides, an editable outline, present mode, and HTML, notes, brief and deck.json downloads.'],
            ['Set-up journeys', 'Start a new design system in the DS Starter Pack’s own wizard and record it in the project, or improve an existing one, with progress you can resume.'],
            ['The practice’s tools', 'The DS Configurator, the DSN site, Presentation Studio and the ASSA ABLOY DS Prototyping Tooling open from their journeys once you start them with npm run tools. They run from copies, never from the originals. Marketing Studio runs on its own (Docker) and is linked from Engagement.'],
            ['Client demo', 'The guided story, the explorable example system, reset and return to preparation.'],
          ]}
        />
        <Group
          title="Needs a key on this machine"
          tone="info"
          items={[
            ['Ask AI on Home', status.offline ? 'Unknown: the local server is not running.' : status.model.configured ? `On (${status.model.model}). A small call that only sees the journey list, with its size shown first.` : 'Off without ANTHROPIC_API_KEY. The keyword router works without it.'],
            ['AI drafting', status.offline ? 'Unknown: the local server is not running.' : status.model.configured ? `On (${status.model.model}). Each AI action shows its estimated cost first.` : 'Off. Add ANTHROPIC_API_KEY to .env.local. Without it, drafts come from templates and you can download a packet for any Claude or ChatGPT chat.'],
            ['Figma refresh and folder listing', status.offline ? 'Unknown: the local server is not running.' : status.figma.configured ? 'On (FIGMA_TOKEN).' : 'Off. Add FIGMA_TOKEN to .env.local. The knowledge export plugin works without it.'],
          ]}
        />
        <Group
          title="Built by rules, not by a model"
          tone="ai"
          items={[
            ['First drafts of responses', 'Assembled from the request and the sources’ own text. A person checks every answer before it is shared.'],
            ['Decks', 'Mapped onto registered Master Slides templates from the response or the project. No images are invented.'],
            ['“Describe the look”, the screen builder and search answers', 'Rule-based stand-ins for the AI agents in the source projects.'],
          ]}
        />
        <Group
          title="Simulated in the client demo"
          tone="warn"
          items={[
            ['Scans of a client’s repository and Figma file', 'Read a fictional sample system. No URL is requested.'],
            ['Pull requests, checks and merges', 'Run in the browser on timers. Nothing reaches GitHub.'],
            ['Figma review and apply', 'The plugin’s review is reproduced. No Figma file is opened or changed.'],
            ['Publishing to AI tools, release checks, agent suggestions', 'Generated from sample data. Nothing is uploaded and no model runs.'],
          ]}
        />
      </div>
      <Group
        title="Not available here"
        tone="outline"
        items={[
          ['Editable PowerPoint or PDF', 'Presentation Studio exports both. A deck’s Share tab copies its brief for Studio to rebuild it; opening the workspace’s deck.json there is not confirmed yet.'],
          ['Sharing between colleagues', 'Everything you add stays in this browser. The team board shares what is in src/fixtures/team-board.json through the repository; there is no hosted, multi-user version yet.'],
          ['Posting', 'Nothing posts from the workspace or from Marketing Studio. A person posts by hand.'],
          ['Measured client results', 'Health, readiness and accessibility figures in the samples are illustrative, not measurements.'],
        ]}
      />
      <Panel title="Build details">
        <ul className="about-list">
          <li>
            <strong>Slide engine</strong>
            <span>
              {ENGINE.name} {ENGINE.artifactVersion} · {ENGINE.templates} master templates · owner {ENGINE.owner} · synced {ENGINE.syncedAt.slice(0, 10)}
            </span>
          </li>
          <li>
            <strong>Fonts</strong>
            <span>
              <FontStatus />
            </span>
          </li>
          <li>
            <strong>Storage</strong>
            <span>This browser only (schema v{SCHEMA_VERSION}). Document bodies in IndexedDB.</span>
          </li>
          {demo && (
            <li>
              <strong>Demo Brand</strong>
              <span>
                System contract v{demo.draft.contract.version} · adapter {demo.engagement.adapterVersion} · <Link to={nagarro(demo.slug).home}>open the project</Link>
              </span>
            </li>
          )}
          <li>
            <strong>Integrations</strong>
            <span>
              <Link to={practice.integrations}>Keys, Figma reading routes and AI usage</Link>
            </span>
          </li>
        </ul>
      </Panel>
    </div>
  )
}

export function PracticeSettings() {
  const projects = useStore((s) => s.projects)
  const speed = useStore((s) => s.ui.simSpeed)
  const setSpeed = useStore((s) => s.setSimSpeed)
  const [confirm, setConfirm] = useState(false)
  return (
    <div className="page">
      <PageHead title="Sample data" lead="The workspace ships with fictional sample projects so you can try every workflow. Reset one project, or everything, when you want a clean start." />
      <Panel title="Projects">
        <ul className="list">
          {Object.values(projects).map((p) => (
            <li key={p.id} className="row" style={{ justifyContent: 'space-between', gap: 12 }}>
              <span>
                <strong>{p.client.name}</strong>
                {p.client.fictional ? ' (sample)' : ''} · {p.engagement.package} · {p.published ? `client demo v${p.published.version}` : 'no client demo version'}
              </span>
              <button className="btn btn--secondary btn--sm" onClick={() => act().resetProject(p.id)} disabled={!p.client.fictional} title={p.client.fictional ? 'Puts this project back to its shipped sample' : 'Only sample projects can be reset'}>
                Reset this project
              </button>
            </li>
          ))}
        </ul>
        <div className="row" style={{ justifyContent: 'flex-end', marginTop: 12 }}>
          <button className="btn btn--danger btn--sm" onClick={() => setConfirm(true)} data-testid="reset-all">
            Reset all sample data…
          </button>
        </div>
      </Panel>
      <Panel title="Simulation speed">
        <p className="small muted">Simulated checks and scans in the client demo run faster at 3×.</p>
        <Segmented ariaLabel="Simulation speed" value={String(speed) as '1' | '3'} onChange={(v) => setSpeed(Number(v) as 1 | 3)} options={[{ id: '1', label: '1×' }, { id: '3', label: '3×' }]} />
      </Panel>
      {confirm && (
        <Sheet
          title="Reset the sample data?"
          onClose={() => setConfirm(false)}
          actions={
            <>
              <button className="btn btn--secondary" onClick={() => setConfirm(false)}>
                Keep going
              </button>
              <button
                className="btn btn--danger"
                onClick={() => {
                  act().resetAll()
                  setConfirm(false)
                }}
              >
                Reset sample data
              </button>
            </>
          }
        >
          <p className="muted small">Every project goes back to the shipped samples: drafts, client demo versions, demos in progress and journeys. Projects, requests and sources you added are removed. Nothing outside this browser is affected.</p>
        </Sheet>
      )}
    </div>
  )
}
