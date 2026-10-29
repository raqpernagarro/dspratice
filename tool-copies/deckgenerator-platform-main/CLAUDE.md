# Nagarro Presentation System — Working Instructions

These instructions are **authoritative and travel with this repo**. Follow them on every
machine. They exist because past sessions found that, without them, decks drift into
generic "AI-looking" slides instead of the Nagarro brand system.

---

## ⛔ PRIME DIRECTIVE — follow the Master Template, never free-style

When asked to **create, recreate, or generate a deck**, you MUST build it from the
**existing registered brand templates** in `js/templates/` (the "Master Template — All
Slides" library). You **map the source content onto those templates** — you do NOT invent
new ad‑hoc slide layouts, and you do NOT copy the look of one example presentation.

- The brand library is **all registered master templates** in `js/templates/` (the v2
  library, rebuilt from the "Master Slides" Figma file; the registry `js/templates/index.js`
  is generated from that folder — see `js/templates/_CONTRACT.md`). Every module is part of
  the library — none is deck‑specific today. Browse them on the product's own
  **Templates** page, which renders each one live.
- Modules are grouped into six families by filename prefix and by their `family`
  field: `core-*` (64), `main-*` (53), `portfolio-*` (52), `finance-*` (23),
  `planning-*` (21), `strategy-*` (16).
- Each module declares a `role` (content, cards, gallery, chart, quote, table,
  toc, cover, …). The product groups the gallery by that role — see
  `ROLE_CATEGORY` in `product/domain/template-service.js`. A new role needs a
  line there or it lands in "Other".
- A presentation is **data in the product**, not a file in the repo: slides live in
  `product/data/presentations.json`, each naming a registered `template` plus its
  content. Decks are created through the product (a prompt, or a .pptx import) and
  edited in `/editor.html`. The old `js/decks/<slug>.js` data files are gone.
- **Do not produce generic slides** (plain title + bullets, random colors, default fonts,
  decorative bars, accent underlines). If it would look like a stock AI deck, it's wrong.
  Everything must use the brand tokens, fonts, and templates below.

If no existing template fits the content, see **"When no template fits"** — the answer is
*ask*, not *invent silently*.

---

## 🔒 The permission rule (non‑negotiable)

**Never add slides or templates to a Master Template (the Main Slides) without explicit
user confirmation.** New templates built for a specific deck stay **deck‑specific**: the
module sets `excludeFromMaster: true` so it is usable in its deck but does NOT enter the
brand library. Only promote a template into a master when the user explicitly approves —
and then into the master the deck records as `meta.basedOn`.

**After every deck generation, ASK the user** whether the newly built deck‑specific
slides/templates (if any) should be promoted into the Master Template. Don't promote
silently, and don't forget to ask — it's a standing step of the workflow.

## Master Template model (how masters relate to decks)

- A **Master Template originates in Figma and is implemented in HTML** (`js/templates/`).
  Figma → HTML is the canonical pipeline for master slides.
- The system is built to support **multiple Master Templates**, each a self‑contained
  brand library that **serves as the basis and guidance** for generated decks. Today
  there is exactly one: the v2 module library in `js/templates/`.
- A generated deck is based on **exactly ONE master** (`meta.basedOn`). **Never mix
  templates from different Master Templates** in one deck.
- **Design tokens are attached to each Master Template** and travel with it: a deck inherits
  the token set of the master it's based on. (Today the only master uses `css/tokens.css`;
  any new master must declare/bring its own token set.)

---

## How to generate a deck from a reference (PPT / PDF / images / brief)

1. Put source material under `generate/<Presentation-Name>/source/` (input only; never served).
2. **Extract the content** (for .pptx use the `pptx` skill; render pages to images to read structure).
3. For **each source slide, map it to the closest registered template** in `js/templates/`.
   Reuse aggressively. List the mapping before building.
   **Offer the user a mapping preview first** — a simple text list ("source slide N →
   master slide-NN (name)"), NOT a custom-built HTML comparison page (too slow to produce;
   the user can open the product's **Templates** page (`/templates.html`) themselves to
   see any master slide rendered live).
4. For any slide with **no good match**, build a new **self‑contained** template module
   following `js/templates/_CONTRACT.md` and `Design.md`, reuse shared blocks from
   `js/components.js` (`SectionHeader`, `Chrome`, `Logo`, `Footer`), and set
   `excludeFromMaster: true`. **Confirm with the user** before adding anything to a master.
