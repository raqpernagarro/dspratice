# Avatar

**Tier:** atom
**Location:** `src/components/atoms/Avatar/Avatar.spec.md`
**Version:** 1.0.0

## What it is

A `role="img"` visual identity marker for a person or organization, rendered as a picture, initials, or icon fallback, plus an `AvatarGroup` for overlapping stacks with overflow.

## When to use

- Use to represent a person or organization where visual identity aids recognition — comment threads, member lists, assigned items, activity feeds, profile headers
- Use `AvatarGroup` when displaying multiple avatars together, e.g. team members assigned to an item

## When NOT to use

- Do not use when the entity is a generic system process or automated action → use an icon instead
- Do not use when no identity information is available and a fallback would be misleading → omit the visual identity cue instead
- Do not use when the context is purely textual and a visual identity cue adds no value → use plain text instead

## Variant selection

### `variant` prop

| Value | Use when |
|-------|----------|
| `"profile"` (default) | Represents a specific human user — author, assignee, commenter, team member |
| `"organization"` | Represents a company, team, or non-human entity — visually distinct from `"profile"` so identity type is clear at a glance |

### `fill` prop

| Value | Use when |
|-------|----------|
| `"picture"` (priority 1) | A real photo or logo is available and has been uploaded — always prefer this when available |
| `"initials"` (default, priority 2) | No picture is available; derive initials from the entity's name |
| `"icon"` (priority 3) | No picture and no name are available, or the entity is anonymous — never use when initials are derivable |

### `size` prop

| Value | Use when |
|-------|----------|
| `"xxs"` | Highest density — inline within text, tight data rows |
| `"xs"` | Dense lists, compact table cells, notification items |
| `"sm"` (default) | Standard list items, comment threads, member rows |
| `"lg"` | Profile previews, hover cards, contextual detail panels |
| `"xl"` | Profile pages, prominent feature areas |
| `"xxl"` | Hero profile sections, full account or settings pages |

There is no `"md"` value on `AvatarSize` — use `"sm"` (the component default) for standard contexts.

## Spatial contract

- **Owns its padding:** no — `Avatar` is a fixed-shape glyph with no internal padding to configure.
- **Owns its margin:** no — it does not space itself from siblings; place spacing using the surrounding layout (list item gap, `AvatarGroup` overlap).
- **Fills its container:** no — sized entirely by the `size` prop, independent of its container's width.
- **Notes:** `AvatarGroup` controls overlap and stacking (`zIndex`) internally; do not add manual offsets to individual avatars passed into a group.

## Composition rules

- ✅ Can be used inside: list items, table rows/cells (via `render`), card headers, comment threads, activity feeds
- ❌ Never place inside: a single collection mixing `"profile"` and `"organization"` variants without a clear contextual reason — they carry different semantic meaning
- ❌ Never combine with: mixed `Avatar` sizes within the same group or list — keep one consistent `size` per collection

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `name` | `string` | Always provide for meaningful avatars — required for the accessible `aria-label`; omit only for purely decorative avatars |
| `fill` | `"picture" \| "initials" \| "icon"` | Let the picture → initials → icon priority drive this; never set `"icon"` when initials can be derived from `name` |
| `icon` | `IconSource` | A Lucide component (`icon={Star}`) or element (`icon={<Star />}`) |
| `AvatarGroup.maxVisible` | `number` | Define a consistent maximum per product context — typically 3–5 before showing a "+N" overflow indicator |
| `AvatarGroup['aria-label']` | `string` | Omit to let the group auto-build a label from each item's `name`; provide explicitly only to override |
| `AvatarGroup.label` / `showLabel` | `string` / `boolean` | Figma: `Label` / `Show label`. Short caption after the stack, e.g. "12 members". |
| `AvatarGroup.showButton` | `boolean` | Figma: `Show button`. Adds an icon-only "add person" button; pair with `onButtonClick` and, if needed, `buttonAriaLabel`. |

## Common mistakes

1. **Mixing Avatar sizes within the same group** — AI.md explicitly forbids mixing Avatar, Chip, Checkbox, Radio, or Switcher sizes within the same group.
2. **Using `fill="icon"` when initials can be derived from `name`** — fill priority is picture → initials → icon; never skip to icon when a higher-fidelity fill is available.
3. **Building a native table cell with an avatar by hand instead of using the `render` prop with `AvatarGroup`/`Avatar`** — AI.md requires the `render` prop on `DataTable` columns for cells needing DS components like `AvatarGroup`.

## Examples

```tsx
// Most common usage — profile avatar with initials fallback
<Avatar name="Ana Costa" initials="AC" />

// Non-obvious case — AvatarGroup inside a DataTable cell via render
<AvatarGroup avatars={assignees} size="xxs" />
```

## Avatar group

`AvatarGroup` supports only the three smallest sizes (`xxs`, `xs`, `sm`), matching the dense end of the `Avatar` scale.

- Define a consistent maximum display count per product context — typically 3–5 avatars before showing a "+N" overflow indicator.
- The overflow indicator must be accessible — the group's auto-built `aria-label` lists names plus "and N others".
- Do not use `AvatarGroup` for more than ~20 total members without providing a separate "view all" affordance.
- Hovering an avatar (or the overflow chip) lifts it slightly and lifts neighbors with a distance falloff; leaving the group returns with a spring overshoot. Lift distance is `--space-2xs`; duration is `--motion-transition-slow`. This is decorative — avatars stay non-interactive (`role="img"`).

## Placement

- In list items and table rows, align the avatar to the leading edge of the row.
- In card headers, maintain consistent vertical alignment with the accompanying name/detail text.
- In comment threads and activity feeds, keep avatars consistently positioned relative to the content they represent.
- Do not use avatars as decorative elements where identity is not the point.

## Accessibility

- Avatars representing a specific person or organization must have an `aria-label` containing the entity's name (driven by the `name` prop).
- Picture avatars use `alt` text matching the entity's name — never `alt=""` on meaningful avatars.
- Icon-fill avatars with no associated identity use `aria-hidden="true"` (automatic when `name` is omitted).
- `AvatarGroup`'s container has an `aria-label` summarizing the full list, auto-built from item names when not provided explicitly.

## Content guidelines

**Initials:**
- For people: first initial + last initial. "Ana Costa" → "AC". Single-name entities: first two letters, e.g. "Cher" → "CH".
- For organizations: first two letters of the name, or first letter of each word for multi-word names up to two words.
- Always uppercase. Limit to 2 characters maximum.

**Pictures:**
- Use a square crop — the avatar shape applies the circular mask. Center the subject.
- For organization avatars, use logos on a transparent or neutral background.
