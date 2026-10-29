# SkeletonLoading

**Tier:** atom
**Location:** `src/components/atoms/SkeletonLoading/SkeletonLoading.spec.md`
**Version:** 1.0.0

## What it is

A shape-matched, animated placeholder (`aria-hidden="true"`) shown in place of content that hasn't loaded yet, in one of four shapes: avatar, pill, image, or card.

## When to use

- Use to represent placeholder content while data is loading — list rows, cards, avatars, images — matching the shape of the content that will eventually appear.
- Choose the `type` that matches the real content's shape so the loading state doesn't visually jump when content arrives.

## When NOT to use

- Do not use for a page-level or section-level loading indicator with no shape to match → use `LoadingBar` or `ProgressRing` instead.
- Do not use for a bounded task with a known percentage → use `ProgressBar` instead.
- Do not use as a purely decorative loading spinner → use `ProgressRing` in indeterminate mode instead.

## Variant selection

### `type` prop

| Value | Use when |
|-------|----------|
| `"avatar"` (default) | Placeholder for a circular avatar/profile image. |
| `"pill"` | Placeholder for short text or a tag/badge-shaped element. |
| `"image"` | Placeholder for a rectangular image/thumbnail. |
| `"card"` | Placeholder for a full card-shaped content block. |

## Spatial contract

- **Owns its padding:** no — it is a single shaped block; sizing/aspect ratio comes from CSS tied to `data-type`.
- **Owns its margin:** no — spacing relative to surrounding skeletons or real content must come from the parent layout.
- **Fills its container:** depends on `type` — `card`/`image` are typically sized to fill their container; `avatar`/`pill` are sized to fixed intrinsic dimensions matching their real-content counterparts.
- **Notes:** the component is `aria-hidden="true"` — it carries no accessible name or role; loading-state announcements to screen readers must be handled by the surrounding container (e.g. an `aria-live` region or a `role="status"` wrapper), not by `SkeletonLoading` itself.

## Composition rules

- ✅ Can be used inside: `Card` (per the composition tree in `ds-index.json`, `Card` may contain `SkeletonLoading`), list rows, avatar slots, image placeholders.
- ✅ Match `type` to the real content it stands in for — an `avatar` skeleton where an `Avatar` will render, a `card` skeleton where a `Card` will render.
- ❌ Never rely on `SkeletonLoading` alone to announce a loading state to assistive technology — it is `aria-hidden`; pair it with an `aria-live` region or `role="status"` on the containing area.

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `type` | `'avatar' \| 'pill' \| 'image' \| 'card'` | Match to the shape of the real content being loaded; defaults to `'avatar'`. |

## Common mistakes

1. **Using a mismatched `type`** — e.g. a `pill` skeleton where a `card` will render — causes a visual jump/layout shift when real content replaces the placeholder.
2. **Relying on `SkeletonLoading` to announce loading state to screen readers** — it is `aria-hidden="true"` by design; the surrounding container must provide the accessible loading announcement.
3. **Using `SkeletonLoading` for a determinate, trackable operation** — a skeleton represents "content not yet loaded," not "task X% complete"; use `ProgressBar` for the latter.

## Examples

```tsx
// Most common usage — avatar placeholder while a user profile loads
<SkeletonLoading type="avatar" />

// Non-obvious case — card placeholder inside a loading Card
<Card loading>
  <SkeletonLoading type="card" />
</Card>
```
