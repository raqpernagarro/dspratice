import type {
  AgentProposal,
  Channel,
  Contract,
  EvalRun,
  Person,
  ScanStage,
  ThemeConfig,
  TrustAction,
  TrustLevel,
} from '@/state/types'

const DAY = 24 * 60 * 60 * 1000
export const NOW = () => Date.now()

export const CHANNELS = (now: number): Channel[] => [
  {
    id: 'figma-specs',
    name: 'Figma Specs + Make',
    format: 'Markdown guidelines',
    consumer: 'Figma Make, Figma agent',
    status: 'fresh',
    lastPublished: now - 2 * 60 * 1000,
    sample: '# Button\n\nUse for the main action on a page or dialog. One primary button per view.\n\nDo not place two primary buttons side by side.\nTokens: color/background/interactive/primary/*',
  },
  {
    id: 'storybook-mcp',
    name: 'Storybook MCP',
    format: 'Component manifest',
    consumer: 'Claude Code, Cursor',
    status: 'fresh',
    lastPublished: now - 2 * 60 * 1000,
    sample: '{ "component": "Button", "props": { "variant": ["primary","secondary","ghost","destructive"], "size": ["sm","md","lg"] }, "stories": 6 }',
  },
  {
    id: 'claude-design',
    name: 'Claude Design',
    format: 'Repo import',
    consumer: 'Claude Design',
    status: 'fresh',
    lastPublished: now - 2 * 60 * 1000,
    sample: 'design-system/\n  tokens.json (DTCG)\n  components/*.spec.md\n  DESIGN.md',
  },
  {
    id: 'v0-registry',
    name: 'v0 / shadcn registry',
    format: 'registry.json',
    consumer: 'v0, shadcn CLI',
    status: 'stale',
    lastPublished: now - 3 * DAY,
    staleReason: '2 merges since the last publish',
    sample: '{ "name": "demo-brand", "items": [{ "name": "button", "type": "registry:ui", "files": ["button.tsx"], "cssVars": { "light": {…}, "dark": {…} } }] }',
  },
  {
    id: 'design-md',
    name: 'DESIGN.md',
    format: 'YAML + rationale',
    consumer: 'Gemini, Stitch, any agent',
    status: 'fresh',
    lastPublished: now - 2 * 60 * 1000,
    sample: 'colors:\n  interactive.primary: "#1F7A6B" # the only brand green; never invent a lighter one\nradius:\n  control: 8px',
  },
  {
    id: 'agents-md',
    name: 'AGENTS.md + skills',
    format: 'Markdown + JSON',
    consumer: 'Claude Code, Codex, Cursor',
    status: 'fresh',
    lastPublished: now - 2 * 60 * 1000,
    sample: '## Rules\n- Use only tokens listed in ds-index.json. Unknown names are refused.\n- "pressed" is not a state. Use "active".\n\n## Skills\n- ds-patrol · ds-token-sync · ds-a11y-audit',
  },
]

export const EVALS = (now: number): EvalRun[] => [
  {
    id: 'eval-1-8-0',
    version: 'v1.8.0',
    onSystem: 94,
    gate: 90,
    prompts: 20,
    date: now - 2 * DAY,
    perTool: [
      { tool: 'Claude Code + Storybook MCP', model: 'Claude Sonnet 5.5', score: 98 },
      { tool: 'Claude Design', model: 'Claude Opus 5.5', score: 97 },
      { tool: 'Figma Make', model: 'Figma agent', score: 91 },
      { tool: 'v0 with the registry', model: 'v0', score: 86 },
    ],
    failures: [
      { prompt: 'A pricing table with a highlighted plan', tool: 'v0', reason: 'Invented --color-brand-pop for the highlighted column', rule: 'absence' },
      { prompt: 'Settings page with a danger zone', tool: 'Figma Make', reason: 'Used 18px spacing between rows (off scale)', rule: 'space-scale' },
    ],
  },
  { id: 'eval-1-7-0', version: 'v1.7.0', onSystem: 91, gate: 90, prompts: 20, date: now - 16 * DAY, perTool: [], failures: [] },
  { id: 'eval-1-6-0', version: 'v1.6.0', onSystem: 88, gate: 90, prompts: 20, date: now - 30 * DAY, perTool: [], failures: [] },
  { id: 'eval-1-5-0', version: 'v1.5.0', onSystem: 85, gate: 85, prompts: 20, date: now - 44 * DAY, perTool: [], failures: [] },
  { id: 'eval-1-4-0', version: 'v1.4.0', onSystem: 81, gate: 85, prompts: 20, date: now - 58 * DAY, perTool: [], failures: [] },
]

