# Foundations

Foundations are the building blocks of DS-Ngr. They define the visual and interaction language that every component is built from. Where component docs describe what a component is and how to use it, foundations describe the underlying system those components are built on.

All values — hex codes, pixel sizes, spacing units — live in the token system. Foundations document the *intent* and *rules* behind those values, not the values themselves. This means the foundations remain correct even as the token values evolve.

**Never write a token you have not seen.** Every name below exists in `tokens.css`. A name that merely fits the grammar may not exist; check `tokens.css` or `ds-index.json`, and stop and ask if it isn't there.

### Token layers and tiers

Every token lives in one of three layers, and its first word says which:

| Layer | First word | Example | Who may use it |
|---|---|---|---|
| 1 · Primitive | `primitive` | `--primitive-neutral-900` | Only `tokens.css` |
| 2 · Semantic | a tier | `--color-foreground-neutral-primary` | Components and apps |
| 3 · Component | a component name | `--button-background-primary-default` | Only that component |

Semantic tokens belong to one of eight tiers. The tier is the first segment of the name, the aspect the second:

| # | Tier | Aspects | Covers |
|---|---|---|---|
| 1 | `color` | background, foreground, border, shadow | Every semantic color, including scrims and raw shadow colors |
| 2 | `font` | family, size, weight, line-height, letter-spacing | Typography |
| 3 | `space` | none — just the ladder (`none`, `3xs`–`3xl`) | Padding, margin, and gap |
| 4 | `size` | control, container, border (width), breakpoint | Control heights, container max-widths, border widths, breakpoints |
| 5 | `shape` | radius | Corner geometry |
| 6 | `effect` | shadow, blur, border (style), opacity | Composite and visual effects |
| 7 | `motion` | duration, ease, transition | Timing |
| 8 | `z-index` | roles directly | Stacking order |

Every word comes from the closed lists in `Design Tokens/vocabulary.json`, and every ordered scale uses one ladder: `none 3xs 2xs xs sm md lg xl 2xl 3xl full`. The full rules live in `AGENTS.md` → "Naming convention"; the old → new rename map is `scripts/token-grammar-map.mjs`.

---

## Colour

Colour is organised into **primitives** and **semantic tokens**. This hierarchy is what makes the system scalable, themeable, and AI-interpretable.

### Primitives and semantics

**Primitives** are the raw colour ramps — every available colour value in the system: `--primitive-neutral-*`, `--primitive-accent-*`, `--primitive-violet-*`, `--primitive-red-*`, `--primitive-green-*`, `--primitive-yellow-*`, `--primitive-alpha-dark-*`, `--primitive-alpha-light-*`. They are named for what they *are*. They are never used in components — they exist only to be referenced by semantic tokens, and a brand theme re-values them.

**Semantic tokens** are named for what they *mean*: `--color-<aspect>-<role>[-<prominence>][-<state>]`. A component that uses a semantic token follows every theme and dark mode without being changed itself.

### Roles

The role says *why* something is painted. Each role uses one kind of prominence:

| Role | Prominence | Use |
|---|---|---|
| `neutral` | `primary` `secondary` `tertiary` | Default surfaces, text and borders. Primary is the main page surface and the highest-emphasis text |
| `inverse` | `primary` `secondary` `tertiary` | Surfaces and text that flip against the page (dark on light, light on dark) |
| `fixed-dark`, `fixed-light` | `primary` `secondary` `tertiary` | Colours that stay the same in light and dark mode |
| `interactive` | `primary` `secondary` `destructive` | Anything the user operates. Takes states |
| `accent` | `strong` | The brand accent outside of controls |
| `success`, `error`, `warning` | `soft` `strong` | Feedback. Soft for fills, strong for text and solid fills |
| `overlay` | `soft` `strong` | Scrims behind dialogs and drawers |
| `elevated` | — | Raised surfaces (popovers, menus) — lighter than the page in dark mode |
| `transparent` | — | A fully transparent fill that still themes |

