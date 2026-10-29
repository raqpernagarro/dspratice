{% raw %}
# DS-Ngr — AI Agent Rules
<!--
Version: 1.3.4
Date: 2026-07-28
-->

> **Single source of truth for AI agents building apps with `ds-ngr`.**
> Compiled from: `specs/foundations/`, co-located component specs under `src/components/**/<ComponentName>.spec.md`, shared specs in `specs/atoms/`, `specs/molecules/`, `specs/organisms/`, `specs/patterns/`, and `specs/accessibility-audit-2026-02-28.md`.
>
> **This file is for consuming the package.** For building components inside the library itself, read `AGENTS.md` instead.

---

## Agent protocol — read this first

### Session start (required)

1. Load `ds-index.json` from the repo root — component inventory, token architecture, patterns, and composition rules.
2. Load `AI.md` — all rules and guidelines. This file is the single source of truth for how to use the library correctly.
3. If the task involves a specific component, check its `spec` path in ds-index.json. If a path is listed, read that file before using the component. If the path is `null`, rely on the component's section in this file under [Component usage rules](#component-usage-rules).
4. If the app has the `ds-ngr` CLI (every starter pack does), `npx ds-ngr docs <Component>` prints a component's props and spec, and `npx ds-ngr add <template>` copies a page template into `src/pages/`. Prefer them over guessing paths inside `node_modules/ds-ngr`.

### Before choosing a component

- Is the data tabular with sorting/filtering? → DataTable. Never wrap it in Card.
- Is the content a chart on a dashboard? → ChartCard wrapping a chart primitive. Bare charts are allowed in drawers or pre-chromed slots.
- Is the content a contained section with a header? → Card. Never put DataTable inside it.
- Is the label non-interactive status/category? → Tag. If it needs to be removable/selectable → Chip instead.
- Is the action the primary CTA on the page? → Button variant="primary" in Navbar rightActions. Never floating.
- Does the layout need a root shell? → AppShell. Never add a padding wrapper inside its main area.

### Before submitting output

- [ ] No hardcoded hex values — all colors via semantic tokens
- [ ] `lucide-react` is listed in the app's `package.json` at the same version `ds-ngr` uses — icons import from `lucide-react`
- [ ] No `<DataTable>` inside `<Card>`
- [ ] Charts import `ds-ngr/tokens.css` — without it, SVG dataviz vars resolve to black
- [ ] No padding wrapper inside AppShell main area
- [ ] All labels, headings, and actions in sentence case
- [ ] Every token used exists in `tokens.css` — no fabricated tokens

---

## How to use this file

