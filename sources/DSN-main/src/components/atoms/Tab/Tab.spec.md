# Tab

**Tier:** atom
**Location:** `src/components/atoms/Tab/Tab.spec.md`
**Version:** 1.0.0

## What it is

A `role="tablist"` row of triggers (`TabItem[]`) that switches between associated content panels (`role="tabpanel"`) within the same page context, without navigation.

## When to use

- Use when content can be divided into parallel, mutually exclusive sections the user might switch between (e.g. "Overview", "Activity", "Settings")
- Use to organize a settings page into categories
- Use to present alternative, substantial data views where each view is a distinct named section (e.g. "Table", "Chart", "Map")

## When NOT to use

- Do not use when the sections are sequential steps → use a stepper instead
- Do not use when there are fewer than 2 options → a single tab is meaningless
- Do not use when there are more than 6–7 options → use a sidebar nav or `Select` instead
- Do not use when switching is a display preference with no distinct content panel → use `SegmentControl` instead
- Do not use when the goal is filtering the same content → use `Chip` or a filter panel instead
- Do not use when each item goes to a different page or route → use `TabNav` instead (same look, real links, `aria-current="page"`)

## Variant selection

`Tab` itself has no visual `variant` prop. The codebase also exposes `CustomViewTab` for user-defined/custom views (adds an inline "add view" `Button` affordance as the last row item) — do not mix `Tab` and `CustomViewTab` items in the same row; all tabs in a group must be the same type.

### `showPanels` prop

| Value | Use when |
|-------|----------|
| `true` (default) | The tab row controls visible content panels rendered by `Tab` itself |
| `false` | The tab row only needs to drive external state/content elsewhere on the page (tab-list-only usage) |

## Spatial contract

- **Owns its padding:** yes — the tab list row and each rendered panel manage their own internal layout.
- **Owns its margin:** no — it does not space itself from surrounding content; place it within the parent's normal layout flow.
- **Fills its container:** yes — in full-page layouts tabs typically span the full content width; in card/panel layouts they span the component width.
- **Notes:** The selected tab's panel must render directly below or adjacent to the tab row — never place the tab row and its content in disconnected parts of the layout.

## Composition rules

- ✅ Can be used inside: page content areas, cards, panels — anywhere a tab row sits above its controlled content
- ❌ Never place inside: another `Tab`/tabpanel — never nest tabs within tabs
- ❌ Never combine with: mixed `Tab` and `CustomViewTab` items in the same row — all tabs in a group must be the same type

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `tabs` | `TabItem[]` | Each item needs a `value`, `label` (noun/noun phrase), and `panel` when `showPanels` is true |
| `value` / `defaultValue` / `onChange` | `string` / `string` / `(value: string) => void` | Use `value`+`onChange` for controlled selection; `defaultValue` for uncontrolled |
| `showPanels` | `boolean` | Set `false` when the tab row drives content rendered elsewhere instead of via `tab.panel` |
| `TabItem.disabled` | `boolean` | Use sparingly — if a tab is always disabled for all users, remove it instead; if conditional, explain why via tooltip |

## Common mistakes

1. **Nesting tabs within tabs** — AI.md explicitly forbids this; nested tab structures create orientation confusion and are hard to navigate via keyboard.
2. **Using `Tab` for a display-preference toggle with no distinct content panel** — AI.md requires `SegmentControl` for choosing UI views without separate panels.
3. **Using verbs or questions in tab labels** — AI.md requires tab labels to be nouns only, e.g. "Overview" not "View overview".
4. **Mixing `Tab` and `CustomViewTab` items in the same row** — all tabs in a group must be the same type.
5. **Including counts/badges as inline text in the tab label** — use a `Badge` component on the tab instead of embedding the count in the label string.

## Examples

```tsx
// Most common usage
<Tab
  tabs={[
    { value: 'overview', label: 'Overview', panel: <OverviewPanel /> },
    { value: 'activity', label: 'Activity', panel: <ActivityPanel /> },
    { value: 'settings', label: 'Settings', panel: <SettingsPanel /> },
  ]}
  defaultValue="overview"
  aria-label="Profile sections"
/>

// Non-obvious case — tab list only, content rendered elsewhere
<Tab
  tabs={viewTabs}
  value={activeView}
  onChange={setActiveView}
  showPanels={false}
  aria-label="View sections"
/>
```

## Placement

- Tabs sit at the top of the content area they control. The content panel renders directly below.
- Do not nest tabs within tabs.
- In full-page layouts, tabs typically span the full content width; in card/panel layouts, they span the component width.
- Maintain consistent tab row height and spacing within a product.

## Interaction

- Clicking or tapping a tab selects it and reveals its content panel immediately, without navigation or page reload.
- Keyboard: `Tab` key moves focus into the tab row. Arrow keys (`←`/`→`) move focus between tabs. `Enter`/`Space` selects the focused tab. `Tab` again moves focus into the content panel.
- If a tab's content involves async data loading, show a skeleton or spinner within the content panel — never a loading state on the tab trigger itself.

## Accessibility

- `role="tablist"` on the tab row, `role="tab"` on each trigger, `role="tabpanel"` on each panel.
- Each tab has `aria-selected` and `aria-controls` pointing to its panel's `id`; each panel has `aria-labelledby` pointing to its tab's `id`.
- Only the selected tab is in the natural tab order (`tabIndex={0}`); all others use `tabIndex={-1}` and are reachable via arrow keys.
- Disabled tabs must have `aria-disabled="true"`.
- Content panels for non-selected tabs are hidden from the accessibility tree via the `hidden` attribute.

## Content guidelines

- Tab labels: 1–3 words, nouns only — no verbs, no questions.
- Use sentence case: "Team members" not "Team Members".
- Labels must be distinct.
- Do not include counts or badges as part of the label text — use a `Badge` component on the tab instead.
