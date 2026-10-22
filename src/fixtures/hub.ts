// The Tools and Demos catalogues. Per the 20 Oct decision there are three solutions (DSN, DS
// Starter Pack, Prototyping Tool); everything else is a part of one of them or a practice tool.

export type ToolStatus = 'works' | 'partly' | 'internal-only' | 'proposed'

export interface ToolEntry {
  id: string
  name: string
  owner: string
  what: string
  status: ToolStatus
  parts: { name: string; how?: string; link?: string }[]
  get: string
  access: string
  inHub?: { label: string; to: 'library' | 'presentations' | 'knowledge' | 'opportunities' | 'demos' | 'integrations' }
}

export const SOLUTIONS: ToolEntry[] = [
  {
    id: 'dsn',
    name: 'DSN (ds-ngr)',
    owner: 'Rui Dias',
    what: 'An AI-first React component library: components, DTCG tokens with a closed vocabulary, and the MCP tools and skills that let agents build with the real components.',
    status: 'works',
    parts: [
      { name: 'Component library and tokens', how: 'npm package ds-ngr' },
      { name: 'Storybook', link: 'https://nagarro-dv.github.io/DSN/' },
      { name: 'Site MCP and agent skills', how: 'AGENTS.md, llms.txt, skills/' },
      { name: 'DS Handbook', link: 'https://ds-handbook.vercel.app' },
      { name: 'DS Audit Intake', how: 'in progress' },
    ],
    get: 'Private repository nagarro-dv/DSN',
    access: 'Ask Rui Dias for repository access',
    inHub: { label: 'See it in a project', to: 'library' },
  },
  {
    id: 'starter',
    name: 'DS Starter Pack',
    owner: 'Nuno Almeida',
    what: 'The design system you start client projects from: every Base UI component in React and Figma, one semantic token system, a configurator and a Figma plugin that keep both sides in sync.',
    status: 'works',
    parts: [
      { name: 'Template repository', how: 'Use this template on GitHub' },
      { name: 'DS Configurator', how: 'npm run dev in semantic-editor (port 4185)' },
      { name: 'Storybook with an a11y gate', how: 'npm run storybook (port 6006)' },
      { name: 'Figma variables plugin', how: 'figma-plugin/ in the repository' },
    ],
    get: 'Private repository nagarro-dv/ds-starter-pack',
    access: 'Ask Nuno Almeida for repository access',
    inHub: { label: 'See it in a project', to: 'library' },
  },
  {
    id: 'prototyping',
    name: 'Prototyping Tool',
    owner: 'Raquel Pereira',
    what: 'The prototyping-kit workflow: screens prototyped against a client design system repo in Figma. The pattern is shown on the fictional Demo Brand; the original client work stays internal.',
    status: 'internal-only',
    parts: [{ name: 'Kit pattern on Demo Brand', how: 'Client demo › AI on the system' }, { name: 'Before and after', how: 'internal only, never shown externally without written clearance' }],
    get: 'Local kit (not distributed)',
    access: 'Internal only',
    inHub: { label: 'See the client demo', to: 'demos' },
  },
]

