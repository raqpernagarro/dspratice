// Foundation and deck component cards for the Nagarro Master Slides design system.
import fs from "node:fs";
import path from "node:path";
const OUT = "out/project/";
const w = (p, s) => { fs.mkdirSync(path.dirname(OUT + p), { recursive: true }); fs.writeFileSync(OUT + p, s); };

// A stage helper every preview shares: custom HTML in a scaled 1920×1080 slide, optionally cropped.
const HELPER = `
  var NS = window.NagarroSlides;
  // Slides follow the page theme: "Dark slide" renders every slide dark; "Light slide" keeps each master's own theme.
  function PT() { return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : undefined; }
  var __th = document.documentElement.getAttribute("data-theme");
  new MutationObserver(function () { if (document.documentElement.getAttribute("data-theme") !== __th) location.reload(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  function stage(html, o) {
    o = o || {}; var W = o.width || 640, s = W / 1920, top = o.top || 0, h = o.h || 1080;
    return '<div class="ns-viewport" style="width:' + W + 'px;height:' + Math.round(h * s) + 'px"><div class="ns-scaler" style="transform:scale(' + s + ') translateY(' + (-top) + 'px)"><section class="ns-stage" data-theme="' + (o.theme || PT() || "light") + '">' + html + '</section></div></div>';
  }
  function fit(el) { return Math.min(el.clientWidth || 640, 960); }`;

const doc = (title, group, height, subtitle, css, body, script) => `<!-- @dsCard group="${group}" height=${height}${subtitle ? ` subtitle="${subtitle}"` : ""} -->
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  [hidden] { display: none !important; }
  body { margin: 0; padding: 16px; font-family: var(--font-body); color: var(--fg-100); background: var(--bg-primary); }
  .ds-cells { display: flex; flex-direction: column; gap: 24px; }
  figure.ds-fig { margin: 0; display: flex; flex-direction: column; gap: 8px; min-width: 0; }
  .ds-fig > figcaption { font-size: 13px; line-height: 18px; color: var(--fg-50); }
  .ds-fig > figcaption code { font-family: inherit; color: var(--fg-100); }
  .ns-viewport { border-radius: 6px; outline: 0.5px solid var(--fg-20); }
${css || ""}
</style>
</head>
<body>
${body}
<script>
(function () {${HELPER}
${script}
})();
</script>
</body>
</html>
`;

const cards = {};

// ---------------------------------------------------------------- Stage
cards.Stage = {
  preview: doc("Stage", "Frame", 520, "1920×1080 · light and dark", `.ds-pair { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }`,
    `<div class="ds-pair"><figure class="ds-fig"><div id="a"></div><figcaption><code>theme: "light"</code>: white ground, <code>fg-100</code> ink. Every content slide.</figcaption></figure><figure class="ds-fig"><div id="b"></div><figcaption><code>theme: "dark"</code>: black/100 ground (#010716), white ink, mint unchanged. Covers, dividers, closing.</figcaption></figure></div>`,
    `  var a = document.getElementById("a"), b = document.getElementById("b");
  var W = Math.floor(((document.body.clientWidth || 900) - 48) / 2);
  if (W < 260) W = (document.body.clientWidth || 360) - 32;
  NS.mount(a, "main/cover-01", { title: "Presentation title", subtitle: "Subtitle here" }, { width: W, theme: "light" });
  NS.mount(b, "main/cover-01", { title: "Presentation title", subtitle: "Subtitle here" }, { width: W, theme: "dark" });`),
  readme: `# Stage

The slide canvas: every master slide is a 1920×1080 \`<section class="ns-stage" data-theme>\` authored at literal pixels and scaled as a whole to fit its frame.

## Rules

- Author at \`frame-w\` × \`frame-h\` (1920×1080). Never viewport units, never responsive breakpoints inside a slide: the viewer scales the stage with \`transform: scale()\`.
- A slide carries its own theme. \`data-theme="light"\` pins the light colour tokens on the stage; \`data-theme="dark"\` pins the dark ones (\`bg-primary\` becomes black/100 #010716, \`fg-100\` white, every \`fg\` step becomes the same alpha of white). \`accent-primary\` never changes. The pinned values are the HTML's own, so a slide renders exactly as in the product.
- Every template is theme-ready: pass \`theme: "dark"\` to any of them. Use dark for the cover, chapter dividers and the closing slide (the dark-light-dark sandwich), and light for content.
- The outer margin is \`margin-x\` (40px) on all four sides. Content starts at y=156, below the 84px header and its 32px gap; the footer sits at y=996–1040.
- Motion: in the product, \`.reveal\` children rise in on the \`translate\` property (never \`transform\`, which would fight layout transforms). The stage here renders at rest.

## What you provide

A template name and content (\`NagarroSlides.render\`, \`mount\`, \`renderDeck\`). To scale a slide yourself: wrap it in \`.ns-viewport\` (the visible box, \`width × width·9/16\`) and \`.ns-scaler\` (\`transform: scale(width / 1920)\`).
`,
};

