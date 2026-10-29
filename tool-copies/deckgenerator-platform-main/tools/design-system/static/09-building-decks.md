# Building decks

A deck is a list of slide specs, each a master template plus its content. This system lets you build one in three places.

## 1. With Claude, from this design system

Give Claude this design system's link and the source material (a brief, notes, an old .pptx or PDF). Ask it to read the README first. It should then:

1. **Extract the content** of each source slide or section: the claim, the supporting points, the numbers, the people, the images.
2. **Map** each one to the closest master template (*The master slide library › Choosing a template*) and show you the mapping as a plain list ("source 3 → `core/cards-row-4`") before building.
3. **Fill the fields** from the template's schema (*Slide catalog* sections, or the slide's detail panel) with the real content. No lorem ipsum, no invented figures.
4. **Render** the deck with `NagarroSlides.renderDeck` on a page that loads this system's files (below), dark cover and closing, light content.
5. **Flag** any slide with no good template and ask before inventing one (*Governance*).

## 2. As a standalone HTML deck

Download the system's files (the Files view lists them all) and keep their folder layout: `components/`, `fonts/`, `media/`, `kit/`. Open `kit/deck-starter.html`, replace its `slides` and `deck` objects, and open it in a browser. It loads the bundle, the stylesheet and the fonts from the neighbouring folders, renders every slide, and has a present mode (arrow keys, `F` for fullscreen).

The minimum page:

```html
<link rel="stylesheet" href="components/bundle.css">
<style>
  @font-face { font-family: "Equip"; src: url("fonts/Equip-Medium.woff2") format("woff2"); font-weight: 500; }
  /* …one @font-face per file in fonts/ (Equip and Equip Extended, 300/400/500/700) */
</style>
<div id="deck"></div>
<script src="components/bundle.js"></script>
<script>
  NagarroSlides.config({ assetBase: "media/" });
  const html = NagarroSlides.renderDeck([
    { template: "main/cover-01", theme: "dark", title: "Modernising the claims platform", subtitle: "Discovery findings and delivery plan" },
    { template: "core/cards-row-4", caption: "Approach", title: "Four moves, in order", cards: [ /* … */ ] },
    { template: "main/closing-01", theme: "dark", title: "Imagine what we can do together!" },
  ], { title: "Claims platform modernisation", studio: "Product Studio",
       footer: { col1: "Claims platform modernisation", col2: "Prepared for Acme Insurance", copyright: "© 2026" } });
  document.getElementById("deck").innerHTML = html.join("");
</script>
```

`bundle.css` carries fallbacks for every non-colour token and pins each slide's colours, so it works without `tokens.css`; only the fonts must be declared.

## 3. In Nagarro Presentation Studio

The Studio (the `Presentation_v1` repository, `npm start`) uses the same engine and the same 508 templates. It is the place for editable output: generate a deck from a prompt or import a `.pptx`, refine it in the editor, and **Export** to editable PowerPoint or PDF. This design system renders HTML slides; it does not export `.pptx` by itself.

## The API

```ts
NagarroSlides.render(name, content?, { theme?, meta?, footer?, useExample? }) → string
NagarroSlides.renderDeck(slides, { title?, studio?, meta?, footer? })       → string[]
NagarroSlides.mount(element, name, content?, { width?, theme? })           → HTMLElement
NagarroSlides.thumb(name, content?, { width? })                           → string
NagarroSlides.get(name) · find({ category, family, role, theme }) · byCategory()
NagarroSlides.templates   // 508 × { name, family, role, category, shape, theme, capacity, use, intent, schema, example }
NagarroSlides.config({ assetBase })
NagarroSlides.blocks.{ topBar, footerBar, pageHeader, frame, SectionHeader, metric, metricCard, logo }
NagarroSlides.icon(name) · NagarroSlides.iconNames
```

Full types: `components/index.d.ts`.

## A slide spec

```json
{
  "template": "core/cards-row-4",
  "theme": "light",
  "caption": "Approach",
  "title": "Four moves, in order",
  "subtitle": "Each one pays for the next",
  "cards": [
    { "title": "Map", "body": "Two weeks with handlers and engineers to map every system a claim touches." },
    { "title": "Automate", "body": "Remove re-keying between intake, policy and payment systems first." },
    { "title": "Modernise", "body": "Move the claim record to one service with an event history." },
    { "title": "Scale", "body": "Roll out region by region, measuring handling time at each step." }
  ]
}
```

`meta` (`{ studio, name, page }`) and `footer` (`{ col1, col2, col3, copyright }`) can sit on a slide, but set them once on the deck instead; `renderDeck` numbers the pages.

## Checklist before you share a deck

- Every slide is a registered master template; no two neighbours share one.
- Dark cover, dark dividers, dark closing; light content.
- Header `name` and footer `col1`/`col2` are the real deck and client names on every slide.
- No placeholder text from a template example is left ("Title", "Caption", "Name Surname", "Lorem ipsum", example photos you didn't choose).
- One mint moment per slide; no extra colours.
- Numbers have units and a source.
