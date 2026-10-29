# PromptInputModelSelector

**Tier:** molecule  
**Location:** `src/components/molecules/PromptInput/PromptInputModelSelector.spec.md`  
**Version:** 1.0.0

## What it is

The compact model-picker trigger and menu rendered inside `PromptInput`'s footer, listing model options as menu rows.

## When to use

- Never directly — `PromptInput` renders it when `modelOptions` is non-empty; configure it through `PromptInput`'s `modelOptions`, `modelValue` and `onModelChange`

## When NOT to use

- Internal to `PromptInput` — never use directly, use `PromptInput` instead. It is not exported from the package.
- Do not use as a general dropdown → use `Select` instead
- Do not use as an action menu → use `PopoverMenu` instead

## Variant selection

No variants. It shows the selected option's label and opens a menu of options.

## Spatial contract

- **Owns its padding:** yes
- **Owns its margin:** no
- **Fills its container:** no — it sizes to the selected label in the `PromptInput` footer
- **Notes:** the menu is portalled and positioned by `PopoverWrapper`.

## Composition rules

- ✅ Rendered by: `PromptInput` only
- ❌ Never place anywhere else

## Props reference

Set these on `PromptInput`, not here.

| PromptInput prop | Type | When to set |
|------|------|-------------|
| `modelOptions` | `PromptInputModelOption[]` | The real model list, or `[]` to hide the selector |
| `modelValue` + `onModelChange` | `string` + callback | Controlled model choice |

## Common mistakes

1. **Importing it directly** — see When NOT to use.

## Examples

```tsx
// Configure through PromptInput
<PromptInput modelOptions={models} modelValue={model} onModelChange={setModel} onSubmit={send} />
```
