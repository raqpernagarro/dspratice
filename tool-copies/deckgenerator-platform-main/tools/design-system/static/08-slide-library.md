# The master slide library

508 master templates, rebuilt from the "Master Slides" Figma file. Each is a module with a name (`family/slug`), a **family**, a **role** (what kind of content it carries), a **shape** (its layout), a **theme**, a **capacity** (how many repeatable items it holds), a **schema** (its fields) and an **example** (real renderable content). Roughly 200 also carry an **intent card**: what the layout is best for, what it holds and what to avoid.

## Families

| Family | Templates | What it is for |
| --- | --- | --- |
| `main` | 89 | The main Nagarro proposal deck: covers, index pages, section covers, text and content layouts, statements, confidentiality notes, quotes, teams and profiles, logo walls, closing |
| `core` | 67 | The general-purpose core: cover, TOCs, dividers, content and photo splits, card rows and grids, galleries, quotes, team rows, closing |
| `creative` | 58 | Creative-studio content: mood boards, product splits, labelled pairs, pinned images, phone and tree layouts |
| `marketing` | 52 | Marketing plans: market insights and results, personas, deliverables, content calendars, Instagram mockups, timelines |
| `brand-guidelines` | 51 | Brand books: chapter openers, logo usage, colour swatches and pairings, type hierarchy, photography, tone of voice, things to avoid, devices |
| `portfolio` | 50 | Portfolios and capability decks: indexes, briefs, text pages, galleries, data, contact |
| `pitch` | 41 | Start-up and product pitches: problem and solution statements, metric cards, TAM/SAM/SOM, business model, pricing, competitors, go-to-market timelines, team |
| `case-study` | 23 | One-page and multi-page case studies: cover, client, challenge, timeline, results charts |
| `finance` | 23 | Financial reporting: bar, area, line, donut and waffle charts, proportion bars, statement lists, dense tables |
| `planning` | 21 | Delivery planning: week and phase timelines, staircase, gantt, phase cards, RACI-style tables, matrices, team |
| `social` | 17 | Social media: phone mockups per network, post and story grids, do/don't rows, weekly and monthly calendars |
| `strategy` | 16 | Strategy frameworks: quadrants, pyramids, concentric and onion diagrams, phase tables, line charts |

A family is a starting point, not a fence: a proposal deck can take its roadmap from `planning` and its financials from `finance`. All families share one frame and one token set, so they mix cleanly.

## Categories

The Slide library cards group templates by role into the categories the Studio's Templates page uses:

| Category | Roles | Templates |
| --- | --- | --- |
| Covers & Title | cover | 13 |
| Chapters & Index | toc, index, divider | 29 |
| Statements & Quotes | statement, quote, stories, press | 51 |
| Content | content, text, brief, detail | 156 |
| Cards | cards | 38 |
| Charts & Diagrams | chart, data, diagram | 59 |
| Comparison Tables | table | 12 |
| Timelines & Roadmaps | timeline | 22 |
| Results & Impact | results, awards | 17 |
| Services & Capabilities | services | 1 |
| Team & CV | team, cv, skills | 21 |
| Logos & Clients | logos | 6 |
| Photo & Gallery | gallery, showcase | 75 |
| Case Studies | casestudy | 1 |
| Closing | closing, contact | 7 |

## Choosing a template

1. **Name what the content is.** A claim with three supporting points? A sequence of phases? Four people? One number? That decides the category.
2. **Count the items.** Pick a template whose capacity matches (catalog: `holds N`). Never pad a four-card layout with a fourth invented card, and never cram six items into a four-slot layout.
3. **Check the intent card.** "Best for", "Holds" and "Avoid" say when a layout works and when it reads badly (long sentences in a short-label list, questions in a logo wall).
4. **Check the media.** Templates tagged `photo` need a photograph per slot; pick from the PhotoLibrary or choose a text-only sibling.
5. **Vary.** Alternate text-led, visual-led and data-led templates; never the same template twice in a row.

## Quick map from source slide to master

| You have | Reach for |
| --- | --- |
| Deck title | `main/cover-01` or `main/cover-02` (`theme: "dark"`) |
| Agenda | `main/index-01` … `04`, `core/toc-list-5`, `core/toc-grid-6` |
| Chapter break | `main/section-cover-01`, `core/divider-single` (`theme: "dark"`) |
| One big statement | Statements & Quotes: `main/photo-statement`, `main/text-*` |
| A client or user quote | `core/quote-single`, `core/quote-split-photo`, `main/quote-01` … `06` |
| Heading plus two or three columns of text | `core/content-twocol`, `core/content-list-3`, `main/` content layouts |
| 3–6 parallel points | `core/cards-row-4`, `core/cards-row-5`, `core/cards-grid-6` (photo variants) |
| Phases or a roadmap | `pitch/grid-15`, `planning/*` timelines and gantt |
| Numbers that matter | Results & Impact; `marketing/text-07` and siblings with Metric blocks |
| A chart | `finance/*` bars, area, line, donut, waffle |
| A framework or model | `strategy/*` quadrant, pyramid, concentric, onion |
| Option comparison | Comparison Tables |
| The team | `core/team-row-3/4/5-photo`, `main/team-01` … `04`, `main/team-member-profile-*` |
| Client logos | `main/logos-*` |
| Thank you | `main/closing-01` (dark), `core/closing-single` |