5. Create the deck **through the product**, not as a repo file — generate from a prompt
   or import the .pptx, then refine in `/editor.html`. The engine picks a template per
   slide (`composeSlides` in `product/domain/generation-service.js`); check its choices
   rather than re-deriving them by hand. Composition (both prompt and import) now runs
   **analyze → plan → compose → review**: it reads what each slide is, plans section
   dividers and dark-slide placement across the whole deck up front, writes/transplants
   content into the chosen templates, then runs a visual review pass that repairs or
   flags defective slides — with live per-stage, per-slide progress on the generation
   record (`GET /api/generations/:id`) for the editor to show a build timeline instead
   of a blank spinner. Importing a `.pptx` now runs a distinct import-compose mode that
   transplants the source deck's own content and images (deduped, recompressed) onto
   matching templates rather than generating fresh copy — the import flow asks
   per‑deck whether to keep the source's own images or use the brand photo library.
6. When generating, **ask which Master Template to base it on** (auto‑pick if only one exists).
7. After the deck is built, **ask whether to promote any new deck‑specific slides into the
   Master Template** (see the permission rule — never promote without asking).

Use the **frontend-design** skill for any new template work — it keeps output distinctive and
on‑brand rather than generic.

## Discover the template library before building (don't guess)

The library holds well over 200 master templates (the exact count is registry‑derived —
see `js/templates/index.js`). To pick the right one, **look — don't invent**:

- Open the brand library visually: the product's **Templates** page (`/templates.html`)
  renders every template live, searchable and filtered by category.
- Slide styling lives in `css/primitives.css` (one stylesheet for the whole
  library). Modules no longer carry their own `css` string — `installTemplateStyles()`
  still exists but injects nothing.
- Shared building blocks: `js/frame.js` (page frame/chrome, used by 222 modules),
  `js/blocks.js`, and the family sets `planning-blocks.js`, `finance-blocks.js`,
  `strategy-blocks.js`.
- Read `js/templates/index.js` (the registry) and each module's `description` + `schema`.

Categories you can reuse (representative — browse for the exact fit):
covers/title, chapter dividers & index/TOC, statements & quotes, executive summaries,
stat grids & "at a glance", timelines/roadmaps/gantt, comparison tables, charts & diagrams,
logo walls ("trusted by" / industry), service/icon grids, team & CV layouts, full‑bleed
photo slides, process/step flows, cards (accent/phase/numbered), and a closing.
Reusable named components: `lead-statement, steps-flow, phase-cards, accent-cards,
numbered-grid, column-lists, layered-system, mockup-signals, comparison-table, context-chain,
flow-and-cards, summary, title, index-toc`.

## When no template fits

Don't silently invent a generic slide. Either (a) compose from existing templates/components,
or (b) propose a new deck‑specific template (`excludeFromMaster: true`) and confirm. Adding to
the brand library always requires explicit permission (see the permission rule).

## Not "AI‑slop" — concrete do / don't (this is what goes wrong on fresh machines)

These rules must hold **even if the `frontend-design` skill isn't installed** on this machine.
A deck that breaks them is wrong, no matter how "clean" it looks.

**Don't:**
- Plain title + centered bullet lists; one generic layout repeated every slide.
- Default/system fonts, or any font other than Equip / Equip Extended.
- Random or default‑blue colors; rainbow palettes; gradients that aren't in the design.
- Accent lines/underlines under titles; full‑width colored header/footer bars or side ribbons.
- Cream/beige backgrounds; drop shadows and rounded "card" clichés that aren't in the templates.
- Inventing a layout when a registered template already covers the content.

**Do:**
- Map each piece of content onto a **registered template**; vary templates across the deck.
- Use **brand tokens** (`css/tokens.css`) and the **mint‑green** accent sparingly and intentionally.
- Keep the **dark title/closing, light content** "sandwich"; left‑align body text.
- Match the type weights and the `SectionHeader` eyebrow→heading pattern the templates use.
- When in doubt, open the **Templates** page and copy how a real brand slide does it.

---

## Brand rules (summary — `Design.md` is the full spec)

- **Fonts:** Equip (body) + Equip Extended (display), self‑hosted in `fonts/` and declared in
  `css/tokens.css`. Never substitute system fonts.
- **Colors (from `Design.md` / `css/tokens.css`):** neutral black `#010716`, white, navy‑500
  `#8893a5` (muted on light) / navy‑300 `#c4c9d2` (muted on dark), **mint‑green `#47d7ac`**
  (signature accent), petrol‑black `#06041f`, the 7‑color caring‑values palette. Use tokens,
  not hardcoded hexes.
