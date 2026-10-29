{% raw %}
# DS-Ngr — Usage guide

> Condensed rules for context-limited tools. Full reference: `AI.md`
> Storybook: `https://nagarro-dv.github.io/DSN/`

Icons come from `lucide-react` (`ds-ngr` does not re-export them). List it in `package.json` at the same version `ds-ngr` uses.

**Start pages from a template.** `templates/*.jsx` (indexed under `templates` in `ds-index.json`) are rule-checked reference pages: dashboard, data page, kanban board, detail drawer, form page, settings, sign-in, AI chat. Copy the closest (`npx ds-ngr add <slug>` where the CLI is installed) and change data and copy, not structure.

---

## AppShell — mandatory root layout

Every page must use `AppShell`. Never build layout with raw divs.
AppShell must always live inside a full-height wrapper div — never add height to AppShell itself.

```tsx
<div style={{ height: '100vh', display: 'flex' }}>
  <AppShell
    header={<Navbar variant="title" title="Dashboard" rightActions={<Button variant="primary" size="md">New project</Button>} />}
    sidebar={<Sidebar ... />}
  >
    {/* No wrapper needed — AppShell already has padding: var(--space-md) built in */}
    <SectionHeader title="Dashboard" size="large" />
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', width: '100%' }}>
      {/* sections here */}
    </div>
  </AppShell>
</div>
```

- Only the content area scrolls. Sidebar and Navbar are always fixed.
- Never pass `collapsed` to Sidebar — AppShell controls it automatically.
- `DataTable` is never wrapped in a `Card` — always full-width.
- Column reorder: drag the header, Column options → Move left/Move right, or Ctrl/Cmd+Arrow on a focused reorderable header — never add a separate "Reorder column" button.
- DataTable sort is desc-first (`none → desc → asc → desc`) — never assume asc-first.
- Set `flush` on `SectionHeader` when body content below has no horizontal padding (full-bleed lists, tables, accordion rows). Default (no `flush`) is correct for direct AppShell sections and Card headers.

---

## Typography — never override

The design system sets all typography globally. Never fight it.

- Never set `font-family` — it is inherited.
- Never use raw `<h1>`–`<h6>` or `<p>` with custom font styling.
- Never set `font-size` with raw pixel values — use `var(--font-size-*)` tokens.
- For dense metadata, timestamps, and timeline secondary copy: always use `var(--font-size-micro)`, `var(--font-line-height-micro)`, and `var(--font-weight-regular)` or `var(--font-weight-medium)`. Never use `--font-size-label` or raw `px` for this role.

```tsx
// CORRECT
<div style={{ fontSize: 'var(--font-size-body-md)', color: 'var(--color-foreground-neutral-primary)' }}>

// WRONG
<h2 style={{ fontFamily: 'Georgia, serif' }}>   // never
<p style={{ fontSize: '18px' }}>                // never
```

---

## Navbar rules

- `variant="title"` on top-level pages — plain title, no back arrow, no breadcrumbs.
- `variant="breadcrumbs"` on detail views — breadcrumb replaces the title, never both.
- Primary CTA always in `rightActions` — never inside a Card, never floating.
- Never use `position: fixed` or `position: absolute` on any Button.
- Maximum one Primary button per view. Order right-to-left: Ghost → Secondary → Primary.
- All titles, labels, copy: sentence case always. Never title case.

---

## Card structure

```tsx
// CORRECT
<Card title="Team members" showBottomBar={false}>
  {/* body — .dsn-card-content padding depends on data-has-header */}
</Card>

// WRONG — body-only card
<Card showHeader={false} showBottomBar={false}>{/* content */}</Card>

// WRONG
<Card style={{ padding: 'var(--space-md)' }}>  // never on Card itself
```

- Never use a card with body content only and no header — always set `showHeader` and `title`; use `showBottomBar={false}` when there is no footer.
- Never add padding, margin, or gap to the Card header or bottom bar — they are pre-built.
- Do not wrap every card body in an extra padded div — `.dsn-card-content` owns inset via `data-has-header`.
- Multiple tags in a card body: one flex row with `flex-wrap` and a small gap.

