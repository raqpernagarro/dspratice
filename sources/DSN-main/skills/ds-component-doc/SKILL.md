---
name: ds-component-doc
description: Document a DS-Nagarro component for AI agent consumption. Produces three outputs: (1) a spec file co-located with the component source at src/components/<tier>/<Folder>/<ComponentName>.spec.md with use cases, anti-patterns, variant selection criteria, and spatial contract; (2) a JSDoc block to paste into the component's TypeScript source; (3) a Storybook wiring check that connects the spec to the component's docs page. Use when asked to "document a component", "write the spec for X", "add aiHints to X", "improve component metadata for X", "what should the spec for X look like", or any time a component is added, refactored, or identified as a recurring source of agent mistakes. Also trigger proactively when a session reveals that agents are misusing a specific component.
---

# DS-Nagarro — Component Documentation Skill

This skill produces machine-readable component documentation for DS-Nagarro. The goal is to give AI agents enough context to select, configure, and compose a component correctly on the first attempt — without requiring correction.

Three outputs are always produced together, plus the AI.md delta:
- A **spec file** co-located with the component source —
  `<ComponentName>.spec.md` in the same directory as the exporting `.tsx`.
  Folder names do not always match component names (ToggleButton.tsx lives in
  `atoms/Button/`) — the spec lives next to the `.tsx`, wherever that is.
- A **JSDoc block** to paste into the component's TypeScript source —
  machine-readable, travels with the component
- A **Storybook wiring check** (see Output 4)
- An **AI.md delta** (see Output 3)

Specs covering multiple components or cross-cutting topics stay in
`specs/<tier>/` — this skill documents single components only. If asked to
document a topic that spans components, say so and stop.

---

## Before you start — gather context

Do not generate documentation from general knowledge. Always read the actual component first.

### Step 1 — Read the component source

Locate the .tsx that exports the component under
~/Documents/GitHub/DSN/src/components/ — do not assume the folder name
matches the component name (ToggleButton.tsx lives in atoms/Button/).
Search by export name if needed.

Extract:
- All exported props and their TypeScript types
- All variant values (string unions, enums)
- Default prop values
- Any existing JSDoc comments

### Step 2 — Read the Storybook stories

The component's own stories file, in the same directory as its .tsx:
<ComponentName>.stories.tsx. It may not exist — internal sub-components
have no stories file by design; note that and move on to Step 3.

Extract:
- What scenarios are demonstrated
- Which variants are shown
- Any notes or descriptions in story metadata

### Step 3 — Check AI.md for existing rules

```
~/Documents/GitHub/DSN/src/docs/AI.md
```

Search for any existing rules about this component. They must be reflected accurately in the spec and JSDoc — never contradict AI.md.

### Step 4 — Check for an existing spec

Look next to the component source first:

```
src/components/<tier>/<Folder>/<ComponentName>.spec.md
```

If found, extend it — never replace or overwrite it.

Also check the legacy central location `specs/<tier>/` (kebab-case filenames,
e.g. `toggle-button.md`). If a spec exists there and the component qualifies
as 1:1 (exactly one exporting .tsx), migrate the content into the co-located
file and flag the legacy file for deletion — never leave both. If the legacy
spec is shared across components, leave it where it is.

---

## The spec format

Output this exact structure. Every section is required. Do not skip or rename sections.

The same structure is checked in as `specs/_template/component.spec.md`, and the
docs site's spec form (Components → <name> → Write spec / Edit spec) reads and
writes it. Keep the three in step: a heading change here is a change to the
template and to `site/lib/spec/types.ts` (`SECTION_HEADINGS`). Extra sections
(Accessibility, Field rules, …) go after "Composition rules".