- **Type weights:** headings regular/medium (not bold) per the Master Template; card titles /
  table headers medium; the only bold display is intentional (e.g. a lead statement). Match
  slide‑34 / slide‑60 / slide‑62 conventions.
- **SectionHeader** (`js/components.js`): eyebrow = body 24px in the text color (NOT mint),
  heading = Equip Extended regular 48/48, `-1.5` tracking, block at `top:182`.
- Brand assets live in `assets/` (logos, caring‑icons, scribbles, photography, figma exports).
  The icon set is `js/icons.js` (`icon('name')`), 126 brand icons.

Read `Design.md` before authoring visuals. Don't reach for generic palettes or layouts.

---

## Architecture (where things live)

Layered: **tokens → templates → decks → registry (dashboard)**.

```
index.html            Redirect to the product (kept for file:// and serve.py)
render.html           Viewer gateway the product embeds (render.html?id=&slide=)
Design.md             Brand + template spec (READ THIS)
css/tokens.css        Design tokens + @font-face (single source of truth)
css/primitives.css    Type utilities + SectionHeader (.t-hdr) + all .v2f-* styles
js/components.js      Shared blocks: esc, Logo, Footer, Chrome, SectionHeader
js/icons.js           126 brand icons — icon(name)
js/templates/         One module per template + index.js registry + _CONTRACT.md
product/ui/           The product's pages — served AT THE ROOT (see below)
product/export-runtime/  Playwright capture (capture.html) → .pptx / .pdf
docs/                 Architecture, ADRs, export notes, conventions, audits
```

## Running it

One command. The Node server serves BOTH the static engine tree and `/api`, on a
single origin — so there is no second server, no port pairing and no CORS:

```bash
npm start                  # → http://localhost:4600
```

The product's pages are served **at the root**, not under `product/ui/`: `/` is the
product home, and `/editor.html`, `/templates.html`, `/presentations.html`,
`/present.html`, `/login.html` are the real URLs. (`/product/ui/…` still resolves, so
older links keep working.) The **Templates** page browses every brand master slide —
there is no `deck.html` any more; the old deck-authoring tool (dashboard, deck viewer,
wiki, CLI exporter, `js/decks/`) has been deleted, so don't send anyone to those URLs.

It sends `no-store` on every static response, so edits load without a hard refresh.
`serve.py` still exists for serving the engine tree alone, but it is no longer how the
product runs — it cannot answer `/api`.

For colleagues, `Start Studio.command` wraps this: it checks Node, installs on first
run, picks a free port and opens the browser.

## Exporting to PowerPoint / PDF

Export runs **inside the product** — the Export button in the editor — via
`product/export-runtime/` (Playwright drives `capture.html`, then `assemble-pptx.mjs` /
`assemble-pdf.mjs`). There is no `npm run export` and no CLI exporter any more.

**Before changing the exporter, read `docs/EXPORT-NOTES.md`** — it catalogs every known
issue, root cause, fix, and the invariants you must not break.

---

## Critical gotchas — don't reintroduce these bugs

These were each debugged once. They live here so they aren't rediscovered the hard way.

- **Restart the server after changing anything under `product/domain`.** Node loads a module
  once per process. `npm start` serves static files `no-store`, so CSS and browser JS are always
  fresh — which makes a stale server *invisible*: the slides look current because their styling
  is. A long-lived dev server once composed ten test decks with engine code six commits old, and
  the results looked like a clean bill of health for fixes that never ran. `GET /api/meta` reports
  the commit the process booted from; `tools/generate-briefs.mjs` refuses to run when it doesn't
  match `HEAD`. Compare them before trusting any generation result.
- **Verify a detector before acting on what it says.** Every audit in `tools/` has been wrong at
  least once, and each time it pointed a fix at something that was already correct: a centred label
  reported as the library's worst dead space, a chart's own SVG labels reported as 7708px
  off-canvas, background-painted dots counted as empty, a logo `<path>` counted as a hole on all
  169 slides, `notes` skipped as chrome by the very check written for it. Before changing code
  because a number says so, look at the rendered slide. And when a number improves, look again —
  centring a card wall took the dead-space count to zero and made the slides worse.
- **The voice lives in ONE module, and the lint is advisory.** `product/domain/voice.js` holds the
  four tones (`TONES`: thought, board, client, people), `voiceRules(register)` for prompts and
  `HOOK_TASTE`; `docs/VOICE.md` is the human copy. `js/voice-lint.js` (`lintText`, `lintDeck`) is
  pure and shared by browser and server — no Node APIs in it, ever. The voice pass
  (`runVoicePass`) undoes a whole edit set that makes `lintDeck(…).score` worse, and
  `tools/audit-decks.mjs` reports the same findings as kind `voice`. Score both through
  `lintShape` (title + visible words, never `notes`), or the numbers stop being comparable. A low
  score is not good copy — the lint catches hype and repeated rhetoric, not dullness; read the slides.
