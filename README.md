# Nagarro Design Workspace (`unified-ds-tool`)

An internal tool for the Nagarro design systems practice: one place where sellers, managers and designers start any design-systems job, in the Nagarro Design look (dark, Equip type, the brand's glass 3D). The sidebar has five places:

- **Home** asks "What do you need to do?". Type the job, or pick one of fourteen journeys in two groups: *Client conversations* (respond to an RFP, build a presentation, prepare a demo, check AI readiness, turn an idea into a deck, follow up, shape the offer) and *Project work* (start or improve a design system, prototype on a client's system, start a product design workflow, make a system AI-ready, connect Figma and code, share an update). The prompt matches words to journeys with no model call; *Ask AI* is an explicit, metered extra. Journeys without a tool of their own are honest set-up guides.
- **Projects**: *My work*, one page: what you left unfinished, then every project with a live preview of its own system. Inside a project: Overview (the system at a glance, then what to do next, including the AI agents' suggestions), Design system, Changes, Report, Settings. Projects stay in each person's browser (NDA).
- **Demos**: *Prepare a client meeting* (a presentation, a demo, your notes and the follow-up, made one by one) and ready-made demos to present now.
- **Engagement**: a TryPost-like **calendar** of what is planned and published, by whom, drawn from Marketing Studio's post files (`MARKETING_STUDIO_FOLDERS`); Nuno Almeida's Starter Pack posts; social cuts (captioned 4:5 clips of the demos); and the hand-off to Hugo França's Marketing Studio. TryPost itself is shown when it runs on :8000.
- **Settings**: sources (what responses and the AI may quote), people, integrations and this tool's limits.

The practice's own tools (the DS Configurator, the DSN site, Presentation Studio, the ASSA ABLOY DS Prototyping Tooling) open from their journeys once you start them with `npm run tools`.

It is for Nagarro designers, consultants, delivery leads and sellers. `/` opens Home.

**The client demo is a guided showcase we present in meetings, not a client portal.** It tells one story on a fictional company's design system: the challenge, an example system, one inconsistency, why it matters, the proposed fix, the review in code and Figma, AI using the system, and what an engagement could leave behind. Presenter notes open in a separate window; the shared tab never shows them. See [docs/client-demo.md](docs/client-demo.md).

A separate **client-safe demo build** packages the client demo on the fictional Demo Brand, the scorecard and a landing page, with nothing internal in it. It is not deployed.

Working name until decision D7 (12 Nov). Everything runs on your machine. Sample clients and their figures are fictional; projects you create are real and stay in your browser.

## Get started in three commands

```bash
npm run setup
npm run dev
open http://localhost:4300
```

`npm run setup` checks Node 20+, installs dependencies and creates `.env.local` from the example. It also reports which optional parts are present. Optional parts:

| Part | Without it | To add it |
|---|---|---|
| `ANTHROPIC_API_KEY` in `.env.local` | Drafts come from the template composer, labelled "Template draft (no model)". The generation packet still lets you use any Claude or ChatGPT chat | Add the key. Only the local dev server reads it |
| `FIGMA_TOKEN` in `.env.local` | Figma sources refresh through the knowledge plugin or figma-cli instead | A personal access token with `file_content:read` and `projects:read` |
| DSN and DS Starter Pack sources (`../demo tools/*` or `./sources/*`) | System previews of their real components show "Library source not installed"; everything else works | `npm run setup -- --clone-sources` (needs access to the private repos) |

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | The workspace on <http://localhost:4300>, with the local API (model, Figma REST, practice files) |
| `npm run build` | Typecheck and production build into `dist/` |
| `npm run build:demo` | The client-safe demo into `dist-demo/`, then a leak check that fails on internal names and markers |
| `npm run preview` / `npm run preview:demo` | Serve `dist/` on 4301 or `dist-demo/` on 4302 (the local API also works in preview) |
| `npm test` | Vitest: 23 files, 197 tests |
| `npm run e2e` | Playwright in Microsoft Edge (`channel: 'msedge'`): 10 specs, 13 tests (one opens every journey). Run `npm run build:demo` first |
| `npm run clips -- <cut\|all>` | Film a social cut in Edge as a 1080 × 1350 video in `media/clips/` (git-ignored). Needs `npx playwright install ffmpeg` once and the dev server running (`BASE_URL` to pick another) |
| `npm run handbook:md` | Write the handbook as Markdown for AI tools (`src/knowledge/handbook.md`) |
| `npm run typecheck` | TypeScript only (core app when the library sources are absent) |
| `npm run knowledge:local [-- --check]` | Re-read the practice files into the bundled knowledge snapshot, or check it is current |
| `npm run knowledge:figma -- <capture.json> --source <id>` | Turn a Figma text capture (plugin, figma-cli or MCP) into a knowledge document |
| `npm run slides:sync -- <folder> --version <id>` | Update the vendored Nagarro Master Slides engine from a downloaded copy |
| `npm run tokens:sync` | Regenerate `src/styles/brand-tokens.css` from the engine's `tokens.json` |
| `npm run tools` | Where each practice tool runs from and whether it is running (see *Practice tools* below) |
| `npm run tools -- copy <tool\|all>` | Copy a tool out of `../demo tools` into `tool-copies/`, once (an APFS clone on a Mac: about 40s for all three) |
| `npm run tools -- start <tool…\|all>` | Start tools from your clone or copy; Ctrl+C stops them |

## Practice tools

The workspace opens the practice's own tools instead of copying them: journeys link to them, and each one opens at `/nagarro/tools/<id>`, inside the page (DS Configurator, DSN site, DS Prototyping Tooling) or in its own tab (Presentation Studio). The list is `src/fixtures/experiences.ts`; the servers are `src/fixtures/tool-servers.json`, read by the hub, the local API (`GET /api/tools`) and `scripts/tools.mjs`.

| Tool | Owner | Default address | Writes into its own folder |
|---|---|---|---|
| `starter` · DS Configurator | Nuno Almeida | <http://localhost:4175> | `ds.project.json` |
| `dsn` · DSN site and Storybook | Rui Dias | <http://localhost:3100> and 6006 | `ds-index.json`, `site/.data` |
| `studio` · Presentation Studio | Carolina Baptista | <http://localhost:4600> | `product/data`, `assets/uploads` |
| `prototyping` · DS Prototyping Tooling (ASSA ABLOY) | Raquel Pereira | <http://localhost:4321> | `prototyping/v1/…`, `prototyping/dist` |

**Marketing Studio** (Hugo França) is Python plus a local TryPost board in Docker, so it is not one of these: install it from `../demo tools/Install-Marketing-Studio` (its INSTALL.md) and Engagement checks whether TryPost answers on <http://localhost:8000>.

Because every tool writes into its own folder, none runs from `../demo tools` (read-only; `scripts/check-sources.mjs` checks all four). A tool runs from your own clone in `sources/` if there is one, else from a copy in `tool-copies/` (git-ignored, outside Vite's file watcher). Addresses can be changed per browser in **Settings › Integrations**. The page checks every few seconds while a tool is down, so starting it in the terminal is enough. Tools on this machine are checked by the local API (`GET /api/tools/probe`), so a stopped tool leaves nothing in the browser console.

## What works, what needs a key, what is simulated

The same list is in the app at **Settings › About this tool**, so task pages don't repeat it.

**Works on this machine, no AI needed**
- **Home**: fourteen journeys as data (`src/fixtures/journeys.ts`), a keyword router (`src/features/nagarro/intent.ts`), set-up guides at `/nagarro/journeys/<id>`.
- **Projects**: My work (`src/features/nagarro/MyWork.tsx`), project cards from `src/state/card.ts` and `src/fixtures/project-cards.json`, live previews with the project's own theme (`themeIntentVars`); the project Overview (`EngagementHome.tsx`).
- **Demos**: Prepare a client meeting (`PresenterGuide.tsx`, outcomes), Build a demo (`DemoBuilder.tsx`), mini-demos (`src/fixtures/demos.ts`), custom playlists on the guide bar and notes window, saved per project.
- **Engagement**: the calendar (`Calendar.tsx`, `server/engagement.ts`: `/api/engagement/posts` and `/api/engagement/asset`), the Starter Pack posts snapshot (`src/fixtures/posts.snapshot.json`), social cuts (`src/fixtures/social-cuts.ts`, filmed with `npm run clips`), and the Marketing Studio commands.
- **Sources** (Settings): 34 seed sources (25 with readable text); search, filters for kind, approval and audience; a preview of each source with what it is good for; approve, mark out of date, replace and remove; uploads (Markdown, text, Word, PDF with a text layer, Figma text JSON) stored in IndexedDB; practice files re-read through the local API.
- **Responses to client requests**, six steps (request, context, what they ask, sources, draft response, share and present):
  - requirements listed by rules, with "not from documents" flags for pricing, references, CVs, contract terms, availability and undocumented capabilities;
  - matching passages from the selected sources (BM25 with a design-systems synonym map), each explained;
  - a draft whose statements are labelled *backed by a source*, *our recommendation*, *assumption* or *open question*;
  - a **To review** panel and a **Checked** tick per requirement: a matching passage is evidence to check, not an answer, so the draft step is done only when every answer is checked;
  - the original request one click away on every step;
  - guards against invented figures, other clients' names and quotes from internal-only material;
  - downloads, the generation packet, and an optional summary in the client demo's closing chapter.
- **Presentations**: from a reviewed response, or from a project's data as an **assessment readout** or a **project update** (no request needed). One click builds it (no model) and opens on the slides, rendered by Carolina's engine and checked; an editable outline; present mode; **Edit and export in Presentation Studio** (copies the brief); and downloads (one-file HTML with present mode, `deck.json`, `brief.md`, speaker notes). A deck from an idea alone starts in Presentation Studio. Demo slides open the live client demo in the same tab and **Back to preparation** returns to the same slide.
- **Set-up journeys**: *Start a new design system* opens the DS Starter Pack’s own set-up wizard in the page (from your clone or `tool-copies/`), then *Record it in the project* reads the `ds.project.json` it saved (or a `.dsproject.json` you choose) and shows what the workspace keeps and what stays in the Starter Pack (`src/library/theme/fromStarterProject.ts`). Without the Starter Pack, the basics (name, brands, product, modes) are recorded by hand. Other ways to start: DSN Brands and DSN’s command line. *Improve an existing system* (goals, connect, assess, findings, agree the plan, map the names, review and share, handover) names the real tool for its steps where one exists. A step is ticked when its work is done, never because it was opened.
- **Client demo**: the eight-chapter story with a short path (about 12 minutes) and a full path (about 25). Any chapter can be entered directly; the chapters it depends on are set up first. Pause holds the simulation on a state. Reset goes back to the prepared version and never touches preparation.
- The AI-readiness scorecard and the demo build with its leak check.

**Needs a key on this machine**
- **Ask AI** on Home (kind `route`, the journey list only) and **AI drafting** ("Draft with AI", "Rewrite with AI") need `ANTHROPIC_API_KEY`. It shows an estimate at the action, asks for consent per request and records usage. It is tested with mocked responses only; no live call was made.
- **Figma refresh and folder listing** need `FIGMA_TOKEN`. The routes are built and unit-tested but not exercised against Figma.

**Captured once, refreshed without tokens**
- The Figma seed documents were read once through the Figma MCP, text only, on 22 Oct 2026: the offer deck, the Case Studies index and the FigJam strategy board. Client frames and the client footer were excluded.
- Refresh uses the knowledge plugin, figma-cli or REST. See [docs/figma-reading.md](docs/figma-reading.md).

**Simulated in the client demo** (labelled where an action could look live)
- Scans of a client's repository and Figma file (they read a fictional sample system), pull requests and checks, the Figma review and apply, the files AI tools read, release checks and agent suggestions, the rule-based screen builder.

**Not available here**
- A hosted multi-user mode or shared storage: each person's projects, requests and uploads live in their own browser (NDA). The Engagement calendar can read shared Marketing Studio folders.
- Posting: nothing posts from the workspace or from Marketing Studio.
- Editable PowerPoint or PDF: Presentation Studio exports both. A deck's **Share** tab copies its brief for Studio to rebuild it; opening the workspace's `deck.json` there is to be confirmed with Carolina.

## Where to read more

| Topic | Document |
|---|---|
| Trying the workspace (for Nuno and Rui) | [docs/try-it.md](docs/try-it.md) |
| The journeys on Home and how to add one | [docs/journeys.md](docs/journeys.md) |
| Sources, approval, scope, refresh, limits | [docs/knowledge-library.md](docs/knowledge-library.md) |
| Reading Figma: plugin, REST, figma-cli, MCP, token costs | [docs/figma-reading.md](docs/figma-reading.md) |
| Answering a real client request, end to end | [docs/opportunity-workflow.md](docs/opportunity-workflow.md) |
| Decks on the Nagarro Master Slides engine | [docs/presentations.md](docs/presentations.md) |
| Presenting the client demo: Prepare a client meeting, the story, playlists, notes window, reset | [docs/client-demo.md](docs/client-demo.md) |
| Voice, terms and button verbs | [docs/writing.md](docs/writing.md) |
| The client-safe demo build and its deploy checklist | [docs/demo-build.md](docs/demo-build.md) |
| Getting the workspace to colleagues (GitHub, keys, what is never committed) | [docs/distribution.md](docs/distribution.md) |
| Adding a source, a tool, a demo or a template mapping | [CONTRIBUTING.md](CONTRIBUTING.md) |
| Licences: Equip, Carolina's engine, the library sources, figma-cli | [LICENSES.md](LICENSES.md) |

## How it is built

- **Stack.** Vite 7, React 19, react-router 7, and one persisted Zustand store (schema 5, `src/state`).
- **Projects.** Each project has a `draft` (preparation), a `published` version (what the client demo shows; last three kept), a demo `session` (what happens during a meeting, resettable) and `clientExperience`. Every edit in the workspace lands in the draft. Each project also has a `card` for its tile on My work (schema 5). **Update the client demo** snapshots it. Journey progress is preparation: it never marks the draft as changed.
- **New data stays at project level.** Requests, decks and response summaries live on the project, and the knowledge library under `practice.knowledge`. They are never cloned into published versions or sessions, and never mark the draft as changed. A summary added to the client demo is a frozen, client-safe copy whose provenance is kept as hashes only.
- **Home** asks "What do you need to do?": the prompt and two groups of journeys, all from `src/fixtures/journeys.ts`.
- **Navigation.** One stable sidebar of five (Home, Projects, Demos, Engagement, Settings), no buttons in the header besides Search. Projects is one page; Demos has Demos and Prepare a client meeting; a project's sections are tabs in its header. Old paths (the request and deck lists, the team board, the project AI and requests tabs, the audit trail, the scorecard tab, `/nagarro/demos/cut`) redirect.
- **Presenter notes** live in `src/internal/presenterNotes.ts` and the notes window (`/presenter/:slug`, synced over `BroadcastChannel`). The client-facing chapters are in `src/features/demo/steps.ts`; `prepare.ts` sets up a chapter's prerequisites.
- **Document bodies** live in IndexedDB (`unified-ds-tool-knowledge`). Seed bodies are bundled JSON in `src/fixtures/knowledge/docs/`.
- **Pure modules** (`src/knowledge`, `src/opportunity`, `src/deck`) have no DOM, so Node scripts, Vitest and the browser share one implementation.
- **The local API** is a Vite plugin (`server/local-api.ts`) that serves `/api/status`, `/api/generate`, `/api/figma/*` and `/api/local/*`. Local reads are limited to an allowlist. Keys never reach the browser.
- **Internal-only seeds**, including the knowledge library, sample opportunities and the client deny-list, are registered from `src/internal/register.ts`. The demo build swaps that module for an empty one, so none of it ships.
- **Carolina's engine** is vendored unmodified in `public/vendor/nagarro-master-slides/`, with a version file and SHA-256 hashes. It renders only inside `slides.html`, an isolated frame, so its CSS never touches the shell.
- **Look.** The shell is dark (design.nagarro.com): components use role tokens (`--n-surface`, `--n-fill`, `--n-band`, `--n-strong`, `--n-line`) in `src/styles/base.css`, never the ink/white primitives; client systems in `DemoScope` and the slides keep their own theme. The brand's 3D renders are `--n-art-*` tokens over `public/brand/3d/`.
- **Brand tokens.** The shell's `--n-*` tokens alias the engine's tokens (`--fg-100`, `--accent-primary`, …) from `brand-tokens.css`. The shell uses the licensed Equip fonts (`public/fonts/equip`; see [LICENSES.md](LICENSES.md)).

```
src/
  app/          routes, router (and router.demo), screens
  shell/        AppShell, nav model, ProjectHeader, DemoBar, Menu, present (workspace ⇄ demo), story pieces, provenance, ui primitives
  state/        store, slices (knowledge, opportunity, deck, projects…), flows, tasks, migrate (v2→v3→v4)
  knowledge/    types, docStore, resolve, retrieve (BM25), conflicts, extract/ (markdown, plain, html, figmaText, upload)
  opportunity/  extract, rules, compose, validate, prompts, packet, exports, selectors
  deck/         catalog (generated from the engine), fromOpportunity, checks, exports
  features/     knowledge, opportunity, presentations, hub (integrations), demos (stage, cuts), engagement (posts, Marketing Studio), nagarro (Home, journeys, Projects), scorecard, demo-site, client, …
  internal/     register.ts (internal seeds, deny-list) · presenterNotes.ts · register.demo.ts (empty)
  fixtures/     demo-brand, reference, knowledge (registry, conflicts, opportunities, samples, docs)
server/         local-api.ts, schemas.ts
figma-plugin/   the knowledge export plugin (read-only, no network)
scripts/        setup, typecheck, snapshot-local-sources, figma-json-to-doc, figma-cli-extract, sync-nagarro-slides, sync-brand-tokens, check-demo-build, check-sources
e2e/            Playwright specs for Edge
```

## Honest notes

- Health, readiness, accessibility, eval and usage figures in the samples are illustrative, not measured client results. The demo labels them "sample".
- The template composer quotes the best-matching passage from an approved or draft source. It is a first draft, not an answer: a person must check that each quote answers the question before anything is published.
- Seed approvals follow recorded verdicts only: the offer deck, the case studies index and the big idea line. Everything else starts as a draft with its owner. See [docs/knowledge-library.md](docs/knowledge-library.md).
- The three source projects (`../demo tools/*`) and the font folders were only read. `node scripts/check-sources.mjs` verifies they are unchanged.
