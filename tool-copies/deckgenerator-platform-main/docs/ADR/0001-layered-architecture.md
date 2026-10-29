# 0001 — Layered architecture: tokens → templates → decks → registry

## Status
Accepted (in effect since the earliest recorded version, v1.0 — see
`docs/CHANGELOG.md`).

## Context
The system needs to produce many on-brand presentation decks without each deck
reinventing layout or style. The explicit product requirement (stated in
`CLAUDE.md`, the repo's own governing document) is that decks must be
**assembled by mapping content onto a fixed set of brand-approved templates,
never by inventing new ad-hoc slide layouts per deck.** This requirement has to
hold whether the deck is built by a human or by an AI assistant working from a
reference PPTX/PDF.

## Decision
Structure the codebase as four strictly one-directional layers:
1. **Tokens** (`css/tokens.css`, `Design.md`) — color/type/spacing as CSS
   custom properties + a normative spec document.
2. **Templates** (`js/templates/*.js`) — self-contained layout components, each
   describing its own content contract (`schema`) and carrying real example
   content (`example`).
3. **Decks** (`js/decks/*.js`) — plain data: which template, which content,
   nothing else. A deck never defines its own HTML/CSS.
4. **Registry** (`js/decks/index.js`, dashboard) — every registered deck is
   automatically discoverable.

Each layer may only depend on the layer(s) below it (see
`docs/ARCHITECTURE.md` §4 for the full dependency graph). Templates never
import decks; decks never import the engine.

## Consequences
- A deck's `template` field is always a string name resolved through a
  registry (`getTemplate()`), which makes "did this deck invent a new layout"
  mechanically checkable: every reference either resolves to a real template
  or throws.
- The Master Template deck can be **auto-generated** from the template
  registry's own `example` fields (`js/decks/main-template.js`) rather than
  hand-maintained, because templates already carry example content as part of
  their contract.
- Content authors (human or AI) work almost entirely at the deck layer and
  never need to write CSS to produce a new, on-brand slide — as long as an
  existing template fits.
- The cost: when no existing template fits new content, someone has to author
  a brand-new template module (a real engineering task, not just data entry) —
  the system deliberately does not offer a lower-effort escape hatch (like a
  generic "custom HTML" slide type), because that escape hatch is exactly what
  the layering exists to prevent.

## Benefits
- Visual consistency is structural, not a matter of discipline — there's no
  code path that lets a deck render arbitrary markup.
- New brand libraries (masters) can be defined as a *subset selection* over the
  same template registry (see ADR 0006) without touching template code.

## Trade-offs
- Content that doesn't fit any existing archetype requires new template
  engineering before it can be authored, which is slower than writing one-off
  HTML would be.
- The registry (`js/templates/index.js`) must be kept in sync by hand with the
  `js/templates/` folder — see `docs/ROADMAP.md`'s technical-debt entry on this.

## Confidence
**High for the decision's existence and intent** — this is explicitly stated as
policy in `CLAUDE.md` ("PRIME DIRECTIVE," "map source content onto templates,
you do NOT invent new ad-hoc slide layouts"). **Inferred** (not found stated
explicitly anywhere) is the specific reasoning connecting "one-directional
layering" to "auto-buildable master decks" — that connection is drawn from
reading `js/decks/main-template.js` and is a plausible, but not confirmed,
motivation.
