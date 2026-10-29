---
name: ds-doc-audit
description: Audit all DS-Nagarro documentation files for inconsistencies, conflicts, and drift. Covers AI.md, AI-short.md, src/docs/AI-Consumer-Guide.mdx (consumer side) and AGENTS.md, src/docs/AI-Builder-Guide.mdx, src/docs/Patterns.mdx (builder side). Use when asked to "audit the docs", "check for inconsistencies", "sync the doc files", "are the docs in sync", "update all doc files", or any time a rule changes and derived files need to catch up. Also trigger proactively when a rule is added or corrected in any file during a session.
---

# DS-Nagarro — Documentation Audit Skill

This skill audits all DS-Nagarro documentation files for inconsistencies, drift, and stale content, then produces a report and corrected file outputs.

---

## File map — understand this before auditing

There are two audiences and two chains. Never mix them.

### Token ground truth — always check this first

```
tokens.css      ← Single source of truth for all token names and values.
                   Generated from Figma via Style Dictionary. Never edited by hand.
                   Path: tokens.css at the repo root
```

No token name in any doc file is correct unless it exists in `tokens.css`. This takes precedence over all other checks.

### Machine-readable index

```
ds-index.json   ← Generated codebase index. Structural data only — components, tokens,
                   patterns, relationships. Rules live in AI.md, not here.
                   Path: ds-index.json at repo root
                   Maintained by: scripts/generate-index.mjs (auto-runs on build)
```

`ds-index.json` does not contain rules — it has a `rulesSource` pointer to `AI.md`. Do not audit it for rule content. Do check that component `notes` fields do not contradict `AI.md` (see Step 2f).

### Consumer chain — building apps with the library

```
AI.md                          ← Source of truth for consumer rules. All consumer rules live here first.
AI-short.md                    ← Condensed subset of AI.md. For context-limited tools (Cursor, etc.)
src/docs/AI-Consumer-Guide.mdx ← Storybook page. Renders AI.md via a ?raw import.
```

Audit direction: `AI.md → AI-short.md` and `AI.md → src/docs/AI-Consumer-Guide.mdx`

`src/docs/AI-Consumer-Guide.mdx` imports `AI.md` directly via `?raw` — it renders the live file content, not a hand-copied subset. See the note at the end of this section.

### Builder chain — building components inside the library

```
AGENTS.md                      ← Source of truth for builder rules. All builder rules live here first.
src/docs/AI-Builder-Guide.mdx  ← Storybook page. Renders AGENTS.md via a ?raw import.
src/docs/Patterns.mdx          ← Storybook page. Component decision trees for the builder side.
```

Audit direction: `AGENTS.md → src/docs/Patterns.mdx`. `src/docs/AI-Builder-Guide.mdx` renders `AGENTS.md` directly via `?raw` — see the note below.

### ?raw imports — what this means for the audit

`src/docs/AI-Consumer-Guide.mdx` and `src/docs/AI-Builder-Guide.mdx` both import their source file (`AI.md` and `AGENTS.md` respectively) via a Vite `?raw` import and render the content verbatim in Storybook. They cannot drift from their source the way a hand-maintained file can — there is no separate copy of the rules to fall out of sync.

For these two files, the audit only needs to verify the import path/filename is correct (i.e. it points at the right source file). Do not diff their rendered content against the source as if checking for copy drift — there is none by construction. If the import path is broken or points at a deleted/renamed file, flag that as a 🔴 direct conflict.

Co-located component specs are also rendered via ?raw: component .mdx files render them with `<Markdown>{stripSpecTitle(specRaw)}</Markdown>`, and components without an .mdx inject them via `parameters.docs.description.component` in their own `.stories.tsx`. The same principle applies — content cannot drift, only the wiring can break. See Step 2g.

### Specs layer — component and pattern specs

```
src/components/**/<ComponentName>.spec.md ← Per-component specs, co-located with the exporting .tsx. The folder name may differ from the component name.
specs/foundations/                        ← Authoritative written rules for colour, spacing, typography, effects
specs/<tier>/                             ← Shared and cross-cutting specs only (multi-component topics like input anatomy, forms). 1:1 specs have moved out.
specs/patterns/                           ← Page assembly contracts, anti-patterns, atom→molecule→organism chains
```