States are always last: `default` `hover` `active` `focus` `disabled` `selected`. A family with `hover` or `active` always has `default`.

### Key tokens

**Background** — `--color-background-*` → `background-color`
- `neutral-{primary|secondary|tertiary}` — page and component surfaces.
- `interactive-{primary|secondary|destructive}-{default|hover|active}` — control fills. `interactive-{primary|secondary}-selected` — selected fills (strong and soft). `interactive-disabled`.
- `{error|success|warning}-soft-{default|hover|active}` — feedback fills. `error-strong` — a solid critical fill.
- `accent-strong-{default|hover|active}`, `inverse-*`, `fixed-dark-*`, `fixed-light-*`, `overlay-{soft|strong}`, `elevated`, `transparent`.

**Foreground** — `--color-foreground-*` → `color`
- `neutral-{primary|secondary|tertiary}` — text by emphasis.
- `interactive-{primary|secondary|destructive}-{default|hover|active}` — links and text actions. `interactive-primary-selected`, `interactive-disabled`.
- `{error|success|warning}-strong` — feedback text. `accent-strong`, `inverse-*`, `fixed-*-primary`.

**Border** — `--color-border-*` → `border-color`, `outline-color`
- `neutral-{primary|secondary}` — dividers, card and section outlines.
- `interactive-{default|hover|disabled|focus}` — control borders. `interactive-destructive-focus`, `interactive-{primary|secondary}-selected`.
- `error-{soft|strong}`, `success-soft`, `warning-soft` — feedback borders.

Component colours (Button, Input, Tag, Toggle, Avatar) are Layer 3 tokens such as `--button-background-primary-default` and `--tag-background-success`. Only the component itself reads them; apps render the component instead.

### Colour rules

- **Never use primitive tokens in components.** Always use semantic tokens. If no semantic token fits, ask for one rather than reaching for a primitive.
- **Never use another component's tokens.** `--tag-background-success` is for Tag only; anything else uses `--color-background-success-soft-default`.
- **Colour alone must never convey meaning.** Any information communicated through colour must also be communicated through text, icon, or pattern.
- **Text on any background must meet WCAG AA contrast minimum** (4.5:1 for normal text, 3:1 for large text).
- **Feedback colours are not decoration.** Never use error, warning, or success tokens outside their semantic purpose.
- **Use overlay tokens for transparency.** Use `--color-background-overlay-*` rather than hardcoded rgba values.
- **Interactive states are used together.** A control that uses `-default` also implements `-hover` and `-active`.

---

## Typography

Typography is defined through `--font-*` tokens: size, weight, line height, letter spacing, and family. All typographic decisions reference these tokens — never hardcoded pixel or em values.

### Token structure

**Size** — `--font-size-*`
- `micro` — smallest text. Legal footnotes, helper annotations.
- `label` — form labels, component labels, table headers.
- `body-sm` — secondary body text. Descriptions, supporting content.
- `body-md` — primary body text. Main reading content.
- `display-sm` through `display-3xl` — display and heading text, from section titles to hero headings.

There is no `body-lg`: body text has two sizes.

**Line height** — `--font-line-height-*` — matches the size scale: `micro`, `label`, `body-sm`, `body-md`, `display-sm` through `display-3xl`.

**Weight** — `--font-weight-{regular|medium|semibold}`.

**Letter spacing** — `--font-letter-spacing-{tight|normal|wide|display}`.

**Family** — `--font-family-default` — the single font family used across the system.

### Type scale intent

- `display-*` sizes are for headings, titles, and prominent numbers. Size communicates hierarchy.
- `body-md` is for primary reading content. `body-sm` for supporting content.
- `label` is for short, functional text naming UI elements — not for extended reading.
- `micro` is for supplementary metadata where reducing visual noise matters more than readability.

### Typography rules

