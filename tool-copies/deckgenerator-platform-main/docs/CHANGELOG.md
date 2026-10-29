# Changelog

Append-only. Newest entries at the top. Never edit or remove a past entry — if
something described here turns out to be wrong, add a new entry correcting it.

Entries dated before 2026-07-23 are **backfilled** from the in-app "Version
history" of the old deck-authoring tool, which has since been deleted; this file
is now the only changelog. Entries from 2026-07-23 onward are written here as
work happens.

---

## 2026-10-23 — The deck viewer is exactly one screen tall

- **Fixed**: the slide was sized as `100vh − 210px`, a guess at the header
  and toolbar heights, and the document had only a *minimum* height. When the
  header grew — the two-line "N of M slides use a default layout" notice —
  the toolbar (counter, PDF, PPTX) was pushed 31px below a 1470×830 window.
  The workspace is now `height: 100%` of its cell, and the slide fits the
  stage it actually has (`.ws__canvas-wrap` is a size container;
  `width: min(100cqw, 100cqh × 16/9)`).
- **Fixed, phones**: an open deck's long title widened the page to ~730px —
  a plain `1fr` column never shrinks below its content. The shell and the
  viewer's columns are `minmax(0, 1fr)`; the viewer fits 375×812 with its
  toolbar wrapped.

## 2026-10-23 — Home: a chat layout — the composer docked at the bottom

- **Docked composer**: Create is now a thread that scrolls on its own and a
  dock pinned to the bottom of the screen: the starter pills, the coach's
  question form (capped at 55% of the screen, scrolls inside), the prompt box,
  the "New here?" link and errors. The thread holds the greeting, the first
  message, the guide panel (scrolled into view when opened) and the build
  progress (scrolled into view when it first appears). The page itself never
  scrolls, on a laptop or a phone (`100dvh` when the rail is a top bar).
- **First message without a box**: plain text beside the Nagarro mark, the
  way Claude's replies sit in its thread.
- **Phones**: the starter pills are one row that scrolls sideways (three
  wrapped rows took half the screen in the dock).

## 2026-10-23 — Home: the twelve points as the first message; the guide in tabs

- **First message**: the twelve points now read as the assistant's opening
  message — the Nagarro mark as the avatar, a chat bubble, the same wording,
  "Start from this list" kept. Hide/Show is gone (`nps:intro-collapsed` is no
  longer read).
- **Guide in tabs**: what used to open the message (what happens, figures,
  pictures, the dark/light look) moved into "New here?", one tab per theme:
  How it works (with the three steps), Figures, Pictures, The look, Examples,
  Good prompts (thin or specific, and the hook). ARIA tabs: arrow keys,
  Home/End, one tab stop. Text lives in `HOW_IT_GOES` (`starters.js`).
- **The composer stays in view**: the Create column is 800px (was 720) so the
  pills sit in one row and the points wrap less; at 1470×830 the prompt box
  ends at 776px.

## 2026-10-23 — Home: an opening message and prompt starters

- **Opening message** above the composer ("Here’s how it goes"): what happens
  after Generate, where figures come from, the dark/light rhythm, what the
  photo library can and can't show, then twelve numbered points a good prompt
  covers (six essentials, six optional). "Start from this list" puts them in
  the box as headings to fill in. Hide/Show is remembered per browser
  (`nps:intro-collapsed`). Modelled on the Nagarro slides plugin's first
  message, worded for this product's flow.
- **Prompt starters**: a row of 2–3-word pills above the composer (Board
  update, Client pitch, Culture deck, Project status, Workshop kick-off, Case
  study). A click puts the full prompt in the box; Ctrl+Z restores what was
  there. Hidden while the coach is open or a .pptx is staged. The guide's
  examples are the first three (`product/ui/starters.js`).
- **Removed**: the live checklist pills under the composer. `js/brief-check.js`
  stays; the coach still uses it.
- **Fixed**: opening "New here?" cut off the greeting and scrolled the rail
  away. Create now scrolls inside its own cell (`place-items: safe center`,
  `overflow-y: auto`) and the page opens at the top (focus without scrolling).
- **Fixed, phones**: the rail's top bar needed ~544px and widened every shell
  page past a 375px screen. At 640px and below the nav rows are icon-only (the
  label stays the accessible name), the theme switch drops its rail-footer
  divider, and the bar may wrap; home, Templates and Presentations fit at 375
  and 320px. Tablets keep the labelled row.

## 2026-10-23 — Layout numbers are not figures; a hook on the cover moves to slide 2

- **Fixes the first known gap of 2026-10-22.** Numbers that place or size
  things — a gantt block's `l`/`w`/`top`/`h`, a bubble's `x`/`y`/`d`, a row's
  `start`/`span`/`lane`, `at`, `active` and the like (`LAYOUT_KEYS` in
  `content-brief.js`) — are no longer read as figures. Across the library only
  data keys (`value`, `values`, `v`, `f`, `share`, `count`) are still checked.
- **Hook**: an outline that marks the cover or the closing slide as the hook
  lost it (composition never makes a bookend the hook); that mark now counts as
  none and slide 2 becomes the hook, with a note.
- **Check** (4 decks that had an empty `main/timeline-02` on 2026-10-22,
  re-run): 0 empty blocks/bars/rows/cards; `main/timeline-02` rendered 4
  blocks, two `planning/grid-11` gantts kept all 8 rows; untraceable figures 0;
  voice findings 0. On the reference deck only the two derived donut shares
  (0.743, 0.257) were removed, no longer their label positions. The roadmap
  deck shipped without a hook (marked on the cover) — the case fixed above.
- **Still open**: a contents slide placed twice (one deck); thin figure-led
  slides when the material has no numbers.

## 2026-10-22 — Intelligence layer: voice, story, no invented figures, references

- **Understand and story first**: a prompt is read (`understandContent`) and
  given a story plan (`planStory`) before the outline is drafted; drafting
  runs in the background, and the home page shows its stages.
- **The Nagarro voice**: four tones (thought, board, client, people) in
  `product/domain/voice.js`, the human copy in `docs/VOICE.md`, a deterministic
  lint (`js/voice-lint.js`). A voice pass after fill rewords the slides and
  undoes any edit set that makes the lint score worse, or that breaks an
  agenda entry's match with its slide.