Specs are authoritative for their tier. `AI.md` and `src/docs/AI-Consumer-Guide.mdx` must not contradict them. A 1:1 spec found in `specs/<tier>/` that also exists co-located is a 🔴 conflict — the co-located copy is canonical and the legacy one must be deleted.

### Deleted files — do not reference or recreate

The following files were deleted because they were redundant and causing token name conflicts:
- `src/docs/Foundations.mdx` — weaker duplicate of `specs/foundations/`
- `src/docs/Guidelines.mdx` — weaker duplicate of `AI.md` + `specs/`

If any agent or session recreates these files, delete them again.

### Remaining Storybook doc files — roles

```
AI-Consumer-Guide.mdx ← Renders AI.md verbatim via ?raw import (consumer rules)
AI-Builder-Guide.mdx  ← Renders AGENTS.md verbatim via ?raw import (builder rules)
AppShell.mdx          ← AppShell scaffold guide (complement to specs/organisms/appshell.md)
Patterns.mdx          ← Component decision trees (derived from AGENTS.md)
Styleguide.mdx        ← Visual token preview — uses live var(--...) refs, cannot drift
Tokens.mdx            ← Live design token reference — renders from token JSON source files, not hardcoded
ThemeToggle.tsx       ← Storybook utility component — not a doc file
```

### Shared rules — must be consistent across both chains

Some rules apply to both audiences and must say exactly the same thing in all files:

- **Token architecture** — three-layer model (primitives → semantics → component), never raw hex at semantic layer
- **lucide-react** — only permitted icon library; `ds-ngr` does not re-export icons, so apps list `lucide-react` at the same version `ds-ngr` uses
- **Sentence case** — everywhere, all files
- **8 token tiers** — color, font, space, size, shape, effect, motion, z-index; one `--space-*` scale for padding, margin and gap (no inset scale) — stated identically everywhere
- **DataTable never in a Card** — stated in consumer files; AGENTS.md must not contradict it
- **Figma is source of truth** — no token exists without a Figma counterpart (builder side)
- **AppShell padding** — main area has built-in padding, never add a wrapper inside it

When a shared rule conflicts between the two chains, flag it. The fix is to align both to the correct behavior, not to pick a winner arbitrarily.

---

## Step 1 — Read all files

Read every file provided. If files are uploaded to the conversation, read them. If paths are given, read from disk.

Expected files:
- `AI.md`
- `AI-short.md`
- `src/docs/AI-Consumer-Guide.mdx`
- `AGENTS.md`
- `src/docs/AI-Builder-Guide.mdx`
- `src/docs/Patterns.mdx`

If any are missing, note it and proceed with what's available. A partial audit is still useful.

---

## Step 2 — Run the audit

Run four separate comparisons:

### 2a. Consumer chain: AI.md → AI-short.md and AI.md → src/docs/AI-Consumer-Guide.mdx

For `AI-short.md`, check:

**Direct conflicts** — rules that say the opposite of `AI.md`. Highest priority.
- Different values for the same token or measurement
- Different wrapper structures for AppShell
- Different padding rules
- Different import paths or component names

**Missing high-priority rules** — rules present in `AI.md` that are absent. Assess severity:
- **High** — rules agents violate most often (AppShell structure, DataTable in Card, spacing overrides, Tag variant mapping, sentence case, lucide-react version rule)
- **Medium** — rules agents sometimes miss (form behavior, button order, breadcrumb rules)
- **Low** — edge cases reasonably omitted from a condensed file

`AI-short.md` is intentionally condensed — missing low-severity rules are acceptable. Missing high-severity rules are not.

`src/docs/AI-Consumer-Guide.mdx` renders `AI.md` verbatim via a `?raw` import (see the ?raw note above) — it cannot be missing rules that exist in `AI.md`. For this file, only check that the import path resolves to `AI.md`.

