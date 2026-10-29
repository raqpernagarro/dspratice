# How AI assistants should work in this repository

This file is operational: it governs *how* an AI assistant does engineering work
here (research → plan → implement → validate → document). It does **not** repeat
the brand/deck-generation rules — those live in `/CLAUDE.md` (also mirrored at
`/AGENTS.md` at the repo root for tools that only read that filename) and are
**authoritative and non-negotiable** for anything touching slides, templates, or
decks. Read this file for engineering process; read the root `CLAUDE.md` for
brand/product rules. When the two overlap, `CLAUDE.md` wins.

Companion documents:
- [`docs/PROJECT_CONTEXT.md`](../docs/PROJECT_CONTEXT.md) — what this system is, in ten minutes.
- [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) — how it's built and why.
- [`docs/DEVELOPMENT_GUIDE.md`](../docs/DEVELOPMENT_GUIDE.md) — how to extend it safely.
- [`docs/ROADMAP.md`](../docs/ROADMAP.md) — current state vs. debt vs. ideas.
- [`docs/CHANGELOG.md`](../docs/CHANGELOG.md) — append-only history.
- [`docs/ADR/`](../docs/ADR/) — one file per architectural decision.
- [`docs/conventions/REVIEW_CHECKLIST.md`](REVIEW_CHECKLIST.md) — what "done" means before you say so.
- [`docs/conventions/REVIEW_CHECKLIST.md`](TASK_TEMPLATE.md) — the shape of a well-formed task.

## Ground truth order

1. **The code** is ground truth for *what exists*. Never describe a template,
   function, or flag from memory — read the file.
2. **`CLAUDE.md`** is ground truth for *brand and workflow rules* (templates,
   masters, permission gates, gotchas).
3. **`docs/`** is ground truth for *why the architecture looks the way it does* —
   but docs can go stale. If `docs/` and the code disagree, the code wins; fix the
   doc in the same task, don't just proceed on the stale description.
4. **Session memory** (chat history, prior conversations) is not ground truth for
   anything durable. If something learned in a session should survive it, it
   belongs in one of the files above, not only in memory.

## The Future Development Contract

Every non-trivial change follows this sequence. Skipping steps is how this repo
would drift back into undocumented, inconsistent state.

```
Understand → Plan → Implement → Validate → Document → Update ADRs (if
architecture changed) → Append CHANGELOG → Finish
```

- **Understand** — read the affected module(s) end to end (see `ARCHITECTURE.md`
  for the map). Read `_CONTRACT.md` before touching `js/templates/`, and
  `tools/EXPORT-NOTES.md` before touching `js/export.js` / `export.html` /
  `tools/export-pptx.mjs`.
- **Plan** — for anything bigger than a one-file fix, write down the approach
  before editing code. For deck generation specifically, `CLAUDE.md`'s workflow
  ("map source slides onto registered templates", offer a mapping preview) *is*
  the plan step — follow it.
- **Implement** — small, reviewable changes. Don't refactor unrelated code while
  implementing a feature.
- **Validate** — run it. This is a browser-rendered system with no automated test
  suite (see `docs/ROADMAP.md` → Technical debt): validation means starting
  `npm start` and looking at the actual page/deck/export output, not
  just reading the diff. For exporter changes, follow the QA checklist in
  `tools/EXPORT-NOTES.md` (light deck + dark deck, fresh-eyes spot check).
- **Document** — a task is not finished until the relevant doc reflects the
  change. New template → covered by its own `schema`/`description`/`example`
  (self-documenting by contract) plus a `docs/ARCHITECTURE.md` update if it
  changes a pattern, not just adds an instance. New workflow rule discovered the
  hard way → goes into `CLAUDE.md` (per its own instructions) or
  `tools/EXPORT-NOTES.md`, not just this session's memory.
- **Update ADRs** — only when the change is architectural (a new layer, a changed
  data flow, a reversed prior decision). Adding the 106th template is not
  architectural. Changing how templates are registered is.
- **Append CHANGELOG** — `docs/CHANGELOG.md` is append-only; add an entry, don't
  rewrite history. Note: `wiki.html`'s in-app "Version history" section is the
  user-facing changelog and should also get an entry per `CLAUDE.md`'s existing
  instruction ("gets a dated entry whenever a feature ships") — keep both in sync.
- **Finish** — only after the above. "The code works" is not the same as "the
  task is done."

## Standing rules specific to this repo (process, not brand)

- **Never invent a new doc system on top of this one.** If you find yourself
  wanting a new top-level `NOTES.md` or similar, it probably belongs as a section
  in an existing file above, or a new ADR.
- **No git repo is assumed present.** Check with `git status` before relying on
  version control for safety nets (stash, diff-before-overwrite); if there's no
  `.git`, be more conservative about destructive edits since there's no undo.
- **No automated tests exist.** Don't claim "tests pass" — there are none to run.
  Validation is manual/visual (see above) until `docs/ROADMAP.md`'s testing gap
  is addressed.
- **Never promote a deck-specific template into a Master Template without
  explicit user confirmation** — this is `CLAUDE.md`'s permission rule, repeated
  here because it is the single most consequential mistake an assistant can make
  in this repo (it corrupts the shared brand library for every future deck).
