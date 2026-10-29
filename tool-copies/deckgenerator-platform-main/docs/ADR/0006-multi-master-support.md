# 0006 — Registry-driven support for multiple Master Templates

## Status
Accepted and scaffolded, but only **one** master (`main-template`) is actually
populated as of this writing. `js/decks/masters.js` contains a second,
commented-out example master (`"minimal"`) with no templates currently tagged
for it — see `docs/ROADMAP.md` → Future improvements.

## Context
The initial brand library was a single, all-inclusive Master Template. The
codebase anticipates that a Nagarro team might eventually want more than one
brand-approved library — e.g. a pared-down "minimal" set of essential layouts
alongside the full 91+-template library — without that requiring a rewrite of
how decks reference or are built from templates.

## Decision
Represent each Master Template as an entry in `js/decks/masters.js`: an `id`,
display metadata, and an `includes(template)` predicate over the shared
template registry (`allTemplates`). A template opts into a non-primary master
via a `masters: ["<id>"]` tag on its own module; the primary master's predicate
instead uses the inverse of the deck-specific opt-out flag (`!excludeFromMaster`,
see ADR 0004). `js/decks/main-template.js` builds one deck per registered
master automatically by filtering+sorting+mapping the shared template list —
adding a master is a data change (a new `masters.js` entry + tags on relevant
templates), not new rendering or build code. Every generated deck records
exactly one `meta.basedOn` master id, and per `CLAUDE.md`, templates from
different masters must never be mixed within one deck.

## Consequences
- Multiple brand libraries can coexist and be browsed separately (the
  dashboard already separates "Master Templates" from "Presentations" as
  distinct sections, ready for more than one master to appear there).
- When more than one master exists, deck generation must ask the user which
  master to base a new deck on (`CLAUDE.md`, `wiki.html` §06) — a process
  requirement enabled by, but not enforced by, this data structure.
- A template can belong to several masters simultaneously (the `masters` tag is
  an array) — e.g. a layout could be part of both a full library and a
  minimal one.

## Benefits
- No structural change would be needed to introduce a second real master today
  — the mechanism is already exercised by the primary master and only needs
  data (tag templates, uncomment/add the `masters.js` entry).
- Keeps "which templates form which brand library" as a query over one shared
  registry rather than duplicated template definitions per library.

## Trade-offs
- Until a second master is actually populated, this flexibility is unverified
  in practice — the `includes` predicate pattern, the "ask which master"
  workflow, and the "never mix masters in one deck" rule have only really been
  exercised with exactly one master in play.
- Adds a small amount of indirection (predicate functions, tag arrays) that
  would be unnecessary complexity if the project never ends up needing more
  than one master.

## Confidence
**High** for what the code currently does (directly readable in
`js/decks/masters.js`'s comments, which explain the tagging mechanism inline).
**Medium** for *why* this was built ahead of an actual second master being
needed — the commented-out example and its explanatory comment ("Adding it
here makes the generator ask which master to use") suggest deliberate
forward design, but there is no separate document confirming the original
motivation beyond what's inferable from the code and comments themselves.