// ---------------------------------------------------------------- Header
cards.Header = {
  preview: doc("Header", "Frame", 300, "topBar() · the Figma Header", "",
    `<div class="ds-cells"><figure class="ds-fig"><div id="a"></div><figcaption><code>topBar({ studio, name, page })</code>: logo, then studio | presentation name | page over the hairline.</figcaption></figure><figure class="ds-fig"><div id="b"></div><figcaption><code>topBar(meta, { logoOnly: true })</code>: covers and full-bleed layouts.</figcaption></figure><figure class="ds-fig"><div id="c"></div><figcaption>Dark slide: the same component, ink from <code>fg-100</code>.</figcaption></figure></div>`,
    `  var W = fit(document.body) - 32, root = function (x) { return '<div class="v2f-root" style="height:1080px">' + x + "</div>"; };
  var m = { studio: "Product Studio", name: "Claims platform modernisation", page: "04" };
  document.getElementById("a").innerHTML = stage(root(NS.blocks.topBar(m)), { width: W, h: 136 });
  document.getElementById("b").innerHTML = stage(root(NS.blocks.topBar(m, { logoOnly: true })), { width: W, h: 136 });
  document.getElementById("c").innerHTML = stage(root(NS.blocks.topBar(m)), { width: W, h: 136, theme: "dark" });`),
  readme: `# Header

The Figma "Header": the Nagarro logo with the studio | presentation name | page meta, over a 1px divider. Rendered by \`NagarroSlides.blocks.topBar(meta, { logoOnly })\`, identical on every slide of every family.

## Anatomy

- An 84px block at the top margin: a 64px logo row, 20px padding, then the divider (at y=124 on the slide).
- Logo: the wordmark in \`fg-100\`, 47.89px tall. Never recolour it, never swap in a lockup file.
- Meta: \`meta\` text style (Equip 16/24 regular) in \`fg-50\`, items separated by 24px and a 1px \`fg-50\` rule.
- Content always starts 32px below the divider (y=156), whatever the slide's own gap.

## What you provide

\`{ studio, name, page }\`. \`studio\` defaults to "Product Studio" and \`name\` to "Presentation Name": always set both. \`renderDeck\` numbers \`page\` for you. Use \`{ logoOnly: true }\` only where the Figma master has no meta (covers, full-bleed photo slides).

## Don't

- Draw a custom logo row, a coloured header bar or a side ribbon.
- Put the client's logo in the header. Client logos go in a logo wall or a cover image.
`,
};

