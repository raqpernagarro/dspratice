{% raw %}
# Pattern: Form page
<!--
Version: 1.0.1
Date: 2026-06-03
-->

A page whose primary content is a form for creating or editing a record. Used for new-record flows and settings panels in WorkScope.

---

## Assembly

```
AppShell
├── header: Navbar (variant="title" or "breadcrumbs")
├── sidebar: Sidebar                              ← section recipes: Sidebar.spec.md
└── children (main area — padding already built in)
    ├── SectionHeader (size="large")          ← page title
    └── Card (one per logical form section)
        ├── header: SectionHeader (size="medium", built in)
        ├── content: form fields
        │   ├── TextInput / TextArea / Select / ...
        │   ├── CheckboxField / RadioField / Switcher
        │   └── HorizontalInput (dense settings only)
        └── bottom bar: Toolbar (built in)
            ├── leftActions: Ghost/Secondary actions
            └── rightActions: Primary submit (rightmost)
```

---

## Rules

### Layout
- AppShell's main area already applies `padding: var(--space-md)` — never add a wrapper div with additional padding.
- `SectionHeader` (page title) is always a direct child of the AppShell main area. Never inside a padded wrapper.
- Each `Card` is a direct child of the AppShell main area. Never nested inside another `Card`.
- Use `gap: var(--space-lg)` between `Card` sections in the page flow.
- Never use a raw `<form>` element as the page root — form layout lives inside `Card` content areas.

### Card
- Every `Card` on a form page must have `showHeader` and a `title`. Never a body-only Card.
- Use `showBottomBar={false}` on section cards that have no footer actions.
- The primary submit action lives in the bottom-most `Card`'s bottom bar — never in Navbar, never floating.
- Never add `padding` or `margin` directly to `<Card>` or to its built-in `SectionHeader` or `Toolbar`.
- `DataTable` is never wrapped in a `Card` — if a form page includes a related records table, it sits outside all Cards as a separate section.

### Toolbar (Card bottom bar)
- `Toolbar` inside `Card` is rendered via `bottomBarLeftActions` / `bottomBarRightActions` props — never mount a standalone `Toolbar` inside card content.
- Button order in bottom bar: Ghost → Secondary → **Primary** (Primary always rightmost).
- Primary submit must be disabled until all mandatory fields have a value.
- Primary submit must include `⌘↵` via Button's `shortcut` / `shortcutLabel` / `shortcutAriaLabel` props.
- Maximum one Primary button per view.

### SectionHeader (Card header)
- `Card` renders `SectionHeader` internally via its `title`, `description`, `headerSize`, `headerLeadingControl`, `headerTrailingControl` props.
- Never mount a standalone `SectionHeader` inside `Card` content — use the Card's built-in header props.
- `SectionHeader` size inside a Card should be `"medium"` for sub-sections, `"large"` for the top-level page title only.

### Navbar
- **New record** (no existing context): `variant="title"` with the page name.
- **Edit record** (detail view): `variant="breadcrumbs"` (renders `Breadcrumbs size="lg"`) showing `[Parent] > [Record name]`.
- Never show both a title and breadcrumbs simultaneously.
- Never show a back arrow on top-level pages.

### Fields
- Use `gap: var(--space-md)` between fields in a form stack.
- Mandatory by default; mark optional fields with the input `optional` prop — see AI.md LCB-08.
- Validate all fields on submit — never in real time (exceptions: password strength, character count, search, OTP).
- Error messages replace helper text in the error state. They persist until resolved.
- Always render `PasswordRequirement` in a vertical requirements stack with `gap: var(--space-xs)`, matching the “with requirements” guidance, so list alignment stays consistent.

---

## Correct assembly