---

## KPI / stat card pattern

```tsx
<Card title="Active projects" showBottomBar={false}>
  <div style={{ fontSize: 'var(--font-size-display-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-foreground-neutral-primary)' }}>
    14
  </div>
  <div style={{ fontSize: 'var(--font-size-body-sm)', color: 'var(--color-foreground-success-strong)', marginTop: 'var(--space-2xs)' }}>
    +2 this week
  </div>
</Card>
```

Never use raw HTML or custom typography for stat cards. Always use `<Card>` and token values.

---

## EmptyState — critical

- `showMainCta` → primary `Button`; `showSecondaryOption` → secondary `Button` — never mount a separate `Button` beside `EmptyState` for variant only.
- Secondary-only: `showMainCta={false}`, `showSecondaryOption`, `secondaryOptionLabel`, `onSecondaryOptionClick`.
- `hasIcon={false}` when no icon; when `hasIcon={true}`, pass a context-specific `icon={LucideIcon}` (e.g. `Search`, `FolderOpen`).
- Flex column parents: `min-width: 0` on column; `min-width: 0` and `max-width: 100%` on `EmptyState` root.

---

## Component spacing — critical

Never add `padding`, `margin`, `gap`, `min-height`, or any spacing override directly on a DS-Ngr component. Apply spacing tokens to wrapper/container elements only.

```
✅ <div style={{ gap: 'var(--space-lg)' }}><Button /><Button /></div>
❌ <Button style={{ marginRight: 'var(--space-sm)' }} />
❌ <Navbar style={{ paddingInline: 'var(--space-md)' }} />
```

---

## Token rules

Never hardcode hex values, pixel sizes, or rgba. Always use CSS custom properties.

### Three-tier model — always resolve through this chain
```
Primitives (raw) → Semantic (intent) → Component (usage)
```
- Use semantic tokens in all app code: `var(--color-foreground-neutral-primary)` ✅ — `var(--primitive-neutral-900)` ❌
- Never reference primitive tokens directly.

**Never write a token you have not seen** — if it isn't in `tokens.css`, stop and ask. Semantic tokens are in one of 8 tiers: `color` (background · foreground · border · shadow), `font`, `space`, `size`, `shape`, `effect`, `motion`, `z-index`. `--primitive-*` (Layer 1) and component tokens like `--button-*` (Layer 3) are never used in app code. Every scale uses one ladder, `none 3xs 2xs xs sm md lg xl 2xl 3xl full` — never `small`, `standard`, `large`, `xxl`. States are always last: `default hover active focus disabled selected` (never `pressed`).

| Use case | Token |
|---|---|
| Gap, margin, padding | `--space-{none|3xs|2xs|xs|sm|md|lg|xl|2xl|3xl}` |
| Horizontal page margin | `--space-md` |
| Text / icon color | `--color-foreground-*` |
| Background | `--color-background-*` |
| Border/outline color | `--color-border-*` |
| Border width | `--size-border-*` |
| Border radius | `--shape-radius-*` |
| Box shadow | `--effect-shadow-*` |
| Chart/graph colors | `--color-{background|border|foreground}-dataviz-*` |

- One space scale for padding, margin and gap — there is no inset scale and no component spacing tokens.
- Never use generic semantic tokens for dataviz — always `--color-{background|border|foreground}-dataviz-*`.
- **Charts:** must `import 'ds-ngr/tokens.css'` — without it, SVG dataviz vars resolve to black. Use `ChartCard` on dashboards; bare charts OK in drawers.
- Dark mode: `data-theme="dark"` on the root element — never `@media (prefers-color-scheme: dark)`.

---

## Tag semantic mapping

Always match Tag variant to the meaning of the value. Never use the same variant for all tags in a list.

