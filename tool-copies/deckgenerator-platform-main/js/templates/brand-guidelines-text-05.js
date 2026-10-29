// Template: brand-guidelines/text-05 — a muted chapter title at the left and a paragraph in large type at the right, centred on the slide.
// Source Figma frame 109:14900.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { brFooter, brPhoto, brImg, brCol, brPanel, brSplit, brTextBlock, brTocRow, brChapter, brHead, brInk, brSwatch, brDot, brPair, brAvoid, brPhone, brTab, brWatch, brPlace, brTree, brRich, brMark, BR_FOOTER, BR_LOREM, BR_SHORT, BR_LOGOS, BR_PRIMARY, BR_SECONDARY } from "../brand-blocks.js";

export default {
  name: "brand-guidelines/text-05", slide: 406, figmaNode: "109:14900",
  family: "brand-guidelines", role: "statement", shape: "split", theme: "light", chrome: false,
  use: "Chapter introduction in large type",
  media: [], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 0, titles: 1, subtitles: 0, body: 1, stats: 0, icons: 0 },
  description: "brand-guidelines/text-05 — a muted chapter title at the left and a paragraph in large type at the right, centred on the slide.",
  intent: {
    bestFor: ["introducing a brand-book chapter such as typography"],
    holds: "a title and a paragraph of up to about 240 characters",
    itemChars: 240,
    avoid: ["lists", "images"],
    feel: "statement",
    needs: [],
  },
  schema: {
    title: "string", body: "string",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Typography", body: BR_LOREM,
    meta: { studio: "Product Studio", name: "Presentation Name", page: "30" },
    footer: BR_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-br-intro reveal"><p class="t">${esc(s.title ?? "")}</p><p class="b">${esc(s.body ?? "")}</p></div>
        ${brFooter(s.footer)}
      </div>`;
  },
};