// ---------------------------------------------------------------- Footer
cards.Footer = {
  preview: doc("Footer", "Frame", 220, "footerBar() · the Figma Footer", "",
    `<div class="ds-cells"><figure class="ds-fig"><div id="a"></div><figcaption><code>footerBar({ col1, col2, col3, copyright })</code></figcaption></figure><figure class="ds-fig"><div id="b"></div><figcaption>On a dark slide</figcaption></figure></div>`,
    `  var W = fit(document.body) - 32, f = { col1: "Claims platform modernisation", col2: "Prepared for [Client]", col3: "October 2026", copyright: "© 2026" };
  var html = '<div class="v2f-root" style="height:1080px"><div style="flex:1"></div>' + NS.blocks.footerBar(f) + "</div>";
  document.getElementById("a").innerHTML = stage(html, { width: W, top: 960, h: 120 });
  document.getElementById("b").innerHTML = stage(html, { width: W, top: 960, h: 120, theme: "dark" });`),
  readme: `# Footer

The Figma "Footer": three equal columns over 0.5px \`fg-50\` rules — the presentation name, "Prepared for [Client]", and the date beside the copyright. Rendered by \`NagarroSlides.blocks.footerBar(footer)\`.

## Anatomy

- Sits at the bottom margin, y=996–1040. Columns are separated by \`space-24\`; each has 20px top padding.
- Text: \`TextMD\` (Equip 16/24) at regular weight, \`fg-50\`, one line, no wrapping.
- The third column splits: \`col3\` (a date, empty by default) at left, \`copyright\` at right.

## What you provide

\`{ col1, col2, col3, copyright }\`. Set \`col1\` to the deck's name and \`col2\` to "Prepared for <Client>"; pass them once as \`renderDeck(slides, { footer })\` rather than per slide. Defaults are placeholders ("Presentation Name", "Prepared for [Client]", "© 2026") and must never ship.

## Don't

- Add page numbers here (they live in the header meta), a confidentiality banner, or a coloured bar.
`,
};

// ---------------------------------------------------------------- PageHeader
cards.PageHeader = {
  preview: doc("PageHeader", "Frame", 420, "pageHeader() · caption, title, subtitle, intro", "",
    `<div class="ds-cells"><figure class="ds-fig"><div id="a"></div><figcaption>Default: 680px heading block, intro at right, centred on the row.</figcaption></figure><figure class="ds-fig"><div id="b"></div><figcaption><code>{ halves: true }</code>: the Core PageHeader, two equal top-aligned halves, subtitle 36/44.</figcaption></figure></div>`,
    `  var W = fit(document.body) - 32, h = { caption: "Approach", title: "How we will deliver", subtitle: "Three phases, one team", intro: "We start small, prove value in eight weeks and scale what works across the claims estate." };
  var wrap = function (x) { return '<div class="v2f-root" style="height:1080px">' + NS.blocks.topBar({ studio: "Product Studio", name: "Claims platform modernisation", page: "05" }) + x + "</div>"; };
  document.getElementById("a").innerHTML = stage(wrap(NS.blocks.pageHeader(h)), { width: W, h: 420 });
  document.getElementById("b").innerHTML = stage(wrap(NS.blocks.pageHeader(h, { halves: true })), { width: W, h: 420 });`),
  readme: `# PageHeader

The heading block at the top of a content slide: caption, title and subtitle at left, an optional intro sentence at right. Rendered by \`NagarroSlides.blocks.pageHeader({ caption, title, subtitle, intro }, { halves })\`.

## Anatomy

- **caption**: \`TextXL\` (Equip 20/28) at regular weight, \`fg-50\`. The chapter or topic, a few words.
- **title**: \`Heading2\` (Equip Extended 60/68 medium, -2%), \`fg-100\`. The slide's claim.
- **subtitle**: \`Heading3\` (48/56 medium), \`fg-50\`. Optional second line.
- **intro**: \`Heading5\` (28/36 medium), \`fg-50\`, at right. One or two sentences of framing.
- Default heading block is 680px wide; \`halves\` splits the row into two equal top-aligned halves with the subtitle at \`Heading4\` 36/44 (the Core family's header).
- The block is capped at 340px tall: a paragraph in a title field is clipped, not reflowed. Keep titles to one or two lines.

## What you provide

Short strings. Templates that use a PageHeader name these fields \`caption\`, \`title\`, \`subtitle\`, \`intro\` in their schema.
`,
};

