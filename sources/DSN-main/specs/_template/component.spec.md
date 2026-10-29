# ComponentName

**Tier:** atom | molecule | organism  
**Location:** `src/components/<tier>/<Folder>/<ComponentName>.spec.md`  
**Version:** 1.0.0

<!--
  Template for a 1:1 component spec. Copy it next to the component's .tsx, or
  fill it in on the docs site (Components → <name> → Write spec), which
  produces this exact structure. The ds-component-doc skill follows it too.

  Keep every section, in this order. Each rule lives in exactly one section:
  the most specific one. Other sections point to it in a short clause.
  Sections you need beyond these (Accessibility, Field rules, …) go after
  "Composition rules".
-->

## What it is

<!-- One sentence: what it renders. Not when to use it. -->

## When to use

<!-- Conditions an agent can check against its task. -->

- Use when [condition that makes this the right component]

## When NOT to use

<!-- The most important section for agents. Every line names the alternative. -->

- Do not use when [condition] → use `<Alternative>` instead

## Variant selection

<!-- One table per prop with several meaningful values. If there is no variant prop, say so in one sentence. -->

### `variant` prop

| Value | Use when |
| --- | --- |
| `"default"` | [condition] |

## Spatial contract

- **Owns its padding:** yes/no — [detail]
- **Owns its margin:** yes/no — [detail]
- **Fills its container:** yes/no — [detail]
- **Notes:** [edge cases]

## Composition rules

- ✅ Can be used inside: [list]
- ❌ Never place inside: [list, with reason]

## Props reference

<!-- Only props that need guidance. Skip self-explanatory ones. -->

| Prop | Type | When to set |
| --- | --- | --- |
| `propName` | `type` | [when and why] |

## Common mistakes

<!-- Mistakes agents actually made. One line each, pointing to the rule above. -->

1. **[Mistake]** — [Why it's wrong and what to do instead.]

## Examples

```tsx
// Most common usage
<ComponentName />

// Non-obvious case
<ComponentName variant="special" />
```