export const AGENT_PROPOSALS = (now: number): AgentProposal[] => [
  {
    id: 'ap-card-guidance',
    agent: 'patrol',
    title: 'Add "when not to use" to Card',
    description: 'Writes guidance. Drafted from the Card spec and 14 Figma frames where Card is used instead of Table.',
    kind: 'needs_review',
    trustAction: 'writeGuidance',
    status: 'pending',
    guidanceChanges: [
      {
        componentId: 'card',
        field: 'whenNotToUse',
        from: '',
        to: 'When content needs comparing in columns, use Table. When it is one item with one action, use a List row.',
      },
    ],
    createdAt: now - 3 * 60 * 60 * 1000,
  },
  {
    id: 'ap-btn-hover-rename',
    agent: 'patrol',
    title: 'Map btn-hover to its contract role',
    description: 'Changes a name. The hand-written Style Dictionary name "btn-hover" becomes color.background.interactive.primary.hover.',
    kind: 'needs_review',
    trustAction: 'renameToContractRoles',
    status: 'pending',
    createdAt: now - 5 * 60 * 60 * 1000,
  },
  {
    id: 'ap-loose-fills',
    agent: 'patrol',
    title: 'Bind 3 loose fills in Figma',
    description: 'Mechanical fix. Three raw hex fills in Chip and Badge are bound to their nearest semantic variable. Nothing changes visually.',
    kind: 'mechanical',
    trustAction: 'bindLooseFills',
    status: 'auto_applied',
    figmaRebinds: 3,
    createdAt: now - 20 * 60 * 1000,
    decidedAt: now - 19 * 60 * 1000,
  },
]

export const PEOPLE: Person[] = [
  { id: 'p-owner', name: 'Lena Hartmann', role: 'owner', can: 'Approve merges, set trust levels, change the contract' },
  { id: 'p-contributors', name: '6 designers and devs', role: 'contributor', count: 6, can: 'Propose changes as pull requests and Figma change sets' },
  { id: 'p-viewers', name: '24 product people', role: 'viewer', count: 24, can: 'Read, prototype, share links' },
  { id: 'p-patrol', name: 'Patrol agent', role: 'agent', isAgent: true, can: 'Suggest; mechanical fixes only' },
  { id: 'p-publisher', name: 'Publisher agent', role: 'agent', isAgent: true, can: 'Regenerate channels after a merge' },
]

export const TRUST_DEFAULTS: Record<TrustAction, TrustLevel> = {
  bindLooseFills: 'autofix',
  writeGuidance: 'suggest',
  renameToContractRoles: 'suggest',
  changeTokenValues: 'suggest',
  addRemoveComponents: 'never',
}

export const TRUST_ACTION_LABELS: Record<TrustAction, string> = {
  bindLooseFills: 'Bind loose fills to tokens',
  writeGuidance: 'Write guidance text',
  renameToContractRoles: 'Rename to contract roles',
  changeTokenValues: 'Change token values',
  addRemoveComponents: 'Add or remove components',
}

export const CONTRACT: Contract = {
  version: 3,
  name: 'Demo Brand design system',
  repo: 'github.com/demo-brand/design-system',
  figmaFile: 'Figma · Demo Brand UI Kit',
  ci: 'GitHub Actions, 5 checks',
  supportedProfile: 'React + JSON tokens + Figma variables',
  layers: [
    { layer: 'primitives', label: 'Primitive colours', leads: 'Figma variables export', readThrough: 'Figma variables export', options: ['Figma variables export', 'DTCG JSON in the repo'] },
    { layer: 'semantic', label: 'Semantic tokens', leads: 'Figma variables export', readThrough: 'Style Dictionary JSON', options: ['Figma variables export', 'Style Dictionary JSON'] },
    { layer: 'componentApi', label: 'Component API', leads: 'Code (React + Storybook manifest)', readThrough: 'React + Storybook manifest', options: ['Code (React + Storybook manifest)', 'Figma component sets', 'Spec files (one spec per component)'] },
    { layer: 'guidance', label: 'Usage guidance', leads: 'Contract (MDX + guidance JSON)', readThrough: 'MDX + guidance JSON', options: ['Contract (MDX + guidance JSON)', 'Figma descriptions', 'Docs site'] },
  ],
  rulesEnabled: {},
}

export const SCAN_STAGES: ScanStage[] = [
  { id: 'repo', label: 'Read the repository', detail: 'React 18 components in src/components · Storybook 8 · Style Dictionary JSON, 212 values', ms: 1100 },
  { id: 'figma', label: 'Read the Figma file', detail: '3 variable collections · 41 component sets · 2 modes', ms: 1200 },
  { id: 'map', label: 'Map tokens to contract roles', detail: '174 of 212 mapped by name · 38 without a code name', ms: 1000 },
  { id: 'compare', label: 'Compare Figma and code', detail: '12 of 40 components differ · 62% in sync', ms: 1000 },
  { id: 'contrast', label: 'Check contrast and states', detail: '8 contrast fails · 3 hover collisions', ms: 900 },
  { id: 'report', label: 'Write the assessment report', detail: 'AI readiness 2 / 5 · baseline captured', ms: 700 },
]

