> **⚠️ Historical — describes a superseded version of this product.**
>
> Kept for the reasoning it records, not as instructions. It predates the current
> product and refers to things that no longer exist (a two-server `serve.py` setup,
> `js/decks/` data files, `deck.html` / `wiki.html`, a 91-template library).
>
> For how the system works today: [`CLAUDE.md`](../CLAUDE.md) and
> [`Design.md`](../Design.md). For the exporter: [`EXPORT-NOTES.md`](EXPORT-NOTES.md).

# Architecture

*Prerequisite: read `PROJECT_CONTEXT.md` first if you haven't. This document goes
deeper into responsibilities, execution flow, and — most importantly — *why* the
system is shaped this way.*

## 1. Layers and responsibilities

```
┌─────────────────────────────────────────────────────────────────────┐
│ tokens         css/tokens.css, Design.md                             │
│   → color, type, spacing as CSS custom properties + normative spec   │
├─────────────────────────────────────────────────────────────────────┤
│ shared blocks  js/components.js, js/icons.js, js/logo.js             │
│   → esc(), Logo, Footer, Chrome, SectionHeader — reused by templates │
├─────────────────────────────────────────────────────────────────────┤
│ templates      js/templates/*.js (+ index.js registry)               │
│   → one self-contained layout component per slide archetype          │
├─────────────────────────────────────────────────────────────────────┤
│ decks          js/decks/*.js                                         │
│   → content data: which template, which text, which theme            │
├─────────────────────────────────────────────────────────────────────┤
│ rendering      js/render.js, js/engine.js, js/dashboard.js           │
│   → turns (template + content) into DOM, handles nav/scaling         │
├─────────────────────────────────────────────────────────────────────┤
│ export         js/export.js, export.html, tools/export-pptx.mjs      │
│   → headless-renders the same DOM, walks it into a PPTX/PDF          │
└─────────────────────────────────────────────────────────────────────┘
```

Each layer only depends on the layer(s) below it. Templates import
`js/components.js` and read CSS custom properties; they never import another
template or a deck. Decks only reference templates by name (a string), never by
import — this is what lets `js/decks/index.js` be a flat, inspectable registry.

## 2. Module-by-module

### `css/tokens.css` — design tokens + font loading
**Purpose:** single source of truth for brand color/type/spacing, and the
`@font-face` declarations for the self-hosted Equip / Equip Extended fonts.
**Consumers:** every CSS file and every template's inline `css` string (via CSS
custom properties, e.g. `var(--mint-green)`).
**Why it exists:** so a brand change (a color, a font weight) is a one-line edit
here instead of a find/replace across 91+ template files.
**What would break if it changed:** renaming or removing a custom property
silently breaks every template that references it (CSS custom property lookups
don't error — they just resolve to nothing), so grep before renaming.

### `css/primitives.css` — shared type utilities + `SectionHeader` styles
**Purpose:** optional utility classes (`.type-h3`, `.type-body`, …) for when a
template's text exactly matches a scale step, plus the CSS for the shared
`SectionHeader` (`.t-hdr*`) component.
**Consumers:** templates that opt in; `SectionHeader` is used by most non-cover
content templates (steps-flow, layered-system, accent-cards, etc.).
**Why it exists:** per `_CONTRACT.md`, most templates hand-write exact Figma
pixel values in their own scoped CSS — these primitives exist only for the
common cases, to avoid 91 copies of the same `font-size: 64px; line-height:
80px;` pair.

### `css/deck.css` — viewport shell, theme surfaces, chrome, reveal animation
**Purpose:** everything about *how the fixed canvas behaves*, independent of any
one template: the `.deck`/`.viewport` scaling shell (§1 of `ARCHITECTURE.md`
covers the JS side; this is its CSS half), the `.stage` lifecycle
(`opacity`/`visibility`/`.is-active`), the **theme surface system**, the
`.logo`/`.footer` chrome layout, the `rise` reveal-entrance keyframe, and the
nav pill/edge-click UI.
**The theme system, specifically:** every stage carries `data-theme="dark"` or
`"light"` (set by `js/render.js`, see below); `css/deck.css`'s
`.stage[data-theme="dark"]` / `="light"` selectors set the stage's own
background/text color plus three custom properties scoped to that stage —
`--muted-color`, `--rule-color`, `--logo-color` — which is how a single
template's CSS (e.g. the footer, or `SectionHeader`'s subhead in
`primitives.css`) automatically renders correctly on *either* surface without
an `if (theme === "dark")` branch anywhere in template code: templates just
reference `var(--muted-color)` etc., and the theme attribute on the ancestor
`.stage` resolves it.
**Consumers:** every template indirectly (via the theme custom properties and
`.reveal`/chrome classes); `js/render.js` sets the `data-theme` attribute that
this file's selectors key off of.
**Why it exists as CSS rather than JS-computed inline styles:** keeps theming
declarative and free — a template never has to know or care what theme it's
in beyond using the right custom property name.
**What would break if it changed:** the `rise` keyframe animates the
independent `translate` CSS property, not `transform`, *on purpose* — templates
use `transform` freely for their own layout (e.g. `translate(-50%,-50%)`
centering), and if `rise` used `transform` instead it would override every
such template's positioning the moment its content entrance-animates. This is
recorded as a "critical gotcha" in `CLAUDE.md` specifically because it was
reintroduced and re-debugged before being written down. See
`docs/conventions/REVIEW_CHECKLIST.md`'s explicit check for this.

