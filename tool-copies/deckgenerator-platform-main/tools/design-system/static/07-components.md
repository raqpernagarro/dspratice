# Components

Everything here comes from one script, `components/bundle.js`, which defines `window.NagarroSlides`, and one stylesheet, `components/bundle.css`. There is no framework: every block returns an HTML string, and every slide renders to a `<section class="ns-stage">`.

## Inventory

| Card | Call | What it is |
| --- | --- | --- |
| **Stage** | `render`, `mount`, `thumb` | The 1920×1080 slide canvas, light or dark |
| **Header** | `blocks.topBar(meta, { logoOnly })` | Figma "Header": logo, studio, presentation name, page |
| **Footer** | `blocks.footerBar(footer)` | Figma "Footer": name, "Prepared for", date, © |
| **PageHeader** | `blocks.pageHeader({ caption, title, subtitle, intro }, { halves })` | Slide heading block |
| **SectionHeader** | `blocks.SectionHeader({ eyebrow, heading, subhead })` | Legacy positioned heading block |
| **Logo** | `blocks.logo()` | The logo as inline SVG |
| **Icon** | `icon(name)`, `iconNames` | 126 brand line icons |
| **Metric** | `blocks.metric({ label, value }, opts)` | Figma "Metric" |
| **MetricCard** | `blocks.metricCard(content, opts)` | Figma "MetricCard" |
| Slide library (15 cards) | `render(templateName, content, opts)` | All 508 master slides by category |
| **SampleDeck** | `renderDeck(slides, deck)` | A whole deck in one call |
| **PhotoLibrary** | `media/assets/photography/manifest.json` | 210 captioned brand photos |

## The element contract

- **Content in, HTML out.** `render(name, content, opts)` takes the fields in the template's schema and returns a slide. Omitted fields fall back to the template's example; pass `{ useExample: false }` to leave them empty instead.
- **Strings are escaped.** Template fields are plain text. Some fields accept light markup the schema names, such as `**double asterisks**` for a highlighted phrase in a quote, or `\n` for a line break.
- **Theme per slide.** `opts.theme` (or `theme` on a slide spec) overrides the template's own theme; every template supports both.
- **Images are paths.** Image fields take `assets/…` paths, resolved against `config().assetBase`.
- **Namespaced classes.** Slide markup uses `.v2f-*` classes from `bundle.css`. Don't add CSS that styles bare class names (`.card`, `.nav`, `.logo`, `.big`) on a page that hosts slides: templates use names like these and inherit the rule.

## Family block sets

The templates are built from shared block sets that ship inside the bundle: the frame (`topBar`, `pageHeader`, `footerBar`), generic content blocks (image cards, text cards, photo grids, overlay and tint cards), and per-family sets for finance (charts, statement lists, proportion bars, waffles, tables), planning (week and phase timelines, staircase, gantt, phase band, output table, matrix), strategy (quadrant, phase table, framework, pyramid, concentric and onion diagrams, line chart), pitch, marketing, social (phone mockups for Instagram, TikTok, Facebook and LinkedIn; calendars), brand guidelines (swatches, pairings, logo tiles, device mockups), case study and creative. You reach them through the templates; only the frame and the metric blocks are exposed directly.