**Stale content** — content that no longer applies:
- npm install or package references (library is npm-linked, not published)
- Setup sections (no install needed — if present, remove)
- Outdated token names
- Removed components or props

### 2b. Builder chain: AGENTS.md → src/docs/Patterns.mdx

Check `src/docs/Patterns.mdx` against `AGENTS.md`:

**Direct conflicts** — decision trees in `Patterns.mdx` that contradict component rules in `AGENTS.md`

**Missing decision trees** — patterns described in `AGENTS.md` that have no decision tree in `Patterns.mdx` (flag as recommendation, not required)

**Stale content** — component names, prop names, or patterns that no longer exist

### 2c. Shared rules: cross-chain consistency

For every shared rule listed in the file map above, check that all tracked files either state it consistently or don't contradict it. A file can omit a shared rule (if it's out of scope), but it must never state it differently.

Flag any shared rule that is stated differently across the two chains.

### 2d. Internal consistency

Within each file, check for:
- Rules that contradict each other within the same file
- Examples that contradict the rule they illustrate
- Token names used in examples that don't match the token system

### 2e. Token name validity — cross-check against tokens.css

This check is mandatory on every audit. `tokens.css` is the single source of truth for token names. Any token name referenced in a doc file that does not exist in `tokens.css` is a conflict — not a style issue.

**How to run it:**

Resolve the repo root first, then run the diff. This works on any machine regardless of clone location:

~~~bash
REPO=$(git rev-parse --show-toplevel)

grep -roh "var(--[a-zA-Z0-9_-]*)" \
  "$REPO/src/docs/" \
  "$REPO/AI.md" \
  "$REPO/AI-short.md" 2>/dev/null \
  | grep -oh "\-\-[a-zA-Z0-9_-]*" | sort -u > /tmp/doc-tokens.txt

grep -oh "\-\-[a-zA-Z0-9_-]*:" "$REPO/tokens.css" \
  | tr -d ':' | sort -u > /tmp/css-tokens.txt

comm -23 /tmp/doc-tokens.txt /tmp/css-tokens.txt
~~~

Empty output = clean. Any output = token name to fix. Report every item under **🔴 Direct conflicts**.

**Scope:** Only `src/docs/`, `AI.md`, and `AI-short.md` are scanned. `specs/`, co-located `*.spec.md` files under `src/components/`, and `AGENTS.md` are excluded — they intentionally document broken names as ❌ anti-pattern examples and must not be flagged as errors. The grep above does not scan `src/components/`; no change needed.

**Known false positives** — these appear in output but are intentional, not errors:
- `--token-name` — prose placeholder in `AI.md`: "use `var(--token-name)`"

If only this appears, the audit is clean. Any other output is a real conflict.

**When running without terminal access** (reading files provided in context), scan manually for `var(--...)` patterns and flag any token name that:
- Uses a naming pattern inconsistent with the established conventions — any word not in `Design Tokens/vocabulary.json` (closed lists of tiers, aspects, roles, prominence, states and the one ladder `none 3xs 2xs xs sm md lg xl 2xl 3xl full`), or a banned synonym such as `pressed`, `danger`, `inverted`, `standard`, `small`. `npm run audit:tokens` checks `tokens.css`; apply the same rules to names in docs
- Uses a known stale pattern (see table below)

**Known stale token name patterns — always flag these:**

