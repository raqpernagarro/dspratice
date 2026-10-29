# 0004 — `excludeFromMaster` flag + explicit-promotion permission gate

## Status
Accepted (in effect since v1.2, when the first deck-specific reusable
templates were added for the ASSA ABLOY deck).

## Context
An AI assistant (or a human, working fast) generating a deck from client
reference material will often need a layout that doesn't exist yet in the
brand library. Left unconstrained, the natural failure mode is scope creep:
new one-off templates quietly accumulate into the shared Master Template,
diluting a brand-approved library with content that was only ever
approved/needed for one client's deck. This is called out directly as the
central failure mode `CLAUDE.md` exists to prevent: *"past sessions found
that, without them, decks drift into generic 'AI-looking' slides."*

## Decision
Every template module carries an `excludeFromMaster: true` flag by default
when it's built for a specific deck's content. `js/decks/masters.js`'s primary
master's `includes` predicate is exactly `(t) => !t.excludeFromMaster` — so a
flagged template is usable by the deck that needs it (referenced by name,
directly) but invisible to the Master Template deck and therefore to every
*other* deck browsing the brand library for reusable layouts. Promoting a
template out of `excludeFromMaster` status requires **explicit user
confirmation**, asked for after every deck generation, per `CLAUDE.md`'s
"permission rule."

## Consequences
- The brand library (`main-template`) can only grow through a deliberate,
  confirmed action — never as a side effect of generating one presentation.
- A generated deck can still use as many new, bespoke templates as its content
  needs, without any of them silently becoming "the new normal" for the next
  deck.
- This makes the permission gate a **data property** (a boolean flag checked
  by a predicate function), not merely a documented process step that depends
  on an AI assistant remembering to ask — though the actual *asking* is still a
  process step (`CLAUDE.md`'s instruction to ask after every generation), and
  nothing in the code enforces that the question actually gets asked.

## Benefits
- Even if the "ask the user" step is skipped in some session, the resulting
  templates default to invisible-to-the-brand-library rather than
  default-visible — the failure mode of an accidental promotion requires an
  extra, deliberate step (flipping the flag), not just an omission.

## Trade-offs
- Relies on template authors setting `excludeFromMaster: true` correctly at
  creation time; nothing prevents a mistakenly-omitted flag from making a
  deck-specific template appear in the Master Template deck immediately (the
  predicate treats "flag absent" the same as "flag false," i.e. included by
  default) — see `docs/conventions/REVIEW_CHECKLIST.md`'s explicit check for this.
- The permission gate is currently one binary switch (`excludeFromMaster`) plus
  an ad hoc `masters` tag array for multi-master membership (ADR 0006) — there
  is no recorded audit trail of *who* approved a promotion or *when*, beyond
  whatever is visible in chat history (which, per `.ai/AGENTS.md`, is not
  durable).

## Confidence
**High.** This is one of the most explicitly documented decisions in the repo:
`CLAUDE.md`'s "🔒 The permission rule (non-negotiable)" section states the
policy, the reason ("Never add slides or templates to a Master Template...
without explicit user confirmation"), and the mechanism (`excludeFromMaster:
true`) directly.
