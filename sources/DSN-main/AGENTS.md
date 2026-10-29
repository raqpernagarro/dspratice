{% raw %}
# DS-Ngr Component Library — Building Guide
<!--
Version: 1.1.2
Date: 2026-07-27
-->

> **READ THIS FIRST.** This file is the entry point for every coding session on the component library.
> Do not write any code until you have read and understood this document.
>
> **This file is for building components.** For component usage specs, layout rules, and
> navigation patterns when building apps *with* `ds-ngr`, read `AI.md` instead.

---

## Project Purpose

This is the React component library for **DS-Ngr**, an enterprise design system optimised for AI-agent code generation. The primary goal is machine-readable fidelity: components must implement exactly what the design system specifies, using exactly the tokens named in the documentation. No creative interpretation.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | React 18/19 + TypeScript (peer `^18.3.1 \|\| ^19.0.0`) |
| Build | Vite |
| Styling | Plain CSS per component (`<Name>.css`, `.dsn-*` classes + `data-*` attributes). Styled Components v6 only in `CalendarView.styles.ts` |
| Token consumption | CSS custom properties via `var()` |
| Documentation | Storybook 10 (CSF 3.0 + autodocs) |
| Testing | Vitest + Testing Library + Storybook play functions |

---

## Repository Structure

```
ds-ngr/
├── AGENTS.md                    ← You are here (building guide)
├── AI.md                        ← Usage guide (for consuming the package)
├── AI-short.md                  ← Condensed usage guide for context-limited tools
├── CLAUDE.md                    ← Claude Code pointer (redirects here)
├── README.md                    ← Project readme
├── tokens.css                   ← All design tokens as CSS custom properties
├── src/
│   ├── index.ts                 ← Public API — export all components
│   ├── styles/
│   │   └── global.css           ← Imports tokens.css, sets base styles
│   ├── components/
│   │   ├── atoms/
│   │   │   ├── Button/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Button.stories.tsx
│   │   │   │   ├── Button.test.tsx
│   │   │   │   └── index.ts
│   │   │   └── [other atoms...]
│   │   ├── molecules/
│   │   └── organisms/
│   └── types/
│       └── common.ts            ← Shared TypeScript interfaces
├── .storybook/
│   ├── main.ts
│   └── preview.tsx              ← Imports tokens.css globally
└── specs/                       ← Component and pattern specs (read-only)
    ├── accessibility-audit-2026-02-28.md
    ├── foundations/
    ├── atoms/
    ├── molecules/
    ├── organisms/
    └── patterns/
```

---

## Component Documentation

Component specs use a **hybrid layout**:

- **1:1 component specs** live next to source: `src/components/<tier>/<Folder>/<ComponentName>.spec.md`
- **Shared and cross-cutting specs** remain in `specs/<tier>/` (multi-component aggregates, form behavior, input anatomy)
- **`specs/patterns/`** and **`specs/foundations/`** are unchanged

Read the relevant spec **before** generating any component. For a single component, prefer its co-located `.spec.md`; fall back to shared `specs/` files when `ds-index.json` points there.

### Foundations

| File | Contents |
|---|---|
| `specs/foundations/foundations.md` | Token system overview, three-tier model, alias chain rules |
| `specs/foundations/colors.md` | Color token reference — semantic tokens, dataviz tokens |
| `specs/foundations/spacing.md` | Space scale, size, radius, breakpoints |
| `specs/foundations/typography.md` | Font size, weight, and line height token reference |

### Atoms

| File | Components covered |
|---|---|
| `src/components/atoms/Button/Button.spec.md` | Button (Main, Destructive) |
| `src/components/atoms/Button/ToggleButton.spec.md` | ToggleButton |
| `src/components/atoms/Button/VerticalButton.spec.md` | VerticalButton |
| `src/components/atoms/ButtonGroup/ButtonGroup.spec.md` | ButtonGroup |
| `src/components/atoms/ButtonGroup/ButtonGroupVertical.spec.md` | ButtonGroupVertical |
| `src/components/atoms/ButtonGroup/SplitButton/SplitButton.spec.md` | SplitButton |
| `src/components/atoms/Avatar/Avatar.spec.md` | Avatar, AvatarGroup |
| `src/components/atoms/Badge/Badge.spec.md` | Badge |
| `src/components/atoms/Tag/Tag.spec.md` | Tag |
| `src/components/atoms/Chip/Chip.spec.md` | Chip, ChipGroup |
| `src/components/atoms/Separator/Separator.spec.md` | Separator |
| `src/components/atoms/AspectRatio/AspectRatio.spec.md` | AspectRatio |
| `src/components/atoms/Switcher/Switcher.spec.md` | Switcher |
| `src/components/atoms/Checkbox/Checkbox.spec.md` | Checkbox |
| `src/components/atoms/Radio/Radio.spec.md` | Radio |
| `src/components/atoms/Tab/Tab.spec.md` | Tab (Navigation, Custom View) |
| `src/components/atoms/Tab/TabNav.spec.md` | TabNav (route links) |
| `src/components/atoms/CustomViewTab/CustomViewTab.spec.md` | CustomViewTab |
| `src/components/atoms/SegmentControl/SegmentControl.spec.md` | SegmentControl |
| `src/components/atoms/SegmentControl/SegmentControlSelector.spec.md` | SegmentControlSelector |
| `src/components/atoms/Pagination/Pagination.spec.md` | Pagination, PageSelector |
| `src/components/atoms/Pagination/PageSelector.spec.md` | PageSelector |
| `src/components/atoms/SectionHeader/SectionHeader.spec.md` | SectionHeader |
| `src/components/atoms/DataListCell/DataListCell.spec.md` | DataListCell |
| `src/components/atoms/DataTableCell/DataTableCell.spec.md` | DataTableCell (all Figma field types) |
| `src/components/atoms/DataTableHeaderCell/DataTableHeaderCell.spec.md` | DataTableHeaderCell |
| `src/components/atoms/MenuCell/MenuCell.spec.md` | MenuCell |
| `src/components/atoms/SearchBar/SearchBar.spec.md` | SearchBar |
| `src/components/atoms/UploadArea/UploadArea.spec.md` | UploadArea |
| `src/components/atoms/Attachment/AttachmentField/AttachmentField.spec.md` | AttachmentField |
| `src/components/atoms/Attachment/AttachmentChip/AttachmentChip.spec.md` | AttachmentChip |
| `src/components/atoms/Attachment/AttachmentCard/AttachmentCard.spec.md` | AttachmentCard |
| `src/components/atoms/Attachment/FileRow/FileRow.spec.md` | FileRow |
| `src/components/atoms/Attachment/FileThumbnail/FileThumbnail.spec.md` | FileThumbnail |
| `src/components/atoms/LoadingBar/LoadingBar.spec.md` | LoadingBar |
| `src/components/atoms/NumberInput/NumberInput.spec.md` | NumberInput |
| `src/components/atoms/OTPInput/OTPInput.spec.md` | OTPInput |
| `src/components/atoms/PasswordInput/PasswordInput.spec.md` | PasswordInput |
| `src/components/atoms/PasswordInput/PasswordRequirement.spec.md` | PasswordRequirement |
| `src/components/atoms/PhoneInput/PhoneInput.spec.md` | PhoneInput |
| `src/components/atoms/ProgressBar/ProgressBar.spec.md` | ProgressBar |
| `src/components/atoms/ProgressRing/ProgressRing.spec.md` | ProgressRing |
| `src/components/atoms/Shortcut/Shortcut.spec.md` | Shortcut |
| `src/components/atoms/SkeletonLoading/SkeletonLoading.spec.md` | SkeletonLoading |
| `src/components/atoms/Stat/Stat.spec.md` | Stat |
| `specs/atoms/forms.md` | Form behavior, required/optional field rules |
| `specs/atoms/input-anatomy.md` | Input anatomy (shared across all input types) |
| `src/components/atoms/TextInput/TextInput.spec.md` | TextInput |
| `src/components/atoms/TextArea/TextArea.spec.md` | TextArea |
| `specs/atoms/input-text-textarea-search.md` | SearchBar (shared search input patterns) |
| `specs/atoms/input-password-otp-number-phone.md` | PasswordInput, OTPInput, NumberInput, PhoneInput (legacy aggregate) |
| `src/components/atoms/Select/Select.spec.md` | Select |
| `src/components/atoms/Combobox/Combobox.spec.md` | Combobox |
| `specs/atoms/input-select-autocomplete-horizontal.md` | AutocompleteMulti, HorizontalInput (legacy aggregate) |
| `specs/atoms/input-slider-upload-chips.md` | Slider, UploadArea, ChipsInput (legacy aggregate) |
| `src/components/atoms/DateTimePicker/DateTimePicker.spec.md` | DateTimePicker (single date, range, with time) |
| `specs/atoms/lightweight-loading-scrollbar-shortcut.md` | Spinner, SkeletonLoading, ProgressBar, Scrollbar, Shortcut (legacy aggregate) |

