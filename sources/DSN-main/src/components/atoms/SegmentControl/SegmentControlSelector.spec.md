# SegmentControlSelector

**Tier:** atom
**Location:** `src/components/atoms/SegmentControl/SegmentControlSelector.spec.md`
**Version:** 1.0.0

## What it is

A single `role="radio"` pill button rendered inside a `SegmentControl` group, representing one selectable option with an active/inactive state.

## When to use

- Never mount directly — it is the internal per-option building block that `SegmentControl` renders for each item in its `options` array.
- Use `SegmentControl`'s `options` prop to add/configure selectors; the group manages `active`, `tabIndex`, keyboard navigation, and focus wiring for each `SegmentControlSelector` it renders.

## When NOT to use

- Do not mount `SegmentControlSelector` standalone or outside a `SegmentControl` group → use `SegmentControl` with an `options` array instead; a lone selector has no group semantics (`role="radiogroup"`, arrow-key navigation, single-active-item enforcement).
- Do not use it to build a custom multi-select pill list → use `Chip` instead, per `segment-control.md`'s guidance that filters which can stack/combine belong in `Chip`, not `SegmentControl`.

## Variant selection

This component has no independent `variant` prop — its only state is `active`, driven entirely by the parent `SegmentControl`.

## Spatial contract

- **Owns its padding:** yes — the button manages its own label (and optional leading/trailing icon) padding.
- **Owns its margin:** no — equal-width sizing and spacing between selectors is computed and applied by the parent `SegmentControl`.
- **Fills its container:** yes, when rendered inside a `fullWidth` `SegmentControl` — all selectors in the group share equal width.
- **Notes:** `id`, `tabIndex`, `buttonRef`, `onKeyDown`, and `onFocus` are all supplied by the parent group's roving-tabindex logic — do not manage focus or keyboard handling independently.

## Composition rules

- ✅ Can be used inside: `SegmentControl` only — it is always a child rendered by the group, never mounted directly by consuming code.
- ❌ Never place inside anything other than `SegmentControl` — its `role="radio"` semantics require a `role="radiogroup"` ancestor with coordinated `aria-checked`/roving-tabindex behavior, which only `SegmentControl` provides.

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `active` | `boolean` | Supplied by the parent `SegmentControl` based on the group's current `value` — never set independently. |
| `showLeadingIcon` / `leadingIcon` | `boolean` / `React.ReactNode` | Set via the corresponding `SegmentControlOption` fields on the parent, not directly. |
| `disabled` | `boolean` | Supplied per-option by the parent via `SegmentControlOption.disabled`. |

## Common mistakes

1. **Mounting `SegmentControlSelector` directly instead of using `SegmentControl`'s `options` array** — it has no standalone group semantics; `segment-control.md` requires the full group (`role="radiogroup"`, arrow-key navigation, single active item) which only `SegmentControl` assembles.
2. **Managing `active`/`tabIndex` manually on a standalone selector** — these are computed by the parent's roving-tabindex logic; hand-managing them duplicates state the group already owns.

## Examples

```tsx
// Correct usage — always via SegmentControl, never SegmentControlSelector directly
<SegmentControl
  options={[
    { value: 'list', label: 'List' },
    { value: 'grid', label: 'Grid' },
  ]}
  defaultValue="list"
  aria-label="View mode"
/>
```
