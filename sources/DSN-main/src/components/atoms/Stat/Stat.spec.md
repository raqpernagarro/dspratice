# Stat

**Tier:** atom
**Location:** `src/components/atoms/Stat/Stat.spec.md`
**Version:** 1.0.0

## What it is

A title + value pair displaying a single metric, either as a plain block (`variant="default"`) or contained within a card-like treatment (`variant="card"`).

## When to use

- Use to display a single KPI or metric with a short label — dashboard tiles, summary rows, report headers.
- Use `variant="card"` when the stat needs its own visual container (e.g. standalone in a dashboard grid); use `variant="default"` when it's already inside another container (e.g. a `Card`).
- Keep `value` concise — a number, percentage, or short formatted string (e.g. `1234`, `"84%"`, `"1.2k"`).

## When NOT to use

- Do not use for a value that changes interactively or accepts input → use `NumberInput` or a form field instead.
- Do not use to display a long-form value or paragraph → `Stat` is for concise, at-a-glance metrics only.
- Do not use for a value that needs its own trend chart or visualization → pair `Stat` with `Charts` inside a `Card` instead of overloading `Stat` itself.

## Variant selection

### `variant` prop

| Value | Use when |
|-------|----------|
| `"default"` | The stat is already inside another container providing its own visual boundary (e.g. mounted inside a `Card`). |
| `"card"` | The stat needs its own standalone card-like visual treatment — e.g. directly in a dashboard grid with no wrapping `Card`. |

## Spatial contract

- **Owns its padding:** depends on `variant` — `"card"` includes its own container padding; `"default"` has no outer padding and expects the parent to provide any needed spacing/boundary.
- **Owns its margin:** no — spacing relative to sibling stats must come from the parent layout (e.g. a grid or flex `gap`).
- **Fills its container:** no — sized to its title/value content; grid/flex sizing of multiple stats is the parent's responsibility.
- **Notes:** per `ds-index.json`'s composition tree, dashboards typically assemble `Stat` alongside `Card`/`Charts` under a `SectionHeader` — `Stat` itself does not manage that layout.

## Composition rules

- ✅ Can be used inside: dashboard grids, `Card` (as content), report summary rows.
- ✅ Use `variant="default"` when already inside a `Card` — do not use `variant="card"` there, which would double up the visual container.
- ❌ Never use `variant="card"` for a `Stat` mounted inside an existing `Card` — the two card treatments compound into visual over-nesting.

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `title` | `string` | Short label describing the metric — required. |
| `value` | `React.ReactNode` | The main metric value; keep concise (e.g. `1234`, `"84%"`, `"1.2k"`) — required. |
| `variant` | `'default' \| 'card'` | See variant table above; defaults to `'default'`. |
| `aria-label` | `string` | Set when `Stat` is used standalone with no surrounding heading context to describe what the metric represents. |

## Common mistakes

1. **Using `variant="card"` inside an existing `Card`** — creates a nested card-in-card visual, which the composition rules above call out as over-nesting.
2. **Passing a long or paragraph-length `value`** — `Stat` is designed for concise, at-a-glance values; long content breaks its intended layout.
3. **Using `Stat` for an editable/interactive value** — it renders static text (`<p>` elements), not an input; use `NumberInput` or a form field for anything the user edits.

## Examples

```tsx
// Most common usage — standalone dashboard tile
<Stat variant="card" title="Active users" value="1.2k" />

// Non-obvious case — inside an existing Card, no extra container
<Card showHeader title="This week">
  <Stat variant="default" title="Revenue" value="€84,204" />
</Card>
```