### Molecules

| File | Components covered |
|---|---|
| `src/components/molecules/Breadcrumbs/Breadcrumbs.spec.md` | Breadcrumbs (`size="sm" \| "lg"`), BreadcrumbItem |
| `src/components/molecules/Accordion/Accordion.spec.md` | Accordion |
| `src/components/molecules/Callout/Callout.spec.md` | Callout |
| `src/components/molecules/Carousel/Carousel.spec.md` | Carousel, CarouselSlide |
| `src/components/molecules/CheckboxField/CheckboxField.spec.md` | CheckboxField |
| `src/components/molecules/ChoiceList/ChoiceList.spec.md` | ChoiceList |
| `src/components/molecules/EmptyState/EmptyState.spec.md` | EmptyState |
| `src/components/molecules/Fieldset/Fieldset.spec.md` | Fieldset |
| `src/components/molecules/Form/Form.spec.md` | Form |
| `src/components/molecules/HorizontalInput/HorizontalInput.spec.md` | HorizontalInput |
| `src/components/molecules/MultiChoice/MultiChoice.spec.md` | MultiChoice |
| `src/components/molecules/SingleChoice/SingleChoice.spec.md` | SingleChoice |
| `src/components/molecules/Slider/Slider.spec.md` | Slider |
| `src/components/molecules/Toast/Toast.spec.md` | Toast (Inline, Rich) |
| `src/components/molecules/Toolbar/Toolbar.spec.md` | Toolbar |
| `src/components/molecules/Tooltip/Tooltip.spec.md` | Tooltip |
| `src/components/molecules/SidebarMenuSelector/SidebarMenuSelector.spec.md` | SidebarMenuSelector |
| `src/components/molecules/BulkActionBar/BulkActionBar.spec.md` | BulkActionBar |
| `src/components/molecules/ChipField/ChipField.spec.md` | ChipField |
| `src/components/molecules/RichTextEditor/RichTextEditor.spec.md` | RichTextEditor |
| `src/components/molecules/PromptInput/PromptInput.spec.md` | PromptInput |
| `src/components/molecules/PromptInput/PromptInputModelSelector.spec.md` | PromptInputModelSelector (internal to PromptInput) |
| `src/components/molecules/PromptInput/VoiceWaveform.spec.md` | VoiceWaveform (internal to PromptInput) |
| `src/components/molecules/PopoverWrapper/PopoverWrapper.spec.md` | PopoverWrapper (portal + dismiss contract) |
| `src/components/organisms/PopoverMenu/PopoverMenu.spec.md` | PopoverMenu |
| `specs/molecules/popover.md` | Popover patterns (shared) |

### Organisms

| File | Components covered |
|---|---|
| `specs/organisms/appshell.md` | AppShell, Navbar, Sidebar — shared navigation patterns (legacy aggregate) |
| `src/components/organisms/AppShell/AppShell.spec.md` | AppShell |
| `src/components/organisms/Navbar/Navbar.spec.md` | Navbar |
| `src/components/organisms/Sidebar/Sidebar.spec.md` | Sidebar |
| `src/components/organisms/AlertDialog/AlertDialog.spec.md` | AlertDialog |
| `src/components/organisms/Card/Card.spec.md` | Card |
| `src/components/organisms/DataTable/DataTable.spec.md` | DataTable |
| `src/components/organisms/Drawer/Drawer.spec.md` | Drawer |
| `src/components/organisms/CalendarView/CalendarView.spec.md` | CalendarView |
| `specs/organisms/charts.md` | Charts family (AreaChart, BarChart, LineChart, DonutChart, HeatmapChart, etc.) |
| `src/components/organisms/Modal/Modal.spec.md` | Modal |
| `src/components/organisms/MediaViewer/MediaViewer.spec.md` | MediaViewer (lightbox) |
| `src/components/organisms/NotificationCenter/NotificationCenter.spec.md` | NotificationCenter (bell + inbox panel) |
| `src/components/organisms/Command/Command.spec.md` | Command, CommandDialog (+ CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator) |