export const DEFAULT_THEME: ThemeConfig = {
  name: 'Demo Brand',
  tagline: 'For product teams shipping B2B software.',
  appearance: 'both',
  designedFirst: 'light',
  secondMode: 'follows',
  productType: 'dashboard',
  brands: [
    { id: 'demo', name: 'Demo Brand', main: '#1f7a6b', accent: '#1f6feb', isDefault: true },
    { id: 'gold', name: 'Gold', main: '#c3921a', accent: '#1f6feb' },
    { id: 'violet', name: 'Violet', main: '#6b4ff5', accent: '#ff3e9d' },
  ],
  activeBrand: 'demo',
  color: { main: '#1f7a6b', accent: '#1f6feb', neutralTint: 0.04 },
  type: { heading: 'Outfit', body: 'Figtree', baseSize: 15, headingWeight: 600 },
  radius: 8,
  density: 1,
  depth: 0.3,
  buttonShape: 'default',
  startingPoint: 'defaults',
  repoUrl: 'github.com/demo-brand/design-system',
  figmaUrl: 'figma.com/design/… · Demo Brand UI Kit',
}

export const PRODUCT_TYPES = [
  { id: 'dashboard', label: 'Dashboard', blurb: 'Data-heavy, many tables and charts.' },
  { id: 'admin', label: 'Admin tool', blurb: 'Forms, lists and permissions.' },
  { id: 'marketing', label: 'Marketing site', blurb: 'Large type, imagery, few controls.' },
  { id: 'ecommerce', label: 'E-commerce', blurb: 'Product grids, carts, checkout.' },
  { id: 'internal-tool', label: 'Internal tool', blurb: 'Dense, keyboard-first.' },
  { id: 'content', label: 'Content product', blurb: 'Reading-first, long pages.' },
  { id: 'mobile', label: 'Mobile app', blurb: 'Touch targets, bottom navigation.' },
]

export const HANDOVER_ITEMS = [
  { id: 'repo', label: 'Repository with the design system, the panel and CI checks', detail: 'github.com/demo-brand/design-system · 5 checks on every pull request' },
  { id: 'figma', label: 'Figma library with variables bound and code names on every value', detail: '212 / 212 values named · DS Configurator sync plugin installed' },
  { id: 'contract', label: 'ds.contract.json with sources of truth per layer', detail: 'Version 3 · changed only through pull requests' },
  { id: 'channels', label: 'AI channels published from the contract', detail: 'Figma Specs + Make · Storybook MCP · Claude Design · v0 registry · DESIGN.md · AGENTS.md + skills' },
  { id: 'evals', label: 'Release eval with a gate', detail: '20 prompts per tool · gate 90% · runs on every release' },
  { id: 'owner', label: 'A named design system owner and trust levels for agents', detail: 'Lena Hartmann · agents suggest; mechanical fixes only' },
  { id: 'baseline', label: 'Assessment baseline and read-only share link', detail: 'Before/after numbers for the steering group' },
  { id: 'training', label: 'A training session on the panel', detail: '90 minutes, recorded · the handbook for everything else' },
]

export const READOUT_DECISIONS = [
  {
    id: 'lead-tokens',
    question: 'Which side leads for tokens?',
    why: 'Today Figma has 212 values and code has 212 hand-named ones. One of them has to win.',
    options: [
      { id: 'figma', label: 'Figma leads', hint: 'Code names are written into Figma; Style Dictionary reads the export.' },
      { id: 'code', label: 'Code leads', hint: 'Figma is rebound to the code names via the plugin.' },
    ],
    recommended: 'figma',
  },
  {
    id: 'lead-components',
    question: 'Which side leads for the component API?',
    why: '12 of 40 components differ. The Storybook manifest is the cheapest source of truth to keep.',
    options: [
      { id: 'code', label: 'Code leads', hint: 'Figma variants follow the React props; parity check blocks the reverse.' },
      { id: 'figma', label: 'Figma leads', hint: 'React props are generated from Figma component sets.' },
    ],
    recommended: 'code',
  },
  {
    id: 'grammar',
    question: 'Which token grammar does the contract use?',
    why: 'Your Style Dictionary names and Figma names disagree in 38 places.',
    options: [
      { id: 'contract', label: 'Adopt the contract grammar', hint: '<tier>-<aspect>-<role>-<prominence>-<state>; the adapter maps your names.' },
      { id: 'keep', label: 'Keep your grammar, map it', hint: 'Your names stay; the adapter translates both ways. More adapter work.' },
    ],
    recommended: 'contract',
  },
  {
    id: 'owner',
    question: 'Who owns the system after handover?',
    why: 'A named owner is the strongest predictor that the system survives.',
    options: [
      { id: 'named', label: 'Name an owner now', hint: 'Lena Hartmann (design) with an engineering deputy.' },
      { id: 'later', label: 'Decide during the engagement', hint: 'Risky: nobody approves merges until then.' },
    ],
    recommended: 'named',
  },
]
