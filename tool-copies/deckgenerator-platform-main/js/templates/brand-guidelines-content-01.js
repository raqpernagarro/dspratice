// Template: brand-guidelines/content-01 — chapter divider: a very large muted chapter number beside the chapter title.
// Source Figma frame 109:14484.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { brFooter, brPhoto, brImg, brCol, brPanel, brSplit, brTextBlock, brTocRow, brChapter, brHead, brInk, brSwatch, brDot, brPair, brAvoid, brPhone, brTab, brWatch, brPlace, brTree, brRich, brMark, BR_FOOTER, BR_LOREM, BR_SHORT, BR_LOGOS, BR_PRIMARY, BR_SECONDARY } from "../brand-blocks.js";

export default {
  name: "brand-guidelines/content-01", slide: 378, figmaNode: "109:14484",
  family: "brand-guidelines", role: "divider", shape: "single", theme: "light", chrome: false,
  use: "Chapter divider with number and title",
  media: [], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 0, titles: 1, subtitles: 0, body: 0, stats: 1, icons: 0 },
  description: "brand-guidelines/content-01 — chapter divider: a very large muted chapter number beside the chapter title.",
  intent: {
    bestFor: ["opening a chapter of a brand book"],
    holds: "a chapter number and a title of up to about 14 characters",
    itemChars: 14,
    avoid: ["long titles"],
    feel: "statement",
    needs: [],
  },
  schema: {
    number: "string — e.g. 01", title: "string — up to about 14 characters",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    number: "01", title: "Introduction",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "02" },
    footer: BR_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-br-div reveal"><p class="n">${esc(s.number ?? "")}</p><p>${esc(s.title ?? "")}</p></div>
        ${brFooter(s.footer)}
      </div>`;
  },
};
