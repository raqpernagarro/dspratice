# Nagarro design systems hub (`unified-ds-tool`)

One local application for the Nagarro DS Practice. It has two workspaces:

- **The Nagarro workspace** is where colleagues win and deliver work. It holds:
  - a curated **knowledge library**;
  - an **opportunity-response workflow** that drafts traceable answers to RFPs and questionnaires;
  - **presentations** built on Carolina Baptista's Nagarro Master Slides engine;
  - a catalogue of **tools** and **demos**;
  - the design-system **control panel** for each engagement.
- **The client workspace** is what a client sees: the control panel on their system, a guided walkthrough, the AI-readiness scorecard and a **Proposal summary** that holds only what someone explicitly published.

A separate **client-safe demo build** packages the client experience on the fictional Demo Brand, the scorecard and a landing page, with nothing internal in it.

Working name until decision D7 (12 Nov). Everything runs on your machine. Clients and engagements are fictional except the prospects you create.

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
| `npm run dev` | The hub on <http://localhost:4300>, with the local API (model, Figma REST, practice files) |
| `npm run build` | Typecheck and production build into `dist/` |
| `npm run build:demo` | The client-safe demo into `dist-demo/`, then a leak check that fails on internal names and markers |
| `npm run preview` / `npm run preview:demo` | Serve `dist/` on 4301 or `dist-demo/` on 4302 (the local API also works in preview) |
| `npm test` | Vitest: 11 files, 74 tests |
| `npm run e2e` | Playwright in Microsoft Edge (`channel: 'msedge'`): 3 specs. Run `npm run build:demo` first |
| `npm run typecheck` | TypeScript only (core app when the library sources are absent) |
| `npm run knowledge:local [-- --check]` | Re-read the practice files into the bundled knowledge snapshot, or check it is current |
| `npm run knowledge:figma -- <capture.json> --source <id>` | Turn a Figma text capture (plugin, figma-cli or MCP) into a knowledge document |
| `npm run slides:sync -- <folder> --version <id>` | Update the vendored Nagarro Master Slides engine from a downloaded copy |
| `npm run tokens:sync` | Regenerate `src/styles/brand-tokens.css` from the engine's `tokens.json` |

## What works, what is configured-only, what is simulated

**Works today, zero model tokens**
- The knowledge library:
  - 34 seed sources, 25 of them readable in the app;
  - approval, audience and scope;
  - inspect, approve, mark outdated, replace and remove;
  - uploads (Markdown, text, Word, PDF with a text layer, Figma text JSON) read in the browser and stored in IndexedDB;
  - practice files re-read through the local API.
- The opportunity workflow, steps 1–7:
  - requirement extraction, with "not from documents" flags for pricing, references, CVs, contract terms, availability and undocumented capabilities;
  - BM25 retrieval with a design-systems synonym map, and an explanation for every match;
  - the template draft, with statements labelled supported, recommendation, assumption or open question;
  - the honesty guards: figures not found in a cited section are replaced, other clients' names are flagged, quotes are checked against their section;
  - conflicts between sources, edits kept on redraft, exports, the generation packet, and publishing to the client workspace with refusals.
- Presentations: a brief, a slide plan on Carolina's 508 registered templates, slides rendered by her engine, checks, present mode, and exports (standalone HTML, `deck.json`, `brief.md`, speaker notes). A deck is flagged outdated when its request, response or sources change.
- The client Proposal summary, the scorecard and the demo build with its leak check.
- The v3 control panel and client workspace, unchanged.

**Real but configured-only**
- **Model drafting** ("Draft with AI", "Improve with AI") needs `ANTHROPIC_API_KEY`.
  - It shows a token estimate first, asks for consent per opportunity and records usage.
  - It is tested with mocked responses only; no live call was made in this round.
- **Figma REST refresh and folder discovery** need `FIGMA_TOKEN`. The routes are built and unit-tested but not exercised against Figma.

**Captured once, refreshed without tokens**
- The Figma seed documents were read once through the Figma MCP, text only, on 22 Oct 2026: the offer deck, the Case Studies index and the FigJam strategy board. Client frames and the client footer were excluded.
- Refresh uses the knowledge plugin, figma-cli or REST. See [docs/figma-reading.md](docs/figma-reading.md).

**Simulated, as in v3**
- GitHub pull requests and checks, the Figma plugin's review, publishing channels, evals and the rule-based agents.
- All of these are labelled on screen.

**Not built**
- A hosted multi-user mode or shared storage: each person's library additions and opportunities live in their own browser.
- Presentation Studio import of `deck.json` is to be confirmed with Carolina.
- `.pptx` export stays in Carolina's Studio.

