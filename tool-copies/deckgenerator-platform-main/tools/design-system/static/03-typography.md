# Typography

Two families from one type system, self-hosted as WOFF2 in `fonts/`:

- **Equip Extended** (`font-display`): every heading, title and intro. Its wide proportions give titles their presence.
- **Equip** (`font-body`): running text, captions, labels, the header meta and the footer.

Weights shipped: Light 300, Regular 400, Medium 500, Bold 700. In Figma, Heading and Title styles are **Medium** and Base text styles are **Regular**. Some templates set body copy in Medium (500) on top of the Base sizes; follow the template.

## Text styles (the Figma names)

| Group | Style | Family | Size / line | Weight | Tracking |
| --- | --- | --- | --- | --- | --- |
| Base | `TextXS` | Equip | 12 / 16 | 400 | 0 |
| Base | `TextSM` | Equip | 14 / 20 | 400 | 0 |
| Base | `TextMD` | Equip | 16 / 24 | 400 | 0 |
| Base | `TextLG` | Equip | 18 / 28 | 400 | 0 |
| Base | `TextXL` | Equip | 20 / 28 | 400 | 0 |
| Heading | `Heading6` | Extended | 24 / 32 | 500 | -2% |
| Heading | `Heading5` | Extended | 28 / 36 | 500 | -2% |
| Heading | `Heading4` | Extended | 36 / 44 | 500 | -2% |
| Heading | `Heading3` | Extended | 48 / 56 | 500 | -2% |
| Heading | `Heading2` | Extended | 60 / 68 | 500 | -2% |
| Heading | `Heading1` | Extended | 100 / 108 | 500 | -2% |
| Title | `Title` | Extended | 150 / 150 | 500 | -2% (-3px) |
| Title | `Display` | Extended | 250 / 250 | 500 | 0 |

## Where the frame uses them

| Element | Style | Colour |
| --- | --- | --- |
| Slide title (PageHeader) | `Heading2` | `fg-100` |
| PageHeader subtitle | `Heading3` (`Heading4` in the Core halves header) | `fg-50` |
| PageHeader intro | `Heading5` | `fg-50` |
| PageHeader caption | `TextXL` | `fg-50` |
| Card title | `Heading5` or `Heading6` | `fg-100` |
| Card and lead body | `TextXL`, `TextLG` | `fg-100` / `fg-50` |
| Header meta, footer | `TextMD` | `fg-50` |
| SectionHeader heading | `Heading3` size at regular (400), -2px | inherits |
| Cover title | `Heading1`; oversized covers `Title` | `fg-100` |

## How the HTML applies them

The templates don't reference these styles by name. `css/primitives.css` sets literal sizes in each `.v2f-*` rule (`.v2f-title` is `font-size:60px; line-height:68px`, for example), and those literals match the Figma ramp: 20, 24, 16, 36, 18, 60, 48, 28, 14, 100, 150 and 12px are the most used sizes, in that order. A minority of rules use sizes outside the ramp (15, 17, 19, 22, 26px and a few large display sizes); they come from individual Figma frames. When you write new HTML, use the ramp above. `Display` (250px) is defined in Figma but no master uses it yet.

## Rules

- Headings are medium, never bold. Bold is reserved for a deliberate lead statement.
- Sentence case for titles, captions, labels and buttons. No all-caps headings.
- Left-align. Centre only where a template centres (a quote, a closing line).
- Titles: one or two lines. The PageHeader clips anything over 340px, so a paragraph in a title field is lost.
- Never substitute Arial, Inter, Roboto or a system font. If Equip fails to load, fix the font, don't ship the fallback.
