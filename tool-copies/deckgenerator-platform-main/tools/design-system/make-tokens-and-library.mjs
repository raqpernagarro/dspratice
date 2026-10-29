// Generates the Nagarro Master Slides design-system files under out/project/.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const R = fileURLToPath(new URL("../..", import.meta.url)).replace(/\/$/, "");
const OUT = "out/project/";
const w = (p, s) => { fs.mkdirSync(path.dirname(OUT + p), { recursive: true }); fs.writeFileSync(OUT + p, s); };
const inv = JSON.parse(fs.readFileSync("inventory.json", "utf8"));
const SRC = fs.existsSync("source.json") ? JSON.parse(fs.readFileSync("source.json", "utf8")) : { ref: "unknown", date: new Date().toISOString().slice(0, 10) };

// ---------------------------------------------------------------- tokens.json
// Colour tokens are the Figma variables, nothing else: the Theme collection (Light, Dark)
// and the Colors primitives it aliases, from figma-tokens.json (read from the Figma file).
// The HTML has its own working variables (fin-*, fill-*, hairline-*, legacy chrome);
// they are pinned on each slide in bundle.css (CODE below) but are not design tokens.
const FIG = JSON.parse(fs.readFileSync(fileURLToPath(new URL("./figma-tokens.json", import.meta.url)), "utf8"));
const THEME_USAGE = {
  "fg-100": "Primary text, headings, the logo. 19.6:1 on `bg-primary` in both themes.",
  "fg-75": "Strong secondary text. 9.6:1 on white, 11.2:1 on the dark ground.",
  "fg-60": "Secondary body copy. 5.4:1 on white, 7.3:1 on the dark ground.",
  "fg-50": "Captions, subtitles, intro lines, header meta and the footer. 3.8:1 on white, 5.3:1 dark (the HTML renders it stronger; see Colour).",
  "fg-30": "Decorative and disabled text; never reading copy (2.1:1 on white).",
  "fg-25": "De-emphasised numerals: page and index numbers, oversized digits. 1.8:1 on white, so display sizes only (the HTML renders it stronger; see Colour).",
  "fg-20": "Strong dividers and inactive marks.",
  "fg-10": "Dividers, table rules and subtle outlines.",
  "fg-5": "Subtle surface tint: image placeholders, tinted cards, chart panels. Text on it uses `fg-100`.",
  "fg-muted": "Solid navy for metadata: 3.1:1 on white (24px and up, or non-text), 8.6:1 on the dark ground.",
  "bg-primary": "Slide ground: white on light slides, black/100 (#010716) on dark slides.",
  "bg-secondary": "A barely-there wash over the ground (5%).",
  "bg-overlay-50": "Scrim at 50% over imagery, behind text on photos.",
  "bg-overlay-25": "Scrim at 25% over imagery.",
  "bg-overlay-10": "Scrim at 10% over imagery.",
  "border-default": "Control and divider strokes.",
  "accent-primary": "Mint, the signature accent: one deliberate moment per slide. Identical in both themes. 11:1 on the dark ground; 1.9:1 on white, so on light slides use it for fills, marks and scribbles, never small text.",
  "accent-dark": "Accent as ink on light slides (deep petrol-teal, 8.4:1 on white); mint on dark slides.",
  "accent-surface": "Accent panel: mint tint on light slides (`fg-100` on it is 17:1), deep petrol-teal on dark (white on it is 8.4:1).",
};
const primUsage = (n) => {
  const [fam, step] = [n.replace(/-[^-]+$/, ""), n.split("-").pop()];
  if (fam === "black") return step === "100" ? "Brand near-black (#010716). Never use pure #000. Theme fg and bg steps alias this ramp." : `#010716 at ${step}%. Aliased by the Theme tokens; use those, not this, in layouts.`;
  if (fam === "white") return step === "100" ? "White. Theme fg and bg steps alias this ramp." : `White at ${step}%. Aliased by the Theme tokens; use those, not this, in layouts.`;
  return "Figma Colors primitive.";
};
const colors = [
  ...FIG.theme.map((t) => ({ name: t.name, value: t.light === t.dark ? t.light : { light: t.light, dark: t.dark }, usage: `Figma ${t.name.replace(/^(fg|bg|border|accent)-/, "$1/")}. ${THEME_USAGE[t.name] || ""}`.trim() })),
  // Only the black and white ramps the Theme tokens alias; the mint, gray and blue
  // primitives are left out of the colour section.
  ...FIG.colors.filter((c) => /^(black|white)-/.test(c.name)).map((c) => ({ name: c.name, value: c.value, usage: `Figma ${c.name.replace(/-([^-]+)$/, "/$1")}. ${primUsage(c.name)}` })),
];