Each rule has exactly one canonical home — the most specific section for it
(interactivity constraints → "When NOT to use"; variant semantics → "Variant
selection"; prop mechanics → "Props reference"). State the rule fully there,
once. If another section needs to reference it, use one short clause, not a
restatement (e.g. "not interactive — see When NOT to use"). "Common
mistakes" entries stay one line each: name the observed mistake and point to
the canonical rule. Never write the same rule in full in two sections — two
wordings of one rule will drift apart over edits.

```markdown
# <ComponentName>

**Tier:** atom | molecule | organism | pattern  
**Location:** `src/components/<tier>/<Folder>/<ComponentName>.spec.md`  
**Version:** 1.0.0

## What it is

One sentence. What this component renders. No mention of when to use it here.

## When to use

Decision criteria written as conditions, not descriptions. Each condition should be something an agent can evaluate about the task at hand.

- Use when [specific condition that makes this component the right choice]
- Use when [another condition]

## When NOT to use

The most important section for AI agents. Be explicit. Name the alternative.

- Do not use when [condition] → use `<AlternativeComponent>` instead
- Do not use when [condition] → use `<AlternativeComponent>` instead

## Variant selection

For each prop that has multiple meaningful options (variants, sizes, intents), explain when to choose each value. Format as a decision table.

### `variant` prop

| Value | Use when |
|-------|----------|
| `"default"` | [condition] |
| `"primary"` | [condition] |

### `size` prop (if applicable)

| Value | Use when |
|-------|----------|

## Spatial contract

How this component handles its own space. Agents must know this to avoid double-padding or layout collisions.

- **Owns its padding:** yes/no — [detail]
- **Owns its margin:** yes/no — [detail]
- **Fills its container:** yes/no — [detail]
- **Notes:** [any edge cases, e.g. "SectionHeader is edge-to-edge — never place inside a padded container"]

## Composition rules

What this component can and cannot be placed inside or combined with.

- ✅ Can be used inside: [list]
- ❌ Never place inside: [list with reason]
- ❌ Never combine with: [list with reason]

## Props reference

Only props that require agent guidance. Skip self-explanatory props.

| Prop | Type | When to set |
|------|------|-------------|
| `propName` | `type` | [when and why] |

## Common mistakes

Agent mistakes observed in real sessions. Each one maps to a rule.

1. **[Mistake description]** — [Why it's wrong. What to do instead.]

## Examples

Minimal correct usage snippets. Include the most common case and one non-obvious case.

~~~tsx
// Most common usage
<ComponentName variant="default" />

// Non-obvious case
<ComponentName variant="special" size="sm" />
~~~
```

---

## The JSDoc block format

After writing the spec, extract the critical information into a JSDoc block for the component's TypeScript source. This is what agents see when they read the component file directly.

Place it immediately above the component's exported function or const.

```tsx
/**
 * [One-line description of what the component renders.]
 *
 * @aiSelectWhen [condition 1]
 * @aiSelectWhen [condition 2]
 *
 * @aiAvoid Do not use when [condition] — use ComponentName instead
 * @aiAvoid Do not use when [condition] — use ComponentName instead
 *
 * @aiVariant variant="default" — [when]
 * @aiVariant variant="primary" — [when]
 *
 * @aiSpatial [One sentence on padding/margin ownership and layout behaviour]
 *
 * @aiCompose Never place inside [component/element] — [reason]
 * @aiCompose Always use inside [component/element] when [condition]
 */
```

Rules for the JSDoc block:
- Every `@aiAvoid` must name the alternative component
- `@aiSpatial` is required for any component with non-obvious spacing behaviour
- `@aiCompose` is required if AI.md already has a composition rule for this component (e.g. DataTable never in a Card)
- Keep each tag to one line — no paragraph text
- Do not repeat information that is self-evident from the prop types

---

## Output structure

Always produce all outputs in this order:

### Output 1 — Spec file

State the target path:
```
src/components/<tier>/<Folder>/<ComponentName>.spec.md
(same directory as the exporting .tsx — verify, don't assume the folder name)
```
Then output the full spec content, ready to save.

### Output 2 — JSDoc block

State where to paste it:
```
The exporting .tsx located in Step 1
— above the exported component function/const
```
Then output the JSDoc block only (no surrounding code).

### Output 3 — AI.md delta (always required)

Always produce this section. Read AI.md first, then compare it against the spec you just wrote.

For each item in the spec's **Common mistakes** and **Composition rules** sections, check whether AI.md already covers it. Output one of:

```
AI.md — add to [section name]:
[the rule, exactly as it should appear in AI.md]
```

or:

```
AI.md — no changes needed. The following rules are already covered:
- [rule summary] → [section name in AI.md]
```

Never skip this section. If nothing is missing, say so explicitly — that is itself useful confirmation.

### Output 4 — Storybook wiring check (always required)

The spec must render on the component's Storybook docs page. Check the
component's directory and output the applicable patch:

a) A hand-authored `<ComponentName>.mdx` exists — verify it imports the spec
   and renders it after the primary `Canvas` and `Controls`:

