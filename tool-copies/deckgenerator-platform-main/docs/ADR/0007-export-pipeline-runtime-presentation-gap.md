# 0007 — No governed mechanism for a runtime Presentation to enter the Export Pipeline

## Status

Accepted

## Background

This section describes the existing architecture exactly as documented, across the Product Layer specification series (Architecture Contract → Product Layer Spec → Technical Blueprint → UX Specification → Implementation Master Plan → Implementation Specification), in precedence order.

**The Rendering Engine and the Export Pipeline are documented as two distinct, existing subsystems.** The Architecture Contract's subsystem inventory (§02) lists five existing subsystems — Rendering Engine, Templates, Viewer, Export Pipeline, Dashboard — each with its own responsibility, public API, dependencies, and file list. The Rendering Engine's public API is `buildStage(slide, deckMeta)`, described as "the only export that matters." The Export Pipeline is documented separately: "Convert a rendered deck into an editable PPTX and a pixel-exact PDF," with its own public API — a CLI (`node tools/export-pptx.mjs <deck-id>`) and browser-side globals (`window.__renderSlide`, `window.__extractSlide`) exposed on `export.html`.

**Eleven files (grouped into eight immutability entries) are documented as immutable**, "not 'handle with care' — do not touch, except to fix a proven bug in the engine itself, never to accommodate the Product Layer" (Architecture Contract §09). Among them: `js/decks/index.js` ("the deck registry lookup surface. The contract every future Storage/API implementation must mirror, not replace") and, as one grouped entry, `js/engine.js`, `export.html`, `js/export.js`, `tools/export-pptx.mjs` ("the two always-correct consumers of `buildStage()`. Any change must preserve pixel-identical rendering across both, verified, not assumed").

**The deck registry (`js/decks/index.js`) is documented as static, git-committed data.** Architecture Contract §06: "Templates & Master decks... Stay 100% git-committed code, by design — brand templates are a reviewed, controlled asset, not user data." Rule 30 (§03): "`js/templates/index.js` and `js/decks/index.js` remain the source of truth for git-committed content. A runtime presentation is never programmatically written back into these files."

**The Engine Gateway is documented as the sole approved bridge from the Product Layer into the engine.** Architecture Contract §06: "The Engine Gateway — a new, additive file, never an edit to an existing one — sits between Storage and the Viewer/Export. It translates a database row into the exact same contract shape a static import already produces, then hands that plain object to the exact same `buildStage()` call the Viewer has always used. The engine gains a second caller. It does not gain a second code path." This mechanism is built and in production use for the Viewer path (`render.html` / `js/render-gateway.js`, Milestone M1/M3, and `product/application/gateway/engine-gateway.js`, Milestone M3).

**Milestone M10 ("Export Wiring") is documented as the milestone that wires this same reuse for Export.** Implementation Master Plan, M10's own entry: "On-demand PDF/PPTX (Phase 3 §04/§08), reusing the existing Export Pipeline exactly... Acceptance criteria: Both formats generate correctly with zero changes to Export Pipeline files." Architecture Contract, Phase 7 (Export): "Wire on-demand PDF/PPTX generation as an async Job against database-backed presentations, reusing the existing Export Pipeline exactly... Success criteria: A database-backed presentation exports via the existing exporter with zero changes to `js/export.js` or `tools/export-pptx.mjs`'s core logic." The Product Layer Spec's Export Jobs module: "drive the existing Export Pipeline against a database-backed presentation via the Engine Gateway... The Export Pipeline's existing entry points, via the Engine Gateway — never a reimplemented DOM walker or PPTX assembly." Rule 35: "Export Jobs reuse the existing Export Pipeline's entry points unmodified — no export logic is duplicated in the Product Layer."

## Problem Statement

The specification requires all of the following to hold simultaneously for M10:

