# Select

**Tier:** atom
**Location:** `src/components/atoms/Select/Select.spec.md`
**Version:** 1.0.0

## What it is

A dropdown input for selecting a single value from a predefined list. Options are hidden until the user opens the control.

## When to use

- Use when the user must choose one value from a fixed list that is too long for radio buttons (typically 7+ options), or when space is constrained

## When NOT to use

- Do not use when there are 6 or fewer options and space allows → use `Radio` instead
- Do not use when the user can select multiple values → use `MultiChoice` or autocomplete multi instead
- Do not use when the user needs to type a value that may or may not match a list (free-text) → use `Combobox` instead
- Do not use when options load asynchronously or change based on prior input → use `Combobox` instead

## Variant selection

Select uses input states (`Default`, `Hover`, `Pressed`, `Focused`, `Error`, `Disabled`) rather than visual variants. The open/closed dropdown panel is separate from these input states.

## Spatial contract

- **Owns its padding:** yes — label, trigger, and helper/error row stack internally
- **Owns its margin:** no
- **Fills its container:** yes
- **Notes:** Dropdown panel uses shared `PopoverWrapper` positioning contract — never set `max-height` or `overflow` on it; `PopoverWrapper` caps the height and scrolls only the option list

## Composition rules

- ✅ Can be used inside: forms, filter toolbars, settings panels
- ❌ Never leave the control visually empty with no placeholder when nothing is selected

## Accessibility

- Trigger: `aria-haspopup="listbox"`, `aria-expanded`, `aria-controls` pointing at the options panel
- Panel: `role="listbox"` with `MenuCell` items using `role="option"` and `aria-selected`
- Mandatory fields set `aria-required="true"` by default; `optional={true}` suppresses it
- `aria-invalid="true"` in Error state with helper/error text linked via `aria-describedby`
- Keyboard: ArrowDown/Up, Home/End, Enter/Space (select), Escape (close and return focus to trigger)

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `placeholder` | `string` | Required when no default is pre-selected — must not be a selectable value |
| `error` / `errorMessage` | `boolean` / `string` | Set both together on validation failure |
| `optional` | `boolean` | Set `true` for non-mandatory fields |
| `searchable` | `boolean` | Search field in the popover that filters by label. Defaults to `true` above 10 options — never set `false` there |
| `searchPlaceholder` | `string` | Placeholder for that field. Default `Search` |
| `options[].icon` | `ReactNode` | Leading visual per menu item, e.g. a color swatch or flag. Pair with `icon` + `leadingIcon` so the trigger shows the selected option's visual |

## Common mistakes

1. **Using Select for 6 or fewer fixed options** — use `Radio` so all options are visible
2. **Making the placeholder a valid option** — placeholder is a prompt, not a value
3. **Turning search off on long lists** — above 10 options Select shows a search field in the popover automatically (`SELECT_SEARCH_THRESHOLD`). Don't pass `searchable={false}` there; free-text or async options → `Combobox`

## Examples

~~~tsx
<Select label="Country" placeholder="Select country" options={countries} />

<Select label="Status" options={statuses} defaultValue="active" />
~~~
