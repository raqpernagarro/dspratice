// Template: brand-guidelines/hero-03 — a section title in white over a full-bleed image, toned down with a light veil.
// Source Figma frame 109:14605.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { brFooter, brPhoto, brImg, brCol, brPanel, brSplit, brTextBlock, brTocRow, brChapter, brHead, brInk, brSwatch, brDot, brPair, brAvoid, brPhone, brTab, brWatch, brPlace, brTree, brRich, brMark, BR_FOOTER, BR_LOREM, BR_SHORT, BR_LOGOS, BR_PRIMARY, BR_SECONDARY } from "../brand-blocks.js";

export default {
  name: "brand-guidelines/hero-03", slide: 391, figmaNode: "109:14605",
  family: "brand-guidelines", role: "divider", shape: "single", theme: "light", chrome: false,
  use: "Section title over a full-bleed image",
  media: [], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 1, titles: 1, subtitles: 0, body: 0, stats: 0, icons: 0 },
  description: "brand-guidelines/hero-03 — a section title in white over a full-bleed image, toned down with a light veil.",
  intent: {
    bestFor: ["opening a sub-section such as logo in-situ or photography"],
    holds: "a title of up to about 24 characters and an optional background image",
    itemChars: 24,
    avoid: ["long titles"],
    feel: "visual",
    needs: [],
  },
  schema: {
    title: "string", image: "url — optional background image",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Logo in-situ", image: "",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "15" },
    footer: BR_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32 v2f-dark v2f-br-veil">
        ${s.image ? `<div class="v2f-br-bg"><img src="${esc(s.image)}" alt=""></div>` : ""}
        ${topBar(s.meta)}
        <div class="v2f-br-vt reveal"><p>${esc(s.title ?? "")}</p></div>
        ${brFooter(s.footer)}
      </div>`;
  },
};
