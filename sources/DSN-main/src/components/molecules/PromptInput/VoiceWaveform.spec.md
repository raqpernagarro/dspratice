# VoiceWaveform

**Tier:** molecule  
**Location:** `src/components/molecules/PromptInput/VoiceWaveform.spec.md`  
**Version:** 1.0.0

## What it is

The animated bar waveform (`role="img"`, labelled "Listening") that `PromptInput` shows while voice dictation is active.

## When to use

- Never directly — `PromptInput` shows it automatically while dictating

## When NOT to use

- Internal to `PromptInput` — never use directly, use `PromptInput` instead. It is not exported from the package.
- Do not use as a loading or progress indicator → use `ProgressRing`, `LoadingBar` or `SkeletonLoading` instead
- Do not use to visualize audio data → it is decorative and not driven by input levels

## Variant selection

No variants. `active` starts or stops the animation and hides it from assistive technology when inactive.

## Spatial contract

- **Owns its padding:** no
- **Owns its margin:** no
- **Fills its container:** yes — fills the `PromptInput` text area while dictating
- **Notes:** respects reduced-motion settings through its CSS.

## Composition rules

- ✅ Rendered by: `PromptInput` only
- ❌ Never place anywhere else

## Props reference

Configure dictation on `PromptInput`, not here.

| PromptInput prop | Type | When to set |
|------|------|-------------|
| `onDictationChange` | `(active: boolean) => void` | React to dictation starting and stopping |
| `dictationLang` | `string` | The dictation language, e.g. `"pt-PT"` |

## Common mistakes

1. **Using it as a generic loading animation** — see When NOT to use.

## Examples

```tsx
// Shown automatically by PromptInput while dictating
<PromptInput onSubmit={send} onDictationChange={setDictating} dictationLang="en-GB" />
```
