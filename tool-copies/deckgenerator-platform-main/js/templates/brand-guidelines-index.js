// Template: brand-guidelines/index — table of contents: a muted heading and up to eight rows at the foot of the slide, each with a chapter, an optional note and a page range.
// Source Figma frame 109:14487.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { brFooter, brPhoto, brImg, brCol, brPanel, brSplit, brTextBlock, brTocRow, brChapter, brHead, brInk, brSwatch, brDot, brPair, brAvoid, brPhone, brTab, brWatch, brPlace, brTree, brRich, brMark, BR_FOOTER, BR_LOREM, BR_SHORT, BR_LOGOS, BR_PRIMARY, BR_SECONDARY } from "../brand-blocks.js";

export default {
  name: "brand-guidelines/index", slide: 379, figmaNode: "109:14487",
  family: "brand-guidelines", role: "toc", shape: "list", theme: "light", chrome: false,
  use: "Table of contents with notes and page ranges",
  media: [], capacity: { items: 8, min: 3, max: 8 },
  slots: { images: 0, titles: 9, subtitles: 0, body: 8, stats: 0, icons: 0 },
  description: "brand-guidelines/index — table of contents: a muted heading and up to eight rows at the foot of the slide, each with a chapter, an optional note and a page range.",
  intent: {
    bestFor: ["the contents page of a brand book"],
    holds: "a heading and three to eight chapters, each with a label of up to about 30 characters, an optional note and a page range",
    itemChars: 30,
    avoid: ["more than eight chapters"],
    feel: "dense",
    needs: [],
  },
  schema: {
    title: "string", items: "array of up to 8 {label, note, pages}",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Table of Contents",
    items: Array.from({ length: 8 }, () => ({ label: "Introduction", note: "If there is smaller text that would go here", pages: "1 – 8" })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "03" },
    footer: BR_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-br-head reveal"><p class="t v2f-br-h48">${esc(s.title ?? "")}</p></div>
        <div class="v2f-br-tocs reveal">${(s.items || []).slice(0, 8).map(brTocRow).join("")}</div>
        ${brFooter(s.footer)}
      </div>`;
  },
};