// ---------------------------------------------------------------- SectionHeader
cards.SectionHeader = {
  preview: doc("SectionHeader", "Frame", 300, "eyebrow → heading → subhead", "",
    `<div class="ds-cells"><figure class="ds-fig"><div id="a"></div><figcaption><code>SectionHeader({ eyebrow, heading, subhead })</code>: absolutely positioned at <code>top: 182px</code>.</figcaption></figure></div>`,
    `  var W = fit(document.body) - 32;
  document.getElementById("a").innerHTML = stage(NS.blocks.SectionHeader({ eyebrow: "What we heard", heading: "Claims handlers spend a third of their day re-keying data", subhead: "Interviews with 24 handlers across three regional offices, June 2026." }), { width: W, h: 420 });`),
  readme: `# SectionHeader

The shared eyebrow → heading → subhead block for content slides built on the legacy positioned layout. Rendered by \`NagarroSlides.blocks.SectionHeader({ eyebrow, heading, subhead })\` at \`left: margin-x; top: 182px\`.

## Anatomy

- **eyebrow**: Equip 16px regular, -0.48px tracking (\`TextMD\` size), in the slide's text colour. Not mint.
- **heading**: \`Heading3\` size (Equip Extended 48/56) at regular weight, -2px. Never bold.
- **subhead**: Equip 16 at 1.3 line height in \`muted-color\`, max 1200px.

## When to use

New v2 slides use the PageHeader inside the frame. SectionHeader remains for templates and blocks that position content absolutely; don't mix the two on one slide.
`,
};

// ---------------------------------------------------------------- Logo
cards.Logo = {
  preview: doc("Logo", "Brand", 260, "the wordmark, inline", `.ds-pair { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; } .ds-sw { display: flex; align-items: center; justify-content: center; height: 160px; border-radius: 6px; outline: 0.5px solid var(--fg-20); } .ds-sw svg { height: 48px; width: auto; } .ds-l { background: #ffffff; color: #010716; } .ds-d { background: #010716; color: #ffffff; }`,
    `<div class="ds-pair"><figure class="ds-fig"><div class="ds-sw ds-l" id="a"></div><figcaption>On white: <code>fg-100</code> ink</figcaption></figure><figure class="ds-fig"><div class="ds-sw ds-d" id="b"></div><figcaption>On the dark ground (black/100): white ink</figcaption></figure></div>`,
    `  document.getElementById("a").innerHTML = NS.blocks.logo();
  document.getElementById("b").innerHTML = NS.blocks.logo();`),
  readme: `# Logo

The Nagarro wordmark as inline SVG in \`currentColor\`, so it takes the ink of whatever it sits in. \`NagarroSlides.blocks.logo()\` returns it; the Header places it on every slide.

## Rules

- On slides, use the inline wordmark through the Header. Its ink is \`fg-100\`: #010716 on light slides, white on dark slides; the mark is mint.
- For formal placements and exports outside slides, use the official lockups in **Assets › Logos**: Horizontal, Vertical, Tagline and Small, each in Dark, Light, White, Green and Petrol Black. "Light" lockups are for light grounds (petrol-black and mint ink); "Dark" lockups are for dark grounds (white and mint ink).
- Never redraw, stretch, recolour outside the lockup set, add effects, or place the logo on a busy photo without a scrim.
`,
};

