// Template: brand-guidelines/gallery-08 — a title at the left and a row of four app icons on a rounded tinted pill, one of them the brand's.
// Source Figma frame 109:14625.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { brandLogoArt, isBrandLogo } from "../brand-logo.js";
import { brFooter, brPhoto, brImg, brCol, brPanel, brSplit, brTextBlock, brTocRow, brChapter, brHead, brInk, brSwatch, brDot, brPair, brAvoid, brPhone, brTab, brWatch, brPlace, brTree, brRich, brMark, BR_FOOTER, BR_LOREM, BR_SHORT, BR_LOGOS, BR_PRIMARY, BR_SECONDARY } from "../brand-blocks.js";

export default {
  name: "brand-guidelines/gallery-08", slide: 395, figmaNode: "109:14625",
  family: "brand-guidelines", role: "showcase", shape: "row", theme: "light", chrome: false,
  use: "App icon among other app icons",
  media: ["icon"], capacity: { items: 4, min: 2, max: 4 },
  slots: { images: 4, titles: 1, subtitles: 0, body: 0, stats: 0, icons: 4 },
  description: "brand-guidelines/gallery-08 — a title at the left and a row of four app icons on a rounded tinted pill, one of them the brand's.",
  intent: {
    bestFor: ["showing the app icon in context on a home screen"],
    holds: "a title and two to four icon images",
    avoid: ["more than four icons"],
    feel: "visual",
    needs: ["icon images"],
  },
  schema: {
    title: "string", icons: "array of up to 4 — square app icon urls, or nagarro:mark for the Nagarro app icon",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Logo-in-situ", icons: ["assets/brand/icon-1.png", "assets/brand/icon-2.png", "assets/brand/icon-3.png", "nagarro:mark"],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "19" },
    footer: BR_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-br-dev reveal"><p class="v2f-br-h36">${esc(s.title ?? "")}</p>
          <div class="v2f-br-pill">${(s.icons || []).slice(0, 4).map((i) => (isBrandLogo(i) ? `<div class="v2f-br-app v2f-br-logo t-dark" style="--lw:78%;--lh:71%;">${brandLogoArt(i, { cls: "art" })}</div>` : `<div class="v2f-br-app">${i ? `<img src="${esc(i)}" alt="">` : ""}</div>`)).join("")}</div></div>
        ${brFooter(s.footer)}
      </div>`;
  },
};
