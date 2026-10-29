# AI Workspace Redesign — Phase 2: Core Interaction Redesign

Phase 2 of 5 (see the Phase 1 spec for the full decomposition). Builds on the
Phase 1 foundation split: all work happens inside `product/ui/editor-ai/`
plus the minimal host touchpoints listed below. Executed autonomously per the
user's instruction ("don't ask me anything for the next phases").

## Problem

The panel works but feels like a chatbot bolted onto the editor:

- The activity area shows only the LATEST result; the previous ask's outcome
  vanishes when a new one starts. There is no sense of a work history.
- An ask and its outcome are visually disconnected — the user's instruction
  disappears on send, and anonymous cards appear later.
- "Working" state cannot be cancelled; a mistyped ask blocks the panel for a
  full model round-trip.
- Errors replace the workspace instead of becoming part of the record, and
  "Try again" is the only recovery (no way to edit the failed ask).
- The scope line is passive text; clearing an element selection requires
  clicking the canvas.
- Visual language is serviceable but flat: no hierarchy between a review, a
  proposal, and a note; status is implicit; nothing communicates "applied"
  vs "pending" at a glance.

## Design direction

Nagarro product UI, Linear-grade restraint: existing app tokens only
(`--c-accent` mint reserved for primary/affirmative + working pulse,
`--c-edge` hairlines, `--panel-bg` surfaces, both themes via the existing
channel/alpha system). No new fonts, no new colors, no gradients. Motion is
subtle and purposeful: one 160ms ease-out entrance per card, a pulsing dot
while working, `prefers-reduced-motion` disables both.

## The model: work items

Every AI interaction becomes a **work item** — one card that carries the ask
AND its outcome through a lifecycle. Per-slide state gains an `items` array
(newest first, capped at 8, in-memory only — persistence is Phase 3).

```js
{
  id,                    // crypto.randomUUID()
  kind,                  // "rewrite" | "layout" | "review" | "advice"
  ask,                   // the user's instruction (or "Review presentation")
  scopeLabel,            // what it was scoped to when sent ("Slide 3 · Headline")
  status,                // "working" | "ready" | "applied" | "partial" |
                         // "discarded" | "cancelled" | "error"
  createdAt, elapsedMs,  // set when the response lands
  error,                 // message when status === "error"
  payload,               // kind-specific: proposals[], structural plan,
                         // layoutOps[], review object, advice[]
}
```

The existing per-slide `state.proposals / structural / layoutOps / advice /
error / notice / recent` fields are replaced by items; `state.phase` remains
(it gates the canvas preview and review bar exactly as today). The canvas
preview continues to paint only the ACTIVE (newest ready) rewrite item's
proposals — the review bar and `applyCanvasPreview()` contract with the host
is unchanged.

The conversation thread (sessionStorage, 12-turn cap) is untouched — it
remains the model-facing history. The feed is the user-facing record; the
"Recent changes" list is absorbed into it (an applied item IS the record).

## Card anatomy

Header: kind glyph (existing `js/icons.js`-style inline SVG, 16px) + the ask
(single line, ellipsized, full text in `title=`) + status chip right-aligned.
Sub-line: scopeLabel · relative time ("just now", "2m ago") · elapsed
("18s") when done. Body and actions vary by kind:

- **rewrite / ready**: one row per proposal — field label, human summary
  ("12 words → 8 — tighter"), Accept / Edit / Discard per row; word-level
  diff expands per row on demand ("Diff"). Card footer: Accept all ·
  Discard all (only when ≥2 proposals pending). Accepting the last pending
  proposal flips the card to `applied`; a mix of accepted/discarded rows →
  `partial`. Each row's state is kept on the proposal (`applied`/`discarded`)
  and rendered as a muted checkmark/strike line instead of disappearing.
- **rewrite / working**: the existing named steps + pulsing dot + elapsed
  ticker, plus **Cancel**. Cancel aborts the fetch (AbortController threaded
  through `lib/api.js`), marks the item `cancelled` (kept in the feed), and
  re-enables the composer. A cancelled card offers Retry and Edit ask.
- **layout**: structural plan (template name, reason, drafted-fields count,
  Apply layout / Discard) and layout ops (move/size/align rows with Apply /
  Discard each) — same behavior as today, re-skinned as work items.
- **review**: score ring (SVG, 40px), reading minutes, summary, issues as
  severity-chipped rows with Fix buttons (unchanged behavior: jump + send),
  Dismiss. Lives in the feed like everything else and is deck-global: it
  renders at the top of the feed on every slide while present (matching
  today's cross-slide visibility).
- **advice**: "Notes" list, no actions.
- **error** (any kind): the ask is preserved in the header; body shows the
  human error line; actions: **Retry** (re-sends verbatim) and **Edit ask**
  (loads the text back into the composer via the existing draft mechanism).

## Context chip row

The scope line becomes an interactive chip row directly above the composer:
`Presentation · Slide 3 · [Headline ×]`. The element chip appears only when
a field/visual is selected; its × clears the canvas selection (new host
action). The row always states what the next ask will apply to — the user
never guesses.

Affected-field chips on rewrite cards (one per proposal row) highlight the
corresponding canvas element on hover (a `.is-ai-hint` outline class added
and removed on the `.ed-editable` span — presentation only, no selection
change).

## Composer

Unchanged mechanics (auto-grow, Enter to send, busy gating), restyled to
match: hairline border, mint send button, placeholder text cycles between
two scope-appropriate hints. The Clear button clears the FEED (items) for
the slide; thread untouched (as today).

## Empty state

Same content strategy (scope-specific example asks + review CTA + canvas
hint), restyled to the card language. Examples become quiet chips.

## Host touchpoints (the only editor.js / lib changes allowed)

1. `iface.clearSelection()` — new action wrapping the existing
   `clearSelection()` in editor.js.
2. `iface.highlightField(field, on)` — adds/removes `.is-ai-hint` on the
   matching `.ed-editable` spans (implemented in editor.js next to its other
   canvas helpers; the class styled in editor-ai.css... the class lives on
   canvas DOM, style it in app.css beside `.is-preview`).
3. `lib/api.js`: `assistEditorSlide` and `planSlideChange` accept an
   optional `{ signal }` forwarded to fetch. Nothing else changes.
4. `editor.html`: no structural change expected; ids stay (`ai-activity`,
   `ai-composer`, `ai-input`, `ai-send`, `ai-clear-btn`, `ai-scope`,
   `ai-scope-text`, `ai-status`). The scope element's inner markup is owned
   by the module and may change.

Everything else — undo/redo, autosave, review bar, canvas preview contract,
sessionStorage thread, backend endpoints, exports — is untouched.

## Accessibility baseline (built in now, audited in Phase 5)

- Every card is an `article` with `aria-label` (kind + ask + status).
- Status changes announced through the existing `#ai-status` live region.
- All actions are real buttons, focus-visible styling via existing app
  conventions; Cancel/Retry reachable by keyboard.
- `prefers-reduced-motion`: no entrance animation, no pulse.

## Out of scope (later phases)

Task queue running across slides (P3), persistent presentation health (P3),
AI memory (P3), suggestion chips beyond the existing examples (P4), inline
AI / right-click (P4), virtualized history + full WCAG audit (P5).

## Verification

Manual browser pass on the standing test rig, covering: multi-item feed
(two sequential asks both visible), per-row accept/discard + partial state,
accept-all, cancel mid-working, error → Retry and → Edit ask, review card
in feed + Fix, context chips (element chip ×, hover highlight), empty state,
both themes, reduced-motion, console clean, and the unchanged host flows
(undo/redo, review bar, canvas preview, ⌘K).
