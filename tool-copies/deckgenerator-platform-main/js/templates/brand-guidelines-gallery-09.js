// Template: brand-guidelines/gallery-09 — a caption and title over two placement guides side by side: the logo in the corners, and the logo centred on the vertical axis, on a grid of hairlines.
// Source Figma frame 109:14633.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { brFooter, brPhoto, brImg, brCol, brPanel, brSplit, brTextBlock, brTocRow, brChapter, brHead, brInk, brSwatch, brDot, brPair, brAvoid, brPhone, brTab, brWatch, brPlace, brTree, brRich, brMark, BR_FOOTER, BR_LOREM, BR_SHORT, BR_LOGOS, BR_PRIMARY, BR_SECONDARY } from "../brand-blocks.js";

export default {
  name: "brand-guidelines/gallery-09", slide: 396, figmaNode: "109:14633",
  family: "brand-guidelines", role: "diagram", shape: "split", theme: "light", chrome: false,
  use: "Logo positioning rules",
  media: ["logo"], capacity: { items: 2, min: 2, max: 2 },
  slots: { images: 1, titles: 3, subtitles: 0, body: 0, stats: 0, icons: 0 },
  description: "brand-guidelines/gallery-09 — a caption and title over two placement guides side by side: the logo in the corners, and the logo centred on the vertical axis, on a grid of hairlines.",
  intent: {
    bestFor: ["where the logo may sit on a page or layout"],
    holds: "a caption, a title, two short captions and the logo artwork",
    itemChars: 40,
    avoid: ["more than two rules"],
    feel: "visual",
    needs: ["logo image"],
  },
  schema: {
    caption: "string", title: "string", logo: "url, or nagarro:horizontal | nagarro:vertical | nagarro:neutral | nagarro:mark for the built-in Nagarro logo (wide, about 3.2:1)", corners: "string — caption over the corner guide", center: "string — caption over the centred guide",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Logo", title: "Positioning", logo: "nagarro:horizontal", corners: "The logo can appear in the corners", center: "or central to the page",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "20" },
    footer: BR_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="reveal">${brHead({ caption: s.caption, title: s.title }, { big: true })}</div>
        <div class="v2f-br-places reveal"><div><p>${esc(s.corners ?? "")}</p>${brPlace(s.logo, "corners")}</div><div><p>${esc(s.center ?? "")}</p>${brPlace(s.logo, "center")}</div></div>
        ${brFooter(s.footer)}
      </div>`;
  },
};
