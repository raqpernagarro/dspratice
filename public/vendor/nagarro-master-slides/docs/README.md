**One canvas, one frame, 508 master slides.** This is the Nagarro presentation system: the brand tokens, the Equip typefaces, the shared frame (header, page header, footer) and every master slide of the "Master Slides" Figma library, implemented in HTML and rendered live from the same engine the Nagarro Presentation Studio uses. Use it to build any deck that has to look like Nagarro: pick master slides, fill their fields with real content, and render them with `NagarroSlides.renderDeck`.

## Start here

- **Map content onto master slides.** Every slide in a deck is a registered master template plus its content, or, in Claude Slides, one of the approved **composed layouts** (*Composed layouts*). Never draw a free-form slide, and never copy the look of one example deck. If neither fits, say so and ask for a new one (see *Governance*).
- **Browse before you choose.** The **Components › Slide library** cards render all 508 templates by category; click one for its fields and **Copy slide JSON**. The four *Slide catalog* sections list every template with its fields in text.
- **Build with one call.** Load `tokens.css`, `components/bundle.css` and `components/bundle.js`, then `NagarroSlides.renderDeck(slides, { title, studio, footer })`. See *Building decks* and the **SampleDeck** card.
- **Light and dark.** Covers, chapter dividers and the closing are dark. Content slides can be light or dark: every template takes `theme: "dark"`, so most slides have both versions. Mix them for rhythm. Switch this page to the **Dark slide** theme to see every master rendered dark.
- **Token names are the Figma names.** A token here is the Figma variable with `/` as `-`: `fg/50` is `fg-50`, `spacing/24` is `space-24`, `radius/15` is `radius-15`. The HTML uses the same names as CSS custom properties (`--fg-50`). Never rename one or invent one.

## The brand in one paragraph