- **Use only tokens from the scale.** Never use an intermediate size. If a design requires a size between two scale steps, use the closer step.
- **Size expresses hierarchy — not emphasis.** To emphasise within body text, increase weight. Do not increase font size.
- **Dense metadata and timeline copy:** always use the `micro` size scale (`--font-size-micro`, `--font-line-height-micro`, and appropriate weight tokens) in consuming apps — never `--font-size-label` or hardcoded pixel font sizes for that role.
- **Text alignment is left by default.** Centre-align only short, isolated text (empty state titles, modal titles). Never centre long-form body text.
- **Line length:** constrain containers so body text lines don't exceed 70–80 characters. Wider lines reduce readability significantly.

---

## Spacing

Spacing tokens define all margin, padding, and gap decisions. `space` is its own tier with a single ladder and no aspects.

### The scale

`--space-none` (0), `--space-3xs` (2px), `--space-2xs` (4px), `--space-xs` (8px), `--space-sm` (12px), `--space-md` (16px), `--space-lg` (24px), `--space-xl` (32px), `--space-2xl` (48px), `--space-3xl` (64px).

The same scale covers padding, margin, and gap. There is no separate inset scale and no component-scoped spacing tokens — a button's padding is `var(--space-2xs) var(--space-xs)`, a table cell's is `var(--space-xs)`, a page's is `var(--space-md)`.

### Spacing rules

- **Never use arbitrary values.** All spacing decisions must use a step from the scale.
- **Consuming apps:** never use hardcoded pixel values for layout spacing when an equivalent `--space-*` step exists.
- **Spacing communicates relationship.** Elements that are more related should be closer together. More space = less related.
- **Density follows automatically.** Density themes (Compact, Comfortable, Spacious) re-value the scale, so components that read it resize together.

---

## Border radius (shape tier)

Radius tokens define the corner shape of components. All radius decisions use `--shape-radius-*` tokens — never hardcoded values.

> **Reserved — corner-shape (documentation only):** `shape` is reserved to eventually hold a corner-shape-driven categorical token (round/bevel/scoop/notch/squircle/superellipse), once the CSS `corner-shape` property has broader browser support than Chromium-only. Do not create any `--shape-corner-*` token now.

### Token structure

- `--shape-radius-{none|xs|sm|md|lg|xl|full}` — the ladder: 0, 4, 12, 16, 24, 32px and pill.
- `--shape-radius-control-{sm|md}` — controls (buttons, inputs, chips). Kept separate because Shape themes round controls differently from surfaces.
- Component radii are Layer 3: `--card-radius`, `--modal-radius`, `--popover-radius`, `--tooltip-radius`, `--tag-radius`, `--menucell-radius`, `--avatar-radius-organization`.

### Radius rules

- **Use the token, not a hardcoded value.** Every radius decision must reference a token.
- **Controls use the control radius.** Buttons, inputs and chips use `--shape-radius-control-md` (or `-sm` at the small size), so Shape themes reach them.
- **Nested surfaces use a smaller step.** An element inside a rounded card uses a smaller step than the card — the inner radius is always visually smaller than the outer.
- **Do not round structural layout elements.** Page sections, grid containers, and dividers use no border radius.

---

## Sizing

### Token structure

- `--size-{2xs|xs|sm|md|lg|xl|2xl}` — the size ladder for fixed element dimensions: 8 / 16 / 24 / 32 / 48 / 64 / 128px. It plays the same role for width and height that `--space-*` plays for gaps. Component dimension tokens alias it, never `--primitive-size-*`.
- `--size-control-{sm|md}` — control heights, aliasing `--size-sm` / `--size-md` (24 / 32px at default density). Density themes re-value them.
- `--size-container-{xs|sm|md|lg|xl}` — max-widths for contained content (192 / 256 / 320 / 480 / 1024px). `--size-container-height-min` — minimum height for a contained region.
- `--size-border-{sm|md|lg}` — border widths (1, 1.5, 2px). `--size-border-focus` — focus ring width. `--size-border-icon` — icon stroke width.
- `--size-breakpoint-{sm|md|lg|xl}` — 480 / 768 / 1280 / 1440px. Raw px only, because custom properties don't resolve inside `@media`.
- Component dimensions are Layer 3 and alias the ladders above: `--topbar-height`, `--toolbar-height`, `--sidebar-width-*`, `--section-header-height-*`, `--popover-width-*`, `--modal-width-max`, `--tag-height`, `--avatar-size-*`.