### Patterns

| File | Contents |
|---|---|
| `specs/patterns/README.md` | Pattern index, shared component rules |
| `specs/patterns/dashboard.md` | Dashboard page assembly |
| `specs/patterns/data-page.md` | Data/list page assembly |
| `specs/patterns/kanban-board.md` | Kanban board page assembly |
| `specs/patterns/form-page.md` | Form page assembly |
| `specs/patterns/detail-drawer.md` | Detail drawer pattern |

### Page templates

`templates/*.jsx` are runnable reference pages (one per pattern, plus settings, sign-in and AI chat), listed in `templates/index.json`. The docs site renders them at `/templates`, Storybook under `Templates/`, and `npm test` mounts each one and checks it against the prototype rules (zero errors and warnings). When a pattern spec or a component API a template uses changes, update the template in the same change. Authoring rules: `templates/README.md`.

### Docs site and prototype routes

`site/` (Next.js) is the docs site and the prototype environment. Its AI routes share one tool set: `site/lib/mcp/tools.ts` (`TOOLS`) and the agent text in `site/lib/mcp/guide.ts` back both the MCP server (`/api/mcp`) and the in-site chat (`/api/chat`, own key / OpenRouter / company key). Add or change a tool or agent rule there, never in one route, so both stay identical. Browser-held keys reach `/api/chat` only in the `x-ai-key` header and must never be stored or logged. The company key is env-gated (`site/.env.example`) and stays off until the site is hosted with Nagarro sign-in.

### Accessibility

| File | Contents |
|---|---|
| `specs/accessibility-audit-2026-02-28.md` | Accessibility audit findings and requirements |

---

## Token System

### Where tokens live
All tokens are CSS custom properties defined in `tokens.css`. They are imported globally via `src/styles/global.css`. All component styles must consume tokens via `var(--token-name)`.

### Naming convention

**Never write a token you have not seen.** A name that fits the grammar is not proof that it exists — only `tokens.css` (or `ds-index.json`) is. If the token you need isn't there, stop and ask; say: "This token follows the grammar, but I cannot verify that it exists."

Every word in a token name comes from the closed lists in `Design Tokens/vocabulary.json`. A word that isn't listed is a fabrication. Figma variable names are `/` paths; replace `/` with `-` to get the CSS custom property (the collection is irrelevant):

```
Figma:  color/background/interactive/primary/default
CSS:    var(--color-background-interactive-primary-default)

Figma:  font/size/body/md
CSS:    var(--font-size-body-md)

Figma:  space/md
CSS:    var(--space-md)
```

Name shapes, one per layer:

| Layer | Shape | Example | Who may use it |
|---|---|---|---|
| 1 · Primitive | `primitive-<ramp>-<step>` | `--primitive-neutral-900`, `--primitive-size-16` | Only `tokens.css`. Never components or apps |
| 2 · Semantic | `<tier>-<aspect>-<role or step>[-<prominence>][-<state>]` | `--color-foreground-neutral-secondary`, `--color-background-interactive-primary-hover`, `--space-md` | Components and apps |
| 3 · Component | `<component>-<property>[-<variant>][-<state>]` | `--button-background-primary-active`, `--popover-radius`, `--sidebar-width-collapsed` | Only the component it is named after. Apps never use them |

Semantic color slots, always in this order:

- **Role** (why it is painted): `neutral` `inverse` `interactive` `accent` `success` `error` `warning` `overlay` `elevated` `transparent` `fixed-dark` `fixed-light` `dataviz`
- **Prominence** (optional, how loudly). Each role uses one kind, never both:
  - ranks `primary` `secondary` `tertiary`: neutral, inverse, fixed-dark, fixed-light
  - intensity `soft` `strong`: accent, success, error, warning, overlay
  - `primary` `secondary` `destructive`: interactive
- **State** (optional, always last): `default` `hover` `active` `focus` `disabled` `selected`. A family with `hover` or `active` always has `default`.

