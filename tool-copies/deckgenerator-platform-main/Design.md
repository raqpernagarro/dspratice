---
version: alpha
name: Nagarro Presentation System
description: >-
  Brand and template specification for Nagarro presentation slides. Tokens mirror
  the Figma design system ("Presentations Skill") and the Nagarro brand standards
  (brandkit.nagarro.com). Values marked "verify" await an authenticated brandkit export.

colors:
  # Neutrals (Figma: Colors/Neutral/*) — confirmed
  black: "#010716"
  white: "#ffffff"

  # Navy scale — muted/secondary text & hairlines (Figma: Colors/Navy).
  # The Figma token "Navy/500" is theme-aware: navy-500 on light surfaces,
  # navy-300 on dark surfaces. Both confirmed from the live file.
  navy-300: "#c4c9d2"
  navy-500: "#8893a5"

  # Semantic aliases
  surface-dark: "{colors.black}"
  surface-light: "{colors.white}"
  on-dark: "{colors.white}"
  on-light: "{colors.black}"
  muted-on-light: "{colors.navy-500}"
  muted-on-dark: "{colors.navy-300}"

  # Brand primaries (Nagarro) — confirmed from official brand SVGs in assets/.
  mint-green: "#47d7ac"     # signature accent
  petrol-black: "#06041f"   # brand's true dark (logo "Dark" / "Petrol Black")

  # "Caring values" expressive palette — one color per Nagarro value.
  # Source: assets/caring-icons/*. Accent use only.
  value-global: "#13294b"            # petrol blue
  value-caring: "#2d807b"            # teal
  value-client-centric: "#2e008b"    # indigo
  value-intelligent: "#6240a8"       # purple
  value-non-hierarchical: "#f8485e"  # coral red
  value-agile: "#f99068"             # peach
  value-responsible: "#06041f"       # petrol black

typography:
  # Display family: Equip Extended. Body family: Equip.
  hero:                       # Figma Extended/Heading 1
    fontFamily: Equip Extended
    fontSize: 128px
    fontWeight: 700
    lineHeight: 128px
    letterSpacing: -1.5px
  section-heading:            # Figma Extended/H3
    fontFamily: Equip Extended
    fontSize: 64px
    fontWeight: 400
    lineHeight: 80px
    letterSpacing: -1.5px
  subtitle:                   # Figma Extended/H4
    fontFamily: Equip Extended
    fontSize: 48px
    fontWeight: 500
    lineHeight: 48px
    letterSpacing: -1.5px
  body-l:                     # Figma Paragraph/Body L
    fontFamily: Equip
    fontSize: 24px
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: -0.48px
  label:                      # Figma Extended/H8 (footer / eyebrow)
    fontFamily: Equip Extended
    fontSize: 16px
    fontWeight: 400
    lineHeight: 20px
    letterSpacing: 0px

spacing:
  # Figma layout primitives
  hairline: 0.5px       # Stroke/thin
  footer-gap: 24px      # Gap/2xxl
  footer-pad: 28px      # Padding/4xl
  margin-x: 84px        # left/right safe margin
  frame-w: 1920px
  frame-h: 1080px

rounded:
  none: 0px
  pill: 999px           # nav controls only (chrome, not slides)

components:
  slide-dark:
    backgroundColor: "{colors.black}"
    textColor: "{colors.white}"
  slide-light:
    backgroundColor: "{colors.white}"
    textColor: "{colors.black}"
  title:
    typography: "{typography.hero}"
    textColor: "{colors.white}"
  subtitle:
    typography: "{typography.subtitle}"
    textColor: "{colors.white}"
  section-heading:
    typography: "{typography.section-heading}"
    textColor: "{colors.black}"
  body:
    typography: "{typography.body-l}"
    textColor: "{colors.black}"
  footer-label-on-light:
    typography: "{typography.label}"
    textColor: "{colors.navy-500}"
  footer-label-on-dark:
    typography: "{typography.label}"
    textColor: "{colors.navy-300}"
---

## Overview

