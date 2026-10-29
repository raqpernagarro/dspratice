# ProgressBar

**Tier:** atom
**Location:** `src/components/atoms/ProgressBar/ProgressBar.spec.md`
**Version:** 1.0.0

## What it is

A labeled, determinate `role="progressbar"` track-and-fill bar showing a known percentage (0–100) of a bounded task.

## When to use

- Use when a specific, trackable percentage is known for a bounded task the user is actively watching — file upload, import/export progress, multi-step wizard completion.
- Always pass a real, currently-known `value` — this component has no indeterminate mode.

## When NOT to use

- Do not use when the duration/percentage is unknown → use `LoadingBar` in indeterminate mode instead (omit its `value`).
- Do not use for a compact or circular indicator → use `ProgressRing` instead.
- Do not use to represent placeholder content while data loads → use `SkeletonLoading` instead.

## Variant selection

This component has no `variant` prop — visual treatment is uniform; only `value` changes the fill.

## Spatial contract

- **Owns its padding:** yes — track and fill are self-contained within the root element.
- **Owns its margin:** no — placement relative to surrounding content (labels, step counters) must come from the parent layout.
- **Fills its container:** yes — the track stretches to the parent's full width.
- **Notes:** the fill width calculation accounts for a 1px border overlap internally — do not add manual width adjustments around the component expecting to compensate for border rendering.

## Composition rules

- ✅ Can be used inside: upload dialogs, import/export flows, multi-step forms/wizards.
- ❌ Never omit `value` — unlike `LoadingBar`, `ProgressBar`'s `value` prop is required; there is no indeterminate mode here.
- ❌ Never omit `label` when there is no other visible text describing the operation — it is required for accessibility in that case.

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `value` | `number` | Required — the current percentage (0–100); out-of-range numbers are clamped internally, safe to pass unvalidated. |
| `label` | `string` | Set whenever no surrounding visible text already describes what is progressing, e.g. `"Uploading file"`. |

## Common mistakes

1. **Using `ProgressBar` when the percentage is actually unknown** — use `LoadingBar`'s indeterminate mode (omit `value`) instead of guessing or faking a percentage.
2. **Omitting `label` with no visible surrounding text** — leaves the progress indicator with no accessible description of what is progressing.
3. **Adding manual width/border compensation around the bar** — the fill's width-plus-2px calculation already accounts for the track border overlap internally.

## Examples

```tsx
// Most common usage — file upload
<ProgressBar value={uploadPercent} label="Uploading file" />

// Non-obvious case — multi-step wizard completion
<ProgressBar value={(currentStep / totalSteps) * 100} label={`Step ${currentStep} of ${totalSteps}`} />
```
