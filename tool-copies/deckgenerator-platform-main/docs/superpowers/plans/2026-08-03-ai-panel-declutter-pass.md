# AI panel declutter pass — overnight autonomous work

Context: user reported the AI panel (product/ui/editor-ai/) is "super crowded"
even at idle, from a screenshot showing Active Task's empty state, a full
Presentation Health card, Pending Changes' empty-state copy + 4 example
chips, and an expanded (empty) Memory section, all stacked before the
composer is even reached. Backend connectivity was separately fixed
(`npm run api` wasn't running).

This continues the collaborative frontend-design planning session from
earlier today (Apollo.io as the UX bar; "refine our current language"
chosen over a bigger visual departure; slide-switcher header already
shipped). The user's explicit ask tonight: "create the plan and work on it
during the night" — full autonomy, no further check-ins needed before
morning.

Prior explicit feedback this addresses:
- "I don't know if we need Memory... Do I need memory? Maybe we can hide
  that." → demote Memory out of the main scroll, icon-triggered popover.
- "if I have 10 fixes it should show one by one" / "conflict messages" →
  already shipped tonight (M2 commit 893618d, review.js
  activeIssueIndex/resolveReviewIssue) — verified still correct, no
  further action.
- "I don't need the privacy trust line" → grepped, no such line exists in
  this codebase; nothing to remove.
- "The placeholder... is also nice. And the conversation bubbles as well."
  (referring to Apollo's rotating placeholder + chat-bubble message style)
  → placeholder rotation already exists (conversation.js
  PLACEHOLDER_HINTS); verify it's wired to the real input. Give plain-text
  AI replies (advice/notes items) a lighter chat-bubble treatment instead
  of a bordered card, since those are conversational, not proposals.

## Changes

1. **Active Task**: hide the whole section (title + body) when idle — no
   card, no "Nothing running on this slide." text. Only mounts once a
   request is actually running on this slide or another one.
2. **Memory**: move out of `.ed__ai-scroll`'s linear flow into a small
   icon button in `.ed__ai-head` (header row, next to Clear) that opens a
   floating popover anchored under it. Zero footprint when unused; a small
   badge shows the count when non-empty so standing instructions aren't
   forgotten.
3. **Pending Changes empty state**: trim from 4 example chips to 2, and
   shorten the intro copy to one line combined with the canvas-selection
   hint instead of two separate paragraphs.
4. **Composer placeholder**: verify `renderAiScope()`'s rotating hint
   actually reaches `#ai-input` (it does — confirmed via read), no change
   needed beyond checking it's not stuck on the static HTML placeholder on
   first paint.
5. **Notes/advice replies**: restyle `buildNotesCard` output as a chat
   bubble (rounded, softer background, no boxed header/chip) rather than
   the same bordered card proposals use — visually distinguishes "the AI
   said something" from "the AI is proposing a change."
6. General spacing pass on `.ed-section` / `.ed-item` if time remains, to
   reduce the stacked-card feel.

## Verification
Isolated rig (backend + no-cache proxy) or the user's own running
localhost:4599/4600 pair, manual pass: idle panel height, Memory popover
open/close/persist, a sent AI request still renders correctly, review
checklist still one-issue-at-a-time. No automated test suite exists for
this UI; this is the same manual-verification pattern used for the
Phase 1–5 work earlier today.