// ---------------------------------------------------------------- Icon
cards.Icon = {
  preview: doc("Icon", "Brand", 760, "126 brand icons · currentColor", `.ds-bar { display: flex; gap: 8px; align-items: center; margin-bottom: 12px; } .ds-bar input { flex: 1 1 auto; min-width: 0; font: inherit; font-size: 14px; padding: 8px 12px; border: 0.5px solid var(--border-default); border-radius: 8px; background: transparent; color: var(--fg-100); } .ds-n { font-size: 13px; color: var(--fg-50); }
  .ds-icons { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 8px; max-height: 640px; overflow: auto; }
  .ds-ic { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 12px 4px 8px; border-radius: 6px; border: 0; background: none; color: var(--fg-100); font: inherit; cursor: pointer; }
  .ds-ic:hover, .ds-ic:focus-visible { background: var(--fg-5); outline: none; } .ds-ic svg { width: 40px; height: 40px; } .ds-ic span { font-size: 11px; line-height: 14px; color: var(--fg-50); text-align: center; overflow-wrap: anywhere; }`,
    `<div class="ds-bar"><input id="q" type="search" placeholder="Search icons" aria-label="Search icons"><span class="ds-n" id="n"></span></div><div class="ds-icons" id="g"></div>`,
    `  var g = document.getElementById("g"), q = document.getElementById("q"), n = document.getElementById("n");
  g.innerHTML = NS.iconNames.map(function (k) { return '<button class="ds-ic" title="Copy icon(\\'' + k + '\\')" data-k="' + k + '">' + NS.icon(k) + "<span>" + k + "</span></button>"; }).join("");
  function f() { var v = q.value.trim().toLowerCase(), c = 0; g.querySelectorAll(".ds-ic").forEach(function (b) { var ok = !v || b.dataset.k.indexOf(v) > -1; b.hidden = !ok; if (ok) c++; }); n.textContent = c + " icons"; }
  q.addEventListener("input", f); f();
  g.addEventListener("click", function (e) { var b = e.target.closest(".ds-ic"); if (!b) return; var s = b.querySelector("span"), k = b.dataset.k;
    var ok = function () { s.textContent = "copied"; setTimeout(function () { s.textContent = k; }, 1200); };
    if (navigator.clipboard) navigator.clipboard.writeText('NagarroSlides.icon("' + k + '")').then(ok, function () {}); });`),
  readme: `# Icon

126 brand icons from the Nagarro Figma "Scribble icons" set, each a 96×96-viewBox SVG drawn in \`currentColor\`. \`NagarroSlides.icon(name)\` returns the inline SVG; \`NagarroSlides.iconNames\` lists them. Click an icon in the preview to copy its call.

## Rules

- Icons inherit the text colour: \`fg-100\` by default, \`accent-primary\` for the one accent moment on a dark slide.
- Size them with the wrapper (width/height); they have no fixed size. Typical: 48–96px on a card, 24–32px inline with text.
- One icon style per slide. Don't mix these line icons with the caring-value icons (**Assets › Caring**) on the same slide.
- Templates with an \`icon\` field take one of these names.
`,
};

