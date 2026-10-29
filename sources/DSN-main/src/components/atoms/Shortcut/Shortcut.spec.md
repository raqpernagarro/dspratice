# Shortcut

**Tier:** atom
**Location:** `src/components/atoms/Shortcut/Shortcut.spec.md`
**Version:** 1.0.0

## What it is

A non-interactive, `role="img"` display badge showing a keyboard shortcut string (e.g. `⌘K`), used inline within buttons, tooltips, menus, and help text.

## When to use

- Use to surface an available keyboard shortcut inline within a button label, tooltip, menu item, or help text.
- Always required on the primary submit CTA per AI.md/AGENTS.md: "Primary submit CTA must be disabled until all mandatory fields have a value. Always include the Shortcut component showing ⌘↵."
- Use `contentColor="inverted"` when the badge sits on a filled/dark surface (e.g. inside a `primary` `Button`).

## When NOT to use

- Do not use for an interactive control the user can click — `Shortcut` is display-only, never interactive.
- Do not use to show descriptive text — it is for key characters only ("⌘K", "Ctrl+K"), not phrases like "Press Command K".

## Variant selection

### `contentColor` prop

| Value | Use when |
|-------|----------|
| `"default"` (default) | On light surfaces — secondary buttons, menu cells, help text. |
| `"inverted"` | On filled/dark surfaces — primary buttons, dark tooltips, inverted panels. |

## Spatial contract

- **Owns its padding:** yes — the badge is self-contained (`<span>` wrapping a `<kbd>`); sized to its label content.
- **Owns its margin:** no — spacing relative to surrounding text/button content must come from the parent layout.
- **Fills its container:** no — sized intrinsically to its label text.
- **Notes:** the visible `<kbd>` element is `aria-hidden`; the accessible name comes entirely from the wrapping `role="img"` element's `aria-label` — do not add a second visible or hidden label expecting it to be announced instead.

## Composition rules

- ✅ Can be used inside: `Button` labels (especially the primary submit CTA), tooltips, menu items, help text.
- ❌ Never omit `aria-label` — symbol characters (⌘, ⇧, ⌥, ⌃) are not reliably announced by screen readers; it is a required prop for this reason.
- ❌ Never make `Shortcut` interactive (clickable, focusable) — it is a passive display badge only.

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `label` | `string` | Platform-standard notation only (`⌘K`, `Ctrl+K`) — no descriptive text; defaults to `'⌘ ↵'`. |
| `aria-label` | `string` | Required — plain-English key names (e.g. `"Command K"`) since symbol characters aren't reliably announced. |
| `contentColor` | `'default' \| 'inverted'` | Set `'inverted'` when the badge sits on a filled/dark surface; see variant table above. |

## Common mistakes

1. **Omitting the Shortcut component on the primary submit CTA** — AGENTS.md's `submit_cta` rule requires the primary submit button to always include a `Shortcut` showing `⌘↵`.
2. **Omitting `aria-label`** — symbol characters are not reliably announced by assistive technology; the prop is required for exactly this reason.
3. **Using `contentColor="default"` on a filled/dark surface** — reduces legibility; use `"inverted"` for primary buttons and other filled/dark backgrounds.
4. **Writing descriptive text into `label`** (e.g. `"Command+K to search"`) — the badge is for key characters only; put descriptive text in surrounding UI, not inside the badge.

## Examples

```tsx
// Most common usage — inside a primary submit button
<Button variant="primary" disabled={!isFormValid}
  shortcut shortcutLabel="⌘↵" shortcutAriaLabel="Command Enter">
  Save
</Button>

// Non-obvious case — on a light surface, e.g. a menu item
<Shortcut label="⌘K" aria-label="Command K" />
```