| Stale name | Correct name | Why |
|---|---|---|
| `--text-primary` | `--color-foreground-neutral-primary` | Missing `color-` prefix |
| `--text-secondary` | `--color-foreground-neutral-secondary` | Missing `color-` prefix |
| `--text-tertiary` | `--color-foreground-neutral-tertiary` | Missing `color-` prefix |
| `--text-feedback-*` | `--color-foreground-feedback-*` | Missing `color-foreground-` prefix |
| `--color-text-*` | `--color-foreground-*` | Retired aspect — `text` → `foreground` |
| `--color-surface-*` | `--color-background-*` | Retired aspect — `surface` → `background` |
| `--color-dataviz-*` | `--color-{background\|border\|foreground}-dataviz-*` | Retired — dataviz split by aspect (fills → background, axis/grid/tooltip border → border, label → foreground) |
| `--space-tight` | `--space-2xs` (4px) | Stale name |
| `--space-standard` | `--space-sm` (12px) or `--space-md` (16px) | Stale name |
| `--space-comfortable` | `--space-lg` (24px) | Does not exist |
| `--space-tiny` / `--space-small` / `--space-compact` / `--space-medium` / `--space-large` | `--space-2xs` / `--space-xs` / `--space-sm` / `--space-md` / `--space-lg` | Retired names — scale is `--space-{none\|3xs\|2xs\|xs\|sm\|md\|lg\|xl\|2xl\|3xl}` |
| `--inset-*` | `--space-*` (e.g. `--inset-tiny` → `--space-2xs`, `--inset-small` → `--space-xs`, `--inset-medium` → `--space-md`) | Retired — no inset scale |
| `--inset-standard` | `--space-2xs` (4px) | Stale name — never existed |
| `--radius-*` | `--shape-radius-*` | Retired — radius lives in the `shape` tier |
| `--radius-rounded` | `--shape-radius-full` | Stale name |
| `--radius-medium` | `--shape-radius-md` | Does not exist |
| `--font-size-heading-l` | `--font-size-display-sm` | Does not exist |
| `--font-size-body-m` | `--font-size-body-md` | Does not exist |
| `--font-size-label-m` | `--font-size-label` | Does not exist |
| `--font-weight-bold` | `--font-weight-semibold` | Does not exist |
| `--font-line-height-tight` | scale-matched token e.g. `--font-line-height-display-sm` | Does not exist |
| `--color-foreground-success` | `--color-foreground-success-strong` | Wrong name |
| `--background-tag-success` / `--surface-tag-success` | `--tag-background-success` | Does not exist |
| `var(--primitive-*)` | Never use in app or doc code | Primitive layer — internal only |
| `var(--<component>-*)` (e.g. `--button-*`, `--tag-*`) | Never use in app code | Component layer — only that component's own styles |

Add any newly discovered stale names to this table when found.

**Scope note:** `StoryUIPanel.css` and `src/stories/StoryUI/` are intentionally isolated Storybook infrastructure. Do not audit them against DSN token rules.

### 2f. ds-index.json component notes — spot check

Read the `components` section of `ds-index.json`. For any component that has a non-empty `notes` field, verify the note does not contradict `AI.md`.

Focus on organisms (AppShell, Card, DataTable, Drawer) since those carry the most critical rules. Flag any note that contradicts or weakens a rule in `AI.md`.

### 2g. Co-located spec wiring — every spec renders somewhere

List all `*.spec.md` files under `src/components/`. For each, verify exactly one of:
- A sibling `<ComponentName>.mdx` imports it via `?raw` and renders it through `stripSpecTitle`
- The component's own `.stories.tsx` imports it via `?raw` and sets `parameters.docs.description.component` to `stripSpecTitle(specRaw)`
- The component is on the intentionally-unwired internal list: PageSelector, PasswordRequirement, SegmentControlSelector

Flag as 🟠:
- A spec wired nowhere (invisible in Storybook)
- A spec wired in two places (renders twice)
- A wiring that bypasses `stripSpecTitle` (duplicate H1 on the docs page)
- An internal component that has gained a `.stories.tsx` (violates the no-Storybook-presence rule)

---

## Step 3 — Output the audit report

```
## DS doc audit — [date]

### 🔴 Direct conflicts (fix immediately)
- [File] ↔ [File]: "[what one says]" vs "[what the other says]"
  → Correct version: [which is right and why]

### 🟠 Missing high-priority rules
- [File] is missing: [rule summary]
  → Lives in: [source file, section name]

### 🟡 Stale content
- [File]: [what's stale] — [why it's stale]

### 🔵 Shared rule inconsistencies
- [Rule]: [File A] says "[x]", [File B] says "[y]"
  → Correct version: [which is right]

### ⚪ Missing medium/low-priority rules
- [File] is missing: [rule] — [accept as intentional omission / recommend adding]

### ✅ No issues found
- [files or sections that are clean]
```

