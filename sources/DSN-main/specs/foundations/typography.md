{% raw %}
# Typography tokens

Never hardcode font sizes, weights, or line heights. Always use tokens from `tokens.css`. Never set `font-family` — it is inherited from the design system globally.

---

## Font size tokens

| Token | Value | Use |
|---|---|---|
| `var(--font-size-micro)` | 12px | Dense metadata, timestamps, captions, secondary copy |
| `var(--font-size-label)` | 14px | Form labels, button text, component labels |
| `var(--font-size-body-sm)` | 14px | Small body text |
| `var(--font-size-body-md)` | 16px | Primary body text, descriptions |
| `var(--font-size-display-sm)` | 24px | Small display headings |
| `var(--font-size-display-md)` | 32px | Medium display headings |
| `var(--font-size-display-lg)` | 40px | Large display headings |
| `var(--font-size-display-xl)` | 48px | Extra large display |
| `var(--font-size-display-2xl)` | 52px | 2x large display |
| `var(--font-size-display-3xl)` | 60px | 3x large display |

---

## Line height tokens

| Token | Pairs with |
|---|---|
| `var(--font-line-height-micro)` | `--font-size-micro` |
| `var(--font-line-height-label)` | `--font-size-label` |
| `var(--font-line-height-body-sm)` | `--font-size-body-sm` |
| `var(--font-line-height-body-md)` | `--font-size-body-md` |
| `var(--font-line-height-display-sm)` | `--font-size-display-sm` |
| `var(--font-line-height-display-md)` | `--font-size-display-md` |
| `var(--font-line-height-display-lg)` | `--font-size-display-lg` |
| `var(--font-line-height-display-xl)` | `--font-size-display-xl` |
| `var(--font-line-height-display-2xl)` | `--font-size-display-2xl` |
| `var(--font-line-height-display-3xl)` | `--font-size-display-3xl` |

Always pair a font size token with its matching line height token.

---

## Font weight tokens

| Token | Value | Use |
|---|---|---|
| `var(--font-weight-regular)` | 400 | Body text, descriptions |
| `var(--font-weight-medium)` | 500 | Labels, emphasized body text |
| `var(--font-weight-semibold)` | 600 | Headings, strong emphasis |

---

## Dense metadata — micro scale

For timestamps, secondary metadata, and timeline-style copy, always use the micro scale:

```tsx
<div style={{
  fontSize: 'var(--font-size-micro)',
  lineHeight: 'var(--font-line-height-micro)',
  fontWeight: 'var(--font-weight-regular)',
  color: 'var(--color-foreground-neutral-secondary)',
}}>
  Last updated 2 hours ago
</div>
```

Never use `--font-size-label` for dense metadata — use `--font-size-micro`.

---

## Content rules

- All UI text: sentence case always. "New project" not "New Project".
- Button labels: verb-first, 1–3 words. "Save changes" not "Changes saved".
- Never set `font-family` — inherited from the design system.
- Never use raw `<h1>`–`<h6>` or `<p>` with custom font styling.
- Never set `font-size` with raw pixel values.

---

## Common mistakes

- `var(--font-size-heading-l)` ❌ — does not exist. Use `var(--font-size-display-sm)` (24px).
- `var(--font-size-body-m)` ❌ — does not exist. Use `var(--font-size-body-md)` (16px).
- `var(--font-size-label-m)` ❌ — does not exist. Use `var(--font-size-label)` (14px).
- `var(--font-weight-bold)` ❌ — does not exist. Use `var(--font-weight-semibold)` (600).
- `var(--font-line-height-tight)` ❌ — does not exist. Use the scale-matched token e.g. `var(--font-line-height-display-sm)`.
- `font-size: 16px` ❌ — hardcoded. Use `var(--font-size-body-md)`.
- `font-family: 'Inter', sans-serif` ❌ — never set font-family. It is inherited.
{% endraw %}