- **No invented figures — every number on a slide must trace to the material.** The material is the
  prompt (coach answers are folded into it), the references and the brief's `proof`
  (`allowedNumbers` in `product/domain/content-brief.js`); anything else is `untraceable` and is
  stripped after composition AND again after the visual review (a swapped layout can bring the
  template's sample figures back). Exempt by design: list markers ("1.", "02"), structural counters
  up to 12 ("Phase 3"), badge numbers running 1..N, and layout numbers — numeric values under
  `LAYOUT_KEYS` in `content-brief.js` (l/w/top/h, x/y, start/span, lane, at, active…), which place
  things and are never shown. Without that, `main/timeline-02` shipped as an empty gantt on 11
  slides in 20 decks. A template that adds a numeric geometry key needs it in that set; data keys
  (`value`, `values`, `v`, `f`, `share`, `count`) must never go there. Don't "fix" a slide that lost a figure by letting the model supply one —
  the old pipeline put 466 invented numbers on ten decks this way. Speaker notes are not checked.
- **The hook is a marker, not a position.** The outline marks it `role: "hook"`; `markHook` puts the
  mark on slide 2 when the user wanted a hook and the outline marked none (decks of 3+), and strips
  every mark when they didn't. The mark must survive to the stored slide (composeSlides and
  `presentation-service` copy `role`) — the `hook` audit kind reads it there, together with the
  generation's `wantsHook`. Hook layouts are limited to `HOOK_TEMPLATES`. Drop the field anywhere
  in the chain and the hook silently becomes an ordinary slide.
- **References are read by id, twice, and stay in their workspace.** `/api/references` stores the
  extracted text (`reference-service`); the generation keeps only `referenceIds` (max 10) and
  re-reads the text at approval, so a deleted reference is a warning, not a crash. Their figures
  join the allowed set. Images are described by a sandboxed CLI call (temp dir + `Read(//<dir>/**)`
  only) — never widen those flags. `tools/generate-briefs.mjs --refs <dir>` attaches a folder.
- **Reveal animation animates `translate`, NOT `transform`.** The `.reveal` entrance keyframe
  (`rise` in `css/deck.css`) must animate the independent `translate:` property. Many templates
  use `transform: translate(-50%,-50%)` / `translateY(-100%)` for layout; if the animation used
  `transform` it overrides them and content flies off‑frame. Don't switch it back to `transform`.
- **Dev server must be no‑cache.** `npm start` already sends `no-store`. Never serve the
  tree with `python -m http.server` (it caches ES modules/CSS, so edits "don't show up"
  until a hard refresh — looks like a bug).
- **Headings are regular/medium, not bold.** Follow the Master Template weights (slide‑34/60/62):
  body‑regular headings, medium card titles/table headers. Only a deliberate lead statement is bold.
- **Header and footer are one component, everywhere.** Every family renders the Figma
  "Header" via `topBar()` and the "Footer" via `footerBar()` (`js/frame.js`): an 84px
  header (64px logo row + 20px padding + 1px divider at 50%, divider at y=124), content
  starting 32px below it (y=156, enforced by `--v2f-gap` on `.v2f-root`), and the footer at
  y=996–1040 reading "Presentation Name / Prepared for [Client] / © 2026". Never draw a
  custom logo row or footer in a template — use `topBar(meta, { logoOnly:true })` for the
  logo-only variant. Slides without a header/footer in Figma simply omit them.
  - **32px, measured.** "Enforced by `--v2f-gap`" only held where the header is a direct
    child of `.v2f-root`; in side columns and cover rows page headers sat 8px under the rule,
    and in the portfolio family 40px. `node tools/audit-header-gap.mjs` measures every
    template; drifts are corrected in the "Header → content" block at the end of
    `css/primitives.css`. Run it after building or changing a template.
  - **The meta never ellipsises.** When "studio | deck title | page" does not fit the column
    the header sits in, the header is the logo alone (`metaWidthClass` in `js/frame.js` + the
    `v2f-topline` container queries). Don't reintroduce `text-overflow` on the title.
- **The PageHeader caption is context, never a counter.** It's the eyebrow above a title —
  an area, theme or workstream — or empty. Generation used to stamp "N / M" on every slide
  (`reindexSlides`); it now strips counters, and the fill prompt says so. Chapter `number`s
  on dividers are counted through the deck (01, 02, 03), not left at the example's "01".
