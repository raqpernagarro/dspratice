# Colour

The colour tokens here are exactly the Figma variables of the Master Slides file: the **Theme** collection, in its Light and Dark modes, and the **Colors** primitives it points to. The palette is neutral first, ink and white, with mint as the single signature accent.

A slide's `theme` decides which mode it renders with. On this page the theme switch does the same for every preview: **Dark slide** renders every master dark, **Light slide** shows each master in its own theme.

## Theme (use these)

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `fg-100` | black/100 | white/100 | Titles, body, logo |
| `fg-75` | black/75 | white/75 | Strong secondary text |
| `fg-60` | black/60 | white/60 | Secondary body copy |
| `fg-50` | black/50 | white/50 | Captions, subtitles, intros, header meta, footer |
| `fg-30` | black/30 | white/30 | Decorative and disabled text |
| `fg-25` | black/25 | white/25 | Oversized numerals, page and index numbers |
| `fg-20` | black/20 | white/20 | Strong dividers, inactive marks |
| `fg-10` | black/10 | white/10 | Dividers, table rules, subtle outlines |
| `fg-5` | black/5 | white/5 | Tinted panels, image placeholders, chart backgrounds |
| `fg-muted` | #8893a5 | #a0aab9 | Solid navy metadata |
| `bg-primary` | white/100 | black/100 | Slide ground |
| `bg-secondary` | white/5 | black/5 | A barely-there wash |
| `bg-overlay-50` · `-25` · `-10` | white/50 · 25 · 10 | black/50 · 25 · 10 | Scrims over imagery |
| `border-default` | black/75 | white/75 | Control and divider strokes |
| `accent-primary` | #47d7ac | #47d7ac | Mint, the signature accent |
| `accent-dark` | #205463 | #47d7ac | Accent as ink: petrol-teal on light, mint on dark |
| `accent-surface` | #d1f5ea | #205463 | Accent panel |

Use the Theme tokens in layouts, not the primitives: they are what flips between light and dark.

## Colors (primitives)

The values the Theme tokens alias. Reach for them only when no Theme token fits.

- **black** `#010716` at 100, 75, 60, 50, 30, 25, 20, 10, 5%. The brand near-black; never use pure #000.
- **white** at 100, 75, 60, 50, 30, 25, 20, 15, 10, 5%.

## Rules

- One mint moment per slide. As text, mint needs the dark ground (11:1); on white it is 1.9:1, so use it there for fills, marks and scribbles.
- Reading text is `fg-100`, `fg-75` or `fg-60`. `fg-50` and below are for short secondary lines and display sizes.
- No gradients, no rainbow palettes, no default blue, no cream or beige grounds.
- Never hard-code white or black text into a template field: a dark slide flips the Theme tokens for you.

## Where Figma and the HTML differ

Slides render with the HTML's values. These Theme tokens currently render differently from Figma:

{{FIGMA_VS_CODE}}

`fg-50` and `fg-25` were raised in the HTML on purpose, so captions and numerals pass text contrast on slides. `fg-5` stays at 8% on dark slides.

## Brand colours outside the variables

Two sets of brand colours exist in the HTML but not as Figma variables:

- **Petrol black** #06041f: the dark of the official logo lockups. It is not the dark slide ground (that is black/100).
- **The caring values**: Global #13294b, Caring #2d807b, Client-centric #2e008b, Intelligent #6240a8, Non-hierarchical #f8485e, Agile #f99068, Responsible #06041f. They come from the caring-icon artwork (Assets › Caring). On slides, only `portfolio/grid-21` uses them: its award counts are set in coral (Non-hierarchical), teal (Caring) and a darkened peach (#e0631f, because Agile peach is 2.3:1 as text on white), alongside mint.

## Implementation notes (for developers)

The HTML declares more colour variables than Figma, to make every template theme-correct. They are not design tokens and are not listed above; `components/bundle.css` pins all of them on each slide so slides render exactly as in the product:

- **Neutral fills** (`--fill-petrol`, `--fill-50`, `--fill-25`, `--fill-grey`, `--fill-mid`): tiles, bars and bubbles that become the same alpha of white on dark slides.
- **Rules** (`--hairline-faint`, `--hairline`, `--hairline-strong`) and `--fg-on-solid`, the text colour on a filled `fg-100` surface.
- **The finance chart ramp** (`--fin-*`): panels, bars, stacked segments, gridlines and segment labels.
- **Legacy names** from the first version of the deck: `--navy-500-on-light`, `--navy-500-on-dark`, `--muted-color`, `--rule-color`, `--logo-color`, `--color-black`, `--color-white`, `--mint-green`, `--petrol-black`, `--accent-dark`, `--accent-ink`, and `--surround`, the letterbox colour behind slides in present mode.