### Sizing rules

- **Use size consistently within a context.** All interactive controls in the same UI zone should share the same size variant.
- **Size propagates through composition.** When a button is at a particular size, its icon, label, and padding all respond to that size.
- **Do not use size as emphasis.** A larger button is not more important — a primary variant is. Size and variant are independent axes.
- **Touch targets must meet minimum accessible size** (44×44px) regardless of visual size.
- **Component dimensions belong to their component.** Never borrow `--topbar-height` or `--sidebar-width-*` for content layout.

---

## Effects

Effects cover shadows and blur. Values split by what they are: shadow **colors** are in the `color` tier (`--color-shadow-*`), composite `box-shadow` values are in the `effect` tier or belong to a component (`--button-shadow-*`), and blur radii are `--effect-blur-*`.

### Token structure

**Shadow colors** — `--color-shadow-*`:
- `--color-shadow-elevation-{sm|md|lg}` — Z-axis lift: cards and chips, dropdowns and tooltips, modals and popovers.
- `--color-shadow-inner-{dark|light}-{soft|strong}`, `--color-shadow-outer-{soft|strong}` — inner and outer shadow colors.
- `--color-shadow-focus-inset` — the gap ring inside a focus ring.

**Composite shadows** — ready-to-use `box-shadow` values owned by their component: `--button-shadow-{primary|secondary|destructive}-{default|hover}`, `--button-shadow-active`, `--button-shadow-focus`, `--input-shadow`, `--switcher-shadow-thumb`.

**Blur** — `--effect-blur-{sm|md|lg}` — light, standard and heavy background blur.

### Effects rules

- **Use the elevation token, not custom shadow values.** Consistent elevation levels communicate spatial hierarchy — one-off shadow values undermine it.
- **Elevation communicates Z-level.** Higher elevation = further from the base surface. Do not use `elevation-lg` on a surface that sits below other floating elements.
- **Blur is for atmosphere, not emphasis.** Blur on a background signals "this surface is behind something interactive" — it is not a decorative treatment.

---

## Focus states

Focus states are the visual indicator shown on an interactive element when it has keyboard focus. They are the primary navigation aid for keyboard users, switch device users, and anyone not using a pointer device.

### Focus tokens

- `--color-border-interactive-focus` — the focus ring colour. Applied to every interactive component.
- `--color-border-interactive-destructive-focus` — the focus ring for destructive actions (delete buttons).
- `--color-shadow-focus-inset` — the inner gap ring, so the focus ring stays visible on filled components.
- `--size-border-focus` — the ring width.

### Principles

**Always visible when needed.** Focus states must be clearly visible whenever an element has keyboard focus. Never suppress focus indicators.

**Never shown on click.** Focus states appear on keyboard interaction (`Tab`, arrow keys) but not on pointer click. Implemented via `:focus-visible`, never `:focus`.

**High contrast.** `--color-border-interactive-focus` is designed to pass WCAG AA non-text contrast (3:1) against standard surfaces.

**Consistent shape.** The focus ring follows the component's border radius.

### Focus styles by component type

**Buttons and filled components** — a ring in `--color-border-interactive-focus` with an inner gap in `--color-shadow-focus-inset`. The gap keeps the ring visible against any fill.

**Form inputs** — the input's border switches to `--color-border-interactive-focus` when focused.

