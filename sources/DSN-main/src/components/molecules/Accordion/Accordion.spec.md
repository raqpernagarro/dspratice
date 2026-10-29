# Accordion

**Tier:** molecule
**Location:** `src/components/molecules/Accordion/Accordion.spec.md`
**Version:** 1.0.0

## What it is

A collapsible disclosure section with a `SectionHeader`-based trigger row and an expandable content region, toggled by a chevron on the left or right.

## When to use

- Use to progressively disclose secondary content the user doesn't need to see by default — FAQ-style content, optional form sections, detail panels within a longer page.
- Use `disclosure="right"` when the chevron should sit at the end of the row (e.g. matching a list of similar rows); use `disclosure="left"` (default) for standard content sections.
- Use `expanded`/`onExpandedChange` for controlled behavior when multiple accordions need coordinated open/close state (e.g. only one open at a time).

## When NOT to use

- Do not use for primary content the user needs to see immediately → show it directly instead of hiding it behind a disclosure.
- Do not use for switching between mutually exclusive named views with equal importance → use `Tab`/`SegmentControl` instead.
- Do not use to hide a single always-relevant piece of content just to save space → reconsider the page layout instead of defaulting to collapsed.

## Variant selection

### `disclosure` prop

| Value | Use when |
|-------|----------|
| `"left"` (default) | Standard content sections — the chevron leads the title. |
| `"right"` | The row already has other leading content, or matches a list of similar rows where a trailing chevron reads better. |

### `bordered` prop

| Value | Use when |
|-------|----------|
| `false` (default) | The accordion sits within a container that already provides visual separation. |
| `true` | The accordion needs its own visible border to stand apart from surrounding content. |

## Spatial contract

- **Owns its padding:** yes — trigger row (via `SectionHeader`) and content region both manage their own internal padding.
- **Owns its margin:** no — spacing between stacked accordions must come from the parent layout.
- **Fills its container:** yes — stretches to the parent's width.
- **Notes:** the trigger renders via `SectionHeader` internally (`size="medium"`, `flush={!bordered}`) — do not additionally wrap the title in a separate `SectionHeader`; pass `title`/`description` directly to `Accordion`.

## Composition rules

- ✅ Can be used inside: settings pages, FAQ sections, detail panels, form sections.
- ✅ Composes `SectionHeader` internally for the trigger row — this is an implementation detail, not a separate component to mount.
- ❌ Never mount a `SectionHeader` manually as the first child of `Accordion`'s content — the trigger's `SectionHeader` already covers the title/description; a second one duplicates it.
- ❌ Never nest interactive controls that conflict with the trigger's click target inside the title/description area — only `children` (the content region) should contain additional interactive elements.

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `expanded` / `onExpandedChange` | `boolean` / `(expanded: boolean) => void` | Use together for controlled expand/collapse — e.g. coordinating multiple accordions so only one is open at a time. |
| `defaultExpanded` | `boolean` | Use for uncontrolled usage when the accordion manages its own state and no external coordination is needed. |
| `disclosure` | `'left' \| 'right'` | See variant table above. |
| `bordered` | `boolean` | Set `true` only when the accordion needs its own visible boundary. |

## Common mistakes

1. **Mounting a `SectionHeader` manually inside `Accordion`'s content** — the trigger row already renders one internally from `title`/`description`; a second one duplicates the heading.
2. **Mixing controlled and uncontrolled usage** — passing both `expanded` and `defaultExpanded` is contradictory; use `expanded`+`onExpandedChange` for controlled behavior, or `defaultExpanded` alone for uncontrolled.
3. **Using `Accordion` for mutually exclusive named views** — that use case belongs to `Tab`/`SegmentControl`, not a collapsible disclosure section.

## Examples

```tsx
// Most common usage — uncontrolled, single accordion
<Accordion title="Shipping details" description="Optional — skip if using billing address">
  <AddressForm />
</Accordion>

// Non-obvious case — controlled, coordinated group (only one open at a time)
{sections.map((s) => (
  <Accordion
    key={s.id}
    title={s.title}
    expanded={openId === s.id}
    onExpandedChange={(exp) => setOpenId(exp ? s.id : null)}
  >
    {s.content}
  </Accordion>
))}
```