The Nagarro presentation system is **restrained, editorial, and structural**. It
relies on a strict 1920 × 1080 frame, generous negative space, a tight type scale
in the brand typeface **Equip**, and one persistent piece of chrome — the logo
(top-left) and a three-column hairline footer (bottom). Slides alternate between
two surfaces: a deep near-black navy (`#010716`) for covers and section breaks, and
pure white for content. There is no decoration for its own sake; hierarchy comes
from scale, weight, and space.

This file is the normative source for agents generating or recreating Nagarro
slides. The YAML tokens are authoritative; the prose explains how to apply them.

> **Source of truth.** Neutral and navy colors, the full type scale, and all
> spacing are confirmed from the live Figma file. Brand primaries (mint green,
> petrol black) and the "Caring values" palette are confirmed from the official
> brand SVGs in `assets/` (logos, caring-icons). Photography references still
> need a brandkit export.

## Colors

- **`black` `#010716`** — the brand's near-black navy. Primary dark surface (covers,
  dividers) and primary text on light surfaces. Never use pure `#000000`.
- **`white` `#ffffff`** — primary light surface (content slides) and primary text on
  dark surfaces.
- **`navy-500` `#8893a5` / `navy-300` `#c4c9d2`** — the muted navy used for
  secondary text and hairline rules. Use **navy-500 on white**, **navy-300 on the
  dark surface**, so the muted tone keeps consistent contrast on either surface.
  In Figma this is a single theme-aware token ("Navy/500").
- **`mint-green` `#47d7ac`** — Nagarro's signature accent. The single brand color
  used to highlight, emphasize, or energize an otherwise neutral slide. Use
  sparingly and deliberately (one accent moment per slide), on the dark surface for
  maximum pop or as a small mark on light.
- **`petrol-black` `#06041f`** — the brand's true dark, used in the official logo
  lockups. Slightly cooler/deeper than the Figma neutral `black` (`#010716`). Prefer
  `petrol-black` when placing official multi-color logo assets; `black` remains the
  template surface/text token.
- **Caring values palette** (`value-*`) — seven expressive colors, one per Nagarro
  value (Global, Caring, Client-centric, Intelligent, Non-hierarchical, Agile,
  Responsible). Reserved for values-themed content and the caring-icon set; not for
  general slide chrome.

Contrast: white on `black` and `black` on white both pass WCAG AA at all sizes.
Mint green is bright — for text use it on dark surfaces, not as small text on white.
The muted navies are intentionally low-contrast — reserve them for de-emphasized
metadata (footer, eyebrows), never for primary reading content.

## Typography

Two families, one system:

- **Equip Extended** (display) — all headings, the subtitle, and the footer/eyebrow
  labels. The wider proportions give titles their distinctive presence.
- **Equip** (body) — running paragraph text only.

Scale (see `typography` tokens): `hero` 128, `section-heading` 64/80,
`subtitle` 48, `body-l` 24, `label` 16/20. Display sizes carry a tight
`-1.5px` tracking; body uses `-0.48px`. Headings range Regular→Bold; body stays
Regular. Fonts are self-hosted (`fonts/web/`, woff2 + woff) and declared in
`css/tokens.css`.

## Layout

- **Frame:** every slide is authored at **1920 × 1080** and scaled uniformly to fit
  the viewport (letterboxed), so output is pixel-exact at any size.
- **Margins:** a consistent **84px** left/right safe margin anchors all content.
- **Footer:** three equal columns separated by **24px**, each with a **0.5px** navy
  top rule and **28px** top padding, baseline-locked at `top: 968px`. The third
  column splits (date ↔ copyright).
- **Logo:** fixed top-left at `(84, 64)`.
- Content blocks align to the left margin and use column widths of **568px**
  (matching the footer columns) for body text.

## Components

Templates are composed from the tokens above. Each template is a **self-contained
module** under `js/templates/slide-NN-<archetype>.js` (own `render()` + scoped `css`),
registered in `js/templates/index.js`; shared blocks live in `js/components.js`
(`Logo`, `Footer`, `Chrome`, `SectionHeader`). There is no single templates file.