```tsx
<div style={{ height: '100vh', display: 'flex' }}>
  <AppShell
    header={
      <Navbar
        variant="title"
        title="New project"
      />
    }
    sidebar={<Sidebar ... />}
  >
    <SectionHeader title="New project" size="large" />

    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', width: '100%' }}>

      {/* Section 1 — basic details */}
      <Card
        title="Project details"
        headerSize="medium"
        showBottomBar={false}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <TextInput label="Project name" />
          <TextArea label="Description" />
          <Select label="Status" options={statusOptions} />
        </div>
      </Card>

      {/* Section 2 — team, with submit in bottom bar */}
      <Card
        title="Team"
        headerSize="medium"
        showBottomBar
        bottomBarRightActions={
          <>
            <Button variant="ghost" size="md" onClick={handleCancel}>Cancel</Button>
            <Button variant="primary" size="md" disabled={!isValid} onClick={handleSubmit}
              shortcut shortcutLabel="⌘↵" shortcutAriaLabel="Command Enter">
              Create project
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <Select label="Project lead" options={peopleOptions} />
        </div>
      </Card>

    </div>
  </AppShell>
</div>
```

---

## Anti-patterns

```tsx
// ❌ Body-only Card with no header
<Card showHeader={false} showBottomBar={false}>
  <TextInput label="Project name" />
</Card>

// ❌ Standalone SectionHeader inside Card content
<Card title="Project details" showBottomBar={false}>
  <SectionHeader title="Project details" size="medium" />  // duplicate — Card renders this internally
  <TextInput label="Project name" />
</Card>

// ❌ Standalone Toolbar inside Card content
<Card title="Team" showBottomBar={false}>
  <TextInput label="Project lead" />
  <Toolbar                                                  // use bottomBarRightActions prop instead
    rightActions={<Button variant="primary">Save</Button>}
  />
</Card>

// ❌ Primary CTA in Navbar on a form page
<Navbar
  variant="title"
  title="New project"
  rightActions={<Button variant="primary">Create project</Button>}  // belongs in Card bottom bar
/>

// ❌ DataTable wrapped in Card
<Card title="Related tasks">
  <DataTable columns={columns} rows={rows} />               // DataTable is never inside Card
</Card>

// ❌ Padding on AppShell children wrapper
<AppShell ...>
  <div style={{ padding: 'var(--space-md)' }}>          // AppShell already has padding
    <SectionHeader title="New project" size="large" />
  </div>
</AppShell>

// ❌ Real-time validation
<TextInput
  label="Email address"
  onChange={(e) => validateEmail(e.target.value)}           // validate on blur, not onChange
/>

// ❌ Primary CTA enabled before fields are complete
<Button variant="primary" size="md">                        // must be disabled={!isValid}
  Create project
</Button>

// ❌ Submit without keyboard shortcut
<Button variant="primary" size="md">Save changes</Button>   // always add shortcut shortcutLabel="⌘↵" shortcutAriaLabel="Command Enter"
```

---

## Atom → molecule → organism chain

| Atom / molecule | Used by | Role |
|---|---|---|
| `SectionHeader` | `Card` (via header props) | Section title — rendered by Card internally |
| `Toolbar` | `Card` (via bottomBar props) | Bottom bar — rendered by Card internally |
| `Button` | `Toolbar` (auto-sized) | Form actions |
| `Checkbox` | `Toolbar` (auto-sized) | Inline controls in toolbar |
| `SkeletonLoading` | `Card` (loading prop) | Loading state replaces entire card chrome |
| `TextInput` / `TextArea` / `Select` etc. | Card content | Form fields — placed in content area |

`SectionHeader` and `Toolbar` are structural components of `Card` — they are rendered via Card props, not mounted separately inside Card content. Mounting them manually inside Card content duplicates chrome.

---

## Shared component note: SectionHeader and Toolbar

Both `SectionHeader` and `Toolbar` appear in two organism contexts:

| Component | Inside `Card` | Inside `Modal` | Standalone |
|---|---|---|---|
| `SectionHeader` | Via `title` / `headerSize` props | Via `title` / `headerSize` props | Direct child of page flow |
| `Toolbar` | Via `bottomBarLeftActions` / `bottomBarRightActions` props | Via `bottomBarLeftActions` / `bottomBarRightActions` props | Standalone filter bar (`variant="filter-bar"`) |

When inside `Card` or `Modal`, always use the organism's built-in props. Never mount these components manually inside content areas.

---

## Related patterns

- [data-page.md](./data-page.md) — when the page primary content is a table, not a form
- [detail-drawer.md](./detail-drawer.md) — when edit happens in a Drawer, not a full page
- [modal-form.md](./modal-form.md) — when the form is short enough for a Modal
{% endraw %}
