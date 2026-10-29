# Command

**Tier:** organism  
**Location:** `src/components/organisms/Command/Command.spec.md`  
**Version:** 1.0.0

## What it is

A searchable list of actions or destinations: a text input that filters and ranks grouped items, with arrow-key navigation and Enter to run the active item. `CommandDialog` puts the same menu in a modal for a ⌘K palette.

Parts: `Command` (root), `CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandItem`, `CommandSeparator`, `CommandDialog`. Exported helper: `commandScore` (the default ranking).

## When to use

- Use when the user jumps to a page, record or action by name: site or docs search, a "go to…" menu, an app-wide ⌘K palette.
- Use when the list of actions is long enough that typing is faster than scanning (roughly 10+ items, or items spread across several categories).
- Use `CommandDialog` when the menu is global and opened from a header trigger or a keyboard shortcut.
- Use `Command` inline when the menu already lives in its own surface (a panel, a page section, an empty-state launcher).

## When NOT to use

- Do not use to choose a value that is saved in a form → use `Combobox` (searchable) or `Select` instead. Command runs an action; it never holds a selected value.
- Do not use for a short, fixed set of actions on a trigger (row actions, overflow menus) → use `PopoverMenu` instead.
- Do not use to filter a table, list or board already on the page → use `SearchBar` in the `Toolbar` instead.
- Do not use for multi-select → use `Combobox selectionMode="multi"` or `PopoverMenu` with checkbox cells instead.

## Variant selection

Command has no visual variants. The choices are which wrapper to use and how filtering works.

### Wrapper

| Choice | Use when |
|-------|----------|
| `CommandDialog` | Global palette or site search opened by a trigger or ⌘K. Modal, focus-trapped, search resets on every open. |
| `Command` (inline) | The menu sits in a surface that already exists on the page and stays visible. |

### `shouldFilter` prop

| Value | Use when |
|-------|----------|
| `true` (default) | Items are known up front. Command scores, hides and reorders them as the user types. |
| `false` | The app fetches or filters results itself (server search). Every rendered item stays visible, in source order. Pair with controlled `search` / `onSearchChange`. |

### `loop` prop

| Value | Use when |
|-------|----------|
| `true` (default) | Arrow keys wrap from last to first. Right for most menus. |
| `false` | The list is long and wrapping would disorient (e.g. paged results). |

## Spatial contract

- **Owns its padding:** yes — the input row and the list carry their own inset; `CommandItem` rows match `MenuCell` anatomy.
- **Owns its margin:** no — add spacing on a wrapper, never on Command.
- **Fills its container:** yes — `Command` takes the full width and the height its container allows; `CommandList` scrolls internally while the input row stays fixed. Give an inline `Command` a container with a bounded height.
- **Notes:** `CommandDialog` portals to `document.body` and pins near the top of the viewport so the input does not jump as the result count changes. It manages its own width and height.

## Composition rules

- ✅ Structure: `CommandInput` first, then `CommandList` containing `CommandEmpty`, `CommandGroup` › `CommandItem`, and `CommandSeparator` between groups.
- ✅ `CommandItem` may sit directly in `CommandList` (no group) for a short flat menu.
- ✅ Inline `Command` can be used inside: `Card`, `Drawer` content, a page section, a `PopoverWrapper` panel.
- ❌ Never place `Command` inside `Modal` yourself → use `CommandDialog` (it is the Modal composition, with the header and bottom bar removed and the layout tuned).
- ❌ Never open `CommandDialog` from inside a `Modal` — modals never nest.
- ❌ Never render a part outside `<Command>` / `<CommandDialog>` — the part throws.
- ❌ Never combine with `Combobox` or `SearchBar` as the input — `CommandInput` owns the combobox wiring (`aria-activedescendant`, keyboard).

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `CommandItem.value` | `string` | Always. Searched, passed to `onSelect`, must be unique in the menu. Shown as the label unless `label` is set. |
| `CommandItem.keywords` | `string[]` | Add category, synonyms or path words users might type ("guide", "people", "dark mode"). Not displayed. `description` is **not** searched — repeat its words here if they should match. |
| `CommandItem.onSelect` | `(value) => void` | Runs on click or Enter. In `CommandDialog`, close the dialog here (`setOpen(false)`) after navigating or acting. |
| `CommandItem.shortcutLabel` / `shortcutAriaLabel` | `string` | Show an existing app shortcut as a hint. Display only — the app binds the key. Always pass both. |
| `CommandItem.disabled` | `boolean` | The action exists but is unavailable now. Skipped by arrow keys, not runnable. |
| `CommandGroup.heading` | `string` | Name the category in sentence case ("Components", "Go to"). Groups with no matching items hide themselves. |
| `CommandEmpty` children | `ReactNode` | Override the default "No results. Try a different search." with task-oriented copy for this menu. |
| `search` / `onSearchChange` | `string` / `(s) => void` | Control the query — required with `shouldFilter={false}`, or to prefill. |
| `filter` | `(value, search, keywords) => number` | Only to replace the ranking. Return 0 to hide. Default is `commandScore`. |
| `CommandDialog.open` / `onOpenChange` | `boolean` / `(open) => void` | Control from the trigger and the ⌘K listener. The app binds ⌘K / Ctrl K; the dialog does not. |
| `CommandDialog['aria-label']` | `string` | Name the dialog for screen readers ("Search the docs"). |

## Common mistakes

1. **Using `Combobox` for site search or navigation** — it is a form field with a selected value, chevron and clear button, and committing free text fires `onChange` with arbitrary input. See When NOT to use; use `CommandDialog`.
2. **Navigating on whatever text was typed** — only `CommandItem.onSelect` should navigate; Enter with no results does nothing by design.
3. **Binding ⌘K to focus a field instead of opening the palette** — ⌘K / Ctrl K should toggle `CommandDialog` open; see Props reference.
4. **Expecting `description` to match searches** — it is display only; see `keywords` in Props reference.
5. **Leaving `CommandDialog` open after an item runs** — close it in `onSelect`; see Props reference.
6. **Wrapping `Command` in `Modal`** — see Composition rules; use `CommandDialog`.

## Examples

~~~tsx
// ⌘K site search
const [open, setOpen] = useState(false);

useEffect(() => {
  const onKey = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      setOpen((v) => !v);
    }
  };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}, []);

<Button variant="secondary" leadingIcon={<Search size={16} />} showLeadingIcon
  shortcut shortcutLabel="⌘ K" shortcutAriaLabel="Command K"
  aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
  Search
</Button>

<CommandDialog open={open} onOpenChange={setOpen} aria-label="Search the docs">
  <CommandInput placeholder="Search components, patterns and guides" />
  <CommandList>
    <CommandEmpty />
    <CommandGroup heading="Components">
      {components.map((c) => (
        <CommandItem key={c.slug} value={c.name} description={c.group}
          keywords={['component', c.group]}
          onSelect={() => { navigate(`/components/${c.slug}`); setOpen(false); }} />
      ))}
    </CommandGroup>
  </CommandList>
</CommandDialog>
~~~

~~~tsx
// Server-side results: the app filters, Command only navigates
const [search, setSearch] = useState('');
const people = usePeopleSearch(search);

<Command shouldFilter={false} search={search} onSearchChange={setSearch}>
  <CommandInput placeholder="Search people by name" />
  <CommandList>
    <CommandEmpty>No people match. Check the spelling or invite them.</CommandEmpty>
    {people.map((p) => (
      <CommandItem key={p.id} value={p.name} onSelect={() => openProfile(p.id)} />
    ))}
  </CommandList>
</Command>
~~~
