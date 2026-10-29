> **⚠️ Historical — describes a superseded version of this product.**
>
> Kept for the reasoning it records, not as instructions. It predates the current
> product and refers to things that no longer exist (a two-server `serve.py` setup,
> `js/decks/` data files, `deck.html` / `wiki.html`, a 91-template library).
>
> For how the system works today: [`CLAUDE.md`](../CLAUDE.md) and
> [`Design.md`](../Design.md). For the exporter: [`EXPORT-NOTES.md`](EXPORT-NOTES.md).

# Roadmap

*Current implementation, technical debt, future improvements, and ideas are kept
strictly separate below — do not blur "what exists" with "what's proposed."
Evidence for each debt item is cited so it can be re-verified against the code
rather than taken on faith.*

## Current implementation (what exists today, verified against the code)

- Static ES-module app, no build step, served by `serve.py` (no-cache dev server).
- 91 templates mapped to Figma frame numbers 1–91 (`title.js` = slide 1,
  `summary.js` = slide 14, `slide-02-*.js` … `slide-91-*.js` = the rest) plus
  12 general-purpose reusable templates not tied to a frame number
  (`lead-statement`, `steps-flow`, `phase-cards`, `accent-cards`,
  `numbered-grid`, `column-lists`, `layered-system`, `mockup-signals`,
  `comparison-table`, `context-chain`, `flow-and-cards`, `index-toc`) — **103
  registered template modules** across 105 files under `js/templates/` (103
  modules + `index.js` + `_CONTRACT.md`), confirmed by counting both the
  directory listing and `index.js`'s `modules` array.
- One Master Template (`main-template`, `js/decks/masters.js`), auto-built from
  every non-`excludeFromMaster` template.
- One presentation deck (`assa-abloy-connect`), plus example outputs for it and
  `main-template` already generated in `outputs/`.
- Full PPTX + PDF export pipeline (`tools/export-pptx.mjs`), with a documented
  issue catalog of 15 previously-fixed export bugs (`tools/EXPORT-NOTES.md`).
- Brand spec (`Design.md`) and brand asset library (`assets/`: logos, caring
  icons, scribbles, 209 photos, Figma-exported per-frame assets).
- In-app guide (`wiki.html`) with its own "Version history" section, currently
  at v1.4 (Jun 2026).
- `README.md`, `CLAUDE.md` (mirrored at root `AGENTS.md`) as the pre-existing
  documentation layer this onboarding pass supplements, not replaces.

## Technical debt (real gaps in the current implementation)

- **No automated tests of any kind.** No test files, no test runner in
  `package.json` (only `setup`/`export` scripts exist). Correctness relies on
  contract documents + manual visual QA. Confirmed: `package.json` has no
  `test` script; no `*.test.js`/`*.spec.js` files found in the repo.
- **No CI/CD.** No `.github/` directory, no other CI config found. Every
  validation step (`tools/EXPORT-NOTES.md`'s QA checklist) is manual.
- **No git repository initialized** in this working copy (`git status` fails —
  no `.git`). `CLAUDE.md` already flags this as the reason knowledge doesn't
  travel between machines; it also means there is no local safety net (stash,
  diff-before-overwrite, blame) for any change made here.
- **`js/templates/index.js` is manually maintained despite being labeled
  "GENERATED."** Its header comment says "Regenerate by re-scanning the folder
  if you add modules manually," but no script that does this scan exists
  anywhere in `tools/` or `package.json`. In practice every new template
  requires a hand-added `import` + array entry, with no tooling to catch a
  forgotten one (the only symptom is `getTemplate()` throwing at render time).
- **Template `schema` is documentation only, not validated.** A deck slide with
  a misspelled or missing field fails silently (content just doesn't render) or
  throws deep inside a template's `render()`, not at a clear boundary.
- **Exporter performance is only "acceptable," not fast.** ~2 minutes and ~55MB
  for the 91-slide master at `--scale 2` (per-element screenshots dominate).
  `tools/EXPORT-NOTES.md` treats this as expected rather than a bug, but it is
  a real ceiling on how large a deck can comfortably be exported.
- **Documentation/reality mismatch on `outputs/`.** `README.md` and `wiki.html`
  both state `outputs/` is "git-ignored," but there is no `.gitignore` file in
  the repo (verified) and no `.git` directory at all — the statement describes
  an intended future state (once this becomes a git repo) as if it were
  current fact.
- **`AGENTS.md` and `CLAUDE.md` at the repo root are near-duplicate files**
  (the only diff is two self-referential filename mentions), kept in sync by
  hand. Nothing enforces they stay identical; a future edit to one and not the
  other would silently reintroduce the cross-machine drift problem `CLAUDE.md`
  was written to solve.
- **`generate/DAS-Lufthansa-*` folders don't follow the documented convention.**
  `generate/README.md` specifies `generate/<name>/source/<files>` +
  `generate/<name>/render/`; the three `DAS-Lufthansa-*` folders instead have a
  single `.pptx` sitting directly in the named folder, no `source/` subfolder,
  and no corresponding deck exists yet in `js/decks/`. This reads as
  in-progress/unprocessed input material, not a bug, but it's inconsistent with
  the one processed example (`ASSA-ABLOY-Connect-Experience`, which does follow
  the convention and has a matching deck).
- **`issues/` is an empty, unexplained folder** (only a macOS `.DS_Store`
  inside it — no README, no tracked files). Unclear from the repo alone
  whether this is scaffolding for a future issue-tracking convention or
  leftover cruft; flagged here as an unknown rather than guessed at (see
  "Unknowns" in the onboarding final report).

## Future improvements (natural next steps, not yet committed)

- **A real generator/checker for `js/templates/index.js`** — a script that
  scans `js/templates/*.js` and verifies (or rewrites) the import list, closing
  the debt item above.
- **A second Master Template.** `js/decks/masters.js` already has a commented-out
  example (`"minimal"`) — the scaffolding exists, no templates are tagged for
  it yet.
- **Building the pending `DAS-Lufthansa-*` decks** from their source PPTX files,
  following the same mapping workflow used for `assa-abloy-connect`.
- **Turning this directory into an actual git repository**, per `CLAUDE.md`'s
  own recommendation, so `CLAUDE.md`/`docs/`/`.ai/` travel with the project
  instead of living only on whichever machine last edited them.
- **Lightweight schema validation** at the deck→template boundary (even just a
  dev-mode console warning for a field the template's `schema` doesn't
  recognize) to turn silent content-drop into a visible signal.

## Ideas (speculative — lower confidence, not scoped)

- Automated visual-regression testing for the exporter (screenshot-diff
  `pptx-NN.jpg` vs `html-NN.jpg` per `tools/EXPORT-NOTES.md`'s manual QA
  process, currently done by ad hoc subagents) to catch export regressions
  without a full manual pass.
- A CLI or script to validate that every deck's `template` references resolve
  via `getTemplate()` and every `basedOn` references a real master id, as a
  pre-flight check before export.
