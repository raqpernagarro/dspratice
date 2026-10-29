# Canvas and layout

## The canvas

Every slide is authored at **1920×1080** (`frame-w` × `frame-h`) in literal pixels and scaled uniformly to fit, letterboxed on a near-black surround in present mode. Never use viewport units or breakpoints inside a slide.

## The frame

```
y=40    ┌─ Header ──────────────────────────────────────────────┐
        │ [logo]                     Studio | Presentation | 04  │  64px logo row
y=124   ├───────────────────────────────────────────────────────┤  divider (1px, 50%)
y=156   │ PageHeader: caption / title / subtitle      intro      │  content starts
        │                                                         │
        │ Body: cards, chart, table, photos …                     │
        │                                                         │
y=996   ├ ─ ─ ─ ─ ─ ─ ─ ─ ┬ ─ ─ ─ ─ ─ ─ ─ ─ ┬ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤  0.5px rules
        │ Presentation name │ Prepared for [Client] │  date   © 2026 │  Footer
y=1040  └───────────────────────────────────────────────────────┘
        x=40                                                x=1880
```

- Margin: `margin-x` 40px on all four sides (the v1 deck used 84px; v2 masters use 40px).
- Header: 84px (64px logo row, 20px padding, 1px divider). Content starts 32px below the divider.
- Footer: three equal columns, `space-24` apart, 20px top padding over a 0.5px `fg-50` rule.
- Inside the frame the body is a flex column with a 16px gap (`space-16`); card rows use `space-24` gutters.

## Grids the masters use

- **Halves**: the Core PageHeader and split layouts divide the 1840px content width into two equal columns 24px apart.
- **Thirds, quarters, fifths, sixths**: card rows and team rows divide the width into equal columns 24px apart.
- **680px heading block**: the default PageHeader heading, with the intro taking the remaining width 40px away.
- **Full-bleed**: photo slides and covers can run an image edge to edge, under the header.

## Rhythm across a deck

- Cover (dark) → index → chapter divider (dark) → content … → divider → content … → closing (dark).
- Don't put the same template on consecutive slides. Alternate text-led, visual-led and data-led slides.
- Keep a deck's header `name` and footer identical on every slide; `renderDeck` does this.