// ---- CODE: every colour variable the HTML declares, per slide theme ----------------
// Light: css/tokens.css, the :root blocks of css/primitives.css and the light .stage rule
// of css/deck.css; dark: the dark .stage rule on top. These are pinned on each stage so
// slides render exactly as in the product. Where a Figma token's value differs from the
// HTML, the build prints it (FIGMA_VS_CODE) and the Colour section lists it.
const CODE = {}; const FIGMA_VS_CODE = [];
{
  const strip = (c) => c.replace(/\/\*[\s\S]*?\*\//g, "");
  const decls = (c) => Object.fromEntries([...strip(c).matchAll(/--([a-z0-9-]+)\s*:\s*([^;}]+);/g)].map((m) => [m[1], m[2].trim()]));
  const block = (c, sel) => { const i = c.indexOf(sel); if (i < 0) throw new Error("not found: " + sel); return c.slice(c.indexOf("{", i) + 1, c.indexOf("\n}", i)); };
  const tokCss = fs.readFileSync(`${R}/css/tokens.css`, "utf8");
  const deck = fs.readFileSync(`${R}/css/deck.css`, "utf8");
  const prim = fs.readFileSync(`${R}/css/primitives.css`, "utf8");
  const primRoot = Object.assign({}, ...[...strip(prim).matchAll(/(^|\})\s*:root\s*\{([^}]*)\}/g)].map((m) => decls(m[2])));
  const lightStage = decls(block(deck, '.stage[data-theme="light"]'));
  const darkStage = decls(block(deck, '.stage[data-theme="dark"]'));
  const light = { ...primRoot, ...decls(tokCss), ...lightStage };
  const dark = { ...light, ...darkStage };
  const res = (v, vals, d = 0) => v.replace(/var\(--([a-z0-9-]+)(?:\s*,\s*([^()]+))?\)/g, (_, n, fb) => (vals[n] != null && d < 8 ? res(vals[n], vals, d + 1) : (fb || "").trim()));
  const norm = (v) => v.toLowerCase().replace(/\s+/g, " ").replace(/([(,\s])\.(\d)/g, "$10.$2").replace(/,(\S)/g, ", $1");
  const isColour = (v) => /^(#[0-9a-f]{3,8}|rgba?\(|hsla?\()/i.test(String(v).trim());
  for (const n of new Set([...Object.keys(light), ...Object.keys(darkStage)])) {
    const l = light[n] != null ? norm(res(light[n], light)) : null, d = norm(res(dark[n], dark));
    if (isColour(l ?? d)) CODE[n] = { light: l, dark: d };
  }
  // Compare: Figma value vs what the HTML renders, both as RGBA.
  const rgba = (v) => {
    v = String(v).trim().toLowerCase();
    let m = v.match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/);
    if (m) return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)).concat(m[2] ? +(parseInt(m[2], 16) / 255).toFixed(2) : 1);
    m = v.match(/^rgba?\(([^)]+)\)$/);
    if (m) { const p = m[1].split(",").map((x) => parseFloat(x)); return [p[0], p[1], p[2], p[3] ?? 1].map((x, i) => (i === 3 ? +x.toFixed(2) : x)); }
    return null;
  };
  const prims = Object.fromEntries(FIG.colors.map((c) => [c.name, c.value]));
  const fig = (v) => (/^\{/.test(v) ? prims[v.slice(1, -1)] : v);
  const pct = (c) => (c[3] < 1 ? ` at ${Math.round(c[3] * 100)}%` : "");
  const label = (c) => (c ? (c[0] > 200 ? "white" : c[0] < 10 && c[2] < 30 ? "black" : "#" + c.slice(0, 3).map((x) => x.toString(16).padStart(2, "0")).join("")) + pct(c) : "not declared");
  for (const t of FIG.theme) for (const th of ["light", "dark"]) {
    const f = rgba(fig(t[th])), c = CODE[t.name] ? rgba(CODE[t.name][th]) : null;
    const same = f && c && f.every((x, i) => Math.abs(x - c[i]) <= (i === 3 ? 0.02 : 1));
    if (!same) FIGMA_VS_CODE.push({ name: t.name, theme: th, figma: label(f), code: label(c) });
  }
  fs.writeFileSync("figma-vs-code.md", FIGMA_VS_CODE.length
    ? "| Token | Theme | Figma | HTML renders |\n| --- | --- | --- | --- |\n" + FIGMA_VS_CODE.map((d) => `| \`${d.name}\` | ${d.theme === "light" ? "Light" : "Dark"} | ${d.figma} | ${d.code} |`).join("\n") + "\n"
    : "None: every Figma Theme token renders with its Figma value.\n");
  if (FIGMA_VS_CODE.length) console.log("  Figma vs HTML differences:\n" + FIGMA_VS_CODE.map((d) => `   ${d.name} (${d.theme}): Figma ${d.figma}, HTML ${d.code}`).join("\n"));
}

const fonts = [];
for (const fam of ["Equip", "EquipExtended"]) for (const [wname, wv] of [["Light", 300], ["Regular", 400], ["Medium", 500], ["Bold", 700]]) {
  const file = `${fam}-${wname}.woff2`;
  fs.mkdirSync(OUT + "fonts", { recursive: true });
  fs.copyFileSync(`${R}/fonts/web/${file}`, OUT + "fonts/" + file);
  fonts.push({ family: fam === "Equip" ? "Equip" : "Equip Extended", file: "fonts/" + file, weight: String(wv), style: "normal" });
}

