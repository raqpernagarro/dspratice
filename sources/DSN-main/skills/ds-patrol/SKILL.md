---
name: ds-patrol
description: Cross-repo consistency patrol for DS-Nagarro and its consuming apps. Catches violations across six domains: token architecture, documentation coverage, documentation structure, forbidden code patterns, cross-file rule drift, and accessibility rules. Triggers on phrases like "patrol", "run patrol", "check consistency", "scan for violations", "what's broken", "is everything in sync", or any time a significant batch of work has landed and a health check is warranted. Also trigger proactively after a component is added, a rule changes, or a session in the consuming app surfaces repeated agent mistakes.
---

# DS-Nagarro — Patrol Skill

You are running a consistency patrol across the DS-Nagarro library and its consuming app. Work through each domain below in order. For every violation found, trace it back to the documentation file that allowed it to happen — a missing rule in AI.md, a gap in a spec file, a contradiction in AGENTS.md. Output a triage report at the end.

---

## Scope and invocation

The patrol has two targets:

- **DSN repo** — `~/Documents/GitHub/DSN`
- **Consuming app** — `~/Documents/GitHub/WorkScope` (default) or a path supplied in the prompt

Run both targets by default. If the user says "patrol the DS" or "patrol WorkScope", scope to that target only.

---

## What to read before patrolling

Always read these files before running any checks. They are the sources of truth the patrol validates against.

**From DSN:**
- `AI.md`
- `AGENTS.md`
- `tokens.css`
- `src/components/` — directory listing (not every file, just the listing)
- `specs/` — directory listing

**From the consuming app:**
- Any files flagged in the prompt
- Entry point files if specific violations are suspected

If a file is missing or unreadable, note it and continue. A partial patrol is still useful.

---

## Domain 1 — Token architecture

Check `tokens.css` for:

**Violations (error):**
- Raw hex values at the semantic layer — any CSS custom property under `:root` that references `--color-*` primitives but uses a literal hex value instead of `var(--primitive-*)` is a chain break
- Semantic tokens that reference other semantic tokens directly, skipping the primitive layer
- Component tokens that reference primitives directly, skipping the semantic layer

**Violations (warn):**
- Dataviz categorical tokens (`--color-background-dataviz-1` through `--color-background-dataviz-8`, `--color-background-dataviz-positive/negative/warning/neutral`) currently hold raw hex — this is a known acknowledged gap, log as `warn` not `error` until resolved
- Token names that don't follow the naming convention (`--[layer]-[namespace]-[role]-[variant]`)

**How to check:** Scan `tokens.css` for `:#[0-9a-fA-F]` patterns outside the primitives block. Any match at the semantic or component layer is an error.

---

## Domain 2 — Documentation coverage

Every component that is exported from the library must have all four of:

1. A spec file in `specs/` at the correct tier (`atoms/`, `molecules/`, `organisms/`, `patterns/`)
2. A Storybook story file (`*.stories.tsx`)
3. A JSDoc block on the component's main export with at least `@description` and `@example`
4. An `AIUsage.mdx` entry or reference in the component's story

**How to check:**
- List all named exports from `src/index.ts` (or `src/components/index.ts`)
- For each component, check whether the four artefacts exist
- Flag each missing artefact as a `warn`

