# Intelligence layer — understanding, storytelling, human voice

**Date:** 2026-10-20 · **Status:** described in conversation, awaiting review

## Why

Generated decks are correct and on-brand but do not make an audience care.
From the 10-brief run on 2026-10-15 and the user's own experience:

- **No hook.** Every deck opens on its conclusion and slide 2 is an agenda, a
  method or a list of criteria. Nothing makes the audience lean in first.
- **Generic, machine-sounding copy.** Not buzzwords so much as formula: every
  line a compressed headline ("Revenue up 8%, margin down to 9.1%: three
  decisions to restore it"), "three" everywhere, no people, no "you",
  telegraphic noun-heavy bodies, closings that read like forms.
- **Superficial content.** Mostly from short prompts. The model has little to
  work with and fills the gaps with surface-level points.

The user wants the audience to feel invested in the presentation. Storytelling
is "super important".

## Goals

1. **Understand the content** before writing: what the deck must make the
   audience believe, why they would care, and what real material supports it.
2. **Tell a story**: every deck has a hook slide right after the cover and a
   thread the audience can follow to the ask.
3. **Sound human, in Nagarro's voice**: concrete, candid, a little contrarian,
   warm where it talks about people, never formulaic.
4. **Get more depth from the user**: the coach becomes a short question form at
   every Generate that asks for reference material, the hook, and length (never
   required), alongside the existing content questions.

## Non-goals

- Outline review/editing before the build (still out of scope).
- Changing the import (.pptx) path: imported decks keep the author's words.
- New slide templates. The hook uses existing library templates.
- Model-written copy in the editor's AI actions (only generation for now).

## Anti-goals (a failure even if it technically works)

- **Invented facts.** No figure, client, name, quote or date that is not in
  the prompt, the coach answers or the references. A scene may be
  illustrative; a number never is.
- **Gimmicks.** Bad taste, childish jokes, melodrama, a hook that has nothing to
  do with the ask, or every slide written as a hook.
- **A new formula.** Replacing "three decisions to…" with a different tic
  repeated on every slide ("Picture this…", "X, not Y" on every title).
- **Slower without being better.** Each new step must earn its time; each can
  fail without failing the deck.

## Decided with the user

- Default voice: the **Nagarro blog / LinkedIn voice**. It **shifts with the
  audience**.
- The hook is **its own slide, right after the cover**, and **optional**: the
  coach asks whether the user wants one and explains why it matters.
- The coach **opens on every Generate** as a Claude-style question form with
  answer options plus a free-text box; slide count is **never required**
  ("You decide — no limitations").
- **Illustrative scenes are allowed** if clearly framed as hypothetical and not
  in bad taste or a childish joke.
- Depth comes first from **guiding the user to add reference material**; the
  coach is the place to do it.
- Without references the model may bring expertise (reasoning, implications,
  frameworks, likely objections, illustrative scenes) but **not facts**.

## The Nagarro voice (reference)

Distilled from nagarro.com (home, company, careers, services, case studies,
blogs) and LinkedIn posts. Lives in one module the prompts read from
(`product/domain/voice.js`, exported strings and lists), and is summarised for
people in `docs/VOICE.md`.

**Write like this**
- Open on tension or a concrete moment: "AI-generated UI can look right and
  still feel wrong." / "When requirements live in code, test cases and people's
  heads, testing can feel like working in the dark."
- A short punch after a setup: "Change is no longer occasional. It is
  structural."
- Name the problem, then its concrete symptoms: "Engineering makes a change.
  Manufacturing finds out too late. Operations works around it."
- Two-line principles that land the point: "Monitoring tells you what an agent
  did. Governance decides what it may do next."
- Grounded, engineering verbs: engineer, re-engineer, operationalise,
  orchestrate, govern, built for production.
- Claims tied to a client and a number, from the sources only.
- "You/your" for the audience's problem, "we" for capability and proof.
- People and moments where the brief has them (who saw it, who it affected).
- Calm, inviting closings: a conversation, a diagnostic, a next step.

**Not like this**
- Truisms: "In today's rapidly evolving digital landscape…"
- Hype: unlock, unleash, revolutionise, supercharge, harness the power of,
  cutting-edge, game-changing, best-in-class, tectonic shift, on the cusp.
- Stacked abstract benefits: "accelerates interoperability and drives impact".
- Exclamation marks; self-praise superlatives ("leading").
- The site's own tics, rationed per deck: at most **one** "X, not Y" contrast
  and **one** featured triad; never "three" in more than one title.

**Tones** — the same voice adjusted to the room, picked from the understood
audience (default = thought leadership). The code calls this `register`:

| Tone | When | How it sounds |
|---|---|---|
| Thought leadership (default) | general, external, unknown | The blog voice: first-person plural, an observation or scene, a reframe, a principle |
| Executive / board | board, executive committee, investors | Same voice, tighter: hook = the tension in one or two lines, then figures and decisions; no scenes longer than two sentences |
| Client pitch | client, prospect, partner | The manufacturing LinkedIn post: their pain as a scene, the question they are asking, then us and the proof |
| People / culture | employees, candidates, internal celebration | The Flo post: warm, rhythmic, "you" and "we", light humour allowed |

## How it works

The pipeline today: prompt → (coach) → outline (`generatePresentation`) →
analyse → plan → choose layouts + fill (`composeDeck`) → repair → visual
review. Three model steps are added and one changes:

```
prompt + coach answers + references
   │
   ├─ 1. UNDERSTAND  → content brief           (new)
   ├─ 2. STORY       → arc + hook              (new)
   ├─ 3. OUTLINE     → slides (existing, re-prompted with brief + arc + voice)
   ├─    analyse / plan / layouts / fill / repair  (existing, unchanged)
   ├─ 4. VOICE       → human-voice edit pass   (new)
   └─    visual review (existing)
```

Each new step runs only on the prompt path. Each has a timeout and, on failure,
the pipeline continues as today and records a note on the generation (the same
"never silent" rule the compose warnings follow).

### 0. Coach v2: a question form at every Generate

The coach shipped on 2026-10-15 opens only when audience, goal or key points
are missing. **It now opens on every prompt-path Generate** (decided by the
user) and works like the question form people know from Claude:

- It appears **in the same place as the prompt box, or just above it**; the
  prompt stays visible.
- **One question at a time** (with back/next and a progress hint such as
  "2 of 5"), each with **answer alternatives as selectable options** where the
  question allows, **plus a free-text box** for an own answer. Multiple
  selection where it makes sense.
- Every question can be skipped; **"Generate now"** is always available and
  sends what has been answered so far.
- The options are tailored by the model to the prompt (same Haiku call as
  today, extended to return options), with fixed fallbacks.

**Questions, in order** (only those that add something are asked; the
checklist still decides which content questions are needed):

1. **Audience and goal** — when missing. Options suggested from the prompt
   (e.g. "Executive committee", "Client prospect", "Internal team").
2. **Key points** — when missing.
3. **Reference material** — asked whenever no reference is attached: *"Do you
   have material this should draw on — a proposal, report, notes or an old
   deck? The deck will go much deeper with it."* Options: attach a file / paste
   text / "No, work from my prompt". Attaching or pasting happens inside the
   form.
4. **The hook** — always asked: *"Open with a hook?"* with one or two
   sentences on why it matters for the story (it gives the audience a reason to
   care before the facts, and the closing returns to it). Options: "Yes, open
   with a hook (recommended)" / "No, start with the content". When yes, the
   story step (2) writes a hook slide; when no, the deck starts after the cover
   as today, and the story step still shapes the arc and the closing.
5. **Length** — always asked, never required: options such as "About 5",
   "8–10", "12–15", a number box, and **"You decide — no limitations"**
   (the default). "You decide" means the engine chooses the length, exactly as
   when no count is stated today.
6. **Figures** — only when the topic needs figures and none were given.

**What can be attached as reference** (decided by the user: "images,
screenshots, Excel…" too). At least:

- documents: PDF, Word (.docx), PowerPoint (.pptx, read as source), plain
  text / Markdown, pasted text;
- spreadsheets: Excel (.xlsx) and CSV — read as tables; their numbers become
  `proof` with the sheet/cell range as source;
- images and screenshots: PNG, JPG/JPEG, WebP — read by the model (what they
  show, any text and figures in them) as source material. Each image has a
  **"Use on slides"** toggle (off by default); when on, it is placed in photo
  slots ahead of brand photography, as the import path already does for an
  author's own images. *(Toggle and default are my call.)*

**Slide count and the hook.** When the user gives an exact number and also
wants a hook, the hook **counts as one of those slides**, and the length
question says so ("includes the cover and the hook"). *(My call — the user
sets both answers in the same form, so the number they give is the whole
deck.)*

**Getting started, for beginners** (decided by the user). A visible link near
the composer — "New here? How to get a great deck" — opens a short guide in a
side panel or popover:

- three steps in plain words: say who it is for and what you want them to do;
  add your material (files, screenshots, spreadsheets, notes); answer the
  coach's questions, or skip them;
- two or three **example prompts**, each with a "Use this example" button that
  fills the prompt box (one board update, one client pitch, one culture deck);
- a one-line note on what the hook is and why the coach asks about it;
- a weak vs strong prompt side by side.

The guide is dismissable and remembers per user that it was opened (first-visit
highlight only, never a blocking modal). *(Placement and the first-visit
highlight are my call.)*

**The live checklist stays** under the composer as the advisory guide while
typing.

### 1. Understand → content brief

One model call reads the prompt, coach answers and reference text and returns
a structured **content brief**, stored on the generation record:

- `coreIdea` — the one thing the audience must leave believing (one sentence).
- `audience` — who, what they care about or worry about (their tension), what
  they want from this deck.
- `register` — one of the four registers above.
- `insights[]` — each point with its "so what" (why it matters to this
  audience), not just the point.
- `proof[]` — facts, figures, cases, quotes **with their source** (`prompt`,
  `answer`, or a reference id). This is the only pool figures may come from.
- `implications[]` and `objections[]` — what follows, what the audience will
  push back on.
- `gaps[]` — what a strong deck would need but the material does not give
  (e.g. "no Q2 figure", "no client example").
- `moments[]` — real stories, scenes or people in the material that could
  carry a hook.

Without references, the brief may still contain insights, implications and
objections from the model's own expertise; `proof` then holds only what the
prompt and answers state.

### 2. Story → arc and hook

One model call takes the brief and returns:

- `hook` — `{ kind, text, framing }`, kind ∈ moment (a real moment from
  `moments`), number (a striking figure from `proof`), question, paradox,
  scene (illustrative, framed: "Picture this…", "Consider a…"). Taste rules
  from the anti-goals are in the prompt. Register shapes it (board: one or two
  lines of tension; culture: warm).
- `arc` — ordered beats: tension the hook opens → why it matters now → what
  changes → proof → the ask; each beat with the slide titles it should become.
- `callback` — how the closing returns to the hook, resolved.

### 3. Outline (existing step, new inputs)

`generatePresentation` is re-prompted with the brief, the arc and the voice
rules for the register:

- Slide 1 cover; **slide 2 the hook slide** when the user wants one (its text
  from `hook`); then the arc; the closing uses the `callback`.
- Titles still state the takeaway, but in the voice (not the compressed
  "A, B: three C" formula); formula budget per deck as above.
- **Remove** the instruction "use plausible figures and mark them as
  illustrative". Figures come only from `proof`. Where a slide would need a
  figure that is in `gaps`, the slide says it qualitatively and the speaker
  notes say what to add ("Add your Q2 margin here").
- Existing count/consistency rules stay.

**Hook marker.** The hook is marked on its outline slide (e.g. `role: "hook"`),
not identified by position, so outline edits that renumber slides keep it.
*(Builder's call, made in review.)*

**Hook slide layout.** The outline marks slide 2 as the hook; layout choice
restricts it to existing statement/quote/big-number templates that are
dark-safe or light (which ones, and light vs dark, is the builder's call, kept
consistent with the dark-cover / light-content sandwich). It is exempt from the
divider/variety rules that might otherwise move it.

**No invented figures, deck-wide.** The anti-goal covers every step, not just
the outline:

- The fill and repair prompts lose "replace every placeholder with real,
  specific content" as a licence to make up numbers: numeric fields take
  figures from `proof` only.
- Layout choice and template scoring stop favouring number-shaped templates
  (stat grids, charts, big numbers) for a slide whose figures are not in
  `proof`.
- A deck-wide check after fill compares every number on the slides with the
  numbers in the prompt, answers, references and `proof`. An untraceable
  figure is removed or the slide is rebuilt on a non-numeric layout, with a
  note. The voice pass's own check uses `proof` plus the prompt/answers/
  references, never "whatever the input slide already said".

### 4. Voice → human-voice edit pass

After fill and repair, one model call per deck (batched if large) edits the
**words only** of every slide — titles, subtitles, body, captions, closings,
and speaker notes — to the voice and register:

- Same fields, same structure, same or shorter length per field (the layouts
  are fixed size).
- **No new facts**: every number, name and date in the output must already be
  in the input slide or the brief's `proof`. A slide whose edit fails this
  check, changes structure, or grows past its length budget keeps its original
  copy (recorded as a note).
- Deck-level variety: formula budget enforced across the deck, sentence shapes
  varied, no repeated opener.
- The hook slide and the callback are checked for taste (no exclamation marks,
  no jokes in board/client registers).

### 5. Voice lint (deterministic)

A shared checker (`js/voice-lint.js`, usable by server and tools) that scores
copy without a model: banned words/phrases, "X, not Y" count, triad and
"three" count in titles, exclamation marks, truisms, repeated sentence
openers, all-noun telegraphic bodies. Used by:

- the voice pass, to pick which slides need editing and to verify the result;
- `tools/audit-decks.mjs`, as a new `voice` finding kind;
- the brief run, as a metric.

## Data and API changes

- Generation record gains `references` (metadata + extracted text, or a pointer
  to stored text), `brief`, `story` and `voiceNotes`. Existing records without
  them keep working.
- `POST /api/generations` accepts reference ids (from a new upload endpoint for
  references) alongside `prompt` and `coaching`.
- Provider contract gains `understandContent`, `planStory`, `editVoice`, each
  with a default that returns null (the pipeline then skips that step).

## Constraints

- Claude CLI: at most 2 concurrent calls; session usage limits exist and must
  degrade, not fail. Three extra calls per deck — keep each prompt within the
  32k budget (references summarised first if needed).
- Generation time should not grow by more than about a minute on a typical
  10-slide deck; the build view shows the new stages ("Understanding the
  content", "Shaping the story", "Polishing the voice").
- Today the outline is drafted inside `POST /api/generations` and progress
  exists only after approval. Understand and story run before the outline, so
  the builder chooses how to make them visible (move outline drafting into the
  background job, or a lighter staged indicator) — the requirement is that the
  user sees progress and the build deadline covers the new calls.
  *(Left to the builder, made explicit in review.)*
- Restart the server after domain changes (CLAUDE.md); tests via
  `node --test test/*.test.js`.

## How we know it worked

Extend `tools/generate-briefs.mjs` with short, weak prompts and with
prompt-plus-reference cases. Before/after on the same briefs:

- every prompt-path deck whose user chose a hook has it at position 2, in the
  right register;
- **zero** figures not traceable to prompt, answers or references;
- voice-lint findings per deck clearly down (target: no banned phrases, formula
  budget held);
- with references, the deck's points trace to the reference (spot-check);
- a contact-sheet review by the user: does the opening make you want the next
  slide, and does it sound like Nagarro?

## Left to the builder

- Which existing templates host the hook (by hook kind) and its theme.
- Parsing libraries, size caps and storage for references.
- Exact prompts, schemas, timeouts, batching, and which Claude model each step
  uses (quality first for story and voice).
- Thresholds for "short prompt" and for voice-lint scoring.
- Whether understand + story run as one call or two, if quality holds.
