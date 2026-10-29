# 0008 — The Export Gateway: sanctioned mechanism for runtime presentations to enter the Export Pipeline

## Status

Accepted — ratifies the decision deferred by ADR-0007 (Rule EP-1/EP-3)

## Relationship to ADR-0007

ADR-0007 established that no existing mechanism lets a runtime Presentation reach the Export Pipeline without breaking one of: unmodified Export Pipeline files, no duplicated export logic, or an untouched deck registry — and required that any resolution be ratified as its own amendment (Rule EP-1), tested against Rule EP-2's four conditions, and left the specific mechanism unselected (Rule EP-3). This document is that amendment.

---

## Amendment to the Architecture Contract

### 1. The mechanism: the Export Gateway

A new subsystem, **the Export Gateway**, is added to the Architecture Contract's subsystem inventory (§02), as an additive counterpart to the existing Engine Gateway — the Engine Gateway serves the Viewer; the Export Gateway serves the Export Pipeline.

**Responsibility.** Convert a database-backed Presentation into an editable PPTX and a pixel-exact PDF, on demand, using the same fetch-then-mount pattern already proven by the Engine Gateway, extended with a maintained port of the Export Pipeline's own extraction and assembly behavior.

**Structure.** The Export Gateway consists of:
- A mounting stage that fetches `{meta, slides}` from the existing Engine Gateway contract (`GET /api/presentations/:id/deck`) and renders each slide through the unmodified `buildStage()` — identical in kind to the Engine Gateway's own established pattern (Architecture Contract §06), introducing no new behavior at this step.
- A maintained port of the Export Pipeline's DOM-extraction (`window.__extractSlide` and its supporting functions) and PPTX/PDF-assembly logic (`tools/export-pptx.mjs`'s conversion and file-writing logic), owned by the Product Layer, kept behaviorally equivalent to the original under the verification obligation in §4 below.

**What does not change.** `export.html`, `js/export.js`, `tools/export-pptx.mjs`, and `js/decks/index.js` are not modified, in any respect, by this amendment or by anything it authorizes. They remain the sole, exclusive, unmodified export path for git-committed, statically-registered decks — today, the Master Template and ASSA ABLOY — exactly as before this amendment. No runtime Presentation is ever written to, imported by, or made resolvable through `js/decks/index.js`, by this mechanism or any other; Rule 30 is not touched by this amendment and continues to apply without exception.

### 2. Why this mechanism, and why now

Of the mechanisms considered during the investigation preceding ADR-0007, three required either editing an immutable file's contents (violating §09 outright) or causing an immutable file to behave, for some requests, differently from its own committed source (found, on review, to violate §09's and Rule 30's purpose even where it preserved their literal text). Both classes of violation reach outside the Product Layer's boundary into the engine's own guaranteed behavior — the thing §09 exists to make provable by inspection, for every file, in every circumstance, forever.

The Export Gateway's cost is contained to a single, named, already-anticipated category of debt: a second, Product-Layer-owned copy of logic that also exists, unmodified, in the engine. This is the one class of exception the Architecture Contract's own text already contemplates as a boundary condition rather than a violation of the engine's guarantee — §02's Export Pipeline entry states its callers may reach it "as a subprocess or equivalent," language that presupposes some flexibility in *how* the pipeline is invoked, even though (as ADR-0007 established) it does not by itself supply enough flexibility to reach a live Presentation. Confining the exception to logic, owned entirely outside the engine's own files, that can be verified against the original rather than merely trusted, preserves the Architecture Contract's central guarantee — "the engine is correct, and stays that way" — for every one of the eight immutable-file entries without exception. Nothing about the engine's own files, or what a future engineer can verify about them with `git diff`, changes because this amendment exists.

### 3. Rules amended or superseded

**Architecture Contract §02, Export Pipeline, "May call it" — amended.**

> Original: "Users/CLI today; the future Jobs module, as a subprocess or equivalent — never by re-implementing the DOM walker."

> Amended to: "Users/CLI, against git-committed decks, unmodified, forever. A database-backed Presentation is never rendered through this entry point; it is rendered through the Export Gateway (§02a), whose extraction and assembly logic is a maintained port of this subsystem's own, verified equivalent under the obligation in §4 of ADR-0008 — the one named exception to this Contract's general prohibition on re-implementing the DOM walker, scoped exclusively to that purpose."

**Architecture Contract §09, immutable files — clarified, not weakened.**

The qualifying clause "except to fix a proven bug in the engine itself, never to accommodate the Product Layer" continues to govern `export.html`, `js/export.js`, `tools/export-pptx.mjs`, and `js/decks/index.js` without exception. This amendment accommodates the Product Layer by adding a new subsystem beside these files, not by relaxing what "immutable" means for any of them. No future milestone may cite this amendment as precedent for editing any of the eight immutable-file entries; it authorizes duplication elsewhere, never modification here.

**Master Plan Rule 23 and Product Layer Spec Rule 35 — superseded, within their conflict with this amendment, by Architecture Contract precedence.** Both restate, at their own phase, the same "no duplication" principle §02 states at Phase 1. Per the established precedence order, this amendment's narrowing of that Phase 1 principle governs; Rules 23 and 35 should be read as qualified by it, and updated to reference it when the Master Plan and Product Layer Spec are next revised. Outside the one named exception this amendment creates, Rules 23 and 35 continue to apply at full strength — including to every other subsystem of the engine, and to every other milestone.

### 4. New invariants future milestones must obey

- **Behavioral parity is a standing, checked obligation, not a one-time claim.** Any change to `js/export.js`'s walker or `tools/export-pptx.mjs`'s assembly logic must be accompanied, in the same change, by the matching update to the Export Gateway's ported copy, verified by exporting an equivalent slide through both paths and confirming equivalent output. A change to either side without this check is incomplete, regardless of milestone.
- **`tools/EXPORT-NOTES.md`'s invariants bind the ported copy too.** Every previously-fixed bug catalogued there is a requirement on the Export Gateway's extraction/assembly logic, not merely a historical note about the original file.
- **The original Export Pipeline remains the sole path for git-committed decks, permanently.** No milestone may route a static, registry-resolved deck through the Export Gateway; no milestone may route a database-backed Presentation through the original entry point. The two paths do not merge, converge, or become interchangeable.
- **This amendment authorizes one exception, not a pattern.** Any future need to duplicate a different piece of engine logic requires its own ADR and its own Architecture Contract amendment, evaluated on its own facts — this document is not a general license for the Product Layer to duplicate engine behavior wherever reuse proves hard.
- **The Export Gateway remains workspace-agnostic and reaches Storage only through the Backend API**, per the layering rules already governing every other Product Layer subsystem (Architecture Contract §03) — it introduces no new exception to authentication, workspace scoping, or the API-Layer-only rule for Storage access.

### 5. Acceptance criteria required for M10

In addition to the Master Plan's existing M10 acceptance criteria, an implementation is compliant with this amendment only if, additionally:
- `export.html`, `js/export.js`, `tools/export-pptx.mjs`, and `js/decks/index.js` show zero diff against their pre-M10 state.
- The Master Template and ASSA ABLOY decks continue to export via the original, unmodified CLI path, unaffected by the Export Gateway's existence.
- A database-backed Presentation exports correctly (both formats) via the Export Gateway.
- The behavioral-parity check required by §4 is run and passes as part of M10's own test plan, for at least one representative slide of each kind the Export Gateway's ported logic handles (text, shape, image ops).
- A failed export never removes a prior valid export (Rule 36/Rule 24, unchanged and unaffected by this amendment).

---

This amendment resolves ADR-0007. M10 may proceed once this document is treated as ratified.
