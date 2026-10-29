# Color tokens

All colors must use CSS custom properties from `tokens.css`. Never hardcode hex values, rgba, or primitive tokens in components or layouts.

---

## Three-tier model — always follow this chain

```
Primitives (raw hex) → Semantic (intent) → Component (usage)
```

- Always use **semantic tokens** in components and layouts
- Never reference primitive tokens directly (e.g. never use `var(--primitive-neutral-900)`)
- Never hardcode hex values

---

## Token naming pattern

Semantic colors are `color/<aspect>/<role>[/<prominence>][/<state>]` in Figma; replace `/` with `-` for CSS. Four aspects — `background`, `foreground`, `border`, `shadow`. Roles, prominence and states come from the closed lists in `Design Tokens/vocabulary.json` (see `AGENTS.md` → "Naming convention").

```
color/background/interactive/primary/default → var(--color-background-interactive-primary-default)
color/foreground/neutral/primary             → var(--color-foreground-neutral-primary)
color/border/neutral/primary                 → var(--color-border-neutral-primary)
color/shadow/elevation/md                    → var(--color-shadow-elevation-md)
primitive/neutral/900                        → var(--primitive-neutral-900)   (Layer 1 — never in components)
button/background/primary/default            → var(--button-background-primary-default)   (Layer 3 — Button only)
```

---

## Text color tokens

| Token | Use |
|---|---|
| `var(--color-foreground-neutral-primary)` | Primary text, headings, high-emphasis labels |
| `var(--color-foreground-neutral-secondary)` | Secondary text, descriptions, metadata |
| `var(--color-foreground-neutral-tertiary)` | Placeholder text, "Optional" labels, lowest emphasis |
| `var(--color-foreground-interactive-disabled)` | Disabled element text |
| `var(--color-foreground-success-strong)` | Success state text |
| `var(--color-foreground-error-strong)` | Error state text |
| `var(--color-foreground-warning-strong)` | Warning state text |
| `var(--color-foreground-info-strong)` | Info / in-progress state text |
| `var(--color-foreground-interactive-destructive-default)` | Destructive action text (delete link) |

---

## Background tokens

| Token | Use |
|---|---|
| `var(--color-background-neutral-primary)` | Main page/component background |
| `var(--color-background-neutral-secondary)` | Second-level surfaces |
| `var(--color-background-neutral-tertiary)` | Third-level, lowest surface |
| `var(--color-background-neutral-soft)` | Translucent neutral wash — off toggle track |
| `var(--color-background-neutral-strong)` | Solid neutral fill that stands out from every surface (primary, secondary, tertiary, elevated) in both modes — avatars, neutral tags, toast |
| `var(--color-background-field-default)` | Input field fill (also `-hover`, `-active`) |
| `var(--color-background-accent-strong-default)` | Brand accent fill |
| `var(--color-background-interactive-disabled)` | Disabled element background |
| `var(--color-background-interactive-primary-default)` | Primary button default |
| `var(--color-background-interactive-primary-hover)` | Primary button hover |
| `var(--color-background-interactive-primary-active)` | Primary button active (pressed) |
| `var(--color-background-interactive-secondary-default)` | Default control default |
| `var(--color-background-interactive-secondary-hover)` | Default control hover |
| `var(--color-background-interactive-destructive-default)` | Destructive button default |
| `var(--color-background-interactive-destructive-hover)` | Destructive button hover |
| `var(--color-background-success-soft-default)` | Success state background |
| `var(--color-background-warning-soft-default)` | Warning state background |
| `var(--color-background-error-soft-default)` | Error state background |
| `var(--color-background-info-soft)` | Info / in-progress state background |
| `var(--color-background-interactive-primary-selected)` | Selected/active nav item, strong selection |
| `var(--color-background-interactive-secondary-selected)` | Subtle selected state |

**Rule: tokens that must look different never share a value.** A fill never equals a surface it can sit on, a hover never equals its default, an active never equals its hover, and a state ladder that changes in dark mode changes in full. `npm run audit:collisions` resolves every token per theme and fails CI on a violation. Mark a deliberate exception with `/* collision-ok: <reason> */`.

---

## Border tokens

| Token | Use |
|---|---|
| `var(--color-border-neutral-primary)` | Default borders, divider lines, separators |
| `var(--color-border-neutral-secondary)` | Subtle, translucent borders |
| `var(--color-border-interactive-default)` | Resting border of a control (input, select) |
| `var(--color-border-interactive-hover)` | Border on hover |
| `var(--color-border-interactive-disabled)` | Disabled element border |
| `var(--color-border-interactive-focus)` | Focus ring color |
| `var(--color-border-error-soft)` | Error state border on inputs |
| `var(--color-border-error-strong)` | Strong error border |
| `var(--color-border-interactive-primary-selected)` | Selected/active border |

---

## Data visualisation tokens

All chart and graph colors must use dataviz tokens. Never use generic semantic tokens or hex values for charts.

| Token | Use |
|---|---|
| `var(--color-background-dataviz-1)` | First categorical series |
| `var(--color-background-dataviz-2)` | Second categorical series |
| `var(--color-background-dataviz-3)` | Third categorical series |
| `var(--color-background-dataviz-4)` | Fourth categorical series |
| `var(--color-background-dataviz-5)` | Fifth categorical series |
| `var(--color-background-dataviz-6)` | Sixth categorical series |
| `var(--color-background-dataviz-7)` | Seventh categorical series |
| `var(--color-background-dataviz-8)` | Eighth categorical series |
| `var(--color-background-dataviz-positive)` | Positive/on-track values |
| `var(--color-background-dataviz-negative)` | Negative/error values |
| `var(--color-background-dataviz-warning)` | Warning/at-risk values |
| `var(--color-background-dataviz-neutral)` | Neutral/inactive values |

`positive`, `negative` and `warning` point at the green, red and yellow primitive ramps, so they follow a theme's feedback colors. Series 1–8 are literal per-mode values that a theme overrides per mode (theme configurator → Chart colors).

---

## Dark mode

Semantic tokens automatically resolve to the correct value for each theme. Control dark mode via `data-theme="dark"` on the root element — never via `@media (prefers-color-scheme: dark)`.

```tsx
// Correct
<div data-theme="dark">...</div>

// Wrong
@media (prefers-color-scheme: dark) { ... }
```

---

## Common mistakes

- `color: #09090B` ❌ → `color: var(--color-foreground-neutral-primary)` ✅
- `color: var(--color-foreground-neutral-primary)` ❌ — wrong token name. Use `var(--color-foreground-neutral-primary)`.
- `background: #00BBA7` ❌ → `background: var(--color-background-interactive-primary-default)` ✅
- `border-color: #232526` ❌ → `border-color: var(--color-border-neutral-primary)` ✅
- `var(--primitive-neutral-900)` ❌ — never use primitive tokens in components.
- `var(--background-tag-success)` ❌ — does not exist. Tag colors are managed internally by the `Tag` component.