- **`title`** (slide-dark) — `title` + `subtitle`, lower-left. Cover / section open.
- **`summary`** (slide-light) — `section-heading` + one or more `body` columns.
- **`SectionHeader`** — shared eyebrow → heading → subhead block for content slides.
- **chrome** (`logo` + `footer`) — shared by all full-frame templates; the footer
  label uses `footer-label-on-light` or `-on-dark` per surface.

New templates should reuse these component tokens and shared blocks rather than introduce
new values. See `js/templates/_CONTRACT.md` for the module contract and `CLAUDE.md` for the
deck-generation workflow.

## Iconography

The brand ships the **"Caring icons"** set (`assets/caring-icons/`) — one icon per
Nagarro value, in three treatments at 512×512 (Badge variants at 572×572):

- **Badge** — filled circle in the value's own color (`value-*`), white glyph.
- **Icon** — glyph in petrol-black/mint on the surface.
- **Icon … transparent** — mint-green glyph, no background; sits on any surface.

Use one treatment consistently within a slide. The **app-icon** (`assets/app-icon/`,
Circle + Square, 88×88) is the compact brand mark for headers/tiles. For ad-hoc UI
icons, match the brand line style: uniform weight, rounded joins/caps, and prefer
`currentColor` so they inherit slide text color.

## Decorative marks — "Scribbles"

`assets/scribbles/` holds nine hand-drawn mint-green scribbles (underlines, circles,
arrows, emphasis marks). Sizes vary; **Scribble 5** is a full 1920×1080 background
flourish. Use them sparingly to add warmth/energy — to underline a key word, circle
a number, or as a single large background gesture behind a cover. Never more than
one scribble moment per slide; they are seasoning, not structure.

## Photography

The brand photo library is in `assets/photography/` (209 images, ~2048px,
mostly landscape + some portrait): **authentic, human, optimistic** workplace
imagery ("a caring brand"). Treat images full-bleed or within the 84px margin
grid; avoid heavy filters. For overlaid type, place white text over the darker
regions or add a `black`/`petrol-black` scrim, and use the mint accent for a
single highlight. Prefer landscape crops for full-bleed covers and split layouts;
portrait shots suit side-by-side text/image slides.

## Asset library (`assets/`)

| Folder | Contents | Use |
| --- | --- | --- |
| `logo/` | Wordmark in `currentColor` + fixed black/white | In-app chrome (theme-aware) |
| `logos/` | Official lockups: Horizontal / Vertical / Tagline / Small × Dark, Light, White, Green, Petrol Black | Formal placements, exports |
| `caring-logo/` | "Caring" signature logo (Light, Mint Green), 1024×768 | Brand/closing slides |
| `caring-icons/` | 7 value icons × Badge / Icon / transparent | Values content |
| `app-icon/` | Circle + Square app marks, 88×88 | Compact mark, tiles |
| `scribbles/` | 9 mint-green hand-drawn marks | Decorative emphasis |
| `../fonts/` | Equip + Equip Extended (OTF/TTF/Web) | Typography |

## Do's and Don'ts

**Do**
- Keep the 84px margins and the logo + footer chrome on every standard slide.
- Use Equip Extended for headings, Equip for body — nothing else.
- Pair `black` surfaces with `white` type and vice-versa; use the muted navy only
  for footer/metadata.
- Use `mint-green` as the single deliberate accent (one moment per slide).
- Author at 1920 × 1080 and let the system scale.

**Don't**
- Don't use pure black `#000000` — the brand black is `#010716` (`petrol-black`
  `#06041f` for official logo lockups).
- Don't overuse mint green — it loses impact as a large field or multiple accents.
- Don't mix the seven `value-*` colors decoratively; they belong to values content.
- Don't put muted navy text on a busy or low-contrast background.
- Don't substitute system fonts (Arial/Inter/Roboto) for Equip.
- Don't crowd the frame — negative space is part of the identity.
