# LoadingBar

**Tier:** atom
**Location:** `src/components/atoms/LoadingBar/LoadingBar.spec.md`
**Version:** 1.0.0

## What it is

A thin, full-width `role="progressbar"` bar that either animates indeterminately (no known end time) or fills to a given percentage (determinate).

## When to use

- Use for page-level or section-level loading states where a thin top-of-content indicator is sufficient — page navigation, background data refresh.
- Omit the `value` prop for indeterminate mode when the duration is unknown (e.g. navigating to a new page).
- Provide `value` for determinate mode only when an actual percentage is known (e.g. tracked upload/processing progress).

## When NOT to use

- Do not use to show progress for a specific bounded task the user is actively watching (uploads, multi-step processes) where a labeled percentage matters → use `ProgressBar` instead, which is designed for that context.
- Do not use for a circular/compact loading indicator → use `ProgressRing` instead.
- Do not use to represent placeholder content while data loads → use `SkeletonLoading` instead.

## Variant selection

### `value` prop (mode selector)

| Value | Use when |
|-------|----------|
| Omitted (indeterminate) | Duration is unknown — a segment animates continuously left to right. |
| Provided, 0–100 (determinate) | An actual percentage is known and trackable; the bar fills to that percentage and exposes `aria-valuenow`. |

## Spatial contract

- **Owns its padding:** yes — the bar and its fill are self-contained; no internal padding to configure.
- **Owns its margin:** no — placement (typically pinned to the top of a content area) must come from the parent layout.
- **Fills its container:** yes — the bar stretches to its parent's full width.
- **Notes:** switching between determinate and indeterminate mode is driven purely by whether `value` is passed — there is no separate boolean prop for this.

## Composition rules

- ✅ Can be used inside: page headers, `AppShell` main area (top edge), section loading states.
- ❌ Never provide an out-of-range `value` expecting an error — values are clamped to `[0, 100]` internally, so out-of-range numbers silently clamp rather than throw.
- ❌ Never omit `label` when there is no other visible text describing the operation — it is the only accessible description of what is loading.

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `value` | `number` | Omit for indeterminate mode; provide a 0–100 number for determinate mode — see variant table above. |
| `label` | `string` | Set whenever no surrounding visible text already describes the operation (e.g. `"Uploading files"`, `"Navigating to dashboard"`). |

## Common mistakes

1. **Using `LoadingBar` for a task the user is actively tracking with a known percentage and label** — `ProgressBar` is the more appropriate component for that bounded, labeled context.
2. **Omitting `label` with no other accessible description nearby** — the component sets `aria-live="polite"` and relies on `label` (or context) to tell assistive technology what is loading.
3. **Passing a `value` when the duration is actually unknown** — forcing a determinate percentage for an unknown-duration operation misleads users about progress; omit `value` instead.

## Examples

```tsx
// Most common usage — indeterminate, page navigation
<LoadingBar label="Navigating to dashboard" />

// Non-obvious case — determinate, tracked percentage
<LoadingBar value={uploadPercent} label="Uploading files" />
```
