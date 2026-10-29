# Prompt coach — design

**Date:** 2026-10-15 · **Status:** approved in conversation; spec-review gaps resolved 2026-10-15 (audience/goal matching, Haiku coach call, skip flag)

## Why

A deck is only as good as the prompt that starts it. When colleagues get a weak
deck, their prompt is usually missing one or more of:

- **content and facts** — a topic ("a deck about our AI offer") with no points,
  names, dates or figures, so the model invents filler;
- **audience and goal** — no reader, no decision or reaction wanted, no tone;
- **structure and length** — no sections or slide count, so the flow is generic.

Today the home composer is one free-text box; Generate sends it straight to the
model, which outlines and builds without asking anything.

## Goal and success

Help people write prompts that carry audience, goal, real points and figures,
without slowing down those who already do.

Success: in a brief run like `tools/generate-briefs.mjs`, a weak prompt that is
coached produces a deck with fewer invented figures, a structure that follows
the stated points, and fewer compose warnings than the same prompt skipped.

## Decisions (from the conversation)

- **Checklist + coach**: a live advisory checklist while typing, and follow-up
  questions at Generate time only when important things are missing.
- **Hybrid**: the checklist is deterministic text checks in the browser; the
  questions come from one short model call, with fixed fallback questions.
- **Outline stays automatic.** No outline review step in this feature.
- **Never blocking.** Every question is skippable; "Skip and generate" always
  sends the original prompt.
- **Import path untouched.** With a .pptx attached, no checklist and no coach.

## 1. Live checklist

A row of five pills under the composer, shown once the prompt is non-empty and
no attachment is staged.

| Item | Covered when the prompt… |
|---|---|
| Audience | names who it is for. Strong roles count anywhere: board, executive committee, leadership, investors, "the CFO/CIO/…". Generic roles (client, customer, team, partners) count only after *for / to / at / with* ("to a new client") — so "customer data platform" or "customer interviews" do not tick it |
| Goal | states an outcome: approve, decide, decision(s) we need / requested, convince, persuade, inform, update, ask (for), need from, recommend, agree, sign off, "so that", "to get" |
| Key points | lists 3+ distinct points (bullets, line breaks, or a comma/semicolon list with "and"), or has ~250+ characters after removing the audience/length phrases |
| Figures | contains data numbers: %, currency symbols or codes (€, $, £, EUR, M, bn, k), counts with units, a year next to a value; **not** the slide count itself |
| Length | a slide count ("8 slides", "eight-slide", "three-slide summary") or named sections ("cover X, Y and Z") |

- Each pill: grey with an empty ring when missing, mint check when covered.
  Hover/focus shows one example phrase (e.g. Figures: *"Revenue €412M (+8%),
  EBITDA margin 9.1%"*).
- Advisory only: never disables Generate, never edits the prompt.
- Re-evaluated on input, debounced ~150ms.
- Dark mode and phone width follow the home page's existing tokens and layout.

**Module:** `js/brief-check.js` — `checkBrief(text) → { audience, goal, points,
figures, length }` (booleans) plus `EXAMPLES` per item. Pure functions, no DOM,
imported by the browser and by the server (so the coach asks about exactly
what the checklist shows missing). Lives in `js/` because the browser can only
import from the served tree.

## 2. Coach step at Generate

**Trigger:** on Generate (prompt path only), if any of **audience, goal,
points** is missing. Figures and length alone do not trigger it — a culture deck
may have no figures, and the engine already chooses a length. If nothing
important is missing, Generate behaves exactly as today.

**Panel** (below the composer, the composer stays in place):

- Heading: *"A few details will make this deck much better"*.
- 2–4 questions, each a one-line text input with a placeholder example.
- Buttons: **Generate** (uses the answers; blanks allowed) and **Skip and
  generate** (original prompt as-is).
- Esc, or editing the prompt, closes the panel and returns to the composer.
- Opens immediately with placeholder rows while the questions load.

**Endpoint:** `POST /api/briefs/coach` (authenticated like `/api/generations`)

- Request: `{ prompt: string, missing: ("audience"|"goal"|"points"|"figures"|"length")[] }`
- Response: `{ questions: [{ dimension, question, placeholder }], source: "model"|"fallback" }`
- One Claude call (`ClaudeCliProvider.coachBrief`, added to the `AIProvider`
  contract with a default that returns fallback questions) with a strict JSON
  schema and a **10s** timeout, run on **Haiku** (`--model haiku`) so it fits.
  The 10s is wall-clock from the request, including any wait for a free CLI
  slot (`MAX_CONCURRENT_CLAUDE`), enforced in the brief service. The model may also ask about figures when the
  topic clearly needs them, even if `figures` was not in `missing`.
- At most 4 questions; only for missing dimensions (plus the optional figures
  question); never for a dimension the checklist shows covered.
- On error, timeout, usage limit or malformed output: fixed fallback questions
  per dimension, `source: "fallback"`. The user never sees an error.
- Placement follows the existing layering: route in
  `product/application/routes/briefs.js`, logic in
  `product/domain/brief-service.js`, provider method in the CLI provider.

**Fallback questions**

| Dimension | Question | Placeholder |
|---|---|---|
| audience | Who will see this deck? | Bank CIOs at a prospect |
| goal | What should they decide or do afterwards? | Agree to a two-week pilot |
| points | What 3–5 points must it make? | Why now; our approach; two case results; the ask |
| figures | Which figures or results can it cite? | 40% faster claims handling at a European insurer |
| length | Roughly how many slides? | 8 |

## 3. Answers into the brief

`assembleBrief(prompt, answers)` in `js/brief-check.js`:

```
<original prompt, unchanged>

Audience: …
Goal: …
Key points: …
Figures: …
Length: …
```

- Blank answers are omitted; with no answers the prompt is returned unchanged.
- The assembled text is the `prompt` sent to `POST /api/generations`, so the
  pipeline needs no change.
- `POST /api/generations` also accepts an optional `coaching` object
  `{ missing: [], asked: [], answered: [], source, skipped }` (`skipped` is
  true for "Skip and generate", so it is distinguishable from Generate with
  every answer blank), stored on the generation
  record for later analysis. It changes nothing about generation.

## 4. Testing

- **Checklist rules** (`test/brief-check.test.js`): each of the 10
  `generate-briefs` prompts ticks the items it really contains; weak prompts
  ("a deck about our AI offering", "Q3 update", "intro to our design team")
  tick at most one item; "a 10-slide deck" counts as Length, not Figures;
  "Board" inside a company name ("Boardwalk Ltd") does not count as audience;
  "customer data platform" / "customer interviews" do not count as audience;
  "the decisions we need" and "the decision requested" count as goal. None of
  the 10 briefs contains a real figure, so Figures gets its own positive cases.
- **Coach service** (`test/brief-coach.test.js`, stub provider): tailored
  questions pass through, capped at 4 and limited to missing dimensions;
  provider throw / timeout / malformed output → fallback questions, `source:
  "fallback"`.
- **Assembly**: labelled lines, blanks omitted, original first and unchanged.
- **Route**: 400 without a prompt; 401 without a session; `coaching` stored on
  the generation record.
- **Browser** (preview): typing ticks pills; Generate on a weak prompt opens the
  panel; both buttons work; Esc closes; attachment hides the checklist; dark
  mode and phone width.
- **Quality check**: two weak prompts end to end, skipped vs answered, compared
  with `node tools/audit-decks.mjs --deck <id>` and a visual review of every slide.

## Out of scope

- Outline review or editing before the build.
- Coaching for the import (.pptx) path.
- Rewriting the user's prompt for them (the coach only asks).
- Model-driven live scoring while typing.