1. The Export Pipeline's files (`export.html`, `js/export.js`, `tools/export-pptx.mjs`) are reused **unmodified** ("zero changes... core logic," Architecture Contract Phase 7; Master Plan M10 file-impact row: "Allowed to change: None in the Export Pipeline itself (Rule 35)").
2. No Export Pipeline logic is **duplicated** in the Product Layer (Rule 35: "no export logic is duplicated in the Product Layer"; Rule 23: "No milestone duplicates DOM-walking or PPTX/PDF assembly logic — M10 only orchestrates the existing pipeline").
3. The deck registry (`js/decks/index.js`) is never made to contain a runtime presentation (Rule 30: "A runtime presentation is never programmatically written back into these files").
4. A database-backed presentation is, in fact, exportable through this pipeline (M10's stated acceptance/success criteria, quoted above).

These four requirements cannot all be true simultaneously, given the Export Pipeline's documented and implemented structure:

- The Export Pipeline's only entry point (`export.html?id=<id>`) resolves its content exclusively through `getDeck(id)`, a lookup over the exact registry Requirement 3 forbids populating with runtime data.
- The Export Pipeline's reusable logic (the DOM walker behind `window.__extractSlide`, and the PPTX/PDF assembler in `tools/export-pptx.mjs`) has no public interface independent of that same entry point — there is no second, already-specified way to invoke it, per Requirement 1's prohibition on modifying the files that contain it.
- Requirement 2 forecloses recreating that logic in a new, Product-Layer-owned file as a way around the first two constraints.
- Requirement 4 nonetheless requires the pipeline to run against data that Requirements 1–3, taken together, leave it structurally unable to reach.

The Engine Gateway passage quoted above ("sits between Storage and the Viewer/Export... hands that plain object to the exact same `buildStage()` call the Viewer has always used") is the specification's own stated resolution for this class of problem. On inspection, it names a mechanism (handing an object to `buildStage()`) that is sufficient for the Viewer, but the sentence does not establish — and no other passage in any of the five documents establishes — how that same mechanism reaches the Export Pipeline's walker and assembler, which operate downstream of `buildStage()`'s output rather than consuming its input.

## Evidence

**From the documents:**
- Architecture Contract §02 lists Rendering Engine and Export Pipeline as separate subsystems with separate public APIs and separate file lists.
- Architecture Contract §09 lists `js/decks/index.js` and (`export.html`, `js/export.js`, `tools/export-pptx.mjs`) as immutable, "never to accommodate the Product Layer."
- Architecture Contract Rule 30 (§03) prohibits a runtime presentation being written back into `js/decks/index.js`.
- Architecture Contract §06 describes the Engine Gateway's mechanism strictly in terms of `buildStage()`.
- Product Layer Spec, Technical Blueprint, Master Plan, and Implementation Specification all separately state that Export reuses the pipeline "via the Engine Gateway," without any of the four specifying a mechanism beyond that phrase.
- Master Plan Rules 23 and 35 prohibit duplicating DOM-walking/assembly logic in the Product Layer.
- Master Plan's M10 file-impact entry: "Allowed to change [in the Export Pipeline]: None."

**From the existing implementation** (read directly, not inferred):
- `js/export.js`'s sole content-resolution statement is `const deck = getDeck(params.get("id")) || decks[0];` (line 29) — every other reference to `deck`/`params`/`getDeck` in the 459-line file occurs only in the boot section (lines 24–62); the walker (`window.__extractSlide`, defined at line 439, and every helper function preceding it) contains no reference to `deck`, `params`, or `getDeck` anywhere.
- `js/decks/index.js` is a static ES module built from two compile-time imports, with no registration function and no dynamic resolution path.
- `tools/export-pptx.mjs` contains zero `export` statements (confirmed by full-file search) — it is invocable only as an opaque CLI subprocess, not importable as a library.
- `tools/export-pptx.mjs`'s own per-slide loop (line 233) invokes `window.__renderSlide(i)` — the original function, bound to whatever `deck` resolved at module load — on every slide of every export, unconditionally.
- `product/application/gateway/engine-gateway.js` (the Application Layer's Engine Gateway handler) and `js/render-gateway.js` (its frontend counterpart) both terminate at a `buildStage()` call; neither references `js/export.js`, `export.html`, or `tools/export-pptx.mjs`.

## Architectural Decision Required

The architecture must define one supported mechanism by which a runtime (database-backed) Presentation's content becomes reachable by the Export Pipeline's existing walking and assembly logic, consistent with whatever governing constraints the amended architecture specifies for the Export Pipeline's files and the deck registry. This document does not propose what that mechanism is.

## Consequences

- **M10 is blocked.** Its own stated acceptance and success criteria (export a database-backed presentation, through the existing pipeline, with zero changes to the pipeline's files) cannot be met under the current, unamended specification, for the reasons given above. No implementation of M10 can be evaluated as compliant against a specification that does not, on inspection, describe a satisfiable set of requirements.
- **Later milestones that depend on export are also blocked.** The Master Plan's own M10 entry names "M14's Export Jobs history screen" as a milestone M10 enables; a screen whose purpose is to list and re-download exports (Export Jobs / Activity, per the UX Specification) has no data to display and no export-retry action to perform until M10 exists. Journeys 9 and 10 (Export PPTX, Export PDF) in the UX Specification cannot be validated by any implementation until this amendment is resolved.
- **No implementation should proceed until the amendment is resolved**, because any implementation attempted now would necessarily satisfy some subset of Requirements 1–4 at the expense of another, and would therefore not be a faithful implementation of the current specification — it would be a de facto amendment made silently, by the implementer, rather than a documented architectural decision made explicitly, by the owner of the architecture.

## Out of Scope

This amendment:
- Introduces no implementation.
- Changes no milestone's scope, ordering, or acceptance criteria.
- Approves no workaround.
- Selects no design option (the four previously investigated — direct registry mutation, an additive export from an immutable file, a parallel Export Gateway duplicating pipeline logic, and runtime response substitution — are not adjudicated here; none is endorsed, and none is excluded, by this document).

## Amendment

Ratified as an addition to the Architecture Contract, in the same voice and standing as its existing sections and rules.

**Correction to §06.** The sentence "The Engine Gateway... sits between Storage and the Viewer/Export" is corrected to read: *sits between Storage and the Viewer*. The mechanism §06 goes on to describe — translating a database row into the `{meta, slides}` contract shape, then handing it to `buildStage()` — is proven and sufficient for any consumer whose entire integration surface is `buildStage()`'s return value. The Viewer is such a consumer; the Export Pipeline, whose reusable behavior (DOM extraction, file assembly) operates downstream of `buildStage()`'s output rather than consuming its input, is not. No other passage of this Contract specifies a mechanism by which the Export Pipeline receives runtime data. This correction records that fact. It authorizes no new file, process, or code path on its own.

**New rule (§03, Export Pipeline extension) — Rule EP-1.** No milestone may cause a runtime Presentation's content to be processed by the Export Pipeline's walking or assembly logic until a specific, named integration mechanism for doing so has been ratified by its own amendment to this Contract, following this same process. Until such an amendment exists, `export.html`, `js/export.js`, and `tools/export-pptx.mjs` may continue to be exercised only against git-committed, statically-registered decks, exactly as today.

**Rule EP-2.** A mechanism ratified under Rule EP-1 must be shown to satisfy, simultaneously and without exception:
  (a) Rule 17 — none of the §09 immutable-file entries is modified;
  (b) Rules 23/35 — no DOM-walking or PPTX/PDF assembly logic is reproduced outside its current, single, existing location;
  (c) Rule 30 — the deck registry never comes to contain, or appear to any process to contain, a runtime presentation, by direct edit or by any other means of substitution; and
  (d) the mechanism operates on demand, per Presentation, without requiring any change to how the two currently-registered static decks are exported.
A candidate mechanism that fails any one of (a)–(d) is not eligible for ratification under this rule.

**Rule EP-3.** Selecting the specific mechanism satisfying Rule EP-2 is a distinct architectural decision, made and ratified independently of this amendment. This amendment does not select, prefer, or foreclose any candidate mechanism, including any of the four previously investigated under ADR-0007.
