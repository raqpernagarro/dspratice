# Spacing tokens

Never hardcode pixel values for spacing. Always use tokens from `tokens.css`.

---

## One scale — `space`

`space` is a tier with no aspects and no component tokens: padding, margin and gap all use the same t-shirt scale. There is no separate inset scale.

```css
/* Correct */
gap: var(--space-lg);                        /* between sibling elements */
padding: var(--space-xs) var(--space-sm);    /* inside a component */

/* Wrong */
gap: 16px;                           /* hardcoded — use var(--space-md) */
```

| Token | Value | Typical use |
|---|---|---|
| `var(--space-none)` | 0px | No gap / padding |
| `var(--space-3xs)` | 2px | Hairline gap, tightest padding |
| `var(--space-2xs)` | 4px | Icon-to-label, compact control padding |
| `var(--space-xs)` | 8px | Related items, standard control padding |
| `var(--space-sm)` | 12px | Compact gaps, moderate component padding |
| `var(--space-md)` | 16px | Standard gap; page, card, modal, drawer padding; grid gutter; form-field rhythm; toolbar gap |
| `var(--space-lg)` | 24px | Section separation, generous padding |
| `var(--space-xl)` | 32px | Large section gaps |
| `var(--space-2xl)` | 48px | Extra large gaps |
| `var(--space-3xl)` | 64px | Widest separation |

Density themes re-value this scale, so components that use it follow Compact/Comfortable/Spacious automatically.

---

## Grid

There are no grid tokens — the column count is a layout mechanic and is never tokenized. Gutters and horizontal grid margin use `var(--space-md)`.

---

## Radius tokens (shape tier)

Border-radius uses the **`shape`** tier (`--shape-radius-*`), split from `size` because radius is an independently themeable dial (a future roundness multiplier), the same justification that gives `motion` its own tier separate from `size`.

| Token | Value | Use |
|---|---|---|
| `var(--shape-radius-none)` | 0px | Sharp corners |
| `var(--shape-radius-2xs)` | 4px | Tooltips |
| `var(--shape-radius-xs)` | 8px | Organization avatars, small tiles |
| `var(--shape-radius-sm)` | 12px | Inputs, chips |
| `var(--shape-radius-md)` | 16px | Buttons, tags, controls |
| `var(--shape-radius-lg)` | 24px | Cards |
| `var(--shape-radius-xl)` | 32px | Modals |
| `var(--shape-radius-full)` | 9999px | Pills, avatars |

Controls use `var(--shape-radius-control-md)` / `-sm`, which Shape themes re-value separately from surfaces.

Component radii (`--tooltip-radius`, `--popover-radius`, `--card-radius`, `--modal-radius`) are Layer 3: the component applies them itself. In app code, render the component, or use the ladder step for your own surface (a card-like surface uses `var(--shape-radius-lg)`).

> **Reserved — corner-shape (documentation only):** `shape` is reserved to eventually hold a corner-shape-driven categorical token (round/bevel/scoop/notch/squircle/superellipse), once the CSS `corner-shape` property has broader browser support than Chromium-only. Do not create any `--shape-corner-*` token now.

---

## Breakpoints — raw px only

CSS custom properties do not resolve inside `@media` queries. Always use raw px values for breakpoints.

| Breakpoint | Value |
|---|---|
| Mobile | `480px` |
| Tablet | `768px` |
| Desktop | `1280px` |
| Desktop large | `1440px` |

```css
/* Correct */
@media (min-width: 768px) { ... }

/* Wrong — var() does not resolve in @media */
@media (min-width: var(--size-breakpoint-md)) { ... }
```

---

## Common mistakes

- `gap: var(--space-md)` ❌ — wrong family. Use `var(--space-md)`.
- `padding: var(--space-lg)` ❌ — wrong family. Use `var(--space-lg)`.
- `gap: 24px` ❌ — hardcoded. Use `var(--space-lg)`.
- `var(--space-standard)` ❌ — does not exist. Use `var(--space-sm)` (12px) or `var(--space-md)` (16px).
- `var(--inset-xlarge)` / `var(--size-inset-*)` ❌ — there is no inset scale. Use `var(--space-xl)` (32px) or the matching `--space-*` step.
- `var(--space-comfortable)` ❌ — does not exist. Use `var(--space-lg)` (24px).
