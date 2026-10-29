# Intelligence Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decks that understand their material, open with a hook, follow a story and sound like Nagarro — guided by a question-form coach that asks for references, the hook and (optional) length.

**Architecture:** Three new model steps on the prompt path — `understandContent` (content brief) and `planStory` (arc + hook) before the outline, `editVoice` after fill — each optional and fail-soft. A voice module and a deterministic voice lint carry the Nagarro voice. A reference store turns attached files (docs, spreadsheets, images) into source text. The coach becomes a one-question-at-a-time form with options at every Generate, plus a getting-started guide.

**Tech Stack:** Node ESM + Express, the local `claude` CLI (`claude -p … --json-schema`), vanilla browser JS, `node --test`. New deps: `pdfjs-dist` (PDF text), `exceljs` (xlsx).

**Spec:** `docs/superpowers/specs/2026-10-20-intelligence-layer-design.md`

## Global Constraints

- Prompt path only. The `.pptx` **import** path (`composeImportedSlides`, `pptx-import-service.js`) is untouched.
- **No invented facts:** every number on a finished slide must trace to the prompt, coach answers, references or the brief's `proof`. "A scene may be illustrative; a number never is."
- Hook: own slide right after the cover, **only when the user wants one**; illustrative scenes framed ("Picture this…", "Consider a…"); no exclamation marks; no jokes in board/client tones.
- Formula budget per deck: at most **one** "X, not Y" contrast, at most **one** featured triad, "three"/"3" in at most **one** title.
- Banned phrases (voice lint + prompts): `unlock`, `unleash`, `revolutionise/revolutionize`, `supercharge`, `harness the power of`, `cutting-edge`, `game-changing`, `best-in-class`, `tectonic shift`, `on the cusp`, `in today's rapidly evolving`, `seamless`, `leverage` (verb), and any `!`.
- Tones (`register` in code): `thought` (default), `board`, `client`, `people`.
- Slide count never required; "You decide — no limitations" = engine chooses. When a number is given and a hook is wanted, **the hook counts within the number**.
- Each new step: own timeout, failure → continue as today + a note on the generation (never silent). Claude CLI: ≤ 2 concurrent calls; "session limit" errors degrade, never fail the deck. Prompts ≤ `MAX_PROMPT_CHARS` (32,000).
- Restart the server (`npm start`, port 4600) after any change under `product/`; it signs users out (no `SESSION_SECRET`).
- New CSS classes namespaced (`.coach2-*`, `.guide-*`, `.ref-*`); never bare `.nav .btn .card .panel .chip .edge .stage`.
- Commit after each verified task, message ending `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Do not push.
- Story and voice prompts run on the CLI's default model (quality first); coach stays on `COACH_MODEL` (Haiku).

## Review Focus

1. **Short prompt, no references, no figures** (the common case) → deck has zero numbers not in the prompt; chart/big-number layouts are not chosen; speaker notes name the missing figures. *Pinned in Task 6.*
2. **User says "no hook" or gives an exact count** → no hook slide; with a count and a hook the deck has exactly that many slides including the hook. *Pinned in Task 5.*
3. **A model step fails, times out or hits the CLI session limit** (understand, story, voice, image description) → deck still builds as today, with a note per failed step. *Pinned in Tasks 5, 7, 9.*
4. **A large reference** (100-page PDF, 20-sheet workbook) → upload succeeds, text is capped/summarised, prompts stay under 32k, the build is not slowed past the deadline. *Pinned in Task 9.*
5. **Voice pass makes a slide worse** (longer than its slot, a new number, changed structure, more lint findings) → that slide keeps its original copy. *Pinned in Task 7.*

---

### Task 1: The Nagarro voice — module, guide and lint

**Files:**
- Create: `product/domain/voice.js`, `js/voice-lint.js`, `docs/VOICE.md`
- Test: `test/voice.test.js`

**Interfaces:**
- Produces:
  - `voice.js`: `export const TONES = ["thought","board","client","people"]`; `export function voiceRules(register = "thought"): string` (prompt-ready rules: the spec's "Write like this / Not like this" plus the tone row); `export const HOOK_TASTE: string` (taste rules for hooks).
  - `voice-lint.js` (pure, browser + node): `export const BANNED: RegExp[]`; `export function lintText(text: string): Finding[]`; `export function lintDeck(slides: {texts: string[], title?: string}[]): { findings: Finding[], score: number }` where `Finding = { kind: "banned"|"exclaim"|"contrast"|"triad"|"three-title"|"opener"|"truism", text: string, slide?: number }` and `score` = number of findings (lower is better).

- [ ] **Step 1: Write the failing tests** — `test/voice.test.js`:
  - `lintText("Unlock the power of AI!")` has kinds `banned` and `exclaim`.
  - `lintText("Approvals wait in queues. Handoffs drop context.")` → `[]`.
  - `lintDeck` with two titles containing "not X, but Y" / "X, not Y" → one `contrast` finding (budget 1 allows the first).
  - `lintDeck` with titles "Three risks…" and "Three decisions…" → one `three-title` finding.
  - `lintDeck` with three slides whose body starts "We" → one `opener` finding.
  - `voiceRules("board")` contains "figures and decisions"; `voiceRules("nope")` equals `voiceRules("thought")`; every `TONES` entry returns a non-empty string; `voiceRules()` contains each banned phrase listed in Global Constraints.
- [ ] **Step 2: Run** `node --test test/voice.test.js` — Expected: FAIL (modules missing).
- [ ] **Step 3: Implement** both modules. Contrast detection: `/\b(?:not|n't)\s+(?:just\s+)?[^,.;]{1,40},\s*(?:but\s+)?|,\s*not\s+\w/i`; triad: three comma-separated items ending "and"/"or" in a title; opener: same first word starting ≥ 3 bodies. Copy the spec's voice section into `docs/VOICE.md` for people (examples, tones table, banned list).
- [ ] **Step 4: Run** `node --test test/voice.test.js` — Expected: PASS.
- [ ] **Step 5: Commit** `git add product/domain/voice.js js/voice-lint.js docs/VOICE.md test/voice.test.js && git commit -m "Voice: Nagarro voice rules, tones and a deterministic copy lint"`

### Task 2: Provider contract and prompts for understand, story, voice

**Files:**
- Modify: `product/infrastructure/ai/ai-provider.js` (contract), `product/infrastructure/ai/claude-cli-provider.js` (prompts, schemas, methods)
- Test: `test/intelligence-prompts.test.js`

**Interfaces:**
- Consumes: `voiceRules`, `HOOK_TASTE` (Task 1).
- Produces (on `AIProvider`, defaults resolve `null`; CLI implements):
  - `understandContent({ prompt, answers, references }) → Promise<ContentBrief|null>` where `answers: Record<string,string>`, `references: {id, name, text}[]`, `ContentBrief = { coreIdea: string, audience: {who, tension, wants}, register: Tone, insights: {point, soWhat}[], proof: {fact, source}[], implications: string[], objections: string[], gaps: string[], moments: {text, source}[] }` (`source` ∈ `"prompt"|"answer"|<referenceId>`).
  - `planStory({ brief, wantsHook, slideCount }) → Promise<Story|null>`, `Story = { hook: {kind: "moment"|"number"|"question"|"paradox"|"scene", text, framing} | null, arc: {beat: "tension"|"why-now"|"change"|"proof"|"ask", titles: string[]}[], callback: string }`.
  - `editVoice({ register, slides }) → Promise<{slides: {index, content}[]}|null>` where input `slides: {index, templateName, content, budget: Record<string, number>}[]`.
  - Exported pure builders: `buildUnderstandPrompt`, `buildStoryPrompt`, `buildVoicePrompt` (same args as the methods), each `→ string`.

- [ ] **Step 1: Write the failing tests** (`test/intelligence-prompts.test.js`):
  - `buildUnderstandPrompt` includes the prompt, each reference name, and the sentence "Only facts present in the material go in proof"; with a 200k-char reference the result length ≤ 32,000.
  - `buildStoryPrompt({ brief, wantsHook:false })` contains "Do not write a hook"; with `wantsHook:true` contains `HOOK_TASTE` and the five hook kinds; with `register:"board"` (on the brief) contains the board tone rule.
  - `buildVoicePrompt` contains "Never add a number, name or date", each slide's budget, and `voiceRules(register)`.
  - `new AIProvider().understandContent({})` resolves `null` (same for `planStory`, `editVoice`).
- [ ] **Step 2: Run** `node --test test/intelligence-prompts.test.js` — Expected: FAIL.
- [ ] **Step 3: Implement** prompts, `UNDERSTAND_SCHEMA`/`STORY_SCHEMA`/`VOICE_SCHEMA` (JSON Schema matching the types above), and the three methods via `runClaude(prompt, schema, { timeoutMs })` with timeouts `UNDERSTAND_TIMEOUT_MS = 90_000`, `STORY_TIMEOUT_MS = 60_000`, `VOICE_TIMEOUT_MS = 120_000`. Budget references by trimming each to a share of 18,000 chars, longest first.
- [ ] **Step 4: Run** the test file — Expected: PASS. Run `node --test test/*.test.js` — Expected: `fail 0` (includes `prompt-budget.test.js`).
- [ ] **Step 5: Commit** `"AI provider: understandContent, planStory, editVoice with prompts and schemas"`.

### Task 3: Content brief helpers and figure provenance

**Files:**
- Create: `product/domain/content-brief.js`
- Test: `test/content-brief.test.js`

**Interfaces:**
- Produces:
  - `normalizeBrief(raw: any): ContentBrief|null` — clamps arrays (≤ 8 each), drops `proof` items without `fact`, defaults `register` to `"thought"` when not in `TONES`.
  - `numbersIn(text: string): string[]` — normalised numeric tokens (`"€412M"→"412"`, `"9.1%"→"9.1"`, `"1,400"→"1400"`, years kept, slide-count phrases "8 slides" excluded).
  - `allowedNumbers({ prompt, answers, references, brief }): Set<string>` — union of `numbersIn` over all sources and `brief.proof[].fact`.
  - `untraceable(content: object, allowed: Set<string>): string[]` — numbers in a slide's visible text (skip `meta`, `footer`, `notes`, asset paths, CSS values like `var(--…)`, colours) not in `allowed`. Treat `1`–`10` used as list ordinals ("01", "02") as allowed.

- [ ] **Step 1: Failing tests:** `numbersIn("Revenue €412M, up 8% in 2026 (8 slides)")` → `["412","8","2026"]`; `untraceable({title:"Churn hit 14%", body:"from 9%"}, new Set(["14"]))` → `["9"]`; `untraceable` ignores `{meta:{page:"7"}}`, `{c:"var(--fill-50,#06041f)"}`, `"assets/x-2.jpg"`, `"01"`; `normalizeBrief({register:"x", proof:[{},{fact:"€2M"}]})` → register `"thought"`, proof length 1.
- [ ] **Step 2: Run** `node --test test/content-brief.test.js` — FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** — PASS.
- [ ] **Step 5: Commit** `"Content brief: normalisation and number provenance"`.

### Task 4: Outline prompt — story-led, hook slide, no invented figures

**Files:**
- Modify: `product/infrastructure/ai/claude-cli-provider.js` (`buildPrompt`, `generatePresentation`, `RESPONSE_SCHEMA`)
- Test: `test/intelligence-prompts.test.js` (extend)

**Interfaces:**
- Consumes: `ContentBrief`, `Story` (Task 2), `voiceRules` (Task 1).
- Produces: `generatePresentation({ prompt, brief?, story?, register?, wantsHook?, slideCount? })`; `buildPrompt(userPrompt, corrections = [], { brief, story, register, wantsHook, slideCount } = {})`. Outline slides may carry `role: "hook"` (schema: optional string enum `["hook"]`) and the mapping keeps it (`proposedMapping[i].role`).

- [ ] **Step 1: Failing tests:**
  - `buildPrompt("x")` no longer contains "plausible figures"; contains "Use only figures that appear in the request" and "say in the speaker notes which figure to add".
  - With `{ wantsHook:true, story }` → contains "Slide 2 is the hook" and the story's `hook.text`; with `wantsHook:false` → contains "No hook slide".
  - With `slideCount: 8, wantsHook: true` → contains "exactly 8 slides" and "the cover and the hook are two of them".
  - With `story.arc` → each beat's titles appear; with `story.callback` → "The last slide returns to the opening".
  - With `register:"board"` → contains `voiceRules("board")`.
  - A `generatePresentation` stub-envelope test: an outline slide with `role:"hook"` keeps `role` on `proposedMapping[1]`.
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement.** `slideCount` overrides `requestedSlideCount(prompt)` when given; `null` = engine decides. Keep all existing count/consistency rules.
- [ ] **Step 4: Run** this file and the full suite — PASS, `fail 0`.
- [ ] **Step 5: Commit** `"Outline: story-led drafting, optional hook slide, figures from the material only"`.

### Task 5: Pipeline — understand and story before the outline, background drafting

**Files:**
- Modify: `product/domain/generation-service.js` (`requestGeneration`), `product/storage/generation-repository.js` (fields), `product/application/routes/generations.js` (body fields), `product/domain/brief-service.js` (`sanitizeCoaching` gains fields)
- Test: `test/intelligence-pipeline.test.js`

**Interfaces:**
- Consumes: Tasks 2–4.
- Produces:
  - `requestGeneration(context, { prompt, coaching, answers, wantsHook = true, slideCount = null, referenceIds = [], background = false })`. Stores `brief`, `story`, `wantsHook`, `slideCount`, `referenceIds`, and `notes: string[]` on the record.
  - With `background: true`: returns the `pending` record immediately and drafts asynchronously, writing `progress: { stage: "understanding"|"story"|"drafting", detail }` frames, then `completed` (or `failed`). Without it: same work, synchronous (tools/tests unchanged).
  - `POST /api/generations` accepts `answers`, `wantsHook`, `slideCount`, `referenceIds`, `background`; returns 202 for background, 201 otherwise.
  - Mapping slides keep `role: "hook"`.

- [ ] **Step 1: Failing tests** (stub provider recording calls):
  - Order of calls: `understandContent` → `planStory` → `generatePresentation`; `generatePresentation` receives `brief`, `story`, `register === brief.register`.
  - `wantsHook:false` → `planStory` called with `wantsHook:false`, outline gets `wantsHook:false`.
  - `slideCount: 8` → `generatePresentation` gets `slideCount: 8`.
  - `understandContent` throws → `planStory` is skipped, the outline runs with neither brief nor story, record `notes` contains "Content understanding was unavailable".
  - `planStory` throws → outline runs with the brief only; `notes` contains "Story planning was unavailable"; with `wantsHook:true` the outline still gets `wantsHook:true` (the outline writes its own hook).
  - `understandContent` rejects with "You've hit your session limit" → same as above; status `completed`.
  - `background:true` → returns status `pending` before the stub's `generatePresentation` resolves; polling `getGeneration` later shows `completed` and at least one `progress.stage === "understanding"` frame was written.
  - Route: body `{ prompt, wantsHook:false, slideCount:"8" }` → stored `slideCount === 8`; `slideCount:"you decide"` → `null`.
- [ ] **Step 2: Run** `node --test test/intelligence-pipeline.test.js` — FAIL.
- [ ] **Step 3: Implement.** Valid transitions stay `pending → completed|failed`; progress frames reuse the record's `progress` field as composition does. Build deadline (`BUILD_DEADLINE`, 9 min) is unchanged and starts at approval; drafting gets its own 4-minute cap.
- [ ] **Step 4: Run** this file + full suite — PASS.
- [ ] **Step 5: Restart the server, then commit** `"Generation: understand the content and plan the story before drafting; background drafting with progress"`.

### Task 6: No invented figures, deck-wide; the hook slide's layout

**Files:**
- Modify: `product/infrastructure/ai/claude-cli-provider.js` (`buildSlideFillPrompt`, `buildGapFillPrompt`), `product/domain/template-scoring.js` (`shortlistFor` option), `product/domain/generation-service.js` (`composeSlides`), `product/domain/variety.js` (hook exemption)
- Test: `test/intelligence-figures.test.js`

**Interfaces:**
- Consumes: `allowedNumbers`, `untraceable` (Task 3); mapping `role: "hook"` (Task 4).
- Produces:
  - `shortlistFor(sig, { …, figuresAvailable: boolean })` — when `false`, templates with `intent.feel === "data"` or role `chart` score −40.
  - `export const HOOK_TEMPLATES: string[]` in `generation-service.js` — the builder picks 4–6 existing statement/quote/big-number templates (e.g. `main/text-01`, `core/quote-single`, `marketing/text-03`, `finance/statement-split`), **light theme**; a `role:"hook"` slide is shortlisted only from these and `enforceVariety` never swaps it.
  - In `composeSlides`, after fill and the example-echo check: for each slide, `untraceable(content, allowed)`; if non-empty, try the next shortlisted non-data layout, else blank those numeric fields; push note `"Slide N: removed figures not in the material (…)"`.
  - Fill/gap prompts: "Numbers come only from: <allowed list>. If a field needs a figure that is not listed, write it qualitatively."

- [ ] **Step 1: Failing tests:**
  - Stub compose returns `finance/statement-bars` with bars `9.4%, 8.8%` for a slide when allowed = `{}` → final slide has no `9.4`/`8.8` and a note mentions "removed figures".
  - Same with allowed `{"9.4","8.8"}` → kept, no note.
  - `shortlistFor(sig, { figuresAvailable:false })` puts no `role:"chart"` template in the top 3 for a 4-bullet slide.
  - A mapping slide with `role:"hook"` gets a template from `HOOK_TEMPLATES`, theme light, and survives `enforceVariety` when its neighbour uses the same template.
  - `buildSlideFillPrompt` with `allowedNumbers` contains "Numbers come only from".
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement.** `figuresAvailable` per slide = `numbersIn(slide text).some(n => allowed.has(n))`.
- [ ] **Step 4: Run** file + full suite — PASS.
- [ ] **Step 5: Restart server, commit** `"Figures only from the material, deck-wide; the hook slide on statement layouts"`.

### Task 7: Voice pass after fill

**Files:**
- Modify: `product/domain/generation-service.js` (new `runVoicePass`, called in `composeSlides` before `runVisualReview`)
- Test: `test/intelligence-voice.test.js`

**Interfaces:**
- Consumes: `editVoice` (Task 2), `lintDeck`/`lintText` (Task 1), `untraceable` (Task 3), `textBudget`/example lengths already in `generation-service.js`.
- Produces: `export async function runVoicePass(provider, slides, { register, allowed, note, sink }) → slides`; sink stage `"voice"` with detail "Polishing the voice".

Acceptance per slide (all must hold, else keep original and note `"Slide N kept its original wording (<reason>)"`):
1. same keys and same shape (arrays same length, objects same keys) as before;
2. each string field ≤ its budget (`max(original length × 1.1, example budget)`);
3. `untraceable(newContent, allowed)` is empty;
4. `lintText` findings for the slide not more than before.
Deck-level: after accepting, if `lintDeck(...).score` is higher than before the pass, revert all.

- [ ] **Step 1: Failing tests** (stub `editVoice`):
  - Good edit (shorter, no numbers) → applied.
  - Edit adding "€5M" → slide keeps original, note contains "kept its original wording".
  - Edit dropping an array item → original kept.
  - Edit longer than budget → original kept.
  - `editVoice` throws or returns `null` → all originals, one note "The voice pass was unavailable".
  - Deck where stub edits introduce two "X, not Y" titles → whole pass reverted.
  - Speaker `notes` are edited and checked like other fields.
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement**; batch slides so each `buildVoicePrompt` stays under 28,000 chars.
- [ ] **Step 4: Run** file + full suite — PASS.
- [ ] **Step 5: Restart server, commit** `"Voice pass: edit wording to the Nagarro voice, keep any slide the edit makes worse"`.

### Task 8: References — store, parse, describe images

**Files:**
- Create: `product/storage/reference-repository.js`, `product/domain/reference-service.js`, `product/application/routes/references.js`
- Modify: `product/application/server.js` (mount `/api/references`), `product/domain/pptx-import-service.js` (export `extractSlideText(buffer): Promise<string>`), `product/infrastructure/ai/ai-provider.js` + `claude-cli-provider.js` (`describeImage`), `package.json` (`pdfjs-dist`, `exceljs`)
- Test: `test/references.test.js` (fixtures in `test/fixtures/references/`: small .pdf, .docx, .pptx, .xlsx, .csv, .md, .png)

**Interfaces:**
- Produces:
  - `POST /api/references?filename=<name>` (raw `application/octet-stream`, limit 30 MB, auth) → `201 { id, name, kind: "document"|"spreadsheet"|"image"|"text", chars, useOnSlides: false, preview: string (≤ 300 chars) }`; `POST /api/references/text` `{ name?, text }` → same shape; `PATCH /api/references/:id { useOnSlides }`; `DELETE /api/references/:id`.
  - `referenceService.get(context, id) → { id, name, kind, text, imagePath?, useOnSlides }` (workspace-scoped).
  - Caps: `MAX_REFERENCE_BYTES = 30 MB`, `MAX_REFERENCE_CHARS = 60_000` per reference (truncate with `"[truncated]"`), max 10 references per generation.
  - Parsing: PDF via `pdfjs-dist/legacy/build/pdf.mjs`; DOCX via JSZip `word/document.xml` paragraph text; PPTX via `extractSlideText`; XLSX via `exceljs` → one Markdown table per sheet (≤ 200 rows/sheet), `Sheet!A1:D20` range header; CSV → Markdown table; TXT/MD as-is; PNG/JPG/WebP → stored under `product/data/references/<id>.<ext>` (downscaled with `sharp` to ≤ 2000px when available) and `text` = `provider.describeImage({ path })` (what it shows, all legible text and figures).
  - `describeImage({ path }) → Promise<string|null>`: CLI call with `--allowedTools Read --add-dir <references dir>`; first step of implementation is to confirm the CLI reads the image in `-p` mode; if it cannot, `text` = `""` and the image is still usable on slides (note on upload response `described: false`).
  - Unsupported type → 415 with a plain message listing supported types.

- [ ] **Step 1: Failing tests:** each fixture uploads → expected `kind` and its known phrase appears in `get().text`; xlsx text contains a `|` table with the fixture's header row; a 31 MB buffer → 413; `.exe` → 415; another workspace cannot `get` the id (404); stub `describeImage` rejecting → upload still `201` with `described:false`.
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement**; `npm install pdfjs-dist exceljs`.
- [ ] **Step 4: Run** file + full suite — PASS.
- [ ] **Step 5: Restart server, commit** `"References: upload and read PDFs, Word, PowerPoint, spreadsheets, text and images as source material"`.

### Task 9: References in the pipeline

**Files:**
- Modify: `product/domain/generation-service.js` (`requestGeneration`, `composeSlides` image source), `product/domain/photo-selection.js` (author images first)
- Test: `test/intelligence-pipeline.test.js` (extend)

**Interfaces:**
- Consumes: `referenceService.get` (Task 8), `requestGeneration` (Task 5).
- Produces: `referenceIds` resolved to `{id, name, text}` for `understandContent`; `proof[].source` may be a reference id; `allowedNumbers` includes reference text; references with `useOnSlides` feed photo slots ahead of brand photography (same mechanism as import's author images).

- [ ] **Step 1: Failing tests:** references' text reaches the stub `understandContent`; a number only present in a reference survives the figure check; 11 ids → 400 "at most 10 references"; an id from another workspace → 404; an image with `useOnSlides:true` appears in the first photo slot of the composed deck; a 200k-char reference keeps every prompt ≤ 32,000 (Review Focus 4).
- [ ] **Step 2: Run** — FAIL. **Step 3: Implement.** **Step 4: Run** — PASS.
- [ ] **Step 5: Restart server, commit** `"Generation reads attached references; author images can go on slides"`.

### Task 10: Coach v2 — a question form at every Generate

**Files:**
- Create: `product/ui/coach.js` (form component), `test/brief-coach-v2.test.js`
- Modify: `js/brief-check.js` (question kinds, `assembleBrief`), `product/domain/brief-service.js` (`coach` v2), `product/infrastructure/ai/claude-cli-provider.js` (`COACH_SCHEMA` + prompt return options), `product/ui/index.html` (replace `#coach` markup), `product/ui/home.js` (use `coach.js`; always open on prompt-path Generate), `product/ui/app.css` (`.coach2-*`), `product/ui/lib/api.js` (reference upload calls)

**Interfaces:**
- Consumes: references API (Task 8), `requestGeneration` fields (Task 5).
- Produces:
  - `POST /api/briefs/coach` → `{ questions: Question[], source }`, `Question = { id: "audience"|"goal"|"points"|"figures"|"references"|"hook"|"length", question: string, why?: string, options: {value, label}[], multi: boolean, freeText: boolean, placeholder?: string }`.
  - Order and rules (spec §0): `audience`/`goal` (merged into one question with id `audience` when both missing) and `points` only when the checklist shows them missing; `references` whenever none attached; `hook` always, `why` = the one-to-two sentence explanation, options `yes` "Yes, open with a hook (recommended)" / `no` "No, start with the content"; `length` always, options `you-decide` "You decide — no limitations" (default), `~5` "About 5", `8-10`, `12-15`, plus free number, `why` notes "includes the cover and the hook" when hook = yes; `figures` only when the model says the topic needs them. Model supplies options for `audience`/`points`/`figures`; fixed options for the rest; fixed fallback for everything on failure.
  - **Latency (measured 2026-10-20):** the Haiku coach call takes ~19s through the CLI, so today's 10s budget always falls back. The form must open **immediately with the fixed questions**; tailored options arrive from a second request (`POST /api/briefs/coach` with a 30s budget, `COACH_TIMEOUT_MS = 30_000`) and replace a question's options only if the user has not answered it yet.
  - `assembleBrief(prompt, answers)` unchanged for content answers; new `coachPayload(answers) → { wantsHook: boolean, slideCount: number|null, referenceIds: string[], answers }` in `js/brief-check.js`.
  - UI: form replaces/sits above the composer, one question at a time, Back / Next / Skip, progress "2 of 5", options as selectable pills (radio or checkbox), a free-text box, "Generate now" always enabled; Esc closes; the references question has attach + paste inside it (uses Task 8 endpoints, shows chips with remove and the "Use on slides" toggle for images).

- [ ] **Step 1: Failing tests** (`test/brief-coach-v2.test.js`, stub provider): a full prompt still returns `hook` and `length` (coach always opens); no references attached → `references` question present; `hook.options` values `["yes","no"]`; `length.options[0].value === "you-decide"`; provider failure → fallback questions with the same ids; `coachPayload({hook:"no", length:"you-decide"})` → `{ wantsHook:false, slideCount:null }`; `coachPayload({hook:"yes", length:"8"})` → `slideCount: 8`.
- [ ] **Step 2: Run** — FAIL. **Step 3: Implement** (server + UI). Generate posts `{ prompt: assembleBrief(...), coaching, ...coachPayload(answers), background: true }` and follows Task 11's drafting poll.
- [ ] **Step 4: Run** full suite — PASS. **Browser check** (preview, `npm start` restarted): every Generate opens the form; options select; free text works; attach a PDF and an image inside the form; Skip/Back/Next/Esc; "Generate now" mid-form; dark mode; 390px width.
- [ ] **Step 5: Commit** `"Coach v2: a question form at every Generate — references, the hook, optional length"`.

### Task 11: Drafting progress and the getting-started guide

**Files:**
- Modify: `product/ui/lib/deck-build.js` (`draftAndWait(generationId, { onProgress })`), `product/ui/home.js`, `product/ui/index.html`, `product/ui/app.css`
- Create: `product/ui/guide.js`
- Test: `test/pages.smoke.test.js` (extend: guide link and form markup present)

**Interfaces:**
- Consumes: background drafting (Task 5), progress stages `understanding|story|drafting` and compose stages incl. `voice` (Task 7).
- Produces: build view shows "Understanding your content", "Shaping the story", "Drafting the slides", then existing stages, then "Polishing the voice". Guide: link "New here? How to get a great deck" near the composer → popover/side panel with three steps, three examples (board update, client pitch, culture deck) each with "Use this example" filling `#prompt`, a weak vs strong prompt pair, and one line on the hook. First-visit highlight only; `localStorage["nps:guide-seen"]` (try/catch), never a blocking modal.

- [ ] **Step 1: Failing test:** smoke test asserts `#guide-link` and `#coach2` exist in `index.html`.
- [ ] **Step 2: Run** — FAIL. **Step 3: Implement.**
- [ ] **Step 4: Run** full suite — PASS. **Browser check:** guide opens/closes, examples fill the prompt, highlight only on first visit; a weak prompt shows the three drafting stages then build stages.
- [ ] **Step 5: Commit** `"Build view: drafting stages; getting-started guide with example prompts"`.

### Task 12: Measure it — audit, brief run, quality check, docs

**Files:**
- Modify: `tools/audit-decks.mjs` (`voice` finding via `lintDeck`; `hook` finding: prompt-path deck whose generation wanted a hook but has no `role:"hook"` slide 2), `tools/generate-briefs.mjs` (`--weak` set of 4 short prompts; `--refs <dir>` to attach fixture references; pass `wantsHook:true`), `docs/CHANGELOG.md`, `CLAUDE.md` (gotchas: voice module + lint, no invented figures, hook role, references)
- Test: `test/generation-quality.test.js` (extend: audit kinds exist and fire on fixtures)

- [ ] **Step 1: Failing tests** for the new audit kinds on small fixture decks. **Step 2: Run** — FAIL. **Step 3: Implement.** **Step 4: Run** — PASS.
- [ ] **Step 5: Quality check.** Restart server; confirm `/api/meta` commit = `HEAD`. Run `node tools/generate-briefs.mjs --weak` (with and without hook), then the standard 10 briefs, and two with `--refs`. Report: hook present where wanted; untraceable figures = 0 (`audit-decks` `example-data`/`voice`/figure notes); `lintDeck` score per deck before (14a2c80 run) vs after; contact sheets of every slide for the user's review.
- [ ] **Step 6: Changelog + CLAUDE.md, full suite `fail 0`, commit** `"Intelligence layer: audits, brief runs and docs"`.
