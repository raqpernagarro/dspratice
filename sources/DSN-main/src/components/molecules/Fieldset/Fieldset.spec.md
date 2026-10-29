# Fieldset

**Tier:** molecule
**Location:** `src/components/molecules/Fieldset/Fieldset.spec.md`
**Version:** 1.0.0

## When to use

- Use inside a `Form` to group **semantically related fields** under one **legend** — e.g. an address block, notification preferences, billing details.
- Use when multiple input components share a conceptual heading and should be announced as one group by assistive technology.
- Use when a section mixes control types under one legend (e.g. `TextInput` + `Switcher` + `Select` in one address or preferences block).

## When NOT to use

- Do not use for a single input with one label → mount the input directly.
- Do not use as a page or card title → use `SectionHeader` (page structure) or `Card` `title` (bounded container).
- Do not use as a visual box with border and padding → use `Card` for bounded surfaces; `Fieldset` is semantic grouping only (unstyled border per HTML convention).
- Do not use for menu/filter panels with heterogeneous row types → use `ChoiceList` inside a `PopoverMenu`.
- **Never nest `SingleChoice` or `MultiChoice` inside `Fieldset`** — those components render their own `<fieldset>` + `<legend>`. Nesting fieldsets is invalid HTML and confusing for assistive technology. Use `SingleChoice` / `MultiChoice` as direct `Form` children instead.

### Disambiguation

| Component | Purpose | Visual role |
|-----------|---------|-------------|
| `Fieldset` | Groups related **form fields** under a **legend** | No card chrome; semantic `<fieldset>` only |
| `SectionHeader` | Titles a **content section** on a page or in a drawer | Page structure — not form grouping semantics |
| `Card` | Bounded **container** with optional header, content, footer | Surface chrome; may contain `Fieldset`s in its content area |

`SectionHeader` answers "what is this section of the page about?" `Fieldset` answers "which inputs belong to the same form group?" A `Card` can contain multiple `Fieldset`s, each with its own legend, plus a `Card` `title` at the card level.

## What it is

A semantic grouping wrapper that renders a native `<fieldset>` with `<legend>`, optional group-level description, and a vertical stack of existing DS input components as children. `Fieldset` owns spacing between the legend and the first field, and between fields inside the group. Each child input retains its own label, helper text, error message, and internal anatomy.

## Variant selection

This component has no visual `variant` prop.

## Anatomy and spatial contract

```
<fieldset>
  <legend>[Group label (+ optional)]</legend>
  [Optional group description]
  <TextInput label="Street" … />
  <TextInput label="City" … />
  …
</fieldset>
```

### Input field anatomy (owned by each child input)

Each child input owns vertical spacing between its own **label → control → help text → error message**. `Fieldset` does not wrap or alter input anatomy.

### Spacing ownership

- **Owns spacing between legend → first field:** yes — uses `--space-xs`.
- **Owns spacing between fields inside the set:** yes — uses `--space-md` (same rhythm token as `Form`).
- **Owns external margin:** no — spacing between this `Fieldset` and siblings defers to `Form` or parent layout.
- **Owns its padding:** no — no inner inset on the fieldset element; padding comes from `Card` / page layout.
- **Fills its container:** yes — children stretch to available width.
- **Defers to parent:** `Form` owns rhythm between top-level children; page/card horizontal inset.

Child inputs **never add external margin** — `Fieldset` (and `Form`) own field-to-field rhythm inside the group.

## Behavior rules

| Rule | Enforcement |
|------|-------------|
| Group label required | `legend` prop is required for visible grouping. |
| Optional group | `optional={true}` appends `(optional)` to the legend in `var(--color-foreground-neutral-tertiary)`. |
| No required marker | No asterisk or visual required indicator on the legend. |
| Sentence case | Documented; no text transformation. |
| Group-level error | v1: no group-level error banner — validate individual child inputs via their `errorMessage` props. |
| Disabled group | `disabled={true}` disables all descendant controls per HTML `<fieldset disabled>` behavior. |
| No nested choice fieldsets | `SingleChoice` and `MultiChoice` must not be children of `Fieldset`. |

## Composition rules

- ✅ Contains DS input components directly: `TextInput`, `Select`, `Switcher`, `CheckboxField`, etc.
- ✅ Lives inside `Form`, `Card` content, drawer/modal bodies.
- ✅ Multiple `Fieldset`s inside one `Form` for logical sections.
- ❌ Never nest `Fieldset` inside `Fieldset`.
- ❌ Never nest `SingleChoice` or `MultiChoice` inside `Fieldset`.
- ❌ Never use `Fieldset` purely for layout without a meaningful legend.
- ❌ Never add margin between the legend and fields, or between fields inside the set — spacing is internal.
- ❌ Never use `SectionHeader` or `Card` title as a substitute for form grouping semantics.

## Props reference

| Prop | Type | Default | When to set |
|------|------|---------|-------------|
| `legend` | `string` | — | Required. Sentence-case group name. |
| `optional` | `boolean` | `false` | When the entire group is not mandatory (rare — prefer field-level `optional` on inputs). |
| `description` | `string` | — | Supplementary text below the legend, above fields. |
| `disabled` | `boolean` | `false` | Disables all controls in the group. |
| `id` | `string` | auto | Optional root id for testing. |
| `children` | `React.ReactNode` | — | DS input components — not `SingleChoice` / `MultiChoice`. |

## Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Semantic grouping | Renders native `<fieldset>` + `<legend>`. |
| Legend visibility | Legend is always associated with the group. |
| Disabled descendants | `disabled` on `<fieldset>` disables all form controls inside per HTML behavior. |
| Description | Group `description` linked via `aria-describedby` on the fieldset when present. |
| Focus order | Follows DOM order of child inputs top to bottom. |

## Implementation notes

In development, `Fieldset` logs a console warning when a `SingleChoice` or `MultiChoice` child is detected (via component type check).

## Common mistakes

1. **Using `Fieldset` instead of `SectionHeader` for page titles** — page sections use `SectionHeader`; form groups use `Fieldset`.
2. **Nesting `SingleChoice` inside `Fieldset`** — creates nested fieldsets; place choice components as direct `Form` children.
3. **Nesting fieldsets** — invalid HTML and confusing for screen readers.
4. **Adding wrapper margins between legend and fields** — breaks the spatial contract.
5. **Putting a `Card` title and identical `Fieldset` legend** — redundant; card title scopes the card, legend scopes the field group.

## Examples

```tsx
<Fieldset legend="Address">
  <TextInput label="Street" value={street} onChange={…} />
  <TextInput label="City" value={city} onChange={…} />
  <TextInput label="Postal code" value={postal} onChange={…} />
</Fieldset>

<Fieldset legend="Notification preferences" description="Choose how we contact you.">
  <Switcher label="Email digest" checked={digest} onChange={setDigest} />
  <Switcher label="SMS alerts" optional checked={sms} onChange={setSms} />
</Fieldset>
```

## Tokens referenced

| Token | Purpose in Fieldset |
|-------|---------------------|
| `--color-foreground-neutral-primary` | Legend text |
| `--color-foreground-neutral-tertiary` | `(optional)` suffix on legend |
| `--color-foreground-neutral-secondary` | Group description |
| `--font-size-label` | Legend typography |
| `--font-weight-medium` | Legend weight |
| `--font-line-height-label` | Legend line height |
| `--font-size-body-sm` | Description text |
| `--font-line-height-body-sm` | Description line height |
| `--space-xs` | Legend → first field gap |
| `--space-md` | Gap between child fields (→ `--space-md`) |

### Needs Figma counterpart first

None identified for v1.
