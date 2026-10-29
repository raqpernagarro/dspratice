> **⚠️ Historical — describes a superseded version of this product.**
>
> Kept for the reasoning it records, not as instructions. It predates the current
> product and refers to things that no longer exist (a two-server `serve.py` setup,
> `js/decks/` data files, `deck.html` / `wiki.html`, a 91-template library).
>
> For how the system works today: [`CLAUDE.md`](../CLAUDE.md) and
> [`Design.md`](../Design.md). For the exporter: [`EXPORT-NOTES.md`](EXPORT-NOTES.md).

# Development guide

*How to extend this project without breaking its invariants. For what the
system is, see `PROJECT_CONTEXT.md`; for why it's shaped this way, see
`ARCHITECTURE.md`. For the non-negotiable brand/workflow rules, `../CLAUDE.md`
is authoritative and takes precedence over anything here if they conflict.*

## Running it locally

```bash
python3 serve.py 4599
```
Open `http://localhost:4599`. Always use `serve.py`, never `python -m
http.server` — the latter caches ES modules/CSS and edits won't show up without
a hard refresh (see `ARCHITECTURE.md` → `serve.py`).

No `npm install` is needed to just view/edit decks — only the exporter needs
Node dependencies:
```bash
npm install && npx playwright install chromium   # one-time, only for export
```

## Extending the system — by task

### Add a new slide to an existing deck
1. Open `js/decks/<slug>.js`.
2. Browse `deck.html?id=main-template` (every template, in order) or
   `js/templates/index.js` to find a template that fits the content.
3. Add `{ template: "<name>", theme: "dark"|"light", ...fields }` to `slides[]`,
   matching that template's `schema` (read the template file — schema is
   documentation, not runtime-validated, so a typo'd field just silently
   doesn't render).
4. Reload the deck in the browser (no rebuild needed).

### Add a brand-new deck (presentation)
1. If working from a reference file (PPTX/PDF/images), put it under
   `generate/<Presentation-Name>/source/` first — `generate/` is input-only and
   never served (see `generate/README.md`).
2. Follow `CLAUDE.md`'s deck-generation workflow: extract content, map each
   source slide to the closest registered template, **offer the mapping as a
   text list before building**. This step exists so a human can catch a bad
   template match before 15 slides get built on it.
3. Create `js/decks/<slug>.js` — copy the shape of `js/decks/assa-abloy-connect.js`:
   `meta.id` (unique), `meta.kind: "presentation"`, `meta.basedOn: "<masterId>"`,
   `title`, `description`, `created`, `footer` defaults, `slides[]`.
4. Import it and add it to `presentations` in `js/decks/index.js`. It now
   appears on the dashboard automatically with a live thumbnail.
5. If a slide had no good template match, see "Add a new template" below —
   **do not invent an ad-hoc layout inline in the deck file.**

### Add a new template
1. Confirm no existing template already covers this content shape — reuse is
   the default; a new template is the fallback.
2. Follow `js/templates/_CONTRACT.md` exactly: exact px from the Figma frame
   (if working from Figma), the default-export shape (`name`, `slide`,
   `theme`, `chrome`, `schema`, `example`, `render()`, `css` with every
   selector prefixed `.t-<name>__`).
3. Set `chrome: true` unless the frame's logo/footer placement is genuinely
   non-standard.
4. Set `excludeFromMaster: true` **unless the user has explicitly approved**
   adding this to the brand library in this conversation. This is the single
   rule most likely to be gotten wrong — see `CLAUDE.md`'s permission rule and
   `ADR/0004-master-template-governance.md`.
5. Add the import + registry entry in `js/templates/index.js`.
6. If it has an `example`, it now appears automatically in whichever Master
   Template deck its `excludeFromMaster`/`masters` tagging selects it into.

### Add a second Master Template
1. Add an entry to `js/decks/masters.js`: `id`, `title`, `description`,
   `created`, `footer`, and an `includes(template)` predicate — typically
   `(t) => (t.masters || []).includes("<id>")`.
2. Tag the templates that belong to it with `masters: ["<id>"]` in their module.
   A template can belong to multiple masters.
3. `js/decks/main-template.js` will auto-build its deck — no other code
   changes needed. It appears on the dashboard's "Master Templates" section.
4. When generating a new deck, ask the user which master to base it on if more
   than one exists (per `CLAUDE.md`).

### Change a brand token (color, font size, spacing)
1. Edit `css/tokens.css` **and** `Design.md` together — they must not drift
   (`Design.md`'s YAML frontmatter is the normative spec; `tokens.css` is its
   CSS implementation).
2. Grep for the old value across `js/templates/*.js` before assuming every
   template already uses the token — some hand-written px values that happen to
   match a token value may not actually reference the CSS variable.

### Change the exporter
**Read `tools/EXPORT-NOTES.md` in full before touching `js/export.js`,
`export.html`, or `tools/export-pptx.mjs`.** It documents four hard invariants
and fifteen previously-fixed issues; breaking an invariant reintroduces a
deck-wide bug class (e.g. every dark slide gets white boxes). After changing
anything, run the QA checklist in that file (export a light deck and a dark
deck, spot-check masks/ovals/bullets/full-bleed/dark-title/closing-logo slides).

## Conventions to hold the line on

- **Headings are regular/medium weight**, not bold — match slide-34/60/62.
  Bold is reserved for a deliberate lead-statement-style slide.
- **`.reveal` entrance animation animates `translate`, not `transform`.**
  Templates use `transform` freely for layout (centering, anchoring); the
  `rise` keyframe in `css/deck.css` must keep using the independent `translate`
  CSS property so it doesn't fight a template's layout transform.
- **1920×1080, absolute positioning, literal px.** Never use viewport units
  (`vw`/`vh`/`%` of window) inside a template — the whole system depends on
  every template being pixel-exact at a fixed virtual resolution, scaled
  uniformly afterward by `engine.js`.
- **Escape interpolated text** with `esc()` from `js/components.js` — templates
  build HTML via string interpolation, not a templating engine with
  auto-escaping, so this is the only XSS/HTML-injection guard.
- **`chrome: true` is the default; the engine paints it, not the template.**
  Rendering your own logo/footer while also leaving `chrome: true` double-paints
  it.

## Things that will surprise you if you don't know them

See `../CLAUDE.md` → "Critical gotchas" for the canonical list (server caching,
the `reveal`/`transform` conflict, heading weights, the fixed-scale canvas, and
exporter changes). That section is kept in the root `CLAUDE.md` specifically
because it's the file every session reads regardless of which machine it's on —
treat additions to it as higher-priority than adding the same note here.

## What "done" looks like

Before considering a change finished, go through `docs/conventions/REVIEW_CHECKLIST.md`. At
minimum: you ran it in a real browser, and if you touched docs-worthy behavior,
the relevant doc got updated in the same change (see `.ai/AGENTS.md` → Future
Development Contract).

## Working without git

This working copy has no `.git` directory. `CLAUDE.md` recommends turning it
into a git repository so its own contents (and this `docs/`/`.ai/` structure)
travel with the project to every machine — without that, changes made here
exist only locally. If you're about to do anything destructive (overwrite a
file, restructure `js/decks/`), there is no version-control safety net in this
state; be correspondingly more careful, or suggest `git init` first.