- **No invented figures**: every number on a slide must trace to the prompt,
  the coach answers, the references or the brief's proof; anything else is
  stripped after composition, after the visual review, and on the degraded
  path when layouts could not be chosen. Badge numbers 1..N are exempt.
- **The hook**: an optional slide 2 marked `role: "hook"`, on one of four
  statement layouts.
- **References**: PDFs, Word, PowerPoint, spreadsheets, CSV, text and images
  can be attached as source material; images are described by a sandboxed CLI
  call; their figures join the allowed set.
- **Coach v2**: a question form at every Generate (references, the hook,
  optional length — a length given there is exact, no dividers added past it).
- **Getting-started guide** with example prompts; Esc closes it.
- **Audits**: `tools/audit-decks.mjs` reports `voice` and `hook`;
  `tools/generate-briefs.mjs` gains `--weak`, `--no-hook`, `--refs <dir>`, `--out`.
- **Quality check** (20 decks: 4 short prompts with and without the hook, the
  10 standard briefs, 2 with attached notes + CSV): hook present on all 16
  that asked for it, absent on the 4 that didn't; untraceable figures **0**
  (the 14a2c80 run of the 10 briefs had 466); voice-lint findings 8 in 20
  decks (mean 0.4, all repeated-opener budget notes; 14a2c80: 8 in 10). The
  reference decks used the attached figures (€2.6M of €3.5M, 12% idle, 41 of
  58 teams, a spend chart from the CSV) and dropped the ones the model derived.
- **Known gaps** (found by that run, not yet fixed):
  - Layout geometry is read as figures: `main/timeline-02` blocks (`l`, `w`,
    `top`, `h`) are stripped, leaving an empty gantt — 11 slides in 20 decks.
    About 15 templates carry such numeric keys (`x`, `y`, `left`, `cx`,
    `start`, `span`, `row`, `lane`, …).
  - The deck plan can place the same contents slide twice (one deck).
  - With no figures in the material, figure-led layouts are left thin.

## 2026-10-20 — Prompt coach: a live brief checklist and follow-up questions

- **Checklist**: five pills under the home composer — Audience, Goal, Key
  points, Figures, Length — tick as the prompt covers them (deterministic
  rules in `js/brief-check.js`, shared by browser and server). Advisory only;
  hidden while a .pptx is staged.
- **Coach**: Generate on a prompt with no audience, goal or key points opens
  2–4 short questions (`POST /api/briefs/coach`, one Haiku call, 10s budget,
  fixed fallback questions on any failure). Answers are appended to the prompt
  as labelled lines; "Skip and generate" sends it as typed; Esc closes.
- **Record**: generations now store `coaching` (`missing`, `asked`,
  `answered`, `source`, `skipped`) for later analysis. Generation itself is
  unchanged, and so is the import path.
- **Quality check** ("a deck about our AI offering for insurers", skipped vs
  answered): untraceable figures on 8/12 vs 4/14 slides — the skipped deck
  invented client results ("22 AI models at a DACH insurer"), the answered
  one used the two real results it was given; the answered deck follows the
  stated points, the skipped one repeats its agenda; audit findings 0 vs 0;
  compose warnings 3 vs 6 (minor layout repairs on a longer deck).
- **Known gap**: the Haiku call takes ~19s through the CLI, so the 10s budget
  means users get the fixed fallback questions. Addressed by the coach v2 form
  (intelligence-layer plan, Task 10): open at once, tailored options load late.

## 2026-10-15 — Figma pass: footers, headers and drifted layouts

- **Footer height**: main/split-08, main/chart-03, portfolio/grid-17/23/24 and
  brand-guidelines/content-01 were drawn against a 68px footer in Figma (now
  44px). Re-fitted to the corrected frames: split-08's Venn at 500px circles in
  an 832×808 group with Figma's label positions; chart-03 title at the top,
  paragraph (24/32 Extended, 60%) at the foot, bars 716 wide.
- **main/grid-14** gains the Figma PageHeader (title + intro) and its diagram is
  re-placed in y=324–964 with the new 20/16/14px type at fg opacities.
- **core/quote-single** at 48/56 with a paragraph break; **portfolio/cover** and
  **grid-02** titles 150/150 sitting on the footer; **portfolio** project titles
  48/56 + client 28/36, "More Work" 60/68, a bottom-aligned rule-less table, and
  a 36/44 contact block with 697/211 rows on grid-24.
- **MetricCard statement**: the rest of the sentence takes its contrast from
  the card (fg/25 → dark 50%; fg/50–60 → white 75%; fg/75+ → white 60%), and
  pitch/grid-03's fourth card is fg/60, per the updated Figma frame.

## 2026-10-14 — Generation quality: what ten test decks got wrong

Ten briefs (`tools/generate-briefs.mjs`) were run through the real pipeline
and every slide reviewed. The audits passed decks that were plainly wrong.

- **Sample data shipped as fact.** A build-vs-buy decision closed on the
  template's sample chart ("$120M", "Q1 24", "Segment 1") in a € deck. Copied
  example values now count as unwritten in the repair pass (`isEcho`); after
  composition `exampleEcho` moves the slide to the next layout that is fully
  written, or blanks the sample.
- **"[object Object]" on five bars.** Rows given where a layout wants words
  are reduced to their words (`toText`), and a render that still prints
  "[object Object]" is rejected.
- **Captions are never counters.** `reindexSlides` stamped "N / M" over every
  caption, erasing real ones; captions are now optional context only, and
  counters are stripped. Divider chapter numbers count 01, 02, 03.
- **Contents lists**: page numbers on every entry or on none.
- **Paragraphs**: prose may hold several short paragraphs separated by a
  blank line; the fill prompt asks for one per point.
- **Chart choice**: guidance cards (best for / avoid) on all 24 chart layouts,
  strategy/grid-01 and 13 people layouts; the layout prompt says charts are
  for figures only, part-of-whole bars for parts of one whole, and portrait
  layouts only for the presenting team.
- **Header**: the meta row is hidden (logo only) when the deck title cannot fit
  the column, instead of being ellipsised.
- **32px under the header** on 57 templates that had drifted (8px or 40px);
  `tools/audit-header-gap.mjs` measures it. main/chart-02's page header sits at
  the top as in Figma.
- **Visual fixes**: the brand-guidelines chapter number no longer collides with
  a two-line title; narrow segments of the share bar put their value below the
  bar instead of over the neighbour's.