| Meaning | Variant |
|---|---|
| Done, active, on track, success, approved, complete | `success` |
| At risk, pending, in review, in progress, waiting | `warning` |
| Behind, blocked, failed, rejected, overdue | `error` |
| Draft, inactive, archived, unknown | `neutral` |
| Notable but not urgent — featured, active selection, primary category | `highlight` |

```tsx
// WRONG — same variant for every tag
<Tag variant="warning" label="Completed" />   // completed = success
<Tag variant="warning" label="Not started" /> // not started = neutral

// CORRECT
<Tag variant="success" label="Completed" />
<Tag variant="warning" label="In progress" />
<Tag variant="neutral" label="Not started" />
<Tag variant="error" label="Blocked" />
```

Tags are non-interactive. Never make a Tag clickable. Tag text goes in the required `label` prop — Tag does not render children, so `<Tag>Completed</Tag>` renders an empty tag.

---

## Component decision rules

| Situation | Component |
|---|---|
| Toggle between 2–5 mutually exclusive views | `SegmentControl` — never plain text or custom buttons; hugs content by default |
| Pick one value, immediate effect | 2–3 options → `SegmentControl`; 4+ → `Select`. Confirmed on submit → `Radio` |
| Toolbar on top of a list or section | `Toolbar variant="filter-bar"` — no elevation shadow |
| Toolbar at the bottom of a card, modal or drawer | The organism's `bottomBar*` props — never a standalone `Toolbar` |
| Each option has a distinct content panel | `Tabs` |
| User selects or filters with a toggleable option | `Chip` |
| Non-interactive status or category label | `Tag` |
| User clicks a table row to see details | `Drawer` |
| User must complete a task before continuing | `Modal` |
| Jump to a page, record or action by typing its name (⌘K) | `CommandDialog` — never `Combobox` |
| Numeric count on a nav icon | `Badge` |
| List needing sorting, filtering, or pagination | `DataTable` |
| Chart on a dashboard | `ChartCard` wrapping a chart primitive — bare charts OK in drawers |
| Month, week, day, or list scheduling calendar | `CalendarView` — never a custom calendar grid |
| Picking a date or range in a form | `DateTimePicker` — not `CalendarView` |
| No results or first-time empty section | `EmptyState` |
| Content loading, shape known | `SkeletonLoading` — not `ProgressRing` |

---

## Select and popovers

- Never set `max-height` or `overflow` on popover content — `PopoverWrapper` caps the height at the smaller of `var(--popover-height-max)` and the space on the side it opens on.
- Popovers open below the trigger and flip above only when the content does not fit below and there is more room above; they never overlap their trigger.
- Only the popover content area scrolls — header, segment, search and bottom bar stay pinned.
- Always show a search field when a popover list has more than 10 items. `Select` does this automatically; set `showSearch` on `PopoverMenu` yourself.
- Never pass `searchable={false}` to a `Select` with more than 10 options. Use `Combobox` for free-text or async option sets.
- Never call `element.focus()` or `element.scrollIntoView()` on popover content — the library handles focus and scrolling.

---

## Forms

- Every field is mandatory by default. Input components cannot render a required marker — use the `optional` prop only; the component renders `(optional)` in `var(--color-foreground-neutral-tertiary)`.
- Use `Form` for submittable field groups; it owns vertical rhythm via `--space-md` — never add margin or gap on inputs inside a form.
- Group related fields with `Fieldset` + `legend` inside a form; never use `SectionHeader` or `Card` title for form grouping; never nest `SingleChoice` or `MultiChoice` inside `Fieldset`.
- Primary submit must be disabled until all mandatory fields have a value.
- Validate on submit only — not in real time (exceptions: password strength, character count, search, OTP).
- Every primary submit button must show `⌘↵`: `<Button variant="primary" shortcut shortcutLabel="⌘↵" shortcutAriaLabel="Command Enter">Save changes</Button>`

---

## What not to do

