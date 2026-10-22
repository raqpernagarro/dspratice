import { Link, NavLink, useParams } from 'react-router'
import { PageHead } from '@/shell/PageHead'
import { useIsClient, usePaths } from '@/state/hooks'
import { practice, type RouteFamily } from '@/app/routes'
import { Reveal } from '@/motion'
import { Chip } from '@/shell/ui'

interface Chapter {
  slug: string
  title: string
  internal?: boolean
  body: (r: RouteFamily) => React.ReactNode
}

const CHAPTERS: Chapter[] = [
  {
    slug: 'why',
    title: 'Why AI-ready, not AI-generated',
    body: (r) => (
      <>
        <p className="lead">AI-generated means an AI produced the system’s artifacts. AI-ready means the system is structured so that AI-generated output stays on-system. Don’t conflate them when you talk about maturity.</p>
        <h2>The distinction</h2>
        <table>
          <thead>
            <tr>
              <th>AI-generated</th>
              <th>AI-ready</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>A model drafted components, tokens or docs.</td>
              <td>Tokens, metadata, constraints and documented anti-patterns exist so a model cannot go off-system.</td>
            </tr>
            <tr>
              <td>Quality depends on the prompt.</td>
              <td>Quality depends on the contract: closed vocabulary, absences, rules, evals.</td>
            </tr>
            <tr>
              <td>Nothing stops the next generation from drifting.</td>
              <td>Checks in CI and a release eval stop drift and invention before they merge.</td>
            </tr>
          </tbody>
        </table>
        <h2>What “readable by agents” means in practice</h2>
        <ul>
          <li>Every Figma value has a code name (codeSyntax). Agents never name things themselves.</li>
          <li>Every component says when to use it, when not to, and its anti-patterns, as data, not prose in a description box.</li>
          <li>A list of absences: names agents keep inventing that do not exist, published to every channel.</li>
          <li>A closed vocabulary: “pressed” is not a state, “active” is.</li>
        </ul>
        <p>
          In the panel: <Link to={r.guidance('button')}>Guidance and AI editor</Link> shows the JSON agents see; <Link to={r.prototype}>Prototype</Link> shows the refusal.
        </p>
      </>
    ),
  },
  {
    slug: 'contract',
    title: 'The system contract',
    body: (r) => (
      <>
        <p className="lead">One small file in the client’s repository describes any system: tokens in DTCG with a role map, component metadata, rules and absences, the Figma link, and which source leads for each layer. Every tool reads from it.</p>
        <h2>Sources of truth, per layer</h2>
        <p>Neither Figma nor code is universally authoritative. The contract declares it per layer, decided in the assessment readout:</p>
        <table>
          <thead>
            <tr>
              <th>Layer</th>
              <th>Usually leads</th>
              <th>Read through</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Primitive colours</td>
              <td>Figma variables</td>
              <td>Figma variables export</td>
            </tr>
            <tr>
              <td>Semantic tokens</td>
              <td>Figma variables</td>
              <td>Style Dictionary / DTCG JSON</td>
            </tr>
            <tr>
              <td>Component API</td>
              <td>Code</td>
              <td>React + Storybook manifest</td>
            </tr>
            <tr>
              <td>Usage guidance</td>
              <td>Contract</td>
              <td>MDX + guidance JSON</td>
            </tr>
          </tbody>
        </table>
        <h2>Three grammars, one set of roles</h2>
        <p>
          Different systems name tokens differently: <code>--color-background-accent-strong-default</code>, <code>color/background/interactive/primary/pressed</code>, <code>--ds-semantic-color-action-primary-hover</code>. The contract does not rename any of them. Adapters map each to a role; the mapping shows what maps, what needs a decision and what stays system-specific.
        </p>
        <p>
          In the panel: <Link to={r.contract}>Contract and sources of truth</Link>.
        </p>
      </>
    ),
  },
  {
    slug: 'governance',
    title: 'Token governance and agent trust',
    body: (r) => (
      <>
        <p className="lead">Token governance is ownership, versioning and a change-approval process for tokens, not the token values. Agent governance is the same question asked of agents: what may they do on their own?</p>
        <h2>Change control</h2>
        <ul>
          <li>Every change is a branch and a pull request with checks: parity, accessibility, grammar and collisions, on-system eval, index up to date.</li>
          <li>Approval is the existing review plus CODEOWNERS (as GitHub Primer does with changesets). No second approval system.</li>
          <li>Figma changes go through the plugin’s three-way review: Figma now, at last sync, the system. A version is saved first.</li>
        </ul>
        <h2>Trust levels for agents</h2>
        <p>Per action, not per agent: bind loose fills (auto-fix), write guidance (suggest), rename to contract roles (suggest), change token values (suggest), add or remove components (never). Mechanical fixes apply with undo; anything else waits for a person.</p>
        <p>
          In the panel: <Link to={r.trust}>Trust levels</Link>.
        </p>
      </>
    ),
  },
  {
    slug: 'channels',
    title: 'One source, every channel',
    body: (r) => (
      <>
        <p className="lead">Every AI tool wants the system in its own format. Keeping them in sync by hand is the failure mode. The contract generates each format; a merge marks them stale; the publisher regenerates them.</p>
        <table>
          <thead>
            <tr>
              <th>Channel</th>
              <th>Format</th>
              <th>Who reads it</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Figma Specs + Make guidelines</td>
              <td>Markdown rules</td>
              <td>Figma Make, Figma agent</td>
            </tr>
            <tr>
              <td>Storybook MCP</td>
              <td>Component manifest (React only today)</td>
              <td>Claude Code, Cursor</td>
            </tr>
            <tr>
              <td>Claude Design</td>
              <td>Repository import</td>
              <td>Claude Design</td>
            </tr>
            <tr>
              <td>v0 / shadcn registry</td>
              <td>registry.json</td>
              <td>v0, shadcn CLI</td>
            </tr>
            <tr>
              <td>DESIGN.md</td>
              <td>YAML + rationale</td>
              <td>Gemini, Stitch, any agent</td>
            </tr>
            <tr>
              <td>AGENTS.md + skills</td>
              <td>Markdown + JSON</td>
              <td>Claude Code, Codex, Cursor</td>
            </tr>
          </tbody>
        </table>
        <h2>Evals next to CI</h2>
        <p>Twenty prompts per tool, scored against tokens, components and rules, with a gate. Not a standard yet; the Spotify Encore team published the pattern. Scores in this demo are illustrative.</p>
        <p>
          In the panel: <Link to={r.channels}>AI channels</Link>.
        </p>
      </>
    ),
  },
  {
    slug: 'which-path',
    title: 'Which path fits a client',
    internal: true,
    body: (r) => (
      <>
        <p className="lead">Five situations, from the practice’s decision map. The next step is a package, not a tool.</p>
        <table>
          <thead>
            <tr>
              <th>Situation</th>
              <th>Offer</th>
              <th>Show</th>
              <th>Start from</th>
              <th>Watch out</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>“We have nothing” or a system too broken to build on</td>
              <td>DS Build</td>
              <td>Set-up wizard + Figma plugin</td>
              <td>Starter Pack template</td>
              <td>Name an owner before building</td>
            </tr>
            <tr>
              <td>“Our system is messy; AI output is generic”</td>
              <td>AI Audit → DS Accelerate</td>
              <td>Scan, a real component, an agent getting it right</td>
              <td>Assessment + DSN index, skills, Code Connect</td>
              <td>React first; no “any stack” promise</td>
            </tr>
            <tr>
              <td>“Many brands, many products”</td>
              <td>DS Scale</td>
              <td>Configurator, multi-brand</td>
              <td>Starter Pack brand collections</td>
              <td>Migration is the hidden cost; check the Figma plan’s mode limit</td>
            </tr>
            <tr>
              <td>“We have a system; keep it from drifting”</td>
              <td>Support</td>
              <td>Audits in CI, evals</td>
              <td>Handbook eval kit</td>
              <td>Sell governance, not the AI layer</td>
            </tr>
            <tr>
              <td>“Not convinced yet”</td>
              <td>Book the AI Audit; don’t scope yet</td>
              <td>Configurator with their colours</td>
              <td>The AI-readiness assessment</td>
              <td>Leave the handbook and the assessment link</td>
            </tr>
          </tbody>
        </table>
        <h2>What is standard, what stays client-specific</h2>
        <table>
          <thead>
            <tr>
              <th>Standard (product)</th>
              <th>Client-specific (service)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Contract schema, the panel, the React adapter, the Figma plugin, the CI check set, AI file templates, assessment checks, the demo brand</td>
              <td>Token grammar mapping, source-of-truth per layer, drift decisions, guidance content, brands, governance model, non-React stacks, migration of existing screens</td>
            </tr>
          </tbody>
        </table>
        <p>
          In the panel: <Link to={r.journeyNew()}>Choose how to start</Link>, <Link to={practice.clients}>Client systems</Link>, <Link to={r.meeting}>Presenter guide</Link>.
        </p>
      </>
    ),
  },
  {
    slug: 'sources',
    title: 'Where this comes from',
    internal: true,
    body: () => (
      <>
        <p className="lead">This application joins three practice projects into one experience. It copies patterns and data; it does not merge their code.</p>
        <table>
          <thead>
            <tr>
              <th>Project</th>
              <th>What it contributes here</th>
              <th>Verified in the code</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>DSN (Nagarro’s AI-first React library)</td>
              <td>Component index, absences, closed vocabulary, audit rules, customize → pull request, MCP and skills</td>
              <td>ds-index.json (104 components, 46 absences), vocabulary.json (18 banned words), 7 audit scripts, 22 MCP tools, 8 skills, pull-request.ts (gh CLI, local dev only)</td>
            </tr>
            <tr>
              <td>DS Starter Pack (Base UI template)</td>
              <td>Set-up wizard, presets, theme intents, component specs, Figma plugin with 3-way review, parity and contrast checks</td>
              <td>SetupSystem.tsx (10 steps), presets.ts (5), figmaSync.ts (figma / both / new / different), 56 specs, 44 Code Connect, contrast report 1,488 / 8 fail</td>
            </tr>
            <tr>
              <td>Prototyping kit (client work, de-branded)</td>
              <td>Figma-first source order, binding-parity gate, meta.json per component, propose → confirm → apply, checks in hooks after every edit</td>
              <td>binding-parity.mjs (42 components), lint.mjs, check.mjs, fidelity.js ±1px, 414 variables with code syntax. Client names, keys, fonts and colours are not used.</td>
            </tr>
          </tbody>
        </table>
        <h2>What is simulated here</h2>
        <ul>
          <li>GitHub: pull requests, checks and merges happen in local state. Nothing is pushed.</li>
          <li>Figma: reading a file, the plugin’s review and applying changes are reproduced from the plugin’s behaviour. No file is touched.</li>
          <li>Scans: the assessment reads fixtures that describe a fictional messy system, not your repository.</li>
          <li>Agents: the styling agent, prototype agent and patrol agent are rule-based. No model is called.</li>
          <li>Evals: scores derive from the current state so they move believably; they are not measurements.</li>
        </ul>
        <p>
          External references: <a href="https://ds-handbook.vercel.app" target="_blank" rel="noreferrer">the AI-ready DS handbook</a> · <a href="https://www.nagarro.com/en/services/design-studio/ai-ready-design-systems" target="_blank" rel="noreferrer">the capability page</a>.
        </p>
      </>
    ),
  },
  {
    slug: 'working-together',
    title: 'How we work together',
    body: (r) => (
      <>
        <p className="lead">What happens in an engagement, what we need from your team, and what you keep at the end.</p>
        <h2>What happens</h2>
        <ol>
          <li>Connect read-only and run the assessment scan.</li>
          <li>Readout: agree what leads for tokens and components, name an owner, choose the first changes.</li>
          <li>Adapt the system to the shared contract. Your names stay; adapters map them.</li>
          <li>First changes as pull requests, reviewed in Figma and code, with checks.</li>
          <li>Publish the AI channels; run the release eval.</li>
          <li>Handover: repository, Figma library, the panel, checks, AI channels, a named owner, a baseline.</li>
        </ol>
        <h2>What we need from your team</h2>
        <ul>
          <li>Read access to the repository and the Figma file.</li>
          <li>A design-system owner who approves merges and sets agent trust levels.</li>
          <li>Decisions in the readout; about sixty minutes.</li>
        </ul>
        <h2>What you keep</h2>
        <p>Everything lives in your repository and your Figma file. The panel ships inside the repository as a dev dependency. You can run it without us.</p>
        <p>
          In the panel: <Link to={r.handover}>Handover</Link>, <Link to={r.report}>Findings and report</Link>.
        </p>
      </>
    ),
  },
]

export function HandbookPage() {
  const { slug } = useParams()
  const client = useIsClient()
  const r = usePaths()
  const chapters = CHAPTERS.filter((c) => !client || !c.internal)
  const chapter = chapters.find((c) => c.slug === slug) ?? chapters[0]
  return (
    <div className="page">
      <PageHead title="Handbook" lead={client ? 'How the system, Figma, code and AI stay connected, and how we work together.' : 'The approach, the contract, governance, channels, which path fits a client, and where the tool comes from.'} noTabs />
      <nav className="area-tabs" aria-label="Chapters">
        {chapters.map((c) => (
          <NavLink key={c.slug} to={r.guide(c.slug)} className={({ isActive }) => `area-tabs__tab ${isActive || (!slug && c.slug === chapters[0].slug) ? 'is-active' : ''}`}>
            {c.title}
            {c.internal && !client && <Chip tone="ink" className="xs" title="Nagarro workspace only">internal</Chip>}
          </NavLink>
        ))}
      </nav>
      <Reveal key={chapter.slug}>
        <article className="panel prose" style={{ padding: 'var(--n-space-8)', maxWidth: 880 }}>
          <h1>{chapter.title}</h1>
          {chapter.body(r)}
        </article>
      </Reveal>
    </div>
  )
}