- `tools/audit-decks.mjs` reports `example-data`, `object-text`,
  `counter-caption` and `partial-pages`.

## 2026-10-14 — Brand guidelines: Nagarro logo replaces TMS, Equip typography

Synced with the Figma Brand Guidelines section (109:14479) after the TMS
placeholder logo was replaced by the Nagarro logo and the typography pages moved
to Equip.

- **Logo slides** (gallery-01..04, 06..09): the logo is now the real Nagarro
  artwork on a coloured tile, placed and sized like the Figma `Logo Nagarro`
  instances. A logo field takes an image URL or a built-in keyword
  (`nagarro:horizontal | vertical | neutral | mark`, `js/brand-logo.js`), and a
  `tile` (`dark | light | tint | grey`). Built-in logos are inline SVG, so the
  wordmark follows its tile and the slide theme. A URL with no tile still fills
  the box as before, so saved decks render unchanged.
- **Things to avoid** (gallery-10): six new `assets/brand/avoid-*.svg` built from
  the Nagarro logo (opacity, colour, stretch, gradient, rotate, arrangement).
- **Device mockups** (grid-01, split-03, text-03): the TMS screens became photos.
- **Typography**: text-06/07 and grid-13 show Equip / Equip Extended; grid-13
  gains `sampleFace: "display"` for the secondary-typeface specimen; grid-15
  takes up to 10 levels and its example is the Figma scale (150 / 100 / 60 / 48
  / 36 / 28 / 24 px at -2 %, 20 and 14 px body).
- `audit-dark-vanish` KNOWN list: black logo tiles on the black dark page.

## 2026-10-14 — Light/Dark switch in the fullscreen template preview

- The fullscreen preview on the Templates page has its own **Light | Dark** switch in the top bar, and **T** toggles it from the keyboard.
- It is the same setting as the toolbar's "Slides" switch: changing either updates both, re-tags the open slide instantly, and is remembered.
- Light still shows each template in its own theme.

---

## 2026-10-14 — Template categories, three layout fixes, dark-vanish audit

- **Categories (roles):**
  - Charts filed under Content now sit in Charts & Diagrams: main data-04, split-05, split-06, split-07.
  - Roadmaps and Gantts now sit in Timelines & Roadmaps: main timeline-01/02, planning grid-02, grid-11 and grid-12, strategy grid-03 (phase plan) and grid-13 (targets).
- **Renamed** (old names stay registered as retired aliases, so saved decks still render; the Figma frames are renamed to match):
  - `main/logos-06` → `main/chart-01` (bar chart)
  - `main/logos-07` → `main/chart-02` (line chart)
  - `main/text-08` → `main/chart-03` (grouped columns)
- **main/logos-05:** the dark-mode logo invert now skips dark-native slides (`.v2f-dark`); this wall already loads the white logos from `client-logos/dark/`, which the invert had turned black.
- **pitch/grid-27:** the step columns share one row grid (CSS subgrid), so the empty first column's line now sits at the same y as the others.
- **strategy/grid-09:** the Venn is vertically centred in its frame (`cy = S/2 + d/4`); the top circle was clipped and the figure sat high.
- **New `tools/audit-dark-vanish.mjs`:**
  - It renders every live template light and dark with photos hidden, then flags lines, tiles and logos visible in light but gone in dark. The text-contrast audit can't see those.
  - It runs in Node and the browser only, with no Python or sharp. Reviewed exceptions are listed in `KNOWN` with their reasons. Today 494/502 pass, and the 8 flagged are all known.
  - `npm run audit:dark` runs it after both contrast audits.
- **Dark accent (other session, committed now):** `accent/dark` turns mint in dark, as in Figma. Text on accent-dark fills uses `--fg-on-solid`, so the main grid-03/04 Transformation banners read as mint with dark text. `border-default` is 75% white in dark, as in Figma.

---

## 2026-10-14 — Dark mode review fixes (user-reported slides + full-library sweep)

- **Templates-page collisions:** `main/team-03` used bare `.panel` and `.chip`, which the app's own CSS styles, so the slide fell apart inside the Templates page (not on the capture page). A scan of every template against app.css found only those two names. team-03 now uses `.t3-*`, and main grid-03/04 use `.tchip`.
- **main/team-03 rebuilt to Figma 342:40690:**
  - two 320px fg/10 rows, each with a right-aligned 4×2 grid of Role Badges (279×92, fg/25, 60px disc with the Figma role icon, Equip Extended 24/32);
  - the vertical Nagarro logo leads row 2, with its wordmark in `currentColor`. The new `js/logo-vertical.js` holds the logo and the role icon.
- **Matched to Figma Dark renders:**
  - note-05's letter body is fg/60 in both themes; it was the teal/mint accent ink.
  - split-06 bars invert (white / mid / dark grey).
  - Client logos (`.v2f-mn-lc img`) are inverted to white.
  - grid-15: grey nodes become light grey with dark ink, L3 becomes white, mint tiles become teal, the backlog circle becomes dark grey, and the vendor disc becomes white.
  - grid-13: servers become mint / mint / teal, and the browser box follows the surface.
- **SVG ink:** diagrams that draw connectors and marks as literal black or black-alpha SVG attributes (grid-13/14/15, split-09, strategy, finance, creative and planning blocks) are remapped to the same alpha of white on dark stages, using dark-only attribute selectors.
- **Full-library sweep:** I rendered every template light and dark with photos hidden, then compared ink masks to find content that is visible in light but gone in dark. 18 templates were flagged and are now fixed:
  - Dark `#010716` tiles invert to white with dark ink: case-study stat, award and chart panels, pitch text-11, and the grid-22 pills.
  - pitch grid-13 segments use tokens.
  - Active planning and strategy columns get a visible lift (`--fin-card-grey` is 20% white in dark).
  - Brand swatches, dots, pairs and hierarchy bars get a faint hairline in dark, so black on black stays visible; the split-08 redaction bar inverts.
- **Results:** dark-safe 488/508 and light-safe 484/508, both unchanged; light slides are pixel-identical except note-05, which now matches Figma.

---

## 2026-10-13 — Templates page: filter dropdowns and a Light/Dark slide toggle