**Destructive components** — use `--color-border-interactive-destructive-focus` to keep the focus ring consistent with the component's intent.

**Custom components** — any interactive element that is not a standard HTML element must implement a focus state manually, following the same visual language as the nearest standard component type.

### Implementation rules

- Always use `:focus-visible`, never `:focus`.
- Never use `outline: none` without providing an explicit replacement.
- Focus must never be hidden by `overflow: hidden` or clipping on a parent element.
- Focus order must follow logical reading order — top to bottom, left to right in LTR layouts.
- Interactive elements inside closed containers must not be keyboard-reachable until the container is open.

---

## Motion

Motion tokens control transition and animation durations. The `--motion-transition-*` family covers every timed state-change in the system — hover, focus, expand/collapse, enter/exit.

### Token structure

- `--motion-transition-instant` — 0ms. No perceptible delay.
- `--motion-transition-fast` — 150ms. Micro-interactions: hover, focus, color/background/border changes, icon rotation.
- `--motion-transition-normal` — 250ms. Content reveal: expanding regions, panel width/opacity.
- `--motion-transition-slow` — 400ms. Larger enter/exit animations (toast slide-in, backdrop fade).
- Component transitions are Layer 3: `--popover-transition` (150ms), `--switcher-transition` (150ms), `--drawer-transition` (250ms), `--modal-transition` (0ms, instant by design).

The durations alone are `--motion-duration-{instant|fast|normal|slow}`, and the curve is `--motion-ease-smooth`.

### Reduced motion is handled once, at the token layer

`prefers-reduced-motion: reduce` is handled globally in `tokens.css`: every transition token is overridden to `0ms` in a single `@media (prefers-reduced-motion: reduce)` block at `:root`. Because every animated component consumes these tokens via `var()` rather than a hardcoded duration, the override reaches every transition and animation in the system automatically.

**Components must never implement their own reduced-motion logic.** Do not add a component-level `@media (prefers-reduced-motion: reduce)` block to zero out a transition or animation — that duplicates a problem already solved globally. The only reason a component would ever need its own reduced-motion handling is a continuous, non-token-driven animation used purely as an ambient loading indicator (e.g. a skeleton shimmer) where the desired reduced-motion behavior is to slow the loop rather than stop it — that is a deliberate exception, not the default pattern.

### Motion rules

- **Always consume transition tokens via `var()`.** Never hardcode a duration (`0.2s`, `150ms`, etc.) directly in a component's `transition` or `animation` declaration — a hardcoded value bypasses the global reduced-motion override.
- **Pick the token by role, not by matching a specific millisecond value.** Use `sm` for micro-interactions, `md` for content reveal, `lg` for large enter/exit motion, and a component's own transition token for that component.
- **Never reintroduce per-component reduced-motion checks** for anything already driven by a transition token.

---

## Grid and layout

There are no grid tokens: the column count is a layout mechanic and is never tokenized. Page-level layout uses the upper end of the `--space-*` scale.

### Layout spacing

- Gap between the viewport edge and content: `--space-md` (built into AppShell).
- Gap between major page sections: `--space-xl` or `--space-lg`.
- Gap between form sections: `--space-lg` (section separation); between fields: `--space-md` (form-field rhythm).
- Gap within toolbars: `--space-md`.

### Contained content

Auth, onboarding, confirmation and settings pages cap their content column with `--size-container-xl` (1024px). Floating elements use their component's own width tokens (`--popover-width-*`).

### Layout rules

- **Consistent outer margins.** The distance from the viewport edge to the content area is defined by the layout system. Do not override per page.
- **Vertical rhythm is driven by spacing tokens.** All vertical distances between sections and groups use the `--space-*` scale.
- **Components fill column widths, not fixed pixel widths.** This makes layouts responsive without per-component media queries.
- **Alignment is left-anchored in LTR.** Centre-alignment is reserved for isolated components (empty states, success screens, full-page messages).