Nagarro slides are restrained, editorial and structural. A strict 1920×1080 canvas, a 40px margin, generous empty space, and two typefaces from one family: **Equip Extended** for headings and **Equip** for text. Two grounds: white (`bg-primary`, light) for content and the brand near-black (black/100, #010716, dark `bg-primary`) for covers, dividers and the closing. Ink is `fg-100` (#010716, never pure black) with the `fg` steps for everything secondary. One accent: **mint green** (`accent-primary`, #47d7ac), used deliberately and in balance. The same header (logo, studio, presentation name, page; plus the client's logo in a client deck) and footer (presentation name, "Prepared for [Client]", ©) frame every slide. Hierarchy comes from scale, weight and space, never from decoration.

## Colour

- Colour tokens are the Figma variables: the **Theme** collection (Light, Dark) and the **Colors** primitives it aliases. Use Theme tokens in layouts.
- Ground every slide on `bg-primary`. Text in `fg-100`; secondary copy in `fg-75` or `fg-60`; captions, subtitles, intros, meta and the footer in `fg-50`; oversized numerals and page numbers in `fg-25`.
- Tint a panel, placeholder or card with `fg-5`. Dividers and table rules in `fg-10` or `fg-20`; control strokes in `border-default`. Scrims over photos in `bg-overlay-50` / `-25` / `-10`.
- Only DS colours on a slide (*Colour › Rules*). Mint (`accent-primary`) is the one accent: consistent marks such as bullets, card bars or index numbers, a scribble, a key number on a dark slide, the active step. Titles and sentences stay one colour: no highlighted words. Bullets on grey cards are `fg-100`, not mint. As text it needs the dark ground; on white use it for fills and marks only. `accent-dark` is the accent as ink; `accent-surface` is the accent panel.
- Petrol black and the seven caring-value colours are brand colours, not variables; see *Colour*.
- Every Theme token flips with the slide's `theme`, not the page's.

## Type

- Styles use the Figma names. **Heading** (Equip Extended medium, -2%): `Heading1` 100/108 (cover), `Heading2` 60/68 (slide title), `Heading3` 48/56 (subtitle, in `fg-50`), `Heading4` 36/44, `Heading5` 28/36 (intro, card titles), `Heading6` 24/32. **Title**: `Title` 150/150 and `Display` 250/250 for oversized words and numerals.
- **Base** (Equip regular): `TextXS` 12/16, `TextSM` 14/20, `TextMD` 16/24, `TextLG` 18/28, `TextXL` 20/28. The caption is `TextXL` and the header meta and footer are `TextMD`, both in `fg-50`.
- SectionHeader headings are `Heading3` size at regular weight. Bold (`w-bold`) is for a deliberate lead statement only.
- Never substitute a system font, Arial, Inter or Roboto. Left-align body text; centre only what a template centres.

## Spacing and shape

- Author in literal px on the 1920×1080 canvas. The margin is `margin-x` (40px) on all four sides.
- Spacing and padding come from the Figma Sizes scale: `space-2`, `space-4`, `space-6`, `space-8`, `space-10`, `space-12`, `space-16` (row gap), `space-20`, `space-24` (columns and cards), `space-32` (header to content), `space-40` (margin), `space-48`, `space-56`, `space-64`, `space-80`, `space-100`.
- Corner radius from the Figma scale: `radius-6`, `radius-9`, `radius-15` (cards, image placeholders, chart panels: the default), `radius-20`, `radius-full` (pills and circles). Slides themselves are square. No drop shadows. Rules are `stroke-thin` (0.5px) or 1px.

## Layout and frame

- **Header** at the top margin: logo, then studio | presentation name | page, over a divider at y=124. Content starts at y=156.
- **PageHeader**: caption, title and subtitle at left (680px), optional intro at right.
- **Footer** at y=996–1040: three equal columns over 0.5px `fg-50` rules.
- Never draw your own logo row, coloured header or footer bar, side ribbon, or accent underline under a title.

## Iconography and marks

- **Icon**: 126 line icons, `NagarroSlides.icon(name)`, drawn in `currentColor`.
- **Caring icons** (Assets › Caring): one per value, as Badge, Icon or transparent mint glyph, for values content.
- **Scribbles** (Assets › Scribbles): nine hand-drawn mint marks to underline a word, circle a number or sweep behind a cover. One scribble moment per slide at most.

## Imagery

- **PhotoLibrary**: 210 brand photographs, captioned and tagged. Authentic, human, optimistic; people working together. Reference them as `assets/photography/<file>`.
- Full-bleed or inside the margin grid; no filters or colour washes. White type over the darker region of a photo, or over a `bg-overlay-50` scrim.

## Voice

Write the way a senior consultant talks to a client: plain, specific, confident. Titles make a claim ("Handlers spend a third of the day re-keying data"), not a topic label ("Current state"). Sentence case everywhere. Numbers with units. No exclamation marks except the closing line. See *Writing for slides*.

## Components

Frame: **Stage**, **Header**, **Footer**, **PageHeader**, **SectionHeader**. Brand: **Logo**, **Icon**. Blocks: **Metric**, **MetricCard**. Slide library: one card per category (**Covers**, **ChaptersAndIndex**, **StatementsAndQuotes**, **ContentSlides**, **CardSlides**, **ChartsAndDiagrams**, **ComparisonTables**, **TimelinesAndRoadmaps**, **ResultsAndImpact**, **ServicesSlides**, **TeamAndCV**, **LogosAndClients**, **PhotoAndGallery**, **CaseStudySlides**, **ClosingSlides**). Decks: **SampleDeck**, **PhotoLibrary**. The API is in `components/index.d.ts`.

## Accessibility floor

- Reading text is `fg-100`, `fg-75` or `fg-60` (5.4:1 or better on white). `fg-50` (3.8:1 in Figma) is for short secondary lines; `fg-25`, `fg-30` and `fg-muted` for display-size numerals and metadata only.
- Mint is never small text on white. Agile peach is never text.
- Meaning never rides on colour alone: label the series, number the steps.

## Do and don't

**Do**
- Pick a registered master slide for every slide, and vary them across the deck.
- Fill every field with real content; replace every placeholder, including the header `name` and the footer `col1`/`col2`.
- Keep covers, dividers and the closing dark, mix light and dark content slides, and keep mint balanced.
- Use only the named text styles, keep content inside y=156–963, and run the kit's checks (*Building decks › In Claude Slides*).

**Don't**
- Plain title-and-bullets slides, one layout repeated, centred bullet lists.
- Random or default-blue colours, rainbow palettes, gradients, cream or beige grounds.
- Drop shadows, rounded "card" clichés the masters don't use, accent bars and underlines.
- Lorem ipsum, invented figures, or a template's example content left in a client deck.