- **A template's example must never ship as content.** A field the model leaves out is
  filled from the example on merge, so a chart picked for a slide with no figures used to
  ship the sample bars ("$120M", "Q1 24", "Segment 1"). `exampleEcho` (generation-service)
  swaps to the next shortlisted layout or blanks the sample; `isEcho` makes the repair pass
  ask again; `tools/audit-decks.mjs` reports `example-data`, `object-text`,
  `counter-caption` and `partial-pages`. Prose may hold paragraphs separated by a blank
  line — `:where(.stage p)` is `white-space: pre-line`.
- **Copying slides between project folders must include the CSS.** The v2 → v1 sync once
  missed 353 `.v2f-mn-*` rules in `css/primitives.css` (Main batches 6–9) and an asset, so
  those Main slides rendered unstyled. After any sync, diff the stylesheet rules and
  `assets/`, not just `js/templates/`.
- **Scaling:** the stage is a fixed 1920×1080 canvas scaled via `transform: scale()` on `#viewport`
  (`js/engine.js`); author at literal px, never with viewport units.
- **Namespace inner class names.** Slides render inside app pages whose `app.css`/`deck.css`
  style bare `.nav`, `.btn`, `.stage`, `.card`, `.lbl`, `.logo`. A template child with one of
  those names inherits app padding/max-width (the social phone-mockup tab bars collapsed this
  way). Use names like `.tabbar`/`.abtn`, and check new templates in the Templates page preview,
  not only the export capture page (which loads no app CSS).
- **Dark mode — check both audits, and check inside the Templates page.** `npm run audit:dark` runs the text-contrast audit (dark + light) and `tools/audit-dark-vanish.mjs`, which compares light vs dark renders (photos hidden) and flags lines, tiles and logos that disappear in dark; the contrast audit cannot see those. Rules that worked: neutral fills INVERT (black tile → white tile with dark ink; petrol → white; greys → same alpha of white; mint tint → #205463), a hard-coded SVG `stroke`/`fill` needs a dark-only attribute rule, fixed brand colours keep fixed ink, and dark-native slides (`.v2f-dark`) must be excluded from dark-mode inversions. The Templates page loads app CSS, so a slide can look right on the capture page and break there (`.panel`, `.chip`).
- **Editing Figma components with `use_figma`:**
  - **A failed script can partially commit.** Errors raised inside the API, such as "Component set has existing errors", have left deleted properties behind. Snapshot instance text first, and end every migration with `if (changed) throw new Error("ROLLBACK…")`. A `throw` of your own does roll back.
  - **Rename a variant only after moving it out of its old set.** Move it to the page first, then rename it, then append it to the new set. Renaming it in place garbles the name.
  - **Combining variants from different sets breaks the new set.** Append them into an existing set instead.
  - **Binding a text layer to a new property** sometimes keeps instance text and sometimes resets it to the default. Restore every instance through `setProperties` and verify.
  - **Layers hidden by a property in an instance are invisible to `findAll`.** When restoring, treat "not found" as "toggle off".
- **Exporter:** the product exports via `product/export-runtime/`. Before changing it — or the
  deprecated CLI exporter — read `docs/EXPORT-NOTES.md`: it catalogs
  every known issue, root cause, fix, and the invariants not to break.

## Skills & cross‑machine consistency

- Output quality should NOT depend on a skill being installed. The brand rules above are the
  source of truth. When available, **use the `frontend-design` skill** for new template work and
  the **`pptx` skill** to read source .pptx files — but if a machine lacks them, still follow this
  file. If decks look generic on a given laptop, the usual cause is that this `CLAUDE.md` (or the
  templates) isn't present there, or a skill the session relied on isn't installed.
- Figma MCP (used to build templates from frames) may be absent on other machines — that's fine
  for **reusing** templates (the common case). Only building brand‑new templates from Figma needs it.

## Keep this knowledge portable

These rules used to live only in a session's local memory, which does **not** travel between
machines — that's why other laptops produced off‑brand decks. Now they live here, in the repo.

- When you establish a new convention or fix a recurring mistake, **write it into this file**
  (or `Design.md`), not just session memory.
- Recommend the project be a **git repository** so every machine shares the same `CLAUDE.md`,
  templates, and notes (`git init` + commit; ideally a shared remote). Without git, each laptop
  has a divergent copy.
- `docs/CHANGELOG.md` gets a dated entry whenever a feature ships. (The old in-app wiki
  has been deleted.)