const S = (name, fontSize, lineHeight, fontWeight, letterSpacing, usage, sample, extra = {}) => ({ name, fontSize, lineHeight, fontWeight, ...(letterSpacing ? { letterSpacing } : {}), usage, sample, ...extra });
const tokens = {
  name: "Nagarro Master Slides",
  version: 1,
  meta: { source: "repository", repo: "Presentation_v1 (local)", ref: SRC.ref, paths: { tokens: ["css/tokens.css", "css/deck.css", "css/primitives.css"], fonts: ["fonts/web/"], assets: ["assets/logos", "assets/logo", "assets/app-icon", "assets/caring-icons", "assets/caring-logo", "assets/scribbles", "assets/photography"], docs: ["Design.md", "CLAUDE.md", "js/templates/_CONTRACT.md"] }, synced: SRC.date },
  color: { themes: [{ id: "light", name: "Light slide" }, { id: "dark", name: "Dark slide" }], tokens: colors },
  type: {
    fonts,
    families: { display: '"Equip Extended", "Hanken Grotesk", system-ui, sans-serif', body: '"Equip", "Hanken Grotesk", system-ui, sans-serif' },
    groups: [
      { name: "Base", family: "body", styles: [
        S("TextXS", "12px", "16px", 400, null, "Figma Base/TextXS. Fine print, chart axis labels, footnotes.", "Source: claims system export, June 2026"),
        S("TextSM", "14px", "20px", 400, null, "Figma Base/TextSM. Small labels, legends, tags, dense table cells.", "Pilot region · 12 weeks"),
        S("TextMD", "16px", "24px", 400, null, "Figma Base/TextMD. Body in dense layouts, table cells; in `fg-50` it is the header meta and the footer.", "Weekly steering with the client's product owners."),
        S("TextLG", "18px", "28px", 400, null, "Figma Base/TextLG. Card body and list copy.", "Remove re-keying between intake, policy and payment systems first."),
        S("TextXL", "20px", "28px", 400, null, "Figma Base/TextXL. Lead body; in `fg-50` it is the PageHeader caption.", "We start with a two-week discovery to map the systems, teams and constraints."),
      ] },
      { name: "Heading", family: "display", styles: [
        S("Heading6", "24px", "32px", 500, "-0.02em", "Figma Heading/Heading6. Small card titles, secondary lines under a card title.", "Discovery sprint"),
        S("Heading5", "28px", "36px", 500, "-0.02em", "Figma Heading/Heading5. Card titles; the PageHeader intro in `fg-50`.", "Four moves, in order"),
        S("Heading4", "36px", "44px", 500, "-0.02em", "Figma Heading/Heading4. Large card titles, statement lines; the Core halves PageHeader subtitle.", "Each one pays for the next"),
        S("Heading3", "48px", "56px", 500, "-0.02em", "Figma Heading/Heading3. PageHeader subtitle in `fg-50`. At regular (400) it is the SectionHeader heading.", "Three moves for the next 18 months"),
        S("Heading2", "60px", "68px", 500, "-0.02em", "Figma Heading/Heading2. The slide title in the PageHeader.", "Building a platform for growth"),
        S("Heading1", "100px", "108px", 500, "-0.02em", "Figma Heading/Heading1. Cover title and big statements.", "Presentation title"),
      ] },
      { name: "Title", family: "display", styles: [
        S("Title", "150px", "150px", 500, "-0.02em", "Figma Title/Title. Oversized cover and chapter titles (pitch, marketing, portfolio covers); big index numerals.", "Pitch"),
        S("Display", "250px", "250px", 500, null, "Figma Title/Display. One huge word or numeral as the whole slide.", "01"),
      ] },
    ],
  },
  spacing: { note: "Figma Sizes collection (2–100). Use these for every gap and padding. Slides use literal px on a 1920×1080 canvas; never viewport units.", tokens: [
    { name: "space-2", value: "2px", usage: "Hairline offsets, heading padding." },
    { name: "space-4", value: "4px", usage: "Figma Sizes/4. Tightest stacks." },
    { name: "space-6", value: "6px", usage: "Gap between caption, title and subtitle in the PageHeader." },
    { name: "space-8", value: "8px", usage: "Figma Sizes/8. Icon to label, tight stacks." },
    { name: "space-10", value: "10px", usage: "Figma Sizes/10. Small inner padding." },
    { name: "space-12", value: "12px", usage: "Figma Sizes/12. Title to body inside a card." },
    { name: "space-16", value: "16px", usage: "Default gap between the frame's rows." },
    { name: "space-20", value: "20px", usage: "Header padding below the logo row; footer column top padding." },
    { name: "space-24", value: "24px", usage: "Gutter between columns, cards and footer columns." },
    { name: "space-32", value: "32px", usage: "Header divider to content (content starts at y=156)." },
    { name: "space-40", value: "40px", usage: "Outer slide margin on all four sides; PageHeader heading-to-intro gap." },
    { name: "space-48", value: "48px", usage: "Top padding above a card row (`.v2f-list`)." },
    { name: "space-56", value: "56px", usage: "Figma Sizes/56." },
    { name: "space-64", value: "64px", usage: "Figma Sizes/64." },
    { name: "space-80", value: "80px", usage: "Figma Sizes/80." },
    { name: "space-100", value: "100px", usage: "Figma Sizes/100. The largest step." },
  ] },
  radius: { note: "Figma radius collection. Slides themselves have square corners.", tokens: [
    { name: "radius-6", value: "6px", usage: "Figma radius/6. The smallest corner radius." },
    { name: "radius-9", value: "9px", usage: "Figma radius/9." },
    { name: "radius-15", value: "15px", usage: "Figma radius/15. Cards, image placeholders and chart panels: the radius the masters use most (about 120 rules)." },
    { name: "radius-20", value: "20px", usage: "Figma radius/20. Larger panels." },
    { name: "radius-full", value: "99999px", usage: "Figma radius/full. Pills and circles: chips, avatars, round badges." },
  ] },
  layout: { note: "The slide canvas. Author at these literal pixels and let the viewer scale the stage.", tokens: [
    { name: "frame-w", value: "1920px", usage: "Slide width." },
    { name: "frame-h", value: "1080px", usage: "Slide height." },
    { name: "margin-x", value: "40px", usage: "Outer margin. The v1 deck used 84px; v2 masters use 40px." },
    { name: "stroke-thin", value: "0.5px", usage: "Figma Stroke/thin: footer rules and card outlines." },
  ] },
  weight: { tokens: [
    { name: "w-light", value: "300", usage: "Light: large decorative numerals only." },
    { name: "w-regular", value: "400", usage: "Regular: SectionHeader headings, captions, meta, footer." },
    { name: "w-medium", value: "500", usage: "Medium: Figma headings and body (the default weight of the v2 system)." },
    { name: "w-bold", value: "700", usage: "Bold: a deliberate lead statement only." },
  ] },
};
w("tokens.json", JSON.stringify(tokens, null, 2));