## Where to read more

| Topic | Document |
|---|---|
| Sources, approval, scope, refresh, limits | [docs/knowledge-library.md](docs/knowledge-library.md) |
| Reading Figma: plugin, REST, figma-cli, MCP, token costs | [docs/figma-reading.md](docs/figma-reading.md) |
| Answering a real opportunity, end to end | [docs/opportunity-workflow.md](docs/opportunity-workflow.md) |
| Decks on the Nagarro Master Slides engine | [docs/presentations.md](docs/presentations.md) |
| The client-safe demo build and its deploy checklist | [docs/demo-build.md](docs/demo-build.md) |
| Getting the hub to colleagues (GitHub, keys, what is never committed) | [docs/distribution.md](docs/distribution.md) |
| Adding a source, a tool, a demo or a template mapping | [CONTRIBUTING.md](CONTRIBUTING.md) |
| Licences: Equip, Carolina's engine, the library sources, figma-cli | [LICENSES.md](LICENSES.md) |

## How it is built

- **Stack.** Vite 7, React 19, react-router 7, and one persisted Zustand store (schema 4, `src/state`).
- **Projects.** Each project has a `draft`, a `published` version (last three kept), a client `session` and `clientExperience`. Every internal edit lands in the draft. **Publish** snapshots it; the client workspace reads the published version.
- **New data stays at project level.** Opportunities, decks and published outputs live on the project, and the knowledge library under `practice.knowledge`. They are never cloned into published versions or sessions, and never flip "Draft ahead". Published outputs are a frozen, client-safe copy whose provenance is kept as hashes only.
- **Document bodies** live in IndexedDB (`unified-ds-tool-knowledge`). Seed bodies are bundled JSON in `src/fixtures/knowledge/docs/`.
- **Pure modules** (`src/knowledge`, `src/opportunity`, `src/deck`) have no DOM, so Node scripts, Vitest and the browser share one implementation.
- **The local API** is a Vite plugin (`server/local-api.ts`) that serves `/api/status`, `/api/generate`, `/api/figma/*` and `/api/local/*`. Local reads are limited to an allowlist. Keys never reach the browser.
- **Internal-only seeds**, including the knowledge library, sample opportunities and the client deny-list, are registered from `src/internal/register.ts`. The demo build swaps that module for an empty one, so none of it ships.
- **Carolina's engine** is vendored unmodified in `public/vendor/nagarro-master-slides/`, with a version file and SHA-256 hashes. It renders only inside `slides.html`, an isolated frame, so its CSS never touches the shell.
- **Brand tokens.** The shell's `--n-*` tokens alias the engine's tokens (`--fg-100`, `--accent-primary`, …) from `brand-tokens.css`. The shell uses the licensed Equip fonts (`public/fonts/equip`; see [LICENSES.md](LICENSES.md)).

```
src/
  app/          routes, router (and router.demo), screens
  shell/        AppShell, nav model, provenance chips, DropZone, ProgressPanel, AiCostNote, ui primitives
  state/        store, slices (knowledge, opportunity, deck, projects…), flows, tasks, migrate (v2→v3→v4)
  knowledge/    types, docStore, resolve, retrieve (BM25), conflicts, extract/ (markdown, plain, html, figmaText, upload)
  opportunity/  extract, rules, compose, validate, prompts, packet, exports, selectors
  deck/         catalog (generated from the engine), fromOpportunity, checks, exports
  features/     knowledge, opportunity, presentations, hub (tools, demos, integrations), scorecard, demo-site, client, …
  internal/     register.ts (internal seeds, deny-list) · register.demo.ts (empty)
  fixtures/     demo-brand, reference, knowledge (registry, conflicts, opportunities, samples, docs)
server/         local-api.ts, schemas.ts
figma-plugin/   the knowledge export plugin (read-only, no network)
scripts/        setup, typecheck, snapshot-local-sources, figma-json-to-doc, figma-cli-extract, sync-nagarro-slides, sync-brand-tokens, check-demo-build, check-sources
e2e/            Playwright specs for Edge
```

## Honest notes

- Dashboard, report, eval and usage numbers in the control panel are demo data.
- The template composer quotes the best-matching passage from an approved or draft source. It is a first draft, not an answer: a person must check that each quote answers the question before anything is published.
- Seed approvals follow recorded verdicts only: the offer deck, the case studies index and the big idea line. Everything else starts as a draft with its owner. See [docs/knowledge-library.md](docs/knowledge-library.md).
- The three source projects (`../demo tools/*`) and the font folders were only read. `node scripts/check-sources.mjs` verifies they are unchanged.
