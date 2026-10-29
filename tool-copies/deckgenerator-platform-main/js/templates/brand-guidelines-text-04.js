// Template: brand-guidelines/text-04 — a caption, title and paragraph at the left; at the right the primary palette as tall edge-to-edge colour columns, each named with its RGB and HEX.
// Source Figma frame 109:14725.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { brFooter, brPhoto, brImg, brCol, brPanel, brSplit, brTextBlock, brTocRow, brChapter, brHead, brInk, brSwatch, brDot, brPair, brAvoid, brPhone, brTab, brWatch, brPlace, brTree, brRich, brMark, BR_FOOTER, BR_LOREM, BR_SHORT, BR_LOGOS, BR_PRIMARY, BR_SECONDARY } from "../brand-blocks.js";

export default {
  name: "brand-guidelines/text-04", slide: 398, figmaNode: "109:14725",
  family: "brand-guidelines", role: "chart", shape: "split", theme: "light", chrome: false,
  use: "Primary palette as tall colour columns",
  media: [], capacity: { items: 3, min: 2, max: 4 },
  slots: { images: 0, titles: 4, subtitles: 0, body: 1, stats: 0, icons: 0 },
  description: "brand-guidelines/text-04 — a caption, title and paragraph at the left; at the right the primary palette as tall edge-to-edge colour columns, each named with its RGB and HEX.",
  intent: {
    bestFor: ["the primary brand colours"],
    holds: "a caption, a title, a paragraph of up to about 240 characters and two to four colours with name, RGB and HEX",
    itemChars: 240,
    avoid: ["more than four colours"],
    feel: "visual",
    needs: [],
  },
  schema: {
    caption: "string", title: "string", body: "string", colors: "array of 2–4 {name, rgb, hex, color?, ink?} — the first fills the left half",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Primary Palette", body: BR_LOREM, colors: BR_PRIMARY, caption: "Colours",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "22" },
    footer: BR_FOOTER,
  },
  render(s) {
    const c = (s.colors || []).slice(0, 4);
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-br-pal reveal"><div class="l">${brHead({ caption: s.caption, title: s.title, body: s.body }, { big: true, gap12: true, maxWidth: 600 })}</div>
          <div class="r"><div>${c[0] ? brSwatch(c[0], { cls: "flat dim" }) : ""}</div><div>${c.slice(1).map((x) => brSwatch(x, { cls: "flat dim" })).join("")}</div></div></div>
        ${brFooter(s.footer)}
      </div>`;
  },
};