// ---------------------------------------------------------------- Metric / MetricCard
cards.Metric = {
  preview: doc("Metric", "Blocks", 360, "a number with its label", "",
    `<div class="ds-cells"><figure class="ds-fig"><div id="a"></div><figcaption><code>standard</code> large · medium · small, then <code>eyebrow</code> large · medium</figcaption></figure></div>`,
    `  var W = fit(document.body) - 32, m = NS.blocks.metric;
  var row = '<div class="v2f-root" style="height:1080px;justify-content:center"><div style="display:flex;gap:96px;align-items:flex-start;flex-wrap:wrap">' +
    m({ label: "claims automated", value: "62%" }, { size: "large" }) + m({ label: "handling time", value: "-35%" }, { size: "medium" }) + m({ label: "regional offices", value: "3" }, { size: "small" }) +
    m({ label: "Savings in year one", value: "€4.2M" }, { style: "eyebrow", size: "large" }) + m({ label: "Go-live", value: "Q2 2027" }, { style: "eyebrow", size: "medium" }) + "</div></div>";
  document.getElementById("a").innerHTML = stage(row, { width: W, top: 300, h: 480 });`),
  readme: `# Metric

The Figma "Metric": a number with its label. \`NagarroSlides.blocks.metric({ label, value }, { style, size, emphasis, align, showLabel })\`; used by the pitch and marketing templates.

## Props

- \`style\`: \`"standard"\` (value, label under it) or \`"eyebrow"\` (small label above the value).
- \`size\`: \`"large"\` | \`"medium"\` | \`"small"\` (eyebrow: large | medium).
- \`emphasis\`: \`"value"\` (default) or \`"label"\`: which line carries the weight.
- \`align\`: \`"left"\` | \`"center"\`. \`showLabel\`: default true.

## Rules

- A metric is a real figure with its unit in the value ("62%", "€4.2M", "Q2 2027"). Never invent numbers to fill a layout; if you have two figures, choose a two-metric layout.
- The label says what was measured, in sentence case, without a trailing full stop.
`,
};
cards.MetricCard = {
  preview: doc("MetricCard", "Blocks", 420, "a key figure on a tinted card", "",
    `<div class="ds-cells"><figure class="ds-fig"><div id="a"></div><figcaption><code>statement</code> · <code>single</code> · <code>multiple</code></figcaption></figure></div>`,
    `  var W = fit(document.body) - 32, c = NS.blocks.metricCard;
  var row = '<div class="v2f-root" style="height:1080px;justify-content:center"><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;height:520px">' +
    c({ value: "62% of claims", text: "now settle without a handler touching them." }, { layout: "statement", tone: "t20" }) +
    c({ label: "Handling time", value: "-35%", description: "Median time from first notice to settlement, pilot region." }, { layout: "single" }) +
    c({ title: "Pilot results", metrics: [{ label: "Claims", value: "18k" }, { label: "NPS", value: "+21" }], description: "Twelve weeks, one regional office." }, { layout: "multiple" }) + "</div></div>";
  document.getElementById("a").innerHTML = stage(row, { width: W, top: 260, h: 560 });`),
  readme: `# MetricCard

The Figma "MetricCard": a key figure on a tinted card. \`NagarroSlides.blocks.metricCard(content, { layout, size, showTitle, showDescription, showIcon, icon, tone })\`.

## Layouts and content

- \`"statement"\`: \`{ value, text }\`, a sentence whose first part is highlighted. \`tone\` sets the fill: \`"t20"\` (default), \`"t25"\`, \`"t50"\`, \`"t75"\`, \`"t100"\`.
- \`"single"\`: \`{ label, value, description }\`, one eyebrow Metric and an optional description. \`size: "large"\` sets the value at 150px with the description pinned to the foot.
- \`"multiple"\`: \`{ title, metrics: [{label, value}, {label, value}], description }\`, two metrics under a title.

## Rules

- Cards in a row share one layout and one tone. \`showIcon\` takes a name from **Icon**.
- \`radius-15\` is the card radius; no shadows.
`,
};