- The two sideways-scrolling chip rails (15 categories + 13 families, most of them off-screen) are now two dropdowns, **Category** and **Family**, in one toolbar row with the search.
  - Each menu lists every option with a live count: the templates it would show given the other filter and the search. Options with no matches are disabled.
  - An active filter is highlighted on its button, with an × to clear it.
  - The menus use the sidebar's rail-menu popover style and work with the keyboard (↑/↓, Esc).
- **Slides: Light | Dark** toggle in the toolbar. Dark renders every thumbnail and the fullscreen preview dark. Light shows each template in its own theme, so dark covers stay dark.
  - It re-tags the stages already in the DOM (the theme lives in tokens), so switching is instant with no re-render.
  - The choice is remembered (`nps:tpl-slide-theme`). It's separate from the app-theme switch in the sidebar.

---

## 2026-10-13 — Dark mode matched to Figma's Dark renders

- **Compared** 12 slides across main, case-study, marketing, brand guidelines, pitch, core, strategy, finance and social. Each was rendered with the Figma frame switched to Dark (frames restored afterwards) next to the platform's dark render.
- **What Figma does, now applied — neutral surfaces invert, they don't stay fixed:**
  - Petrol fills become **white**, with dark text on them (`--fill-petrol`).
  - The navy-300 grey becomes white 25% (`--fill-grey`), and navy-500 becomes white 45% (`--fill-mid`).
  - Mint tints become `--accent-surface` (#205463).
  - Black-alpha tile fills (t20/t25/t50/t75, MetricCard, TrendCard, pricing, phases, bars) become the same alpha of **white**, through new exact `--fill-50` / `--fill-25` tokens, so light keeps Figma's 50% / 25%.
  - White text on the tiles that become light in dark (t75, t100, petrol) switches to dark ink, through dark-only rules.
  - Device-mockup screens now follow the theme, so they become a dark app UI as in Figma. The earlier light-UI reset is gone.
  - The finance chart ramp in dark is dark → light grey with white labels inside the segments.
  - The strategy grid-01 boxes are flat white-alpha tiles in dark.
- **Results:** dark-safe 488/508, light-safe 484/508 (unchanged). All 20 still unsafe in dark fail in light too.
- **Kept as decided:** our raised fg/50 and fg/25 text tokens; accent/dark fills keep their colour with only the text switching (`--accent-ink`); no Client mode.
- **Generator:** no change was needed. It already keeps covers and closings dark, uses the plan's dark picks in between, and gates on `js/dark-safe.json`; its comment now records the current count.

---

## 2026-10-13 — Dark mode aligned to the Figma Theme variables

- **Results:** dark-safe goes from **405 to 495 of 508**. Light-safe goes from 479 to 484, and nothing new fails in light. The 13 templates still unsafe in dark fail in light too: faded decorative numerals, fixed brand swatches with ink set in their data, and a redaction bar. Those are design choices, not theme bugs.
- **Tokens (`tokens.css`, `deck.css`):**
  - The full Figma Theme ramp is now declared: `--fg-75/60/30/20/10`, `--fg-muted`, `--bg-secondary`, `--bg-overlay-50/25/10` and `--accent-surface`, with dark values matching Figma Dark.
  - The dark `bg/primary` and the stage background follow Figma: #010716, not petrol #06041f.
  - New `--fill-petrol` for petrol used as a fill. It lifts to fg/20 in dark so dark bars and bubbles don't vanish on black.
  - Our raised fg/50 (58%/70%) and fg/25 (45%) stay, for the contrast reasons documented in `tokens.css`.
- **`primitives.css`:**
  - 93 raw `rgba(1,7,22,…)` text, border and faint-tint values now map to the nearest token, keeping the raw value as a fallback. Higher-alpha backgrounds (scrims, deliberate dark pills) are untouched.
  - `#fff` text on flipping solid fills now uses `--fg-on-solid`: case-study pills and month cards, marketing chips, Gantt bars, highlight cards, creative badges.
  - Device-mockup screens (Instagram/Facebook/LinkedIn grids, the Instagram post card) reset to light tokens: an app screenshot stays a light UI on a dark slide.
  - Fixed light tiles (navy-300 grey, mint) and the photo annotation pins keep fixed dark ink.
- **`brand-blocks.js`:** `brInk` now picks the swatch ink by WCAG contrast instead of a brightness cut-off, which had put white text on mid-tones like sky blue at ~2:1.
- **Templates:** marketing grid-05 map labels use tokens. main data-04, split-07 and the other petrol charts use `--fill-petrol`.

---

## 2026-10-13 — Figma component library audit and clean-up (Master-Slides)

- **Merged:**
  - TextCard3, TextCard4, TextCard/Chips, two "TextCard" sets and Card → **TextCard**: Size SM/MD/LG × Layout Stacked/Side by side, with Show eyebrow/subtitle/metric/badges/icon.
  - Stat + CardStat → **TrendCard**: Trend Up/Down × Label position.
  - Award → **TextTile** (Layout With image).
  - CardHighlight → **Blockquote** (Layout Highlight).
  - Timeline, Timeline2/Marketing and Timeline1/Pitch → **TimelineStep**: Layout Dot/Pill/Phase/Heading/Numbered/Track start/Track/Track end.
  - ProjectListItem → **ListItem** Size SM.
  - The second ImageBox → **Image**.
- **Renamed:**
  - Timeline2/Pitch → TimelineRow; TextCard/Planning → TextColumn; BrandCode → ImageWithLabel; Card/ChartDot → DotChart; the second InstagramPost → InstagramFeedPost.
  - Every generic variant option (Type1…, Style1) now has a meaningful name.
  - Every property is in sentence case ("Show icon", not `ShowIcon`).
  - The 14 badly spelled icon names are now kebab-case.
- **Wired:**
  - Paragraph has Text/Text 2 properties.
  - PageHeader's Number and Top subtitle are connected, and its nested Paragraph is exposed.
  - ListItem has an icon toggle.
  - Unused hidden layers are removed.
  - Every component has a description.
- **Local components:** nested and direct instances that pointed at older library files now use this file's own Image, ChartBar, CircleDiagram, TextBlock and Logo components.
- Every merge was migrated instance by instance, and slides keep their look through overrides.
- **Code:** `js/icons.js` gets `ICON_ALIASES`, so the corrected Figma names (`scissors`, `zig-zag-path`, `applications-2`, `shopping-cart-with-gear`, `graph-downwards`) resolve to the existing keys.

---

## 2026-10-13 — Design system artifact: "Nagarro Master Slides"

- **New `tools/design-system/`** builds a Claude Design System artifact from this repo (https://claude.ai/artifact/FTePiAfzdDWtb71Bogjpn2): `node tools/design-system/build.mjs`. It bundles the real template engine (`entry.js` → `window.NagarroSlides`, esbuild IIFE) so every registered template renders live, generates `tokens.json`, one preview card per Templates-page category, the frame/brand/block cards, a sample deck, a captioned photo library card and four catalog sections listing every template's fields and intent card. Hand-written brand book pages live in `tools/design-system/static/`. See `tools/design-system/README.md` for preview and publish steps.
- Tokens follow the Figma variable names: text styles `TextXS`–`TextXL`, `Heading6`–`Heading1`, `Title`, `Display`; spacing `space-2`…`space-100`; radius `radius-6`, `-9`, `-15`, `-20`, `-full`. The HTML itself still sets literal px per `.v2f-*` rule; most match the ramp, some (15, 17, 19, 22, 26px) don't.
- Previews follow the page theme: "Dark slide" renders every master dark, "Light slide" shows each master in its own theme.
- Colour tokens are exactly the Figma variables (`tools/design-system/figma-tokens.json`): the Theme collection in Light and Dark (the Client mode is left out) and the Colors primitives it aliases. The HTML's own working variables (`--fill-*`, `--hairline-*`, `--fin-*`, legacy names) stay out of the token list; `bundle.css` pins them on each slide. The colour section lists the Theme tokens and only the black and white primitives they alias; the mint, gray and blue primitives are left out. The build reports where Figma and the HTML differ: `fg-50`, `fg-25` (raised for contrast) and `fg-5` on dark.
- Dark slides now match Figma for `border-default` (white at 75%, was 50%) and `accent-dark` (mint, was petrol-teal). The two callouts filled with `accent-dark` (`main/grid-03`, `main/grid-04`) set their text in `--fg-on-solid`, so it turns dark on the mint fill.
- Text styles checked against Figma: Base styles are Regular, `Display` has 0% tracking.
- Media is re-encoded with macOS `sips` (the repo's `sharp` binary is blocked by code-signing on some machines). Build output is git-ignored (`tools/design-system/.build/`).

---

## 2026-10-13 — Brand guidelines category (51 templates) — all 12 categories built

- **Brand guidelines master built from Figma 110:41055** — 51 templates, slides 377–427, family `brand-guidelines`, every one with an intent card and checked side by side against its Figma frame. 70 frames fold into 51 where the layout is the same in another state:
  - chapter openers `data-03` … `data-07` and `content-02` → `data-02`;
  - `text-02` (white) → `hero-01` (`dark: false`);
  - `gallery-05` → `gallery-04`;
  - `text-08`, `text-11` (unframed) → `gallery-10` (`framed`);
  - `grid-04`, `grid-05` (5 and 6 colours) → `grid-03`;
  - `grid-06`, `grid-07` → `grid-02` (3–5 colours);
  - `grid-14` → `grid-13`;
  - `text-10` → `text-09` (`even`);
  - `split-04` → `grid-19` (`cols: 2`);
  - `split-09` → `split-08` (`active`);
  - `grid-21` → `grid-12` (3–4 examples).
- New shared pieces: `js/brand-blocks.js` — left column, tinted panel, logo tiles, colour swatches (dark or light text chosen from the colour), round swatches, pairings, “things to avoid” tiles, phone / tablet / watch mockups, logo-positioning guide, photo-tree mosaics, `*emphasis*` text — and `.v2f-br-*` CSS. Example artwork (sample logos, avoid examples, device frames, app icons) in `assets/brand/`.
- Example content lists the main prose field before the caption, so whoever fills a template puts the text where it belongs.
- Naming clash found again: `deck.css` styles a bare `.edge` as `position: fixed`; the swatch hairline class is `v2f-br-hair`.

---

## 2026-10-12 — Social category (17 templates)

- **Social master built from Figma 110:41057** — 17 templates, slides 360–376, family `social`, every one with an intent card and checked side by side against its Figma frame. 26 frames fold into 17: frames that are the same layout with a different phone are one template with a `kind` field (`post`, `story`, `tiktok`): `split-02` → `split-01`; `data-02` (four phones) → `data-01`; `data-04` → `data-03`; `split-06` → `split-03`; `split-07`, `split-08` → `split-04`; `split-09` → `split-05`; `grid-06` → `grid-04`; `grid-07` → `grid-05`. `grid-04`/`grid-05` also take `tone` (`do` / `dont`).
- New shared pieces: `js/social-blocks.js` — phone mockups for Instagram story, Instagram profile grid, TikTok, Facebook and LinkedIn (the Instagram post reuses the marketing one), social page heads, do/don't rows, weekly and monthly calendar cells — and `.v2f-so-*` CSS; assets in `assets/social/`.
- Dark audit run: like marketing, the content slides are light-only.

---

## 2026-10-12 — Marketing category (52 templates) + mint logo mark

- **Marketing master built from Figma 110:41058** — 52 templates, slides 308–359, family `marketing`, every one with an intent card. 68 Figma frames fold into 52 because frames that are the same layout in another state are one template: the eight chapter dividers (`content-01..08`) → `marketing/content-01`; `grid-14..17` → `grid-13` (`active` field); `grid-19` → `grid-18`; `text-14` → `text-15` (`dim`); `grid-28` → `grid-27` (`mode`); `grid-35` → `grid-34` (1–4 weeks); `text-13` → `text-05`.
- New shared pieces: `js/marketing-blocks.js` (page heads, chips, Instagram phone and post mockups, step timeline) and `.v2f-mk-*` CSS; assets in `assets/marketing/`.
- **Chips on slides** follow Figma as drawn (persona `grid-09`, deliverable cards `grid-22`); no extra separation.
- **Templates page**: the category and family filter chips now sit on two separate lines (`product/ui/templates.html`, `app.css`).
- **Header logo**: the Nagarro mark is now mint (#47D7AC) with the wordmark in the text colour, matching Figma, on every template (`js/logo.js`).
- Reserved name: templates must not use `notes` as a content field (it is the speaker-notes field); `marketing/grid-04` uses `corners`.

---

## 2026-10-12 — Pitch master built: 41 templates

- **Pitch** (Figma section 110:41059) is built: 41 templates, slides 262–307, each
  with an intent card and checked against its Figma frame — cover, contents,
  section divider, statements with photo / phone / hand, tinted metric cards,
  donut chart, product on a phone, ticked feature list, Venn diagram, TAM / SAM /
  SOM, business model and canvas, pricing, financial projections, market
  validation bar, testimonial, competitor map and comparison, timelines
  (horizontal, vertical, with photos), vision logos, team (3, 4, 5 and 10
  people), roadmap, the ask, closing and disclaimer.
- **Five Figma frames are not separate templates** because they are the same
  slide with another element in focus: grid-07 and grid-08 (grid-06 with the
  second or third feature in focus — `active` picks it) and grid-23, 24 and 25
  (the roadmap with one phase in focus).
- Pitch shares the case-study header and footer; header, footer and the
  content start (y=156) are identical to every other family.

## 2026-10-12 — One header and footer on every slide; Core matches Figma; Main styles restored

- **Main slides restored.** 353 Main style rules and one image never reached
  this project when the slides were copied over from v2, so the team grids, CV
  profiles, several diagrams and logo walls rendered unstyled. Restored.
- **Header and footer identical across all categories**, per the Figma
  components: 84px header (logo, meta, divider at y=124), content from y=156,
  footer at the bottom reading Presentation Name / Prepared for [Client] /
  © 2026, regular weight. Generated decks put the deck title in the footer and
  "Prepared for <client>" only when the client is known.
- **Every Core template compared with its Figma frame and fixed where it
  differed** — about 30 renders, among them the two contents pages, the
  cards-split family (new bleeding photo cards), the icon-card splits, the
  gallery splits, the quotes (with **highlighted** phrases), table and list
  rows, and the 32px gap between the page header and the content.

## 2026-10-09 — Core names and Figma fixes; Nagarro intro sequence kept out of generation

- **Renamed** (old names stay registered, retired, for saved decks):
  core/gallery-grid-8-photo → core/gallery-wall-card,
  core/gallery-grid-6-photo → core/gallery-wall-focus,
  core/gallery-split-4-photo → core/gallery-split-photo-stack
  (core/gallery-split-3-photo was already taken by another layout).
- **core/divider-single retired** in favour of main/section-cover-01 (it is not
  in the Figma Master Slides).
- **main/text-02…06** carry an intent card that keeps the layout chooser off
  them: they are Nagarro's own introduction sequence, used as-is.
- **Two more Core renders rebuilt to match Figma**: gallery-split-4-photo-alt
  (one large photo left, text right — it rendered a 2×3 wall) and
  cards-grid-9-photo (nine photo + text cards — it rendered a header over nine
  bare photos). Every Core template that used the generic photo grid was
  checked against its frame; core/content-row-3-photo's frame (109:4996) no
  longer exists in Figma.

## 2026-10-09 — Case Study master complete; duplicate layouts retired; Core galleries match Figma

- **Case Study is complete: 23 templates** (slides 235–261), every one with an
  intent card. Batch 3 adds split-09 (headline + square photo), data-04 (three
  stat cards), grid-09 / grid-10 (area chart, with and without a paragraph),
  data-05 (award cards), grid-11 (client quote) and the contact closing.
- **Retiring a template (`replacedBy`).** A duplicate or renamed template keeps
  rendering for the decks that already use it, but is no longer offered for
  new slides, in the gallery or as an editor swap. portfolio/grid-14 →
  grid-09; portfolio/text-16 → the new portfolio/closing. The unused copies
  portfolio/text-04, 09 and 12 were deleted; portfolio/text-03 is the
  portfolio's one chapter cover.
- **main/photo-statement**: a reusable full-bleed photo statement for any
  content. main/text-02…06 stay as Nagarro's own sequence.
- **Page ranges on index-02 layouts** ("05 – 12"), ending before the closing.
- **Four Core galleries rebuilt to match Figma**: gallery-split-photo (tag
  badges), gallery-split-4-photo (one wide photo over two), gallery-grid-8-photo
  (staggered wall with a text card) and gallery-grid-6-photo (faded wall, one
  photo in focus).

## 2026-08-09 — Build flow simplified: no outline pause, no telemetry notices, redesigned build view

Three corrections from using the flow for real:

- **The outline review step is gone.** Generate or import now builds
  immediately — slides are edited afterwards in the workspace, where editing is
  actually good, instead of in a bare list of titles before the build. (The
  server's outline-editing endpoint remains for API use.)
- **Compose warnings no longer surface in the UI.** "Visual review skipped…" /
  "N slides kept a default layout…" are engine telemetry — they stay on the
  generation record for diagnosis but are not shown to the person building a
  deck.
- **The build view is redesigned.** The stage-chip row and the per-slide grid
  of green squares are replaced by a vertical checklist joined by a hairline
  rail: a mint check for passed stages, a breathing mint dot for the active
  one, hollow rings ahead — with the live detail sentence ("Choosing layouts
  for slides 7–12 of 19") inline next to the active stage.

---

## 2026-08-08 — Smart composition: analyze → plan → compose → review, live build view

Composition (both the prompt path and the `.pptx` import path) is no longer a single
flat "write content for every slide" pass. It now runs four stages, and the generation
record exposes live progress for each:

- **Analysis pass.** Each outline slide is read for what it actually is (cover, agenda,
  stat grid, sequence, comparison, team, quote, …) before any template is chosen —
  reusing the same "what kind of content is this" signal work already had for template
  shortlisting.
- **Deck plan + dividers.** A planning stage decides section boundaries across the whole
  deck up front and inserts `core/divider-single` slides at them, carrying only the
  section title (no invented body copy) — instead of every slide being scored against
  templates in isolation with no sense of the deck as a whole.
- **Dark placement.** Theme assignment (which slides render dark vs light) is now a
  deliberate placement pass constrained to `js/dark-safe.json` (`DARK_SAFE` in
  `product/domain/generation-service.js`), always opening and closing the deck dark and
  never putting a dark theme on a template that can't render it legibly.
- **Visual review pass.** After composition, a review stage (`slide-review-service.js`)
  scores each slide for visual defects and retries a repair; slides that can't be
  improved are left on their original layout and named individually in
  `composeWarnings` (e.g. `"Slide 5: a visual defect (score 33) did not improve after
  repair — kept the original layout."`) rather than shipped silently broken.
- **Live build timeline + copy fitting.** The generation record's `progress` field
  (`stage`, `detail`, per-slide `state`, `done`/`total`) updates through
  analyzing → planning → choosing → writing → reviewing → done, so the editor can show a
  live timeline instead of a blank spinner during the multi-minute compose. Slide copy
  written into a chosen layout is now fitted to that layout's capacity rather than
  overflowing or being truncated blind.
- **Acceptance run:** a 14-topic prompt (AI-adoption strategy deck) composed to 17
  slides with 2 section dividers and 3 dark-safe slides (cover + quote + closing,
  bookends dark) in ~6m50s; re-importing a 19-slide external `.pptx` (source images)
  composed to 24 slides with 2 dividers (title-only) and 4 dark-safe slides in ~7m05s,
  with spot-checked slide bodies confirmed transplanted verbatim from the source deck's
  own `proposedMapping`, not rewritten.

## 2026-08-08 — Template registry goes generated; contract validator, incremental dark audit, rewritten contract

Preparing the library for a ~200-template drop from the incoming Figma export. Five
pieces landed together:

- **Generated registry.** `js/templates/index.js` is no longer hand-maintained — it's
  generated from the contents of `js/templates/` by `npm run templates:index`
  (`tools/generate-template-index.mjs`), grouped by family and ordered for reviewable
  diffs. Hand-editing it is now pointless: the next regenerate overwrites it.
- **Contract validator.** `npm run templates:validate` (`tools/validate-templates.mjs`)
  checks every module against the v2 contract — required fields, `capacity`
  min/items/max ordering, known `slots` keys, and that `role`/`shape` are registered
  with the engine (`ROLE_CATEGORY`, `ROLE_AFFINITY`, `KNOWN_SHAPES`) — and names exactly
  what's missing rather than failing silently. `npm run templates:check` runs both
  steps in sequence.
- **Incremental dark-mode audit.** `node tools/audit-dark-mode.mjs` now supports
  `--missing` (audit only templates absent from `js/dark-safe.json`) and `--only=a,b`
  (audit a named subset), merging results into the existing file instead of
  re-auditing the whole library on every run.
- **Budgeted editor prompt.** The editor's AI-panel prompt is now sized against the
  measured fixed-text budget rather than assuming headroom, so it degrades
  predictably instead of failing silently past the CLI's prompt cap.
- **Templates page at scale.** `/templates.html` renders lazily so the gallery stays
  responsive as the library grows past 229 modules.
- **Rewritten `_CONTRACT.md`.** The template contract doc described the dead v1
  per-module-css format. It's now a full rewrite documenting the v2 module shape
  (with a real minimal example), the `css/primitives.css` styling model, the
  role/shape taxonomy rule, and the onboarding workflow for dropping in new modules.
  `CLAUDE.md`/`README.md`/`AGENTS.md` no longer hardcode "229" — they point at the
  registry as the source of truth for the count.

---

## 2026-08-08 — Import follow-ups: outline review before compose + stale-upload recompression

Imports now pause at the same **editable outline step** prompt-generated decks
use: upload a .pptx in the home composer, review/edit/remove slides, then
"Build the deck". The server-side merge (added earlier today) keys each edited
slide back to its source by `sourceSlide`, so removing a slide no longer risks
misattributing another slide's images or tables. The library page's one-click
import is unchanged.

Two smaller fixes: a stored image that predates recompression (e.g. saved
while sharp was unavailable) is now re-processed on the next import that
references it, instead of staying full-size forever; and rejecting an
oversized file resets the file picker so the same file can be re-selected.

---

## 2026-08-08 — Faithful .pptx import: source images, tables, and import-mode composition

The import limit is now **200 MB** (was far lower), enforced server-side and
pre-checked client-side before upload, so a real 70 MB deck with 40+ embedded
images no longer 413s.

**Extraction.** Import now pulls every embedded image, table, and grouped-text
element out of the source deck, not just outline text — the proposed mapping
each slide gets carries an `elements` inventory (`images`, `tables`, `charts`,
`bullets`) alongside the transplanted content.

**Images.** Each image is stored once under `assets/uploads/` keyed by a
content hash of its original bytes, so the same picture reused across slides
— or a deck re-imported — is deduped to a single file. Oversized images are
downscaled to 1920px wide via `sharp`; heavy opaque PNGs (decks routinely
carry 5–7 MB full-res screenshots) are re-encoded as JPEG. Note: PNGs that
carry an (often-unused) alpha channel keep the lossless PNG path and can stay
several MB even after recompression — see the acceptance report for
`2026-08-08-pptx-import-fidelity` task 8 for a concrete case.

**Per-deck image choice.** The import composer offers a source-vs-brand image
choice per deck (`imageSource: "source" | "brand"` on the generation): reuse
the deck's own images verbatim, or let composition pull from the brand photo
library as usual.

**Import-mode composition.** Approving a `.pptx` import now runs a distinct
compose branch from prompt-based generation: it transplants the source
content onto matching Master Template modules instead of generating fresh
copy, and splits a slide that's too dense for any single template into two.
Every degraded outcome — a dropped table row, a slide that fell back to its
default layout, a batch the composer couldn't fill — produces a
`composeWarnings` entry on the generation record; nothing fails silently.
Those warnings now surface on the Library page next to the deck they belong
to.

Dependency reshuffle that rode along with adding `sharp`: `pdf-lib`,
`playwright`, and `pptxgenjs` moved from `devDependencies` to
`dependencies` (the export runtime needs them at runtime in production,
not just in development), and `@anthropic-ai/sdk` moved the other way, into
`devDependencies`.

---

## 2026-08-08 — Rail cleanup, presentation origin markers, chrome editing

**Rail.** "All presentations" removed from the navigation (the Library page
stays reachable by URL). Recents rows dropped their date line and gained an
origin icon — a spark for prompt-generated decks, a document sheet for .pptx
imports — driven by a new `origin` field ("prompt" | "import") persisted on
each presentation and carried from the generation record through
`createPresentation`. Records that predate the field read as "prompt". The
Recents list now scrolls inside its own wrapper with a gradient mask, so rows
fade out at both edges instead of being cut on a hard line.

**Composer.** While a presentation is open in the workspace the Create
composer is now `visibility: hidden` (after its fade), not just opacity 0 —
browser extensions that decorate text fields (Grammarly) kept their floating
widget on top of the open deck as long as the field merely looked invisible.

**Editor — header/footer editable everywhere.** The v2 frame's top-bar meta
(studio · deck name · page) and footer columns are rendered from each slide's
own `content.meta`/`content.footer`, which the chrome decorator never reached
— on 222 templates those texts simply couldn't be edited. `decorateChrome`
now binds them as deck-kind editables with dotted fields ("meta.studio",
"footer.col1"); committing writes through `api.updateSlide` to EVERY slide
rendering that group (the page number stays per-slide). The generic text
decorator now excludes `.v2f-top`/`.v2f-footer` so a slide field whose value
equals the deck title can no longer claim the header's text node, and deck
editables carry a minimum hit size so short values (a page number, an empty
date cell) stay clickable.

## 2026-08-05 — Review findings applied (phases 1–4)

A four-discipline review (product, design, engineering, quality) audited the
whole project; these are the fixes. Each is described in full in its commit.

**Security.** The server bound `0.0.0.0` and served the repository root, so a
plain unauthenticated GET from any machine on the network returned the account's
password hash, live session tokens, every presentation, and enough of `.git` to
reconstruct the source. It now binds `127.0.0.1` and serves an explicit
allow-list. `serve.py`, which the exporter started on every export, was bound the
same way and is fixed too.

**Generation no longer fails in the browser.** Composing a deck takes 130–260
seconds and the client aborts at 150, so the user saw a timeout while the server
finished anyway — and the Retry offered next created a duplicate. Approval is
asynchronous now: claim, return 202, compose in the background, client polls.
PPTX import runs through the same path. Approving twice created two decks
because the status machine skipped validation on a same-status write; that is
fixed, and a 409 now carries the existing deck's id.

**Deck quality.** Prose is bounded to the length its layout was designed for
(only list *length* was bounded before, so a 780-character body printed over the
card beneath it, in the deck and in the exported .pptx). Speaker notes no longer
overwrite a template's own `notes` field, which was taking one slide down
entirely. The layout prompt's template catalog now scales with the library —
roughly 80 more templates would have silently broken composition for every deck.

**Export.** Its packages were `devDependencies` while every install path uses
`--omit=dev`, so it could not work for anyone who installed the product the
documented way. It also spawned `python3 serve.py` per export, an undocumented
dependency, and wrote artifacts to the OS temp directory where macOS deletes
them. Fixed, fixed, and moved into `product/data/exports/`.

**Data safety.** A corrupt store returned `[]` and the next write persisted it,
turning corruption into deletion; it is now set aside as `.corrupt-<timestamp>`.
The launcher started a second server against the same data folder when one was
already running, and the two raced each other's writes; it now opens the running
one.

**Product.** The Library filtered to `status: "Ready"`, hiding every AI-generated
deck — 7 of 9 — on a page promising "every presentation in your workspace"; it
asks "not archived" now, which cannot rot the same way. Added a rail link to it
(previously reachable only by typing the URL). One page-title scale across the
product instead of three. AI provider errors reach the user instead of becoming
a generic 500. The login throttle no longer locks out every user on the machine
when one account is guessed.

**Tests.** There were none. `npm test` now runs a suite covering the static
exposure, the approve race and status machine, prompt budgets against the live
template registry, deck-content rules, and throttle scoping.

---

## 2026-07-23 — Engineering documentation baseline

- Added `.ai/` (`AGENTS.md`, `REVIEW_CHECKLIST.md`, `TASK_TEMPLATE.md`) and
  `docs/` (`PROJECT_CONTEXT.md`, `ARCHITECTURE.md`, `DEVELOPMENT_GUIDE.md`,
  `ROADMAP.md`, `CHANGELOG.md`, `ADR/0001`–`0006`) as a permanent engineering
  knowledge base, produced by a full repository onboarding pass.
- No code behavior changed. This is documentation only — analysis of the
  existing implementation, not a feature or refactor.
- Identified and recorded (in `ROADMAP.md`) several pre-existing
  documentation/reality gaps: `js/templates/index.js`'s "GENERATED" comment
  with no generator script behind it, `outputs/` described as git-ignored with
  no `.gitignore` or `.git` present, and the `DAS-Lufthansa-*` folders under
  `generate/` not following the documented `source/`/`render/` convention.

---

## v1.4 — Jun 2026 *(backfilled from `wiki.html`)*

- Added export to editable PowerPoint + PDF (`tools/export-pptx.mjs`): a
  generic DOM→pptx translator that reproduces each slide as native text boxes,
  shapes, and images.
- Full Equip weight fidelity (Light / Regular / Medium / Bold / Black) via the
  real installed font family names; exact line wrapping; bullets, plates, and
  clipped graphics handled.
- Exports are versioned in `outputs/<deck-id>/`; the PDF is browser-rendered
  for pixel-exactness. Built on the `pptx` skill.

## v1.3 — Jun 2026 *(backfilled from `wiki.html`)*

- Organized `generate/` into one folder per presentation (`source/` + `render/`).
- Multiple Master Templates supported; dashboard separates Master Templates
  from Presentations.
- Added the in-app guide (`wiki.html`), reachable from the dashboard.
- Generated decks record which master they were `basedOn` (used when promoting
  slides back to a master).

## v1.2 — Jun 2026 *(backfilled from `wiki.html`)*

- Recreated the ASSA ABLOY — Connect Experience deck from a PPTX, with 11 new
  reusable templates + a shared `SectionHeader`.
- Aligned all titles/labels to the Master Template typography (regular/medium
  weights, eyebrow style of slide 60).
- Slide navigation moved to a compact top-center pill.
- No-cache dev server (`serve.py`) so edits load without a hard refresh.

## v1.1 — Jun 2026 *(backfilled from `wiki.html`)*

- Built the 91-slide Master Template from the Figma library + a 126-icon brand
  icon set.
- Full design review pass; logo/icon and layout fixes across the deck.

## v1.0 — Jun 2026 *(backfilled from `wiki.html`)*

- Component-based architecture: tokens → templates → decks → dashboard.
- Self-hosted Equip fonts; `Design.md` brand spec; responsive 1920×1080 scaling.