// ---------------------------------------------------------------- bundle.css
// Every colour variable the HTML declares, pinned per theme so slides render exactly
// as in the product, whatever the page around them (or an edited token) says.
const lightPins = [], darkPins = [];
for (const [n, v] of Object.entries(CODE)) { if (v.light) lightPins.push(`--${n}:${v.light};`); darkPins.push(`--${n}:${v.dark};`); }
const tokCss = fs.readFileSync(`${R}/css/tokens.css`, "utf8");
const fallback = [...tokCss.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)].filter(([, , v]) => !/^(#|rgba|var|")/.test(v.trim())).map(([, n, v]) => `--${n}:${v.trim()};`);
const deckCss = fs.readFileSync(`${R}/css/deck.css`, "utf8");
const legacyChrome = deckCss.slice(deckCss.indexOf("/* ---- Shared component: logo"), deckCss.indexOf("/* ---- Navigation")).replace(/^\.(logo|footer)/gm, ".ns-stage .$1");
const prim = fs.readFileSync(`${R}/css/primitives.css`, "utf8");
const bundleCss = `/* Nagarro Master Slides — slide stage, theme pins and the master-template primitives.
   Source: css/primitives.css + the stage rules of css/deck.css (Presentation_v1 @ ${SRC.ref}). */

/* Fallbacks with zero specificity: tokens.css (generated from tokens.json) always wins. */
:where(:root){${fallback.join("")}--font-display:"Equip Extended","Hanken Grotesk",system-ui,sans-serif;--font-body:"Equip","Hanken Grotesk",system-ui,sans-serif;--fs-h1:100px;--lh-h1:108px;--fs-h2:60px;--lh-h2:68px;--fs-h3:48px;--lh-h3:56px;--fs-h5:28px;--lh-h5:36px;--fs-text-xl:20px;--lh-text-xl:28px;--fs-text-md:16px;--lh-text-md:24px;--ls-heading:-0.02em;--ls-text:0px;--ls-body:-0.48px;}

/* ---- The slide stage: a fixed 1920×1080 canvas. A slide carries its own theme,
   whatever theme the page around it is in, so every colour token is pinned here. */
.ns-stage{position:relative;display:block;width:1920px;height:1080px;overflow:hidden;font-family:var(--font-body);-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;}
.ns-stage *,.ns-stage *::before,.ns-stage *::after{box-sizing:border-box;}
.ns-stage[data-theme="light"]{${lightPins.join("")}background:#ffffff;color:#010716;}
.ns-stage[data-theme="dark"]{${darkPins.join("")}background:${CODE["bg-primary"].dark};color:#ffffff;}
.ns-stage .reveal{animation:none;}
.ns-viewport{position:relative;overflow:hidden;flex:none;max-width:100%;}
.ns-scaler{position:absolute;left:0;top:0;width:1920px;height:1080px;transform-origin:0 0;}
.ns-scaler > .ns-stage{position:absolute;inset:0;}
.ns-deck{display:flex;flex-direction:column;gap:24px;}

/* ---- Legacy positioned chrome (3 core gallery templates still use it) ---- */
${legacyChrome}
/* ---- Master-template primitives (css/primitives.css, verbatim) ---- */
${prim}
`;
w("components/bundle.css", bundleCss);

// ---------------------------------------------------------------- bundle.js
fs.copyFileSync("bundle.js", OUT + "components/bundle.js");

// ---------------------------------------------------------------- categories
const ROLE_CATEGORY = {};
for (const m of fs.readFileSync("role-category.js", "utf8").matchAll(/(\w+):\s*"([^"]+)"/g)) ROLE_CATEGORY[m[1]] = m[2];
const CATS = ["Covers & Title", "Chapters & Index", "Statements & Quotes", "Content", "Cards", "Charts & Diagrams", "Comparison Tables", "Timelines & Roadmaps", "Results & Impact", "Services & Capabilities", "Team & CV", "Logos & Clients", "Photo & Gallery", "Case Studies", "Closing"];
const catOf = (t) => ROLE_CATEGORY[t.role] || "Other";
const byCat = Object.fromEntries(CATS.map((c) => [c, inv.filter((t) => catOf(t) === c)]));
const compName = { "Covers & Title": "Covers", "Chapters & Index": "ChaptersAndIndex", "Statements & Quotes": "StatementsAndQuotes", "Content": "ContentSlides", "Cards": "CardSlides", "Charts & Diagrams": "ChartsAndDiagrams", "Comparison Tables": "ComparisonTables", "Timelines & Roadmaps": "TimelinesAndRoadmaps", "Results & Impact": "ResultsAndImpact", "Services & Capabilities": "ServicesSlides", "Team & CV": "TeamAndCV", "Logos & Clients": "LogosAndClients", "Photo & Gallery": "PhotoAndGallery", "Case Studies": "CaseStudySlides", "Closing": "ClosingSlides" };
const catUse = {
  "Covers & Title": "The first slide of a deck. Render covers with `theme: \"dark\"` for the dark-open sandwich unless the deck is all-light by design.",
  "Chapters & Index": "Tables of contents, agenda and index pages, and the section dividers that open each chapter.",
  "Statements & Quotes": "One idea set large: a lead statement, a client quote, a manifesto line, a press mention.",
  "Content": "Text-led content slides: heading plus body columns, split text and image, detail and brief pages.",
  "Cards": "A row or grid of parallel items (pillars, offers, phases) set as cards.",
  "Charts & Diagrams": "Quantitative charts (bar, line, area, donut, waffle) and structural diagrams (frameworks, pyramids, matrices, flows).",
  "Comparison Tables": "Option comparisons, feature matrices and dense data tables.",
  "Timelines & Roadmaps": "Phases, milestones, gantt views and roadmaps across time.",
  "Results & Impact": "Outcome numbers, KPIs, awards and before/after results.",
  "Services & Capabilities": "A service or capability overview.",
  "Team & CV": "Team walls, org views, individual CVs and skills.",
  "Logos & Clients": "Client logo walls and partner grids.",
  "Photo & Gallery": "Photo-led slides: full-bleed images, galleries, mood boards, device and product showcases.",
  "Case Studies": "A one-page case study.",
  "Closing": "The last slide: thank-you, contact and closing statement. Render with `theme: \"dark\"` to close the sandwich.",
};

// ---------------------------------------------------------------- catalog sections (markdown)
const fieldLine = (k, v) => `\`${k}\` ${String(v).replace(/\s+/g, " ").replace(/\|/g, "\\|")}`;
const entry = (t) => {
  const fields = Object.entries(t.schema || {}).filter(([k]) => k !== "meta" && k !== "footer");
  const cap = t.capacity ? ` · holds ${t.capacity.min === t.capacity.max ? t.capacity.items : `${t.capacity.min}–${t.capacity.max}`}` : "";
  const it = t.intent || {};
  const intent = [it.bestFor?.length ? `**Best for:** ${it.bestFor.join("; ")}.` : "", it.holds ? `**Holds:** ${it.holds}.` : "", it.avoid?.length ? `**Avoid:** ${it.avoid.join("; ")}.` : ""].filter(Boolean).join(" ");
  return `#### \`${t.name}\`\n${t.theme === "dark" ? "Dark" : "Light"} · ${t.family} · ${t.role}/${t.shape}${cap}${t.media?.length ? ` · ${t.media.join(", ")}` : ""}${it.feel ? ` · ${it.feel}` : ""}\n\n${(t.use || t.description || "").trim()}${intent ? "\n\n" + intent : ""}\n\n${fields.map(([k, v]) => `- ${fieldLine(k, v)}`).join("\n")}\n`;
};
const catalogParts = [
  ["12-catalog-openers.md", "Slide catalog — openers, structure and statements", ["Covers & Title", "Chapters & Index", "Statements & Quotes", "Closing"]],
  ["13-catalog-content.md", "Slide catalog — content and cards", ["Content", "Cards", "Services & Capabilities", "Case Studies"]],
  ["14-catalog-data.md", "Slide catalog — data, time and results", ["Charts & Diagrams", "Comparison Tables", "Timelines & Roadmaps", "Results & Impact"]],
  ["15-catalog-people-and-imagery.md", "Slide catalog — people, logos and imagery", ["Team & CV", "Logos & Clients", "Photo & Gallery"]],
];
for (const [file, title, cats] of catalogParts) {
  const n = cats.reduce((a, c) => a + byCat[c].length, 0);
  let md = `# ${title}\n\nEvery master slide in these categories (${n} templates), with the fields its content takes. Every template also accepts \`meta\` (\`{ studio, name, page }\`, the header) and \`footer\` (\`{ col1, col2, col3, copyright }\`); they are left out below. Any field you omit falls back to the template's own example content, so pass every field you mean to show. Open the category card under **Components** to see each one rendered.\n`;
  for (const c of cats) {
    md += `\n## ${c} (${byCat[c].length})\n\n${catUse[c]}\n\n`;
    const fams = [...new Set(byCat[c].map((t) => t.family))];
    for (const f of fams) { md += `### ${f}\n\n` + byCat[c].filter((t) => t.family === f).map(entry).join("\n") + "\n"; }
  }
  w(file, md);
}

// ---------------------------------------------------------------- slide library cards
const libMeta = (t) => ({ n: t.name, th: t.theme, f: t.family, r: t.role, u: (t.use || t.description || "").trim(), s: t.schema, e: t.example });
const libraryPreview = (cat, list, height) => `<!-- @dsCard group="Slide library" height=${height} subtitle="${list.length} master slide${list.length > 1 ? "s" : ""}" -->
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${cat}</title>
<style>
  [hidden] { display: none !important; }
  body { margin: 0; padding: 16px; font-family: var(--font-body); color: var(--fg-100); background: var(--bg-primary); }
  .ds-bar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 16px; }
  .ds-bar input { flex: 1 1 220px; min-width: 0; font: inherit; font-size: 14px; padding: 8px 12px; border: 0.5px solid var(--border-default); border-radius: 8px; background: transparent; color: var(--fg-100); }
  .ds-chip { font: inherit; font-size: 13px; padding: 6px 12px; border-radius: 999px; border: 0.5px solid var(--fg-20); background: transparent; color: var(--fg-100); cursor: pointer; }
  .ds-chip[aria-pressed="true"] { background: var(--fg-100); color: var(--bg-primary); border-color: var(--fg-100); }
  .ds-count { font-size: 13px; color: var(--fg-50); margin-left: auto; }
  .ds-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(264px, 1fr)); gap: 24px 16px; }
  .ds-tile { display: flex; flex-direction: column; gap: 8px; min-width: 0; text-align: left; font: inherit; color: inherit; background: none; border: 0; padding: 0; cursor: pointer; }
  .ds-tile .ds-frame { width: 100%; aspect-ratio: 16 / 9; border-radius: 6px; overflow: hidden; outline: 0.5px solid var(--fg-20); background: var(--fg-5); }
  .ds-tile:hover .ds-frame, .ds-tile:focus-visible .ds-frame { outline: 2px solid var(--accent-primary); }
  .ds-tile:focus-visible { outline: none; }
  .ds-name { font-size: 13px; line-height: 18px; font-weight: 500; display: flex; gap: 8px; align-items: baseline; }
  .ds-name code { font-family: inherit; }
  .ds-tag { font-size: 11px; line-height: 16px; padding: 0 6px; border-radius: 4px; border: 0.5px solid var(--fg-20); color: var(--fg-50); font-weight: 400; }
  .ds-use { font-size: 12px; line-height: 17px; color: var(--fg-50); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .ds-detail { margin-bottom: 24px; display: grid; grid-template-columns: minmax(0, 3fr) minmax(0, 2fr); gap: 24px; padding-bottom: 24px; border-bottom: 0.5px solid var(--fg-20); }
  .ds-detail[hidden] { display: none; }
  .ds-detail .ds-big { width: 100%; aspect-ratio: 16 / 9; border-radius: 8px; overflow: hidden; outline: 0.5px solid var(--fg-20); }
  .ds-detail .ds-info h3 { margin: 0 0 4px; font-family: var(--font-display); font-weight: 500; font-size: 20px; line-height: 26px; }
  .ds-detail .ds-info p { margin: 0 0 12px; font-size: 14px; line-height: 20px; color: var(--fg-50); }
  .ds-detail .ds-info dl { margin: 0 0 12px; font-size: 13px; line-height: 18px; display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: 4px 12px; }
  .ds-detail .ds-info dt { font-weight: 500; }
  .ds-detail .ds-info dd { margin: 0; color: var(--fg-50); overflow-wrap: anywhere; }
  .ds-actions { display: flex; gap: 8px; flex-wrap: wrap; }
  .ds-actions button { font: inherit; font-size: 13px; padding: 8px 14px; border-radius: 8px; cursor: pointer; border: 0.5px solid var(--fg-100); background: var(--fg-100); color: var(--bg-primary); }
  .ds-actions button.ds-ghost { background: transparent; color: var(--fg-100); }
  @media (max-width: 640px) { .ds-detail { grid-template-columns: 1fr; } }
</style>
</head>
<body>
<div class="ds-bar">
  <input type="search" id="q" placeholder="Filter ${list.length} slides by name or use" aria-label="Filter slides">
  <span id="fams"></span>
  <span class="ds-count" id="count"></span>
</div>
<section class="ds-detail" id="detail" hidden aria-live="polite"></section>
<div class="ds-grid" id="grid"></div>
<script>
(function () {
  var NS = window.NagarroSlides;
  // Slides follow the page theme: "Dark slide" renders every slide dark; "Light slide" keeps each master's own theme.
  function PT() { return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : undefined; }
  var __th = document.documentElement.getAttribute("data-theme");
  new MutationObserver(function () { if (document.documentElement.getAttribute("data-theme") !== __th) location.reload(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  var names = ${JSON.stringify(list.map((t) => t.name))};
  var items = names.map(function (n) { return NS.get(n); });
  var grid = document.getElementById("grid"), q = document.getElementById("q"), count = document.getElementById("count");
  var fams = Array.from(new Set(items.map(function (t) { return t.family; })));
  var famEl = document.getElementById("fams"), fam = "";
  if (fams.length > 1) famEl.innerHTML = ['<button class="ds-chip" aria-pressed="true" data-f="">All</button>'].concat(fams.map(function (f) { return '<button class="ds-chip" aria-pressed="false" data-f="' + f + '">' + f + "</button>"; })).join(" ");
  famEl.addEventListener("click", function (e) { var b = e.target.closest(".ds-chip"); if (!b) return; fam = b.dataset.f; famEl.querySelectorAll(".ds-chip").forEach(function (c) { c.setAttribute("aria-pressed", String(c === b)); }); filter(); });
  grid.innerHTML = items.map(function (t, i) {
    return '<button class="ds-tile" data-i="' + i + '" data-s="' + NS.esc((t.name + " " + (t.use || "") + " " + t.family + " " + t.role).toLowerCase()) + '" data-f="' + t.family + '">' +
      '<div class="ds-frame"></div><div class="ds-name"><code>' + NS.esc(t.name) + '</code>' + (t.theme === "dark" ? '<span class="ds-tag">dark master</span>' : "") + '</div><div class="ds-use">' + NS.esc(t.use || t.description || "") + "</div></button>";
  }).join("");
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (!e.isIntersecting) return; var el = e.target; io.unobserve(el); var t = items[+el.parentNode.dataset.i]; NS.mount(el, t.name, null, { width: el.clientWidth || 264, theme: PT() }); });
  }, { rootMargin: "300px" });
  grid.querySelectorAll(".ds-frame").forEach(function (f) { io.observe(f); });
  function filter() { var v = q.value.trim().toLowerCase(), n = 0; grid.querySelectorAll(".ds-tile").forEach(function (tile) { var ok = (!v || tile.dataset.s.indexOf(v) > -1) && (!fam || tile.dataset.f === fam); tile.hidden = !ok; if (ok) n++; }); count.textContent = n + " of " + items.length; }
  q.addEventListener("input", filter); filter();
  var detail = document.getElementById("detail");
  grid.addEventListener("click", function (e) {
    var tile = e.target.closest(".ds-tile"); if (!tile) return; var t = items[+tile.dataset.i];
    var fields = Object.keys(t.schema || {}).map(function (k) { return "<dt>" + NS.esc(k) + "</dt><dd>" + NS.esc(String(t.schema[k])) + "</dd>"; }).join("");
    var spec = Object.assign({ template: t.name }, t.example || {});
    detail.innerHTML = '<div><div class="ds-big" id="big"></div></div><div class="ds-info"><h3>' + NS.esc(t.name) + "</h3><p>" + NS.esc(t.use || t.description || "") + "</p><dl>" + fields + '</dl><div class="ds-actions"><button type="button" id="copy">Copy slide JSON</button><button type="button" class="ds-ghost" id="close">Close</button></div></div>';
    detail.hidden = false;
    var big = document.getElementById("big"); NS.mount(big, t.name, null, { width: big.clientWidth || 520, theme: PT() });
    document.getElementById("close").onclick = function () { detail.hidden = true; };
    document.getElementById("copy").onclick = function () {
      var b = this, txt = JSON.stringify(spec, null, 2);
      var done = function () { b.textContent = "Copied"; setTimeout(function () { b.textContent = "Copy slide JSON"; }, 1600); };
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(done, function () { fallback(txt); done(); }); else { fallback(txt); done(); }
    };
    detail.scrollIntoView({ block: "nearest" });
  });
  function fallback(txt) { var ta = document.createElement("textarea"); ta.value = txt; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); } catch (e) {} ta.remove(); }
})();
</script>
</body>
</html>
`;
const libraryReadme = (cat, list) => {
  const fams = [...new Set(list.map((t) => t.family))];
  const roles = [...new Set(list.map((t) => t.role))];
  return `# ${compName[cat]}

${list.length} master slide${list.length > 1 ? "s" : ""} in the **${cat}** category${roles.length ? ` (role${roles.length > 1 ? "s" : ""} ${roles.map((r) => `\`${r}\``).join(", ")})` : ""}. ${catUse[cat]}

## When to use

${catUse[cat]} Choose by the content you have, not by the look: count your items and pick a template whose capacity matches (the catalog section lists \`holds N\` for each). Vary templates across the deck; never repeat the same layout on consecutive slides.

## What you provide

A slide spec: \`{ "template": "<name>", ...fields }\`. The fields per template are listed in the slide catalog sections and shown when you click a slide in the preview (with **Copy slide JSON**, which copies the template's example content as a starting point). Every field you omit falls back to the example content, so fill every field you want shown and replace every placeholder.

\`\`\`js
NagarroSlides.render("${list[0].name}", ${JSON.stringify(Object.fromEntries(Object.entries(list[0].example || {}).filter(([k]) => k !== "meta" && k !== "footer").slice(0, 3)))});
\`\`\`

## Families in this category

${fams.map((f) => `- **${f}**: ${list.filter((t) => t.family === f).map((t) => `\`${t.name}\``).join(", ")}`).join("\n")}
`;
};
for (const c of CATS) {
  const list = byCat[c];
  const rows = Math.ceil(list.length / 3);
  const height = Math.min(1400, Math.max(360, 96 + rows * 250));
  w(`components/${compName[c]}/preview.html`, libraryPreview(c, list, height));
  w(`components/${compName[c]}/README.md`, libraryReadme(c, list));
}

// ---------------------------------------------------------------- index.d.ts
const names = inv.map((t) => JSON.stringify(t.name)).join("\n  | ");
w("components/index.d.ts", `/**
 * Nagarro Master Slides — the slide engine as one global: window.NagarroSlides.
 * Load tokens.css, components/bundle.css and components/bundle.js; set config({ assetBase })
 * to where the media/ folder is served. Every slide is a 1920×1080 stage, scaled to fit.
 */

/** Every registered master template (${inv.length}). */
export type TemplateName =
  | ${names};

export type SlideTheme = "light" | "dark";
export type Category = ${CATS.map((c) => JSON.stringify(c)).join(" | ")};

/** Header meta (the Figma "Header"): studio | presentation name | page. */
export interface SlideMeta { studio?: string; name?: string; page?: string; }
/** Footer columns (the Figma "Footer"): presentation name, "Prepared for [Client]", date, copyright. */
export interface SlideFooter { col1?: string; col2?: string; col3?: string; copyright?: string; }

/** One template's metadata. \`schema\` describes each content field in prose; \`example\` is real renderable content. */
export interface TemplateInfo {
  name: TemplateName; family: string; role: string; category: Category; shape: string; theme: SlideTheme;
  media: string[]; capacity: { items: number; min: number; max: number }; slots: Record<string, number>;
  description: string; use: string; intent?: Record<string, unknown>;
  schema: Record<string, string>; example: Record<string, unknown>;
}

/** A slide in a deck: a template name plus the fields its schema lists. */
export interface SlideSpec { template: TemplateName; theme?: SlideTheme; meta?: SlideMeta; footer?: SlideFooter; [field: string]: unknown; }

export interface RenderOptions {
  /** Override the template's own theme. Covers and closings take "dark" in the sandwich. */
  theme?: SlideTheme;
  meta?: SlideMeta; footer?: SlideFooter;
  /** Fill omitted fields from the template example (default true). Pass false to leave them empty. */
  useExample?: boolean;
}

export interface DeckOptions {
  /** Presentation name: the header's middle item. */
  title?: string;
  /** Studio or practice name: the header's first item. */
  studio?: string;
  meta?: SlideMeta;
  /** Footer for every slide, e.g. { col1: "Platform modernisation", col2: "Prepared for Acme", copyright: "© 2026" }. */
  footer?: SlideFooter;
}

export interface NagarroSlidesAPI {
  version: string;
  /** Set assetBase (default "../../media/") to where media/ is served; returns the config. */
  config(o?: { assetBase?: string }): { assetBase: string };
  templates: TemplateInfo[];
  categories: Category[];
  roleCategory: Record<string, Category>;
  byCategory(): { category: Category; templates: TemplateInfo[] }[];
  get(name: TemplateName): TemplateInfo | null;
  /** Filter by any metadata key, e.g. find({ category: "Cards", theme: "light" }). */
  find(q: Partial<Record<keyof TemplateInfo, unknown>>): TemplateInfo[];
  /** One slide as an HTML string: <section class="ns-stage" data-theme> at 1920×1080. */
  render(name: TemplateName, content?: Record<string, unknown> | null, opts?: RenderOptions): string;
  /** A whole deck; page numbers and deck meta/footer are filled in per slide. */
  renderDeck(slides: SlideSpec[], deck?: DeckOptions): string[];
  /** Render a slide into an element, scaled to its width (or opts.width). Returns the stage. */
  mount(el: HTMLElement, name: TemplateName, content?: Record<string, unknown> | null, opts?: RenderOptions & { width?: number }): HTMLElement;
  /** A scaled slide as an HTML string, opts.width px wide (default 320). */
  thumb(name: TemplateName, content?: Record<string, unknown> | null, opts?: RenderOptions & { width?: number }): string;
  esc(s: unknown): string;
  blocks: {
    /** The Figma "Header": logo + meta over a hairline. { logoOnly } drops the meta. */
    topBar(meta?: SlideMeta, o?: { logoOnly?: boolean }): string;
    /** The Figma "Footer": three columns over 0.5px rules. */
    footerBar(f?: SlideFooter): string;
    /** The PageHeader: caption / title / subtitle at left, optional intro at right. { halves } = Core's equal halves. */
    pageHeader(h?: { caption?: string; title?: string; subtitle?: string; intro?: string }, o?: { halves?: boolean }): string;
    /** Header + middle HTML + footer in the 40px frame. */
    frame(middle: string, o?: { meta?: SlideMeta; footer?: SlideFooter }): string;
    SectionHeader(h?: { eyebrow?: string; heading?: string; subhead?: string }): string;
    Logo(): string; Footer(f?: SlideFooter): string; DEFAULT_FOOTER: SlideFooter;
    metric(m?: { label?: string; value?: string }, o?: MetricProps): string;
    metricCard(c?: Record<string, unknown>, o?: MetricCardProps): string;
    /** The Nagarro wordmark as inline SVG in currentColor. */
    logo(): string;
  };
  /** A brand icon as inline SVG (96×96 viewBox, currentColor). Takes the Figma name or a legacy code key. */
  icon(name: string, cls?: string): string;
  /** The 126 icon names as Figma spells them. */
  iconNames: string[];
  /** Figma name → legacy code key, for the five names the code spells differently. */
  iconAliases: Record<string, string>;
}

/** Metric — a number with its label (Figma "Metric"). */
export interface MetricProps { style?: "standard" | "eyebrow"; size?: "large" | "medium" | "small"; emphasis?: "value" | "label"; align?: "left" | "center"; showLabel?: boolean; }
/** MetricCard — a key figure on a tinted card (Figma "MetricCard"). */
export interface MetricCardProps { layout?: "statement" | "single" | "multiple"; size?: "default" | "large"; showTitle?: boolean; showDescription?: boolean; showIcon?: boolean; icon?: string; tone?: "t20" | "t25" | "t50" | "t75" | "t100"; cls?: string; }

declare global { interface Window { NagarroSlides: NagarroSlidesAPI; } }
`);

// export the component order for the bundle header and the index
fs.writeFileSync("components-order.json", JSON.stringify(CATS.map((c) => compName[c])));
console.log("ok", Object.fromEntries(CATS.map((c) => [compName[c], byCat[c].length])));
for (const [f] of catalogParts) console.log(f, fs.statSync(OUT + f).size);
console.log("bundle.css", fs.statSync(OUT + "components/bundle.css").size);