// ---------------------------------------------------------------- SampleDeck
const SAMPLE = [
  { template: "main/cover-01", theme: "dark", title: "Modernising the claims platform", subtitle: "Discovery findings and delivery plan" },
  { template: "main/index-01", title: "Contents", items: [{ number: "01", label: "Where you are today" }, { number: "02", label: "What we heard" }, { number: "03", label: "Our approach" }, { number: "04", label: "Plan and team" }] },
  { template: "main/section-cover-01", theme: "dark", number: "01", title: "Where you are today" },
  { template: "core/quote-single", quote: "We spend more time **moving data between screens** than talking to the people who made the claim.", attribution: "Claims handler, regional office" },
  { template: "core/cards-row-4", caption: "Approach", title: "Four moves, in order", subtitle: "Each one pays for the next", cards: [
    { title: "Map", body: "Two weeks with handlers and engineers to map every system a claim touches." },
    { title: "Automate", body: "Remove re-keying between intake, policy and payment systems first." },
    { title: "Modernise", body: "Move the claim record to one service with an event history." },
    { title: "Scale", body: "Roll out region by region, measuring handling time at each step." } ] },
  { template: "pitch/grid-15", caption: "Plan", title: "Delivery roadmap", steps: [
    { date: "Q4 2026", title: "Discovery", body: "Process maps,\nsystem inventory,\nbaseline metrics." },
    { date: "Q1 2027", title: "Pilot", body: "One office,\nintake to payment\nautomated." },
    { date: "Q2 2027", title: "Rollout", body: "Remaining regions,\nhandler training." },
    { date: "Q3 2027", title: "Run", body: "Hand-over to your\nplatform team." } ] },
  { template: "core/team-row-4-photo", caption: "Team", title: "Who you will work with", subtitle: "One cross-functional team" },
  { template: "main/closing-01", theme: "dark", title: "Imagine what we can do together!" },
];
cards.SampleDeck = {
  preview: doc("SampleDeck", "Decks", 1300, "renderDeck() · 8 slides, the dark-light-dark sandwich", `.ds-deck { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px 16px; } .ds-note { font-size: 13px; color: var(--fg-50); margin: 0 0 16px; } pre { margin: 0 0 20px; padding: 12px; border-radius: 6px; background: var(--fg-5); font-size: 12px; line-height: 17px; overflow: auto; max-height: 220px; }`,
    `<p class="ds-note">Example content, made up to show the system. Covers, the divider and the closing are dark; content is light. Header meta and footer come from the deck options; page numbers are automatic.</p><pre id="src"></pre><div class="ds-deck" id="d"></div>`,
    `  var slides = ${JSON.stringify(SAMPLE)};
  var deck = { title: "Claims platform modernisation", studio: "Product Studio", footer: { col1: "Claims platform modernisation", col2: "Prepared for [Client]", copyright: "© 2026" } };
  document.getElementById("src").textContent = "NagarroSlides.renderDeck(" + JSON.stringify(slides.slice(0, 2), null, 2).replace(/\\n\\]$/, ",\\n  …\\n]") + ", " + JSON.stringify(deck) + ")";
  var html = NS.renderDeck(slides, deck), d = document.getElementById("d"), W = Math.max(280, Math.floor(((d.clientWidth || 900) - 32) / 3));
  if ((d.clientWidth || 900) < 600) W = d.clientWidth || 320;
  d.innerHTML = html.map(function (h, i) { var s = W / 1920; return '<figure class="ds-fig"><div class="ns-viewport" style="width:' + W + "px;height:" + Math.round(1080 * s) + 'px"><div class="ns-scaler" style="transform:scale(' + s + ')">' + h + "</div></div><figcaption>" + String(i + 1).padStart(2, "0") + " · <code>" + slides[i].template + "</code></figcaption></figure>"; }).join("");`),
  readme: `# SampleDeck

An eight-slide deck built with one call, \`NagarroSlides.renderDeck(slides, deck)\`: the pattern every generated deck follows. The content is a made-up example.

## The pattern

1. **Open dark.** A cover with \`theme: "dark"\`.
2. **Orient.** An index or table of contents listing the chapters.
3. **Chapter dividers dark**, content light.
4. **Vary the templates.** Each slide's template matches its content: a quote for a quote, cards for parallel items, a timeline for phases, a team row for people. No layout twice in a row.
5. **Close dark.** A closing slide with \`theme: "dark"\`.

## What you provide

- \`slides\`: \`[{ template, theme?, ...fields }]\`. Field names come from each template's schema (catalog sections, or click a slide in a Slide library card).
- \`deck\`: \`{ title, studio, footer: { col1, col2, col3, copyright } }\`. The header meta and footer repeat on every slide; \`page\` is numbered for you.
- Fill every field you want shown: omitted fields fall back to the template's placeholder example content (the team photos above are the template's own example).
`,
};

