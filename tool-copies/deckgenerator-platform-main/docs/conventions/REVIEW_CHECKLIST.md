# Review checklist

Run through this before calling any change finished. It's split into two tiers:
**always** (every change) and **conditional** (only when the change touches that
area). Most items exist because they were debugged once — see the "why" in
parentheses; if you don't know why a rule exists, that's a reason to go read the
source it points to, not to skip it.

## Always

- [ ] Ran it in a real browser via `npm start` — not just read the
      diff. (This is a visual, browser-rendered system; a correct-looking diff can
      still render wrong.)
- [ ] No hardcoded colors/fonts where a token in `css/tokens.css` already covers
      the value. (Design.md / CLAUDE.md: tokens are the single source of truth.)
- [ ] Docs updated if behavior, architecture, or a convention changed (see
      `.ai/AGENTS.md` → Future Development Contract → Document).
- [ ] No `.git`-destructive commands run without checking `git status` first, if
      a `.git` directory exists at all.

## If you touched `js/templates/*.js` (a template module)

- [ ] Follows `js/templates/_CONTRACT.md` exactly: default export shape, exact px
      from Figma (not rounded/approximated), scoped CSS with every selector
      prefixed `.t-<name>__`.
- [ ] `chrome: true` unless the frame's logo/footer is genuinely non-standard —
      and if `chrome:false`, you rendered a logo/footer yourself.
- [ ] Interpolated text passed through `esc()`.
- [ ] Entrance-animated blocks use class `reveal`, and you did **not** touch the
      `rise` keyframe in `css/deck.css` to animate `transform` instead of
      `translate` (breaks every template that uses `transform` for layout —
      see `CLAUDE.md` gotchas).
- [ ] Headings are regular/medium weight, matching slide-34/60/62 conventions —
      not bold, unless this is a deliberate lead-statement-style slide.
- [ ] New template registered in `js/templates/index.js` (import + `modules[]`).
- [ ] If not explicitly approved for the brand library, the module sets
      `excludeFromMaster: true`. If it *was* approved, confirm the user actually
      said so in this conversation — not inferred.

## If you touched `js/decks/<slug>.js` (a deck)

- [ ] Every slide's `template` value maps to a name in `js/templates/index.js` —
      not an invented layout.
- [ ] Deck picks exactly one `meta.basedOn` master; no templates from a different
      master are used.
- [ ] `meta.id` is unique across `js/decks/index.js`.
- [ ] Deck imported and added to `presentations` in `js/decks/index.js`, so it
      appears on the dashboard.
- [ ] If the deck came from `generate/<name>/source/`, you offered a mapping
      preview (source slide N → template) before building, per `CLAUDE.md`.

## If you touched `js/export.js`, `export.html`, or `tools/export-pptx.mjs`

- [ ] Read `tools/EXPORT-NOTES.md` first, in full — not skimmed.
- [ ] Did not violate any of the four invariants at the top of that file
      (transparent capture surface, isolated captures, absolute line-spacing,
      pre-baked wrapping).
- [ ] Re-exported **a light deck and a dark deck** (e.g. `main-template` and
      `assa-abloy-connect`) and visually compared output, per that file's
      pre-ship checklist.
- [ ] Spot-checked: a logo wall (masks), a circle/Venn slide (ovals), a bulleted
      list, a full-bleed photo, a dark title slide, the closing 3D-logo slide.
- [ ] Added any newly discovered issue to the `tools/EXPORT-NOTES.md` issue
      catalog (symptom → root cause → fix) rather than leaving it as tribal
      knowledge in this conversation.

## If you touched `css/tokens.css`, `Design.md`, or brand primitives

- [ ] Change is reflected in **both** `Design.md` (the YAML+prose spec) and
      `css/tokens.css` (the CSS custom properties) — they must not drift apart.
- [ ] Did not introduce a new color/font outside Equip / Equip Extended and the
      documented palette.

## If the change is architectural

- [ ] A new ADR was added under `docs/ADR/` (own file, not appended to an
      existing one) with Status/Context/Decision/Consequences/Confidence.
- [ ] `docs/ARCHITECTURE.md` updated to reflect the new shape.
- [ ] `docs/CHANGELOG.md` and (per `CLAUDE.md`) `wiki.html`'s in-app version
      history both got an entry.
