# SplitButton

**Tier:** atom  
**Location:** `src/components/atoms/ButtonGroup/SplitButton/SplitButton.spec.md`  
**Version:** 1.0.0

## What it is

Two joined button segments: a labelled main action on the left and an icon-only trigger on the right that opens related alternatives.

## When to use

- Use when one action is the clear default and a small set of related alternatives exists (e.g. Save / Save as draft, Export / Export as CSV)
- Use `variant="primary"` when the main action is the page's primary CTA

## When NOT to use

- Do not use when there is no default action and the trigger only opens a menu → use a `Button` with a trailing chevron that opens a `PopoverMenu` instead
- Do not use for several independent actions → use `ButtonGroup` instead
- Do not use to pick one persistent option from a set → use `SegmentControl` instead
- Do not use for a single action → use `Button` instead

## Variant selection

### `variant` prop

| Value | Use when |
|-------|----------|
| `"secondary"` (default) | Supporting actions — toolbars, cards, secondary page actions |
| `"primary"` | The page's primary CTA in `Navbar` `rightActions` — one primary per view |

### `size` prop

| Value | Use when |
|-------|----------|
| `"md"` (default) | Standard placement — `Navbar`, toolbars, forms |
| `"sm"` | Dense layouts — table toolbars, compact panels |

## Spatial contract

- **Owns its padding:** yes — both segments own their insets
- **Owns its margin:** no
- **Fills its container:** no — it sizes to its content
- **Notes:** the wrapper provides the shared rounded corners and shadow; never style the segments separately.

## Composition rules

- ✅ Can be used inside: `Navbar` `rightActions`, `Toolbar`, forms and panels
- ✅ The trigger opens a `PopoverMenu` anchored to the SplitButton — SplitButton does not render a menu itself
- ❌ Never combine with: another primary button in the same view (NAV-09)
- ❌ Never position with `position: fixed/absolute`

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `children` | `ReactNode` | Always — the main action label, verb-led, sentence case |
| `onMainClick` | `MouseEventHandler` | Always — runs the default action |
| `onDropdownClick` | `MouseEventHandler` | Always — opens the alternatives menu; you render that menu |
| `open` | `boolean` | Always — the open state of the menu you render; sets `aria-expanded` on the trigger |
| `dropdownAriaLabel` | `string` | When "More options" is not specific, e.g. "More save options" |
| `loading` | `boolean` | While the main action runs — also disables the trigger |
| `triggerIcon` | `ReactNode` | Only when the default chevron does not fit the menu's meaning |

## Common mistakes

1. **Two primary buttons in one view** — see Composition rules (NAV-09).

## Examples

```tsx
// Most common usage
<SplitButton onMainClick={save} onDropdownClick={toggleSaveMenu} open={saveMenuOpen} dropdownAriaLabel="More save options">
  Save
</SplitButton>

// Non-obvious: primary CTA in the Navbar with a leading icon
<Navbar
  variant="title"
  title="Reports"
  rightActions={
    <SplitButton variant="primary" leadingIcon={<Download size={16} />} onMainClick={exportPdf} onDropdownClick={toggleExportMenu} open={exportMenuOpen}>
      Export
    </SplitButton>
  }
/>
```