### `css/dashboard.css`, `css/wiki.css` — page-specific presentational styling
**Purpose:** `dashboard.css` styles the deck-gallery grid/cards on
`index.html`; `wiki.css` styles the prose layout of the in-app guide
(`wiki.html`). Both are additive on top of `tokens.css`/`primitives.css` and
contain no shared invariants the way `deck.css` does — presentational detail
local to one page each, not referenced elsewhere.

### `wiki.html` — the in-app guide
**Purpose:** a static, human-readable walkthrough (linked from `index.html`'s
"How this works →") covering setup, navigation, the Master Template permission
rule, and export — a shorter, narrative counterpart to `README.md` aimed at
someone opening the app for the first time rather than reading the repo.
**Notable role for this documentation set:** its own "Version history" section
is the pre-existing, user-facing changelog that `docs/CHANGELOG.md` was seeded
from (see `docs/CHANGELOG.md`'s header) — the two should be kept in sync going
forward, per `CLAUDE.md`'s existing instruction to update the wiki "whenever a
feature ships."

### `js/components.js` — shared rendering blocks
**Purpose:** `esc()` (HTML-escaping), `Logo()`, `Footer()`, `Chrome()`,
`SectionHeader()` — the handful of pieces of markup nearly every slide needs.
**Consumers:** `js/render.js` (Chrome), and any template that renders a
`SectionHeader` eyebrow/heading/subhead block.
**Why it exists:** logo + footer are painted by the *engine*, not by each
template (see §3 "Chrome painting order" below) — `Chrome()` is the one function
that implements that rule, so it only needs to be correct once.
**What would break if it changed:** `Chrome()`'s signature (`slide`, `deckDefaults`)
is called from `render.js` for every slide in every deck; changing its contract
requires updating that one call site, but changing its *output* changes the
footer/logo on every slide of every deck simultaneously.

### `js/icons.js` — 126-icon brand icon set
**Purpose:** `icon(name)` → inline SVG string, `currentColor`-based so icons
inherit the slide's text color.
**Consumers:** any template needing an inline icon (as opposed to an `<img>` to
a Figma-exported asset).
**Why it exists:** generated once from the Figma "Scribble icons" node so icon
usage doesn't require a network request or a build step — SVGs are inlined as
JS strings.

### `js/templates/*.js` + `js/templates/index.js` — the template registry
**Purpose:** each file is one slide layout: `{ name, slide, theme, chrome,
schema, example, render(), css }` (contract in `_CONTRACT.md`). `index.js`
imports every module and exposes `templates` (by name), `allTemplates` (array,
ordered), `getTemplate(name)`, and `installTemplateStyles()` (concatenates every
module's `css` into one `<style>` tag, once).
**Inputs:** a `slide` object (deck content) + `ctx` (`{ deck, esc }`).
**Outputs:** an HTML string (the slide's inner content, chrome excluded).
**Consumers:** `js/render.js` (`buildStage`), `js/decks/main-template.js`
(builds the master deck from every template's `example`).
**Why it exists as 91+ *separate files* instead of one big templates file:** see
`ADR/0003-self-contained-template-modules.md`. Short version: each template maps
1:1 to one Figma frame; keeping them as independent modules with their own
scoped CSS means adding template #92 touches exactly one new file plus one
import line in `index.js` — never risks breaking template #47.
**What would break if it changed:** `index.js` is explicitly marked
"GENERATED" — it's meant to be regenerated from the folder listing, not
hand-maintained indefinitely. If a module is added to `js/templates/` but not
imported+listed here, it silently doesn't exist to the rest of the system
(`getTemplate` throws "Unknown template").
**Known limitation:** the registry is a flat JS array scanned at import time —
there's no lazy loading. All 91+ templates' CSS and JS load on every page,
including the dashboard. At current scale this is fine (templates are small);
it would need rethinking if the library grew by an order of magnitude.

### `js/templates/_CONTRACT.md` — the template authoring contract
**Purpose:** the spec a human or AI follows to turn one Figma frame into one
template module (exact-px fidelity, chrome rules, token usage, `reveal` class
usage, escaping). Not code — a contract document that keeps 91+ independently
authored files consistent.
**Why it exists:** without it, each new template would reinvent conventions
(different padding units, ad-hoc colors, inconsistent chrome handling) and the
"looks like one system" property of the deck would erode template by template.

### `js/decks/masters.js` — Master Template registry
**Purpose:** defines which Master Templates exist (today: `main-template`) and,
per master, an `includes(template)` predicate selecting which registered
templates belong to it.
**Why it exists:** decouples "which templates form a brand library" from "how
many brand libraries exist" — adding a second master (e.g. a "minimal" master)
is a data change here plus tagging templates with `masters: [...]`, not a code
change elsewhere. See `ADR/0006-multi-master-support.md`.

### `js/decks/main-template.js` — builds Master Template decks
**Purpose:** for each entry in `masters.js`, assembles a full deck by filtering
`allTemplates` through that master's `includes()`, sorting by the template's
`slide` number, and mapping each to `{ template: name, ...example }`.
**Why it's auto-built rather than hand-authored:** a Master Template deck must
always show *every* template currently in the library, in order — hand-authoring
that list would drift out of sync the moment someone added template #92 and
forgot to also edit the master deck. Auto-building from the registry makes that
impossible.

### `js/decks/<slug>.js` (e.g. `assa-abloy-connect.js`) — a presentation deck
**Purpose:** the actual content of one real presentation: `meta` (id, kind,
basedOn, title, description, created, footer defaults) + `slides` (array of
`{ template, theme, ...content }`).
**Why decks are code, not JSON/CMS data:** content needs to reference template
names, use JS array/object literals for nested structures (cards, steps, table
rows), and benefits from being reviewable/diffable alongside the templates it
depends on. There is intentionally no runtime deck editor — decks are authored
(by a human or an AI assistant) as source files.

### `js/decks/index.js` — the deck registry
**Purpose:** combines `masters` + `presentations` into `decks`, exposes
`getDeck(id)`. This is the one file every new presentation must be added to
(import + push to `presentations`) for it to appear anywhere in the app.
**Why it exists:** every other file that needs "all decks" or "one deck by id"
(`engine.js`, `dashboard.js`, `export.js`) imports from here rather than
maintaining its own list — one registry, three consumers.

### `js/render.js` — shared slide builder
**Purpose:** the one function, `buildStage(slide, deckMeta)`, that both the
viewer and the dashboard thumbnails use to turn a slide + deck meta into a real
`<section class="stage">` DOM element: resolve the template, set
`stage.dataset.theme`, call `render()`, then paint `Chrome()` **after** the
template content (so chrome sits visually on top of full-bleed template
content, e.g. a full-frame photo).
**Theme resolution precedence:** `slide.theme || tpl.theme || "light"` — a
slide's own `theme` field wins if set, otherwise the template's declared
default theme, otherwise light. This is the one place that decision is made;
everything downstream (the CSS in `css/deck.css`, see above) just reads the
resulting `data-theme` attribute. The same precedence applies to `chrome`
(`slide.chrome ?? tpl.chrome ?? true`).
**Why it's shared between viewer and dashboard:** a dashboard thumbnail must be
pixel-identical to what the viewer shows (it's literally the same DOM at a
smaller CSS scale) — having two separate rendering paths would let them drift.

### `js/engine.js` — the deck viewer (entry for `deck.html`)
**Purpose:** resolve `?id=` → deck, build every slide's stage up front, wire
keyboard/click/touch/swipe navigation, and continuously fit the fixed
1920×1080 `#viewport` to the actual window via `translate()+scale()`.
**Why every slide is built up front (not lazily per-navigation):** simplicity —
91-slide decks are still small DOM trees, and building everything up front means
navigation is just toggling `.is-active`, with no re-render/flicker risk and no
need to handle "slide not loaded yet" states.

### `js/dashboard.js` — the deck gallery (entry for `index.html`)
**Purpose:** render one card per deck (masters and presentations in separate
sections), each with a live thumbnail (`buildStage` on slide 1, scaled into a
16:9 card frame) rather than a static screenshot.
**Why a live thumbnail instead of a stored image:** it can never go stale — the
thumbnail is generated from the same code path as the real slide 1, so editing a
deck's first slide updates its dashboard card automatically.

### `js/export.js` + `export.html` — the DOM→PPTX walker
**Purpose:** mount one slide at native 1:1 scale (no viewport transform) and
expose `window.__renderSlide(n)` / `window.__extractSlide()` to a driving Node
process. `__extractSlide` recursively walks the live DOM, using
`getComputedStyle()` to classify every element as a `text`, `shape`, or `image`
op with exact pixel geometry.
**Why a generic DOM walker instead of a per-template export function:** see
`ADR/0005-generic-dom-to-pptx-export.md`. In short — a per-template exporter
would mean every one of the 91+ templates needs a second, export-specific
implementation kept in sync with its `render()`; the generic walker means a
template author writes HTML/CSS once and export "just works," at the cost of the
walker itself being intricate (see `tools/EXPORT-NOTES.md`'s 15-entry issue
catalog — every entry is a case the naive DOM-classification approach got wrong
before it was special-cased).
**What would break if it changed:** the walker's output contract (`{bg, ops[]}`
with `text`/`shape`/`image` kinds and exact field names) is consumed by
`tools/export-pptx.mjs`'s `addSlide()` — the two files are tightly coupled and
must change together.

### `tools/export-pptx.mjs` — the export CLI
**Purpose:** drives Playwright against `export.html`, calls
`__renderSlide`/`__extractSlide` per slide, screenshots every `image`-kind op
(isolated via the `.cap-plate`/`.cap-graphic` classes so overlapping siblings
don't bleed in), assembles a `pptxgenjs` presentation, and separately assembles a
`pdf-lib` PDF from full-slide screenshots.
**Why two separate outputs (native pptx + rasterized pdf) instead of one:** the
PDF's job is pixel-exactness regardless of the viewer's installed fonts (it's a
picture of what the browser rendered); the PPTX's job is editability (real text
boxes) — those are different, sometimes conflicting goals, so the tool produces
both rather than compromising on one file.
**Consumers:** none inside the app — this is a standalone CLI a human runs.
**Known limitation:** performance is dominated by per-element screenshots (a
91-slide deck takes ~2 minutes, ~55 MB, 779 image captures at `--scale 2`) — see
`ROADMAP.md`.

### `tools/EXPORT-NOTES.md` — exporter institutional memory
**Purpose:** not code — a catalog of every export bug hit during development
(symptom → root cause → fix) plus the invariants that, if broken, reintroduce a
whole class of bugs. Required reading before editing the three files above.
**Why it's a separate file instead of code comments:** the invariants span three
files (`export.js`, `export.html`, `export-pptx.mjs`) and describe *interactions*
between them (e.g. "the capture surface must be transparent, or logos get white
boxes on dark slides") that don't belong to any single function.

### `serve.py` — no-cache dev server
**Purpose:** serves the repo as static files with `Cache-Control: no-store` on
every response.
**Why not `python -m http.server`:** the default server lets browsers cache ES
modules/CSS heuristically, so edits silently don't show up without a hard
refresh — indistinguishable from a real bug during development. This is
recorded as a "critical gotcha" in `CLAUDE.md` because it was rediscovered more
than once before being fixed here.

### `index.html`, `deck.html`, `export.html` — the three entry points
**Purpose:** `index.html` boots `dashboard.js` (deck gallery); `deck.html` boots
`engine.js` (the presenter view, reads `?id=`); `export.html` boots `export.js`
(headless capture surface, only ever driven by Playwright, never opened by a
human directly). All three load the same `css/tokens.css` → `primitives.css` →
`deck.css` chain so template CSS behaves identically in every context.

### Other top-level folders (for completeness)
- **`fonts/`** — the self-hosted Equip / Equip Extended font files (OTF, TTF,
  and the `web/` woff2+woff subset `css/tokens.css`'s `@font-face` rules load).
  Not code; a static asset directory.
- **`assets/`** — brand asset library (logos, caring-icons, scribbles,
  photography, plus per-frame Figma exports under `assets/figma/<NN>/`). See
  `Design.md` and `assets/README.md` for the full inventory and usage rules.
- **`.claude/launch.json`** — dev-tooling config (not part of the app itself):
  declares the `serve.py 4599` dev server for editor/agent tooling that can
  launch and preview a local server automatically.
- **`issues/`** — present but empty (contains only a macOS `.DS_Store` file, no
  tracked content as of this writing). Recorded in `docs/ROADMAP.md` rather
  than assumed to be dead — an empty, purpose-named folder with no README is
  ambiguous (scaffolding for a future convention vs. leftover cruft) without
  more context than the repository itself provides.
- **`node_modules/`, `package.json`, `package-lock.json`** — standard Node
  dependency management for the exporter's three dependencies (`pdf-lib`,
  `playwright`, `pptxgenjs`) plus the optional `puppeteer-core`. Nothing in the
  browser-served app (`index.html`/`deck.html`) depends on `node_modules` —
  only `tools/export-pptx.mjs`, a Node CLI, does.

## 3. Execution flow

### Viewing a deck (human, browser)
```
GET deck.html?id=assa-abloy-connect
  → engine.js: getDeck("assa-abloy-connect")            [js/decks/index.js]
  → for each slide: buildStage(slide, deck.meta)         [js/render.js]
      → getTemplate(slide.template)                       [js/templates/index.js]
      → tpl.render(slide, {deck, esc})  → inner HTML       [js/templates/<name>.js]
      → + Chrome(slide, deckMeta) painted after            [js/components.js]
  → append all stages to #viewport, activate slide 0
  → fit(): scale #viewport to the window
  → keyboard/click/touch listeners drive go(index)
```
Chrome is painted **after** template content specifically so a full-bleed
template (a photo, a dark statement background) doesn't cover the logo/footer —
see `js/render.js`'s comment. This ordering is a rule, not an accident; breaking
it (e.g. painting chrome first) would make every full-bleed template's chrome
invisible.

### Viewing the dashboard
```
GET index.html
  → dashboard.js: for each deck in masters + presentations
      → buildStage(deck.slides[0], deck.meta)   [same function as the viewer]
      → scale that stage's 1920×1080 frame down to the card width
  → sections hidden entirely if their deck list is empty
```

### Exporting to PPTX/PDF
```
node tools/export-pptx.mjs assa-abloy-connect
  → ensure serve.py is running on :4599 (start it if not)
  → launch Playwright Chromium, open export.html?id=assa-abloy-connect
  → for n in 0..slideCount:
      __renderSlide(n)                          [export.js, in-page]
        → buildStage(slide, deck.meta)           [same buildStage as the viewer]
        → wait for fonts + 2 animation frames to settle
      screenshot the full slide → pageImages[]   (for the PDF)
      __extractSlide()                           [export.js, in-page]
        → walk the DOM, emit {bg, ops[]}
      for each `image`-kind op: isolate + screenshot that one element
      addSlide(pptx, data, shots)                [export-pptx.mjs]
        → text ops   → slide.addText (native, editable)
        → shape ops  → slide.addShape (RECTANGLE/ROUNDED_RECTANGLE/OVAL)
        → image ops  → slide.addImage (the isolated screenshot)
  → write outputs/<deck-id>/<deck-id>-vNN.pptx
  → assemble outputs/<deck-id>/<deck-id>-vNN.pdf from pageImages (pdf-lib)
```
Note that **the exporter reuses `buildStage` from `js/render.js`** — the exact
same function that renders the live viewer and the dashboard thumbnails. This is
deliberate: there is exactly one code path that turns `(template, content)` into
DOM, used by all three consumers (viewer, dashboard, exporter). It is the reason
"the HTML deck stays the single source of truth" (README.md) is actually true
rather than aspirational — there's no second rendering implementation that could
drift from the first.

## 4. Dependency graph (who imports whom)

```
css/tokens.css  ←── css/primitives.css, css/deck.css, css/dashboard.css, css/wiki.css
                ←── every template's inline `css` (via var(--...))

js/logo.js            ←── js/components.js
js/components.js      ←── js/render.js, templates that use SectionHeader/Chrome
js/icons.js            (leaf — consumed ad hoc by templates that need icon())

js/templates/<N>.js   ←── js/templates/index.js  (imports every module)
js/templates/index.js ←── js/render.js, js/decks/main-template.js, js/export.js

js/decks/masters.js       ←── js/decks/main-template.js
js/decks/main-template.js ←── js/decks/index.js
js/decks/<slug>.js        ←── js/decks/index.js   (each presentation, by hand)
js/decks/index.js         ←── js/engine.js, js/dashboard.js, js/export.js

js/render.js  ←── js/engine.js, js/dashboard.js, js/export.js

js/engine.js     ←── deck.html
js/dashboard.js  ←── index.html
js/export.js     ←── export.html  ←── tools/export-pptx.mjs (via Playwright, not an import)
```

Nothing imports "up" this graph — templates never import a deck, decks never
import the engine, etc. The only file every runtime entry point (`engine.js`,
`dashboard.js`, `export.js`) shares is `render.js` + `decks/index.js`.

## 5. Why the architecture is organized this way

The driving constraint, stated in `CLAUDE.md`, is: **decks must be assembled by
mapping content onto a fixed set of brand-approved templates, never by
inventing new layouts per deck.** Every structural choice traces back to that:

- **Templates are data-describing components (`schema`/`example`), not just
  render functions** — so a template is self-documenting enough that an AI
  assistant (or a human) can pick the right one for a piece of content without
  reading its implementation, just its `description`/`schema`/`example`.
- **Decks are plain arrays of `{template, ...content}`** — this makes "did this
  deck invent a new layout" a trivially checkable property (every `template`
  value must resolve via `getTemplate()`), and it's what makes the Master
  Template auto-buildable (§2, `main-template.js`).
- **One render path (`buildStage`) for viewer, dashboard, and export** — so
  "what you see is what exports" is structurally guaranteed, not just tested for.
- **The `excludeFromMaster` flag + explicit-promotion rule** — lets an AI
  assistant build new templates for one deck's unique content *without* being
  able to silently expand the brand library. This is a governance decision
  encoded as a data flag, not a process reminder alone (see
  `ADR/0004-master-template-governance.md`).
- **No framework/bundler** — the entire system is ES modules loaded directly by
  the browser. This keeps "clone the repo, run one Python script" as the entire
  setup cost, which matters because this project explicitly runs across
  multiple machines/laptops with no shared build infrastructure (see
  `CLAUDE.md`'s "Skills & cross-machine consistency" section) — a build step
  would be one more thing that could be present on one machine and missing on
  another.

## 6. Known architectural limitations

- **No lazy loading / code splitting.** All 91+ templates load on every page.
  Acceptable at current scale (see `js/templates/index.js` module notes above).
- **No schema validation.** A template's `schema` field is documentation, not a
  runtime-enforced contract — passing a deck slide with the wrong shape of data
  fails silently (missing text) or throws deep inside `render()`, not at the
  deck/template boundary.
- **No automated tests** for templates, decks, or the exporter — see
  `ROADMAP.md` → Technical debt.
- **The exporter is inherently coupled to computed CSS behavior.** Because
  `js/export.js` classifies elements by reading `getComputedStyle()` at
  runtime, any CSS feature not already handled by the walker (a new kind of
  clip-path, a new blend mode, etc.) silently exports wrong rather than erroring
  — this is why `tools/EXPORT-NOTES.md`'s issue catalog exists and must keep
  growing.