Be specific. Quote the conflicting text. Name the section in the source file where the correct rule lives.

---

## Step 4 — Produce corrected files

After the report, output corrected versions of all files that have issues.

**Correction rules:**
- Conflicts: align to the source of truth for that chain (`AI.md` for consumer, `AGENTS.md` for builder)
- Shared rule conflicts: align both files to the correct behavior
- Stale content: remove it entirely
- High-priority missing rules: add in the most appropriate existing section
- Medium/low missing rules: use judgment — add if there's a natural home for it, skip if it would bloat a condensed file
- Never make `AI-short.md` approach the length of `AI.md` — it must stay condensed
- Never restructure any file wholesale — surgical patches only
- Preserve all MDX imports and Storybook meta blocks in `.mdx` files

Output each corrected file in full, ready to drop in. If a file has no changes, say so — don't output it.

---

## Step 5 — Summary

```
## What changed

### [filename]
- Fixed: [list of conflicts resolved]
- Added: [list of rules added]
- Removed: [list of stale content removed]
- No changes needed ← if clean
```

---

## Known recurring issues — always check these explicitly

These have caused real problems. Check every one on every audit:

1. **Token names valid against tokens.css** — run Step 2e. Any `var(--...)` reference in any doc file that doesn't exist in `tokens.css` is a direct conflict. See the stale name table in Step 2e.
2. **AppShell wrapper height** — `height: '100vh'` in all consumer files. `AGENTS.md` documents the full CSS height chain (`height: 100%` from `html` down) — that is intentional and correct for the builder side. Do not flag it as a conflict.
3. **Setup/install section** — must not exist in `AI-short.md`. Library is npm-linked. No install step. (`src/docs/AI-Consumer-Guide.mdx` mirrors whatever is in `AI.md` via `?raw`, so this is governed at the `AI.md` level.)
4. **AppShell padding** — main area has built-in padding. No wrapper div with padding inside AppShell children. Must be present in all consumer files.
5. **DataTable never in a Card** — prohibited in all consumer files. `AGENTS.md` must not contradict this.
6. **lucide-react version** — stated consistently in all files: apps import icons from `lucide-react` and list it at the same version `ds-ngr` uses. No file may say it is bundled or must not be installed.
7. **Tag variant mapping** — the full semantic mapping table must be present in `AI.md` and `AI-short.md`. `src/docs/AI-Consumer-Guide.mdx` inherits it automatically via `?raw` from `AI.md`.
8. **Sentence case** — stated in all files.
9. **One space scale** — all consumer files and `AGENTS.md` state that `--space-*` covers padding, margin and gap, with no inset scale; no file tells agents to use `--inset-*`.
10. **Three-layer token model** — must be consistent across `AI.md` and `AGENTS.md`. Primitive → semantic → component, never raw hex at semantic layer.
11. **Figma as source of truth** — stated in `AGENTS.md`. Consumer files don't need to state it, but must not contradict it.
12. **Deleted files not recreated** — `Foundations.mdx`, `Guidelines.mdx` must not exist in `src/docs/`. If found, flag as critical and recommend deletion.
13. **ds-index.json component notes** — run Step 2f. Notes fields on organisms must not contradict AI.md rules.
14. **Co-located specs wired and singular** — run Step 2g. Every `src/components/**/*.spec.md` renders in exactly one Storybook location via `stripSpecTitle`, or is on the internal unwired list. No 1:1 spec duplicated in `specs/<tier>/`.

---

## What not to do

- Don't add `AI.md`-level detail to `AI-short.md` — condensed is the point
- Don't restructure files wholesale — surgical patches only
- Don't invent new rules — only propagate what already exists in a source file
- Don't flag intentional omissions in condensed files as errors
- Don't treat `AGENTS.md` as a derived file of `AI.md` — it is its own source of truth
- Don't treat `Patterns.mdx` as a derived file of `AI.md` — it derives from `AGENTS.md`
- Don't audit cross-chain unless it's a shared rule — builder rules stay in builder files, consumer rules stay in consumer files