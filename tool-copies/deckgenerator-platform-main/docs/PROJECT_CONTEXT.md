> **⚠️ Historical — describes a superseded version of this product.**
>
> Kept for the reasoning it records, not as instructions. It predates the current
> product and refers to things that no longer exist (a two-server `serve.py` setup,
> `js/decks/` data files, `deck.html` / `wiki.html`, a 91-template library).
>
> For how the system works today: [`CLAUDE.md`](../CLAUDE.md) and
> [`Design.md`](../Design.md). For the exporter: [`EXPORT-NOTES.md`](EXPORT-NOTES.md).

# Project context

*Read time: ~8 minutes. This is the fast path to understanding what this repo is
and how the pieces fit. For depth, go to `ARCHITECTURE.md` next.*

## What this is

The **Nagarro Presentation System** is a component-based HTML slide engine that
renders Nagarro-branded presentations in a browser and exports them to editable
PowerPoint + pixel-exact PDF. It is not a general slide tool — it is a closed
brand system: every slide in every deck is built from a fixed library of **91
registered templates** derived 1:1 from Nagarro's Figma design file, using two
self-hosted brand fonts (Equip / Equip Extended) and a small, fixed color
palette.

There is no build step, no framework, and no bundler. It's static ES modules
served by a tiny Python file server, viewed directly in a browser.

## Who it's for

Internal Nagarro teams (sales, delivery, digital design strategy) who need a
branded deck fast, and want to hand an AI assistant a reference PPTX/PDF and get
back an on-brand deck built from approved layouts — not a generic AI-generated
slide deck. `README.md`, `CLAUDE.md`, and `wiki.html` are all, in different
forms, aimed at whoever (human or AI) is generating the next deck.

## The mental model — four layers

```
tokens  →  templates  →  decks  →  registry (dashboard)
```

1. **Tokens** (`css/tokens.css`, `Design.md`) — the brand's colors, type scale,
   spacing, as CSS custom properties. Nothing above this layer should hardcode a
   hex value or font name that a token already covers.
2. **Templates** (`js/templates/`) — 91+ self-contained slide *layout components*.
   Each is one file: a `render()` function, scoped CSS, a content `schema`, and
   an `example` with the Figma frame's real text. Templates don't know about any
   specific deck's content — they're pure layout + a content contract.
3. **Decks** (`js/decks/<slug>.js`) — thin data files. A deck is a list of
   `{ template: "<name>", ...content }` objects — it picks templates and supplies
   content, it does not invent layout.
4. **Registry / dashboard** (`js/decks/index.js`, `index.html`) — every deck,
   master or presentation, shows up automatically once registered.

The reason this layering exists: it lets an AI assistant (or a human) build a
new, on-brand deck by **mapping content onto existing templates** instead of
inventing new HTML/CSS per deck — which is exactly what generic "AI slop" decks
do wrong. See `ARCHITECTURE.md` → "Why this shape" for the fuller argument.

## Two kinds of deck

- **Master Template** (`meta.kind: "master"`) — a brand-approved library of
  *all* templates, shown in order. There is one today, `main-template`, and the
  registry supports more (`js/decks/masters.js`). Master decks are **generated**,
  not hand-authored: `js/decks/main-template.js` builds them from every
  template's own `example` field.
- **Presentation** (`meta.kind: "presentation"`, the default) — an actual deck
  someone will present, built from real content, always recording which master
  it's `basedOn`. Today there's one: `assa-abloy-connect`.

New templates built for one specific presentation stay off the brand library
(`excludeFromMaster: true`) until a human explicitly approves promoting them —
this permission gate is the system's central governance rule (see
`CLAUDE.md` and `ADR/0004-master-template-governance.md`).

## How a deck gets on screen

`deck.html?id=<deck-id>` → `js/engine.js` looks up the deck in the registry,
calls `buildStage()` (`js/render.js`) once per slide, which finds the slide's
`template` in the registry (`js/templates/index.js`) and calls its `render()`,
then paints the shared logo+footer chrome on top. All of this happens at a fixed
**1920×1080** virtual canvas that `engine.js` scales (via CSS `transform`) to fit
whatever window it's in — so a slide authored at exact Figma pixel coordinates
looks identical at any screen size.

## How a deck becomes a PowerPoint file

`node tools/export-pptx.mjs <deck-id>` drives a **headless browser** (Playwright)
to `export.html`, renders each slide at native 1:1, and walks the live DOM
(`js/export.js`) to classify every element as `text` / `shape` / `image`. A
Node-side assembler (`pptxgenjs`) turns those into a real, editable `.pptx`, and
a second pass produces a pixel-exact `.pdf`. This is a generic DOM→PPTX
translator, not a per-template export mapping — see `ADR/0005-generic-dom-to-pptx-export.md`.

## What's notably absent

- **No `.git` repository** is initialized in this working copy (see `git status`
  / the environment info) — `CLAUDE.md` explicitly recommends turning this into
  a git repo so `CLAUDE.md` and the templates travel with every machine. Until
  that happens, this repo's shared state lives only on whatever machine you're
  on.
- **No automated tests, no CI/CD.** Correctness is enforced by contract
  documents (`_CONTRACT.md`, `Design.md`, `EXPORT-NOTES.md`) and manual visual
  QA, not by a test suite. See `ROADMAP.md` → Technical debt.
- **No server-side runtime.** `serve.py` is a static file server with caching
  disabled — there's no API, no database, no auth.

## Where to go next

- Building/extending something → `DEVELOPMENT_GUIDE.md`
- Understanding a specific flow in depth → `ARCHITECTURE.md`
- Why something is built the way it is → `ADR/`
- What's known-broken or intentionally deferred → `ROADMAP.md`
- The brand rules themselves (fonts, colors, layout, do/don't) → `../Design.md`
- The non-negotiable workflow rules for generating decks → `../CLAUDE.md`
- The original human-facing setup/usage doc (commands, structure, navigation
  keys) → `../README.md` — this document complements it, not replaces it.
- A narrative first-run walkthrough (in-app, linked from the dashboard) →
  `../wiki.html`
