# Combobox

**Tier:** atom
**Location:** `src/components/atoms/Combobox/Combobox.spec.md`
**Version:** 1.0.0

## What it is

A searchable dropdown for choosing one or many values from a list. Single mode filters options as the user types; multi mode adds selected values as dismissible chips above the input.

Replaces legacy **Autocomplete multi** — use `selectionMode="multi"` instead of a separate export.

## When to use

- Use **single** mode when the user must pick one value from a free-text or async option set (dynamic or server-loaded lists, free-text commit when allowed)
- Use **multi** mode when the user assigns multiple tags, assignees, categories, or permissions from a searchable list

## When NOT to use

- Do not use when the list is fixed and small (6 or fewer) → use `Radio` or `CheckboxField` / `MultiChoice`
- Do not use only because a fixed list is long → use `Select`, which adds a search field automatically above 10 options
- Do not use when the user picks one value without typing → use `Select`
- Do not use for query-only search with no suggestion panel → use `SearchBar`
- Do not use for toolbar multi-value filters with Confirm/Cancel → use `PopoverMenu` (MultiSelectAnchored pattern)

## Variant selection

| Prop | Values | Use |
|------|--------|-----|
| `selectionMode` | `'single'` (default) | One value; closes list on select; Enter commits free text when no option is highlighted |
| `selectionMode` | `'multi'` | Multiple values as chips; list stays open while selecting |

Input states follow shared input anatomy: Default, Hover, Active, Focused, Filled, Error, Disabled.

## Spatial contract

- **Owns its padding:** yes — label, chip stack (multi), control, helper/error row
- **Owns its margin:** no
- **Fills its container:** yes
- **Notes:** Dropdown uses `PopoverWrapper` (portaled, viewport-safe, match trigger width, min 192px)

## Accessibility

### Single-select

- Input: `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-haspopup="listbox"`, `aria-autocomplete="list"`
- Panel: `role="listbox"`; items: `role="option"` with `aria-selected`
- Keyboard: ArrowDown/Up (open + roving focus), Enter (select or commit query), Escape (close)
- Dismiss: outside click via `isPointerInsideAnchoredPopover`

### Multi-select

- Input: `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-haspopup="listbox"`, `aria-autocomplete="list"`
- Panel: `role="listbox"`, `aria-multiselectable="true"`
- Items: `role="option"` with `aria-selected`
- Chips: dismiss control `aria-label="Remove [label]"`; sr-only summary via `aria-describedby`
- Chip add/remove: announced via `aria-live="polite"` region
- **Backspace** with empty input removes the last chip
- Keyboard: ArrowDown/Up, Enter/Space (toggle focused option), Escape (close panel)

### Shared

- Mandatory by default; `optional={true}` appends `(optional)` and suppresses `aria-required`
- `aria-invalid` + `aria-describedby` for helper/error text
- Disabled options are skipped in keyboard navigation

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `options` | `ComboboxOption[]` | Required in production — pass real options; do not rely on empty defaults in app code |
| `selectionMode` | `'single' \| 'multi'` | `'multi'` for chip multi-select |
| `value` / `values` | `string` / `string[]` | Controlled selection |
| `open` / `onOpenChange` | `boolean` / callback | Controlled dropdown visibility |
| `onInputChange` | `(query: string) => void` | Filter side effects or controlled query |
| `onEnter` | `(query: string) => void` | After Enter commits or closes list |
| `optional` | `boolean` | Non-mandatory fields |
| `error` / `errorMessage` | `boolean` / `string` | Validation failure |
| `name` | `string` | Form submit — renders hidden inputs |
| `showClearButton` | `boolean` | Default `true`; set `false` inside embedded pickers (e.g. time slot in `DateTimePicker`) |

## Common mistakes

1. **Using `Select` for free-text or async option sets** — use `Combobox`; for long fixed lists keep `Select`, which shows search automatically above 10 options
2. **Omitting `options` in app code** — always pass contextual options; placeholders belong in Storybook only
3. **Modeling toolbar filters as multi `Combobox`** — use `PopoverMenu` with checkbox cells and Confirm/Cancel
4. **Hand-composing optional/required markers** — use `optional` prop only; no asterisks

## Examples

~~~tsx
<Combobox
  label="Country"
  placeholder="Search countries"
  options={countries}
  onChange={(value) => setCountry(value)}
/>

<Combobox
  label="Assignees"
  selectionMode="multi"
  placeholder="Search team members"
  options={members}
  values={assignees}
  onValuesChange={setAssignees}
/>
~~~
