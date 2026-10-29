# SearchBar

**Tier:** atom  
**Location:** `src/components/atoms/SearchBar/SearchBar.spec.md`  
**Version:** 1.0.0

## What it is

A `role="searchbox"` text input with a leading search icon and a clear button, in a bordered variant with label and helper row or a borderless ghost variant.

## When to use

- Use when the user queries a dataset, filters a list, or looks up records — the value is a transient query, not a stored field
- Use in a `Toolbar` `leftActions` slot (ghost) to filter the list, table or board below it — always ghost there; `Toolbar` forces `variant="ghost"` so the bar stays a compact row like a bottom bar
- Use in the `Sidebar` `searchSlot` for navigation search
- Use the bordered `default` variant in dedicated search areas and filter panels where a visible label is needed

## When NOT to use

- Do not use for a text value that is saved with a form → use `TextInput` instead
- Do not use to pick one value from a known list → use `Combobox` or `Select` instead
- Do not use for a global command palette or jump-to search → use `Command` / `CommandDialog` instead
- Do not add a SearchBar inside `Select` or `PopoverMenu` yourself → use their built-in search (`PopoverMenu` `searchProps`)

## Variant selection

### `variant` prop

| Value | Use when |
|-------|----------|
| `"default"` | Dedicated search areas and filter panels. Renders a visible `label` and a helper row. |
| `"ghost"` | Inline in toolbars, headers and menus where a bordered field is too heavy. No label or helper row — set `aria-label`. |

## Spatial contract

- **Owns its padding:** yes — the control owns its inset; never add padding to `SearchBar`
- **Owns its margin:** no
- **Fills its container:** yes — it stretches to the width of its parent; constrain width on a wrapper
- **Notes:** in `Sidebar` `searchSlot` the label and helper row are hidden by the sidebar, so the field relies on `aria-label`.

## Composition rules

- ✅ Can be used inside: `Toolbar` (`leftActions`, ghost), `Sidebar` `searchSlot`, filter panels, `Drawer` content
- ✅ In a filter bar: view switcher and `SearchBar` on the left, filter controls on the right
- ❌ Never combine with: an error state for "no results" — show empty-state feedback in the results area instead

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `variant` | `'default' \| 'ghost'` | See Variant selection |
| `placeholder` | `string` | Always — describe the scope: "Search projects", "Search by name or email" |
| `label` | `string` | With `variant="default"` — the default is the literal "Label", so always override it |
| `helperText` | `string` | With `variant="default"` — the default is the literal "Help text"; pass `''` when no helper is needed |
| `aria-label` | `string` | Always with `variant="ghost"` and in `Sidebar` `searchSlot`, where no label is visible |
| `value` + `onChange` + `onClear` | — | Controlled usage — `onClear` must reset the query |
| `error` + `errorMessage` | `boolean` + `string` | Only for system errors (e.g. search service unavailable), never for empty results |

## Common mistakes

1. **Error state for "no results"** — see Composition rules.
2. **Generic placeholder** — the placeholder must describe what is searched; see Props reference.
3. **Ghost SearchBar with no `aria-label`** — see Props reference.
4. **Shipping the "Label" / "Help text" defaults** — see Props reference.

## Examples

```tsx
// Most common usage — filtering a list from a toolbar
<Toolbar
  variant="filter-bar"
  leftActions={
    <SearchBar
      variant="ghost"
      placeholder="Search projects"
      aria-label="Search projects"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      onClear={() => setQuery('')}
    />
  }
/>

// Non-obvious: bordered search in a filter panel
<SearchBar
  label="Tags"
  placeholder="Search tags"
  optional
  helperText="Narrow results by tag."
/>
```