**One scale ladder** for every ordered size, duration, blur or elevation: `none 3xs 2xs xs sm md lg xl 2xl 3xl full`. Extend with numbers (`4xl`), never repeated letters (`xxl`) or words (`small`, `standard`, `large`). A step can be missing (`--font-size-body-lg` doesn't exist); check the inventory, don't assume the grid is complete.

**Banned words** (use the right-hand word): `pressed`→`active`, `danger`/`critical`→`error` or `destructive`, `inverted`→`inverse`, `feedback`→the role, `palette`→`primitive`, `standard`→`md`, `small`/`large`→`sm`/`lg`, `cta`→`interactive-primary`, `bg`→`background`, `text`→`foreground`. Full list: `Design Tokens/vocabulary.json` → `banned`.

`npm run audit:tokens` parses every name in `tokens.css` against the vocabulary and fails on any unknown or banned word.

### Three-layer model
```
Layer 1: Primitive   --primitive-neutral-900                 (tokens.css only)
Layer 2: Semantic    --color-foreground-neutral-primary      (components and apps)
Layer 3: Component   --button-background-primary-default     (that component only)
```

**Always use Layer 2 (semantic) tokens. Never reference Layer 1 (primitive) tokens in component styles; a component may also read its own Layer 3 tokens.**

### Eight token tiers

Every semantic token belongs to exactly one tier. The tier is the first segment of the name, the aspect (when the tier has aspects) is the second. Besides the tiers, only two other first words exist: `primitive` (Layer 1) and a component name (Layer 3, listed in `vocabulary.json`).

| # | Tier | Aspects it owns | Covers |
|---|---|---|---|
| 1 | `color` | `background`, `foreground`, `border`, `shadow` | Every semantic color, including scrims (`--color-background-overlay-*`) and raw shadow colors |
| 2 | `font` | `family`, `size`, `weight`, `line-height`, `letter-spacing` | Typography. A new typographic aspect goes here, not in a new tier |
| 3 | `space` | none — just the ladder | Padding, margin, and gap |
| 4 | `size` | `control`, `container`, `border` (width), `breakpoint` | Control heights, container max-widths, border widths, breakpoints |
| 5 | `shape` | `radius` | Corner geometry |
| 6 | `effect` | `shadow`, `blur`, `border` (style), `opacity` | Composite and visual effects that aren't a plain color or dimension |
| 7 | `motion` | `duration`, `ease`, `transition` (composite) | Timing |
| 8 | `z-index` | none — roles directly (`sticky` … `toast`) | Stacking order |

Rules:
- **Pick the tier by what the value is, not where it's used.** A shadow *color* is `--color-shadow-*`; a composite `box-shadow` is `--effect-shadow-*`; a border *width* is `--size-border-*`; a border *color* is `--color-border-*`.
- **`space` has no component tokens.** Components use the ladder directly (`padding: var(--space-xs) var(--space-sm)`). Never create `--space-button-*`, `--size-inset-*`, `--page-margin-*` or similar.
- **Component tokens start with the component name**, not a tier: `--button-background-primary-default`, `--sidebar-width-collapsed`, `--popover-radius`, `--input-shadow`. Only that component's own styles read them.
- The authoritative old → new map is `scripts/token-grammar-map.mjs` (the earlier 8-tier migration is `scripts/token-tier-map.mjs`). Migrate code with `node scripts/codemod-token-rename.mjs --map=grammar --root=<app>`.

> **Reserved — corner-shape (documentation only):** `shape` is reserved to eventually hold a corner-shape-driven categorical token (round/bevel/scoop/notch/squircle/superellipse), once the CSS `corner-shape` property has broader browser support than Chromium-only. Do not create any `--shape-corner-*` token now — there is no Figma variable for this yet.

### Key token families
- `--color-foreground-*` → CSS `color` property
- `--color-background-*` → CSS `background-color`
- `--color-border-*` → CSS `border-color`, `outline-color`
- `--color-shadow-*` → colors inside `box-shadow`
- `--color-{background|border|foreground}-dataviz-*` → all chart and data visualisation colors (series, axes, labels, backgrounds). Never use generic semantic tokens or hardcoded hex values for dataviz.
- `--font-size-*`, `--font-weight-*`, `--font-line-height-*`, `--font-letter-spacing-*` → typography
- `--space-*` → padding, margin and gap — one scale for all three
- `--space-md` → horizontal container padding (pages, cards, modals, drawers, tables, lists, form sections). Never hardcode `padding-inline` / `margin-inline`.
- `--size-<step>` → fixed element width/height (the size ladder, 2xs 8 → 2xl 128px), `--size-control-height-*` → control heights, `--size-container-*` → max-widths, `--size-border-*` → border-width
- `--shape-radius-*` → border-radius
- `--effect-shadow-*` → composite `box-shadow`, `--effect-blur-*` → blur radius
- `--<component>-*` → that component's own styles only (Layer 3)
- `--motion-duration-*`, `--motion-ease-*`, `--motion-transition-*` → transition
- `--z-index-*` → z-index

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

**Shape & Density modes.** The values above are the defaults: Figma `shape` mode **Rounded** and `density` mode **Default**. The Figma `size` collection aliases the `shape` and `density` collections (Square/Subtle/Rounded/Pill and Compact/Default/Comfortable/Spacious), and client themes from the Customize page re-value `--shape-radius-*` (including `--shape-radius-control-*`), `--space-*` and `--size-control-height-*`. So components must read these tokens and never hardcode radius, padding or control height, or they won't follow a theme's roundness or density. See `specs/foundations/figma-sync.md`.

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

**Grid** — there are no grid tokens: the column count is a layout mechanic and is never tokenized. Grid gutter and margin use `--space-md` (16px).

## Token invention rule

NEVER create CSS custom properties that do not correspond to a Figma
variable, and never use a word that isn't in `Design Tokens/vocabulary.json`.

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
- --font-size-heading-l / --font-size-heading-m / --font-size-heading-s
  → Do not exist. Use --font-size-display-sm (24px) through --font-size-display-3xl (60px).
- --font-size-body-m
  → Does not exist. Use --font-size-body-md (16px) or --font-size-body-sm (14px).
- --font-size-label-m / --font-size-label-l / --font-size-label-s
  → Do not exist. Use --font-size-label (14px).
- --font-weight-bold
  → Does not exist. Use --font-weight-semibold (600).
- --font-line-height-tight / --font-line-height-normal / --font-line-height-relaxed
  → Do not exist. Use scale-matched tokens: --font-line-height-body-md, --font-line-height-display-sm, etc.
- --text-primary / --text-secondary / --text-tertiary
  → Wrong prefix. Always --color-foreground-neutral-primary / --color-foreground-neutral-secondary / --color-foreground-neutral-tertiary.
- --background-tag-* (--background-tag-success, --background-tag-warning, etc.)
  → Do not exist. Tag colors are managed internally by the Tag component.
- --space-standard / --space-xlarge / --space-small / --space-medium / --inset-*
  → Do not exist. The space scale is t-shirt sized: --space-{none|3xs|2xs|xs|sm|md|lg|xl|2xl|3xl}.

---

## Component Generation Rules

### Rule 1: Props = Figma variant properties
Figma variant property names map directly to React prop names. Match them exactly.

```
Figma: Size=Medium, Variant=Primary, State=Default, Disabled=False, Loading=False
React: size="md" variant="primary" state="default" disabled={false} loading={false}
```

Size name mapping (Figma → prop value):
- `Small` → `"sm"`
- `Medium` → `"md"`
- `Large` → `"lg"`
- `xLarge` → `"xl"`
- `xxLarge` → `"2xl"`

Boolean props extracted from Figma booleans:
- `Disabled=True/False` → `disabled?: boolean`
- `Loading=True/False` → `loading?: boolean`
- `Selected=True/False` → `selected?: boolean`

State is internal — never accept `state` as a prop. States are expressed via pseudo-classes and boolean props only.

### Rule 2: TypeScript interfaces — explicit union types
Every prop that corresponds to a Figma variant must be a TypeScript union type (not `string`).

```typescript
// CORRECT
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'plain';
export type ButtonSize = 'sm' | 'md';

// WRONG
variant: string;
size: string;
```

### Rule 3: Component styles — tokens only, no hardcoded values
No hex codes, no pixel values, no hardcoded rgba. Everything comes from tokens.

```typescript
// CORRECT
background-color: var(--color-background-interactive-primary-default);
font-size: var(--font-size-body-md);
padding-inline: var(--space-md);

// WRONG
background-color: #6941C6;
font-size: 16px;
padding: 0 24px;
```

### Rule 4: State implementation
Interactive states use CSS pseudo-classes + `data-*` attributes. Never conditionally render different DOM elements for states.

```typescript
// Hover, press, focus — CSS pseudo-classes
&:hover:not(:disabled) {
  background-color: var(--color-background-interactive-primary-hover);
}
&:active:not(:disabled) {
  background-color: var(--color-background-interactive-primary-active);
}
&:focus-visible {
  outline: none;
  box-shadow: var(--button-shadow-focus); /* box-shadow, never outline — see Common Mistakes #3 */
}
&:disabled {
  opacity: 1; /* Never use opacity for disabled — use explicit disabled tokens */
  background-color: var(--color-background-interactive-disabled);
  color: var(--color-foreground-interactive-disabled);
  cursor: not-allowed;
}

// Selected state — controlled via prop → data attribute
const StyledButton = styled.button<{ $selected?: boolean }>`
  background-color: ${({ $selected }) =>
    $selected
      ? 'var(--color-background-interactive-primary-selected)'
      : 'var(--color-background-interactive-secondary-default)'
  };
`;
```

Use `$` prefix (transient props) for all Styled Components props that should not reach the DOM.

### Rule 5: Focus states — always `:focus-visible`, never `:focus`
```typescript
// CORRECT
&:focus-visible { outline: ... }

// WRONG
&:focus { outline: ... }
// NEVER
outline: none; /* without explicit replacement */
```

### Rule 6: Semantic HTML and ARIA
Every component must use the correct HTML element and ARIA attributes. The Figma file cannot express this — the component docs are the source of truth.

```typescript
// Buttons
<button type="button" disabled={disabled} aria-pressed={selected} aria-busy={loading}>

// Form inputs — every input is mandatory by default
// Render optional suffix via optional prop; no asterisk or consumer-injected required marker
<input
  type="text"
  id={id}
  aria-label={ariaLabel}
  aria-describedby={helpTextId}
  aria-invalid={error}
  aria-required={!optional}   // mandatory unless optional={true}
/>
<label htmlFor={id}>{label}{optional && <span className="dsn-text-input-optional"> (optional)</span>}</label>

// Loading state
aria-busy="true"
aria-label="Loading..."
```

### Rule 7: Storybook — story contract (CSF 3.0)
Every `*.stories.tsx` has the same shape, so Storybook and the docs site (which embeds the `Playground` story with a controls panel built from its enum and boolean `argTypes`) look the same for every component. `npm run audit:stories` enforces it in CI.

**Meta**
- `title`: `<Category>/<Component Name>`, where Category is one of `Actions`, `Inputs & Controls`, `Data Display`, `Feedback`, `Navigation`, `Overlays`, `Layout`, and every name segment is spaced Title Case (`Search Bar`, not `SearchBar`).
- `tags: ['autodocs']` and `parameters: specDocsParameters(spec)`, with `spec` imported from the co-located `<Component>.spec.md?raw`. Never hand-write `docs.description`.
- Layout: stories are centred globally (`.storybook/preview.tsx`). Never set `layout: 'centered'` in a story file. Fluid components with no width of their own set `parameters.storyWidth`: `'field'` (360 px) for form inputs and popover-width menus, `'container'` (560 px) for cards and bounded blocks, or `'full'` for rows and chrome that span the content area (list cells, section headers, tabs, toolbars, nav bars, linear progress). Only full-page components (App Shell, Sidebar, Data Table, Calendar View) use `layout: 'padded'` or `'fullscreen'`.
- Shared defaults go in meta `args`. Give every enum and boolean visual prop an `argType` with `options` in canonical order (smallest size first). Hide plumbing with `table: { disable: true }`.

**Stories, in this order, with these names**
1. `Playground`: always first, always args-driven, and never renamed with `name:`. Use `render: (args) => …` when a wrapper is needed (overlays, controlled inputs), but never `render: () => …`.
2. `Variants`: every `variant` side by side.
3. `Sizes`: every size side by side. Only when there is more than one size.
4. `States`: default, disabled, loading, error and selected, as the component supports them.
5. Optional fixed names: `WithIcons`, `Controlled`, and `KeyboardInteraction` / `Interaction` for play tests. `Playground` never has a `play` function, because the docs site embeds it.
6. Usage examples, named after the scenario (`InToolbar`, `FilterBar`).

**Never**
- Never write one story per prop value (`Determinate25`, `SmallOn`, `CollapsedLeftBorder`). That is a control on `Playground`, or a cell in `Variants`/`Sizes`/`States`.
- Never use `AllVariants`/`AllStates`/`SizeScale`/`Matrix`-style names. Use the shared names above.
- Never demo hover as a prop or story (`*Hover`). Hover is a CSS state.

```typescript
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';
import spec from './Button.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const meta: Meta<typeof Button> = {
  title: 'Actions/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: specDocsParameters(spec),
  args: { variant: 'primary', size: 'md', children: 'Button' },
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'ghost', 'plain'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
  },
};
export default meta;
type Story = StoryObj<typeof Button>;

export const Playground: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
      {(['primary', 'secondary', 'ghost', 'plain'] as const).map((v) => <Button key={v} {...args} variant={v} />)}
    </div>
  ),
};

export const KeyboardInteraction: Story = {
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button');
    await userEvent.tab();
    expect(button).toHaveFocus();
  },
};
```

### Rule 8: File structure — one directory per component
```
Button/
├── Button.tsx          ← Component implementation
├── Button.css          ← Component styles (tokens only)
├── Button.spec.md      ← Co-located spec, rendered in Storybook via ?raw
├── Button.stories.tsx  ← All stories for this component
├── Button.test.tsx     ← Unit tests
└── index.ts            ← Re-exports: export { Button } from './Button';
```

### Rule 9: Component generation order (atoms first)
1. **Button** (covers: Main, Destructive, Toggle, Vertical)
2. **Avatar** + **AvatarGroup**
3. **Badge**
4. **Tag**
5. **Chip** + **ChipGroup**
6. **Separator**
7. **Switcher**
8. **Checkbox**
9. **Radio**
10. **TextInput** (and shared Input anatomy)
11. **TextArea**
12. **SearchInput**
13. **Select**
14. **Slider**
15. **Tab** (Navigation + Custom View)
16. **SegmentControl**
17. **Breadcrumbs**
18. **Pagination**
19. **Toast**
20. **Tooltip**
21. **Popover**
22. **Modal**
23. Remaining input types (Password, OTP, Number, Phone, DateTimePicker, etc.)

### Rule 10: Dropdown/popover positioning contract
All dropdown/select/popover menus must use the shared anchored behavior (via `PopoverWrapper`):
- Always open popovers below the trigger, with a gap of `var(--space-2xs)`
- Flip above only when the content does not fit below **and** there is more room above
- When the content fits neither side, open on the roomier side
- Never let a popover overlap its own trigger — shrink it to fit the chosen side instead
- Always cap popover height at the smaller of `var(--popover-height-max)` and the space available on the side the popover opens on
- Always keep the popover header, segment, search and bottom bar pinned — only the content area scrolls
- Never set `max-height` or `overflow` on popover content in a consuming component — `PopoverWrapper` owns both
- Always move focus into anchored popovers with `focusWithoutScroll` — it keeps the focused item visible inside the content scroll area without moving the page
- Always use `scrollIntoPopoverView` to reveal an option without focusing it (e.g. the selected option while the search field holds focus)
- Never call `element.focus()` or `element.scrollIntoView()` directly on popover content — the panel is portaled to `document.body`, so both scroll the page, and focus is ignored while the panel is still being positioned
- Always show a search field in the popover search slot when a list has more than 10 items — `Select` does this automatically (`SELECT_SEARCH_THRESHOLD`, `searchable` overrides it); `PopoverMenu` needs `showSearch` set explicitly
- Viewport safe margin: `var(--space-md)` from all edges
- Horizontal clamping: keep popovers within safe viewport bounds
- Width contract: match trigger width with a minimum popover width of `192px`
- Overflow behavior: truncate menu labels when width is constrained
- Outside-click dismiss: anchored panels portal to `document.body`; dismiss handlers MUST use `isPointerInsideAnchoredPopover` with the wrapper `id` — never `rootRef.contains(target)` alone. See `src/components/molecules/PopoverWrapper/PopoverWrapper.spec.md`.

Do not implement one-off absolute positioning per component. Reuse the shared `PopoverWrapper` contract for `Select`, `PhoneInput`, `DateTimePicker`, and future menu triggers.

> **Figma gap:** `--popover-height-max` is css-only. It still needs a matching Figma variable (`size/popover/height-max`); create it in Figma and drop the `/* css-only */` marker in `tokens.css` once it exists.

### Rule 11: Accessibility guardrails and CI gates
Every contribution must preserve accessibility contracts:
- For custom-role widgets (`menuitem`, `switch`, `checkbox`, `radio`, `slider`, `tab`, `gridcell`), add/maintain at least one keyboard interaction test.
- Disabled components must not be focusable (`disabled` for native controls; otherwise `tabIndex={-1}` + `aria-disabled="true"`).
- Nested interactive controls inside clickable rows must stop propagation so child actions do not trigger parent actions.
- Focus rings must be implemented with `:focus-visible` (never `:focus` as the visible focus trigger).
- Popup/dropdown tests must cover Arrow keys, Enter/Space selection, Escape close, and focus return to trigger.
- `Modal` open tests must assert initial focus lands on the first focusable element inside `.dsn-modal-content`, with fallback to the first focusable element anywhere in the dialog when the content area has none.

Storybook signal-quality policy:
- Disabled/demo-only stories may use `parameters: { a11y: { disable: true } }` for intentional exceptions.
- Keep a11y opt-outs story-scoped only; never disable at component meta/global level for interactive components.

CI enforcement:
- Run `npm run test:a11y:keyboard-widgets`.
- Run `npm run test:a11y:stories:light`.
- Run `npm run test:a11y:stories:dark`.

### Rule 12: Icons — Lucide only
The only permitted icon library is `lucide-react`. Never use browser/OS-native icons, emoji, or any other icon library anywhere in the component library.

```typescript
// CORRECT
import { ArrowUpDown, X, Check } from 'lucide-react';

// WRONG
// Any icon not from lucide-react
// System/OS native icons (e.g. ↕ ⬆ ⬇)
// Emoji used as icons
```

### Rule 13: Placeholder content — never leave it in place
Component slots for icons, help text, and hint icons must never ship with placeholder values.
Either populate with real, meaningful content or hide the slot entirely.

- **Icons** → replace with a relevant Lucide icon, or omit the slot
- **Help text** → replace with genuinely useful guidance, or omit
- **Hint icons** → replace with meaningful tooltip content, or omit
- Never ship generic placeholder text like "Content slot" in story demos; use contextual placeholder text based on the field title.

### Rule 14: Form behavior
- Every form field is **mandatory by default**. Input components render the `(optional)` suffix themselves via the `optional` prop (`var(--color-foreground-neutral-tertiary)`); consumers must not hand-compose optional spans.
- No input component may expose an API that renders an asterisk, a required marker, or allows consumers to inject a required marker.
- The primary submit CTA must be **disabled** until all mandatory fields contain a value.
- Validate all fields on submit only — not in real time as the user types.
  - Exceptions: password strength, character count limits, search/filter fields, OTP.
- The primary submit button must always display the `⌘↵` shortcut via Button's `shortcut` / `shortcutLabel` / `shortcutAriaLabel` props (renders `Shortcut` internally).

```tsx
// CORRECT — optional field (component renders suffix)
<TextInput label="Team" optional />

// CORRECT — primary submit button
<Button variant="primary" shortcut shortcutLabel="⌘↵" shortcutAriaLabel="Command Enter">Add user</Button>

// WRONG — asterisk or manual optional span (forbidden in components and consuming apps)
<label>First name *</label>
<label>Team <span style={{ color: 'var(--color-foreground-neutral-tertiary)' }}>Optional</span></label>
```

---

## Accessibility Requirements

- WCAG AA minimum: 4.5:1 contrast for normal text, 3:1 for large text
- All interactive elements must be keyboard operable
- Focus order must follow logical reading order (top to bottom, left to right)
- Colour alone must never convey meaning — pair with text, icon, or pattern
- Every form input must have an associated `<label>` (visible or `aria-label`)
- All inputs carry `aria-required="true"` by default unless `optional={true}`. Components render the optional suffix via `optional` only — no visual asterisk or required marker.
- Loading states must use `aria-busy="true"` and a descriptive `aria-label`
- Disabled elements must NOT be focusable (use `disabled` attribute on native elements, `tabIndex={-1}` + `aria-disabled="true"` on custom elements)
- Closed disclosure components (Accordion, Popover, Dropdown) must not expose their children to keyboard focus until open
- When `Modal` opens, always focus the first focusable element inside `.dsn-modal-content` so form fields receive initial focus instead of header controls such as the close button
- If `.dsn-modal-content` has no focusable elements, fall back to the first focusable element anywhere in the dialog

---

## Writing conventions

UI copy is part of the component contract. Storybook demos, prop descriptions, JSDoc, help text, and placeholder content must all follow these rules. An agent that writes sloppy demo copy teaches consuming agents to write sloppy copy.

### Sentence case everywhere
All labels, headings, actions, and messages use sentence case. Never title case.

```
✅ Add team member
❌ Add Team Member

✅ No results found
❌ No Results Found
```

### Buttons and actions — verb first, object second
Use the imperative form. Include the object when the context alone does not make it clear.

```
✅ Save changes        ✅ Delete project       ✅ Invite member
✅ Save                ✅ Delete               ✅ Invite
❌ Changes saved       ❌ Project deletion     ❌ Member invitation
```

Omit filler phrases. Never use "in order to", "please", "click here", or "successfully".

### Labels and headings — noun phrases, no verbs
Field labels and column headings name the thing, they do not instruct.

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

Never apologise in error messages. "Sorry" and "unfortunately" add length without adding clarity.

### Empty states — task-oriented, one sentence
State what the user can do here, not what is absent.

```
✅ No tasks yet. Create one to get started.
✅ Nothing here. Add a project to see it listed.
❌ There are no items to display.
❌ This list is empty.
```

### Help text and tooltips — outcome, not mechanics
Describe the result or purpose, not the interaction. Keep to one sentence.

```
✅ Used to notify team members when the task is overdue.
✅ Visible to all members with project access.
❌ Click to toggle this option on or off.
❌ This field controls the setting for notifications.
```

### Placeholder text — contextual, not generic
Input placeholders must match the field's purpose. Never use "Enter value", "Type here", or lorem ipsum.

```
✅ Search by name or email
✅ e.g. Q3 planning
❌ Enter text
❌ Lorem ipsum
```

---

## Common Mistakes to Avoid

1. **Using primitive tokens in components.** `var(--primitive-neutral-900)` in a component style is wrong. Use `var(--color-foreground-neutral-primary)`.
2. **Using `:focus` instead of `:focus-visible`.** Always `:focus-visible`.
3. **Rendering the focus ring with `outline` instead of `box-shadow`.** Focus rings are implemented with `box-shadow`, never `outline`. Use: `box-shadow: var(--button-shadow-focus);` Never use `--color-shadow-focus-inset` on its own — it resolves to the page background and is the gap of the two-part ring, so a ring drawn only in that color is invisible. Reason: AppShell, DataTable's scroll region, Drawer, and Popover all rely on `overflow: hidden` for scroll isolation (see AppShell — height chain requirement section). An outline-based ring gets clipped by any `overflow: hidden` ancestor; box-shadow does not.
4. **Hardcoding hex values or pixel sizes.** Everything comes from tokens.
5. **Accepting `state` as a prop.** States are pseudo-classes + boolean props, not a state prop.
6. **Omitting aria attributes.** Always add ARIA from the component docs.
7. **Not exporting from `index.ts`.** Every component needs `export { X } from './X'` in its own index.ts, and re-exported from `src/index.ts`.
8. **Using opacity for disabled state.** Use explicit disabled tokens (`--color-background-interactive-disabled`, `--color-foreground-interactive-disabled`). Never `opacity: 0.5`.
9. **Passing styled props directly to DOM.** Always use transient props (`$propName`) in Styled Components to prevent DOM attribute forwarding.
10. **Using asterisks or manual optional spans for required/optional fields.** Mandatory by default; use the `optional` prop so the component renders `(optional)` in `var(--color-foreground-neutral-tertiary)`. No component API may render an asterisk or accept a consumer-injected required marker.
11. **Leaving placeholder icons, help text, or hint icons in components.** Replace with real content or hide the slot entirely.
12. **Using icons from any library other than Lucide.** Only `lucide-react` is permitted. No system icons, no emoji, no other libraries.
13. **Hardcoding horizontal padding instead of `var(--space-md)`.** All horizontal container spacing must use this token.
14. **Enabling the primary CTA before all mandatory fields have a value.** The submit button must be disabled until the form is fillable.
15. **Omitting `⌘↵` from the primary form submit button.** Always set `shortcut shortcutLabel="⌘↵" shortcutAriaLabel="Command Enter"` on the primary CTA.
16. **Using dataviz colors from generic semantic tokens or hardcoded hex.** Always use `--color-{background|border|foreground}-dataviz-*` tokens for all chart and graph colors.
17. **Adding spacing overrides directly to components.** Never add `padding`, `margin`, `gap`, or any spacing property directly on a DS-Ngr component element. All components have their internal spacing built in. To space components relative to each other, apply `--space-*` tokens only to wrapper or container elements.
18. **Shipping CalendarView without legible default event styles.** Always style `.fc-event-title` and `.fc-event-time` with primary text on a neutral event surface. Never use selected-state or accent text tokens for event labels in `CalendarView.styles`.
19. **Requiring consuming apps to patch FullCalendar CSS.** Event contrast and label legibility are owned by `CalendarView` styles and the `CalendarEvent` color API — never document or ship a pattern that expects app-level overrides on `.fc-event*` classes.
20. **Mapping `CalendarEvent.color` without a text contract.** `color` maps to FullCalendar `backgroundColor` and `borderColor` only. Document and implement either default neutral chips with primary text, or explicit `textColor` pairing when fills use semantic, accent, or dataviz tokens.
21. **Letting consumers use dataviz or status tokens as sole event fills.** Never imply that `warning`, `error`, accent, or `--color-{background|border|foreground}-dataviz-*` values alone produce readable events.
22. **Using fabricated token names.** See the full list in "Known fabricated token patterns to reject" above. Common ones: `--font-size-heading-l`, `--font-size-body-m`, `--font-weight-bold`, `--text-primary`, `--background-tag-*`, `--space-standard`, `--inset-standard`.
23. **Omitting `showTrailingIcon: false` on `checkbox-cell` items in `ChoiceList`/`PopoverMenu` when no trailing icon is needed** — `Checkbox` defaults `showTrailingIcon` to true and renders a placeholder trailing icon; always set both `showLeadingIcon: false` and `showTrailingIcon: false` in stories and filter-menu item props.
24. **Hardcoding a transition duration instead of using a `--motion-transition-*` token** — this breaks the global `prefers-reduced-motion` override.
25. **Focusing header controls when a Modal with form content opens.** Always target the first focusable element inside `.dsn-modal-content`; fall back to the first focusable element anywhere in the dialog only when the content area has none. Never document or expect consuming apps to add `autoFocus` or manual focus refs as a workaround.

---

## CalendarView — builder rules

Read `src/components/organisms/CalendarView/CalendarView.spec.md` before changing `CalendarView`.

- Always ship default event chrome so title and time use primary text on a neutral event surface without app CSS.
- Never style `.fc-event-title` or `.fc-event-time` with selected-state or accent text tokens in the organism.
- Always document in the component spec and types how `CalendarEvent.color` maps to FullCalendar (`backgroundColor`, `borderColor`) and when `textColor` is required.
- Never require consuming apps to add local CSS overrides for event legibility.
- When extending the event color API, either set contrasting `textColor` in `toFullCalendarEvent` or restrict `color` to subtle indicators (e.g. border) with fills staying on the neutral surface.

---

## AppShell — height chain requirement

`AppShell` uses `height: 100%` internally. For scroll isolation to work (sidebar and navbar stay fixed, only main content scrolls), the height chain must be unbroken from `html` down to `AppShell`.

Consumers must import `ds-ngr/global.css` (published from `src/styles/global-consumer.css`) for `html, body { height: 100% }`, `box-sizing: border-box`, and base typography. `style.css` is component CSS only. You must also ensure `#root` and any wrapper `<div>` around `<AppShell>` have `height: 100%`.

✅ Do:
```css
/* In your app's global CSS */
#root {
  height: 100%;
}
```
```tsx
// Wrapper div must have height: 100%
<div style={{ height: "100%" }}>
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

## Agent process rules

Canonical home for cross-session process rules learned from audits, triage, and tooling work. Consumer-facing rules stay in `AI.md`; component contracts stay in co-located `*.spec.md` files.

### Session hygiene

- **Reports open with `git status`** — every audit, triage, recap, or patrol report includes the current working tree status at the top so the maintainer sees what is in scope.
- **Definition of done** — full Vitest suite green (`npm test`) unless the session is explicitly read-only (see below). A red `main` branch suspends definition-of-done for every other session until triage restores green; triage jumps the queue ahead of feature or doc work.
- **Read-only / audit sessions** — when the task is documentation-only or audit-only and the suite is not run, the report must state explicitly why (e.g. "no source changes", "audit scope is docs/ only", "suite deferred to follow-up triage").
- **Commit messages** — agents write descriptive commit messages in complete sentences that state why the change exists, not only what files changed.

### ds-index.json integrity

- **Inclusion follows `src/index.ts` value exports** — `ds-index.json` lists only components exported as public values from `src/index.ts`. The generator (`scripts/generate-index.mjs`) parses that file; it does not scan component folders for `export function`.
- **Internal sub-components never appear in the index** — components in `INTERNAL_SUB_COMPONENTS` (e.g. `PageSelector`, `PasswordRequirement`, `SegmentControlSelector`) may have co-located specs but are intentionally excluded from the public index.
- **Enforcement is CI, not documentation** — `npm run check:index` (`scripts/check-index.mjs`) fails when the committed `ds-index.json` drifts from the generator. Regenerate with `npm run index:generate`. Do not hand-edit component rows to "fix" the index.

### Test triage

- **"Pre-existing failure" is a claim to verify** — never assume a red test predates your work. Identify the introducing commit (bisect or `git log` on the failing file) before classifying as stale test vs component regression.
- **Stale tests asserting accessibility affordances** — do not delete or invert an accessibility test without explicit maintainer sign-off. Updating the test to match a deliberate contract change is allowed when an **equivalent replacement path** exists (e.g. Delete key replacing a mouse-only remove button). Removing the affordance entirely without a replacement path is not a test fix — it is a product/accessibility regression.
- **Prefer `userEvent` over `fireEvent`** — interaction tests use `@testing-library/user-event` (`userEvent.setup()`, `await user.click()`, `await user.keyboard()`). Reserve `fireEvent` for cases `userEvent` cannot model (e.g. drag-and-drop, pointer capture on `window`).

### Documentation and audits

- **Canonical home** — builder process rules → `AGENTS.md`; consumer rules → `AI.md`; component behaviour → co-located `src/components/**/<ComponentName>.spec.md`; shared cross-cutting topics → `specs/<tier>/`. Derived files (`AI-short.md`, `src/docs/AI-Consumer-Guide.mdx` via `?raw`, `Patterns.mdx`) are synced by audit, not edited directly for new rules.
- **Duplicated-rule detector** — when the same rule appears in multiple spec files, one canonical home wins. Co-located 1:1 specs override legacy copies under `specs/<tier>/`. Run `skills/ds-doc-audit/SKILL.md` (command: `ds-doc-audit`) after rule changes; zero inconsistencies is the target.
- **Token audit checks values, not just names** — `ds-doc-audit` Step 2e validates `var(--…)` references against `tokens.css`. `scripts/audit-token-drift.mjs` compares JSON ↔ CSS values. A token name that resolves incorrectly is a failure even if the name exists.

### Token drift exceptions

- **`CSS_ONLY_EXCEPTIONS`** (`scripts/audit-token-drift.mjs`) — CSS custom properties present only in `tokens.css` for backward compatibility. Every entry requires a comment justifying divergence from the Figma JSON source (deprecated alias, publish compat, pending Figma sync). Do not add exceptions without maintainer rationale.

### Accessibility process

- **WCAG 2.5.7 vs 2.1.1** — dragging movements require a **single-pointer non-drag** alternative (click menu, pick-up/drop clicks, etc.). Keyboard paths satisfy **2.1.1 only** and are never evidence for **2.5.7**. Full evaluation rule: `skills/ds-a11y-audit/SKILL.md` (`name: ds-a11y-patrol`). Run that skill after interactive pattern changes.

### Agent skills (versioned source)

- Command/skill definitions live in `skills/<command>/SKILL.md` (versioned source). Run `npm run sync:skills` to regenerate derived files at `.claude/commands/<command>.md`. `prepare` runs sync on `npm install`. **Never edit `.claude/commands/` directly** — local `.claude/` state (settings, worktrees) is derived and gitignored. Verify with `npm run check:skills`.

---

## Scripts and automation

- `generate-index.mjs` hardcodes component variant arrays — these must be updated manually whenever a component's variant type changes. The WARNING comment in the script marks the affected block.
- `check:index` / `check:skills` — CI gates for `ds-index.json` and agent skill sync; see [Agent process rules](#agent-process-rules).

---

## Before Starting Each Component

1. Read the component's spec — co-located `src/components/<tier>/<Folder>/<ComponentName>.spec.md` when it exists; otherwise the shared path in `specs/<tier>/` (see tables above or `ds-index.json`)
2. Identify all Figma variants → TypeScript props
3. Identify all tokens needed (colour, typography, spacing, sizing)
4. Implement component → stories → tests in that order
5. Export from component `index.ts` and from `src/index.ts`

---

*Source of truth for building DS-Ngr components. Last updated: 2026-10-09.*
{% endraw %}