- ❌ Build layout with raw divs — always use `AppShell`
- ❌ Add `min-height`, `height`, or sizing directly to `<AppShell>`
- ❌ Skip the `<div style={{ height: '100vh', display: 'flex' }}>` wrapper around AppShell
- ❌ Add extra padding inside AppShell children — the main area already has built-in padding
- ❌ Wrap `SectionHeader` in a padded div — it owns its own padding and causes horizontal overflow when wrapped
- ❌ Add `autoFocus` or manual focus refs on form fields to work around Modal initial focus — Modal focuses the first field in content on open
- ❌ Use fixed pixel `minWidth` on page-level grid or flex containers
- ❌ Set `font-family` anywhere in app code
- ❌ Use `<h1>`–`<h6>` or `<p>` with custom font styling
- ❌ Set `font-size` with raw pixel values
- ❌ Add spacing overrides directly on DS-Ngr components
- ❌ Use a `Card` with body content only and no header
- ❌ Omit `showBottomBar={false}` when the card has no footer
- ❌ Add padding/margin directly to `<Card>` or duplicate `.dsn-card-content` inset on every child
- ❌ Wrap `DataTable` in a `Card`
- ❌ Use `Toolbar variant="default"` on top of a list or section — it casts an upward shadow meant only for bottom bars; use `variant="filter-bar"`
- ❌ Put a labeled `SearchBar` (label + helper row) in a filter bar — a filter bar looks like a bottom bar; use `variant="ghost"` with `aria-label`
- ❌ Make `SegmentControl` full-width in a large container or in a bar with several other controls — it hugs its content
- ❌ Set `fullWidth` on `SegmentControl` unless it is the sole element of a small bar or panel, or shares it with one or two actions
- ❌ Set a fixed width on `SegmentControl`
- ❌ Use `Card` alone for dashboard charts — use `ChartCard` for chart padding and chrome
- ❌ Add a separate "Reorder column" button or custom column-move UI — use Column options, drag, or Ctrl/Cmd+Arrow on the focused header
- ❌ Assume ascending-first DataTable sort — first click is always `desc`
- ❌ Place the primary CTA inside a Card or as a floating button
- ❌ Mount a separate `Button` beside `EmptyState` only for variant — use `showMainCta` / `showSecondaryOption`
- ❌ Reimplement board or in-column empty layouts with custom wrappers
- ❌ Use `position: fixed` or `position: absolute` on any Button
- ❌ Use raw HTML `<button>` when `Button` exists — compact inline actions use `variant="ghost" size="sm"`
- ❌ Use `size="sm"` on a standalone button — `sm` is only for buttons nested inside another component or control; everything else is `md`
- ❌ Pass button text as a `label` prop — `Button` takes its label as `children`
- ❌ Show a back arrow on top-level pages
- ❌ Hardcode hex values, pixel sizes, or rgba
- ❌ Use an inset scale (`--inset-*`, `--size-inset-*`) — retired; one `--space-*` scale covers padding, margin and gap
- ❌ Use generic semantic tokens or hardcoded hex for dataviz
- ❌ Render charts without `import 'ds-ngr/tokens.css'` — charts paint black
- ❌ Use the same Tag variant for all tags in a list
- ❌ Make a Tag interactive or clickable
- ❌ Place two Primary buttons side by side
- ❌ Use any icon library other than `lucide-react`
- ❌ Install a different `lucide-react` version than `ds-ngr` uses — keep them identical
- ❌ Leave placeholder icons, help text, or hint icons in place
- ❌ Use "OK", "Confirm", or "Yes" as button labels — always specific verbs
- ❌ Use title case — always sentence case
- ❌ Override dark mode with `@media (prefers-color-scheme: dark)` — use `data-theme="dark"`
- ❌ Use `ProgressRing` when content shape is known — use `SkeletonLoading`
- ❌ Leave an empty state as blank space — always use `EmptyState`

---

*DS-Ngr usage guide. Full reference: `AI.md`. Last updated: 2026-10-11.*
{% endraw %}
