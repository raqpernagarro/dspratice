# Template module contract (v2)

This is the shape every module in `js/templates/` must satisfy. It is enforced by
`npm run templates:check` (see **Onboarding workflow** below), not just described here —
if the validator and this file ever disagree, trust the validator
(`tools/validate-templates.mjs`) and fix this file.

## Module shape

One file per template, named `family-slug.js` (e.g. `core-divider-single.js`), exporting
a single default object. Fields:

| Field | Type | Meaning |
|---|---|---|
| `name` | string | `"family/slug"` — must match the filename (`family-slug.js` → `"family/slug"`). Unique across the library. |
| `family` | string | One of the existing families (`core`, `main`, `portfolio`, `finance`, `planning`, `strategy`), or a new one — a new family needs no engine registration; new roles/shapes do (the validator tells you). Must be the same string as the prefix in `name`. |
| `role` | string | Content kind (`content`, `cards`, `gallery`, `chart`, `quote`, `table`, `toc`, `cover`, `divider`, …). Drives categorization — see **Taxonomy rule** below. |
| `shape` | string | Layout shape (`single`, `grid`, `timeline`, `rows`, `wall`, …). Must be a known shape — see **Taxonomy rule**. |
| `theme` | `"dark"` \| `"light"` | Which palette the slide renders in. |
| `media` | `string[]` | Media-type tags, e.g. `[]` or `["photo"]`. **Always an array, even when empty** — not a single string. |
| `capacity` | `{ items, min, max }` | Non-negative integers with `min <= items <= max`. How many repeatable content items (cards, rows, photos, …) the layout holds. |
| `slots` | object | Subset of the seven known keys — `images, titles, subtitles, body, stats, icons, list` — each a non-negative integer count. Only declare the slots the template actually uses. |
| `description` | string | One line, shown in the Templates page gallery card. |
| `use` | string | One line: when to reach for this template over another. |
| `schema` | object | Prose field descriptions, one per key the template's content accepts (e.g. `"title": "string — section header"`). This is what the editor reads to decide each field's input kind — keep it accurate. |
| `example` | object | Real, renderable content for the field set in `schema` — not placeholder lorem ipsum. Any asset path referenced must exist on disk. |
| `render(s, ctx)` | function | Returns the slide's inner HTML string. `s` is the slide content (matching `schema`/`example`); `ctx` is `{ deck, esc }`. |

Optional fields some modules carry (`slide`, `figmaNode`, `chrome`) are provenance/layout
hints, not part of the enforced contract.

### Minimal real example

Abridged from the actual `core/divider-single` module (`js/templates/core-divider-single.js`):

```js
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

export default {
  name: "core/divider-single",
  family: "core",
  role: "divider",
  shape: "single",
  theme: "light",
  media: [],
  capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 0, titles: 1, body: 0, stats: 0, icons: 0 },
  description: "core/divider-single — big section number + header, full slide.",
  use: "A chapter / section divider: a large section number and title marking a new part of the deck.",
  schema: {
    number: "string — section number (e.g. 01)", title: "string — section header",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    number: "01", title: "Section header",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "82" },
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-cover-row reveal">
          ${topBar(s.meta)}
          <div class="v2f-biglist">
            <div class="v2f-bigrow">
              ${s.number ? `<span class="num">${esc(s.number)}</span>` : ""}
              <span class="lbl">${esc(s.title ?? "")}</span>
            </div>
          </div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
```

## Styling

Modules carry **no `css` field** — that's a dead v1 idea. All slide styling lives in the
single shared stylesheet `css/primitives.css`, via the `v2f-*` primitive classes (and the
family-specific block sets `planning-blocks.js`, `finance-blocks.js`, `strategy-blocks.js`,
`js/blocks.js`, `js/frame.js` for shared chrome/layout). Reuse those classes instead of
writing new ones.

If a genuinely new visual pattern is needed, append a new
`/* ---- <family> ---- */` section at the **end** of `css/primitives.css` — don't scatter
new rules mid-file, and don't reopen an existing family's section.

The `type-*` utilities (`type-mega`, `type-hero`, `type-h3`, …) are historical leftovers
from the v1 per-module-css era. Don't use them in new work; prefer the `v2f-*` primitives
and the shared component blocks.

## Taxonomy rule

`role` and `shape` are not free text — the validator checks them against the engine's own
tables, and a value the engine doesn't know about means the template silently never gets
offered or correctly categorized:

- `role` must be a key in `ROLE_CATEGORY` (`product/domain/template-service.js`) — this is
  what groups the template on the Templates page.