**Exceptions:**
- Internal-only components (prefixed `_` or not re-exported from the library's index) are exempt
- `StoryUI/` is intentionally isolated infrastructure — exempt from all doc coverage checks

---

## Domain 3 — Documentation structure

For each spec file found in `specs/`:

**Required sections (warn if missing):**
- `When to use`
- `When not to use`
- `Anatomy` or `Props` (at least one)
- Spatial contract note — does the component own its spacing, or defer to parent?

**Quality checks (warn):**
- Hardcoded pixel values in prose descriptions — descriptions must state intent, never measurements
- Hardcoded hex values anywhere in a spec file
- Sentence case violations in headings (`## When To Use` is wrong; `## When to use` is correct)
- "When to use" section that only describes what the component does, not when to choose it over alternatives

---

## Domain 4 — Forbidden patterns in the consuming app

Scan the consuming app's source files for the following. Each is an `error`.

| Pattern | Rule |
|---|---|
| `lucide-react` version in the app's `package.json` ≠ the version in DSN's `package.json` `dependencies` | Apps list `lucide-react` at the same version `ds-ngr` uses. Importing from `lucide-react` is correct — DSN does not re-export icons. |
| `import .* from "@ngrr/ds"` or `from 'ngrr-ds'` | Library is npm-linked. The import path must match the linked package name. |
| `<Card[^>]*>.*<DataTable` (multiline) | DataTable must never be wrapped in a Card. |
| Inline `padding` or `margin` on the direct child of `<AppShell>` main area | AppShell provides its own padding. Never add a wrapper with padding inside it. |
| Raw hex values in inline styles or CSS-in-JS — `#[0-9a-fA-F]{3,6}` | Always use tokens. Never hardcode hex in component code. |
| `var(--color-[a-z]+-[0-9]+)` used directly in component styles | Primitive tokens must not be used in component code. Use semantic tokens. |

**How to check:** Run regex scans across `src/` in the consuming app. For multiline patterns (Card + DataTable), scan for `<DataTable` and check whether it appears inside a `<Card` block in the same file.

**Note:** Flag the location (file + approximate line) for each violation. Do not suggest fixing it in the consuming app — map it back to the DS documentation gap that caused it.

---

## Domain 5 — Cross-file rule drift

Check that the following rules are stated consistently across `AI.md`, `AI-short.md`, and `AGENTS.md`. They must never contradict each other.

| Rule | Where it must appear |
|---|---|
| AppShell has built-in padding, never add wrapper | All three files |
| DataTable never in a Card | `AI.md`, `AI-short.md` |
| Icons only from lucide-react, listed at the same version ds-ngr uses | `AI.md`, `AI-short.md` (`AGENTS.md` must not contradict) |
| Three-layer token model | All three files |
| Sentence case everywhere | All three files |
| Figma is single source of truth for tokens | `AGENTS.md` (consumer files may omit, must not contradict) |
| Focus rings implemented with `box-shadow`, never `outline` (overflow-clipping) | `AGENTS.md` Common Mistakes (implementation detail — builder-only). Must not contradict `AI.md`'s consumer-facing "focus must never be hidden by `overflow: hidden` on a parent." |

**How to check:** Read the relevant section in each file. If a rule is absent from a file where it must appear, that is a `warn`. If a rule is stated differently (contradicts), that is an `error`.

This is a lighter version of the full `ds-doc-audit` skill. If drift is found, recommend running that skill for a full corrected output.

---

## Domain 6 — Accessibility rules

Check `tokens.css` and any component styles for:

**Violations (error):**
- Text colour / background colour combinations where the semantic token pairing is known to fail WCAG AA contrast (4.5:1 for normal text, 3:1 for large text). Check known pairings: `--color-foreground-neutral-primary` on `--color-background-neutral-primary`, `--color-foreground-on-accent` on `--color-background-accent-strong-default`.
- Interactive elements with no focus indicator token defined
- A focus ring token (`--color-shadow-focus-inset`, `--color-border-interactive-focus`) whose alias chain resolves to the same raw hex as the background token it sits on — an invisible ring hiding behind a plausible-looking token name. Resolve the chain to hex before ruling this out.
- A `:focus-visible` (or `:focus`) rule in component CSS that sets a visible ring via `outline` instead of `box-shadow` — `outline` is silently clipped by any `overflow: hidden` ancestor (AppShell, DataTable's scroll region, Drawer, Popover). See AGENTS.md Common Mistakes.

**Violations (warn):**
- Components documented in `specs/` with no accessibility notes section
- Motion tokens used without a `prefers-reduced-motion` override note in the spec

**How to check the outline/box-shadow violation:** Scan component `.css` / `.styles.ts` files for `outline:` declarations whose value is not `none` or `0` (i.e. not a reset). For each match, confirm the same rule (or an adjacent rule) also has an equivalent `box-shadow` ring — if not, flag it as an error and cite the exact file and line.

**Note:** Full contrast auditing requires rendered output. This domain covers only what can be assessed statically from token values and spec files. Flag it and recommend a Storybook accessibility run for full coverage.

---

## Output format

```
## DSN patrol — [date]
Target: [DSN only | WorkScope only | Both]

---

### 🔴 Errors — fix before next release

[Domain N — Name]
- [File or component]: [what the violation is]
  → Root cause: [which doc file is missing or wrong]
  → Fix: [what must be added or changed in AI.md / AGENTS.md / specs/]

### 🟠 Warnings — fix before next minor version

[Domain N — Name]
- [File or component]: [what the issue is]
  → Recommendation: [what to do]

### 🟡 Coverage gaps — backlog

- [Component or area]: [what's missing]

### ✅ Clean domains
- [Domain name]: no violations found

---

### Summary
- [N] errors, [N] warnings, [N] coverage gaps
- Highest priority: [one-line description of the most critical finding]
- Recommended next action: [run ds-doc-audit | add spec for X | patch AI.md rule Y]
```

---

## Severity definitions

| Severity | Meaning | When to action |
|---|---|---|
| `error` | Token chain broken, forbidden pattern in consumer, rule directly contradicted | Block PR / fix immediately |
| `warn` | Missing required doc section, rule absent from a file that must have it, sentence case violation | Fix before next release |
| `gap` | Component exists, spec is thin but present, no contradiction | Backlog |

---

## Root cause mapping

Every violation must be mapped back to the documentation, not left as a code-level finding. Use this table:

| Violation type | Root cause file |
|---|---|
| Forbidden import in consuming app | `AI.md` — rule missing or insufficiently prominent |
| Wrong component composition in consuming app | `AI.md` or `specs/patterns/` — rule absent |
| Token chain broken in DSN | `AGENTS.md` — token architecture rule needs strengthening |
| Missing spec file | `specs/` — component was built without a spec |
| Rule absent from `AI-short.md` | `AI-short.md` — needs a surgical patch (run `ds-doc-audit`) |
| Accessibility note missing | Component spec file in `specs/` |

The fix always goes into the design system, never into the consuming app.

---

## What not to do

- Never suggest fixing a violation in the consuming app source code
- Never invent rules that don't already exist in `AI.md` or `AGENTS.md` — flag the gap and recommend adding the rule first
- Never patrol `StoryUI/` or `StoryUIPanel.css` — these are intentionally isolated Storybook infrastructure
- Never flag dataviz categorical tokens (`--color-{background|border|foreground}-dataviz-*`) as token chain errors — this is a known acknowledged gap
- Never run a full `ds-doc-audit` output as part of this skill — if drift is found, flag it and recommend running that skill separately
- Never output corrected files from this skill — patrol identifies, `ds-doc-audit` and `ds-session-recap` fix