// ---------------------------------------------------------------- PhotoLibrary
cards.PhotoLibrary = {
  preview: doc("PhotoLibrary", "Decks", 900, "210 brand photos · captioned and tagged", `.ds-bar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 12px; } .ds-bar input, .ds-bar select { font: inherit; font-size: 14px; padding: 8px 12px; border: 0.5px solid var(--border-default); border-radius: 8px; background: var(--bg-primary); color: var(--fg-100); } .ds-bar input { flex: 1 1 200px; min-width: 0; } .ds-n { font-size: 13px; color: var(--fg-50); }
  .ds-ph { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; max-height: 760px; overflow: auto; }
  .ds-p.ds-fig { margin: 0; display: flex; flex-direction: column; gap: 6px; min-width: 0; } .ds-p img { width: 100%; aspect-ratio: 3 / 2; object-fit: cover; border-radius: 6px; background: var(--fg-5); display: block; }
  .ds-p figcaption { font-size: 11px; line-height: 15px; color: var(--fg-50); display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; } .ds-p code { font-family: inherit; color: var(--fg-100); overflow-wrap: anywhere; }`,
    `<div class="ds-bar"><input id="q" type="search" placeholder="Search descriptions and tags (meeting, laptop, outdoor…)" aria-label="Search photos"><select id="o" aria-label="Orientation"><option value="">Any orientation</option><option>landscape</option><option>portrait</option><option>square</option></select><span class="ds-n" id="n">Loading photos…</span></div><div class="ds-ph" id="g"></div>`,
    `  var g = document.getElementById("g"), q = document.getElementById("q"), o = document.getElementById("o"), n = document.getElementById("n"), photos = [];
  fetch("../../media/assets/photography/manifest.json").then(function (r) { return r.json(); }).then(function (m) {
    photos = m.photos || [];
    g.innerHTML = photos.map(function (p, i) { return '<figure class="ds-p" data-i="' + i + '"><img loading="lazy" alt="' + NS.esc(p.description || "") + '" src="../../media/assets/photography/' + encodeURIComponent(p.file) + '"><figcaption>' + NS.esc(p.description || "") + "<br><code>assets/photography/" + NS.esc(p.file) + "</code></figcaption></figure>"; }).join("");
    f();
  }).catch(function () { n.textContent = "Photo manifest not available"; });
  function f() { var v = q.value.trim().toLowerCase(), or = o.value, c = 0;
    g.querySelectorAll(".ds-p").forEach(function (el) { var p = photos[+el.dataset.i], hay = ((p.description || "") + " " + (p.tags || []).join(" ")).toLowerCase(); var ok = (!v || hay.indexOf(v) > -1) && (!or || p.orientation === or); el.hidden = !ok; if (ok) c++; });
    n.textContent = c + " of " + photos.length + " photos"; }
  q.addEventListener("input", f); o.addEventListener("change", f);`),
  readme: `# PhotoLibrary

The Nagarro brand photo library: 210 authentic workplace photographs, each with a written description, tags, orientation and people count in \`media/assets/photography/manifest.json\`. Search it in the preview; reference a photo in any template image field by its path, \`assets/photography/<file>\`.

## Rules

- Pick by content first: the description and tags say what is in the frame. Prefer people genuinely working together over posed or empty scenes.
- Landscape for full-bleed covers and split layouts; portrait for side-by-side text and image.
- No heavy filters, duotones or colour washes. For type over a photo, place white text over the darker region or add a \`bg-overlay-50\` scrim.
- Use the same photo once per deck.
- Photos are re-encoded for this system (longest side 1440px). For print, take the originals from the repository's \`assets/photography/\`.
`,
};

for (const [name, c] of Object.entries(cards)) {
  w(`components/${name}/preview.html`, c.preview);
  w(`components/${name}/README.md`, c.readme);
}
console.log("cards", Object.keys(cards).join(", "));