- `role` must **also** appear in `ROLE_AFFINITY` (`product/domain/template-scoring.js`) —
  this is what lets the generation engine choose the template for matching content —
  **except** `cover`, `closing`, and `contact`, which the engine places by deck *position*
  (first/last slide) rather than content affinity, and are legitimately absent from
  `ROLE_AFFINITY` while still required in `ROLE_CATEGORY`.
- `shape` must be a member of `KNOWN_SHAPES` (`product/domain/template-scoring.js`).

`npm run templates:check` names exactly which table is missing which value — read the
error, don't guess. Adding a new role or shape means adding it to the relevant table(s) in
`product/domain/`, which is a deliberate engine change (and, for a new role in
`ROLE_AFFINITY`, a judgment call about which content signals it should win on).

## Intent card

`role`, `shape` and `capacity` say what a layout *is*; they do not say what it is *for*, and
eleven templates share the same three values. The `intent` card says it, in the words an
outline would use:

```js
intent: {
  bestFor:   ["clients, partners or certifications shown as logos"], // the content it serves
  holds:     "8–24 organisation names or logo files; no heading",    // what fits, incl. item length
  itemChars: 30,          // longest list item that fits (list layouts only; optional otherwise)
  avoid:     ["questions, sentences or descriptions"],                // content it presents badly
  feel:      "visual",    // dense | airy | visual | data | statement
  needs:     ["logo files or recognisable organisation names"],       // [] when nothing is needed
}
```

How it is used:
- The layout-choice prompt shows each candidate's `bestFor`, `avoid` and `feel`.
- The scorer applies a strong penalty when a list's longest item exceeds `itemChars`.
- `avoid` is guidance for the model, not a hard exclusion (an exclusion could leave a slide
  with no candidate at all; the content-retention check covers the worst cases).

Write the card from the rendered slide and its Figma frame, never from the name alone. The
validator checks every card's shape, and refuses a template without one in any family listed
in `REQUIRE_INTENT` (`tools/validate-templates.mjs`). Add a family there once all its
templates have cards; the list grows as categories are built or backfilled.

## Retiring a template (`replacedBy`)

Don't delete a template that saved decks use — their slides would stop
rendering. Give it `replacedBy: "<family/slug>"` instead, naming the live
template that takes its place (a duplicate layout, or a rename in Figma):

```js
name: "portfolio/grid-14",
replacedBy: "portfolio/grid-09",
```

A retired template still renders for the decks that have it, but is never
offered for anything new — not in layout choice, not in the Templates gallery,
not as an editor swap (`product/domain/live-templates.js`). The validator checks
that `replacedBy` names a registered template that is not itself retired, and
does not require an intent card on it. A template no saved deck uses can simply
be deleted.

## Onboarding workflow

This is the sequence for dropping new template modules into the library (e.g. landing a
batch from a fresh Figma export):

```
1. Copy module files into js/templates/   (family-slug.js naming)
2. npm run templates:check                (registers + validates; fix reds)
3. npm start, then in another terminal:
   node tools/audit-dark-mode.mjs --missing
4. Open /templates.html and eyeball the new family
5. Commit js/templates/ + js/dark-safe.json + index.js together
```

Notes on each step:

- **Step 2** runs `templates:index` (regenerates the registry) then `templates:validate`
  (runs every module through the contract checks above). It also warns — but doesn't
  fail — about any template not yet covered by a dark-mode audit.
- **Step 3** requires the studio running (`npm start`) because the audit renders each
  slide in a real browser. `--missing` only audits templates absent from
  `js/dark-safe.json`, so it's safe to re-run after every drop — it merges into the
  existing file rather than re-auditing everything. Add `--strict` to fail (exit 1) if
  it finds an unsafe slide. The `npm start` from step 2 already covers this — no
  restart needed here, because the audit's capture page (`product/export-runtime/
  capture.html`) loads template modules fresh in the browser, unlike the server process.
- **Restart `npm start` after step 2, before trusting `/templates.html` or
  `/api/templates`.** The running server process caches `js/templates/index.js` from
  the moment it booted; `templates:check` regenerates that file on disk, but the live
  server keeps serving its stale in-memory copy of the registry until restarted. The
  audit in step 3 is unaffected (see above), but the Templates page and API will show
  the old library — restart before eyeballing the new family in step 4.
- **Step 4** is a human sanity check — the validator and dark audit catch structural and
  contrast problems, not "does this look like a stock AI slide."

## Do not hand-edit `js/templates/index.js`

It is **generated** by `npm run templates:index` (`tools/generate-template-index.mjs`),
which scans every `family-slug.js` file in this directory, imports it to read `name`/
`family`, and writes the import list and registry map back out, grouped by family. Any
manual edit to `index.js` is overwritten the next time that script runs — add or remove a
module by adding or removing its file, then regenerate.
