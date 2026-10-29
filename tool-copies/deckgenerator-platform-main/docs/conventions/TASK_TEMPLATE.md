# Task template

Copy this shape when starting a non-trivial piece of work in this repo (new
template, new deck, exporter change, architecture change). For a one-line fix,
this is overkill — use judgment.

---

## Task: <short imperative title>

### 1. Understand
- What module(s) does this touch? (Check `docs/ARCHITECTURE.md` for the map.)
- What existing convention/contract governs this area?
  (`js/templates/_CONTRACT.md`, `tools/EXPORT-NOTES.md`, `Design.md`, …)
- What does the current implementation actually do here? (Read it — don't infer
  from the filename or a memory of a similar task.)

### 2. Plan
- Approach in 2-5 bullets.
- For content/deck work: the template mapping ("source slide N → template
  `<name>`") per `CLAUDE.md` — get this confirmed before building if it's a
  full deck.
- Anything that needs explicit user permission before proceeding? (Promoting a
  template to a Master Template; adding a slide to `main-template`; anything
  listed under "Explicit permission required" in the system-level rules.)

### 3. Implement
- Keep the diff scoped to the plan. Don't drive-by refactor.

### 4. Validate
- `python3 serve.py 4599`, open the actual page/deck, look at it.
- For exporter work: run the QA checklist in `tools/EXPORT-NOTES.md`.
- No automated test suite exists in this repo — don't claim "tests pass."

### 5. Document
- [ ] Code is self-documenting where the contract requires it (template
      `schema`/`description`/`example`).
- [ ] `docs/ARCHITECTURE.md` updated if a pattern changed (not just a new
      instance of an existing pattern).
- [ ] `docs/DEVELOPMENT_GUIDE.md` updated if the "how to extend safely"
      instructions changed.
- [ ] New gotcha discovered → added to `CLAUDE.md` "Critical gotchas" or
      `tools/EXPORT-NOTES.md` issue catalog, not left in chat history.

### 6. Update ADRs (only if architectural)
- New file under `docs/ADR/NNNN-<slug>.md`. Never edit a past ADR's Decision
  after the fact — supersede it with a new ADR that says so.

### 7. Append CHANGELOG
- Entry in `docs/CHANGELOG.md` (append-only).
- Entry in `wiki.html`'s in-app "Version history" if this is a user-facing
  feature (per `CLAUDE.md`'s existing instruction).

### 8. Finish
- Re-read `docs/conventions/REVIEW_CHECKLIST.md` against the actual diff before calling it done.
