// The practice's own tools that the hub opens instead of re-implementing them. A server is one
// app a colleague runs on this machine (with `npm run tools`); an experience is one page of it,
// shown in the hub in a frame or opened in its own tab. The server list is JSON so the
// `npm run tools` script and the local API read the same file.
//
// Every tool here writes into its own folder when used, so it never runs from `../demo tools/`
// (read-only, checked by scripts/check-sources.mjs): it runs from a clone in `sources/` or from a
// copy in `tool-copies/`.

import servers from './tool-servers.json'

export type ServerId = 'starter' | 'dsn' | 'studio' | 'prototyping'

export interface ToolServer {
  id: ServerId
  name: string
  /** The solution it belongs to (Tools page wording). */
  from: string
  owner: string
  /** Folder name, the same under `../demo tools/`, `sources/` and `tool-copies/`. */
  dir: string
  repo: string
  /** The version this catalog was checked against; the files are pinned by docs/sources.md5. */
  version: string
  port: number
  alsoPorts?: number[]
  /** A path that answers fast when the server is up (a HEAD request, no body). */
  probe: string
  start: string[]
  install: string[]
  needs: string[]
  /** What it writes into its own folder: why it runs from a copy. */
  writes: string[]
}

export type Journey = 'conversation' | 'project-new' | 'project-existing'

export interface Experience {
  id: string
  server: ServerId
  name: string
  journey: Journey
  /** Path on the server, query included. */
  path: string
  what: string
  get: string
  /** `frame`: shown inside the hub. `tab`: a full app that needs its own window. */
  mode: 'frame' | 'tab'
  /** Which token grammar its output uses, where it produces tokens. */
  grammar?: 'Starter Pack modes' | 'DSN tiers'
  note?: string
}

export const TOOL_SERVERS = servers as ToolServer[]

export const EXPERIENCES: Experience[] = [
  {
    id: 'starter-setup',
    server: 'starter',
    name: 'Set up a new design system',
    journey: 'project-new',
    path: '/',
    what: 'The Starter Pack’s own set-up: name, brands, product, light and dark, a starting look, then the look per brand and mode, the repository and the Figma file.',
    get: 'A configured system you preview on real components, ds.project.json in the copy, and a change file for the Figma plugin.',
    mode: 'frame',
    grammar: 'Starter Pack modes',
    note: 'Choose Edit system › Set up system if it opens on the docs.',
  },
  {
    id: 'starter-import',
    server: 'starter',
    name: 'Import the client’s Figma variables',
    journey: 'project-existing',
    path: '/',
    what: 'Read the variables the Starter Pack’s Figma plugin exported from the client’s file, and see them on the starter components.',
    get: 'The client’s real collections, modes and brands in the configurator, as the starting point for a comparison.',
    mode: 'frame',
    grammar: 'Starter Pack modes',
    note: 'Choose Import a file, then pick the .variables.json the plugin wrote.',
  },
  {
    id: 'dsn-brands',
    server: 'dsn',
    name: 'Build a brand theme',
    journey: 'project-new',
    path: '/brands',
    what: 'Pick a preset or a brand colour, then neutrals, type, shape and density, with a contrast check on every pair.',
    get: 'theme.css or a Figma tokens file, a share link, and a starter app with the theme applied.',
    mode: 'frame',
    grammar: 'DSN tiers',
  },
  {
    id: 'dsn-components',
    server: 'dsn',
    name: 'Browse the DSN components',
    journey: 'project-existing',
    path: '/components',
    what: 'Every DSN component with its props, spec and live preview in the active brand.',
    get: 'The reference for what already exists before anyone builds something new.',
    mode: 'frame',
    note: 'Previews need Storybook, which npm run tools starts with the site.',
  },
  {
    id: 'dsn-create',
    server: 'dsn',
    name: 'Draft a missing component with AI',
    journey: 'project-existing',
    path: '/components/new?source=demo',
    what: 'Paste the need; the AI checks whether DSN already covers it, otherwise drafts two or three options to compare in light and dark, desktop and mobile.',
    get: 'A reviewed option to add to a team kit, instead of a one-off component.',
    mode: 'frame',
    grammar: 'DSN tiers',
    note: 'Opens in demo mode, which needs no model key and scripts three example requests. A key in the page runs it for real.',
  },
  {
    id: 'dsn-prototype',
    server: 'dsn',
    name: 'Prototype with DSN',
    journey: 'conversation',
    path: '/prototype/playground',
    what: 'Paste or write JSX and see it rendered with the real components, checked against the rules. The chat and MCP routes are one click away.',
    get: 'A live prototype on the client’s system and a link to share it.',
    mode: 'frame',
    note: 'The chat needs a model key; its demo mode (?source=demo) does not.',
  },
  {
    id: 'assa-prototyping',
    server: 'prototyping',
    name: 'Prototype on a client’s design system',
    journey: 'project-existing',
    path: '/prototyping/library/index.html',
    what: 'The DS Prototyping Tooling built for ASSA ABLOY: the system’s components, colours and type from its Figma kit, a starting point from the Figma screens, and prototypes you build by describing them to Claude.',
    get: 'A clickable prototype on the client’s own components, in ASSA ABLOY or Yale, light or dark, desktop to mobile.',
    mode: 'frame',
    note: 'This is the reference build for one client. For another client, it is a new copy of it on that client’s tokens and components. To build a prototype by describing it, open the copy’s folder in Claude Code and type start.',
  },
  {
    id: 'studio',
    server: 'studio',
    name: 'Make an editable Nagarro deck',
    journey: 'conversation',
    path: '/',
    what: 'Describe the deck or import a .pptx; Studio drafts it on the Nagarro master slides, and you edit it on a real canvas.',
    get: 'An on-brand deck you export as editable .pptx or PDF.',
    mode: 'tab',
    note: 'Generating a deck takes a few minutes and uses your Claude CLI sign-in.',
  },
]

export const JOURNEY_LABEL: Record<Journey, string> = {
  conversation: 'Prepare a client conversation',
  'project-new': 'Start a project · new system',
  'project-existing': 'Start a project · existing system',
}

export function serverOf(e: Experience): ToolServer {
  return TOOL_SERVERS.find((s) => s.id === e.server)!
}

export function experience(id: string): Experience | undefined {
  return EXPERIENCES.find((e) => e.id === id)
}

export function defaultAddress(s: ToolServer): string {
  return `http://localhost:${s.port}`
}

/** The command a colleague runs to start a server, as printed on the page. */
export function startCommand(id: ServerId): string {
  return `npm run tools -- start ${id}`
}
