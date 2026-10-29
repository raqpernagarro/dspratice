# AI Workspace Redesign — Phase 4: Surface Expansion

Phase 4 of 5. Builds on the Phase 2 feed + Phase 3 live systems. Executed
autonomously. Scope from the original brief: natural-language intentions
(§9), inline AI (§10), follow-up workflows (§11).

## 1. Intention library (teach capabilities)

Replace the four hardcoded empty-state examples with a curated **intention
library** in the module (`intents.js`): ~24 intents tagged by scope level
(`slide` / `object`) and theme (copy, structure, visuals, audience). The
empty state shows 4: always ≥1 structural and ≥1 audience intent so the
panel keeps teaching that AI can change layout and register, rotated
deterministically by slide index + day (no timers, stable within a visit).
Clicking drafts into the composer (existing behavior). Element scope keeps
its shorter set, same mechanism.

Examples (final copy in intents.js): "Make this slide easier to
understand", "Explain this visually", "Turn this into a timeline",
"Add a supporting example", "Reduce reading time", "Prepare this for
executives", "Make the headline carry the argument", "Cut this to one
message".

## 2. Follow-up workflows

When a rewrite/layout item settles as `applied` or `partial`, the card
grows a quiet **"Next:"** row of 2–3 follow-up chips chosen by simple rules
(kind + what just happened, from a table in `intents.js`):

- after copy changes: "Reduce reading time", "Generate speaker notes",
  "Prepare this for executives"
- after a layout change: "Tighten the writing for this layout",
  "Add a supporting image"
- after a review Fix: "Fix the next issue" (drafts the next unresolved
  issue's fix text if one exists)

Clicking a chip **drafts** into the composer scoped as usual (never
auto-sends — the user always fires the ask). Chips render only on the
newest settled item (the conversation's living edge), not on history.

## 3. Inline AI

- **Floating toolbar** (existing `#ed-float`, shown on canvas selection):
  next to "Ask AI", add three quick actions: **Shorter**, **Improve**,
  **Expand**. Clicking sends immediately (`ai.sendAi`) with the element
  scope the selection already provides — these are the one-click cases
  where drafting would just add friction; the result still lands as
  reviewable proposals. Disabled (with title) while the slide has a
  working item.
- **Canvas context menu** (existing right-click): "Ask AI about this" stays
  (focus composer); beneath it add the same three quick actions as menu
  items. Menu structure/behavior otherwise untouched.
- Quick-action prompts live in `intents.js` (single source): Shorter =
  "Make this noticeably shorter without losing the point", Improve =
  "Improve the writing — clearer, more confident, same length", Expand =
  "Expand this with one concrete supporting detail".

## Host touchpoints

- `product/ui/editor.js`: floating-toolbar buttons (markup lives in
  editor.html `#ed-float`; handlers call `ai.sendAi(prompt, "rewrite")`),
  context-menu items in `openCanvasMenu` calling the same. Quick-action
  prompt strings imported from the module's `intents.js` (editor.js may
  import from `./editor-ai/intents.js` — a one-way, cycle-free import).
- `product/ui/editor.html`: three buttons in `#ed-float`.
- Everything else module-internal.

## Out of scope

Auto-sending follow-ups, AI-generated dynamic suggestions (the library is
static), per-user personalization, image generation, Phase 5 polish.

## Verification

Rig: empty-state shows rotated intents (≥1 structural, ≥1 audience);
follow-up chips appear only on the newest applied/partial card and draft
correctly; floating-toolbar quick actions send scoped asks and disable
while working; right-click quick actions ditto; console clean; Phase 2/3
regressions (feed, cancel, strip, health, memory) spot-checked.
