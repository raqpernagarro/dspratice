// Practice-wide settings pages: what the tool can and cannot do on this machine, and the sample data.

import { Link } from 'react-router'
import { PageHead } from '@/shell/PageHead'
import { Chip, Panel } from '@/shell/ui'
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
        lead="The design systems hub helps Nagarro colleagues answer client requests, start or improve design systems, and prepare presentations and demos with what the practice already knows. This page lists what works on this machine, what needs a key, and what the client demo only simulates."
      />
      <div className="grid grid--2">
        <Group
          title="Works on this machine, no AI needed"
          tone="ok"
          items={[
            ['Knowledge library', 'Search, read, approve and add sources: Figma text exports, Markdown, Word, PDF with text, links.'],
            ['Responses to client requests', 'Requirements, matching passages from approved sources, a first draft, checks against invented figures and other clients’ names, downloads.'],
            ['Presentations', 'A slide plan on Carolina Baptista’s Nagarro Master Slides, rendered slides, checks, present mode, and HTML, deck.json, brief and notes downloads.'],
            ['Setup journeys', 'Start a new design system or improve an existing one, with progress you can resume.'],
            ['Client demo', 'The guided story, the explorable example system, reset and return to preparation.'],
          ]}
        />
        <Group
          title="Needs a key on this machine"
          tone="info"
          items={[
            ['AI drafting', status.offline ? 'Unknown: the local server is not running.' : status.model.configured ? `On (${status.model.model}). Each AI action shows its estimated cost first.` : 'Off. Add ANTHROPIC_API_KEY to .env.local. Without it, drafts come from templates and you can download a packet for any Claude or ChatGPT chat.'],
            ['Figma refresh and folder listing', status.offline ? 'Unknown: the local server is not running.' : status.figma.configured ? 'On (FIGMA_TOKEN).' : 'Off. Add FIGMA_TOKEN to .env.local. The knowledge export plugin works without it.'],
          ]}
        />
        <Group
          title="Built by rules, not by a model"
          tone="ai"
          items={[
            ['First drafts of responses', 'Assembled from the request and the sources’ own text. A person checks every answer before it is shared.'],
            ['Deck plans', 'Mapped onto registered Master Slides templates. No images are invented.'],
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
          ['Editable PowerPoint', 'Use Carolina’s Presentation Studio (it exports .pptx and PDF). Importing this hub’s deck.json there is not confirmed yet; until then, rebuild from brief.md with the nagarro-slides plugin in Claude Slides.'],
          ['Sharing between colleagues', 'Everything you add stays in this browser. There is no hosted, multi-user version.'],
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
  return (
    <div className="page">
      <PageHead title="Sample data" lead="The hub ships with fictional sample projects so you can try every workflow. Reset one project, or everything, when you want a clean start." />
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
      </Panel>
    </div>
  )
}
