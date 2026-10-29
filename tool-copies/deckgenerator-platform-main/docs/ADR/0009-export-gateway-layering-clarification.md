# 0009 — Export Gateway layering clarification

## Status

Accepted — narrow supplement to ADR-0008

## Background

ADR-0007 identified the runtime export contradiction: no existing mechanism let a database-backed Presentation reach the Export Pipeline without violating one of unmodified-files, no-duplication, or registry-integrity, and required any resolution to be ratified as its own amendment.

ADR-0008 selected and ratified the resolution: the Export Gateway, a new, additive, Product-Layer-owned subsystem that fetches a Presentation's `{meta, slides}` and runs a maintained port of the Export Pipeline's DOM-extraction and PPTX/PDF-assembly logic, under a scoped, named exception to the Architecture Contract's no-duplication principle.

The Architecture Owner review of the resulting Step 1.5 decision table found one remaining ambiguity, not a new contradiction: ADR-0008 described the Export Gateway as a single subsystem, but it in fact contains two components with different dependency characteristics — one that actively calls outward to obtain data, and one that is purely called-into logic with no outbound calls of its own. The existing eight-layer model has no slot for a component that is simultaneously both. This ADR resolves that ambiguity. It introduces no new mechanism and revisits no decision already made.

## Architectural Clarification

The Export Gateway, as ratified by ADR-0008, consists of two architectural components.

**Component A — Export Gateway Mounting Stage.**

Belongs to the existing Application Layer. It:
- orchestrates the export use case,
- obtains a deck definition,
- coordinates rendering of that definition,
- may call the Domain Layer exactly as already permitted by the existing dependency table — no new permission is created for it,
- contains no rendering or export logic of its own.

It is, architecturally, a second instance of the same pattern the existing Engine Gateway already establishes for the Viewer — the same category of component, doing the same kind of work, for a different downstream consumer.

**Component B — Export Gateway Export Runtime.**

A new, locked architectural category. It:
- owns the maintained port of DOM extraction,
- owns the maintained port of PPTX/PDF assembly,
- has zero outbound dependencies,
- is callable only from the Mounting Stage,
- is Product-Layer owned,
- is not part of the immutable engine, and is never mistaken for it.

This category exists only because ADR-0008 already created the one sanctioned duplication exception. This ADR does not create that exception; it names where the thing ADR-0008 already authorized lives.

## Dependency Rules

**Export Gateway Mounting Stage (Application Layer).**
- Allowed dependencies: the Domain Layer, Authentication — identical to every other Application Layer component, per the existing dependency table.
- Forbidden dependencies: the UI Layer (never calls back up); Storage, Rendering, or Export directly, except through a named seam — here, its own call into the Export Runtime, exactly as the Engine Gateway's existing seam reaches the Rendering Layer.

**Export Gateway Export Runtime (new locked category).**
- Allowed dependencies: none. Zero outbound dependencies, identical posture to the existing Rendering Layer and Export Layer.
- Forbidden dependencies: everything above it — UI, Application, Domain, Storage, Infrastructure, AI. It receives a rendered stage and returns extracted/assembled output; it initiates no call of its own.

**Cross-cutting rules.**
- The Domain Layer never directly invokes either component. The Domain Layer's Export Service calls only Presentation Service (an already-permitted Domain-to-Domain call) and the Export Repository; it does not reach into either Export Gateway component.
- The Export Runtime is never called directly by UI code, or by anything other than the Mounting Stage.

## Relationship to Existing Layers

- The existing Export Layer (`export.html`, `js/export.js`, `tools/export-pptx.mjs`) is unchanged — still locked, still zero outbound dependencies, still the sole export path for git-committed, statically-registered decks.
- The existing Rendering Layer (`buildStage()`) is unchanged — still the one function both the Viewer's Engine Gateway and the Export Gateway's Mounting Stage call, with no second code path.
- The existing Engine Gateway is unchanged — this ADR places a second, analogous component beside it; it does not modify it, extend its file, or alter its contract.
- This ADR introduces no additional duplication permissions beyond the one ADR-0008 already ratified — it places that one exception, it does not widen it.
- This ADR creates no new precedent. Any future need to duplicate a different piece of engine logic still requires its own ADR, per ADR-0008 §4, unaffected by this document.

## Consequences

- ADR-0008 remains unchanged. This document adds a placement to what it already ratified; it amends none of its wording.
- This ADR only clarifies placement — it defines no new mechanism, revisits no prior decision, and settles no question ADR-0007 or ADR-0008 did not already leave open.
- M10 is now fully architecturally specified.

## Out of Scope

This ADR:
- Does not change ADR-0008.
- Does not alter Rule 30.
- Does not alter the immutable files listed in Architecture Contract §09.
- Does not alter Rule 17.
- Does not alter Rule 23 except as already amended by ADR-0008.
- Does not alter Rule 35 except as already amended by ADR-0008.
