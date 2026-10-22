# Composed layouts

The 508 masters are the library to pick from first. When no master fits the content, a Claude Slides deck can use a **composed layout**: a slide built from the DS frame, tokens, text styles and components, approved in review on real decks. Previews are in *Assets › ComposedLayouts*.

Each layout is a function in `kit/compose.js` (`NagarroCompose.init(cfg).layouts.<name>(content)`) that returns a pinned Claude Slides `<section>`. The function refuses content that doesn't fit (it throws, naming the slide), so a capacity is enforced, not just advised. When it refuses, split the slide, trim with the user's permission, or pick another layout. Never shrink type.

All layouts share the frame (Header, client logo when set, Footer), the content area 156→963, the 40px margins and the PageHeader geometry (*Canvas and layout*).

## The layouts

| Layout (`kit` name) | Theme | Holds | Text limits | Best for | Avoid |
| --- | --- | --- | --- | --- | --- |
| **Cover** (`cover`) | dark, logo-only header | caption, title, subtitle | title ≤ 2 lines of `Heading1` at 1500px (≈ 60 characters); subtitle ≤ 2 lines of `Heading3` | Deck cover when no `main/cover-*` suits | A photo behind the title |
| **Chapter cover** (`chapter`) | dark | number + title | title ≤ 2 lines of `Heading1` (≈ 30 characters a line) | Numbered chapter breaks 01, 02 … in order | A number without the covers before it |
| **Topic cover** (`topicCover`) | dark | mint label, title, subtitle | title 1 line (≈ 30 characters), subtitle 1 line | A use case or topic inside a chapter | More than one per topic |
| **Idea + photo** (`ideaPhoto`) | light | page heading, 2–5 paragraphs, 1 image (+ caption) | ≤ 1,400 characters of `TextXL` in the 920px text column | "The idea behind…" slides with one strong picture | Screenshots without a frame; a second image |
| **Numbered two-column text** (`twoColumnText`) | dark or light | page heading, 2–4 numbered paragraphs | ≤ 450 characters per paragraph | "How we did it" slides with no picture | Single-line bullets (use Icon cards) |
| **Icon cards** (`iconCards`) | light | 3–5 cards in a row, or 6 in 2×3; each icon, title, body or ≤ 3 bullets | title ≤ 70 characters; body ≤ 160 characters | Benefits, advantages, principles | Mint bullets inside the grey cards |
| **Year timeline** (`yearTimeline`) | light | 2–10 year cards in rows of 5; ≤ 4 events per year | event ≤ 60 characters | A collaboration or company history | Phases without dates (use a `planning/*` master) |
| **Metric grid** (`metricGrid`) | light | 3 or 6 cards: label, `Heading3` value, ≤ 4 bullets | value ≤ 18 characters; bullet ≤ 70 characters | Numbers and culture, capabilities at a glance | Long sentences as values |
| **Grouped lists + photo** (`groupedLists`) | light | 2–3 titled lists left; photo + 1 list right | ≤ 4 items per list, ≤ 60 characters each | Engagement models, team structures | More than three groups on the left |
| **Numbered summary** (`summaryList`) | light | 3–6 rows: number, title, detail | title ≤ 40, detail ≤ 40 characters | Agenda-style summary of chapters | Paragraphs in rows |
| **From–to table** (`fromTo`) | light | 3–8 rows: problem → outcome | problem ≤ 90, outcome ≤ 35 characters | Pain → gain, before → after | Unpaired lists |
| **Logo wall** (`logoWall`) | light | up to 48 cells (8×6); text cells may span 2 | text cell: name + one line | Technology stack, tools | Client logos without permission |
| **Statement** (`statement`) | dark | `Heading1` + `Heading3` line | ≤ 2 lines + 1 line | A lead-in or a claim on its own | A photo behind the statement |
| **Metric row** (`metricRow`) | light | page heading with intro at right; 3–4 `Heading1` metrics on the bottom edge | value ≤ 7 characters; label ≤ 45 characters | Company facts: people, countries, clients, year | Values with long units |
| **KPI panels** (`kpiPanels`) | light | 1 mint hero panel + 4 `fg-5` cards | hero value ≤ 8 characters; card value ≤ 8 | Annual results | More than one hero |
| **Letter grid** (`letterGrid`) | dark | 3 or 6 items: mint letter, `Heading4` title, `TextXL` body | title ≤ 20, body ≤ 90 characters | CARING values or another acronym | Highlighting the acronym in the title too |
| **Photo gallery** (`gallery`) | dark or light | 1 large + 4 small photos | — | Life at Nagarro, culture | Employee photos standing for roles (CTOs, founders) |
| **Closing** (`closing`) | dark | two-line `Heading1`, `Heading3`, website in mint | — | The last slide | Contact details for a person in the title |

## Rhythm

Don't put the same layout on two neighbouring slides. Topic covers, idea + photo, two-column text and icon cards make a natural four-slide sequence per topic; alternate light and dark.

## Adding a layout

A new composed layout joins this page only after it has been approved in a review round on a real deck. Add its function to `kit/compose.js` with its capacity checks, a row here, and a preview in *Assets › ComposedLayouts*.
