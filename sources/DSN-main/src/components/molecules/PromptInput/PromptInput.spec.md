# PromptInput

**Tier:** molecule  
**Location:** `src/components/molecules/PromptInput/PromptInput.spec.md`  
**Version:** 1.0.0

## What it is

A multiline AI prompt composer with optional quick-action chips, attachment chips, an attach button, a model selector, voice dictation, and a send button.

## When to use

- Use as the input of an AI assistant, chat or agent experience where the user writes a prompt and sends it
- Use `quickActions` for suggested starter prompts the user can pick
- Use `modelOptions` when the user can choose which model answers

## When NOT to use

- Do not use for plain multi-line form text → use `TextArea` instead
- Do not use for formatted prose → use `RichTextEditor` instead
- Do not use for search or jump-to → use `SearchBar` or `CommandDialog` instead
- Do not use for comment threads between people → use `RichTextEditor` with its footer instead

## Variant selection

PromptInput has no `variant` prop. Its optional parts appear when their props are set.

| Part | Appears when |
|-------|----------|
| Quick actions | `quickActions` is non-empty |
| Attachment chips | `attachments` is non-empty |
| Model selector | `modelOptions` is non-empty — hidden by default |
| Dictation | The browser supports speech recognition and the field is empty |

The primary button switches by state: microphone when empty, send when there is text, stop while dictating.

## Spatial contract

- **Owns its padding:** yes
- **Owns its margin:** no
- **Fills its container:** yes — stretches to its parent's width; the textarea grows up to `maxHeight`, then scrolls
- **Notes:** in a chat layout, pin it below the scrolling message list on a wrapper; the component does not position itself.

## Composition rules

- ✅ Can be used inside: chat panels, `Drawer` content, the bottom of an assistant page inside `AppShell`
- ❌ Never place inside: a `Form` — it submits itself through `onSubmit`
- ❌ Never use `PromptInputModelSelector` or `VoiceWaveform` directly — they are internal parts of PromptInput

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `value` + `onChange` | `string` + callback | Controlled usage — clear the value yourself after `onSubmit` |
| `onSubmit` | `() => void` | Always — fired by the send button and by Enter (Shift+Enter adds a new line) |
| `modelOptions` | `PromptInputModelOption[]` | When the user can choose which model answers — pass the real models. Defaults to `[]` (selector hidden) |
| `modelValue` + `onModelChange` | `string` + callback | Controlled model choice |
| `attachments` + `onAttachmentRemove` | — | Files attached to the prompt |
| `onAttachClick` or `onFilesSelected` (+ `accept`, `multiple`) | — | `onAttachClick` to run your own picker; otherwise the built-in file input reports `onFilesSelected` |
| `onTranscript` / `onDictationChange` | callbacks | To react to dictated text or dictation state; `dictationLang` sets the language |
| `placeholder` | `string` | When "Ask me anything..." doesn't fit the assistant's purpose |
| `aria-label` | `string` | When "Prompt" is not descriptive enough |

## Common mistakes

1. **Not clearing the prompt after submit** — in controlled usage `onSubmit` must reset `value`; see Props reference.
2. **Wrapping it in a `Form`** — see Composition rules.

## Examples

```tsx
// Most common usage
<PromptInput
  value={prompt}
  onChange={setPrompt}
  onSubmit={() => { send(prompt); setPrompt(''); }}
/>

// Non-obvious: model choice, starters and attachments
<PromptInput
  value={prompt}
  onChange={setPrompt}
  onSubmit={handleSend}
  modelOptions={models}
  modelValue={model}
  onModelChange={setModel}
  quickActions={[{ id: 'summarize', label: 'Summarize this page', onClick: () => setPrompt('Summarize this page') }]}
  attachments={files}
  onAttachmentRemove={removeFile}
  onFilesSelected={addFiles}
  accept="image/*,.pdf"
  multiple
/>
```