export const PRACTICE_TOOLS: ToolEntry[] = [
  {
    id: 'slides',
    name: 'Nagarro presentation system',
    owner: 'Carolina Baptista',
    what: 'One slide engine with 508 Nagarro master templates, used by the Master Slides design system, the nagarro-slides plugin for Claude Slides and the Presentation Studio (editable .pptx and PDF).',
    status: 'works',
    parts: [
      { name: 'DS Nagarro Master Slides', link: 'https://claude.ai/artifact/FTePiAfzdDWtb71Bogjpn2' },
      { name: 'nagarro-slides plugin', how: 'In Claude: /nagarro-slides:start' },
      { name: 'Presentation Studio', how: 'Presentation_v1 repository, npm start' },
      { name: 'Engine in this hub', how: 'Presentations (vendored, pinned)' },
    ],
    get: 'Ask Carolina Baptista for access to the design system artifact',
    access: 'Nagarro colleagues',
    inHub: { label: 'Prepare a presentation', to: 'presentations' },
  },
  {
    id: 'hub',
    name: 'This hub',
    owner: 'Raquel Pereira',
    what: 'The knowledge library, responses to client requests, presentations, the client demo and design-system projects, in one internal tool. It can also build a client-safe copy of the demo.',
    status: 'works',
    parts: [{ name: 'Run locally', how: 'npm run setup, then npm run dev' }, { name: 'Client demo build', how: 'npm run build:demo' }],
    get: 'GitHub repository (Nagarro organisation)',
    access: 'Nagarro colleagues',
    inHub: { label: 'Respond to a client request', to: 'opportunities' },
  },
  {
    id: 'knowledge-plugin',
    name: 'Nagarro knowledge export (Figma plugin)',
    owner: 'DS Practice',
    what: 'Reads the text of a Figma page or selected frames into a JSON file for the knowledge library. Zero tokens, any Figma plan, no AI permissions needed, nothing is changed.',
    status: 'works',
    parts: [{ name: 'Import', how: 'Figma › Plugins › Development › Import plugin from manifest › figma-plugin/manifest.json' }],
    get: 'figma-plugin/ in this repository',
    access: 'Anyone with Figma desktop',
    inHub: { label: 'Add a source', to: 'knowledge' },
  },
  {
    id: 'figma-cli',
    name: 'figma-cli adapter',
    owner: 'silships (MIT), adapter by DS Practice',
    what: 'Reads Figma Desktop through a local debugging bridge with the same extractor: no token, no MCP, no model tokens. Unofficial; use its Safe or Browser mode only.',
    status: 'partly',
    parts: [{ name: 'Adapter', how: 'node scripts/figma-cli-extract.mjs <figma-cli> --file-key <key>' }],
    get: 'github.com/silships/figma-cli',
    access: 'Anyone with Figma desktop; never the default Yolo mode on managed machines',
    inHub: { label: 'Figma reading routes', to: 'integrations' },
  },
  {
    id: 'ds-ai-check',
    name: 'ds-ai-check skill',
    owner: 'To confirm',
    what: 'A deterministic AI-readiness audit of a Figma design system, run from Claude Code.',
    status: 'partly',
    parts: [{ name: 'Run', how: 'In Claude Code: /ai-ready-ds:ds-ai-check with a Figma file link' }],
    get: 'ai-ready-ds plugin',
    access: 'Claude Code with the plugin installed',
  },
]

export interface DemoEntry {
  id: string
  title: string
  audience: 'client-safe' | 'internal'
  minutes: string
  proves: string
  open: 'guide' | 'client-home' | 'prototype' | 'scorecard' | 'opportunity' | 'components'
  notes: string[]
}

export const DEMOS: DemoEntry[] = [
  { id: 'guided', title: 'The guided story', audience: 'client-safe', minutes: '12 or 25', proves: 'One inconsistency in a fictional company’s system, what it affects, the fix reviewed in code and Figma, and AI that stays on the system. Ends on what an engagement could leave behind.', open: 'guide', notes: ['Best for a first meeting with a design or product lead.', 'Open your notes window first, then share only the demo tab.', 'Close on the next conversation, usually the 2-week AI audit.'] },
  { id: 'panel', title: 'Explore the example system', audience: 'client-safe', minutes: '10', proves: 'Components, tokens, findings and changes, for people who want to look around themselves.', open: 'client-home', notes: ['Ask which page they would open first.', 'Show a finding becoming a pull request and the matching Figma change.'] },
  { id: 'prototype', title: 'AI builds a screen', audience: 'client-safe', minutes: '5', proves: 'A prompt becomes a screen made of the system’s own components; a made-up token is refused.', open: 'prototype', notes: ['Say clearly that a rule-based planner stands in for the AI model here.', 'Compare with the same prompt in any public AI tool.'] },
  { id: 'scorecard', title: 'AI-readiness scorecard', audience: 'client-safe', minutes: '5', proves: 'Ten questions answered together, and the first step that fits.', open: 'scorecard', notes: ['Fill it in together, live; do not send it as a form.', 'Marketing tracks the official assessment on nagarro.com; point to it at the end.'] },
  { id: 'rfp', title: 'How we answer a client request', audience: 'internal', minutes: '10', proves: 'For colleagues: the knowledge library and the response steps on the Northwind sample, from the RFP to a checked draft and a deck.', open: 'opportunity', notes: ['Show an open question (pricing) and why the draft never invents an answer.', 'Show a matching passage and how you check that it really answers the question.'] },
]