1. **Before writing any code** — read [Setup](#setup--mandatory-css-imports) and implement the required imports and CSS.
2. **Before building any page** — read the relevant pattern spec in `specs/patterns/`. Start with `specs/patterns/README.md` for the full relationship map and shared component rules. For a single component, check `ds-index.json` for its spec path (co-located `.spec.md` or shared `specs/` file).
   - **Start from a page template when one fits.** `templates/` holds a runnable, rule-checked reference page for each pattern plus settings, sign-in and AI chat (listed under `templates` in `ds-index.json`). Copy the closest one and adapt its data and copy — never its structure — rather than assembling a page from scratch.
3. **Before building any page** — read [AppShell](#appshell--mandatory-root-layout) and [Hard rules](#hard-rules--read-before-writing-any-code).
4. **Before selecting a component** — check [Cross-component patterns](#cross-component-patterns).
5. **Before implementing a component** — read its section in [Component usage rules](#component-usage-rules).
6. **All token references** must use CSS custom properties: `var(--token-name)`. Never hardcode values.
7. Token naming: Figma slash paths → hyphenated CSS vars. `background/interactive/primary/default` → `var(--color-background-interactive-primary-default)`.

---

## Contents

- [Setup](#setup--mandatory-css-imports)
- [Hard rules](#hard-rules--read-before-writing-any-code)
- [AppShell](#appshell--mandatory-root-layout)
- [Token system](#token-system-rules)
- [Tag semantic mapping](#tag-semantic-mapping--critical)
- [Navigation & page structure](#navigation--page-structure-rules)
- [Layout & component behavior](#layout--component-behavior-rules)
- [Cross-component patterns](#cross-component-patterns)
- [Component usage rules](#component-usage-rules)
- [Writing conventions](#writing-conventions--content-guidelines)
- [Accessibility](#accessibility-requirements)
- [What not to do](#what-not-to-do)

---

## Setup — mandatory CSS imports

```tsx
// main.tsx — import in this order, before any other app CSS
import 'ds-ngr/tokens.css'
import 'ds-ngr/global.css'
import 'ds-ngr/style.css'
```

> **Custom theme:** if the app has a `theme.css` (or multi-brand `themes.css`) exported from the theme configurator, import it **right after** `ds-ngr/tokens.css`. Never edit it by hand. A multi-brand file picks its brand from `data-brand` on `<html>` only.

> **Icons:** import icons from `lucide-react` — `ds-ngr` does not re-export them. List `lucide-react` in the app's `package.json` at **the same version `ds-ngr` uses** (check `dependencies` in `ds-ngr`'s `package.json`). Package managers such as pnpm only let an app import packages it lists itself, and a mismatched version ships two copies of the icon set.

`global.css` is required for layout parity with Storybook (universal `box-sizing: border-box`, base body styles, AppShell height chain). Without it, components using `min-height` + padding (e.g. `SectionHeader` in popover headers) can be ~16px taller than in Storybook.

**Charts:** `tokens.css` is mandatory for chart rendering. Chart SVG `stroke` and `fill` use `var(--color-{background|border|foreground}-dataviz-*)`. If `tokens.css` is not loaded, those custom properties do not resolve and charts paint **black**. No theme provider is required — load tokens once at app entry. Light is the default: the dataviz palette is declared on `:root`, so charts render correctly with no `data-theme` attribute; set `data-theme="dark"` to switch them to the dark palette.

### Required CSS on the host app
```css
html, body { margin: 0; height: 100%; }
#root { height: 100%; display: flex; flex-direction: column; box-sizing: border-box; }
```

### Required wrapper for AppShell
AppShell needs a full-viewport parent. Always wrap it — never set height on AppShell itself:

```tsx
// App.tsx or your route root
<div style={{ height: '100vh', display: 'flex' }}>
  <AppShell ...>
    ...
  </AppShell>
</div>
```

---

## Hard rules — read before writing any code

These are the most violated rules. Read them first. They apply to every page, every component, every line of code.

### Layout
- `AppShell` is the **only** permitted root layout. Never build layout with raw divs.
- `AppShell` always lives inside `<div style={{ height: '100vh', display: 'flex' }}>` — never add height directly to AppShell.
- Page content goes directly inside AppShell's `children` — no extra wrapper div needed. AppShell's main area already applies `padding: var(--space-md)` (16px) on all sides.
- `SectionHeader` is always a direct child of the page flow — never inside a padded wrapper.
- Always render full-width sticky UI that must remain flush under the navbar in the AppShell header region, not inside the scrollable main content.
- Only the content area scrolls. Sidebar and Navbar are always fixed. Never apply scroll to the full page.
- `DataTable` is **never** wrapped in a `Card` — always full-width.
- Never build hand-built HTML tables for tabular data — always use `DataTable` with column definitions and row objects.
- Never use a `Card` header as a page section title for lists or detail blocks in main content — always use `SectionHeader` inside a `page-section` wrapper (`size="medium"` for subsection titles).
- Never add `padding`, `margin`, `gap`, `min-height`, or any spacing override directly on a DS-Ngr component. Apply spacing tokens to wrapper/container elements only.
- Never use hardcoded pixel values for spacing in app layouts when an equivalent `--space-*` token exists.
- Never use a `Card` with body content only and no header — always set `showHeader` and `title`; use `showBottomBar={false}` when there is no footer.
- Never add padding or margin directly to `<Card>` — `.dsn-card-content` owns inset via `data-has-header` and `data-has-bottom-bar`.

### Typography
- Never set `font-family` anywhere in app code — it is inherited from the design system.
- Never use raw `<h1>`–`<h6>` or `<p>` elements with custom font styling.
- Never set `font-size` with raw pixel values — always use `var(--font-size-*)` tokens.
- Always use micro typography tokens (`--font-size-micro`, `--font-line-height-micro`, and the appropriate `--font-weight-*`) for dense metadata and timeline-style secondary copy in consuming apps.
- Never use `--font-size-label` or hardcoded pixel font sizes for that dense metadata role — use the micro scale instead.
- Never use serif, system, or any non-design-system font.

### Buttons and CTAs
- Primary CTA always in Navbar `rightActions` — never inside a Card, never floating.
- Never create a floating action button (FAB). Never use `position: fixed` or `position: absolute` on any Button.
- Maximum one Primary button per view.
- Button order right-to-left: Ghost → Secondary → Primary (Primary is always rightmost).
- Never use raw HTML `<button>` elements for interactive actions when the DS `Button` component exists — including compact inline secondary actions such as reply, edit, and delete in lists or comment threads; use `Button` with `variant="ghost"` and `size="sm"`.
- Always pass button label text as `children` of `Button`, never as a `label` prop — `Button` has no `label` prop; do not infer the API from form field components.
- Never create custom button CSS classes in consuming apps to replicate DS button appearance — if no existing variant fits a legitimate use case, that is a DS gap; use the closest documented variant today rather than hand-built substitutes.

### Navigation
- Never show a back arrow on top-level pages (Dashboard, Projects, Tasks, People, Notes).
- All titles, labels, and copy: sentence case always. Never title case.

### Tokens
- Never hardcode hex values, pixel sizes, or rgba. Everything comes from tokens.
- One `--space-*` scale for padding, margin and gap — there is no inset scale and no component spacing tokens.
- Never use generic semantic tokens or hardcoded hex for dataviz — always `--color-{background|border|foreground}-dataviz-*`.
- Always look on tokens.css for available tokens. Tokens are descriptive enough to understand the purpose. Use them accordingly. For example: You need a space between fields on a form, use `--space-md`. You need a border radius for a card, use `--card-radius`. You need a gutter between cards, use `--space-md`.

### Tags
- Always match Tag `variant` to the semantic meaning. Never use the same variant for all tags in a list.
- Tags are non-interactive. Never make a Tag clickable.

### Icons
- Only `lucide-react` is permitted — list it at the same version `ds-ngr` uses.
- Never use system icons, emoji, or any other icon library.
- Never leave placeholder icons in component slots.

### CalendarView
- Always use `CalendarView` for month, week, day, and list calendar UIs when it covers the use case.
- Never build a custom calendar grid when `CalendarView` applies.
- Never set `CalendarEvent.color` to dataviz, warning, error, or accent tokens as the only event styling — those map to FullCalendar fill and border, not readable event text.
- Always keep event title and time on primary text over a neutral event surface; never use selected-state or accent text tokens for event labels.
- When using `CalendarEvent.color`, either pair the fill with a contrasting `textColor` in the event mapping or use `color` only for subtle indicators (e.g. border), not full chips without a text pairing.
- Never add local CSS overrides on FullCalendar event classes to fix legibility — event contrast is owned by `CalendarView` and its event color API.

### Dark mode
- Dark mode is controlled by `data-theme="dark"` on the root element. With no `data-theme` (or `data-theme="light"`), every token — including the chart palette — resolves to light.
- Never use `@media (prefers-color-scheme: dark)` for dark mode.

---

## AppShell — mandatory root layout

`AppShell` is the only permitted root layout wrapper. Every page must be inside it.

```tsx
import { AppShell, Navbar, Sidebar, SidebarMenuSelector, Button, SearchBar } from 'ds-ngr';
// Icons from lucide-react — listed in package.json at the same version ds-ngr uses
import { LayoutDashboard, FolderKanban, CheckSquare, Users, FileText, Settings } from 'lucide-react';

// Always wrap AppShell in a full-height div — never add height to AppShell itself
<div style={{ height: '100vh', display: 'flex' }}>
  <AppShell
    header={
      <Navbar
        variant="title"
        title="Dashboard"
        rightActions={<Button variant="primary" size="md">New project</Button>}
      />
    }
    sidebar={
      <Sidebar
        selectorProps={{
          label: 'WorkScope',
          avatarProps: {
            size: 'xs',
            variant: 'organization',
            fill: 'initials',
            initials: 'WS',
            name: 'WorkScope',
          },
        }}
        showSearch
        searchSlot={<SearchBar placeholder="Search" aria-label="Search" />}
        sections={[
          {
            id: 'main',
            items: [
              { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} />, selected: true, onClick: () => {} },
              { id: 'projects', label: 'Projects', icon: <FolderKanban size={16} />, onClick: () => {} },
              { id: 'tasks', label: 'Tasks', icon: <CheckSquare size={16} />, onClick: () => {} },
              { id: 'people', label: 'People', icon: <Users size={16} />, onClick: () => {} },
              { id: 'notes', label: 'Notes', icon: <FileText size={16} />, onClick: () => {} },
            ],
          },
        ]}
        bottomContent={
          <>
            <SidebarMenuSelector
              variant="full"
              label="Settings"
              showIcon
              icon={<Settings size={16} />}
              onClick={() => {}}
            />
            <SidebarMenuSelector
              variant="full"
              label="User Name"
              showAvatar
              avatarProps={{ size: 'xs', fill: 'initials', initials: 'UN', name: 'User Name' }}
              onClick={() => {}}
            />
          </>
        }
      />
    }
  >
    {/* Page content goes directly here — no wrapper div needed */}
    {/* AppShell main area already applies padding: 16px (var(--space-md)) */}
    <SectionHeader title="Dashboard" size="large" />
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', width: '100%' }}>
      {/* sections here */}
    </div>
  </AppShell>
</div>
```

### AppShell props
- `header` — `<Navbar />` only. Always set `variant` explicitly.
- `sidebar` — `<Sidebar />` only. Never pass `collapsed` manually — AppShell injects it automatically.
- `children` — main page content. Place directly inside AppShell — no extra wrapper. AppShell's main area already has `padding: var(--space-md)` built in.
- `bodyHeader` — optional. Full-width sticky UI that must stay flush under the navbar (it does not scroll with content).
- `rightPanel` — optional, omit if not needed. Persistent secondary column only — transient detail content goes in a `Drawer`.
- `footer` — optional, omit if not needed.
- Mobile navigation: keep `AppShell` without `sidebar`, add a menu `Button` in Navbar `leftActions`, and render the `Sidebar` inside a left `Drawer`.

### SidebarMenuSelector variant
AppShell controls the collapsed state and passes it to Sidebar automatically. Mirror it in `bottomContent`. Pass `icon` (or `showAvatar`) on every row — nothing renders in the icon slot without one, so the collapsed `icon` variant would be empty:

```tsx
// collapsed is injected by AppShell — use it to switch variant
<SidebarMenuSelector variant={collapsed ? 'icon' : 'full'} label="Settings" ... />
<SidebarMenuSelector variant={collapsed ? 'icon' : 'full'} label="User Name" ... />
```

### Navbar props
- `variant` — always set explicitly: `'title'` for top-level pages | `'breadcrumbs'` for detail views
- `title` — page title, sentence case
- `rightActions` — primary CTA, rightmost. Never inside a Card. Never floating.
- `leftActions` — secondary actions on the left, omit if not needed
- `onBackClick` — set with `variant="breadcrumbs"`; handles the back button shown when the trail collapses to back-only on narrow viewports

### Sidebar props
- `sections` — required. Only include sections explicitly specified. Never invent extra items.
- Section recipes, in this order: **Primary** (no title, icon rows) → **Pinned** (title + disclosure + ghost `+` trailingAction) → **Groups** (teams/spaces, avatar rows) → **Recent** (app-generated). Use only the ones the app has. Full table: `Sidebar.spec.md` → Section recipes.
- `selectorProps` — workspace selector at the top. Always set `label` and `avatarProps`.
- `showSearch` / `searchSlot` — pass `<SearchBar />` when search is needed.
- `bottomContent` — Settings and User Name, pinned to bottom. Always include both.
- Never pass `collapsed` — AppShell controls it.

### SidebarMenuItem shape
```ts
{
  id: string;
  label: string;           // sentence case always
  icon?: React.ReactNode;  // lucide-react icon at size={16}
  selected?: boolean;      // true for the active page — keep parent item selected on both list and detail routes
  onClick?: () => void;
  showBadge?: boolean;
  badgeCount?: number;
  badgeVariant?: BadgeVariant;
  showAvatar?: boolean;
  avatarProps?: AvatarProps;
  buttonRef?: React.Ref<HTMLButtonElement>;            // popup triggers only — anchor for e.g. NotificationCenter
  'aria-haspopup'?: 'dialog' | 'menu' | 'listbox';     // set when the item opens a panel instead of navigating
  'aria-expanded'?: boolean;
  'aria-controls'?: string;
}
```

### AppShell requires a full-height wrapper and global reset

`AppShell` uses `height: 100%` internally. For scroll isolation to work (sidebar and navbar stay fixed, only main content scrolls), the height chain must be unbroken from `html` down to `AppShell`.

Import `ds-ngr/global.css` for `html, body { height: 100% }` and the universal box-sizing reset. You must also ensure `#root` and any wrapper `<div>` around `<AppShell>` have `height: 100%`.

✅ Do:
```css
/* In your app's global CSS */
#root {
  height: 100%;
}
```
```tsx
// Wrapper div must fill the viewport — same contract as hard rules above
<div style={{ height: '100vh', display: 'flex' }}>
  <AppShell sidebar={<Sidebar />} header={<Navbar />}>
    {children}
  </AppShell>
</div>
```

❌ Don't:
```tsx
// Missing height on wrapper — sidebar and navbar will scroll with the page
<div>
  <AppShell sidebar={<Sidebar />} header={<Navbar />}>
    {children}
  </AppShell>
</div>
```

**Why this matters:** Without the full height chain, `overflow: hidden` on `.dsn-app-shell` has nothing to clip against. The entire page becomes the scroll container instead of just the main content area.

---

## Token system rules

### Micro typography for dense metadata
Always use micro typography tokens for dense metadata, timestamps, and timeline-style secondary copy:
- `font-size: var(--font-size-micro)`
- `line-height: var(--font-line-height-micro)`
- `font-weight: var(--font-weight-regular)` or `var(--font-weight-medium)` as hierarchy requires

Never use `--font-size-label` or hardcoded pixel `font-size` values for that role.

### Never write a token you have not seen

A name that fits the grammar is not proof that it exists. Only `tokens.css` (or `ds-index.json`) is. If the token you need isn't there, stop and ask; say: "This token follows the grammar, but I cannot verify that it exists." Every word in a token name comes from the closed lists in `Design Tokens/vocabulary.json`.

### Three layers — apps use only the middle one
```
Layer 1: Primitive   --primitive-neutral-900               ❌ never in app code
Layer 2: Semantic    --color-foreground-neutral-primary    ✅ app code
Layer 3: Component   --button-background-primary-default   ❌ library-internal; use the component instead
```
- Use semantic tokens in all app code: `var(--color-foreground-neutral-primary)` ✅ — `var(--primitive-neutral-900)` ❌
- Never use a component token (`--button-*`, `--tag-*`, `--popover-*`, `--sidebar-*` …) in app code. To get a button, render `<Button>`; for your own surface, use the semantic token (`--shape-radius-lg`, not `--card-radius`).
- Never hardcode hex codes, pixel values, or rgba.

### How a semantic name is built

`<tier>-<aspect>-<role or step>[-<prominence>][-<state>]`, e.g. `--color-background-interactive-primary-hover`, `--space-md`.

- **Color roles:** `neutral` `inverse` `interactive` `accent` `success` `error` `warning` `overlay` `elevated` `transparent` `fixed-dark` `fixed-light` `dataviz`
- **Prominence:** ranks `primary` `secondary` `tertiary` (neutral, inverse, fixed-*), intensity `soft` `strong` (accent, success, error, warning, overlay), `primary` `secondary` `destructive` (interactive)
- **States, always last:** `default` `hover` `active` `focus` `disabled` `selected`
- **One ladder for every ordered scale:** `none 3xs 2xs xs sm md lg xl 2xl 3xl full`. Never `small`, `standard`, `large`, `xxl`. A step can be missing (`--font-size-body-lg` doesn't exist), so check the inventory.
- **Banned words:** `pressed` (use `active`), `danger` (use `error` / `destructive`), `inverted` (use `inverse`), `palette` (use `primitive`), `standard` (use `md`), `cta`, `bg`, `text`.

### Eight token tiers

Every semantic token belongs to exactly one tier. The tier is the first segment of the name, the aspect (when the tier has aspects) is the second.

| # | Tier | Aspects it owns | Covers |
|---|---|---|---|
| 1 | `color` | `background`, `foreground`, `border`, `shadow` | Every semantic color, including scrims (`--color-background-overlay-*`) and raw shadow colors |
| 2 | `font` | `family`, `size`, `weight`, `line-height`, `letter-spacing` | Typography |
| 3 | `space` | none — just the ladder | Padding, margin, and gap |
| 4 | `size` | `control`, `container`, `border` (width), `breakpoint` | Control heights, container max-widths, border widths, breakpoints |
| 5 | `shape` | `radius` | Corner geometry |
| 6 | `effect` | `shadow`, `blur`, `border` (style), `opacity` | Composite and visual effects that aren't a plain color or dimension |
| 7 | `motion` | `duration`, `ease`, `transition` (composite) | Timing |
| 8 | `z-index` | none — roles directly (`sticky` … `toast`) | Stacking order |

Rules:
- **Pick the tier by what the value is, not where it's used.** A shadow *color* is `--color-shadow-*`; a composite `box-shadow` is `--effect-shadow-*`; a border *width* is `--size-border-*`; a border *color* is `--color-border-*`.
- **`space` has no component tokens.** Use the ladder directly (`padding: var(--space-xs) var(--space-sm)`). Never create `--space-button-*`, `--size-inset-*`, `--page-margin-*` or similar.
- Old token names map to new ones in `scripts/token-grammar-map.mjs`. Migrate an app with `node scripts/codemod-token-rename.mjs --map=grammar --root=<app>`.

> **Reserved — corner-shape (documentation only):** `shape` is reserved to eventually hold a corner-shape-driven categorical token (round/bevel/scoop/notch/squircle/superellipse), once the CSS `corner-shape` property has broader browser support than Chromium-only. Do not create any `--shape-corner-*` token now — there is no Figma variable for this yet.

### Token families and their CSS properties

| Token family | CSS property |
|---|---|
| `--color-foreground-*` | `color` |
| `--color-background-*` | `background-color` |
| `--color-border-*` | `border-color`, `outline-color` |
| `--color-shadow-*` | colors inside `box-shadow` |
| `--color-{background|border|foreground}-dataviz-*` | all chart/graph colors — never use semantic tokens or hex for dataviz |
| `--font-size-*`, `--font-weight-*`, `--font-line-height-*`, `--font-letter-spacing-*` | typography |
| `--space-*` | `padding`, `margin`, `gap` — one scale for all three |
| `--space-md` | `padding-inline` on page content wrappers |
| `--size-<step>`, `--size-control-height-*`, `--size-container-*` | fixed element `width`/`height` (ladder 2xs 8 → 2xl 128px), control `height`, container `max-width`; `--size-border-*` → `border-width` |
| `--shape-radius-*` | `border-radius` |
| `--effect-shadow-*` | composite `box-shadow` |
| `--motion-transition-*` | `transition` |
| `--z-index-*` | `z-index` |

✅ `gap: var(--space-md)` between cards
✅ `padding: var(--space-md)` inside a card's content wrapper
❌ `padding: 16px` — hardcoded; and there is no inset scale (`--size-inset-*` / `--inset-*` are retired)

**Space scale — Source: Figma size collection → space/***

| Token | Value |
|---|---|
| --space-none | 0px |
| --space-3xs | 2px |
| --space-2xs | 4px |
| --space-xs | 8px |
| --space-sm | 12px |
| --space-md | 16px |
| --space-lg | 24px |
| --space-xl | 32px |
| --space-2xl | 48px |
| --space-3xl | 64px |

**Shape tokens (radius) — tier: `shape` · Figma source: size collection → shape/radius/***

| Token | Value | Use |
|---|---|---|
| --shape-radius-none | 0px | Sharp corners |
| --shape-radius-2xs | 4px | Tooltips |
| --shape-radius-xs | 8px | Organization avatars, small tiles |
| --shape-radius-sm | 12px | Inputs, chips |
| --shape-radius-md | 16px | Buttons, tags, controls |
| --shape-radius-lg | 24px | Cards |
| --shape-radius-xl | 32px | Modals |
| --shape-radius-full | 9999px | Pills, avatars |

**Z-index tokens — tier: `z-index` · Figma source: size collection → z-index/***

| Token | Value |
|---|---|
| --z-index-sticky | 1020 |
| --z-index-fixed | 1030 |
| --z-index-modal-backdrop | 1040 |
| --z-index-modal | 1050 |
| --z-index-popover | 1060 |
| --z-index-tooltip | 1070 |
| --z-index-toast | 1080 |

**Breakpoint tokens — tier: `size` · Figma source: size collection → size/breakpoint/***
NOTE: These must always be raw px values. Never use var() for breakpoints —
CSS custom properties do not resolve inside @media queries.

| Token | Value |
|---|---|
| --size-breakpoint-sm | 480px |
| --size-breakpoint-md | 768px |
| --size-breakpoint-lg | 1280px |
| --size-breakpoint-xl | 1440px |

**Motion tokens — tier: `motion` · Figma source: motion collection**

`--motion-duration-{instant|fast|normal|slow}` = 0 / 150 / 250 / 400ms, `--motion-ease-smooth` = ease. The transition composites combine them:

| Token | Value | Use |
|---|---|---|
| --motion-transition-instant | 0ms ease | No animation |
| --motion-transition-fast | 150ms ease | Hover, focus, popovers, toggles |
| --motion-transition-normal | 250ms ease | Drawers, expand and collapse |
| --motion-transition-slow | 400ms ease | Large or full-screen movement |
| --popover-transition | 150ms ease | Popovers |
| --switcher-transition | 150ms ease | Toggle switches |
| --drawer-transition | 250ms ease | Drawers |
| --modal-transition | 0ms ease | Modals |

**Grid tokens — Source: Figma size collection → size/grid/***

| Token | Value |
|---|---|

Grid gutter and margin use `--space-md` (16px) — there are no grid spacing tokens.

### Typography — never override
```tsx
// CORRECT
<div style={{
  fontSize: 'var(--font-size-body-md)',
  fontWeight: 'var(--font-weight-semibold)',
  color: 'var(--color-foreground-neutral-primary)',
}}>

// WRONG — every one of these
<h2 style={{ fontFamily: 'Georgia, serif' }}>        // never set font-family
<p style={{ fontSize: '18px', fontWeight: 700 }}>    // never raw px
<div style={{ fontFamily: 'Inter, sans-serif' }}>    // never set font-family
```

### Known stale token patterns — hallucination risk

These are known areas where AI agents generate incorrect token references. Treat each as a high-attention zone.

- **`text` / `surface` as color categories** — retired in the 8-tier migration. `--color-text-*` is now `--color-foreground-*` and `--color-surface-*` is `--color-background-*`. Any reference to the old categories is stale; look up the replacement in `scripts/token-tier-map.mjs`.
- **Raw hex in semantic tokens** — if a semantic token resolves to a raw hex value without an alias, do not assume the value is correct. Flag as potentially unsynced and use the equivalent primitive alias if derivable from context.
- **Broken alias chains** — a chain is broken when any tier holds a raw value instead of a pointer to the next tier. Broken chains mean the token is not responding to theme switching and will produce incorrect output in dark mode.

## Token invention rule

NEVER create CSS custom properties that do not correspond to a Figma
variable, and never use a word that isn't in `Design Tokens/vocabulary.json` (tiers: color, font, space,
size, shape, effect, motion, z-index).

If a token does not exist in Figma, do not create it — not even as a
convenience alias or layout helper. If a token is needed, ask the user
to create it in Figma first, then mirror it in tokens.css.

### Known fabricated token patterns to reject:

The following were invented by AI agents and removed. Never recreate them:

- layout/page-margin-x · layout/section-spacing-* · layout/card-padding
  → These don't exist in Figma. Use the --space-* scale directly.
- space/comfortable · space/generous · space/ample (old names)
  → Old invented names. Use --space-lg, --space-xl, --space-2xl.
- inset/xlarge
  → There is no inset scale. Use --space-xl.
- radius/medium (6px) · radius/large (8px)
  → Were wrong values. Correct scale is --shape-radius-sm=12px, --shape-radius-md=16px.
- Any first word that isn't a tier, `primitive` or a listed component (--size-space-*, --size-inset-*, --size-radius-*, --color-palette-*, --scale-*, --box-shadow-*, --effects-*, --color-text-*, --color-surface-*, --border-width-*, --dimensions-*, --breakpoint-*, --page-margin-x, --table-cell-*, --gap-*, --nav-*, --control-*)
  → Retired. Look up the replacement in scripts/token-grammar-map.mjs (or scripts/token-tier-map.mjs for older names).
- font-size/display-s at 1.125rem
  → Wrong value. Correct is 1.5rem (24px per Figma).
- --space-comfortable (24px)
  → Old invented name. Use --space-lg (24px).
- var() inside @media queries using breakpoint tokens
  → CSS custom properties don't resolve in @media. Always use raw px.

---

## Tag semantic mapping — critical

Always match Tag `variant` to the semantic meaning of the value. Never use the same variant for all tags in a list.

| Value meaning | Tag variant |
|---|---|
| Done, active, on track, success, approved, complete | `success` |
| At risk, pending, in review, in progress, waiting | `warning` |
| Behind, blocked, failed, rejected, overdue, error | `error` |
| Draft, inactive, unknown, archived, neutral | `neutral` |
| Notable but not urgent — featured, active selection, primary category callout | `highlight` |

```tsx
// WRONG — same variant for every tag
<Tag variant="warning" label="In progress" />
<Tag variant="warning" label="Completed" />    // completed = success
<Tag variant="warning" label="Not started" />  // not started = neutral

// CORRECT — variant matches meaning
<Tag variant="warning" label="In progress" />
<Tag variant="success" label="Completed" />
<Tag variant="neutral" label="Not started" />
<Tag variant="error" label="Blocked" />
```

Tags are non-interactive. Never make a Tag clickable. Tag text goes in the required `label` prop — Tag does not render children, so `<Tag>Completed</Tag>` renders an empty tag.

### Kanban column chrome — tag surface tokens

When status-grouped kanban boards exist in the product, always tint column chrome using the tag semantic surface tokens that match each column's status — never a flat neutral column background.

- Always map each column status to a tag variant via a `data-status` attribute on the column container.
- Always apply the matching tag variant's background, border, and title text tokens to column chrome.
- When introducing a new board column status, always define the full tag-token mapping for column background, border, and title color alongside the status label — do not assume existing status CSS covers new values.

| Column status meaning | Tag variant | Surface token | Border token | Title text token |
|---|---|---|---|---|
| Done, active, on track, approved, complete | `success` | `--tag-background-success` | `--tag-border-success` | `--tag-foreground-success` |
| At risk, pending, in review, in progress, waiting | `warning` | `--tag-background-warning` | `--tag-border-warning` | `--tag-foreground-warning` |
| Behind, blocked, failed, rejected, overdue | `error` | `--tag-background-error` | `--tag-border-error` | `--tag-foreground-error` |
| Draft, inactive, unknown, archived | `neutral` | `--tag-background-neutral` | `--tag-border-neutral` | `--tag-foreground-neutral` |
| Notable but not urgent — featured, primary category | `highlight` | `--tag-background-progress` | `--tag-border-progress` | `--tag-foreground-progress` |

Never show a status `Tag` on a kanban card when tasks are grouped into status columns — the column conveys status; show secondary metadata such as priority, assignee, and dates on the card instead.

See `specs/patterns/kanban-board.md` for full board assembly.

---

## KPI / stat card pattern

Dashboard summary cards must always use this pattern. Never invent custom layouts with raw HTML or custom typography.

```tsx
<Card title="Active projects" showBottomBar={false}>
  <div style={{
      fontSize: 'var(--font-size-display-sm)',
      fontWeight: 'var(--font-weight-semibold)',
      color: 'var(--color-foreground-neutral-primary)',
    }}>
      14
    </div>
    {/* Optional trend line */}
    <div style={{
      fontSize: 'var(--font-size-body-sm)',
      color: 'var(--color-foreground-success-strong)',  // or --color-foreground-error-strong for negative
      marginTop: 'var(--space-2xs)',
    }}>
      +2 this week
    </div>
</Card>
```

Rules:
- Always use `<Card>` as the container — never a raw div with manual border/shadow.
- Always set `showHeader` and `title` when the card has a content area; use `showBottomBar={false}` when there is no footer.
- Always use `var(--font-size-*)` tokens — never raw px values.
- Always use `var(--color-foreground-*)` tokens — never hardcode colors.
- Never set `font-family` — it is inherited.

---

## Card structure

`Card` has three areas: optional header (`SectionHeader`), content area (`children`), optional bottom bar (`Toolbar`). See `src/components/organisms/Card/Card.spec.md` for full spec.

```tsx
// CORRECT
<Card title="Team members" showBottomBar={false}>
  {/* body — .dsn-card-content applies inset from data-has-header */}
</Card>

// WRONG — body-only card
<Card showHeader={false} showBottomBar={false}>{/* content */}</Card>

// WRONG — spacing on chrome
<Card style={{ padding: 'var(--space-md)' }}>            // never on Card itself
<SectionHeader style={{ padding: 'var(--space-xs)' }} /> // never — pre-built
<Toolbar style={{ padding: 'var(--space-xs)' }} />       // never — pre-built
```

- Never use a card with body content only and no header — always set `showHeader` and `title` when the card has a content area.
- Always set `showBottomBar={false}` when there is no footer.
- `.dsn-card-content` padding and layout for body children depend on `data-has-header` and `data-has-bottom-bar` — do not add a default extra padded wrapper unless you need inner layout (e.g. a tag row).
- When multiple tags appear in the body, use one flex row with `flex-wrap` and a small gap — never separate block children that inherit a large column gap from the card body stack.
- Header and bottom bar are pre-built — never add padding, margin, or gap to them.
- `DataTable` is never wrapped in a `Card` — always full-width.

---

## Kanban board pattern

Read `specs/patterns/kanban-board.md` before building any status-grouped board.

### Board cards
- Never hand-build kanban card layouts with plain divs when `Card` supports header, body, and footer slots — always use `Card` for board cards.
- Always put task title and description in the card header (`title`, `description` props).
- Always put metadata tags (priority, type — not status) in the card body.
- Always put assignee and date in the card footer via `showBottomBar` and bottom bar action slots.

### Board shell and columns
- Always reuse the same kanban board shell and card pattern across top-level and detail views for an entity type — clone the existing pattern instead of creating a parallel layout with different class names or structure.
- Always include a compact `EmptyState` (`size="small"`, `hasIcon={false}`) inside empty kanban columns so columns with no items still communicate purpose and next action.
- A `Toolbar` placed on top of a list or section is always `variant="filter-bar"` — it has no elevation shadow. `variant="default"` (upward shadow) is only for bottom bars, which come from the organism's `bottomBar*` props.
- A filter bar looks like a bottom bar — same background, padding and compact single row, minus the upward shadow. Its `SearchBar` is always `variant="ghost"` with `aria-label` — never a labeled field with a helper row (`Toolbar` forces ghost).
- Always use `Toolbar variant="filter-bar"` for filtered board views — view switcher and `SearchBar` on the left, filter controls on the right; match the slot structure of sibling list pages in the same feature area.

---

## Navigation & page structure rules

### NAV-01: AppShell is mandatory
Every page MUST use `AppShell` as its root layout.
✅ `<AppShell header={...} sidebar={...}>...</AppShell>`
❌ `<div style={{ display: 'flex' }}>...</div>`

### NAV-02: Sidebar structure — top to bottom, never deviate
1. Workspace switcher
2. Main navigation items
3. User profile + Settings

### NAV-03 / NAV-04: Back arrows
- **Top-level pages** (Dashboard, Projects, Tasks, People, Notes): NEVER show back arrow.
- **Detail views** (a record or child page): ONLY then show back arrow via `variant="breadcrumbs"`.

### NAV-05: Navbar title — two modes
- **Top-level page**: `variant="title"` with page name. No breadcrumbs.
- **Detail view**: `variant="breadcrumbs"` (renders `Breadcrumbs size="lg"`). The breadcrumb IS the title — never show both.

### NAV-05a: AppShell list and detail navigation
Always implement list-to-detail navigation at the app shell level — never swap list and detail views inside the list page component.

- **List page**: `Navbar variant="title"`. Selection state lives in the app shell.
- **Detail page**: `Navbar variant="breadcrumbs"`. The detail component receives the selected entity as a prop from shell state.
- Never implement list-to-detail navigation by conditionally rendering a detail view inside the list page component.
- Never document or implement in-page back navigation (e.g. an "All projects" link) as the primary pattern — back navigation belongs in the navbar breadcrumb and back control only.
- Never add a separate title navbar on detail views when breadcrumb navigation is present.

```tsx
// ✅ CORRECT — shell owns selection and switches views
function App() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  return (
    <AppShell
      header={
        selectedProject ? (
          <Navbar
            variant="breadcrumbs"
            breadcrumbItems={[
              { id: 'projects', label: 'Projects', onClick: () => setSelectedProject(null) },
              { id: 'current', label: selectedProject.name, variant: 'current' },
            ]}
          />
        ) : (
          <Navbar variant="title" title="Projects" rightActions={...} />
        )
      }
      sidebar={<Sidebar sections={sectionsWithProjectsSelected />} />
    >
      {selectedProject ? (
        <ProjectDetail project={selectedProject} />
      ) : (
        <ProjectsList onSelectProject={setSelectedProject} />
      )}
    </AppShell>
  );
}

// ❌ WRONG — detail view swapped inside the list page
function ProjectsPage() {
  const [selected, setSelected] = useState(null);
  if (selected) return <ProjectDetail project={selected} onBack={() => setSelected(null)} />;
  return <ProjectsList onSelect={setSelected} />;
}
```

### NAV-05b: Detail view back navigation
- Always use `Navbar variant="breadcrumbs"` for detail views inside `AppShell`.
- Never add an in-page back button (e.g. "All projects") on a detail view when breadcrumb navigation is available in the navbar.
- Back navigation belongs in the navbar breadcrumb trail and back control only.

### NAV-05c: Detail view section headers
- Never repeat the entity name in a `SectionHeader` title on a detail page when that name already appears as the current breadcrumb item.
- Use the page body for metadata, filters, and content — not a duplicate page title.

### NAV-05d: Sidebar selection on list and detail routes
- Always keep the parent sidebar item selected on both list and detail routes (e.g. "Projects" selected for both the projects list and a single project detail view).
- Never deselect the parent nav item when navigating from list to detail.

### NAV-06: Breadcrumb sizes
One component, `Breadcrumbs`, with a `size` prop:

| Size | Where |
|---|---|
| `size="lg"` | Navbar only — replaces page title on detail views |
| `size="sm"` (default) | Inside page content — sub-section hierarchy only |

Never use small breadcrumbs for main navigation. Never use large breadcrumbs inside content.

### NAV-07: Breadcrumb format
`[Parent] > [Current page]` — start from immediate parent, not root/Home.
Current page (rightmost): non-interactive, bold. Never truncate it.

✅ "Projects > Q4 Campaign"
❌ "Home > Projects > Q4 Campaign" (unnecessary root)

### NAV-08: Primary CTA placement
Primary CTA always in Navbar `rightActions`. Never inside a Card. Never floating. Never `position: fixed/absolute`.

✅ Navbar: "Projects" + [New project — Primary]
❌ Floating `+` button positioned absolutely

### NAV-09: CTA hierarchy in Navbar
Right-to-left: Ghost → Secondary → **Primary** (Primary always rightmost).
Maximum one Primary button per view.

### NAV-11: Section headers — spatial contract
Use `SectionHeader` to divide content sections. Never use raw `<h2>` or `<h3>`.

**`SectionHeader` is edge-to-edge. It owns its own internal padding by default.**
It renders `width: 100%` and applies horizontal inset internally per size.
Never place it inside a padded wrapper. It must be a direct child of the page flow or Card.
- Always render `SectionHeader` as the `Card` header when the header is visually part of a card block, including sticky section headers, and never apply layout overrides that break Card-owned alignment.
- Set `flush` when body content below has no horizontal padding and the title must align with it — e.g. full-bleed lists, tables, or accordion-style rows inside a `page-section` wrapper. Default (no `flush`) is correct for direct AppShell main-content sections and Card headers.
Never add `padding`, `margin`, `width`, or `minWidth` to its parent container.

```tsx
// ✅ CORRECT — direct child, no wrapper
<SectionHeader title="Overview" size="large" />

// ✅ CORRECT — flush header above full-bleed body inside page-section
<div className="page-section" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', width: '100%' }}>
  <SectionHeader title="Activity" size="medium" flush />
  {/* list or table with no horizontal padding */}
</div>

// ❌ WRONG — padded wrapper causes horizontal overflow
<div style={{ paddingInline: 'var(--space-md)' }}>
  <SectionHeader title="Overview" size="large" />
</div>

// ❌ WRONG — fixed width on parent causes horizontal overflow
<div style={{ minWidth: '800px' }}>
  <SectionHeader title="Overview" size="large" />
</div>
```

Section headers do NOT need to be inside a Card.

### NAV-12: Casing
ALL page titles, Navbar titles, breadcrumbs, section headers, button labels: sentence case. Never title case.
✅ "New project" ✅ "Save changes" ❌ "New Project" ❌ "Save Changes"

### NAV-13: Cards vs sections
Not every content group needs a Card. Use `SectionHeader` + flat content for continuous page flow.
Use Card only for distinct, self-contained units (form block, summary panel).
❌ Wrapping every section in a Card by default.

### NAV-14: Page sections in main content
Never use a `Card` header (`showHeader` + `title`) as a page section title for lists or detail blocks that sit in main content.
Always introduce those sections with `SectionHeader` inside a `page-section` wrapper — a full-width layout block with vertical rhythm between the header and body (use `--space-*` tokens on the wrapper, not on the header itself).
Use `size="large"` for top-level page sections and `size="medium"` for subsection titles within a page.

```tsx
// ✅ CORRECT — page section in main content
<div className="page-section" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', width: '100%' }}>
  <SectionHeader title="Activity" size="medium" />
  {/* list or detail content */}
</div>

// ❌ WRONG — card chrome for a main-content section title
<Card title="Activity" showBottomBar={false}>
  {/* list */}
</Card>
```

---

## Layout & component behavior rules

### LCB-01: Scroll
Sidebar and Navbar are always fixed. Only main content area scrolls.
Never apply scroll to the full page or AppShell root.

### LCB-02: Dataviz colors
All charts and graphs must use `--color-{background|border|foreground}-dataviz-*` tokens for all colors.
✅ `fill: var(--color-background-dataviz-1)`
❌ `fill: #0F766E`
❌ `fill: var(--color-background-accent-strong-default)`

**Charts black-render prevention:** consuming apps must `import 'ds-ngr/tokens.css'` before rendering any chart from `ds-ngr`. Unresolved `var(--color-{background|border|foreground}-dataviz-*)` in SVG falls back to black. This is not a theme-provider issue — token CSS must be present.

### LCB-02a: ChartCard on dashboards
Wrap charts in `ChartCard` on dashboard surfaces (title, description, optional footer). Bare chart primitives are allowed in layout slots that already provide context (e.g. drawer bodies). The DataTable-never-in-Card rule does **not** apply to charts.

### LCB-03: AppShell padding — built-in, do not duplicate
AppShell's main area already applies `padding: var(--space-md)` (16px) on all sides.
Never add an extra padding wrapper around page content inside AppShell.

```tsx
// ✅ CORRECT — content directly inside AppShell children
<AppShell ...>
  <SectionHeader title="Dashboard" size="large" />
  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', width: '100%' }}>
    {/* sections */}
  </div>
</AppShell>

// ❌ WRONG — double padding causes SectionHeader to overflow
<AppShell ...>
  <div style={{ paddingInline: 'var(--space-md)', paddingBlock: 'var(--space-md)' }}>
    <SectionHeader title="Dashboard" size="large" />
  </div>
</AppShell>

// ❌ WRONG — never add spacing directly on DS components
<Navbar style={{ paddingInline: 'var(--space-md)' }} />
```

### LCB-04: Preventing horizontal overflow
Every page-level container must follow these rules or the page will scroll horizontally:
- All direct children of AppShell use `width: 100%` — never fixed pixel widths
- Grid and flex containers never use `minWidth` in `px` — use `width: 100%` or `1fr` / `flex: 1`
- `SectionHeader` parent must never have `padding`, `minWidth`, or fixed `width`

```tsx
// ✅ CORRECT — fluid grid, no overflow
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-md)', width: '100%' }}>

// ❌ WRONG — fixed minWidth causes horizontal scroll
<div style={{ display: 'grid', minWidth: '900px' }}>
```

### LCB-05: Icons
Only `lucide-react`, listed at the same version `ds-ngr` uses.
Applies everywhere: tables, buttons, inputs, menus, empty states.

### LCB-06: List items
Always stretch to full container width (`width: 100%`). Never let items float at arbitrary width.

### LCB-06d: DataListCell stacks in drawers
Always open read-only entity detail in a `Drawer` using `DataListCell` rows with icon, title, and value. Wire selection from table rows, board cards, and chart or timeline interactions to the same drawer — never build parallel detail panels per surface.

`.dsn-drawer-content` is full-bleed; each `DataListCell` picks up the same `--space-md` horizontal inset as the header and bottom bar. Stack cells directly in drawer content — no negative-margin wrapper — and prefer `alignment="inline"` so values share one column.

```tsx
<Drawer title="Task details" showBottomBar={false}>
  <DataListCell alignment="inline" title="Status" description="In progress" showActions={false} />
  <DataListCell alignment="inline" title="Assignee" description="Alex Chen" showActions={false} />
</Drawer>

// ❌ WRONG — capped list inside drawer content
<div style={{ maxWidth: 'someFixedValue' }}>
  <DataListCell ... />
</div>
```

- Never cap `DataListCell` stacks with an arbitrary `max-width` inside drawer content — cells must use the full available panel width.

### LCB-06c: Board and empty-state layouts — use the design system
Never reimplement board columns, Kanban empty columns, or empty-state chrome with parallel custom wrappers when `Card`, `EmptyState`, and documented layout utilities already define the pattern.
- Never hand-build kanban card layouts with plain divs — always use `Card` header, body, and footer slots for board cards.
- Always reuse the same kanban board shell and card pattern across top-level and detail views for an entity type.
- Always include a compact `EmptyState` inside empty kanban columns.
- Prefer `EmptyState` props (`size`, `hasIcon`, action slots) and `Card` props (`showHeader`, `title`, `showBottomBar`) over bespoke flex stacks that duplicate padding and button variants.
- In flex column parents (board columns, card bodies), set `min-width: 0` on the column and `min-width: 0` plus `max-width: 100%` on the `EmptyState` root so content does not overflow narrow columns.
- See `specs/patterns/kanban-board.md` for column chrome, card slot structure, and filter bar placement.

### LCB-06b: DataTable multi-selection — BulkActionBar
```tsx
<div style={{ position: 'relative' }}>
  <DataTable ... />
  {selectedCount > 0 && (
    <div style={{
      position: 'absolute',
      bottom: 'var(--space-md)',
      left: '50%',
      transform: 'translateX(-50%)',
    }}>
      <BulkActionBar
        selectedCount={selectedCount}
        actions={actions}
        onDismiss={handleClearSelection}
      />
    </div>
  )}
</div>
```
- `BulkActionBar` only accepts `className` — positioning goes on the wrapper div.
- Only render when `selectedCount > 0`.
- Action labels must be count-aware: `"Delete 3"` not `"Delete"`.
- `onDismiss` must clear the entire selection.

### LCB-07: Placeholder content
Never leave placeholder values in component slots. Replace with real content or hide the slot.
- Icon slots → meaningful Lucide icon or hidden
- Help text → real guidance or hidden
- Hint icons → real tooltip content or hidden

### LCB-08: Required fields
Every field is mandatory by default. Input components cannot render a required marker — there is no asterisk and no prop that produces one.
Mark optional fields only with the `optional` prop on the input itself. The component renders `(optional)` in `var(--color-foreground-neutral-tertiary)`; consumers cannot restyle or reword it.

```tsx
// ✅ CORRECT
<TextInput label="Team" optional value={team} onChange={…} />

// ❌ WRONG — manual optional span
<TextInput label={<>Team <span style={{ color: 'var(--color-foreground-neutral-tertiary)' }}>Optional</span></>} … />

// ❌ WRONG — asterisk or required visual (impossible via API; do not hand-compose)
<label>Team *</label>
<TextInput … />
```

### LCB-08a: Fieldset grouping
Group semantically related fields with `Fieldset` and a `legend` inside a `Form`. Never use `SectionHeader` or `Card` title as a substitute for form grouping semantics.
Never nest `SingleChoice` or `MultiChoice` inside `Fieldset` — they render their own `<fieldset>`.

```tsx
// ✅ CORRECT
<Form onSubmit={handleSave}>
  <Fieldset legend="Address">
    <TextInput label="Street" … />
    <TextInput label="City" … />
  </Fieldset>
  <SingleChoice label="Priority" options={priorityOptions} value={priority} onValueChange={setPriority} />
</Form>

// ❌ WRONG — SectionHeader is page structure, not form grouping
<SectionHeader title="Address" size="medium" />
<TextInput label="Street" … />

// ❌ WRONG — nested fieldsets
<Fieldset legend="Preferences">
  <MultiChoice label="Channels" options={channels} onOptionChange={…} />
</Fieldset>
```

### LCB-09: Form CTA
Primary submit must be disabled until all mandatory fields have a value.
Validate all fields on submit only — not in real time (exceptions: password strength, character count, search, OTP).
Use `Form` for any submittable field group. `Form` owns vertical spacing between fields via `--space-md` — never add margin or gap on inputs inside a `Form`.

```tsx
// ✅ CORRECT
<Form onSubmit={handleSave} onValidate={validate} onValidityChange={setIsValid}>
  <TextInput label="Project name" value={name} onChange={…} />
  <Select label="Status" options={statusOptions} value={status} onChange={setStatus} />
</Form>

// ❌ WRONG — manual spacing between fields inside Form
<Form …>
  <TextInput label="Project name" style={{ marginBottom: 'var(--space-md)' }} … />
</Form>
```

### LCB-10: Form keyboard shortcut
Every primary submit button must show `⌘↵` via Button's `shortcut`, `shortcutLabel` and `shortcutAriaLabel` props — never nest `<Shortcut>` as a child (it takes `label`, not children, and Button already applies the inverted colour on primary).
`<Button variant="primary" shortcut shortcutLabel="⌘↵" shortcutAriaLabel="Command Enter">Save changes</Button>`

### LCB-11: Centered content pages
Only four page types cap and center their main content: **auth flows** (login, signup, forgot/reset password, OTP), **onboarding/setup wizards**, **standalone confirmation pages** (e.g. "check your email", invite accepted), and **settings pages** (content is not dense enough to need the full main-content width). Every other page uses the full main-content width (LCB-04) — never apply this pattern to lists, tables, or dashboards.

`AppShell` still wraps the page — Sidebar and Navbar render as normal. Only the content column is capped with `--size-container-xl` and centered with `marginInline: auto`.

`--size-container-xl` resolves to 1024px (`--primitive-size-1024`), the same width as the modal maximum.

```tsx
// ✅ CORRECT — auth/onboarding/confirmation content capped and centered, AppShell unchanged
<AppShell ...>
  <div style={{
    maxWidth: 'var(--size-container-xl)',
    marginInline: 'auto',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-lg)',
  }}>
    {/* auth form / onboarding step / confirmation content */}
  </div>
</AppShell>

// ❌ WRONG — capping a list, table, or dashboard page
<AppShell ...>
  <div style={{ maxWidth: 'var(--size-container-xl)', marginInline: 'auto' }}>
    <DataTable ... />
  </div>
</AppShell>
```

- Never apply `--size-container-xl` outside the four page types above.
- Never hardcode a pixel max-width for these flows — always use the token.

### LCB-12: Toast stacking — always above everything else
`Toast` must render above every other layer on screen, including `Modal`, `PopoverMenu`, and `Tooltip`. Always use `--z-index-toast` (1080) — one tier above `--z-index-tooltip` (1070), the previous topmost layer.

```css
/* ✅ CORRECT */
.dsn-toast {
  z-index: var(--z-index-toast);
}

/* ❌ WRONG — hardcoded value, and lower than modal/popover/tooltip */
.dsn-toast {
  z-index: 1000;
}
```

- Never hardcode a toast z-index — always `var(--z-index-toast)`.
- Never introduce a new z-index layer above `--z-index-toast` — it is the ceiling of the stacking order.

---

## Cross-component patterns

Apply these before selecting any component.

### Pattern 1 — Single select
```
Requires confirmation?
  Yes → Radio
  No → 2–3 options → SegmentControl
       4+ options  → Select (search appears automatically above 10 options)
```

- Never pass `searchable={false}` to a `Select` with more than 10 options — the search field is how users reach items below the popover's height cap.
- Use `Combobox` instead of `Select` for free-text or async option sets.

### Pattern 2 — Multi select
```
Up to 3 options → Chips (shown upfront)
4+ options in forms → Checkbox list or AutocompleteMulti for large/dynamic sets
Toolbar multi-value filters (status, assignee, etc.) → PopoverMenu rich variant with checkbox-cell sections and Confirm/Cancel — see MultiSelectAnchored pattern
```

- Always use `PopoverMenu` with checkbox-cell choice list items for multi-value toolbar filters — never model multi-select filtering as a single `Select` with an "All" sentinel empty option.
- Empty selection in a checkbox list means no filter applied — do not use a dedicated "All" option to represent unfiltered state.

### Pattern 3 — Binary (on/off)
```
Toolbar, icon-only, immediate → Toggle button (+ Tooltip)
Form, confirmed on submit     → Checkbox
Settings, labeled, immediate  → Switcher
```

### Pattern 4 — Filter bar
```
1 value   → Toggle button
2–5       → Chips in a horizontal bar
6–12      → Per-dimension filter triggers → PopoverMenu (MultiSelectAnchored pattern)
13+       → "Filters" button → drawer

Always: show active state, provide "Clear all" when any filter is active
Never: model multi-select dimensions as a single Select with an "All" empty option
```

### Pattern 5 — Pagination vs infinite scroll
```
Data tables → Pagination
Feeds       → Infinite scroll
Never mix both in the same view
```

### Pattern 6 — Loading state
```
Shape known?
  Yes → SkeletonLoading
  No  → ProgressRing

Scope:
  Full page navigation       → LoadingBar
  Full page/panel content    → SkeletonLoading or ProgressRing (xl/xxl)
  Section/card within page   → SkeletonLoading or ProgressRing (lg)
  Inline in a button         → Button `loading` prop — never mount ProgressRing inside a button
  Background task            → No indicator; Toast on completion
```

### Pattern 7 — Overlay
```
Must act before continuing?
  Yes → destructive confirmation → Alert dialog
      → other task or form      → Modal
  No  → anchored to element     → Popover or Tooltip
      → not anchored            → Toast or Drawer
```

### Pattern 8 — Empty state
```
Primary page content area → EmptyState size="default"
Card/panel/board column   → EmptyState size="small", hasIcon={false} or a compact context icon

First use        → invite to create first item
No results       → "No results for '[query]'" + Clear filters CTA
Permission error → explain restriction
Load error       → Retry CTA
```

- Always use `showMainCta` for the primary button and `showSecondaryOption` for the secondary button — never mount a separate `Button` beside `EmptyState` only to change variant.
- For secondary-only CTAs: `showMainCta={false}`, `showSecondaryOption`, `secondaryOptionLabel`, `onSecondaryOptionClick`.
- See `src/components/molecules/EmptyState/EmptyState.spec.md` for action slots, narrow columns, and board usage.

### Pattern 9 — Error
```
Single form field     → Inline validation message
Section within page   → Inline error pattern
Entire page blocked   → Error screen
```

### Pattern 10 — Success feedback
```
Routine action (save, delete) → Toast (success, auto-dismiss 4–5s)
Significant milestone         → Success screen
```

**Success screen — two types:**

| Type | Use for |
|---|---|
| **Celebration** | High-value brand moments — completing onboarding, first key action, major milestone |
| **Confirmation** | Administrative completion — form submitted, settings saved across a flow |

Rules:
- Title: 2–5 words, past tense, specific. No punctuation at end.
- Primary button: marks the endpoint. "Done" or "Close" — never "OK", "Continue" or "Next".
- Only use once, at the end of a flow. Never mid-flow.
- Tone calibration: a screen seen daily for a routine action should be clear and efficient — delight repeated daily becomes noise.

### Pattern 11 — Tabs vs SegmentControl
1. Each option has a distinct content panel? → **Tabs**
2. Switching changes how the same content is rendered? → **SegmentControl**
3. Each option could be its own sub-route? → **Tabs**
4. Display preference, not architecture? → **SegmentControl**

### Component decision table
| Situation | Component |
|---|---|
| Toggle between 2–5 mutually exclusive views | `SegmentControl` — never plain text or custom buttons |
| Each option has a distinct content panel | `Tabs` |
| User selects or filters with a toggleable option | `Chip` |
| Non-interactive status or category label | `Tag` |
| User clicks a table row to see details | `Drawer` |
| User must complete a task before continuing | `Modal` |
| Jump to a page, record or action by typing its name (site search, ⌘K palette) | `CommandDialog` — never `Combobox` (that picks a form value) |
| Numeric count on a nav icon | `Badge` |
| List needing sorting, filtering, or pagination | `DataTable` |
| Month, week, day, or list scheduling calendar | `CalendarView` — never a custom calendar grid |
| Picking a date or range in a form | `DateTimePicker` (`selectionMode="single" \| "range"`, optional `withTime`) — not `CalendarView` |
| No results or first-time empty section | `EmptyState` |
| Content loading, shape is known | `SkeletonLoading` |
| Content loading, shape is unknown | `ProgressRing` |

### Pattern 12 — Progress feedback

```
Duration/context:
  Instant to ~300ms              → No indicator (avoid flicker)
  ~300ms to ~3s, within component → ProgressRing inline or Button `loading`
  ~3s+, within page section      → SkeletonLoading (shape known) or ProgressRing (lg/xl)
  Long async, user can leave     → Progress screen
  Page navigation                → LoadingBar
```

**Progress screen** — use when the operation is long-running and the wait is a meaningful moment in the flow.

Structure:
- Illustration: conveys activity in progress — in motion, not static or broken
- Title: present tense, active. "Sending your money." No punctuation at end.
- Description: what's happening and what to expect next. Full stop at end.
- Primary button: where to go while waiting, or acknowledgement. 1–3 words.

Rules:
- Never show a progress screen for operations under ~3 seconds — use inline ProgressRing or Button `loading`
- If completion time is known, show it: "This usually takes 1–2 minutes."
- If operation completes while on the progress screen → transition automatically to Success screen
- If operation fails while on the progress screen → transition to Error screen
- Never leave the user on a progress state indefinitely

---

## Component usage rules

---

### Button

```typescript
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'plain';
type ButtonSize = 'sm' | 'md';
// plain is sm only
```

**API:** Pass label text as `children` — never as a `label` prop. `Button` has no `label` prop; do not infer the API from `TextInput`, `Select`, or other form field components.

```tsx
// CORRECT
<Button variant="ghost" size="sm">Edit</Button>

// WRONG — Button has no label prop
<Button variant="ghost" size="sm" label="Edit" />
```

**When to use each variant:**
- `primary` — one per view, object creation, rightmost in Navbar
- `secondary` — supports primary or equal-weight alternative
- `ghost` — utility actions (filter, sort, export, copy) and inline secondary row-level actions (reply, edit, delete in lists or comment threads)
- `plain` — dismissive, space-constrained, sm only ("Cancel", "Skip")

**Size:** `md` for any button that stands on its own on the page (page and form actions, a Copy button under a code block). `sm` only when the button is nested inside another component or control — an input, table cell, toolbar, card or navbar action slot, comment row — or when `variant="plain"`.

**Inline secondary actions:** Use `variant="ghost"`, `size="sm"`, optional `showLeadingIcon` with a Lucide icon, and a short verb-led label. Suitable for row-level actions that must not look like primary CTAs. See `src/components/atoms/Button/Button.spec.md` for when to use and when not to use.

**Placement:** Ghost/Plain → Secondary → **Primary** (left to right)

**SplitButton:** use only when one action is the clear default with a few related alternatives (Save / Save as draft). `onDropdownClick` must open a `PopoverMenu` anchored to it — SplitButton renders no menu itself; pass `open` with the menu state so the trigger sets `aria-expanded`. No default action → `Button` with a trailing chevron opening a `PopoverMenu`. A `variant="primary"` SplitButton counts as the view's one primary.
**Never:** Raw HTML `<button>` for DS actions. `position: fixed/absolute` on any Button. Two Primary buttons side by side. Custom button CSS classes that replicate DS button appearance.

**States:** `Default` · `Hover` · `Pressed` · `Focused` · `Disabled` · `Loading` · `Selected` (Toggle/Vertical only)
- `aria-pressed` only on Toggle/Vertical buttons — never on Main or Destructive.
- `aria-busy="true"` when Loading.

**Content:** Strong verb first. "Save changes" not "OK". Sentence case. 1–5 words max.

```tsx
<Button variant="ghost" size="sm" showLeadingIcon leadingIcon={<Pencil />}>Edit</Button>
<Button variant="ghost" size="sm" showLabel={false} leadingIcon={<Trash2 />} aria-label="Delete comment" />
```

---

### Avatar / AvatarGroup

**Variants:** `Profile` (person) · `Organization` (company/team)
**Fill priority:** `Picture` → `Initials` → `Icon` (never show Icon when Initials are derivable)
**Sizes:** `xxs` · `xs` · `sm` (default) · `lg` · `xl` · `xxl` — consistent within a list, never mixed
**AvatarGroup sizes:** `xxs`, `xs`, `sm` only. Show "+" overflow for lists beyond display limit. Hover lifts the active avatar and neighbors with a distance falloff — do not reimplement this in consuming apps.

**Initials:** Person → first + last initial ("Ana Costa" → "AC"). Max 2 chars, always uppercase.

```tsx
<img alt="Ana Costa" aria-label="Ana Costa" />
<div aria-label="Assigned to: Ana Costa, João Silva, and 2 others">
```

---

### Badge

**Use for:** numeric counts and status signals attached to another element.
**Never use when:** label is text → use Tag | user can dismiss → use Chip | count is zero → hide badge entirely.

**Variants:** `Highlight soft` · `Highlight strong` · `Informative` · `Critical`
**Count display:** ≤99 exact · >99 show "99+" · 0 remove badge entirely

```tsx
<button aria-label="Messages, 3 unread" />
```

---

### Tag

See [Tag semantic mapping](#tag-semantic-mapping--critical) above.

**Sizes:** `md` default · `sm` dense layouts. Consistent within a list, never mixed.
**Tags have no interaction states. Not clickable. Never.**

```tsx
<li aria-describedby="tag-status">
  <span id="tag-status" role="status">Error</span>
```

---

### Chip / ChipGroup

**Use for:** user-togglable selections — filter controls, multi-value input.
**Never use when:** purely informational → Tag | mutually exclusive form selection → Radio | settings toggle → Switcher.

**Sizes:** `md` default · `sm` compact. Never mix in the same group.

**In forms:** use `ChipField` (label, `options`, `value` / `onValueChange`, helper and error row) — never a bare `ChipGroup`. Up to 3 options; 4+ → `MultiChoice` or `Combobox selectionMode="multi"`. Always pass `label`, `options` and `helperText` — the defaults are placeholders.

```tsx
<div role="group" aria-label="Filter by status">
  <button role="checkbox" aria-checked="true">Active</button>
  <button role="checkbox" aria-checked="false">Closed</button>
</div>
```

---

### Separator

**Use for:** visual divider between related but distinct sections.
**Do not use when:** spacing already separates sections | sections are separated by card borders | between stacked `HorizontalInput` rows (each row already draws its own divider — a Separator doubles the line).

```tsx
<hr />  // structural
<div aria-hidden="true" />  // decorative only
```

---

### AspectRatio

See `src/components/atoms/AspectRatio/AspectRatio.spec.md`.

**Use for:** images, video, and thumbnails that must keep fixed proportions as the container resizes; reserving media space with `SkeletonLoading`.
**Do not use when:** laying out text/forms/controls | showing an identity picture (use `Avatar`) | previewing an attachment (use `FileThumbnail`).

- `ratio` is a string union (`"16:9"`, `"4:3"`, `"1:1"`, …) — never a number.
- Pass one child. With `fit="cover"` the child needs no width/height/object-fit styles.
- Needs a parent with a definite width — never inside `inline-flex` or `width: fit-content`. Never set only a height.

```tsx
<AspectRatio ratio="16:9" fit="cover" shape="rounded">
  <img src={url} alt="Team planning session around a whiteboard" />
</AspectRatio>
```

---

### Carousel

See `src/components/molecules/Carousel/Carousel.spec.md`.

**Use for:** stepping through several images (one at a time) with a "3 / 27" counter; large photo sets with `showThumbnails`.
**Do not use when:** all items should be visible (grid of `AspectRatio`) | a single image (`AspectRatio`) | full-screen file viewing (`MediaViewer`) | paging records (`Pagination`) | switching views (`Tab`).

- Children are `CarouselSlide` elements — never bare `<img>`. Every image keeps its own `alt`.
- `showDots` only for 10 slides or fewer; `showThumbnails` needs `thumbnailSrc` on every slide.
- No autoplay and no looping — the previous arrow is hidden on the first slide and the next arrow on the last.

```tsx
<Carousel label="Project photos" ratio="16:9" showThumbnails>
  {photos.map((p) => (
    <CarouselSlide key={p.id} thumbnailSrc={p.thumb}>
      <img src={p.src} alt={p.alt} loading="lazy" />
    </CarouselSlide>
  ))}
</Carousel>
```

---

### MediaViewer (lightbox)

See `src/components/organisms/MediaViewer/MediaViewer.spec.md`.

**Use for:** opening an image, PDF or video full screen from a list or grid, stepping through the set, with metadata and file actions (share, download, export) in the top bar.
**Do not use when:** an inline gallery in the page (`Carousel`) | a task or decision (`Modal`) | listing or picking files (`AttachmentField`, `FileRow`).

- Data-driven: pass `items` (`type: 'image' | 'video' | 'pdf' | 'file'`), not children. Images need `alt`.
- Always control it: `open` + `onOpenChange`, and `index` + `onIndexChange` to open at the clicked file.
- `actions={(item) => …}` returns icon-only ghost `Button`s whose `aria-label` names the file. Never a `PopoverMenu`.
- Zoom is images only. PDFs use the browser's viewer and fall back to an "Open in new tab" card where it's not supported.

```tsx
<MediaViewer label="Project files" items={files} open={open} onOpenChange={setOpen}
  index={index} onIndexChange={setIndex} showThumbnails
  actions={(f) => (
    <Button variant="ghost" showLabel={false} showLeadingIcon leadingIcon={<Download size={16} />}
      aria-label={`Download ${f.title}`} onClick={() => download(f)} />
  )} />
```

---

### NotificationCenter

See `src/components/organisms/NotificationCenter/NotificationCenter.spec.md`.

**Use for:** a persistent inbox of events the user reviews later (mentions, assignments, approvals, system events), shown as a bell with an unread count.
**Do not use when:** confirming an action the user just took (`Toast`) | a notice about the current page (`Callout`) | a blocking decision (`Modal`, `AlertDialog`) | a menu of actions (`PopoverMenu`).

- Place in Navbar `rightActions`, to the left of the primary CTA. Never build a custom bell + popover, and never wrap it in `PopoverMenu`.
- Data-driven: pass `notifications` (newest first), not children. The app owns `read`: update it in `onNotificationClick` and `onMarkAllRead`.
- `timeLabel` is preformatted by the app ("5 min ago"). Also pass `dateTime` (ISO).
- People use `avatar={{ fill: 'initials', initials, name }}`. System events use `avatar={{ fill: 'icon', icon: Rocket, name }}`.
- "Mark all as read" and "View all notifications" only render when `onMarkAllRead` / `onViewAll` are passed. Navigate to the full notifications page inside `onViewAll`; the panel closes itself and returns focus to the trigger.
- **Notifications in the Sidebar** (no bell): give the Sidebar item a `buttonRef`, `aria-haspopup="dialog"`, `aria-expanded={open}`, `aria-controls` and a toggling `onClick`, then pass that ref as `anchorRef` with controlled `open` / `onOpenChange` and a matching `id`. The panel opens to the right of the item, and the item's `badgeCount` shows the unread count. Use a "View all notifications" page via `onViewAll`, not the Sidebar item itself.

```tsx
<Navbar variant="title" title="Projects" rightActions={
  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
    <NotificationCenter notifications={notifications}
      onNotificationClick={(n) => { markRead(n.id); navigate(n.href); }}
      onMarkAllRead={markAllRead} onViewAll={() => navigate('/notifications')} />
    <Button variant="primary">New project</Button>
  </div>
} />
```

```tsx
// Notifications lives in the Sidebar
const notificationsRef = useRef<HTMLButtonElement>(null);
const [open, setOpen] = useState(false);

<Sidebar sections={[{ id: 'main', items: [
  { id: 'notifications', label: 'Notifications', icon: <Bell size={16} />,
    showBadge: unread > 0, badgeCount: unread, selected: open,
    buttonRef: notificationsRef, 'aria-haspopup': 'dialog', 'aria-expanded': open,
    'aria-controls': open ? 'notifications-panel' : undefined,
    onClick: () => setOpen((v) => !v) },
  // …other items
] }]} />
<NotificationCenter id="notifications-panel" anchorRef={notificationsRef}
  open={open} onOpenChange={setOpen} notifications={notifications}
  onNotificationClick={openNotification} onMarkAllRead={markAllRead}
  onViewAll={() => navigate('/notifications')} />
```

---

### Card

See `src/components/organisms/Card/Card.spec.md`. Summary for consuming apps:

- Never use a card with body content only and no header — always set `showHeader` and `title`; use `showBottomBar={false}` when there is no footer.
- `.dsn-card-content` padding depends on `data-has-header` and `data-has-bottom-bar` — do not add a default extra padded wrapper.
- When multiple tags appear in the body, use one flex row with `flex-wrap` and a small gap.

---

### Charts

Family contract: `specs/organisms/charts.md`. Per-chart selection: co-located `src/components/organisms/Charts/<ComponentName>.spec.md` (see `ds-index.json`).

**Token import (required):**
```tsx
import 'ds-ngr/tokens.css' // minimum for charts — without this, charts render black
```

**Dashboard assembly:** use `ChartCard` with `title`, optional `description`, and `showBottomBar` / footer actions. Place one chart primitive as `children`.

**Bare charts:** allowed in drawers, split panels, or other slots that already provide chrome — `ChartCard` is not mandatory everywhere.

**Selection quick reference:**
| Need | Component |
|------|-----------|
| Static trend, no tooltip | `LineChart` |
| Hover tooltip + crosshair | `XYLineChart` |
| Brush zoom on long series | `BrushLineChart` |
| Filled area emphasis | `AreaChart` |
| Grouped category bars | `BarChart` |
| Horizontal stack per row | `HorizontalStackedBarChart` |
| Part-to-whole (3–7 slices) | `DonutChart` (built-in legend) |
| x × y bin matrix | `HeatmapChart` |
| Compositional stream over time | `StreamgraphChart` |

**States:** all chart primitives accept `state="loading" | "empty" | "error"` plus customizable messages. Set a meaningful `aria-label` on every chart (`role="img"`).

**Never:** apply the DataTable-never-in-Card rule to charts — charts use `ChartCard`. Never use semantic/status tokens for series colors. Never add local CSS overrides on chart SVG for theming.

---

### EmptyState

See `src/components/molecules/EmptyState/EmptyState.spec.md`. Summary for consuming apps:

- Always set `hasIcon={false}` when no icon is needed, or pass a context-specific `icon={LucideIcon}` when `hasIcon={true}`.
- Always use `size="small"` for compact in-column empty states (e.g. Kanban).
- `showMainCta` renders a primary `Button`; `showSecondaryOption` renders a secondary `Button`.
- For secondary-only CTAs: `showMainCta={false}`, `showSecondaryOption`, `secondaryOptionLabel`, `onSecondaryOptionClick` — never a standalone `Button` beside the component.
- In flex column parents, set `min-width: 0` and `max-width: 100%` on the `EmptyState` root.

---

### Switcher

**Use for:** single binary setting with **immediate** effect.
**Never use when:** requires confirmation → Checkbox | toolbar icon-only → Toggle button | choosing UI views → SegmentControl/Tabs.

**Sizes:** `md` default · `sm` dense. Never mix within a group.
**Always pair with a visible label.**

```tsx
<button role="switch" aria-checked={isOn} aria-labelledby="label-id" />
```

---

### Checkbox

**Use for:** multiple independent options, staged (confirmed on submit).
**Never use when:** single selection → Radio | immediate effect → Switcher.

**Indeterminate:** `aria-checked="mixed"` when parent has partial sub-selection.

**PopoverMenu checkbox-cell items:** Always set `showLeadingIcon: false` and `showTrailingIcon: false` when no icons are needed — `Checkbox` defaults `showTrailingIcon` to true and renders a placeholder trailing icon when `trailingIcon` is omitted.

```tsx
<fieldset>
  <legend>Notification preferences</legend>
  <label><input type="checkbox" aria-checked="true" /> Send weekly summary</label>
</fieldset>
```

---

### Radio

**Use for:** exactly one from a mutually exclusive set (2–6 items), staged.
**Never for:** 7+ options → Select | immediate effect → Switcher/SegmentControl.

```tsx
<div role="radiogroup" aria-labelledby="group-label">
  <label><input type="radio" aria-checked="true" /> Option A</label>
</div>
```

---

### Tab / CustomViewTab

**Use for:** 2–7 parallel, mutually exclusive content sections.
**Never for:** sequential steps → stepper | filtering same content → Chip | display preference → SegmentControl | moving between pages/routes → `TabNav`.

- One tab always selected. Tab labels: nouns only. Never nest tabs.
- Keyboard: `←/→` between tabs, `Tab` into content panel.

```tsx
<div role="tablist">
  <button role="tab" aria-selected="true" aria-controls="panel-1" id="tab-1" tabIndex={0}>Overview</button>
  <button role="tab" aria-selected="false" aria-controls="panel-2" id="tab-2" tabIndex={-1}>Activity</button>
</div>
<div role="tabpanel" id="panel-1" aria-labelledby="tab-1">...</div>
<div role="tabpanel" id="panel-2" aria-labelledby="tab-2" hidden>...</div>
```


### TabNav

**Use for:** 2–7 tab-styled links where each item goes to a different page or route (site sections, record sub-pages).
**Never for:** switching panels on the same page → `Tab`.

- Renders `<nav aria-label>` of real links; the current page gets `current: true` → `aria-current="page"`. Never `role="tab"` / `aria-selected` for page navigation.
- `aria-label` is required. Pass the router link via `linkAs` (e.g. Next.js `Link`).

```tsx
<TabNav
  aria-label="Project sections"
  linkAs={Link}
  items={[
    { href: '/projects/42', label: 'Overview', current: true },
    { href: '/projects/42/activity', label: 'Activity' },
  ]}
/>
```

---

### SegmentControl

**Use for:** 2–5 mutually exclusive views with **immediate** effect.
**Never for:** options with distinct content panels → Tabs | navigation | binary setting → Switcher.
**Never replace with** plain text, custom buttons, or any non-DS-Ngr component.

- One selector always active. Equal-width selectors. Max 5 options.
- Always let `SegmentControl` hug its content — this is the default (`fullWidth={false}`).
- Never make `SegmentControl` full-width in a large container or in a bar with several other controls, such as a filter bar with a search and filters — `Toolbar variant="filter-bar"` forces it to hug.
- Only set `fullWidth` when the control is the sole element of a small bar or panel (e.g. a popover's segment slot), or shares that bar with one or two actions.
- Never set a fixed width on `SegmentControl` — it either hugs its content or fills a small bar via `fullWidth`.

```tsx
// Markup SegmentControl renders, for reference — never hand-build this in app code
<div role="group" aria-label="View mode">
  <button role="radio" aria-checked="true">List</button>
  <button role="radio" aria-checked="false">Grid</button>
</div>
```

---

### Breadcrumbs / BreadcrumbItem

See [NAV-06](#nav-06-breadcrumb-sizes) and [NAV-07](#nav-07-breadcrumb-format) above.

```tsx
<nav aria-label="Breadcrumb">
  <ol>
    <li><a href="/projects">Projects</a></li>
    <li><span aria-current="page">Q4 Campaign</span></li>
  </ol>
</nav>
<span aria-hidden="true">/</span>  // separator — decorative, never read aloud
```

---

### Pagination / PageSelector

**Use for:** large datasets in data tables and record lists.
**Never for:** continuous browsing → infinite scroll | compact panel → load-more button.

- Always show first and last page numbers. Disable (never hide) Previous/Next at boundaries.
- Show record count: "Showing 41–60 of 243 results".

```tsx
<nav aria-label="Pagination">
  <button aria-label="Go to previous page" aria-disabled="true">←</button>
  <button aria-current="page">3</button>
  <button aria-label="Go to next page">→</button>
</nav>
```

---

### Toast (Inline, Rich)

**Use for:** non-blocking confirmation of a completed action.
**Never for:** critical actions requiring response → Modal | form field validation → inline validation.

**Severity:** `Default` · `Success` · `Warning` · `Error` (Error persists until dismissed)
**Auto-dismiss:** Default/Success 4–5s · Warning 6–8s · Error persistent

```tsx
<div aria-live="polite" role="status">Changes saved.</div>   // success/default/warning
<div aria-live="assertive" role="alert">Save failed.</div>   // error only
<button aria-label="Dismiss notification">×</button>
```

---

### Tooltip

**Use for:** brief supplementary context on hover/focus. Icon-only button labels.
**Never for:** content > 1 sentence → Popover | interactive content → Popover | disabled triggers.

- Plain text only. One sentence max. Never on click.

```tsx
<button aria-describedby="tooltip-1">Export</button>
<div role="tooltip" id="tooltip-1">Export table as CSV</div>
```

---

### Popover (Container, Simple Menu, Complex Menu)

**Use for:** contextual rich content anchored to an element. Opens on click only.
**Never for:** 1 short sentence → Tooltip | full attention → Modal | extended task → Drawer.

- Never nest popovers. Menu items auto-close on selection.
- Form containers do NOT auto-close on outside click.
- Positioning via shared `PopoverWrapper` — never re-implement.

```tsx
<button aria-haspopup="true" aria-expanded={isOpen}>Options</button>
<div role="menu">
  <button role="menuitem">Edit</button>
  <button role="menuitem">Delete</button>
</div>
```

### PopoverMenu

**Use for:** structured anchored menus — action lists, single-select pickers, and deferred multi-select filters.
**Never for:** 1 short sentence → Tooltip | full attention → Modal | multi-value toolbar filters modeled as `Select` with an "All" sentinel option.

**MultiSelectAnchored pattern (recommended for toolbar filters):**
- Use `PopoverMenu` `variant="rich"` with a Select-style trigger (`Button variant="secondary"`), checkbox-cell `choiceLists` sections, and `showBottomBar` with Cancel/Confirm.
- Pass `anchorRef` on `PopoverMenu` so one `PopoverWrapper` owns positioning — never nest `PopoverMenu` inside another `PopoverWrapper`.
- See Storybook **Overlays/PopoverMenu → MultiSelectAnchored** for the reference integration.

- Always use checkbox-cell items for multi-value toolbar filters (status, assignee, etc.) — empty checked state means no filter applied.
- Always set `showLeadingIcon: false` and `showTrailingIcon: false` on checkbox-cell items when no icons are needed.
- Never hand-build menus from `MenuCell` rows — `PopoverMenu`, `Select`, `Combobox` and `ChoiceList` render `MenuCell` for you. If you must use `MenuCell` directly, place it inside `role="menu"` (or `role="listbox"` with `role="option"` + `aria-selected`). With `showButtons`, pass `actionIcon` and an `actionAriaLabel` that names the action (defaults: `Ellipsis`, "Open actions").
- A popover bottom bar with a single action is always full width. The library does this automatically; never wrap the lone action to push it to one side or give it a fixed width.

### Shared anchored positioning contract

All select-like menus and dropdown popovers share one positioning contract via `PopoverWrapper`. Never re-implement custom per-component popover math.

- Always open popovers below the trigger, with a gap of `var(--space-2xs)`
- Flip above only when the content does not fit below **and** there is more room above
- When the content fits neither side, open on the roomier side
- Never let a popover overlap its own trigger — it shrinks to fit the chosen side instead
- Always cap popover height at the smaller of `var(--popover-height-max)` and the space available on the side the popover opens on — the cap shows about nine rows with the next one cut off, signalling scroll
- Always keep the popover header, segment, search and bottom bar pinned — only the content area scrolls
- Never set `max-height` or `overflow` on popover content in a consuming component — `PopoverWrapper` owns both
- Never call `element.focus()` or `element.scrollIntoView()` on popover content — the library moves focus and reveals options itself without scrolling the page
- Always show a search field in the popover when a list has more than 10 items (about what fits under the height cap before it scrolls)
- `Select` adds the search field automatically above 10 options; `searchable` overrides it
- Always set `showSearch` on `PopoverMenu` yourself when a list has more than 10 items — it does not add search automatically
- Never pass `searchable={false}` to a `Select` with more than 10 options
- Use `Combobox` instead of `Select` for free-text or async option sets
- Viewport-safe margin: `var(--space-md)` on every edge
- Clamp horizontal position so popovers never touch viewport edges
- Match popover width to trigger width, minimum `192px`
- Truncate menu-cell labels when constrained by matched-width dropdowns

Applies to: `Select`, `PhoneInput`, `DateTimePicker`, and any future dropdown trigger.

---

### Modal

**Use for:** user must complete a task or decide before continuing.
**Never for:** informational only → Toast | long task → Drawer | anchored content → Popover.

- Every modal needs a title and an explicit dismiss (× + Cancel).
- One Primary action only. Never nest modals. Never auto-open on page load.
- On open, focus moves to the first focusable element inside the modal content area so form fields receive initial focus — not header controls such as the close button.
- When the content area has no focusable elements, focus falls back to the first focusable element anywhere in the dialog.
- Never add per-form `autoFocus` or manual focus refs to work around Modal focus behavior.
- Focus trapped inside while open. Returns to trigger on close.

```tsx
<div role="dialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby="modal-desc">
  <h2 id="modal-title">Delete project</h2>
  <p id="modal-desc">This cannot be undone.</p>
</div>
```

---

### AlertDialog

**Use for:** confirming a destructive or high-impact action before it runs.
**Never for:** forms or multi-field tasks → `Modal` | an action already done → `Toast` | a page notice → `Callout`.

- `variant="danger"` for destructive actions; `variant="default"` otherwise.
- Always set a specific `title`, `message` and `confirmLabel` (e.g. "Delete project") — never ship the generic defaults.
- `onConfirm` does not close the dialog — close it yourself (`setOpen(false)`).
- Use `requireAcknowledgement` + `acknowledgementLabel` for irreversible actions.
- Same modal rules as `Modal`: never nest, never auto-open on page load.

---

### Command / CommandDialog

See `src/components/organisms/Command/Command.spec.md`.

**Use for:** jumping to a page, record or action by name — site search, "go to…" menus, a global ⌘K palette.
**Do not use when:** picking a form value (`Combobox`, `Select`) | a short fixed action menu on a trigger (`PopoverMenu`) | filtering content already on the page (`SearchBar`).

- Global search or ⌘K → `CommandDialog`. Never wrap `Command` in `Modal` yourself, and never open it from inside a Modal.
- The app binds ⌘K / Ctrl K to toggle `open`; the header trigger is a `Button` with `shortcut` (⌘ K), `aria-haspopup="dialog"` and `aria-expanded`.
- Navigate or act only in `CommandItem.onSelect`, then close the dialog. Never navigate on raw typed text.
- `description` is display only — put category and synonym words in `keywords` so they match.
- Server-side search → `shouldFilter={false}` with controlled `search` / `onSearchChange`.

```tsx
<CommandDialog open={open} onOpenChange={setOpen} aria-label="Search the docs">
  <CommandInput placeholder="Search components, patterns and guides" />
  <CommandList>
    <CommandEmpty />
    <CommandGroup heading="Components">
      <CommandItem value="Button" description="Actions" keywords={['component', 'actions']}
        onSelect={() => { navigate('/components/button'); setOpen(false); }} />
    </CommandGroup>
  </CommandList>
</CommandDialog>
```

### Input — shared anatomy

```
[Label]        ← always required (visible or aria-label)
[Control]      ← must have visible boundary
[Helper text]  ← optional; real content or hidden — never leave placeholder text
[Error]        ← replaces helper text in error state
```

**Validation timing:** on blur by default. Real-time only for password strength, character count, search, OTP.
On form submit: show all errors at once, focus first errored field.

**Every field is mandatory by default.** Mark optional fields with the `optional` prop on the input — never a manual `(optional)` span or asterisk.

```tsx
<label htmlFor="email">Email address</label>
<input id="email" aria-describedby="email-helper email-error"
  aria-invalid={hasError} aria-required={true} />
<p id="email-helper">We'll only use this to send receipts.</p>
<p id="email-error" aria-live="polite">Email address is invalid.</p>
```

---

### TextInput
Single-line free-form text. Do NOT use for: multi-line → TextArea | numbers → NumberInput | passwords → PasswordInput | phone → PhoneInput | search → SearchBar | fixed list → Select.

### TextArea
Multi-line text. Always pass `label` — every `TextArea` must have a visible field label; use `optional` for non-mandatory fields, not a missing label.

**Height:** Control initial row count with `minRows`, not `rows` — `TextArea` has no `rows` prop; `minRows` defaults to 3 and maps to the native textarea.

**Forwarded props:** `onChange`, `onBlur`, `onFocus`, `value`, `defaultValue`, `disabled`, `placeholder`, `maxLength`, `name`, `autoComplete`, `id`, `className`, `aria-label`, `aria-labelledby`, `optional`, `error`, `errorMessage`, `helperText`, `leadingIcon`, `helperIcon`.

**Not forwarded:** `ref`, `rows`, and native keyboard event handlers such as `onKeyDown` / `onKeyUp` — wrap the field or extend the component in the library if those are required.

Allow vertical resize. Show character count when limited: "120 characters remaining".

### RichTextEditor
Formatted prose (descriptions, notes, comments). Plain multi-line text → `TextArea` | AI prompt → `PromptInput`.
- Value is an HTML string — sanitize it before rendering.
- The checkbox + Cancel/Confirm footer is off by default. Set `showFooter` only for standalone composers (comments), with a specific `confirmLabel` and `footerLabel` — never inside a `Form`, where it would compete with the form submit.
- `helperIcon` adds an optional icon to the helper row, as on the other inputs.
- `maxLength` shows a counter and over-limit state but does not block typing — validate on submit.

### PromptInput
Input for AI assistants and chat. Never inside a `Form` — it submits via `onSubmit` (Enter sends, Shift+Enter adds a line); in controlled usage clear `value` in `onSubmit`.
- The model selector is hidden unless you pass `modelOptions` with the real models.
- `PromptInputModelSelector` and `VoiceWaveform` are internal — never import or use them directly.

### SearchBar
- `variant="default"` (bordered, visible label): dedicated search areas and filter panels — always override the literal `label="Label"` and `helperText="Help text"` defaults.
- `variant="ghost"` (borderless): inline in toolbars, headers and menus — always set `aria-label`. Same in `Sidebar` `searchSlot`, where the label is hidden.
- Placeholder describes the scope: "Search projects", not "Search".
- Clear (×) button is built in when the field has a value; wire `onClear` in controlled usage.
- `Error` state: system errors only — NOT for "no results" (use EmptyState).

### PasswordInput
Always include show/hide toggle. Show strength indicator for new passwords. `autocomplete="current-password"` or `"new-password"`.

### OTPInput
Auto-advance on character entry. Auto-submit on last field. Full paste support. Backspace clears and moves to previous field.

### NumberInput
Define and enforce min/max. Stepper buttons disable at boundaries. Always allow direct keyboard entry. Do NOT use for currency or ranges.

### PhoneInput
Always use for international numbers — never plain TextInput. Pre-select user's locale. `PopoverWrapper` for country dropdown.

### Select
7+ options or space-constrained → Select. ≤6 options with space → Radio instead.
Include placeholder that is NOT a valid value. Search appears automatically above 10 options — never pass `searchable={false}` there; free-text or async options → `Combobox`.

### AutocompleteMulti
Search-and-select multiple values. Each selected value becomes a chip. Backspace on empty removes last chip.

### HorizontalInput
Label left, control right. Dense settings panels only. Do NOT use in standard forms, mobile, or with long labels.

### Slider
- `Max value`: one handle | `Range`: two handles, cannot cross
- Always show current value. Show min/max at track ends. Pair with NumberInput for precision.

### UploadArea
Click-to-browse fallback always. State accepted types and size limits. Show upload progress after acceptance.
- State types and limits in `maxSizeText` (e.g. "PDF, PNG or JPG up to 10 MB") — nothing is shown when it is omitted.
- `accept` filters both picked and dropped files. Show a clear error for files passed to `onFilesRejected`, and check size in `onFilesSelected`.
- Show accepted files and their progress below the zone with `FileRow` (`state="uploading"` → `"default"`).

### Attachments — which component
| Need | Component |
|---|---|
| Dedicated upload step, drag-and-drop, several files | `UploadArea` |
| One file as a form field | `AttachmentField` |
| Files attached to a message, comment or prompt | `AttachmentChip` (rendered by `PromptInput` / `RichTextEditor`) |
| A record's files as a list with copy link / download, or upload progress | `FileRow` |
| Attachments as a visual grid (photos, screenshots) | `AttachmentCard` |
| A small preview inside a custom row or cell | `FileThumbnail` |

- For image previews pass `previewVariant="image"` with `previewSrc` / `imageSrc` — without a source the preview falls back to the file icon.
- `AttachmentCard`'s `"more"` action and `AttachmentChip`'s default menu options need your own menu / `menuOptions`.

### ChipsInput
Free-form entry. Confirm with Enter. Validate before converting. Backspace on empty removes last chip.

### DateTimePicker
One component for every date field — `DatePicker` / `DateRangePicker` do not exist.
- `selectionMode="single"` (default) or `"range"`; add `withTime` when the time of day matters.
- `displayMode="popover"` (default) for a field among others; `"inline"` only when picking the date is the main task of the view.
- `presets`: omit for the built-in shortcuts (Today, Yesterday, Last Friday / previous calendar week, month, year in range mode), pass your own, or `[]` to hide them.
- `showActions` (Cancel/Confirm) is on by default — commit in `onConfirm`, or set `showActions={false}` for quick single-date picks.
- Typed entry uses MM-DD-YYYY and accepts natural language ("tomorrow", "next friday").
- No min/max or disabled dates — validate in the form and state limits in `helperText`.
- Do NOT pre-select today for historical dates (e.g. date of birth).

### ProgressRing
Indeterminate loading when duration is unknown. Export name is `ProgressRing` (specs may refer to this as "Spinner"). Sizes: `sm` · `lg` · `xl` · `xxl`. Always pair with a label when standalone. Never multiple indicators simultaneously.

```tsx
import { ProgressRing } from 'ds-ngr';

<ProgressRing size="lg" label="Loading results" />
```

### SkeletonLoading
Shape is known, load takes >~300ms. Always animate (shimmer/pulse — never static). Replace all skeletons simultaneously.

```tsx
<div aria-busy="true" aria-label="Loading">
  <div aria-hidden="true" class="skeleton-avatar" />
</div>
```

### ProgressBar / LoadingBar
- `LoadingBar`: page-level navigation only, top of viewport. Never inline.
- `ProgressBar`: measured progress. Always show percentage or step count alongside.

### CalendarView

See `src/components/organisms/CalendarView/CalendarView.spec.md` for when to use, event color rules, and legibility contract.

- Always use `CalendarView` for month, week, day, and list (agenda) scheduling views when this organism covers the use case.
- Never build a custom calendar grid or duplicate FullCalendar chrome in the app.
- Never set `CalendarEvent.color` to dataviz, warning, error, or accent tokens as the only styling — those values become FullCalendar `backgroundColor` and `borderColor` and do not set readable event text.
- Always keep event labels (title and time) on primary text over a neutral event surface; never use selected-state or accent text tokens for `.fc-event-title` or `.fc-event-time`.
- When `CalendarEvent.color` is set, either supply a contrasting `textColor` in the event mapping or use `color` only for subtle indicators (e.g. border), not full fills without a text pairing.
- Never add app-level CSS overrides on FullCalendar event classes to make events readable — that is the responsibility of `CalendarView` styles and its event color API.

```tsx
// CORRECT — scheduling page
<CalendarView events={events} defaultView="month" onEventClick={handleEvent} />

// WRONG — custom month grid when CalendarView exists
<div className="my-calendar-grid">{/* day cells */}</div>

// WRONG — status/dataviz token as sole event color (no text pairing)
{ events.map(e => ({ ...e, color: 'var(--color-background-dataviz-1)' })) }

// WRONG — app CSS to fix unreadable events
.fc-event-title { color: var(--color-foreground-neutral-primary); }
```

---

### DataTable

**Use for:** all tabular data — lists of projects, tasks, people, records. Never build hand-built HTML tables or native `<table>` markup as a substitute — always use `DataTable` with column definitions and row objects. Custom tables do not inherit DS table visual tokens (row height, hover state, border color, divider) and will break visual consistency and dark mode.

**When cells need DS components (Tag, ProgressBar, AvatarGroup):** use the `render` prop on the column definition. This is the correct pattern — not a workaround.

**Header cells:** `DataTable` renders `DataTableHeaderCell` for every column — configure sort, reorder, resize and the selection column through `DataTable` and its column definitions, never by rendering header cells yourself. Header cells have no filter input — filter rows before passing them and put filter controls in a `Toolbar` above the table.

**Row identity in `render` callbacks:** the second argument to `render` is the row's `cells` record — not the full `DataTableRow`. Do not assume `row.id` is available inside `render` unless you include `id` in `cells`. Always put the record `id` in `cells` when a column `render` callback needs to identify or open a row.

```tsx
// ✅ CORRECT — id available in render via cells
const rows: DataTableRow[] = projects.map((p) => ({
  id: p.id,
  cells: { id: p.id, name: p.name, status: p.status },
}));

{
  id: 'name',
  header: 'Name',
  fieldType: 'string',
  render: (value, cells) => (
    <Button variant="plain" size="sm" onClick={() => openProject(cells.id as string)}>
      {value as string}
    </Button>
  ),
}

// ❌ WRONG — assuming row.id exists in render
render: (value, row) => openProject(row.id)  // row is cells; id is undefined unless included
```

```tsx
const columns: DataTableColumnDef[] = [
  { id: 'name', header: 'Name', fieldType: 'string' },
  {
    id: 'status',
    header: 'Status',
    fieldType: 'tags-multi',
    render: (value: string) => (
      <Tag variant={statusVariantMap[value]} label={value} />
    ),
  },
  {
    id: 'progress',
    header: 'Progress',
    fieldType: 'number',
    render: (value: number) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
        <ProgressBar value={value} max={100} />
        <span>{value}%</span>
      </div>
    ),
  },
  {
    id: 'lead',
    header: 'Lead',
    fieldType: 'multi-user', // built-in AvatarGroup + names — no render needed
  },
];

const rows: DataTableRow[] = [
  { id: 'row-1', cells: { name: 'Q1 campaign refresh', status: 'Completed', progress: 100, lead: [{ name: 'Alex Chen' }] } },
];
```

**Numeric alignment is automatic:** `fieldType: "number"`, `"date"`, `"datetime"`, `"month-year"`, `"range"` and `"phone"` columns (including currency, which uses `fieldType: "number"`) always render with `font-variant-numeric: tabular-nums` — this is built into `DataTableCell`, never add it yourself.

**Pick a built-in `fieldType` before writing `render`:** there are 31 values mirroring the Figma "Field type" property (`main`, `email`, `phone`, `contacts`, `file`, `expand`, `buttons`, …) — see `DataTableCell.spec.md`. `tag` and `user` are legacy aliases of `tags-multi` and `single-user`. Pass `onCellAction` to DataTable to enable the per-type hover actions.

**Valid DS components inside table cells:** `Tag`, `ProgressBar`, `AvatarGroup`, `Avatar`, `Badge`, `Chip`, `Button` (ghost or plain, sm only).

**Never inside table cells:** `Card`, `Modal`, `Drawer`, `SectionHeader`, `Navbar`, `Sidebar`.

**Layout rules:**
- `DataTable` is always full-width — never wrapped in a `Card`.
- **Column reorder is built into the header** — three paths, no custom reorder UI:
  - **Drag** the header cell root
  - **Column options** (header overflow) → **Move left** / **Move right** (single-pointer, WCAG 2.5.7)
  - **Keyboard:** focus a reorderable header and press **Ctrl+ArrowLeft** / **Ctrl+ArrowRight** (Cmd+Arrow on macOS; WCAG 2.1.1)
- Never add a separate "Reorder column" button. Locked columns (first display column after the selection checkbox, plus any column with `reorderable: false`) cannot move. Moves are announced via a live region (`"{header} moved to position {n} of {total}"`).
- **Sort is desc-first** — activating a sortable column cycles `none → desc → asc → desc`. Do not assume ascending-first sorting or wire client sort logic that treats the first click as `asc`.
- `onSortStateChange` receives `{ columnId, direction: 'asc' | 'desc' }` (or clear with `sortState={null}`). The parent owns sort application on `rows`.
- Toolbar with `SearchBar` and anchored `PopoverMenu` multi-select filters goes above the table, outside the DataTable component — use the MultiSelectAnchored pattern, not `Select`, for multi-value dimensions.
- Multi-select with `BulkActionBar`: see [LCB-06b](#lcb-06b-datatable-multi-selection--bulkactionbar).

```tsx
// ✅ CORRECT — MultiSelectAnchored filter triggers above the table
<SectionHeader title="Projects" size="large" />
<Toolbar
  variant="filter-bar"
  leftActions={
    <>
      <SearchBar variant="ghost" placeholder="Search projects" aria-label="Search projects" />
      {/* One PopoverMenu trigger per multi-value dimension — see MultiSelectAnchored story */}
    </>
  }
/>
<DataTable columns={columns} rows={rows} />

// ❌ WRONG — never wrap DataTable in a Card
<Card>
  <DataTable columns={columns} rows={rows} />
</Card>

// ❌ WRONG — never build a native table instead of DataTable
<table>
  <thead>...</thead>
  <tbody>...</tbody>
</table>
```

---

### Drawer

**Use for:** row detail panels, filter panels, and secondary tasks opened from the main view. See [LCB-06d](#lcb-06d-datalistcell-stacks-in-drawers) for metadata list layout.

**DataListCell in drawers:**
- Stack `DataListCell` components directly in drawer content; horizontal inset is handled on each cell.
- Never cap the stack with an arbitrary `max-width`.

---

### DataListCell

**Use for:** label–value metadata rows in detail panels, drawers, and profile-style layouts.

**Layout rules:**
- Cells default to full width; in drawers they align with header/footer inset automatically (see [LCB-06d](#lcb-06d-datalistcell-stacks-in-drawers)).
- Never wrap a drawer `DataListCell` stack in a container with arbitrary `max-width` — use the full available panel width.

---

### Shortcut
Non-interactive display element only. Platform-standard notation. Keys only: `⌘S` not `⌘ Save`.

---

## Writing conventions & content guidelines

Every label, heading, action, message, and placeholder written while building with DS-Ngr must follow these rules. Copy is part of the UI contract — an agent that writes careless labels produces an inconsistent product regardless of which components it uses.

### Sentence case everywhere
All UI text uses sentence case. Never title case.

```
✅ Add team member
❌ Add Team Member

✅ No results found
❌ No Results Found
```

### Buttons and actions — verb first, object second
Use the imperative form. Include the object when context alone does not make it clear. 1–3 words; 5 maximum. Never truncate.

```
✅ Save changes     ✅ Delete project     ✅ Invite member
❌ Changes saved    ❌ Project deletion   ❌ Member invitation
```

Never use "in order to", "please", "click here", or "successfully".
Destructive actions name what is destroyed: "Delete account" not "Confirm".
Loading state: present-progressive. "Saving…"

### Labels and headings — noun phrases, no verbs
Field labels and column headings name the thing. They do not instruct.

```
✅ Due date     ✅ Assigned to     ✅ Project name
❌ Enter date   ❌ Select a user   ❌ Name your project
```

### Error messages — what, why, next step
Three parts, in order. Omit any part that adds no information.

```
✅ File too large. Maximum size is 10 MB. Choose a smaller file.
✅ Session expired. Sign in again to continue.
❌ Something went wrong.
❌ Error 403.
```

Never apologise. "Sorry" and "unfortunately" add length without adding clarity.

### Empty states — task-oriented
Title: 2–5 words, no punctuation at end. Description: 1–2 lines with full stop. CTA: 1–3 words, verb-first. Never use "Oops" or "Uh oh".

```
✅ No tasks yet. Create one to get started.
✅ Nothing here. Add a project to see it listed.
❌ There are no items to display.
❌ This list is empty.
```

### Help text and tooltips — outcome, not mechanics
Describe the result or purpose, not the interaction. One sentence.

```
✅ Used to notify team members when the task is overdue.
✅ Visible to all members with project access.
❌ Click to toggle this option on or off.
```

### Placeholder text — contextual, not generic

```
✅ Search by name or email
✅ e.g. Q3 planning
❌ Enter text
❌ Type here
```

### Modals
Title: 3–6 words, sentence case. "Delete project" not "Are you sure?"
Primary action: specific verb. "Delete" not "OK" or "Confirm".
Cancel for reversible actions. Close for informational ones.

### Toasts
Lead with outcome: "Changes saved" not "We are saving your changes".
No "Successfully" prefix — state the outcome directly.

### Tags and chips
1–3 words. Sentence case. Label and variant must tell the same story.

### Validation timing
- Show errors **on blur** for individual fields during form fill
- On **form submit**: show all errors at once, scroll to and focus the first errored field
- Once an error is shown, **re-validate in real time** as the user corrects it — do not wait for another blur
- Remove the error as soon as the value becomes valid — do not make the user re-blur
- Never validate on every keystroke for format errors — exception: password strength, character count, search, OTP

### Standard message library

| Situation | Pattern | Example |
|---|---|---|
| Required field empty | Enter [field name]. | Enter your first name. |
| Too long | Use fewer than [N] characters. | Use fewer than 50 characters. |
| Too short | Use at least [N] characters. | Use at least 8 characters. |
| Number too low | Enter a number that's [N] or more. | Enter a number that's 1 or more. |
| Number too high | Enter a number that's [N] or fewer. | Enter a number that's 100 or fewer. |
| Wrong format | Enter [field name] in the correct format. | Enter your email address in the correct format. |
| System fault | [What happened]. Try again. | Your changes couldn't be saved. Try again. |

### Danger zone settings
Always use the DS Callout component for danger-zone messages and place the destructive action in the actions slot.

---

## Accessibility requirements

### Contrast
- Normal text: WCAG AA minimum 4.5:1 | Large text: 3:1 minimum

### Focus
- Always `:focus-visible` — never `:focus` as the visible ring trigger.
- Never `outline: none` without explicit replacement.
- Focus must never be hidden by `overflow: hidden` on a parent.

### Keyboard
- All interactive elements keyboard operable. Focus order: top-to-bottom, left-to-right.
- Closed disclosure components: children NOT keyboard-reachable until open.
- Every popup/dropdown: Arrow keys navigate · Enter/Space select · Escape closes and returns focus.

### Disabled elements
- Native: `disabled` attribute (removed from tab order).
- Custom: `tabIndex={-1}` + `aria-disabled="true"`.
- Never focusable unless user needs to discover it exists.

### Color
Color alone must never convey meaning. Always pair with text, icon, or pattern.

### Forms
- Every input needs a programmatic label.
- Helper text and errors: `aria-describedby`. Error state: `aria-invalid="true"`.
- All inputs: `aria-required="true"` by default. Optional fields: omit or set `false`.
- Errors persist until resolved — never auto-dismiss.

### Loading
- `aria-busy="true"` while loading. `aria-busy="false"` when complete.
- ProgressRing graphic: `aria-hidden="true"` — the label carries the meaning.

### Live regions
- `aria-live="polite"` — success/default/warning toasts, spinner completion.
- `aria-live="assertive"` — error toasts only.

### Custom widget keyboard contracts
| Widget | Required behavior |
|---|---|
| `menuitem` | Enter/Space to activate; Arrow keys to navigate |
| `switch` | Space to toggle |
| `checkbox` | Space to toggle |
| `radio` | Arrow keys move selection |
| `slider` | Arrow keys ±1 step; Page Up/Down larger; Home/End min/max |
| `tab` | Arrow keys between tabs; Enter/Space to activate |
| `gridcell` | Roving tabindex; Arrow keys navigate; Enter selects |
| `combobox` (Command) | Focus stays in the input; Arrow Up/Down move `aria-activedescendant`; Enter runs the active option; Escape closes the dialog |

---

## What NOT to do

### Layout
- ❌ Build layout with raw divs — always use `AppShell`
- ❌ Add `min-height`, `height`, or sizing directly to `<AppShell>`
- ❌ Skip the `<div style={{ height: '100vh', display: 'flex' }}>` wrapper around AppShell
- ❌ Add an extra padding wrapper inside AppShell children — the main area already has `padding: var(--space-md)` built in
- ❌ Wrap `SectionHeader` in a padded div — it is edge-to-edge and owns its own `padding-inline`
- ❌ Add `padding`, `minWidth`, or fixed `width` to any container that directly holds a `SectionHeader`
- ❌ Use fixed pixel `minWidth` on page-level grid or flex containers — always `width: 100%`
- ❌ Apply scroll to the full page — only the content area scrolls
- ❌ Apply spacing tokens directly on a DS-Ngr component — wrappers only
- ❌ Use a `Card` with body content only and no header — always set `showHeader` and `title`
- ❌ Omit `showBottomBar={false}` when the card has no footer
- ❌ Add padding/margin directly to `<Card>` or duplicate `.dsn-card-content` inset on every child
- ❌ Stack multiple tags as separate block children in a card body — use one flex row with wrap
- ❌ Add padding/margin/gap to Card header (`SectionHeader`) or bottom bar (`Toolbar`)
- ❌ Wrap `DataTable` in a `Card`
- ❌ Add a separate "Reorder column" button or custom column-move UI — use built-in drag, Column options menu, or Ctrl/Cmd+Arrow on the focused header
- ❌ Assume ascending-first `DataTable` sort — first activation is always `desc`
- ❌ Build hand-built HTML tables for tabular data — use `DataTable` with column definitions and row objects
- ❌ Use a `Card` header as a page section title for lists or detail in main content — use `SectionHeader` in a `page-section` wrapper
- ❌ Cap `DataListCell` stacks in drawers with arbitrary `max-width` — stack cells at full panel width in drawer content
- ❌ Cap and center a list, table, or dashboard page — only auth, onboarding, confirmation, and settings pages use `--size-container-xl`
- ❌ Hardcode `Toast` z-index or use any value other than `var(--z-index-toast)` — it must stay above Modal, PopoverMenu, and Tooltip
- ❌ Place the primary CTA inside a Card or content area
- ❌ Create a floating action button — use Navbar `rightActions`
- ❌ Use `position: fixed` or `position: absolute` on any Button
- ❌ Nest tabs within tabs
- ❌ Place pagination above content — always below
- ❌ Mix Pagination and infinite scroll in the same view
- ❌ Place Breadcrumbs inside cards, modals, or drawers
- ❌ Swap list and detail views inside a list page component — lift selected-entity state to the app shell and render separate list and detail views at the shell level
- ❌ Add an in-page back button on a detail view when breadcrumb navigation is in the navbar
- ❌ Show a separate title navbar on detail views — use `Navbar variant="breadcrumbs"` only
- ❌ Repeat the entity name in a `SectionHeader` on a detail page when it already appears as the current breadcrumb item
- ❌ Deselect the parent sidebar item when navigating from a list route to a detail route
- ❌ Assume `row.id` is available in a `DataTable` column `render` callback — the second argument is `cells`; include `id` in `cells` when needed
- ❌ Place LoadingBar inline — top of viewport only
- ❌ Mix Avatar, Chip, Checkbox, Radio, or Switcher sizes within the same group

### Typography
- ❌ Set `font-family` anywhere in app code
- ❌ Use raw `<h1>`–`<h6>` or `<p>` with custom font styling
- ❌ Set `font-size` with raw pixel values
- ❌ Use `--font-size-label` or hardcoded pixel font sizes for dense metadata or timeline secondary copy — use micro typography tokens
- ❌ Use serif, system, or any non-design-system font

### Tokens
- ❌ Hardcode hex values, pixel sizes, or rgba
- ❌ Use hardcoded pixel spacing in layouts when a `--space-*` token exists
- ❌ Use primitive tokens (`--primitive-neutral-900`) in app code
- ❌ Use an inset scale (`--inset-*`, `--size-inset-*`) — retired; one `--space-*` scale covers padding, margin and gap
- ❌ Use generic semantic tokens or hardcoded hex for dataviz — use `--color-{background|border|foreground}-dataviz-*`
- ❌ Render charts without `import 'ds-ngr/tokens.css'` — SVG dataviz custom properties unresolved → black charts
- ❌ Assume a theme provider is required for charts — load `tokens.css` at app entry instead
- ❌ Expect built-in legends on line/bar/area charts — only `DonutChart` ships a legend
- ❌ Use `Card` alone when the dashboard chart pattern needs chart padding — use `ChartCard` instead
- ❌ Override dark mode with `@media (prefers-color-scheme: dark)` — use `data-theme="dark"`

### Buttons and CTAs
- ❌ Use raw HTML `<button>` for interactive actions when `Button` exists — use `Button variant="ghost" size="sm"` for inline secondary actions such as reply, edit, and delete
- ❌ Pass button label text as a `label` prop — `Button` uses `children` only
- ❌ Create custom button CSS classes to replicate DS button appearance — use the closest documented variant
- ❌ Place two Primary buttons side by side
- ❌ Use vague labels: "OK", "Yes", "Confirm", "Click here", "Proceed"
- ❌ Use `aria-pressed` on Main or Destructive buttons
- ❌ Truncate a button label with ellipsis

### Components
- ❌ Use Tag when element is interactive — use Chip
- ❌ Use Chip when element is purely informational — use Tag
- ❌ Use Badge when label is text — use Tag
- ❌ Use same Tag variant for all tags in a list
- ❌ Make a Tag clickable
- ❌ Use SegmentControl for options with distinct content panels — use Tabs
- ❌ Replace SegmentControl with plain text or custom buttons
- ❌ Put a labeled `SearchBar` (label + helper row) in a filter bar — it must look like a bottom bar; use `variant="ghost"` with `aria-label`
- ❌ Make SegmentControl full-width in a filter bar or large container — it hugs content
- ❌ Set a fixed width on SegmentControl
- ❌ Use Checkbox when effect is immediate — use Switcher
- ❌ Use Switcher when effect requires confirmation — use Checkbox
- ❌ Use Radio for 7+ options — use Select
- ❌ Model multi-value toolbar filters as a single `Select` with an "All" sentinel empty option — use `PopoverMenu` with checkbox-cell items
- ❌ Nest `PopoverMenu` inside another `PopoverWrapper` for anchored multi-select filters — pass `anchorRef` on `PopoverMenu` instead
- ❌ Omit `showTrailingIcon: false` on checkbox-cell items in `PopoverMenu` filter menus when no trailing icon is needed
- ❌ Open a Modal from within a Modal
- ❌ Auto-open modals on page load
- ❌ Add `autoFocus` or manual focus refs on form fields to work around Modal initial focus — fix focus targeting in `Modal` instead
- ❌ Use Toast for actions requiring user response — use Modal
- ❌ Use ProgressRing when content shape is known — use SkeletonLoading
- ❌ Use Plain variant Button in `md` size — Plain is `sm` only
- ❌ Build hand-built HTML tables or native `<table>` markup when `DataTable` exists — custom tables don't inherit DS table tokens
- ❌ Skip the `render` prop and build a native table just because cells need Tag, ProgressBar, or AvatarGroup — use `render` instead
- ❌ Never add font-variant-numeric or manual number alignment CSS to DataTable cells — it's built into the column type
- ❌ Mount a separate `Button` beside `EmptyState` only to get primary vs secondary variant — use `showMainCta` and `showSecondaryOption`
- ❌ Reimplement board or in-column empty layouts with custom wrappers — use `EmptyState` and column constraints (`min-width: 0`, `max-width: 100%`)
- ❌ Hand-build kanban card layouts with plain divs — use `Card` header, body, and footer slots
- ❌ Use a flat neutral background for status-grouped kanban columns — tint column chrome with tag semantic surface tokens via `data-status`
- ❌ Show a status `Tag` on a kanban card when tasks are grouped into status columns — the column conveys status
- ❌ Create a parallel kanban board layout for detail views when a board pattern already exists for the entity type
- ❌ Leave empty kanban columns without a compact `EmptyState`
- ❌ Use `Toolbar variant="default"` on top of a list or section — use `variant="filter-bar"`
- ❌ Use a custom filter row for board views — use `Toolbar variant="filter-bar"` with the same slot structure as sibling list pages
- ❌ Build separate read-only detail panels for table rows vs board cards — wire all surfaces to the same `Drawer` + `DataListCell` pattern
- ❌ Add a new board column status without defining its full tag-token mapping for background, border, and title color
- ❌ Build a custom month/week/day/list calendar grid when `CalendarView` covers the use case
- ❌ Use `DateTimePicker` for a full scheduling calendar — use `CalendarView`
- ❌ Set `CalendarEvent.color` to dataviz, warning, error, or accent tokens without a contrasting text pairing
- ❌ Style `.fc-event-title` or `.fc-event-time` with selected-state or accent text tokens
- ❌ Add local CSS overrides on FullCalendar event classes to fix event legibility — use `CalendarView` defaults and the documented color API

### Icons and placeholders
- ❌ Use any icon library other than `lucide-react`
- ❌ Install a different `lucide-react` version than `ds-ngr` uses — keep them identical
- ❌ Leave placeholder icons, help text, or hint icons in place

### Forms
- ❌ Mark required fields with a red asterisk
- ❌ Enable primary CTA before all mandatory fields have a value
- ❌ Validate in real time as the user types (except: password strength, character count, search, OTP)
- ❌ Omit `⌘↵` shortcut from the primary submit button
- ❌ Omit `label` on `TextArea` — always provide a visible field label
- ❌ Pass `rows` to `TextArea` — use `minRows` instead

### Content
- ❌ Title case anywhere — always sentence case
- ❌ Use "Oops", "Uh oh" in empty or error states
- ❌ Use "Successfully" as a toast prefix
- ❌ Use "Are you sure?" as a modal title
- ❌ Show badge with count 0 — hide it entirely
- ❌ Show badge count above 99 — show "99+"
- ❌ Put interactive elements inside a Tooltip

### Accessibility
- ❌ Use color alone to convey meaning
- ❌ Use `:focus` for visible rings — always `:focus-visible`
- ❌ Use `outline: none` without an explicit replacement
- ❌ Leave disabled custom elements focusable
- ❌ Allow focus to reach elements inside closed disclosure components
- ❌ Allow focus to escape an open modal
- ❌ Show static (non-animated) skeleton shapes
- ❌ Replace skeleton placeholders one by one — replace all simultaneously

---

*Single source of truth for consuming DS-Ngr. Last updated: 2026-10-09.*
*Source files: `specs/foundations/`, co-located `src/components/**/<ComponentName>.spec.md`, shared `specs/atoms/`, `specs/molecules/`, `specs/organisms/`, `specs/patterns/`.*
{% endraw %}