```mdx
   import specRaw from './<ComponentName>.spec.md?raw';
   import { extractSpecLead, stripSpecIntro } from '../../../docs/stripSpecTitle';

   <Title />

   <Markdown>{extractSpecLead(specRaw)}</Markdown>

   <Canvas of={ComponentStories.Primary} />
   <Controls of={ComponentStories.Primary} />

   <Markdown>{stripSpecIntro(specRaw)}</Markdown>
```

   `Markdown` comes from `@storybook/addon-docs/blocks`. Adjust the relative
   import path to stripSpecTitle for the tier depth.

b) No .mdx, but the component has its own `.stories.tsx` — verify the meta
   sets `parameters: specDocsParameters(specRaw)` (from `stripSpecTitle.ts`),
   merged with existing parameters. That splits the lead into
   `docs.description.component` and the rest into `docs.specBody` for
   `DsDocsPage`. Exactly one stories file per component — never inject the same
   spec into two metas.

c) Internal sub-component with intentionally no Storybook presence (e.g.
   PageSelector, PasswordRequirement, SegmentControlSelector) — no wiring.
   Do NOT create a stories file. State: "co-located, intentionally unwired
   (internal)." The spec's "When NOT to use" section MUST lead with:
   internal to `<Parent>` — never use directly, use `<Parent>` instead.

Always use stripSpecTitle — the spec's H1 duplicates Storybook's page title
otherwise. Never strip the H1 from the .spec.md file itself.

**Canonical docs page order:** Title → description (spec lead) → primary story →
Controls → spec body → additional sections. In an `.mdx`, render
`extractSpecLead(spec)` in a `Markdown` block immediately after `<Title />`, then
the primary `Canvas` and `Controls`, then `stripSpecIntro(spec)` for the
remaining spec. The global `DsDocsPage` autodocs template enforces the same
order for components without an `.mdx`.

If already wired correctly, say so explicitly — that is itself useful
confirmation.

---

## Tier reference

| Tier | What belongs here |
|------|-------------------|
| `atoms` | Single-purpose, no composition — Button, Tag, Badge, Input, Icon |
| `molecules` | Composed of atoms, single responsibility — SearchBar, FormField, SectionHeader |
| `organisms` | Complex, multi-part — DataTable, Card, Modal, AppShell, CalendarView |
| `patterns` | Full-page layouts or cross-component rules — documented in specs/patterns/ only |

---

## Quality checks — run before outputting

- [ ] Every "when NOT to use" entry names a specific alternative component
- [ ] Spatial contract is filled in (not left as "unknown")
- [ ] Variant selection covers all non-obvious variant values
- [ ] JSDoc `@aiAvoid` tags match the spec's "when NOT to use" section
- [ ] No rule in the spec contradicts AI.md
- [ ] Every common mistake has a traceable source — it must appear in AI.md, AGENTS.md, session history, or a Storybook story note. If you cannot point to a source, remove it.
- [ ] No hardcoded pixel or hex values anywhere in the spec — intent only
- [ ] Spec is co-located with the exporting .tsx, not in specs/ (shared and
      cross-cutting specs excepted — those don't go through this skill)
- [ ] No duplicate of this spec remains in the legacy specs/<tier>/ location
- [ ] Storybook wiring check performed (Output 4) and uses stripSpecTitle
- [ ] Internal sub-components: no stories file created, and the internal
      anti-pattern rule leads the spec's "When NOT to use" section
- [ ] No rule stated in full more than once — every rule has one canonical
      section, other mentions are one-clause pointers

---

## What not to do

- Do not document a component from memory — always read the source first
- Do not invent rules, usage limits, or best-practice guidelines that aren't in AI.md, AGENTS.md, or a Storybook story — every common mistake must have a traceable source
- Do not invent variant values that don't exist in the TypeScript types
- Do not write "use this component for UI elements" — every condition must be specific and evaluable
- Do not skip the JSDoc block — the spec alone doesn't help agents reading the source file
- Do not add rules to AI.md delta that are already there — check first
- Do not document layout or visual appearance — specs describe *when* and *how to compose*, not *what it looks like*
- Do not create a .stories.tsx for a component that doesn't have one —
  internal sub-components have no Storybook presence by design
- Do not put the spec in a folder named after the component — it goes next
  to the exporting .tsx, whose folder may have a different name
- Do not inject the raw spec into Storybook without stripSpecTitle
- Do not document multi-component or cross-cutting topics with this skill —
  those specs stay in specs/<tier>/