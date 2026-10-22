import type { ScreenStatus } from '@/state/types'

// The 24 wireframes from the FigJam site map, their board status, and what the app simulates on each.
export interface ScreenMeta {
  n: number
  title: string
  area: 'Home' | 'Start' | 'System' | 'Changes' | 'AI' | 'Govern' | 'Share + Nagarro' | 'Win work' | 'Practice'
  status: ScreenStatus
  simulated?: string
  source?: string
}

export const SCREENS: Record<string, ScreenMeta> = {
  home: { n: 4, title: 'Home dashboard', area: 'Home', status: 'proposed', simulated: 'Counts derive from local state', source: 'Board: new' },
  search: { n: 24, title: '⌘K search', area: 'Home', status: 'partly', simulated: 'Answers are rule-based, not a model', source: 'DSN docs site search; Starter Pack Ask panel' },
  choose: { n: 1, title: 'Choose how to start', area: 'Start', status: 'proposed' },
  wizard: { n: 2, title: 'Set-up wizard', area: 'Start', status: 'works', simulated: '"Describe the look" uses a local stylist, not Claude', source: 'Starter Pack semantic-editor/SetupSystem.tsx (10 steps)' },
  connect: { n: 3, title: 'Connect your system', area: 'Start', status: 'proposed', simulated: 'Detection reads fixtures, not your repo', source: 'Board: Path B' },
  components: { n: 5, title: 'Components index', area: 'System', status: 'partly', source: 'DSN /components; Starter Pack docs site' },
  component: { n: 6, title: 'Component page', area: 'System', status: 'partly', source: 'DSN component pages; Starter Pack SpecDocs' },
  tokens: { n: 7, title: 'Tokens explorer', area: 'System', status: 'partly', source: 'DSN /foundations/tokens; Starter Pack Variables table' },
  guidance: { n: 8, title: 'Guidance & AI editor', area: 'System', status: 'partly', simulated: 'Save creates a local pull request', source: 'DSN spec editor + AI-rules editor; kit meta.json' },
  finding: { n: 9, title: 'Suggestion with its rule', area: 'Changes', status: 'partly', source: 'DSN audit-token-collisions.mjs (rule exists; in-panel suggestion is new)' },
  impact: { n: 10, title: 'Impact before merging', area: 'Changes', status: 'partly', source: 'Starter Pack "Applies to N bindings"; docs/Figma impact is new' },
  pr: { n: 11, title: 'Pull request + checks', area: 'Changes', status: 'partly', simulated: 'No GitHub call; checks run on timers', source: 'DSN customize → gh pr create (local dev only)' },
  figmaReview: { n: 12, title: 'Figma 3-way review', area: 'Changes', status: 'works', simulated: 'The plugin UI is reproduced; no Figma file is touched', source: 'Starter Pack figmaSync.ts + FigmaReview.tsx' },
  channels: { n: 13, title: 'Agent channels', area: 'AI', status: 'proposed', simulated: 'Files are generated in memory, never uploaded', source: 'Board: channel publisher (new)' },
  evals: { n: 14, title: 'Release eval', area: 'AI', status: 'proposed', simulated: 'Scores derive from state, not model runs', source: 'Board: evals next to CI (Spotify Encore pattern)' },
  inbox: { n: 15, title: 'Agent proposals inbox', area: 'AI', status: 'proposed', simulated: 'Proposals are fixtures from a "patrol agent"', source: 'DSN ds-patrol skill (runs in a terminal today)' },
  prototype: { n: 16, title: 'Prototype with the system', area: 'AI', status: 'partly', simulated: 'A rule-based planner picks components; no model call', source: 'DSN prototype canvas + MCP; Starter Pack prototype agent; kit' },
  contract: { n: 17, title: 'Contract and sources of truth', area: 'Govern', status: 'proposed', source: 'Board: ds.contract.json v0' },
  people: { n: 18, title: 'People and roles', area: 'Govern', status: 'proposed', source: 'Board; CODEOWNERS practice (Primer)' },
  brands: { n: 19, title: 'Brands and modes', area: 'Govern', status: 'partly', source: 'Starter Pack configurator + DSN /brands, merged into one' },
  trust: { n: 20, title: 'Trust levels', area: 'Govern', status: 'proposed', source: 'Board: agent governance' },
  report: { n: 21, title: 'Assessment report', area: 'Share + Nagarro', status: 'partly', source: 'DSN audits + Starter Pack parity/contrast, joined' },
  share: { n: 22, title: 'Read-only share link', area: 'Share + Nagarro', status: 'partly', simulated: 'The link opens locally; nothing is hosted', source: 'Starter Pack docs:build with VITE_DS_READONLY' },
  nagarro: { n: 23, title: 'Nagarro workspace', area: 'Share + Nagarro', status: 'proposed', simulated: 'Clients are fictional', source: 'Board: practice view' },
  knowledge: { n: 25, title: 'Knowledge library', area: 'Practice', status: 'works', source: 'Real reads: Figma (MCP snapshot, REST when a token is set, plugin, figma-cli), local files, uploads' },
  opportunity: { n: 26, title: 'Opportunity response', area: 'Win work', status: 'works', source: 'Rules-based extraction, retrieval and drafting (zero tokens); model drafting when a key is configured' },
  decks: { n: 27, title: 'Presentations', area: 'Win work', status: 'works', source: "Carolina Baptista's Nagarro Master Slides engine (vendored, pinned)" },
  tools: { n: 28, title: 'Tools', area: 'Practice', status: 'works', source: 'The three solutions and the practice tools' },
  demos: { n: 29, title: 'Demos', area: 'Win work', status: 'works', source: 'Client demos, presenter notes, the client-safe demo build' },
  scorecard: { n: 30, title: 'AI-readiness scorecard', area: 'Win work', status: 'partly', simulated: 'A self-assessment for conversation; nothing you answer is sent anywhere.', source: 'Practice discovery questions' },
  proposalSummary: { n: 31, title: 'Proposal summary (client)', area: 'Share + Nagarro', status: 'works', source: 'Published outputs only' },
}
